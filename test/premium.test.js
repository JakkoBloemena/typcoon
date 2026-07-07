// Pure premium-logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FREE_LETTER_CAP, FREE_MACHINES, PRICE,
  machineLocked, atFreeCap, isUnlocked, completePurchase,
} from '../src/game/premium.js';
import { BUILDINGS } from '../src/game/economy.js';

test('gratis machines zijn de eerste twee; de rest zit achter premium', () => {
  assert.deepEqual(FREE_MACHINES, ['typewriter', 'printer']);
  // gratis speler (unlocked=false)
  assert.equal(machineLocked('typewriter', false), false);
  assert.equal(machineLocked('printer', false), false);
  assert.equal(machineLocked('robotarm', false), true);
  assert.equal(machineLocked('assembly', false), true);
  assert.equal(machineLocked('megafab', false), true);
  // premium speler: niets op slot
  for (const b of BUILDINGS) assert.equal(machineLocked(b.id, true), false);
});

test('de gratis machines vallen binnen de leer-grens; de premium-machines erbuiten', () => {
  for (const b of BUILDINGS) {
    if (FREE_MACHINES.includes(b.id)) assert.ok(b.unlockAt < FREE_LETTER_CAP, b.id + ' hoort gratis bereikbaar');
    else assert.ok(b.unlockAt >= FREE_LETTER_CAP, b.id + ' hoort premium');
  }
});

test('atFreeCap slaat aan op de leer-grens, maar nooit voor een premium speler', () => {
  assert.equal(atFreeCap(FREE_LETTER_CAP - 1, false), false);
  assert.equal(atFreeCap(FREE_LETTER_CAP, false), true);
  assert.equal(atFreeCap(FREE_LETTER_CAP + 5, false), true);
  assert.equal(atFreeCap(FREE_LETTER_CAP, true), false); // premium: geen grens
});

test('prijzen zijn gezet en de intro ligt onder de ankerprijs', () => {
  assert.ok(PRICE.now && PRICE.anchor && PRICE.offer);
  const num = (s) => parseFloat(s.replace(',', '.'));
  assert.ok(num(PRICE.offer) < num(PRICE.now), 'aanbieding onder normale prijs');
  assert.ok(num(PRICE.now) < num(PRICE.anchor), 'normale prijs onder anker');
});

test('unlock-helpers werken zonder localStorage (server/test) zonder te crashen', () => {
  assert.equal(typeof isUnlocked(), 'boolean');
  assert.doesNotThrow(() => completePurchase());
});
