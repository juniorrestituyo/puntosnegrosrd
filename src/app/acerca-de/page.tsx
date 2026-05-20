import type { Metadata } from 'next';
import Link from 'next/link';

import SiteNav from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'Acerca de - PuntosNegrosRD',
  description:
    'Quién está detrás del proyecto, por qué existe y cómo participar.',
};

export default function AcercaDePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight text-brand">
          PuntosNegros<span className="text-brand-accent">RD</span>
        </Link>
        <SiteNav current="acerca" />
      </header>

      <h1 className="text-3xl font-bold tracking-tight text-brand">
        Acerca de PuntosNegrosRD
      </h1>

      <section className="mt-6 space-y-3">
        <p className="text-slate-700">
          PuntosNegrosRD es una plataforma ciudadana abierta, gratuita y de
          código libre donde cualquier persona en la República Dominicana
          puede reportar puntos de riesgo vial: intersecciones peligrosas,
          baches críticos, semáforos dañados, falta de iluminación, paso
          peatonal borrado frente a una escuela, zonas que se inundan.
        </p>
        <p className="text-slate-700">
          El proyecto nace de una observación simple: los vecinos saben
          cuáles esquinas matan en su barrio, pero ese conocimiento vive
          fragmentado en grupos de WhatsApp y conversaciones cotidianas.
          PuntosNegrosRD lo convierte en un mapa público, georreferenciado,
          descargable como dataset abierto, que cualquier periodista, ONG,
          regidor o técnico de planificación urbana puede consultar y
          cruzar con datos oficiales.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Iniciativa ciudadana independiente
        </h2>
        <p className="text-sm text-slate-700">
          Este sitio no es un proyecto oficial del Instituto Nacional de
          Tránsito y Transporte Terrestre (INTRANT), ni de la Autoridad
          Metropolitana de Transporte (AMET), ni de ninguna otra institución
          pública o privada. Es un esfuerzo ciudadano independiente. La
          plataforma adopta de manera explícita la taxonomía técnica que el
          INTRANT utiliza para sus análisis (humano, vehicular,
          infraestructural y climático) con el objetivo de que los datos
          ciudadanos sean directamente cruzables con análisis institucionales.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Compromiso con los datos abiertos
        </h2>
        <p className="text-sm text-slate-700">
          Todos los reportes se publican como dataset descargable en formatos
          CSV y GeoJSON bajo licencia{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.es"
            target="_blank"
            rel="noreferrer"
            className="text-brand-accent underline"
          >
            Creative Commons Atribución 4.0
          </a>
          . El código fuente de la plataforma es público y se distribuye bajo
          licencia MIT en{' '}
          <a
            href="https://github.com/w0rkm4n/puntosnegrosrd"
            target="_blank"
            rel="noreferrer"
            className="text-brand-accent underline"
          >
            GitHub
          </a>
          .
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Privacidad</h2>
        <p className="text-sm text-slate-700">
          No se requiere crear una cuenta para reportar. No usamos cookies
          de seguimiento ni analítica de terceros. Las direcciones IP de
          los reportantes se almacenan únicamente como hash SHA-256 con
          sal, exclusivamente para limitar abuso (rate limit y
          deduplicación de confirmaciones). Las descripciones ciudadanas
          son visibles públicamente y deberían tratar el lugar, no a las
          personas.
        </p>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          ¿Cómo puedes ayudar?
        </h2>
        <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
          <li>
            <strong>Reporta puntos:</strong> en tu barrio, en tu ruta diaria,
            frente a la escuela de tus hijos.
          </li>
          <li>
            <strong>Confirma reportes:</strong> los puntos con más
            confirmaciones ciudadanas suben en visibilidad.
          </li>
          <li>
            <strong>Comparte con tu regidor:</strong> usa la página de
            detalle del punto para copiar el enlace y enviárselo a la junta
            municipal de tu municipio (el botón &ldquo;Compartir con
            autoridad&rdquo; se activa en la siguiente versión).
          </li>
          <li>
            <strong>Si eres desarrollador:</strong> el repo está en GitHub.
            Issues, PRs y forks son bienvenidos.
          </li>
          <li>
            <strong>Si eres investigador o periodista:</strong> descarga el
            dataset, cruzalo con tus fuentes, cita el origen.
          </li>
        </ul>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">
          Sobre el contexto
        </h2>
        <p className="text-sm text-slate-700">
          La República Dominicana presenta una de las tasas de mortalidad
          vial más altas de América. Detrás de cada cifra hay una historia
          —un casco no abrochado, un semáforo apagado hace meses, una curva
          sin iluminación, un paso peatonal borrado frente a una escuela.
          Reducir esa cifra requiere una combinación de educación
          ciudadana, intervención técnica y voluntad política. PuntosNegrosRD
          aporta una pieza concreta: visibilizar de forma pública,
          georreferenciada y descargable lo que la ciudadanía ya sabe pero
          hoy no tiene cómo decir colectivamente.
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
