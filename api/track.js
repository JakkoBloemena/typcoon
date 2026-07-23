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
//
// Per-bezoek Telegram-melding (assignment 036): alleen voor daadwerkelijk OPGESLAGEN
// 'pageview'-events, en pas NA de 204 hierboven — de client wacht hier nooit op, en een
// falende/tragere Telegram-call raakt de respons niet. Vercel's Node-runtime wacht wel op
// de promise die deze handler teruggeeft vóórdat hij de functie bevriest, dus dit werkt
// betrouwbaar zonder een aparte "waitUntil". Bij grote drukte wordt dit te ruizig — dan is
// alleen de dagelijkse digest (api/cron/notify.js) overhouden een eenregelige revert:
// verwijder de `pingVisit(...)`-aanroep hieronder.

import { ipHash, rateLimited, bucketCount, bucketMark, claimOnce } from './_ratelimit.js';
import { supa } from './_db.js';
import { tg } from './_telegram.js';
import { MAX_PER_MINUTE, minuteKey, shouldPingVisit, overflowCount } from './_visitping.js';

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

  const db = supa();
  if (!db) return res.status(204).end(); // geen backend geconfigureerd: netjes negeren
  const { base, H, RH } = db;
  const cut = (v, n) => (v ? String(v).slice(0, n) : null);

  let stored = null; // pas gezet als de insert hieronder echt lukt (voor de tg-ping)
  try {
    // anti-misbruik: max 120 events per IP per uur + een globaal kostenplafond (zelfde
    // patroon als api/account/create.js). Dit moet vóór elke shape-validatie draaien
    // (assignment 030): anders telt malformed traffic (incl. onbekend type) niet mee
    // tegen de limiet en is er een onbemeten flood-pad op dit publieke endpoint.
    if (await rateLimited(base, RH, 'track:' + ipHash(req), 120, 3600000)) return res.status(429).end();
    if (await rateLimited(base, RH, 'g:track', Number(process.env.MAX_TRACK_HOUR) || 2000, 3600000)) return res.status(204).end();

    // Shape-validatie: fout laat het hele event stil vallen (204, niets opgeslagen) — niet
    // alleen het veld leegmaken, want een deels-opgeslagen rij is nog steeds een lek.
    // Onbekend type telt hierboven al mee tegen de rate-limit; hier alleen nog de opslag
    // stoppen (204, niet aftastbaar — zelfde beleid als sessionId/path hieronder).
    if (!TYPES.has(type)) return res.status(204).end();
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
    stored = row; // insert niet gegooid → als opgeslagen beschouwd (zelfde standaard als hierboven)
  } catch { stored = null; /* meting is best-effort: nooit het spel blokkeren */ }

  res.status(204).end();

  if (stored && stored.type === 'pageview') {
    try { await pingVisit(base, H, RH, stored); } catch (e) { console.error('track: visit-ping mislukt', e); }
  }
}

// Best-effort per-bezoek Telegram-melding + de >20/minuut-samenvoegregel (assignment 036).
// Draait ná de 204 hierboven (zie handler): mag de respons dus nooit raken. Het bericht
// bevat alleen pad + land — geen sessie-id, geen e-mail: dezelfde velden die al (anoniem)
// in `events` landen, geen extra PII-oppervlak.
async function pingVisit(base, H, RH, row) {
  const now = Date.now();
  const mk = minuteKey(now);
  const bucket = `tgping:${mk}`;
  await bucketMark(base, H, bucket);
  const countThisMinute = await bucketCount(base, RH, bucket);
  if (shouldPingVisit(countThisMinute)) {
    await tg(`👀 bezoek: ${row.path || '/'} (${row.country || '??'})`);
  }

  // Is de VORIGE minuut zojuist pas echt "afgelopen" met meer dan het maximum? Dan nu —
  // en maar één keer — de samengevoegde rest melden. De dedup-claim is ATOMISCH
  // (claimOnce(), assignment 038): twee gelijktijdige invocaties die allebei precies
  // hierlangs komen (het scenario waar deze regel juist voor bestaat — een verkeerspiek)
  // kunnen niet allebei winnen, dus hooguit één samenvatting per overgelopen minuut.
  const prevTotal = await bucketCount(base, RH, `tgping:${mk - 1}`);
  if (prevTotal > MAX_PER_MINUTE) {
    const won = await claimOnce(base, H, `tgflag:${mk - 1}`);
    const n = overflowCount(prevTotal, !won);
    if (n > 0) await tg(`+${n} bezoeken afgelopen minuut`);
  }
}
