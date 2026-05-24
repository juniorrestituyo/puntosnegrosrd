'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  KNOWN_RECIPIENTS,
  buildShareMessage,
  type AuthorityRecipient,
} from '@/lib/share-message';
import type { Point } from '@/lib/types';
import { useBackButtonClose } from '@/lib/use-back-button-close';

interface ShareWithAuthorityProps {
  point: Point;
  open: boolean;
  onClose: () => void;
}

export default function ShareWithAuthority({
  point,
  open,
  onClose,
}: ShareWithAuthorityProps) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<AuthorityRecipient | null>(null);

  const siteUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

  // El mensaje se adapta al destinatario seleccionado (saludo y linea
  // de pedido cambian segun jurisdiccion). Si no hay seleccion, version
  // generica.
  const message = useMemo(
    () => buildShareMessage(point, siteUrl, selected),
    [point, siteUrl, selected]
  );

  // ESC cierra. Guard con !open para no acumular listeners cuando
  // el modal esta cerrado (siempre montado para animar).
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Bloquear scroll del body solo cuando el modal esta abierto.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  // Back fisico del browser cierra el modal en lugar de navegar al
  // mapa. En mobile el modal cubre toda la pantalla — el usuario
  // espera que back vuelva al detalle del reporte, no que salga.
  useBackButtonClose(open, onClose);

  async function handleCopy() {
    const full = `${message.subject}\n\n${message.body}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copia este mensaje:', full);
    }
  }

  function mailtoLink(): string {
    const to = selected?.email ?? '';
    const subject = encodeURIComponent(message.subject);
    const body = encodeURIComponent(message.body);
    return `mailto:${to}?subject=${subject}&body=${body}`;
  }

  return (
    <div
      className={`fixed inset-0 z-[2000] flex flex-col bg-surface-base transition-opacity duration-200 ease-out sm:items-center sm:justify-center sm:bg-black/40 sm:p-4 sm:backdrop-blur-sm ${
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0'
      }`}
      role="dialog"
      aria-label="Compartir con autoridad"
      aria-hidden={!open}
    >
      <div
        className={`relative flex h-full w-full flex-col bg-surface-base transition-transform duration-200 ease-out sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:overflow-hidden sm:rounded-2xl sm:bg-surface-card sm:shadow-float sm:ring-1 sm:ring-surface-border ${
          open
            ? 'translate-y-0 sm:scale-100'
            : 'translate-y-full sm:translate-y-2 sm:scale-95'
        }`}
      >
        {/* Header sticky */}
        <header className="flex shrink-0 items-center justify-between border-b border-surface-border bg-surface-card px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-fg sm:text-lg">
              Compartir con autoridad
            </h2>
            <p className="mt-0.5 text-xs text-fg-muted">
              Envia este reporte a una institucion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
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

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto bg-surface-base">
          {/* Destinatarios */}
          <section className="bg-surface-card px-4 pt-4 pb-5 sm:px-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Destinatarios sugeridos
            </h3>
            <p className="mt-1 text-xs text-fg-muted">
              Tu eliges a quien enviar. No mandamos el correo por ti.
            </p>
            <div className="mt-3 space-y-2">
              {KNOWN_RECIPIENTS.map((r) => {
                const isSelected = selected?.name === r.name;
                return (
                  <button
                    type="button"
                    key={r.name}
                    onClick={() => setSelected(isSelected ? null : r)}
                    aria-pressed={isSelected}
                    className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-brand-subtle ring-2 ring-brand'
                        : 'bg-surface-raised ring-1 ring-surface-border hover:bg-surface-border'
                    }`}
                  >
                    {/* Avatar: icono de edificio generico para todas
                        las instituciones. Color brand cuando esta
                        seleccionada para reforzar el estado. */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? 'bg-brand text-white'
                          : 'bg-surface-card text-fg-muted ring-1 ring-surface-border'
                      }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                      >
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-4" />
                        <path d="M9 9h.01M9 12h.01M9 15h.01M9 18h.01" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isSelected ? 'text-brand' : 'text-fg'
                          }`}
                        >
                          {r.name}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] leading-snug text-fg-muted">
                        {r.description}
                      </p>
                      {r.email && (
                        <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-fg-dim">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="11"
                            height="11"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <polyline points="3 7 12 13 21 7" />
                          </svg>
                          {r.email}
                        </div>
                      )}
                    </div>

                    {isSelected && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden
                        className="shrink-0 text-brand"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Mensaje */}
          <div className="mt-2 space-y-4 bg-surface-card px-4 py-5 sm:px-5">
            <section>
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Mensaje
              </h3>
              <div className="mt-2 overflow-hidden rounded-xl bg-surface-raised ring-1 ring-surface-border">
                <div className="border-b border-surface-border bg-surface-card px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-dim">
                    Asunto
                  </p>
                  <p className="mt-1 text-sm font-semibold text-fg">
                    {message.subject}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-fg-dim">
                    Cuerpo
                  </p>
                  <pre className="mt-1 max-h-72 overflow-y-auto whitespace-pre-wrap font-sans text-xs leading-relaxed text-fg/90">
                    {message.body}
                  </pre>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Footer sticky con CTAs */}
        <footer
          className="shrink-0 border-t border-surface-border bg-surface-card px-4 py-3 sm:px-5"
          style={{
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          }}
        >
          {selected ? (
            <p className="mb-2 text-center text-[11px] text-fg-muted">
              Listo para enviar a:{' '}
              <span className="font-semibold text-fg">{selected.name}</span>
            </p>
          ) : (
            <p className="mb-2 text-center text-[11px] text-fg-muted">
              Selecciona un destinatario o solo copia el mensaje.
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-3 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
            >
              {copied ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Mensaje copiado
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  Copiar mensaje
                </>
              )}
            </button>

            <a
              href={selected ? mailtoLink() : undefined}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold shadow-card transition-colors ${
                selected
                  ? 'bg-brand text-white hover:bg-brand-accent'
                  : 'pointer-events-none cursor-not-allowed bg-surface-raised text-fg-dim'
              }`}
              aria-disabled={!selected}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Abrir en mi correo
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
