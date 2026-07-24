// 102-tester-gen-nearcap-save.mjs — Tester's independent copy of the near-cap
// save seeder for assignment 102 verification. Same "near-ready" technique the
// developer used (seed via real engine functions at curriculumIndex 5, so the
// very next completed exercise crosses FREE_LETTER_CAP live) — reproduced
// independently by the tester in this worktree (v102) rather than trusting the
// developer's script. Not part of the shipped product; scratch tool.
import { newProfile } from '../src/engine/profile.js';
import { newState } from '../src/engine/index.js';
import { gatingKeys } from '../src/engine/curriculumCore.js';
import { dayKey } from '../src/engine/dailyGoal.js';
import nlPack from '../src/data/nl/index.js';

const NEAR_CAP_INDEX = 5; // stage 1-5 -> 9 active letters (cap is 10)

const profile = newProfile({ naam: 'TesterKid' });
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
