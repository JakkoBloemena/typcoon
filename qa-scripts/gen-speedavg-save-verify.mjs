// gen-speedavg-save-verify.mjs — independent tester copy of gen-speedavg-save.mjs
// (assignment 054 verification pass). Same approach as the developer's scratch
// script, kept as its own -verify file per protocol (never trust/reuse the
// developer's exact script unmodified — this is a faithful re-derivation run
// against the tester's own worktree/port). Not part of the shipped product.
import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke } from '../src/engine/index.js';
import { EXAMS, getExam, examKeys } from '../src/engine/exams.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

const examFinal = getExam('exam-final');
const profile = newProfile({ naam: 'Timo' });
profile.curriculumIndex = examFinal.stage;
profile.onboardingGezien = true;

let state = newState(profile, nlPack.curriculumTail);
for (const k of examKeys(examFinal, state.curriculum)) {
  for (let i = 0; i < 15; i++) state = processKeystroke(state, { expected: k, actual: k, dtMs: 200, correct: true }).state;
}
state = {
  ...state,
  speedAvg: Math.round(examFinal.minKpm * 0.9) - 6, // just under the 90% gate
  exams: { passed: EXAMS.filter((e) => e.id !== 'exam-final').map((e) => e.id), attempts: {} },
};

const tycoon = {
  coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 20, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
