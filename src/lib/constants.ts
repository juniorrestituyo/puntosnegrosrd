// Taxonomía INTRANT — 4 factores causales
export const CATEGORIES = {
  humano: {
    label: 'Humano',
    description:
      'Comportamiento de conductores o peatones: imprudencias recurrentes, exceso de velocidad observado, manejo en estado de embriaguez, cruce peatonal sin precaución.',
    subcategories: [
      'Exceso de velocidad recurrente',
      'Cruce peatonal imprudente',
      'Conducción agresiva habitual',
      'Manejo en estado de embriaguez observado',
      'Otros (comportamiento)',
    ],
  },
  vehicular: {
    label: 'Vehicular',
    description:
      'Vehículos en mal estado que transitan o estacionan en la zona, sobrecarga de pasajeros en motocicletas, frenos defectuosos, luces dañadas.',
    subcategories: [
      'Motocicletas sin luces o frenos',
      'Vehículos sobrecargados de pasajeros',
      'Vehículos pesados en zona residencial',
      'Otros (estado vehicular)',
    ],
  },
  infraestructural: {
    label: 'Infraestructural',
    description:
      'Estado de la vía: baches, semáforos dañados, falta de señalización, paso peatonal borrado, curva ciega, falta de iluminación.',
    subcategories: [
      'Bache peligroso',
      'Semáforo dañado o apagado',
      'Falta de señalización',
      'Paso peatonal borrado',
      'Curva ciega o intersección sin visibilidad',
      'Falta de iluminación',
      'Acera invadida o inexistente',
      'Otros (infraestructura)',
    ],
  },
  climatico: {
    label: 'Climático',
    description:
      'Condiciones ambientales recurrentes que aumentan el riesgo: zonas que se inundan, neblina recurrente, deslizamientos, derrame habitual de combustible.',
    subcategories: [
      'Zona que se inunda',
      'Neblina recurrente',
      'Riesgo de deslizamiento',
      'Otros (clima)',
    ],
  },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const STATUS_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  corroborado: 'Corroborado por la comunidad',
  notificado: 'Notificado a la autoridad',
  en_atencion: 'En atención',
  resuelto: 'Resuelto',
};

// Centro geográfico aproximado de Republica Dominicana
export const RD_CENTER: [number, number] = [18.7357, -70.1627];
// Zoom 15 = nivel calle. El mapa abre directamente en este zoom para
// evitar la animacion de zoom-in cada vez que se monta. Si llega GPS,
// se centra instantaneamente (sin cambiar zoom). Si no, el usuario
// ve el mapa al nivel correcto y puede panear/usar el boton locate.
export const RD_DEFAULT_ZOOM = 15;

// Límites del bounding box de RD (para validación de coordenadas)
export const RD_BOUNDS = {
  minLat: 17.5,
  maxLat: 20.5,
  minLng: -72.1,
  maxLng: -68.0,
} as const;

// Rate limit: máximo de reportes por IP por hora
export const RATE_LIMIT_REPORTS_PER_HOUR = 5;
