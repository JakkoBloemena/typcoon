// store.js — Lokale opslag van Typcoon. Eén speelbestand per apparaat, privacy-
// vriendelijk: alles blijft in de browser, geen account, geen server.

const STATE_KEY = 'typcoon:save';

export function loadGame() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Bewaar de speelstate. `curriculum` is afleidbaar uit het oefenpakket en wordt niet
// bewaard (kleiner + herbouwd bij het laden) — zelfde afspraak als de engine-opslag.
export function saveGame(state) {
  if (!state) return;
  const { curriculum, ...persisted } = state;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(persisted));
  } catch {
    // opslag vol/geblokkeerd: spel blijft gewoon doorspelen in het geheugen
  }
}

export function clearGame() {
  localStorage.removeItem(STATE_KEY);
}
