import type { Metadata, Viewport } from 'next';
import { Space_Grotesk } from 'next/font/google';

import PageTransition from '@/components/PageTransition';
import './globals.css';

// Fuente del logo / wordmark "PuntosNegrosRD".
// Space Grotesk: geometrica, moderna, con personalidad sin ser trendy.
const logoFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '700'],
  variable: '--font-logo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PuntosNegrosRD - Mapa ciudadano de riesgo vial',
  description:
    'Plataforma ciudadana abierta para reportar puntos negros viales en la Republica Dominicana. Datos abiertos bajo licencia CC-BY 4.0.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  ),
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/icon.png', type: 'image/png' }],
    apple: [{ url: '/icon.png', type: 'image/png' }],
    shortcut: [{ url: '/icon.png', type: 'image/png' }],
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
  // viewportFit: 'cover' permite que el contenido se extienda detras
  // de las barras del sistema (gesture bar en Android, notch en iOS).
  // Sin esto la PWA deja una franja vacia abajo en Android.
  viewportFit: 'cover',
  themeColor: '#2563eb',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={logoFont.variable}>
      <body className="min-h-screen bg-surface-base text-fg antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
