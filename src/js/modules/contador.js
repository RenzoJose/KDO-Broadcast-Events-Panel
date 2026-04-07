/* ═══════════════════════════════════════════════════════════════
   contador.js — Módulo del Contador Regresivo (dashboard)
   Inyecta la UI broadcast en <section id="contador">.
   Los estilos .ct-* viven en main.css.
   ═══════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';

const STATE = Object.freeze({
  LISTO:   'listo',
  RUNNING: 'running',
  PAUSED:  'paused',
  DONE:    'done',
});

const BADGE_LABEL = {
  [STATE.LISTO]:   'LISTO',
  [STATE.RUNNING]: 'EN CURSO',
  [STATE.PAUSED]:  'PAUSADO',
  [STATE.DONE]:    'TIEMPO TERMINADO',
};

let _intervalo    = null;
let _currentState = STATE.LISTO;

// ── Audio MP3 ────────────────────────────────────────────────────
// El MP3 dura ~28 seg. La voz arranca en el segundo ~4.
// Lo disparamos en remaining === 14 → voz cae exactamente en remaining === 10.
const _sndCountdown = new Audio('../../public/assets/sounds/Countdown Timer 10 sec with Sound effects and Voice HD.mp3');
_sndCountdown.preload = 'auto';

function startCountdownAudio() {
  _sndCountdown.currentTime = 0;
  _sndCountdown.play().catch(() => {});
}

function resumeCountdownAudio(remaining) {
  // El MP3 se disparó en remaining=15, ya pasaron (15 - remaining) segundos
  _sndCountdown.currentTime = Math.max(0, 15 - remaining);
  _sndCountdown.play().catch(() => {});
}

function stopCountdownAudio() {
  _sndCountdown.pause();
  _sndCountdown.currentTime = 0;
}

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export function initContador() {
  renderContador();
  console.log('[contador] Módulo inicializado.');
}

export function renderContador() {
  const contenedor = document.getElementById('contador');
  if (!contenedor) return;

  const { tiempo } = getState().contador;

  contenedor.innerHTML = `
    <div class="ct-wrapper" id="ct-wrapper">
      <div class="ct-bg-overlay" aria-hidden="true"></div>
      <div class="ct-particles" id="ct-particles" aria-hidden="true"></div>
      <div class="ct-badge" id="ct-badge">LISTO</div>
      <div class="ct-display">
        <div class="ct-time" id="ct-time">${formatTime(tiempo)}</div>
      </div>
      <div class="ct-config" id="ct-config">
        <label for="ct-input" class="ct-config-label">Duración</label>
        <div class="ct-config-row">
          <input type="number" id="ct-input" class="ct-input"
                 min="1" max="99" value="${Math.round(tiempo / 60)}"
                 aria-label="Duración en minutos" />
          <span class="ct-input-unit">min</span>
        </div>
      </div>
      <div class="ct-controls">
        <button class="ct-btn ct-btn--primary" id="btn-iniciar">
          <span class="ct-btn-icon" aria-hidden="true">▶</span>
          INICIAR
        </button>
        <button class="ct-btn ct-btn--secondary" id="btn-pausar" disabled>
          <span class="ct-btn-icon" aria-hidden="true">⏸</span>
          PAUSAR
        </button>
        <button class="ct-btn ct-btn--ghost" id="btn-reiniciar">
          <span class="ct-btn-icon" aria-hidden="true">↺</span>
          REINICIAR
        </button>
      </div>
      <div class="ct-hints" aria-hidden="true">
        <span>Enter → Iniciar</span>
        <span class="ct-hints-sep">·</span>
        <span>Espacio → Pausar</span>
        <span class="ct-hints-sep">·</span>
        <span>R → Reiniciar</span>
      </div>
    </div>
  `;

  _currentState = STATE.LISTO;
  bindControls();
}

function bindControls() {
  const wrapper      = document.getElementById('ct-wrapper');
  const timeEl       = document.getElementById('ct-time');
  const badgeEl      = document.getElementById('ct-badge');
  const inputEl      = document.getElementById('ct-input');
  const btnIniciar   = document.getElementById('btn-iniciar');
  const btnPausar    = document.getElementById('btn-pausar');
  const btnReiniciar = document.getElementById('btn-reiniciar');

  function getConfigSecs() {
    return Math.max(1, Math.min(99, parseInt(inputEl.value, 10) || 1)) * 60;
  }

  function triggerSlam() {
    wrapper.classList.remove('is-slam');
    void wrapper.offsetWidth;
    wrapper.classList.add('is-slam');
    setTimeout(() => wrapper.classList.remove('is-slam'), 500);
  }

  function spawnParticles() {
    const container = document.getElementById('ct-particles');
    if (!container) return;
    container.innerHTML = '';
    const colors = ['#ff3b3b', '#ff9e55', '#ffffff', '#ffdd57', '#ff6b6b', '#ff8c42'];
    for (let i = 0; i < 60; i++) {
      const p = document.createElement('div');
      p.className = 'ct-particle';
      const angle = Math.random() * 2 * Math.PI;
      const dist  = 180 + Math.random() * 380;
      p.style.setProperty('--dx',       `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy',       `${Math.sin(angle) * dist}px`);
      p.style.setProperty('--size',     `${6 + Math.random() * 14}px`);
      p.style.setProperty('--color',    colors[Math.floor(Math.random() * colors.length)]);
      p.style.setProperty('--duration', `${0.9 + Math.random() * 0.8}s`);
      p.style.setProperty('--delay',    `${Math.random() * 0.35}s`);
      container.appendChild(p);
    }
    setTimeout(() => { container.innerHTML = ''; }, 2200);
  }

  function applyState(state) {
    _currentState = state;
    wrapper.classList.remove('is-running', 'is-paused', 'is-done', 'is-critical', 'is-warning');
    if (state === STATE.RUNNING) wrapper.classList.add('is-running');
    if (state === STATE.PAUSED)  wrapper.classList.add('is-paused');
    if (state === STATE.DONE)    wrapper.classList.add('is-done');
    badgeEl.textContent = BADGE_LABEL[state];
    btnIniciar.disabled = state === STATE.RUNNING || state === STATE.DONE;
    btnPausar.disabled  = state !== STATE.RUNNING;
    if (state === STATE.PAUSED) {
      btnIniciar.querySelector('.ct-btn-icon').textContent = '▶';
      btnIniciar.childNodes[2].textContent = ' REANUDAR';
    } else {
      btnIniciar.querySelector('.ct-btn-icon').textContent = '▶';
      btnIniciar.childNodes[2].textContent = ' INICIAR';
    }
    // Oculta config cuando no está en LISTO
    if (state !== STATE.LISTO) {
      wrapper.querySelector('.ct-config').style.opacity = '0';
      wrapper.querySelector('.ct-config').style.pointerEvents = 'none';
    } else {
      wrapper.querySelector('.ct-config').style.opacity = '';
      wrapper.querySelector('.ct-config').style.pointerEvents = '';
    }
  }

  function tick() {
    const { tiempo } = getState().contador;
    const next = tiempo - 1;
    setState({ contador: { ...getState().contador, tiempo: next } });
    timeEl.textContent = formatTime(next);

    if (next <= 30 && next > 0) {
      wrapper.classList.add('is-warning');
    }
    // Arrancar MP3 en remaining=15 → voz dice "10" cuando remaining llega a 10
    if (next === 15) {
      startCountdownAudio();
    }
    if (next <= 10 && next > 0) {
      wrapper.classList.add('is-critical');
      triggerSlam();
    }
    if (next <= 0) {
      clearInterval(_intervalo); _intervalo = null;
      wrapper.classList.remove('is-critical');
      applyState(STATE.DONE);
      spawnParticles();
      wrapper.classList.add('is-flash');
      wrapper.addEventListener('animationend', () => wrapper.classList.remove('is-flash'), { once: true });
    }
  }

  function iniciar() {
    const secs = getConfigSecs();
    setState({ contador: { ...getState().contador, tiempo: secs, corriendo: true } });
    timeEl.textContent = formatTime(secs);
    applyState(STATE.RUNNING);
    _intervalo = setInterval(tick, 1000);
  }

  function reanudar() {
    setState({ contador: { ...getState().contador, corriendo: true } });
    applyState(STATE.RUNNING);
    const t = getState().contador.tiempo;
    if (t <= 30) wrapper.classList.add('is-warning');
    if (t <= 10) wrapper.classList.add('is-critical');
    if (t <= 15 && t > 0) resumeCountdownAudio(t);
    _intervalo = setInterval(tick, 1000);
  }

  function pausar() {
    clearInterval(_intervalo); _intervalo = null;
    _sndCountdown.pause();
    setState({ contador: { ...getState().contador, corriendo: false } });
    applyState(STATE.PAUSED);
  }

  function reiniciar() {
    clearInterval(_intervalo); _intervalo = null;
    stopCountdownAudio();
    const secs = getConfigSecs();
    setState({ contador: { tiempo: secs, corriendo: false, puntos: { rojo: 0, azul: 0 } } });
    timeEl.textContent = formatTime(secs);
    applyState(STATE.LISTO);
  }

  btnIniciar.addEventListener('click', () => {
    if (_currentState === STATE.PAUSED) reanudar();
    else if (_currentState === STATE.LISTO) iniciar();
  });
  btnPausar.addEventListener('click', () => { if (_currentState === STATE.RUNNING) pausar(); });
  btnReiniciar.addEventListener('click', reiniciar);
  inputEl.addEventListener('input', () => {
    if (_currentState !== STATE.LISTO) return;
    timeEl.textContent = formatTime(getConfigSecs());
  });

  document.addEventListener('keydown', function ctKeys(e) {
    // Solo activo cuando esta vista está visible
    if (!document.getElementById('ct-wrapper')) {
      document.removeEventListener('keydown', ctKeys);
      return;
    }
    if (document.activeElement === inputEl) return;
    if (e.code === 'Enter') { e.preventDefault(); if (_currentState === STATE.PAUSED) reanudar(); else if (_currentState === STATE.LISTO) iniciar(); }
    if (e.code === 'Space') { e.preventDefault(); if (_currentState === STATE.RUNNING) pausar(); }
    if (e.code === 'KeyR')  { e.preventDefault(); reiniciar(); }
  });
}


