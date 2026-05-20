/**
 * Procesamiento de imagenes en el cliente.
 * IMPORTANTE: este modulo usa Canvas API, NO importar desde codigo server.
 *
 * Re-codificacion en canvas elimina la metadata EXIF (incluyendo
 * geolocalizacion del dispositivo) sin necesidad de una libreria extra.
 * El usuario solo expone la coordenada que selecciono en el mapa.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  size: number;
}

export async function processImage(file: File): Promise<ProcessedImage> {
  if (!file.type.startsWith('image/')) {
    throw new Error('El archivo no es una imagen');
  }

  const img = await loadImage(file);

  let { width, height } = img;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas no soportado en este navegador');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error('No se pudo convertir la imagen')),
      'image/jpeg',
      JPEG_QUALITY
    );
  });

  return { blob, width, height, size: blob.size };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo cargar la imagen'));
    };
    img.src = url;
  });
}
