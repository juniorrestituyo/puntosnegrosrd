'use client';

/**
 * Tour de bienvenida para primeros usuarios.
 *
 * - Detecta primer uso via localStorage (key versionada `pn:onboarding-v1-done`).
 *   Si subimos a v2 en el futuro (porque agregamos features), todos los
 *   usuarios lo vuelven a ver una vez.
 * - 5 steps con dots de progreso: bienvenida, reportar, filtrar, confirmar,
 *   listo.
 * - Bottom-sheet en mobile, modal centrado en desktop.
 * - "Saltar" disponible en todos los steps. Cerrar (X) tambien marca como
 *   visto.
 * - Re-abrible desde SideDrawer via:
 *     a) Custom event 'pn:open-tour' (same-page).
 *     b) sessionStorage 'pn:pending-tour' (cross-page: el drawer lo setea,
 *        navega a /, OnboardingTour lo lee al montar).
 *   El handler limpia el sessionStorage para no re-abrir al regresar.
 */

import { useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'pn:onboarding-v1-done';
const PENDING_KEY = 'pn:pending-tour';
const OPEN_EVENT = 'pn:open-tour';

interface Step {
  title: string;
  body: string;
  icon: ReactNode;
}

function IconMap() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z" />
      <line x1="9" y1="4" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="20" />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function IconFilter() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="10" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function IconSparkle() {
  return (
    <svg
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z" />
      <path d="M19 14l.6 1.6L21 16.2l-1.4.6L19 18.4l-.6-1.6L17 16.2l1.4-.6L19 14z" />
      <path d="M5 16l.5 1.3L6.8 18l-1.3.5L5 19.8l-.5-1.3L3.2 18l1.3-.5L5 16z" />
    </svg>
  );
}

const STEPS: Step[] = [
  {
    title: 'Bienvenido a PuntosNegrosRD',
    body: 'Iniciativa ciudadana para mapear puntos negros y peligros viales en Republica Dominicana. Veamos como funciona en 30 segundos.',
    icon: <IconMap />,
  },
  {
    title: 'Reportar un punto',
    body: 'Toca el boton + en la esquina inferior derecha. Puedes usar tu ubicacion actual o seleccionar un punto del mapa.',
    icon: <IconPlus />,
  },
  {
    title: 'Filtrar reportes',
    body: 'Abre el panel de filtros (boton superior derecho) para ver solo las categorias o estados que te interesan: accidentes, baches, semaforos, etc.',
    icon: <IconFilter />,
  },
  {
    title: 'Confirmar reportes',
    body: 'Toca un punto del mapa y pulsa "Confirmar" si lo conoces. Mas confirmaciones = mas visibilidad. Asi entre todos validamos lo que pasa en las calles.',
    icon: <IconCheck />,
  },
  {
    title: 'Listo para comenzar',
    body: 'Explora el mapa, reporta lo que veas y confirma lo que otros marcaron. Cada reporte ayuda a las autoridades a actuar.',
    icon: <IconSparkle />,
  },
];

export default function OnboardingTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);

  // Mount-time: check pending flag (cross-page open) y first-time flag.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    try {
      const pending = window.sessionStorage.getItem(PENDING_KEY);
      if (pending) {
        window.sessionStorage.removeItem(PENDING_KEY);
        setStep(0);
        setActive(true);
        return;
      }

      const done = window.localStorage.getItem(STORAGE_KEY);
      if (!done) {
        // Pequeño delay para que el mapa se vea brevemente primero;
        // da contexto visual antes de tapar la pantalla con el tour.
        timer = setTimeout(() => {
          setStep(0);
          setActive(true);
        }, 600);
      }
    } catch {
      // storage no disponible (ej. modo incognito estricto) — saltamos
      // el tour silenciosamente.
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Listener para reabrir desde SideDrawer (same-page).
  useEffect(() => {
    function handler() {
      try {
        window.sessionStorage.removeItem(PENDING_KEY);
      } catch {
        /* noop */
      }
      setStep(0);
      setActive(true);
    }
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, []);

  // Bloquear scroll del body mientras el tour esta abierto, igual que
  // SideDrawer. Evita que el contenido detras se mueva al scrollear
  // dentro de la card en mobile.
  useEffect(() => {
    if (!active) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [active]);

  // Escape para cerrar.
  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') finish();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function finish() {
    setActive(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) setStep((s) => s - 1);
  }

  if (!active) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div
      className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/45 px-0 backdrop-blur-sm sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="w-full max-w-md animate-[page-enter_220ms_ease-out_both] rounded-t-2xl bg-surface-card shadow-2xl ring-1 ring-surface-border sm:rounded-2xl">
        {/* Header: dots de progreso + boton cerrar */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-1.5" aria-hidden>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step
                    ? 'w-6 bg-brand'
                    : i < step
                      ? 'w-2 bg-brand/40'
                      : 'w-2 bg-surface-border'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={finish}
            aria-label="Cerrar tour"
            className="rounded-md p-1 text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body: icono + titulo + descripcion */}
        <div className="px-6 pb-2 pt-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-subtle text-brand">
            {current.icon}
          </div>
          <h2
            id="onboarding-title"
            className="font-logo text-xl font-bold tracking-tight text-fg"
          >
            {current.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-fg-muted">
            {current.body}
          </p>
        </div>

        {/* Footer: Atras + Saltar + Siguiente/Comenzar */}
        <div className="flex items-center justify-between gap-3 border-t border-surface-border px-5 py-4">
          <button
            type="button"
            onClick={back}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isFirst
                ? 'invisible'
                : 'text-fg-muted hover:bg-surface-raised hover:text-fg'
            }`}
            aria-hidden={isFirst}
            tabIndex={isFirst ? -1 : 0}
          >
            Atras
          </button>
          <button
            type="button"
            onClick={finish}
            className="rounded-lg px-3 py-2 text-sm font-medium text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
          >
            Saltar
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-accent"
          >
            {isLast ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
      </div>
    </div>
  );
}
