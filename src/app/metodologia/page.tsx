import type { Metadata } from 'next';
import Link from 'next/link';

import SiteNav from '@/components/SiteNav';
import { CATEGORIES, STATUS_LABELS } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Metodología - PuntosNegrosRD',
  description:
    'Cómo se recolectan los datos, taxonomía INTRANT, ciclo de vida del reporte y limitaciones declaradas.',
};

export default function MetodologiaPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          PuntosNegros<span className="text-brand-accent">RD</span>
        </Link>
        <SiteNav current="metodologia" />
      </header>

      <h1 className="text-3xl font-bold tracking-tight text-brand">
        Metodología
      </h1>
      <p className="mt-2 text-slate-600">
        Cómo se recolecta la información, qué taxonomía usamos, qué hacemos
        con los datos y qué limitaciones tiene este enfoque ciudadano.
      </p>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Recolección</h2>
        <p className="text-sm text-slate-700">
          Cualquier persona puede reportar un punto de riesgo haciendo click
          en el mapa, sin necesidad de crear una cuenta. El reporte requiere
          coordenadas (selección directa en el mapa), una categoría según la
          taxonomía oficial del INTRANT y una descripción textual de 10 a
          1000 caracteres. La identidad del reportante nunca se almacena.
        </p>
        <p className="text-sm text-slate-700">
          Para prevenir abuso se aplica un{' '}
          <em>rate limit</em> de cinco reportes por hora por dirección IP
          (cuya huella se almacena como hash SHA-256 con sal, nunca en
          claro). Las confirmaciones comunitarias (&ldquo;yo también lo
          veo&rdquo;) usan el mismo mecanismo: una IP solo puede confirmar
          un punto una vez.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Taxonomía INTRANT
        </h2>
        <p className="text-sm text-slate-700">
          Cada reporte se clasifica en una de las cuatro categorías que el{' '}
          <strong>Instituto Nacional de Tránsito y Transporte Terrestre</strong>{' '}
          (INTRANT) utiliza para analizar la siniestralidad vial. Adoptar
          esta misma taxonomía permite que los datos ciudadanos sean
          directamente cruzables con análisis oficiales.
        </p>
        <div className="space-y-3">
          {(Object.entries(CATEGORIES) as [
            keyof typeof CATEGORIES,
            (typeof CATEGORIES)[keyof typeof CATEGORIES],
          ][]).map(([key, value]) => (
            <div
              key={key}
              className="rounded border border-slate-200 bg-white p-3 text-sm"
            >
              <div className="font-semibold text-brand">{value.label}</div>
              <p className="mt-1 text-slate-700">{value.description}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {value.subcategories.map((sc) => (
                  <span
                    key={sc}
                    className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                  >
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Ciclo de vida del reporte
        </h2>
        <p className="text-sm text-slate-700">
          Cada punto reportado transita por estados que documentan la
          trazabilidad ciudadana &rarr; institucional:
        </p>
        <ol className="space-y-2">
          {(Object.entries(STATUS_LABELS) as [string, string][]).map(
            ([key, label]) => (
              <li
                key={key}
                className="rounded border border-slate-200 bg-white p-3 text-sm"
              >
                <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">
                  {key}
                </code>{' '}
                <strong className="ml-1 text-slate-800">{label}</strong>
              </li>
            )
          )}
        </ol>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Color del marker</h2>
        <p className="text-sm text-slate-700">
          El color del punto en el mapa refleja la cantidad de
          confirmaciones comunitarias, no su gravedad técnica. Más
          confirmaciones implican mayor consenso ciudadano sobre la
          existencia del riesgo, no necesariamente mayor letalidad.
        </p>
        <ul className="space-y-1 text-sm text-slate-700">
          <li>
            <span className="inline-block h-3 w-3 rounded-full bg-slate-400 align-middle" />{' '}
            Gris: 0 confirmaciones (señal inicial sin corroborar).
          </li>
          <li>
            <span className="inline-block h-3 w-3 rounded-full bg-amber-500 align-middle" />{' '}
            Amarillo: 1-2 confirmaciones.
          </li>
          <li>
            <span className="inline-block h-3 w-3 rounded-full bg-orange-600 align-middle" />{' '}
            Naranja: 3-9 confirmaciones (consenso medio).
          </li>
          <li>
            <span className="inline-block h-3 w-3 rounded-full bg-red-700 align-middle" />{' '}
            Rojo: 10 o más confirmaciones (alta certeza ciudadana).
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Limitaciones declaradas
        </h2>
        <p className="text-sm text-slate-700">
          Cualquier dataset ciudadano tiene sesgos. Los declaramos para
          que el lector pueda interpretar correctamente:
        </p>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          <li>
            <strong>Sesgo de cobertura digital:</strong> los reportes
            provienen de personas con acceso a internet y smartphone. Zonas
            con baja penetración digital aparecen sub-representadas.
          </li>
          <li>
            <strong>Sesgo socioeconómico:</strong> barrios con mayor
            actividad en redes y mayor capacidad de movilización digital
            tienden a reportar más, aun cuando el riesgo objetivo sea
            mayor en otros lugares.
          </li>
          <li>
            <strong>Sin verificación oficial:</strong> ningún reporte se
            valida con AMET, 9-1-1 ni inspección técnica. Es percepción
            ciudadana, no auditoría.
          </li>
          <li>
            <strong>Confirmaciones reflejan visibilidad:</strong> un punto
            con muchas confirmaciones puede estar en una vía concurrida y
            no necesariamente en la zona más letal.
          </li>
          <li>
            <strong>El dataset no es exhaustivo:</strong> ausencia de
            reportes en una zona no significa ausencia de riesgo.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Relación con el INTRANT
        </h2>
        <p className="text-sm text-slate-700">
          PuntosNegrosRD no es una iniciativa oficial del INTRANT. Es un
          esfuerzo ciudadano independiente que adopta la taxonomía técnica
          de la institución para que los datos sean compatibles y
          cruzables. El INTRANT anunció en febrero de 2025 la creación de
          su propio mapa de puntos negros con datos oficiales (AMET, 9-1-1,
          hospitales). Cuando esa iniciativa esté disponible públicamente,
          PuntosNegrosRD se ofrece a sincronizar y cruzar datasets de
          forma abierta.
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
