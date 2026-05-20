import { getHashedClientIp } from '@/lib/api/ip-hash';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/points/[id]/confirm
 * Agrega una confirmacion comunitaria al punto indicado.
 * Una IP solo puede confirmar una vez por punto (constraint unique en BD).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return err('INVALID_INPUT', 'ID de punto invalido', 400);
  }

  let ipHash: string;
  try {
    ipHash = getHashedClientIp(request);
  } catch (e) {
    console.error('IP hash failed:', e);
    return err('INTERNAL_ERROR', 'Configuracion incompleta', 500);
  }

  const supabase = createSupabaseAdminClient();

  // Insertar la confirmacion. Errores esperados:
  //   23505 -> unique violation (esta IP ya confirmo este punto)
  //   23503 -> foreign key violation (el punto no existe)
  const { error: insertError } = await supabase
    .from('confirmations')
    .insert({ point_id: id, ip_hash: ipHash });

  if (insertError) {
    if (insertError.code === '23505') {
      return err('ALREADY_CONFIRMED', 'Ya confirmaste este punto', 409);
    }
    if (insertError.code === '23503') {
      return err('NOT_FOUND', 'El punto no existe', 404);
    }
    console.error('Insert confirmation failed:', insertError);
    return err('INTERNAL_ERROR', 'No se pudo registrar la confirmacion', 500);
  }

  // Devolver el conteo actualizado para que el cliente actualice la UI
  const { count, error: countError } = await supabase
    .from('confirmations')
    .select('*', { count: 'exact', head: true })
    .eq('point_id', id);

  if (countError) {
    console.error('Count confirmations failed:', countError);
    return err('INTERNAL_ERROR', 'Confirmacion guardada pero no se pudo leer el total', 500);
  }

  return ok({ point_id: id, confirmation_count: count ?? 0 });
}
