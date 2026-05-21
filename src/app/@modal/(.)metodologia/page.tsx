import MetodologiaPage from '@/app/metodologia/page';

/**
 * Intercepting route para /metodologia desde el mapa.
 * Ver app/@modal/(.)datos-abiertos/page.tsx para el patron.
 */
export default function InterceptedMetodologia() {
  return (
    <div className="fixed inset-0 z-[3000] overflow-y-auto bg-surface-base">
      <MetodologiaPage />
    </div>
  );
}
