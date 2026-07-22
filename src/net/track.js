// track.js — Client-helper voor de eerste-partij, cookieless meting (assignment 006):
// bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in. Praat met /api/track.
// Geen cookies, geen fingerprinting, geen PII: een anonieme sessie-id wordt per
// paginabezoek opnieuw gegenereerd en NOOIT bewaard (niet in localStorage, geen cookie)
// — hij verdwijnt zodra het tabblad sluit. Zonder backend, zonder netwerk, of zonder
// deze browser-API's (bv. in een testomgeving) gebeurt er niets: het spel hangt hier
// nooit van af — zelfde graceful-degradation-patroon als src/net/account.js.

function newId() {
  try { return crypto.randomUUID(); } catch { /* geen crypto.randomUUID: val terug */ }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}
const sessionId = newId();

function send(type, extra) {
  try {
    const body = JSON.stringify({ type, sessionId, ...extra });
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch { /* meting is best-effort */ }
}

export const trackPageview = (path) => send('pageview', { path });
export const trackGameStart = () => send('game_start');
export const trackParentOptIn = () => send('parent_opt_in');

// Bezoeksteller: alléén een GETAL in localStorage, geen bezoekers-ID, om "betrokken"
// (≥2 sessies) te herkennen. sessionStorage zorgt dat één tabblad maar één keer meetelt.
const VISIT_KEY = 'typcoon:visits';
const COUNTED_KEY = 'typcoon:visit-counted';

export function markSession() {
  try {
    if (sessionStorage.getItem(COUNTED_KEY)) return; // dit tabblad is al meegeteld
    sessionStorage.setItem(COUNTED_KEY, '1');
    const n = (parseInt(localStorage.getItem(VISIT_KEY), 10) || 0) + 1;
    localStorage.setItem(VISIT_KEY, String(n));
    if (n === 2) send('engaged_session'); // precies bij het omslagpunt, niet elke keer daarna
  } catch { /* opslag geblokkeerd (privémodus, testomgeving, …): sla gewoon over */ }
}
