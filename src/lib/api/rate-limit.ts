import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Verifica si una IP (hasheada) puede reportar otro punto.
 * Usa la funcion SQL count_recent_reports_by_ip definida en la migracion 001.
 *
 * @param ipHash hash sha256 de la IP + salt
 * @param max maximo de reportes permitidos en la ventana
 * @param windowMinutes ventana de tiempo en minutos
 * @returns { count, exceeded } — count = reportes recientes, exceeded = supera el limite
 */
export async function checkReportRateLimit(
  ipHash: string,
  max: number,
  windowMinutes = 60
): Promise<{ count: number; exceeded: boolean }> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc('count_recent_reports_by_ip', {
    p_ip_hash: ipHash,
    p_minutes: windowMinutes,
  });

  if (error) {
    // Si la RPC falla, ser conservador: bloquear.
    // Mejor un falso positivo de rate-limit que abrir la compuerta.
    throw new Error(`Rate limit check fallo: ${error.message}`);
  }

  const count = typeof data === 'number' ? data : 0;
  return { count, exceeded: count >= max };
}
