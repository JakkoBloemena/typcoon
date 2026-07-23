// qa-scripts/017-gen-en-nearready-save.mjs — 017 launch-gate helper: en-locale
// "near-ready" exam save (mirrors 049's gen-exam-save.mjs near-ready mode, but
// locale-forced to en) so the live examOffer moment can be watched firing in English.
import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke } from '../src/engine/index.js';
import { getExam, examKeys } from '../src/engine/exams.js';
import { activeKeys, META_KEYS } from '../src/engine/curriculumCore.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import enPack from '../src/data/en/index.js';

const exam1 = getExam('exam-1');
const profile = newProfile({ naam: 'Alex' });
profile.curriculumIndex = exam1.stage;
profile.onboardingGezien = true;
profile.uiTaal = 'en';
profile.trainTaal = 'en';
profile.layout = 'qwerty-us';

let state = newState(profile, enPack.curriculumTail);
const [weak] = examKeys(exam1, state.curriculum);
const strong = activeKeys(state.curriculum, profile.curriculumIndex).filter((k) => k !== weak && !META_KEYS.has(k));
for (const k of strong) {
  for (let i = 0; i < 15; i++) state = processKeystroke(state, { expected: k, actual: k, dtMs: 200, correct: true }).state;
}
for (let i = 0; i < 5; i++) state = processKeystroke(state, { expected: weak, actual: weak, dtMs: 200, correct: true }).state;

const tycoon = {
  coins: 500, totalCoins: 500, lifetimeCoins: 500, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 5, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
