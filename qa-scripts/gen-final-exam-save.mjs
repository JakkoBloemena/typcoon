// gen-final-exam-save.mjs — QA helper (assignment 050): builds a synthetic save
// that is exam-final-ready (all earlier mini-exams already passed, so
// nextAvailableExam skips straight to exam-final), using the actual engine
// functions — mirrors gen-exam-save.mjs's 'ready' mode but for the top diploma,
// to verify the certificate/print flow on the FINAL diploma specifically (050's
// AC2 calls it out by name). Not part of the shipped product; scratch tool.
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { EXAMS, getExam, examKeys } from '../src/engine/exams.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

const examFinal = getExam('exam-final');
const profile = newProfile({ naam: 'Timo' });
profile.curriculumIndex = examFinal.stage;
profile.onboardingGezien = true;

let state = newState(profile, nlPack.curriculumTail);
const keys = examKeys(examFinal, state.curriculum);
const keyStats = { ...state.keyStats };
for (const k of keys) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
const earlierPassed = EXAMS.filter((e) => e.id !== 'exam-final').map((e) => e.id);
state = {
  ...state,
  keyStats,
  speedAvg: examFinal.minKpm + 10,
  exams: { passed: earlierPassed, attempts: Object.fromEntries(earlierPassed.map((id) => [id, 1])) },
};

const tycoon = {
  coins: 5000, totalCoins: 5000, lifetimeCoins: 5000, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 20, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  certificates: Object.fromEntries(earlierPassed.map((id) => [id, { accuracy: 0.96, kpm: 0, date: dayKey() }])),
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
