export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-brand">
          PuntosNegros<span className="text-brand-accent">RD</span>
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Mapa ciudadano abierto de riesgo vial en la Republica Dominicana.
        </p>
      </header>

      <section className="space-y-4 text-slate-700">
        <p>
          Iniciativa ciudadana independiente. Complemento al trabajo del{' '}
          <a
            href="https://www.intrant.gob.do"
            target="_blank"
            rel="noreferrer"
            className="text-brand-accent underline"
          >
            INTRANT
          </a>
          . Datos abiertos bajo licencia CC-BY 4.0.
        </p>

        <div className="rounded border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <strong>Estado:</strong> bootstrap inicial. El mapa interactivo
          aparecera en la siguiente iteracion.
        </div>
      </section>

      <footer className="mt-16 text-xs text-slate-500">
        Codigo abierto en{' '}
        <a
          href="https://github.com/w0rkm4n/puntosnegrosrd"
          target="_blank"
          rel="noreferrer"
          className="underline"
        >
          github.com/w0rkm4n/puntosnegrosrd
        </a>
      </footer>
    </main>
  );
}
