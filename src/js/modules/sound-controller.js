/* ═══════════════════════════════════════════════════════════════════
   sound-controller.js — Sistema de audio para el sorteo

   Responsabilidades únicas por capa:
   ─────────────────────────────────────────────────────────────────
   · calcSpeed()       — matemática pura: delay → velocidad 0-1
   · _playCardFlick()  — síntesis de ruido: "chasquido de carta"
   · SoundController   — orquesta las 3 capas de audio

   Capas:
   ─────────────────────────────────────────────────────────────────
   1. COUNTDOWN MP3  — "technology fluid countdow (1).mp3"
      Se reproduce al iniciar el sorteo (~10 s, mismo tiempo
      que la animación slot-machine). Volumen fijo, fade-out
      suave al terminar.

   2. CARD FLICK (síntesis Web Audio API)
      Un burst de ruido blanco filtrado (bandpass) en cada tick.
      · Velocidad alta → flick corto, grave, suave (muchos por seg)
      · Velocidad baja → flick largo, agudo, fuerte (dramático)
      Cooldown dinámico = 60% del delay actual para evitar
      solapamiento de nodos cuando los ticks son muy rápidos.

   3. APPLAUSE MP3  — "APLAUSOS.mp3"
      Se reproduce cuando el overlay del ganador aparece en pantalla.

   Flujo de estados:
   idle → running → stopped
═══════════════════════════════════════════════════════════════════ */

const SOUNDS = {
  countdown: 'public/assets/sounds/technology fluid countdow (1).mp3',
  applause:  'public/assets/sounds/APLAUSOS.mp3',
};

const DELAY_MIN = 50;   // ms — tick más rápido de buildDelays()
const DELAY_MAX = 800;  // ms — tick más lento  de buildDelays()

// ─── Helpers puros ────────────────────────────────────────────────

/** Convierte el delay de animación actual → velocidad normalizada 0–1 */
function calcSpeed(delayMs) {
  const clamped = Math.max(DELAY_MIN, Math.min(DELAY_MAX, delayMs));
  return 1 - (clamped - DELAY_MIN) / (DELAY_MAX - DELAY_MIN);
}

/** Interpolación lineal */
function lerp(a, b, t) { return a + (b - a) * t; }

// ─── Síntesis: Card Flick ─────────────────────────────────────────

/**
 * Genera un burst de ruido blanco filtrado que simula
 * el chasquido de una carta pasando por el slot.
 *
 * @param {AudioContext} ctx
 * @param {number} speed  0.0 (frenando) … 1.0 (máxima velocidad)
 */
function _playCardFlick(ctx, speed) {
  const now = ctx.currentTime;

  // Duración: 40 ms (rápido/sutil) → 110 ms (lento/dramático)
  const duration = lerp(0.04, 0.11, 1 - speed);

  // Buffer de ruido blanco
  const bufLen = Math.ceil(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, bufLen, ctx.sampleRate);
  const data   = buffer.getChannelData(0);
  for (let n = 0; n < bufLen; n++) data[n] = Math.random() * 2 - 1;

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // Bandpass: deja pasar solo el rango "chasquido"
  // Frecuencia sube al frenar → sonido más nítido y tenso
  const filter = ctx.createBiquadFilter();
  filter.type            = 'bandpass';
  filter.frequency.value = lerp(700, 3000, 1 - speed);
  filter.Q.value         = lerp(1.2, 4.5, 1 - speed);

  const gain = ctx.createGain();
  // Volumen: bajo cuando es rápido (muchos flicks), alto al frenar
  const vol = lerp(0.05, 0.50, 1 - speed);
  gain.gain.setValueAtTime(vol, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  source.connect(filter).connect(gain).connect(ctx.destination);
  source.start(now);
  source.stop(now + duration + 0.01);
}

// ─── SoundController ──────────────────────────────────────────────

export class SoundController {
  constructor() {
    this.state = 'idle'; // idle | running | stopped

    // Web Audio API — se crea en start() tras gesto del usuario
    this._ctx = null;

    // HTMLAudioElement para los MP3
    this._countdownAudio = null;
    this._applauseAudio  = null;

    // Cooldown de flick: performance.now() del último disparo
    this._lastFlickAt = 0;

    this._preload();
  }

  // ── Precarga ────────────────────────────────────────────────────

  _preload() {
    this._countdownAudio         = new Audio(SOUNDS.countdown);
    this._countdownAudio.volume  = 0.75;
    this._countdownAudio.preload = 'auto';

    this._applauseAudio         = new Audio(SOUNDS.applause);
    this._applauseAudio.volume  = 0.90;
    this._applauseAudio.preload = 'auto';
  }

  // ── API pública ─────────────────────────────────────────────────

  /**
   * Llamar cuando el usuario hace clic en «Iniciar Sorteo».
   * El AudioContext se crea aquí porque requiere un gesto previo.
   */
  start() {
    if (this.state === 'running') return;
    this.state        = 'running';
    this._lastFlickAt = 0;

    // AudioContext para síntesis de flicks
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this._ctx.state === 'suspended') this._ctx.resume();

    // Countdown MP3 — arranca junto con la animación
    this._countdownAudio.currentTime = 0;
    this._countdownAudio.play().catch(() => {});
  }

  /**
   * Llamar en cada tick del loop de la animación.
   * Decide si disparar un flick según el cooldown dinámico.
   *
   * @param {number} delayMs  delay del tick actual de buildDelays()
   */
  tick(delayMs) {
    if (!this._ctx || this.state !== 'running') return;

    const speed   = calcSpeed(delayMs);
    const now     = performance.now();
    // Cooldown = 60% del delay actual
    // · delay  50 ms → cooldown  30 ms  (máx ~33 flicks/seg)
    // · delay 800 ms → cooldown 480 ms  (1 flick por card al frenar)
    const cooldown = delayMs * 0.60;

    if (now - this._lastFlickAt >= cooldown) {
      this._lastFlickAt = now;
      _playCardFlick(this._ctx, speed);
    }
  }

  /**
   * Llamar cuando el overlay del ganador se muestra en pantalla.
   * Detiene el countdown y reproduce los aplausos.
   */
  playApplause() {
    // Detener countdown con fade-out rápido
    if (this._countdownAudio) {
      this._fadeOut(this._countdownAudio, 400);
    }

    this._applauseAudio.currentTime = 0;
    this._applauseAudio.play().catch(() => {});
  }

  /**
   * Reset completo. Llamar en renderSorteo() para limpiar
   * el estado antes de cada sorteo nuevo.
   */
  reset() {
    this.state        = 'idle';
    this._lastFlickAt = 0;

    // Detener MP3s
    if (this._countdownAudio) {
      this._countdownAudio.pause();
      this._countdownAudio.currentTime = 0;
    }
    if (this._applauseAudio) {
      this._applauseAudio.pause();
      this._applauseAudio.currentTime = 0;
    }

    // Cerrar AudioContext anterior para liberar recursos
    this._ctx?.close();
    this._ctx = null;
  }

  // ── Interno ─────────────────────────────────────────────────────

  /**
   * Fade-out suave de un HTMLAudioElement sin Web Audio API.
   * Reduce el volumen en pasos de 16 ms hasta 0 y luego pausa.
   *
   * @param {HTMLAudioElement} audio
   * @param {number} durationMs
   */
  _fadeOut(audio, durationMs) {
    const steps     = Math.ceil(durationMs / 16);
    const decrement = audio.volume / steps;
    let   remaining = steps;

    const interval = setInterval(() => {
      remaining--;
      audio.volume = Math.max(0, audio.volume - decrement);
      if (remaining <= 0) {
        clearInterval(interval);
        audio.pause();
        audio.volume = 0.75; // restaurar para la siguiente vez
      }
    }, 16);
  }
}
