// Pure daily-return logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { checkDailyReturn, boostMultiplier, milestoneReward, BOOST_EXERCISES, STREAK_MILESTONES } from '../src/game/daily.js';
import { newTycoon } from '../src/game/economy.js';
import { dayKey } from '../src/engine/dailyGoal.js';

const DAY = 24 * 60 * 60 * 1000;
const ty = (over) => ({ ...newTycoon(), ...over });

test('eerste dag: streak 1, nieuwe dag, boost aan', () => {
  const r = checkDailyReturn(ty(), 1000000000000);
  assert.equal(r.streak, 1);
  assert.equal(r.isNewDay, true);
  assert.equal(r.boostLeft, BOOST_EXERCISES);
  assert.equal(r.milestone, null);
});

test('tweede bezoek dezelfde dag verandert niets (idempotent)', () => {
  const now = 1000000000000;
  const today = dayKey(now);
  const r = checkDailyReturn(ty({ streak: 4, lastDay: today, boostLeft: 2 }), now);
  assert.equal(r.isNewDay, false);
  assert.equal(r.streak, 4);
  assert.equal(r.boostLeft, 2);
});

test('gisteren gespeeld → streak groeit', () => {
  const now = 1000000000000;
  const yest = dayKey(now - DAY);
  const r = checkDailyReturn(ty({ streak: 4, lastDay: yest }), now);
  assert.equal(r.streak, 5);
  assert.equal(r.isNewDay, true);
});

test('één dag gemist → streak bevriest (geen straf)', () => {
  const now = 1000000000000;
  const twoAgo = dayKey(now - 2 * DAY);
  const r = checkDailyReturn(ty({ streak: 7, lastDay: twoAgo }), now);
  assert.equal(r.streak, 7); // behouden, niet gereset
  assert.equal(r.milestone, null); // geen nieuwe mijlpaal (niet gestegen)
});

test('twee+ dagen gemist → streak reset naar 1', () => {
  const now = 1000000000000;
  const fourAgo = dayKey(now - 4 * DAY);
  const r = checkDailyReturn(ty({ streak: 12, lastDay: fourAgo }), now);
  assert.equal(r.streak, 1);
});

test('mijlpaal vuurt alleen bij het STIJGEN naar 3/7/14/30', () => {
  const now = 1000000000000;
  const yest = dayKey(now - DAY);
  // 2 -> 3 : mijlpaal
  assert.equal(checkDailyReturn(ty({ streak: 2, lastDay: yest }), now).milestone, 3);
  // 6 -> 7 : mijlpaal
  assert.equal(checkDailyReturn(ty({ streak: 6, lastDay: yest }), now).milestone, 7);
  // 3 -> 4 : geen mijlpaal
  assert.equal(checkDailyReturn(ty({ streak: 3, lastDay: yest }), now).milestone, null);
  // bevriezing op 7 (dag gemist) mag 7 NIET opnieuw uitbetalen
  const twoAgo = dayKey(now - 2 * DAY);
  assert.equal(checkDailyReturn(ty({ streak: 7, lastDay: twoAgo }), now).milestone, null);
});

test('boost-multiplier loopt op met de streak en is begrensd', () => {
  assert.equal(boostMultiplier(1), 1.5);
  assert.equal(boostMultiplier(3), 2);
  assert.equal(boostMultiplier(7), 2.5);
  assert.equal(boostMultiplier(14), 3);
  assert.equal(boostMultiplier(999), 3); // cap
});

test('mijlpaalbeloning heeft een vloer en schaalt mee met de productie', () => {
  // beginner zonder machines: krijgt de vloer
  assert.equal(milestoneReward(3, ty()), 300);
  // gevorderde met productie: schaalt mee (cps × seconden > vloer)
  const rich = ty({ buildings: { megafab: 50 }, upgrades: ['oil', 'turbo'] });
  assert.ok(milestoneReward(30, rich) > 50000);
  // alle mijlpalen leveren iets op
  for (const m of STREAK_MILESTONES) assert.ok(milestoneReward(m, ty()) > 0);
});
