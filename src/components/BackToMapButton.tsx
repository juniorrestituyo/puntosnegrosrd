'use client';

import { useRouter } from 'next/navigation';

/**
 * Boton flotante "Ir al Mapa" anclado al top-right de las sub-paginas.
 *
 * IMPORTANTE: usa router.back() en vez de Link, porque cuando esta
 * pagina vive dentro del slot @modal (intercepting route), Link a "/"
 * NO cierra correctamente el overlay — Next.js no reconoce esa
 * navegacion como "back through the intercept". router.back() si.
 *
 * Si NO hay historial (deep link directo a la sub-pagina), cae a
 * router.push('/') como fallback.
 */
export default function BackToMapButton() {
  const router = useRouter();

  function goToMap() {
    if (typeof window === 'undefined') return;

    const mapUrl = window.location.origin + '/';
    const cameFromMap = document.referrer === mapUrl;

    if (cameFromMap && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  return (
    <button
      type="button"
      onClick={goToMap}
      aria-label="Ir al mapa"
      className="fixed right-3 top-3 z-[1000] flex h-12 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-float ring-1 ring-brand-accent transition-colors hover:bg-brand-accent sm:right-4 sm:top-4"
    >
      Ir al Mapa
    </button>
  );
}
