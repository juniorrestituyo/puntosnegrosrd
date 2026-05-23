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
    'Cómo se recolectan los datos, marco de clasificación de factores de riesgo, ciclo de vida del reporte y limitaciones declaradas.',
};

export default function MetodologiaPage() {
  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="metodologia" variant="static" />
      <BackToMapButton variant="static" />

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
            Cómo se recolecta la información, qué marco de clasificación
            usamos, qué hacemos con los datos y qué limitaciones tiene este
            enfoque ciudadano.
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
              (vía GPS o selección directa en el mapa), una categoría según el
              marco de factores de riesgo descrito más abajo, y una descripción
              textual de 10 a 1000 caracteres. La identidad del reportante
              nunca se almacena.
            </p>
            <p>
              Para prevenir abuso se aplica un <em>rate limit</em> de cinco
              reportes por hora por dirección IP (almacenada como hash SHA-256
              con sal, nunca en claro). Las confirmaciones usan el mismo
              mecanismo: una IP solo puede confirmar un punto una vez.
            </p>
          </div>
        </section>

        {/* Taxonomía INTRANT (verificable) */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Taxonomía oficial INTRANT
          </h2>
          <div className="space-y-3">
            <div className="space-y-3 rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
              <p>
                Cada reporte se clasifica en una de las cuatro categorías que
                el{' '}
                <strong className="font-semibold text-fg">
                  Instituto Nacional de Tránsito y Transporte Terrestre
                </strong>{' '}
                (INTRANT) utiliza para analizar la siniestralidad vial.
              </p>
              <p>
                La taxonomía está anclada en la declaración pública del
                director de tránsito y vialidad del INTRANT,{' '}
                <strong className="font-semibold text-fg">
                  Joel Gneco Gross
                </strong>
                , quien describió textualmente los cuatro factores el 5 de
                marzo de 2026 en Telenord:
              </p>
              <blockquote className="border-l-2 border-brand pl-4 italic text-fg-muted">
                &quot;...lo cual puede responder a cuatro factores diferentes:
                factor humano, vehicular, infraestructural y climática.&quot;
              </blockquote>
              <p className="text-xs text-fg-muted">
                Fuente verificable:{' '}
                <a
                  href="https://www.telenord.com/noticias/nacionales/88358-intrant-identifica-puntos-negros-de-accidentes-de-transito-fatales-en-zonas-de-rd.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-brand hover:underline"
                >
                  Telenord — INTRANT identifica puntos negros de accidentes de
                  tránsito fatales en zonas de RD
                </a>
              </p>
              <p>
                PuntosNegrosRD adopta esta taxonomía como lenguaje compartido
                con la institución, lo que hace que el dataset ciudadano sea
                directamente cruzable con análisis institucionales futuros sin
                necesidad de mapeo de equivalencias.
              </p>
              <p className="text-xs text-fg-muted">
                <strong className="font-semibold text-fg">Nota:</strong>{' '}
                PuntosNegrosRD no es una iniciativa oficial del INTRANT. La
                adopción de su taxonomía es por alineamiento metodológico, no
                por endoso ni patrocinio.
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
                  ningún reporte se valida con DIGESETT, 9-1-1 ni inspección
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
              PuntosNegrosRD es un esfuerzo ciudadano independiente. Adoptamos
              la taxonomía técnica del INTRANT para que los datos sean
              compatibles con análisis institucionales y cruzables con otros
              estudios. El INTRANT anunció el 5 de marzo de 2026 la creación
              de su propio mapa de puntos negros con datos oficiales. Cuando
              esa iniciativa esté disponible públicamente, PuntosNegrosRD se
              ofrece a sincronizar y cruzar datasets de forma abierta.
            </p>
          </div>
        </section>

        {/* Referencias */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Referencias
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 shadow-card ring-1 ring-surface-border sm:p-6">
            <p className="text-sm leading-relaxed text-fg/90">
              Documentos públicos consultados para el diseño del marco de
              clasificación:
            </p>
            <ul className="mt-3 space-y-3 text-sm leading-relaxed text-fg/90">
              <li>
                <div className="font-semibold text-fg">
                  Fuente primaria de la taxonomía: Telenord — Joel Gneco
                  Gross (INTRANT), 5 de marzo de 2026
                </div>
                <a
                  href="https://www.telenord.com/noticias/nacionales/88358-intrant-identifica-puntos-negros-de-accidentes-de-transito-fatales-en-zonas-de-rd.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-xs text-brand hover:underline"
                >
                  telenord.com/.../88358-intrant-identifica-puntos-negros-de-accidentes-de-transito-fatales-en-zonas-de-rd.html
                </a>
              </li>
              <li>
                <div className="font-semibold text-fg">
                  Plan Estratégico Nacional para la Seguridad Vial de la
                  República Dominicana 2021-2030 (INTRANT)
                </div>
                <a
                  href="https://wp.intrant.gob.do/wp-content/uploads/2023/06/Plan-Estrategico-Nacional-Seguridad-Vial-Republica-Dominicana-2021-2030.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-xs text-brand hover:underline"
                >
                  wp.intrant.gob.do/.../Plan-Estrategico-Nacional-Seguridad-Vial-Republica-Dominicana-2021-2030.pdf
                </a>
              </li>
              <li>
                <div className="font-semibold text-fg">
                  Informe Nacional de Seguridad Vial 2023 (OPSEVI / INTRANT)
                </div>
                <a
                  href="https://opsevi.intrant.gob.do/wp-content/uploads/2024/12/Informe-Nacional-de-Seguridad-Vial-2023.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-xs text-brand hover:underline"
                >
                  opsevi.intrant.gob.do/.../Informe-Nacional-de-Seguridad-Vial-2023.pdf
                </a>
              </li>
              <li>
                <div className="font-semibold text-fg">
                  Decade of Action for Road Safety 2021-2030 (Organización
                  Mundial de la Salud)
                </div>
                <a
                  href="https://www.who.int/teams/social-determinants-of-health/safety-and-mobility/decade-of-action-for-road-safety-2021-2030"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-xs text-brand hover:underline"
                >
                  who.int/.../decade-of-action-for-road-safety-2021-2030
                </a>
              </li>
              <li>
                <div className="font-semibold text-fg">
                  Global Plan for the Decade of Action for Road Safety
                  2021-2030 (OMS)
                </div>
                <a
                  href="https://www.who.int/publications/m/item/global-plan-for-the-decade-of-action-for-road-safety-2021-2030"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block break-all text-xs text-brand hover:underline"
                >
                  who.int/publications/m/item/global-plan-for-the-decade-of-action-for-road-safety-2021-2030
                </a>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
