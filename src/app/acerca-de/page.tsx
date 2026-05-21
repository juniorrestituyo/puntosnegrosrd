import type { Metadata } from 'next';
import Link from 'next/link';

import SideDrawer from '@/components/SideDrawer';

export const metadata: Metadata = {
  title: 'Acerca de - PuntosNegrosRD',
  description: 'Quién está detrás del proyecto, por qué existe y cómo participar.',
};

export default function AcercaDePage() {
  return (
    <main className="relative min-h-screen bg-surface-base">
      <SideDrawer current="acerca" />

      <div className="mx-auto max-w-3xl px-4 pb-12 pt-20 sm:px-6 sm:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-fg">
          Acerca de PuntosNegrosRD
        </h1>

        <section className="mt-6 space-y-3 text-fg/90">
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
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">
            Iniciativa ciudadana independiente
          </h2>
          <p className="text-sm text-fg/90">
            Este sitio no es un proyecto oficial del Instituto Nacional de
            Tránsito y Transporte Terrestre (INTRANT), ni de la Autoridad
            Metropolitana de Transporte (AMET), ni de ninguna institución
            pública o privada. Es un esfuerzo ciudadano independiente que
            adopta la taxonomía técnica del INTRANT para que los datos sean
            directamente cruzables con análisis institucionales.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">
            Compromiso con los datos abiertos
          </h2>
          <p className="text-sm text-fg/90">
            Todos los reportes se publican como dataset descargable en formatos
            CSV y GeoJSON bajo licencia{' '}
            <a
              href="https://creativecommons.org/licenses/by/4.0/deed.es"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              Creative Commons Atribución 4.0
            </a>
            . El código fuente es público y se distribuye bajo licencia MIT en{' '}
            <a
              href="https://github.com/w0rkm4n/puntosnegrosrd"
              target="_blank"
              rel="noreferrer"
              className="text-brand hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Privacidad</h2>
          <p className="text-sm text-fg/90">
            No se requiere crear una cuenta para reportar. No usamos cookies
            de seguimiento ni analítica de terceros. Las direcciones IP se
            almacenan únicamente como hash SHA-256 con sal, exclusivamente
            para limitar abuso.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">¿Cómo puedes ayudar?</h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-fg/90">
            <li><strong>Reporta puntos:</strong> en tu barrio, en tu ruta diaria, frente a la escuela de tus hijos.</li>
            <li><strong>Confirma reportes:</strong> los puntos con más confirmaciones suben en visibilidad.</li>
            <li><strong>Comparte con tu regidor:</strong> usa la página de detalle del punto para enviar el reporte.</li>
            <li><strong>Si eres desarrollador:</strong> el repo está en GitHub. Issues y PRs bienvenidos.</li>
            <li><strong>Si eres investigador o periodista:</strong> descarga el dataset, crúzalo con tus fuentes, cita el origen.</li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-lg font-semibold text-fg">Sobre el contexto</h2>
          <p className="text-sm text-fg/90">
            La República Dominicana presenta una de las tasas de mortalidad
            vial más altas de América. Detrás de cada cifra hay una historia
            —un casco no abrochado, un semáforo apagado hace meses, una curva
            sin iluminación, un paso peatonal borrado frente a una escuela.
            PuntosNegrosRD aporta una pieza concreta: visibilizar lo que la
            ciudadanía ya sabe pero hoy no tiene cómo decir colectivamente.
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
