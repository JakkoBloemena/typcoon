# Typcoon — ontwerp & onderbouwing

**Wat:** een op zichzelf staand merk (typcoon.com): een tycoon-game voor kinderen
(8–12) waarin typen de enige motor is. Onder de motorkap draait typie's adaptieve
leer-engine (onzichtbaar); daarbovenop een volwaardige tycoon-laag.

**De weddenschap** (uit `tycoon-pivot.md` in de typie-fun-repo): optimizer-kids richten hun min-max-drang
op typnauwkeurigheid als dát de grootste hefboom is. Typen is de enige muntfaucet;
nauwkeurigheid is de multiplier (steil boven 95%); een auto-typer print rommel en
verdient ~niets — vals spelen is nutteloos van constructie.

## Onderzoek → ontwerpkeuzes

### Wat kinderen vasthoudt in tycoon-games
Uit analyse van de populairste kinder-tycoons (Super Hero Tycoon, Theme Park Tycoon 2,
Restaurant Tycoon 2, Lumber Tycoon 2, Grow a Garden) en idle-game-design:

| Bevinding | In Typcoon |
| --- | --- |
| Je imperium **zichtbaar** zien groeien is de kern (bouwen > cijfers) | **Fabrieksvloer**: elke gekochte machine staat als draaiende tegel in beeld — en dimt als je stopt met typen |
| Mijlpaal-beloningen per gebouw (25/50/100-boosts in Idle Miner e.d.) | **Machine-mijlpalen**: Lv 10/25/50 → tempo van die machine ×2, met "nog N levels"-teaser (goal-gradient) |
| Prestige/rebirth is dé lange-termijn-haak: reset voelt als versnelling | **Fabriek verkopen** → ⭐ ster = permanent +25% op alles. De **leer-voortgang reset nooit** — alleen de economie |
| Variabele beloningen (golden cookie-momenten) houden het spannend | **Gouden opdrachten**: ~12% kans, ×3 munten, gouden gloed + fanfare |
| Directe upgrade-feedback: kopen moet meteen iets doen | Kopen = tegel op de vloer + hoger ⚙️/s, meteen zichtbaar |

### Wat de leerwetenschap zegt
| Bevinding | In Typcoon |
| --- | --- |
| Directe, hoogfrequente feedback versnelt vaardigheden leren en voorkomt inslijten van fouten | **Combo-meter** per aanslag (elke 10 foutloos = +10% bonus, cap +50%) + live ×-meter per opdracht |
| Retrieval practice + spaced repetition = hoogste leerrendement | De engine (SRS + zwakke-letters-herhaling) draait onaangetast door |
| Nauwkeurigheid vóór snelheid | De multiplier-curve: <60% betaalt niets; 95–100% is het steilste stuk (×1,5 → ×3,0) |
| Deliberate practice = heldere doelen net boven je niveau | Flow-governor + letterpromotie van de engine; elke nieuwe letter ontgrendelt een machine (curriculum = tech-tree) |
| Beloningen informatief houden (overjustification vermijden) | Vier-momenten vieren meesterschap; geen straf, geen ranglijst, geen tijdsdruk |

Bronnen: [Roblox Den — beste tycoons](https://robloxden.com/best-games/genres/tycoon) ·
[PocketGamer — Idle Bank Tycoon deconstructie](https://www.pocketgamer.biz/game-analysis-deconstructing-idle-bank-tycoon-by-kolibri-games/) ·
[Missions Zanx — idle game design](https://missionszanx.com/guides/idle-game-design-systems-mechanics-and-progression) ·
[TV Tropes — Reset Milestones](https://tvtropes.org/pmwiki/pmwiki.php/Main/ResetMilestones) ·
[Structural Learning — deliberate practice](https://www.structural-learning.com/post/deliberate-practice) ·
[PMC — repetitive skills & feedback](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4339240/)

## De economie (alles puur + getest, `src/game/economy.js`)

```
uitbetaling per opdracht = 10 × nauwkeurigheid-mult (0 | 0,5–1,5 | 1,5–3,0 steil)
                              × combo-mult (1,0–1,5)
                              × payout-upgrades (×2, ×2)
                              × ⭐ prestige (1 + 0,25/ster)
                              × goud (×3 bij gouden opdracht)

productie/sec = Σ machines (level × tempo × mijlpaal-mult 2^bereikt)
                × prod-upgrades × ⭐ prestige
                — alléén terwijl er getypt wordt (venster ~3,5 s). Nooit idle.
```

Machines (ontgrendeld door letters te leren): Typemachine (0) → Drukpers (5) →
Robotarm (10) → Lopende band (18) → Mega-fabriek (26).
Rebirth-drempel: 25.000 munten in de run, elke volgende ster 4× duurder.

## Architectuur

Zelfstandig Vite-project in `typcoon/` (eigen package.json, build, tests, deploy):

```
index.html          SEO-landingspagina (statische HTML, JSON-LD VideoGame + FAQPage, OG)
speel/index.html    het spel (React, noindex — de landing draagt de SEO)
public/             robots.txt, sitemap.xml, favicon.svg, og.png
src/engine/         GESYNCHRONISEERDE kopie van typie's pure engine (12 modules)
src/data/nl/        oefendata (bigrams, frequenties, woorden, zinnen, curriculum)
src/layouts/        qwerty-nl
src/ui/             TypingSurface + sound (kopie), Keyboard (aangepast: geen i18n)
src/game/           economy, achievements, strings, store, App, GameScreen, FactoryFloor, css
test/               18 pure economie-tests (node --test)
scripts/sync-engine.mjs   haalt engine-updates op uit de typie-fun-buurmap (bewuste sync)
```

Er lekt niets van het typie-merk naar de speler; de engine-hergebruik is onzichtbaar.

## Wat bewust NIET

- **Geen idle/offline-inkomsten** — dan is typen niet meer de enige faucet.
- **Geen managers/auto-typers** — automatisering is precies wat we niet belonen.
- **Geen ranglijsten/tijdsdruk/straf** — gezond houden (zie GAMIFICATION.md in de typie-fun-repo).
- **Geen aankopen** — gratis, lokaal, privacyvriendelijk.

## Het experiment dat telt

3 dagen, zoon + 2 optimizer-kids, niet helpen. Kijk naar één ding: typt hij vrijwillig
opnieuw om zijn nauwkeurigheid (en combo) op te krikken richting ×3 — of stopt hij bij
"goed genoeg"? Dat besluit of we breedte bouwen (skins, tweede taal, meer machines,
seizoensevents) of het roer omgooien.
