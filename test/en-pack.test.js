// en-pack.test.js — Validates the en data pack against the §7-A checklist in
// research/en-locale-scope.md (assignment 012): home-row typability, the
// stage-6 first-20 bound, bigram/baseFreq shape, no accent stage, and the
// qwerty-us layout registration. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCurriculum, activeLetters } from '../src/engine/curriculumCore.js';
import enPack from '../src/data/en/index.js';
import { LAYOUTS, getLayout } from '../src/layouts/index.js';
import qwertyUs from '../src/layouts/qwerty-us.js';

const curriculum = buildCurriculum(enPack.curriculumTail);
const STAGE4_LETTERS = new Set(activeLetters(curriculum, 4)); // f j d k s l a
const STAGE6_LETTERS = new Set(activeLetters(curriculum, 6)); // + g h e i
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz'.split('');

test('en pack exposes the same shape as nl (id + 5 sources)', () => {
  assert.equal(enPack.id, 'en');
  assert.ok(Array.isArray(enPack.words));
  assert.ok(Array.isArray(enPack.sentences));
  assert.ok(Array.isArray(enPack.curriculumTail));
  assert.equal(typeof enPack.bigrams, 'object');
  assert.equal(typeof enPack.baseFreq, 'object');
});

test('words.js: no duplicates, every entry is lowercase a-z', () => {
  assert.equal(new Set(enPack.words).size, enPack.words.length);
  for (const w of enPack.words) assert.match(w, /^[a-z]+$/, `not a-z: ${w}`);
});

test('words.js: filtering to the stage-4 home-row set yields >= 10 real words', () => {
  const stage4Words = enPack.words.filter((w) => [...w].every((c) => STAGE4_LETTERS.has(c)));
  assert.ok(stage4Words.length >= 10, `only ${stage4Words.length} stage-4-only words`);
});

test('words.js: no word in the first 20 needs a letter unlocked after stage 6', () => {
  const first20 = enPack.words.slice(0, 20);
  for (const w of first20) {
    for (const c of w) assert.ok(STAGE6_LETTERS.has(c), `"${w}" needs "${c}", unlocked after stage 6`);
  }
});

test('sentences.js: ~35 original, lowercase, letters + spaces only, no duplicates', () => {
  assert.ok(enPack.sentences.length >= 30, 'expected roughly 35 sentences');
  assert.equal(new Set(enPack.sentences).size, enPack.sentences.length);
  for (const s of enPack.sentences) assert.match(s, /^[a-z ]+$/, `bad chars in: ${s}`);
  assert.ok(enPack.sentences.some((s) => s.includes('typie')), 'expected at least one mascot line');
});

test('bigrams.js: every letter a-z has a row; q->u dominant; th/he/in/er/an rank high', () => {
  for (const l of ALPHABET) assert.ok(enPack.bigrams[l], `missing bigram row for "${l}"`);
  const top = (row) => Object.entries(row).sort((a, b) => b[1] - a[1])[0][0];
  assert.equal(top(enPack.bigrams.q), 'u');
  assert.equal(top(enPack.bigrams.t), 'h');
  assert.equal(top(enPack.bigrams.h), 'e');
  assert.equal(top(enPack.bigrams.i), 'n');
  assert.equal(top(enPack.bigrams.e), 'r');
  assert.equal(top(enPack.bigrams.a), 'n');
});

test('baseFreq.js: every letter a-z present, normalised to ~1', () => {
  for (const l of ALPHABET) assert.equal(typeof enPack.baseFreq[l], 'number', `missing baseFreq for "${l}"`);
  const sum = Object.values(enPack.baseFreq).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sum - 1) < 0.02, `baseFreq sums to ${sum}, expected ~1`);
});

test('curriculumTail.js: Shift -> punctuation -> digits, no accent stage', () => {
  const allKeys = enPack.curriculumTail.flatMap((s) => s.keys);
  assert.ok(allKeys.includes('Shift'));
  assert.ok(allKeys.includes('.') && allKeys.includes(','));
  assert.ok(allKeys.includes('?') && allKeys.includes('!'));
  assert.ok('0123456789'.split('').every((d) => allKeys.includes(d)));
  // nl's accent stage (é ë ï ó) must NOT appear anywhere in the en tail
  const accents = ['é', 'ë', 'ï', 'ó'];
  for (const a of accents) assert.ok(!allKeys.includes(a), `en tail should not include accent "${a}"`);
});

test('qwerty-us is registered and letter positions match US-QWERTY (same as qwerty-nl)', () => {
  assert.equal(LAYOUTS['qwerty-us'].id, 'qwerty-us');
  assert.equal(getLayout('qwerty-us'), qwertyUs);
  assert.deepEqual(qwertyUs.homeRow, ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']);
  assert.equal(qwertyUs.finger.f, 'left-index');
  assert.equal(qwertyUs.finger.j, 'right-index');
});
