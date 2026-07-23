// api/cron/_report.js — PURE beslissings- en samenvattingslogica voor de ouder-mails.
// Geen DOM, geen netwerk → volledig te unit-testen (test/report.test.js).
//
// Twee mails (zie het plan): een WEKELIJKSE voortgangsdigest (zondagavond) en een
// vriendelijke OEFEN-HERINNERING als een opgebouwde reeks dreigt te breken. Beide leunen
// op de gesyncte speelstate (tycoon.weekly, streak, lastDay) — geen per-sessie-timers.

// Letters geleerd, afgeleid van de curriculum-index (kernstages; de nl-staart blijft 26).
// stage 1..14 introduceert alle 26 letters; ';' in stage 4 telt niet als letter.
const LETTERS_CUM = [0, 2, 4, 6, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 26];
export function lettersLearned(idx) {
  if (!idx || idx < 1) return 0;
  return LETTERS_CUM[Math.min(idx, LETTERS_CUM.length - 1)];
}

// Wekelijkse digest versturen? Zondagavond, één keer per week (dedup op de maandag-sleutel),
// en alleen als het kind déze week echt heeft geoefend.
export function weeklyDue({ pref, isSunday, hour, lastReportDate, weekMonday, activeThisWeek }) {
  return !!pref && !!activeThisWeek && !!isSunday && hour >= 18 && lastReportDate !== weekMonday;
}

// Herinnering versturen? Opgebouwde reeks, vandaag nog niet geoefend, 's avonds, één per dag.
export function reminderDue({ pref, todayKey, lastDay, streak, hour, lastReminderDate }) {
  if (!pref) return false;
  if (lastReminderDate === todayKey) return false; // al herinnerd vandaag
  if (lastDay === todayKey) return false; // al geoefend vandaag → geen herinnering
  if ((streak || 0) < 1) return false; // nog geen gewoonte om te beschermen
  if (hour < 17) return false; // pas 's avonds herinneren
  return true;
}

// Bouw de ouder-samenvatting uit de gesyncte state. Alles wat de digest toont.
export function weeklyStats(state) {
  const prof = state.profile || {};
  const ty = state.tycoon || {};
  const wk = ty.weekly || {};
  const last = ty.lastWeekly || null;
  const acc = ty.totalKeys ? Math.round((ty.correctKeys / ty.totalKeys) * 100) : null;
  return {
    naam: prof.naam || 'je kind',
    lettersLearned: lettersLearned(prof.curriculumIndex),
    accuracy: acc, // null als er nog geen aanslagen zijn
    exercisesThisWeek: wk.exercises || 0,
    bestComboThisWeek: wk.combo || 0,
    coinsThisWeek: wk.coins || 0,
    streak: ty.streak || 0,
    vsLastWeekCoins: last ? (wk.coins || 0) - (last.coins || 0) : null,
  };
}

// Heeft het kind déze week (de week die vanavond eindigt) geoefend?
export function activeThisWeek(state, weekMonday) {
  const wk = (state.tycoon || {}).weekly || {};
  return wk.key === weekMonday && (wk.exercises || 0) > 0;
}

// ---- Dagelijkse Telegram-liveness-digest (assignment 036) ------------------------
// Verstuur de digest? Vanaf 08:00 Amsterdam, één keer voor "gisteren" (dedup: de
// aanroeper geeft door of er al een bevestigde send was voor die datum). `hour>=` in
// plaats van `hour===` haalt een gemiste/trage 08:00-cronrun bij een latere uurlijkse
// tick alsnog in — zelfde veerkracht-patroon als weeklyDue's `hour >= 18`. Let op: dit
// kijkt NOOIT naar de tellingen — de digest moet ook op een dag met 0 bezoekers gaan,
// want stilte is precies hoe de maandenlange backend-uitval verborgen bleef
// (company/retro/2026-07-23-env-outage-and-headless-lessons.md).
export function digestDue({ hour, alreadySent }) {
  return hour >= 8 && !alreadySent;
}

// Amsterdamse datum van "gisteren" (yyyy-mm-dd), uit de 'yyyy-mm-dd'-sleutel van vandaag.
export function yesterdayKey(today) {
  const [y, m, d] = today.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

// Telt rijen per event-type (puur — de aanroeper filtert de rijen al op de juiste dag).
export function tallyByType(rows, types) {
  const counts = Object.fromEntries(types.map((t) => [t, 0]));
  for (const r of rows) if (Object.prototype.hasOwnProperty.call(counts, r.type)) counts[r.type]++;
  return counts;
}
