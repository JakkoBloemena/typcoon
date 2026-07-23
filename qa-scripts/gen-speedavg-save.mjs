// gen-speedavg-save.mjs — QA helper (assignment 054): builds a synthetic save at
// exam-final's stage with all content mastered and speedAvg parked just under the
// 90%-of-minKpm gate, so a QA script can play a handful of REAL exercises through
// the browser and watch state.speedAvg's EMA (GameScreen.jsx handleComplete) carry
// it across the line. Not part of the shipped product; scratch tool, not committed.
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
// drill EVERY exam-final key to full confidence via the REAL engine (recordKey's
// confidence is a ringbuffer-based EMA — hand-faking `confidence` without real
// `samples` gets wiped by the next real keystroke), matching gen-exam-save.mjs's
// 'near-ready' approach. dtMs=200 is comfortably under the default speed target
// (750ms), so speedScore saturates at 1 alongside 100% accuracy.
for (const k of examKeys(examFinal, state.curriculum)) {
  for (let i = 0; i < 15; i++) state = processKeystroke(state, { expected: k, actual: k, dtMs: 200, correct: true }).state;
}
state = {
  ...state,
  speedAvg: Math.round(examFinal.minKpm * 0.9) - 6, // net onder de 90%-lat
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
