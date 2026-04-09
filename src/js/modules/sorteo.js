/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   sorteo.js â€” Vista Sorteo con animaciÃ³n slot-machine (10 s)
   Modos: 'athletes' (GET /athletes) | 'schools' (GET /schools)
   Winners: /athleteWinners  |  /schoolWinners
   Regla:  un item no puede ganar dos veces por modo (validado por id)
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

import { getState, setState } from '../core/state.js';

const API_BASE = 'http://localhost:3001';

// â”€â”€ ConfiguraciÃ³n por modo â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ENDPOINTS = {
  athletes: { data: 'athletes', winners: 'athleteWinners' },
  schools: { data: 'schools', winners: 'schoolWinners' },
};

const MODE_CFG = {
  athletes: {
    title: 'Sorteo de Atletas',
    singular: 'atleta',
    plural: 'atletas',
    subtitle: p => p.school || '',
  },
  schools: {
    title: 'Sorteo de Escuelas',
    singular: 'escuela',
    plural: 'escuelas',
    subtitle: p => p.city || '',
  },
};

// â”€â”€ Easing cuadrÃ¡tico: ticks de 50 ms â†’ 800 ms en ~10 s â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€ Helpers fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function fetchData(mode) {
  const r = await fetch(`${API_BASE}/${ENDPOINTS[mode].data}`);
  if (!r.ok) throw new Error('json-server offline â€” ejecuta: npm run mock');
  return r.json();
}

async function fetchWinners(mode) {
  try {
    const r = await fetch(`${API_BASE}/${ENDPOINTS[mode].winners}`);
    return r.ok ? r.json() : [];
  } catch { return []; }
}

async function postWinner(p, mode) {
  await fetch(`${API_BASE}/${ENDPOINTS[mode].winners}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantId: p.id,
      name: p.name,
      subtitle: p.subtitle,
      logo: p.logo,
      type: mode,
      wonAt: new Date().toISOString(),
    }),
  });
}

async function clearWinners(mode) {
  const list = await fetchWinners(mode);
  await Promise.all(
    list.map(w => fetch(`${API_BASE}/${ENDPOINTS[mode].winners}/${w.id}`, { method: 'DELETE' }))
  );
}

// â”€â”€ Estado local â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let _busy = false;
let _mode = 'athletes'; // 'athletes' | 'schools'

// â”€â”€ Entrada pÃºblica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function initSorteo() {
  renderSorteo();
  console.log('[sorteo] listo');
}

// â”€â”€ Render del stage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export function renderSorteo() {
  const root = document.getElementById('sorteo');
  if (!root) return;
  _busy = false;

  root.innerHTML = `
    <div class="st-stage" id="st-stage">

      <!-- Encabezado -->
      <div class="st-header">
        <img class="st-kdo-logo" src="public/assets/logo/KDO-08.png" alt="KDO">
        <div class="st-titles">
          <span class="st-title" id="st-title">${MODE_CFG[_mode].title}</span>
        </div>
      </div>

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
            <span class="st-card__name"   id="st-name">â€”</span>
            <span class="st-card__school" id="st-school">Cargandoâ€¦</span>
          </div>
        </div>
        <div class="st-line st-line--l"></div>
        <div class="st-line st-line--r"></div>
      </div>

      <!-- Info -->
      <p class="st-meta" id="st-meta"></p>

      <!-- BotÃ³n -->
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
          <div class="st-winner__actions">
            <button class="st-btn-outline" id="st-btn-nuevo">Nuevo Sorteo</button>
            <button class="st-btn-accent"  id="st-btn-resultados">Ver Resultados</button>
          </div>
        </div>
      </div>

    </div>
  `;

  // Bind switch
  document.querySelectorAll('#st-switch .st-switch__btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.mode === _mode || _busy) return;
      _mode = btn.dataset.mode;

      document.querySelectorAll('#st-switch .st-switch__btn').forEach(b =>
        b.classList.toggle('st-switch__btn--active', b.dataset.mode === _mode)
      );
      document.getElementById('st-title').textContent = MODE_CFG[_mode].title;

      // Reset UI y recargar datos
      _setCard({ name: 'â€”', subtitle: 'Cargandoâ€¦', logo: '' });
      const meta = document.getElementById('st-meta');
      if (meta) meta.textContent = '';
      const btn2 = document.getElementById('st-btn');
      if (btn2) { btn2.disabled = true; btn2.innerHTML = '<span>Iniciar Sorteo</span>'; }

      _load();
    });
  });

  _load();
}

// â”€â”€ Carga datos y activa el botÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function _load() {
  const btn = document.getElementById('st-btn');
  const meta = document.getElementById('st-meta');
  const mode = _mode; // captura el modo actual (evita race conditions)
  const cfg = MODE_CFG[mode];

  try {
    const [all, winners] = await Promise.all([fetchData(mode), fetchWinners(mode)]);

    // Si el modo cambiÃ³ mientras cargaba, ignorar
    if (_mode !== mode) return;

    const wonIds = new Set(winners.map(w => w.participantId));
    const eligible = all
      .filter(p => !wonIds.has(p.id))
      .map(p => ({ ...p, subtitle: cfg.subtitle(p) }));

    // Caso: todos ya ganaron
    if (eligible.length === 0) {
      _setCard({ name: `${cfg.title} Completo`, subtitle: `${winners.length} ganadores registrados`, logo: '' });
      if (meta) meta.textContent = `Todos los ${cfg.plural} ya participaron`;
      if (btn) {
        btn.innerHTML = '<span>Reiniciar</span>';
        btn.disabled = false;
        btn.onclick = async () => {
          btn.disabled = true;
          await clearWinners(mode);
          _setCard({ name: 'â€”', subtitle: 'Cargandoâ€¦', logo: '' });
          if (meta) meta.textContent = '';
          _load();
        };
      }
      return;
    }

    // Preview aleatorio
    _setCard(eligible[Math.floor(Math.random() * eligible.length)]);

    if (meta) {
      meta.textContent =
        `${eligible.length} ${eligible.length !== 1 ? cfg.plural : cfg.singular} disponibles` +
        (winners.length ? ` Â· ${winners.length} ya ganaron` : '');
    }

    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>Iniciar Sorteo</span>';
      btn.onclick = () => _spin(eligible, mode);
    }

  } catch (err) {
    if (_mode !== mode) return;
    _setCard({ name: 'Sin conexiÃ³n', subtitle: 'Ejecuta: npm run mock', logo: '' });
    if (meta) meta.textContent = 'âš  No se pudo conectar a json-server (:3001)';
    console.error('[sorteo]', err);
  }
}

// â”€â”€ Actualiza la tarjeta central â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _setCard(item) {
  const nameEl = document.getElementById('st-name');
  const schoolEl = document.getElementById('st-school');
  const logoBox = document.getElementById('st-logo-box');
  if (!logoBox) return;

  if (nameEl) nameEl.textContent = item.name;
  if (schoolEl) schoolEl.textContent = item.subtitle;

  const initials = (item.name || '?')
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  if (item.logo) {
    logoBox.innerHTML = `
      <img class="st-card__logo-img" src="${item.logo}" alt="${item.name}"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="st-card__initials" style="display:none">${initials}</span>`;
  } else {
    logoBox.innerHTML = `<span class="st-card__initials">${initials}</span>`;
  }
}

// â”€â”€ AnimaciÃ³n slot-machine â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function _spin(eligible, mode) {
  if (_busy) return;
  _busy = true;

  const btn = document.getElementById('st-btn');
  if (btn) btn.disabled = true;

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
      setTimeout(() => _revealWinner(winner, mode), 700);
    }
  })();
}

// â”€â”€ Revela al ganador â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function _revealWinner(winner, mode) {
  _busy = false;

  try { await postWinner(winner, mode); } catch { /* no bloquea la UI */ }

  setState({ sorteo: { ...getState().sorteo, ultimoGanador: winner } });

  const overlay = document.getElementById('st-winner');
  const nameEl = document.getElementById('st-w-name');
  const schEl = document.getElementById('st-w-school');
  const logoBox = document.getElementById('st-w-logo');
  if (!overlay) return;

  nameEl.textContent = winner.name;
  schEl.textContent = winner.subtitle;

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

  document.getElementById('st-btn-resultados')?.addEventListener('click', () => {
    window.cambiarVista('resultados');
  });
}
