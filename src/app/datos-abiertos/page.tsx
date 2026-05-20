import type { Metadata } from 'next';
import Link from 'next/link';

import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Datos abiertos - PuntosNegrosRD',
  description:
    'Descarga todos los reportes de PuntosNegrosRD como CSV o GeoJSON bajo licencia CC-BY 4.0.',
};

export default function DatosAbiertosPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          PuntosNegros<span className="text-brand-accent">RD</span>
        </Link>
        <SiteNav current="datos" />
      </header>

      <h1 className="text-3xl font-bold tracking-tight text-brand">
        Datos abiertos
      </h1>
      <p className="mt-2 text-slate-600">
        Todos los reportes ciudadanos se publican como dataset descargable
        bajo licencia{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/deed.es"
          target="_blank"
          rel="noreferrer"
          className="text-brand-accent underline"
        >
          Creative Commons Atribución 4.0 (CC-BY 4.0)
        </a>
        .
      </p>

      <section className="mt-8 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">
          Descarga directa
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="/api/export/csv"
            download
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-accent hover:shadow"
          >
            <div className="font-semibold text-brand">CSV</div>
            <p className="mt-1 text-sm text-slate-600">
              Apto para Excel, Google Sheets, análisis tabular. Una fila por
              punto, columnas con todos los campos públicos.
            </p>
            <span className="mt-2 inline-block text-xs text-brand-accent">
              Descargar CSV →
            </span>
          </a>

          <a
            href="/api/export/geojson"
            download
            className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-accent hover:shadow"
          >
            <div className="font-semibold text-brand">GeoJSON</div>
            <p className="mt-1 text-sm text-slate-600">
              Apto para QGIS, ArcGIS, Mapbox, Leaflet. Cada feature es un
              Point con lng/lat y propiedades del reporte.
            </p>
            <span className="mt-2 inline-block text-xs text-brand-accent">
              Descargar GeoJSON →
            </span>
          </a>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Acceso programático
        </h2>
        <p className="text-sm text-slate-600">
          Los endpoints son públicos y se pueden consumir directamente desde
          un script, un notebook o un servicio:
        </p>
        <div className="space-y-2 rounded bg-slate-900 p-4 font-mono text-xs text-slate-100">
          <div>
            <span className="text-slate-400"># Descarga CSV con curl</span>
            <div>curl -L https://puntosnegrosrd.vercel.app/api/export/csv -o puntos.csv</div>
          </div>
          <div className="mt-3">
            <span className="text-slate-400"># GeoJSON</span>
            <div>curl -L https://puntosnegrosrd.vercel.app/api/export/geojson -o puntos.geojson</div>
          </div>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Esquema de campos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="border border-slate-200 px-3 py-2">Campo</th>
                <th className="border border-slate-200 px-3 py-2">Tipo</th>
                <th className="border border-slate-200 px-3 py-2">Descripción</th>
              </tr>
            </thead>
            <tbody className="text-slate-700">
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">id</td>
                <td className="border border-slate-200 px-3 py-2">uuid</td>
                <td className="border border-slate-200 px-3 py-2">Identificador único del reporte.</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">category</td>
                <td className="border border-slate-200 px-3 py-2">enum</td>
                <td className="border border-slate-200 px-3 py-2">
                  Taxonomía INTRANT: <code>humano</code>, <code>vehicular</code>,{' '}
                  <code>infraestructural</code>, <code>climatico</code>.
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">subcategory</td>
                <td className="border border-slate-200 px-3 py-2">text</td>
                <td className="border border-slate-200 px-3 py-2">Subcategoría textual opcional.</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">description</td>
                <td className="border border-slate-200 px-3 py-2">text</td>
                <td className="border border-slate-200 px-3 py-2">Descripción ciudadana del riesgo (10-1000 caracteres).</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">status</td>
                <td className="border border-slate-200 px-3 py-2">enum</td>
                <td className="border border-slate-200 px-3 py-2">
                  <code>nuevo</code>, <code>corroborado</code>, <code>notificado</code>,{' '}
                  <code>en_atencion</code>, <code>resuelto</code>.
                </td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">lat, lng</td>
                <td className="border border-slate-200 px-3 py-2">float8</td>
                <td className="border border-slate-200 px-3 py-2">Coordenadas WGS-84 (EPSG:4326).</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">confirmation_count</td>
                <td className="border border-slate-200 px-3 py-2">int</td>
                <td className="border border-slate-200 px-3 py-2">Confirmaciones comunitarias del punto.</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">province, municipality</td>
                <td className="border border-slate-200 px-3 py-2">text</td>
                <td className="border border-slate-200 px-3 py-2">Cuando se reporta o se geocodifica.</td>
              </tr>
              <tr>
                <td className="border border-slate-200 px-3 py-2 font-mono">created_at, updated_at</td>
                <td className="border border-slate-200 px-3 py-2">timestamptz</td>
                <td className="border border-slate-200 px-3 py-2">ISO-8601 con zona horaria UTC.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Condiciones de uso
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          <li>
            <strong>Atribución:</strong> citar &ldquo;PuntosNegrosRD &mdash;
            iniciativa ciudadana&rdquo; con enlace a este sitio cuando uses
            los datos en una publicación, análisis o aplicación.
          </li>
          <li>
            <strong>Uso comercial permitido</strong> dentro de los términos
            CC-BY 4.0.
          </li>
          <li>
            <strong>No re-identificar a los reportantes.</strong> Los datos
            no contienen información personal, pero las descripciones
            ciudadanas pueden incluir contexto local. Trátalas con respeto.
          </li>
          <li>
            <strong>Datos como están.</strong> Sin garantías de exactitud ni
            verificación oficial. Para decisiones críticas, cruza con
            fuentes institucionales.
          </li>
        </ul>
      </section>

      <section className="mt-10 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p>
          ¿Vas a publicar un análisis usando este dataset? Cuéntanos en{' '}
          <a
            href="https://github.com/w0rkm4n/puntosnegrosrd/discussions"
            className="text-brand-accent underline"
            target="_blank"
            rel="noreferrer"
          >
            GitHub Discussions
          </a>{' '}
          y lo enlazamos desde la página de Acerca de.
        </p>
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-4 text-xs text-slate-500">
        <Link href="/" className="hover:underline">
          ← Volver al mapa
        </Link>
      </footer>
    </main>
  );
}
