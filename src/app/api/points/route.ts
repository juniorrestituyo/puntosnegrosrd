import { getHashedClientIp } from '@/lib/api/ip-hash';
import { checkReportRateLimit } from '@/lib/api/rate-limit';
import { err, ok } from '@/lib/api/responses';
import { RATE_LIMIT_REPORTS_PER_HOUR } from '@/lib/constants';
import { reverseGeocode } from '@/lib/geocoding';
import { pointInputSchema } from '@/lib/point-schema';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/points
 * Devuelve la lista de puntos visibles, ordenados por fecha descendente.
 * Limite duro de 1000 para evitar payloads gigantes.
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points_with_stats')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('GET /api/points failed:', error);
    return err('INTERNAL_ERROR', 'No se pudo leer la lista de puntos', 500);
  }

  return ok(data ?? []);
}

/**
 * POST /api/points
 * Crea un nuevo reporte ciudadano. Aplica rate-limit por IP hasheada
 * antes de tocar la base de datos.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('INVALID_JSON', 'Cuerpo de la peticion no es JSON valido', 400);
  }

  const parsed = pointInputSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return err(
      'INVALID_INPUT',
      first?.message ?? 'Validacion fallida',
      400
    );
  }

  let ipHash: string;
  try {
    ipHash = getHashedClientIp(request);
  } catch (e) {
    console.error('IP hash failed:', e);
    return err('INTERNAL_ERROR', 'Configuracion incompleta', 500);
  }

  try {
    const { exceeded, count } = await checkReportRateLimit(
      ipHash,
      RATE_LIMIT_REPORTS_PER_HOUR,
      60
    );
    if (exceeded) {
      return err(
        'RATE_LIMITED',
        `Maximo ${RATE_LIMIT_REPORTS_PER_HOUR} reportes por hora. Llevas ${count} en la ultima hora.`,
        429
      );
    }
  } catch (e) {
    console.error('Rate limit check failed:', e);
    return err('INTERNAL_ERROR', 'No se pudo validar el rate limit', 500);
  }

  // Si el cliente NO mando province/municipality, intentamos derivarlos
  // del lat/lng con reverse geocoding (Nominatim). Falla silenciosa:
  // si Nominatim no responde o se cae, guardamos el reporte igual con
  // null en esos campos.
  let province = parsed.data.province;
  let municipality = parsed.data.municipality;
  if (!province && !municipality) {
    const geocoded = await reverseGeocode(parsed.data.lat, parsed.data.lng);
    province = geocoded.province;
    municipality = geocoded.municipality;
  }

  // description puede llegar como string vacio si el cliente la incluyo
  // sin contenido. Normalizamos a null para alinearnos con el SQL CHECK
  // (que no acepta "" como evidencia valida y bloquearia el insert).
  const cleanDescription =
    parsed.data.description && parsed.data.description.trim().length > 0
      ? parsed.data.description.trim()
      : null;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points')
    .insert({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      description: cleanDescription,
      province: province ?? null,
      municipality: municipality ?? null,
      photo_url: parsed.data.photo_url ?? null,
      ip_hash: ipHash,
    })
    .select(
      'id, lat, lng, category, subcategory, description, status, photo_url, province, municipality, created_at, updated_at'
    )
    .single();

  if (error) {
    // No exponemos detalles del error de DB al cliente — eso es ruido
    // tecnico y puede filtrar info de schema interno. Los problemas
    // de validacion deben atraparse en el cliente (zod) antes de llegar
    // aqui. Si igual llegan, mensaje generico + log para diagnostico.
    console.error('Insert point failed:', error);
    return err('INTERNAL_ERROR', 'No se pudo guardar el reporte', 500);
  }

  // Devolvemos en la forma de points_with_stats (incluye contadores en 0)
  return ok(
    {
      ...data,
      confirmation_count: 0,
      resolution_count: 0,
    },
    { status: 201 }
  );
}
