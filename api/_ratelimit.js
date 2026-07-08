// api/_ratelimit.js — Eenvoudige rate-limiter tegen misbruik/kosten. Telt recente rijen
// per "bucket" in de rate_limits-tabel binnen een venster. Best-effort: bij twijfel
// (fout/onbereikbaar) blokkeren we niet, zodat echte gebruikers nooit vastlopen.

import crypto from 'node:crypto';

export function ipHash(req) {
  const xff = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || '';
  const ip = String(xff).split(',')[0].trim() || 'unknown';
  return crypto.createHash('sha256').update(ip + '|typcoon-rl').digest('hex').slice(0, 32);
}

export const hash = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 24);

// true = over de limiet (blokkeren). Anders registreert hij de hit en geeft false.
export async function rateLimited(base, H, bucket, max, windowMs) {
  try {
    const sinceIso = new Date(Date.now() - windowMs).toISOString();
    const q = `${base}/rest/v1/rate_limits?select=id&bucket=eq.${encodeURIComponent(bucket)}&created_at=gt.${sinceIso}`;
    const r = await fetch(q, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
    const count = parseInt((r.headers.get('content-range') || '').split('/')[1] || '0', 10) || 0;
    if (count >= max) return true;
    await fetch(`${base}/rest/v1/rate_limits`, {
      method: 'POST',
      headers: { ...H, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ bucket }),
    });
    return false;
  } catch {
    return false;
  }
}
