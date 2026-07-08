// api/_email.js — Gedeelde e-mailverzender via Resend (bestand met _ = geen route).
// Activeren: zet in Vercel de env-vars RESEND_API_KEY en EMAIL_FROM (een geverifieerd
// afzenderadres op je domein, bv. "Typcoon <hallo@typcoon.com>"). Zonder sleutel doet
// dit niets (zo blokkeert niets terwijl de backend nog niet aangesloten is).

const BRAND = '#ffb915'; // Typcoon-messing
const INK = '#1b2650';

export async function sendEmail(to, subject, html, attachments) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || 'Typcoon <onboarding@resend.dev>';
  if (!key) return { ok: false, reason: 'no_resend_key' };
  try {
    const payload = { from, to, subject, html };
    if (Array.isArray(attachments) && attachments.length) payload.attachments = attachments;
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return { ok: r.ok };
  } catch {
    return { ok: false, reason: 'send_failed' };
  }
}

// Kleine, vriendelijke e-mailwikkel in de Typcoon-huisstijl. `footerHtml` (optioneel)
// komt onderaan, bv. een "meldingen aanpassen"-link.
export function emailShell(title, bodyHtml, footerHtml = '') {
  return `<div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f5fa;padding:24px 12px;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #e8e9f2;border-radius:16px;overflow:hidden;">
      <div style="background:${INK};padding:18px 24px;">
        <span style="font-weight:800;font-size:20px;color:${BRAND};letter-spacing:-.3px;">🏭 Typcoon</span>
      </div>
      <div style="padding:24px;color:${INK};">
        <h2 style="margin:0 0 12px;font-size:20px;">${title}</h2>
        ${bodyHtml}
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e8e9f2;font-size:12px;color:#9aa1bd;">
        Typcoon · spelenderwijs blind leren typen${footerHtml ? ' &middot; ' + footerHtml : ''}
      </div>
    </div>
  </div>`;
}
