// 102-gen-nearcap-save.mjs — QA helper (assignment 102 verification): builds a
// synthetic save that is ONE real promotion away from crossing the free-letter
// cap (10), using the actual engine functions (same technique as
// gen-exam-save.mjs's "near-ready"/"ready" modes: only as fake as "a lot of
// practice happened" — the promotion itself still fires live in the browser).
//
// Core curriculum stages 1-5 give 9 active letters (f j d k s l a g h, plus the
// non-letter ';'). Stage 6 adds e+i, landing on 11 — crossing FREE_LETTER_CAP
// (10) in one promotion, which is exactly the applyFreeCapGuard rollback +
// paywall trigger this assignment's repro path needs. Seeding every gating key
// at stage-5 to full confidence means the NEXT real exercise completed in the
// browser promotes live, fires the chapter-1 paywall, and reaches the offer
// screen — without grinding ~40-60 real exercises through Playwright.
//
// Not part of the shipped product; scratch tool, not committed to src.
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { gatingKeys } from '../src/engine/curriculumCore.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

const NEAR_CAP_INDEX = 5; // stage 1-5 -> 9 active letters (cap is 10)

const profile = newProfile({ naam: 'Sanne' });
profile.curriculumIndex = NEAR_CAP_INDEX;
profile.onboardingGezien = true;

let state = newState(profile, nlPack.curriculumTail);
const gating = gatingKeys(state.curriculum, profile.curriculumIndex);
const keyStats = { ...state.keyStats };
for (const k of gating) keyStats[k] = { ...(keyStats[k] || { key: k }), confidence: 1, reps: 60, accuracy: 1 };
state = { ...state, keyStats };

const tycoon = {
  coins: 300, totalCoins: 300, lifetimeCoins: 300, buildings: {}, upgrades: [],
  rebirths: 0, exercisesDone: 5, goldenDone: 0, bestCombo: 0, totalKeys: 0, correctKeys: 0,
  streak: 1, lastDay: dayKey(), boostLeft: 0, referredBy: null, welcomeClaimed: false,
  thanksShown: false, refClaims: [], weekly: null, lastWeekly: null,
  records: { bestWeekCoins: 0, longestStreak: 0 }, badges: [],
  freeCapPaywallShown: false,
};

const { curriculum, ...persisted } = { ...state, tycoon };
console.log(JSON.stringify(persisted));
