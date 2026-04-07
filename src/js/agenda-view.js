/* ══════════════════════════════════════════════════════════════════
   agenda-view.js — Lógica de la vista standalone: agenda.html
   ──────────────────────────────────────────────────────────────────
   Responsabilidades:
     · Datos del programa (AG_DATA)
     · Render del timeline
     · Control de tabs (Matutino / Vespertino)
     · Auto-detección de jornada por hora
     · Reloj en tiempo real
     · Fecha dinámica en footer
   ══════════════════════════════════════════════════════════════════ */

/* ── Datos del programa ─────────────────────────────────────────── */

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

/* ── Render del timeline ────────────────────────────────────────── */

function agRenderTimeline(grupos, contenedorId) {
  const contenedor = document.getElementById(contenedorId);
  if (!contenedor) return;

  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  contenedor.innerHTML = grupos.map((grupo, idx) => {
    const isLast = idx === grupos.length - 1;

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
      const ahoraTag = esAhora
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

/* ── Control de tabs ────────────────────────────────────────────── */

function agSwitchTab(jornada) {
  document.querySelectorAll('.ag-tab').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  const btn = document.getElementById(`tab-${jornada}`);
  if (btn) { btn.classList.add('active'); btn.setAttribute('aria-selected', 'true'); }

  document.querySelectorAll('.ag-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById(`panel-${jornada}`);
  if (panel) panel.classList.add('active');
}

/* Los botones del HTML usan onclick="agSwitchTab(...)", por lo que
   la función debe estar en el scope global. Ya lo está al no usar módulos. */

/* ── Auto-detección de jornada ──────────────────────────────────── */

function agAutoDetect() {
  const hora    = new Date().getHours();
  const jornada = hora >= 14 ? 'vespertino' : 'matutino';
  agSwitchTab(jornada);

  const btn = document.getElementById(`tab-${jornada}`);
  if (btn && !btn.querySelector('.ag-tab-auto')) {
    const badge      = document.createElement('span');
    badge.className  = 'ag-tab-auto';
    badge.textContent = 'auto';
    btn.appendChild(badge);
  }
}

/* ── Reloj en tiempo real ───────────────────────────────────────── */

function agTickReloj() {
  const n  = new Date();
  const hh = n.getHours()  .toString().padStart(2, '0');
  const mm = n.getMinutes().toString().padStart(2, '0');
  const ss = n.getSeconds().toString().padStart(2, '0');
  const el = document.getElementById('ag-reloj');
  if (el) el.textContent = `${hh}:${mm}:${ss}`;
}

/* ── Fecha dinámica en footer ───────────────────────────────────── */

function agSetFecha() {
  const el = document.getElementById('ag-fecha');
  if (!el) return;
  const s = new Date().toLocaleDateString('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  el.textContent = s.charAt(0).toUpperCase() + s.slice(1);
}

/* ── Init ───────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', () => {
  agRenderTimeline(AG_DATA.matutino,   'tl-matutino');
  agRenderTimeline(AG_DATA.vespertino, 'tl-vespertino');
  agAutoDetect();
  agSetFecha();
  agTickReloj();
  setInterval(agTickReloj, 1000);
});
