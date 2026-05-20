import { CATEGORIES, STATUS_LABELS } from './constants';
import type { Point } from './types';

interface ShareMessage {
  subject: string;
  body: string;
}

/**
 * Construye un mensaje formal para reportar un punto a una autoridad.
 * Pure function: el mismo input produce el mismo output, util para
 * tests y para previsualizacion en el cliente.
 */
export function buildShareMessage(point: Point, siteUrl: string): ShareMessage {
  const cat = CATEGORIES[point.category].label;
  const sub = point.subcategory ? ` - ${point.subcategory}` : '';
  const url = `${siteUrl.replace(/\/$/, '')}/punto/${point.id}`;
  const gmaps = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
  const status = STATUS_LABELS[point.status] ?? point.status;

  const subject = `Reporte ciudadano de riesgo vial - ${cat}${sub}`;

  const body = [
    'Estimados:',
    '',
    'Como ciudadano de la Republica Dominicana, quisiera notificar formalmente un punto de riesgo vial documentado en la plataforma ciudadana PuntosNegrosRD, iniciativa independiente que adopta la taxonomia tecnica del Instituto Nacional de Transito y Transporte Terrestre (INTRANT).',
    '',
    `Categoria (taxonomia INTRANT): ${cat}`,
    point.subcategory ? `Subcategoria: ${point.subcategory}` : null,
    `Ubicacion: ${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`,
    point.municipality ? `Municipio: ${point.municipality}` : null,
    point.province ? `Provincia: ${point.province}` : null,
    `Ver en mapa: ${gmaps}`,
    `Confirmaciones comunitarias: ${point.confirmation_count}`,
    `Estado actual: ${status}`,
    '',
    'Descripcion ciudadana:',
    point.description,
    '',
    'Enlace permanente del reporte (con historial y evidencia):',
    url,
    '',
    'Solicito amablemente que se considere este reporte para evaluacion tecnica y, de ser procedente, intervencion. Quedo a disposicion para aportar informacion adicional si fuese necesario.',
    '',
    'Atentamente,',
    'Un ciudadano dominicano',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return { subject, body };
}

/**
 * Destinatarios sugeridos. La lista es puramente informativa: la
 * decision final de a quien notificar la toma el ciudadano. No
 * pre-llenamos un solo correo porque eso le quita agencia.
 */
export interface AuthorityRecipient {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  note?: string;
}

export const KNOWN_RECIPIENTS: AuthorityRecipient[] = [
  {
    name: 'INTRANT - Instituto Nacional de Transito y Transporte Terrestre',
    email: 'info@intrant.gob.do',
    phone: '+1 809-732-4000',
    website: 'https://www.intrant.gob.do',
    note: 'Autoridad rectora de transito y seguridad vial.',
  },
  {
    name: 'AMET - Autoridad Metropolitana de Transporte',
    phone: '+1 809-682-4424',
    note: 'Aplicacion en zona metropolitana de Santo Domingo.',
  },
  {
    name: 'ANSV - Agencia Nacional de Seguridad Vial',
    website: 'https://www.ansv.gob.do',
    note: 'Politica nacional de seguridad vial.',
  },
  {
    name: 'Junta municipal de tu municipio',
    website: 'https://www.fedomu.org.do',
    note: 'Para intervenciones en infraestructura local (semaforos, baches, iluminacion).',
  },
];
