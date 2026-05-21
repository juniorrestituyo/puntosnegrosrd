/**
 * Color del marker segun cantidad de confirmaciones comunitarias.
 *
 *   0    -> gris frio (reporte nuevo, sin consenso aun)
 *   1-2  -> amarillo (señal inicial, "atencion")
 *   3-9  -> naranja (consenso medio, "advertencia")
 *   10+  -> rojo (alta certeza, hotspot critico)
 *
 * Paleta tipo heatmap: progresion cool-to-hot que el usuario lee de
 * inmediato sin necesidad de leyenda. El gris frio para 0 votos evita
 * dramatizar reportes recien creados (el black anterior sentia que el
 * punto estaba "muerto" o "ignorado"). El rojo se reserva solo para
 * puntos con consenso comunitario fuerte.
 *
 * Contraste verificado contra el tile basemap light (CartoDB Positron):
 * todos los colores son visibles. Texto interior elegido por contraste
 * sobre el bg (blanco en gris/naranja/rojo, oscuro en amarillo).
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
    bg: '#64748b', // slate-500 — gris frio, neutro
    border: '#334155', // slate-700
    text: '#ffffff',
    label: 'Sin confirmaciones',
  };
}
