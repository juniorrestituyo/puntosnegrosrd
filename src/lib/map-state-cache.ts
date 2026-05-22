/**
 * Cache de estado del mapa en sessionStorage para que MapClient
 * "reanude" donde estaba al volver desde una sub-pagina.
 *
 * Solo cachea entre navegaciones DENTRO de la misma pestaña
 * (sessionStorage, no localStorage). Si el usuario cierra el tab,
 * la próxima sesión arranca limpia.
 *
 * Cada save lleva un timestamp; cuando un load es muy viejo
 * (> TTL_MS) el cache se descarta y el mapa arranca con defaults.
 * Asi evitamos que el usuario vea points del dia anterior o un
 * userLocation obsoleto de horas atras.
 */
import type { Point, UserLocation } from './types';

const KEY = 'pn:map-state';
const TTL_MS = 5 * 60 * 1000; // 5 minutos

export interface CachedMapState {
  points: Point[];
  userLocation: UserLocation | null;
  center: [number, number];
  zoom: number;
}

interface StoredEnvelope extends CachedMapState {
  savedAt: number;
}

export function saveMapState(state: CachedMapState): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredEnvelope = { ...state, savedAt: Date.now() };
    window.sessionStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // sessionStorage lleno o no disponible — fall through silencioso.
  }
}

export function loadMapState(): CachedMapState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredEnvelope>;

    // Validacion de shape minima.
    if (
      !Array.isArray(parsed.points) ||
      !Array.isArray(parsed.center) ||
      parsed.center.length !== 2 ||
      typeof parsed.zoom !== 'number' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }

    // Edad: si paso el TTL, lo tratamos como inexistente.
    if (Date.now() - parsed.savedAt > TTL_MS) {
      window.sessionStorage.removeItem(KEY);
      return null;
    }

    return {
      points: parsed.points,
      userLocation: parsed.userLocation ?? null,
      center: parsed.center as [number, number],
      zoom: parsed.zoom,
    };
  } catch {
    return null;
  }
}

export function clearMapState(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

/* ============================================================
   Ultima ubicacion GPS conocida (cross-session)
   ============================================================
   Diferente proposito que el cache de session de arriba: este vive
   en localStorage y persiste 7 dias para que cuando el usuario
   abre la app por primera vez en una sesion nueva, el mapa arranque
   centrado donde estaba GPS la ultima vez (no en el centro geografico
   de RD que esta en medio de la cordillera y se ve vacio).

   Solo guardamos lat/lng — NO accuracy, NO timestamp visible al
   usuario, NO se renderea un dot fantasma en el mapa. Es solo un
   hint para la camara inicial; cuando llega el GPS actual, el mapa
   snap-pea a la ubicacion real y este valor pierde efecto.
============================================================ */

const LAST_GPS_KEY = 'pn:last-gps';
const LAST_GPS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export interface LastKnownLocation {
  lat: number;
  lng: number;
}

interface StoredLastGPS extends LastKnownLocation {
  savedAt: number;
}

export function saveLastGPS(loc: LastKnownLocation): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: StoredLastGPS = { ...loc, savedAt: Date.now() };
    window.localStorage.setItem(LAST_GPS_KEY, JSON.stringify(payload));
  } catch {
    /* localStorage lleno o no disponible — fall through silencioso. */
  }
}

export function loadLastGPS(): LastKnownLocation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAST_GPS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLastGPS>;

    if (
      typeof parsed.lat !== 'number' ||
      typeof parsed.lng !== 'number' ||
      typeof parsed.savedAt !== 'number'
    ) {
      return null;
    }

    if (Date.now() - parsed.savedAt > LAST_GPS_TTL_MS) {
      window.localStorage.removeItem(LAST_GPS_KEY);
      return null;
    }

    return { lat: parsed.lat, lng: parsed.lng };
  } catch {
    return null;
  }
}
