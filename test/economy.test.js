// Pure economie-tests voor Typcoon (geen UI). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  newTycoon, accuracyMultiplier, comboMultiplier, prestigeMultiplier,
  milestoneMultiplier, nextMilestone, payoutForExercise, earnFromExercise,
  BASE_PER_EXERCISE, GOLDEN_MULT, coinsPerSecond, tick, buildingCost,
  buildingUnlocked, buyBuilding, buyUpgrade, prodMultiplier, payoutMultiplier,
  BUILDINGS, MILESTONE_LEVELS, rebirthCost, canRebirth, rebirth, REBIRTH_BASE_COST,
} from '../src/game/economy.js';
import { pendingAchievements } from '../src/game/achievements.js';

// --- nauwkeurigheid: de grote hefboom ---

test('nauwkeurigheid onder de vloer betaalt niets — auto-typer verdient ~0', () => {
  assert.equal(accuracyMultiplier(0), 0);
  assert.equal(accuracyMultiplier(0.59), 0);
  assert.equal(payoutForExercise(0.3, newTycoon()), 0);
});

test('multiplier is steil boven 95% — meesterschap loont het meest', () => {
  const m90 = accuracyMultiplier(0.9);
  const m95 = accuracyMultiplier(0.95);
  const m100 = accuracyMultiplier(1.0);
  assert.ok(m90 < m95 && m95 < m100, 'monotoon stijgend');
  assert.ok(Math.abs(m95 - 1.5) < 1e-9);
  assert.ok(Math.abs(m100 - 3.0) < 1e-9);
  assert.ok(m100 - m95 > m95 - accuracyMultiplier(0.6)); // laatste 5% > hele 0.6-0.95
});

test('perfecte oefening mint 3x de basis', () => {
  assert.equal(payoutForExercise(1.0, newTycoon()), BASE_PER_EXERCISE * 3);
});

// --- combo: hoogfrequente precisie-feedback ---

test('combo geeft +10% per 10 foutloze aanslagen, tot +50%', () => {
  assert.equal(comboMultiplier(0), 1);
  assert.equal(comboMultiplier(9), 1);
  assert.ok(Math.abs(comboMultiplier(10) - 1.1) < 1e-9);
  assert.ok(Math.abs(comboMultiplier(37) - 1.3) < 1e-9);
  assert.ok(Math.abs(comboMultiplier(999) - 1.5) < 1e-9); // cap
});

test('combo telt mee in de uitbetaling', () => {
  const zonder = payoutForExercise(1.0, newTycoon());
  const met = payoutForExercise(1.0, newTycoon(), { bestStreak: 20 });
  assert.ok(Math.abs(met - Math.round(zonder * 1.2)) <= 1);
});

// --- goud: variabele beloning ---

test('gouden oefening betaalt GOLDEN_MULT keer uit', () => {
  const normaal = payoutForExercise(1.0, newTycoon());
  const goud = payoutForExercise(1.0, newTycoon(), { golden: true });
  assert.equal(goud, normaal * GOLDEN_MULT);
});

test('earnFromExercise houdt goud en beste combo bij', () => {
  const { tycoon } = earnFromExercise(newTycoon(), 1.0, { golden: true, bestStreak: 23 });
  assert.equal(tycoon.goldenDone, 1);
  assert.equal(tycoon.bestCombo, 23);
  assert.equal(tycoon.exercisesDone, 1);
  assert.ok(tycoon.coins > 0 && tycoon.coins === tycoon.totalCoins && tycoon.coins === tycoon.lifetimeCoins);
});

// --- machines + mijlpalen ---

test('machine-kosten groeien exponentieel per niveau', () => {
  const c0 = buildingCost('typewriter', 0);
  const c1 = buildingCost('typewriter', 1);
  assert.equal(c0, 15);
  assert.ok(c1 > c0);
});

test('machines zijn gegate op geleerde letters (curriculum = tech-tree)', () => {
  assert.equal(buildingUnlocked('typewriter', 0), true);
  assert.equal(buildingUnlocked('printer', 4), false);
  assert.equal(buildingUnlocked('printer', 5), true);
  const ats = BUILDINGS.map((b) => b.unlockAt);
  for (let i = 1; i < ats.length; i++) assert.ok(ats[i] > ats[i - 1]);
});

test('mijlpalen verdubbelen het machinetempo op 10/25/50', () => {
  assert.equal(milestoneMultiplier(9), 1);
  assert.equal(milestoneMultiplier(10), 2);
  assert.equal(milestoneMultiplier(25), 4);
  assert.equal(milestoneMultiplier(50), 8);
  assert.equal(nextMilestone(0), 10);
  assert.equal(nextMilestone(10), 25);
  assert.equal(nextMilestone(50), null);
});

test('buyBuilding meldt een zojuist bereikte mijlpaal', () => {
  let ty = { ...newTycoon(), coins: 1e9, buildings: { typewriter: 9 } };
  const r = buyBuilding(ty, 'typewriter');
  assert.equal(r.ok, true);
  assert.equal(r.milestone, 10);
  const r2 = buyBuilding(r.tycoon, 'typewriter');
  assert.equal(r2.milestone, null);
});

test('coins/sec telt mijlpalen en prod-upgrades mee', () => {
  let ty = { ...newTycoon(), buildings: { typewriter: 10 } }; // 10 × 1 × mijlpaal ×2 = 20/s
  assert.equal(coinsPerSecond(ty), 20);
  ty = { ...ty, coins: 1000 };
  const bought = buyUpgrade(ty, 'oil').tycoon; // prod ×1.5
  assert.equal(prodMultiplier(bought), 1.5);
  assert.equal(coinsPerSecond(bought), 30);
});

test('payout-upgrades raken de productie niet', () => {
  const ty = { ...newTycoon(), coins: 1000 };
  const bought = buyUpgrade(ty, 'precision').tycoon;
  assert.equal(payoutMultiplier(bought), 2);
  assert.equal(payoutForExercise(1.0, bought), 60);
  assert.equal(coinsPerSecond({ ...bought, buildings: { typewriter: 1 } }), 1);
});

test('tick accrueert alleen met machines; kopen kan alleen met genoeg munten', () => {
  const ty = { ...newTycoon(), buildings: { typewriter: 5 } };
  assert.equal(tick(ty, 2).coins, 10);
  assert.equal(tick(newTycoon(), 5).coins, 0); // geen machines → geen winst
  assert.equal(buyBuilding(newTycoon(), 'typewriter').ok, false);
  const dubbel = buyUpgrade(buyUpgrade({ ...newTycoon(), coins: 1000 }, 'oil').tycoon, 'oil');
  assert.equal(dubbel.ok, false); // dubbele upgrade is een no-op
});

// --- rebirth: prestige zonder leer-reset ---

test('rebirth kan pas bij de drempel en wordt elke keer 4x duurder', () => {
  assert.equal(rebirthCost(0), REBIRTH_BASE_COST);
  assert.equal(rebirthCost(2), REBIRTH_BASE_COST * 16);
  assert.equal(canRebirth(newTycoon()), false);
  assert.equal(rebirth(newTycoon()).ok, false);
});

test('rebirth reset de economie maar bewaart levensloop-tellers', () => {
  const vol = {
    ...newTycoon(),
    coins: 99999, totalCoins: REBIRTH_BASE_COST, lifetimeCoins: 123456,
    buildings: { typewriter: 12 }, upgrades: ['oil'], bestCombo: 40, goldenDone: 7,
    badges: ['eerste-munt'],
  };
  const r = rebirth(vol);
  assert.equal(r.ok, true);
  assert.equal(r.tycoon.coins, 0);
  assert.equal(r.tycoon.totalCoins, 0);
  assert.deepEqual(r.tycoon.buildings, {});
  assert.deepEqual(r.tycoon.upgrades, []);
  assert.equal(r.tycoon.rebirths, 1);
  // levensloop blijft: mijlpalen, prestaties en records raken niet kwijt
  assert.equal(r.tycoon.lifetimeCoins, 123456);
  assert.equal(r.tycoon.bestCombo, 40);
  assert.equal(r.tycoon.goldenDone, 7);
  assert.deepEqual(r.tycoon.badges, ['eerste-munt']);
});

test('sterren geven een permanente multiplier op uitbetaling én productie', () => {
  const ty = { ...newTycoon(), rebirths: 2 }; // ×1.5
  assert.ok(Math.abs(prestigeMultiplier(ty) - 1.5) < 1e-9);
  assert.equal(payoutForExercise(1.0, ty), Math.round(BASE_PER_EXERCISE * 3 * 1.5));
  assert.equal(coinsPerSecond({ ...ty, buildings: { typewriter: 2 } }), 3);
});

// --- prestaties ---

test('prestaties triggeren op de juiste drempels en maar één keer', () => {
  const ctx = { tycoon: { ...newTycoon(), lifetimeCoins: 1500, buildings: { typewriter: 1 } }, lettersLearned: 5 };
  const eerste = pendingAchievements(ctx);
  assert.ok(eerste.includes('eerste-munt'));
  assert.ok(eerste.includes('eerste-machine'));
  assert.ok(eerste.includes('duizend'));
  assert.ok(eerste.includes('vijf-letters'));
  assert.ok(!eerste.includes('tienduizend'));
  const daarna = pendingAchievements({ ...ctx, tycoon: { ...ctx.tycoon, badges: eerste } });
  assert.deepEqual(daarna, []);
});
