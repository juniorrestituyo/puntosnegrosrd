'use client';

import Link from 'next/link';

/**
 * Boton flotante "Ir al Mapa" anclado al top-right de las sub-paginas
 * (datos, metodologia, acerca-de). Simetrico en tamaño y forma al
 * hamburger del SideDrawer (h-12 w-12 rounded-xl), pero con bg brand
 * azul + icono de mapa blanco para destacar como accion primaria de
 * regresar al mapa.
 */
export default function BackToMapButton() {
  return (
    <Link
      href="/"
      aria-label="Ir al mapa"
      title="Ir al mapa"
      className="fixed right-3 top-3 z-[1000] flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-white shadow-float ring-1 ring-brand-accent transition-colors hover:bg-brand-accent sm:right-4 sm:top-4"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    </Link>
  );
}
