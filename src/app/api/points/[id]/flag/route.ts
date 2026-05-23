import { z } from 'zod';

import { getHashedClientIp } from '@/lib/api/ip-hash';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Razones permitidas. Cualquier otra cosa se rechaza — asi no se
// usa el campo `reason` como vector de ingenieria social o spam de
// texto libre. Si en el futuro hace falta granularidad, agregar
// valores al enum.
const inputSchema = z
  .object({
    reason: z
      .enum(['spam', 'ofensivo', 'duplicado', 'falso', 'otro'])
      .optional(),
  })
  .strict();

/**
 * POST /api/points/[id]/flag
 *
 * Reporta un punto como problematico (spam, contenido ofensivo,
 * duplicado, etc.). Cuando 5 IPs distintas reportan el mismo punto,
 * el trigger handle_content_flag_insert lo hace is_visible = false
 * automaticamente (moderacion descentralizada).
 *
 * Una IP solo puede flaguear un punto una vez (UNIQUE constraint).
 * Las razones son privadas (no expuestas al publico) — el owner las
 * consulta via Supabase SQL Editor cuando necesita revisar.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!UUID_RE.test(id)) {
    return err('INVALID_INPUT', 'ID de punto invalido', 400);
  }

  // Body opcional. Si no hay body, reason queda null.
  let body: unknown = {};
  try {
    const text = await request.text();
    if (text.trim().length > 0) {
      body = JSON.parse(text);
    }
  } catch {
    return err('INVALID_JSON', 'Body no es JSON valido', 400);
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return err('INVALID_INPUT', 'Razon invalida', 400);
  }

  let ipHash: string;
  try {
    ipHash = getHashedClientIp(request);
  } catch (e) {
    console.error('IP hash failed:', e);
    return err('INTERNAL_ERROR', 'Configuracion incompleta', 500);
  }

  const supabase = createSupabaseAdminClient();

  const { error: insertError } = await supabase.from('content_flags').insert({
    point_id: id,
    ip_hash: ipHash,
    reason: parsed.data.reason ?? null,
  });

  if (insertError) {
    // 23505 unique violation: esta IP ya flagueo este punto.
    if (insertError.code === '23505') {
      return err(
        'ALREADY_FLAGGED',
        'Ya reportaste este punto como problematico',
        409
      );
    }
    // 23503 FK violation: el punto no existe.
    if (insertError.code === '23503') {
      return err('NOT_FOUND', 'El punto no existe', 404);
    }
    console.error('Insert content_flag failed:', insertError);
    return err('INTERNAL_ERROR', 'No se pudo registrar el reporte', 500);
  }

  // Intencionalmente NO devolvemos el conteo de flags — no queremos
  // que un atacante pueda monitorear "cuanto falta para que se oculte".
  return ok({ flagged: true });
}
