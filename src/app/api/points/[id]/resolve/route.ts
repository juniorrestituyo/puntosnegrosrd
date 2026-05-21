import { getHashedClientIp } from '@/lib/api/ip-hash';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /api/points/[id]/resolve
 *
 * Voto comunitario de "yo veo que ya esta resuelto". Espejo del
 * endpoint /confirm pero para la direccion opuesta.
 *
 * Una IP solo puede votar una vez por punto (constraint unique en BD).
 *
 * Si esta insercion hace que el conteo cruce el umbral
 * (definido en el trigger SQL handle_resolution_insert, 3 por defecto),
 * el trigger automaticamente:
 *   1. Actualiza points.status = 'resuelto'
 *   2. Inserta en status_history como 'auto-community'
 *
 * Devolvemos el conteo actualizado de resoluciones + el status final
 * del punto despues del trigger (para que el cliente pueda mostrar
 * "ya esta resuelto" sin re-fetch si quiere).
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

  // Insertar el voto de resolucion. Errores esperados:
  //   23505 -> unique violation (esta IP ya marco este punto como resuelto)
  //   23503 -> foreign key violation (el punto no existe)
  const { error: insertError } = await supabase
    .from('resolutions')
    .insert({ point_id: id, ip_hash: ipHash });

  if (insertError) {
    if (insertError.code === '23505') {
      return err(
        'ALREADY_RESOLVED_VOTE',
        'Ya marcaste este punto como resuelto',
        409
      );
    }
    if (insertError.code === '23503') {
      return err('NOT_FOUND', 'El punto no existe', 404);
    }
    console.error('Insert resolution failed:', insertError);
    return err(
      'INTERNAL_ERROR',
      'No se pudo registrar tu voto de resolucion',
      500
    );
  }

  // Leer el conteo + status actualizado. El trigger pudo haber
  // flippeado el status, lo informamos al cliente.
  const { count, error: countError } = await supabase
    .from('resolutions')
    .select('*', { count: 'exact', head: true })
    .eq('point_id', id);

  if (countError) {
    console.error('Count resolutions failed:', countError);
    return err(
      'INTERNAL_ERROR',
      'Voto guardado pero no se pudo leer el total',
      500
    );
  }

  const { data: pointData, error: pointError } = await supabase
    .from('points')
    .select('status')
    .eq('id', id)
    .single();

  if (pointError) {
    console.error('Read point status failed:', pointError);
    // No fatal — el voto si quedo, devolvemos sin el status final.
    return ok({
      point_id: id,
      resolution_count: count ?? 0,
      status: null,
    });
  }

  return ok({
    point_id: id,
    resolution_count: count ?? 0,
    status: pointData.status,
  });
}
