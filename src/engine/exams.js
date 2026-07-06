// exams.js — Mini-toetsen + eindtoets (gamified mijlpalen). Taal-neutraal.
//
// Belangrijkste regel (gevraagd): bied een toets ALLEEN aan als we er zeer zeker van
// zijn dat het kind hem binnen ~3 pogingen haalt. Dat hergebruikt het confidence-model
// (§5.2): een toets wordt pas "klaar" zodra élke toets die hij dekt hoge confidence
// heeft. Zo voelt een toets als een vier-moment, niet als een struikelblok.

import { activeLetters, activeSymbols } from './curriculumCore.js';

// Confidence-drempel waarboven we durven aan te bieden (hoog → ~zeker van slagen).
const EXAM_READY = 0.82;
const EXAM_BONUS_STARS = 15;

// Slaag-eisen. `passAcc` = minimale nauwkeurigheid; `minKpm` = minimale toetsen/min
// (alleen de eindtoets). Onderbouwing (internationale richtlijn voor een eerste
// blindtyp-diploma bij 8–12-jarigen): Nederlandse typediploma's hanteren ~100–120
// toetsen/min bij ~97% nauwkeurigheid; internationale "proficient"-norm voor kinderen
// ligt rond 20 WPM (= 100 toetsen/min). We kiezen voor het diploma een haalbare maar
// échte lat: 100 toetsen/min (≈20 WPM) + 95% nauwkeurigheid. De mini-toetsen zijn
// nauwkeurigheids-mijlpalen onderweg (geen snelheidseis). 1 woord = 5 aanslagen.
export const EXAMS = [
  { id: 'exam-1', icon: '🏠', stage: 5, passAcc: 0.92 },
  { id: 'exam-2', icon: '⬆️', stage: 8, passAcc: 0.92 },
  { id: 'exam-3', icon: '🔤', stage: 14, passAcc: 0.92 },
  { id: 'exam-4', icon: '🔠', stage: 18, passAcc: 0.93, punct: true, caps: true },
  { id: 'exam-final', icon: '🏆', stage: 19, passAcc: 0.95, minKpm: 100, punct: true, caps: true, digits: true, final: true },
];

export function newExams() {
  return { passed: [], attempts: {} };
}

// Mini-games (Word Rain e.d.) gaan open zodra de eerste mini-toets gehaald is.
export function minigamesUnlocked(state) {
  const passed = state?.exams?.passed || [];
  return passed.some((id) => id !== 'exam-final');
}

export function getExam(id) {
  return EXAMS.find((e) => e.id === id) || null;
}

// Welke toetsen dekt een examen (voor de readiness-poort en de tekstgeneratie).
export function examKeys(exam, curriculum) {
  const letters = activeLetters(curriculum, exam.stage);
  if (!exam.punct && !exam.digits) return letters;
  const syms = activeSymbols(curriculum, exam.stage).filter((s) => exam.digits || !/[0-9]/.test(s));
  return [...letters, ...syms];
}

// Is een toets klaar om aan te bieden? (inhoud ontgrendeld + alle toetsen confident)
export function examReady(state, exam) {
  if (state.exams?.passed?.includes(exam.id)) return false;
  if (state.profile.curriculumIndex < exam.stage) return false;
  if (state.governor?.state === 'frustrated') return false; // niet midden in worsteling
  const keys = examKeys(exam, state.curriculum);
  if (keys.length === 0) return false;
  // eindtoets pas aanbieden als de snelheid in de buurt van de lat zit (slagen ~zeker)
  if (exam.minKpm && (state.speedAvg || 0) < exam.minKpm * 0.9) return false;
  return keys.every((k) => (state.keyStats[k]?.confidence ?? 0) >= EXAM_READY);
}

// De eerstvolgende, nog niet gehaalde toets die klaar is (één tegelijk aanbieden).
export function nextAvailableExam(state) {
  return EXAMS.find((e) => examReady(state, e)) || null;
}

// Status per toets voor de leerroute: 'passed' | 'available' | 'locked'.
export function examStatus(state, exam) {
  if (state.exams?.passed?.includes(exam.id)) return 'passed';
  if (examReady(state, exam)) return 'available';
  return 'locked';
}

// --- Examen-tekst (langer dan een gewone oefening, dekt de hele toetsenset) ---

function pickWeighted(entries, rng) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return entries.length ? entries[0][0] : null;
  let r = rng() * total;
  for (const [v, w] of entries) { r -= w; if (r <= 0) return v; }
  return entries[entries.length - 1][0];
}

function examWord(len, letters, bigrams, rng) {
  let cur = letters[Math.floor(rng() * letters.length)];
  const out = [cur];
  const set = new Set(letters);
  for (let i = 1; i < len; i++) {
    const trans = bigrams[cur] || {};
    const entries = letters.map((L) => [L, set.has(L) ? (trans[L] ?? 0.03) : 0]);
    cur = pickWeighted(entries, rng) || cur;
    out.push(cur);
  }
  return out.join('');
}

function capitalizeFirst(w) {
  return w.replace(/[a-z]/, (c) => c.toUpperCase());
}

// Bouw een examentekst: een reeks woorden die alle examentoetsen langs laat komen.
export function generateExamText(exam, state, localePack, rng = Math.random) {
  const letters = activeLetters(state.curriculum, exam.stage);
  const syms = examKeys(exam, state.curriculum).filter((k) => !/^[a-z]$/.test(k));
  const words = [];

  // ~14 woorden, lengtes 3-5
  for (let i = 0; i < 14; i++) {
    let w = examWord(3 + Math.floor(rng() * 3), letters, localePack.bigrams, rng);
    if (exam.caps && rng() < 0.25) w = capitalizeFirst(w);
    words.push(w);
  }
  // zorg dat elk symbool minstens één keer voorkomt
  for (const s of syms) {
    if (/^[0-9]$/.test(s)) {
      words.splice(Math.floor(rng() * words.length), 0, s + (1 + Math.floor(rng() * 9)));
    } else {
      const at = Math.floor(rng() * words.length);
      words[at] = words[at] + s;
    }
  }
  return words.join(' ');
}

// Beoordeel een afgelegde toets tegen de absolute slaag-eisen (industrie-norm).
export function gradeExam(exam, accuracy, kpm = 0) {
  const speedOk = !exam.minKpm || kpm >= exam.minKpm;
  return { pass: accuracy >= exam.passAcc && speedOk, accuracy, kpm };
}

// Verwerk een poging (geslaagd of niet). Bij slagen: bonus-sterren + markeren.
export function applyExamResult(state, exam, pass) {
  const exams = state.exams || newExams();
  const attempts = { ...exams.attempts, [exam.id]: (exams.attempts[exam.id] || 0) + 1 };
  if (!pass) {
    return { state: { ...state, exams: { ...exams, attempts } }, reward: 0 };
  }
  const passed = exams.passed.includes(exam.id) ? exams.passed : [...exams.passed, exam.id];
  const rewards = {
    ...state.rewards,
    stars: state.rewards.stars + EXAM_BONUS_STARS,
    totalStars: state.rewards.totalStars + EXAM_BONUS_STARS,
  };
  return {
    state: { ...state, exams: { passed, attempts }, rewards },
    reward: EXAM_BONUS_STARS,
  };
}
