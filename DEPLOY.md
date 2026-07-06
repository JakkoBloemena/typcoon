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

## Engine synchroon houden met typie-fun

De leer-engine is een bewuste kopie uit de typie-fun-repo. Verbeteringen ophalen
(verwacht typie-fun als buurmap):

```bash
npm run sync-engine && npm test
```
