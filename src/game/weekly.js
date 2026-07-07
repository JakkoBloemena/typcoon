// weekly.js — "Records & versla-jezelf" (PUUR). Geen echte leaderboard: die vereist een
// server (gedeelde scores) én brengt bij kinderen naam-moderatie + privacy-risico mee.
// Een NEP-bord (bots) is oneerlijk en kinderen prikken erdoor. Het eerlijke, motiverende
// alternatief zonder backend: speel tegen je EIGEN beste week.
//
// Ontwerp (zie analyse): weekbord dat maandag reset, zodat je altijd opnieuw kunt
// meedoen; je meet je tegen je vorige week ("120 munten vóór op vorige week!") en tegen
// je all-time records. Koppelt aan de dagstreak (dagelijks terugkomen) met een weekdoel.
//
// UPGRADE-PAD (met backend): een vrienden-only weekcompetitie via de referral-codes —
// veilig (geen publiek bord van kinderen) en het versterkt de referral-loop.

// Weeksleutel = de datum van de maandag van die week (lokaal). Rolt om bij een nieuwe
// maandag; geen ISO-weeknummer-gedoe.
export function weekKey(ts = Date.now()) {
  const d = new Date(ts);
  const dow = (d.getDay() + 6) % 7; // 0=maandag .. 6=zondag
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - dow);
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${monday.getFullYear()}-${m}-${dd}`;
}

export function newWeekly(now = Date.now()) {
  return { key: weekKey(now), coins: 0, exercises: 0, combo: 0 };
}

// Bij sessie-start: rol de week om als het maandag-voorbij is. Werkt records bij.
// Geeft { weekly, lastWeekly, records, rolledOver } terug.
export function checkWeek(tycoon, now = Date.now()) {
  const k = weekKey(now);
  const records = { bestWeekCoins: 0, longestStreak: 0, ...(tycoon.records || {}) };

  if (!tycoon.weekly) {
    return { weekly: newWeekly(now), lastWeekly: tycoon.lastWeekly || null, records, rolledOver: false };
  }
  if (tycoon.weekly.key === k) {
    return { weekly: tycoon.weekly, lastWeekly: tycoon.lastWeekly || null, records, rolledOver: false };
  }
  // nieuwe week → huidige week wordt "vorige week", records bijwerken, vers beginnen
  const finished = tycoon.weekly;
  const newRecords = { ...records, bestWeekCoins: Math.max(records.bestWeekCoins, finished.coins) };
  return { weekly: newWeekly(now), lastWeekly: finished, records: newRecords, rolledOver: true };
}

// Verschil t.o.v. de eindstand van vorige week (voor "vóór/achter op vorige week").
export function vsLastWeek(weekly, lastWeekly) {
  if (!lastWeekly) return null;
  return (weekly?.coins || 0) - (lastWeekly.coins || 0);
}
