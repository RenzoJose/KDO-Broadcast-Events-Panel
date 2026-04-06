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
let _audioCtx     = null;

function getAudioCtx() {
  if (!_audioCtx) {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return _audioCtx;
}

function playTick() {
  const ctx  = getAudioCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = 'sine'; osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
  osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.09);
}

function playFinal() {
  const ctx = getAudioCtx();
  [{ delay: 0, freq: 660 }, { delay: 0.32, freq: 550 }, { delay: 0.64, freq: 440 }]
    .forEach(({ delay, freq }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'square'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);
      osc.start(ctx.currentTime + delay); osc.stop(ctx.currentTime + delay + 0.45);
    });
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

  function applyState(state) {
    _currentState = state;
    wrapper.classList.remove('is-running', 'is-paused', 'is-done', 'is-critical');
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

    if (next <= 10 && next > 0) {
      wrapper.classList.add('is-critical');
      playTick();
    }
    if (next <= 0) {
      clearInterval(_intervalo); _intervalo = null;
      wrapper.classList.remove('is-critical');
      applyState(STATE.DONE);
      playFinal();
      wrapper.classList.add('is-flash');
      wrapper.addEventListener('animationend', () => wrapper.classList.remove('is-flash'), { once: true });
    }
  }

  function iniciar() {
    getAudioCtx().resume();
    const secs = getConfigSecs();
    setState({ contador: { ...getState().contador, tiempo: secs, corriendo: true } });
    timeEl.textContent = formatTime(secs);
    applyState(STATE.RUNNING);
    _intervalo = setInterval(tick, 1000);
  }

  function reanudar() {
    getAudioCtx().resume();
    setState({ contador: { ...getState().contador, corriendo: true } });
    applyState(STATE.RUNNING);
    if (getState().contador.tiempo <= 10) wrapper.classList.add('is-critical');
    _intervalo = setInterval(tick, 1000);
  }

  function pausar() {
    clearInterval(_intervalo); _intervalo = null;
    setState({ contador: { ...getState().contador, corriendo: false } });
    applyState(STATE.PAUSED);
  }

  function reiniciar() {
    clearInterval(_intervalo); _intervalo = null;
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


