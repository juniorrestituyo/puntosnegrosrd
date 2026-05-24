'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import { formatRelativeTime } from '@/lib/time';
import type { Point, StatusHistoryEntry } from '@/lib/types';
import { sharePoint } from '@/lib/share';

import BackToMapButton from './BackToMapButton';
import PhotoLightbox from './PhotoLightbox';
import ReportContentButton from './ReportContentButton';
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
  // No usamos setPoint — antes lo actualizaba handleConfirm con el
  // nuevo conteo. El voto de confirmar vive ahora solo en el modal
  // del mapa (PointDetailSheet), donde el usuario esta naturalmente
  // mirando ubicaciones cerca. La pagina de detalle queda como vista
  // de review/historial/compartir; si quieres votar, vuelves al mapa.
  const point = initialPoint;
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const [shareAuthorityOpen, setShareAuthorityOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  // Si la foto falla al cargar (404, CORS, etc.) escondemos la card
  // entera en lugar de mostrar un icono roto. Vale la pena este flag
  // porque las fotos vienen de Supabase Storage y pueden faltar por
  // cosas operacionales (bucket policy, archivo borrado manualmente).
  const [photoErrored, setPhotoErrored] = useState(false);

  // Feedback transitorio del icono share del header cuando caemos al
  // fallback de portapapeles (navegadores sin Web Share API). En
  // mobile y Chrome/Edge desktop el OS sheet se encarga del feedback;
  // en Firefox desktop este flag se activa.
  const [headerShareCopied, setHeaderShareCopied] = useState(false);

  /**
   * Helper compartido para los dos puntos de share (icono del header
   * + boton "Compartir" del bloque inferior). Llama a sharePoint
   * (Web Share API + fallback clipboard) y notifica al caller que
   * tipo de resultado paso para que decida que feedback mostrar.
   */
  async function handleSharePoint(): Promise<'shared' | 'copied' | 'cancelled' | 'failed'> {
    const result = await sharePoint(point, window.location.origin);
    return result.type;
  }

  /** Click del icono share del header. */
  async function handleHeaderShare() {
    const type = await handleSharePoint();
    if (type === 'copied') {
      setHeaderShareCopied(true);
      setTimeout(() => setHeaderShareCopied(false), 2000);
    }
  }

  /** Click del boton "Compartir" del bloque inferior. */
  async function handleBottomShare() {
    const type = await handleSharePoint();
    if (type === 'copied') {
      setShareState('copied');
      setTimeout(() => setShareState('idle'), 2000);
    }
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${point.lat},${point.lng}`;

  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer variant="static" />
      <BackToMapButton variant="static" />

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
              {/* Status badge: tiempo relativo cuando esta 'nuevo'
                  (e.g. "Hace 2 horas"), label estatico en otros estados.
                  Mas abajo en la card sigue apareciendo "Reportado el
                  [fecha exacta]" para precision. */}
              <p
                suppressHydrationWarning
                className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted"
              >
                {point.status === 'nuevo'
                  ? formatRelativeTime(point.created_at)
                  : (STATUS_LABELS[point.status] ?? point.status)}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-fg sm:text-2xl">
                {CATEGORIES[point.category].label}
              </h1>
              {point.subcategory && (
                <p className="mt-1 text-sm text-fg-muted">
                  {point.subcategory}
                </p>
              )}
            </div>

            {/* Share rapido del enlace del reporte via Web Share API
                (sheet nativo de iOS/Android/Chrome). El usuario elige
                WhatsApp/Telegram/email/etc. Fallback a clipboard si
                el navegador no lo soporta.
                NO se confunde con "Compartir con autoridad" — ese
                sigue siendo el boton grande de abajo, especifico
                para mandar a INTRANT/DIGESETT/etc. con mensaje
                pregenerado. */}
            <button
              type="button"
              onClick={handleHeaderShare}
              aria-label={
                headerShareCopied ? 'Enlace copiado' : 'Compartir enlace'
              }
              title={
                headerShareCopied ? 'Enlace copiado' : 'Compartir enlace'
              }
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                headerShareCopied
                  ? 'bg-emerald-100 text-emerald-700 ring-emerald-200'
                  : 'bg-surface-raised text-fg-muted ring-surface-border hover:bg-surface-border hover:text-fg'
              }`}
            >
              {headerShareCopied ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
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
              ) : (
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
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              )}
            </button>
          </div>

          {/* "Reportado el ..." se sale del flex row para spanear el
              ancho completo del card. Si se queda adentro de min-w-0
              flex-1 termina cortandose o haciendo wrap raro porque
              compite con el ancho del boton share. */}
          <p className="mt-3 text-xs text-fg-dim sm:text-sm">
            Reportado el {formatDate(point.created_at)}
          </p>
        </section>

        {/* Foto.
            Card con aspect-ratio fijo 4:3 + object-cover para que todas
            las fotos se vean uniformes en el feed (independiente del
            ratio que traiga el telefono que las saco). El usuario hace
            tap → se abre PhotoLightbox full-screen con object-contain,
            ahi se ve la foto completa sin recortes (escape hatch para
            evidencia). Si la imagen falla al cargar, escondemos la
            card entera (photoErrored). */}
        {point.photo_url && !photoErrored && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            aria-label="Ver foto ampliada"
            className="mt-3 block w-full overflow-hidden rounded-2xl bg-surface-raised text-left shadow-card ring-1 ring-surface-border transition-shadow hover:shadow-float focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <div className="relative aspect-[4/3] w-full">
              <img
                src={point.photo_url}
                alt="Foto ciudadana del reporte"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
                draggable={false}
                onError={() => setPhotoErrored(true)}
              />
            </div>
            <p className="border-t border-surface-divider px-4 py-1.5 text-[10px] leading-snug text-fg-muted">
              Foto aportada por quien reporto el punto. Toca para verla
              completa. Metadata EXIF removida.
            </p>
          </button>
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

        {/* Descripcion. Desde la migracion 005 la descripcion puede ser
            null (reportes con foto sin texto). En ese caso ocultamos
            toda la seccion para no dejar un recuadro hueco. */}
        {point.description && (
          <section className="mt-3 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
              Descripcion
            </h2>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/90">
              {point.description}
            </p>
          </section>
        )}

        {/* Confirmaciones + acciones.
            - Icono ojo (matchea el copy "testigos" del label).
            - Counter en estilo muted cuando status='resuelto'; label
              cambia a "testigos cuando estaba activo" para comunicar
              que es historico, no urgencia actual.
            - NO incluye boton de votar (el voto vive en el modal del
              mapa, donde el usuario esta mirando ubicaciones cerca y
              puede juzgar). Aqui solo informa + permite compartir. */}
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

          {point.status === 'resuelto' && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
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
            </div>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleBottomShare}
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
                    <circle cx="18" cy="5" r="3" />
                    <circle cx="6" cy="12" r="3" />
                    <circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  Compartir
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

        {/* Reporte de contenido. Link discreto — no queremos incentivar
            reportes casuales. Cuando 5 IPs unicas reportan el mismo
            punto, el trigger SQL lo oculta automaticamente. Reemplaza
            la moderacion via panel admin. */}
        <ReportContentButton pointId={point.id} />

        {shareAuthorityOpen && (
          <ShareWithAuthority
            point={point}
            onClose={() => setShareAuthorityOpen(false)}
          />
        )}

        {point.photo_url && (
          <PhotoLightbox
            src={point.photo_url}
            alt="Foto ciudadana del reporte"
            open={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
