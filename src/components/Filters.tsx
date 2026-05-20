'use client';

import { useState } from 'react';

import { CATEGORIES, type CategoryKey } from '@/lib/constants';

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

interface FiltersProps {
  state: FilterState;
  total: number;
  shown: number;
  onChange: (next: FilterState) => void;
}

export default function Filters({
  state,
  total,
  shown,
  onChange,
}: FiltersProps) {
  const [open, setOpen] = useState(false);

  function toggleCategory(key: CategoryKey) {
    const next = new Set(state.categories);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange({ ...state, categories: next });
  }

  function reset() {
    onChange(DEFAULT_FILTERS);
  }

  const activeCount = state.categories.size;
  const filtered = activeCount < 4 || state.minConfirmations > 0;

  return (
    <div className="pointer-events-auto absolute right-4 top-4 z-[1000] w-[260px] rounded-lg bg-white shadow-lg ring-1 ring-slate-200">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
        aria-expanded={open}
      >
        <span>
          Filtros{' '}
          {filtered && (
            <span className="ml-1 inline-block rounded bg-brand-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
              activos
            </span>
          )}
        </span>
        <span className="text-xs text-slate-500">
          {shown}/{total}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-slate-200 p-3">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Categoria
            </div>
            <div className="space-y-1">
              {(Object.keys(CATEGORIES) as CategoryKey[]).map((key) => (
                <label
                  key={key}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={state.categories.has(key)}
                    onChange={() => toggleCategory(key)}
                    className="rounded border-slate-300 text-brand-accent focus:ring-brand-accent"
                  />
                  {CATEGORIES[key].label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Confirmaciones minimas
            </div>
            <div className="flex flex-wrap gap-1">
              {[0, 1, 3, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() =>
                    onChange({ ...state, minConfirmations: n })
                  }
                  className={`rounded px-2 py-1 text-xs font-medium ${
                    state.minConfirmations === n
                      ? 'bg-brand text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {n === 0 ? 'Todas' : `${n}+`}
                </button>
              ))}
            </div>
          </div>

          {filtered && (
            <button
              type="button"
              onClick={reset}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
