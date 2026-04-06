/* ═══════════════════════════════════════════════════════════════
   router.js — Sistema de vistas
   Responsabilidad: mostrar/ocultar secciones con clase .active
   ═══════════════════════════════════════════════════════════════ */

import { setState, getState } from './state.js';

/**
 * Cambia la vista activa de la aplicación.
 * Elimina .active de la vista actual y lo aplica a la nueva.
 *
 * @param {string} vistaId - El id del <section class="view"> a mostrar
 *                           Valores válidos: 'agenda' | 'sorteo' | 'contador'
 */
export function cambiarVista(vistaId) {
  const vistas = document.querySelectorAll('.view');

  // Verificar que la vista destino existe
  const destino = document.getElementById(vistaId);
  if (!destino) {
    console.warn(`[router] Vista no encontrada: "${vistaId}"`);
    return;
  }

  // Ocultar todas las vistas
  vistas.forEach((vista) => vista.classList.remove('active'));

  // Mostrar la vista destino
  destino.classList.add('active');

  // Sincronizar estado activo en los botones de navegación
  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.view === vistaId);
  });

  // Persistir la vista activa en el estado global
  setState({ vistaActual: vistaId });

  console.log(`[router] Vista activa: ${vistaId}`);
}

/**
 * Inicializa el router cargando la última vista guardada en el estado
 * o la vista por defecto si no hay ninguna.
 *
 * @param {string} [vistaDefault='agenda'] - Vista a mostrar al iniciar
 */
export function initRouter(vistaDefault = 'agenda') {
  const { vistaActual } = getState();
  cambiarVista(vistaActual || vistaDefault);
}
