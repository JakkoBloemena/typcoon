// Pure vinger-kaart-logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  fingerForKey, HOME_FINGER, FINGER_HOME_KEY, HOME_DRILL, HOME_REFRESH, HOME_SEQUENCE,
} from '../src/game/handmap.js';
import { qwertyNl } from '../src/layouts/qwerty-nl.js';

test('fingerForKey mapt toets → vinger (hoofdletter = zelfde vinger)', () => {
  assert.equal(fingerForKey(qwertyNl, 'f'), 'left-index');
  assert.equal(fingerForKey(qwertyNl, 'j'), 'right-index');
  assert.equal(fingerForKey(qwertyNl, 'J'), 'right-index'); // hoofdletter → kleine letter
  assert.equal(fingerForKey(qwertyNl, ' '), 'thumb');
  assert.equal(fingerForKey(qwertyNl, null), null);
  assert.equal(fingerForKey(qwertyNl, '€'), null); // onbekend
});

test('HOME_FINGER en FINGER_HOME_KEY zijn elkaars omgekeerde', () => {
  for (const [key, finger] of Object.entries(HOME_FINGER)) {
    assert.equal(FINGER_HOME_KEY[finger], key);
  }
});

test('de thuisrij-vingers dekken precies de layout-thuisrij + duim', () => {
  const homeKeys = Object.keys(HOME_FINGER).filter((k) => k !== ' ').sort();
  assert.deepEqual(homeKeys, [...qwertyNl.homeRow].sort());
});

test('HOME_DRILL bevat alleen thuisrij-toetsen en spaties', () => {
  const allowed = new Set([...qwertyNl.homeRow, ' ']);
  for (const ch of HOME_DRILL) assert.ok(allowed.has(ch), `onverwachte toets in drill: "${ch}"`);
  for (const ch of HOME_REFRESH) assert.ok(allowed.has(ch), `onverwachte toets in refresh: "${ch}"`);
});

test('de drill begint bij de ankers (F en J eerst)', () => {
  assert.equal(HOME_DRILL[0], 'f');
  assert.equal(HOME_DRILL[1], 'j');
  assert.equal(HOME_SEQUENCE[0], 'f');
  assert.equal(HOME_SEQUENCE[1], 'j');
});
