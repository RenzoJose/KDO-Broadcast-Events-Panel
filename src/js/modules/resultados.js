/* resultados.js — Wall of Winners */
const API_BASE = 'http://localhost:3001';

let _tab = 'athletes';

async function fetchWinnersOf(type) {
    try {
        const endpoint = type === 'athletes' ? 'athleteWinners' : 'schoolWinners';
        const r = await fetch(`${API_BASE}/${endpoint}`);
        return r.ok ? r.json() : [];
    } catch { return []; }
}

async function fetchCount(type) {
    try {
        const endpoint = type === 'athletes' ? 'athletes' : 'schools';
        const r = await fetch(`${API_BASE}/${endpoint}`);
        const data = r.ok ? await r.json() : [];
        return data.length;
    } catch { return 0; }
}

export function initResultados() {
    renderResultados();
}

export async function renderResultados() {
    const root = document.getElementById('resultados');
    if (!root) return;
    root.innerHTML = '<div class="rsl-stage rsl-loading"><span class="rsl-spinner"></span></div>';

    const tab = _tab;
    let winners = [], total = 0;
    try {
        [winners, total] = await Promise.all([fetchWinnersOf(tab), fetchCount(tab)]);
    } catch { }

    winners.sort((a, b) => new Date(a.wonAt) - new Date(b.wonAt));

    const LABELS = { athletes: 'Atletas', schools: 'Escuelas' };

    root.innerHTML = `
    <div class="rsl-stage" id="rsl-stage">
      <div class="rsl-header">
        <div class="rsl-header__left">
          <h1 class="rsl-main-title">Resultados del Sorteo</h1>
          <p class="rsl-subtitle">Ganadores registrados en tiempo real</p>
        </div>
        <div class="rsl-stats">
          <div class="rsl-stat">
            <span class="rsl-stat__num">${winners.length}</span>
            <span class="rsl-stat__label">Ganadores</span>
          </div>
          <div class="rsl-stat">
            <span class="rsl-stat__num">${total}</span>
            <span class="rsl-stat__label">${LABELS[tab]}</span>
          </div>
        </div>
      </div>

      <div class="rsl-tabs" id="rsl-tabs">
        <button class="rsl-tab ${tab === 'athletes' ? 'rsl-tab--active' : ''}" data-tab="athletes">Atletas</button>
        <button class="rsl-tab ${tab === 'schools' ? 'rsl-tab--active' : ''}" data-tab="schools">Escuelas</button>
      </div>

      <div id="rsl-content">
        ${winners.length === 0 ? _emptyState() : _wallHTML(winners)}
      </div>
    </div>
  `;

    document.querySelectorAll('#rsl-tabs .rsl-tab').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (btn.dataset.tab === _tab) return;
            _tab = btn.dataset.tab;
            document.querySelectorAll('#rsl-tabs .rsl-tab').forEach(b =>
                b.classList.toggle('rsl-tab--active', b.dataset.tab === _tab)
            );
            const content = document.getElementById('rsl-content');
            if (content) content.innerHTML = '<div style="display:flex;justify-content:center;padding:2rem"><span class="rsl-spinner"></span></div>';
            let w = [], t = 0;
            try { [w, t] = await Promise.all([fetchWinnersOf(_tab), fetchCount(_tab)]); } catch { }
            w.sort((a, b) => new Date(a.wonAt) - new Date(b.wonAt));
            const statNums = document.querySelectorAll('.rsl-stat__num');
            const statLabels = document.querySelectorAll('.rsl-stat__label');
            if (statNums[0]) statNums[0].textContent = w.length;
            if (statNums[1]) statNums[1].textContent = t;
            if (statLabels[1]) statLabels[1].textContent = LABELS[_tab];
            if (content) content.innerHTML = w.length === 0 ? _emptyState() : _wallHTML(w);
        });
    });
}

function _emptyState() {
    return `<div class="rsl-empty">
    <div class="rsl-empty__icon">&#9889;</div>
    <p class="rsl-empty__text">Aún no hay ganadores</p>
    <p class="rsl-empty__sub">Inicia un sorteo para ver los resultados aquí</p>
  </div>`;
}

function _avatar(p, size) {
    const initials = p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (p.logo) {
        return `<img class="rsl-avatar rsl-avatar--${size}" src="${p.logo}" alt="" onerror="this.style.display='none'">`;
    }
    return `<span class="rsl-avatar rsl-avatar--${size} rsl-avatar--text">${initials}</span>`;
}

// ── Wall of Winners ─────────────────────────────────────────────
function _wallHTML(winners) {
    // El más reciente como hero, el resto en grid (orden cronológico invertido)
    const sorted = [...winners].sort((a, b) => new Date(b.wonAt) - new Date(a.wonAt));
    const [hero, ...rest] = sorted;
    return `
    <div class="rsl-wall">
      ${_heroCard(hero)}
      ${rest.length > 0 ? `<div class="rsl-grid">${rest.map(_winnerCard).join('')}</div>` : ''}
    </div>`;
}

function _heroCard(w) {
    const time = new Date(w.wonAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const subtitle = w.subtitle || w.school || w.city || '';
    const prizeBadge = w.prize?.name
        ? `<div class="rsl-hero__prize">
             <span class="rsl-hero__prize-name">🏆 ${_esc(w.prize.name)}</span>
             ${w.prize.description ? `<span class="rsl-hero__prize-desc">${_esc(w.prize.description)}</span>` : ''}
           </div>`
        : '';
    return `
    <div class="rsl-hero">
      <div class="rsl-hero__organizer">
        <img src="public/assets/logo/KDO-08.png" alt="KDO" class="rsl-hero__org-logo">
        <span class="rsl-hero__org-text">Organizado por</span>
      </div>
      <div class="rsl-hero__badge-wrap">
        <span class="rsl-hero__eyebrow">⚡ Último Ganador</span>
      </div>
      <div class="rsl-hero__content">
        ${_avatar(w, 'hero')}
        <div class="rsl-hero__info">
          <span class="rsl-hero__name">${_esc(w.name)}</span>
          <span class="rsl-hero__school">${_esc(subtitle)}</span>
          ${prizeBadge}
          <span class="rsl-hero__time">${time}</span>
        </div>
      </div>
    </div>`;
}

function _winnerCard(w) {
    const time = new Date(w.wonAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const subtitle = w.subtitle || w.school || w.city || '';
    const prizeBadge = w.prize?.name
        ? `<span class="rsl-card__prize">🏆 ${_esc(w.prize.name)}</span>`
        : '';
    return `
    <div class="rsl-card">
      ${_avatar(w, 'card')}
      <span class="rsl-card__name">${_esc(w.name)}</span>
      <span class="rsl-card__school">${_esc(subtitle)}</span>
      ${prizeBadge}
      <span class="rsl-card__time">${time}</span>
    </div>`;
}

// Escapa texto antes de interpolarlo en HTML
function _esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
