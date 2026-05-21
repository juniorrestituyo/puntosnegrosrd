'use client';

import { useMemo, useState } from 'react';

import {
  KNOWN_RECIPIENTS,
  buildShareMessage,
  type AuthorityRecipient,
} from '@/lib/share-message';
import type { Point } from '@/lib/types';

interface ShareWithAuthorityProps {
  point: Point;
  onClose: () => void;
}

export default function ShareWithAuthority({
  point,
  onClose,
}: ShareWithAuthorityProps) {
  const [copied, setCopied] = useState(false);
  const [selected, setSelected] = useState<AuthorityRecipient | null>(null);

  const siteUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');

  const message = useMemo(
    () => buildShareMessage(point, siteUrl),
    [point, siteUrl]
  );

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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/30 p-2 backdrop-blur-sm sm:p-4">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col rounded-2xl bg-surface-card shadow-float ring-1 ring-surface-border sm:max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-surface-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-base font-semibold text-fg">
              Compartir con autoridad
            </h2>
            <p className="text-xs text-fg-muted">
              Envia este reporte a una institucion.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-fg-muted hover:bg-surface-raised hover:text-fg"
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
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Destinatarios sugeridos
            </h3>
            <p className="mt-1 text-xs text-fg-muted">
              Tu eliges a quien enviar. No mandamos el correo por ti.
            </p>
            <div className="mt-2 space-y-2">
              {KNOWN_RECIPIENTS.map((r) => {
                const isSelected = selected?.name === r.name;
                return (
                  <button
                    type="button"
                    key={r.name}
                    onClick={() => setSelected(isSelected ? null : r)}
                    className={`block w-full rounded-lg border p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-brand bg-brand-subtle'
                        : 'border-surface-border bg-surface-card hover:bg-surface-raised'
                    }`}
                  >
                    <div className="font-medium text-fg">{r.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-fg-muted">
                      {r.email && <span>Correo: {r.email}</span>}
                      {r.phone && <span>Tel: {r.phone}</span>}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sitio web
                        </a>
                      )}
                    </div>
                    {r.note && (
                      <div className="mt-1 text-xs text-fg-dim">{r.note}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Mensaje
            </h3>
            <div className="mt-2 rounded-lg border border-surface-border bg-surface-raised px-3 py-2 text-sm">
              <div className="font-medium text-fg">{message.subject}</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-fg/90">
                {message.body}
              </pre>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-surface-border px-4 py-3 sm:px-5">
          <p className="text-xs text-fg-muted">
            {selected
              ? `Listo para enviar a: ${selected.name}`
              : 'Selecciona un destinatario o solo copia el mensaje.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm font-medium text-fg hover:bg-surface-raised"
            >
              {copied ? '✓ Copiado' : 'Copiar mensaje'}
            </button>
            <a
              href={mailtoLink()}
              className={`rounded-lg px-4 py-2 text-sm font-semibold shadow-card ${
                selected
                  ? 'bg-brand text-white hover:bg-brand-accent'
                  : 'pointer-events-none bg-surface-raised text-fg-dim'
              }`}
              aria-disabled={!selected}
            >
              Abrir en mi correo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
