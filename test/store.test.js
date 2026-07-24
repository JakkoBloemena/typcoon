// Save-schema invariant test (assignment 071) — the milestone-wide save-compat
// tripwire (research/milestone-factory.md §2): saveGame -> loadGame on a
// representative pre-milestone save must not lose or reshape a single `tycoon`
// field. This must stay green through 072-075 (presentation-only assignments) —
// if any of them touches the persisted shape, this test fails loudly instead of
// silently eating a kid's factory. Draait met: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newTycoon } from '../src/game/economy.js';
import { newState } from '../src/engine/index.js';
import { newProfile } from '../src/engine/profile.js';
import nlPack from '../src/data/nl/index.js';

// Node's `node --test` has no browser globals — store.js is written against the
// real `localStorage` API, so this file provides a minimal in-memory stand-in
// (scoped to this test file only; store.js itself is untouched).
class MemoryStorage {
  constructor() { this.map = new Map(); }
  getItem(key) { return this.map.has(key) ? this.map.get(key) : null; }
  setItem(key, value) { this.map.set(key, String(value)); }
  removeItem(key) { this.map.delete(key); }
}
globalThis.localStorage = new MemoryStorage();

const { saveGame, loadGame, clearGame } = await import('../src/game/store.js');

// Bouwt een representatieve, echte speel-state (profiel + engine + tycoon) zoals
// App.jsx die aan saveGame doorgeeft — geen los tycoon-object.
function representativeState(tycoonOverrides) {
  const profile = newProfile({ naam: 'K' });
  return { ...newState(profile, nlPack.curriculumTail), tycoon: { ...newTycoon(), ...tycoonOverrides } };
}

test('verse speler: saveGame -> loadGame bewaart elk tycoon-veld exact', () => {
  const state = representativeState({});
  clearGame();
  saveGame(state);
  assert.deepEqual(loadGame().tycoon, state.tycoon);
});

test('mid-game save: munten, machine-levels, upgrades en een ster overleven de round-trip', () => {
  const state = representativeState({
    coins: 4820, totalCoins: 18400, lifetimeCoins: 42000,
    buildings: { typewriter: 12, printer: 3 },
    upgrades: ['oil', 'precision'],
    rebirths: 1,
    exercisesDone: 340, goldenDone: 9, bestCombo: 44,
  });
  clearGame();
  saveGame(state);
  const loaded = loadGame();
  assert.deepEqual(loaded.tycoon, state.tycoon);
  // met naam, per de AC: coins, per-building levels, owned upgrades, sterren, lifetime
  assert.equal(loaded.tycoon.coins, 4820);
  assert.deepEqual(loaded.tycoon.buildings, { typewriter: 12, printer: 3 });
  assert.deepEqual(loaded.tycoon.upgrades, ['oil', 'precision']);
  assert.equal(loaded.tycoon.rebirths, 1);
  assert.equal(loaded.tycoon.lifetimeCoins, 42000);
});

test('bijna-mijlpaal save: alle vijf machines, meerdere sterren, badges en certificaten overleven de round-trip', () => {
  const state = representativeState({
    coins: 998, totalCoins: 250000, lifetimeCoins: 987654,
    buildings: { typewriter: 60, printer: 55, robotarm: 30, assembly: 9, megafab: 1 },
    upgrades: ['oil', 'precision', 'turbo', 'golden'],
    rebirths: 3,
    badges: ['eerste-munt', 'eerste-machine', 'duizend'],
    certificates: { 'exam-1': { accuracy: 0.97, kpm: 0, date: '2026-07-01' } },
  });
  clearGame();
  saveGame(state);
  assert.deepEqual(loadGame().tycoon, state.tycoon);
});

test('de afgeleide curriculum wordt niet bewaard, maar tycoon blijft daardoor onaangeraakt', () => {
  const state = representativeState({ coins: 77, buildings: { typewriter: 1 } });
  clearGame();
  saveGame(state);
  const loaded = loadGame();
  assert.ok(!('curriculum' in loaded), 'curriculum is afgeleid (zie store.js) en wordt niet bewaard');
  assert.deepEqual(loaded.tycoon, state.tycoon);
});
