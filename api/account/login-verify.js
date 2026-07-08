// api/account/login-verify.js — Controleert de inlogcode (hash) voor de ouder-e-mail die
// bij de gebruikersnaam hoort. Eenmalig bruikbaar → geeft een nieuw sessie-token terug.

import crypto from 'node:crypto';
import { issueToken } from '../_token.js';
import { supa } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const username = String(b.kidUsername || '').trim();
  const code = String(b.code || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username) || !/^\d{6}$/.test(code)) return res.status(400).json({ error: 'invalid' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    const ar = await fetch(`${base}/rest/v1/accounts?select=parent_email&kid_username=ilike.${encodeURIComponent(username)}&limit=1`, { headers: RH });
    const arows = await ar.json().catch(() => []);
    if (!Array.isArray(arows) || !arows.length) return res.status(404).json({ error: 'not_found' });
    const email = arows[0].parent_email;
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');

    const q = `${base}/rest/v1/auth_codes?email=eq.${encodeURIComponent(email)}&code_hash=eq.${codeHash}&used=eq.false&expires_at=gt.${new Date().toISOString()}&order=created_at.desc&limit=1`;
    const r = await fetch(q, { headers: RH });
    const rows = await r.json().catch(() => []);
    if (!Array.isArray(rows) || !rows.length) return res.status(401).json({ ok: false });
    await fetch(`${base}/rest/v1/auth_codes?id=eq.${rows[0].id}`, { method: 'PATCH', headers: { ...RH, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ used: true }) });
    const token = await issueToken(base, RH, username);
    return res.status(200).json({ ok: true, token });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
