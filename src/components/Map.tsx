'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Circle,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet';

import {
  RD_BOUNDS,
  RD_CENTER,
  RD_DEFAULT_ZOOM,
} from '@/lib/constants';
import { colorForConfirmations } from '@/lib/marker-color';
import type { Point, UserLocation } from '@/lib/types';

// Por debajo de este zoom mostramos solo un dot pequeno (vista regional).
// Por encima, teardrop completo con badge de confirmaciones.
const FAR_ZOOM_THRESHOLD = 14;

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
 * Solo bulbo + punto blanco central. El contador NO se muestra aqui;
 * se rendera en otro lugar de la UI.
 */
function buildTeardropIcon(point: Point): L.DivIcon {
  const c = colorForConfirmations(point.confirmation_count);

  // Dimensiones: contenedor 28x36, viewBox SVG 32x42 (escala interna).
  // Centro del bulbo cae aprox en (14, 14) del container.
  const center = `<span style="position:absolute;top:8px;left:8px;width:12px;height:12px;border-radius:50%;background:${c.text};"></span>`;

  return L.divIcon({
    className: 'pn-marker',
    html: `
      <div class="pn-marker-inner" style="position:relative;width:28px;height:36px;filter:drop-shadow(0 2px 4px rgba(15,23,42,0.25));">
        <svg viewBox="0 0 32 42" width="28" height="36" xmlns="http://www.w3.org/2000/svg">
          <path d="M16 0 C7.16 0 0 7.16 0 16 C0 25 16 42 16 42 C16 42 32 25 32 16 C32 7.16 24.84 0 16 0 Z" fill="${c.bg}" stroke="${c.border}" stroke-width="1.5"/>
        </svg>
        ${center}
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
  skipInitialAutoCenter = false,
}: {
  userLocation: UserLocation | null;
  skipInitialAutoCenter?: boolean;
}) {
  const map = useMap();
  // Si hidratamos desde cache (skipInitialAutoCenter=true) arrancamos
  // como si ya hubieramos hecho el center: respeta la posicion del
  // usuario. Si el usuario toggle off/on el boton de locate (userLocation
  // pasa por null), el ref se resetea y el siguiente fix si centra.
  const centeredOnceRef = useRef(skipInitialAutoCenter);

  useEffect(() => {
    if (!userLocation) {
      centeredOnceRef.current = false;
      return;
    }
    if (!centeredOnceRef.current) {
      // setView con animate:false hace un snap instantaneo a la ubicacion
      // del usuario. Mantenemos el zoom actual del mapa (que arranca en
      // RD_DEFAULT_ZOOM = 15) — no forzamos cambio de zoom como hacia
      // antes flyTo(..., 15, ...). Asi el "reset" cada vez que se vuelve
      // al mapa se siente menos dramatico: no hay animacion de zoom-in.
      map.setView([userLocation.lat, userLocation.lng], map.getZoom(), {
        animate: false,
      });
      centeredOnceRef.current = true;
    }
  }, [userLocation, map]);

  return null;
}

function ClickCapture({
  onPick,
  onBackgroundClick,
  selectMode,
}: {
  onPick: (lat: number, lng: number) => void;
  onBackgroundClick: () => void;
  selectMode: boolean;
}) {
  useMapEvents({
    click(e) {
      if (selectMode) {
        const { lat, lng } = e.latlng;
        if (
          lat >= RD_BOUNDS.minLat &&
          lat <= RD_BOUNDS.maxLat &&
          lng >= RD_BOUNDS.minLng &&
          lng <= RD_BOUNDS.maxLng
        ) {
          onPick(lat, lng);
        }
      } else {
        onBackgroundClick();
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

/**
 * Reporta center y zoom al padre cuando el usuario termina de panear
 * o zoomear. Permite cachear la posicion de la camara y rehidratarla
 * al volver a la pagina sin perder la vista del usuario.
 *
 * moveend ya cubre zoom (Leaflet emite moveend tambien al zoomear).
 */
function CameraTracker({
  onChange,
}: {
  onChange: (center: [number, number], zoom: number) => void;
}) {
  const map = useMap();
  useMapEvents({
    moveend() {
      const c = map.getCenter();
      onChange([c.lat, c.lng], map.getZoom());
    },
  });
  return null;
}

/**
 * Oscurece el mapa con un radial-gradient dejando un circulo de luz
 * alrededor del point seleccionado. Sigue la posicion del marker en
 * pixel-space cuando el usuario pana o zoomea con el sheet abierto.
 */
function SpotlightOverlay({ point }: { point: Point | null }) {
  const map = useMap();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!point) {
      return;
    }
    function update() {
      if (!point) return;
      const px = map.latLngToContainerPoint([point.lat, point.lng]);
      setPos({ x: px.x, y: px.y });
    }
    update();
    map.on('move', update);
    map.on('zoom', update);
    map.on('resize', update);
    return () => {
      map.off('move', update);
      map.off('zoom', update);
      map.off('resize', update);
    };
  }, [point, map]);

  const visible = !!point && !!pos;

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 z-[800] transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={
        pos
          ? {
              background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 0px, transparent 32px, rgba(15,23,42,0.6) 110px)`,
            }
          : undefined
      }
    />
  );
}

/**
 * Marker que al clic hace pan al punto y notifica al padre para que
 * abra el bottom sheet con el detalle. Ya no usa Popup de Leaflet.
 */
function FocusableMarker({
  point,
  onSelect,
  zoom,
}: {
  point: Point;
  onSelect: (point: Point) => void;
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
          // Pan offsetado: en vez de dejar el marker en el centro
          // del viewport (donde lo taparia el bottom sheet), lo
          // dejamos en el ~30% superior. Asi siempre queda iluminado
          // por el spotlight con espacio claro arriba del sheet.
          const containerPt = map.latLngToContainerPoint([
            point.lat,
            point.lng,
          ]);
          const size = map.getSize();
          const desiredX = size.x / 2;
          const desiredY = size.y * 0.3;
          map.panBy(
            [containerPt.x - desiredX, containerPt.y - desiredY],
            { animate: true, duration: 0.6 }
          );
          onSelect(point);
        },
      }}
    />
  );
}

interface MapProps {
  points: Point[];
  selectMode: boolean;
  userLocation: UserLocation | null;
  spotlightPoint: Point | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  skipInitialAutoCenter?: boolean;
  onMapClick: (lat: number, lng: number) => void;
  onPointSelect: (point: Point) => void;
  onBackgroundClick: () => void;
  onCameraChange?: (center: [number, number], zoom: number) => void;
}

export default function Map({
  points,
  selectMode,
  userLocation,
  spotlightPoint,
  initialCenter,
  initialZoom,
  skipInitialAutoCenter,
  onMapClick,
  onPointSelect,
  onBackgroundClick,
  onCameraChange,
}: MapProps) {
  const [zoom, setZoom] = useState(initialZoom ?? RD_DEFAULT_ZOOM);

  return (
    <MapContainer
      center={initialCenter ?? RD_CENTER}
      zoom={initialZoom ?? RD_DEFAULT_ZOOM}
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
      <ClickCapture
        onPick={onMapClick}
        onBackgroundClick={onBackgroundClick}
        selectMode={selectMode}
      />
      <ZoomTracker onZoom={setZoom} />
      {onCameraChange && <CameraTracker onChange={onCameraChange} />}
      <CenterOnUserLocation
        userLocation={userLocation}
        skipInitialAutoCenter={skipInitialAutoCenter}
      />

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
          onSelect={onPointSelect}
          zoom={zoom}
        />
      ))}

      <SpotlightOverlay point={spotlightPoint} />
    </MapContainer>
  );
}
