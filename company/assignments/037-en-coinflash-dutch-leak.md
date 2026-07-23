---
id: 037
title: en locale — coin-flash popup leaks hardcoded Dutch
owner: developer
status: in_progress
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

- [ ] In an en session, completing an exercise shows the coin-flash popup entirely in
      English (no "netjes"/"opwarm"/other Dutch), with the multiplier values unchanged.
- [ ] The nl session's coin-flash popup is unchanged (byte-identical strings).
- [ ] New string keys exist in both the nl and en string maps (no key present in one map
      and missing from the other — the 013 parity bar holds).
- [ ] Full test suite green; clean build.

## Notes

Repro: build, open `/speel/?lang=en`, start factory, finish onboarding, complete any
exercise. Screenshot evidence:
`company/assignments/033-screenshots/en-06-dutch-leak-coinflash.png`.
Found and reproduced by the 033 acceptance-QA tester (tick 2026-07-23 #4); priority 3 —
visible on every exercise completion in en, but the locale is not yet live.
Terminal state needs_verification.
