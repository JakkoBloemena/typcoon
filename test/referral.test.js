// Pure referral-logica (geen DOM). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  makeThanksToken, validateThanks, referrerReward, MAX_REFERRALS, WELCOME_BONUS,
} from '../src/game/referral.js';
import { newTycoon } from '../src/game/economy.js';

test('een geldige bedankcode valideert alleen bij de juiste referrer', () => {
  const referrer = 'ABC123';
  const friend = 'XYZ789';
  const token = makeThanksToken(referrer, friend);
  // de referrer (ABC123) accepteert
  const good = validateThanks(token, referrer, []);
  assert.equal(good.ok, true);
  assert.equal(good.friend, friend);
  // een andere speler (niet de bedoelde referrer) niet
  assert.equal(validateThanks(token, 'OTHER1', []).ok, false);
});

test('geknoeide of onzin-codes worden geweigerd (checksum)', () => {
  const token = makeThanksToken('ABC123', 'XYZ789');
  const tampered = token.slice(0, -1) + (token.slice(-1) === 'A' ? 'B' : 'A');
  assert.equal(validateThanks(tampered, 'ABC123', []).ok, false);
  assert.equal(validateThanks('zomaar-wat-fout', 'ABC123', []).ok, false);
  assert.equal(validateThanks('', 'ABC123', []).ok, false);
});

test('dezelfde vriend kan niet twee keer belonen (dedup)', () => {
  const token = makeThanksToken('ABC123', 'XYZ789');
  assert.equal(validateThanks(token, 'ABC123', ['XYZ789']).ok, false);
});

test('referrer-beloning: vloer voor beginners, loopt af per vriend, gecapt', () => {
  const ty = newTycoon();
  const r0 = referrerReward(ty, 0);
  const r1 = referrerReward(ty, 1);
  assert.ok(r0 >= 200); // vloer
  assert.ok(r1 < r0); // aflopend
  assert.equal(referrerReward(ty, MAX_REFERRALS), 0); // gecapt
  // schaalt mee met productie
  const rich = { ...newTycoon(), buildings: { megafab: 50 } };
  assert.ok(referrerReward(rich, 0) > r0);
});

test('constanten zijn gezet', () => {
  assert.ok(WELCOME_BONUS > 0);
  assert.equal(MAX_REFERRALS, 5);
});
