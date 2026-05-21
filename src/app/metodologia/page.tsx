import type { Metadata } from 'next';

import BackToMapButton from '@/components/BackToMapButton';
import SideDrawer from '@/components/SideDrawer';
import {
  CATEGORIES,
  STATUS_LABELS,
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
      <BackToMapButton />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl bg-surface-card p-6 shadow-card ring-1 ring-surface-border sm:p-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-accent to-brand"
          />
          <h1 className="font-logo text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Metodología
          </h1>
          <p className="mt-4 text-base leading-relaxed text-fg-muted sm:text-lg">
            Cómo se recolecta la información, qué taxonomía usamos, qué hacemos
            con los datos y qué limitaciones tiene este enfoque ciudadano.
          </p>
        </header>

        {/* Recolección */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Recolección
          </h2>
          <div className="space-y-3 rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              Cualquier persona puede reportar un punto de riesgo desde el mapa,
              sin necesidad de crear una cuenta. El reporte requiere coordenadas
              (vía GPS o selección directa en el mapa), una categoría según la
              taxonomía oficial del INTRANT y una descripción textual de 10 a
              1000 caracteres. La identidad del reportante nunca se almacena.
            </p>
            <p>
              Para prevenir abuso se aplica un <em>rate limit</em> de cinco
              reportes por hora por dirección IP (almacenada como hash SHA-256
              con sal, nunca en claro). Las confirmaciones usan el mismo
              mecanismo: una IP solo puede confirmar un punto una vez.
            </p>
          </div>
        </section>

        {/* Taxonomía INTRANT */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Taxonomía INTRANT
          </h2>
          <div className="space-y-3">
            <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
              <p>
                Cada reporte se clasifica en una de las cuatro categorías que
                el{' '}
                <strong className="font-semibold text-fg">
                  Instituto Nacional de Tránsito y Transporte Terrestre
                </strong>{' '}
                (INTRANT) utiliza para analizar la siniestralidad vial.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {(
                Object.entries(CATEGORIES) as [
                  CategoryKey,
                  (typeof CATEGORIES)[CategoryKey],
                ][]
              ).map(([key, value]) => (
                <div
                  key={key}
                  className="flex flex-col rounded-2xl bg-surface-card p-5 text-sm shadow-card ring-1 ring-surface-border transition-all hover:-translate-y-0.5 hover:shadow-float"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-2 w-2 rounded-full bg-brand"
                    />
                    <div className="font-bold text-fg">{value.label}</div>
                  </div>
                  <p className="mt-2 flex-1 leading-relaxed text-fg/90">
                    {value.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {value.subcategories.map((sc) => (
                      <span
                        key={sc}
                        className="inline-flex items-center rounded-full bg-surface-raised px-2.5 py-0.5 text-xs text-fg-muted ring-1 ring-surface-border"
                      >
                        {sc}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ciclo de vida del reporte */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Ciclo de vida del reporte
          </h2>
          <div className="space-y-3">
            <p className="px-1 text-sm leading-relaxed text-fg/90">
              Cada punto reportado transita por estados que documentan la
              trazabilidad ciudadana → institucional:
            </p>
            <ol className="space-y-2">
              {(Object.entries(STATUS_LABELS) as [string, string][]).map(
                ([key, label], idx) => (
                  <li
                    key={key}
                    className="flex items-center gap-3 rounded-xl bg-surface-card p-3 text-sm shadow-card ring-1 ring-surface-border"
                  >
                    <span
                      aria-hidden
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-[11px] font-bold text-brand ring-1 ring-brand-soft"
                    >
                      {idx + 1}
                    </span>
                    <code>{key}</code>
                    <strong className="ml-1 font-semibold text-fg">
                      {label}
                    </strong>
                  </li>
                )
              )}
            </ol>
          </div>
        </section>

        {/* Limitaciones declaradas */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Limitaciones declaradas
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
            <p className="text-sm leading-relaxed text-fg/90">
              Cualquier dataset ciudadano tiene sesgos. Los declaramos:
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-fg/90">
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Sesgo de cobertura digital:
                  </strong>{' '}
                  los reportes provienen de personas con acceso a internet y
                  smartphone.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Sesgo socioeconómico:
                  </strong>{' '}
                  barrios con mayor actividad en redes reportan más.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Sin verificación oficial:
                  </strong>{' '}
                  ningún reporte se valida con AMET, 9-1-1 ni inspección
                  técnica.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Confirmaciones reflejan visibilidad:
                  </strong>{' '}
                  un punto con muchas confirmaciones puede estar en una vía
                  concurrida.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    El dataset no es exhaustivo:
                  </strong>{' '}
                  ausencia de reportes en una zona no significa ausencia de
                  riesgo.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Relación con el INTRANT */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Relación con el INTRANT
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              PuntosNegrosRD no es una iniciativa oficial del INTRANT. Es un
              esfuerzo ciudadano independiente que adopta la taxonomía técnica
              de la institución para que los datos sean compatibles y
              cruzables. El INTRANT anunció en febrero de 2025 la creación de
              su propio mapa de puntos negros con datos oficiales. Cuando esa
              iniciativa esté disponible públicamente, PuntosNegrosRD se
              ofrece a sincronizar y cruzar datasets de forma abierta.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
