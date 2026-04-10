/* ═══════════════════════════════════════════════════════════════
   medallero.js — Vista Medallero
   Responsabilidad: importar CSV y mostrar tabla de posiciones
   por escuela con medallas oro, plata y bronce.
   ═══════════════════════════════════════════════════════════════ */

// ── Estado interno ──────────────────────────────────────────────
let _data = [];

// ── Entrada pública ─────────────────────────────────────────────
export function initMedallero() {
  renderMedallero();
  console.log('[medallero] Módulo inicializado.');
}

// ── Render principal ────────────────────────────────────────────
export function renderMedallero() {
  const root = document.getElementById('medallero');
  if (!root) return;
  _data = [];

  root.innerHTML = `
    <div class="mdl-stage" id="mdl-stage">

      <header class="mdl-header">
        <div class="mdl-brand">
          <img src="public/assets/logo/KDO-08.png" alt="KDO" class="mdl-brand-logo" />
          <div class="mdl-brand-text">
            <span class="mdl-brand-title">Medallero</span>
            <span class="mdl-brand-sub">Posiciones por escuela</span>
          </div>
        </div>
        <div class="mdl-header-actions" id="mdl-header-actions"></div>
      </header>

      <div class="mdl-upload-zone" id="mdl-upload-zone">
        <div class="mdl-upload-icon" aria-hidden="true">🏅</div>
        <p class="mdl-upload-title">Importar Medallero</p>
        <p class="mdl-upload-sub">Arrastra tu archivo CSV aquí o haz clic para seleccionarlo</p>
        <label class="mdl-upload-btn" for="mdl-file-input">
          <span>Seleccionar archivo CSV</span>
          <input type="file" id="mdl-file-input" accept=".csv" class="mdl-file-input" />
        </label>
        <p class="mdl-upload-hint">Formato esperado: Pos · Escuela · Oros · Platas · Bronces · Total Medallas · Puntos</p>
      </div>

      <div id="mdl-content" class="mdl-content"></div>

    </div>
  `;

  _bindUpload();
}

// ── Binding del input de archivo ────────────────────────────────
function _bindUpload() {
  const zone  = document.getElementById('mdl-upload-zone');
  const input = document.getElementById('mdl-file-input');
  if (!input || !zone) return;

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) _processFile(file);
  });

  // Drag & drop
  zone.addEventListener('dragover', (e) => {
    e.preventDefault();
    zone.classList.add('mdl-upload-zone--drag');
  });
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('mdl-upload-zone--drag');
  });
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('mdl-upload-zone--drag');
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      _processFile(file);
    }
  });
}

// ── Procesamiento del CSV ───────────────────────────────────────
function _processFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const parsed = _parseCSV(e.target.result);
      if (!parsed || parsed.length === 0) {
        _showError('El archivo no contiene datos válidos.');
        return;
      }
      _data = parsed;
      _renderTabla(_data, file.name);
    } catch (err) {
      _showError('Error al leer el archivo: ' + err.message);
    }
  };
  reader.onerror = () => _showError('No se pudo leer el archivo.');
  reader.readAsText(file, 'UTF-8');
}

// ── Parser CSV (maneja comillas dobles RFC 4180) ─────────────────
function _parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  // Línea 0 es el encabezado → omitir
  return lines.slice(1).map((line) => {
    const cols = [];
    let inQuote = false;
    let cur = '';

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        // Comilla doble escapada ("")
        if (inQuote && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (ch === ',' && !inQuote) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());

    return {
      pos:     parseInt(cols[0], 10) || 0,
      escuela: cols[1] || '',
      oros:    parseInt(cols[2], 10) || 0,
      platas:  parseInt(cols[3], 10) || 0,
      bronces: parseInt(cols[4], 10) || 0,
      total:   parseInt(cols[5], 10) || 0,
      puntos:  parseInt(cols[6], 10) || 0,
    };
  }).filter(r => r.escuela !== '');
}

// ── Render de la tabla ──────────────────────────────────────────
function _renderTabla(data, fileName) {
  const uploadZone = document.getElementById('mdl-upload-zone');
  const content    = document.getElementById('mdl-content');
  const actions    = document.getElementById('mdl-header-actions');

  if (uploadZone) uploadZone.classList.add('mdl-upload-zone--hidden');

  if (actions) {
    actions.innerHTML = `
      <button class="mdl-btn-clear" id="mdl-btn-clear" title="Limpiar y cargar otro archivo">
        <span aria-hidden="true">↺</span> Nuevo CSV
      </button>`;
    document.getElementById('mdl-btn-clear')
      .addEventListener('click', () => renderMedallero());
  }

  if (!content) return;

  const rowsHTML = data.map((row) => {
    const posClass = row.pos === 1 ? 'mdl-row--gold'
                   : row.pos === 2 ? 'mdl-row--silver'
                   : row.pos === 3 ? 'mdl-row--bronze'
                   : '';
    const posDisplay = row.pos === 1 ? '🥇'
                     : row.pos === 2 ? '🥈'
                     : row.pos === 3 ? '🥉'
                     : row.pos;

    const oroCell    = row.oros    > 0 ? `<span class="mdl-medal mdl-medal--oro">${row.oros}</span>`    : `<span class="mdl-medal-zero">—</span>`;
    const plataCell  = row.platas  > 0 ? `<span class="mdl-medal mdl-medal--plata">${row.platas}</span>` : `<span class="mdl-medal-zero">—</span>`;
    const bronceCell = row.bronces > 0 ? `<span class="mdl-medal mdl-medal--bronce">${row.bronces}</span>` : `<span class="mdl-medal-zero">—</span>`;

    return `
      <tr class="mdl-row ${posClass}">
        <td class="mdl-td mdl-td--pos">${posDisplay}</td>
        <td class="mdl-td mdl-td--escuela">${_esc(row.escuela)}</td>
        <td class="mdl-td mdl-td--oros">${oroCell}</td>
        <td class="mdl-td mdl-td--platas">${plataCell}</td>
        <td class="mdl-td mdl-td--bronces">${bronceCell}</td>
        <td class="mdl-td mdl-td--total">${row.total}</td>
        <td class="mdl-td mdl-td--puntos">${row.puntos}</td>
      </tr>`;
  }).join('');

  const safeName = fileName ? _esc(fileName) : 'archivo.csv';

  content.innerHTML = `
    <div class="mdl-table-wrap">
      <div class="mdl-file-badge">
        <span class="mdl-file-badge__dot"></span>
        <span>${safeName} — ${data.length} escuelas cargadas</span>
      </div>
      <div class="mdl-table-scroll">
        <table class="mdl-table">
          <thead>
            <tr>
              <th class="mdl-th mdl-th--pos">Pos</th>
              <th class="mdl-th mdl-th--escuela">Escuela</th>
              <th class="mdl-th mdl-th--medal">🥇&nbsp;Oros</th>
              <th class="mdl-th mdl-th--medal">🥈&nbsp;Platas</th>
              <th class="mdl-th mdl-th--medal">🥉&nbsp;Bronces</th>
              <th class="mdl-th">Total</th>
              <th class="mdl-th mdl-th--pts">Puntos</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// ── Error inline ─────────────────────────────────────────────────
function _showError(msg) {
  const zone    = document.getElementById('mdl-upload-zone');
  const content = document.getElementById('mdl-content');
  if (zone) zone.classList.remove('mdl-upload-zone--hidden');
  if (content) {
    content.innerHTML = `
      <div class="mdl-error">
        <span aria-hidden="true">⚠️</span>
        <span>${_esc(msg)}</span>
      </div>`;
  }
}

// ── Escape HTML básico ───────────────────────────────────────────
function _esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
