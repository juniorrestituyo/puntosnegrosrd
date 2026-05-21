import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PuntosNegrosRD - Mapa ciudadano de riesgo vial',
  description:
    'Plataforma ciudadana abierta para reportar puntos negros viales en la Republica Dominicana. Datos abiertos bajo licencia CC-BY 4.0.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
  applicationName: 'PuntosNegrosRD',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PuntosNegrosRD',
  },
  openGraph: {
    title: 'PuntosNegrosRD',
    description:
      'Mapa ciudadano abierto de riesgo vial en Republica Dominicana.',
    locale: 'es_DO',
    type: 'website',
    siteName: 'PuntosNegrosRD',
  },
  twitter: {
    card: 'summary',
    title: 'PuntosNegrosRD',
    description: 'Mapa ciudadano abierto de riesgo vial en Republica Dominicana.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-surface-base text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
