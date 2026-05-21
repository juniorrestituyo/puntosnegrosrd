'use client';

import type { ReactNode } from 'react';

/**
 * Wrapper que aplica un fade-in al cargar la app por primera vez.
 *
 * IMPORTANTE: NO usa `key={pathname}` aunque seria tentador para
 * animar entre paginas — eso fuerza unmount/remount del subtree
 * children en cada navegacion. Con intercepting routes (donde el
 * children slot se SUPONE que persiste para mantener MapClient
 * vivo), el remount destruye ese beneficio.
 *
 * Las animaciones entre paginas dentro del flujo modal se manejan
 * en el overlay propio del slot @modal (ver app/@modal/(.)*.tsx).
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-transition-enter">{children}</div>;
}
