// Pure weekbord-logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { weekKey, newWeekly, checkWeek, vsLastWeek } from '../src/game/weekly.js';
import { newTycoon } from '../src/game/economy.js';

// Een vaste woensdag: 2026-01-07. De maandag van die week is 2026-01-05.
const WED = new Date(2026, 0, 7, 12, 0, 0).getTime();
const DAY = 24 * 60 * 60 * 1000;

test('weekKey = de maandag van de week; stabiel binnen de week', () => {
  assert.equal(weekKey(WED), '2026-01-05'); // woensdag 7 jan
  assert.equal(weekKey(WED + DAY), '2026-01-05'); // donderdag, zelfde week
  assert.equal(weekKey(WED + 4 * DAY), '2026-01-05'); // zondag 11 jan, nog steeds zelfde week
  assert.equal(weekKey(WED + 5 * DAY), '2026-01-12'); // maandag 12 jan → nieuwe week
});

test('checkWeek initialiseert bij lege weekstate', () => {
  const r = checkWeek(newTycoon(), WED);
  assert.equal(r.rolledOver, false);
  assert.equal(r.weekly.key, '2026-01-05');
  assert.equal(r.weekly.coins, 0);
});

test('checkWeek in dezelfde week verandert niets', () => {
  const ty = { ...newTycoon(), weekly: { key: '2026-01-05', coins: 500, exercises: 10, combo: 20 } };
  const r = checkWeek(ty, WED + DAY);
  assert.equal(r.rolledOver, false);
  assert.equal(r.weekly.coins, 500);
});

test('nieuwe week → huidige wordt vorige week, record bijgewerkt, vers begonnen', () => {
  const ty = {
    ...newTycoon(),
    weekly: { key: '2026-01-05', coins: 1200, exercises: 30, combo: 40 },
    records: { bestWeekCoins: 800, longestStreak: 3 },
  };
  const r = checkWeek(ty, WED + 5 * DAY); // maandag erna
  assert.equal(r.rolledOver, true);
  assert.equal(r.weekly.key, '2026-01-12');
  assert.equal(r.weekly.coins, 0); // vers
  assert.equal(r.lastWeekly.coins, 1200); // vorige week bewaard
  assert.equal(r.records.bestWeekCoins, 1200); // record verbeterd (1200 > 800)
});

test('vsLastWeek geeft het verschil t.o.v. vorige week (of null)', () => {
  assert.equal(vsLastWeek({ coins: 300 }, null), null);
  assert.equal(vsLastWeek({ coins: 500 }, { coins: 300 }), 200); // vóór
  assert.equal(vsLastWeek({ coins: 100 }, { coins: 300 }), -200); // achter
});
