/* ═══════════════════════════════════════════════════════════════
   sorteo.js — Vista Sorteo con animación slot-machine (10 s)
   Mock:  GET  http://localhost:3001/participants  → { id, name, school, logo }
   Prod:  cambiar API_BASE a la URL del endpoint real
   Regla: un participante no puede ganar dos veces (validado por id)
   ═══════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';

const API_BASE = 'http://localhost:3001';

// ── Easing cuadrático: ticks de 50 ms → 800 ms en ~10 s ─────────
function buildDelays() {
  const delays = [];
  let elapsed = 0;
  const TOTAL = 10000, MIN = 50, MAX = 800;
  while (elapsed < TOTAL) {
    const t = elapsed / TOTAL;
    const d = Math.round(MIN + (MAX - MIN) * t * t);
    delays.push(d);
    elapsed += d;
  }
  return delays;
}

// ── Helpers fetch ────────────────────────────────────────────────
async function fetchParticipants() {
  const r = await fetch(`${API_BASE}/participants`);
  if (!r.ok) throw new Error('json-server offline — ejecuta: npm run mock');
  return r.json();
}

async function fetchWinners() {
  try {
    const r = await fetch(`${API_BASE}/winners`);
    return r.ok ? r.json() : [];
  } catch { return []; }
}

async function postWinner(p) {
  await fetch(`${API_BASE}/winners`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantId: p.id,
      name: p.name,
      school: p.school,
      logo: p.logo,
      wonAt: new Date().toISOString(),
    }),
  });
}

async function clearWinners() {
  const list = await fetchWinners();
  await Promise.all(
    list.map(w => fetch(`${API_BASE}/winners/${w.id}`, { method: 'DELETE' }))
  );
}

// ── Estado local ─────────────────────────────────────────────────
let _busy = false;

// ── Entrada pública ──────────────────────────────────────────────
export function initSorteo() {
  renderSorteo();
  console.log('[sorteo] listo');
}

// ── Render del stage ─────────────────────────────────────────────
export function renderSorteo() {
  const root = document.getElementById('sorteo');
  if (!root) return;
  _busy = false;

  root.innerHTML = `
    <div class="st-stage">

      <!-- Encabezado -->
      <div class="st-header">
        <img class="st-kdo-logo" src="src/logo/KDO-08.png" alt="KDO">
        <div class="st-titles">
          <span class="st-eyebrow">KINETIC ARENA</span>
          <span class="st-title">Sorteo de Participantes</span>
        </div>
      </div>

      <!-- Tarjeta animada (slot) -->
      <div class="st-slot-wrap">
        <div class="st-card" id="st-card">
          <div class="st-card__logo-box" id="st-logo-box">
            <span class="st-card__initials" id="st-initials">KDO</span>
          </div>
          <div class="st-card__body">
            <span class="st-card__name"   id="st-name">—</span>
            <span class="st-card__school" id="st-school">Cargando participantes…</span>
          </div>
        </div>
        <div class="st-line st-line--l"></div>
        <div class="st-line st-line--r"></div>
      </div>

      <!-- Info de participantes -->
      <p class="st-meta" id="st-meta"></p>

      <!-- Botón -->
      <button class="st-btn" id="st-btn" disabled>
        <span>▶&nbsp; Iniciar Sorteo</span>
      </button>

      <!-- Overlay ganador -->
      <div class="st-winner" id="st-winner">
        <div class="st-winner__card">
          <span class="st-winner__badge">WINNER</span>
          <div class="st-winner__logo-box" id="st-w-logo"></div>
          <span class="st-winner__name"   id="st-w-name"></span>
          <span class="st-winner__school" id="st-w-school"></span>
          <div class="st-winner__actions">
            <button class="st-btn-outline" id="st-btn-nuevo">Nuevo Sorteo</button>
            <button class="st-btn-accent"  onclick="window.cambiarVista('resultados')">Ver Resultados</button>
          </div>
        </div>
      </div>

    </div>
  `;

  _load();
}

// ── Carga datos y activa el botón ────────────────────────────────
async function _load() {
  const btn = document.getElementById('st-btn');
  const meta = document.getElementById('st-meta');

  try {
    const [all, winners] = await Promise.all([fetchParticipants(), fetchWinners()]);
    const wonIds = new Set(winners.map(w => w.participantId));
    const eligible = all.filter(p => !wonIds.has(p.id));

    // Caso: todos ya ganaron
    if (eligible.length === 0) {
      _setCard({ name: 'Torneo Completo', school: `${winners.length} ganadores registrados`, logo: '' });
      if (meta) meta.textContent = 'Todos los participantes ya participaron';
      if (btn) {
        btn.innerHTML = '<span>↺&nbsp; Reiniciar Torneo</span>';
        btn.disabled = false;
        btn.addEventListener('click', async () => {
          btn.disabled = true;
          await clearWinners();
          renderSorteo();
        });
      }
      return;
    }

    // Preview aleatorio en la tarjeta
    _setCard(eligible[Math.floor(Math.random() * eligible.length)]);

    if (meta) {
      meta.textContent = `${eligible.length} participante${eligible.length !== 1 ? 's' : ''} disponibles` +
        (winners.length ? ` · ${winners.length} ya ganaron` : '');
    }

    if (btn) {
      btn.disabled = false;
      btn.addEventListener('click', () => _spin(eligible));
    }

  } catch (err) {
    _setCard({ name: 'Sin conexión', school: 'Ejecuta: npm run mock', logo: '' });
    if (meta) meta.textContent = '⚠ No se pudo conectar a json-server (:3001)';
    console.error('[sorteo]', err);
  }
}

// ── Actualiza la tarjeta central ─────────────────────────────────
function _setCard(p) {
  const nameEl = document.getElementById('st-name');
  const schoolEl = document.getElementById('st-school');
  const logoBox = document.getElementById('st-logo-box');
  if (!logoBox) return;

  if (nameEl) nameEl.textContent = p.name;
  if (schoolEl) schoolEl.textContent = p.school;

  const initials = (p.name || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (p.logo) {
    logoBox.innerHTML = `
      <img class="st-card__logo-img" src="${p.logo}" alt="${p.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="st-card__initials" style="display:none">${initials}</span>`;
  } else {
    logoBox.innerHTML = `<span class="st-card__initials">${initials}</span>`;
  }
}

// ── Animación slot-machine ───────────────────────────────────────
function _spin(eligible) {
  if (_busy) return;
  _busy = true;

  const btn = document.getElementById('st-btn');
  if (btn) btn.disabled = true;

  // Ganador pre-calculado ANTES de animar — garantiza que el frame final sea correcto
  const winner = eligible[Math.floor(Math.random() * eligible.length)];
  const pool = eligible.filter(p => p.id !== winner.id);
  const rotPool = pool.length ? pool : eligible;

  const delays = buildDelays();
  const card = document.getElementById('st-card');
  let i = 0;

  (function tick() {
    if (!card) return;
    card.classList.add('st-card--flash');
    setTimeout(() => card.classList.remove('st-card--flash'), 60);

    if (i < delays.length) {
      _setCard(rotPool[Math.floor(Math.random() * rotPool.length)]);
      setTimeout(tick, delays[i++]);
    } else {
      _setCard(winner);
      setTimeout(() => _revealWinner(winner), 700);
    }
  })();
}

// ── Revela al ganador ────────────────────────────────────────────
async function _revealWinner(winner) {
  _busy = false;

  try { await postWinner(winner); } catch { /* no bloquea la UI */ }

  setState({ sorteo: { ...getState().sorteo, ultimoGanador: winner } });

  const overlay = document.getElementById('st-winner');
  const nameEl = document.getElementById('st-w-name');
  const schEl = document.getElementById('st-w-school');
  const logoBox = document.getElementById('st-w-logo');
  if (!overlay) return;

  nameEl.textContent = winner.name;
  schEl.textContent = winner.school;

  const initials = winner.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  logoBox.innerHTML = winner.logo
    ? `<img class="st-winner__logo-img" src="${winner.logo}" alt="${winner.name}"
           onerror="this.style.display='none'">`
    : `<span class="st-winner__initials">${initials}</span>`;

  overlay.classList.add('st-winner--show');

  document.getElementById('st-btn-nuevo')?.addEventListener('click', () => {
    overlay.classList.remove('st-winner--show');
    renderSorteo();
  });
}

