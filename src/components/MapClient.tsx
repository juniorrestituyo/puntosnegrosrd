'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { RD_BOUNDS, RD_CENTER, RD_DEFAULT_ZOOM } from '@/lib/constants';
import { loadMapState, saveMapState } from '@/lib/map-state-cache';
import type { Point, PointInput, UserLocation } from '@/lib/types';
import FilterPanel, {
  DEFAULT_FILTERS,
  type FilterState,
} from './FilterPanel';
import PointDetailSheet from './PointDetailSheet';
import ReportFAB from './ReportFAB';
import ReportForm from './ReportForm';
import SideDrawer from './SideDrawer';
import UserLocationButton from './UserLocationButton';

const Map = dynamic(() => import('./Map'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-surface-raised">
      <p className="text-sm text-fg-muted">Cargando mapa...</p>
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
  // Lee el cache UNA VEZ al montar para hidratar el estado inicial.
  // Si no hay cache valido (primer load o expirado), arranca con
  // defaults vacios y la posicion estandar del mapa.
  const cached = useMemo(() => loadMapState(), []);

  const [points, setPoints] = useState<Point[]>(cached?.points ?? []);
  const [isFetching, setIsFetching] = useState(!cached);
  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [reportMode, setReportMode] = useState<ReportMode>('idle');
  const [banner, setBanner] = useState<BannerMessage | null>(null);

  const [userLocation, setUserLocation] = useState<UserLocation | null>(
    cached?.userLocation ?? null
  );
  // Tracking arranca en true: queremos auto-focus en la ubicacion del
  // usuario al entrar al mapa. Si rechaza el permiso, el handler de
  // error lo regresa a false y muestra un banner.
  const [isTrackingLocation, setIsTrackingLocation] = useState(true);
  const [isAcquiringLocation, setIsAcquiringLocation] = useState(false);

  // Punto seleccionado para mostrar el bottom sheet con su detalle.
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);

  // Camara del mapa (center + zoom). Inicial desde cache si hay,
  // sino los defaults. Se actualiza desde Map via onCameraChange.
  // Usamos ref en vez de state para no re-renderizar al panear (cada
  // moveend dispararia un setState innecesario en el padre).
  const cameraRef = useRef<{ center: [number, number]; zoom: number }>({
    center: cached?.center ?? RD_CENTER,
    zoom: cached?.zoom ?? RD_DEFAULT_ZOOM,
  });

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

  useEffect(() => {
    if (!isTrackingLocation) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setBanner({
        type: 'error',
        text: 'Tu navegador no soporta geolocalizacion.',
      });
      autoDismissBanner();
      setIsTrackingLocation(false);
      return;
    }

    setIsAcquiringLocation(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setIsAcquiringLocation(false);
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (err) => {
        setIsAcquiringLocation(false);
        setIsTrackingLocation(false);
        let text = 'No se pudo obtener tu ubicacion';
        if (err.code === 1) {
          text =
            'Permiso de ubicacion denegado. Activalo desde el icono del candado en la barra de direcciones.';
        } else if (err.code === 2) {
          text = 'No se pudo determinar tu ubicacion.';
        } else if (err.code === 3) {
          text = 'Tiempo agotado al buscar tu ubicacion.';
        }
        setBanner({ type: 'error', text });
        autoDismissBanner(7000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTrackingLocation]);

  function toggleLocationTracking() {
    if (isTrackingLocation) {
      setIsTrackingLocation(false);
      setUserLocation(null);
      setIsAcquiringLocation(false);
      setBanner(null);
    } else {
      setIsTrackingLocation(true);
    }
  }

  const filteredPoints = useMemo(() => {
    return points.filter(
      (p) =>
        filters.categories.has(p.category) &&
        p.confirmation_count >= filters.minConfirmations
    );
  }, [points, filters]);

  function handleMapClick(lat: number, lng: number) {
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
        // El bottom sheet tiene su propia copia del point — sincronizamos
        // si es el que esta abierto.
        setSelectedPoint((prev) =>
          prev && prev.id === pointId
            ? { ...prev, confirmation_count: newCount }
            : prev
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
      setBanner(null);
    }, ms);
  }

  // Handler que Map nos pasa cuando el usuario panea/zoomea.
  // Actualiza la camera en el ref y guarda el snapshot del mapa.
  const handleCameraChange = useCallback(
    (center: [number, number], zoom: number) => {
      cameraRef.current = { center, zoom };
      saveMapState({
        points,
        userLocation,
        center,
        zoom,
      });
    },
    [points, userLocation]
  );

  // Snapshot al cache cada vez que cambian points o userLocation.
  // La camera se guarda en handleCameraChange (asociada a moveend).
  useEffect(() => {
    saveMapState({
      points,
      userLocation,
      center: cameraRef.current.center,
      zoom: cameraRef.current.zoom,
    });
  }, [points, userLocation]);

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

  // Estados en los que escondemos todo el "chrome" flotante (FAB, locate,
  // hamburger, filtros) para enfocar la atencion en lo que esta abierto.
  const chromeHidden =
    picked !== null ||
    reportMode === 'select-on-map' ||
    reportMode === 'getting-location' ||
    selectedPoint !== null;

  return (
    <div className="relative h-screen w-full bg-surface-base">
      <Map
        points={filteredPoints}
        selectMode={reportMode === 'select-on-map'}
        userLocation={userLocation}
        spotlightPoint={selectedPoint}
        initialCenter={cameraRef.current.center}
        initialZoom={cameraRef.current.zoom}
        skipInitialAutoCenter={!!cached}
        onMapClick={handleMapClick}
        onPointSelect={setSelectedPoint}
        onBackgroundClick={() => setSelectedPoint(null)}
        onCameraChange={handleCameraChange}
      />

      <PointDetailSheet
        point={selectedPoint}
        onClose={() => setSelectedPoint(null)}
        onConfirm={handleConfirm}
      />

      {/* Hamburger y filtros: en estados focales NO desaparecen.
          - `isolate` crea un stacking context para que el spotlight
            del mapa (z-800 dentro del leaflet container) paint POR
            ENCIMA de estos botones y los oscurezca visualmente.
            Sin isolate, los botones a z-1000/1100 fixed irian arriba
            del spotlight y no se veria el efecto "debajo del sombreado".
          - opacity-70 + pointer-events-none los marca como inactivos
            sin perder visibilidad. */}
      <div
        className={`transition-opacity duration-300 ${
          chromeHidden
            ? 'pointer-events-none isolate opacity-70'
            : 'opacity-100'
        }`}
      >
        <SideDrawer current="mapa" />
      </div>

      <div
        className={`transition-opacity duration-300 ${
          chromeHidden
            ? 'pointer-events-none isolate opacity-70'
            : 'opacity-100'
        }`}
      >
        <FilterPanel
          state={filters}
          total={points.length}
          shown={filteredPoints.length}
          onChange={setFilters}
        />
      </div>

      {/* Banner de modo seleccion */}
      {reportMode === 'select-on-map' && (
        <div className="pointer-events-auto absolute left-3 right-3 top-[4.25rem] z-[1095] flex items-center justify-between gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-float sm:left-1/2 sm:right-auto sm:top-[5rem] sm:-translate-x-1/2 sm:max-w-md">
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

      {/* Banner de status */}
      {banner && reportMode !== 'select-on-map' && (
        <div
          role={banner.type === 'error' ? 'alert' : 'status'}
          className={`pointer-events-auto absolute left-3 right-3 top-[4.25rem] z-[1095] flex items-start justify-between gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-float sm:left-1/2 sm:right-auto sm:top-[5rem] sm:-translate-x-1/2 sm:max-w-md ${
            banner.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-surface-card text-fg ring-1 ring-surface-border'
          }`}
        >
          <span>{banner.text}</span>
          <button
            type="button"
            onClick={() => setBanner(null)}
            aria-label="Cerrar mensaje"
            className={`shrink-0 rounded px-2 py-1 text-xs ${
              banner.type === 'error'
                ? 'bg-white/20 hover:bg-white/30'
                : 'bg-surface-raised hover:bg-surface-border'
            }`}
          >
            ✕
          </button>
        </div>
      )}

      {!chromeHidden && (
        <UserLocationButton
          isTracking={isTrackingLocation}
          isLoading={isAcquiringLocation}
          onToggle={toggleLocationTracking}
        />
      )}

      {!chromeHidden && (
        <ReportFAB
          onUseCurrentLocation={handleUseCurrentLocation}
          onSelectOnMap={handleSelectOnMap}
        />
      )}

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

      {/* Pill inferior con contador */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] max-w-[calc(100vw-6rem)] rounded-full bg-surface-card/95 px-4 py-2 text-xs font-medium text-fg shadow-float ring-1 ring-surface-border sm:bottom-4 sm:left-4 sm:max-w-none">
        {isFetching
          ? 'Cargando...'
          : points.length === 0
            ? 'Toca el boton + para reportar el primer punto'
            : `${filteredPoints.length} de ${points.length} reporte${points.length === 1 ? '' : 's'}`}
      </div>
    </div>
  );
}
