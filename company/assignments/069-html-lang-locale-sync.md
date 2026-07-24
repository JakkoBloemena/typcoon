---
id: 069
title: "<html lang> never syncs to the active UI locale (breaks lang-dependent CSS/a11y for English sessions)"
owner: developer
status: open
priority: 3
opened_by: tester
---

## Context

Found during 079 verification (world-pass design deep-dive), not caused by 079 — 079 touched
only `design/**`, no `src/**`. Filed here because the 079 spec itself (`design/DESIGN-FACTORY.md`
§W2f, the 080 hyphenation fix) states its fix "requires the active locale on `<html lang>` (nl/en)
for the correct hyphenation dictionary." That precondition is not actually true of the shipped
app today, so whoever cuts the build slice for W2f should know before assuming `hyphens:auto`
will behave correctly for English sessions.

## The bug

`index.html` hardcodes `<html lang="nl">` and nothing in `src/**` ever updates it:
- `src/game/App.jsx`'s `detectLocale()`/`setLocale()` (the `?lang=en` / saved `uiTaal:'en'`
  mechanism) only drives the `gt()` string-lookup table — it never touches
  `document.documentElement.lang`.
- The only place `document.documentElement` is written anywhere in the codebase is
  `src/game/theme.js` (`setAttribute('data-theme', ...)` / `removeAttribute`) — confirmed via
  `grep -rn "documentElement" src/`.

Result: a player on the English locale (arrived via the en-landing's `?lang=en`, or with a saved
profile `uiTaal: 'en'`) sees English strings the entire session while `<html lang>` stays `"nl"`.
Any browser/CSS behaviour that keys off the `lang` attribute — hyphenation dictionaries
(`hyphens:auto`, about to be added by 079/W2f), typographic quote glyphs, screen-reader
pronunciation/voice selection — runs under the wrong locale for that entire session.

## Why it matters now specifically

079's W2f re-specs the werkbank upgrade-tile fix (defect 080) to use `hyphens:auto` instead of
`overflow-wrap:anywhere`, explicitly because CSS hyphenation needs the correct `lang` to pick a
dictionary. Verified (via forced-narrow render) that the Dutch case works correctly:
`Precisiegereedschap` breaks as `Precisiege-` / `reedschap` under `<html lang="nl">`. But since
`<html lang>` never becomes `"en"`, any future English content relying on `hyphens:auto` would
silently hyphenate under the Dutch dictionary — wrong breaks, or none, depending on browser
behaviour. (The current English string for this specific tile, `"Precision tools"`, is two words
and happens not to trigger the bug — but the underlying mechanism is broken for any future
English long-compound content, and for hyphenation/quotes/a11y elsewhere in the app.)

## Reproduction

1. Open the app with `?lang=en` (or set a saved profile's `uiTaal` to `'en'`).
2. In devtools console: `document.documentElement.lang` → returns `"nl"`, not `"en"`, for the
   whole session even though the UI is rendering English strings.
3. `grep -rn "documentElement" src/` → only hit is `theme.js`'s `data-theme` write; no `.lang =`
   assignment anywhere.

## What would satisfy this

When `setLocale()` (or wherever the active locale is finalized in `App.jsx`) runs, also set
`document.documentElement.lang = locale` (`'nl'` or `'en'`), mirroring how `theme.js` already
syncs `data-theme`. Should run once locale is determined (same point that currently gates the
first `gt()` call, per the comment in `App.jsx` about avoiding a Dutch-then-English flash).

## Scope note

Not blocking 079 — 079's own mocks correctly declare `lang="nl"` and were verified to hyphenate
correctly under that locale. This is a pre-existing gap in the live app's locale-switching code,
surfaced because 079's spec depends on `<html lang>` being locale-accurate going forward.
