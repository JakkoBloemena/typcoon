// api/account/login-request.js — Inloggen op een ander apparaat: het kind vult zijn
// gebruikersnaam in → we mailen een 6-cijferige code naar het e-mailadres van de ouder
// (passwordless, geen wachtwoord).

import crypto from 'node:crypto';
import { sendEmail, emailShell } from '../_email.js';
import { ipHash, hash, rateLimited } from '../_ratelimit.js';
import { supa } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const username = String((req.body || {}).kidUsername || '').trim();
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'invalid' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    if (await rateLimited(base, RH, 'loginip:' + ipHash(req), 12, 3600000)) return res.status(429).json({ error: 'rate_limited' });

    const r = await fetch(`${base}/rest/v1/accounts?select=parent_email&kid_username=ilike.${encodeURIComponent(username)}&limit=1`, { headers: RH });
    const rows = await r.json().catch(() => []);
    if (!Array.isArray(rows) || !rows.length) return res.status(404).json({ error: 'not_found' });
    const email = rows[0].parent_email;

    if (await rateLimited(base, RH, 'loginem:' + hash(email), 4, 900000)) return res.status(429).json({ error: 'rate_limited' });
    if (await rateLimited(base, RH, 'g:email', Number(process.env.MAX_EMAIL_HOUR) || 60, 3600000)) return res.status(429).json({ error: 'busy' });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = crypto.createHash('sha256').update(code).digest('hex');
    const expires_at = new Date(Date.now() + 10 * 60000).toISOString();
    await fetch(`${base}/rest/v1/auth_codes`, { method: 'POST', headers: { ...RH, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ email, code_hash, expires_at }) });

    const html = emailShell('Inlogcode voor ' + username, `
      <p style="line-height:1.55">${username} wil op een ander apparaat verder spelen in Typcoon. Gebruik deze code:</p>
      <p style="font-size:32px;font-weight:800;letter-spacing:6px;color:#ffb915;margin:16px 0">${code}</p>
      <p style="color:#5b6493">10 minuten geldig. Niet aangevraagd? Negeer deze mail.</p>`);
    const sent = await sendEmail(email, 'Typcoon inlogcode', html);

    const masked = email.replace(/^(.).*(@.*)$/, '$1•••$2');
    return res.status(200).json({ ok: true, sent: sent.ok, email: masked });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
