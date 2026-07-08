// account.js — Client-helpers voor het ouder-account + passwordless login. Praten met de
// serverless functions (/api/account/*). Zonder backend (lokale dev) of zonder netwerk
// falen ze NETJES (return { ok:false }) — de app blijft dan gewoon lokaal doorspelen.

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

// Account aanmaken: { parentEmail, kidUsername, prefs:{weeklyReport,reminders}, consentAt }
export function createAccount(account) {
  return post('/api/account/create', account);
}

// Voortgang server-side bewaren / ophalen (cross-device + back-up).
export async function saveProgress(kidUsername, token, state) {
  if (!token) return { ok: false, error: 'no_token' };
  return post('/api/account/progress-save', { kidUsername, token, state });
}

export async function loadProgress(kidUsername, token) {
  if (!token) return { ok: false, error: 'no_token' };
  const r = await post('/api/account/progress-load', { kidUsername, token });
  return { ok: r.ok, state: r.state ?? null };
}

// Passwordless login (ander apparaat): code aanvragen → code verifiëren.
export function requestLogin(kidUsername) {
  return post('/api/account/login-request', { kidUsername });
}

export function verifyLogin(kidUsername, code) {
  return post('/api/account/login-verify', { kidUsername, code });
}
