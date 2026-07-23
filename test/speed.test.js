// speed.test.js — Directe engine-tests voor src/engine/speed.js (assignment 054).
// Voorheen ongetest; deze module leverde tot nu toe geen levende schrijver voor
// state.speedAvg op, dus dit bestand pint zowel de bestaande kpm/record-conventies
// (regressiebescherming) als de nieuwe `updateSpeedAvg`-EMA die GameScreen.jsx nu
// gebruikt om state.speedAvg daadwerkelijk bij te houden. Draait met: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sessionKpm, updateSpeedAvg, bestKpm, speedRevealed, isNewRecord } from '../src/engine/speed.js';
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';

// Verse engine-state t/m `stage` (zelfde fixture-vorm als test/exams.test.js).
function stateAtStage(stage) {
  const profile = newProfile({ naam: 'Snelheid' });
  profile.curriculumIndex = stage;
  return newState(profile, nlPack.curriculumTail);
}

// --- sessionKpm ---------------------------------------------------------------

test('sessionKpm: correcte aanslagen per minuut, afgerond', () => {
  assert.equal(sessionKpm(50, 30000), 100, '50 aanslagen in 30s = 100/min');
  assert.equal(sessionKpm(1, 60000), 1);
});

test('sessionKpm: 0 bij niet-positieve duur (geen delen-door-nul)', () => {
  assert.equal(sessionKpm(10, 0), 0);
  assert.equal(sessionKpm(10, -5), 0);
});

// --- updateSpeedAvg -------------------------------------------------------------

test('updateSpeedAvg: eerste meting (geen geschiedenis) = de kpm zelf', () => {
  assert.equal(updateSpeedAvg(0, 80), 80);
});

test('updateSpeedAvg: EMA-conventie 0.7*prev + 0.3*kpm (zelfde als rewards.js)', () => {
  assert.equal(updateSpeedAvg(100, 50), Math.round(0.7 * 100 + 0.3 * 50));
  assert.equal(updateSpeedAvg(100, 50), 85);
});

test('updateSpeedAvg: herhaalde, gestaag hogere kpm laat het gemiddelde meebewegen omhoog', () => {
  let avg = 0;
  for (let i = 0; i < 20; i++) avg = updateSpeedAvg(avg, 120);
  assert.ok(avg > 100, `verwacht ruim boven de 100 na 20 sterke oefeningen, kreeg ${avg}`);
  assert.ok(avg <= 120, 'de EMA overschrijdt de gemeten kpm zelf niet');
});

// --- bestKpm / speedRevealed / isNewRecord (regressiebescherming) --------------

test('bestKpm: hoogste kpm uit de sessielijst, 0 zonder sessies', () => {
  assert.equal(bestKpm([]), 0);
  assert.equal(bestKpm([{ kpm: 40 }, { kpm: 90 }, { kpm: 60 }]), 90);
});

test('speedRevealed: verborgen zolang er te weinig letters geleerd zijn, ook mét data', () => {
  const state = { ...stateAtStage(6), sessions: [{ kpm: 80 }] }; // 11 letters < SPEED_REVEAL_LETTERS
  assert.equal(speedRevealed(state), false);
});

test('speedRevealed: pas zichtbaar met genoeg letters ÉN kpm-data', () => {
  const base = stateAtStage(7); // 13 letters = SPEED_REVEAL_LETTERS
  assert.equal(speedRevealed({ ...base, sessions: [] }), false, 'genoeg letters maar geen kpm-data → nog verborgen');
  assert.equal(speedRevealed({ ...base, sessions: [{ kpm: 80 }] }), true);
});

test('isNewRecord: eerste sessie is een record zodra kpm > 0', () => {
  assert.equal(isNewRecord([{ kpm: 50 }]), true);
  assert.equal(isNewRecord([{ kpm: 0 }]), false);
});

test('isNewRecord: alleen waar als de laatste sessie het vorige best verslaat', () => {
  assert.equal(isNewRecord([{ kpm: 60 }, { kpm: 80 }]), true);
  assert.equal(isNewRecord([{ kpm: 80 }, { kpm: 60 }]), false);
  assert.equal(isNewRecord([{ kpm: 80 }, { kpm: 80 }]), false, 'gelijk aan het record is geen NIEUW record');
});
