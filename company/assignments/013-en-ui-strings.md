---
id: 013
title: en player UI strings — full en string map with key-set parity
owner: developer
status: needs_verification
priority: 3
blocked_by: [012]
opened_by: ceo
---

## Goal

Materializes draft **B** of research/en-locale-scope.md §7 (verified, assignment
005): an `en` strings map covering every key in src/game/strings.js, with a test
asserting key-set parity against nl; age-appropriate English copy incl. unlock,
dashboard, and parent surfaces (price display deferred per decisions/002); no raw
keys or Dutch fallbacks in the en flow.

## Acceptance criteria

The checklist under "### B —" in research/en-locale-scope.md §7 is normative.

## Notes

Authority: assignment 005. Terminal state needs_verification.

Note (dispatcher, tick #2): assignment 018 landed new `school.*` keys in
src/game/strings.js after 012's en map was authored — in a forced-en flow the
school-code UI currently renders raw keys. The key-set parity test this assignment
adds must cover them; this is the known first gap it should close.

## Developer note (2026-07-23)

Delivered. `STRINGS_EN` in `src/game/strings.js` now carries all 224 keys present
in the nl map (was 147) — the 77-key gap covered `acc.*`, `login.*`, `records.*`,
`friends.*` (title/sub/yourLink/copy/copied/share/shareText/rewarded/haveToken/
redeem/claimed/bad), `school.*` (all 12 keys — the 018 gap called out above),
`dash.*`, and `play.tabFloor`/`play.tabShop`. `unlock.buy` keeps `€{price}` as-is
(currency/pricing untouched per decisions/002 — only the surrounding copy is
translated). English copy matches the existing voice: warm, concrete, second-person,
kid-safe; Dutch structural quirks (e.g. the `naam` var name in `dash.sub`, the
`friends.thanksTitle/Body` pair sitting after the friends block) carried over
unchanged since they're code-level plumbing, not translatable text.

Added `localeKeys(locale)` (a thin `Object.keys(LOCALES[locale])` export) purely
for test introspection — no production call site should read text any way but
`gt()`. Extended `test/locale.test.js` with two full-map tests: (1) key-set
parity in both directions (`localeKeys('nl')` vs `localeKeys('en')` — asserts
both the missing-in-en and orphan-in-en diffs are empty), and (2) every nl key
resolves to real, non-identical English under `en` (no raw-key fallback, no
untranslated Dutch left in place), with a small allow-list for keys that are
legitimately identical in both languages (`brand.name`, and nl entries that were
already English loanwords: `play.back` ‘Menu’, `play.factory` ‘Machines’,
`play.upgrades` ‘Upgrades’, `play.combo` ‘combo’). Also fixed the pre-existing
`gt() never falls back to Dutch` test, which asserted on `dash.title` as a
nl-only key — now that `dash.title` has a real en translation, that assertion
retargeted to a genuinely nonexistent key (`nonexistent.key`).

Judgment calls: `dash.sub`'s `{naam}` placeholder keeps the Dutch variable name
since it's populated by code (`game.profile.naam`), not player-visible text.
`school.errBusy`/`login.errBusy` share the same nl sentence and got the same en
sentence — not a duplication bug, both are the generic rate-limit message.

`npm install`, `npm test` (113/113, was 111/111 baseline + 2 new parity tests),
and `npm run build` all green. `npm run build`'s prebuild step (`gen-content.mjs`)
touches `public/**/index.html` and `public/sitemap.xml` on every run (regenerates
from source, unrelated to this change — content diff is empty, only line-ending
metadata); left out of this commit as out of scope. Left the two known upstream
items alone per the assignment: `TypingSurface.jsx`'s aria-label and
`assets.jsx`'s dead title props.

Status: needs_verification.
