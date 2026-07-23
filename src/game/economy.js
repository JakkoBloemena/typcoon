// economy.js — PURE, taal-neutrale economie van Typcoon.
//
// Kernidee: typen is de ENIGE muntfaucet. Munten ontstaan (1) direct bij elke
// afgeronde oefening — nauwkeurigheid is de multiplier — en (2) via machines die je
// met munten koopt en die ALLEEN produceren terwijl het kind actief typt. Geen
// idle/offline winst: een auto-typer die rommel typt haalt lage nauwkeurigheid en
// mint bijna niets — de cheat is nutteloos van constructie. Nauwkeurigheid loont
// steil boven 95%, zodat de min-maxer meesterschap najaagt (nauwkeurigheid eerst,
// snelheid later — dat is ook de juiste didactiek).
//
// De verslavings-lagen komen uit wat idle/tycoon-games aantoonbaar laat werken,
// zonder het leren te ondermijnen (zie DESIGN.md):
//  - machine-MIJLPALEN: op level 10/25/50 verdubbelt het tempo van die machine
//  - GOUDEN oefeningen: af en toe is een oefening 3x waard (variabele beloning)
//  - COMBO: lange foutloze reeksen geven een bonus-multiplier (directe feedback)
//  - REBIRTH/prestige: verkoop je fabriek voor een permanente multiplier — de
//    leer-voortgang (geleerde letters) reset NOOIT, alleen de economie.

import { applyExamResult, EXAMS } from '../engine/exams.js';
import { dayKey } from '../engine/dailyGoal.js';

// Munten per afgeronde oefening vóór alle multipliers.
export const BASE_PER_EXERCISE = 10;

// Kans dat een oefening "goud" is (variabele beloning) en de bijbehorende bonus.
export const GOLDEN_CHANCE = 0.12;
export const GOLDEN_MULT = 3;

// Machine-mijlpalen: bij het bereiken van deze levels verdubbelt het tempo.
export const MILESTONE_LEVELS = [10, 25, 50];

// Rebirth: verkoopprijs van je fabriek (in déze run verdiende munten) en de
// permanente bonus per ster. Elke volgende rebirth kost 4x zoveel.
export const REBIRTH_BASE_COST = 25000;
export const REBIRTH_BONUS = 0.25; // +25% per ster, op alles

export function newTycoon() {
  return {
    coins: 0, // saldo (uitgeefbaar); intern float, tonen = Math.floor
    totalCoins: 0, // in deze run verdiend (rebirth-voortgang)
    lifetimeCoins: 0, // ooit verdiend, over alle rebirths heen (mijlpalen)
    buildings: {}, // id -> level (0/afwezig = niet gekocht)
    upgrades: [], // gekochte upgrade-id's (resetten bij rebirth)
    rebirths: 0, // aantal sterren (permanente multiplier)
    exercisesDone: 0,
    goldenDone: 0, // aantal gouden oefeningen gepakt
    bestCombo: 0, // langste foutloze reeks ooit
    totalKeys: 0, // alle aanslagen ooit (voor ouder-dashboard: nauwkeurigheid)
    correctKeys: 0, // correcte aanslagen ooit
    streak: 0, // dagelijkse terugkeer-streak (zie daily.js)
    lastDay: null, // laatste speeldag (YYYY-MM-DD, lokaal)
    boostLeft: 0, // resterende opdrachten met de dag-opwarmboost
    referredBy: null, // vriend-code die deze speler uitnodigde (zie referral.js)
    welcomeClaimed: false, // welkomstbonus al toegekend?
    thanksShown: false, // bedankcode al aan de vriend getoond na de mijlpaal?
    refClaims: [], // vriend-codes die deze speler als referrer heeft beloond (dedup/cap)
    weekly: null, // deze week: { key, coins, exercises, combo } (zie weekly.js)
    lastWeekly: null, // vorige week (voor "versla jezelf")
    records: { bestWeekCoins: 0, longestStreak: 0 }, // all-time records
    badges: [], // behaalde prestatie-id's (zie achievements.js)
    certificates: {}, // examId -> { accuracy, kpm, date } — diploma-bewijs (assignment 050)
    freeCapPaywallShown: false, // gratis-plafond-paywall al één keer getoond? (zie premium.js applyFreeCapGuard, §058)
  };
}

// Nauwkeurigheid -> multiplier. Onder de vloer betaalt typen ~niets (rommelig of
// blind erop los typen wordt niet beloond — geen straf, gewoon geen munt). Boven
// 0.95 stijgt de beloning steil: meesterschap is de grootste hefboom.
//   < 0.60           -> 0     (betaalt niet)
//   0.60 .. 0.95     -> 0.5x .. 1.5x   (lineair)
//   0.95 .. 1.00     -> 1.5x .. 3.0x   (steil)
export function accuracyMultiplier(acc) {
  if (acc < 0.6) return 0;
  if (acc < 0.95) return 0.5 + ((acc - 0.6) / 0.35) * 1.0;
  return 1.5 + ((acc - 0.95) / 0.05) * 1.5;
}

// Combo -> multiplier: elke 10 foutloze aanslagen op rij +10%, tot +50%.
// Directe, hoogfrequente feedback op precisie — de leer-versneller.
export function comboMultiplier(bestStreak) {
  return 1 + Math.min(Math.floor((bestStreak || 0) / 10), 5) * 0.1;
}

// Permanente rebirth-bonus (geldt voor uitbetaling ÉN productie).
export function prestigeMultiplier(tycoon) {
  return 1 + (tycoon.rebirths || 0) * REBIRTH_BONUS;
}

// Machines (thema-neutraal: alleen id's; namen/skins in strings.js). `unlockAt` =
// aantal geleerde letters waarop de machine beschikbaar komt → het leercurriculum
// wordt zo de tech-tree (nieuwe letters = nieuwe machines).
export const BUILDINGS = [
  { id: 'typewriter', icon: '⌨️', baseCost: 15, costGrowth: 1.15, rate: 1, unlockAt: 0 },
  { id: 'printer', icon: '🖨️', baseCost: 100, costGrowth: 1.15, rate: 6, unlockAt: 5 },
  { id: 'robotarm', icon: '🦾', baseCost: 600, costGrowth: 1.15, rate: 28, unlockAt: 10 },
  { id: 'assembly', icon: '🏗️', baseCost: 3000, costGrowth: 1.15, rate: 130, unlockAt: 18 },
  { id: 'megafab', icon: '🏭', baseCost: 16000, costGrowth: 1.15, rate: 620, unlockAt: 26 },
];

export function buildingDef(id) {
  return BUILDINGS.find((b) => b.id === id) || null;
}

// Eenmalige upgrades. kind 'prod' = vermenigvuldigt munten/sec van álle machines;
// kind 'payout' = vermenigvuldigt de munt-uitbetaling per oefening (loont typen zelf).
export const UPGRADES = [
  { id: 'oil', icon: '🛢️', kind: 'prod', mult: 1.5, cost: 250 },
  { id: 'precision', icon: '🔧', kind: 'payout', mult: 2, cost: 400 },
  { id: 'turbo', icon: '🚀', kind: 'prod', mult: 2, cost: 1500 },
  { id: 'golden', icon: '✨', kind: 'payout', mult: 2, cost: 2500 },
];

export function upgradeDef(id) {
  return UPGRADES.find((u) => u.id === id) || null;
}

function ownedMult(tycoon, kind) {
  return (tycoon.upgrades || []).reduce((m, id) => {
    const u = upgradeDef(id);
    return u && u.kind === kind ? m * u.mult : m;
  }, 1);
}

export const prodMultiplier = (tycoon) => ownedMult(tycoon, 'prod');
export const payoutMultiplier = (tycoon) => ownedMult(tycoon, 'payout');

// Mijlpaal-multiplier van één machine: elke bereikte mijlpaal verdubbelt het tempo.
export function milestoneMultiplier(level) {
  return Math.pow(2, MILESTONE_LEVELS.filter((m) => level >= m).length);
}

// Eerstvolgende mijlpaal boven dit level (null = alles bereikt) — voor de UI-teaser
// "nog N levels tot ×2".
export function nextMilestone(level) {
  return MILESTONE_LEVELS.find((m) => level < m) ?? null;
}

// Kosten om een machine van niveau L naar L+1 te tillen.
export function buildingCost(id, level) {
  const def = buildingDef(id);
  if (!def) return Infinity;
  return Math.floor(def.baseCost * Math.pow(def.costGrowth, level));
}

export function buildingUnlocked(id, lettersLearned) {
  const def = buildingDef(id);
  return !!def && lettersLearned >= def.unlockAt;
}

// Munten per seconde uit álle machines (× mijlpalen × prod-upgrades × rebirth).
// Accrueert alleen terwijl het kind typt (zie tick) — nooit idle.
export function coinsPerSecond(tycoon) {
  const raw = BUILDINGS.reduce((sum, b) => {
    const level = tycoon.buildings[b.id] || 0;
    return sum + level * b.rate * milestoneMultiplier(level);
  }, 0);
  return raw * prodMultiplier(tycoon) * prestigeMultiplier(tycoon);
}

// Munt-uitbetaling voor één afgeronde oefening.
// opts: { golden, bestStreak, dailyBoost } — gouden oefening, langste foutloze reeks
// erin, en de dagelijkse opwarm-boost (×1 als niet actief).
export function payoutForExercise(accuracy, tycoon, opts = {}) {
  const golden = opts.golden ? GOLDEN_MULT : 1;
  return Math.round(
    BASE_PER_EXERCISE *
      accuracyMultiplier(accuracy) *
      payoutMultiplier(tycoon) *
      prestigeMultiplier(tycoon) *
      comboMultiplier(opts.bestStreak) *
      golden *
      (opts.dailyBoost || 1),
  );
}

// --- Mutaties (puur: geven een nieuwe tycoon-state terug) ---

// Ken de opbrengst van een afgeronde oefening toe.
export function earnFromExercise(tycoon, accuracy, opts = {}) {
  const gained = payoutForExercise(accuracy, tycoon, opts);
  return {
    tycoon: {
      ...tycoon,
      coins: tycoon.coins + gained,
      totalCoins: tycoon.totalCoins + gained,
      lifetimeCoins: (tycoon.lifetimeCoins || 0) + gained,
      exercisesDone: tycoon.exercisesDone + 1,
      goldenDone: (tycoon.goldenDone || 0) + (opts.golden ? 1 : 0),
      bestCombo: Math.max(tycoon.bestCombo || 0, opts.bestStreak || 0),
    },
    gained,
  };
}

// Laat de machines `dtSec` seconden produceren (alleen aanroepen terwijl er getypt wordt).
export function tick(tycoon, dtSec) {
  const gained = coinsPerSecond(tycoon) * dtSec;
  if (gained <= 0) return tycoon;
  return {
    ...tycoon,
    coins: tycoon.coins + gained,
    totalCoins: tycoon.totalCoins + gained,
    lifetimeCoins: (tycoon.lifetimeCoins || 0) + gained,
  };
}

// Koop één niveau van een machine (UI bewaakt de ontgrendeling; hier alleen kosten).
// `milestone` in het resultaat = zojuist bereikte mijlpaal (voor een vier-moment).
export function buyBuilding(tycoon, id) {
  const level = tycoon.buildings[id] || 0;
  const cost = buildingCost(id, level);
  if (tycoon.coins < cost) return { tycoon, ok: false, cost };
  const newLevel = level + 1;
  return {
    tycoon: { ...tycoon, coins: tycoon.coins - cost, buildings: { ...tycoon.buildings, [id]: newLevel } },
    ok: true,
    cost,
    milestone: MILESTONE_LEVELS.includes(newLevel) ? newLevel : null,
  };
}

// Koop een eenmalige upgrade.
export function buyUpgrade(tycoon, id) {
  const def = upgradeDef(id);
  if (!def || (tycoon.upgrades || []).includes(id) || tycoon.coins < def.cost) {
    return { tycoon, ok: false };
  }
  return {
    tycoon: { ...tycoon, coins: tycoon.coins - def.cost, upgrades: [...tycoon.upgrades, id] },
    ok: true,
  };
}

// --- Rebirth (prestige) ---

// Verkoopprijs van de fabriek voor rebirth n -> n+1.
export function rebirthCost(rebirths) {
  return REBIRTH_BASE_COST * Math.pow(4, rebirths || 0);
}

export function canRebirth(tycoon) {
  return tycoon.totalCoins >= rebirthCost(tycoon.rebirths);
}

// Verkoop de fabriek: economie reset, +1 ster (permanente multiplier). Mijlpaal-
// tellers (lifetimeCoins, bestCombo, badges, goldenDone) blijven staan. De
// LEER-voortgang leeft in de engine-state en wordt hier bewust niet aangeraakt.
export function rebirth(tycoon) {
  if (!canRebirth(tycoon)) return { tycoon, ok: false };
  return {
    tycoon: {
      ...tycoon,
      coins: 0,
      totalCoins: 0,
      buildings: {},
      upgrades: [],
      rebirths: (tycoon.rebirths || 0) + 1,
    },
    ok: true,
  };
}

// --- Toets-diploma's: beloning in TYPCOON's eigen economie (assignment 049) ---
//
// exams.js komt uit de gedeelde (taal-neutrale) engine en kent van zichzelf een
// muntbeloning toe via typie's `state.rewards.stars` — een sterrenlaag die Typcoon
// niet gebruikt (zie decisions/009). Deze wrapper neemt uit het engine-resultaat
// ALLEEN de toets-boekhouding (`exams.passed`/`attempts`) over en beloont een
// geslaagde toets in Typcoon's eigen munteconomie; `state.rewards` wordt hier
// bewust nooit aangeraakt.
export const EXAM_COIN_REWARD = {
  'exam-1': 150,
  'exam-2': 300,
  'exam-3': 450,
  'exam-4': 600,
  'exam-final': 1000,
};

export function examReward(examId) {
  return EXAM_COIN_REWARD[examId] || 0;
}

// Verwerk een afgelegde toets in de spel-state. Bij slagen: munten (geen straf,
// geen beloning bij zakken — vier-moment of gerust "nog een keer", nooit gating).
// `accuracy`/`kpm` zijn optioneel: als de aanroeper ze meegeeft (het echte, gemeten
// resultaat van déze poging — nooit verzonnen) bewaren we ze als het diploma-
// certificaat voor de ouder-dashboard-proof (assignment 050). Idempotent net als de
// engine: een herhaalde pass op een al-gehaalde toets overschrijft het certificaat
// niet (reward blijft 0, dus de `if (reward > 0)`-tak hieronder wordt overgeslagen).
export function applyTypcoonExamResult(state, exam, pass, accuracy = null, kpm = null, now = Date.now()) {
  // de engine geeft zelf al aan of dit een VERSE pass is (0 bij een fail én bij een
  // herhaalde pass van een al-gehaalde toets — idempotent, zie exams.test.js).
  const { state: examState, reward: engineReward } = applyExamResult(state, exam, pass);
  let next = { ...state, exams: examState.exams };
  const reward = engineReward > 0 ? examReward(exam.id) : 0;
  if (reward > 0) {
    next = {
      ...next,
      tycoon: {
        ...next.tycoon,
        coins: next.tycoon.coins + reward,
        totalCoins: next.tycoon.totalCoins + reward,
        lifetimeCoins: (next.tycoon.lifetimeCoins || 0) + reward,
        certificates: accuracy == null ? next.tycoon.certificates : {
          ...next.tycoon.certificates,
          [exam.id]: { accuracy, kpm, date: dayKey(now) },
        },
      },
    };
  }
  return { state: next, reward };
}

// Diploma-bewijs voor het ouder-dashboard (assignment 050): welke toetsen zijn
// gehaald, en met welke écht-gemeten nauwkeurigheid. Een toets die vóór deze
// assignment gehaald is heeft geen bewaard certificaat — dan geven we `accuracy:
// null` terug in plaats van een verzonnen percentage (§geen invented numbers).
export function earnedCertificates(state) {
  const passed = state.exams?.passed || [];
  const certs = state.tycoon?.certificates || {};
  return EXAMS.filter((e) => passed.includes(e.id)).map((e) => ({
    id: e.id,
    icon: e.icon,
    accuracy: certs[e.id]?.accuracy ?? null,
    date: certs[e.id]?.date ?? null,
  }));
}
