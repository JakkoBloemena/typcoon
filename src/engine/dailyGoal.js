// dailyGoal.js — Dagelijks ritme (§8.2). Taal-neutraal.
// Standaard: ~10 min/dag, 5 dagen/week. De streak BEVRIEST bij een gemiste dag
// (rustdagen worden vergeven) en reset nooit als straf — alleen na een lange pauze.
// Onderbouwing: spacing-effect + motor-consolidatie tijdens slaap; 10-15 min ligt
// rond de aandachtsspanne van 8-12-jarigen.

const DAY_MS = 24 * 60 * 60 * 1000;
const FORGIVE_GAP_DAYS = 3; // tot ~2 rustdagen (bv. een weekend) breken de streak niet

// Lokale datumsleutel 'YYYY-MM-DD' (niet UTC, zodat "vandaag" lokaal klopt).
export function dayKey(ts = Date.now()) {
  const d = new Date(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function keyToMidnight(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d).getTime();
}

// Aantal hele dagen tussen twee datumsleutels.
export function dayGap(fromKey, toKey) {
  return Math.round((keyToMidnight(toKey) - keyToMidnight(fromKey)) / DAY_MS);
}

// Geoefende minuten op een bepaalde dag (uit de sessie-geschiedenis).
export function minutesOnDay(sessions, key) {
  const ms = sessions
    .filter((s) => dayKey(s.date) === key)
    .reduce((sum, s) => sum + (s.durationMs || 0), 0);
  return ms / 60000;
}

// Reeds vandaag geoefende minuten (los van de lopende sessie).
export function priorMinutesToday(state, now = Date.now()) {
  return minutesOnDay(state.sessions || [], dayKey(now));
}

// Verse daily-status voor een nieuw profiel.
export function newDaily() {
  return { streakDagen: 0, laatsteDoelDatum: null };
}

// Is het dagdoel gehaald? `liveMinutes` = lopende-sessieminuten die nog niet in de
// geschiedenis staan.
export function dailyGoalMet(state, liveMinutes = 0, now = Date.now()) {
  const doel = state.profile.dagDoelMin ?? 10;
  return priorMinutesToday(state, now) + liveMinutes >= doel;
}

// Markeer het dagdoel als gehaald en werk de (vergevende) streak bij.
// Idempotent: meerdere keren op dezelfde dag verandert niets meer.
export function reachDailyGoal(daily, now = Date.now()) {
  const today = dayKey(now);
  if (daily.laatsteDoelDatum === today) return { daily, justReached: false };

  let streak;
  if (!daily.laatsteDoelDatum) {
    streak = 1;
  } else {
    const gap = dayGap(daily.laatsteDoelDatum, today);
    streak = gap <= FORGIVE_GAP_DAYS ? daily.streakDagen + 1 : 1; // lange pauze = opnieuw
  }
  return {
    daily: {
      ...daily,
      streakDagen: streak,
      laatsteDoelDatum: today,
      // laatste 7 voltooi-tijdstippen (epoch) — basis voor het herinneringstijdstip
      completions: [...(daily.completions || []), now].slice(-7),
    },
    justReached: true,
  };
}

// Hoeveel dagen deze (lokale) week is het dagdoel gehaald — voor de weekkaart.
// Telt distinct dagen met genoeg minuten, maandag als weekstart.
export function daysMetThisWeek(state, now = Date.now()) {
  const doel = state.profile.dagDoelMin ?? 10;
  const today = new Date(now);
  const dow = (today.getDay() + 6) % 7; // 0 = maandag
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - dow).getTime();
  const seen = new Set();
  for (const s of state.sessions || []) {
    if (s.date >= monday && minutesOnDay(state.sessions, dayKey(s.date)) >= doel) {
      seen.add(dayKey(s.date));
    }
  }
  return seen.size;
}
