'use client';

import { useRouter } from 'next/navigation';

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
 *
 * Logica de navegacion:
 *   - Si hay history previa en el browser (history.length > 1): hacemos
 *     router.back(). Eso significa que el ciclo mapa -> detalle -> Mapa
 *     -> detalle -> Mapa colapsa correctamente al hacer el back fisico,
 *     en lugar de acumular entradas '/' en el stack (lo que pasaba con
 *     Link replace, que cambia el entry actual pero deja los anteriores).
 *   - Si no hay history (entraste directo por URL compartida): hacemos
 *     router.push('/') para no salirte de la app.
 *
 * Trade-off conocido: si el usuario navego entre varias sub-paginas
 * dentro de la app (ej. detalle -> acerca-de -> detalle -> click Mapa),
 * back() puede llevarlo a /acerca-de en lugar de /. Caso poco comun;
 * lo aceptamos por simplicidad.
 */
export default function BackToMapButton({
  variant = 'floating',
}: BackToMapButtonProps) {
  const router = useRouter();

  const styleClasses =
    variant === 'floating'
      ? 'bg-brand text-white shadow-float ring-1 ring-brand-accent hover:bg-brand-accent'
      : 'bg-surface-card text-fg hover:bg-surface-raised';

  function handleClick() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
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
    </button>
  );
}
