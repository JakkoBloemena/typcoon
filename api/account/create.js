// api/account/create.js — Maakt een ouder-account: koppelt de ouder-e-mail aan een unieke
// gebruikersnaam voor het kind. Server-side (service-role). Geeft bij succes een sessie-
// token terug zodat het apparaat meteen voortgang kan synchroniseren, en stuurt een
// welkomst-/bevestigingsmail met een "meldingen aanpassen"-link (opt-in bevestiging).

import crypto from 'node:crypto';
import { issueToken } from '../_token.js';
import { ipHash, rateLimited } from '../_ratelimit.js';
import { sendEmail, emailShell } from '../_email.js';
import { tg } from '../_telegram.js';
import { supa } from '../_db.js';

const prefsToken = (u) => crypto.createHmac('sha256', process.env.CRON_SECRET || '').update(u.toLowerCase()).digest('hex').slice(0, 32);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const b = req.body || {};
  const email = String(b.parentEmail || '').trim().toLowerCase();
  const username = String(b.kidUsername || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'invalid_email' });
  if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'invalid_username' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, H, RH } = db;

  try {
    // anti-misbruik: max 8 nieuwe accounts per IP per uur + een globaal kostenplafond
    if (await rateLimited(base, RH, 'create:' + ipHash(req), 8, 3600000)) return res.status(429).json({ error: 'rate_limited' });
    if (await rateLimited(base, RH, 'g:create', Number(process.env.MAX_CREATE_HOUR) || 100, 3600000)) return res.status(429).json({ error: 'busy' });

    const chk = await fetch(`${base}/rest/v1/accounts?select=id&kid_username=ilike.${encodeURIComponent(username)}&limit=1`, { headers: RH });
    const rows = await chk.json().catch(() => []);
    if (Array.isArray(rows) && rows.length) return res.status(409).json({ error: 'username_taken' });

    const row = {
      parent_email: email,
      kid_username: username,
      pref_weekly_report: b.prefs ? !!b.prefs.weeklyReport : true,
      pref_reminders: b.prefs ? !!b.prefs.reminders : true,
      consent_at: b.consentAt ? new Date(b.consentAt).toISOString() : new Date().toISOString(),
      plan: 'free',
    };
    const ins = await fetch(`${base}/rest/v1/accounts`, { method: 'POST', headers: { ...H, Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    if (!ins.ok) {
      const t = await ins.text();
      if (/duplicate|unique/i.test(t)) return res.status(409).json({ error: 'username_taken' });
      return res.status(502).json({ error: 'insert_failed' });
    }

    const token = await issueToken(base, RH, username);

    // Welkomst-/opt-in-bevestiging (best-effort — mag de respons nooit blokkeren).
    const site = process.env.SITE_URL || 'https://typcoon.com';
    const manageUrl = `${site}/prefs/?u=${encodeURIComponent(username)}&t=${prefsToken(username)}`;
    const html = emailShell(
      `Welkom bij Typcoon, ${username}! 🏭`,
      `<p style="line-height:1.55">Je account staat klaar. De voortgang van <b>${username}</b> wordt nu automatisch bewaard, zodat je op elke computer verder kunt.</p>
       <p style="line-height:1.55">Je ontvangt${row.pref_weekly_report ? ' een <b>wekelijkse voortgangsmail</b>' : ''}${row.pref_weekly_report && row.pref_reminders ? ' en' : ''}${row.pref_reminders ? ' een vriendelijke <b>oefen-herinnering</b> als een reeks dreigt te breken' : ''}. Je kunt dit altijd aanpassen of stopzetten.</p>`,
      `<a href="${manageUrl}" style="color:#6f4fe6;text-decoration:none;">Meldingen aanpassen</a>`,
    );
    try { await sendEmail(email, 'Welkom bij Typcoon 🏭', html); } catch { /* mag falen */ }

    // Ops-melding naar Telegram (best-effort): een nieuw account = een nieuwe familie.
    const masked = email.replace(/^(.).*(@.*)$/, '$1•••$2');
    await tg(`🎉 <b>Nieuw Typcoon-account</b>\n👤 ${username}\n📧 ${masked}\n📬 weekrapport: ${row.pref_weekly_report ? 'aan' : 'uit'} · herinnering: ${row.pref_reminders ? 'aan' : 'uit'}`);

    return res.status(200).json({ ok: true, token });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
