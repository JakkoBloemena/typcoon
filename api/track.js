// api/track.js — Eerste-partij, cookieless event-endpoint voor de meting (assignment 006):
// bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in (REVENUE.md-trechter).
// Geen cookies, geen fingerprinting, geen PII: alleen het event-type + een anonieme,
// niet-blijvende sessie-id die de client per paginabezoek genereert en nooit bewaart.
// Zonder Supabase-env-vars (of bij een fout) faalt dit STIL — zelfde patroon als
// api/_db.js/src/net/account.js: het spel hangt hier nooit van af.

import { ipHash, rateLimited } from './_ratelimit.js';
import { supa } from './_db.js';

const TYPES = new Set(['pageview', 'game_start', 'engaged_session', 'parent_opt_in']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const b = req.body || {};
  const type = String(b.type || '');
  if (!TYPES.has(type)) return res.status(400).end();

  const db = supa();
  if (!db) return res.status(204).end(); // geen backend geconfigureerd: netjes negeren
  const { base, H, RH } = db;
  const cut = (v, n) => (v ? String(v).slice(0, n) : null);

  try {
    // anti-misbruik: max 120 events per IP per uur + een globaal kostenplafond (zelfde
    // patroon als api/account/create.js).
    if (await rateLimited(base, RH, 'track:' + ipHash(req), 120, 3600000)) return res.status(429).end();
    if (await rateLimited(base, RH, 'g:track', Number(process.env.MAX_TRACK_HOUR) || 2000, 3600000)) return res.status(204).end();

    const row = {
      type,
      path: cut(b.path, 200),
      session_id: cut(b.sessionId, 64),
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
