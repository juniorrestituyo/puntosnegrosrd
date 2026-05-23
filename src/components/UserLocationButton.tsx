'use client';

interface UserLocationButtonProps {
  isTracking: boolean;
  isLoading: boolean;
  onToggle: () => void;
}

export default function UserLocationButton({
  isTracking,
  isLoading,
  onToggle,
}: UserLocationButtonProps) {
  // El boton ya no es toggle (mostrar/ocultar). Ahora cada click
  // es una accion de "llevame a mi ubicacion ahora" con fly smooth.
  // isTracking solo controla el color del icono (azul cuando hay
  // GPS activo, neutro cuando no).
  const label = 'Ir a mi ubicacion';

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isLoading}
      aria-label={label}
      title={label}
      className={`absolute bottom-28 right-3 z-[1080] flex h-16 w-16 items-center justify-center rounded-full shadow-float transition-colors sm:bottom-36 sm:right-6 sm:h-20 sm:w-20 ${
        isTracking
          ? 'bg-brand text-white hover:bg-brand-accent'
          : 'bg-surface-card text-fg hover:bg-surface-raised'
      } ${isLoading ? 'cursor-wait opacity-70' : ''}`}
    >
      {isLoading ? (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin"
          aria-hidden
        >
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
      ) : (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <circle
            cx="12"
            cy="12"
            r="2.5"
            fill={isTracking ? 'currentColor' : 'none'}
          />
        </svg>
      )}
    </button>
  );
}
