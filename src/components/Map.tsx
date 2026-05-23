'use client';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Plugin: cluster group para agrupar markers cercanos. Solo importamos
// el CSS "core" (animaciones + positioning). El visual lo definimos
// nosotros en globals.css con la clase .pn-cluster — el default del
// plugin trae amarillo/azul fluo que no matchea la paleta.
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import { useEffect, useRef, useState } from 'react';
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
import { getIconForPoint } from '@/lib/marker-icons';
import type { Point, UserLocation } from '@/lib/types';

// Por debajo de este zoom mostramos solo un dot pequeno (vista regional
// + media — provincia, ciudad, sector). A partir de 16 (vista cuadra)
// pasamos a teardrop completo, cuando ya hay espacio para que los pins
// se vean comodos sin chocar entre si.
const FAR_ZOOM_THRESHOLD = 16;

// Offset vertical (en pixeles de screen) desde el iconAnchor del marker
// teardrop hasta el centro visual del circulo. El iconAnchor esta en la
// sombra del suelo (y=61 del container 52x68), pero el centro del circulo
// (lo que el usuario ve y quiere "iluminar" con el spotlight) esta en
// y=24. Diferencia: 61 - 24 = 37 px hacia arriba.
// En modo dot (zoom < 16) el offset es 0 porque el dot ya esta centrado
// en su GPS point.
const MARKER_VISUAL_CENTER_OFFSET_Y = 37;

type MarkerMode = 'dot' | 'teardrop';

/**
 * ClassName compuesta del marker. Si status === 'resuelto' agrega
 * `pn-marker-resolved` que en globals.css aplica grayscale + opacity
 * baja para indicar visualmente que el punto fue cerrado. No cambia
 * el color base ni el shape — solo lo "apaga".
 */
function markerClassName(point: Point): string {
  return `pn-marker${point.status === 'resuelto' ? ' pn-marker-resolved' : ''}`;
}

// Color del halo "marker activo" (amarillo senaletico de carretera).
// Se aplica al marker cuando es el spotlight point — el usuario lo
// acaba de tocar y el sheet inferior esta abierto. Conecta visualmente
// el marker con el resto de los CTAs amarillos (FAB, etc.) sin cambiar
// el color base del marker (que sigue codificando "consenso comunitario"
// via el rojo/naranja/amarillo/gris del marker-color).
const ACTIVE_HALO = '#f59e0b'; // amber-500 == bg-signal

/**
 * Dot compacto para vista lejana (pais/region). Solo color de votos +
 * anillo blanco. Sin numero ni cola — la prioridad es que no se aplasten.
 * Si isActive, agrega un anillo exterior amarillo senaletico.
 */
function buildDotIcon(point: Point, isActive: boolean): L.DivIcon {
  const c = colorForConfirmations(point.confirmation_count);
  // Halo oscuro alrededor + borde blanco mas grueso para que el dot
  // se lea claramente en vista lejana sobre el basemap claro.
  //   - Inactive: halo dark blur de 4px (mas visible que la version
  //     proporcional, compensa el tamano chico del dot).
  //   - Active: anillo amarillo solido (3px spread) + halo dark debajo.
  //   - Borde blanco: 3px (antes 2px) para mas dominancia visual.
  const shadow = isActive
    ? `0 0 0 3px ${ACTIVE_HALO}, 0 0 4px rgba(15,23,42,0.8)`
    : '0 0 4px rgba(15,23,42,0.8)';
  return L.divIcon({
    className: markerClassName(point),
    html: `<div class="pn-marker-inner" style="width:16px;height:16px;border-radius:50%;background:${c.bg};border:3px solid #ffffff;box-shadow:${shadow};"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    popupAnchor: [0, -8],
  });
}

/**
 * Marker circular "floating" con icono y sombra de tierra.
 *
 * Estilo visual (matchea el screenshot de referencia):
 *   - Circulo completo (sin tail tipo teardrop)
 *   - Color brand de fondo segun votos (rojo/naranja/amarillo/gris)
 *   - Borde blanco bold (white outer ring)
 *   - Icono PNG centrado dentro
 *   - Ellipse oscura debajo, separada por un gap — efecto "marker
 *     flotando sobre la calle con sombra en el suelo"
 *
 * Si isActive, agrega un drop-shadow amarillo senaletico difuso afuera
 * del borde.
 *
 * Container 40x52: circulo arriba (cy=18, r=17), gap, sombra abajo
 * (cy=47). iconAnchor apunta al centro de la sombra — esa es la
 * posicion "en el suelo" del GPS.
 */
function buildTeardropIcon(point: Point, isActive: boolean): L.DivIcon {
  const c = colorForConfirmations(point.confirmation_count);
  const { url: iconUrl, size: iconSize } = getIconForPoint(point);

  // Halo oscuro suave alrededor de todo el marker (circulo + tail) para
  // que la forma resalte sobre el basemap claro. Es un drop-shadow con
  // offset 0 — sombra equidistante en todos los lados. La elipse del
  // suelo no se "ve" afectada porque ya es semi-transparente.
  // Cuando isActive, se suma el halo amarillo (drop-shadow se apilan).
  const baseHalo = 'drop-shadow(0 0 1.5px rgba(15,23,42,0.6))';
  const filterStyle = isActive
    ? `filter:drop-shadow(0 0 7px rgba(245,158,11,0.85)) ${baseHalo};`
    : `filter:${baseHalo};`;

  // Icono centrado en el circulo (cuyo centro esta en 26, 24). El
  // tamano viene del mapping en marker-icons (default 24; algunos
  // iconos como pothole tienen override para compensar aspect ratio).
  // object-fit:contain preserva aspect ratio para iconos no cuadrados.
  const iconTop = 24 - iconSize / 2;
  const iconLeft = 26 - iconSize / 2;
  const iconHtml = `<img src="${iconUrl}" alt="" draggable="false" style="position:absolute;top:${iconTop}px;left:${iconLeft}px;width:${iconSize}px;height:${iconSize}px;object-fit:contain;pointer-events:none;user-select:none;" />`;

  return L.divIcon({
    className: markerClassName(point),
    html: `
      <div class="pn-marker-inner" style="position:relative;width:52px;height:68px;${filterStyle}">
        <svg viewBox="0 0 52 68" width="52" height="68" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="26" cy="61" rx="11" ry="3.5" fill="rgba(15,23,42,0.35)"/>
          <path d="M21 43 L26 53 L31 43 Z" fill="#ffffff" stroke="#ffffff" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
          <circle cx="26" cy="24" r="22" fill="${c.bg}" stroke="#ffffff" stroke-width="3"/>
        </svg>
        ${iconHtml}
      </div>
    `,
    iconSize: [52, 68],
    iconAnchor: [26, 61],
    popupAnchor: [0, -61],
  });
}

function buildMarkerIcon(
  point: Point,
  mode: MarkerMode,
  isActive: boolean
): L.DivIcon {
  return mode === 'dot'
    ? buildDotIcon(point, isActive)
    : buildTeardropIcon(point, isActive);
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

/**
 * Maneja todas las situaciones donde el mapa se debe centrar en el
 * usuario:
 *
 *  - INITIAL MOUNT: cuando el primer userLocation llega despues de
 *    montarse el mapa, hace un snap instantaneo (setView animate:false)
 *    para que se sienta "el mapa abrio en mi". Si hay cache, este
 *    snap se salta via skipInitialAutoCenter.
 *
 *  - RECENTER REQUEST: cada vez que recenterRequest cambia (incrementa)
 *    hace un flyTo smooth con duracion 0.7s. Si el zoom actual es
 *    menor a 16 (vista mas amplia que cuadra), zoomea suave hasta 16.
 *    Si ya esta a >=16, preserva el zoom del usuario (no aleja nunca).
 *
 * Ambos modos comparten el mismo userLocation pero los handledRefs
 * son independientes para que un click del boton locate no compita
 * con el initial center.
 */
function MapCenterController({
  userLocation,
  skipInitialAutoCenter = false,
  recenterRequest,
}: {
  userLocation: UserLocation | null;
  skipInitialAutoCenter?: boolean;
  recenterRequest: number;
}) {
  const map = useMap();
  const handledInitialRef = useRef(skipInitialAutoCenter);
  const handledRecenterRef = useRef(recenterRequest);

  useEffect(() => {
    if (!userLocation) return;

    // CASO 1: Recenter explicito (usuario toco el boton de locate).
    // Tiene prioridad sobre el initial center.
    if (recenterRequest > handledRecenterRef.current) {
      const currentZoom = map.getZoom();
      const targetZoom = Math.max(currentZoom, 16);
      map.flyTo([userLocation.lat, userLocation.lng], targetZoom, {
        duration: 0.7,
      });
      handledRecenterRef.current = recenterRequest;
      handledInitialRef.current = true;
      return;
    }

    // CASO 2: Initial auto-center (primera llegada de GPS sin cache).
    // Snap rapido — no es una "animacion", es "el mapa abre aqui".
    if (!handledInitialRef.current) {
      map.setView([userLocation.lat, userLocation.lng], map.getZoom(), {
        animate: false,
      });
      handledInitialRef.current = true;
    }
  }, [userLocation, recenterRequest, map]);

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
      // El GPS point esta donde renderea la sombra del marker (en
      // modo teardrop). El usuario espera que el haz ilumine el
      // CIRCULO, no la sombra. Subimos pos.y por MARKER_VISUAL_CENTER_OFFSET_Y
      // cuando estamos en modo teardrop. En modo dot el dot ya esta
      // centrado en el GPS, asi que no aplicamos offset.
      const inTeardropMode = map.getZoom() >= FAR_ZOOM_THRESHOLD;
      const offsetY = inTeardropMode ? MARKER_VISUAL_CENTER_OFFSET_Y : 0;
      setPos({ x: px.x, y: px.y - offsetY });
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
              // Spotlight intencionalmente sutil:
              // - haz iluminado mas chico (24px) para no robar atencion
              //   del bottom sheet, que es donde vive la accion.
              // - oscurecimiento del fondo a 0.22 (antes 0.35) — sugiere
              //   foco sin ocultar el contexto del mapa alrededor.
              // - fade hasta 110px: transicion sigue gradual sin sentirse
              //   "duro" en el borde del haz.
              background: `radial-gradient(circle at ${pos.x}px ${pos.y}px, transparent 0px, transparent 24px, rgba(15,23,42,0.22) 110px)`,
            }
          : undefined
      }
    />
  );
}

/**
 * Construye el icono del cluster: circulo negro con el conteo en blanco.
 * El tamano escala con la cantidad de puntos (small/medium/large/xlarge)
 * — mas grande == mas reportes en la zona, comunica densidad sin
 * necesidad de leyenda.
 *
 * Estilo definido en globals.css (.pn-cluster, .pn-cluster-small, etc.).
 * Asi mantenemos coherencia con la paleta brand sin depender del CSS
 * default del plugin (que trae amarillo/azul fluo).
 */
function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const size =
    count < 5 ? 'small' : count < 15 ? 'medium' : count < 40 ? 'large' : 'xlarge';

  const dim =
    size === 'small' ? 44 : size === 'medium' ? 56 : size === 'large' ? 68 : 80;

  return L.divIcon({
    html: `<div class="pn-cluster pn-cluster-${size}">${count}</div>`,
    className: 'pn-cluster-wrapper',
    iconSize: [dim, dim],
    iconAnchor: [dim / 2, dim / 2],
  });
}

/**
 * Layer imperativo de markers agrupados. Reemplaza el rendering JSX de
 * cada marker individual por un L.markerClusterGroup que:
 *
 *  - Agrupa puntos cercanos en un solo circulo con el conteo (icono
 *    via clusterIcon arriba).
 *  - Al click en un cluster: zoom-in hasta separarlos (comportamiento
 *    default del plugin).
 *  - Al cruzar `disableClusteringAtZoom` deja de agrupar y muestra
 *    los markers individuales en su lugar exacto.
 *
 * El sync con props (points, activeId, mode) se hace con clearLayers +
 * addLayers en cada cambio. Es brute-force pero a la escala del proyecto
 * (50-200 puntos) es instantaneo.
 */
function ClusteredMarkers({
  points,
  onSelect,
  zoom,
  activeId,
}: {
  points: Point[];
  onSelect: (point: Point) => void;
  zoom: number;
  activeId: string | null;
}) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  // Derivamos `mode` del zoom — solo cambia cuando se cruza el
  // threshold (no en cada paso de zoom intermedio). Usar `mode` como
  // dep del effect en vez de `zoom` evita que el rebuild de markers
  // dispare en cada nivel de zoom, que era lo que causaba el flash
  // visual al hacer zoom continuo.
  const mode: MarkerMode = zoom < FAR_ZOOM_THRESHOLD ? 'dot' : 'teardrop';

  // Setup del cluster group una sola vez. El cleanup al desmontar
  // remueve la layer del mapa.
  useEffect(() => {
    const cluster = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      // Sin overlay del hull al hover — distrae y no agrega info util.
      showCoverageOnHover: false,
      // Radio (en pixeles) en el que 2 markers se consideran "cercanos"
      // y por lo tanto se agrupan. 50px = al hacer zoom-in los clusters
      // se separan rapido. Default 80 los mantiene agrupados mucho mas.
      maxClusterRadius: 50,
      // Cuando estas tan zoomed que un cluster sigue siendo cluster,
      // el spiderfy abre los puntos en patron radial al clickearlo.
      spiderfyOnMaxZoom: true,
      // Zoom 17 = vista de calle. A ese nivel ya no tiene sentido
      // agrupar — el usuario quiere ver cada marker exacto.
      disableClusteringAtZoom: 17,
      // Anima la transicion de cluster -> markers individuales al
      // hacer zoom-in (los puntos "salen" del centro del cluster hacia
      // sus posiciones reales). Mas natural que un pop instantaneo.
      animate: true,
    });
    map.addLayer(cluster);
    clusterRef.current = cluster;

    return () => {
      map.removeLayer(cluster);
      clusterRef.current = null;
    };
  }, [map]);

  // Sync de markers: solo se rebuildea cuando cambian:
  //   - points: nuevo reporte/cambio de estado
  //   - mode: cruce del threshold dot<->teardrop (un solo evento)
  //   - activeId: usuario selecciono otro marker
  //
  // NO depende de `zoom` directamente — asi panear/zoomear continuo
  // no reconstruye nada y los markers no parpadean.
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;

    cluster.clearLayers();

    const markers = points.map((point) => {
      const isActive = activeId === point.id;
      const icon = buildMarkerIcon(point, mode, isActive);
      const marker = L.marker([point.lat, point.lng], { icon });
      marker.on('click', () => {
        // Pan offsetado: marker queda en el ~30% superior del viewport
        // asi no lo tapa el bottom sheet. Mismo comportamiento que el
        // FocusableMarker anterior.
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
      });
      return marker;
    });

    cluster.addLayers(markers);
  }, [points, mode, activeId, map, onSelect]);

  return null;
}

interface MapProps {
  points: Point[];
  selectMode: boolean;
  userLocation: UserLocation | null;
  spotlightPoint: Point | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  skipInitialAutoCenter?: boolean;
  recenterRequest?: number;
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
  recenterRequest = 0,
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
        maxZoom={18}
      />
      <ClickCapture
        onPick={onMapClick}
        onBackgroundClick={onBackgroundClick}
        selectMode={selectMode}
      />
      <ZoomTracker onZoom={setZoom} />
      {onCameraChange && <CameraTracker onChange={onCameraChange} />}
      <MapCenterController
        userLocation={userLocation}
        skipInitialAutoCenter={skipInitialAutoCenter}
        recenterRequest={recenterRequest}
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
            // Mandamos el marker de GPS al fondo del pane (-1000) para
            // que los markers de reportes y las nubes del cluster siempre
            // queden visualmente por encima. Si el usuario esta parado
            // sobre/junto a un cluster, ya no lo tapa a la mitad.
            zIndexOffset={-1000}
            interactive={false}
            keyboard={false}
          />
        </>
      )}

      <ClusteredMarkers
        points={points}
        onSelect={onPointSelect}
        zoom={zoom}
        activeId={spotlightPoint?.id ?? null}
      />

      <SpotlightOverlay point={spotlightPoint} />
    </MapContainer>
  );
}
