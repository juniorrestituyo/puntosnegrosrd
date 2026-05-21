'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  CATEGORIES,
  CATEGORY_EMOJI,
  type CategoryKey,
} from '@/lib/constants';

export interface FilterState {
  categories: Set<CategoryKey>;
  minConfirmations: number;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: new Set<CategoryKey>([
    'humano',
    'vehicular',
    'infraestructural',
    'climatico',
  ]),
  minConfirmations: 0,
};

type CurrentKey = 'mapa' | 'datos' | 'metodologia' | 'acerca';

const NAV_LINKS: { href: string; key: CurrentKey; label: string; emoji: string }[] =
  [
    { href: '/', key: 'mapa', label: 'Mapa', emoji: '🗺️' },
    { href: '/datos-abiertos', key: 'datos', label: 'Datos abiertos', emoji: '📊' },
    { href: '/metodologia', key: 'metodologia', label: 'Metodologia', emoji: '📋' },
    { href: '/acerca-de', key: 'acerca', label: 'Acerca de', emoji: 'ℹ️' },
  ];

interface SideDrawerProps {
  current?: CurrentKey;
  filters?: FilterState;
  onFiltersChange?: (next: FilterState) => void;
  totalPoints?: number;
  shownPoints?: number;
}

export default function SideDrawer({
  current,
  filters,
  onFiltersChange,
  totalPoints,
  shownPoints,
}: SideDrawerProps) {
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

  function toggleCategory(key: CategoryKey) {
    if (!filters || !onFiltersChange) return;
    const next = new Set(filters.categories);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onFiltersChange({ ...filters, categories: next });
  }

  function setMin(n: number) {
    if (!filters || !onFiltersChange) return;
    onFiltersChange({ ...filters, minConfirmations: n });
  }

  function reset() {
    if (!onFiltersChange) return;
    onFiltersChange(DEFAULT_FILTERS);
  }

  const hasFilters = filters !== undefined && onFiltersChange !== undefined;

  return (
    <>
      {/* Trigger flotante estilo Waze: card blanco en esquina superior izquierda */}
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

      {/* Backdrop */}
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menu"
          className="fixed inset-0 z-[2000] cursor-default bg-black/30 backdrop-blur-[2px]"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={`fixed left-0 top-0 z-[2010] flex h-full w-[290px] max-w-[85vw] flex-col overflow-y-auto bg-surface-card shadow-2xl transition-transform duration-300 sm:w-[320px] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-hidden={!open}
      >
        {/* Brand badge */}
        <div className="flex items-center gap-3 border-b border-surface-border p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-card">
            <span className="text-base font-black tracking-tight">PN</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-bold tracking-tight text-fg">
              PuntosNegrosRD
            </h2>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-fg-muted">
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

        {/* Filter section */}
        {hasFilters && (
          <section className="border-b border-surface-border p-5">
            <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Categorias
            </h3>
            <ul className="space-y-1">
              {(Object.entries(CATEGORIES) as [
                CategoryKey,
                (typeof CATEGORIES)[CategoryKey],
              ][]).map(([key, value]) => {
                const isActive = filters!.categories.has(key);
                return (
                  <li key={key}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(key)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                        isActive
                          ? 'bg-brand-subtle text-brand'
                          : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
                      }`}
                    >
                      <span className="text-xl leading-none" aria-hidden>
                        {CATEGORY_EMOJI[key]}
                      </span>
                      <span className="flex-1 text-left font-medium">
                        {value.label}
                      </span>
                      {isActive && (
                        <span
                          className="h-2 w-2 rounded-full bg-brand"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>

            <h3 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Confirmaciones minimas
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {[0, 1, 3, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMin(n)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filters!.minConfirmations === n
                      ? 'bg-brand text-white shadow-card'
                      : 'bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg'
                  }`}
                >
                  {n === 0 ? 'Todas' : `${n}+`}
                </button>
              ))}
            </div>

            {totalPoints !== undefined && (
              <p className="mt-4 text-xs text-fg-muted">
                Mostrando <span className="font-semibold text-fg">{shownPoints}</span> de{' '}
                <span className="font-semibold text-fg">{totalPoints}</span>{' '}
                reporte{totalPoints === 1 ? '' : 's'}
              </p>
            )}

            {(filters!.categories.size < 4 ||
              filters!.minConfirmations > 0) && (
              <button
                type="button"
                onClick={reset}
                className="mt-3 w-full rounded-lg border border-surface-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-raised hover:text-fg"
              >
                Restablecer filtros
              </button>
            )}
          </section>
        )}

        {/* Navegacion */}
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
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? 'bg-brand-subtle text-brand'
                        : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
                    }`}
                  >
                    <span className="text-base" aria-hidden>
                      {l.emoji}
                    </span>
                    <span className="font-medium">{l.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Footer */}
        <footer className="border-t border-surface-border p-5 text-[11px] text-fg-muted">
          <p>Iniciativa ciudadana independiente.</p>
          <p className="mt-1">Datos abiertos bajo CC-BY 4.0.</p>
        </footer>
      </aside>
    </>
  );
}
