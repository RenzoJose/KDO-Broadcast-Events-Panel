/* ══════════════════════════════════════════════════════════════════
   sorteo-prize.js — UI de gestión de premios del sorteo
   Responsabilidades: render de sección, formulario modal, auto-hide.
   ══════════════════════════════════════════════════════════════════ */

import { createPrize, updatePrize, deletePrize } from '../api/sorteo-api.js';

// ── Sección de premio (render) ───────────────────────────────────

/**
 * @param {object|null} prize
 * @param {{ onEdit: (prize) => void, onAfterDelete: () => void }} callbacks
 */
export function renderPrizeSection(prize, { onEdit, onAfterDelete }) {
  const section = document.getElementById('st-prize-section');
  if (!section) return;

  if (prize) {
    section.innerHTML = `
      <div class="st-prize-display">
        <div class="st-prize-card">
          <span class="st-prize-card__icon">🏆</span>
          <div class="st-prize-card__info">
            <span class="st-prize-card__name" id="st-pr-name"></span>
            <span class="st-prize-card__desc" id="st-pr-desc"></span>
          </div>
        </div>
        <div class="st-prize-actions">
          <button class="st-prize-btn st-prize-btn--edit"   id="st-pr-edit">✏</button>
          <button class="st-prize-btn st-prize-btn--delete" id="st-pr-delete">🗑</button>
        </div>
      </div>`;

    // textContent para evitar XSS
    const nameEl = document.getElementById('st-pr-name');
    const descEl = document.getElementById('st-pr-desc');
    if (nameEl) nameEl.textContent = prize.name;
    if (descEl) descEl.textContent = prize.description || '';

    document.getElementById('st-pr-edit')?.addEventListener('click', () => onEdit(prize));

    document.getElementById('st-pr-delete')?.addEventListener('click', async () => {
      const btn = document.getElementById('st-pr-delete');
      if (btn) btn.disabled = true;
      await deletePrize(prize.id);
      onAfterDelete();
    });
  } else {
    section.innerHTML = `
      <div class="st-prize-empty">
        <span class="st-prize-empty__label">Sin premio configurado</span>
        <button class="st-prize-btn st-prize-btn--add" id="st-pr-add">＋</button>
      </div>`;
    document.getElementById('st-pr-add')?.addEventListener('click', () => onEdit(null));
  }
}

// ── Formulario modal de premio ───────────────────────────────────

/**
 * @param {object|null} existingPrize  null = creación, objeto = edición
 * @param {{ onAfterSave: (saved) => void }} callbacks
 */
export function showPrizeForm(existingPrize, { onAfterSave }) {
  const stage = document.getElementById('st-stage');
  if (!stage) return;

  document.getElementById('st-prize-modal')?.remove();

  const modal = document.createElement('div');
  modal.id        = 'st-prize-modal';
  modal.className = 'st-prize-modal';
  modal.innerHTML = `
    <div class="st-prize-modal__backdrop"></div>
    <div class="st-prize-modal__box">
      <p class="st-prize-modal__title">${existingPrize ? 'Editar Premio' : 'Nuevo Premio'}</p>
      <div class="st-prize-form__field">
        <label class="st-prize-form__label">Nombre del Premio</label>
        <input class="st-prize-input" id="st-pr-input-name" type="text"
               placeholder="Ej: Trofeo KDO 2026" maxlength="80" autocomplete="off">
      </div>
      <div class="st-prize-form__field">
        <label class="st-prize-form__label">Descripción (opcional)</label>
        <input class="st-prize-input" id="st-pr-input-desc" type="text"
               placeholder="Ej: Premio principal del evento" maxlength="160" autocomplete="off">
      </div>
      <div class="st-prize-form__actions">
        <button class="st-prize-btn st-prize-btn--cancel" id="st-pr-cancel">Cancelar</button>
        <button class="st-prize-btn st-prize-btn--save"   id="st-pr-save">Guardar ✓</button>
      </div>
    </div>`;

  stage.appendChild(modal);

  // Bloquear propagación para que listeners globales no intercepten las teclas
  modal.addEventListener('keydown', e => e.stopPropagation());

  const nameInput = document.getElementById('st-pr-input-name');
  const descInput = document.getElementById('st-pr-input-desc');
  if (existingPrize) {
    if (nameInput) nameInput.value = existingPrize.name;
    if (descInput) descInput.value = existingPrize.description || '';
  }
  nameInput?.focus();

  function _closeModal() {
    modal.classList.add('st-prize-modal--closing');
    setTimeout(() => modal.remove(), 200);
  }

  modal.querySelector('.st-prize-modal__backdrop')?.addEventListener('click', _closeModal);
  document.getElementById('st-pr-cancel')?.addEventListener('click', _closeModal);

  document.getElementById('st-pr-save')?.addEventListener('click', async () => {
    const name = nameInput?.value.trim();
    if (!name) { nameInput?.focus(); return; }

    const saveBtn = document.getElementById('st-pr-save');
    if (saveBtn) saveBtn.disabled = true;

    const data  = { name, description: descInput?.value.trim() || '' };
    const saved = existingPrize
      ? await updatePrize(existingPrize.id, { ...existingPrize, ...data })
      : await createPrize(data);

    _closeModal();
    onAfterSave(saved);
  });

  function _onKey(e) {
    if (e.key === 'Escape') { _closeModal(); document.removeEventListener('keydown', _onKey); }
  }
  document.addEventListener('keydown', _onKey);
}

// ── Auto-hide botones de premio ──────────────────────────────────

/**
 * @param {HTMLElement} stageEl  elemento raíz del stage
 */
export function setupPrizeVisibility(stageEl) {
  if (!stageEl) return;

  let hideTimer;

  function _showBtns() {
    stageEl.querySelectorAll('.st-prize-actions').forEach(el =>
      el.classList.add('st-prize-actions--visible')
    );
    stageEl.querySelectorAll('.st-prize-btn--add').forEach(el =>
      el.classList.add('st-prize-btn--visible')
    );
    clearTimeout(hideTimer);
    hideTimer = setTimeout(_hideBtns, 3000);
  }

  function _hideBtns() {
    stageEl.querySelectorAll('.st-prize-actions').forEach(el =>
      el.classList.remove('st-prize-actions--visible')
    );
    stageEl.querySelectorAll('.st-prize-btn--add').forEach(el =>
      el.classList.remove('st-prize-btn--visible')
    );
  }

  stageEl.addEventListener('mousemove', _showBtns);

  const section = document.getElementById('st-prize-section');
  if (section) {
    new MutationObserver(_showBtns).observe(section, { childList: true, subtree: true });
  }
}
