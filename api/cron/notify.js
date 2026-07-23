// api/cron/notify.js — Uurlijkse Vercel-cron voor ouder-mails: wekelijkse voortgangsdigest
// (zondagavond) + vriendelijke oefen-herinnering (streak in gevaar) + de dagelijkse
// Telegram-liveness-digest (08:00 Amsterdam, assignment 036). Eén run evalueert alle
// opted-in accounts (O(N)) uit de gesyncte voortgang — geen timers per kind.
// Alle tijd-logica draait op Europe/Amsterdam. Beveiligd met CRON_SECRET (Bearer-token).

import crypto from 'node:crypto';
import { sendEmail, emailShell } from '../_email.js';
import { tg } from '../_telegram.js';
import { supa } from '../_db.js';
import { bucketCount, bucketMark } from '../_ratelimit.js';
import { weeklyDue, reminderDue, weeklyStats, activeThisWeek, digestDue, yesterdayKey, tallyByType } from './_report.js';

const TZ = 'Europe/Amsterdam';
const SITE = process.env.SITE_URL || 'https://typcoon.com';
const EVENT_TYPES = ['pageview', 'game_start', 'engaged_session', 'parent_opt_in'];
const prefsToken = (u) => crypto.createHmac('sha256', process.env.CRON_SECRET || '').update(u.toLowerCase()).digest('hex').slice(0, 32);
const fmt = (n) => new Intl.NumberFormat('nl-NL').format(Math.round(n || 0));

// Datumdelen in Amsterdamse tijd (matcht de client-dayKey/weekKey van een NL-kind).
function amsParts(epoch) {
  const f = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false });
  const p = Object.fromEntries(f.formatToParts(new Date(epoch)).map((x) => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: parseInt(p.hour, 10), weekday: p.weekday };
}
// Maandag van de week (yyyy-mm-dd) in Amsterdamse tijd — zelfde vorm als client weekKey().
function amsWeekMonday(epoch) {
  const day = amsParts(epoch).day;
  const [y, m, d] = day.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const dow = (dt.getUTCDay() + 6) % 7; // 0=maandag
  dt.setUTCDate(dt.getUTCDate() - dow);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
const nlDate = (epoch) => new Intl.DateTimeFormat('nl-NL', { timeZone: TZ, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(epoch));

async function markDate(base, RH, username, col, val) {
  await fetch(`${base}/rest/v1/accounts?kid_username=eq.${encodeURIComponent(username)}`, {
    method: 'PATCH', headers: { ...RH, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ [col]: val }),
  });
}

// Rijtelling van één tabel via PostgREST's count=exact (Content-Range-header) — geen rijen
// nodig, alleen het totaal. Assignment 044 (decisions/008 gap 1): een zelfgemeten quota-
// proxy voor de vier tabellen die het snelst groeien/onbegrensd zijn (036/038's QA-vlag op
// rate_limits). Fail-safe is een harde eis: een falende telling mag de digest nooit
// blokkeren of vertragen — een mislukte query levert `null` (→ "n.b." in het bericht),
// nooit een throw die de rest van de cronrun raakt.
const QUOTA_TABLES = ['accounts', 'events', 'rate_limits', 'rate_limit_claims'];
async function rowCount(base, RH, table) {
  try {
    const r = await fetch(`${base}/rest/v1/${table}?select=*&limit=1`, { headers: { ...RH, Prefer: 'count=exact', Range: '0-0' } });
    if (!r.ok) return null;
    const total = (r.headers.get('content-range') || '').split('/')[1];
    return total != null ? parseInt(total, 10) || 0 : null;
  } catch {
    return null;
  }
}

function reportHtml(s, manageUrl) {
  const row = (label, val) => `<tr><td style="padding:11px 0;color:#5b6493;border-bottom:1px solid #f0f0f6;font-size:14px;">${label}</td><td style="padding:11px 0;text-align:right;font-weight:700;color:#1b2650;border-bottom:1px solid #f0f0f6;font-size:15px;">${val}</td></tr>`;
  let rows = row('Letters geleerd', `${s.lettersLearned}/26`);
  if (s.accuracy != null) rows += row('Nauwkeurigheid', `${s.accuracy}%`);
  rows += row('Oefeningen deze week', `${fmt(s.exercisesThisWeek)}`);
  if (s.bestComboThisWeek > 0) rows += row('Beste combo', `${fmt(s.bestComboThisWeek)}`);
  rows += row('Munten deze week', `${fmt(s.coinsThisWeek)} 🪙`);
  rows += row('Reeks', `${s.streak} ${s.streak === 1 ? 'dag' : 'dagen'} 🔥`);
  let vs = '';
  if (s.vsLastWeekCoins != null) {
    vs = s.vsLastWeekCoins >= 0
      ? `${s.naam} verdiende deze week ${fmt(s.vsLastWeekCoins)} munten méér dan vorige week — sterk bezig! 🚀`
      : `Een iets rustigere week dan de vorige. Een klein duwtje van jou helpt de reeks op gang. 💪`;
  }
  const body = `<p style="margin:0 0 16px;font-size:16px;">Zo ging de week van <b>${s.naam}</b> in Typcoon:</p>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
    ${vs ? `<p style="margin:18px 0 0;font-size:14px;color:#3a4366;background:#f6f4ff;padding:14px 16px;border-radius:10px;line-height:1.55;">${vs}</p>` : ''}`;
  return emailShell(`Weekrapport van ${s.naam} 📊`, body, `<a href="${manageUrl}" style="color:#6f4fe6;text-decoration:none;">Meldingen aanpassen</a>`);
}

function reminderHtml(naam, streak, manageUrl) {
  const body = `<p style="margin:0 0 8px;font-size:16px;">De fabriek van <b>${naam}</b> staat vandaag nog stil. 🏭</p>
    <p style="margin:0;font-size:15px;color:#5b6493;line-height:1.55;">${naam} heeft een reeks van <b>${streak} ${streak === 1 ? 'dag' : 'dagen'}</b> opgebouwd. Een korte sessie van 10 minuten houdt de reeks (en de muntfabriek) draaiend — een klein duwtje van jou helpt enorm.</p>`;
  return emailShell(`${naam} heeft vandaag nog niet geoefend`, body, `<a href="${manageUrl}" style="color:#6f4fe6;text-decoration:none;">Meldingen aanpassen</a>`);
}

// Dagelijkse Telegram-liveness-digest (assignment 036): gisterens tellingen + totaal
// accounts. Alleen aantallen, geen PII. Toont expliciet 0 — stilte moet een zichtbaar
// signaal blijven, geen gat (zie de retro hierboven).
// `quota` (assignment 044, optioneel): rijtellingen van accounts/events/rate_limits/
// rate_limit_claims — de zelfgemeten quota-proxy uit decisions/008. Een `null`-waarde
// (fail-safe: die ene telling mislukte) toont "n.b." in plaats van een gegokt getal.
export function digestMessage(day, counts, totalAccounts, quota) {
  const nb = (n) => (n == null ? 'n.b.' : fmt(n));
  const quotaLine = quota ? `\n🧮 rijen — accounts: ${nb(quota.accounts)}, events: ${nb(quota.events)}, rate_limits: ${nb(quota.rate_limits)}, rate_limit_claims: ${nb(quota.rate_limit_claims)}` : '';
  return `📊 <b>Typcoon — ${day}</b>\n👀 bezoeken: ${fmt(counts.pageview)}\n🎮 spel-starts: ${fmt(counts.game_start)}\n⏱️ betrokken sessies: ${fmt(counts.engaged_session)}\n👪 ouder-opt-ins: ${fmt(counts.parent_opt_in)}\n📦 accounts totaal: ${nb(totalAccounts)}${quotaLine}`;
}

export default async function handler(req, res) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.authorization !== `Bearer ${secret}`) return res.status(401).json({ error: 'unauthorized' });

  const db = supa();
  if (!db) return res.status(500).json({ error: 'not_configured' });
  const { base, H, RH } = db;

  const now = Date.now();
  const { day: today, hour, weekday } = amsParts(now);
  const weekMonday = amsWeekMonday(now);
  const isSunday = weekday === 'Sun';

  let digest = false;
  try {
    // ---- Dagelijkse Telegram-digest — draait ONAFHANKELIJK van of er ouder-accounts
    // zijn (moet ook op een dag met 0 bezoekers versturen, vóór de early-return hieronder).
    const yesterday = yesterdayKey(today);
    const digestBucket = `tg-digest:${yesterday}`;
    const alreadySent = (await bucketCount(base, RH, digestBucket)) > 0;
    if (digestDue({ hour, alreadySent })) {
      const since = new Date(now - 2 * 86400000).toISOString(); // ruim: gisteren zit hier sowieso in
      const evRes = await fetch(`${base}/rest/v1/events?select=type,created_at&created_at=gt.${encodeURIComponent(since)}&limit=200000`, { headers: RH });
      const evRows = await evRes.json().catch(() => []);
      const yesterdayRows = (Array.isArray(evRows) ? evRows : []).filter((r) => amsParts(new Date(r.created_at).getTime()).day === yesterday);
      const counts = tallyByType(yesterdayRows, EVENT_TYPES);
      const quota = {};
      for (const table of QUOTA_TABLES) quota[table] = await rowCount(base, RH, table);
      // fail-safe: dezelfde telling voedt de bestaande "accounts totaal"-regel; `null` bij
      // een mislukte query gaat ongewijzigd door naar digestMessage's nb()-renderer ("n.b."),
      // in plaats van hier al tot 0 verzonnen te worden (bounce op 044: zie assignment).
      if ((await tg(digestMessage(yesterday, counts, quota.accounts, quota))).ok) { digest = true; await bucketMark(base, H, digestBucket); }
    }

    const accRes = await fetch(`${base}/rest/v1/accounts?select=kid_username,parent_email,pref_weekly_report,pref_reminders,last_report_date,last_reminder_date&or=(pref_weekly_report.eq.true,pref_reminders.eq.true)&limit=5000`, { headers: RH });
    const accounts = await accRes.json().catch(() => []);
    if (!Array.isArray(accounts) || !accounts.length) return res.status(200).json({ ok: true, reports: 0, reminders: 0, digest });

    const names = accounts.map((a) => String(a.kid_username).toLowerCase());
    const prRes = await fetch(`${base}/rest/v1/progress?select=kid_username,state&kid_username=in.(${names.join(',')})&limit=5000`, { headers: RH });
    const progress = await prRes.json().catch(() => []);
    const pmap = new Map((Array.isArray(progress) ? progress : []).map((p) => [String(p.kid_username).toLowerCase(), p]));

    let reports = 0, reminders = 0;
    for (const acc of accounts) {
      const pr = pmap.get(String(acc.kid_username).toLowerCase());
      if (!pr || !pr.state || !pr.state.profile) continue;
      const st = pr.state, ty = st.tycoon || {};
      const naam = st.profile.naam || acc.kid_username;
      const manageUrl = `${SITE}/prefs/?u=${encodeURIComponent(acc.kid_username)}&t=${prefsToken(acc.kid_username)}`;

      // ---- Wekelijkse digest (zondagavond) ----
      if (weeklyDue({ pref: acc.pref_weekly_report, isSunday, hour, lastReportDate: acc.last_report_date, weekMonday, activeThisWeek: activeThisWeek(st, weekMonday) })) {
        const html = reportHtml(weeklyStats(st), manageUrl);
        if ((await sendEmail(acc.parent_email, `Weekrapport van ${naam} 📊`, html)).ok) { reports++; await markDate(base, RH, acc.kid_username, 'last_report_date', weekMonday); }
      }

      // ---- Oefen-herinnering (streak in gevaar) ----
      if (reminderDue({ pref: acc.pref_reminders, todayKey: today, lastDay: ty.lastDay, streak: ty.streak, hour, lastReminderDate: acc.last_reminder_date })) {
        const html = reminderHtml(naam, ty.streak || 0, manageUrl);
        if ((await sendEmail(acc.parent_email, `${naam} heeft vandaag nog niet geoefend`, html)).ok) { reminders++; await markDate(base, RH, acc.kid_username, 'last_reminder_date', today); }
      }
    }
    return res.status(200).json({ ok: true, reports, reminders, digest });
  } catch {
    return res.status(500).json({ error: 'server_error' });
  }
}
