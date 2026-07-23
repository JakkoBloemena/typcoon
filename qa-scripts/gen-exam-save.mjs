// gen-exam-save.mjs — QA helper (assignment 049): builds a synthetic save file that
// is exam-1-ready without having to grind through real gameplay, using the actual
// engine functions (so the fixture is only as fake as "a lot of practice happened").
// Not part of the shipped product; scratch tool, not committed to src.
import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke } from '../src/engine/index.js';
import { getExam, examKeys } from '../src/engine/exams.js';
import { activeKeys, META_KEYS } from '../src/engine/curriculumCore.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

// mode: 'ready' (default) — exam-1 keys pre-mastered, offer fires immediately.
//       'fresh' — stage 5, zero practice yet; a QA script can play real exercises
//       through the browser until the engine naturally opens the offer (edge-trigger).
//       'near-ready' — 8 of the 9 exam-1 keys drilled to full confidence via the
//       REAL engine (processKeystroke), one key deliberately left a few reps short
//       (confidence just under EXAM_READY) — the generator's focus-drill logic then
//       naturally closes that gap within ONE real exercise, so a QA script can watch
//       the live examOffer moment fire without also racing the free-cap paywall.
const mode = process.argv[2] || 'ready';

const exam1 = getExam('exam-1');
const profile = newProfile({ naam: 'Timo' });
profile.curriculumIndex = exam1.stage;
profile.onboardingGezien = true;

let state = newState(profile, nlPack.curriculumTail);
if (mode === 'ready') {
  const keys = examKeys(exam1, state.curriculum);
  const keyStats = { ...state.keyStats };
  for (const k of keys) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
  state = { ...state, keyStats };
} else if (mode === 'near-ready') {
  const [weak] = examKeys(exam1, state.curriculum);
  // drill EVERY active key (not just exam-1's) so the generator's single-slot
  // focus-drill has no other under-practiced key to chase instead of `weak`.
  const strong = activeKeys(state.curriculum, profile.curriculumIndex).filter((k) => k !== weak && !META_KEYS.has(k));
  for (const k of strong) {
    for (let i = 0; i < 15; i++) state = processKeystroke(state, { expected: k, actual: k, dtMs: 200, correct: true }).state;
  }
  for (let i = 0; i < 5; i++) state = processKeystroke(state, { expected: weak, actual: weak, dtMs: 200, correct: true }).state;
}

const tycoon = {
  coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 5, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
