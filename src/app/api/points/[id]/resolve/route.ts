import { getHashedClientIp } from '@/lib/api/ip-hash';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Umbral minimo fijo: si el punto tiene pocas confirmaciones (< 5),
 * bastan 3 votos de resolucion para resolverlo.
 *
 * Umbral proporcional: si el punto tiene >= 5 confirmaciones, se
 * necesita al menos la mitad de las confirmaciones como votos de
 * resolucion. Esto evita que 3 personas tumben un punto que 20+
 * personas confirmaron como riesgo real.
 *
 * Ejemplos:
 *   2 confirmaciones, 3 resoluciones → resuelto (umbral fijo)
 *   8 confirmaciones, 3 resoluciones → NO resuelto (necesita 4)
 *   20 confirmaciones, 9 resoluciones → NO resuelto (necesita 10)
 *   20 confirmaciones, 10 resoluciones → resuelto
 */
const MIN_FIXED_THRESHOLD = 3;
const PROPORTIONAL_TRIGGER = 5;

function resolutionThreshold(confirmationCount: number): number {
  if (confirmationCount < PROPORTIONAL_TRIGGER) return MIN_FIXED_THRESHOLD;
  return Math.ceil(confirmationCount / 2);
}

/**
 * POST /api/points/[id]/resolve
 *
 * Voto comunitario de "yo veo que ya esta resuelto".
 * Una IP solo puede votar una vez por punto (constraint unique en BD).
 *
 * Despues de insertar el voto, evalua si el conteo de resoluciones
 * cruza el umbral (fijo o proporcional segun confirmaciones) y, de
 * ser asi, actualiza el status a 'resuelto' con registro en
 * status_history.
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

  // Leer conteos actualizados + status actual del punto.
  const { count: resolutionCount, error: countError } = await supabase
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
    .select('status, confirmation_count')
    .eq('id', id)
    .single();

  if (pointError) {
    console.error('Read point failed:', pointError);
    return ok({
      point_id: id,
      resolution_count: resolutionCount ?? 0,
      status: null,
    });
  }

  const currentResolutions = resolutionCount ?? 0;
  const threshold = resolutionThreshold(pointData.confirmation_count ?? 0);

  // Si el umbral se cruza y el punto aun no esta resuelto, flippeamos.
  if (currentResolutions >= threshold && pointData.status !== 'resuelto') {
    const oldStatus = pointData.status;

    const { error: updateError } = await supabase
      .from('points')
      .update({ status: 'resuelto' })
      .eq('id', id);

    if (updateError) {
      console.error('Update point status failed:', updateError);
    } else {
      await supabase.from('status_history').insert({
        point_id: id,
        old_status: oldStatus,
        new_status: 'resuelto',
        changed_by: 'auto-community',
        note: `Umbral alcanzado: ${currentResolutions} resoluciones / ${threshold} requeridas (${pointData.confirmation_count} confirmaciones)`,
      });
    }

    return ok({
      point_id: id,
      resolution_count: currentResolutions,
      status: 'resuelto',
    });
  }

  return ok({
    point_id: id,
    resolution_count: currentResolutions,
    status: pointData.status,
  });
}
