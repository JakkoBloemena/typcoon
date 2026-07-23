---
id: 037
title: en locale — coin-flash popup leaks hardcoded Dutch
owner: developer
status: needs_verification
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
