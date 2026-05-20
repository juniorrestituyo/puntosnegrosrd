'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from 'react-leaflet';

import {
  CATEGORIES,
  RD_CENTER,
  RD_DEFAULT_ZOOM,
  RD_BOUNDS,
  STATUS_LABELS,
} from '@/lib/constants';
import type { Point } from '@/lib/types';

// Fix de iconos por defecto de Leaflet.
// Sin esto los markers se renderizan como cuadrados grises rotos
// porque el bundler de Next no resuelve los assets relativos del paquete.
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

function ClickCapture({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      // Validamos que el click este dentro del bounding box de RD
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

interface MapProps {
  points: Point[];
  onMapClick: (lat: number, lng: number) => void;
}

export default function Map({ points, onMapClick }: MapProps) {
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
            <div className="space-y-1 text-xs">
              <div className="font-semibold">
                {CATEGORIES[p.category].label}
                {p.subcategory ? ` - ${p.subcategory}` : ''}
              </div>
              <div>{p.description}</div>
              <div className="text-slate-500">
                Estado: {STATUS_LABELS[p.status] ?? p.status}
              </div>
              <div className="text-slate-500">
                Confirmaciones: {p.confirmation_count}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
