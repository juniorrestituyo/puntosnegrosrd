/**
 * Reverse geocoding con Nominatim (OpenStreetMap).
 *
 * Convierte lat/lng en provincia y municipio para llenar esos campos
 * en los reportes ciudadanos. Es un nice-to-have: si falla por
 * cualquier razon (timeout, rate limit, red, etc.), devuelve objeto
 * vacio y el reporte se guarda igual con province/municipality = null.
 *
 * Politica de uso de Nominatim (https://operations.osmfoundation.org/policies/nominatim/):
 *   - User-Agent identificable con contacto (lo hacemos abajo).
 *   - Max 1 request/seg por IP — nuestro POST rate-limit ya garantiza
 *     que estamos muy por debajo de eso.
 *   - No bulk geocoding sin self-hosting — solo lo usamos en INSERT.
 */

interface NominatimAddress {
  state?: string;
  county?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  hamlet?: string;
  suburb?: string;
  country_code?: string;
}

interface NominatimResponse {
  address?: NominatimAddress;
  display_name?: string;
  error?: string;
}

export interface ReverseGeocodeResult {
  province?: string;
  municipality?: string;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
// User-Agent con contacto via URL del proyecto, como pide Nominatim.
const USER_AGENT = 'PuntosNegrosRD/1.0 (https://puntosnegrosrd.vercel.app)';
const TIMEOUT_MS = 3000;

/**
 * Hace reverse geocoding de un par lat/lng y devuelve { province, municipality }.
 * Nunca tira: en cualquier error devuelve {}.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<ReverseGeocodeResult> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  // zoom 12 = nivel de municipio; mas bajo = mas amplio. Suficiente para
  // que Nominatim devuelva state + city/town confiable en RD.
  url.searchParams.set('zoom', '12');
  url.searchParams.set('accept-language', 'es');
  // Pedimos solo los campos que vamos a usar para reducir payload.
  url.searchParams.set('addressdetails', '1');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`Nominatim non-2xx response: ${res.status}`);
      return {};
    }

    const data = (await res.json()) as NominatimResponse;
    const a = data.address;
    if (!a) return {};

    // Sanity check: si Nominatim no cree que es Republica Dominicana,
    // no llenamos. Evita guardar datos basura si el GPS del telefono
    // miente (raro pero pasa al inicio).
    if (a.country_code && a.country_code !== 'do') {
      return {};
    }

    // En RD las direcciones de Nominatim tipicamente tienen:
    //   state    = provincia (incluido "Distrito Nacional")
    //   city/town/municipality/village = municipio segun densidad
    const province = a.state ?? a.county ?? undefined;
    const municipality =
      a.city ??
      a.town ??
      a.municipality ??
      a.village ??
      a.hamlet ??
      a.suburb ??
      undefined;

    return {
      province: province?.trim() || undefined,
      municipality: municipality?.trim() || undefined,
    };
  } catch (e) {
    if ((e as Error).name !== 'AbortError') {
      console.warn('reverseGeocode fallo:', e);
    }
    return {};
  } finally {
    clearTimeout(timer);
  }
}
