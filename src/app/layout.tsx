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

/**
 * Resuelve el origen absoluto para Open Graph / Twitter / favicon en
 * cascada defensiva:
 *
 *  1. NEXT_PUBLIC_SITE_URL — env var explicita. IGNORADA si apunta a
 *     localhost (caso real: el SETUP.md sugeria 'http://localhost:3000'
 *     para dev y se quedo asi en Vercel — pero localhost no es accesible
 *     desde los crawlers de Facebook/WhatsApp/Telegram).
 *  2. VERCEL_ENV === 'production' → URL canonica hardcoded.
 *  3. VERCEL_URL — auto-inyectada por Vercel (preview deploys).
 *  4. http://localhost:3000 — solo `npm run dev`.
 */
function resolveMetadataBase(): URL {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit && !explicit.includes('localhost')) {
    return new URL(explicit);
  }
  if (process.env.VERCEL_ENV === 'production') {
    return new URL('https://puntosnegrosrd.vercel.app');
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`);
  }
  return new URL('http://localhost:3000');
}

export const metadata: Metadata = {
  title: 'PuntosNegrosRD - Mapa ciudadano de riesgo vial',
  description:
    'Plataforma ciudadana abierta para reportar puntos negros viales en la Republica Dominicana. Datos abiertos bajo licencia CC-BY 4.0.',
  // metadataBase determina el origen absoluto para URLs relativas en
  // openGraph.images, twitter.images, etc. Si Facebook/WhatsApp/Telegram
  // ven una URL no-absoluta o que apunta a localhost, el preview falla
  // y caen al favicon.
  metadataBase: resolveMetadataBase(),
  manifest: '/manifest.webmanifest',
  icons: {
    // Iconos para favicon / chrome tab / android home screen (PWA).
    // Los maskable estan declarados en manifest.webmanifest con
    // purpose='maskable' (Android los usa para evitar el cuadro
    // blanco alrededor del logo al instalar como PWA).
    icon: [
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    // iOS no usa maskable — Springboard solo aplica corner radius leve.
    // apple-touch-icon es full square con fondo negro de borde a borde
    // y el logo al 90% (sin transparencia en las esquinas).
    apple: [
      { url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
    ],
    shortcut: [{ url: '/icon-192.png', type: 'image/png' }],
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
    // Sin og:image explicito los previewers de WhatsApp/Telegram fallback
    // al favicon (circulo negro con esquinas transparentes) y rellenan
    // el frame con blanco. Esta imagen es un banner 1200x630 full-bleed
    // negro con el logo centrado — sin transparencia, sin frame blanco.
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PuntosNegrosRD - Mapa ciudadano de riesgo vial',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PuntosNegrosRD',
    description: 'Mapa ciudadano abierto de riesgo vial en Republica Dominicana.',
    images: ['/og-image.png'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  // theme-color blanco para que las barras del sistema (status bar
  // en top, nav bar en bottom en Android, home indicator en iOS)
  // se vean blancas, sin la franja azul brand ni la franja negra del
  // splash. Android/iOS detectan que el color es claro y conmutan
  // automaticamente los iconos del sistema (reloj, wifi, bateria) a
  // tono oscuro para que sigan siendo legibles.
  themeColor: '#ffffff',
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
