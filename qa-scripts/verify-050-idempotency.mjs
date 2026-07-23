// verify-050-idempotency.mjs — independent (tester-written) check that a repeat pass
// on an already-earned exam does NOT overwrite the stored certificate. Exercises the
// real production functions (economy.js + engine/exams.js), not the developer's own
// test file. Scratch QA tool, not part of shipped product.
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { getExam } from '../src/engine/exams.js';
import { applyTypcoonExamResult, newTycoon } from '../src/game/economy.js';
import nlPack from '../src/data/nl/index.js';

const exam1 = getExam('exam-1');
const profile = newProfile({ naam: 'Timo' });
profile.curriculumIndex = exam1.stage;

let engineState = newState(profile, nlPack.curriculumTail);
let state = { ...engineState, tycoon: newTycoon() };

// first pass: real measured 74% accuracy, kpm 55, "yesterday"
const yesterday = Date.now() - 24 * 3600 * 1000;
let { state: afterFirst, reward: reward1 } = applyTypcoonExamResult(state, exam1, true, 0.74, 55, yesterday);
console.log('REWARD_1(expect > 0, fresh pass)', reward1);
console.log('CERT_AFTER_FIRST', JSON.stringify(afterFirst.tycoon.certificates[exam1.id]));

// second pass on the SAME already-passed exam: different (higher) accuracy, today
const today = Date.now();
let { state: afterSecond, reward: reward2 } = applyTypcoonExamResult(afterFirst, exam1, true, 1.0, 120, today);
console.log('REWARD_2(expect 0, repeat pass — idempotent)', reward2);
console.log('CERT_AFTER_SECOND', JSON.stringify(afterSecond.tycoon.certificates[exam1.id]));

const unchanged = JSON.stringify(afterFirst.tycoon.certificates[exam1.id]) === JSON.stringify(afterSecond.tycoon.certificates[exam1.id]);
console.log('CERT_UNCHANGED_BY_REPEAT_PASS(expect true)', unchanged);
console.log('RESULT', unchanged && reward2 === 0 ? 'PASS' : 'FAIL');
