import AcercaDePage from '@/app/acerca-de/page';

/**
 * Intercepting route para /acerca-de desde el mapa.
 * Ver app/@modal/(.)datos-abiertos/page.tsx para el patron.
 */
export default function InterceptedAcercaDe() {
  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-surface-base">
      <AcercaDePage />
    </div>
  );
}
