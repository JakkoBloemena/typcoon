// rewards.js — Gamification: sterren, unlocks en badges (zie GAMIFICATION.md).
// Taal-neutraal en PUUR. Beloningen zijn INFORMATIEF (vieren van meesterschap),
// nooit dwingend — ter bescherming van intrinsieke motivatie (overjustification).

import { activeLetters } from './curriculumCore.js';

export function newRewards() {
  return {
    stars: 0, // saldo (uitgeefbaar)
    totalStars: 0, // ooit verdiend (voor mijlpalen)
    perfects: 0, // aantal perfecte oefeningen
    unlocked: ['cheer-classic', 'theme-paars'], // standaard gratis
    equipped: { cheer: 'cheer-classic', theme: 'theme-paars', dance: null, scene: null },
    badges: [],
  };
}

// Winkel: te ontgrendelen met sterren. cost 0 = standaard/gratis.
export const SHOP = [
  { id: 'cheer-classic', type: 'cheer', cost: 0 },
  { id: 'cheer-fanfare', type: 'cheer', cost: 25 },
  { id: 'cheer-magie', type: 'cheer', cost: 50 },
  { id: 'cheer-disco', type: 'cheer', cost: 90 },
  { id: 'theme-paars', type: 'theme', cost: 0 },
  { id: 'theme-snoep', type: 'theme', cost: 60 },
  { id: 'theme-ruimte', type: 'theme', cost: 80 },   // donker, voor 10-12
  { id: 'theme-oceaan', type: 'theme', cost: 100 },  // diep teal aurora
  { id: 'theme-neon', type: 'theme', cost: 120 },    // premium, leest het oudst
  { id: 'theme-zon', type: 'theme', cost: 140 },     // warme ember/sunrise
  // dansjes (Typie danst bij het halen van het dagdoel)
  // 'Yeah!' bewust het goedkoopste item: een vroege, haalbare beloning om te sparen.
  { id: 'dance-yeah', type: 'dance', cost: 10 },
  { id: 'dance-easy', type: 'dance', cost: 60 },
  { id: 'dance-letsgo', type: 'dance', cost: 90 },
  { id: 'dance-whoohoo', type: 'dance', cost: 130 },
  // achtergronden (iets vrolijks dat rustig achter het oefenen zweeft)
  { id: 'scene-bubbels', type: 'scene', cost: 35 },  // zwevende gloed-bollen in themakleur
  { id: 'scene-aurora', type: 'scene', cost: 50 },   // traag drijvende aurora-vlakken
  { id: 'scene-ruimte', type: 'scene', cost: 65 },   // ruimte: sterren, planeten, raket
  { id: 'scene-neon', type: 'scene', cost: 90 },     // neon: gloeiende vormen, geen figuren
];

export function shopItem(id) {
  return SHOP.find((s) => s.id === id) || null;
}

// Goedkoopste te kopen item (voor de eenmalige "je kunt iets kopen"-hint).
export const CHEAPEST_UNLOCK = Math.min(...SHOP.filter((s) => s.cost > 0).map((s) => s.cost));

// Badges: informatieve mijlpalen. `check(state)` is puur over de engine-state.
export const BADGES = [
  { id: 'eerste-stap', icon: '👣', check: (s) => (s.sessions?.length || 0) >= 1 },
  { id: 'streak-3', icon: '🔥', check: (s) => (s.daily?.streakDagen || 0) >= 3 },
  { id: 'streak-7', icon: '⭐', check: (s) => (s.daily?.streakDagen || 0) >= 7 },
  { id: 'tien-letters', icon: '🔤', check: (s) => lettersGeleerd(s) >= 10 },
  { id: 'alle-letters', icon: '🏆', check: (s) => lettersGeleerd(s) >= 26 },
  { id: 'eerste-perfect', icon: '✨', check: (s) => (s.rewards?.perfects || 0) >= 1 },
  { id: 'ster-verzamelaar', icon: '🌟', check: (s) => (s.rewards?.totalStars || 0) >= 50 },
];

function lettersGeleerd(s) {
  return s.curriculum ? activeLetters(s.curriculum, s.profile.curriculumIndex).length : 0;
}

// Heeft het kind alle 26 letters geleerd? (kerncurriculum af → snelheid mag meetellen)
export function allLettersLearned(state) {
  return activeLetters(state.curriculum, state.profile.curriculumIndex).length >= 26;
}

// Sterren voor één afgeronde oefening (competentie-feedback op nauwkeurigheid).
// Onder de ondergrens = 0 sterren: rommelig/blind erop los typen wordt niet beloond
// (geen straf, gewoon geen beloning). De flow-governor houdt nette pogingen normaal
// ruim boven deze grens.
//
// Snelheid telt PAS mee als het hele alfabet geleerd is (§speed: nauwkeurigheid eerst),
// en alleen voor de DERDE ster: 1-2 sterren blijven puur op nauwkeurigheid, dus een
// langzaam-maar-netjes kind wordt nooit gestraft. Het snelheidsdoel is persoonlijk en
// meebewegend, zodat de derde ster altijd haalbaar blijft.
export function starsForExercise(accuracy, opts = {}) {
  let s = accuracy >= 0.95 ? 3 : accuracy >= 0.8 ? 2 : accuracy >= 0.6 ? 1 : 0;
  if (s === 3 && opts.speedCounts && opts.kpm < opts.speedTarget) s = 2;
  return s;
}

// Pas de beloning van een afgeronde oefening toe + check nieuwe badges.
// `kpm` = toetsen/min van déze oefening; wordt gebruikt voor de snelheidsster.
export function applyExerciseRewards(state, accuracy, kpm = 0) {
  // meebewegend persoonlijk snelheidsgemiddelde (EMA) — basis voor het doel
  const prevAvg = state.speedAvg || 0;
  const speedAvg = prevAvg ? Math.round(0.7 * prevAvg + 0.3 * kpm) : kpm;
  const speedCounts = allLettersLearned(state) && prevAvg > 0; // pas met een basislijn
  const speedTarget = Math.round(0.85 * prevAvg);

  const earned = starsForExercise(accuracy, { speedCounts, kpm, speedTarget });
  const perfect = earned === 3;
  const base = state.rewards || newRewards();
  const rewards = {
    ...base,
    stars: base.stars + earned,
    totalStars: base.totalStars + earned,
    perfects: base.perfects + (perfect ? 1 : 0),
  };
  let next = { ...state, rewards, speedAvg };
  const newBadges = pendingBadges(next);
  if (newBadges.length) {
    next = { ...next, rewards: { ...rewards, badges: [...rewards.badges, ...newBadges] } };
  }
  // is dit het allereerste moment dat snelheid meetelt? (voor een eenmalige uitleg)
  const speedNowCounts = allLettersLearned(state) && prevAvg === 0 && kpm > 0;
  return { state: next, earnedStars: earned, perfect, newBadges, speedCounts, speedNowCounts };
}

// Nog niet-verdiende badges waarvan de voorwaarde nu waar is.
export function pendingBadges(state) {
  const have = new Set(state.rewards?.badges || []);
  return BADGES.filter((b) => !have.has(b.id) && b.check(state)).map((b) => b.id);
}

// Ontgrendel een winkelitem met sterren.
export function buyUnlock(state, id) {
  const item = shopItem(id);
  const r = state.rewards;
  if (!item || r.unlocked.includes(id) || r.stars < item.cost) return { state, ok: false };
  const rewards = { ...r, stars: r.stars - item.cost, unlocked: [...r.unlocked, id] };
  return { state: { ...state, rewards }, ok: true };
}

// Zet een ontgrendeld item aan (cheer of thema).
export function equipItem(state, id) {
  const item = shopItem(id);
  const r = state.rewards;
  if (!item || !r.unlocked.includes(id)) return state;
  return { ...state, rewards: { ...r, equipped: { ...r.equipped, [item.type]: id } } };
}
