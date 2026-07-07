// referral.js — Vrienden uitnodigen voor MUNTEN (geen echt geld). Beide kanten winnen.
//
// EERLIJKE GRENZEN (zie REVENUE.md + ontwerpnotitie): echte fraudebestendige attributie
// vereist een server (device-fingerprint, IP-cooldown, multi-account-detectie). Typcoon
// is lokaal, dus dit is BALANS-beveiliging, geen fraudebeveiliging — en dat mag, want
// munten zijn single-player en kunnen de €19,99-unlock NIET kopen. Het ergste "misbruik"
// is dus een kind dat zijn eigen fabriek valsspeelt: geen externe schade, geen
// omzetlek. De echte anti-abuse (server-verificatie) hoort op de SERVER-SEAM hieronder.
//
// Guardrails die we WEL lokaal bouwen (tegen triviaal grinden + balansverstoring):
//  - milestone-gate: de referrer wordt pas beloond als de vriend écht speelt (5 letters);
//  - checksum op de bedankcode (stopt willekeurig gokken);
//  - dedup op vriend-code + max 5 vrienden + aflopende beloning.

import { coinsPerSecond } from './economy.js';

const CODE_KEY = 'typcoon:friendcode'; // eigen, blijvende vriend-code (identiteit)
const SALT = 'tc1'; // client-side balans-salt (bewust geen fraude-geheim; zie boven)

export const WELCOME_BONUS = 250; // munten voor de uitgenodigde nieuwe speler
export const MAX_REFERRALS = 5; // max vrienden waarvoor de referrer wordt beloond
export const REFERRAL_MILESTONE_LETTERS = 5; // vriend moet 5 letters leren

// Eigen blijvende vriend-code (overleeft "opnieuw beginnen" — het is je identiteit).
export function ownCode() {
  try {
    let c = localStorage.getItem(CODE_KEY);
    if (!c) { c = randomCode(); localStorage.setItem(CODE_KEY, c); }
    return c;
  } catch { return randomCode(); }
}

function randomCode() {
  // 6 tekens base36, hoofdletters — leesbaar voor kinderen (geen 0/O/1/I verwarring)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

function checksum(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (h % 1296).toString(36).toUpperCase().padStart(2, '0');
}

// De bedankcode die de vriend (uitgenodigde) laat zien nadat hij de mijlpaal haalt.
// Bevat de code van de referrer + de eigen vriend-code (nonce, voor dedup) + checksum.
export function makeThanksToken(referrerCode, friendCode) {
  return `${referrerCode}-${friendCode}-${checksum(referrerCode + friendCode + SALT)}`;
}

// Valideer een ingevoerde bedankcode aan de kant van de referrer.
// Geeft { ok, friend } terug. `claimed` = al eerder beloonde vriend-codes (dedup).
export function validateThanks(token, myCode, claimed = []) {
  const parts = String(token || '').trim().toUpperCase().split('-');
  if (parts.length !== 3) return { ok: false };
  const [refCode, friend, sum] = parts;
  if (refCode !== myCode) return { ok: false }; // niet voor jou bedoeld
  if (checksum(refCode + friend + SALT) !== sum) return { ok: false }; // ongeldige code
  if (claimed.includes(friend)) return { ok: false }; // deze vriend al beloond
  return { ok: true, friend };
}

// Beloning voor de referrer: geschaald op de eigen productie (meaningful in elke fase),
// met een vloer voor beginners, aflopend per vriend, en gecapt.
export function referrerReward(tycoon, alreadyClaimed) {
  if (alreadyClaimed >= MAX_REFERRALS) return 0;
  const base = Math.max(200, Math.round(coinsPerSecond(tycoon) * 45));
  const diminish = Math.max(0.3, 1 - alreadyClaimed * 0.15); // 1 · .85 · .7 · .55 · .4
  return Math.round(base * diminish);
}

// Lees ?ref=CODE uit de URL (voor de uitgenodigde nieuwe speler).
export function readRefParam() {
  try {
    const p = new URLSearchParams(window.location.search).get('ref');
    return p ? p.trim().toUpperCase().slice(0, 8) : null;
  } catch { return null; }
}

// De deelbare uitnodigingslink.
export function inviteLink(code) {
  const base = (typeof window !== 'undefined' && window.location)
    ? `${window.location.origin}/speel/`
    : 'https://typcoon.com/speel/';
  return `${base}?ref=${code}`;
}

// === SERVER-SEAM ===
// Voor échte fraudebestendige attributie zou hier een aanroep staan naar een backend
// (anonieme id's, milestone-verificatie server-side, IP/device-cooldown, harde caps).
// Zolang Typcoon lokaal is, doen de bovenstaande balans-guardrails het werk.
