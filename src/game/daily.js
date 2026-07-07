// daily.js — Dagelijkse terugkeer-haak (PUUR). Reden om morgen terug te komen die in
// de kern-loop grijpt in plaats van een losse popup.
//
// Ontwerpkeuze (zie REVENUE.md): "typen is de enige muntfaucet" — dus de dagbonus is
// GEEN gratis munten, maar een OPWARM-BOOST: je eerste paar opdrachten van de dag
// leveren een streak-geschaalde ×multiplier op. Zo beloont de terugkeer méér typen,
// niet minder, en schaalt hij vanzelf mee met elke fase. Daarbovenop streak-mijlpalen
// (3/7/14/30 dagen) met een gevierde muntbonus + vlam-badge.
//
// Vriendelijk (zoals de rest van het product): één gemiste dag BEVRIEST de streak
// (geen straf), pas na 2+ gemiste dagen begint hij opnieuw.

import { coinsPerSecond } from './economy.js';
import { dayKey, dayGap } from '../engine/dailyGoal.js';

export const BOOST_EXERCISES = 5; // aantal opdrachten dat de opwarm-boost duurt
export const STREAK_MILESTONES = [3, 7, 14, 30];

// Streak -> boost-multiplier voor de eerste opdrachten van de dag.
export function boostMultiplier(streak) {
  if (streak >= 14) return 3;
  if (streak >= 7) return 2.5;
  if (streak >= 3) return 2;
  return 1.5;
}

// Dag-overgang bepalen bij het openen van een sessie. Verandert niets bij een tweede
// bezoek op dezelfde dag (idempotent).
// Geeft terug: { streak, isNewDay, milestone, boostLeft, lastDay }.
export function checkDailyReturn(tycoon, now = Date.now()) {
  const today = dayKey(now);
  const last = tycoon.lastDay || null;
  const prev = tycoon.streak || 0;

  if (last === today) {
    return { streak: prev, isNewDay: false, milestone: null, boostLeft: tycoon.boostLeft || 0, lastDay: today };
  }

  let streak;
  if (!last) streak = 1; // allereerste dag
  else {
    const gap = dayGap(last, today);
    if (gap <= 1) streak = prev + 1; // gisteren gespeeld → groeit
    else if (gap === 2) streak = Math.max(1, prev); // één dag gemist → bevriezen
    else streak = 1; // 2+ dagen gemist → opnieuw
  }

  const increased = streak > prev;
  const milestone = increased && STREAK_MILESTONES.includes(streak) ? streak : null;
  return { streak, isNewDay: true, milestone, boostLeft: BOOST_EXERCISES, lastDay: today };
}

// Muntbonus voor een streak-mijlpaal. Vloer voor beginners, meeschalend met de
// productie voor gevorderden — meaningful in elke fase, nooit balans-brekend.
const MILESTONE_FLAT = { 3: 300, 7: 1500, 14: 8000, 30: 50000 };
const MILESTONE_SECONDS = { 3: 30, 7: 90, 14: 240, 30: 600 };

export function milestoneReward(streak, tycoon) {
  const flat = MILESTONE_FLAT[streak] || 0;
  const scaled = Math.round(coinsPerSecond(tycoon) * (MILESTONE_SECONDS[streak] || 0));
  return Math.max(flat, scaled);
}
