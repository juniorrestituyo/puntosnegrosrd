import { verifyAdmin } from '@/lib/api/admin-auth';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/points
 * Lista TODOS los puntos (incluyendo ocultos) para el panel admin.
 * Protegido por x-admin-secret header.
 */
export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return err('UNAUTHORIZED', 'Credenciales invalidas', 401);
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) {
    console.error('Admin list failed:', error);
    return err('INTERNAL_ERROR', 'Error al listar puntos', 500);
  }

  return ok(data ?? []);
}
