// theme.js — Cosmetic theme registry + swap mechanism (assignment 051).
//
// A theme is a NAMED SET of the existing design tokens (the CSS custom properties
// in game.css's :root) — nothing else. Switching themes changes ZERO economy values
// (see decisions/009, charter guardrail 2): economy.js never imports this file and
// this file never touches state.tycoon/state.rewards. The swap mechanism is a
// `data-theme` attribute on <html>; game.css carries the actual token values per
// theme — concrete alternate themes are assignment 052, this only wires the swap.
//
// The choice lives in its OWN localStorage key, exactly like premium.js's unlock
// flag — never in the save file (store.js) and never in state.rewards (rewards.js's
// star-shop is explicitly the wrong model for typcoon; see decisions/009).

const KEY = 'typcoon:theme';

export const DEFAULT_THEME = 'muntpers';

// `free: true` -> selectable by anyone. Everything else gates behind premium.js's
// isUnlocked(). De standaard (Muntpers) is gratis en compleet; de drie alternatieven
// (assignment 052) zitten achter de familie-unlock. Elk alternatief is een andere
// PLEK — de tokenwaarden staan in game.css als `[data-theme='<id>']`, de labels in
// strings.js (nl+en). Volgorde hier = volgorde in de thema-kiezer.
export const THEMES = [
  { id: 'muntpers', free: true },
  { id: 'nachtploeg', free: false },
  { id: 'snoepfabriek', free: false },
  { id: 'diepzee', free: false },
];

export function themeDef(id) {
  return THEMES.find((t) => t.id === id) || null;
}

// Mag deze speler dit thema kiezen? (gratis thema's altijd; de rest alleen ontgrendeld)
export function themeAvailable(id, unlocked) {
  const t = themeDef(id);
  return !!t && (t.free || unlocked);
}

export function loadTheme() {
  try {
    const id = localStorage.getItem(KEY);
    return themeDef(id) ? id : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(id) {
  try { localStorage.setItem(KEY, id); } catch { /* opslag geblokkeerd: sessie-only */ }
}

// Zet het data-theme-attribuut op <html> — de enige plek waar game.css het thema
// leest. Het standaard-thema krijgt bewust GEEN attribuut (:root in game.css al
// dat thema is); alleen alternatieven krijgen een expliciet attribuut.
export function applyTheme(id) {
  if (typeof document === 'undefined') return;
  if (id === DEFAULT_THEME) document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', id);
}
