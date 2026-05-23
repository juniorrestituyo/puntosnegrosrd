'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';

import { colorForConfirmations } from '@/lib/marker-color';

interface Props {
  lat: number;
  lng: number;
  /**
   * Cantidad de confirmaciones comunitarias del punto. Define el color
   * del marker en el preview (gris -> amarillo -> naranja -> rojo) para
   * mantener consistencia visual con el mapa principal. Default 0 (para
   * el flujo de crear reporte donde el punto aun no existe).
   */
  confirmationCount?: number;
  /**
   * Si true, aplica grayscale + opacity baja sobre el marker, igual que
   * en el mapa principal. Comunica visualmente que el punto fue resuelto.
   */
  isResolved?: boolean;
}

function buildPreviewIcon(
  confirmationCount: number,
  isResolved: boolean
): L.DivIcon {
  const c = colorForConfirmations(confirmationCount);
  const filterCss = isResolved
    ? 'filter:grayscale(1) opacity(0.55);'
    : '';

  return L.divIcon({
    className: 'pn-preview-marker',
    html: `<div style="
      width:18px;
      height:18px;
      border-radius:50%;
      background:${c.bg};
      border:3px solid #ffffff;
      box-shadow:0 2px 6px rgba(15,23,42,0.4);
      ${filterCss}
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

/**
 * Mini-mapa estatico para confirmar la ubicacion del reporte dentro
 * del formulario o el detalle. Sin controles ni gestos — es solo un
 * preview. El color del marker matchea el del mapa principal segun
 * confirmation_count + status, para que el usuario lea la misma señal
 * visual aqui y alla.
 */
export default function LocationPreview({
  lat,
  lng,
  confirmationCount = 0,
  isResolved = false,
}: Props) {
  const icon = buildPreviewIcon(confirmationCount, isResolved);

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
        maxZoom={18}
      />
      <Marker position={[lat, lng]} icon={icon} />
    </MapContainer>
  );
}
