/* ═══════════════════════════════════════════════════════════════
   app.js — Punto de entrada principal
   Responsabilidad: inicializar todos los módulos y el router.
   Este archivo NO contiene lógica de negocio; solo coordina.
   ═══════════════════════════════════════════════════════════════ */

import { initRouter } from './core/router.js';
import { initAgenda } from './modules/agenda.js';
import { initSorteo } from './modules/sorteo.js';
import { initContador } from './modules/contador.js';
import { initResultados, renderResultados } from './modules/resultados.js';
import { initMedallero } from './modules/medallero.js';

/**
 * Función principal. Se ejecuta cuando el DOM está listo.
 * Orden de inicialización:
 *   1. Módulos de contenido (renderizan su HTML en la vista)
 *   2. Router (activa la primera vista y expone cambiarVista globalmente)
 */
function init() {
  // ── Inicializar módulos ──────────────────────────────────────
  // Dev 1: agenda y contador
  initAgenda();
  initContador();

  // Dev 2: sorteo
  initSorteo();

  // Dev 3: resultados
  initResultados();

  // Medallero
  initMedallero();

  // ── Inicializar router ───────────────────────────────────────
  // Activa la vista por defecto ('agenda') al cargar
  initRouter('agenda');

  // ── Exponer cambiarVista globalmente ─────────────────────────
  // Re-renderiza resultados al navegar para mostrar ganadores nuevos
  window.cambiarVista = (id) => {
    import('./core/router.js').then(m => m.cambiarVista(id));
    if (id === 'resultados') renderResultados();
  };

  console.log('[app] KDO Broadcast Panel iniciado correctamente.');
}

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', init);
