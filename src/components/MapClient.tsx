'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Point, PointInput } from '@/lib/types';
import Filters, { DEFAULT_FILTERS, type FilterState } from './Filters';
import ReportForm from './ReportForm';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-slate-100">
      <p className="text-sm text-slate-500">Cargando mapa...</p>
    </div>
  ),
});

type ConfirmResult = { ok: true } | { ok: false; message: string };

export default function MapClient() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/points', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        if (json.ok) {
          setPoints(json.data);
        } else {
          console.error('GET /api/points error:', json.error);
        }
      } catch (e) {
        if (!cancelled) console.error('Fetch points fallo:', e);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPoints = useMemo(() => {
    return points.filter(
      (p) =>
        filters.categories.has(p.category) &&
        p.confirmation_count >= filters.minConfirmations
    );
  }, [points, filters]);

  function handleMapClick(lat: number, lng: number) {
    setSubmitError(null);
    setPicked({ lat, lng });
  }

  function handleCancel() {
    setPicked(null);
    setSubmitError(null);
  }

  async function handleSubmit(input: PointInput) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const json = await res.json();
      if (!json.ok) {
        setSubmitError(json.error?.message ?? 'No se pudo guardar el reporte');
        return;
      }
      setPoints((prev) => [json.data as Point, ...prev]);
      setPicked(null);
    } catch (e) {
      console.error('POST /api/points fallo:', e);
      setSubmitError('Error de red. Revisa tu conexion.');
    } finally {
      setSubmitting(false);
    }
  }

  const handleConfirm = useCallback(
    async (pointId: string): Promise<ConfirmResult> => {
      try {
        const res = await fetch(`/api/points/${pointId}/confirm`, {
          method: 'POST',
        });
        const json = await res.json();
        if (!json.ok) {
          return {
            ok: false,
            message: json.error?.message ?? 'No se pudo confirmar',
          };
        }
        const newCount = json.data?.confirmation_count as number;
        setPoints((prev) =>
          prev.map((p) =>
            p.id === pointId ? { ...p, confirmation_count: newCount } : p
          )
        );
        return { ok: true };
      } catch (e) {
        console.error('POST confirm fallo:', e);
        return { ok: false, message: 'Error de red' };
      }
    },
    []
  );

  return (
    <div className="relative h-full w-full">
      <Map
        points={filteredPoints}
        onMapClick={handleMapClick}
        onConfirm={handleConfirm}
      />

      <Filters
        state={filters}
        total={points.length}
        shown={filteredPoints.length}
        onChange={setFilters}
      />

      {picked && (
        <ReportForm
          lat={picked.lat}
          lng={picked.lng}
          submitting={submitting}
          serverError={submitError}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[calc(100vw-7rem)] rounded bg-white/95 px-3 py-2 text-xs text-slate-700 shadow ring-1 ring-slate-200 sm:bottom-4 sm:left-4 sm:max-w-none">
        {isFetching
          ? 'Cargando...'
          : points.length === 0
            ? 'Toca el mapa para reportar'
            : `${filteredPoints.length} de ${points.length} reporte${points.length === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}
