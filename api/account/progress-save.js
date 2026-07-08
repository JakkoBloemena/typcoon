// api/account/progress-save.js — Bewaart (upsert) de voortgang van het kind, server-side.
// Vereist een geldig sessie-token voor de gebruikersnaam.

import { verifyToken } from '../_token.js';
import { supa } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const username = String(b.kidUsername || '').trim();
  const token = String(b.token || '').trim();
  const state = b.state;
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username) || !state || typeof state !== 'object') return res.status(400).json({ error: 'invalid' });
  // anti-bloat: voortgang is klein; weiger absurd grote payloads
  if (JSON.stringify(state).length > 250000) return res.status(413).json({ error: 'too_large' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    if (!(await verifyToken(base, RH, username, token))) return res.status(401).json({ error: 'unauthorized' });
    const row = { kid_username: username.toLowerCase(), state, updated_at: new Date().toISOString() };
    const r = await fetch(`${base}/rest/v1/progress`, {
      method: 'POST',
      headers: { ...RH, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(row),
    });
    if (!r.ok) return res.status(502).json({ error: 'save_failed' });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
