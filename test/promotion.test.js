// Promotie-tempo: een nieuwe letter komt er pas bij als de huidige letters 'lang genoeg'
// geoefend zijn (herhalingen + nauwkeurigheid), nooit na een paar toevalstreffers, en het
// kan nooit softlocken op snelheid. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { newProfile } from '../src/engine/profile.js';
import { newState, processKeystroke, tryPromote } from '../src/engine/index.js';
import { MIN_KEY_REPS } from '../src/engine/curriculumCore.js';

// Typ één toets n keer (allemaal goed) met een gegeven tussentijd.
function drill(state, key, n, dtMs) {
  let s = state;
  for (let i = 0; i < n; i++) {
    s = processKeystroke(s, { expected: key, actual: key, dtMs, correct: true }).state;
  }
  return s;
}

// De governor beweegt pas uit 'frustrated' na een afgeronde oefening; voor deze pure
// promotie-test forceren we een niet-frustrerende governor-stand.
function unstuck(state) {
  return { ...state, governor: { ...state.governor, state: 'flow', rolling: new Array(40).fill(true) } };
}

test('een paar goede aanslagen promoveert NIET (te weinig geoefend)', () => {
  let s = newState(newProfile({ naam: 'K' })); // stage 1 = f, j
  s = drill(s, 'f', 8, 300);
  s = drill(s, 'j', 8, 300);
  s = unstuck(s);
  assert.equal(tryPromote(s).promoted, false, '8 herhalingen is te weinig');
});

test('promotie pas na MIN_KEY_REPS correcte herhalingen op ELKE gating-toets', () => {
  let s = newState(newProfile({ naam: 'K' }));
  // alleen f voldoende oefenen → j hangt nog achter → geen promotie
  s = drill(s, 'f', MIN_KEY_REPS + 2, 300);
  s = drill(s, 'j', 10, 300);
  s = unstuck(s);
  assert.equal(tryPromote(s).promoted, false, 'j is nog niet lang genoeg geoefend');

  // nu ook j volledig oefenen → wél promotie
  s = drill(s, 'j', MIN_KEY_REPS, 300);
  s = unstuck(s);
  const r = tryPromote(s);
  assert.equal(r.promoted, true);
  assert.deepEqual(r.newKeys, ['d', 'k']); // stage 2
});

test('traag maar nauwkeurig kind loopt NIET vast: snelheid gatet promotie niet', () => {
  const profile = newProfile({ naam: 'Traag' });
  let s = newState(profile);
  // heel traag (ver boven elk snelheidsdoel) maar foutloos, ruim voldoende herhalingen
  s = drill(s, 'f', MIN_KEY_REPS + 5, 5000);
  s = drill(s, 'j', MIN_KEY_REPS + 5, 5000);
  s = unstuck(s);
  assert.equal(tryPromote(s).promoted, true, 'accuraat + genoeg geoefend = door, ongeacht tempo');
});

test('een worstelend kind (lage nauwkeurigheid) promoveert niet zomaar', () => {
  let s = newState(newProfile({ naam: 'K' }));
  // veel herhalingen maar met fouten: buffer-nauwkeurigheid blijft onder de band
  for (let i = 0; i < 60; i++) {
    const ok = i % 3 !== 0; // ~67% nauwkeurig
    s = processKeystroke(s, { expected: 'f', actual: ok ? 'f' : 'x', dtMs: 400, correct: ok }).state;
    s = processKeystroke(s, { expected: 'j', actual: ok ? 'j' : 'x', dtMs: 400, correct: ok }).state;
  }
  s = unstuck(s);
  assert.equal(tryPromote(s).promoted, false, 'te veel fouten → eerst meer oefenen');
});
