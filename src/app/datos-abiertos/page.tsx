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
      <SideDrawer current="datos" />
      <BackToMapButton />

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Datos abiertos
        </h1>
        <p className="mt-2 text-fg-muted">
          Todos los reportes ciudadanos se publican como dataset descargable
          bajo licencia{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.es"
            target="_blank"
            rel="noreferrer"
            className="text-brand hover:underline"
          >
            Creative Commons Atribución 4.0 (CC-BY 4.0)
          </a>
          .
        </p>

        <section className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-fg">Descarga directa</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/api/export/csv"
              download
              className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card transition-shadow hover:border-brand hover:shadow-float"
            >
              <div className="font-semibold text-brand">CSV</div>
              <p className="mt-1 text-sm text-fg-muted">
                Apto para Excel, Google Sheets, análisis tabular.
              </p>
              <span className="mt-2 inline-block text-xs text-brand">
                Descargar CSV →
              </span>
            </a>

            <a
              href="/api/export/geojson"
              download
              className="rounded-2xl border border-surface-border bg-surface-card p-4 shadow-card transition-shadow hover:border-brand hover:shadow-float"
            >
              <div className="font-semibold text-brand">GeoJSON</div>
              <p className="mt-1 text-sm text-fg-muted">
                Apto para QGIS, ArcGIS, Mapbox, Leaflet.
              </p>
              <span className="mt-2 inline-block text-xs text-brand">
                Descargar GeoJSON →
              </span>
            </a>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Acceso programático</h2>
          <p className="text-sm text-fg-muted">
            Los endpoints son públicos y se pueden consumir directamente desde
            un script, un notebook o un servicio:
          </p>
          <div className="space-y-3 rounded-xl border border-surface-border bg-surface-raised p-4 font-mono text-xs text-fg">
            <div>
              <div className="text-fg-muted"># Descarga CSV con curl</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre rounded-md bg-surface-card/60 px-2 py-1.5">{`curl -L https://puntosnegrosrd.vercel.app/api/export/csv -o puntos.csv`}</pre>
            </div>
            <div>
              <div className="text-fg-muted"># GeoJSON</div>
              <pre className="mt-1 overflow-x-auto whitespace-pre rounded-md bg-surface-card/60 px-2 py-1.5">{`curl -L https://puntosnegrosrd.vercel.app/api/export/geojson -o puntos.geojson`}</pre>
            </div>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Esquema de campos</h2>
          <div className="overflow-x-auto rounded-xl border border-surface-border bg-surface-card shadow-card">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-surface-raised text-left text-xs uppercase tracking-wide text-fg-muted">
                <tr>
                  <th className="border-b border-surface-border px-3 py-2">Campo</th>
                  <th className="border-b border-surface-border px-3 py-2">Tipo</th>
                  <th className="border-b border-surface-border px-3 py-2">Descripción</th>
                </tr>
              </thead>
              <tbody className="text-fg/90">
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">id</td><td className="border-b border-surface-border px-3 py-2">uuid</td><td className="border-b border-surface-border px-3 py-2">Identificador único del reporte.</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">category</td><td className="border-b border-surface-border px-3 py-2">enum</td><td className="border-b border-surface-border px-3 py-2">Taxonomía INTRANT: <code>humano</code>, <code>vehicular</code>, <code>infraestructural</code>, <code>climatico</code>.</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">subcategory</td><td className="border-b border-surface-border px-3 py-2">text</td><td className="border-b border-surface-border px-3 py-2">Subcategoría textual opcional.</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">description</td><td className="border-b border-surface-border px-3 py-2">text</td><td className="border-b border-surface-border px-3 py-2">Descripción ciudadana del riesgo (10-1000 caracteres).</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">status</td><td className="border-b border-surface-border px-3 py-2">enum</td><td className="border-b border-surface-border px-3 py-2"><code>nuevo</code>, <code>corroborado</code>, <code>notificado</code>, <code>en_atencion</code>, <code>resuelto</code>.</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">lat, lng</td><td className="border-b border-surface-border px-3 py-2">float8</td><td className="border-b border-surface-border px-3 py-2">Coordenadas WGS-84 (EPSG:4326).</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">confirmation_count</td><td className="border-b border-surface-border px-3 py-2">int</td><td className="border-b border-surface-border px-3 py-2">Confirmaciones comunitarias del punto.</td></tr>
                <tr><td className="border-b border-surface-border px-3 py-2 font-mono text-brand">province, municipality</td><td className="border-b border-surface-border px-3 py-2">text</td><td className="border-b border-surface-border px-3 py-2">Cuando se reporta o se geocodifica.</td></tr>
                <tr><td className="px-3 py-2 font-mono text-brand">created_at, updated_at</td><td className="px-3 py-2">timestamptz</td><td className="px-3 py-2">ISO-8601 con zona horaria UTC.</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-10 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Condiciones de uso</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-fg/90">
            <li><strong>Atribución:</strong> citar &ldquo;PuntosNegrosRD, iniciativa ciudadana&rdquo; con enlace a este sitio.</li>
            <li><strong>Uso comercial permitido</strong> dentro de los términos CC-BY 4.0.</li>
            <li><strong>No re-identificar a los reportantes.</strong> Los datos no contienen información personal.</li>
            <li><strong>Datos como están.</strong> Sin garantías de exactitud ni verificación oficial.</li>
          </ul>
        </section>

      </div>
    </main>
  );
}
