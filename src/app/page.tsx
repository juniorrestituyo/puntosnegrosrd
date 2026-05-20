import MapClient from '@/components/MapClient';

export default function HomePage() {
  return (
    <main className="flex h-screen flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-brand">
              PuntosNegros<span className="text-brand-accent">RD</span>
            </h1>
            <p className="text-xs text-slate-600">
              Mapa ciudadano abierto de riesgo vial - iniciativa independiente
            </p>
          </div>
          <div className="hidden text-xs text-slate-500 sm:block">
            Haz click en el mapa para reportar un punto
          </div>
        </div>
      </header>

      <div className="flex-1">
        <MapClient />
      </div>

      <footer className="border-t border-slate-200 bg-white px-6 py-2 text-xs text-slate-500">
        Complemento ciudadano al trabajo del{' '}
        <a
          href="https://www.intrant.gob.do"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          INTRANT
        </a>
        . Datos abiertos bajo CC-BY 4.0. Codigo en{' '}
        <a
          href="https://github.com/w0rkm4n/puntosnegrosrd"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          GitHub
        </a>
        .
      </footer>
    </main>
  );
}
