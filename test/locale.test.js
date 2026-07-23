// locale.test.js — gt()/setLocale wiring (assignment 012, §3.7), the "forced-en
// full session shows zero Dutch" bar for the home -> onboarding -> gameplay flow,
// and the full nl/en key-set parity + no-Dutch-fallback check across the entire
// string map (assignment 013). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { gt, setLocale, getLocale, localeKeys } from '../src/game/strings.js';
import { getPack } from '../src/data/packs.js';
import nlPack from '../src/data/nl/index.js';
import enPack from '../src/data/en/index.js';
import { BUILDINGS, UPGRADES } from '../src/game/economy.js';
import { ACHIEVEMENTS } from '../src/game/achievements.js';
import { fmt } from '../src/game/format.js';

test('setLocale/getLocale: valid locales apply, unknown falls back to nl', () => {
  setLocale('en');
  assert.equal(getLocale(), 'en');
  setLocale('nl');
  assert.equal(getLocale(), 'nl');
  setLocale('en');
  setLocale('xx');
  assert.equal(getLocale(), 'nl');
});

test('gt() reads from the active locale', () => {
  setLocale('nl');
  assert.equal(gt('home.start'), 'Start je fabriek');
  setLocale('en');
  assert.equal(gt('home.start'), 'Start your factory');
  setLocale('nl'); // reset for other test files
});

test('getPack(trainTaal): en/nl select the matching data pack, unknown falls back to nl', () => {
  assert.equal(getPack('nl'), nlPack);
  assert.equal(getPack('en'), enPack);
  assert.equal(getPack('xx'), nlPack);
  assert.equal(getPack(undefined), nlPack);
});

// Every key App.jsx / GameScreen.jsx / Onboarding.jsx use directly, in the
// home -> onboarding -> gameplay flow (012's forced-en bar). Sub-screens reached
// via the home menu (dashboard, records, friends, parent-email, login, school
// licence) are covered by the full-map parity tests below (assignment 013), not
// re-listed here.
const STATIC_FLOW_KEYS = [
  'brand.name', 'brand.tagline', 'desktop.title', 'desktop.body',
  'home.start', 'home.continue', 'home.namePlaceholder', 'home.reset', 'home.resetConfirm',
  'home.how1', 'home.how2', 'home.how3', 'home.parents', 'home.invite', 'home.records',
  'home.handsCheck', 'home.emailProgress', 'home.emailLinked', 'home.otherDevice', 'home.trust',
  'acc.unlinkConfirm',
  'premium.unlockShort', 'premium.inFull', 'premium.chapterTitle', 'premium.chapterBody', 'premium.chapterCta',
  'unlock.later',
  'play.back', 'play.soundOff', 'play.soundOn', 'play.coins', 'play.perSec', 'play.stars',
  'play.factory', 'play.upgrades', 'play.accuracyLever', 'play.combo', 'play.typeHint',
  'play.golden', 'play.unlockIn', 'play.unlockIn1', 'play.nextMilestone', 'play.milestoneReached',
  'play.newMachineTitle', 'play.newMachineBody', 'play.newLetterTitle', 'play.newLetterBody',
  'play.nice', 'play.checkHands', 'play.idleFloor', 'play.floorEmpty', 'play.achievement', 'play.buyLabel',
  'reminders.home', 'reminders.peek',
  'onb.introTitle', 'onb.introBody', 'onb.introGo', 'onb.homeTitle', 'onb.homeBody', 'onb.homeGo',
  'onb.drillTitle', 'onb.drillBody', 'onb.drillHint', 'onb.powerTitle', 'onb.powerBody', 'onb.powerGo',
  'onb.refreshTitle', 'onb.refreshBody', 'onb.skip',
  'daily.streakTip', 'daily.boostChip', 'daily.welcomeTitle', 'daily.welcomeBoost',
  'daily.welcomeBonus', 'daily.welcomeGo',
  'rebirth.button', 'rebirth.locked', 'rebirth.title', 'rebirth.body', 'rebirth.confirm',
  'rebirth.cancel', 'rebirth.doneTitle', 'rebirth.doneBody',
  'friends.thanksTitle', 'friends.thanksBody',
  'common.and',
];

const dynamicKeys = [
  ...BUILDINGS.flatMap((b) => [`building.${b.id}`, `building.${b.id}.desc`]),
  ...UPGRADES.map((u) => `upgrade.${u.id}`),
  ...ACHIEVEMENTS.map((a) => `ach.${a.id}`),
  ...Object.keys({
    'left-pinky': 1, 'left-ring': 1, 'left-middle': 1, 'left-index': 1,
    'right-index': 1, 'right-middle': 1, 'right-ring': 1, 'right-pinky': 1, thumb: 1,
  }).map((f) => `fingers.${f}`),
  'fingers.use', 'fingers.bothHome',
];

const FLOW_KEYS = [...STATIC_FLOW_KEYS, ...dynamicKeys];

test('every home -> onboarding -> gameplay key resolves to real English under en (no raw-key fallback)', () => {
  setLocale('en');
  const missing = FLOW_KEYS.filter((k) => gt(k) === k);
  assert.deepEqual(missing, [], `en is missing translations for: ${missing.join(', ')}`);
  setLocale('nl'); // reset for other test files
});

test('gt() never falls back to the Dutch string for an unknown key', () => {
  setLocale('en');
  // a key that exists in neither map — must show the raw key, never a Dutch string
  assert.equal(gt('nonexistent.key'), 'nonexistent.key');
  setLocale('nl');
});

// Assignment 013: the en map covers every key in the nl map, both directions —
// no key missing from en (would render as a raw key in an en session) and no
// orphan key in en (a translation with nothing to translate, dead weight).
// Covers the full map, not just the home -> onboarding -> gameplay flow above —
// including the school.* keys assignment 018 added after 012's map was authored.
test('en and nl string maps have identical key sets (both directions)', () => {
  const nlKeys = new Set(localeKeys('nl'));
  const enKeys = new Set(localeKeys('en'));
  const missingInEn = [...nlKeys].filter((k) => !enKeys.has(k));
  const orphanInEn = [...enKeys].filter((k) => !nlKeys.has(k));
  assert.deepEqual(missingInEn, [], `en is missing: ${missingInEn.join(', ')}`);
  assert.deepEqual(orphanInEn, [], `en has orphan keys not in nl: ${orphanInEn.join(', ')}`);
});

// Every nl key must resolve to real English under en — the full-map version of
// the flow-only check above (which only covers FLOW_KEYS). No raw-key fallback,
// and no left-over Dutch text (a key "translated" by copy-pasting the nl value).
test('every key in the map resolves to real English under en (no raw-key or Dutch fallback)', () => {
  const nlKeys = localeKeys('nl');

  setLocale('nl');
  const nlText = new Map(nlKeys.map((k) => [k, gt(k)]));

  setLocale('en');
  const rawKey = nlKeys.filter((k) => gt(k) === k);
  assert.deepEqual(rawKey, [], `en renders these as raw keys: ${rawKey.join(', ')}`);

  // A handful of keys are identical in both languages by design, not a missed
  // translation: brand.name ('Typcoon', a proper noun) plus a few nl strings
  // that were already English loanwords ('Menu', 'Machines', 'Upgrades', 'combo').
  const IDENTICAL_BY_DESIGN = new Set([
    'brand.name', 'play.back', 'play.factory', 'play.upgrades', 'play.combo',
  ]);
  const stillDutch = nlKeys.filter((k) => !IDENTICAL_BY_DESIGN.has(k) && gt(k) === nlText.get(k));
  assert.deepEqual(stillDutch, [], `en text is identical to nl (likely untranslated): ${stillDutch.join(', ')}`);

  setLocale('nl');
});

test('fmt(): number formatting follows the active locale (no Dutch mln/mld/bjn in en)', () => {
  setLocale('nl');
  assert.equal(fmt(9876), '9.876');
  assert.equal(fmt(2_500_000), '2,50 mln');
  assert.equal(fmt(9_876_000_000), '9,88 mld');

  setLocale('en');
  assert.equal(fmt(9876), '9,876');
  assert.equal(fmt(2_500_000), '2.50 M');
  assert.equal(fmt(9_876_000_000), '9.88 B');
  for (const bad of ['mln', 'mld', 'bjn']) assert.equal(fmt(9_876_000_000_000).includes(bad), false);
  setLocale('nl');
});
