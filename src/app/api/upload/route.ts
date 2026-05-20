import { randomUUID } from 'node:crypto';

import { getHashedClientIp } from '@/lib/api/ip-hash';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 3 * 1024 * 1024; // 3 MB — client side ya reduce a ~500 KB
const BUCKET = 'point-photos';

/**
 * POST /api/upload
 * Sube una imagen al bucket point-photos de Supabase Storage.
 *
 * Flujo esperado:
 * 1. Cliente reduce y re-codifica la imagen en canvas (strip EXIF).
 * 2. Cliente la sube a este endpoint como multipart/form-data.
 * 3. Servidor valida tipo y tamano, guarda en Supabase Storage.
 * 4. Servidor devuelve la URL publica.
 * 5. Cliente usa esa URL al crear el reporte de punto.
 *
 * Nota: el bucket debe existir (instrucciones en SETUP.md).
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return err('INVALID_BODY', 'Cuerpo no es multipart/form-data', 400);
  }

  const fileEntry = formData.get('file');
  if (!(fileEntry instanceof Blob)) {
    return err('INVALID_INPUT', 'No se recibio archivo en el campo "file"', 400);
  }

  // Type narrowing: File extiende Blob, asi tenemos type tambien
  const file = fileEntry as File;

  if (!ALLOWED_TYPES.has(file.type)) {
    return err(
      'INVALID_TYPE',
      `Tipo no soportado. Permitidos: ${[...ALLOWED_TYPES].join(', ')}`,
      400
    );
  }

  if (file.size > MAX_BYTES) {
    return err(
      'TOO_LARGE',
      `Imagen demasiado grande. Maximo ${MAX_BYTES / (1024 * 1024)} MB.`,
      413
    );
  }

  // Hash de IP solo para logging/auditoria, no se almacena con la foto
  try {
    getHashedClientIp(request);
  } catch {
    // No bloqueamos si falta el salt, solo lo registramos
    console.warn('IP hash no disponible para upload (IP_HASH_SALT?)');
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const filename = `${randomUUID()}.${ext}`;

  const supabase = createSupabaseAdminClient();
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filename, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload a Supabase Storage fallo:', uploadError);
    return err(
      'INTERNAL_ERROR',
      `No se pudo subir la imagen (${uploadError.message})`,
      500
    );
  }

  const { data: publicUrl } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(filename);

  return ok({ url: publicUrl.publicUrl, filename }, { status: 201 });
}
