// premium.js — Vrij/premium-scheiding en de (gesimuleerde) familie-unlock.
//
// Model (zie REVENUE.md): typen/leren is nooit te koop; je betaalt eenmalig voor de
// BREEDTE van het spel + ouder-inzicht. Gratis = de thuisrij (~10 letters) + de eerste
// twee machines: een compleet, leerzaam "Hoofdstuk 1". Premium ontgrendelt de rest van
// het alfabet, alle machines, alle thema's, meerdere kindprofielen en het ouder-dashboard.
//
// De unlock leeft in een EIGEN sleutel (niet in het speelbestand), zodat hij een
// "opnieuw beginnen" overleeft — je koopt de fabriek één keer, voor het hele gezin.

const KEY = 'typcoon:unlocked';

export const FREE_LETTER_CAP = 10; // tot en met 10 letters gratis leren
export const FREE_MACHINES = ['typewriter', 'printer'];

// Prijzen (Dutch notatie). Eenmalig, hele gezin.
//
// PRICE.anchor is GEEN renderbare prijs: het doorgestreepte-ankerprijs op het
// unlock-scherm was een ACM "nepkorting" (een referentieprijs die nooit
// daadwerkelijk gerekend is mag niet als korting getoond worden) en is uit de
// UI verwijderd — zie company/decisions/002-payments-deferral.md §3. Het veld
// blijft alleen intern staan als de beoogde toekomstige reguliere prijs; het
// mag pas weer als anker getoond worden als €29,99 ooit 30+ dagen echt is
// gerekend en we daarna terugzakken naar €19,99.
export const PRICE = { now: '19,99', anchor: '29,99', offer: '14,99' };

export function isUnlocked() {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
}

// PLACEHOLDER: hier komt straks de echte Stripe/Paddle-afronding. Nu zetten we simpelweg
// de vlag — de rest van de app gedraagt zich alsof de betaling geslaagd is.
export function completePurchase() {
  try { localStorage.setItem(KEY, '1'); } catch { /* opslag geblokkeerd: sessie-only */ }
  return true;
}

export function clearUnlock() {
  try { localStorage.removeItem(KEY); } catch { /* noop */ }
}

// Machine op slot achter de paywall? (gratis krijgt alleen FREE_MACHINES)
export function machineLocked(machineId, unlocked) {
  return !unlocked && !FREE_MACHINES.includes(machineId);
}

// Heeft de gratis speler de leer-grens bereikt (klaar met Hoofdstuk 1)?
export function atFreeCap(lettersLearned, unlocked) {
  return !unlocked && lettersLearned >= FREE_LETTER_CAP;
}
