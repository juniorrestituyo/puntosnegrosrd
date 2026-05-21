'use client';

import Link from 'next/link';
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
}

/**
 * Drawer lateral con navegacion del sitio.
 * Trigger es un boton hamburger flotante fixed en la esquina top-left
 * del viewport. Los filtros del mapa NO viven aqui — son un componente
 * separado (FilterPanel) anclado al lado derecho.
 */
export default function SideDrawer({ current }: SideDrawerProps) {
  const [open, setOpen] = useState(false);

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
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
        aria-expanded={open}
        className="fixed left-3 top-3 z-[1000] flex h-12 w-12 items-center justify-center rounded-xl bg-surface-card text-fg shadow-float ring-1 ring-surface-border transition-colors hover:bg-surface-raised sm:left-4 sm:top-4"
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
              Puntos<span className="text-brand">Negros</span>RD
            </h2>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.22em] text-fg-muted">
              Mapa ciudadano
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menu"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
        </section>

        <footer className="border-t border-surface-border p-5 text-[11px] text-fg-muted">
          <p>Iniciativa ciudadana independiente.</p>
          <p className="mt-1">Datos abiertos bajo CC-BY 4.0.</p>
        </footer>
      </aside>
    </>
  );
}
