// api/admin/funnel.js — Simpele wekelijkse trechter-telling voor de CEO/monitor:
// bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in (REVENUE.md-trechter,
// assignment 006). Leest alleen events.type + created_at en telt per week — geen
// individuele rijen, geen PII. Beveiligd met CRON_SECRET (zelfde geheim als de cron):
// Bearer-header óf ?token= (voor snel handmatig opvragen).
//
// Sinds assignment 044 (decisions/008 gap 2) accepteert dit endpoint ook FUNNEL_READ_
// TOKEN als los, zwakker env-geheim dat precies dit tellingen-alleen/geen-PII-antwoord
// ontgrendelt — zodat tick-sessies een funnel-readout kunnen krijgen zonder CRON_SECRET
// (dat blijft Shareholder/production-only, decisions/006). FUNNEL_READ_TOKEN mag nooit
// gelijk zijn aan CRON_SECRET (zou het sterkere geheim aliasen); die gelijkheid wordt
// bij de autorisatie zelf geweigerd, zie funnelAuthorized() hieronder.

import { supa } from '../_db.js';

const TYPES = ['pageview', 'game_start', 'engaged_session', 'parent_opt_in'];
const WEEKS = 8; // laatste 8 weken is genoeg om de trechter te volgen

// Maandag van de week (yyyy-mm-dd), Europe/Amsterdam — zelfde conventie als cron/notify.js.
function weekKey(epoch) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
  const [y, m, d] = f.format(new Date(epoch)).split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // 0 = maandag
  dt.setUTCDate(dt.getUTCDate() - dow);
  return dt.toISOString().slice(0, 10);
}

// Presenteert het verzoek `value` als Bearer-header óf ?token=? Zelfde dubbele check als
// vóór 044, nu herbruikbaar voor zowel CRON_SECRET als FUNNEL_READ_TOKEN.
function matches(req, value) {
  if (!value) return false;
  const q = req.query || {};
  return req.headers.authorization === `Bearer ${value}` || q.token === value;
}

// FUNNEL_READ_TOKEN is alleen geldig als het (a) is ingesteld — een unset token geeft
// nooit toegang — én (b) niet gelijk is aan CRON_SECRET: die gelijkheid zou het zwakkere
// token het sterkere, cron-brede geheim laten aliasen, en wordt daarom hier zelf geweigerd
// (los geëxporteerd zodat dit exact geval direct unit-test-baar is, ongeacht wat de
// — ongewijzigde — CRON_SECRET-tak in funnelAuthorized() los daarvan toestaat).
export function funnelTokenValid(funnelToken, secret, req) {
  return !!funnelToken && funnelToken !== secret && matches(req, funnelToken);
}

// Autorisatie: CRON_SECRET (ongewijzigd t.o.v. vóór 044) OF FUNNEL_READ_TOKEN.
export function funnelAuthorized(req, secret, funnelToken) {
  return matches(req, secret) || funnelTokenValid(funnelToken, secret, req);
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const funnelToken = process.env.FUNNEL_READ_TOKEN;
  if (!funnelAuthorized(req, secret, funnelToken)) return res.status(401).json({ error: 'unauthorized' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    const since = new Date(Date.now() - WEEKS * 7 * 86400000).toISOString();
    const r = await fetch(`${base}/rest/v1/events?select=type,created_at&created_at=gt.${encodeURIComponent(since)}&limit=200000`, { headers: RH });
    if (!r.ok) throw new Error('query failed');
    const rows = await r.json();

    const weeks = {};
    for (const row of Array.isArray(rows) ? rows : []) {
      const wk = weekKey(new Date(row.created_at).getTime());
      weeks[wk] ||= Object.fromEntries(TYPES.map((t) => [t, 0]));
      if (TYPES.includes(row.type)) weeks[wk][row.type]++;
    }
    const byWeek = Object.keys(weeks).sort().map((week) => ({ week, ...weeks[week] }));
    return res.status(200).json({ ok: true, types: TYPES, weeks: byWeek });
  } catch {
    // tabel bestaat waarschijnlijk nog niet → vriendelijke setup-melding i.p.v. een 500
    return res.status(200).json({ ok: false, setupNeeded: true, message: 'Draai supabase/schema.sql (tabel events) in Supabase.' });
  }
}
