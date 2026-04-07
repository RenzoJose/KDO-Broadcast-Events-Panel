/* resultados.js */
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
        ${winners.length === 0 ? _emptyState() : _contentHTML(winners)}
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
            if (content) content.innerHTML = w.length === 0 ? _emptyState() : _contentHTML(w);
        });
    });
}

function _emptyState() {
    return `<div class="rsl-empty">
    <div class="rsl-empty__icon">&#127942;</div>
    <p class="rsl-empty__text">Aun no hay ganadores</p>
    <p class="rsl-empty__sub">Inicia un sorteo para ver los resultados aqui</p>
  </div>`;
}

function _avatar(p, size) {
    const initials = p.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
    if (p.logo) {
        return `<img class="rsl-avatar rsl-avatar--${size}" src="${p.logo}" alt="${p.name}" onerror="this.style.display='none'">`;
    }
    return `<span class="rsl-avatar rsl-avatar--${size} rsl-avatar--text">${initials}</span>`;
}

function _contentHTML(winners) {
    const [first, second, third, ...rest] = winners;
    return `
    <div class="rsl-podium">
      ${second ? _podiumCard(second, 2) : '<div class="rsl-podium__gap"></div>'}
      ${_podiumCard(first, 1)}
      ${third ? _podiumCard(third, 3) : '<div class="rsl-podium__gap"></div>'}
    </div>
    ${rest.length > 0 ? _listHTML(rest, 4) : ''}
  `;
}

function _podiumCard(w, pos) {
    const BADGE = { 1: 'CAMPEON', 2: 'PLATA', 3: 'BRONCE' };
    const time = new Date(w.wonAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    const sz = pos === 1 ? 'lg' : 'md';
    return `
    <div class="rsl-podium__card rsl-podium__card--${pos}">
      <span class="rsl-badge rsl-badge--${pos}">${BADGE[pos]}</span>
      <div class="rsl-podium__avatar">${_avatar(w, sz)}</div>
      <span class="rsl-podium__name">${w.name}</span>
      <span class="rsl-podium__school">${w.subtitle || w.school || w.city || ''}</span>
      <span class="rsl-podium__time">${time}</span>
    </div>
  `;
}

function _listHTML(items, startPos) {
    const rows = items.map((w, i) => {
        const pos = startPos + i;
        const time = new Date(w.wonAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
        return `
      <div class="rsl-row">
        <span class="rsl-row__pos">${pos}</span>
        ${_avatar(w, 'sm')}
        <div class="rsl-row__info">
          <span class="rsl-row__name">${w.name}</span>
          <span class="rsl-row__school">${w.subtitle || w.school || w.city || ''}</span>
        </div>
        <span class="rsl-row__time">${time}</span>
      </div>
    `;
    }).join('');
    return `<div class="rsl-list">${rows}</div>`;
}
