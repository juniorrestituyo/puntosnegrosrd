'use client';

import { useEffect, useRef } from 'react';

interface Props {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

/**
 * Modal full-screen para ver una foto sin recortes. Se usa desde el
 * detalle del reporte: la card del detalle muestra la foto recortada
 * a 4:3 (object-cover) para consistencia visual entre reportes; tocando
 * la card se abre este lightbox donde se ve la foto completa
 * (object-contain) ocupando toda la pantalla.
 *
 * Sin pinch-to-zoom custom: la foto ya viene reducida a max 1920px
 * desde image-process.ts, y al no poner touch-action restringido, el
 * navegador mobile permite zoom nativo. Mantenemos la UI minima.
 *
 * Cierra con:
 *   - Tecla ESC
 *   - Boton X arriba a la derecha
 *   - Tap en el fondo negro (fuera de la imagen)
 *
 * Bloquea scroll del body mientras esta abierto para evitar scroll
 * de la pagina detras del modal.
 */
export default function PhotoLightbox({ src, alt, open, onClose }: Props) {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Lock scroll del body + focus al close button mientras esta abierto.
  // Restaura el overflow original al cerrar (no asumimos 'auto' — el
  // body podria tener un estilo diferente en otra parte de la app).
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Defer focus para que entre despues del paint y la animacion.
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = previousOverflow;
      clearTimeout(t);
    };
  }, [open]);

  // ESC cierra. Lo ponemos en su propio effect para que se desuscriba
  // limpio al cerrar (no acumulando listeners si el componente se
  // remonta varias veces).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Foto del reporte ampliada"
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/95"
      // Tap en el fondo (no en la imagen ni en el boton) cierra.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Close button. Posicionado con safe-area-inset-top para que en
          iPhone con notch no quede tapado. */}
      <button
        ref={closeBtnRef}
        type="button"
        onClick={onClose}
        aria-label="Cerrar foto"
        className="absolute right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 16px)' }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {/* Foto. object-contain garantiza que se ve completa, sin recorte.
          max-h/w con dvh/vw para respetar el viewport real en mobile
          (no incluye la barra de URL, mejor que vh). */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="max-h-[100dvh] max-w-[100vw] select-none object-contain"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      />
    </div>
  );
}
