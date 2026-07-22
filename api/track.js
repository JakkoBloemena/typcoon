// api/track.js — Eerste-partij, cookieless event-endpoint voor de meting (assignment 006):
// bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in (REVENUE.md-trechter).
// Geen cookies, geen fingerprinting, geen PII: alleen het event-type + een anonieme,
// niet-blijvende sessie-id die de client per paginabezoek genereert en nooit bewaart.
// Zonder Supabase-env-vars (of bij een fout) faalt dit STIL — zelfde patroon als
// api/_db.js/src/net/account.js: het spel hangt hier nooit van af.
//
// Shape-validatie (assignment 025): het endpoint is publiek en unauthenticated, dus een
// directe POST kan sessionId/path met willekeurige vrije tekst vullen (e-mail-vormig,
// BSN-vormig) — de kids-product no-PII-guardrail (charter 1) krijgt hier defense-in-depth
// op de opslaggrens. Afwijzen betekent stil laten vallen (204, dezelfde fire-and-forget-
// semantiek als de rest van dit endpoint) — nooit een fout die een client kan aftasten.

import { ipHash, rateLimited } from './_ratelimit.js';
import { supa } from './_db.js';

const TYPES = new Set(['pageview', 'game_start', 'engaged_session', 'parent_opt_in']);
// Canonieme UUID (v1-5, RFC4122-variant) — wat crypto.randomUUID() (src/net/track.js,
// public/track.js) altijd oplevert. Alles anders (vrije tekst, e-mail, lege waarde) faalt.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Rooted pad, conservatief charset — geen '@', geen spaties, geen vrije tekst. Dekt elk pad
// dat de echte clients versturen: '/', '/blog/<slug>/', '/voor-scholen/', '/speel/', enz.
const PATH_RE = /^\/[A-Za-z0-9\-_\/.]*$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const b = req.body || {};
  const type = String(b.type || '');
  // Onbekend type: stil laten vallen (204), niet aftastbaar — zelfde beleid als de
  // sessionId/path-validatie hieronder (assignment 025), niet meer het oude 400.
  if (!TYPES.has(type)) return res.status(204).end();

  const db = supa();
  if (!db) return res.status(204).end(); // geen backend geconfigureerd: netjes negeren
  const { base, H, RH } = db;
  const cut = (v, n) => (v ? String(v).slice(0, n) : null);

  try {
    // anti-misbruik: max 120 events per IP per uur + een globaal kostenplafond (zelfde
    // patroon als api/account/create.js).
    if (await rateLimited(base, RH, 'track:' + ipHash(req), 120, 3600000)) return res.status(429).end();
    if (await rateLimited(base, RH, 'g:track', Number(process.env.MAX_TRACK_HOUR) || 2000, 3600000)) return res.status(204).end();

    // Shape-validatie: fout laat het hele event stil vallen (204, niets opgeslagen) — niet
    // alleen het veld leegmaken, want een deels-opgeslagen rij is nog steeds een lek.
    const sessionId = String(b.sessionId || '');
    if (!UUID_RE.test(sessionId)) return res.status(204).end();
    const path = b.path ? String(b.path) : null;
    if (path !== null && !PATH_RE.test(path)) return res.status(204).end();

    const row = {
      type,
      path: cut(path, 200),
      session_id: cut(sessionId, 64),
      country: cut(req.headers['x-vercel-ip-country'], 4),
    };
    await fetch(`${base}/rest/v1/events`, {
      method: 'POST',
      headers: { ...H, Prefer: 'return=minimal' },
      body: JSON.stringify(row),
    });
  } catch { /* meting is best-effort: nooit het spel blokkeren */ }
  return res.status(204).end();
}
