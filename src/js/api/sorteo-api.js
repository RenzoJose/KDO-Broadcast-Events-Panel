/* ══════════════════════════════════════════════════════════════════
   sorteo-api.js — Capa de acceso a datos del sorteo
   Responsabilidad: única fuente de llamadas HTTP para sorteo y premios.
   ══════════════════════════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3001';

export const ENDPOINTS = {
  athletes: { data: 'athletes', winners: 'athleteWinners' },
  schools:  { data: 'schools',  winners: 'schoolWinners'  },
};

// ── Participantes & ganadores ────────────────────────────────────

export async function fetchData(mode) {
  const r = await fetch(`${API_BASE}/${ENDPOINTS[mode].data}`);
  if (!r.ok) throw new Error('json-server offline — ejecuta: npm run mock');
  return r.json();
}

export async function fetchWinners(mode) {
  try {
    const r = await fetch(`${API_BASE}/${ENDPOINTS[mode].winners}`);
    return r.ok ? r.json() : [];
  } catch { return []; }
}

export async function postWinner(participant, mode, prize) {
  await fetch(`${API_BASE}/${ENDPOINTS[mode].winners}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      participantId: participant.id,
      name:          participant.name,
      subtitle:      participant.subtitle,
      logo:          participant.logo,
      type:          mode,
      wonAt:         new Date().toISOString(),
      prize: prize
        ? { name: prize.name, description: prize.description || '' }
        : null,
    }),
  });
}

export async function clearWinners(mode) {
  const list = await fetchWinners(mode);
  await Promise.all(
    list.map(w => fetch(`${API_BASE}/${ENDPOINTS[mode].winners}/${w.id}`, { method: 'DELETE' }))
  );
}

// ── Premios ──────────────────────────────────────────────────────

export async function fetchPrize() {
  try {
    const r = await fetch(`${API_BASE}/prizes`);
    if (!r.ok) return null;
    const list = await r.json();
    return list.length ? list[list.length - 1] : null;
  } catch { return null; }
}

export async function createPrize(data) {
  const r = await fetch(`${API_BASE}/prizes`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
  });
  return r.ok ? r.json() : null;
}

export async function updatePrize(id, data) {
  const r = await fetch(`${API_BASE}/prizes/${id}`, {
    method:  'PUT',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
  });
  return r.ok ? r.json() : null;
}

export async function deletePrize(id) {
  await fetch(`${API_BASE}/prizes/${id}`, { method: 'DELETE' });
}
