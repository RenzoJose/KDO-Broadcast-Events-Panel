/* ══════════════════════════════════════════════════════════════════
   contador-view.js — Lógica vista standalone: contador.html
   ──────────────────────────────────────────────────────────────────
   Responsabilidades:
     · Estados del contador (LISTO / RUNNING / PAUSED / DONE)
     · Lógica del countdown y tick por segundo
     · Control de botones con texto dinámico
     · Atajos de teclado (Enter / Espacio / R)
     · Audio generado por Web Audio API (tick + final)
   ══════════════════════════════════════════════════════════════════ */

/* ── Referencias al DOM ─────────────────────────────────────────── */

const wrapper      = document.getElementById('ct-wrapper');
const timeEl       = document.getElementById('ct-time');
const badgeEl      = document.getElementById('ct-badge');
const inputEl      = document.getElementById('ct-input');
const btnIniciar   = document.getElementById('btn-iniciar');
const btnPausar    = document.getElementById('btn-pausar');
const btnReiniciar = document.getElementById('btn-reiniciar');

/* ── Definición de estados ──────────────────────────────────────── */

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

const STATE_CLASS = {
  [STATE.LISTO]:   null,
  [STATE.RUNNING]: 'is-running',
  [STATE.PAUSED]:  'is-paused',
  [STATE.DONE]:    'is-done',
};

/* ── Variables de control ───────────────────────────────────────── */

let currentState = STATE.LISTO;
let remaining    = 0;
let intervalId   = null;

/* ── Audio (Web Audio API) ──────────────────────────────────────── */

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTick() {
  const ctx  = getAudioCtx();
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.type            = 'sine';
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.2, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.09);
}

function playFinal() {
  const ctx = getAudioCtx();

  // Triple beep descendente — sonido de final de tiempo
  [
    { delay: 0,    freq: 660 },
    { delay: 0.32, freq: 550 },
    { delay: 0.64, freq: 440 },
  ].forEach(({ delay, freq }) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type            = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.35, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.45);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.45);
  });
}

/* ── Utilidades ─────────────────────────────────────────────────── */

function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function getConfiguredSeconds() {
  const mins = Math.max(1, Math.min(99, parseInt(inputEl.value, 10) || 1));
  return mins * 60;
}

/* ── Gestión de estado ──────────────────────────────────────────── */

function applyState(state) {
  currentState = state;

  // Limpia todas las clases de estado (is-critical se gestiona por separado)
  wrapper.classList.remove('is-running', 'is-paused', 'is-done', 'is-critical');

  const cls = STATE_CLASS[state];
  if (cls) wrapper.classList.add(cls);

  badgeEl.textContent = BADGE_LABEL[state];

  updateButtons(state);
}

function updateButtons(state) {
  switch (state) {
    case STATE.LISTO:
      btnIniciar.disabled           = false;
      btnIniciar.querySelector('.ct-btn-icon').textContent = '▶';
      btnIniciar.childNodes[2].textContent = ' INICIAR';
      btnPausar.disabled            = true;
      btnReiniciar.disabled         = false;
      break;

    case STATE.RUNNING:
      btnIniciar.disabled           = true;
      btnPausar.disabled            = false;
      btnPausar.querySelector('.ct-btn-icon').textContent  = '⏸';
      btnPausar.childNodes[2].textContent  = ' PAUSAR';
      btnReiniciar.disabled         = false;
      break;

    case STATE.PAUSED:
      btnIniciar.disabled           = false;
      btnIniciar.querySelector('.ct-btn-icon').textContent = '▶';
      btnIniciar.childNodes[2].textContent = ' REANUDAR';
      btnPausar.disabled            = true;
      btnReiniciar.disabled         = false;
      break;

    case STATE.DONE:
      btnIniciar.disabled           = true;
      btnPausar.disabled            = true;
      btnReiniciar.disabled         = false;
      break;
  }
}

/* ── Flash visual al finalizar ──────────────────────────────────── */

function triggerFlash() {
  wrapper.classList.add('is-flash');
  wrapper.addEventListener('animationend', () => {
    wrapper.classList.remove('is-flash');
  }, { once: true });
}

/* ── Lógica del countdown ───────────────────────────────────────── */

function tick() {
  remaining--;
  timeEl.textContent = formatTime(remaining);

  // Zona crítica: últimos 10 segundos
  if (remaining <= 10 && remaining > 0) {
    wrapper.classList.add('is-critical');
    playTick();
  }

  // Tiempo terminado
  if (remaining <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    wrapper.classList.remove('is-critical');
    applyState(STATE.DONE);
    playFinal();
    triggerFlash();
  }
}

/* ── Acciones ───────────────────────────────────────────────────── */

function iniciar() {
  // Resume AudioContext (requiere gesto del usuario en algunos browsers)
  getAudioCtx().resume();

  remaining = getConfiguredSeconds();
  timeEl.textContent = formatTime(remaining);

  applyState(STATE.RUNNING);
  intervalId = setInterval(tick, 1000);
}

function reanudar() {
  getAudioCtx().resume();
  applyState(STATE.RUNNING);

  // Reactivar critical si el tiempo restante sigue en zona crítica
  if (remaining <= 10) {
    wrapper.classList.add('is-critical');
  }

  intervalId = setInterval(tick, 1000);
}

function pausar() {
  clearInterval(intervalId);
  intervalId = null;
  applyState(STATE.PAUSED);
}

function reiniciar() {
  clearInterval(intervalId);
  intervalId = null;
  remaining  = 0;

  applyState(STATE.LISTO);
  timeEl.textContent = formatTime(getConfiguredSeconds());
}

/* ── Event Listeners: botones ───────────────────────────────────── */

btnIniciar.addEventListener('click', () => {
  if (currentState === STATE.PAUSED) {
    reanudar();
  } else if (currentState === STATE.LISTO) {
    iniciar();
  }
});

btnPausar.addEventListener('click', () => {
  if (currentState === STATE.RUNNING) pausar();
});

btnReiniciar.addEventListener('click', reiniciar);

// Actualiza el display en tiempo real al cambiar la duración
inputEl.addEventListener('input', () => {
  if (currentState !== STATE.LISTO) return;
  timeEl.textContent = formatTime(getConfiguredSeconds());
});

/* ── Event Listeners: teclado ───────────────────────────────────── */

document.addEventListener('keydown', e => {
  // No capturar si el foco está en el input de minutos
  if (document.activeElement === inputEl) return;

  switch (e.code) {
    case 'Enter':
      e.preventDefault();
      if (currentState === STATE.PAUSED)        reanudar();
      else if (currentState === STATE.LISTO)     iniciar();
      break;

    case 'Space':
      e.preventDefault();
      if (currentState === STATE.RUNNING) pausar();
      break;

    case 'KeyR':
      e.preventDefault();
      reiniciar();
      break;
  }
});

/* ── Init ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  timeEl.textContent = formatTime(getConfiguredSeconds());
  applyState(STATE.LISTO);
});
