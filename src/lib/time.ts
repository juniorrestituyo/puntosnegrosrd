/**
 * Formato "Hace X tiempo" en castellano dominicano. Acepta una
 * fecha ISO (string) o un Date.
 *
 * Buckets:
 *   - "Hace un momento" (< 60 segundos)
 *   - "Hace N minuto(s)" (< 60 minutos)
 *   - "Hace N hora(s)" (< 24 horas)
 *   - "Hace N dia(s)" (< 30 dias)
 *   - "Hace N mes(es)" (< 12 meses)
 *   - "Hace N año(s)" (>= 12 meses)
 *
 * Sin libreria externa (date-fns, dayjs) para no inflar el bundle —
 * la logica es trivial y el output esta hardcoded a es-DO.
 *
 * Cuidado con hydration: el output depende de Date.now(), asi que
 * el render del servidor y del cliente pueden diferir por milisegundos
 * → segundos. En el callsite, agrega `suppressHydrationWarning` al
 * elemento que renderea este texto.
 */
export function formatRelativeTime(iso: string | Date): string {
  const then = typeof iso === 'string' ? new Date(iso) : iso;
  const diffMs = Date.now() - then.getTime();

  // Fecha invalida o futura (clock skew, datos corruptos): fallback
  // a "Recien" en vez de mostrar "Hace -3 minutos" que se ve horrible.
  if (!Number.isFinite(diffMs) || diffMs < 0) {
    return 'Recien';
  }

  const secs = Math.floor(diffMs / 1000);
  if (secs < 60) return 'Hace un momento';

  const mins = Math.floor(secs / 60);
  if (mins < 60) return `Hace ${mins} ${mins === 1 ? 'minuto' : 'minutos'}`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} ${hours === 1 ? 'hora' : 'horas'}`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `Hace ${days} ${days === 1 ? 'dia' : 'dias'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;

  const years = Math.floor(months / 12);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}
