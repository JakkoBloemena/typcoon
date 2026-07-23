// qa-scripts/017-gen-en-exam-save.mjs — 017 launch-gate helper: builds a synthetic
// EXAM-READY save with profile.uiTaal/trainTaal = 'en' (so the app renders English
// on load without relying on the ?lang=en new-player signal), using the real engine
// functions. Modelled on 049's gen-exam-save.mjs but locale-forced. Scratch tool,
// not shipped.
import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke } from '../src/engine/index.js';
import { getExam, examKeys } from '../src/engine/exams.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import enPack from '../src/data/en/index.js';

const mode = process.argv[2] || 'ready';

const exam1 = getExam('exam-1');
const profile = newProfile({ naam: 'Alex' });
profile.curriculumIndex = exam1.stage;
profile.onboardingGezien = true;
profile.uiTaal = 'en';
profile.trainTaal = 'en';
profile.layout = 'qwerty-us';

let state = newState(profile, enPack.curriculumTail);
if (mode === 'ready') {
  const keys = examKeys(exam1, state.curriculum);
  const keyStats = { ...state.keyStats };
  for (const k of keys) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
  state = { ...state, keyStats };
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
