'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import type { Point, StatusHistoryEntry } from '@/lib/types';
import BackToMapButton from './BackToMapButton';
import ShareWithAuthority from './ShareWithAuthority';
import SideDrawer from './SideDrawer';

const LocationPreview = dynamic(() => import('./LocationPreview'), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full animate-pulse bg-surface-raised" />
  ),
});

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

  const googleMapsUrl = `https://www.google.com/maps?q=${point.lat},${point.lng}`;

  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer />
      <BackToMapButton />

      <div
        className="mx-auto w-full max-w-2xl px-3 pt-20 sm:px-6 sm:pt-24"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 48px)',
        }}
      >
        {/* Header card */}
        <section className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {STATUS_LABELS[point.status] ?? point.status}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {CATEGORIES[point.category].label}
              </h1>
              {point.subcategory && (
                <p className="mt-1 text-sm text-fg-muted">
                  {point.subcategory}
                </p>
              )}
              <p className="mt-2 text-xs text-fg-dim sm:text-sm">
                Reportado el {formatDate(point.created_at)}
              </p>
            </div>
          </div>
        </section>

        {/* Foto */}
        {point.photo_url && (
          <section className="mt-3 overflow-hidden rounded-2xl bg-surface-card shadow-card ring-1 ring-surface-border">
            <img
              src={point.photo_url}
              alt="Foto ciudadana del reporte"
              className="block max-h-[480px] w-full object-contain"
              loading="lazy"
            />
            <p className="border-t border-surface-divider px-4 py-2 text-[11px] text-fg-muted">
              Foto aportada por quien reporto el punto. Metadata EXIF removida.
            </p>
          </section>
        )}

        {/* Ubicacion */}
        <section className="mt-3 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Ubicacion
          </h2>
          <p className="mt-1 font-mono text-sm text-fg">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)}
          </p>
          {(point.municipality || point.province) && (
            <p className="mt-1 text-sm text-fg-muted">
              {[point.municipality, point.province].filter(Boolean).join(', ')}
            </p>
          )}

          <div className="mt-3 overflow-hidden rounded-xl ring-1 ring-surface-border">
            <LocationPreview
              lat={point.lat}
              lng={point.lng}
              confirmationCount={point.confirmation_count}
              isResolved={point.status === 'resuelto'}
            />
          </div>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-3 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
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
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
            Abrir en Google Maps
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              className="text-fg-muted"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </section>

        {/* Descripcion */}
        <section className="mt-3 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Descripcion
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-fg/90">
            {point.description}
          </p>
        </section>

        {/* Confirmaciones + acciones.
            Mismo tratamiento que PointDetailSheet:
            - Icono cambiado de thumbs-up a ojo (matchea "Yo tambien lo veo").
            - Counter en estilo muted cuando status='resuelto'; label cambia
              a "testigos cuando estaba activo" para comunicar que es
              historico, no urgencia actual.
            - Boton confirm se oculta si esta resuelto. */}
        <section className="mt-3 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
          <div
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 ring-1 ${
              point.status === 'resuelto'
                ? 'bg-surface-raised ring-surface-border'
                : 'bg-brand-subtle ring-brand-soft'
            }`}
          >
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-card ${
                point.status === 'resuelto'
                  ? 'bg-surface-border text-fg-muted'
                  : 'bg-brand text-white'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div
                className={`text-3xl font-extrabold leading-none tracking-tight ${
                  point.status === 'resuelto' ? 'text-fg-muted' : 'text-fg'
                }`}
              >
                {point.confirmation_count}
              </div>
              <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                {point.status === 'resuelto'
                  ? point.confirmation_count === 1
                    ? 'testigo cuando estaba activo'
                    : 'testigos cuando estaba activo'
                  : point.confirmation_count === 1
                    ? 'confirmacion'
                    : 'confirmaciones'}
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {point.status === 'resuelto' ? (
              <span className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:col-span-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Punto marcado como resuelto
              </span>
            ) : confirmState === 'ok' ? (
              <span className="flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 sm:col-span-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Tu confirmacion suma
              </span>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={confirmState === 'loading'}
                className="flex items-center justify-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent disabled:opacity-70 sm:col-span-2"
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
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {confirmState === 'loading'
                  ? 'Confirmando...'
                  : 'Yo tambien lo veo'}
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="flex items-center justify-center gap-2 rounded-full bg-surface-raised px-4 py-3 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
            >
              {shareState === 'copied' ? (
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
                  Enlace copiado
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
                  Copiar enlace
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setShareAuthorityOpen(true)}
              className="flex items-center justify-center gap-2 rounded-full bg-brand-subtle px-4 py-3 text-sm font-semibold text-brand ring-1 ring-brand-soft transition-colors hover:bg-brand-soft"
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
              Compartir con autoridad
            </button>
          </div>

          {confirmState === 'err' && confirmMessage && (
            <p
              role="alert"
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {confirmMessage}
            </p>
          )}
        </section>

        {/* Historial */}
        <section className="mt-3 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
            Historial de estado
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-surface-border bg-surface-raised px-4 py-5 text-center text-sm text-fg-muted">
              Sin cambios de estado registrados. Se actualizara cuando la
              autoridad notifique acciones sobre este punto.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-xl bg-surface-raised p-3 text-sm ring-1 ring-surface-border"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-fg">
                      {entry.old_status
                        ? `${STATUS_LABELS[entry.old_status] ?? entry.old_status} → `
                        : ''}
                      {STATUS_LABELS[entry.new_status] ?? entry.new_status}
                    </span>
                    <span className="shrink-0 text-xs text-fg-muted">
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

        {/* Footer con ID */}
        <p className="mt-6 text-center text-[11px] text-fg-muted">
          ID:{' '}
          <code className="rounded bg-surface-raised px-1.5 py-0.5 font-mono text-brand">
            {point.id}
          </code>
        </p>

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
