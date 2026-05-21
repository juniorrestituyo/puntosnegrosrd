'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import {
  CATEGORIES,
  RD_BOUNDS,
  RD_CENTER,
  RD_DEFAULT_ZOOM,
  STATUS_LABELS,
} from '@/lib/constants';
import { colorForConfirmations } from '@/lib/marker-color';
import type { Point, UserLocation } from '@/lib/types';

type ConfirmResult = { ok: true } | { ok: false; message: string };

// Por debajo de este zoom mostramos solo un dot pequeno (vista regional).
// Por encima, teardrop completo con badge de confirmaciones.
const FAR_ZOOM_THRESHOLD = 15;

type MarkerMode = 'dot' | 'teardrop';

/**
 * Dot compacto para vista lejana (pais/region). Solo color de votos +
 * anillo blanco. Sin numero ni cola — la prioridad es que no se aplasten.
 */
function buildDotIcon(point: Point): L.DivIcon {
  const c = colorForConfirmations(point.confirmation_count);
  return L.divIcon({
    className: 'pn-marker',
    html: `<div class="pn-marker-inner" style="width:12px;height:12px;border-radius:50%;background:${c.bg};border:2px solid #ffffff;box-shadow:0 1px 3px rgba(15,23,42,0.35);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    popupAnchor: [0, -6],
  });
}

/**
 * Marker teardrop coloreado segun cantidad de confirmaciones.
 * Punto blanco central (identifica reporte) + badge circular pequeno
 * en la esquina superior derecha cuando hay votos.
 */
function buildTeardropIcon(point: Point): L.DivIcon {
  const c = colorForConfirmations(point.confirmation_count);
  const hasVotes = point.confirmation_count > 0;

  // Dimensiones: contenedor 28x36, viewBox SVG 32x42 (escala interna).
  // Centro del bulbo cae aprox en (14, 14) del container.
  const center = `<span style="position:absolute;top:8px;left:8px;width:12px;height:12px;border-radius:50%;background:${c.text};"></span>`;

  // Cap visual en "99+" para mantener forma circular incluso con 3 digitos.
  const display =
    point.confirmation_count > 99 ? '99+' : String(point.confirmation_count);
  const fontSize =
    display.length >= 3 ? 6.5 : display.length === 2 ? 8.5 : 10;

  const badge = hasVotes
    ? `<span style="position:absolute;top:-3px;right:-3px;width:14px;height:14px;border-radius:50%;background:${c.bg};border:2px solid #ffffff;box-shadow:0 1px 2px rgba(15,23,42,0.35);display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;font-size:${fontSize}px;font-weight:800;color:${c.text};line-height:1;">${display}</span>`
    : '';

  return L.divIcon({
    className: 'pn-marker',
    html: `
      <div class="pn-marker-inner" style="position:relative;width:28px;height:36px;filter:drop-shadow(0 2px 4px rgba(15,23,42,0.25));">
        <svg viewBox="0 0 32 42" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0 C7.16 0 0 7.16 0 16 C0 25 16 42 16 42 C16 42 32 25 32 16 C32 7.16 24.84 0 16 0 Z" fill="${c.bg}" stroke="${c.border}" stroke-width="1.5"/>
        </svg>
        ${center}
        ${badge}
      </div>
    `,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function buildMarkerIcon(point: Point, mode: MarkerMode): L.DivIcon {
  return mode === 'dot' ? buildDotIcon(point) : buildTeardropIcon(point);
}

const UserLocationIcon = L.divIcon({
  className: 'pn-user-marker',
  html: `
    <div style="
      width:20px;
      height:20px;
      border-radius:50%;
      background:#2563eb;
      border:3px solid #ffffff;
      box-shadow:0 0 0 1px rgba(15,23,42,0.3), 0 0 14px rgba(37,99,235,0.55);
    "></div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

function CenterOnUserLocation({
  userLocation,
}: {
  userLocation: UserLocation | null;
}) {
  const map = useMap();
  const centeredOnceRef = useRef(false);

  useEffect(() => {
    if (!userLocation) {
      centeredOnceRef.current = false;
      return;
    }
    if (!centeredOnceRef.current) {
      map.flyTo([userLocation.lat, userLocation.lng], 15, { duration: 0.8 });
      centeredOnceRef.current = true;
    }
  }, [userLocation, map]);

  return null;
}

function ClickCapture({
  onPick,
  enabled,
}: {
  onPick: (lat: number, lng: number) => void;
  enabled: boolean;
}) {
  useMapEvents({
    click(e) {
      if (!enabled) return;
      const { lat, lng } = e.latlng;
      if (
        lat >= RD_BOUNDS.minLat &&
        lat <= RD_BOUNDS.maxLat &&
        lng >= RD_BOUNDS.minLng &&
        lng <= RD_BOUNDS.maxLng
      ) {
        onPick(lat, lng);
      }
    },
  });
  return null;
}

/**
 * Reporta el zoom actual del mapa al padre cada vez que cambia.
 * Permite cambiar la forma del marker (dot vs teardrop) segun el nivel.
 */
function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  const map = useMap();
  useEffect(() => {
    onZoom(map.getZoom());
  }, [map, onZoom]);
  useMapEvents({
    zoomend(e) {
      onZoom(e.target.getZoom());
    },
  });
  return null;
}

function PointPopup({
  point,
  onConfirm,
}: {
  point: Point;
  onConfirm: (id: string) => Promise<ConfirmResult>;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'ok' | 'err'>(
    'idle'
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setState('loading');
    setMessage(null);
    const res = await onConfirm(point.id);
    if (res.ok) {
      setState('ok');
    } else {
      setState('err');
      setMessage(res.message);
    }
  }

  return (
    <div className="min-w-[220px] space-y-2 text-xs">
      <div>
        <div className="text-sm font-semibold text-fg">
          {CATEGORIES[point.category].label}
        </div>
        {point.subcategory && (
          <div className="text-[11px] text-fg-muted">
            {point.subcategory}
          </div>
        )}
      </div>

      {point.photo_url && (
        <a
          href={`/punto/${point.id}`}
          className="block overflow-hidden rounded-md"
        >
          <img
            src={point.photo_url}
            alt="Foto del reporte"
            className="h-24 w-full object-cover"
            loading="lazy"
          />
        </a>
      )}

      <div className="text-fg/90">{point.description}</div>

      <div className="flex items-center gap-2 text-[10px] text-fg-muted">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 font-semibold text-brand">
          {point.confirmation_count}{' '}
          confirmacion{point.confirmation_count === 1 ? '' : 'es'}
        </span>
        <span>{STATUS_LABELS[point.status] ?? point.status}</span>
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-surface-border pt-2">
        {state === 'ok' && (
          <span className="text-[11px] font-medium text-emerald-600">
            ✓ Sumada
          </span>
        )}
        {state === 'err' && (
          <span className="text-[11px] text-red-600">{message}</span>
        )}
        {(state === 'idle' || state === 'loading') && (
          <button
            type="button"
            onClick={handleClick}
            disabled={state === 'loading'}
            className="rounded-md bg-brand px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-brand-accent disabled:opacity-50"
          >
            {state === 'loading' ? 'Confirmando...' : 'Yo tambien lo veo'}
          </button>
        )}

        <Link
          href={`/punto/${point.id}`}
          className="text-[11px] font-medium text-brand hover:underline"
        >
          Detalle &rarr;
        </Link>
      </div>
    </div>
  );
}

/**
 * Marker que al clic hace pan al punto sin cambiar el zoom del usuario.
 * Solo centra el viewport en el marker para que el popup quede visible.
 */
function FocusableMarker({
  point,
  onConfirm,
  zoom,
}: {
  point: Point;
  onConfirm: (id: string) => Promise<ConfirmResult>;
  zoom: number;
}) {
  const map = useMap();
  const mode: MarkerMode =
    zoom < FAR_ZOOM_THRESHOLD ? 'dot' : 'teardrop';
  // Solo reconstruimos el icono cuando cambia el modo o la cantidad de
  // votos. Asi los pasos de zoom intermedios no recrean el DOM del
  // marker (lo que evitaria la animacion fade-in y haria flickeo).
  const icon = useMemo(
    () => buildMarkerIcon(point, mode),
    [point.confirmation_count, mode]
  );
  return (
    <Marker
      position={[point.lat, point.lng]}
      icon={icon}
      eventHandlers={{
        click: () => {
          map.panTo([point.lat, point.lng], { animate: true, duration: 0.6 });
        },
      }}
    >
      <Popup autoPan={false}>
        <PointPopup point={point} onConfirm={onConfirm} />
      </Popup>
    </Marker>
  );
}

interface MapProps {
  points: Point[];
  selectMode: boolean;
  userLocation: UserLocation | null;
  onMapClick: (lat: number, lng: number) => void;
  onConfirm: (id: string) => Promise<ConfirmResult>;
}

export default function Map({
  points,
  selectMode,
  userLocation,
  onMapClick,
  onConfirm,
}: MapProps) {
  const [zoom, setZoom] = useState(RD_DEFAULT_ZOOM);

  return (
    <MapContainer
      center={RD_CENTER}
      zoom={RD_DEFAULT_ZOOM}
      scrollWheelZoom
      className={`h-full w-full ${selectMode ? 'cursor-crosshair' : ''}`}
      zoomControl={false}
    >
      {/* Tiles light de CartoDB Positron (datos OSM, render claro minimalista) */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <ClickCapture onPick={onMapClick} enabled={selectMode} />
      <ZoomTracker onZoom={setZoom} />
      <CenterOnUserLocation userLocation={userLocation} />

      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={Math.max(userLocation.accuracy, 10)}
            pathOptions={{
              color: '#2563eb',
              weight: 1,
              fillColor: '#3b82f6',
              fillOpacity: 0.12,
            }}
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={UserLocationIcon}
            zIndexOffset={1000}
            interactive={false}
            keyboard={false}
          />
        </>
      )}

      {points.map((p) => (
        <FocusableMarker
          key={p.id}
          point={p}
          onConfirm={onConfirm}
          zoom={zoom}
        />
      ))}
    </MapContainer>
  );
}
