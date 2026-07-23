// Pure ouder-mail-logica (geen DOM, geen netwerk). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lettersLearned, weeklyDue, reminderDue, weeklyStats, activeThisWeek, digestDue, yesterdayKey, tallyByType } from '../api/cron/_report.js';
import { digestMessage } from '../api/cron/notify.js';

test('lettersLearned mapt de curriculum-index op geleerde letters', () => {
  assert.equal(lettersLearned(0), 0);
  assert.equal(lettersLearned(1), 2); // f, j
  assert.equal(lettersLearned(4), 7); // thuisrij (a s d f j k l) — ; telt niet
  assert.equal(lettersLearned(14), 26); // alle letters
  assert.equal(lettersLearned(15), 26); // consolidatie: blijft 26
  assert.equal(lettersLearned(99), 26); // buiten bereik: 26
});

test('weeklyDue: alleen zondagavond, actief, één keer per week, opted-in', () => {
  const base = { pref: true, isSunday: true, hour: 19, lastReportDate: null, weekMonday: '2026-07-06', activeThisWeek: true };
  assert.equal(weeklyDue(base), true);
  assert.equal(weeklyDue({ ...base, pref: false }), false); // niet aangemeld
  assert.equal(weeklyDue({ ...base, isSunday: false }), false); // niet zondag
  assert.equal(weeklyDue({ ...base, hour: 12 }), false); // te vroeg
  assert.equal(weeklyDue({ ...base, activeThisWeek: false }), false); // deze week niet gespeeld
  assert.equal(weeklyDue({ ...base, lastReportDate: '2026-07-06' }), false); // al verstuurd
});

test('reminderDue: opgebouwde reeks, vandaag niet geoefend, s avonds, één per dag', () => {
  const base = { pref: true, todayKey: '2026-07-08', lastDay: '2026-07-07', streak: 4, hour: 18, lastReminderDate: null };
  assert.equal(reminderDue(base), true);
  assert.equal(reminderDue({ ...base, pref: false }), false); // niet aangemeld
  assert.equal(reminderDue({ ...base, lastDay: '2026-07-08' }), false); // al geoefend vandaag
  assert.equal(reminderDue({ ...base, streak: 0 }), false); // geen gewoonte om te beschermen
  assert.equal(reminderDue({ ...base, hour: 9 }), false); // te vroeg op de dag
  assert.equal(reminderDue({ ...base, lastReminderDate: '2026-07-08' }), false); // al herinnerd vandaag
});

test('weeklyStats vat de gesyncte state samen voor de ouder', () => {
  const state = {
    profile: { naam: 'Sanne', curriculumIndex: 5 },
    tycoon: {
      totalKeys: 1000, correctKeys: 920, streak: 6,
      weekly: { key: '2026-07-06', coins: 5000, exercises: 40, combo: 32 },
      lastWeekly: { coins: 3800 },
    },
  };
  const s = weeklyStats(state);
  assert.equal(s.naam, 'Sanne');
  assert.equal(s.lettersLearned, 9); // index 5
  assert.equal(s.accuracy, 92);
  assert.equal(s.exercisesThisWeek, 40);
  assert.equal(s.bestComboThisWeek, 32);
  assert.equal(s.coinsThisWeek, 5000);
  assert.equal(s.streak, 6);
  assert.equal(s.vsLastWeekCoins, 1200);
});

test('weeklyStats: geen aanslagen → nauwkeurigheid null; geen vorige week → null', () => {
  const s = weeklyStats({ profile: {}, tycoon: { weekly: { key: 'x', coins: 0, exercises: 0 } } });
  assert.equal(s.accuracy, null);
  assert.equal(s.vsLastWeekCoins, null);
  assert.equal(s.naam, 'je kind');
});

test('activeThisWeek: alleen als de weeksleutel matcht én er is geoefend', () => {
  const mk = (key, ex) => ({ tycoon: { weekly: { key, exercises: ex } } });
  assert.equal(activeThisWeek(mk('2026-07-06', 3), '2026-07-06'), true);
  assert.equal(activeThisWeek(mk('2026-06-29', 3), '2026-07-06'), false); // vorige week
  assert.equal(activeThisWeek(mk('2026-07-06', 0), '2026-07-06'), false); // niets gedaan
});

// ---- Dagelijkse Telegram-liveness-digest (assignment 036) -------------------------
test('digestDue: vanaf 08:00 Amsterdam, één keer per dag (dedup), ongeacht de tellingen', () => {
  assert.equal(digestDue({ hour: 8, alreadySent: false }), true);
  assert.equal(digestDue({ hour: 23, alreadySent: false }), true); // een gemiste 08:00 wordt later ingehaald
  assert.equal(digestDue({ hour: 7, alreadySent: false }), false); // nog voor 08:00
  assert.equal(digestDue({ hour: 8, alreadySent: true }), false); // al verstuurd voor die datum
});

test('yesterdayKey: Amsterdamse datum van gisteren, ook over maand-/jaargrenzen', () => {
  assert.equal(yesterdayKey('2026-07-23'), '2026-07-22');
  assert.equal(yesterdayKey('2026-08-01'), '2026-07-31');
  assert.equal(yesterdayKey('2026-01-01'), '2025-12-31');
});

test('tallyByType: telt events per type, negeert onbekende types', () => {
  const rows = [{ type: 'pageview' }, { type: 'pageview' }, { type: 'game_start' }, { type: 'onbekend' }];
  const counts = tallyByType(rows, ['pageview', 'game_start', 'engaged_session', 'parent_opt_in']);
  assert.deepEqual(counts, { pageview: 2, game_start: 1, engaged_session: 0, parent_opt_in: 0 });
});

test('digestMessage: toont expliciet 0 als er gisteren niets gebeurde — stilte moet zichtbaar blijven', () => {
  const counts = { pageview: 0, game_start: 0, engaged_session: 0, parent_opt_in: 0 };
  const text = digestMessage('2026-07-22', counts, 0);
  assert.match(text, /bezoeken: 0/);
  assert.match(text, /spel-starts: 0/);
  assert.match(text, /accounts totaal: 0/);
  assert.equal(/@/.test(text), false); // geen PII
});

test('digestMessage: telt gisterens werkelijke aantallen mee', () => {
  const counts = { pageview: 42, game_start: 9, engaged_session: 3, parent_opt_in: 1 };
  const text = digestMessage('2026-07-22', counts, 17);
  assert.match(text, /bezoeken: 42/);
  assert.match(text, /spel-starts: 9/);
  assert.match(text, /betrokken sessies: 3/);
  assert.match(text, /ouder-opt-ins: 1/);
  assert.match(text, /accounts totaal: 17/);
});

// ---- Rijtellingen als quota-proxy (assignment 044, decisions/008 gap 1) -----------
test('digestMessage: zonder quota-argument blijft het bericht ongewijzigd (geen rijen-regel)', () => {
  const counts = { pageview: 1, game_start: 1, engaged_session: 1, parent_opt_in: 1 };
  const text = digestMessage('2026-07-22', counts, 5);
  assert.equal(/rijen/.test(text), false);
});

test('digestMessage: quota-argument voegt de vier gelabelde rijtellingen toe', () => {
  const counts = { pageview: 1, game_start: 1, engaged_session: 1, parent_opt_in: 1 };
  const quota = { accounts: 17, events: 4213, rate_limits: 980, rate_limit_claims: 12 };
  const text = digestMessage('2026-07-22', counts, 17, quota);
  assert.match(text, /accounts: 17/);
  assert.match(text, /events: 4\.213/); // nl-NL duizendtalscheiding
  assert.match(text, /rate_limits: 980/);
  assert.match(text, /rate_limit_claims: 12/);
});

test('digestMessage: fail-safe — een mislukte telling (null) toont "n.b." i.p.v. een gegokt getal, en blokkeert de rest niet', () => {
  const counts = { pageview: 1, game_start: 1, engaged_session: 1, parent_opt_in: 1 };
  const quota = { accounts: 17, events: null, rate_limits: 980, rate_limit_claims: null };
  const text = digestMessage('2026-07-22', counts, 17, quota);
  assert.match(text, /accounts: 17/);
  assert.match(text, /events: n\.b\./);
  assert.match(text, /rate_limits: 980/);
  assert.match(text, /rate_limit_claims: n\.b\./);
});
