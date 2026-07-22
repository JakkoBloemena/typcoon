// schoolLicence.js — Client-kant van de schoollicentie ("tweede deur" naar dezelfde
// unlock als de familie-aankoop, zie premium.js). Een leraar voert een code in óf opent
// een licentielink; bij een geldige, SERVER-geverifieerde code zet dit precies dezelfde
// `typcoon:unlocked`-vlag (completePurchase()) — geen nieuwe spellogica, geen nieuwe
// paywall, geen kind-account. De code zelf wordt nooit lokaal gevalideerd/geraden: zie
// api/_licence.js + api/school/redeem.js voor de HMAC-ondertekende server-check.

import { redeemSchoolCode } from '../net/school.js';
import { completePurchase } from './premium.js';

// Lees ?schoolcode=CODE uit de URL — het licentielink-pad: een leraar opent de link en
// het apparaat probeert de code meteen in te wisselen, zonder iets te hoeven typen.
export function readSchoolCodeParam() {
  try {
    const p = new URLSearchParams(window.location.search).get('schoolcode');
    return p ? p.trim() : null;
  } catch { return null; }
}

// Haalt ?schoolcode= weer uit de adresbalk (na een poging) — voorkomt dat 'm per ongeluk
// nogmaals verstuurd wordt (bv. bij verversen) of gedeeld wordt mét de code erin.
export function stripSchoolCodeParam() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('schoolcode');
    window.history.replaceState({}, '', url);
  } catch { /* noop: geen window (SSR/test) of geblokkeerde history-API */ }
}

// Valideert de code server-side en zet bij succes de bestaande unlock-vlag. Geeft altijd
// { ok, error? } terug, nooit een throw — werkt netjes door zonder backend (redeemSchoolCode
// degradeert dan zelf naar { ok:false, error:'network' }).
export async function applySchoolCode(code) {
  const trimmed = String(code || '').trim();
  if (!trimmed) return { ok: false, error: 'empty' };
  const r = await redeemSchoolCode(trimmed);
  if (r.ok) { completePurchase(); return { ok: true }; }
  return { ok: false, error: r.error || 'invalid' };
}
