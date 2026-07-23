---
id: 049
title: Wire the engine exam/diploma system into the Typcoon game loop
owner: developer
status: open
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Make `src/engine/exams.js` playable inside Typcoon. When the engine reports an exam
is ready (`nextAvailableExam(state)`), offer the child an optional "toets" they can
take instead of a normal exercise; generate its text with `generateExamText()`; grade
the attempt with `gradeExam()`; on pass, mark it passed (`applyExamResult`) and grant
a Typcoon reward mapped to **this game's** economy (coins and/or one prestige star) —
**not** typie's `state.rewards.stars`, which Typcoon does not use. Passing/failing
gets a clear celebration or a gentle "nog een keer" (never a punishment — DESIGN.md).
exam-1 (stage 5, home row) must be reachable and takeable by a **free** player;
exam-2+ and exam-final fall past the free letter cap and are premium by nature.

Context: this is a Vite + React app; `npm test` runs the pure node test suite,
`npm run build` must stay clean, and the browser console must be error-free. A
developer's terminal state is `needs_verification` (PROTOCOL); the tester flips `done`.

## Acceptance criteria

- [ ] **Before (or alongside) any wiring, `src/engine/exams.js` gains direct
      engine-level tests** — this module has zero direct coverage today and its logic
      has never been executed by the suite. A new `test/exams.test.js` must pin, at
      minimum: `gradeExam` (pass exactly at `passAcc`, fail just below; final exam
      fails below `minKpm` even at 100% accuracy, passes at/above it);
      `examReady`/`nextAvailableExam` (locked below the exam's `stage`; not offered
      while `governor.state === 'frustrated'`; offered only once every covered key
      clears the `EXAM_READY` confidence bar; the final exam withheld until `speedAvg`
      is within 90% of `minKpm`); `generateExamText` (output covers the exam's key
      set — every required symbol appears at least once — and is deterministic under
      a seeded rng); and `applyExamResult` (records the pass, is idempotent on
      re-pass, grants nothing on a fail). These tests must pass **before** the exam
      grading is exposed to a child.
- [ ] Playing to home-row mastery as a **new/free** player, the game offers exam-1 as
      an optional exam (clearly labelled a "toets"/exam, distinct from a normal
      exercise) and lets the player decline and keep playing.
- [ ] Taking exam-1 presents an exam text (longer than a normal exercise, covering the
      exam's keys) and, on typing it at ≥ the exam's `passAcc`, shows a **pass** result
      with a celebration and grants the mapped Typcoon reward (coins and/or a prestige
      star); the reward is visible in the balance/stars immediately after.
- [ ] Failing an exam (accuracy below the bar, or below `minKpm` on the final) shows
      an encouraging retry message, grants **no** reward, and returns the player to
      normal play — no dead-end, no lockout.
- [ ] Passed exams **persist** across a hard refresh and across "opnieuw beginnen" if
      the curriculum progress persists (verify: pass exam-1, refresh, confirm it is
      not re-offered and the passed state is retained).
- [ ] The exam reward is sourced from Typcoon's economy — grep confirms the game does
      **not** grant `state.rewards.stars`; the wiring uses `tycoon` coins and/or
      `rebirths`/prestige.
- [ ] **No content or machine is gated behind passing any exam** — all premium content
      still unlocks purely by learning letters (verify: a player who never takes an
      exam can still reach every machine and letter they otherwise could). The diploma
      is recognition only. *(Hard line per decisions/009 — the optional diploma-gated
      expansion was cut specifically to keep this criterion intact; do not weaken it.)*
- [ ] The final exam's speed requirement (100 keys/min) is the only place speed is
      required, and it gates **only the final certificate**, nothing else.
- [ ] `npm test` green (add tests for the reward mapping and the "no reward on fail"
      path); `npm run build` clean; zero console errors across an exam pass and an
      exam fail.

## Notes

Approved by decisions/009; full rationale and evidence in
research/game-depth-scope.md §2 (Candidate A) and §5 (Assignment 1). The engine
module is written and reads as coherent, but it is **not tested** — zero direct
coverage today (only `newExams()` is touched incidentally by `promotion.test.js`
during state init). So the work is: **first** pin the exam logic with engine tests
(first AC), **then** the UI + reward remapping + persistence wiring. Do not assume
the grading/gating logic is correct because the suite is green — none of it is exam
logic. Keep exam-1 free; do not let the exam offer bypass the paywall for premium
letters. Guardrails: G2 (exams earned by typing, never bought; diploma gates
nothing), G5 (free chapter earns its own thuisrij-diploma inside the 10-letter cap).
Unblocks 050 (certificate + dashboard proof). Independent of the theme track
(051/052) — parallel lanes are fine per scope §4.
