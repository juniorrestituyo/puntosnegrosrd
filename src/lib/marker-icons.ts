/**
 * Mapping de subcategoria -> icono PNG en /public/markers/.
 *
 * Cuando un punto se renderea en el mapa a zoom cerca (modo teardrop),
 * el bulbo del marker muestra el icono correspondiente al tipo de
 * reporte. Asi el usuario reconoce que tipo de riesgo es sin necesidad
 * de abrir el detalle.
 *
 * Precedencia al resolver el icono:
 *   1. Si point.subcategory matchea una key de SUBCATEGORY_ICONS, usarla.
 *   2. Si no, fall back al icono de la categoria padre (CATEGORY_ICONS).
 *   3. Ultimo fallback: question-mark.
 *
 * Algunos iconos se reutilizan entre subcategorias afines:
 *   - pedestrian: cruce imprudente, paso peatonal borrado
 *   - other-infrastructure: curva ciega (no hay icono especifico)
 */
import type { CategoryKey } from './constants';
import type { Point } from './types';

// Fallback por categoria padre. Cuando un punto no tiene subcategoria
// (o su subcategoria no esta mapeada), usamos el icono "umbrella" de
// la categoria.
const CATEGORY_ICONS: Record<CategoryKey, string> = {
  humano: 'pedestrian',
  vehicular: 'motorcycle',
  infraestructural: 'cone',
  climatico: 'rain',
};

// Mapping exacto de subcategoria (string del enum en constants.ts) a
// nombre de archivo PNG en /public/markers/ (sin extension).
const SUBCATEGORY_ICONS: Record<string, string> = {
  // Humano
  'Exceso de velocidad recurrente': 'speed',
  'Cruce peatonal imprudente': 'pedestrian',
  'Conducción agresiva habitual': 'anger',
  'Manejo en estado de embriaguez observado': 'alcohol',
  'Otros (comportamiento)': 'question-mark',

  // Vehicular
  'Motocicletas sin luces o frenos': 'motorcycle',
  'Vehículos sobrecargados de pasajeros': 'minibus',
  'Vehículos pesados en zona residencial': 'truck',
  'Vehículos mal estacionados': 'no-parking',
  'Otros (estado vehicular)': 'wrench',

  // Infraestructural
  'Bache peligroso': 'pothole',
  'Semáforo dañado o apagado': 'traffic-light',
  'Falta de señalización': 'missing-marker',
  'Paso peatonal borrado': 'pedestrian', // reutilizado
  'Curva ciega o intersección sin visibilidad': 'other-infrastructure',
  'Falta de iluminación': 'lack-of-lighting',
  'Acera invadida o inexistente': 'no-pedestrians',
  'Otros (infraestructura)': 'other-infrastructure',

  // Climatico
  'Zona que se inunda': 'flooding',
  'Neblina recurrente': 'fog',
  'Riesgo de deslizamiento': 'landslide-risk',
  'Otros (clima)': 'cloud',
};

// Tamano default del icono dentro del marker. La mayoria de iconos
// son cuadrados o muy cercanos a cuadrados; este tamano les funciona.
const DEFAULT_ICON_SIZE = 18;

// Override por nombre de icono cuando el ratio (aspect) hace que el
// icono se vea "mas chico" via object-fit: contain. Subir el size
// compensa esa reduccion visual sin distorsionar la imagen.
// Ej: pothole.png tiene ratio ~0.76 (mas alto que ancho), asi que el
// render real solo ocupa ~76% del ancho del cuadro — visualmente se
// percibe pequeno comparado con iconos cuadrados.
const ICON_SIZE_OVERRIDES: Record<string, number> = {
  pothole: 23,
  flooding: 23,
};

function resolveIconFilename(point: Point): string {
  if (point.subcategory && SUBCATEGORY_ICONS[point.subcategory]) {
    return SUBCATEGORY_ICONS[point.subcategory];
  }
  if (CATEGORY_ICONS[point.category]) {
    return CATEGORY_ICONS[point.category];
  }
  return 'question-mark';
}

/**
 * Devuelve URL + tamano del icono para un punto. El tamano puede
 * variar por icono (ver ICON_SIZE_OVERRIDES) para compensar aspect
 * ratios no-cuadrados sin distorsionar.
 */
export function getIconForPoint(point: Point): { url: string; size: number } {
  const filename = resolveIconFilename(point);
  return {
    url: `/markers/${filename}.png`,
    size: ICON_SIZE_OVERRIDES[filename] ?? DEFAULT_ICON_SIZE,
  };
}
