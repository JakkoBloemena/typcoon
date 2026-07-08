// api/prefs.js — Ouder past e-mailmeldingen aan via de link in de mail. Auth: een HMAC-
// token van de gebruikersnaam (zelfde sleutel als de cron). Zo kan alleen wie de mail-
// link heeft de voorkeuren van dat account lezen/wijzigen. Bediend door /public/prefs/.

import crypto from 'node:crypto';
import { supa } from './_db.js';

const token = (u) => crypto.createHmac('sha256', process.env.CRON_SECRET || '').update(u.toLowerCase()).digest('hex').slice(0, 32);

export default async function handler(req, res) {
  const q = req.query || {}, b = req.body || {};
  const u = String(q.u || b.u || '').trim();
  const t = String(q.t || b.t || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(u)) return res.status(400).json({ error: 'invalid' });
  if (!process.env.CRON_SECRET || t !== token(u)) return res.status(401).json({ error: 'unauthorized' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;
  const sel = `kid_username=ilike.${encodeURIComponent(u)}`;

  try {
    if (req.method === 'GET') {
      const r = await fetch(`${base}/rest/v1/accounts?select=pref_weekly_report,pref_reminders&${sel}&limit=1`, { headers: RH });
      const rows = await r.json().catch(() => []);
      const a = (Array.isArray(rows) && rows[0]) || {};
      return res.status(200).json({ ok: true, weeklyReport: !!a.pref_weekly_report, reminders: !!a.pref_reminders });
    }
    if (req.method === 'POST') {
      const r = await fetch(`${base}/rest/v1/accounts?${sel}`, {
        method: 'PATCH', headers: { ...RH, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ pref_weekly_report: !!b.weeklyReport, pref_reminders: !!b.reminders }),
      });
      return res.status(r.ok ? 200 : 502).json({ ok: r.ok });
    }
    return res.status(405).end();
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
