import { createHash } from 'node:crypto';

/**
 * Extrae la IP del cliente desde los headers que setea el proxy.
 * En Vercel: x-forwarded-for trae "ip-cliente, ip-proxy-1, ...".
 * Tomamos solo la primera (la del cliente real).
 *
 * En dev local sin proxy, los headers no se setean: usamos un placeholder.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const real = request.headers.get('x-real-ip');
  if (real) return real.trim();

  // Fallback para desarrollo local. No deberia llegar aqui en produccion.
  return 'local-dev';
}

/**
 * Hashea la IP con un salt secreto. Nunca almacenamos la IP en claro.
 * Output: hex de 64 caracteres (SHA-256).
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error(
      'IP_HASH_SALT no configurada. Define la variable en .env.local'
    );
  }
  return createHash('sha256').update(ip + salt).digest('hex');
}

export function getHashedClientIp(request: Request): string {
  return hashIp(getClientIp(request));
}
