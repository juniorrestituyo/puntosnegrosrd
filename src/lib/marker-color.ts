/**
 * Color del marker segun cantidad de confirmaciones comunitarias.
 *
 *   0    -> gris (sin consenso aun, solo el reporte inicial)
 *   1-2  -> amarillo (alguien mas lo vio)
 *   3-9  -> naranja (consenso medio)
 *   10+  -> rojo (alta certeza ciudadana)
 *
 * Mantenemos estos rangos sincronizados con la doc publica para que
 * cualquier visitante entienda el codigo de color sin leyenda extra.
 */
export function colorForConfirmations(count: number): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  if (count >= 10) {
    return {
      bg: '#b91c1c', // red-700
      border: '#7f1d1d', // red-900
      text: '#ffffff',
      label: 'Alta certeza ciudadana',
    };
  }
  if (count >= 3) {
    return {
      bg: '#ea580c', // orange-600
      border: '#9a3412', // orange-800
      text: '#ffffff',
      label: 'Consenso medio',
    };
  }
  if (count >= 1) {
    return {
      bg: '#f59e0b', // amber-500
      border: '#92400e', // amber-800
      text: '#1f2937',
      label: 'Senal inicial',
    };
  }
  return {
    bg: '#94a3b8', // slate-400
    border: '#475569', // slate-600
    text: '#1f2937',
    label: 'Sin confirmaciones',
  };
}
