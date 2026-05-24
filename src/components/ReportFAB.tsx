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
      {/* Backdrop siempre montado para animar opacidad. Al cerrar,
          pointer-events-none lo saca del flujo interactivo. */}
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Cerrar menu"
        aria-hidden={!open}
        tabIndex={open ? 0 : -1}
        className={`fixed inset-0 z-[1090] cursor-default bg-black/30 backdrop-blur-[2px] transition-opacity duration-150 ease-out ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Menu siempre montado. Animacion scale + fade desde bottom-right
          (corner del FAB amarillo) — el menu "salta" del boton + que lo
          activo, conectando visualmente origen y destino. */}
      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute bottom-28 right-3 z-[1100] w-64 origin-bottom-right overflow-hidden rounded-xl bg-surface-card shadow-float ring-1 ring-surface-border transition-all duration-150 ease-out sm:bottom-32 sm:right-6 ${
          open
            ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
            : 'pointer-events-none translate-y-1 scale-95 opacity-0'
        }`}
      >
          <button
            type="button"
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => pick(onUseCurrentLocation)}
            className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-raised"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-brand"
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
            tabIndex={open ? 0 : -1}
            onClick={() => pick(onSelectOnMap)}
            className="flex w-full items-center gap-3 border-t border-surface-divider px-4 py-3 text-left hover:bg-surface-raised"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-brand"
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

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={open ? 'Cerrar menu de reporte' : 'Reportar nuevo punto'}
        aria-expanded={open}
        // FAB en amarillo senaletico + icono oscuro. Lectura inmediata
        // como "boton de alerta vial" (mismo codigo cromatico que las
        // senales de precaucion). El resto de la UI sigue siendo azul
        // institucional; este es el unico CTA que adopta el color de
        // dominio (carretera/peligro).
        className="absolute bottom-10 right-3 z-[1100] flex h-16 w-16 items-center justify-center rounded-full bg-signal text-white shadow-float transition-transform hover:bg-signal-accent active:scale-95 disabled:opacity-50 sm:bottom-12 sm:right-6 sm:h-20 sm:w-20"
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
