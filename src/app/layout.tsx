import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PuntosNegrosRD — Mapa ciudadano de riesgo vial',
  description:
    'Plataforma ciudadana abierta para reportar puntos negros viales en la República Dominicana. Datos abiertos bajo licencia CC-BY 4.0.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  openGraph: {
    title: 'PuntosNegrosRD',
    description:
      'Mapa ciudadano abierto de riesgo vial en República Dominicana.',
    locale: 'es_DO',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
