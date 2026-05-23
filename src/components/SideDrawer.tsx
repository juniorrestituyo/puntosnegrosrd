'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

type CurrentKey = 'mapa' | 'impacto' | 'datos' | 'metodologia' | 'acerca';

const NAV_LINKS: { href: string; key: CurrentKey; label: string }[] = [
  { href: '/', key: 'mapa', label: 'Mapa' },
  { href: '/metricas', key: 'impacto', label: 'Impacto' },
  { href: '/datos-abiertos', key: 'datos', label: 'Datos abiertos' },
  { href: '/metodologia', key: 'metodologia', label: 'Metodologia' },
  { href: '/acerca-de', key: 'acerca', label: 'Acerca de' },
];

interface SideDrawerProps {
  current?: CurrentKey;
  /**
   * Estilo visual del trigger hamburger.
   *  - 'floating' (default): card blanca con shadow-float + ring,
   *    pensada para flotar sobre el mapa (necesita destacarse del
   *    fondo dinamico).
   *  - 'static': card blanca plana, sin shadow ni ring. Para paginas
   *    con fondo solido (metricas, datos, metodologia, acerca, detalle)
   *    — el boton se integra al layout sin parecer flotante.
   */
  variant?: 'floating' | 'static';
}

/**
 * Drawer lateral con navegacion del sitio.
 * Trigger es un boton hamburger fixed en la esquina top-left del
 * viewport. Los filtros del mapa NO viven aqui — son un componente
 * separado (FilterPanel) anclado al lado derecho.
 */
export default function SideDrawer({
  current,
  variant = 'floating',
}: SideDrawerProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Estrategia de history stack para evitar acumular entries cuando el
  // usuario navega lateralmente entre sub-paginas via el drawer.
  //   - En el mapa ('/') → PUSH (back desde sub-pagina vuelve al mapa).
  //   - En cualquier sub-pagina → REPLACE (saltar de Metricas a Datos a
  //     Acerca no acumula entries; back siempre vuelve al mapa o sale
  //     de la app si entraste directo a una sub-pagina).
  const shouldReplaceNav = pathname !== '/';

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  return (
    <>
      {/* Header bar blanca fija para sub-paginas. Solo se renderiza
          en variant='static'. Z-index por debajo de los iconos
          (z-[999] vs z-[1000]) para que el hamburger y el back-to-map
          floten visualmente encima de ella sin que el bar los tape.
          Altura: h-16 (64px) mobile / sm:h-20 (80px) desktop —
          deja respiro de ~4-16px debajo del boton (h-12 a top-3/top-4)
          y termina antes del padding-top del contenido (pt-20 / sm:pt-24).
          Mismo border-b que el header del modal "Nuevo reporte" para
          consistencia visual. */}
      {variant === 'static' && (
        <div
          aria-hidden
          className="fixed inset-x-0 top-0 z-[999] h-16 border-b border-surface-border bg-surface-card sm:h-20"
        />
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className={`fixed left-3 top-3 z-[1000] flex h-12 w-12 items-center justify-center rounded-xl bg-surface-card text-fg transition-colors hover:bg-surface-raised sm:left-4 sm:top-4 ${
          variant === 'floating'
            ? 'shadow-float ring-1 ring-surface-border'
            : ''
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menu"
          className="fixed inset-0 z-[2000] cursor-default bg-black/30 backdrop-blur-[2px]"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-[2010] flex h-full w-[290px] max-w-[85vw] flex-col overflow-y-auto bg-surface-card shadow-2xl transition-transform duration-300 sm:w-[320px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between gap-3 border-b border-surface-border p-5">
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-logo text-xl font-bold tracking-tight text-fg">
              PuntosNegrosRD
            </h2>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-fg-muted">
              Mapa ciudadano
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menu"
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <section className="flex-1 p-5">
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Navegacion
          </h3>
          <ul className="space-y-1">
            {NAV_LINKS.map((l) => {
              const isActive = current === l.key;
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    replace={shouldReplaceNav}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-brand-subtle text-brand'
                        : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
                    }`}
                  >
                    <span className="font-medium">{l.label}</span>
                    {isActive && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full bg-brand"
                        aria-hidden
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Utilidades: relanzar tour de bienvenida.
              - Setea sessionStorage 'pn:pending-tour' (lo lee OnboardingTour
                al montarse si llegamos desde otra ruta).
              - Dispara evento 'pn:open-tour' (lo recoge OnboardingTour si
                ya esta montado, ej. estamos en /mapa). El handler limpia
                el sessionStorage para evitar reapertura al regresar luego.
              - Navega a / via Link para garantizar que el mapa este montado. */}
          <div className="mt-4 border-t border-surface-border pt-4">
            <Link
              href="/"
              replace={shouldReplaceNav}
              onClick={() => {
                try {
                  window.sessionStorage.setItem('pn:pending-tour', '1');
                } catch {
                  /* noop */
                }
                if (window.location.pathname === '/') {
                  window.dispatchEvent(new CustomEvent('pn:open-tour'));
                }
                setOpen(false);
              }}
              className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
            >
              <span className="font-medium">Ver tour de nuevo</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </Link>
          </div>
        </section>

        <footer className="border-t border-surface-border p-5 text-[11px] text-fg-muted">
          <p>Iniciativa ciudadana independiente.</p>
          <p className="mt-1">Datos abiertos bajo CC-BY 4.0.</p>
          {/* Version + link al repo en una sola linea. El gap entre
              "v1.0" y el icono actua como separador visual sin
              necesidad de punto medio (·). El anchor solo se aplica
              al icono + "Github" — "v1.0" queda no-interactivo como
              texto comun. */}
          <p className="mt-1 flex items-center gap-1.5">
            <span>v1.0</span>
            <a
              href="https://github.com/juniorrestituyo/puntosnegrosrd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 transition-colors hover:text-brand"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="11"
                height="11"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
              GitHub
            </a>
          </p>
        </footer>
      </aside>
    </>
  );
}
