// scripts/mint-licence.mjs — Interne mint-stap (assignment 019, TBD-B): mint een
// schoollicentie-code via api/_licence.js#mintCode() EN legt 'm vast in de `licenses`-
// tabel (school, tier, uitgiftedatum, vervaldatum, code) voor overzicht/facturatie bij
// de concierge-verkoop naar scholen@typcoon.com.
//
// Waarom een script en geen api/admin/-endpoint (i.t.t. funnel.js's CRON_SECRET-patroon)?
// funnel.js draait ONBEMAND op een cron-schedule (vercel.json) — dat MOET een
// authenticated HTTP-pad zijn, want niemand is erbij om het handmatig te draaien. Een
// licentie minten is het tegenovergestelde: een zeldzame (een paar keer per maand),
// mensgestuurde stap ná een e-mailwisseling met een school (plan §3/§4: concierge, geen
// self-serve). Wie hem draait heeft toch al productie-credentials nodig (dezelfde
// SUPABASE_*/SCHOOL_LICENSE_SECRET als het redeem-endpoint, op te halen met
// `vercel env pull`) — een script voegt daarvoor geen nieuw stukje publiek
// aanvalsoppervlak toe (geen extra endpoint om te beveiligen/rate-limiten/monitoren) voor
// iets dat toch nooit onbemand getriggerd wordt. Dat past bij plan §3's "geen self-serve
// checkout" net zo goed als bij de admin-tooling.
//
// Gebruik (vanuit de repo-root, met SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/
// SCHOOL_LICENSE_SECRET in de omgeving):
//   node scripts/mint-licence.mjs --school "Obs de Regenboog" --tier klas --days 365
//   node scripts/mint-licence.mjs --school "Test-school" --tier klas --expires 2026-01-01   (vervallen testen)

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mintCode } from '../api/_licence.js';
import { supa } from '../api/_db.js';

const SCHOOL_YEAR_DAYS = 365; // "1 schooljaar", per plan §1/§6

export function parseArgs(argv) {
  const out = { days: SCHOOL_YEAR_DAYS };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--school') out.school = argv[++i];
    else if (a === '--tier') out.tier = argv[++i];
    else if (a === '--days') out.days = Number(argv[++i]);
    else if (a === '--expires') out.expires = argv[++i];
  }
  return out;
}

// Valideert --days/--expires en berekent de vervaldatum (ISO-string) — vóórdat de
// CLI-wrapper 'm doorgeeft aan mintAndRecord. Zonder dit gooit `new Date(bad).toISOString()`
// verderop een rauwe `RangeError: Invalid time value` i.p.v. de nette usage/error-stijl die
// de rest van dit script al gebruikt voor ontbrekende env-vars/--school/--tier.
export function resolveExpiresAt({ days, expires }) {
  if (expires !== undefined) {
    const d = new Date(expires);
    if (Number.isNaN(d.getTime())) throw new Error(`Ongeldige --expires: verwacht een geldige datum (bv. 2027-01-01).`);
    return d.toISOString();
  }
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`Ongeldige --days: verwacht een positief geheel getal.`);
  }
  return new Date(Date.now() + days * 86400000).toISOString();
}

// De eigenlijke mint-stap: mint de code (server-geheim nodig) en logt hem in `licenses`.
// Los van de CLI-wrapper hieronder getest, met dezelfde in-memory-shim-stijl als
// test/school-licence.test.js.
export async function mintAndRecord({ school, tier, expiresAt }, secret, db) {
  if (!school || !String(school).trim()) throw new Error('school_required');
  const code = mintCode({ tier, expiresAt }, secret); // gooit bij onbekende tier/vervaldatum (zie _licence.js)
  const row = {
    school_name: String(school).trim(),
    tier,
    code,
    issued_at: new Date().toISOString(),
    expires_at: new Date(expiresAt).toISOString(),
  };
  const ins = await fetch(`${db.base}/rest/v1/licenses`, {
    method: 'POST',
    headers: { ...db.H, Prefer: 'return=minimal' },
    body: JSON.stringify(row),
  });
  if (!ins.ok) throw new Error('insert_failed: ' + (await ins.text()));
  return { code, row };
}

// --- CLI-wrapper: draait alleen als dit bestand direct wordt aangeroepen, niet bij een
// import (bv. vanuit een test) ---
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const secret = process.env.SCHOOL_LICENSE_SECRET;
  const db = supa();
  if (!secret || !db) {
    console.error('Ontbrekende configuratie: SCHOOL_LICENSE_SECRET en/of SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.');
    console.error('Haal ze op met `vercel env pull` en laad ze in de shell voordat je dit script draait.');
    process.exit(1);
  }
  if (!args.school || !args.tier) {
    console.error('Gebruik: node scripts/mint-licence.mjs --school "Naam" --tier klas|school [--days 365 | --expires 2027-01-01]');
    process.exit(1);
  }
  let expiresAt;
  try {
    expiresAt = resolveExpiresAt(args);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  try {
    const { code } = await mintAndRecord({ school: args.school, tier: args.tier, expiresAt }, secret, db);
    console.log(`Licentie gemint voor "${args.school}" (${args.tier}), geldig tot ${expiresAt.slice(0, 10)}:`);
    console.log(code);
  } catch (e) {
    console.error('Mint mislukt:', e.message);
    process.exit(1);
  }
}
