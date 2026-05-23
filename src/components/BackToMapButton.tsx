'use client';

import Link from 'next/link';

interface BackToMapButtonProps {
  /**
   * Estilo visual.
   *  - 'floating' (default): card brand azul rounded-xl con shadow-float
   *    + ring, para destacar como CTA primario flotante.
   *  - 'static': card blanca plana (bg-surface-card text-fg), sin shadow
   *    ni ring. Pareado visualmente con el hamburger static — ambos
   *    quedan como squares blancos identicos diferenciados solo por
   *    el icono.
   */
  variant?: 'floating' | 'static';
}

/**
 * Boton "Ir al Mapa" anclado al top-right de las sub-paginas (datos,
 * metodologia, acerca-de, etc.). Simetrico en tamaño y forma al
 * hamburger del SideDrawer (h-12 w-12 rounded-xl).
 */
export default function BackToMapButton({
  variant = 'floating',
}: BackToMapButtonProps) {
  const styleClasses =
    variant === 'floating'
      ? 'bg-brand text-white shadow-float ring-1 ring-brand-accent hover:bg-brand-accent'
      : 'bg-surface-card text-fg hover:bg-surface-raised';

  return (
    <Link
      href="/"
      // Replace en vez de push: este boton solo se renderiza en sub-paginas,
      // y reemplazar el entry actual con el mapa evita acumular history.
      // Si el usuario entro directo a una sub-pagina (URL pegada, share),
      // el back desde el mapa sale al sitio externo — coherente.
      replace
      aria-label="Ir al mapa"
      title="Ir al mapa"
      className={`fixed right-3 top-3 z-[1000] flex h-12 w-12 items-center justify-center rounded-xl transition-colors sm:right-4 sm:top-4 ${styleClasses}`}
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
