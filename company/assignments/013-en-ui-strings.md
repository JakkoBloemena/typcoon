---
id: 013
title: en player UI strings — full en string map with key-set parity
owner: developer
status: done
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

### Verification (tester, 2026-07-23)

Verified independently in an isolated worktree (`verify/013`), against the
normative checklist under "### B —" in `research/en-locale-scope.md` §7.

**Setup:** `npm install` clean. `npm test` → **126/126 pass** (current main-tip
baseline, not the 113/113 the dev note cites from before other assignments
merged — expected per dispatcher instructions). `npm run build` → clean, no
errors (`gen-content: 17 URLs … + sitemap`, vite build succeeds, 94 modules
transformed). Confirmed the prebuild step's `public/**/index.html` +
`sitemap.xml` touch is line-ending-only noise, not a content diff (reverted
with `git checkout -- public/` after each build, tree came back clean).

**Criterion 1 — en map covers every nl key, parity test exists.** Loaded
`src/game/strings.js` directly (`localeKeys('nl')` vs `localeKeys('en')`):
both maps have **235 keys**, `missingInEn: []`, `orphanInEn: []` in both
directions. `test/locale.test.js` has the two full-map tests described
(`'en and nl string maps have identical key sets (both directions)'` and
`'every key in the map resolves to real English…'`), both pass. PASS.

**Criterion 2 — age-appropriate English copy, matches voice, unlock/
dashboard/parent included, price deferred to 002.** Read every en string;
copy is warm, concrete, second-person, kid-safe (British spelling used
consistently — "licence", "colour", "neater" — no mixed AmE/BrE). Walked the
full player flow with Playwright/Chromium against the dev server
(`?lang=en`) end-to-end: home → account-link modal → login modal → school
licence modal → onboarding (intro → home-row → drill, typed the actual
`fj dk sl a; fdsa jkl;` row to pass the gate → superpower) → live gameplay
→ records → friends/invite → share card → parent dashboard → unlock paywall
(solved the real math gate, e.g. `5×4=`, then hit the buy screen and the
"factory is yours" done screen). Every one of these rendered fully in
English. `unlock.buy` correctly still shows **"Unlock for €19,99"** — comma
decimal, € symbol, untouched — matching decision 002 (price display
deferred; only surrounding copy translated). School licence (12 `school.*`
keys — the 018 gap this assignment had to close) all present and correctly
translated: `linkLabel, title, sub, label, submit, errInvalid, errExpired,
errBusy, errOffline, doneTitle, doneBody, doneGo`. `dash.*` (parent
dashboard) fully English including the note about accuracy-before-speed.
PASS.

**Criterion 3 — no raw key or Dutch fallback in the en flow.** Programmatic
check: identical-value keys under nl vs en are exactly the 5 the dev's
allow-list claims — `brand.name` (proper noun), `play.back` ("← Menu" —
Dutch also borrows "Menu"), `play.factory` ("Machines" — same spelling,
valid English word), `play.upgrades` ("Upgrades" — English loanword in
Dutch), `play.combo` ("combo" — English loanword). No other key collapsed
to the same string, so the allow-list isn't hiding a missed translation.
Live-browser walk-through (above) surfaced **zero raw `key.name` strings and
zero Dutch text** anywhere in the flow, including screens outside the
static home→onboarding→gameplay set that the dev's own `FLOW_KEYS` test
list doesn't cover (dashboard, friends, records, share, account-link,
login, school licence, unlock paywall+buy+done) — all checked live, not
just asserted by the test suite. Regression-checked the default `nl` flow
(no `?lang=en`) unaffected — home screen still fully Dutch. PASS.

**Adjacent observations (not criteria failures, reported to dispatcher
separately):** a decorative "T" glyph baked into the coin/machine SVG art
(`assets.jsx`) is language-neutral iconography, not translatable text — not
a bug. Dev-server-only `POST /api/track` 404s during the Playwright run are
pre-existing local-dev behavior (no `vercel dev`/serverless functions
running), unrelated to i18n.

**Verdict: all three criteria PASS. Status set to `done`.**
