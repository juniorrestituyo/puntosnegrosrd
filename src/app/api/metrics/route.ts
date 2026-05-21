import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import { err, ok } from '@/lib/api/responses';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * GET /api/metrics
 *
 * Devuelve agregados publicos del dataset sin exponer informacion
 * sensible (no hashes, no IPs, no fechas exactas de reportantes
 * individuales). Apto para mostrar en /metricas y para que cualquier
 * tercero audite el estado real de la plataforma.
 *
 * Como solo trabajamos con cientos/miles de filas en esta fase, la
 * agregacion se hace en JS sobre los datos crudos. Cuando crezca,
 * se puede migrar a RPCs SQL en Supabase para tiempos sub-100ms.
 */
export async function GET() {
  const supabase = createSupabaseAdminClient();

  const { data: points, error: pointsError } = await supabase
    .from('points_with_stats')
    .select(
      'id, category, province, municipality, photo_url, confirmation_count, description, created_at'
    )
    .order('created_at', { ascending: true });

  if (pointsError) {
    console.error('GET /api/metrics points error:', pointsError);
    return err('INTERNAL_ERROR', 'No se pudieron obtener las metricas', 500);
  }

  const { data: confirmations, error: confError } = await supabase
    .from('confirmations')
    .select('ip_hash');

  if (confError) {
    console.error('GET /api/metrics confirmations error:', confError);
    return err('INTERNAL_ERROR', 'No se pudieron obtener las metricas', 500);
  }

  const { data: reportersData } = await supabase
    .from('points')
    .select('ip_hash');

  const rows = points ?? [];
  const totalReports = rows.length;

  const totalConfirmations = (confirmations ?? []).length;
  const uniqueConfirmers = new Set(
    (confirmations ?? []).map((c) => c.ip_hash).filter(Boolean)
  ).size;
  const uniqueReporters = new Set(
    (reportersData ?? []).map((r) => r.ip_hash).filter(Boolean)
  ).size;

  // Provincias y municipios cubiertos (excluyendo null).
  const provinces = new Set<string>();
  const municipalities = new Set<string>();
  for (const r of rows) {
    if (r.province) provinces.add(r.province);
    if (r.municipality) municipalities.add(r.municipality);
  }

  // Distribucion por categoria INTRANT.
  const categoryCounts: Record<CategoryKey, number> = {
    humano: 0,
    vehicular: 0,
    infraestructural: 0,
    climatico: 0,
  };
  for (const r of rows) {
    const cat = r.category as CategoryKey;
    if (cat in categoryCounts) categoryCounts[cat]++;
  }
  const byCategory = (
    Object.entries(categoryCounts) as [CategoryKey, number][]
  ).map(([key, count]) => ({
    key,
    label: CATEGORIES[key].label,
    count,
    pct: totalReports === 0 ? 0 : Math.round((count / totalReports) * 1000) / 10,
  }));

  // Reportes con foto.
  const withPhoto = rows.filter((r) => r.photo_url).length;

  // Puntos con consenso (>=3 confirmaciones — umbral comunitario).
  const consensusPoints = rows.filter(
    (r) => (r.confirmation_count ?? 0) >= 3
  ).length;

  // Tendencia: ultimos 14 dias, reportes por dia.
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reportsByDay: { day: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    reportsByDay.push({ day: iso, count: 0 });
  }
  const dayIndex = new Map(reportsByDay.map((d, i) => [d.day, i]));
  for (const r of rows) {
    const iso = (r.created_at as string).slice(0, 10);
    const idx = dayIndex.get(iso);
    if (idx !== undefined) reportsByDay[idx].count++;
  }

  // Top 5 puntos mas confirmados.
  const topConfirmed = [...rows]
    .filter((r) => (r.confirmation_count ?? 0) > 0)
    .sort((a, b) => (b.confirmation_count ?? 0) - (a.confirmation_count ?? 0))
    .slice(0, 5)
    .map((r) => ({
      id: r.id,
      category: r.category,
      categoryLabel: CATEGORIES[r.category as CategoryKey]?.label,
      province: r.province,
      municipality: r.municipality,
      confirmationCount: r.confirmation_count,
      preview: ((r.description as string) ?? '').slice(0, 100),
    }));

  return ok({
    generatedAt: new Date().toISOString(),
    totals: {
      reports: totalReports,
      confirmations: totalConfirmations,
      uniqueReporters,
      uniqueConfirmers,
      provincesCovered: provinces.size,
      municipalitiesCovered: municipalities.size,
      withPhoto,
      consensusPoints,
    },
    byCategory,
    reportsByDay,
    topConfirmed,
  });
}
