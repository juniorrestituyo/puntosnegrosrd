'use client';

import { useEffect, useState } from 'react';

import { useBackButtonClose } from '@/lib/use-back-button-close';

type FlagReason = 'spam' | 'ofensivo' | 'duplicado' | 'falso' | 'otro';

const REASONS: { value: FlagReason; label: string; description: string }[] = [
  {
    value: 'spam',
    label: 'Spam o publicidad',
    description: 'Promociones, links, contenido no relacionado.',
  },
  {
    value: 'ofensivo',
    label: 'Contenido ofensivo',
    description: 'Insultos, lenguaje violento, doxxing.',
  },
  {
    value: 'duplicado',
    label: 'Reporte duplicado',
    description: 'Ya existe el mismo punto reportado cerca.',
  },
  {
    value: 'falso',
    label: 'Reporte falso',
    description: 'Inventado, sin riesgo real en la ubicacion.',
  },
  {
    value: 'otro',
    label: 'Otro motivo',
    description: 'Otra razon valida no listada arriba.',
  },
];

interface Props {
  pointId: string;
}

/**
 * Boton discreto al final del detalle del punto que abre un modal
 * para reportar contenido problematico. Sin admin: cuando 5 IPs
 * unicas flaguean el mismo punto, el trigger SQL lo oculta solo.
 *
 * El boton intencionalmente es chico y secundario — no queremos
 * incentivar el reporte casual, solo dar via cuando hay un motivo
 * real (spam, ofensivo, etc.).
 */
export default function ReportContentButton({ pointId }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<FlagReason | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<'idle' | 'ok' | 'already' | 'err'>(
    'idle'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cerrar con Escape, mismo patron que los otros modales.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  // Back fisico del browser cierra el modal en lugar de navegar.
  useBackButtonClose(open, close);

  function close() {
    setOpen(false);
    // Reset diferido para que la animacion de salida no muestre
    // el form en blanco.
    setTimeout(() => {
      setSelected(null);
      setState('idle');
      setErrorMessage(null);
    }, 200);
  }

  async function submit() {
    if (!selected || submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/points/${pointId}/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: selected }),
      });
      const json = await res.json();
      if (json.ok) {
        setState('ok');
      } else if (json.error?.code === 'ALREADY_FLAGGED') {
        setState('already');
      } else {
        setState('err');
        setErrorMessage(json.error?.message ?? 'No se pudo enviar el reporte');
      }
    } catch {
      setState('err');
      setErrorMessage('Error de red');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mx-auto mt-4 block text-[11px] font-medium text-fg-muted underline-offset-4 hover:text-fg hover:underline"
      >
        Reportar este contenido
      </button>

      {/* Backdrop + modal siempre montados para animar fade y slide.
          En mobile el modal slide desde abajo (translate-y-full →
          translate-y-0, estilo sheet). En desktop entra centrado con
          scale + slide pequenho. El backdrop hace fade independiente. */}
      <div
        role="dialog"
        aria-label="Reportar contenido"
        aria-hidden={!open}
        className={`fixed inset-0 z-[2000] flex items-end justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200 ease-out sm:items-center ${
          open
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div
          className={`w-full max-w-md rounded-t-2xl bg-surface-card shadow-float ring-1 ring-surface-border transition-transform duration-200 ease-out sm:rounded-2xl ${
            open
              ? 'translate-y-0 sm:scale-100'
              : 'translate-y-full sm:translate-y-2 sm:scale-95'
          }`}
        >
            <header className="flex items-center justify-between border-b border-surface-divider px-5 py-4">
              <div>
                <h3 className="text-base font-bold tracking-tight text-fg">
                  Reportar contenido
                </h3>
                <p className="mt-0.5 text-xs text-fg-muted">
                  Si suficientes personas reportan el mismo punto, se
                  oculta automaticamente.
                </p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
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
            </header>

            <div
              className="px-5 py-4"
              style={{
                paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
              }}
            >
              {state === 'ok' ? (
                <div className="rounded-xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-200">
                  <p className="text-sm font-semibold text-emerald-900">
                    Reporte registrado
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Gracias. Si suficientes personas reportan el mismo
                    punto, se ocultara automaticamente.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-3 w-full rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Cerrar
                  </button>
                </div>
              ) : state === 'already' ? (
                <div className="rounded-xl bg-amber-50 px-4 py-4 ring-1 ring-amber-200">
                  <p className="text-sm font-semibold text-amber-900">
                    Ya reportaste este punto
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    Solo se permite un reporte por persona.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-3 w-full rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <>
                  <fieldset>
                    <legend className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                      Razon
                    </legend>
                    <ul className="mt-3 space-y-2">
                      {REASONS.map((r) => {
                        const active = selected === r.value;
                        return (
                          <li key={r.value}>
                            <button
                              type="button"
                              onClick={() => setSelected(r.value)}
                              // Sin transition-colors: para una seleccion
                              // tipo radio el cambio debe ser instantaneo.
                              // El transition causaba un flash visible en
                              // el primer click despues de abrir el modal
                              // (probable repaint del browser al aplicar
                              // por primera vez los estilos del estado
                              // active).
                              className={`w-full rounded-xl border px-4 py-3 text-left ${
                                active
                                  ? 'border-brand bg-brand-subtle'
                                  : 'border-surface-border bg-surface-card hover:bg-surface-raised'
                              }`}
                            >
                              <span
                                className={`text-sm font-semibold ${
                                  active ? 'text-brand' : 'text-fg'
                                }`}
                              >
                                {r.label}
                              </span>
                              <p className="mt-0.5 text-xs text-fg-muted">
                                {r.description}
                              </p>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </fieldset>

                  {state === 'err' && errorMessage && (
                    <p
                      role="alert"
                      className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                    >
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={submit}
                    disabled={!selected || submitting}
                    className="mt-4 w-full rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent disabled:opacity-60"
                  >
                    {submitting ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
    </>
  );
}
