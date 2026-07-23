// shareCard.test.js — buildShareData(): PII-gate (naam alleen op expliciete ouder-
// toestemming) + fabriekstaat-afleiding voor de "Deel je fabriek"-kaart (assignment
// 024, REVENUE.md §5 virality-item). De canvas-tekening zelf (drawShareCard) heeft
// een <canvas>/DOM nodig en wordt niet hier getest — deze module isoleert bewust de
// pure data-afleiding zodat de PII-regel zonder DOM te verifiëren is.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildShareData } from '../src/game/shareCard.js';
import { newTycoon } from '../src/game/economy.js';

test('buildShareData: geen naam zonder expliciete ouder-toestemming (includeNaam=false)', () => {
  const t = { ...newTycoon(), coins: 1234, streak: 5 };
  const data = buildShareData(t, { naam: 'Sanne' }, false);
  assert.equal(data.naam, null);
});

test('buildShareData: naam verschijnt alleen als includeNaam=true', () => {
  const data = buildShareData(newTycoon(), { naam: 'Sanne' }, true);
  assert.equal(data.naam, 'Sanne');
});

test('buildShareData: alleen gekochte machines (level > 0) komen op de kaart', () => {
  const t = { ...newTycoon(), buildings: { typewriter: 3, printer: 0, robotarm: 7 } };
  const data = buildShareData(t, {}, false);
  const ids = data.machines.map((m) => m.id).sort();
  assert.deepEqual(ids, ['robotarm', 'typewriter']);
  assert.equal(data.machines.find((m) => m.id === 'typewriter').level, 3);
});

test('buildShareData: munten, cps en streak komen uit de tycoon-state', () => {
  const t = { ...newTycoon(), coins: 42.9, streak: 7, buildings: { typewriter: 2 } };
  const data = buildShareData(t, {}, false);
  assert.equal(data.coins, 42); // Math.floor: geen decimalen op de kaart
  assert.equal(data.streak, 7);
  assert.equal(data.cps > 0, true);
});

test('buildShareData: zonder profiel (geen naam beschikbaar) crasht niet', () => {
  const data = buildShareData(newTycoon(), null, true);
  assert.equal(data.naam, null);
});

test('buildShareData: lege fabriek geeft lege machinelijst, geen crash', () => {
  const data = buildShareData(newTycoon(), { naam: 'Sanne' }, false);
  assert.deepEqual(data.machines, []);
  assert.equal(data.coins, 0);
});
