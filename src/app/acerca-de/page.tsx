import type { Metadata } from 'next';

import BackToMapButton from '@/components/BackToMapButton';
import SideDrawer from '@/components/SideDrawer';

export const metadata: Metadata = {
  title: 'Acerca de - PuntosNegrosRD',
  description: 'Quién está detrás del proyecto, por qué existe y cómo participar.',
};

export default function AcercaDePage() {
  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="acerca" />
      <BackToMapButton />

      <div className="mx-auto max-w-3xl px-4 pb-16 pt-20 sm:px-6 sm:pt-24">
        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl bg-surface-card p-6 shadow-card ring-1 ring-surface-border sm:p-8">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand via-brand-accent to-brand"
          />
          <h1 className="font-logo text-4xl font-bold tracking-tight text-fg sm:text-5xl">
            Acerca de PuntosNegrosRD
          </h1>
          <div className="mt-4 space-y-3 text-base leading-relaxed text-fg-muted sm:text-lg">
            <p>
              PuntosNegrosRD es una plataforma ciudadana abierta, gratuita y de
              código libre donde cualquier persona en la República Dominicana
              puede reportar puntos de riesgo vial.
            </p>
            <p>
              El proyecto nace de una observación simple: los vecinos saben
              cuáles esquinas matan en su barrio, pero ese conocimiento vive
              fragmentado en grupos de WhatsApp y conversaciones cotidianas.
              PuntosNegrosRD lo convierte en un mapa público, georreferenciado
              y descargable como dataset abierto.
            </p>
          </div>
        </header>

        {/* Iniciativa ciudadana independiente */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Iniciativa ciudadana independiente
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              Este sitio no es un proyecto oficial del Instituto Nacional de
              Tránsito y Transporte Terrestre (INTRANT), ni de la Dirección
              General de Seguridad de Tránsito y Transporte Terrestre
              (DIGESETT), ni de ninguna institución pública o privada. Es un
              esfuerzo ciudadano independiente que adopta la taxonomía
              técnica del INTRANT para que los datos sean directamente
              cruzables con análisis institucionales.
            </p>
          </div>
        </section>

        {/* Compromiso con los datos abiertos */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Compromiso con los datos abiertos
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              Todos los reportes se publican como dataset descargable en
              formatos CSV y GeoJSON bajo licencia{' '}
              <a
                href="https://creativecommons.org/licenses/by/4.0/deed.es"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
              >
                Creative Commons Atribución 4.0
              </a>
              . El código fuente es público y se distribuye bajo licencia MIT
              en{' '}
              <a
                href="https://github.com/w0rkm4n/puntosnegrosrd"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand underline decoration-brand-soft underline-offset-2 hover:decoration-brand"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </section>

        {/* Privacidad */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Privacidad
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              No se requiere crear una cuenta para reportar. No usamos cookies
              de seguimiento ni analítica de terceros. Las direcciones IP se
              almacenan únicamente como hash SHA-256 con sal, exclusivamente
              para limitar abuso.
            </p>
          </div>
        </section>

        {/* ¿Cómo puedes ayudar? */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            ¿Cómo puedes ayudar?
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
                    Reporta puntos:
                  </strong>{' '}
                  en tu barrio, en tu ruta diaria, frente a la escuela de tus
                  hijos.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Confirma reportes:
                  </strong>{' '}
                  los puntos con más confirmaciones suben en visibilidad.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Comparte con tu regidor:
                  </strong>{' '}
                  usa la página de detalle del punto para enviar el reporte.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Si eres desarrollador:
                  </strong>{' '}
                  el repo está en GitHub. Issues y PRs bienvenidos.
                </span>
              </li>
              <li className="flex gap-3">
                <span
                  aria-hidden
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                />
                <span>
                  <strong className="font-semibold text-fg">
                    Si eres investigador o periodista:
                  </strong>{' '}
                  descarga el dataset, crúzalo con tus fuentes, cita el origen.
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Sobre el contexto */}
        <section className="mt-6">
          <h2 className="mb-3 flex items-center gap-3 px-1 text-lg font-bold tracking-tight text-fg">
            <span
              aria-hidden
              className="block h-6 w-1 rounded-full bg-brand"
            />
            Sobre el contexto
          </h2>
          <div className="rounded-2xl bg-surface-card p-5 text-sm leading-relaxed text-fg/90 shadow-card ring-1 ring-surface-border sm:p-6">
            <p>
              La República Dominicana presenta una de las tasas de mortalidad
              vial más altas de América. Detrás de cada cifra hay una historia:
              un casco no abrochado, un semáforo apagado hace meses, una curva
              sin iluminación, un paso peatonal borrado frente a una escuela.
              PuntosNegrosRD aporta una pieza concreta: visibilizar lo que la
              ciudadanía ya sabe pero hoy no tiene cómo decir colectivamente.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
