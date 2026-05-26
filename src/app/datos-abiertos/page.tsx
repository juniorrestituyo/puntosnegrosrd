import type { Metadata } from 'next';

import BackToMapButton from '@/components/BackToMapButton';
import SideDrawer from '@/components/SideDrawer';

export const metadata: Metadata = {
  title: 'Datos abiertos - PuntosNegrosRD',
  description:
    'Descarga todos los reportes de PuntosNegrosRD como CSV o GeoJSON bajo licencia CC-BY 4.0.',
};

export default function DatosAbiertosPage() {
  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="datos" variant="static" />
      <BackToMapButton variant="static" />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        {/* Hero */}
        <header className="rounded-2xl bg-surface-card p-6 shadow-card ring-1 ring-surface-border sm:p-8">
          <h1 className="font-logo text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Datos abiertos
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            Todos los reportes ciudadanos se publican como dataset descargable
            bajo licencia{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.es"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
            >
              Creative Commons Atribución 4.0 (CC-BY 4.0)
            </a>
            .
          </p>
        </header>

        {/* Descarga directa */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-lg font-bold tracking-tight text-fg">
            Descarga directa
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/api/export/csv"
              download
              className="group flex flex-col rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border transition-all hover:-translate-y-0.5 hover:shadow-float hover:ring-brand"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M3 7h18M3 12h18M3 17h18" />
                    <path d="M9 3v18M15 3v18" />
                  </svg>
                </span>
                <div className="text-base font-bold text-fg">CSV</div>
              </div>
              <p className="mt-3 flex-1 text-sm text-fg-muted">
                Apto para Excel, Google Sheets, análisis tabular.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-transform group-hover:translate-x-0.5">
                Descargar CSV
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </a>

            <a
              href="/api/export/geojson"
              download
              className="group flex flex-col rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border transition-all hover:-translate-y-0.5 hover:shadow-float hover:ring-brand"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle text-brand">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </span>
                <div className="text-base font-bold text-fg">GeoJSON</div>
              </div>
              <p className="mt-3 flex-1 text-sm text-fg-muted">
                Apto para QGIS, ArcGIS, Mapbox, Leaflet.
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand transition-transform group-hover:translate-x-0.5">
                Descargar GeoJSON
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            </a>
          </div>
        </section>

        {/* Acceso programático */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-lg font-bold tracking-tight text-fg">
            Acceso programático
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
            <p className="text-sm leading-relaxed text-fg-muted">
              Los endpoints son públicos y se pueden consumir directamente desde
              un script, un notebook o un servicio:
            </p>
            <div className="mt-4 space-y-3 rounded-xl bg-surface-raised p-4 font-mono text-xs text-fg ring-1 ring-surface-border">
              <div>
                <div className="text-fg-muted"># Descarga CSV con curl</div>
                <pre className="mt-1 overflow-x-auto whitespace-pre rounded-md bg-surface-card px-3 py-2 ring-1 ring-surface-border">{`curl -L https://puntosnegrosrd.vercel.app/api/export/csv -o puntos.csv`}</pre>
              </div>
              <div>
                <div className="text-fg-muted"># GeoJSON</div>
                <pre className="mt-1 overflow-x-auto whitespace-pre rounded-md bg-surface-card px-3 py-2 ring-1 ring-surface-border">{`curl -L https://puntosnegrosrd.vercel.app/api/export/geojson -o puntos.geojson`}</pre>
              </div>
            </div>
          </div>
        </section>

        {/* Esquema de campos */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-lg font-bold tracking-tight text-fg">
            Esquema de campos
          </h2>
          <div className="overflow-x-auto rounded-2xl bg-surface-card shadow-card ring-1 ring-surface-border">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-raised text-left text-[10px] uppercase tracking-[0.16em] text-fg-muted">
                <tr>
                  <th className="border-b border-surface-border px-4 py-3 font-semibold">
                    Campo
                  </th>
                  <th className="border-b border-surface-border px-4 py-3 font-semibold">
                    Tipo
                  </th>
                  <th className="border-b border-surface-border px-4 py-3 font-semibold">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="text-fg/90">
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    id
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">uuid</td>
                  <td className="px-4 py-2.5">
                    Identificador único del reporte.
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    category
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">enum</td>
                  <td className="px-4 py-2.5">
                    Taxonomía INTRANT: <code>humano</code>,{' '}
                    <code>vehicular</code>, <code>infraestructural</code>,{' '}
                    <code>climatico</code>.
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    subcategory
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">text</td>
                  <td className="px-4 py-2.5">
                    Subcategoría textual opcional.
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    description
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">text</td>
                  <td className="px-4 py-2.5">
                    Descripción ciudadana del riesgo (10-1000 caracteres).
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    status
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">enum</td>
                  <td className="px-4 py-2.5">
                    <code>nuevo</code>, <code>corroborado</code>,{' '}
                    <code>notificado</code>, <code>en_atencion</code>,{' '}
                    <code>resuelto</code>.
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    lat, lng
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">float8</td>
                  <td className="px-4 py-2.5">
                    Coordenadas WGS-84 (EPSG:4326).
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    confirmation_count
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">int</td>
                  <td className="px-4 py-2.5">
                    Confirmaciones comunitarias del punto.
                  </td>
                </tr>
                <tr className="border-b border-surface-divider transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    province, municipality
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">text</td>
                  <td className="px-4 py-2.5">
                    Cuando se reporta o se geocodifica.
                  </td>
                </tr>
                <tr className="transition-colors hover:bg-surface-raised/40">
                  <td className="px-4 py-2.5 font-mono text-xs font-semibold text-brand">
                    created_at, updated_at
                  </td>
                  <td className="px-4 py-2.5 text-xs text-fg-muted">
                    timestamptz
                  </td>
                  <td className="px-4 py-2.5">
                    ISO-8601 con zona horaria UTC.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Condiciones de uso */}
        <section className="mt-6">
          <h2 className="mb-3 px-1 text-lg font-bold tracking-tight text-fg">
            Condiciones de uso
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
            <ul className="space-y-3 text-sm leading-relaxed text-fg/90">
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Atribución:
                  </strong>{' '}
                  citar &ldquo;PuntosNegrosRD, iniciativa ciudadana&rdquo; con
                  enlace a este sitio.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Uso comercial permitido
                  </strong>{' '}
                  dentro de los términos CC-BY 4.0.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    No re-identificar a los reportantes.
                  </strong>{' '}
                  Los datos no contienen información personal.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Datos como están.
                  </strong>{' '}
                  Sin garantías de exactitud ni verificación oficial.
                </span>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
