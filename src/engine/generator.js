// generator.js — De oefening-generator (§7).
// PURE en TAAL-NEUTRAAL: de generator importeert NOOIT uit /locales. Het actieve
// taalpakket (bigramtabel + basisfrequenties + woorden) komt als parameter binnen.
//
// Fase 7: naast pseudo-woorden mengt de generator nu echte woorden (frequentie-
// gewogen) en oefent hij de curriculum-staart — leestekens, cijfers, accenten en
// (zodra Shift ontgrendeld is) hoofdletters. Elke typbare actieve toets MOET
// voorkomen, anders kan de promotie-poort (§5.4) nooit voldaan worden.

import { activeLetters, activeSymbols, shiftUnlocked } from './curriculumCore.js';
import { rollingAccuracy } from './difficulty.js';
import { dueItems } from './srs.js';
import { weakestBigram } from './bigramModel.js';

const REALWORD_MIN_LETTERS = 7; // home row compleet (a-s-d-f...) → eerste echte woordjes

// Kleine deterministische helpers ---------------------------------------------

function pickWeighted(entries, rng) {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  if (total <= 0) return entries.length ? entries[0][0] : null;
  let r = rng() * total;
  for (const [value, w] of entries) {
    r -= w;
    if (r <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

function confOf(keyStats, ch) {
  const k = /^[A-Z]$/.test(ch) ? ch.toLowerCase() : ch; // hoofdletters vallen onder kleine letter
  return keyStats[k]?.confidence ?? 0;
}

function capitalizeFirst(token) {
  return token.replace(/[a-z]/, (c) => c.toUpperCase());
}

// Zwakte-gewicht per letter (§5.3): zwakker → vaker, met ondergrens.
function letterWeights(letters, keyStats, baseFreq, k = 3) {
  const w = {};
  for (const L of letters) {
    const base = baseFreq[L] ?? 0.5;
    w[L] = base * (1 + k * (1 - (keyStats[L]?.confidence ?? 0)));
  }
  return w;
}

// Bouw één uitspreekbaar pseudo-woord via een bigram-Markov over de doeltaal.
function buildWord(len, letters, weights, bigrams, rng) {
  const set = new Set(letters);
  let cur = pickWeighted(letters.map((L) => [L, weights[L]]), rng);
  const out = [cur];
  for (let i = 1; i < len; i++) {
    const trans = bigrams[cur] || {};
    const entries = letters.map((L) => {
      const langProb = set.has(L) ? (trans[L] ?? 0.02) : 0;
      return [L, langProb * weights[L]];
    });
    cur = pickWeighted(entries, rng) || cur;
    out.push(cur);
  }
  return out.join('');
}

// Rijtje uit sterke (beheerste) letters — voor open/sluit en als drager van symbolen.
function easyWord(len, letters, keyStats, bigrams, rng) {
  const strong = letters.filter((L) => (keyStats[L]?.confidence ?? 0) >= 0.6);
  const pool = strong.length >= 2 ? strong : letters;
  const flat = Object.fromEntries(pool.map((L) => [L, 1]));
  return buildWord(Math.max(2, len), pool, flat, bigrams, rng);
}

// Echte woorden, frequentie-gewogen (lijst staat vooraan = vaakst), gefilterd op
// de actieve lettersset zodat alles typbaar is.
function pickRealWord(words, letters, rng) {
  const set = new Set(letters);
  const ok = words.filter((w) => w.length >= 2 && [...w].every((c) => set.has(c)));
  if (ok.length === 0) return null;
  // bias naar voren (hoogfrequent): pow > 1 trekt de index richting 0
  const idx = Math.floor(Math.pow(rng(), 1.7) * ok.length);
  return ok[idx];
}

// Kies een grappig zinnetje dat volledig uit de actieve set typbaar is (kleine letters
// + spaties). Geen letter actief? Dan null en valt de generator terug op losse woorden.
function pickSentence(sentences, activeSet, rng) {
  if (!Array.isArray(sentences) || sentences.length === 0) return null;
  const ok = sentences.filter((s) => [...s].every((c) => c === ' ' || activeSet.has(c)));
  if (ok.length === 0) return null;
  return ok[Math.floor(rng() * ok.length)];
}

// --- Staart: symbolen, cijfers, accenten -------------------------------------

function numberToken(activeDigits, rng) {
  const len = 2 + Math.floor(rng() * 3); // 2..4 cijfers
  let s = '';
  for (let i = 0; i < len; i++) s += activeDigits[Math.floor(rng() * activeDigits.length)];
  return s;
}

// Een korte oefen-token die het gegeven symbool bevat, gedragen door sterke letters.
function symbolDrill(sym, letters, symbols, keyStats, bigrams, rng) {
  if (/^[0-9]$/.test(sym)) {
    const digits = symbols.filter((s) => /^[0-9]$/.test(s));
    return numberToken(digits.length ? digits : [sym], rng);
  }
  const base = easyWord(2 + Math.floor(rng() * 2), letters, keyStats, bigrams, rng);
  switch (sym) {
    case ';':
      return base + ';';
    case '.':
    case ',':
    case '?':
    case '!':
      return base + sym;
    case "'":
      return "'" + base; // bv. 't, 'n
    case '-':
      return base + '-' + easyWord(2, letters, keyStats, bigrams, rng);
    default:
      // accenten (é ë ï ó) en overige: zet het teken middenin een kort woordje
      return base[0] + sym + base.slice(1);
  }
}

// Zet 2-3 tokens om in een mini-zin: hoofdletter (als Shift aan), komma, eindteken.
function assembleSentence(tokens, shift, symbols, rng) {
  const parts = tokens.slice(0, 2 + Math.floor(rng() * 2));
  let s = parts.join(' ');
  if (symbols.includes(',') && parts.length >= 2 && rng() < 0.5) {
    // komma na het eerste woord
    s = s.replace(' ', ', ');
  }
  let end = '.';
  if (symbols.includes('?') && rng() < 0.25) end = '?';
  else if (symbols.includes('!') && rng() < 0.2) end = '!';
  s += end;
  if (shift) s = capitalizeFirst(s);
  return s;
}

// Drill-token voor een due SRS-element ("key:x", "key:.", "bigram:xy").
function srsDrill(el, letters, symbols, keyStats, bigrams, rng) {
  if (el.length === 1 && (symbols.includes(el) || /^[0-9]$/.test(el))) {
    return symbolDrill(el, letters, symbols, keyStats, bigrams, rng);
  }
  return (el + ' ').repeat(2).trim();
}

/**
 * generateExercise(state, localePack, layout, rng) -> { text, words, speedTargets, meta }
 */
export function generateExercise(state, localePack, layout, rng = Math.random) {
  const { profile, keyStats, bigramStats, srsItems, governor, curriculum } = state;
  const idx = profile.curriculumIndex;
  const letters = activeLetters(curriculum, idx);
  const symbols = activeSymbols(curriculum, idx);
  const shift = shiftUnlocked(curriculum, idx);
  const activeSet = new Set([...letters, ...symbols]);

  // Veiligheid: bij minder dan 2 letters kunnen we geen woorden bouwen.
  if (letters.length < 2) {
    const text = (letters.join(' ').repeat(6).trim() || letters[0] || 'f');
    return {
      text,
      words: text.split(' '),
      speedTargets: speedTargetsFor(text, keyStats, governor),
      meta: { reason: 'warmup-single', letters, symbols, due: [], focusBigram: null },
    };
  }

  const weights = letterWeights(letters, keyStats, localePack.baseFreq);
  const bigrams = localePack.bigrams;
  const wordLen = governor.wordLen;
  const realWordsOn = localePack.words && letters.length >= REALWORD_MIN_LETTERS;

  // Oefeninglengte groeit mee met de vaardigheid: een beginner krijgt heel korte
  // oefeningen (niet ontmoedigend), een gevorderde wat langere. `confidence` bevat
  // al zowel nauwkeurigheid als snelheid (§5.2), dus dit schaalt ook met tempo.
  const avgConf = letters.reduce((s, L) => s + (keyStats[L]?.confidence ?? 0), 0) / letters.length;
  const coreTokens = Math.round(3 + avgConf * 3); // 3 (beginner) .. 6 (gevorderd)
  const realIdx = Math.floor(coreTokens / 2);
  const words = [];

  // KORTE oefening (zie GAMIFICATION.md): een handvol tokens met een duidelijk
  // "klaar!" per keer. Symbolen/echte woorden/zinnen rouleren over oefeningen heen,
  // i.p.v. alles in één lange rij te proppen.

  // 1) Open makkelijk (§7.1 stap 8)
  words.push(easyWord(wordLen - 1, letters, keyStats, bigrams, rng));

  // 2) Korte kern: tokens schalen met vaardigheid — pseudo-woorden, soms een echt woord
  const due = dueItems(srsItems);
  for (let i = 0; i < coreTokens; i++) {
    // echte woorden zijn nu vanaf de home row zichtbaar en komen op meer plekken voor;
    // pseudo-woorden blijven de ruggengraat (gericht op de zwakke letters).
    const wantReal = realWordsOn && (i === realIdx ? rng() < 0.8 : rng() < 0.25);
    if (wantReal) {
      const rw = pickRealWord(localePack.words, letters, rng);
      if (rw) { words.push(rw); continue; }
    }
    const len = wordLen + (rng() < 0.25 ? 1 : 0);
    words.push(buildWord(len, letters, weights, bigrams, rng));
  }

  // 3) Eén due SRS-item (zwakste) erbij zodat herhaling beklijft (§5.5)
  const dueEl = due
    .map((it) => it.itemId.split(':')[1])
    .find((el) => el && [...el].every((c) => activeSet.has(c)));
  if (dueEl) words.push(srsDrill(dueEl, letters, symbols, keyStats, bigrams, rng));

  // 4) Soms een focus-burst op het zwakste paar, langzaam→snel (§2.5)
  const focus = weakestBigram(bigramStats);
  if (focus && rng() < 0.5 && [...focus.pair].every((c) => letters.includes(c))) {
    words.push((focus.pair + ' ').repeat(2).trim());
  }

  // 5) Staart: rouleer 1 (soms 2) actieve symbolen, zwakte-gewogen → alles komt langs
  if (symbols.length > 0) {
    const symWeights = symbols.map((s) => [s, 1 + 2 * (1 - confOf(keyStats, s))]);
    const picks = new Set([pickWeighted(symWeights, rng)]);
    if (rng() < 0.35) picks.add(pickWeighted(symWeights, rng));
    for (const s of picks) if (s) words.push(symbolDrill(s, letters, symbols, keyStats, bigrams, rng));
  }

  // 5b) Grappig zinnetje zodra het volledig typbaar is (anders 2-3 echte woorden aan
  // elkaar). Hoofdletter + punt worden vanzelf toegevoegd zodra Shift/leestekens er zijn.
  if (realWordsOn && rng() < 0.35) {
    const sent = pickSentence(localePack.sentences, activeSet, rng);
    if (sent) {
      let s = shift ? capitalizeFirst(sent) : sent;
      if (symbols.includes('.')) s += '.';
      words.push(s);
    } else {
      const sw = [...new Set([0, 1, 2].map(() => pickRealWord(localePack.words, letters, rng)).filter(Boolean))];
      if (sw.length >= 2) words.push(assembleSentence(sw, shift, symbols, rng));
    }
  }

  // 6) Hoofdletters: kapitaliseer een deel van de gewone woorden (§3.1 stage 16)
  if (shift) {
    for (let i = 0; i < words.length; i++) {
      if (/^[a-z]+$/.test(words[i]) && rng() < 0.3) {
        words[i] = capitalizeFirst(words[i]);
      }
    }
  }

  // 7) Sluit makkelijk → laatste indruk = succes (§6 vangrail)
  words.push(easyWord(wordLen - 1, letters, keyStats, bigrams, rng));

  const text = words.join(' ');
  return {
    text,
    words,
    speedTargets: speedTargetsFor(text, keyStats, governor),
    meta: {
      reason: 'core',
      letters,
      symbols,
      shift,
      realWords: realWordsOn,
      due: due.map((d) => d.itemId),
      focusBigram: focus?.pair ?? null,
      governorState: governor.state,
      rollingAcc: rollingAccuracy(governor),
      layout: layout?.id ?? null,
    },
  };
}

// Woorden uit BEHEERSTE letters voor de mini-games (Word Rain): herkenbaar en haalbaar,
// nooit een gloednieuwe letter onder tijdsdruk. Mix echt woord + makkelijk pseudo-woord.
// Pure functie (geen UI). Zo blijven de mini-games "spelen met wat je al kent".
export function masteredWords(state, localePack, count = 14, rng = Math.random) {
  const letters = activeLetters(state.curriculum, state.profile.curriculumIndex);
  const keyStats = state.keyStats || {};
  const strong = letters.filter((L) => (keyStats[L]?.confidence ?? 0) >= 0.55);
  const pool = strong.length >= 3 ? strong : letters;
  const bigrams = localePack.bigrams || {};
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 6) {
    let w = null;
    if (localePack.words && rng() < 0.55) w = pickRealWord(localePack.words, pool, rng);
    if (!w) w = easyWord(2 + Math.floor(rng() * 3), pool, keyStats, bigrams, rng);
    if (w && w.length >= 2) out.push(w);
  }
  return out;
}

// Per-element snelheidsdoel (§7.3): nieuw/zwak = ruim doel, sterk = scherper.
// Hoofdletters delen het doel van hun kleine letter.
function speedTargetsFor(text, keyStats, governor) {
  const targets = {};
  for (const ch of new Set(text.replace(/\s/g, ''))) {
    const conf = confOf(keyStats, ch);
    const slack = (1 - conf) * 400;
    targets[ch] = Math.round(governor.speedTargetMs + slack);
  }
  return targets;
}
