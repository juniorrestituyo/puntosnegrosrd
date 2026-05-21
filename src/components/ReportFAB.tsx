'use client';

import { useEffect, useState } from 'react';

interface ReportFABProps {
  onUseCurrentLocation: () => void;
  onSelectOnMap: () => void;
  disabled?: boolean;
}

export default function ReportFAB({
  onUseCurrentLocation,
  onSelectOnMap,
  disabled = false,
}: ReportFABProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function pick(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <>
      {open && (
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menu"
          className="fixed inset-0 z-[1090] cursor-default bg-black/30 backdrop-blur-[2px]"
        />
      )}

      {open && (
        <div
          role="menu"
          className="absolute bottom-24 right-3 z-[1100] w-64 overflow-hidden rounded-xl bg-surface-card shadow-float ring-1 ring-surface-border sm:bottom-28 sm:right-6"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onUseCurrentLocation)}
            className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-raised"
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
              className="mt-0.5 shrink-0 text-brand"
              aria-hidden
            >
              <path d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-fg">
                Usar mi ubicacion
              </div>
              <div className="mt-0.5 text-xs text-fg-muted">
                Usa el GPS de tu telefono
              </div>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={() => pick(onSelectOnMap)}
            className="flex w-full items-start gap-3 border-t border-surface-divider px-4 py-3 text-left hover:bg-surface-raised"
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
              className="mt-0.5 shrink-0 text-brand"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <line x1="12" y1="2" x2="12" y2="6" />
              <line x1="12" y1="18" x2="12" y2="22" />
              <line x1="2" y1="12" x2="6" y2="12" />
              <line x1="18" y1="12" x2="22" y2="12" />
              <circle cx="12" cy="12" r="2.5" fill="currentColor" />
            </svg>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-fg">
                Seleccionar en el mapa
              </div>
              <div className="mt-0.5 text-xs text-fg-muted">
                Toca el punto exacto manualmente
              </div>
            </div>
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={open ? 'Cerrar menu de reporte' : 'Reportar nuevo punto'}
        aria-expanded={open}
        className="absolute bottom-10 right-3 z-[1100] flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-float ring-2 ring-white transition-transform hover:bg-brand-accent active:scale-95 disabled:opacity-50 sm:bottom-12 sm:right-6 sm:h-16 sm:w-16"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${open ? 'rotate-45' : ''}`}
          aria-hidden
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </>
  );
}
