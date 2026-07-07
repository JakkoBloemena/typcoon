// engine/index.js — Orkestratie van de vier loops (§5, §13).
// Het engine-contract (§10.4): processKeystroke, generateExercise, finalizeExercise.
// Alles hier is PUUR en TAAL-NEUTRAAL. Taalpakket + layout komen als parameter binnen.

import { buildCurriculum, activeKeys, gatingKeys, nextStage, META_KEYS, MIN_KEY_REPS } from './curriculumCore.js';
import { newKeyStat, recordKey } from './keyModel.js';
import { newBigramStat, recordBigram } from './bigramModel.js';
import { ensureSrs, reviewSrs } from './srs.js';
import { newGovernor, governorTick, governorAdjust } from './difficulty.js';
import { newDaily } from './dailyGoal.js';
import { newRewards } from './rewards.js';
import { newExams } from './exams.js';

export { generateExercise } from './generator.js';

// Verse engine-state voor een profiel. `tail` = curriculum-staart uit het taalpakket.
export function newState(profile, tail = []) {
  const curriculum = buildCurriculum(tail);
  const state = {
    profile,
    curriculum,
    keyStats: {},
    bigramStats: {},
    srsItems: {},
    sessions: [],
    daily: newDaily(), // dagelijks ritme / streak (§8.2)
    rewards: newRewards(), // sterren / unlocks / badges (gamification)
    exams: newExams(), // mini-toetsen + eindtoets
    speedAvg: 0, // meebewegend snelheidsgemiddelde (toetsen/min)
    governor: newGovernor(profile),
    prevKey: null, // voor bigram-vorming
  };
  // initialiseer keyStats voor reeds-actieve toetsen (meta-toetsen overslaan)
  for (const k of activeKeys(curriculum, profile.curriculumIndex)) {
    if (META_KEYS.has(k)) continue;
    state.keyStats[k] = newKeyStat(k, profile.aangemaaktOp);
  }
  return state;
}

// Herstel een uit opslag geladen state (§storage). De afgeleide `curriculum` is
// niet bewaard en wordt opnieuw uit het taalpakket opgebouwd. De governor-buffer
// is sessie-lokaal en start vers, met behoud van het ingestelde snelheidsdoel.
export function hydrateState(persisted, tail = []) {
  const curriculum = buildCurriculum(tail);
  const governor = {
    ...newGovernor(persisted.profile),
    speedTargetMs: persisted.governor?.speedTargetMs ?? persisted.profile.basisSnelheidsdoelMs,
    wordLen: persisted.governor?.wordLen ?? 3,
  };
  return {
    sessions: [],
    daily: newDaily(),
    rewards: newRewards(),
    exams: newExams(),
    speedAvg: 0,
    ...persisted,
    curriculum,
    governor,
    prevKey: null,
  };
}

// Loop A + B + governor-tick: verwerk één aanslag.
// in: { expected, actual, dtMs }  ->  { state, correct }
// `expected` is de te trainen toets (door de UI genormaliseerd: hoofdletters vallen
// onder hun kleine letter). `correct` mag meegegeven worden (hoofdletter-gevoelige
// vergelijking in de UI); anders vallen we terug op een exacte vergelijking.
export function processKeystroke(state, { expected, actual, dtMs, correct }) {
  if (correct == null) correct = expected === actual;
  const at = Date.now();

  // Snelheidsdoel voor déze toets (gebruikt door confidence-berekening).
  const targetMs = state.governor.speedTargetMs;

  // Loop A+B: keyStats van de verwachte toets.
  const keyStats = { ...state.keyStats };
  const prevStat = keyStats[expected] || newKeyStat(expected, at);
  keyStats[expected] = recordKey(prevStat, { ok: correct, t: dtMs, at }, targetMs);

  // Loop A: bigramStats van (vorige verwachte toets -> deze).
  const bigramStats = { ...state.bigramStats };
  if (state.prevKey && /^[a-z]$/.test(state.prevKey) && /^[a-z]$/.test(expected)) {
    const pair = state.prevKey + expected;
    const b = bigramStats[pair] || newBigramStat(pair);
    bigramStats[pair] = recordBigram(b, { ok: correct, t: dtMs, at });
  }

  // Governor: rollende succesratio + struggle-streak.
  const governor = governorTick(state.governor, correct);

  return {
    state: { ...state, keyStats, bigramStats, governor, prevKey: expected },
    correct,
  };
}

// Loop C + D + governor-bijstelling: rond een oefening af.
// results: [{ element, pass }]  — element is "key:x" of "bigram:xy", pass = goed gedaan.
export function finalizeExercise(state, results = []) {
  // 1) SRS bijwerken (Loop D)
  let srsItems = { ...state.srsItems };
  for (const r of results) {
    srsItems = ensureSrs(srsItems, r.element);
    srsItems[r.element] = reviewSrs(srsItems[r.element], r.pass);
  }

  // 2) Governor bijstellen op basis van de afgelopen oefening (§6)
  const governor = governorAdjust(state.governor, state.profile);

  let next = { ...state, srsItems, governor };

  // 3) Promotieregel (Loop C, §5.4): nieuwe letter ontgrendelen?
  const promo = tryPromote(next);
  if (promo.promoted) {
    next = promo.state;
  }

  return { state: next, promoted: promo.promoted ? promo.newKeys : null };
}

function clampAcc(x, lo, hi) {
  return Math.max(lo, Math.min(hi, x));
}

// Is deze ene toets 'lang genoeg' geoefend om een nieuwe letter toe te laten?
//   a) minstens MIN_KEY_REPS correcte herhalingen (praktijk = "lang genoeg"), én
//   b) een blijvende nauwkeurigheid rond de flow-band (nauwkeurigheid eerst, §2.2).
// Snelheid gaten we NIET af (dat komt vanzelf; elders is het de "3e ster") — zo loopt een
// net-niet-supersnel kind nooit vast. Humane klep: wie véél oefent (≥2× de drempel) maar net
// onder de band blijft hangen, mag met iets meer marge tóch door — geen eeuwige muur.
function keyReady(st, accGate) {
  if (!st) return false;
  const reps = st.reps ?? 0;
  const acc = st.accuracy ?? 0;
  if (reps >= MIN_KEY_REPS && acc >= accGate) return true;
  if (reps >= 2 * MIN_KEY_REPS && acc >= accGate - 0.05) return true;
  return false;
}

// Promotieregel (§5.4): elke actieve toets genoeg geoefend, en het kind worstelt niet.
export function tryPromote(state) {
  const { profile, governor } = state;
  const stage = nextStage(state.curriculum, profile.curriculumIndex);
  if (!stage) return { promoted: false };

  // Voorwaarde 2: governor mag niet in 'frustrated' staan (kind worstelt → eerst rust).
  if (governor.state === 'frustrated') return { promoted: false };

  // Voorwaarde 1: elke gating-toets (actief minus meta) is 'lang genoeg' geoefend.
  const gating = gatingKeys(state.curriculum, profile.curriculumIndex);
  const accGate = clampAcc((profile.doelAccuratesse ?? 0.9) - 0.05, 0.7, 0.95);
  const ready = gating.every((k) => keyReady(state.keyStats[k], accGate));
  if (!ready) return { promoted: false };

  // Promoveer: index omhoog + keyStats voor nieuwe (niet-meta) toetsen aanmaken.
  const keyStats = { ...state.keyStats };
  for (const k of stage.keys) {
    if (META_KEYS.has(k)) continue;
    if (!keyStats[k]) keyStats[k] = newKeyStat(k);
  }
  const profileNext = { ...profile, curriculumIndex: profile.curriculumIndex + 1 };
  // Na promotie: governor-advies resetten zodat niet meteen nog een letter komt.
  const governorNext = { ...governor, allowPromotion: false };

  return {
    promoted: true,
    newKeys: stage.keys,
    state: { ...state, profile: profileNext, keyStats, governor: governorNext },
  };
}
