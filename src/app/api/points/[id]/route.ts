import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/points/[id]
 * Devuelve un punto con su historial de estado.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return err('INVALID_INPUT', 'ID de punto invalido', 400);
  }

  const supabase = createSupabaseAdminClient();

  const { data: point, error: pointError } = await supabase
    .from('points_with_stats')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (pointError) {
    console.error('GET /api/points/[id] failed:', pointError);
    return err('INTERNAL_ERROR', 'Error al leer el punto', 500);
  }
  if (!point) {
    return err('NOT_FOUND', 'Punto no encontrado', 404);
  }

  const { data: history, error: historyError } = await supabase
    .from('status_history')
    .select('*')
    .eq('point_id', id)
    .order('created_at', { ascending: false });

  if (historyError) {
    console.error('Read history failed:', historyError);
    return err('INTERNAL_ERROR', 'Error al leer el historial', 500);
  }

  return ok({ point, history: history ?? [] });
}
