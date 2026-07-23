---
id: 049
title: Wire the engine exam/diploma system into the Typcoon game loop
owner: developer
status: done
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

## Verification (2026-07-23, tester)

Independently re-derived every criterion in `C:\companies\typcoon-lanes\v049` (branch
`verify/049`, off main, never merged/pushed). Did not take the delivery notes' word for
anything; ran the suite, mutation-tested the two claimed engine bug fixes, and drove the
real app with Playwright/Chromium (port 4192) against my own probe scripts.

- **AC1 (engine tests first) — PASS.** `test/exams.test.js` (23 tests) pins every
  boundary the AC lists: `gradeExam` pass-exactly-at/fail-just-below `passAcc`,
  final-exam `minKpm` both sides + independently below `passAcc`; `examReady` locked
  below `stage`, blocked while `governor.state==='frustrated'`, requires every covered
  key at/above `EXAM_READY` (0.82) with an exact-boundary case, final withheld until
  `speedAvg >= minKpm*0.9` (plus a realistic EMA-progression test, not just a hand-set
  value); `generateExamText` letter+symbol/punct/digit coverage and seeded
  determinism (mulberry32); `applyExamResult` records-pass/idempotent-on-repeat/
  no-grant-on-fail. Mutation-checked both claimed bug fixes by reverting each in
  `src/engine/exams.js` one at a time and rerunning `npm test`: reverting the
  letter-coverage pass in `generateExamText` → 1 test fails (`generateExamText: dekt
  ook leestekens/hoofdletter-modus/cijfers...`, missing `l,w,v,z`); reverting the
  idempotence guard in `applyExamResult` → 2 tests fail (one in `exams.test.js`, one in
  `economy.test.js`'s `applyTypcoonExamResult` idempotence test). Restored the file
  after each mutation; `git diff --stat src/engine/exams.js` is empty — worktree
  diff-clean, confirmed after the full session.
- **AC2 (offer + decline) — PASS.** Live-play transition (near-ready seed, real
  `processKeystroke` confidence build-up) fired the offer overlay within 2 exercises:
  "🏅 Klaar voor een toets? 🎖️ Je kent deze letters goed! Wil je de Thuisrij-toets
  proberen? Gewoon voor de eer — lukt het niet, dan speel je gewoon verder." — clearly
  labelled a toets, distinct from a normal exercise, framed as low-stakes. "Nog even
  niet" declines cleanly: exercise/keyboard stay usable, the persistent green "🏅 Toets
  beschikbaar" pill remains for a later attempt, no repeated overlay nagging (verified
  the ref-based single-fire-per-transition design in code and confirmed no re-offer
  after decline). Screenshots: `v-02-live-offer-verify.png`, `v-03-declined-verify.png`.
- **AC3 (take/pass) — PASS.** Exam text is materially longer than a normal exercise
  (68 chars vs. short drill words) and covers exam-1's full key set (`generateExamText`
  coverage guarantee, independently confirmed live). Typing it at 100% accuracy → "Toets
  gehaald! 🎉" card with `.celebrate` gold-glow class, `+150` coin chip, coins visibly
  went 500 → 650 in the header pill immediately after dismissal. Screenshots:
  `v-04-exam-in-progress-verify.png`, `v-05-exam-pass-verify.png`,
  `v-06-after-pass-verify.png`.
- **AC4 (fail) — PASS.** Deliberately-wrong keystrokes (accuracy 50%) → "Nog niet
  helemaal — geen zorgen!" with a plain smiley (no `.celebrate` gold-glow class present
  on the fail card — confirmed by locator count), "Je zat op 50% nauwkeurig. Oefen nog
  even door, dan lukt de toets zo!" — encouraging, not punitive, no reward (coins
  unchanged 500 → 500), single "Gaaf!" button back to normal play; the typing surface
  and the exam pill are both still present immediately after — no dead-end, no lockout,
  and a normal exercise is typeable right after. Screenshot: `v-08-exam-fail-verify.png`.
- **AC5 (persistence) — PASS.** Passed exam-1 survives a hard refresh (pill count 0
  before and after two consecutive reloads) — `state.exams` round-trips through
  save/hydrate unchanged, as claimed. Went further than the AC's own wording and also
  tested "opnieuw beginnen" (rebirth/prestige reset): seeded a save with exam-1 already
  passed and `totalCoins` above the rebirth threshold, sold the factory live in the
  browser (`rebirth.confirm` button) — `localStorage`'s persisted state afterward still
  shows `exams.passed: ["exam-1"]`, `attempts: {"exam-1":1}` while `tycoon.coins` reset
  to 0 and `rebirths: 1`, exactly matching `rebirth()`'s code (only touches
  `tycoon.*`, never `state.exams`). Screenshots: `v-07-after-refresh-verify.png`,
  `v-10-rebirth-confirm-verify.png`, `v-11-rebirth-done-verify.png`.
- **AC6 (Typcoon economy, not typie's stars) — PASS.** `grep -rn "rewards.stars"
  src/game/` matches only the explanatory comment in `economy.js` — zero code
  references. Read `applyTypcoonExamResult`: it takes only `examState.exams` from the
  engine's `applyExamResult` result (`next = { ...state, exams: examState.exams }`) and
  never spreads `examState.rewards` into the returned state — the mutation the engine
  makes to `state.rewards.stars` is discarded outright. `economy.test.js` asserts the
  reward mapping (`EXAM_COIN_REWARD` positive per exam id) and the fail/idempotent
  no-reward paths.
- **AC7 (no gating) — PASS.** `grep -n "premium\.js\|machineLocked\|FREE_LETTER_CAP"
  src/game/GameScreen.jsx` shows those symbols used only in the pre-existing paywall
  logic (letter-cap check, machine-lock render); none of the exam-specific code
  (`availableExam`, `examWasReadyRef`, `startExam`, `finishExam`,
  `applyTypcoonExamResult`) references any of the three. Computed exam-1's actual key
  set via the real engine (`newState` + `activeLetters` at stage 5): `f j d k s l a g
  h` — 9 letters, under `FREE_LETTER_CAP` (10), confirming exam-1 is genuinely
  reachable free. `minKpm` exists only on `exam-final` (grep confirms, one match).
- **AC8 (speed gates only the certificate) — PASS.** `minKpm` appears in
  `src/engine/exams.js` only in the `exam-final` entry and the two places that read it
  (`examReady`'s pre-check, `gradeExam`'s `speedOk`) — no other exam or non-exam code
  path reads `minKpm` or `speedAvg` as a gate. `exam-1` (the only exam actually
  reachable free) has no speed requirement at all — confirmed live: `examReady` for
  exam-1 ignored `speedAvg=0` in the engine test suite and the browser-verified free
  flow never touched typing speed.
- **AC9 (test/build/console) — PASS.** `npm test`: **199/199 green** (matches main's
  count exactly — the delivery notes' own count, 181/181, is stale/pre-merge and refers
  to the build lane before other work landed on main; 199 is what this worktree, cut
  from main, actually runs). `npm run build`: clean, 97 modules, no warnings. Console
  errors across a full pass run and a full fail run: only the pre-existing
  `/api/track` 404 (dev server has no backend; identical on baseline code) — zero
  errors attributable to the exam feature, checked via `page.on('console'/'pageerror')`
  across every seeded run (offer, decline, pass, refresh, fail, rebirth, mobile).

**Additional exploratory checks (beyond the 9 ACs), all clean:**
- Mobile viewport (390×844): exam pill renders, exam mode opens and is typeable,
  zero exam-attributable console errors. Noted but **not a 049 defect**: the game
  header already horizontal-overflows at this viewport width (521px content in a
  390px client width) identically with and without the exam pill present (measured
  `scrollWidth`/`clientWidth` both ways — 131px overflow in both cases) — this is a
  pre-existing header-layout issue, not something this assignment introduced or
  worsened. Flagging for a future p4 mobile-layout assignment, not blocking this one.
- Re-verified the "no gating" claim isn't just a grep artifact by reading
  `rebirth()`/`premium.js` end to end — the paywall unlock lives in its own
  `localStorage` key (`typcoon:unlocked`) entirely orthogonal to `state.exams`.

**Verdict: all 9 acceptance criteria PASS.** Status flipped to `done`.

Probe scripts committed to `qa-scripts/`: `probe-049-verify.mjs` (main AC2–AC5 flow,
own independent assertions), `gen-exam-passed-rebirth-save.mjs` +
`probe-049-rebirth-persist.mjs` (AC5 "opnieuw beginnen" persistence),
`probe-049-mobile.mjs` + `probe-049-mobile-baseline.mjs` +
`probe-049-mobile-overflow-check.mjs` (exploratory mobile check). Screenshots in
`company/assignments/049-screenshots/*-verify.png` (suffixed to avoid clobbering the
developer's own `01`–`09` set).
