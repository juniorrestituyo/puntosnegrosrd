/**
 * Color del marker segun cantidad de confirmaciones comunitarias.
 *
 *   0    -> negro (sin consenso aun, solo el reporte inicial)
 *   1-2  -> amarillo/amber (alguien mas lo vio)
 *   3-9  -> naranja (consenso medio)
 *   10+  -> rojo (alta certeza ciudadana)
 *
 * Gradiente warm (negro -> rojo) calibrado para tema light. La logica
 * es severidad semantica: mas confirmaciones = mas certeza = mas
 * cerca del rojo.
 */
export function colorForConfirmations(count: number): {
  bg: string;
  border: string;
  text: string;
  label: string;
} {
  if (count >= 10) {
    return {
      bg: '#dc2626', // red-600
      border: '#991b1b', // red-800
      text: '#ffffff',
      label: 'Alta certeza ciudadana',
    };
  }
  if (count >= 3) {
    return {
      bg: '#f97316', // orange-500
      border: '#c2410c', // orange-700
      text: '#ffffff',
      label: 'Consenso medio',
    };
  }
  if (count >= 1) {
    return {
      bg: '#f59e0b', // amber-500
      border: '#b45309', // amber-700
      text: '#1f2937',
      label: 'Senal inicial',
    };
  }
  return {
    bg: '#0f172a', // slate-900 (negro)
    border: '#000000',
    text: '#ffffff',
    label: 'Sin confirmaciones',
  };
}
