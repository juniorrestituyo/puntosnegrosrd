/**
 * Verifica el secreto del admin desde el header x-admin-secret.
 *
 * MVP: comparacion directa contra env var ADMIN_SECRET.
 * V2: migrar a Supabase Auth con magic link a un correo whitelist.
 */
export function verifyAdmin(request: Request): boolean {
  const provided = request.headers.get('x-admin-secret');
  const expected = process.env.ADMIN_SECRET;

  if (!expected) {
    console.error('ADMIN_SECRET no configurada en .env.local');
    return false;
  }

  if (!provided || provided.length === 0) return false;

  // Comparacion en tiempo "constante" suficiente para MVP.
  // Para algo critico usariamos crypto.timingSafeEqual.
  return provided === expected;
}
