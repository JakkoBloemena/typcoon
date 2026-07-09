// api/_telegram.js — Korte ops-meldingen naar Telegram (bv. een nieuw account).
// Config via env (geheim, niet in git): TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID.
// Best-effort: faalt stil zodat de aanroepende flow (account maken) nooit hapert.

export async function tg(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true }),
    });
  } catch {
    /* melding mislukt → niet erg, geen blokkering */
  }
}
