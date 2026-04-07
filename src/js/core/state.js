/* ═══════════════════════════════════════════════════════════════
   state.js — Estado compartido entre módulos
   Responsabilidad: único punto de verdad de datos de la sesión.
   Todos los módulos leen y escriben aquí, no entre sí.
   ═══════════════════════════════════════════════════════════════ */

/**
 * Estado inicial de la aplicación.
 * Ampliar con los datos de cada módulo según se necesite.
 */
let _state = {
  vistaActual: 'agenda',    // Vista visible al cargar

  // ── Agenda ────────────────────────────────────────────────────
  agenda: {
    eventos: [],            // Array de { hora, categoria, descripcion }
    eventoActual: null,
  },

  // ── Sorteo ────────────────────────────────────────────────────
  sorteo: {
    participantes: [],      // Array de { id, name, school, logo }
    resultado: null,
    ultimoGanador: null,
  },

  // ── Contador ──────────────────────────────────────────────────
  contador: {
    tiempo: 120,            // Segundos (2 minutos por defecto — combate estándar)
    corriendo: false,
    puntos: { rojo: 0, azul: 0 },
  },
};

/**
 * Devuelve una copia del estado actual (lectura segura, sin mutaciones externas).
 *
 * @returns {object} Copia del estado
 */
export function getState() {
  return { ..._state };
}

/**
 * Mezcla (merge) parcial del estado. Solo actualiza las claves provistas.
 * Para actualizar sub-objetos usar setState({ contador: { ...getState().contador, tiempo: 90 } })
 *
 * @param {object} parcial - Objeto con las claves a actualizar
 */
export function setState(parcial) {
  _state = { ..._state, ...parcial };
}

/**
 * Resetea el estado a los valores iniciales.
 * Útil al iniciar un nuevo combate o evento.
 */
export function resetState() {
  _state = {
    vistaActual: 'agenda',
    agenda: { eventos: [], eventoActual: null },
    sorteo: { participantes: [], resultado: null },
    contador: { tiempo: 120, corriendo: false, puntos: { rojo: 0, azul: 0 } },
  };
}
