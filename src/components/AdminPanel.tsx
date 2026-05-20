'use client';

import { useCallback, useEffect, useState } from 'react';

import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';
import type { PointStatus } from '@/lib/types';

interface AdminPoint {
  id: string;
  lat: number;
  lng: number;
  category: keyof typeof CATEGORIES;
  subcategory: string | null;
  description: string;
  status: PointStatus;
  is_visible: boolean;
  created_at: string;
}

const SECRET_STORAGE_KEY = 'pnrd_admin_secret';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPanel() {
  const [secret, setSecret] = useState<string | null>(null);
  const [secretInput, setSecretInput] = useState('');
  const [points, setPoints] = useState<AdminPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recuperar secret de localStorage al montar
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(SECRET_STORAGE_KEY);
    if (stored) setSecret(stored);
  }, []);

  const loadPoints = useCallback(
    async (s: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/points', {
          headers: { 'x-admin-secret': s },
          cache: 'no-store',
        });
        const json = await res.json();
        if (!json.ok) {
          setError(json.error?.message ?? 'Error al cargar');
          if (res.status === 401) {
            window.localStorage.removeItem(SECRET_STORAGE_KEY);
            setSecret(null);
          }
          return;
        }
        setPoints(json.data as AdminPoint[]);
      } catch (e) {
        console.error('Admin load failed:', e);
        setError('Error de red');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (secret) loadPoints(secret);
  }, [secret, loadPoints]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!secretInput.trim()) return;
    window.localStorage.setItem(SECRET_STORAGE_KEY, secretInput);
    setSecret(secretInput);
    setSecretInput('');
  }

  function handleLogout() {
    window.localStorage.removeItem(SECRET_STORAGE_KEY);
    setSecret(null);
    setPoints([]);
  }

  async function toggleVisibility(id: string, current: boolean) {
    if (!secret) return;
    const res = await fetch(`/api/admin/points/${id}/visibility`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ is_visible: !current }),
    });
    const json = await res.json();
    if (json.ok) {
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_visible: !current } : p))
      );
    } else {
      alert(json.error?.message ?? 'Error');
    }
  }

  async function changeStatus(
    id: string,
    newStatus: PointStatus,
    note: string
  ) {
    if (!secret) return;
    const res = await fetch(`/api/admin/points/${id}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': secret,
      },
      body: JSON.stringify({ status: newStatus, note: note || undefined }),
    });
    const json = await res.json();
    if (json.ok) {
      setPoints((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
      );
    } else {
      alert(json.error?.message ?? 'Error');
    }
  }

  // Pantalla de login
  if (!secret) {
    return (
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <h1 className="text-2xl font-bold tracking-tight text-brand">
          Admin PuntosNegrosRD
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Ingresa el secreto de administrador para continuar.
        </p>
        <form
          onSubmit={handleLogin}
          className="mt-6 w-full space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <input
            type="password"
            value={secretInput}
            onChange={(e) => setSecretInput(e.target.value)}
            placeholder="ADMIN_SECRET"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-brand-accent focus:outline-none"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded bg-brand-accent px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Entrar
          </button>
        </form>
        <p className="mt-4 text-xs text-slate-500">
          El secreto se guarda en localStorage de este navegador. Cierra
          sesion para borrarlo.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-brand">
          Admin PuntosNegrosRD
        </h1>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs text-slate-600 hover:text-brand hover:underline"
        >
          Cerrar sesion
        </button>
      </header>

      {loading && (
        <p className="text-sm text-slate-500">Cargando puntos...</p>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <p className="mb-3 text-sm text-slate-600">
            {points.length} punto{points.length === 1 ? '' : 's'} en total
            ({points.filter((p) => !p.is_visible).length} ocultos).
          </p>
          <div className="space-y-3">
            {points.map((p) => (
              <AdminRow
                key={p.id}
                point={p}
                onToggleVisibility={() =>
                  toggleVisibility(p.id, p.is_visible)
                }
                onChangeStatus={(s, n) => changeStatus(p.id, s, n)}
              />
            ))}
          </div>
        </>
      )}
    </main>
  );
}

function AdminRow({
  point,
  onToggleVisibility,
  onChangeStatus,
}: {
  point: AdminPoint;
  onToggleVisibility: () => void;
  onChangeStatus: (s: PointStatus, note: string) => Promise<void>;
}) {
  const [statusEditing, setStatusEditing] = useState(false);
  const [newStatus, setNewStatus] = useState<PointStatus>(point.status);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmitStatus(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onChangeStatus(newStatus, note);
    setStatusEditing(false);
    setNote('');
    setSubmitting(false);
  }

  return (
    <div
      className={`rounded-lg border p-4 ${
        point.is_visible
          ? 'border-slate-200 bg-white'
          : 'border-slate-300 bg-slate-100'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-brand">
              {CATEGORIES[point.category].label}
            </span>
            {point.subcategory && (
              <span className="text-xs text-slate-600">
                - {point.subcategory}
              </span>
            )}
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-700">
              {STATUS_LABELS[point.status] ?? point.status}
            </span>
            {!point.is_visible && (
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                Oculto
              </span>
            )}
          </div>
          <p className="mt-2 text-sm text-slate-700">{point.description}</p>
          <p className="mt-1 text-xs text-slate-500">
            {point.lat.toFixed(5)}, {point.lng.toFixed(5)} -{' '}
            {formatDate(point.created_at)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onToggleVisibility}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {point.is_visible ? 'Ocultar' : 'Mostrar'}
        </button>
        <button
          type="button"
          onClick={() => setStatusEditing((v) => !v)}
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          {statusEditing ? 'Cancelar' : 'Cambiar estado'}
        </button>
        <a
          href={`/punto/${point.id}`}
          target="_blank"
          rel="noreferrer"
          className="rounded border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver detalle
        </a>
      </div>

      {statusEditing && (
        <form
          onSubmit={handleSubmitStatus}
          className="mt-3 space-y-2 rounded border border-slate-200 bg-slate-50 p-3"
        >
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Nuevo estado
            </span>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as PointStatus)}
              className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm"
            >
              {(Object.entries(STATUS_LABELS) as [PointStatus, string][]).map(
                ([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-700">
              Nota (opcional)
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: notificado via correo a junta municipal"
              className="mt-1 block w-full rounded border border-slate-300 px-2 py-1 text-sm"
              maxLength={500}
            />
          </label>
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-brand-accent px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {submitting ? 'Guardando...' : 'Aplicar'}
          </button>
        </form>
      )}
    </div>
  );
}
