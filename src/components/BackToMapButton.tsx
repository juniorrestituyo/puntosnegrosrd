'use client';

import Link from 'next/link';

/**
 * Boton flotante "Ir al Mapa" anclado al top-right de las sub-paginas
 * (datos, metodologia, acerca-de). Simetrico al hamburger del
 * SideDrawer que vive en top-left. Pill brand con label claro.
 */
export default function BackToMapButton() {
  return (
    <Link
      href="/"
      aria-label="Ir al mapa"
      className="fixed right-3 top-3 z-[1000] flex h-12 items-center rounded-xl bg-brand px-5 text-sm font-semibold text-white shadow-float ring-1 ring-brand-accent transition-colors hover:bg-brand-accent sm:right-4 sm:top-4"
    >
      Ir al Mapa
    </Link>
  );
}
