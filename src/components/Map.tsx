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

function buildMarkerIcon(count: number): L.DivIcon {
  const c = colorForConfirmations(count);
  const display = count > 0 ? String(count) : '·';
  return L.divIcon({
    className: 'pn-marker',
    html: `
      <div style="
        background:${c.bg};
        border:2px solid ${c.border};
        color:${c.text};
        width:40px;
        height:40px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:14px;
        font-family:system-ui,sans-serif;
        box-shadow:0 2px 4px rgba(0,0,0,0.3);
      ">${display}</div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

// "Blue dot" del usuario estilo Google Maps. Sin numero, sin popup,
// con un halo azul para distinguirlo de los markers de reportes.
const UserLocationIcon = L.divIcon({
  className: 'pn-user-marker',
  html: `
    <div style="
      width:18px;
      height:18px;
      border-radius:50%;
      background:#2563eb;
      border:3px solid #ffffff;
      box-shadow:0 0 0 1px rgba(15,23,42,0.4), 0 0 14px rgba(37,99,235,0.55);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  popupAnchor: [0, -9],
});

/**
 * Centra el mapa en la ubicacion del usuario la PRIMERA vez que llega.
 * Despues no vuelve a interferir (el usuario puede explorar libre).
 * Si se apaga el tracking, resetea el flag para que la proxima
 * activacion centre de nuevo.
 */
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

  const color = useMemo(
    () => colorForConfirmations(point.confirmation_count),
    [point.confirmation_count]
  );

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
    <div className="min-w-[220px] space-y-1 text-xs">
      <div className="font-semibold text-slate-900">
        {CATEGORIES[point.category].label}
        {point.subcategory ? ` - ${point.subcategory}` : ''}
      </div>
      {point.photo_url && (
        <a
          href={`/punto/${point.id}`}
          className="block overflow-hidden rounded"
        >
          <img
            src={point.photo_url}
            alt="Foto del reporte"
            className="h-24 w-full object-cover"
            loading="lazy"
          />
        </a>
      )}
      <div className="text-slate-700">{point.description}</div>

      <div className="flex items-center justify-between pt-1">
        <span
          className="inline-block rounded px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: color.bg,
            color: color.text,
            border: `1px solid ${color.border}`,
          }}
        >
          {point.confirmation_count} confirmacion
          {point.confirmation_count === 1 ? '' : 'es'} - {color.label}
        </span>
      </div>

      <div className="text-slate-500">
        Estado: {STATUS_LABELS[point.status] ?? point.status}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-200 pt-2">
        {state === 'ok' && (
          <span className="text-xs font-medium text-green-700">
            ✓ Confirmacion sumada
          </span>
        )}
        {state === 'err' && (
          <span className="text-xs text-red-700">{message}</span>
        )}
        {(state === 'idle' || state === 'loading') && (
          <button
            type="button"
            onClick={handleClick}
            disabled={state === 'loading'}
            className="rounded bg-brand-accent px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {state === 'loading' ? 'Confirmando...' : 'Yo tambien lo veo'}
          </button>
        )}

        <Link
          href={`/punto/${point.id}`}
          className="text-xs font-medium text-brand hover:underline"
        >
          Ver detalle &rarr;
        </Link>
      </div>
    </div>
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
  return (
    <MapContainer
      center={RD_CENTER}
      zoom={RD_DEFAULT_ZOOM}
      scrollWheelZoom
      className={`h-full w-full ${selectMode ? 'cursor-crosshair' : ''}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onPick={onMapClick} enabled={selectMode} />
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
        <Marker
          key={p.id}
          position={[p.lat, p.lng]}
          icon={buildMarkerIcon(p.confirmation_count)}
        >
          <Popup>
            <PointPopup point={p} onConfirm={onConfirm} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
