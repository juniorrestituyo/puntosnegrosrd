'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { RD_BOUNDS } from '@/lib/constants';
import type { Point, PointInput } from '@/lib/types';
import Filters, { DEFAULT_FILTERS, type FilterState } from './Filters';
import ReportFAB from './ReportFAB';
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
type ReportMode = 'idle' | 'select-on-map' | 'getting-location';

interface BannerMessage {
  type: 'info' | 'error';
  text: string;
}

export default function MapClient() {
  const [points, setPoints] = useState<Point[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [reportMode, setReportMode] = useState<ReportMode>('idle');
  const [banner, setBanner] = useState<BannerMessage | null>(null);

  // Carga inicial de puntos
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
    // Solo procesa clicks cuando estamos explicitamente en modo seleccion.
    // En idle, los clicks en el mapa libre se ignoran.
    if (reportMode === 'select-on-map') {
      setSubmitError(null);
      setPicked({ lat, lng });
      setReportMode('idle');
      setBanner(null);
    }
  }

  function handleCancelForm() {
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
      setBanner({ type: 'info', text: 'Reporte publicado. Gracias.' });
      autoDismissBanner();
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

  function autoDismissBanner(ms = 5000) {
    setTimeout(() => {
      setBanner((current) => current);
      setBanner(null);
    }, ms);
  }

  function handleUseCurrentLocation() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setBanner({
        type: 'error',
        text: 'Tu navegador no soporta geolocalizacion. Usa "Seleccionar en el mapa".',
      });
      autoDismissBanner();
      return;
    }

    setReportMode('getting-location');
    setBanner({
      type: 'info',
      text: 'Obteniendo tu ubicacion... acepta el permiso si te lo pide.',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (
          latitude < RD_BOUNDS.minLat ||
          latitude > RD_BOUNDS.maxLat ||
          longitude < RD_BOUNDS.minLng ||
          longitude > RD_BOUNDS.maxLng
        ) {
          setReportMode('idle');
          setBanner({
            type: 'error',
            text: 'Tu ubicacion esta fuera de Republica Dominicana. Usa "Seleccionar en el mapa".',
          });
          autoDismissBanner();
          return;
        }

        setReportMode('idle');
        setBanner(null);
        setSubmitError(null);
        setPicked({ lat: latitude, lng: longitude });
      },
      (err) => {
        setReportMode('idle');
        let text = 'No se pudo obtener tu ubicacion';
        if (err.code === 1) {
          text =
            'Permiso de ubicacion denegado. Activa la ubicacion en tu navegador o usa "Seleccionar en el mapa".';
        } else if (err.code === 2) {
          text =
            'No se pudo determinar tu ubicacion. Intenta seleccionar en el mapa.';
        } else if (err.code === 3) {
          text =
            'Tiempo agotado al buscar tu ubicacion. Intenta de nuevo o selecciona en el mapa.';
        }
        setBanner({ type: 'error', text });
        autoDismissBanner(7000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function handleSelectOnMap() {
    setReportMode('select-on-map');
    setBanner(null);
  }

  function handleCancelSelectMode() {
    setReportMode('idle');
    setBanner(null);
  }

  const fabHidden =
    picked !== null ||
    reportMode === 'select-on-map' ||
    reportMode === 'getting-location';

  return (
    <div className="relative h-full w-full">
      <Map
        points={filteredPoints}
        selectMode={reportMode === 'select-on-map'}
        onMapClick={handleMapClick}
        onConfirm={handleConfirm}
      />

      {/* Banner de modo seleccion */}
      {reportMode === 'select-on-map' && (
        <div className="pointer-events-auto absolute left-3 right-3 top-3 z-[1100] flex items-center justify-between gap-2 rounded-lg bg-brand-accent px-4 py-3 text-sm font-medium text-white shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2">
          <span>Toca el punto exacto donde esta el riesgo</span>
          <button
            type="button"
            onClick={handleCancelSelectMode}
            className="shrink-0 rounded bg-white/20 px-3 py-1 text-xs font-semibold hover:bg-white/30"
          >
            Cancelar
          </button>
        </div>
      )}

      {/* Banner de status / error de geolocation (no aparece junto al de seleccion) */}
      {banner && reportMode !== 'select-on-map' && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto absolute left-3 right-3 top-3 z-[1100] flex items-start justify-between gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md ${
            banner.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-slate-800 text-white'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Cerrar mensaje"
            className="shrink-0 rounded bg-white/20 px-2 py-1 text-xs hover:bg-white/30"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filtros: ocultos en modo seleccion para no chocar con el banner */}
      {reportMode !== 'select-on-map' && (
        <Filters
          state={filters}
          total={points.length}
          shown={filteredPoints.length}
          onChange={setFilters}
        />
      )}

      {/* FAB: oculto cuando el modal esta abierto, en modo seleccion o getting-location */}
      {!fabHidden && (
        <ReportFAB
          onUseCurrentLocation={handleUseCurrentLocation}
          onSelectOnMap={handleSelectOnMap}
        />
      )}

      {/* Modal de reporte */}
      {picked && (
        <ReportForm
          lat={picked.lat}
          lng={picked.lng}
          submitting={submitting}
          serverError={submitError}
          onSubmit={handleSubmit}
          onCancel={handleCancelForm}
        />
      )}

      {/* Contador inferior izquierdo */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[calc(100vw-6rem)] rounded bg-white/95 px-3 py-2 text-xs text-slate-700 shadow ring-1 ring-slate-200 sm:bottom-4 sm:left-4 sm:max-w-none">
        {isFetching
          ? 'Cargando...'
          : points.length === 0
            ? 'Toca el boton + para reportar el primer punto'
            : `${filteredPoints.length} de ${points.length} reporte${points.length === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}
