import { useEffect, useRef } from 'react';

// Module-level state para coordinar mount/cleanup en React Strict Mode.
//
// En dev mode, Strict Mode ejecuta mount -> cleanup -> remount de
// useEffect inmediatamente para detectar bugs. Sin esta coordinacion,
// el cleanup haria history.back() (dispara popstate async) y el
// remount agregaria un nuevo listener — el popstate llega despues
// y el listener "fresh" cierra el modal solo, sin que el usuario
// haya hecho nada.
//
// Solucion: el cleanup difiere el history.back() con setTimeout(0).
// Si el componente se remonta en el mismo tick (strict mode), el
// remount cancela el timeout y omite el pushState, manteniendo la
// entrada original. En produccion (sin strict mode) el setTimeout(0)
// ejecuta el back en el siguiente tick — imperceptible para el
// usuario.
let pendingCleanupTimer: ReturnType<typeof setTimeout> | null = null;

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
 *      con pushState (no cambia la URL ni recarga). Eso "atrapa" el
 *      siguiente back fisico.
 *   2. Si el usuario aprieta back fisico → el browser dispara
 *      popstate (sin navegar, porque la URL es la misma). Llamamos
 *      onClose() y el modal se cierra.
 *   3. Si el modal cierra por otra via (boton X, ESC, click fuera),
 *      hacemos history.back() programaticamente para limpiar la
 *      entrada pushState que dejamos al abrir.
 *
 * Funciona indistintamente para modales:
 *   - Controlados por prop open (siempre montados): pasar
 *     useBackButtonClose(open, onClose).
 *   - Que se montan solo abiertos: pasar useBackButtonClose(true, ...);
 *     el hook se activa al mount y se limpia al unmount.
 */
export function useBackButtonClose(open: boolean, onClose: () => void) {
  // onClose puede cambiar entre renders. Usamos ref para que el
  // popstate listener siempre llame a la version mas reciente sin
  // forzar re-suscripcion del effect.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Distingue "cerrado por back fisico" (popstate ya consumio la
  // entrada del history, no debemos limpiar) vs "cerrado por otra
  // via" (debemos hacer back() para limpiar la entrada).
  const closedByPopstateRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    // Si hay un cleanup pendiente (probable strict-mode remount o
    // cambio rapido del prop open), cancelarlo. En ese caso la entrada
    // pushState anterior sigue viva — no hacemos otra para no acumular.
    let skipPushState = false;
    if (pendingCleanupTimer !== null) {
      clearTimeout(pendingCleanupTimer);
      pendingCleanupTimer = null;
      skipPushState = true;
    }

    closedByPopstateRef.current = false;
    if (!skipPushState) {
      window.history.pushState({ modalOpen: true }, '', window.location.href);
    }

    function handlePopState() {
      closedByPopstateRef.current = true;
      onCloseRef.current();
    }
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      // Si el modal NO se cerro por popstate (X, ESC, click fuera,
      // unmount programatico), limpiamos la entrada que pusheamos.
      // Diferimos con setTimeout(0) — si el componente se remonta
      // en el mismo tick (strict mode), el timeout se cancela y
      // mantenemos consistencia. En produccion el back se ejecuta
      // un tick despues, imperceptible para el usuario.
      if (!closedByPopstateRef.current) {
        pendingCleanupTimer = setTimeout(() => {
          pendingCleanupTimer = null;
          window.history.back();
        }, 0);
      }
    };
  }, [open]);
}
