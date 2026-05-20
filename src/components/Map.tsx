'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useState } from 'react';
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';

import {
  CATEGORIES,
  RD_BOUNDS,
  RD_CENTER,
  RD_DEFAULT_ZOOM,
  STATUS_LABELS,
} from '@/lib/constants';
import type { Point } from '@/lib/types';

// Fix de iconos por defecto de Leaflet con Next.
// Sin esto los markers se renderizan como cuadrados grises rotos porque
// el bundler no resuelve los assets relativos del paquete.
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

type ConfirmResult = { ok: true } | { ok: false; message: string };

function ClickCapture({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
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
    <div className="min-w-[180px] space-y-1 text-xs">
      <div className="font-semibold text-slate-900">
        {CATEGORIES[point.category].label}
        {point.subcategory ? ` - ${point.subcategory}` : ''}
      </div>
      <div className="text-slate-700">{point.description}</div>
      <div className="text-slate-500">
        Estado: {STATUS_LABELS[point.status] ?? point.status}
      </div>
      <div className="text-slate-500">
        Confirmaciones: {point.confirmation_count}
      </div>

      <div className="mt-2 border-t border-slate-200 pt-2">
        {state === 'ok' && (
          <span className="text-xs font-medium text-green-700">
            ✓ Gracias, tu confirmacion suma.
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
      </div>
    </div>
  );
}

interface MapProps {
  points: Point[];
  onMapClick: (lat: number, lng: number) => void;
  onConfirm: (id: string) => Promise<ConfirmResult>;
}

export default function Map({ points, onMapClick, onConfirm }: MapProps) {
  return (
    <MapContainer
      center={RD_CENTER}
      zoom={RD_DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickCapture onPick={onMapClick} />
      {points.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]}>
          <Popup>
            <PointPopup point={p} onConfirm={onConfirm} />
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
