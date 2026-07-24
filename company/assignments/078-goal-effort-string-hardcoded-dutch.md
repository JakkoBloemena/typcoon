---
id: 078
title: "goal.effort ('± N opdrachten') is hardcoded Dutch regardless of active locale"
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (proposed)
---

## Goal

`nextGoal`'s `effort` field (`src/game/goals.js`, assignment 071) is built directly as a
template string — `` `± ${n} opdrachten` `` (see `effortLabel()`) — with no `gt()` call, so
it renders as literal Dutch **even in an `en` session**. `test/goals.test.js`'s own
contract check (`assert.match(g.effort, /^± \d+ opdrachten$/...)`) locks in this exact
Dutch text as "the" shape of the field, for both locales.

This was latent and invisible until now: 071 built the helper but never rendered
`effort` anywhere; 073's goal sliver only shows `remaining` (`goal.remaining`, itself
localized via `gt('goal.remaining', ...)`), not `effort`. Assignment 074 (factory page
"Het Bouwplan") is the **first** surface to actually display `goal.effort` — in the
spotlit goal panel's `goal.togoLine` string (`"nog {n} munten — dat haal je in
{effort}"` / its en counterpart). Because `effort` itself is hardcoded Dutch, an
English-locale player would see `"100 coins to go — about ± 6 opdrachten away"` — a
literal Dutch word leaking into an English screen.

Out of scope for 074 to fix inline: `goals.js` is 071's delivered file (not
`economy.js`), and localizing it correctly means adding an English variant of the
"± N opdrachten" pattern (e.g. via a new `gt()` key such as `goal.effort`) plus
re-verifying `test/goals.test.js`'s regex-based contract check against both locales —
a real, scoped fix, not a one-line tweak inside a presentation-only assignment.

## Acceptance criteria

- [x] `effortLabel()` (or `nextGoal`'s construction of the `effort` field) renders
      correctly in the active locale — e.g. via a new `strings.js` key
      (`goal.effort` or similar) with real nl/en translations, not a hardcoded template
      string.
- [x] `test/goals.test.js`'s effort-format assertion is updated to check the *pattern*
      per active locale (or is re-scoped to only assert the Dutch/default locale,
      with a new explicit en-locale test added) — not a Dutch-only regex applied
      unconditionally.
- [x] `test/locale.test.js`'s full-map parity + no-raw-key/no-Dutch-fallback checks
      cover the new key.
- [x] Manually confirm (or script) that an `en` session's factory page
      (`goal.togoLine`, assignment 074) shows no Dutch word.
- [x] `npm test` stays green.

## Delivery notes (developer, 2026-07-24)

**Locale-seam decision:** `goals.js` already imports and calls `gt()` for every other
descriptor field (`gt('building.' + id)`, `gt('upgrade.prod', {x})`, `gt('rebirth.button')`,
etc.) with no locale argument — it relies on `gt()`'s own module-level `activeLocale`,
set once per render by `App.jsx`'s `setLocale(profile.uiTaal ...)` before any child
(`GameScreen`/`Shop`/`nextGoal`) runs. `effortLabel()` was the one outlier building raw
text instead of going through that existing seam. Fix: added a `goal.effort` key to
`strings.js` (nl: `'± {n} opdrachten'`, en: `'± {n} tasks'`) and changed
`effortLabel()` to `return gt('goal.effort', { n });` — matching the file's own established
pattern exactly, no new mechanism, no locale parameter threaded through `nextGoal`.

**Changes:**
- `src/game/goals.js`: `effortLabel()` now calls `gt('goal.effort', { n })` instead of
  building `` `± ${n} opdrachten` `` directly.
- `src/game/strings.js`: added `'goal.effort': '± {n} opdrachten'` (nl) /
  `'goal.effort': '± {n} tasks'` (en), placed next to `goal.togoLine` in both maps.
- `test/goals.test.js`: split the old single Dutch-only regex assertion — kept it as the
  nl-default check on the existing descriptor-contract test, and added a new test
  (`effort renders via gt() in the active locale ...`) that additionally calls
  `setLocale('en')`, asserts `/^± \d+ tasks$/`, then resets to `'nl'` for the rest of the
  suite.
- `test/locale.test.js`: added `'goal.effort'` to `STATIC_FLOW_KEYS` (same list
  `goal.togoLine`/`goal.spotKicker` are already in), so it's covered by the
  home→onboarding→gameplay no-raw-key check; the full-map parity and
  no-raw-key/no-Dutch-fallback tests already iterate every key in `STRINGS`
  dynamically and pick it up automatically.
- `qa-scripts/078-verify.mjs` (new): Playwright-driven check — loads `/speel/?lang=en`,
  marks the device onboarded (`localStorage['typcoon:onboarded']='1'`, same flag the app
  itself sets after a real playthrough) to skip the typed-drill gate, starts a factory,
  dismisses the daily "Welcome back!" moment overlay, opens the Factory page, and asserts
  `.goalspot-togo`'s rendered text matches `/coins to go — about ± \d+ tasks away$/` with
  no Dutch tell words. Not wired into `npm test` — a one-off manual QA script per the
  assignment brief, run with a `vite preview --port 4233` server up.

**Verification:**
- `npm test` (unit tests + `gen-content` + `vite build` + `check-no-dutch-en`):
  **230/230 pass** (baseline 229 + 1 new test), `vite build` succeeded,
  `check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words,
  zero unallowlisted hits.`
- `qa-scripts/078-verify.mjs` against `vite preview --port 4233` (Playwright via
  `playwright-core`, cached Chromium): printed
  `goal.togoLine rendered text: "15 coins to go — about ± 2 tasks away"` and
  `PASS — en factory page spotlight shows zero Dutch (goal.effort now localizes).`
  This was the sole known Dutch leak on the en factory page per the 074 tester's note;
  after this fix it's gone.
- Port 4233 server killed after verification; `public/**`/`sitemap.xml` gen-content
  churn reverted via `git checkout -- public/` before committing; `save-compat` files
  (`store.js`/`economy.js`/engine/`theme.js`) untouched.

## Verification (tester, tick #29)

Independently verified in worktree `C:\companies\typcoon-lanes\v078` (branch `verify/078`,
port 4235). Did not just re-run the dev's `qa-scripts/078-verify.mjs` — read the seam
directly, wrote a fresh Playwright script driving both locales, and deliberately broke
the `en` string locally to prove the new tests actually trip.

- **AC1 (locale seam, real translations) — PASS.** `src/game/goals.js:38-44`
  `effortLabel()` is now `return gt('goal.effort', { n });` with no template string left.
  `src/game/strings.js:223` nl = `'± {n} opdrachten'`, line 545 en = `'± {n} tasks'` — a
  real translation, not a copy-paste of the Dutch value.
- **AC2 (per-locale test, not unconditional Dutch regex) — PASS.**
  `test/goals.test.js`'s descriptor-contract test (line 99) now only asserts the nl
  pattern, and a new test (lines 105-113) calls `setLocale('en')`, asserts
  `/^± \d+ tasks$/`, and resets to `'nl'`. I deliberately reverted the en string in
  `strings.js` to `'± {n} opdrachten'` and reran `node --test test/goals.test.js`: the new
  test failed exactly as expected (`actual: '± 1 opdrachten'`, expected en pattern) while
  the other 10 tests in the file stayed green. Restored the string afterward
  (`git diff --stat src/game/strings.js` showed no diff after restore) — this is a test
  that guards the regression, not just one that exists.
- **AC3 (locale.test.js coverage) — PASS.** `goal.effort` is in `STATIC_FLOW_KEYS`
  (`test/locale.test.js:64`), and the full-map parity/no-raw-key/no-Dutch-fallback tests
  (lines 113-145) iterate `localeKeys('nl')` dynamically so they pick it up without a
  named-key change. Confirmed by driving the same deliberate-break above through
  `node --test test/locale.test.js`: the "every key in the map resolves to real English"
  test failed independently, reporting `stillDutch: ['goal.effort']` — a second,
  independent tripwire beyond the goals.test.js one.
- **AC4 (en factory page, no Dutch) — PASS.** Wrote a fresh Playwright script (not the
  dev's), ran it against `vite preview --port 4235` for both an `en` and default `nl`
  session (`localStorage['typcoon:onboarded']='1'`, start factory, dismiss the daily
  overlay — nl overlay button is `'Aan de slag!'`, not `"Let's go!"`, which I confirmed by
  reading `strings.js:178` after the dev's exact en-only selector didn't generalize).
  Rendered `.goalspot-togo` text:
  - en: `"15 coins to go — about ± 2 tasks away"` — zero Dutch words, matches the expected
    shape exactly.
  - nl (sanity check): `"nog 15 munten — dat haal je in ± 2 opdrachten"` — unaffected,
    still Dutch as intended.
- **AC5 (npm test green) — PASS.** `npm test`: **230/230 unit tests pass**, `vite build`
  succeeded, `check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch
  lexicon words, zero unallowlisted hits.` `public/**`/`sitemap.xml` gen-content churn
  reverted via `git checkout -- public/` before committing.

**Verdict: all 5 ACs hold, independently confirmed. Status -> done.**

No distinct defect found beyond 078's scope during this pass (the render call site
`Shop.jsx:191` composes `goal.togoLine`/`goal.effort` cleanly, no double-localization or
leftover raw-key risk) — assignment 081 lapses, not filed.

## Notes

Found while building 074 (developer, 2026-07-24): the factory page's spotlit-goal
panel is the first place `goal.effort` is actually rendered, which is what surfaces
this. Not a 074 defect — 074 renders the field the descriptor gives it, per its own
scope (presentation only, reusing `nextGoal`'s output verbatim). Not blocking 074's
acceptance criteria (which do not require locale-correctness of a field 071 already
shipped and tested); filed separately per the "don't fix drive-by discoveries inside
the current assignment" rule.
