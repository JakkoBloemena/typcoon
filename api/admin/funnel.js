// api/admin/funnel.js — Simpele wekelijkse trechter-telling voor de CEO/monitor:
// bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in (REVENUE.md-trechter,
// assignment 006). Leest alleen events.type + created_at en telt per week — geen
// individuele rijen, geen PII. Beveiligd met CRON_SECRET (zelfde geheim als de cron):
// Bearer-header óf ?token= (voor snel handmatig opvragen).

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

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  const q = req.query || {};
  const authed = !!secret && (req.headers.authorization === `Bearer ${secret}` || q.token === secret);
  if (!authed) return res.status(401).json({ error: 'unauthorized' });

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
