// speed.js — Snelheid. Taal-neutraal.
// Bewust pas LÁTER zichtbaar: nauwkeurigheid eerst (§2.2). We meten snelheid vanaf
// dag 1, maar tonen hem niet als druk-meter aan een beginner. Hij verschijnt op het
// voortgangsscherm als persoonlijk record zodra het kind genoeg letters beheerst —
// nooit live, nooit als vergelijking met anderen.
//
// We meten in TOETSEN PER MINUUT (kpm), niet WPM. Reden: de app traint vooral losse
// letters en pseudo-woorden (niet altijd echte woorden), dus "toetsen per minuut" is
// eerlijker én concreter voor een kind. (Klassieke "WPM" is overigens niets anders
// dan kpm/5 — het telt geen echte woorden, maar tekens gedeeld door 5.)

import { activeLetters } from './curriculumCore.js';

// Vanaf hoeveel geleerde letters tonen we snelheid? ~de helft van het alfabet:
// tegen die tijd staat de nauwkeurigheidsbasis en is snelheid een leuk extraatje.
const SPEED_REVEAL_LETTERS = 13;

// Correcte toetsaanslagen per minuut.
export function sessionKpm(correctKeystrokes, durationMs) {
  const minutes = durationMs / 60000;
  if (minutes <= 0) return 0;
  return Math.round(correctKeystrokes / minutes);
}

// Meebewegend persoonlijk snelheidsgemiddelde (EMA), op elke afgeronde opdracht
// bijgewerkt met de kpm van díe opdracht. Zelfde conventie als (het ongebruikte)
// `applyExerciseRewards` in rewards.js: 70% geschiedenis, 30% laatste opdracht —
// dempt uitschieters (een enkele trage/snelle opdracht kantelt het gemiddelde niet),
// maar blijft meebewegen met echte vooruitgang. Eerste meting = het gemiddelde zelf
// (geen geschiedenis om mee te blenden).
export function updateSpeedAvg(prevAvg, kpm) {
  return prevAvg ? Math.round(0.7 * prevAvg + 0.3 * kpm) : kpm;
}

export function bestKpm(sessions = []) {
  return sessions.reduce((m, s) => Math.max(m, s.kpm || 0), 0);
}

// Mag de snelheid getoond worden? (genoeg letters geleerd + er is data)
export function speedRevealed(state) {
  const letters = state.curriculum
    ? activeLetters(state.curriculum, state.profile.curriculumIndex).length
    : 0;
  const hasData = (state.sessions || []).some((s) => (s.kpm || 0) > 0);
  return letters >= SPEED_REVEAL_LETTERS && hasData;
}

// Was de laatst opgeslagen sessie een nieuw persoonlijk record?
export function isNewRecord(sessions = []) {
  if (sessions.length < 2) return sessions.length === 1 && (sessions[0].kpm || 0) > 0;
  const last = sessions[sessions.length - 1].kpm || 0;
  const prevBest = bestKpm(sessions.slice(0, -1));
  return last > prevBest && last > 0;
}
