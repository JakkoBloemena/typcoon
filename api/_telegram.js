// api/_telegram.js — Korte ops-meldingen naar Telegram (nieuw account, bezoek, dagelijkse
// digest). Config via env (geheim, niet in git): TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
// Best-effort: een mislukte melding blokkeert of vertraagt de aanroepende flow nooit —
// maar faalt niet meer STIL (assignment 036): elke mislukking gaat naar console.error
// (Vercel function logs), want een stille tg()-faal is precies hoe de maandenlange
// backend-uitval verborgen bleef (company/retro/2026-07-23-env-outage-and-headless-
// lessons.md). Geeft { ok } terug zodat een aanroeper (bv. de dagelijkse digest) alleen
// bij een bevestigde verzending zijn eigen dedup-status mag bijwerken.

export async function tg(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return { ok: false, reason: 'not_configured' };
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    if (!r.ok) console.error('tg: Telegram gaf een foutstatus terug', r.status);
    return { ok: r.ok };
  } catch (e) {
    console.error('tg: versturen mislukt', e);
    return { ok: false, reason: 'send_failed' };
  }
}
