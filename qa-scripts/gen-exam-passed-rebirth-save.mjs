// gen-exam-passed-rebirth-save.mjs — QA helper (tester verification, assignment 049):
// builds a save where exam-1 is already passed AND totalCoins clears the rebirth
// threshold, to directly test whether passed-exam state survives "opnieuw beginnen"
// (rebirth) without having to grind either milestone through real play.
// Not part of the shipped product; scratch tool.
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { getExam, examKeys } from '../src/engine/exams.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

const exam1 = getExam('exam-1');
const profile = newProfile({ naam: 'Timo' });
profile.curriculumIndex = exam1.stage;
profile.onboardingGezien = true;

let state = newState(profile, nlPack.curriculumTail);
const keys = examKeys(exam1, state.curriculum);
const keyStats = { ...state.keyStats };
for (const k of keys) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
state = { ...state, keyStats, exams: { passed: [exam1.id], attempts: { [exam1.id]: 1 } } };

const tycoon = {
  coins: 30000, totalCoins: 30000, lifetimeCoins: 30000, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 5, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
