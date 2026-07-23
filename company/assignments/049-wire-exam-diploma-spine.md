---
id: 049
title: Wire the engine exam/diploma system into the Typcoon game loop
owner: developer
status: needs_verification
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

- [x] **Before (or alongside) any wiring, `src/engine/exams.js` gains direct
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
- [x] Playing to home-row mastery as a **new/free** player, the game offers exam-1 as
      an optional exam (clearly labelled a "toets"/exam, distinct from a normal
      exercise) and lets the player decline and keep playing.
- [x] Taking exam-1 presents an exam text (longer than a normal exercise, covering the
      exam's keys) and, on typing it at ≥ the exam's `passAcc`, shows a **pass** result
      with a celebration and grants the mapped Typcoon reward (coins and/or a prestige
      star); the reward is visible in the balance/stars immediately after.
- [x] Failing an exam (accuracy below the bar, or below `minKpm` on the final) shows
      an encouraging retry message, grants **no** reward, and returns the player to
      normal play — no dead-end, no lockout.
- [x] Passed exams **persist** across a hard refresh and across "opnieuw beginnen" if
      the curriculum progress persists (verify: pass exam-1, refresh, confirm it is
      not re-offered and the passed state is retained).
- [x] The exam reward is sourced from Typcoon's economy — grep confirms the game does
      **not** grant `state.rewards.stars`; the wiring uses `tycoon` coins and/or
      `rebirths`/prestige.
- [x] **No content or machine is gated behind passing any exam** — all premium content
      still unlocks purely by learning letters (verify: a player who never takes an
      exam can still reach every machine and letter they otherwise could). The diploma
      is recognition only. *(Hard line per decisions/009 — the optional diploma-gated
      expansion was cut specifically to keep this criterion intact; do not weaken it.)*
- [x] The final exam's speed requirement (100 keys/min) is the only place speed is
      required, and it gates **only the final certificate**, nothing else.
- [x] `npm test` green (add tests for the reward mapping and the "no reward on fail"
      path); `npm run build` clean; zero console errors across an exam pass and an
      exam fail.

## Delivery notes (developer, 2026-07-23)

Worked exclusively in `C:\companies\typcoon-lanes\b049` (branch `build/049`).

**AC1 — engine tests first.** `test/exams.test.js` (23 tests, all new) pins
`gradeExam`, `examReady`/`nextAvailableExam`/`examStatus`, `generateExamText` and
`applyExamResult` at the exact boundaries the AC lists, using real engine state built
via `newState`/`newProfile` (not hand-faked shortcuts) plus a `withConfidence` helper
for the few fields the module actually reads. Ran and confirmed green **before** any
UI wiring existed. Two real bugs surfaced and were fixed minimally in
`src/engine/exams.js` (each has a comment at the fix site):
1. `generateExamText` only guaranteed symbol coverage, never letter coverage — a
   toets text could omit one of its own required letters. Added the same
   "guarantee it appears at least once" pass already used for symbols.
2. `applyExamResult` was not idempotent: a repeated pass of an already-passed exam
   re-granted the bonus every time (`state.rewards.stars` kept climbing). Now a
   repeated pass on an already-passed exam is a no-op reward-wise (attempts still
   increments). Verified both bugs were real by re-running the new tests against a
   git-stash of the pre-fix module: 2/23 failed (`15 !== 0` on the idempotence
   assertion) before the fix, 23/23 pass after.

**AC2/AC3/AC4 — offer/decline/pass/fail.** `GameScreen.jsx`: `nextAvailableExam(state)`
is read every render (`availableExam`); a persistent mint "🏅 Toets beschikbaar" pill
(reuses the existing `.checkhands-chip`/`.form-nudge` mint-gradient idiom, not the
gold `.unlock-pill` treatment, so it never reads as a paywall CTA) sits in the header
whenever an exam is available and not in progress. The *first* transition into
readiness (snapshotted per-exercise in `examWasReadyRef`, since keystrokes update
confidence live — comparing "before this exercise" against "after" would otherwise
miss the transition, see bug note below) queues a celebratory offer overlay (`toets`
clearly labelled, "Start de toets!" / "Nog even niet" — declining just closes it,
normal play is untouched). Taking it (`startExam`) generates the exam text via
`generateExamText`, renders it in the same `TypingSurface` under a mint "TOETS: …"
banner, and is entirely decoupled from the learn-engine (its `onKeystroke` is a
no-op) so a failed attempt cannot corrupt keyStats/promotion. `finishExam` grades
with `gradeExam`, calls the new `applyTypcoonExamResult` (economy.js) and shows a
pass (celebration + `+N` coins, visible in the coin pill immediately) or fail
(gentle "Nog niet helemaal — geen zorgen!", no `.celebrate` glow, single "Gaaf!"
button back to normal play — pill stays, no lockout) moment.

**AC5 — persistence.** No new storage code needed: `state.exams` already flows
through `newState`/`hydrateState`/`saveGame` unchanged; verified live (see below).

**AC6 — reward economy.** `economy.js` adds `EXAM_COIN_REWARD` (150/300/450/600/1000
for exam-1..exam-final) and `applyTypcoonExamResult(state, exam, pass)`, which takes
*only* `exams.passed/attempts` from the engine's `applyExamResult` result and
discards its `rewards.stars` mutation entirely — the returned state's `.rewards` is
untouched (asserted in `economy.test.js`). `grep -rn "rewards.stars" src/game/`
matches only the explanatory comment in `economy.js`, no code.

**AC7 — no gating.** The exam wiring never reads/touches `premium.js`,
`machineLocked`, or `FREE_LETTER_CAP`; grep confirms zero coupling. exam-1 sits at
stage 5 (9 letters: f j d k s l a g h), inside the 10-letter free cap — reachable
without unlocking.

**AC8 — final exam speed.** Untouched engine logic (`exam.minKpm` only set on
`exam-final`); pinned by the engine tests above.

**AC9 — test/build/console.** `npm test`: **181/181 green** (154 baseline + 23
`exams.test.js` + 4 reward-mapping tests in `economy.test.js`, which also asserts
"no reward, no `rewards` mutation" on a fail — plus 3 new key entries wired into
`locale.test.js`'s flow-key/dynamic-key lists). `npm run build`: clean (95 modules,
no warnings). Browser-verified with Playwright against the dev server on port 4186
(`qa-scripts/gen-exam-save.mjs` + `qa-scripts/probe-049-exam-flow.mjs`, screenshots in
`company/assignments/049-screenshots/`): live offer→decline, pill→take→**pass**
(coins 500→650, pill disappears, survives a hard reload), pill→take→**fail**
(coins unchanged, encouraging copy, pill and normal exercise both still there) — zero
console errors/warnings in every run except the pre-existing `/api/track` 404 (dev
server has no backend; present identically on baseline code, unrelated to this
assignment). One real bug found and fixed *during* this browser verification: the
offer's readiness check originally compared `nextAvailableExam` before vs. after
`finalizeExercise` inside `handleComplete` — but per-keystroke confidence updates
already land in `engineRef.current` *during* the exercise (via `processKeystroke`),
so by the time `handleComplete` ran, "before" and "after" were often both already
"ready" and the transition was silently missed. Fixed by snapshotting readiness in
`examWasReadyRef` at exercise-*start* instead (the effect that generates each new
exercise). Also fixed an unrelated instability: the exam `TypingSurface`'s
`onKeystroke` was a fresh inline `() => {}` every render, destabilizing its internal
keydown-listener effect under rapid typing (surfaced as a React "Maximum update
depth exceeded" warning under synthetic zero-delay keystrokes in testing); replaced
with a module-level stable `EXAM_NOOP`.

**i18n.** 15 new `exam.*` keys added to both `nl` and `en` maps in `strings.js`
(native English copy, not translated word-for-word); `locale.test.js` extended
(`EXAMS`-driven dynamic keys + static flow keys) — full parity suite green.

**Design system.** No new colors/tokens invented — the exam pill/banner reuse the
existing mint-gradient chip idiom already used twice in `game.css`
(`.form-nudge`/`.checkhands-chip`); the offer/pass/fail cards reuse the existing
`.overlay`/`.card`/`.celebrate` vier-moment pattern (fail intentionally omits
`.celebrate`'s gold glow — DESIGN.md's no-punishment tone, not a celebration but not
a scolding either).

**Reward-amount choice.** Went with coins-only (no `rebirths` bump) — the assignment
text allows "coins and/or a prestige star"; granting `tycoon.rebirths` directly would
hand out the permanent economy multiplier without its intended sell-off tradeoff,
disproportionate for a home-row mini-exam. A coin lump sum uses the exact same
faucet/mechanics as normal play, just sized to feel like a milestone.

**Out of scope, noted not fixed:** `state.speedAvg` is never updated anywhere in
`src/game/` (only `rewards.js`'s unused `applyExerciseRewards` touches it), so in
real play the final exam's `minKpm` gate can never open — harmless for *this*
assignment (exam-final is premium, no AC requires browser-verifying it, and the
engine-level speed-gating logic itself is correctly pinned), but it means exam-final
is currently unreachable through real gameplay. Opening a p4 assignment for this
(proposed by the developer) since it's outside 049's scope (wiring exam-1's full
loop) — 050/052 may need it.

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
