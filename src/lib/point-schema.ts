/**
 * Schema zod compartido entre ReportForm (cliente) y POST /api/points
 * (server). Una sola fuente de verdad para validacion del input de
 * un reporte.
 *
 * Reglas de evidencia (post migracion 005):
 *   - Foto y/o descripcion: al menos UNO presente.
 *   - Si hay foto, la descripcion es opcional sin minimo.
 *   - Si NO hay foto, la descripcion es requerida con minimo 20 chars
 *     post-trim (descarta whitespace al inicio/fin).
 *   - Max 280 chars siempre (Twitter classic — fuerza concision).
 *
 * El SQL CHECK (migracion 005) enforce solo "al menos uno presente"
 * + un upper bound suave de 2000. Las reglas de minimo y de max 280
 * viven aqui, para poderlas ajustar sin migracion.
 */
import { z } from 'zod';

import { RD_BOUNDS } from './constants';

export const DESCRIPTION_MAX = 280;
export const DESCRIPTION_MIN_WITHOUT_PHOTO = 20;

const baseSchema = z.object({
  lat: z.number().min(RD_BOUNDS.minLat).max(RD_BOUNDS.maxLat),
  lng: z.number().min(RD_BOUNDS.minLng).max(RD_BOUNDS.maxLng),
  category: z.enum(['humano', 'vehicular', 'infraestructural', 'climatico']),
  subcategory: z.string().max(200).optional(),
  description: z
    .string()
    .max(DESCRIPTION_MAX, `Maximo ${DESCRIPTION_MAX} caracteres`)
    .optional(),
  province: z.string().max(100).optional(),
  municipality: z.string().max(100).optional(),
  photo_url: z.string().url().max(500).optional(),
});

/**
 * Schema con refine cruzado: si no hay foto, la descripcion debe
 * tener al menos DESCRIPTION_MIN_WITHOUT_PHOTO chars post-trim. Si
 * hay foto, la descripcion es opcional/libre.
 */
export const pointInputSchema = baseSchema.refine(
  (data) => {
    if (data.photo_url) return true;
    const desc = data.description?.trim() ?? '';
    return desc.length >= DESCRIPTION_MIN_WITHOUT_PHOTO;
  },
  {
    message: `Agrega una foto o describe el riesgo con al menos ${DESCRIPTION_MIN_WITHOUT_PHOTO} caracteres`,
    path: ['description'],
  }
);

export type PointInputSchema = z.infer<typeof pointInputSchema>;
