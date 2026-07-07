// curriculumCore.js — De ENIGE hardgecodeerde structuur (§3).
// Taal-neutraal: dit is de gedeelde QWERTY-letterkern (stage 1-15).
// De taal-/layoutspecifieke staart (hoofdletters, leestekens, accenten) leeft
// in het taalpakket (curriculumTail.js) en wordt hieraan vastgeplakt.

export const curriculumCore = [
  { stage: 1, keys: ['f', 'j'], note: 'Indexvingers + tastnokjes; ankerbeweging.' },
  { stage: 2, keys: ['d', 'k'], note: 'Middelvingers.' },
  { stage: 3, keys: ['s', 'l'], note: 'Ringvingers.' },
  { stage: 4, keys: ['a', ';'], note: 'Pinken; home row compleet.' },
  { stage: 5, keys: ['g', 'h'], note: 'Indexvingers naar binnen.' },
  { stage: 6, keys: ['e', 'i'], note: 'Bovenste-rij klinkers.' },
  { stage: 7, keys: ['r', 'u'], note: 'Bovenste rij, index.' },
  { stage: 8, keys: ['t', 'y'], note: 'Bovenste rij, index naar binnen.' },
  { stage: 9, keys: ['n', 'm'], note: 'Onderste rij, index.' },
  { stage: 10, keys: ['o', 'w'], note: 'Boven, ring/middel.' },
  { stage: 11, keys: ['c', 'v'], note: 'Onder, middel/index.' },
  { stage: 12, keys: ['p', 'q'], note: 'Boven, pink/ring.' },
  { stage: 13, keys: ['b', 'x'], note: 'Onder, index/ring.' },
  { stage: 14, keys: ['z'], note: 'Onder, pink.' },
  { stage: 15, keys: [], note: 'Consolidatie: alle letters, ritme + woordlengte omhoog.' },
];

// Bouw de volledige leervolgorde door de taal-staart eraan te plakken.
// `tail` is een array stages (zelfde vorm) uit het taalpakket; mag leeg zijn.
export function buildCurriculum(tail = []) {
  const out = curriculumCore.map((s) => ({ ...s, part: 'core' }));
  let nextStage = curriculumCore.length + 1;
  for (const t of tail) {
    out.push({ ...t, stage: nextStage++, part: 'tail' });
  }
  return out;
}

// Genoeg-geoefend-drempel (§5.4): minimaal aantal CORRECTE herhalingen per toets vóór
// een nieuwe letter erbij komt. Bewust op herhaling gebaseerd — een echte typcursus laat
// een letter pas los als hij door en door zit. Gedeeld door de promotie-poort (index.js)
// én de generator (die deze toetsen gericht laat oefenen zodat de drempel haalbaar blijft).
export const MIN_KEY_REPS = 45;

// Meta-toetsen zijn ontgrendelbaar maar nooit los te typen (bv. Shift). Ze tellen
// niet mee in de promotie-poort en krijgen geen keyStats — anders blokkeren ze het
// curriculum (confidence blijft 0 want er komen nooit losse samples binnen).
export const META_KEYS = new Set(['Shift']);

// Alle toetsen die ontgrendeld zijn t/m de gegeven (1-based) stage-index.
export function activeKeys(curriculum, curriculumIndex) {
  const keys = [];
  for (const stage of curriculum) {
    if (stage.stage > curriculumIndex) break;
    for (const k of stage.keys) if (!keys.includes(k)) keys.push(k);
  }
  return keys;
}

// Alleen de letters (a-z) uit de actieve set — basis voor de woord-generator.
export function activeLetters(curriculum, curriculumIndex) {
  return activeKeys(curriculum, curriculumIndex).filter((k) => /^[a-z]$/.test(k));
}

// Typebare niet-letters uit de actieve set: ';', leestekens, cijfers, accenten.
// Deze MOETEN door de generator geoefend worden (anders deadlockt de promotie-poort).
export function activeSymbols(curriculum, curriculumIndex) {
  return activeKeys(curriculum, curriculumIndex).filter(
    (k) => !/^[a-z]$/.test(k) && !META_KEYS.has(k),
  );
}

// Is hoofdletter-modus (Shift) ontgrendeld? Bepaalt of de generator mag kapitaliseren.
export function shiftUnlocked(curriculum, curriculumIndex) {
  return activeKeys(curriculum, curriculumIndex).includes('Shift');
}

// De gating-toetsen voor promotie: actieve toetsen minus meta-toetsen.
export function gatingKeys(curriculum, curriculumIndex) {
  return activeKeys(curriculum, curriculumIndex).filter((k) => !META_KEYS.has(k));
}

// De volgende nog-niet-ontgrendelde stage (of null als alles ontgrendeld is).
export function nextStage(curriculum, curriculumIndex) {
  return curriculum.find((s) => s.stage === curriculumIndex + 1) || null;
}
