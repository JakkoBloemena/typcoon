// api/account/progress-load.js — Haalt de server-voortgang van het kind op (verdergaan op
// een ander apparaat / na het wissen van de browser). Vereist een geldig token.

import { verifyToken } from '../_token.js';
import { supa } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const username = String(b.kidUsername || '').trim();
  const token = String(b.token || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'invalid' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    if (!(await verifyToken(base, RH, username, token))) return res.status(401).json({ error: 'unauthorized' });
    const r = await fetch(`${base}/rest/v1/progress?select=state&kid_username=eq.${encodeURIComponent(username.toLowerCase())}&limit=1`, { headers: RH });
    const rows = await r.json().catch(() => []);
    const state = Array.isArray(rows) && rows.length ? rows[0].state : null;
    return res.status(200).json({ ok: true, state });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
