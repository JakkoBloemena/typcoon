// exams.test.js — Directe engine-tests voor src/engine/exams.js (assignment 049,
// eerste acceptatie-eis). Dit bestand is de allereerste directe dekking van de
// mini-toetsen/eindtoets-module — pint gradeExam, examReady/nextAvailableExam,
// generateExamText en applyExamResult VOORDAT toets-beoordeling ergens in het spel
// aan een kind getoond wordt. Draait met: npm test

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import nlPack from '../src/data/nl/index.js';
import {
  EXAMS, getExam, examKeys, examReady, nextAvailableExam, examStatus,
  generateExamText, gradeExam, applyExamResult, newExams,
} from '../src/engine/exams.js';
import { updateSpeedAvg } from '../src/engine/speed.js';

// --- fixtures ---------------------------------------------------------------

// Verse engine-state met het volledige NL-curriculum (kern + staart) aangevinkt
// t/m `stage`. newState initialiseert keyStats (confidence 0) voor elke actieve
// toets t/m die stage — precies wat de toets-poort nodig heeft om op te bouwen.
function stateAtStage(stage) {
  const profile = newProfile({ naam: 'Toets' });
  profile.curriculumIndex = stage;
  return newState(profile, nlPack.curriculumTail);
}

// Zet de confidence van gegeven toetsen naar `conf` (simuleert "lang en goed geoefend").
function withConfidence(state, keys, conf) {
  const keyStats = { ...state.keyStats };
  for (const k of keys) {
    keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: conf, reps: 50, accuracy: conf };
  }
  return { ...state, keyStats };
}

function readyState(exam, conf = 1) {
  let s = stateAtStage(exam.stage);
  s = withConfidence(s, examKeys(exam, s.curriculum), conf);
  return s;
}

// Kleine deterministische PRNG (mulberry32) voor de determinisme-test — Math.random
// is niet seedbaar, generateExamText accepteert elke functie die getallen in [0,1) geeft.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const exam1 = getExam('exam-1');
const examFinal = getExam('exam-final');

// --- gradeExam ---------------------------------------------------------------

test('gradeExam: exam zonder snelheidseis slaagt exact op passAcc, faalt er net onder', () => {
  assert.equal(gradeExam(exam1, exam1.passAcc).pass, true, 'exact op de lat = geslaagd');
  assert.equal(gradeExam(exam1, exam1.passAcc - 0.0001).pass, false, 'net onder de lat = gezakt');
});

test('gradeExam: de eindtoets faalt onder minKpm, zelfs bij 100% nauwkeurigheid', () => {
  const r = gradeExam(examFinal, 1.0, examFinal.minKpm - 1);
  assert.equal(r.pass, false, '99% van de snelheidslat + perfecte nauwkeurigheid is nog steeds gezakt');
});

test('gradeExam: de eindtoets slaagt op/boven minKpm (mét voldoende nauwkeurigheid)', () => {
  assert.equal(gradeExam(examFinal, examFinal.passAcc, examFinal.minKpm).pass, true);
  assert.equal(gradeExam(examFinal, examFinal.passAcc, examFinal.minKpm + 20).pass, true);
});

test('gradeExam: de eindtoets faalt onder passAcc, zelfs bij ruim voldoende snelheid', () => {
  const r = gradeExam(examFinal, examFinal.passAcc - 0.01, examFinal.minKpm + 50);
  assert.equal(r.pass, false);
});

test('gradeExam: geeft accuracy en kpm door in het resultaat', () => {
  const r = gradeExam(exam1, 0.95, 42);
  assert.equal(r.accuracy, 0.95);
  assert.equal(r.kpm, 42);
});

// --- examReady / nextAvailableExam -------------------------------------------

test('examReady: op slot zolang curriculumIndex onder de stage van de toets zit', () => {
  let s = readyState(exam1, 1); // alle toetsen maximaal confident
  s = { ...s, profile: { ...s.profile, curriculumIndex: exam1.stage - 1 } };
  assert.equal(examReady(s, exam1), false);
});

test('examReady: klaar zodra curriculumIndex de stage van de toets bereikt én confident', () => {
  const s = readyState(exam1, 1);
  assert.equal(s.profile.curriculumIndex, exam1.stage);
  assert.equal(examReady(s, exam1), true);
});

test('examReady: nooit aangeboden terwijl de governor "frustrated" is', () => {
  let s = readyState(exam1, 1);
  s = { ...s, governor: { ...s.governor, state: 'frustrated' } };
  assert.equal(examReady(s, exam1), false);
});

test('examReady: pas klaar als ELKE gedekte toets de EXAM_READY-confidencebar haalt', () => {
  const keys = examKeys(exam1, stateAtStage(exam1.stage).curriculum);
  // net onder de bar (0.82) op één toets → nog niet klaar
  let s = readyState(exam1, 0.82);
  s = withConfidence(s, [keys[0]], 0.81);
  assert.equal(examReady(s, exam1), false, 'één toets net onder de bar houdt de toets op slot');

  // exact op de bar voor ALLE toetsen → wél klaar
  const s2 = readyState(exam1, 0.82);
  assert.equal(examReady(s2, exam1), true, 'exact op de confidencebar (voor elke toets) is genoeg');
});

test('examReady: de eindtoets blijft op slot tot speedAvg binnen 90% van minKpm zit', () => {
  let s = readyState(examFinal, 1);
  s = { ...s, speedAvg: examFinal.minKpm * 0.9 - 1 };
  assert.equal(examReady(s, examFinal), false, 'net onder 90% van minKpm = nog op slot');

  const s2 = { ...s, speedAvg: examFinal.minKpm * 0.9 };
  assert.equal(examReady(s2, examFinal), true, 'exact op 90% van minKpm = klaar om aan te bieden');
});

test('examReady: een realistische speedAvg-progressie (echte oefeningen, geen handmatige set) opent uiteindelijk de eindtoets (assignment 054)', () => {
  let s = readyState(examFinal, 1); // alle inhoud confident; alleen de snelheidspoort ontbreekt nog
  // alle mini-toetsen al gehaald (realistisch: die komen ruim vóór de eindtoets),
  // zodat nextAvailableExam ondubbelzinnig naar de eindtoets wijst zodra hij open gaat
  s = { ...s, exams: { ...s.exams, passed: EXAMS.filter((e) => e.id !== 'exam-final').map((e) => e.id) } };
  assert.equal(s.speedAvg, 0, 'vers profiel: nog nooit iets gemeten');
  assert.equal(examReady(s, examFinal), false, 'op slot zolang speedAvg 0 is');

  // simuleer een kind dat oefening na oefening steeds sneller typt (dezelfde EMA
  // die GameScreen.jsx nu na elke afgeronde opdracht toepast, kpm 40 → 115) — geen
  // enkele losse meting forceert de lat, het is de geleidelijke opbouw die telt.
  let openedAt = -1;
  for (let i = 0; i < 25; i++) {
    const kpm = Math.min(40 + i * 4, 115);
    s = { ...s, speedAvg: updateSpeedAvg(s.speedAvg, kpm) };
    if (openedAt === -1 && examReady(s, examFinal)) openedAt = i;
  }
  assert.ok(openedAt > 5, `de poort gaat niet te vroeg open, vóór de snelheid er echt staat (ging open bij oefening ${openedAt})`);
  assert.ok(s.speedAvg >= examFinal.minKpm * 0.9, `na realistisch oefenen moet speedAvg (${s.speedAvg}) de 90%-lat (${examFinal.minKpm * 0.9}) bereiken`);
  assert.equal(examReady(s, examFinal), true, 'exam-final wordt aangeboden zodra de opgebouwde speedAvg de lat haalt');
  assert.equal(nextAvailableExam(s)?.id, examFinal.id);
});

test('examReady: een niet-eindtoets kijkt nooit naar speedAvg', () => {
  const s = { ...readyState(exam1, 1), speedAvg: 0 };
  assert.equal(examReady(s, exam1), true, 'exam-1 heeft geen minKpm, dus speedAvg=0 blokkeert niet');
});

test('examReady: een reeds gehaalde toets wordt niet opnieuw aangeboden', () => {
  let s = readyState(exam1, 1);
  s = { ...s, exams: { ...s.exams, passed: [exam1.id] } };
  assert.equal(examReady(s, exam1), false);
});

test('nextAvailableExam: geeft de eerste nog-niet-gehaalde klare toets terug (volgorde EXAMS)', () => {
  const s = readyState(exam1, 1);
  const next = nextAvailableExam(s);
  assert.equal(next?.id, 'exam-1');
});

test('nextAvailableExam: null als geen enkele toets klaar is', () => {
  const s = stateAtStage(1); // net begonnen, niets confident
  assert.equal(nextAvailableExam(s), null);
});

test('nextAvailableExam: springt door naar de volgende klare toets zodra de eerste gehaald is', () => {
  const exam2 = getExam('exam-2');
  let s = stateAtStage(exam2.stage);
  s = withConfidence(s, examKeys(exam1, s.curriculum), 1);
  s = withConfidence(s, examKeys(exam2, s.curriculum), 1);
  s = { ...s, exams: { ...s.exams, passed: ['exam-1'] } };
  assert.equal(nextAvailableExam(s)?.id, 'exam-2');
});

test('examStatus: passed / available / locked', () => {
  const passedState = { ...readyState(exam1, 1), exams: { ...newExams(), passed: [exam1.id] } };
  assert.equal(examStatus(passedState, exam1), 'passed');
  assert.equal(examStatus(readyState(exam1, 1), exam1), 'available');
  assert.equal(examStatus(stateAtStage(1), exam1), 'locked');
});

// --- generateExamText ---------------------------------------------------------

test('generateExamText: dekt elke letter van de examen-toetsenset minstens één keer', () => {
  const s = stateAtStage(exam1.stage);
  const text = generateExamText(exam1, s, nlPack, mulberry32(1));
  const lower = text.toLowerCase();
  const keys = examKeys(exam1, s.curriculum);
  const missing = keys.filter((k) => !lower.includes(k));
  assert.deepEqual(missing, [], `mist toetsen in de examentekst: ${missing.join(', ')}`);
});

test('generateExamText: dekt ook leestekens/hoofdletter-modus/cijfers voor een verder gevorderde toets', () => {
  const examFinalKeys = examKeys(examFinal, stateAtStage(examFinal.stage).curriculum);
  // de eindtoets dekt alle kernletters + leestekens + cijfers (punct + digits)
  assert.ok(examFinalKeys.includes('.'));
  assert.ok(examFinalKeys.includes('5'));

  const s = stateAtStage(examFinal.stage);
  const text = generateExamText(examFinal, s, nlPack, mulberry32(7));
  const lower = text.toLowerCase();
  const missing = examFinalKeys.filter((k) => !lower.includes(k));
  assert.deepEqual(missing, [], `mist toetsen in de eindtoets-tekst: ${missing.join(', ')}`);
});

test('generateExamText: is deterministisch onder een geseede rng', () => {
  const s = stateAtStage(exam1.stage);
  const a = generateExamText(exam1, s, nlPack, mulberry32(42));
  const b = generateExamText(exam1, s, nlPack, mulberry32(42));
  assert.equal(a, b);
});

test('generateExamText: verschillende seeds geven (doorgaans) verschillende teksten', () => {
  const s = stateAtStage(exam1.stage);
  const a = generateExamText(exam1, s, nlPack, mulberry32(1));
  const b = generateExamText(exam1, s, nlPack, mulberry32(2));
  assert.notEqual(a, b);
});

// --- applyExamResult -----------------------------------------------------------

test('applyExamResult: registreert een pass en levert een beloning', () => {
  const s = readyState(exam1, 1);
  const r = applyExamResult(s, exam1, true);
  assert.deepEqual(r.state.exams.passed, [exam1.id]);
  assert.equal(r.state.exams.attempts[exam1.id], 1);
  assert.ok(r.reward > 0);
});

test('applyExamResult: is idempotent op een herhaalde pass — geen dubbele entry, geen tweede beloning', () => {
  const s = readyState(exam1, 1);
  const first = applyExamResult(s, exam1, true);
  const second = applyExamResult(first.state, exam1, true);
  assert.deepEqual(second.state.exams.passed, [exam1.id], 'geen dubbele entry in passed[]');
  assert.equal(second.reward, 0, 'de tweede pass levert geen tweede beloning');
  assert.equal(second.state.rewards.stars, first.state.rewards.stars, 'de beloning wordt niet dubbel toegekend');
  assert.equal(second.state.exams.attempts[exam1.id], 2, 'de pogingsteller loopt wél door');
});

test('applyExamResult: kent op een fail géén beloning toe en markeert de toets niet als gehaald', () => {
  const s = readyState(exam1, 1);
  const r = applyExamResult(s, exam1, false);
  assert.deepEqual(r.state.exams.passed, []);
  assert.equal(r.reward, 0);
  assert.equal(r.state.rewards.stars, s.rewards.stars, 'geen beloning bij een gezakte toets');
  assert.equal(r.state.exams.attempts[exam1.id], 1, 'de poging telt wél mee');
});
