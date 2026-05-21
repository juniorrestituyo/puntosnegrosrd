/**
 * Generador de iconos PWA + apple-touch-icon a partir de public/icon.png.
 *
 * El source es un circulo negro con esquinas transparentes. Tal cual,
 * Android lo enmascara (rounded-square / squircle) y rellena las esquinas
 * transparentes con el fondo blanco del sistema => se ve un cuadrado
 * blanco rodeando un circulo negro.
 *
 * Este script genera:
 *
 *  - icon-192.png / icon-512.png  (purpose: "any")
 *      Source escalado a tamaño, esquinas siguen transparentes.
 *      Fallback para clientes que no implementen maskable.
 *
 *  - icon-maskable-192.png / icon-maskable-512.png (purpose: "maskable")
 *      Cuadrado completo con fondo negro de borde a borde. El logo se
 *      escala al 80% del canvas y va centrado (safe zone). Android puede
 *      aplicar cualquier mascara — el resultado siempre se ve completo,
 *      sin bordes blancos del sistema.
 *
 *  - apple-touch-icon.png (180x180)
 *      Cuadrado completo con fondo negro, logo al 90% (iOS aplica solo
 *      corner radius leve, no enmascaramiento agresivo). Sin transparencia.
 *
 * Para regenerar:
 *   node scripts/generate-icons.mjs
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'public', 'icon.png');
const OUT_DIR = path.join(ROOT, 'public');

const BLACK = { r: 0, g: 0, b: 0 };

async function generateMaskable(size, safeZonePct, outName) {
  const safeSize = Math.round(size * safeZonePct);
  const offset = Math.round((size - safeSize) / 2);

  const logoBuf = await sharp(SRC)
    .resize(safeSize, safeSize, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: BLACK,
    },
  })
    .composite([{ input: logoBuf, top: offset, left: offset }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, outName));

  return outName;
}

async function generateAny(size, outName) {
  await sharp(SRC)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, outName));

  return outName;
}

/**
 * Open Graph image para link previews (WhatsApp, Telegram, Facebook,
 * Twitter, LinkedIn). Full-bleed negro de 1200x630 (ratio 1.91:1 que
 * Facebook recomienda; WhatsApp acepta cualquier ratio). El logo va
 * centrado, escalado a 500px de alto (~80% del alto del canvas).
 * Sin esa imagen explicita los previewers fallback a icon-192 o
 * favicon, que tienen esquinas transparentes y se renderean con
 * fondo blanco en WhatsApp.
 */
async function generateOgImage() {
  const W = 1200;
  const H = 630;
  const LOGO_H = 500;

  const logoBuf = await sharp(SRC)
    .resize(LOGO_H, LOGO_H, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  const left = Math.round((W - LOGO_H) / 2);
  const top = Math.round((H - LOGO_H) / 2);

  const outName = 'og-image.png';
  await sharp({
    create: {
      width: W,
      height: H,
      channels: 3,
      background: BLACK,
    },
  })
    .composite([{ input: logoBuf, top, left }])
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, outName));

  return outName;
}

async function main() {
  // Validar fuente
  try {
    await fs.access(SRC);
  } catch {
    console.error(`Source no encontrado: ${SRC}`);
    process.exit(1);
  }

  const generated = [];

  // "any" (fallback, mantiene la silueta circular original)
  generated.push(await generateAny(192, 'icon-192.png'));
  generated.push(await generateAny(512, 'icon-512.png'));

  // "maskable" (safe zone 80% — Android adaptive icon)
  generated.push(await generateMaskable(192, 0.8, 'icon-maskable-192.png'));
  generated.push(await generateMaskable(512, 0.8, 'icon-maskable-512.png'));

  // Apple touch icon (90% — solo corner radius leve de iOS, mas aire para el logo)
  generated.push(await generateMaskable(180, 0.9, 'apple-touch-icon.png'));

  // Open Graph image para link previews en redes sociales / mensajeria
  generated.push(await generateOgImage());

  console.log('Iconos generados:');
  for (const f of generated) {
    const stat = await fs.stat(path.join(OUT_DIR, f));
    console.log(`  - ${f} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
