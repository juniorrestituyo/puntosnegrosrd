'use client';

import Link from 'next/link';

/**
 * Boton flotante "Volver al mapa" anclado al top-left, justo al lado
 * del hamburger del SideDrawer. Se usa en las sub-paginas (datos,
 * metodologia, acerca-de) para que volver al mapa sea un tap claro
 * y visible, no un link de texto al final de la pagina.
 */
export default function BackToMapButton() {
  return (
    <Link
      href="/"
      aria-label="Volver al mapa"
      className="fixed left-16 top-3 z-[1000] flex h-12 items-center gap-2 rounded-xl bg-brand pl-3 pr-4 text-sm font-semibold text-white shadow-float ring-1 ring-brand-accent transition-colors hover:bg-brand-accent sm:left-20 sm:top-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="12 19 5 12 12 5" />
      </svg>
      <span>Mapa</span>
    </Link>
  );
}
