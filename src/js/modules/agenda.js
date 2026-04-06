/* ═══════════════════════════════════════════════════════════════
   agenda.js — Módulo de la vista Agenda
   Responsabilidad: renderizar el cronograma del evento.
   Desarrollador asignado: Dev 1
   ═══════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';

// ── Datos de ejemplo ─────────────────────────────────────────────
// Reemplazar por carga dinámica (JSON/API) cuando esté disponible
const AGENDA_EJEMPLO = [
  { hora: '09:00', categoria: 'Poomsae Infantil',    descripcion: 'Categoría Sub-12 (Cinturones de Color)' },
  { hora: '10:30', categoria: 'Combate Cadetes',     descripcion: 'Categoría 45-48 kg (Varones)' },
  { hora: '12:00', categoria: 'Combate Junior',      descripcion: 'Categoría 55-59 kg (Damas)' },
  { hora: '14:00', categoria: 'Poomsae Senior',      descripcion: 'Cinturones Negros — Dan 1 al 3' },
  { hora: '16:00', categoria: 'Combate Elite',       descripcion: 'Categoría Abierta (Varones y Damas)' },
  { hora: '18:30', categoria: 'Ceremonia de Cierre', descripcion: 'Entrega de medallas y premiación' },
];

/**
 * Inicializa el módulo de agenda:
 * 1. Carga los datos en el estado global
 * 2. Renderiza el HTML en la sección #agenda
 */
export function initAgenda() {
  // Guardar eventos en el estado compartido
  setState({
    agenda: {
      ...getState().agenda,
      eventos: AGENDA_EJEMPLO,
    },
  });

  renderAgenda();
  console.log('[agenda] Módulo inicializado.');
}

/**
 * Renderiza la lista de eventos en el DOM.
 * Llamar nuevamente si los datos del estado cambian.
 */
export function renderAgenda() {
  const contenedor = document.getElementById('agenda');
  if (!contenedor) return;

  const { eventos } = getState().agenda;

  contenedor.innerHTML = `
    <h1 class="text-primary">Programa del Evento</h1>
    <ul class="agenda-lista">
      ${eventos.map((e, i) => `
        <li class="agenda-item ${i === 0 ? 'agenda-item--activo' : ''}">
          <span class="agenda-hora">${e.hora}</span>
          <div class="agenda-info">
            <strong>${e.categoria}</strong>
            <span class="text-muted">${e.descripcion}</span>
          </div>
        </li>
      `).join('')}
    </ul>
  `;
}
