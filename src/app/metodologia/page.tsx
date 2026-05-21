import type { Metadata } from 'next';
import Link from 'next/link';

import SideDrawer from '@/components/SideDrawer';
import {
  CATEGORIES,
  CATEGORY_EMOJI,
  STATUS_LABELS,
  SUBCATEGORY_EMOJI,
  type CategoryKey,
} from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Metodología - PuntosNegrosRD',
  description:
    'Cómo se recolectan los datos, taxonomía INTRANT, ciclo de vida del reporte y limitaciones declaradas.',
};

export default function MetodologiaPage() {
  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="metodologia" />

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          📋 Metodología
        </h1>
        <p className="mt-2 text-fg-muted">
          Cómo se recolecta la información, qué taxonomía usamos, qué hacemos
          con los datos y qué limitaciones tiene este enfoque ciudadano.
        </p>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Recolección</h2>
          <p className="text-sm text-fg/90">
            Cualquier persona puede reportar un punto de riesgo desde el mapa,
            sin necesidad de crear una cuenta. El reporte requiere coordenadas
            (vía GPS o selección directa en el mapa), una categoría según la
            taxonomía oficial del INTRANT y una descripción textual de 10 a
            1000 caracteres. La identidad del reportante nunca se almacena.
          </p>
          <p className="text-sm text-fg/90">
            Para prevenir abuso se aplica un <em>rate limit</em> de cinco
            reportes por hora por dirección IP (almacenada como hash SHA-256
            con sal, nunca en claro). Las confirmaciones usan el mismo
            mecanismo: una IP solo puede confirmar un punto una vez.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Taxonomía INTRANT</h2>
          <p className="text-sm text-fg/90">
            Cada reporte se clasifica en una de las cuatro categorías que el{' '}
            <strong>Instituto Nacional de Tránsito y Transporte Terrestre</strong>{' '}
            (INTRANT) utiliza para analizar la siniestralidad vial.
          </p>
          <div className="space-y-3">
            {(Object.entries(CATEGORIES) as [
              CategoryKey,
              (typeof CATEGORIES)[CategoryKey],
            ][]).map(([key, value]) => (
              <div
                key={key}
                className="rounded-2xl border border-surface-border bg-surface-card p-4 text-sm shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-subtle text-2xl" aria-hidden>
                    {CATEGORY_EMOJI[key]}
                  </span>
                  <div className="font-semibold text-fg">{value.label}</div>
                </div>
                <p className="mt-2 text-fg/90">{value.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {value.subcategories.map((sc) => (
                    <span
                      key={sc}
                      className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-2 py-0.5 text-xs text-fg-muted"
                    >
                      {SUBCATEGORY_EMOJI[sc] && (
                        <span aria-hidden>{SUBCATEGORY_EMOJI[sc]}</span>
                      )}
                      {sc}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Ciclo de vida del reporte</h2>
          <p className="text-sm text-fg/90">
            Cada punto reportado transita por estados que documentan la
            trazabilidad ciudadana → institucional:
          </p>
          <ol className="space-y-2">
            {(Object.entries(STATUS_LABELS) as [string, string][]).map(
              ([key, label]) => (
                <li
                  key={key}
                  className="rounded-xl border border-surface-border bg-surface-card p-3 text-sm shadow-card"
                >
                  <code className="rounded bg-surface-raised px-1.5 py-0.5 text-xs text-brand">
                    {key}
                  </code>{' '}
                  <strong className="ml-1 text-fg">{label}</strong>
                </li>
              )
            )}
          </ol>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Limitaciones declaradas</h2>
          <p className="text-sm text-fg/90">
            Cualquier dataset ciudadano tiene sesgos. Los declaramos:
          </p>
          <ul className="list-inside list-disc space-y-1 text-sm text-fg/90">
            <li><strong>Sesgo de cobertura digital:</strong> los reportes provienen de personas con acceso a internet y smartphone.</li>
            <li><strong>Sesgo socioeconómico:</strong> barrios con mayor actividad en redes reportan más.</li>
            <li><strong>Sin verificación oficial:</strong> ningún reporte se valida con AMET, 9-1-1 ni inspección técnica.</li>
            <li><strong>Confirmaciones reflejan visibilidad:</strong> un punto con muchas confirmaciones puede estar en una vía concurrida.</li>
            <li><strong>El dataset no es exhaustivo:</strong> ausencia de reportes en una zona no significa ausencia de riesgo.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Relación con el INTRANT</h2>
          <p className="text-sm text-fg/90">
            PuntosNegrosRD no es una iniciativa oficial del INTRANT. Es un
            esfuerzo ciudadano independiente que adopta la taxonomía técnica
            de la institución para que los datos sean compatibles y cruzables.
            El INTRANT anunció en febrero de 2025 la creación de su propio
            mapa de puntos negros con datos oficiales. Cuando esa iniciativa
            esté disponible públicamente, PuntosNegrosRD se ofrece a
            sincronizar y cruzar datasets de forma abierta.
          </p>
        </section>

        <footer className="mt-12 border-t border-surface-border pt-4 text-xs text-fg-muted">
          <Link href="/" className="hover:text-brand hover:underline">
            ← Volver al mapa
          </Link>
        </footer>
      </div>
    </main>
  );
}
