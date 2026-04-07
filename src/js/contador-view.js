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

function playSaberSwing() {
  const ctx  = getAudioCtx();
  const now  = ctx.currentTime;
  const osc  = ctx.createOscillator();
  const filt = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(1000, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.32);

  filt.type        = 'bandpass';
  filt.frequency.value = 600;
  filt.Q.value     = 3;

  gain.gain.setValueAtTime(0.45, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

  osc.connect(filt);
  filt.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.38);
}

function playFinal() {
  const ctx = getAudioCtx();
  const now = ctx.currentTime;

  // Sable apagándose — sweep descendente principal
  const osc1  = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(700, now);
  osc1.frequency.exponentialRampToValueAtTime(40, now + 2.0);
  gain1.gain.setValueAtTime(0.55, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.start(now);
  osc1.stop(now + 2.0);

  // Sub-armónico para cuerpo
  const osc2  = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'square';
  osc2.frequency.setValueAtTime(350, now);
  osc2.frequency.exponentialRampToValueAtTime(20, now + 1.6);
  gain2.gain.setValueAtTime(0.3, now);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.6);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now);
  osc2.stop(now + 1.6);

  // Impacto inicial
  const osc3  = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'sine';
  osc3.frequency.setValueAtTime(260, now);
  gain3.gain.setValueAtTime(0.7, now);
  gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
  osc3.connect(gain3);
  gain3.connect(ctx.destination);
  osc3.start(now);
  osc3.stop(now + 0.28);
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

  // Limpia todas las clases de estado
  wrapper.classList.remove('is-running', 'is-paused', 'is-done', 'is-critical', 'is-warning');

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

function triggerSlam() {
  wrapper.classList.remove('is-slam');
  void wrapper.offsetWidth; // fuerza reflow para reiniciar la animación cada segundo
  wrapper.classList.add('is-slam');
  setTimeout(() => wrapper.classList.remove('is-slam'), 500);
}

function triggerFlash() {
  wrapper.classList.add('is-flash');
  wrapper.addEventListener('animationend', () => {
    wrapper.classList.remove('is-flash');
  }, { once: true });
}

function speakNumber(n) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(String(n));
  utt.lang   = 'es-ES';
  utt.volume = 1;
  utt.rate   = 1.1;
  utt.pitch  = 0.85;
  window.speechSynthesis.speak(utt);
}

function spawnParticles() {
  const container = document.getElementById('ct-particles');
  container.innerHTML = '';
  const colors = ['#ff3b3b', '#ff9e55', '#ffffff', '#ffdd57', '#ff6b6b', '#ff8c42'];
  const count  = 60;

  for (let i = 0; i < count; i++) {
    const p        = document.createElement('div');
    p.className    = 'ct-particle';
    const angle    = Math.random() * 2 * Math.PI;
    const distance = 280 + Math.random() * 520;
    const dx       = Math.cos(angle) * distance;
    const dy       = Math.sin(angle) * distance;
    const size     = 6 + Math.random() * 16;
    const duration = 0.9 + Math.random() * 0.8;
    const delay    = Math.random() * 0.35;
    p.style.setProperty('--dx',       `${dx}px`);
    p.style.setProperty('--dy',       `${dy}px`);
    p.style.setProperty('--size',     `${size}px`);
    p.style.setProperty('--color',    colors[Math.floor(Math.random() * colors.length)]);
    p.style.setProperty('--duration', `${duration}s`);
    p.style.setProperty('--delay',    `${delay}s`);
    container.appendChild(p);
  }
  setTimeout(() => { container.innerHTML = ''; }, 2200);
}

function triggerLogoCrash() {
  const el = document.createElement('div');
  el.className = 'ct-logo-crash';
  el.innerHTML = '<img src="../logo/KDO-08.png" alt="KDO" />';
  wrapper.appendChild(el);
  setTimeout(() => el.remove(), 3300);
}

/* ── Lógica del countdown ───────────────────────────────────────── */

function tick() {
  remaining--;
  timeEl.textContent = formatTime(remaining);

  // Zona de advertencia: últimos 30 segundos
  if (remaining <= 30 && remaining > 0) {
    wrapper.classList.add('is-warning');
  }

  // Zona crítica: últimos 10 segundos
  if (remaining <= 10 && remaining > 0) {
    wrapper.classList.add('is-critical');
    playSaberSwing();
    speakNumber(remaining);
    triggerSlam();
  }

  // Tiempo terminado
  if (remaining <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    wrapper.classList.remove('is-critical');
    applyState(STATE.DONE);
    playFinal();
    triggerFlash();
    spawnParticles();
    triggerLogoCrash();
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

  // Reactivar clases de zona según tiempo restante
  if (remaining <= 30) wrapper.classList.add('is-warning');
  if (remaining <= 10) wrapper.classList.add('is-critical');

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
