'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface SiteNavProps {
  current?: 'mapa' | 'datos' | 'metodologia' | 'acerca';
}

const links: { href: string; key: SiteNavProps['current']; label: string }[] = [
  { href: '/', key: 'mapa', label: 'Mapa' },
  { href: '/datos-abiertos', key: 'datos', label: 'Datos abiertos' },
  { href: '/metodologia', key: 'metodologia', label: 'Metodologia' },
  { href: '/acerca-de', key: 'acerca', label: 'Acerca de' },
];

/**
 * Navegacion del sitio.
 * - Desktop (sm+): links inline en el header.
 * - Movil (<sm): boton hamburger arriba a la derecha con dropdown.
 */
export default function SiteNav({ current }: SiteNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      {/* Desktop: nav inline */}
      <nav className="hidden flex-wrap items-center gap-2 text-sm sm:flex sm:gap-3">
        {links.map((l) => {
          const isActive = current === l.key;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded px-2 py-1 transition-colors ${
                isActive
                  ? 'bg-brand text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-brand'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>

      {/* Movil: hamburger + dropdown */}
      <div className="relative sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-700 hover:bg-slate-100"
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
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
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>

        {open && (
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menu"
              className="fixed inset-0 z-[1190] cursor-default bg-black/30"
            />
            <nav
              id="mobile-nav-menu"
              className="absolute right-0 top-full z-[1200] mt-2 w-56 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-slate-200"
            >
              {links.map((l, i) => {
                const isActive = current === l.key;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block px-4 py-3 text-sm ${
                      i > 0 ? 'border-t border-slate-100' : ''
                    } ${
                      isActive
                        ? 'bg-slate-50 font-medium text-brand'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </>
        )}
      </div>
    </>
  );
}
