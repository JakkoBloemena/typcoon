// Pure tests voor de doel-selectie-helper (assignment 071, geen UI). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { nextGoal } from '../src/game/goals.js';
import {
  newTycoon, buildingCost, rebirthCost, REBIRTH_BASE_COST,
} from '../src/game/economy.js';
import { gt } from '../src/game/strings.js';

// --- ladder (a)-(d): research/milestone-factory.md §3e ---

test('(a) verse speler (0 letters, geen machines) -> bouw de typemachine (unlockAt 0)', () => {
  const g = nextGoal(newTycoon(), 0);
  assert.equal(g.kind, 'build');
  assert.equal(g.id, 'typewriter');
  assert.equal(g.cost, buildingCost('typewriter', 0));
  assert.equal(g.have, 0);
  assert.equal(g.fraction, 0);
  assert.equal(g.remaining, g.cost);
  assert.equal(g.locked, false, 'typewriter is een gratis machine');
});

test('(b) genoeg letters voor een niet-gebouwde machine -> bouw díe machine (goedkoopste eerst)', () => {
  const tycoon = { ...newTycoon(), coins: 50, buildings: { typewriter: 3 } };
  const g = nextGoal(tycoon, 5); // ontgrendelt typewriter (gebouwd) + printer (niet)
  assert.equal(g.kind, 'build');
  assert.equal(g.id, 'printer');
  assert.equal(g.cost, buildingCost('printer', 0));
  assert.equal(g.have, 50);
  assert.equal(g.remaining, g.cost - 50);
  assert.ok(Math.abs(g.fraction - 50 / g.cost) < 1e-9);
  assert.equal(g.locked, false, 'printer is ook een gratis machine');
});

test('(c) alles beschikbare al gebouwd, één level onder een mijlpaal -> die level-up', () => {
  // letters=5 ontgrendelt alleen typewriter+printer; beide zijn al gebouwd, dus rung 1
  // levert niets op. typewriter (level 9 -> 10) is een mijlpaal, printer (2 -> 3) niet.
  const tycoon = { ...newTycoon(), buildings: { typewriter: 9, printer: 2 } };
  const g = nextGoal(tycoon, 5);
  assert.equal(g.kind, 'levelup');
  assert.equal(g.id, 'typewriter');
  assert.equal(g.cost, buildingCost('typewriter', 9));
  assert.equal(g.reward, gt('play.nextMilestone', { n: 10 }));
});

test('(d) machines gemaximeerd, alle upgrades gekocht -> voortgang naar de volgende ster', () => {
  const tycoon = {
    ...newTycoon(),
    buildings: { typewriter: 60, printer: 60, robotarm: 60, assembly: 60, megafab: 60 },
    upgrades: ['oil', 'precision', 'turbo', 'golden'],
  };
  const g = nextGoal(tycoon, 26); // alle vijf machines ontgrendeld (megafab.unlockAt = 26)
  assert.equal(g.kind, 'prestige');
  assert.equal(g.id, null);
  assert.equal(g.cost, rebirthCost(0));
  assert.equal(g.cost, REBIRTH_BASE_COST);
  assert.equal(g.reward, '+25%');
});

// --- rung 3 expliciet: upgrades, wanneer geen bouw/level-up meer kan ---

test('rung 3: geen bouwbare of level-uppable machine meer -> de goedkoopste niet-gekochte upgrade', () => {
  // letters=0 ontgrendelt alleen typewriter, die al gebouwd is (level 15, geen mijlpaal
  // op level 16) — noch rung 1 noch rung 2 levert iets op.
  const tycoon = { ...newTycoon(), buildings: { typewriter: 15 } };
  const g = nextGoal(tycoon, 0);
  assert.equal(g.kind, 'upgrade');
  assert.equal(g.id, 'oil'); // goedkoopste upgrade (250)
  assert.equal(g.cost, 250);
  assert.equal(g.reward, gt('upgrade.prod', { x: 1.5 }));
});

// --- premium/locked machines routeren naar de ouder-gate, nooit een kale koopknop ---

test('een premium machine (buiten FREE_MACHINES) wordt geflagd als locked, ook als de letters al voldoende zijn', () => {
  const tycoon = { ...newTycoon(), buildings: { typewriter: 1, printer: 1 } };
  const g = nextGoal(tycoon, 10); // robotarm.unlockAt === 10, curriculum-technisch ontgrendeld
  assert.equal(g.kind, 'build');
  assert.equal(g.id, 'robotarm');
  assert.equal(g.locked, true, 'robotarm zit achter de familie-unlock, niet in FREE_MACHINES');
});

test('een gratis machine (in FREE_MACHINES) is nooit locked', () => {
  const tycoon = { ...newTycoon(), buildings: { typewriter: 1 } };
  const g = nextGoal(tycoon, 5); // printer, unlockAt 5, nog niet gebouwd
  assert.equal(g.id, 'printer');
  assert.equal(g.locked, false);
});

// --- descriptor-contract: velden, geen druk-mechanieken ---

test('descriptor draagt precies de AC-velden en NOOIT een timer/countdown', () => {
  const g = nextGoal({ ...newTycoon(), coins: 6 }, 0);
  assert.deepEqual(
    Object.keys(g).sort(),
    ['cost', 'effort', 'fraction', 'have', 'icon', 'id', 'kind', 'locked', 'name', 'remaining', 'reward'].sort(),
  );
  assert.match(g.effort, /^± \d+ opdrachten$/, 'vriendelijke schatting, geen aftellende klok');
});

test('fraction is geklemd tussen 0 en 1, ook als er (hypothetisch) meer munten zijn dan de kost', () => {
  const rijk = { ...newTycoon(), coins: 999999, buildings: { typewriter: 3 } };
  const g = nextGoal(rijk, 5); // printer bouwen, ruim voldoende munten
  assert.equal(g.fraction, 1);
  assert.equal(g.remaining, 0);
});

test('nextGoal is puur: zelfde input -> exact dezelfde descriptor, geen bewaarde state', () => {
  const tycoon = { ...newTycoon(), coins: 40, buildings: { typewriter: 2 } };
  const g1 = nextGoal(tycoon, 5);
  const g2 = nextGoal(tycoon, 5);
  assert.deepEqual(g1, g2);
});
