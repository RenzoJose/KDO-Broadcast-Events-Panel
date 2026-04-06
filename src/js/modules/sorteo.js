/* ═══════════════════════════════════════════════════════════════
   sorteo.js — Módulo de la vista Sorteo
   Responsabilidad: gestionar y visualizar el sorteo de combates.
   Desarrollador asignado: Dev 2
   ═══════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';

// ── Datos de ejemplo ─────────────────────────────────────────────
const PARTICIPANTES_EJEMPLO = [
  { nombre: 'Carlos Ríos',     categoria: 'Sub-18 -58kg', pais: 'Colombia' },
  { nombre: 'Miguel Torres',   categoria: 'Sub-18 -58kg', pais: 'Perú' },
  { nombre: 'Andrés Morales',  categoria: 'Sub-18 -58kg', pais: 'Ecuador' },
  { nombre: 'Luis Fernández',  categoria: 'Sub-18 -58kg', pais: 'Bolivia' },
  { nombre: 'Diego Sánchez',   categoria: 'Sub-18 -58kg', pais: 'Chile' },
  { nombre: 'Mateo Vargas',    categoria: 'Sub-18 -58kg', pais: 'Venezuela' },
];

/**
 * Inicializa el módulo de sorteo:
 * 1. Carga participantes en el estado global
 * 2. Renderiza el HTML inicial
 * 3. Conecta el botón de sorteo
 */
export function initSorteo() {
  setState({
    sorteo: {
      ...getState().sorteo,
      participantes: PARTICIPANTES_EJEMPLO,
    },
  });

  renderSorteo();
  console.log('[sorteo] Módulo inicializado.');
}

/**
 * Renderiza la vista de sorteo con la lista de participantes
 * y el botón para ejecutar el sorteo aleatorio.
 */
export function renderSorteo() {
  const contenedor = document.getElementById('sorteo');
  if (!contenedor) return;

  const { participantes, resultado } = getState().sorteo;

  contenedor.innerHTML = `
    <h1 class="text-primary">Sorteo de Combates</h1>
    <p class="text-muted">${participantes.length} participantes registrados</p>

    <ul class="sorteo-lista">
      ${participantes.map((p) => `
        <li class="sorteo-participante">${p.nombre} <span class="text-muted">(${p.pais})</span></li>
      `).join('')}
    </ul>

    <button id="btn-sortear" class="btn-principal">Realizar Sorteo</button>

    <div id="sorteo-resultado" class="sorteo-resultado ${resultado ? 'sorteo-resultado--visible' : ''}">
      ${resultado ? `
        <p class="text-muted">Enfrentamiento sorteado</p>
        <p class="text-accent sorteo-vs">
          ${resultado.rojo} <span class="text-muted">vs</span> ${resultado.azul}
        </p>
      ` : ''}
    </div>
  `;

  // Conectar el evento del botón después de renderizar
  document.getElementById('btn-sortear')?.addEventListener('click', ejecutarSorteo);
}

/**
 * Selecciona aleatoriamente dos participantes distintos y
 * actualiza el estado con el resultado. Luego re-renderiza.
 */
function ejecutarSorteo() {
  const { participantes } = getState().sorteo;
  if (participantes.length < 2) return;

  // Fisher-Yates (parcial — solo necesitamos 2 elementos)
  const mezcla = [...participantes].sort(() => Math.random() - 0.5);
  const resultado = {
    rojo:  mezcla[0].nombre,
    azul:  mezcla[1].nombre,
  };

  setState({ sorteo: { ...getState().sorteo, resultado } });
  renderSorteo();
}
