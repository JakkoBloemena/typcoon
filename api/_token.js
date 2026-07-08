// api/_token.js — Sessie-tokens voor passwordless voortgang-sync. We bewaren alleen een
// sha256-hash van het token in de `sessions`-tabel; de klant houdt het token zelf.

import crypto from 'node:crypto';

export const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

const TTL_MS = 90 * 24 * 60 * 60 * 1000; // 90 dagen

// Maak een nieuw token voor deze gebruikersnaam en bewaar de hash. Geeft het token terug.
export async function issueToken(base, H, username) {
  const token = crypto.randomBytes(32).toString('hex');
  await fetch(`${base}/rest/v1/sessions`, {
    method: 'POST',
    headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify({
      token_hash: sha256(token),
      kid_username: username.toLowerCase(),
      expires_at: new Date(Date.now() + TTL_MS).toISOString(),
    }),
  });
  return token;
}

// Controleer of dit token geldig is voor de gebruikersnaam (en niet verlopen).
export async function verifyToken(base, H, username, token) {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  const q = `${base}/rest/v1/sessions?select=kid_username&token_hash=eq.${sha256(token)}`
    + `&kid_username=eq.${encodeURIComponent(username.toLowerCase())}`
    + `&expires_at=gt.${new Date().toISOString()}&limit=1`;
  const r = await fetch(q, { headers: H });
  const rows = await r.json().catch(() => []);
  return Array.isArray(rows) && rows.length > 0;
}
