// api/school/redeem.js — Controleert een schoollicentie-code (TBD-A, research/school-
// licence-plan.md §6). Geen account, geen kind-PII: alleen de code zelf gaat over de lijn.
// Server-checked/signed (zie ../_licence.js) — nooit een client-side hardcoded string.
// Zonder SUPABASE_* of SCHOOL_LICENSE_SECRET (niet geconfigureerd) geven we netjes
// 'not_configured' terug in plaats van te crashen, zelfde patroon als api/account/create.js.

import { ipHash, rateLimited } from '../_ratelimit.js';
import { supa } from '../_db.js';
import { verifyCode } from '../_licence.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const code = String((req.body || {}).code || '').trim();
  if (!code) return res.status(400).json({ error: 'invalid' });

  const secret = process.env.SCHOOL_LICENSE_SECRET;
  const db = supa();
  if (!secret || !db) return res.status(500).json({ error: 'not_configured' });
  const { base, RH } = db;

  try {
    // anti-misbruik: een geldige code raden per netwerk-request is anders dan een code
    // lekken (honour-system, zie plan §3) — dit remt alleen het GOKKEN van codes af.
    if (await rateLimited(base, RH, 'school:' + ipHash(req), 20, 3600000)) return res.status(429).json({ error: 'rate_limited' });

    const v = verifyCode(code, secret);
    if (!v.valid) return res.status(400).json({ ok: false, error: v.reason });

    return res.status(200).json({ ok: true, tier: v.tier });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
