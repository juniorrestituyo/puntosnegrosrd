'use client';

import Link from 'next/link';
import { useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import type { Point, StatusHistoryEntry } from '@/lib/types';
import ShareWithAuthority from './ShareWithAuthority';
import SideDrawer from './SideDrawer';

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
      window.prompt('Copia este enlace:', url);
    }
  }

  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer />

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
        <div className="mb-4">
          <Link
            href="/"
            className="text-sm text-fg-muted hover:text-brand hover:underline"
          >
            ← Volver al mapa
          </Link>
        </div>

        <header className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-fg sm:text-2xl">
                {CATEGORIES[point.category].label}
              </h1>
              {point.subcategory && (
                <p className="mt-1 text-sm text-fg-muted">{point.subcategory}</p>
              )}
              <p className="mt-2 text-xs text-fg-muted sm:text-sm">
                Reportado el {formatDate(point.created_at)}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-brand-subtle px-3 py-1 text-xs font-semibold text-brand">
              {point.confirmation_count} confirmacion
              {point.confirmation_count === 1 ? '' : 'es'}
            </span>
          </div>
        </header>

        <section className="space-y-4">
          {point.photo_url && (
            <div className="overflow-hidden rounded-2xl border border-surface-border bg-surface-card shadow-card">
              <img
                src={point.photo_url}
                alt="Foto ciudadana del reporte"
                className="block max-h-[480px] w-full object-contain"
                loading="lazy"
              />
              <p className="px-3 py-2 text-xs text-fg-muted">
                Foto aportada por quien reporto el punto. Metadata EXIF removida
                antes de subir.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Descripcion
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-fg">
              {point.description}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Ubicacion
              </h2>
              <p className="mt-2 text-sm text-fg">
                {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
              </p>
              {point.municipality && (
                <p className="text-sm text-fg-muted">{point.municipality}</p>
              )}
              {point.province && (
                <p className="text-sm text-fg-muted">{point.province}</p>
              )}
              <a
                href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lng}#map=18/${point.lat}/${point.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-brand hover:underline"
              >
                Abrir en OpenStreetMap →
              </a>
            </div>

            <div className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card">
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                Estado
              </h2>
              <p className="mt-2 text-sm font-semibold text-fg">
                {STATUS_LABELS[point.status] ?? point.status}
              </p>
              <p className="mt-1 text-xs text-fg-muted">
                Categoria INTRANT:{' '}
                <span className="font-medium text-fg/90">
                  {CATEGORIES[point.category].label}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {confirmState === 'ok' ? (
              <span className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 ring-1 ring-emerald-200">
                ✓ Tu confirmacion suma
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmState === 'loading'}
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-card hover:bg-brand-accent disabled:opacity-60"
              >
                {confirmState === 'loading'
                  ? 'Confirmando...'
                  : 'Yo tambien lo veo'}
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="rounded-lg border border-surface-border bg-surface-card px-4 py-2 text-sm font-medium text-fg hover:bg-surface-raised"
            >
              {shareState === 'copied' ? '✓ Enlace copiado' : 'Copiar enlace'}
            </button>

            <button
              type="button"
              onClick={() => setShareAuthorityOpen(true)}
              className="rounded-lg border border-brand bg-brand-subtle px-4 py-2 text-sm font-semibold text-brand hover:bg-brand-soft"
            >
              Compartir con autoridad
            </button>
          </div>

          {confirmState === 'err' && confirmMessage && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {confirmMessage}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold text-fg">
            Historial de estado
          </h2>
          {history.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-surface-border bg-surface-card px-4 py-6 text-center text-sm text-fg-muted">
              Sin cambios de estado registrados. El historial se actualizara
              cuando la autoridad notifique acciones sobre este punto.
            </p>
          ) : (
            <ol className="space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl border border-surface-border bg-surface-card p-3 text-sm shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-fg">
                      {entry.old_status
                        ? `${STATUS_LABELS[entry.old_status] ?? entry.old_status} → `
                        : ''}
                      {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                    </span>
                    <span className="text-xs text-fg-muted">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.note && (
                    <p className="mt-1 text-fg/90">{entry.note}</p>
                  )}
                  {entry.changed_by && (
                    <p className="mt-1 text-xs text-fg-dim">
                      Por: {entry.changed_by}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>

        <footer className="mt-12 border-t border-surface-border pt-4 text-xs text-fg-muted">
          Identificador del punto:{' '}
          <code className="rounded bg-surface-raised px-1.5 py-0.5 text-brand">
            {point.id}
          </code>
        </footer>

        {shareAuthorityOpen && (
          <ShareWithAuthority
            point={point}
            onClose={() => setShareAuthorityOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
