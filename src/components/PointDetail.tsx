'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import { colorForConfirmations } from '@/lib/marker-color';
import type { Point, StatusHistoryEntry } from '@/lib/types';
import ShareWithAuthority from './ShareWithAuthority';

interface PointDetailProps {
  point: Point;
  history: StatusHistoryEntry[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function PointDetail({
  point: initialPoint,
  history,
}: PointDetailProps) {
  const [point, setPoint] = useState(initialPoint);
  const [confirmState, setConfirmState] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [shareAuthorityOpen, setShareAuthorityOpen] = useState(false);

  const color = colorForConfirmations(point.confirmation_count);

  async function handleConfirm() {
    setConfirmState('loading');
    setConfirmMessage(null);
    try {
      const res = await fetch(`/api/points/${point.id}/confirm`, {
        method: 'POST',
      });
      const json = await res.json();
      if (json.ok) {
        setPoint((prev) => ({
          ...prev,
          confirmation_count: json.data.confirmation_count as number,
        }));
        setConfirmState('ok');
      } else {
        setConfirmState('err');
        setConfirmMessage(
          json.error?.message ?? 'No se pudo registrar la confirmacion'
        );
      }
    } catch {
      setConfirmState('err');
      setConfirmMessage('Error de red');
    }
  }

  async function handleShare() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    } catch {
      // Fallback: seleccionar el texto del input
      window.prompt('Copia este enlace:', url);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-slate-600 hover:text-brand hover:underline"
        >
          &larr; Volver al mapa
        </Link>
      </div>

      <header className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand">
              {CATEGORIES[point.category].label}
              {point.subcategory ? (
                <span className="text-slate-600"> - {point.subcategory}</span>
              ) : null}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Reportado el {formatDate(point.created_at)}
            </p>
          </div>
          <span
            className="inline-block rounded px-3 py-1 text-xs font-medium"
            style={{
              background: color.bg,
              color: color.text,
              border: `1px solid ${color.border}`,
            }}
            title={color.label}
          >
            {point.confirmation_count} confirmacion
            {point.confirmation_count === 1 ? '' : 'es'}
          </span>
        </div>
      </header>

      <section className="space-y-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Descripcion
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-slate-800">
            {point.description}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Ubicacion
            </h2>
            <p className="mt-2 text-sm text-slate-800">
              {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
            </p>
            {point.municipality && (
              <p className="text-sm text-slate-600">{point.municipality}</p>
            )}
            {point.province && (
              <p className="text-sm text-slate-600">{point.province}</p>
            )}
            <a
              href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=18/${point.lat}/${point.lng}`}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-block text-xs text-brand-accent hover:underline"
            >
              Abrir en OpenStreetMap &rarr;
            </a>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Estado
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-800">
              {STATUS_LABELS[point.status] ?? point.status}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Categoria INTRANT:{' '}
              <span className="font-medium text-slate-700">
                {CATEGORIES[point.category].label}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {confirmState === 'ok' ? (
            <span className="rounded bg-green-50 px-3 py-2 text-sm font-medium text-green-700 ring-1 ring-green-200">
              ✓ Tu confirmacion suma
            </span>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirmState === 'loading'}
              className="rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {confirmState === 'loading'
                ? 'Confirmando...'
                : 'Yo tambien lo veo'}
            </button>
          )}

          <button
            type="button"
            onClick={handleShare}
            className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            {shareState === 'copied' ? '✓ Enlace copiado' : 'Copiar enlace'}
          </button>

          <button
            type="button"
            onClick={() => setShareAuthorityOpen(true)}
            className="rounded border border-brand-accent bg-white px-4 py-2 text-sm font-medium text-brand-accent hover:bg-red-50"
          >
            Compartir con autoridad
          </button>
        </div>

        {confirmState === 'err' && confirmMessage && (
          <div
            role="alert"
            className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {confirmMessage}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">
          Historial de estado
        </h2>
        {history.length === 0 ? (
          <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Sin cambios de estado registrados. El historial se actualizara
            cuando la autoridad notifique acciones sobre este punto.
          </p>
        ) : (
          <ol className="space-y-2">
            {history.map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-slate-200 bg-white p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-800">
                    {entry.old_status
                      ? `${STATUS_LABELS[entry.old_status] ?? entry.old_status} -> `
                      : ''}
                    {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(entry.created_at)}
                  </span>
                </div>
                {entry.note && (
                  <p className="mt-1 text-slate-600">{entry.note}</p>
                )}
                {entry.changed_by && (
                  <p className="mt-1 text-xs text-slate-400">
                    Por: {entry.changed_by}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
        Identificador del punto:{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5">{point.id}</code>
      </footer>

      {shareAuthorityOpen && (
        <ShareWithAuthority
          point={point}
          onClose={() => setShareAuthorityOpen(false)}
        />
      )}
    </div>
  );
}
