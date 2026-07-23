// Pure >20/minuut-samenvoegregel voor de per-bezoek Telegram-melding (assignment 036).
// Geen DOM, geen netwerk. Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_PER_MINUTE, minuteKey, shouldPingVisit, overflowCount } from '../api/_visitping.js';

test('minuteKey: vaste minuut-sleutel, geen schuivend venster', () => {
  assert.equal(minuteKey(0), 0);
  assert.equal(minuteKey(59999), 0);
  assert.equal(minuteKey(60000), 1);
  assert.equal(minuteKey(120000), 2);
});

test('shouldPingVisit: de eerste 20 bezoeken in een minuut sturen los, daarna niet meer', () => {
  assert.equal(shouldPingVisit(1), true);
  assert.equal(shouldPingVisit(MAX_PER_MINUTE), true); // de 20e mag nog
  assert.equal(shouldPingVisit(MAX_PER_MINUTE + 1), false); // de 21e niet meer
  assert.equal(shouldPingVisit(50), false);
});

test('overflowCount: alleen boven het maximum, en nooit dubbel (dedup)', () => {
  assert.equal(overflowCount(20, false), 0); // exact op het maximum: geen overloop
  assert.equal(overflowCount(21, false), 1); // 1 te veel
  assert.equal(overflowCount(45, false), 25); // 25 te veel
  assert.equal(overflowCount(45, true), 0); // al gemeld voor die minuut: geen dubbele melding
});
