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
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 p-4">
      <div className="flex w-full max-w-2xl flex-col rounded-lg bg-white shadow-xl max-h-[90vh]">
        <div className="flex items-start justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <h2 className="text-lg font-semibold text-brand">
              Compartir con autoridad
            </h2>
            <p className="text-xs text-slate-500">
              Envia este reporte a una institucion para que sea evaluado y,
              de ser procedente, intervenido.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            x
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-5 py-4">
          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Destinatarios sugeridos
            </h3>
            <p className="mt-1 text-xs text-slate-600">
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
                    className={`block w-full rounded border p-3 text-left text-sm transition-colors ${
                      isSelected
                        ? 'border-brand-accent bg-red-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-medium text-slate-800">{r.name}</div>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600">
                      {r.email && <span>Correo: {r.email}</span>}
                      {r.phone && <span>Tel: {r.phone}</span>}
                      {r.website && (
                        <a
                          href={r.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-accent hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Sitio web
                        </a>
                      )}
                    </div>
                    {r.note && (
                      <div className="mt-1 text-xs text-slate-500">
                        {r.note}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Mensaje
            </h3>
            <div className="mt-2 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800">
              <div className="font-medium">{message.subject}</div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">
                {message.body}
              </pre>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-3">
          <p className="text-xs text-slate-500">
            {selected
              ? `Listo para enviar a: ${selected.name}`
              : 'Selecciona un destinatario para abrir tu correo, o solo copia el mensaje.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {copied ? '✓ Copiado' : 'Copiar mensaje'}
            </button>
            <a
              href={mailtoLink()}
              className={`rounded px-4 py-2 text-sm font-medium ${
                selected
                  ? 'bg-brand-accent text-white hover:bg-red-700'
                  : 'bg-slate-200 text-slate-400 pointer-events-none'
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
