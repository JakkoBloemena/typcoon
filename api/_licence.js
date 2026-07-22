// api/_licence.js — Schoollicentie-CODEFORMAAT: signeren + verifiëren. Geen database
// nodig om een code te controleren: tier + vervaldatum zitten IN de code, ondertekend
// met een servergeheim (HMAC-SHA256). Een code vervalsen vereist het geheim (server-
// only env-var), niet alleen het uitlezen van de client-broncode — dat is de eis uit
// research/school-licence-plan.md §6 TBD-A ("niet mintbaar vanuit clientbron").
//
// Layout van de (genormaliseerde, streepjes-vrije) payload — 9 tekens, base36 hoofdletters:
//   [0]     tier: 'K' (klas-licentie) | 'S' (school-licentie)
//   [1..4]  vervaldag: dagen sinds LICENCE_EPOCH, base36, vast op 4 tekens
//   [5..8]  id: willekeurige 4 tekens (uniek/onvoorspelbaar — geen volgnummers te raden)
// Gevolgd door 8 tekens HMAC-SHA256(payload)-hex (uppercased, afgekapt op 32 bits — ruim
// genoeg tegen gokken achter een rate-limiter; zie plan §3: scholen zijn een low-fraud
// kanaal, dit is geen DRM). Weergegeven als `TC-XXXX-XXXX-XXXX-XXXX-X` voor het typen/
// plakken door een leraar; dashes zijn puur leesbaarheid en worden bij verificatie genegeerd.

import crypto from 'node:crypto';

const LICENCE_EPOCH = Date.UTC(2026, 0, 1); // vaste epoch: houdt de dag-teller kort en leesbaar
const DAY_MS = 24 * 60 * 60 * 1000;

const TIER_CHAR = { klas: 'K', school: 'S' };
const TIER_NAME = { K: 'klas', S: 'school' };

const toB36 = (n, len) => n.toString(36).toUpperCase().padStart(len, '0');
const fromB36 = (s) => parseInt(s, 36);

function sign(payload, secret) {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex').slice(0, 8).toUpperCase();
}

// Alleen A-Z0-9 overhouden, hoofdletters — een leraar mag plakken met/zonder streepjes,
// spaties of kleine letters.
function normalize(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// Maakt een nieuwe licentiecode (SERVER-ONLY: heeft het geheim nodig). Bedoeld voor de
// mint-stap van assignment 019 — niet aan een client blootgesteld door dit bestand.
export function mintCode({ tier, expiresAt }, secret) {
  const tierChar = TIER_CHAR[tier];
  if (!tierChar) throw new Error('unknown_tier');
  const days = Math.round((new Date(expiresAt).getTime() - LICENCE_EPOCH) / DAY_MS);
  if (!Number.isFinite(days) || days < 0 || days > 36 ** 4 - 1) throw new Error('bad_expiry');
  const id = toB36(Math.floor(Math.random() * 36 ** 4), 4);
  const payload = tierChar + toB36(days, 4) + id;
  const raw = payload + sign(payload, secret); // 9 + 8 = 17 tekens
  return 'TC-' + raw.match(/.{1,4}/g).join('-');
}

// Verifieert een ingevoerde code. Geeft { valid, reason?, tier?, expiresAt? } terug —
// nooit een throw, zodat het aanroepende endpoint altijd netjes kan reageren.
export function verifyCode(code, secret) {
  const raw = normalize(code).replace(/^TC/, '');
  if (raw.length !== 17) return { valid: false, reason: 'malformed' };
  const payload = raw.slice(0, 9);
  const sig = raw.slice(9);
  if (sign(payload, secret) !== sig) return { valid: false, reason: 'invalid' }; // vervalst/getypt
  const tier = TIER_NAME[payload[0]];
  if (!tier) return { valid: false, reason: 'malformed' };
  const expiresAt = new Date(LICENCE_EPOCH + fromB36(payload.slice(1, 5)) * DAY_MS);
  if (Date.now() > expiresAt.getTime()) return { valid: false, reason: 'expired', tier, expiresAt };
  return { valid: true, tier, expiresAt };
}

// === SEAM voor assignment 019 (licenties-tabel + mint-tooling) ===
// Dit bestand is bewust DB-loos: geldigheid + vervaldatum zitten in de ondertekende code
// zelf, dus TBD-A (dit bestand + api/school/redeem.js) werkt zonder `licenses`-tabel.
// Assignment 019 kan hierop bouwen zonder het formaat te breken:
//  - `mintCode()` hergebruiken achter een interne mint-tool, en het resultaat samen met
//    schoolnaam/tier/uitgiftedatum in een `licenses`-rij loggen (overzicht/facturatie);
//  - in `verifyCode()` (of erna, in het endpoint) een REVOCATIE-check toevoegen — bv. een
//    tabel met ingetrokken codes of vervangen licenties — als een ADDITIONELE check naast
//    deze signature/vervaldatum-check, niet als vervanging ervan;
//  - de losse velden (tier, expiresAt) die verifyCode() al teruggeeft direct gebruiken om
//    een "resterende geldigheid"-indicator te tonen in eventuele concierge-tooling.
