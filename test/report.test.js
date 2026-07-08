// Pure ouder-mail-logica (geen DOM, geen netwerk). Draait met: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { lettersLearned, weeklyDue, reminderDue, weeklyStats, activeThisWeek } from '../api/cron/_report.js';

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
