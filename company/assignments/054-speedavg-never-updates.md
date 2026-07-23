---
id: 054
title: state.speedAvg is never updated in Typcoon's game loop — final exam unreachable
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (proposed during 049 delivery, 2026-07-23)
---

## Goal

`exam-final`'s readiness gate (`examReady` in `src/engine/exams.js`) withholds the
final exam until `state.speedAvg` is within 90% of `minKpm` (100 keys/min) — this is
the "no place speed is required except the one certificate" hard line from
assignment 049. That gate is correctly implemented and engine-tested
(`test/exams.test.js`), but `state.speedAvg` is **never written anywhere in
`src/game/`**. The only code that updates it is `applyExerciseRewards` in
`src/engine/rewards.js` — typie's cosmetic-stars reward path, which `GameScreen.jsx`
does not call (Typcoon uses its own `economy.js: earnFromExercise` instead, which
does not touch `speedAvg`). Net effect: `state.speedAvg` stays `0` forever in a real
Typcoon save, so `examReady(state, examFinal)` can never return `true` — the final
exam/typ-diploma is currently unreachable through real gameplay, no matter how fast
or accurately a child types.

This was out of scope for 049 (which only needed exam-1's full offer→take→pass/fail
loop reachable and browser-verified; exam-final is premium and not required by any
049 acceptance criterion), so it was deliberately left as a follow-up rather than
folded in.

## Acceptance criteria

- [ ] `state.speedAvg` is updated somewhere in the real Typcoon exercise-completion
      path (likely `GameScreen.jsx`'s `handleComplete`, alongside the existing
      `earnFromExercise` call) using a sensible per-exercise kpm measurement (see
      `src/engine/speed.js: sessionKpm` for the existing kpm convention) and a
      reasonable smoothing/averaging approach — consistent with how `rewards.js`'s
      (unused) `applyExerciseRewards` already computed it (EMA: `0.7*prevAvg +
      0.3*kpm`), so as not to invent a new convention from scratch.
- [ ] A player who types accurately and reaches 100 keys/min eventually sees
      `exam-final` become offered (verify via engine test with a realistic `speedAvg`
      progression, and/or a browser check if practical).
- [ ] No regression to existing speed-related behavior: `speed.js`'s
      `speedRevealed`/`isNewRecord` (parent-facing "personal record" display, gated
      on `SPEED_REVEAL_LETTERS`) and the existing rewards/economy tests stay green.
- [ ] `npm test` green; `npm run build` clean.

## Notes

Found and documented during assignment 049's delivery (`src/game/GameScreen.jsx`,
`src/game/economy.js`, `src/engine/exams.js`). Not a regression from 049 — this gap
predates it; 049 simply never needed a live `speedAvg` for the criteria it had to
satisfy (exam-1 has no `minKpm`). Likely relevant to 050 (diploma certificate +
dashboard proof) and any future "reach the eindtoets" playtest, so it should land
before either of those treats the final exam as reachable.
