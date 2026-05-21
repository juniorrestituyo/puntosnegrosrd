'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

interface Props {
  lat: number;
  lng: number;
}

// Marker simple, alto contraste para que destaque sobre el preview mini.
const PreviewMarkerIcon = L.divIcon({
  className: 'pn-preview-marker',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#f59e0b;border:3px solid #ffffff;box-shadow:0 2px 6px rgba(15,23,42,0.4);"></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

/**
 * Mini-mapa estatico para confirmar la ubicacion del reporte dentro
 * del formulario. Sin controles ni gestos — es solo un preview.
 */
export default function LocationPreview({ lat, lng }: Props) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      zoomControl={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      dragging={false}
      touchZoom={false}
      boxZoom={false}
      keyboard={false}
      attributionControl={false}
      className="h-44 w-full"
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      <Marker position={[lat, lng]} icon={PreviewMarkerIcon} />
    </MapContainer>
  );
}
