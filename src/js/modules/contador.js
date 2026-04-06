/* ═══════════════════════════════════════════════════════════════
   contador.js — Módulo del Contador / Marcador
   Responsabilidad: cronómetro de combate y marcador de puntos.
   Desarrollador asignado: Dev 1
   ═══════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';

// Referencia al intervalo del temporizador para poder cancelarlo
let _intervalo = null;

/**
 * Inicializa el módulo del contador:
 * 1. Renderiza los controles y el marcador
 * 2. Conecta los botones de control
 */
export function initContador() {
  renderContador();
  console.log('[contador] Módulo inicializado.');
}

/**
 * Renderiza el marcador de combate completo en el DOM.
 * Se llama al inicio y cada vez que el tiempo cambia.
 */
export function renderContador() {
  const contenedor = document.getElementById('contador');
  if (!contenedor) return;

  const { tiempo, corriendo, puntos } = getState().contador;

  contenedor.innerHTML = `
    <!-- Marcador de puntos -->
    <div class="marcador">
      <div class="marcador-lado marcador-rojo">
        <span class="marcador-puntos" id="puntos-rojo">${puntos.rojo}</span>
        <span class="marcador-label">ROJO</span>
        <div class="marcador-controles">
          <button class="btn-punto" data-lado="rojo" data-delta="1">+</button>
          <button class="btn-punto" data-lado="rojo" data-delta="-1">−</button>
        </div>
      </div>

      <!-- Tiempo central -->
      <div class="marcador-tiempo">
        <span id="display-tiempo" class="tiempo-display ${tiempo <= 30 ? 'tiempo-critico' : ''}">
          ${formatearTiempo(tiempo)}
        </span>
        <div class="tiempo-controles">
          <button id="btn-toggle">${corriendo ? 'PAUSA' : 'INICIAR'}</button>
          <button id="btn-reset">RESET</button>
        </div>
      </div>

      <div class="marcador-lado marcador-azul">
        <span class="marcador-puntos" id="puntos-azul">${puntos.azul}</span>
        <span class="marcador-label">AZUL</span>
        <div class="marcador-controles">
          <button class="btn-punto" data-lado="azul" data-delta="1">+</button>
          <button class="btn-punto" data-lado="azul" data-delta="-1">−</button>
        </div>
      </div>
    </div>
  `;

  // Conectar controles después de renderizar
  document.getElementById('btn-toggle')?.addEventListener('click', toggleCronometro);
  document.getElementById('btn-reset')?.addEventListener('click', resetContador);
  document.querySelectorAll('.btn-punto').forEach((btn) => {
    btn.addEventListener('click', () => {
      const lado  = btn.dataset.lado;
      const delta = parseInt(btn.dataset.delta, 10);
      actualizarPuntos(lado, delta);
    });
  });
}

// ── Cronómetro ───────────────────────────────────────────────────

function toggleCronometro() {
  const { corriendo } = getState().contador;
  if (corriendo) {
    pausarCronometro();
  } else {
    iniciarCronometro();
  }
}

function iniciarCronometro() {
  if (_intervalo) return;

  setState({ contador: { ...getState().contador, corriendo: true } });
  renderContador();

  _intervalo = setInterval(() => {
    const { tiempo } = getState().contador;

    if (tiempo <= 0) {
      pausarCronometro();
      return;
    }

    setState({ contador: { ...getState().contador, tiempo: tiempo - 1 } });
    // Actualizar solo el display numérico, sin re-renderizar todo
    const display = document.getElementById('display-tiempo');
    if (display) {
      display.textContent = formatearTiempo(getState().contador.tiempo);
      display.classList.toggle('tiempo-critico', getState().contador.tiempo <= 30);
    }
  }, 1000);
}

function pausarCronometro() {
  clearInterval(_intervalo);
  _intervalo = null;
  setState({ contador: { ...getState().contador, corriendo: false } });
  renderContador();
}

function resetContador() {
  pausarCronometro();
  setState({
    contador: {
      tiempo: 120,
      corriendo: false,
      puntos: { rojo: 0, azul: 0 },
    },
  });
  renderContador();
}

// ── Puntos ───────────────────────────────────────────────────────

function actualizarPuntos(lado, delta) {
  const { puntos } = getState().contador;
  const nuevoValor = Math.max(0, (puntos[lado] || 0) + delta);

  setState({
    contador: {
      ...getState().contador,
      puntos: { ...puntos, [lado]: nuevoValor },
    },
  });

  // Actualizar solo el display del lado afectado
  const el = document.getElementById(`puntos-${lado}`);
  if (el) el.textContent = nuevoValor;
}

// ── Helpers ──────────────────────────────────────────────────────

/**
 * Convierte segundos a formato MM:SS.
 * @param {number} segundos
 * @returns {string}
 */
function formatearTiempo(segundos) {
  const m = Math.floor(segundos / 60).toString().padStart(2, '0');
  const s = (segundos % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
