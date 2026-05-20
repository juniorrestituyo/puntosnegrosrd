import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/export/geojson
 * Devuelve todos los puntos visibles como FeatureCollection GeoJSON
 * bajo licencia CC-BY 4.0. Compatible con QGIS, ArcGIS, Mapbox, Leaflet.
 */

interface Feature {
  type: 'Feature';
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: Record<string, unknown>;
}

interface FeatureCollection {
  type: 'FeatureCollection';
  metadata: {
    name: string;
    source: string;
    license: string;
    license_url: string;
    generated_at: string;
    count: number;
  };
  features: Feature[];
}

export async function GET() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('points_with_stats')
    .select(
      'id, lat, lng, category, subcategory, description, status, confirmation_count, province, municipality, created_at, updated_at'
    )
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) {
    console.error('GeoJSON export failed:', error);
    return Response.json(
      { error: 'No se pudo generar el GeoJSON' },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as Array<{
    id: string;
    lat: number;
    lng: number;
    category: string;
    subcategory: string | null;
    description: string;
    status: string;
    confirmation_count: number;
    province: string | null;
    municipality: string | null;
    created_at: string;
    updated_at: string;
  }>;

  const features: Feature[] = rows.map((p) => ({
    type: 'Feature',
    // GeoJSON usa [longitud, latitud] — al reves de lat/lng convencional
    geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: {
      id: p.id,
      category: p.category,
      subcategory: p.subcategory,
      description: p.description,
      status: p.status,
      confirmation_count: p.confirmation_count,
      province: p.province,
      municipality: p.municipality,
      created_at: p.created_at,
      updated_at: p.updated_at,
    },
  }));

  const collection: FeatureCollection = {
    type: 'FeatureCollection',
    metadata: {
      name: 'PuntosNegrosRD',
      source: 'https://github.com/w0rkm4n/puntosnegrosrd',
      license: 'CC-BY-4.0',
      license_url: 'https://creativecommons.org/licenses/by/4.0/',
      generated_at: new Date().toISOString(),
      count: features.length,
    },
    features,
  };

  const today = new Date().toISOString().slice(0, 10);

  return new Response(JSON.stringify(collection, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/geo+json; charset=utf-8',
      'Content-Disposition': `attachment; filename="puntosnegrosrd-${today}.geojson"`,
      'Cache-Control': 'public, max-age=60, must-revalidate',
      'X-License': 'CC-BY-4.0',
      'X-Source': 'https://github.com/w0rkm4n/puntosnegrosrd',
    },
  });
}
