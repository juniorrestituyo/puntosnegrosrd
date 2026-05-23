import type { Metadata } from 'next';

import BackToMapButton from '@/components/BackToMapButton';
import SideDrawer from '@/components/SideDrawer';
import { CATEGORIES, type CategoryKey } from '@/lib/constants';
import { createSupabaseAdminClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Impacto - PuntosNegrosRD',
  description:
    'Cifras en vivo de la plataforma ciudadana: reportes, confirmaciones, provincias cubiertas y distribución por taxonomía INTRANT.',
};

// Server-side data fetching para que la primera carga renderice con
// numeros y los crawlers/jueces vean contenido sin esperar JS.
export const dynamic = 'force-dynamic';

interface CategoryEntry {
  key: CategoryKey;
  label: string;
  count: number;
  pct: number;
}

interface TopConfirmedEntry {
  id: string;
  category: string;
  categoryLabel?: string;
  province: string | null;
  municipality: string | null;
  confirmationCount: number;
  preview: string;
}

interface MetricsPayload {
  generatedAt: string;
  totals: {
    reports: number;
    confirmations: number;
    uniqueReporters: number;
    uniqueConfirmers: number;
    provincesCovered: number;
    municipalitiesCovered: number;
    withPhoto: number;
    consensusPoints: number;
  };
  byCategory: CategoryEntry[];
  reportsByDay: { day: string; count: number }[];
  topConfirmed: TopConfirmedEntry[];
}

// Republica Dominicana tiene 31 provincias + Distrito Nacional = 32.
const TOTAL_PROVINCIAS_RD = 32;

async function loadMetrics(): Promise<MetricsPayload | null> {
  try {
    const supabase = createSupabaseAdminClient();

    const { data: points } = await supabase
      .from('points_with_stats')
      .select(
        'id, category, province, municipality, photo_url, confirmation_count, description, created_at'
      )
      .order('created_at', { ascending: true });

    const { data: confirmations } = await supabase
      .from('confirmations')
      .select('ip_hash');

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

    const provinces = new Set<string>();
    const municipalities = new Set<string>();
    for (const r of rows) {
      if (r.province) provinces.add(r.province as string);
      if (r.municipality) municipalities.add(r.municipality as string);
    }

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
    const byCategory: CategoryEntry[] = (
      Object.entries(categoryCounts) as [CategoryKey, number][]
    ).map(([key, count]) => ({
      key,
      label: CATEGORIES[key].label,
      count,
      pct:
        totalReports === 0 ? 0 : Math.round((count / totalReports) * 1000) / 10,
    }));

    const withPhoto = rows.filter((r) => r.photo_url).length;
    const consensusPoints = rows.filter(
      (r) => ((r.confirmation_count as number) ?? 0) >= 3
    ).length;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reportsByDay: { day: string; count: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      reportsByDay.push({ day: d.toISOString().slice(0, 10), count: 0 });
    }
    const dayIndex = new Map(reportsByDay.map((d, i) => [d.day, i]));
    for (const r of rows) {
      const iso = (r.created_at as string).slice(0, 10);
      const idx = dayIndex.get(iso);
      if (idx !== undefined) reportsByDay[idx].count++;
    }

    const topConfirmed: TopConfirmedEntry[] = [...rows]
      .filter((r) => ((r.confirmation_count as number) ?? 0) > 0)
      .sort(
        (a, b) =>
          ((b.confirmation_count as number) ?? 0) -
          ((a.confirmation_count as number) ?? 0)
      )
      .slice(0, 5)
      .map((r) => ({
        id: r.id as string,
        category: r.category as string,
        categoryLabel: CATEGORIES[r.category as CategoryKey]?.label,
        province: (r.province as string) ?? null,
        municipality: (r.municipality as string) ?? null,
        confirmationCount: (r.confirmation_count as number) ?? 0,
        preview: ((r.description as string) ?? '').slice(0, 100),
      }));

    return {
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
    };
  } catch (e) {
    console.error('loadMetrics fallo:', e);
    return null;
  }
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-DO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('es-DO', { day: '2-digit', month: 'short' });
}

export default async function MetricasPage() {
  const data = await loadMetrics();

  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="impacto" variant="static" />
      <BackToMapButton variant="static" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl bg-surface-card p-6 shadow-card ring-1 ring-surface-border sm:p-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-accent to-brand"
          />
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand">
            Datos en vivo
          </p>
          <h1 className="mt-1 font-logo text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Impacto
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            Cifras agregadas del dataset ciudadano. Todo lo que ves aquí es
            público y auditable: cada número se puede recomputar bajando el
            dataset desde{' '}
            <a
              href="/datos-abiertos"
              className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
            >
              datos abiertos
            </a>
            .
          </p>
        </header>

        {data === null ? (
          <section className="mt-6 rounded-2xl bg-surface-card p-6 text-sm text-fg-muted shadow-card ring-1 ring-surface-border">
            No se pudieron cargar las cifras en este momento. Intenta recargar
            la página en unos minutos.
          </section>
        ) : data.totals.reports === 0 ? (
          <section className="mt-6 rounded-2xl bg-surface-card p-6 text-sm text-fg-muted shadow-card ring-1 ring-surface-border">
            Todavía no hay reportes en la plataforma. Sé el primero:{' '}
            <a
              href="/"
              className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
            >
              ir al mapa
            </a>
            .
          </section>
        ) : (
          <>
            {/* Bloque de números grandes */}
            <section className="mt-6 grid gap-3 sm:grid-cols-2">
              <StatCard
                label="Reportes ciudadanos"
                value={data.totals.reports}
                hint={`${data.totals.withPhoto} con foto`}
              />
              <StatCard
                label="Confirmaciones comunitarias"
                value={data.totals.confirmations}
                hint={`${data.totals.uniqueConfirmers} reportantes confirmadores`}
                accent="emerald"
              />
              <StatCard
                label="Provincias cubiertas"
                value={data.totals.provincesCovered}
                hint={`de ${TOTAL_PROVINCIAS_RD} en RD`}
              />
              <StatCard
                label="Municipios reportados"
                value={data.totals.municipalitiesCovered}
                hint={`${data.totals.uniqueReporters} reportantes distintos`}
              />
            </section>

            {/* Distribución por categoría INTRANT */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
                <span
                  aria-hidden
                  className="block h-6 w-1 rounded-full bg-brand"
                />
                Distribución por taxonomía INTRANT
              </h2>
              <div className="space-y-2 rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
                {data.byCategory.map((c) => (
                  <CategoryBar key={c.key} entry={c} />
                ))}
              </div>
            </section>

            {/* Puntos con consenso */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
                <span
                  aria-hidden
                  className="block h-6 w-1 rounded-full bg-brand"
                />
                Consenso comunitario
              </h2>
              <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
                <p>
                  <strong className="text-3xl font-extrabold text-fg">
                    {data.totals.consensusPoints}
                  </strong>{' '}
                  <span className="ml-1 text-fg-muted">
                    {data.totals.consensusPoints === 1
                      ? 'punto con consenso fuerte'
                      : 'puntos con consenso fuerte'}{' '}
                    (≥3 confirmaciones).
                  </span>
                </p>
                <p className="mt-2 text-xs text-fg-muted">
                  Estos son los reportes validados por múltiples ciudadanos.
                  Indicador de hotspots reales vs reportes aislados.
                </p>
              </div>
            </section>

            {/* Tendencia */}
            <section className="mt-6">
              <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
                <span
                  aria-hidden
                  className="block h-6 w-1 rounded-full bg-brand"
                />
                Reportes en los últimos 14 días
              </h2>
              <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
                <TrendBars days={data.reportsByDay} />
              </div>
            </section>

            {/* Top confirmados */}
            {data.topConfirmed.length > 0 && (
              <section className="mt-6">
                <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
                  <span
                    aria-hidden
                    className="block h-6 w-1 rounded-full bg-brand"
                  />
                  Top 5 puntos más confirmados
                </h2>
                <ol className="space-y-2">
                  {data.topConfirmed.map((p, i) => (
                    <li
                      key={p.id}
                      className="flex items-start gap-3 rounded-xl bg-surface-card p-4 shadow-card ring-1 ring-surface-border"
                    >
                      <span
                        aria-hidden
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-sm font-bold text-brand ring-1 ring-brand-soft"
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="truncate text-sm font-semibold text-fg">
                            {p.categoryLabel}
                          </p>
                          <span className="shrink-0 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-bold text-brand">
                            {p.confirmationCount}
                          </span>
                        </div>
                        {(p.province || p.municipality) && (
                          <p className="mt-0.5 text-xs text-fg-muted">
                            {[p.municipality, p.province]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                        <p className="mt-1 line-clamp-2 text-xs text-fg/80">
                          {p.preview}
                          {p.preview.length === 100 ? '…' : ''}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Auditoría */}
            <section className="mt-6 rounded-2xl bg-surface-raised p-5 text-xs leading-relaxed text-fg-muted ring-1 ring-surface-border">
              <p>
                <strong className="text-fg">Última actualización:</strong>{' '}
                {formatDateTime(data.generatedAt)}.
              </p>
              <p className="mt-2">
                Estas cifras son computadas en cada visita desde la base de
                datos en tiempo real. Para reproducirlas, descarga el dataset
                completo en{' '}
                <a
                  href="/datos-abiertos"
                  className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
                >
                  /datos-abiertos
                </a>{' '}
                bajo licencia CC-BY 4.0.
              </p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint?: string;
  accent?: 'brand' | 'emerald';
}) {
  const accentClass =
    accent === 'emerald'
      ? 'text-emerald-600'
      : 'text-fg';
  return (
    <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-fg-muted">
        {label}
      </p>
      <p className={`mt-2 text-4xl font-extrabold tracking-tight ${accentClass}`}>
        {value.toLocaleString('es-DO')}
      </p>
      {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
    </div>
  );
}

function CategoryBar({ entry }: { entry: CategoryEntry }) {
  const widthPct = Math.max(entry.pct, 2); // mínimo visible para que se vea aunque sea 0
  const isEmpty = entry.count === 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="font-medium text-fg">{entry.label}</span>
        <span className="text-xs text-fg-muted">
          <span className="font-semibold text-fg">{entry.count}</span> · {entry.pct}%
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-raised">
        <div
          className={`h-full rounded-full ${
            isEmpty ? 'bg-surface-border' : 'bg-brand'
          }`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}

function TrendBars({ days }: { days: { day: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div className="flex items-end gap-1.5">
      {days.map((d) => {
        const heightPct = (d.count / max) * 100;
        return (
          <div
            key={d.day}
            className="group flex flex-1 flex-col items-center gap-1.5"
          >
            <div
              className="relative w-full overflow-hidden rounded-md bg-surface-raised"
              style={{ height: '80px' }}
            >
              <div
                className="absolute bottom-0 left-0 right-0 rounded-md bg-brand transition-all"
                style={{
                  height: d.count === 0 ? '2px' : `${Math.max(heightPct, 6)}%`,
                  opacity: d.count === 0 ? 0.25 : 1,
                }}
                aria-label={`${d.count} reportes el ${formatDayLabel(d.day)}`}
              />
            </div>
            <span className="text-[9px] font-medium text-fg-dim">
              {formatDayLabel(d.day).split(' ')[0]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
