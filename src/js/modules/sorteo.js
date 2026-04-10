/* ══════════════════════════════════════════════════════════════════
   sorteo.js — Vista Sorteo con animación slot-machine (10 s)
   Modos: 'athletes' | 'schools'
   Regla:  un item no puede ganar dos veces por modo (validado por id)
   ══════════════════════════════════════════════════════════════════ */

import { getState, setState } from '../core/state.js';
import { fetchData, fetchWinners, postWinner, clearWinners, fetchPrize } from '../api/sorteo-api.js';
import { renderPrizeSection, showPrizeForm, setupPrizeVisibility } from './sorteo-prize.js';
import { SoundController } from './sound-controller.js';

// ── Configuración por modo ───────────────────────────────────────

const MODE_CFG = {
  athletes: {
    title:    'Sorteo de Atletas',
    singular: 'atleta',
    plural:   'atletas',
    subtitle: p => p.school || '',
  },
  schools: {
    title:    'Sorteo de Escuelas',
    singular: 'escuela',
    plural:   'escuelas',
    subtitle: p => p.city || '',
  },
};

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

// ── Helpers puros ────────────────────────────────────────────────

function _getInitials(name) {
  return (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function _getEligible(all, winners, cfg) {
  const wonIds = new Set(winners.map(w => w.participantId));
  return all.filter(p => !wonIds.has(p.id)).map(p => ({ ...p, subtitle: cfg.subtitle(p) }));
}

function _updateBtn({ disabled, label, onClick = null }) {
  const btn = document.getElementById('st-btn');
  if (!btn) return;
  btn.disabled  = disabled;
  btn.innerHTML = `<span>${label}</span>`;
  btn.onclick   = onClick;
}

// ── Estado local ─────────────────────────────────────────────────

let _busy         = false;
let _mode         = 'athletes'; // 'athletes' | 'schools'
let _currentPrize = null;
const _sound      = new SoundController();

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
  _sound.reset();

  root.innerHTML = `
    <div class="st-stage" id="st-stage">

      <!-- Encabezado -->
      <div class="st-header">
        <img class="st-kdo-logo" src="public/assets/logo/KDO-08.png" alt="KDO">
        <div class="st-titles">
          <span class="st-title" id="st-title">${MODE_CFG[_mode].title}</span>
        </div>
      </div>

      <!-- Sección de premio -->
      <div id="st-prize-section" class="st-prize-section"></div>

      <!-- Switch de modo -->
      <div class="st-switch" id="st-switch">
        <button class="st-switch__btn ${_mode === 'athletes' ? 'st-switch__btn--active' : ''}" data-mode="athletes">
          Atletas
        </button>
        <button class="st-switch__btn ${_mode === 'schools' ? 'st-switch__btn--active' : ''}" data-mode="schools">
          Escuelas
        </button>
      </div>

      <!-- Tarjeta animada (slot) -->
      <div class="st-slot-wrap">
        <div class="st-card" id="st-card">
          <div class="st-card__logo-box" id="st-logo-box">
            <span class="st-card__initials">KDO</span>
          </div>
          <div class="st-card__body">
            <span class="st-card__name"   id="st-name">—</span>
            <span class="st-card__school" id="st-school">Cargando…</span>
          </div>
        </div>
        <div class="st-line st-line--l"></div>
        <div class="st-line st-line--r"></div>
      </div>

      <!-- Botón -->
      <button class="st-btn" id="st-btn" disabled>
        <span>Iniciar Sorteo</span>
      </button>

      <!-- Overlay ganador -->
      <div class="st-winner" id="st-winner">
        <div class="st-winner__card">
          <span class="st-winner__badge">WINNER</span>
          <div class="st-winner__logo-box" id="st-w-logo"></div>
          <span class="st-winner__name"   id="st-w-name"></span>
          <span class="st-winner__school" id="st-w-school"></span>
          <div id="st-winner-prize-box" class="st-winner__prize-box" style="display:none">
            <span class="st-winner__prize-name" id="st-w-prize-name"></span>
            <span class="st-winner__prize-desc" id="st-w-prize-desc"></span>
          </div>
          <div class="st-winner__actions">
            <button class="st-btn-outline" id="st-btn-nuevo">Nuevo Sorteo</button>
            <button class="st-btn-accent"  id="st-btn-resultados">Ver Resultados</button>
          </div>
        </div>
      </div>

    </div>
  `;

  document.querySelectorAll('#st-switch .st-switch__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === _mode || _busy) return;
      _mode = btn.dataset.mode;

      document.querySelectorAll('#st-switch .st-switch__btn').forEach(b =>
        b.classList.toggle('st-switch__btn--active', b.dataset.mode === _mode)
      );
      document.getElementById('st-title').textContent = MODE_CFG[_mode].title;

      _setCard({ name: '—', subtitle: 'Cargando…', logo: '' });
      _updateBtn({ disabled: true, label: 'Iniciar Sorteo' });
      _load();
    });
  });

  _load();
  setupPrizeVisibility(document.getElementById('st-stage'));
}

// ── Carga datos y activa el botón ────────────────────────────────

async function _load() {
  const mode = _mode;
  const cfg  = MODE_CFG[mode];

  try {
    const [all, winners, prize] = await Promise.all([
      fetchData(mode), fetchWinners(mode), fetchPrize(),
    ]);

    if (_mode !== mode) return;

    _currentPrize = prize;
    renderPrizeSection(prize, {
      onEdit:        (p) => showPrizeForm(p, { onAfterSave: (saved) => { _currentPrize = saved; _load(); } }),
      onAfterDelete: ()  => { _currentPrize = null; _load(); },
    });

    const eligible = _getEligible(all, winners, cfg);

    if (eligible.length === 0) {
      _setCard({ name: `${cfg.title} Completo`, subtitle: `${winners.length} ganadores registrados`, logo: '' });
      _updateBtn({
        disabled: false,
        label:    'Reiniciar',
        onClick:  async () => {
          _updateBtn({ disabled: true, label: 'Reiniciar' });
          await clearWinners(mode);
          _setCard({ name: '—', subtitle: 'Cargando…', logo: '' });
          _load();
        },
      });
      return;
    }

    _setCard(eligible[Math.floor(Math.random() * eligible.length)]);
    _updateBtn(prize
      ? { disabled: false, label: 'Iniciar Sorteo', onClick: () => _spin(eligible, mode) }
      : { disabled: true,  label: 'Iniciar SORTEO' }
    );

  } catch (err) {
    if (_mode !== mode) return;
    _setCard({ name: 'Sin conexión', subtitle: 'Ejecuta: npm run mock', logo: '' });
    console.error('[sorteo]', err);
  }
}

// ── Actualiza la tarjeta central ─────────────────────────────────

function _setCard(item) {
  const nameEl   = document.getElementById('st-name');
  const schoolEl = document.getElementById('st-school');
  const logoBox  = document.getElementById('st-logo-box');
  if (!logoBox) return;

  if (nameEl)   nameEl.textContent   = item.name;
  if (schoolEl) schoolEl.textContent = item.subtitle;

  const initials = _getInitials(item.name);

  if (item.logo) {
    logoBox.innerHTML = `
      <img class="st-card__logo-img" src="${item.logo}" alt="${item.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="st-card__initials" style="display:none">${initials}</span>`;
  } else {
    logoBox.innerHTML = `<span class="st-card__initials">${initials}</span>`;
  }
}

// ── Animación slot-machine ───────────────────────────────────────

function _spin(eligible, mode) {
  if (_busy) return;
  _busy = true;
  _updateBtn({ disabled: true, label: 'Sorteando…' });
  _sound.start();

  const winner  = eligible[Math.floor(Math.random() * eligible.length)];
  const pool    = eligible.filter(p => p.id !== winner.id);
  const rotPool = pool.length ? pool : eligible;

  const delays = buildDelays();
  const card   = document.getElementById('st-card');
  let i = 0;

  (function tick() {
    if (!card) return;
    card.classList.add('st-card--flash');
    setTimeout(() => card.classList.remove('st-card--flash'), 60);

    if (i < delays.length) {
      _sound.tick(delays[i]);
      _setCard(rotPool[Math.floor(Math.random() * rotPool.length)]);
      setTimeout(tick, delays[i++]);
    } else {
      _setCard(winner);
      setTimeout(() => _revealWinner(winner, mode), 700);
    }
  })();
}

// ── Revela al ganador ────────────────────────────────────────────

async function _revealWinner(winner, mode) {
  _busy = false;

  try { await postWinner(winner, mode, _currentPrize); } catch { /* no bloquea la UI */ }

  setState({ sorteo: { ...getState().sorteo, ultimoGanador: winner } });

  const overlay = document.getElementById('st-winner');
  const nameEl  = document.getElementById('st-w-name');
  const schEl   = document.getElementById('st-w-school');
  const logoBox = document.getElementById('st-w-logo');
  if (!overlay) return;

  nameEl.textContent = winner.name;
  schEl.textContent  = winner.subtitle;

  const initials = _getInitials(winner.name);
  logoBox.innerHTML  = winner.logo
    ? `<img class="st-winner__logo-img" src="${winner.logo}" alt="${winner.name}"
           onerror="this.style.display='none'">`
    : `<span class="st-winner__initials">${initials}</span>`;

  const prizeBox = document.getElementById('st-winner-prize-box');
  if (prizeBox) {
    if (_currentPrize) {
      document.getElementById('st-w-prize-name').textContent = `🏆  ${_currentPrize.name}`;
      const descEl = document.getElementById('st-w-prize-desc');
      if (descEl) descEl.textContent = _currentPrize.description || '';
      prizeBox.style.display = 'flex';
    } else {
      prizeBox.style.display = 'none';
    }
  }

  overlay.classList.add('st-winner--show');
  _sound.playApplause();

  document.getElementById('st-btn-nuevo')?.addEventListener('click', () => {
    overlay.classList.remove('st-winner--show');
    renderSorteo();
  });

  document.getElementById('st-btn-resultados')?.addEventListener('click', () => {
    window.cambiarVista('resultados');
  });
}
