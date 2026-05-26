import { useEffect, useRef } from 'react';

// ============================================================
// Module-level state — coordina TODOS los modales en la app
// ============================================================
//
// Patron: stack global de modales abiertos. Solo el modal "del top"
// (el ultimo en abrirse) responde al popstate del browser. Eso
// permite modales apilados (ej. ReportForm + action sheet "Tomar
// foto / Galeria") donde back fisico cierra el de arriba sin
// tumbar el de abajo.
//
// Antes de este patron, cada instancia del hook tenia su propio
// listener de popstate. Con modales apilados los dos listeners
// se disparaban en el mismo popstate y se cerraban ambos —
// resultado: back fisico desde un sub-modal saltaba directo al
// mapa.

interface StackEntry {
  onClose: () => void;
  closedByPopstate: boolean;
}

const modalStack: StackEntry[] = [];

// Contador de history.back() programaticos que lanzamos nosotros
// para limpiar pushState al cerrar un modal "por otra via" (X, ESC,
// click fuera). Cada uno genera un popstate que NO debe ejecutar
// onClose del modal de abajo — es nuestra propia limpieza.
//
// Sin este contador: cerrar el sheet con Cancelar dispararia el
// history.back() de limpieza → popstate → handler veria al form
// como top → cerraria el form. Eso es exactamente lo que evitamos.
let pendingProgrammaticBacks = 0;

// Para React Strict Mode. En dev, Strict Mode ejecuta
// mount → cleanup → remount inmediato para detectar bugs. Sin
// coordinacion, el cleanup haria history.back() y el remount
// agregaria otra entrada — terminamos con 2 entradas vivas y un
// back de mas pending. Solucion: el cleanup difiere el back con
// setTimeout(0); si remontamos en el mismo tick, cancelamos el
// timeout y reutilizamos la entrada original.
let pendingCleanupTimer: ReturnType<typeof setTimeout> | null = null;

// Un solo listener global de popstate. Se attach al primer modal
// abierto y se detach cuando el stack queda vacio. Decide quien
// debe cerrarse (el top).
function handleGlobalPopState() {
  // Los popstate que generamos nosotros mismos (limpieza de
  // pushState al cerrar programaticamente) se ignoran.
  if (pendingProgrammaticBacks > 0) {
    pendingProgrammaticBacks--;
    return;
  }
  // Back fisico del usuario: cerramos el top del stack.
  const top = modalStack[modalStack.length - 1];
  if (top) {
    top.closedByPopstate = true;
    modalStack.pop();
    top.onClose();
  }
}

/**
 * Sincroniza un modal full-screen con el back stack del browser.
 *
 * Problema que resuelve: en mobile, modales como "Compartir con
 * autoridad" o "Ver foto" cubren toda la pantalla. El usuario espera
 * que el boton back fisico CIERRE el modal y vuelva a la pagina
 * detras, no que navegue al estado anterior del browser. Sin esta
 * sincronizacion, back salta directo al mapa o sale de la app —
 * confuso porque el modal se siente como una pantalla aparte.
 *
 * Mecanismo:
 *   1. Cuando open=true, agregamos una entrada vacia al history
 *      con pushState (no cambia la URL ni recarga) y registramos
 *      el modal en el stack global.
 *   2. Si el usuario aprieta back fisico → el browser dispara
 *      popstate. El listener global cierra el TOP del stack
 *      (no necesariamente este modal — si hay un sub-modal abierto,
 *      cierra ese primero).
 *   3. Si el modal cierra por otra via (boton X, ESC, click fuera,
 *      unmount programatico), hacemos history.back() programaticamente
 *      para limpiar la entrada pushState. Marcamos ese back como
 *      "programatico" via contador para que el popstate resultante
 *      no se confunda con back del usuario y no cierre el modal de
 *      abajo.
 *
 * Modales apilados: si abris el sheet de fotos mientras el form esta
 * abierto, ambos llaman a useBackButtonClose. El stack contiene
 * [form, sheet]. Back fisico → cierra solo el sheet. Back de nuevo →
 * cierra el form. Cancelar/ESC del sheet → cierra solo el sheet
 * (limpieza programatica, no toca el form).
 *
 * Funciona indistintamente para modales:
 *   - Controlados por prop open (siempre montados): pasar
 *     useBackButtonClose(open, onClose).
 *   - Que se montan solo abiertos: pasar useBackButtonClose(true, ...);
 *     el hook se activa al mount y se limpia al unmount.
 */
export function useBackButtonClose(open: boolean, onClose: () => void) {
  // onClose puede cambiar entre renders. Usamos ref para que el
  // entry del stack siempre llame a la version mas reciente sin
  // forzar re-suscripcion del effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Si hay un cleanup pendiente (probable Strict Mode remount),
    // cancelarlo. En ese caso la entrada pushState anterior sigue
    // viva — reutilizamos y omitimos pushState nuevo. El
    // pendingProgrammaticBacks++ que el cleanup metio tambien se
    // revierte (no habra back para ignorar).
    let skipPushState = false;
    if (pendingCleanupTimer !== null) {
      clearTimeout(pendingCleanupTimer);
      pendingCleanupTimer = null;
      pendingProgrammaticBacks--;
      skipPushState = true;
    }

    const entry: StackEntry = {
      onClose: () => onCloseRef.current(),
      closedByPopstate: false,
    };
    modalStack.push(entry);

    if (!skipPushState) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);
    }

    // Attach el listener global solo en el primer modal abierto.
    if (modalStack.length === 1) {
      window.addEventListener('popstate', handleGlobalPopState);
    }

    return () => {
      // Quitar este modal del stack (si el popstate ya lo saco,
      // indexOf devuelve -1 y splice es no-op).
      const index = modalStack.indexOf(entry);
      if (index >= 0) modalStack.splice(index, 1);

      if (modalStack.length === 0) {
        window.removeEventListener('popstate', handleGlobalPopState);
      }

      // Si NO se cerro por popstate (back fisico), tenemos que
      // consumir la entrada pushState. Diferimos con setTimeout(0)
      // para Strict Mode: si remontamos en el mismo tick, el
      // remount cancela el timeout y omite el pushState nuevo,
      // manteniendo la entrada original.
      if (!entry.closedByPopstate) {
        pendingProgrammaticBacks++;
        pendingCleanupTimer = setTimeout(() => {
          pendingCleanupTimer = null;
          window.history.back();
        }, 0);
      }
    };
  }, [open]);
}
