import { z } from 'zod';

import { verifyAdmin } from '@/lib/api/admin-auth';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inputSchema = z.object({
  status: z.enum([
    'nuevo',
    'corroborado',
    'notificado',
    'en_atencion',
    'resuelto',
  ]),
  note: z.string().max(500).optional(),
});

/**
 * POST /api/admin/points/[id]/status
 * Cambia el estado del punto y agrega una entrada al historial.
 * Acepta una nota opcional para documentar el cambio.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifyAdmin(request)) {
    return err('UNAUTHORIZED', 'Credenciales invalidas', 401);
  }

  const { id } = await context.params;
  if (!UUID_RE.test(id)) {
    return err('INVALID_INPUT', 'ID invalido', 400);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err('INVALID_JSON', 'Body no es JSON valido', 400);
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return err(
      'INVALID_INPUT',
      parsed.error.issues[0]?.message ?? 'Validacion fallida',
      400
    );
  }

  const supabase = createSupabaseAdminClient();

  // Leer estado anterior para guardar en historial
  const { data: current, error: readError } = await supabase
    .from('points')
    .select('status')
    .eq('id', id)
    .maybeSingle();

  if (readError || !current) {
    return err('NOT_FOUND', 'Punto no encontrado', 404);
  }

  // Actualizar el estado del punto
  const { error: updateError } = await supabase
    .from('points')
    .update({ status: parsed.data.status })
    .eq('id', id);

  if (updateError) {
    console.error('Status update failed:', updateError);
    return err('INTERNAL_ERROR', 'No se pudo actualizar estado', 500);
  }

  // Insertar en el historial
  const { error: historyError } = await supabase
    .from('status_history')
    .insert({
      point_id: id,
      old_status: current.status,
      new_status: parsed.data.status,
      note: parsed.data.note ?? null,
      changed_by: 'admin-mvp',
    });

  if (historyError) {
    console.error('History insert failed:', historyError);
    // El estado ya cambio, no podemos rollback facil. Avisar pero retornar OK.
    return ok(
      { status: parsed.data.status, history_warning: historyError.message },
      { status: 200 }
    );
  }

  return ok({ status: parsed.data.status });
}
