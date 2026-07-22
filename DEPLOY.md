# Typcoon deployen op Vercel (typcoon.com)

Deze repo is een zelfstandig Vite-project — geen monorepo-instellingen nodig.

## Eenmalige setup (± 2 minuten)

1. Ga naar [vercel.com/new](https://vercel.com/new) en importeer **deze repo**
   (`typcoon`) als nieuw project.
2. Framework preset: **Vite** (wordt automatisch herkend). Root Directory blijft
   gewoon leeg (`./`). Build command `vite build`, output `dist` — de standaard.
3. Deploy. Je krijgt direct een `typcoon-*.vercel.app`-URL om te testen:
   de landingspagina op `/`, het spel op `/speel/`.
4. **Domein koppelen**: Project → Settings → Domains → voeg `typcoon.com` toe
   (en `www.typcoon.com`, redirect naar apex) en volg de DNS-instructies.

Had je al een Vercel-project "typcoon" dat aan de typie-fun-repo hing? Verwijder
dat project (Settings → onderaan → Delete Project) en importeer deze repo vers —
dat is sneller en schoner dan de Git-koppeling omleggen.

Elke push naar `main` deployt daarna automatisch.

## Wat er al klaarstaat

- `vercel.json` — cleanUrls, cache-headers voor assets, security-headers.
- SEO: statische landingspagina met meta/OG/Twitter-tags, JSON-LD (VideoGame +
  FAQPage), `robots.txt`, `sitemap.xml`, `og.png`, canonical naar
  `https://typcoon.com/`. Het spel (`/speel/`) staat op `noindex` zodat de
  landing de ranking draagt.

## Na de livegang

- [Google Search Console](https://search.google.com/search-console): voeg
  `typcoon.com` toe en dien `https://typcoon.com/sitemap.xml` in.
- Check de OG-preview via [opengraph.xyz](https://www.opengraph.xyz/) of de
  deel-preview in WhatsApp/Slack.

## Backend: account, voortgang-sync & ouder-mails (optioneel maar aanbevolen)

De frontend werkt 100% zonder backend (kinderen spelen lokaal, zonder account). De
serverless functions in `api/*` voegen accounts, cross-device voortgang-sync en ouder-
e-mails toe. Zonder de env-vars hieronder falen die netjes en blijft het spel gewoon werken.

**1. Supabase.** Maak een project → SQL Editor → plak `supabase/schema.sql` → Run.
Kopieer uit Project Settings → API: de **Project URL** en de **service-role** sleutel
(server-only — nooit in de client).

**2. Resend.** Maak een account, verifieer je domein, maak een API-key. Zet een afzender
op je domein (bv. `hallo@typcoon.com`).

**3. Vercel env-vars** (Project → Settings → Environment Variables — zie `.env.example`):

| Var | Waarde |
|-----|--------|
| `SUPABASE_URL` | je Supabase Project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role sleutel (server-only) |
| `RESEND_API_KEY` | Resend API-key |
| `EMAIL_FROM` | `Typcoon <hallo@typcoon.com>` |
| `CRON_SECRET` | zelf een lange random string (beveiligt de cron + tekent de prefs-links) |
| `SITE_URL` | `https://typcoon.com` |
| `MAX_CREATE_HOUR` / `MAX_EMAIL_HOUR` | optioneel; standaard 100 / 60 |
| `MAX_TRACK_HOUR` | optioneel; standaard 2000 (meting, zie hieronder) |

**4. Cron.** `vercel.json` bevat al de uurlijkse cron (`/api/cron/notify`). Vercel stuurt
`CRON_SECRET` automatisch mee als Bearer-token. De cron stuurt zondagavond een wekelijkse
voortgangsdigest en een vriendelijke oefen-herinnering als een reeks dreigt te breken.

**Beveiliging/privacy:** RLS staat aan op alle tabellen zónder policies — alleen de
service-role functions raken data aan. We bewaren geen wachtwoord en geen kind-PII behalve
de door de ouder gekozen gebruikersnaam; alleen de ouder-e-mail voor login + mails.
Betalingen zijn (bewust) nog niet gebouwd — `accounts.plan` staat klaar op `'free'`.

## Meting: trechter zonder cookies (assignment 006)

`api/track.js` (server) + `src/net/track.js`/`public/track.js` (client) meten de
REVENUE.md-trechter — `bezoek → spel-start → betrokken (≥2 sessies) → ouder-opt-in` —
eerste-partij en cookieless: geen cookies, geen fingerprinting, geen PII. Alleen een
anonieme sessie-id die de client per paginabezoek genereert en nooit bewaart. Landt in
de `events`-tabel (`supabase/schema.sql`); zonder `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`
faalt het endpoint stil (204) — precies zoals `api/account/*`. Rate-limited zoals de
account-API's (`MAX_TRACK_HOUR`, standaard 2000/uur).

**Wekelijkse tellingen aflezen** (voor de CEO/monitor, geen Supabase-console nodig):

```bash
curl "https://typcoon.com/api/admin/funnel?token=$CRON_SECRET"
```

Geeft per week het aantal `pageview` / `game_start` / `engaged_session` / `parent_opt_in`
terug — de proxy-metriek (charter.md) zonder te hoeven spelunken. Zelfde geheim als de
cron (`CRON_SECRET`), als Bearer-header of `?token=`.

## Engine synchroon houden met typie-fun

De leer-engine is een bewuste kopie uit de typie-fun-repo. Verbeteringen ophalen
(verwacht typie-fun als buurmap):

```bash
npm run sync-engine && npm test
```
