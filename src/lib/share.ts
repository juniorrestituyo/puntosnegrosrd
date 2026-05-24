/**
 * Utilidades para compartir links — encapsula el patron Web Share API
 * con fallback a clipboard. Los componentes (PointDetailSheet,
 * PointDetail) llaman a `sharePoint` y deciden que feedback dar al
 * usuario en base al resultado.
 *
 * Patron implementado:
 *   1. Si el navegador expone navigator.share, abrir el sheet nativo
 *      del OS (WhatsApp, Telegram, Mail, AirDrop, etc.).
 *   2. Si el usuario cancela el sheet (AbortError), tratarlo como
 *      decision deliberada — no hacer fallback.
 *   3. Si la Web Share API no existe o falla por otra razon, copiar
 *      la URL al clipboard.
 *   4. Si el clipboard tambien falla (browsers viejos, sin permiso),
 *      mostrar window.prompt para copia manual.
 *
 * Devolvemos un ShareResult tipado en lugar de manejar UI aqui —
 * los componentes deciden si mostrar toast, badge, nada, etc.
 */

import { CATEGORIES } from './constants';
import type { Point } from './types';

export type ShareResult =
  | { type: 'shared' } // Web Share API sheet completado
  | { type: 'copied' } // fallback a clipboard ok
  | { type: 'cancelled' } // usuario cerro el sheet nativo
  | { type: 'failed'; message: string };

export interface ShareInput {
  /** Usado como subject por clientes de email; ignorado por la mayoria
   * de chat apps en mobile. */
  title: string;
  /** Mensaje pre-cargado. WhatsApp/Telegram lo ponen como texto del
   * mensaje y la url aparece debajo con preview (OG tags). */
  text: string;
  /** URL del recurso a compartir. */
  url: string;
}

export async function shareLink(input: ShareInput): Promise<ShareResult> {
  if (typeof navigator === 'undefined') {
    return { type: 'failed', message: 'navigator no disponible' };
  }

  // 1) Web Share API — sheet nativo del OS.
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share(input);
      return { type: 'shared' };
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return { type: 'cancelled' };
      }
      // Otros errores (NotAllowed, DataError, etc.) caen al fallback.
    }
  }

  // 2) Clipboard.
  if (typeof navigator.clipboard?.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(input.url);
      return { type: 'copied' };
    } catch {
      // Continua al ultimo fallback abajo.
    }
  }

  // 3) Ultimo recurso: prompt nativo para copia manual.
  if (typeof window !== 'undefined') {
    window.prompt('Copia este enlace:', input.url);
    return { type: 'copied' };
  }

  return { type: 'failed', message: 'No hay forma de compartir' };
}

/**
 * Helper especifico de PuntosNegrosRD: arma el payload (title/text/url)
 * a partir de un Point y la URL base del sitio, delega a shareLink.
 *
 * El copy intencional:
 *   - title: "{Categoria} - {Subcategoria}" — corto, se usa como
 *     subject en email y como nombre del item en algunos OS sheets.
 *   - text: prefijo "Reporte ciudadano en PuntosNegrosRD" + categoria —
 *     da contexto cuando el receptor ve solo el mensaje sin abrir el
 *     preview.
 */
export async function sharePoint(
  point: Point,
  siteOrigin: string
): Promise<ShareResult> {
  const cat = CATEGORIES[point.category].label;
  const sub = point.subcategory ? ` - ${point.subcategory}` : '';
  const title = `${cat}${sub}`;
  const text = `Reporte ciudadano en PuntosNegrosRD: ${title}`;
  const url = `${siteOrigin.replace(/\/$/, '')}/punto/${point.id}`;
  return shareLink({ title, text, url });
}
