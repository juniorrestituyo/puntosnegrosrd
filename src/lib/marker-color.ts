/**
 * Color del marker segun cantidad de confirmaciones comunitarias.
 *
 *   0    -> teal (reporte reciente, sin consenso aun)
 *   1-2  -> amarillo (señal inicial, "atencion")
 *   3-9  -> naranja (consenso medio, "advertencia")
 *   10+  -> rojo (alta certeza, hotspot critico)
 *
 * Paleta tipo heatmap: progresion cool-to-hot que el usuario lee de
 * inmediato sin necesidad de leyenda. Teal para 0 votos:
 *   - Comunica "reciente, nuevo" (mejor que el gris original que
 *     sentia "ignorado").
 *   - No se confunde con el GPS dot del usuario (que es azul brand).
 *   - Contraste excelente para los iconos PNG con outlines oscuros.
 *   - Distinto del verde "resuelto" (teal es azul-verdoso, emerald
 *     es verde puro).
 *
 * Contraste verificado contra el tile basemap light (CartoDB Positron):
 * todos los colores son visibles. Texto interior elegido por contraste
 * sobre el bg (blanco en teal/naranja/rojo, oscuro en amarillo).
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
      border: '#9a3412', // orange-800
      text: '#ffffff',
      label: 'Consenso medio',
    };
  }
  if (count >= 1) {
    return {
      bg: '#facc15', // yellow-400
      border: '#a16207', // yellow-700
      text: '#1f2937', // slate-800 — texto oscuro sobre amarillo brillante
      label: 'Señal inicial',
    };
  }
  return {
    bg: '#40D9F1', // cyan-sky brillante, tira mas hacia azul que verde
    border: '#1E96AB', // version mas oscura para definicion
    text: '#ffffff', // blanco — pop fuerte sobre el cyan claro
    label: 'Reporte reciente',
  };
}
