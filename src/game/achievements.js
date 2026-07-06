// achievements.js — Prestaties: informatieve mijlpalen die meesterschap en
// voortgang vieren (verzameldrang + goal-gradient), nooit straffen of vergelijken.
// `check(ctx)` is puur over { tycoon, lettersLearned }.

export const ACHIEVEMENTS = [
  { id: 'eerste-munt', icon: '🪙', check: (c) => c.tycoon.lifetimeCoins >= 1 },
  { id: 'eerste-machine', icon: '⌨️', check: (c) => Object.keys(c.tycoon.buildings).length >= 1 },
  { id: 'duizend', icon: '💰', check: (c) => c.tycoon.lifetimeCoins >= 1000 },
  { id: 'tienduizend', icon: '🏦', check: (c) => c.tycoon.lifetimeCoins >= 10000 },
  { id: 'honderdduizend', icon: '👑', check: (c) => c.tycoon.lifetimeCoins >= 100000 },
  { id: 'combo-25', icon: '⚡', check: (c) => c.tycoon.bestCombo >= 25 },
  { id: 'combo-50', icon: '🌩️', check: (c) => c.tycoon.bestCombo >= 50 },
  { id: 'eerste-goud', icon: '✨', check: (c) => c.tycoon.goldenDone >= 1 },
  { id: 'goud-10', icon: '🌟', check: (c) => c.tycoon.goldenDone >= 10 },
  { id: 'vijf-letters', icon: '🔤', check: (c) => c.lettersLearned >= 5 },
  { id: 'tien-letters', icon: '📖', check: (c) => c.lettersLearned >= 10 },
  { id: 'alle-letters', icon: '🏆', check: (c) => c.lettersLearned >= 26 },
  { id: 'eerste-rebirth', icon: '⭐', check: (c) => c.tycoon.rebirths >= 1 },
  { id: 'drie-rebirths', icon: '💫', check: (c) => c.tycoon.rebirths >= 3 },
  { id: 'honderd-oefeningen', icon: '🎯', check: (c) => c.tycoon.exercisesDone >= 100 },
];

// Nog niet behaalde prestaties waarvan de voorwaarde nu waar is.
export function pendingAchievements(ctx) {
  const have = new Set(ctx.tycoon.badges || []);
  return ACHIEVEMENTS.filter((a) => !have.has(a.id) && a.check(ctx)).map((a) => a.id);
}

export function achievementDef(id) {
  return ACHIEVEMENTS.find((a) => a.id === id) || null;
}
