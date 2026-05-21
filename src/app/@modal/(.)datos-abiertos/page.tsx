import DatosAbiertosPage from '@/app/datos-abiertos/page';

/**
 * Intercepting route: cuando el usuario hace soft-nav desde `/` (mapa)
 * hacia `/datos-abiertos`, esta version se renderiza en el slot @modal
 * mientras que el children slot sigue mostrando el mapa. Asi MapClient
 * no se desmonta y al volver, el mapa esta en el mismo estado (zoom,
 * pan, GPS, points cargados).
 *
 * En navegacion dura (refresh, deep link), Next.js usa la ruta real
 * `/datos-abiertos/page.tsx` directamente sin intercept.
 */
export default function InterceptedDatosAbiertos() {
  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-surface-base">
      <DatosAbiertosPage />
    </div>
  );
}
