// school.js — Client-helper voor de schoollicentie-code. Praat met /api/school/redeem.
// Zonder backend (lokale dev) of zonder netwerk faalt dit NETJES ({ ok:false }) — het
// spel blijft gewoon lokaal doorspelen. Zelfde vorm als ../game/../net/account.js.

const J = { 'content-type': 'application/json' };

async function post(path, body) {
  try {
    const r = await fetch(path, { method: 'POST', headers: J, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, ...d };
  } catch {
    return { ok: false, error: 'network' };
  }
}

// Licentiecode laten verifiëren. { ok, tier } bij succes; { ok:false, error } anders
// ('invalid' | 'expired' | 'rate_limited' | 'not_configured' | 'network' | 'server_error').
export function redeemSchoolCode(code) {
  return post('/api/school/redeem', { code });
}
