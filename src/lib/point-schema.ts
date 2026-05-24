/**
 * Schema zod compartido entre ReportForm (cliente) y POST /api/points
 * (server). Una sola fuente de verdad para validacion del input de
 * un reporte.
 *
 * Reglas de evidencia (post migracion 005):
 *   - Al menos UNO entre foto y descripcion (con contenido). Reporte
 *     con ambos campos vacios no se acepta.
 *   - Si decides llenar la descripcion, debe tener al menos
 *     DESCRIPTION_MIN chars post-trim. Esta regla aplica SIEMPRE que
 *     escribas algo, incluso si ya hay foto — es regla de calidad
 *     del texto: "si lo pusiste, que sirva".
 *   - Max DESCRIPTION_MAX chars siempre.
 *
 * El SQL CHECK (migracion 005) enforce solo "al menos uno presente"
 * + un upper bound suave de 2000. Las reglas de minimo y de max
 * concretas viven aqui, para poderlas ajustar sin migracion.
 */
import { z } from 'zod';

import { RD_BOUNDS } from './constants';

export const DESCRIPTION_MAX = 280;
export const DESCRIPTION_MIN = 10;

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
 * Schema con dos refines independientes:
 *  1. Al menos uno presente: foto o descripcion con contenido.
 *  2. Si hay descripcion con contenido, debe ser >= DESCRIPTION_MIN.
 */
export const pointInputSchema = baseSchema
  .refine(
    (data) => {
      const desc = data.description?.trim() ?? '';
      return data.photo_url != null || desc.length > 0;
    },
    {
      message: 'Agrega una foto o describe el problema.',
      path: ['description'],
    }
  )
  .refine(
    (data) => {
      const desc = data.description?.trim() ?? '';
      if (desc.length === 0) return true;
      return desc.length >= DESCRIPTION_MIN;
    },
    {
      message: `La descripcion debe tener al menos ${DESCRIPTION_MIN} caracteres.`,
      path: ['description'],
    }
  );

export type PointInputSchema = z.infer<typeof pointInputSchema>;
