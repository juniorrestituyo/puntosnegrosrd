'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * Envuelve cada pagina y le aplica una animacion de entrada (fade +
 * slide-up) cada vez que cambia la ruta. Usa `key={pathname}` para
 * forzar remount del subtree de children, lo que reinicia la animacion.
 *
 * Tradeoff: no hay animacion de salida — la pagina anterior se quita
 * de golpe y la nueva entra. Para exit-animations habria que meter
 * framer-motion o usar View Transitions API (todavia experimental).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-transition-enter">
      {children}
    </div>
  );
}
