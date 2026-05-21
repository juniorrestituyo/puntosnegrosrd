'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import { colorForConfirmations } from '@/lib/marker-color';
import type { Point } from '@/lib/types';

type ConfirmResult = { ok: true } | { ok: false; message: string };

interface Props {
  point: Point | null;
  onClose: () => void;
  onConfirm: (id: string) => Promise<ConfirmResult>;
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

  // Reseteamos el estado del boton al cambiar de point.
  useEffect(() => {
    if (point) {
      setConfirmState('idle');
      setConfirmMsg(null);
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

  const isOpen = !!point;
  const p = displayed;
  const accent = p ? colorForConfirmations(p.confirmation_count) : null;

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
        {/* Drag handle visual */}
        <div className="flex justify-center pt-2.5">
          <div className="h-1 w-10 rounded-full bg-surface-border" />
        </div>

        {p && (
          <div className="px-4 pt-3 pb-5">
            <div className="flex items-start gap-3">
              {/* Pin grande con color del marker */}
              {accent && (
                <div
                  className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-2 ring-white"
                  style={{ background: accent.bg }}
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: accent.text }}
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
                <p className="mt-1 text-[10px] font-medium uppercase tracking-[0.16em] text-fg-dim">
                  {STATUS_LABELS[p.status] ?? p.status}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="-mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted hover:bg-surface-border hover:text-fg"
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
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
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

            {/* Contador grande de confirmaciones */}
            <div className="mt-5 flex items-center gap-4 rounded-2xl bg-brand-subtle px-5 py-4 ring-1 ring-brand-soft">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-card">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M7 11V21a1 1 0 0 1-1 1H3v-11h4z" />
                  <path d="M7 11l4-9a3 3 0 0 1 3 0v6h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-3xl font-extrabold leading-none tracking-tight text-fg">
                  {p.confirmation_count}
                </div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
                  {p.confirmation_count === 1
                    ? 'confirmacion'
                    : 'confirmaciones'}
                </div>
              </div>
            </div>

            {/* Acciones grandes lado a lado */}
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={
                  confirmState === 'loading' || confirmState === 'ok'
                }
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-brand px-4 py-3.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand-accent disabled:opacity-70"
              >
                {confirmState === 'ok' ? (
                  <>
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
                    Sumada
                  </>
                ) : (
                  <>
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
                      <path d="M7 11V21a1 1 0 0 1-1 1H3v-11h4z" />
                      <path d="M7 11l4-9a3 3 0 0 1 3 0v6h5a2 2 0 0 1 2 2l-2 7a2 2 0 0 1-2 2H7" />
                    </svg>
                    {confirmState === 'loading'
                      ? 'Confirmando...'
                      : 'Yo tambien lo veo'}
                  </>
                )}
              </button>

              <Link
                href={`/punto/${p.id}`}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-surface-raised px-4 py-3.5 text-sm font-semibold text-fg ring-1 ring-surface-border transition-colors hover:bg-surface-border"
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

            {confirmState === 'err' && confirmMsg && (
              <p className="mt-2 text-center text-[11px] text-red-600">
                {confirmMsg}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
