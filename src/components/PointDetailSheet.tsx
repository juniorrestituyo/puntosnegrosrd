'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import { colorForConfirmations } from '@/lib/marker-color';
import { getIconForPoint } from '@/lib/marker-icons';
import { sharePoint } from '@/lib/share';
import { formatRelativeTime } from '@/lib/time';
import type { Point } from '@/lib/types';

type ConfirmResult = { ok: true } | { ok: false; message: string };
type ResolveResult =
  | { ok: true; resolution_count: number; status: string | null }
  | { ok: false; message: string };

interface Props {
  point: Point | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<ConfirmResult>;
  onResolve: (id: string) => Promise<ResolveResult>;
}

/**
 * Bottom sheet con la info de un reporte. Sube desde abajo con un
 * slide smooth (300ms) cuando hay un point seleccionado y baja al
 * cerrar. Estilo similar al panel de Waze pero anclado abajo.
 */
export default function PointDetailSheet({
  point,
  onClose,
  onConfirm,
  onResolve,
}: Props) {
  // Mantenemos el ultimo point mientras la hoja se desliza hacia abajo,
  // sino se vacia el contenido a mitad de animacion.
  const [displayed, setDisplayed] = useState<Point | null>(point);
  useEffect(() => {
    if (point) setDisplayed(point);
  }, [point]);

  // Estado del boton de confirmacion (local por sesion del sheet).
  const [confirmState, setConfirmState] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);

  // Estado del boton de resolucion comunitaria. Mismo pattern que
  // confirm pero para la accion "yo veo que ya esta resuelto".
  const [resolveState, setResolveState] = useState<
    'idle' | 'loading' | 'ok' | 'err'
  >('idle');
  const [resolveMsg, setResolveMsg] = useState<string | null>(null);

  // Feedback transitorio del boton de compartir cuando caemos al
  // fallback de "copiar al portapapeles" (navegadores sin Web Share API).
  // En mobile (iOS/Android) y en Chrome desktop esto NO se activa
  // porque el OS abre su propio sheet nativo.
  const [linkCopied, setLinkCopied] = useState(false);

  /**
   * Comparte el URL del reporte via sharePoint (Web Share API con
   * fallback a clipboard). Si cayo al clipboard, muestra "Enlace
   * copiado" 2 segundos; si abrio el sheet nativo del OS o el usuario
   * lo cerro, no muestra nada.
   */
  async function handleShareLink() {
    if (!displayed) return;
    const result = await sharePoint(displayed, window.location.origin);
    if (result.type === 'copied') {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  }

  // Reseteamos el estado de los botones al cambiar de point.
  useEffect(() => {
    if (point) {
      setConfirmState('idle');
      setConfirmMsg(null);
      setResolveState('idle');
      setResolveMsg(null);
    }
  }, [point?.id]);

  // Cerrar con Escape
  useEffect(() => {
    if (!point) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [point, onClose]);

  async function handleConfirm() {
    if (!displayed) return;
    setConfirmState('loading');
    setConfirmMsg(null);
    const res = await onConfirm(displayed.id);
    if (res.ok) {
      setConfirmState('ok');
    } else {
      setConfirmState('err');
      setConfirmMsg(res.message);
    }
  }

  async function handleResolve() {
    if (!displayed) return;
    setResolveState('loading');
    setResolveMsg(null);
    const res = await onResolve(displayed.id);
    if (res.ok) {
      setResolveState('ok');
    } else {
      setResolveState('err');
      setResolveMsg(res.message);
    }
  }

  const isOpen = !!point;
  const p = displayed;
  const accent = p ? colorForConfirmations(p.confirmation_count) : null;
  const iconData = p ? getIconForPoint(p) : null;
  const isResolved = p?.status === 'resuelto';

  return (
    <div
      role="dialog"
      aria-hidden={!isOpen}
      aria-label="Detalle del reporte"
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-[1500] transform transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div
        className="pointer-events-auto mx-auto w-full max-w-md rounded-t-2xl bg-surface-card shadow-float ring-1 ring-surface-border"
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 12px)',
        }}
      >
        {p && (
          <div className="px-4 pt-3 pb-5">
            <div className="flex items-start gap-3">
              {/* Pin grande con color del marker + icono de la
                  subcategoria — abarca verticalmente titulo + subtitulo
                  + estado. Pin: 56px (h-14 w-14). Icono escalado por
                  56/34 (diametro del circulo del marker en el mapa)
                  para mantener misma proporcion icono/circulo. */}
              {accent && iconData && (
                <div
                  className="mt-0.5 flex h-14 w-14 shrink-0 items-center justify-center rounded-full ring-2 ring-white"
                  style={{ background: accent.bg }}
                >
                  <img
                    src={iconData.url}
                    alt=""
                    draggable={false}
                    style={{
                      width: `${Math.round((iconData.size * 56) / 34)}px`,
                      height: `${Math.round((iconData.size * 56) / 34)}px`,
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-bold tracking-tight text-fg">
                  {CATEGORIES[p.category].label}
                </h3>
                {p.subcategory && (
                  <p className="mt-0.5 truncate text-xs text-fg-muted">
                    {p.subcategory}
                  </p>
                )}
                {/* Cuando status==='nuevo' mostramos tiempo relativo
                    en vez del label estatico "Nuevo" — comunica
                    frescura del reporte (recien vs hace semanas) sin
                    consumir espacio adicional. Para otros estados
                    (en_proceso, resuelto) sigue mostrando el label
                    porque ahi importa el estado, no la antiguedad. */}
                <p
                  suppressHydrationWarning
                  className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-fg-dim"
                >
                  {p.status === 'nuevo'
                    ? formatRelativeTime(p.created_at)
                    : (STATUS_LABELS[p.status] ?? p.status)}
                </p>
              </div>

              {/* Cluster de botones de header: compartir + cerrar.
                  Juntos en un sub-flex con gap-1.5 (6px) — se leen como
                  un solo grupo de controles, separados ~12px del titulo
                  via el gap-3 del flex padre. */}
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareLink}
                  aria-label={
                    linkCopied ? 'Enlace copiado' : 'Compartir enlace'
                  }
                  title={linkCopied ? 'Enlace copiado' : 'Compartir enlace'}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition-colors ${
                    linkCopied
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg'
                  }`}
                >
                  {linkCopied ? (
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

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg"
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
              </div>
            </div>

            {p.photo_url && (
              <Link
                href={`/punto/${p.id}`}
                className="mt-3 block overflow-hidden rounded-lg"
              >
                <img
                  src={p.photo_url}
                  alt="Foto del reporte"
                  className="h-28 w-full object-cover"
                  loading="lazy"
                />
              </Link>
            )}

            <p className="mt-3 line-clamp-3 text-sm leading-snug text-fg/90">
              {p.description}
            </p>

            {/* Contador de confirmaciones.
                - Cuando el punto esta abierto: estilo brand-azul, contador
                  prominente — comunica "X testigos activos, atencion".
                - Cuando esta resuelto: estilo muted (gris), label cambia
                  a "testigos cuando estaba activo" — comunica que la cifra
                  es historica, no urgencia actual. Mantiene transparencia
                  (los datos siguen visibles) sin contradecir el estado
                  resuelto del punto.
                Icono cambiado de thumbs-up a ojo: matchea el copy del
                boton ("Yo tambien lo veo") y evita la connotacion de
                "upvote" que el pulgar implica. */}
            <div
              className={`mt-5 flex items-center gap-4 rounded-2xl px-5 py-4 ring-1 ${
                isResolved
                  ? 'bg-surface-raised ring-surface-border'
                  : 'bg-brand-subtle ring-brand-soft'
              }`}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-card ${
                  isResolved
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
                    isResolved ? 'text-fg-muted' : 'text-fg'
                  }`}
                >
                  {p.confirmation_count}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  {isResolved
                    ? p.confirmation_count === 1
                      ? 'testigo cuando estaba activo'
                      : 'testigos cuando estaba activo'
                    : p.confirmation_count === 1
                      ? 'confirmacion'
                      : 'confirmaciones'}
                </div>
              </div>
            </div>

            {/* Layout cuando el punto NO esta resuelto:
                  Row 1 (binario sin iconos): [Sigue ahi] [No esta ahi]
                  Row 2 (full width con flecha): [Ver detalle →]
                Asi se separa "votar" de "navegar a detalle", y se
                evita la ambiguedad del icono verde checkmark que se
                leia como badge de estado.
                Cuando esta resuelto: badge informativo + Ver detalle. */}
            {isResolved ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-200">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
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
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-900">
                      Este punto fue marcado como resuelto
                    </p>
                    {p.resolution_count > 0 && (
                      <p className="text-xs text-emerald-700">
                        {p.resolution_count} confirmacion
                        {p.resolution_count === 1 ? '' : 'es'} de resolucion
                        ciudadana
                      </p>
                    )}
                  </div>
                </div>

                <Link
                  href={`/punto/${p.id}`}
                  className="flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-raised px-4 py-3 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
                >
                  Ver detalle
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
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </div>
            ) : (
              <>
                {/* Row 1: par binario de voto, sin iconos. */}
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={
                      confirmState === 'loading' || confirmState === 'ok'
                    }
                    className="flex flex-1 items-center justify-center rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent disabled:opacity-70"
                  >
                    {confirmState === 'ok'
                      ? 'Voto sumado'
                      : confirmState === 'loading'
                        ? 'Confirmando...'
                        : 'Sigue ahi'}
                  </button>

                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={
                      resolveState === 'loading' || resolveState === 'ok'
                    }
                    className="flex flex-1 items-center justify-center rounded-full bg-surface-raised px-4 py-3.5 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border disabled:opacity-70"
                  >
                    {resolveState === 'ok'
                      ? 'Voto sumado'
                      : resolveState === 'loading'
                        ? 'Registrando...'
                        : 'No esta ahi'}
                  </button>
                </div>

                {/* Errores de cualquiera de las dos acciones (se
                    apilan si por algun motivo ambas fallan). */}
                {confirmState === 'err' && confirmMsg && (
                  <p className="mt-2 text-center text-[11px] text-red-600">
                    {confirmMsg}
                  </p>
                )}
                {resolveState === 'err' && resolveMsg && (
                  <p className="mt-2 text-center text-[11px] text-red-600">
                    {resolveMsg}
                  </p>
                )}

                {/* Contador de votos "ya no esta" si los hay. Solo
                    se muestra antes de que el usuario actual vote. */}
                {p.resolution_count > 0 && resolveState !== 'ok' && (
                  <p className="mt-2 text-center text-[10px] text-fg-muted">
                    {p.resolution_count} persona
                    {p.resolution_count === 1 ? '' : 's'} dice
                    {p.resolution_count === 1 ? '' : 'n'} que ya no esta
                  </p>
                )}

                {/* Row 2: navegacion a detalle, full width debajo de
                    la fila de voto. mt-3 = mismo gap que el gap-3
                    entre los dos botones de arriba. */}
                <Link
                  href={`/punto/${p.id}`}
                  className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-surface-raised px-4 py-3.5 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
                >
                  Ver detalle
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
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
