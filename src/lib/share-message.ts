import { CATEGORIES, STATUS_LABELS } from './constants';
import type { Point } from './types';

interface ShareMessage {
  subject: string;
  body: string;
}

/**
 * Destinatarios sugeridos. La lista es puramente informativa: la
 * decision final de a quien notificar la toma el ciudadano. No
 * pre-llenamos un solo correo porque eso le quita agencia.
 *
 * Cada destinatario puede definir un `salutation` y `requestLine`
 * propios para que el mensaje se adapte al tono y la jurisdiccion
 * de la institucion (regulacion, fiscalizacion, politica publica,
 * infraestructura local).
 */
export interface AuthorityRecipient {
  name: string;
  email?: string;
  phone?: string;
  website?: string;
  note?: string;
  salutation?: string;
  requestLine?: string;
}

export const KNOWN_RECIPIENTS: AuthorityRecipient[] = [
  {
    name: 'INTRANT - Instituto Nacional de Transito y Transporte Terrestre',
    email: 'info@intrant.gob.do',
    phone: '+1 809-732-4000',
    website: 'https://www.intrant.gob.do',
    note: 'Autoridad rectora de transito y seguridad vial. Regulacion tecnica y planificacion.',
    salutation: 'Estimados de INTRANT:',
    requestLine:
      'Solicito amablemente que se considere este reporte para evaluacion tecnica conforme a la taxonomia oficial del INTRANT y, de ser procedente, su inclusion en planes de regulacion, señalizacion o intervencion vial.',
  },
  {
    name: 'DIGESETT - Direccion General de Seguridad de Transito y Transporte Terrestre',
    email: 'info@digesett.gob.do',
    phone: '+1 809-686-6520',
    website: 'https://digesett.gob.do',
    note: 'Aplicacion y fiscalizacion vial (sucesora de AMET, adscrita a la Policia Nacional).',
    salutation: 'Estimados de DIGESETT:',
    requestLine:
      'Solicito amablemente que se considere reforzar la presencia y fiscalizacion en este punto, especialmente en horarios de mayor riesgo, y se evalue la coordinacion con autoridades competentes para una intervencion estructural.',
  },
  {
    name: 'Junta municipal de tu municipio',
    note: 'Intervenciones de infraestructura local: baches, iluminacion, señalizacion, aceras.',
    salutation: 'Estimada Junta Municipal:',
    requestLine:
      'Solicito amablemente la intervencion del ayuntamiento para evaluar el estado del punto y, de ser procedente, ejecutar mejoras en infraestructura local (señalizacion, iluminacion, mantenimiento de la via, aceras).',
  },
];

const DEFAULT_SALUTATION = 'Estimados:';
const DEFAULT_REQUEST_LINE =
  'Solicito amablemente que se considere este reporte para evaluacion tecnica y, de ser procedente, intervencion. Quedo a disposicion para aportar informacion adicional si fuese necesario.';

/**
 * Construye un mensaje formal para reportar un punto a una autoridad.
 * Pure function: el mismo input produce el mismo output, util para
 * tests y para previsualizacion en el cliente.
 *
 * Si se pasa un `recipient`, el saludo y la linea de pedido se
 * adaptan a su jurisdiccion. Sin recipient, se usa una version
 * generica.
 */
export function buildShareMessage(
  point: Point,
  siteUrl: string,
  recipient?: AuthorityRecipient | null
): ShareMessage {
  const cat = CATEGORIES[point.category].label;
  const sub = point.subcategory ? ` - ${point.subcategory}` : '';
  const url = `${siteUrl.replace(/\/$/, '')}/punto/${point.id}`;
  const gmaps = `https://www.google.com/maps?q=${point.lat},${point.lng}`;
  const status = STATUS_LABELS[point.status] ?? point.status;

  const salutation = recipient?.salutation ?? DEFAULT_SALUTATION;
  const requestLine = recipient?.requestLine ?? DEFAULT_REQUEST_LINE;

  const subject = `Reporte ciudadano de riesgo vial - ${cat}${sub}`;

  const body = [
    salutation,
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
    requestLine,
    '',
    'Atentamente,',
    'Un ciudadano dominicano',
  ]
    .filter((line): line is string => line !== null)
    .join('\n');

  return { subject, body };
}
