/* ═══════════════════════════════════════════════════════════════
   agenda.js — Módulo de la vista Agenda (Broadcast)
   Responsabilidad: renderizar el cronograma broadcast en #agenda.
   Los estilos .ag-* viven en main.css (sección Agenda Broadcast).
   Desarrollador asignado: Dev 1
   ═══════════════════════════════════════════════════════════════ */

import { setState } from '../core/state.js';

/* ── Datos del programa ─────────────────────────────────────────
   Fuente de verdad compartida con agenda.html.
   Para actualizar el cronograma editar solo este objeto.        */
const AG_DATA = {
  matutino: [
    {
      hora: '08:00',
      eventos: [
        { nombre: 'Inicio llegada de delegaciones', icono: '🏟️', tipo: 'normal'  },
        { nombre: 'Apertura del torneo',            icono: '🎌', tipo: 'special' },
        { nombre: 'Pesaje rezagados',               icono: '⚖️', tipo: 'normal'  },
      ],
    },
    {
      hora: '08:30',
      eventos: [
        { nombre: 'Reunión de maestros', icono: '👥', tipo: 'normal' },
      ],
    },
    {
      hora: '09:00',
      eventos: [
        { nombre: 'Ceremonia de inauguración', icono: '🎖️', tipo: 'special' },
      ],
    },
    {
      hora: '09:30',
      eventos: [
        {
          nombre: 'Inicio de competencia',
          icono: '🥋',
          tipo: 'special',
          badges: [
            { label: 'Pre-Infantil', tipo: 'cat'     },
            { label: 'Poomsae',      tipo: 'poomsae' },
            { label: 'Infantil',     tipo: 'cat'     },
            { label: 'Cadete',       tipo: 'cat'     },
          ],
        },
      ],
    },
    {
      hora: '11:00',
      eventos: [
        { nombre: 'Receso', icono: '☕', tipo: 'receso' },
      ],
    },
  ],

  vespertino: [
    {
      hora: '14:00',
      eventos: [
        {
          nombre: 'Reinicio de competencia',
          icono: '🥋',
          tipo: 'special',
          badges: [
            { label: 'Juveniles', tipo: 'cat' },
            { label: 'Adultos',   tipo: 'cat' },
            { label: 'Senior',    tipo: 'cat' },
          ],
        },
      ],
    },
    {
      hora: '18:00',
      eventos: [
        { nombre: 'Acto de clausura',       icono: '🏆', tipo: 'clausura' },
        { nombre: 'Premiación de escuelas', icono: '🥇', tipo: 'clausura' },
      ],
    },
  ],
};

/* ── Estado interno del módulo ──────────────────────────────────
   Separado del estado global para no contaminar otros módulos.  */
let _jornadaActiva = 'matutino';

/* ════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════ */

function buildTimelineHTML(grupos) {
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

  return grupos.map((grupo, idx) => {
    const isLast   = idx === grupos.length - 1;
    const [hh, mm] = grupo.hora.split(':').map(Number);
    const grupoMin = hh * 60 + mm;
    const nextMin  = idx < grupos.length - 1
      ? (() => { const [nh, nm] = grupos[idx + 1].hora.split(':').map(Number); return nh * 60 + nm; })()
      : grupoMin + 90;
    const esAhora  = nowMin >= grupoMin && nowMin < nextMin;

    const eventosHTML = grupo.eventos.map(ev => {
      const badgesHTML = ev.badges
        ? `<div class="ag-badges">${ev.badges.map(b =>
            `<span class="ag-badge ag-badge--${b.tipo}">${b.label}</span>`).join('')}</div>`
        : '';
      const ahoraTag   = esAhora
        ? `<span class="ag-now-tag" aria-label="En curso">&#9679; Ahora</span>`
        : '';
      return `
        <div class="ag-event ag-event--${ev.tipo}">
          <span class="ag-event-icon" aria-hidden="true">${ev.icono}</span>
          <div class="ag-event-body">
            <span class="ag-event-name">${ev.nombre}</span>
            ${badgesHTML}
          </div>
          ${ahoraTag}
        </div>`;
    }).join('');

    return `
      <div class="ag-group${esAhora ? ' ag-group--now' : ''}">
        <div class="ag-time-col"><span class="ag-time">${grupo.hora}</span></div>
        <div class="ag-spine">
          <div class="ag-dot"></div>
          ${isLast ? '' : '<div class="ag-line"></div>'}
        </div>
        <div class="ag-events-col">${eventosHTML}</div>
      </div>`;
  }).join('');
}

/* ════════════════════════════════════════════════════════════════
   RENDER PRINCIPAL — inyecta en <section id="agenda">
   ════════════════════════════════════════════════════════════════ */

export function renderAgenda() {
  const contenedor = document.getElementById('agenda');
  if (!contenedor) return;

  contenedor.innerHTML = `
    <div class="ag-wrapper" style="position:relative;z-index:0;">

      <header class="ag-header">
        <div class="ag-brand">
          <div class="ag-brand-logo-wrap">
            <img src="public/assets/logo/KDO-08.png" alt="KDO" class="ag-brand-logo" />
          </div>
          <div class="ag-brand-text">
            <div class="ag-event-name">KDO <em>OPEN</em></div>
            <div class="ag-event-sub">Programa Oficial del Torneo</div>
          </div>
        </div>

        <div class="ag-tabs" role="tablist">
          <button class="ag-tab${_jornadaActiva === 'matutino' ? ' active' : ''}"
                  id="ag-tab-matutino" role="tab"
                  onclick="agModSwitchTab('matutino')">Matutino</button>
          <button class="ag-tab${_jornadaActiva === 'vespertino' ? ' active' : ''}"
                  id="ag-tab-vespertino" role="tab"
                  onclick="agModSwitchTab('vespertino')">Vespertino</button>
        </div>

        <div class="ag-header-meta">
          <div class="ag-live"><div class="ag-live-dot"></div>En Vivo</div>
          <div class="ag-clock" id="ag-mod-reloj">--:--:--</div>
        </div>
      </header>

      <main class="ag-content">
        <div class="ag-panel${_jornadaActiva === 'matutino' ? ' active' : ''}" id="ag-mod-panel-matutino">
          <div class="ag-panel-label">Jornada Matutina &mdash; hasta las 13:00 h</div>
          <div class="ag-timeline">${buildTimelineHTML(AG_DATA.matutino)}</div>
        </div>
        <div class="ag-panel${_jornadaActiva === 'vespertino' ? ' active' : ''}" id="ag-mod-panel-vespertino">
          <div class="ag-panel-label">Jornada Vespertina &mdash; desde las 14:00 h</div>
          <div class="ag-timeline">${buildTimelineHTML(AG_DATA.vespertino)}</div>
        </div>
      </main>

      <footer class="ag-footer">
        <span class="ag-footer-date" id="ag-mod-fecha"></span>
        <span class="ag-footer-brand">KDO Broadcast Events Panel</span>
      </footer>

    </div>`;

  // Reloj
  function tick() {
    const n  = new Date();
    const hh = n.getHours()  .toString().padStart(2, '0');
    const mm = n.getMinutes().toString().padStart(2, '0');
    const ss = n.getSeconds().toString().padStart(2, '0');
    const el = document.getElementById('ag-mod-reloj');
    if (el) el.textContent = `${hh}:${mm}:${ss}`;
  }
  tick();
  setInterval(tick, 1000);

  // Fecha footer
  const fechaEl = document.getElementById('ag-mod-fecha');
  if (fechaEl) {
    const s = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    fechaEl.textContent = s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Badge AUTO
  const jornada = new Date().getHours() >= 14 ? 'vespertino' : 'matutino';
  const autoBtn = document.getElementById(`ag-tab-${jornada}`);
  if (autoBtn && !autoBtn.querySelector('.ag-tab-auto')) {
    const badge      = document.createElement('span');
    badge.className  = 'ag-tab-auto';
    badge.textContent = 'auto';
    autoBtn.appendChild(badge);
  }

  // Exponer función de switch para los onclick inline
  window.agModSwitchTab = (j) => {
    _jornadaActiva = j;
    document.querySelectorAll('.ag-tab').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById(`ag-tab-${j}`);
    if (btn) btn.classList.add('active');
    document.querySelectorAll('[id^="ag-mod-panel-"]').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(`ag-mod-panel-${j}`);
    if (panel) panel.classList.add('active');
    setState({ agenda: { ...{ jornadaActiva: j } } });
  };
}

/* ════════════════════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════════════════════ */

export function initAgenda() {
  _jornadaActiva = new Date().getHours() >= 14 ? 'vespertino' : 'matutino';
  setState({ agenda: { jornadaActiva: _jornadaActiva, eventos: AG_DATA } });
  renderAgenda();
  console.log('[agenda] Módulo inicializado — jornada:', _jornadaActiva);
}
