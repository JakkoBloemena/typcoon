---
id: 054
title: state.speedAvg is never updated in Typcoon's game loop — final exam unreachable
owner: developer
status: done
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

- [x] `state.speedAvg` is updated somewhere in the real Typcoon exercise-completion
      path (likely `GameScreen.jsx`'s `handleComplete`, alongside the existing
      `earnFromExercise` call) using a sensible per-exercise kpm measurement (see
      `src/engine/speed.js: sessionKpm` for the existing kpm convention) and a
      reasonable smoothing/averaging approach — consistent with how `rewards.js`'s
      (unused) `applyExerciseRewards` already computed it (EMA: `0.7*prevAvg +
      0.3*kpm`), so as not to invent a new convention from scratch.
- [x] A player who types accurately and reaches 100 keys/min eventually sees
      `exam-final` become offered (verify via engine test with a realistic `speedAvg`
      progression, and/or a browser check if practical).
- [x] No regression to existing speed-related behavior: `speed.js`'s
      `speedRevealed`/`isNewRecord` (parent-facing "personal record" display, gated
      on `SPEED_REVEAL_LETTERS`) and the existing rewards/economy tests stay green.
- [x] `npm test` green; `npm run build` clean.

## Delivery notes (developer, 2026-07-23)

**Criterion 1 — `state.speedAvg` written from real play.**
Added `updateSpeedAvg(prevAvg, kpm)` to `src/engine/speed.js` — a pure one-liner
that is exactly the `applyExerciseRewards` EMA convention (`0.7*prevAvg + 0.3*kpm`,
first measurement = the kpm itself) lifted out as its own tested export, since
`applyExerciseRewards` itself is off-limits (typie's inert star path, per the
assignment's constraint). `GameScreen.jsx` never called into `rewards.js` and still
doesn't.

Wired into `handleComplete` (the real Typcoon completion path, next to
`earnFromExercise`): a new `exerciseStartRef` is stamped with `performance.now()`
at the same point the exercise itself is generated (mirrors how `startExam` already
stamps `examMode.startedAt`), and `exerciseRef` mirrors the `exercise` state into a
ref (same pattern as the existing `engineRef`) so `handleComplete`'s stable
`useCallback` can read the just-finished exercise's text length without adding it
to the dependency array. On completion:
`sessionKpm(exerciseRef.current.text.length, performance.now() - exerciseStartRef.current)`
— the exact same kpm convention already used for exam texts — feeds
`updateSpeedAvg(next.speedAvg || 0, exerciseKpm)`, and the result is written onto
`next` *before* `nextAvailableExam(next)` is computed later in the same handler, so
the exam-offer vier-moment can fire off a freshly-updated `speedAvg` in the same
tick a threshold-crossing exercise completes. This is now the *only* writer of
`state.speedAvg` in `src/game/`. Exam completions (`finishExam` /
`applyTypcoonExamResult`) are untouched — the exam surface stays decoupled from the
learn-engine as instructed, so taking (or failing) an exam never pollutes
`speedAvg`.

**Criterion 2 — realistic progression eventually offers exam-final.**
`test/exams.test.js` gained
`"examReady: een realistische speedAvg-progressie ... opent uiteindelijk de
eindtoets (assignment 054)"`: starts from a fresh `speedAvg: 0`, replays
`updateSpeedAvg` over 25 exercises with a steadily-climbing per-exercise kpm
(40 → 115, i.e. a child getting faster over time, not a single lucky measurement),
and asserts (a) the gate does NOT open in the first few exercises, (b) it does open
once the EMA crosses `minKpm * 0.9`, and (c) `nextAvailableExam` then resolves to
`exam-final` specifically (with exam-1..4 pre-passed, so the resolution is
unambiguous). `test/speed.test.js` is new and covers `updateSpeedAvg` directly
(first-measurement passthrough, the EMA blend, and monotonic convergence).

Also browser-verified end-to-end (not just required, but the engine-test alone
already left me unconvinced the wiring was real, so I drove it): worktree dev
server on port 4189, Playwright/Chromium, `qa-scripts/gen-speedavg-save.mjs`
(new — builds a save at exam-final's stage with every exam-final key drilled to
full confidence via the *real* engine (`processKeystroke`, matching
`gen-exam-save.mjs`'s existing `near-ready` idiom — hand-faking `confidence`
without real `samples` gets recomputed away by the next real keystroke) and
`speedAvg` parked just under the 90%-of-100 gate, all mini-exams pre-passed) +
`qa-scripts/probe-054-speedavg.mjs` (new — plays real exercises through the
browser, confirms `speedAvg` moves off the seed on the very first completed
exercise, catches the `examOffer` vier-moment, clicks "Start de toets!", confirms
the banner reads "🏅 TOETS: Typdiploma" (exam-final, not one of the mini-exams),
types the exam text, and confirms the pass overlay + `exams.passed` including
`exam-final`). Screenshots: `company/assignments/054-screenshots/01-exam-final-offer.png`
(offer overlay) and `.../02-exam-final-pass.png` (pass overlay, 100% accuracy,
+1.000 munten). Zero new console errors — the only console entries are a
pre-existing `/api/track` 404 (analytics endpoint the dev server doesn't serve
locally; confirmed present on a bare page load with no seeding/play, unrelated to
this change).

**Criterion 3 — no regression.**
`speed.js`'s `sessionKpm`/`bestKpm`/`speedRevealed`/`isNewRecord` had zero test
coverage before this assignment; `test/speed.test.js` now pins their existing
behavior (untouched by this change) alongside the new `updateSpeedAvg` coverage.
`rewards.js` (the inert `applyExerciseRewards` EMA this assignment took its
convention from) was not modified. `economy.js`/`earnFromExercise` was not
modified. Full suite: green, see below.

**Criterion 4 — green suite, clean build.**
`npm test`: **199/199** (188 baseline + 10 new in `test/speed.test.js` + 1 new in
`test/exams.test.js`). `npm run build`: clean (`vite build` succeeds, no
warnings). `node_modules` was missing in this fresh worktree; ran `npm install`
per instructions. `playwright-core` was installed with `--no-save` purely for the
scratch QA scripts above (same ad hoc pattern 049's `probe-049-exam-flow.mjs`
already used in its own worktree) — `package.json`/`package-lock.json` are
untouched.

Files changed: `src/engine/speed.js` (+`updateSpeedAvg`), `src/game/GameScreen.jsx`
(`handleComplete` writes `speedAvg`), `test/speed.test.js` (new),
`test/exams.test.js` (+1 progression test), `qa-scripts/gen-speedavg-save.mjs` (new,
scratch), `qa-scripts/probe-054-speedavg.mjs` (new, scratch),
`company/assignments/054-screenshots/` (new, verification screenshots).

## Notes

Found and documented during assignment 049's delivery (`src/game/GameScreen.jsx`,
`src/game/economy.js`, `src/engine/exams.js`). Not a regression from 049 — this gap
predates it; 049 simply never needed a live `speedAvg` for the criteria it had to
satisfy (exam-1 has no `minKpm`). Likely relevant to 050 (diploma certificate +
dashboard proof) and any future "reach the eindtoets" playtest, so it should land
before either of those treats the final exam as reachable.

## Verification (2026-07-23, tester)

Independent pass in worktree `C:\companies\typcoon-lanes\v054` (branch `verify/054`,
off main where 054 is merged). All 4 acceptance criteria checked directly — code
read, tests run, mutation-checked, and browser-driven — not taken on the delivery
notes' word.

**AC1 — sole writer, correct EMA, correct kpm, correct ordering. PASS.**
`grep -rn speedAvg src/game/` shows exactly one write site:
`src/game/GameScreen.jsx:211` inside `handleComplete`
(`next = { ...next, speedAvg: updateSpeedAvg(next.speedAvg || 0, exerciseKpm) }`),
computed from `sessionKpm(exerciseRef.current?.text.length || 0, performance.now() -
exerciseStartRef.current)` — a real elapsed-time-over-real-text-length measurement,
same convention already used for exam texts (`GameScreen.jsx:329`). Confirmed line
211 executes *before* line 255's `nextAvailableExam(next)` call, in the same
handler — the exam-offer check on that same tick sees the just-updated `speedAvg`.
`src/engine/speed.js: updateSpeedAvg` is `prevAvg ? Math.round(0.7*prevAvg +
0.3*kpm) : kpm` — byte-for-byte the same formula as `rewards.js:90`'s (inert,
unused) `applyExerciseRewards` EMA, so no new convention was invented.
`finishExam`/`applyTypcoonExamResult` (`GameScreen.jsx:323`, `economy.js:282`) were
diffed against the 054 commit and confirmed untouched — `applyTypcoonExamResult`
only writes `exams`/`tycoon.coins`, never `speedAvg`; `rewards.js` and `economy.js`
do not appear in `git show 116ab00 --stat` at all.

**AC2 — realistic progression test + browser E2E. PASS.**
`test/exams.test.js`'s new progression test starts from a fresh `speedAvg: 0`,
pre-passes exam-1..4 so `nextAvailableExam` resolution is unambiguous, replays
`updateSpeedAvg` over 25 exercises with kpm climbing 40→115, and asserts the gate
does not open in the first 5 exercises, opens once the EMA crosses `minKpm*0.9`,
and `nextAvailableExam(s)?.id === 'exam-final'`. Mutation check: changed
`updateSpeedAvg` to `return prevAvg` (frozen average), re-ran `npm test` — 4 tests
failed as expected (the 3 direct `updateSpeedAvg` unit tests in `test/speed.test.js`
plus this progression test), confirming the test genuinely exercises the function
rather than passing vacuously. Restored the file; `git status`/`git diff` confirmed
clean afterward.
Browser E2E (own re-derivation of the delivery's scripts, not a re-run of the
developer's originals — committed as `qa-scripts/gen-speedavg-save-verify.mjs` +
`qa-scripts/probe-054-speedavg-verify.mjs`, pointed at this worktree and port 4194
instead of `b054`/4189): `npm install`, `npm install --no-save playwright-core`,
`npm run dev -- --port 4194`. Seeded a save at exam-final's stage (all content
mastered via real `processKeystroke` drilling, all mini-exams pre-passed,
`speedAvg` parked 6 below the 90% gate), then played real exercises through
Playwright/Chromium. Result: `speedAvg` moved from the seeded 84 to 475 on the very
first completed exercise (bot-typing at 20ms/key produces implausibly high kpm —
expected artifact of scripted typing speed, not a bug), the exam-final offer fired
on the second exercise, clicking "Start de toets!" showed banner "🏅 TOETS:
Typdiploma" (confirms exam-final specifically, not a mini-exam), typing the exam
text produced the pass overlay ("Toets gehaald! ... Je haalde de Typdiploma met
100% nauwkeurig", +1.000 munten), and the resulting save's `exams.passed` included
`exam-final` alongside exam-1..4. Zero new console errors — the only entries are 5×
`/api/track` 404s, confirmed pre-existing/unrelated (`src/net/track.js` posts
analytics to an endpoint the dev server doesn't serve; not touched by this
assignment). Screenshots: `company/assignments/054-screenshots/
01-exam-final-offer-verify.png` and `02-exam-final-pass-verify.png` (both visually
inspected — text matches console output).

**AC3 — no regression. PASS.**
`git show 116ab00 --stat`: only `src/engine/speed.js`, `src/game/GameScreen.jsx`,
`test/speed.test.js`, `test/exams.test.js`, `qa-scripts/*`, and the assignment/
screenshots changed — `rewards.js` and `economy.js` do not appear, confirmed
unmodified. `test/speed.test.js` was reviewed: its `sessionKpm`/`bestKpm`/
`speedRevealed`/`isNewRecord` tests assert the pre-existing formulas verbatim
(divide-by-minutes rounding, zero-duration guard, reveal-at-13-letters-with-data,
last-session-beats-previous-best) — they pin existing behavior, not anything the
054 diff changed; only the `updateSpeedAvg` tests exercise new code. Full suite
green (below).

**AC4 — green suite, clean build. PASS.**
`npm install` (fresh worktree, `node_modules` was absent) then `npm test`:
**199/199**, 0 failing — matches the delivery's claimed count exactly.
`npm run build`: clean (`gen-content` prebuild + `vite build`, no warnings, no
errors).

**Verdict: all 4 acceptance criteria independently verified PASS. No defects found.**
Frontmatter flipped to `done`.

Minor, non-blocking observations (not filed as defects, informational only):
- The browser-observed `speedAvg` jump to 475 in one exercise is purely a
  scripted-typing artifact (real children cannot type at Playwright's 20ms/key);
  worth knowing if a future assignment wants to sanity-cap `sessionKpm`/`updateSpeedAvg`
  against implausible input, but out of scope here and not something a real save can
  trigger.
- Running `npm run dev`/`npm run build` in this worktree regenerates
  `public/blog/**/index.html` and `public/sitemap.xml` via the `gen-content.mjs`
  prebuild script with LF→CRLF-normalized/date-refreshed content; left unstaged and
  uncommitted as build noise unrelated to this assignment.
