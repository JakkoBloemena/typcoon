// session.js — Onthoudt het ouder-account + sessie-token op DIT apparaat (localStorage).
// Leeft los van het speelbestand (typcoon:save) zodat inloggen/uitloggen de voortgang
// niet raakt. Het account koppelt de gekozen gebruikersnaam aan de sync + ouder-mails.

const ACCOUNT_KEY = 'typcoon:account'; // { kidUsername, parentEmail }
const tokenKey = (u) => `typcoon:token:${String(u).toLowerCase()}`;

export function getAccount() {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAccount(account) {
  try { localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account)); } catch { /* opslag geblokkeerd */ }
}

export function clearAccount() {
  const a = getAccount();
  try {
    if (a?.kidUsername) localStorage.removeItem(tokenKey(a.kidUsername));
    localStorage.removeItem(ACCOUNT_KEY);
  } catch { /* noop */ }
}

export function getToken(username) {
  try { return localStorage.getItem(tokenKey(username)); } catch { return null; }
}

export function saveToken(username, token) {
  try { localStorage.setItem(tokenKey(username), token); } catch { /* noop */ }
}

// Handige combinatie: het account + het token voor dit apparaat (of null).
export function getSession() {
  const a = getAccount();
  if (!a?.kidUsername) return null;
  const token = getToken(a.kidUsername);
  return token ? { ...a, token } : { ...a, token: null };
}
