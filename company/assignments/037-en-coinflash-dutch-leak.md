---
id: 037
title: en locale — coin-flash popup leaks hardcoded Dutch
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #4), filed by the 033 acceptance-QA tester (reproduced defect — tester sets priority by user impact per PROTOCOL)
---

## Goal

With the locale forced to en, the coin-flash popup after completing an exercise shows
hardcoded Dutch instead of English: e.g. "×3.0 netjes · ×1.1 combo · ×1.5 opwarm". The
literals live in `src/game/GameScreen.jsx` lines ~355, 357, 358. Wrap them in `gt()` with
new nl/en string keys so the en session shows zero Dutch (the "neat" equivalent already
exists in en at `play.accuracyLever` for reference). This fails 033's "shows zero Dutch"
bar; it is not core-flow-breaking today because en is correctly gated and unlaunched, but
it ships broken the moment 017 opens the en launch gate.

## Acceptance criteria

- [x] In an en session, completing an exercise shows the coin-flash popup entirely in
      English (no "netjes"/"opwarm"/other Dutch), with the multiplier values unchanged.
- [x] The nl session's coin-flash popup is unchanged (byte-identical strings).
- [x] New string keys exist in both the nl and en string maps (no key present in one map
      and missing from the other — the 013 parity bar holds).
- [x] Full test suite green; clean build.

## Notes

Repro: build, open `/speel/?lang=en`, start factory, finish onboarding, complete any
exercise. Screenshot evidence:
`company/assignments/033-screenshots/en-06-dutch-leak-coinflash.png`.
Found and reproduced by the 033 acceptance-QA tester (tick 2026-07-23 #4); priority 3 —
visible on every exercise completion in en, but the locale is not yet live.
Terminal state needs_verification.

## Build notes (developer, 2026-07-23)

Wrapped the three hardcoded Dutch literals in `src/game/GameScreen.jsx`'s coin-flash
popup in `gt()`, adding three new string keys (`play.flashNeat`, `play.flashGold`,
`play.flashWarmup`) next to `play.combo` in both maps in `src/game/strings.js` —
same idiom as `play.accuracyLever`'s "netjes"/"neat" pairing. `play.combo` (the fourth
word in the popup) was already `gt()`-wrapped and is identical in both languages by
design (see `IDENTICAL_BY_DESIGN` in test/locale.test.js), so it was left as-is — not
in scope (assignment only calls out lines ~355/357/358).

New keys also added to `STATIC_FLOW_KEYS` in `test/locale.test.js` (the
home → onboarding → gameplay flow list), since the coin-flash popup fires on every
exercise completion in that flow.

Popup text, `×{acc} {neat} · ×{comboMult} combo · ×3 {gold} · ×{boost} {warmup}`
(middle/last segments only render when combo/golden/boost apply):

- nl before: `×3.0 netjes · ×1.1 combo · ×3 goud · ×1.5 opwarm` (unchanged after — same
  literals, now sourced from `gt()` instead of hardcoded, byte-identical output)
- en before (bug): `×3.0 netjes · ×1.1 combo · ×3 goud · ×1.5 opwarm` (leaked Dutch)
- en after (fix): `×3.0 neat · ×1.1 combo · ×3 gold · ×1.5 warm-up`

Multiplier values (`×3.0`, `×1.1`, `×3`, `×1.5`) are untouched — only the trailing
words changed.

Verified with a one-off Node script (`gt()` under both locales) that nl resolves to
`netjes`/`goud`/`opwarm` and en resolves to `neat`/`gold`/`warm-up`.

Test suite: `npm test` → 143/143 pass (0 fail), including the existing full-map nl/en
key-parity test (`test/locale.test.js`, "en and nl string maps have identical key
sets") and the no-raw-key / no-Dutch-fallback tests, which cover the three new keys
automatically. `npm run build` → clean (vite build succeeded); build regenerated
`public/**` (line-ending-only churn per the established SSG precedent) and this was
reverted with `git checkout -- public/` before committing.

Files changed: `src/game/GameScreen.jsx`, `src/game/strings.js`, `test/locale.test.js`.

## Verification (tester, 2026-07-23)

Re-derived independently in worktree `C:\companies\typcoon-lanes\v037` (branch
`verify/037`, main `8245c9b`). Did not take the build notes' word for anything below.

**Diff scope** — `git show 54ada61` confirms exactly 3 code/test files touched:
`src/game/GameScreen.jsx` (6 lines: 3 literals wrapped in `gt()`), `src/game/strings.js`
(6 lines added: 3 new keys × 2 maps), `test/locale.test.js` (1 line: 3 keys added to
`STATIC_FLOW_KEYS`). Nothing out of scope changed. Integration commit `01b64ae` is a
clean merge of the same diff.

**Test suite** — `npm install` clean, then `npm test`: **143/143 pass, 0 fail, 0
skipped** (matches claim exactly). Confirmed `test/locale.test.js` actually contains
and runs full-map, bidirectional key-parity (`'en and nl string maps have identical
key sets (both directions)'`, asserting both `missingInEn` and `orphanInEn` are
empty over the entire map via `localeKeys()`, not just the flow subset) plus a
separate full-map no-raw-key / no-Dutch-fallback test. Both cover the 3 new keys
automatically since they're regular entries in both `STRINGS` and `STRINGS_EN`.

**Build** — `npm run build` clean (vite build succeeded, 94 modules). Build
regenerated `public/**` (line-ending-only SSG churn, per established precedent);
reverted with `git checkout -- public/` before committing — confirmed `git status`
clean on `public/` afterward.

**Browser repro (Playwright/Chromium, `npx serve -l 4176 dist`, port 4176 only)**:
drove the real home → onboarding → gameplay flow (typed the actual onboarding drill
text, then read the live `.typing-text` target and typed it verbatim) to force a real
`handleComplete` → `coinFlash` render, not a synthetic DOM query.

- en session (`/speel/?lang=en`): coin-flash popup rendered
  `×3.0 neat · ×1.1 combo · ×1.5 warm-up` — zero Dutch, multipliers unchanged from the
  033 defect reference (`×3.0`, `×1.1`, `×1.5`). Screenshot:
  `company/assignments/037-screenshots/en-06-coinflash-clean.png`. Also captured the
  English landing (`en-01-landing.png`) and onboarding drill screen
  (`en-03-pre-typing.png`) confirming the surrounding flow is English too.
  Additionally verified locale persistence across Menu → "Keep building" re-entry
  (`en-re-entry-coinflash.png`: `×3.0 neat · ×1.1 combo · ×1.5 warm-up` again, no
  locale reset on remount).
- nl session (`/speel/`, default locale): coin-flash popup rendered
  `×3.0 netjes · ×1.1 combo · ×1.5 opwarm` — byte-identical to the original 033
  defect-reference screenshot's Dutch text
  (`company/assignments/033-screenshots/en-06-dutch-leak-coinflash.png`, which shows
  the same string leaking under en). Screenshot:
  `company/assignments/037-screenshots/nl-06-coinflash-clean.png`, plus landing
  (`nl-01-landing.png`).
- Golden (`×3 gold`/`×3 goud`) segment is stochastic (`GOLDEN_CHANCE = 0.12`, only
  after 3+ exercises) and wasn't hit live in the runs performed (one attempt at a long
  automated loop crashed the Chromium page before landing on gold — not reproduced as
  a product bug, looked like an artifact of rapid scripted input). Combo and
  warm-up segments *were* observed live (both non-golden, appear whenever
  `comboMult > 1` / `boost > 1`, which the drill naturally triggers). Golden text
  resolution was confirmed via direct `gt()` call instead (see below) — this is the
  "remaining segments via gt() resolution" fallback the task allowed for.
- Supporting `gt()`-resolution check (`node` importing `src/game/strings.js`
  directly): `setLocale('en')` → `flashNeat: 'neat'`, `flashGold: 'gold'`,
  `flashWarmup: 'warm-up'`, `combo: 'combo'`; `setLocale('nl')` →
  `flashNeat: 'netjes'`, `flashGold: 'goud'`, `flashWarmup: 'opwarm'`,
  `combo: 'combo'`. Matches live observations for the two segments seen live and
  confirms the untested golden segment resolves correctly too.

**Key parity** — confirmed live: `test('en and nl string maps have identical key
sets (both directions)')` passed as part of the 143/143 run, and it asserts full-map
parity (not a subset), so the 3 new keys are covered.

**Adversarial probes**:
- Grepped `GameScreen.jsx` for remaining hardcoded literals near the fix: the
  `nudge`, `checkHands`, `golden-banner`, `boost-chip`, and shop-meta lines are all
  `gt()`-wrapped. No other Dutch literal found in the fix's immediate neighborhood.
- Found one pre-existing (not introduced by this fix, out of scope, not a Dutch
  leak) minor inaccuracy: the build notes say "`play.combo` (the fourth word in the
  popup) was already `gt()`-wrapped" — it is not; line 356 of `GameScreen.jsx`
  renders a raw hardcoded `combo` string literal, not `gt('play.combo')` (that key is
  only used at the combo-meter, line 328). Also `combo-flash`'s `"COMBO!"` (line 365)
  is a raw literal. Both are harmless today because "combo" is `IDENTICAL_BY_DESIGN`
  in both languages, so there's no visible Dutch leak — but they're literals outside
  `gt()`, unlike what the notes claim. Flagging for developer awareness only, not
  filing as a defect (no user-visible impact, and out of the assignment's named
  scope of lines ~355/357/358).
- Confirmed no dead keys / no raw-key rendering: all three new keys
  (`play.flashNeat`, `play.flashGold`, `play.flashWarmup`) are referenced exactly
  once each in `GameScreen.jsx` and render real text in both locales (see live +
  gt() evidence above).

**Verdict: all 4 acceptance criteria independently verified. PASS.**

Evidence: `company/assignments/037-screenshots/{en-01-landing,en-03-pre-typing,
en-06-coinflash-clean,en-re-entry-coinflash,nl-01-landing,nl-06-coinflash-clean}.png`.
Probe script kept for regression use:
`qa-scripts/probe-037-coinflash.mjs` (drives both locales headlessly and prints the
coin-flash text; served build must be on port 4176).

Test suite: 143/143 pass, 0 fail (unchanged from developer's report, independently
re-run). Build: clean, `public/**` reverted, nothing left dirty.
