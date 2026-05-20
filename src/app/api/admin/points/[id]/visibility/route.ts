import { z } from 'zod';

import { verifyAdmin } from '@/lib/api/admin-auth';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const inputSchema = z.object({
  is_visible: z.boolean(),
});

/**
 * POST /api/admin/points/[id]/visibility
 * Cambia la visibilidad publica de un punto. Permite al admin ocultar
 * spam, contenido inapropiado o reportes duplicados sin borrarlos.
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
    return err('INVALID_INPUT', 'is_visible debe ser booleano', 400);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points')
    .update({ is_visible: parsed.data.is_visible })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Visibility update failed:', error);
    return err('INTERNAL_ERROR', 'No se pudo actualizar visibilidad', 500);
  }

  return ok(data);
}
