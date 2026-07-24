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

## Thema's — premium breedte, één spelwereld (assignment 051 + 052)

Het uiterlijk is één **spelwereld** met verwisselbare seizoensverf, geen skin-catalogus.
Een thema is een NAMED SET van dezelfde CSS-custom-properties uit `game.css`'s `:root` —
niets anders. Wisselen zet alleen een `data-theme`-attribuut op `<html>` (`src/game/theme.js`);
**geen enkele economie-waarde beweegt mee** (charter-guardrail 2; bewaakt door
`test/theme.test.js`). De keuze woont in een eigen localStorage-sleutel (`typcoon:theme`),
nooit in het savebestand.

**Regel voor de bouwer:** een nieuw thema is klaar als het (a) elke tokennaam uit `:root`
opnieuw zet, (b) een label + beschrijving in nl én en heeft (`strings.js`), en (c) een
`[data-theme='id']`-blok in `game.css` heeft. `test/theme.test.js` faalt bij een
half-toegevoegd thema. Standaard (Muntpers) is gratis en compleet; alternatieven staan
`free: false` en gaten achter de familie-unlock.

**De vier thema-haken** (052) — de plekken die vroeger een vaste kleur hadden en dus niet
mee-verkleurden. Elk heeft een `:root`-default gelijk aan het oude Muntpers-uiterlijk, zodat
de standaard byte-identiek blijft; elk `[data-theme]` overschrijft ze zodat een thema als een
andere **plek** leest, niet als een accent-tint:

| Token | Wat | Waarom een haak |
| --- | --- | --- |
| `--on-accent` | inkt óp de accentkleur (knoplabels, munt-pill, multiplier) | bij een donker accent (Nachtploeg-violet) moet de inkt licht worden, anders zakt het knoplabel onder WCAG AA |
| `--sink` | de harde onderrand/slagschaduw onder panelen ('de bodem') | een thema-eigen diepe tint verankert de wereld; een vaste navy-schaduw op teal/plum leest vies |
| `--bg-wash` | zachte gloed bovenaan de grond | de sfeerkleur van de ruimte |
| `--bg-grid` | de blauwdruk-rasterlijnen op de grond | grootste vlak in beeld; verandert de vloer van blauwdruk → snoep → zeebodem |

**De vier plekken** (specifieke referentie stuurt beter dan "modern/fris"):

- **De Muntpers / The Coin Press** (standaard, gratis) — een blauwdruk-controlekamer die een
  kind mag bedienen: navy werkplaats, messing munten, gevarenstrepen, LED-tellers.
- **Nachtploeg / Night Shift** — *dezelfde fabriek na sluitingstijd, verlicht door neon-buizen*.
  Diep indigo-violet, elektrisch-violet accent met lichte inkt, cyaan noodlampjes. Evolueert
  051's proof-of-swap tot een afgewerkt thema (051's minimale versie is vervangen).
- **Snoepfabriek / Sugar Rush** — *een snoepfabriek 's avonds*: bessen-paarse grond, heet-roze
  hefboom, muntgroene band, citroenglans. Warm en zoet — het tegendeel van de koele blauwdruk.
- **Diepzee / Deep Dive** — *de fabriek op de zeebodem*: diep teal-zwart, koraal-oranje hefboom
  (warm accent op koele grond = maximaal contrast), zeeschuim-groene band, aqua sterlicht. De
  teal-hue komt in geen ander thema voor.

De vier gronden spannen navy → violet → plum → teal; de vier accenten goud → lavendel → roze →
koraal. Bewust maximale spreiding: elk thema is een plek, geen accent-variant. De verworpen
kandidaten (Ruimtebasis/space-cyaan, Zonnesmederij/amber) verloren de pairwise-selectie omdat
hun grond/accent te dicht bij de standaard lag (screenshots: `company/assignments/052-screenshots/candidates/`).

**Contrast is berekend, niet geschat.** `qa-scripts/contrast-052.mjs` rekent alle betekenis-
dragende paren (body-tekst, munt-pill, typvlak, knoplabels, semantische pillen) per thema uit;
alle vier halen WCAG AA (body ≥ 4,5:1, grote/accent ≥ 3:1). Draai het script bij elke nieuwe
thema-tint.

## De fabriekspagina + de rustige typweergave (assignment 067, ADR 011)

De speelkern wordt gesplitst: een **rustige typweergave** (typen is het werkvlak, één
doel-strip, geen constante animatie) en een aparte **fabriekspagina — "Het Bouwplan"**
(een blauwdruk-route van machines die je invult: gebouwd = ingekleurd, volgende = "NU
BOUWEN", later = spookcontour). Zelfde Muntpers-tokens en zelfde thema-mechaniek
(051/052 cascaderen automatisch over beide vlakken). De volledige richting — de drie
vergeleken varianten, de pairwise-keuze, de winnende tokens/layouts, het doel/voortgang-
model, en wat van de huidige UI blijft vs. vervangen wordt — staat in
**[`design/DESIGN-FACTORY.md`](design/DESIGN-FACTORY.md)** met mocks in
`design/factory-mocks/`.

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
