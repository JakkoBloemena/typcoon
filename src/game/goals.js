// goals.js — de pure, deterministische doel-selectie-helper (assignment 071).
//
// nextGoal(tycoon, lettersLearned) kiest het ÉNE meest-motiverende volgende doel via
// een vaste ladder (research/milestone-factory.md §3, design/DESIGN-FACTORY.md §6):
//   1. de goedkoopste ontgrendelde-maar-niet-gebouwde machine, anders
//   2. de goedkoopste EIGEN machine wiens volgende level een mijlpaal is, anders
//   3. de goedkoopste niet-gekochte upgrade, anders
//   4. voortgang naar de volgende ster (rebirth/prestige).
// Puur en deterministisch: alleen `tycoon` + `lettersLearned` in, één GoalDescriptor
// uit — geen localStorage/premium.isUnlocked-aanroep, geen bewaard "huidig doel" om uit
// sync te raken. Beide surfaces (de goal-sliver op de typweergave en het spotlit
// doel-paneel + de NU-BOUWEN-station op de fabriekspagina) tekenen precies deze velden;
// dit bestand tekent zelf niets en kent geen route/CSS.
//
// Geen timer/countdown-veld (charter guardrail 3: geen druk-mechanieken) — `effort` is
// een vriendelijke inschatting, nooit een aftellende klok.

import {
  BUILDINGS, UPGRADES, MILESTONE_LEVELS, REBIRTH_BONUS,
  buildingCost, buildingUnlocked, nextMilestone,
  payoutForExercise, rebirthCost,
} from './economy.js';
import { FREE_MACHINES } from './premium.js';
import { gt } from './strings.js';

// Grove, stabiele schatting van munten-per-oefening — alleen om `remaining` om te
// rekenen naar "± N opdrachten" (nooit een timer). 0.9 nauwkeurigheid = een
// zorgvuldig maar niet perfect getypte oefening; bewust ZONDER goud/combo/dag-boost,
// want dat zijn incidentele bonussen, geen stabiele basis om op te plannen.
const ESTIMATE_ACCURACY = 0.9;

function estimatePerExercise(tycoon) {
  // payoutForExercise is altijd > 0 boven de nauwkeurigheids-vloer (0.6); Math.max
  // is puur een defensieve bodem tegen delen door 0, nooit in de praktijk geraakt.
  return Math.max(1, payoutForExercise(ESTIMATE_ACCURACY, tycoon));
}

function effortLabel(remaining, tycoon) {
  const n = Math.ceil(remaining / estimatePerExercise(tycoon));
  return `± ${n} opdrachten`;
}

// Bouwt de gemeenschappelijke voortgangsvelden (have/fraction/remaining/effort) — elke
// ladder-rung levert alleen kind/id/icon/name/reward/cost, de rest is hier één keer.
function descriptor({ kind, id, icon, name, reward, cost, tycoon, locked = false }) {
  const have = tycoon.coins;
  const fraction = cost > 0 ? Math.min(1, Math.max(0, have / cost)) : 1;
  const remaining = Math.max(0, cost - have);
  return {
    kind, id, icon, name, reward, cost, have, fraction, remaining,
    effort: effortLabel(remaining, tycoon),
    locked,
  };
}

export function nextGoal(tycoon, lettersLearned) {
  // 1) de goedkoopste ontgrendelde-maar-niet-gebouwde machine.
  const toBuild = BUILDINGS
    .filter((b) => buildingUnlocked(b.id, lettersLearned) && !(tycoon.buildings[b.id] > 0))
    .sort((a, b) => buildingCost(a.id, 0) - buildingCost(b.id, 0))[0];
  if (toBuild) {
    return descriptor({
      kind: 'build',
      id: toBuild.id,
      icon: toBuild.icon,
      name: gt('building.' + toBuild.id),
      reward: `+${toBuild.rate}/s`,
      cost: buildingCost(toBuild.id, 0),
      tycoon,
      // premium-machines (buiten FREE_MACHINES) zijn ook mét genoeg letters niet vrij
      // koopbaar zonder de ouder-gate — nooit een kale koopknop (guardrail 3).
      locked: !FREE_MACHINES.includes(toBuild.id),
    });
  }

  // 2) de goedkoopste EIGEN machine wiens volgende level een mijlpaal is.
  const toLevelUp = BUILDINGS
    .map((b) => ({ b, level: tycoon.buildings[b.id] || 0 }))
    .filter(({ level }) => level > 0 && MILESTONE_LEVELS.includes(level + 1))
    .map(({ b, level }) => ({ b, level, cost: buildingCost(b.id, level) }))
    .sort((a, c) => a.cost - c.cost)[0];
  if (toLevelUp) {
    const next = nextMilestone(toLevelUp.level);
    return descriptor({
      kind: 'levelup',
      id: toLevelUp.b.id,
      icon: toLevelUp.b.icon,
      name: gt('building.' + toLevelUp.b.id),
      reward: gt('play.nextMilestone', { n: next }),
      cost: toLevelUp.cost,
      tycoon,
    });
  }

  // 3) de goedkoopste niet-gekochte upgrade.
  const owned = tycoon.upgrades || [];
  const toBuy = UPGRADES
    .filter((u) => !owned.includes(u.id))
    .sort((a, b) => a.cost - b.cost)[0];
  if (toBuy) {
    return descriptor({
      kind: 'upgrade',
      id: toBuy.id,
      icon: toBuy.icon,
      name: gt('upgrade.' + toBuy.id),
      reward: toBuy.kind === 'prod'
        ? gt('upgrade.prod', { x: toBuy.mult })
        : gt('upgrade.payout', { x: toBuy.mult }),
      cost: toBuy.cost,
      tycoon,
    });
  }

  // 4) niets goedkopers over: voortgang naar de volgende ster.
  return descriptor({
    kind: 'prestige',
    id: null,
    icon: '🌟',
    name: gt('rebirth.button'),
    reward: `+${REBIRTH_BONUS * 100}%`,
    cost: rebirthCost(tycoon.rebirths || 0),
    tycoon,
  });
}
