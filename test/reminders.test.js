// Pure houding-hint-logica (geen DOM, geen timer). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newFormState, pushKeystroke, REMINDER } from '../src/game/reminders.js';

// Duw een reeks aanslagen door; verzamel elke hint die viel.
function run(fs, keys, startNow = 0, stepMs = 100) {
  let state = fs;
  const hints = [];
  let now = startNow;
  for (const k of keys) {
    now += stepMs;
    const r = pushKeystroke(state, { correct: k.correct, dtMs: k.dtMs, now });
    state = r.state;
    if (r.hint) hints.push({ ...r.hint, at: now });
  }
  return { state, hints };
}

// N aanslagen met een gegeven nauwkeurigheid en tussentijd.
function keys(n, { acc = 1, dtMs = 200 } = {}) {
  const out = [];
  const correctCount = Math.round(n * acc);
  for (let i = 0; i < n; i++) out.push({ correct: i < correctCount, dtMs });
  return out;
}

test('geen hint voordat het venster vol is', () => {
  const { hints } = run(newFormState(), keys(REMINDER.WINDOW - 1, { acc: 0.3 }));
  assert.equal(hints.length, 0);
});

test('geen hint als het goed gaat (hoge nauwkeurigheid), ook al is het traag', () => {
  const { hints } = run(newFormState(), keys(REMINDER.WINDOW, { acc: 1, dtMs: 3000 }));
  assert.equal(hints.length, 0);
});

test('lage nauwkeurigheid → thuisrij-hint', () => {
  const { hints } = run(newFormState(), keys(REMINDER.WINDOW, { acc: 0.5, dtMs: 200 }));
  assert.equal(hints.length, 1);
  assert.equal(hints[0].key, 'reminders.home');
});

test('structureel traag (maar nog redelijk netjes) → niet-spieken-hint', () => {
  // acc 0.83 (< WELL_ACC, > ACC_FLOOR) en alle aanslagen traag
  const { hints } = run(newFormState(), keys(REMINDER.WINDOW, { acc: 0.83, dtMs: 2500 }));
  assert.equal(hints.length, 1);
  assert.equal(hints[0].key, 'reminders.peek');
});

test('een lange denkpauze telt NIET als traag', () => {
  // acc 0.83, maar elke tussentijd is een pauze (> SLOW_CEIL) → geen traag-signaal
  const { hints } = run(newFormState(), keys(REMINDER.WINDOW, { acc: 0.83, dtMs: REMINDER.SLOW_CEIL + 1000 }));
  assert.equal(hints.length, 0);
});

test('cooldown: geen tweede hint binnen COOLDOWN_MS', () => {
  let state = newFormState();
  let r1 = run(state, keys(REMINDER.WINDOW, { acc: 0.4 }), 0, 100);
  assert.equal(r1.hints.length, 1);
  // meteen nóg een slechte reeks, ruim binnen de cooldown → geblokkeerd
  const r2 = run(r1.state, keys(REMINDER.WINDOW, { acc: 0.4 }), r1.hints[0].at, 100);
  assert.equal(r2.hints.length, 0);
});

test('nooit meer dan MAX_PER_SESSION hints', () => {
  let state = newFormState();
  let total = 0;
  let now = 0;
  // veel slechte reeksen, telkens ver na de cooldown → toch gemaximeerd
  for (let round = 0; round < REMINDER.MAX_PER_SESSION + 3; round++) {
    now += REMINDER.COOLDOWN_MS + 5000;
    const r = run(state, keys(REMINDER.WINDOW, { acc: 0.4 }), now, 100);
    state = r.state;
    total += r.hints.length;
    now = r.hints.length ? r.hints[r.hints.length - 1].at : now;
  }
  assert.equal(total, REMINDER.MAX_PER_SESSION);
});
