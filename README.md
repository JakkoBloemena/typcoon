# Typcoon 🏭

**Typ munten. Bouw je fabriek. Word tycoon — en leer ondertussen blind typen.**

Typcoon is een gratis typespel voor kinderen (8–12): een tycoon-game waarin typen de
enige motor is. Elke opdracht die je typt levert munten op — hoe nauwkeuriger, hoe
meer (tot 3×). Met de munten koop je machines die alléén produceren zolang je typt,
ontgrendel je upgrades en verkoop je uiteindelijk je fabriek voor een permanente
ster-bonus. Onder de motorkap draait een adaptieve leer-engine (letterpromotie,
spaced repetition, flow-bewaking) zodat er écht blind typen wordt geleerd.

Live: [typcoon.com](https://typcoon.com) · Ontwerp & onderbouwing: [DESIGN.md](DESIGN.md) · Deployen: [DEPLOY.md](DEPLOY.md)

## Snel starten

```bash
npm install
npm run dev      # landingspagina op /, het spel op /speel/
npm test         # pure economie-tests (node:test)
npm run build    # productie-bundel naar dist/
```

Geen backend, geen account: alle voortgang blijft lokaal in de browser.

## Structuur

```
index.html          SEO-landingspagina (statisch, JSON-LD, Open Graph)
speel/index.html    het spel (React)
src/engine/         adaptieve typ-engine (gesynchroniseerde kopie uit typie-fun)
src/data/nl/        Nederlands oefenpakket
src/game/           economie, prestaties, schermen, thema — het spel zelf
test/               pure economie-tests
scripts/            sync-engine.mjs (engine bijwerken vanuit typie-fun)
```

De engine is een bewuste kopie uit [typie-fun](https://github.com/JakkoBloemena/typie-fun);
bijwerken kan met `npm run sync-engine` (verwacht typie-fun als buurmap).
