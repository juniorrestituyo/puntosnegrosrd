'use client';

import { useEffect, useState } from 'react';

import { CATEGORIES, type CategoryKey } from '@/lib/constants';

/**
 * Filtro de estado del lifecycle del reporte.
 * - 'all': todos los puntos visibles (default — muestra el impacto
 *   completo de la plataforma, incluyendo lo que ya se resolvio).
 * - 'open': puntos abiertos (todo lo que NO es 'resuelto'). Util si
 *   solo quieres ver los pendientes.
 * - 'resolved': solo puntos 'resuelto'. Util para ver el track record
 *   de problemas que ya fueron solucionados.
 */
export type StatusFilter = 'all' | 'open' | 'resolved';

export interface FilterState {
  categories: Set<CategoryKey>;
  minConfirmations: number;
  status: StatusFilter;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: new Set<CategoryKey>([
    'humano',
    'vehicular',
    'infraestructural',
    'climatico',
  ]),
  minConfirmations: 0,
  status: 'all',
};

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'open', label: 'Abiertos' },
  { value: 'resolved', label: 'Resueltos' },
];

interface FilterPanelProps {
  state: FilterState;
  total: number;
  shown: number;
  onChange: (next: FilterState) => void;
}

/**
 * Boton flotante de filtro en el top-right, simetrico al hamburger del
 * SideDrawer. Al tocarlo abre un panel inline anclado debajo (estilo
 * popover, NO drawer lateral). Diseno alineado con el FAB menu.
 */
export default function FilterPanel({
  state,
  total,
  shown,
  onChange,
}: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function toggleCategory(key: CategoryKey) {
    const next = new Set(state.categories);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...state, categories: next });
  }

  function setMin(n: number) {
    onChange({ ...state, minConfirmations: n });
  }

  function setStatus(s: StatusFilter) {
    onChange({ ...state, status: s });
  }

  function reset() {
    onChange(DEFAULT_FILTERS);
  }

  const hasFilters =
    state.categories.size < 4 ||
    state.minConfirmations > 0 ||
    state.status !== 'all';

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Filtros"
        aria-expanded={open}
        className="fixed right-3 top-3 z-[1100] flex h-12 w-12 items-center justify-center rounded-xl bg-surface-card text-fg shadow-float ring-1 ring-surface-border transition-colors hover:bg-surface-raised sm:right-4 sm:top-4"
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
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
        </svg>
        {hasFilters && (
          <span
            className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-surface-card bg-brand"
            aria-label="Filtros activos"
          />
        )}
      </button>

      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar filtros"
          className="fixed inset-0 z-[1090] cursor-default bg-black/20 backdrop-blur-[2px]"
        />
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Filtros del mapa"
          className="fixed right-3 top-[4.25rem] z-[1100] w-[280px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl bg-surface-card shadow-float ring-1 ring-surface-border sm:right-4 sm:top-[5rem]"
        >
          <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
            <h3 className="text-sm font-semibold text-fg">Filtros</h3>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
              className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg"
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

          <div className="space-y-4 p-4">
            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Categorias
              </h4>
              <ul className="space-y-1">
                {(Object.entries(CATEGORIES) as [
                  CategoryKey,
                  (typeof CATEGORIES)[CategoryKey],
                ][]).map(([key, value]) => {
                  const isActive = state.categories.has(key);
                  return (
                    <li key={key}>
                      <button
                        type="button"
                        onClick={() => toggleCategory(key)}
                        className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-subtle text-brand'
                            : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
                        }`}
                      >
                        <span className="text-left font-medium">
                          {value.label}
                        </span>
                        {isActive && (
                          <span
                            className="h-2 w-2 shrink-0 rounded-full bg-brand"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Estado
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setStatus(opt.value)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      state.status === opt.value
                        ? 'bg-brand text-white shadow-card'
                        : 'bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Confirmaciones minimas
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {[0, 1, 3, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMin(n)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      state.minConfirmations === n
                        ? 'bg-brand text-white shadow-card'
                        : 'bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg'
                    }`}
                  >
                    {n === 0 ? 'Todas' : `${n}+`}
                  </button>
                ))}
              </div>
            </section>

            <p className="text-xs text-fg-muted">
              Mostrando{' '}
              <span className="font-semibold text-fg">{shown}</span> de{' '}
              <span className="font-semibold text-fg">{total}</span> reporte
              {total === 1 ? '' : 's'}
            </p>

            {hasFilters && (
              <button
                type="button"
                onClick={reset}
                className="w-full rounded-md border border-surface-border px-3 py-1.5 text-xs font-medium text-fg-muted hover:bg-surface-raised hover:text-fg"
              >
                Restablecer filtros
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
