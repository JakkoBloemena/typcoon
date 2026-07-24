// api/admin/notify.js — Ops-tekst-relay naar Telegram voor de scheduler-kant (cc framework
// scheduler/ops-summary-typcoon.ps1, Shareholder-verzoek: 4-uurlijkse ops-TLDR). Productie
// houdt de werkende TELEGRAM_*-geheimen al vast (Vercel Sensitive vars, write-only sinds
// 2026-07-24) — dit endpoint stuurt dus namens de scheduler, die zelf geen kopie van die
// tokens hoeft te hebben. Beveiligd zoals api/admin/funnel.js: CRON_SECRET via Bearer-
// header óf ?token=.
//
// De tekst gaat verbatim door (het is onze eigen ops-inhoud — geen PII-verwerking, niets
// wordt opgeslagen), alleen type-gecheckt en lengte-begrensd (~3500 tekens; Telegrams eigen
// berichtlimiet is 4096). Rate-limited (bestaand api/_ratelimit.js-patroon), bewust één
// enkele globale bucket — geen per-IP, dit is een intern CRON_SECRET-gated ops-kanaal, geen
// publieke oppervlak — op een bescheiden plafond. Telt vóór de validatie (assignment 030-
// les: een limiter die alleen geldige verzoeken telt is te omzeilen door ongeldige probes).

import { rateLimited } from '../_ratelimit.js';
import { supa } from '../_db.js';
import { tg } from '../_telegram.js';

const MAX_TEXT_LEN = 3500;

// Zelfde dubbele check als api/admin/funnel.js's matches(): Bearer-header óf ?token=.
function matches(req, value) {
  if (!value) return false;
  const q = req.query || {};
  return req.headers.authorization === `Bearer ${value}` || q.token === value;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const secret = process.env.CRON_SECRET;
  if (!matches(req, secret)) return res.status(401).json({ error: 'unauthorized' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    // Vóór de validatie hieronder (assignment 030-les): anders telt een ongeldig/te-lang
    // verzoek niet mee tegen de limiet en is er een onbemeten flood-pad op dit endpoint.
    if (await rateLimited(base, RH, 'g:notify', Number(process.env.MAX_NOTIFY_HOUR) || 30, 3600000)) {
      return res.status(429).json({ error: 'rate_limited' });
    }

    const text = (req.body || {}).text;
    if (typeof text !== 'string' || !text || text.length > MAX_TEXT_LEN) {
      return res.status(400).json({ error: 'invalid_text' });
    }

    const r = await tg(text);
    return res.status(200).json({ ok: r.ok });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
