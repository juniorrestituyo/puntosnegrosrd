import { z } from 'zod';

import { getHashedClientIp } from '@/lib/api/ip-hash';
import { checkReportRateLimit } from '@/lib/api/rate-limit';
import { err, ok } from '@/lib/api/responses';
import { RATE_LIMIT_REPORTS_PER_HOUR, RD_BOUNDS } from '@/lib/constants';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const pointInputSchema = z.object({
  lat: z.number().min(RD_BOUNDS.minLat).max(RD_BOUNDS.maxLat),
  lng: z.number().min(RD_BOUNDS.minLng).max(RD_BOUNDS.maxLng),
  category: z.enum(['humano', 'vehicular', 'infraestructural', 'climatico']),
  subcategory: z.string().max(200).optional(),
  description: z
    .string()
    .min(10, 'Describe el riesgo con al menos 10 caracteres')
    .max(1000),
  province: z.string().max(100).optional(),
  municipality: z.string().max(100).optional(),
});

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

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points')
    .insert({
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      category: parsed.data.category,
      subcategory: parsed.data.subcategory ?? null,
      description: parsed.data.description,
      province: parsed.data.province ?? null,
      municipality: parsed.data.municipality ?? null,
      ip_hash: ipHash,
    })
    .select(
      'id, lat, lng, category, subcategory, description, status, photo_url, province, municipality, created_at, updated_at'
    )
    .single();

  if (error) {
    console.error('Insert point failed:', error);
    return err('INTERNAL_ERROR', 'No se pudo guardar el reporte', 500);
  }

  // Devolvemos en la forma de points_with_stats (incluye confirmation_count = 0)
  return ok(
    {
      ...data,
      confirmation_count: 0,
    },
    { status: 201 }
  );
}
