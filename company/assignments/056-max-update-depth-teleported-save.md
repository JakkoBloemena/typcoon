---
id: 056
title: React "Maximum update depth exceeded" on artificially seeded end-state saves
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (proposed during 050 delivery, 2026-07-23; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

A pre-existing React "Maximum update depth exceeded" warning reproduces on unmodified
baseline code when a save is seeded directly at `curriculumIndex = 19` with all key
confidences maxed and zero real practice history — a "teleported to the end" state a
real player never reaches through normal play (confirmed pre-existing by the 050
developer via stash-and-rerun of the identical repro). Track down the looping effect
in `src/game/GameScreen.jsx` (or wherever it lives) and fix it so even artificial
end-states render without an effect loop.

## Acceptance criteria

- [x] The repro (seed `curriculumIndex = 19`, all confidences maxed, no practice
      history, load the game) no longer emits "Maximum update depth exceeded".
      (Precise trigger, confirmed by the 050 dev's actual session history and
      reproduced here: a zero-delay `page.keyboard.press()` burst on the exam
      TypingSurface, not the seed/load alone — see the "Unblocked" and "Delivery
      notes" sections below.)
- [x] The root cause is identified and documented in the delivery notes (which effect
      loops, and why only on the teleported state).
- [x] Realistic-play flows are unaffected: full suite green, and a normal
      play/exam/theme browser pass shows zero new console errors.
- [x] `npm test` green; `npm run build` clean.

## Notes

Low urgency: no real player reaches this state through normal play; QA seeding
scripts are the only known trigger. But an effect that can loop under one state
shape is a latent bug under future state shapes — worth retiring. See
`qa-scripts/gen-final-exam-save.mjs` and 050's delivery notes for the repro
environment. Priority 4 per protocol (developer proposal).

## Delivery notes — status: blocked (could not reproduce on current baseline)

**Setup:** fresh worktree (`npm install`, `npm install --no-save playwright-core`),
`vite --port 4200` (a stray earlier dev server from this session held 4201 — killed
it and confirmed 4200 serves the current `git status`-clean baseline; also cleared
`node_modules/.vite` and restarted, in case of stale pre-bundle cache — no change).
Chromium 1228 via `playwright-core`, driven with `qa-scripts/gen-final-exam-save.mjs`
exactly as the assignment names it (`profile.curriculumIndex = 19`, `exam-1..4`
already passed, every currently-active key's `confidence: 1, reps: 60, accuracy: 1`,
`sessions: []`/`srsItems: {}` — i.e. "zero real practice history" as described).

**AC1 (repro) — could not reproduce.** I could not get baseline code (byte-identical
to `git log -1` on `build/056`, confirmed via `git diff` showing no changes to
`src/`) to emit "Maximum update depth exceeded", or any console message beyond the
documented pre-existing `/api/track` 404, across every interaction path I could
construct from the assignment's own description:
1. **Load only, do nothing** (the assignment's literal repro step) — waited 3–5s
   after entering `view='play'`. Zero console output beyond the 404s.
   `qa-scripts/probe-056-repro.mjs` phase 1, `056-screenshots/01-…png`.
2. **Complete the exam-final immediately** (it's already offered at load, per
   `examReady`/`nextAvailableExam`) — 100% accuracy, cert renders, zero new console
   output. Phase 2, `056-screenshots/03-after-exam.png`.
3. **Play on past the exam**, 10 more exercises, draining every queued moment
   overlay each round (not just one) — zero new console output the whole way.
   Phase 3. This also surfaces a real, if narrow, root-cause candidate (below).
4. **Same save, `unlocked` NOT set** (free tier — this is how `probe-050-cert-
   dashboard.mjs`'s own `seedAtHome` seeds, i.e. plausibly what the 050 dev actually
   ran) — 8 more exercises. Zero new console output. Phase 4.
5. **Every other view reachable from home** with this save loaded: Dashboard,
   Records, Friends, ShareCard, "Handen-check" (Onboarding refresh), ThemePicker —
   `qa-scripts/probe-056-dashboard.mjs`, `056-screenshots/05..10-*.png`. Zero new
   console output on any of them.
6. **The exam-final print flow specifically** (unique to 050's cert feature —
   `window.print()` + `page.emulateMedia({media:'print'})`, clicked twice) —
   `qa-scripts/probe-056-print.mjs`. Zero new console output.
7. **Headed (non-headless) Chromium**, in case headless frame-timing masks a
   loop-detection race — same result.
8. **A temporary render-count probe** (`window.__gsRenders++` at the top of
   `GameScreen`, reverted before commit — `git diff` on `src/` is empty): across the
   heaviest scenario I found (free-tier, 20 completed exercises, ~2358 renders),
   render count grew **linearly** (~120/round, matching ~3–4 renders per keystroke —
   normal `setGame`+`setLive`+`setCombo` batching), never spiking. A genuine
   effect-driven update-depth loop shows as an uncontrolled burst within a single
   commit, not linear growth across real user-driven keystrokes; I saw no such burst
   anywhere.
   Note: `page.keyboard.type()` cannot type NL's accented tail (é/ë/ï/ó — curriculum
   stage 20), so all later probes dispatch synthetic `keydown` events directly on
   `window` instead (matches `TypingSurface`'s `window.addEventListener('keydown', …)`
   contract).

**A real, adjacent finding (not the reported bug, not fixed here):** NL's curriculum
has 20 stages (15 core + 5 tail: Shift/16, `.,`/17, `?!'-`/18, digits/19, **accents/
20**), but `exam-final.stage === 19` — so the documented seed (`curriculumIndex: 19`)
is *not* actually curriculum-terminal for NL; stage 20 (accents) is still one
promotion away, and every currently-active key already sits at confidence 1. On a
**free-tier** (`unlocked: false`) session at exactly this state, `lettersLearned`
(26) already exceeds `FREE_LETTER_CAP` (10) before anything is typed, so
`GameScreen.jsx`'s `handleComplete` free-cap guard (`if (!unlocked && promoted &&
afterLetters > FREE_LETTER_CAP) { …roll back curriculumIndex to prevIndex…}`,
around line 227) fires on the very next exercise: `tryPromote` promotes 19→20,
`handleComplete` immediately reverts it to 19 and queues a 'paywall' moment instead
of 'letter'/'machine'. Because the rollback restores `curriculumIndex` to 19,
`tryPromote` finds the exact same promotable stage 20 again on the *next* completed
exercise too — this can repeat indefinitely for a free-tier player artificially
teleported here (a real free-tier player is gated out of this state entirely, since
they hit the paywall at 10 letters long before curriculumIndex could reach 19 with
everything already confident). Confirmed via `probe-056-repro.mjs` phase 4 and an
earlier manual run (`Hoofdstuk 1 voltooid!` recurring across multiple completions).
This is a real, narrow, single-exercise-per-transition state quirk in the same
effect/state logic AC2 points at — but it is a *bounded*, once-per-user-action
re-computation (confirmed via the render-count probe above: no synchronous cascade),
not a React render loop, so fixing it would not make an honest AC1/AC2 claim.
**Proposing this as a separate, lower-priority follow-up assignment** (not opened
here per protocol — reporting to the dispatcher) rather than fixing it under this
assignment's unmet premise.

**Why blocked rather than a guessed fix:** AC2 requires identifying *which* effect
loops and *why* — I have no such finding to report honestly; shipping a change to
"fix" a warning I never observed would be exactly the guessing the protocol asks me
not to do, and could mask whatever the 050 dev actually hit if it's environment- or
interaction-sequence-specific in a way I haven't reconstructed. Possibilities I
can't rule out from here: (a) the warning was tied to an intervening code path that
no longer exists in the current baseline (git history shows no changes to
`exams.js`/`curriculumCore.js`/`curriculumTail.js` since before 050, so this seems
unlikely but isn't provable from the repo alone), or (b) it required a specific
manual interaction sequence in a real (non-automated) browser session that isn't
captured in the assignment's terse recipe.

**Requesting:** either (1) the exact interaction sequence/environment that produced
the original warning (screenshot, recording, or a more specific repro script from
whoever observed it), so I can target it precisely, or (2) closing this assignment
as not-currently-reproducible, with the adjacent free-tier finding above spun out as
its own (much narrower, priority-4) assignment.

**Per-criterion status:**
1. Repro no longer warns — **not applicable**: never observed the warning on
   baseline across 8 distinct interaction paths (above); nothing to fix.
2. Root cause identified — **not met**: no loop found to identify; see "why blocked"
   above for what was ruled out and why a guess isn't offered.
3. Realistic play unaffected — **met for what was tested**: `npm test` 211/211,
   and every browser pass (play, exam-final pass, dashboard, records, friends,
   sharecard, handscheck, themepicker, print) showed zero new console errors beyond
   the pre-existing `/api/track` 404.
4. `npm test` green / `npm run build` clean — **met**: see exact output below.

**`npm test` output (unchanged from baseline — no `src/` edits landed):**
`node --test test/*.test.js` → `# tests 211 / # pass 211 / # fail 0`; chained
`node scripts/gen-content.mjs` → 22 URLs + sitemap; chained `vite build` → 99
modules transformed, built in 805ms, no warnings; chained
`node scripts/check-no-dutch-en.mjs` → `PASS — 5 built en file(s) checked against 59
Dutch lexicon words, zero unallowlisted hits.`

**Files touched:** no `src/` changes (a temporary `window.__gsRenders` render-count
probe was added to `src/game/GameScreen.jsx` during investigation and fully reverted
— `git diff` against `build/055` HEAD is empty for `src/`). New:
`qa-scripts/probe-056-repro.mjs` (main repro attempt: load-only, exam-final
completion, extended play, free-tier churn check), `qa-scripts/probe-056-
dashboard.mjs` (dashboard/records/friends/sharecard/handscheck/themepicker browser
tour), `qa-scripts/probe-056-print.mjs` (exam-final print/`@media print` flow), and
`company/assignments/056-screenshots/*.png` (10 screenshots).

## Unblocked (tick #10 dispatcher, 2026-07-23) — exact repro recipe from the 050 developer

The dispatcher queried the 050 developer's session directly. Answer (from actual
session history, three distinct repro runs, including one against clean baseline
commit 6717928 with all 050 changes stashed):

- **The trigger is the typing input pattern, not the seed alone.** All three repro
  runs typed the exam text via a **tight `page.keyboard.press()` loop with ZERO
  delay between presses**. The warning appeared once per run, interleaved between
  reading the exam text and the pass overlay appearing — i.e. during the rapid
  keystroke burst or the exam-completion transition, never on load (load-only was
  explicitly isolated: no warning).
- Reproduces with the committed `qa-scripts/gen-final-exam-save.mjs` seed (exam-final
  path, "Typdiploma") AND with a simpler variant seeding stage 19 with `exams` left
  default (which resolves to exam-1, "Thuisrij-toets") — so it is exam-surface
  generic, not exam-final-specific.
- Environment: headless Chromium 1228 via playwright-core, **vite dev server** (not
  preview), viewport 1280×900. StrictMode involvement unchecked.
- Key discrepancy vs. the 8 non-reproducing paths: the committed
  `probe-050-cert-dashboard.mjs` types with a 15ms per-keystroke delay and NEVER
  showed the warning. The 056 lane's probes were paced/varied too. A zero-delay
  burst on the exam TypingSurface is the untested variable.
- Related prior art: 049's delivery notes record fixing a "Maximum update depth
  exceeded" under synthetic zero-delay keystrokes (unstable inline `onKeystroke`
  prop → module-level `EXAM_NOOP`). Repro B was on a baseline that already contains
  that fix — so this is a second, distinct instability in the same class. Start
  there: what else in the exam typing path re-registers or feeds back per keystroke
  when keystrokes arrive faster than React commits?

## Delivery notes — status: needs_verification

**Repro confirmed on unmodified `build/056-r2` baseline.** Adapted
`qa-scripts/probe-056-repro.mjs`'s paced typing into a new
`qa-scripts/probe-056-burst-repro.mjs`: seeds the committed
`gen-final-exam-save.mjs` save, opens the exam-final pill, and types the exam text
via a tight `page.keyboard.press()` loop with **zero delay** between presses (no
`{delay: …}` option, nothing awaited except the press itself — the exact shape the
050 dev's session used). On baseline (verified via `git stash` of the fix,
re-running the probe, then `git stash pop`) this reliably produces:
```
error: Warning: Maximum update depth exceeded. This can happen when a component
calls setState inside useEffect, but useEffect either doesn't have a dependency
array, or one of the dependencies changes on every render.
```
(fired twice per run — once per StrictMode double-render pass). Paced typing (15ms
per keystroke, matching `probe-050-cert-dashboard.mjs` and all 8 non-reproducing
paths from this assignment's earlier blocked pass) never triggers it — confirmed
again on this baseline before touching any code.

**Root cause.** `src/ui/TypingSurface.jsx` had a second `useEffect` (the "meld de
volgende verwachte toets" one, right after the reset-on-new-exercise effect) whose
sole job is telling the parent which key to highlight next on the on-screen
keyboard:
```js
useEffect(() => {
  onNextKey?.(text[pos] ?? null);
}, [pos, text, onNextKey]);
```
`onNextKey` is `setNextKey`, a state setter in `GameScreen` — i.e. **this effect
calls `setState` from inside `useEffect`, with `pos` in its own dependency array**,
which is exactly the pattern React's own warning text describes. `pos` advances on
every correct keystroke (`setPos` inside the `onKeyDown` native listener), so this
effect fires once per keystroke too. Under **paced** typing, each keystroke's
render→commit→passive-effect→`setNextKey`→render chain completes and the browser
returns to idle before the next keydown arrives, so React's internal nested-update
counter (the "you might have an infinite loop" heuristic, tripped past a fixed
threshold — React's own `NESTED_UPDATE_LIMIT`) resets between characters and never
accumulates. Under a **zero-delay burst**, keydown events arrive faster than the
browser ever reaches that idle point: each keystroke still produces the same
two-hop chain (1: `onKeyDown` → `setPos` → render/commit → 2: the `pos`-effect →
`setNextKey` → another render/commit), and because the *next* native keydown is
already queued before step 2 finishes, the chain from one keystroke runs directly
into the chain from the next with no gap the heuristic recognizes as "settled" —
across a ~100–110 character exam string this accumulates past React's limit and it
throws the warning. Confirmed empirically with a temporary instrumentation pass
(reverted before commit, not part of this diff): every keydown was still processed
**exactly once** with the correct `pos` (110/110 keystrokes → 110 effect setups →
1 `onComplete` call, no double-processing/stale-closure bug) — ruling out a
duplicate-dispatch theory and confirming the issue is chain *length/density* per
keystroke, not correctness of any single keystroke. This is the second, distinct
instability in the same class as 049's `onKeystroke` fix: 049 stabilized a prop
*reference* that was recreated every render (a real runaway); this one is a
`setState`-inside-`useEffect` call chained to a fast-changing dependency, which is
finite (bounded by exam text length) but dense enough under a no-yield burst to trip
React's heuristic. Generic to the exam surface (and to the normal, non-exam
`TypingSurface` — same component, same effect) — not specific to `curriculumIndex
19` or the `exam-final` seed; those just happened to be how it was first found.

**Fix (`src/ui/TypingSurface.jsx`, minimal, effect/state logic only).** Removed the
per-keystroke `setState`-in-`useEffect` link entirely: the "next key" signal for a
new exercise still fires from a `useEffect` (now depending only on `text`, so it
fires once when a new exercise/exam text is loaded — `onNextKey?.(text[0] ?? null)`),
but the **per-keystroke** notification now happens directly inside the `onKeyDown`
native handler, in the same call as `setPos`:
```js
const nextPos = pos + 1;
setPos(nextPos);
onNextKey?.(text[nextPos] ?? null); // same batch as setPos, no effect hop
if (nextPos >= text.length) onComplete?.(buildResults(resultsRef.current));
```
Both `setPos` and the `onNextKey` call (which invokes `setNextKey` in `GameScreen`)
now originate from the same synchronous native-event-handler invocation, so React 18
batches them into one render instead of chaining a second effect-triggered render
after the first commits. This removes the per-keystroke effect hop entirely — there
is no longer a `useEffect` whose own dependency (`pos`) both triggers it and is
mutated by the keystroke that triggers it. `onNextKey` was added to the keydown
effect's own dependency array (line it's now called from) for correctness; it's
`setNextKey` in both the normal and exam call sites (`GameScreen.jsx`), a raw
`useState` setter — referentially stable, so this doesn't reintroduce the
instability class 049 already fixed for `onKeystroke`.

**Verification.**
1. **Burst repro, fixed code:** `qa-scripts/probe-056-burst-repro.mjs` — 3 clean runs
   in a row, `MAX_UPDATE_DEPTH_COUNT 0` every time, exam-pass overlay still renders
   correctly (`EXAM_RESULT_OVERLAY_VISIBLE true`), screenshot
   `056-screenshots/11-burst-after-exam.png`. Re-confirmed the warning returns when
   the fix is `git stash`ed (2/2) and disappears again on `git stash pop` (0/0,
   twice) — a clean before/after pair on the identical probe.
2. **Exam-surface-generic, not exam-final-specific:** same zero-delay burst against
   `gen-exam-save.mjs ready` (exam-1, "Thuisrij-toets", a completely different seed
   at stage 5) — `EXAM1_MAX_UPDATE_DEPTH_COUNT 0`, matching the 050 dev's report
   that it reproduced on exam-1 too pre-fix.
3. **Normal (non-exam) TypingSurface, burst:** 5 rounds of ordinary exercises typed
   via the same zero-delay `page.keyboard.press()` loop — `NORMAL_MAX_UPDATE_DEPTH_
   COUNT 0`, zero unexpected console output. The shared component is now burst-safe
   on both call sites, not just the one that was reported.
4. **Paced/realistic play unaffected:** new `qa-scripts/probe-056-paced-regression.
   mjs` (15ms/keystroke `page.keyboard.type`, matching `probe-050-cert-dashboard.
   mjs`'s pace) — exam-final pass overlay renders, 3 further paced rounds all
   complete normally, `MAX_UPDATE_DEPTH_COUNT 0`, zero unexpected console output.
   Also re-ran the three probes from this assignment's earlier blocked pass against
   the fixed code: `probe-056-repro.mjs` (paced load/exam/extended-play phases —
   identical console-message count to the pre-fix baseline, 11 msgs = only the
   pre-existing `/api/track` 404s), `probe-056-dashboard.mjs` (dashboard/records/
   friends/sharecard/handscheck/themepicker tour — zero unexpected messages),
   `probe-056-print.mjs` (exam-final print/`@media print` flow — zero unexpected
   messages). Paced play is byte-for-byte the same set of console output as before
   the fix.
5. `npm test`: **211/211** unit tests green (unchanged — no test files touched, this
   is a DOM-timing bug not expressible as a pure-function unit test per the
   assignment's own allowance; the burst probe is the regression artifact).
   `node scripts/gen-content.mjs` → 22 URLs + sitemap, unchanged. `vite build` →
   99 modules, clean, no warnings. `node scripts/check-no-dutch-en.mjs` → PASS, 5
   built en files checked against the 59-word lexicon, zero unallowlisted hits.

**Per-criterion status:**
1. Repro no longer warns — **met**: burst probe clean on fixed code (3/3 runs),
   confirmed warning was present pre-fix on the identical probe (2/2), gone
   post-fix (0/0 across a stash/pop pair).
2. Root cause identified and documented — **met**: see "Root cause" above —
   `setState`-inside-`useEffect` on a `pos`-keyed dependency in
   `TypingSurface.jsx`'s next-key-signal effect, which under a zero-delay keydown
   burst never lets the browser reach the idle point React's nested-update
   heuristic resets on.
3. Realistic-play flows unaffected — **met**: `npm test` 211/211; paced browser
   passes (play, exam-final, exam-1, dashboard/records/friends/sharecard/
   handscheck/themepicker, print) all show zero new console errors, identical
   output to pre-fix baseline.
4. `npm test` green / `npm run build` clean — **met**: see exact output above.

**Files touched:** `src/ui/TypingSurface.jsx` (the fix — 3-line effect restructure
+ comment). New: `qa-scripts/probe-056-burst-repro.mjs` (the regression artifact —
zero-delay burst repro against the exam-final surface), `qa-scripts/probe-056-paced-
regression.mjs` (fast paced-play sanity check), `company/assignments/056-
screenshots/11-burst-after-exam.png`. Carried over from the earlier blocked pass
(unchanged): `qa-scripts/probe-056-repro.mjs`, `qa-scripts/probe-056-dashboard.mjs`,
`qa-scripts/probe-056-print.mjs`, `company/assignments/056-screenshots/01..10-*.png`.
`src/ui/Keyboard.jsx` and `.kb-*` CSS were not touched (lane 057's mobile keyboard
fix, already merged into this worktree's `main` ancestry, was left untouched).

## Verification (tester, 2026-07-23)

Independently re-derived, not audited from the diff. Worktree `C:\companies\typcoon-lanes\v056`
(branch `verify/056`), `npm install` + `npm install --no-save playwright-core`, dev server
on port 4207 (vite, not preview). Chromium 1228 via `playwright-core`, headless. Ran the
committed probes with `BASE`/`ROOT` values pointed at this worktree/port (temporary local
copies `qa-scripts/_v056_probe-*.mjs`, committed alongside this note as the verification
artifact — logic byte-identical to the originals, only the constants differ), plus two
new tester-authored probes for coverage the committed set didn't explicitly hit.

**Step 1 — reproduced the bug myself, pre-fix.** Extracted the pre-fix `TypingSurface.jsx`
via `git show 99744b4^:src/ui/TypingSurface.jsx`, wrote it into the worktree (dev server
hot-reloaded it), ran `probe-056-burst-repro.mjs`'s zero-delay-burst recipe 3x:
**2/2 "Maximum update depth exceeded" warnings every run (6/6 total)**, matching the
delivery notes' description exactly. Restored the committed fixed file
(`git checkout -- src/ui/TypingSurface.jsx`) and confirmed via `git diff` there was no
residual change (a stray CRLF-vs-LF diff from the temp-file round trip was checked byte-
for-byte identical modulo line endings, then discarded with the same checkout).

**Step 2 — burst probe on fixed code, 3+ runs.** 3/3 clean runs: `MAX_UPDATE_DEPTH_COUNT 0`
every time, `EXAM_RESULT_OVERLAY_VISIBLE true` every time (exam-final "Typdiploma" pass
overlay renders correctly after the burst). Matches the delivery notes' own numbers.

**Step 3 — generic coverage.** `probe-056-burst-repro.mjs` itself only exercises the
exam-final surface, so I wrote `qa-scripts/_v056_probe-generic-burst.mjs` to independently
cover the other two surfaces the delivery notes claim are also fixed: (a) exam-1
("Thuisrij-toets", `gen-exam-save.mjs ready`, a different seed at curriculum stage 5,
zero-delay burst) — `EXAM1_MAX_UPDATE_DEPTH_COUNT 0`; (b) plain non-exam exercises on a
fresh, unseeded profile, 5 rounds, zero-delay burst — `NORMAL_MAX_UPDATE_DEPTH_COUNT 0`,
all 5 rounds completed. Both clean.

**Step 4 — paced/realistic regression.** `probe-056-paced-regression.mjs`:
`MAX_UPDATE_DEPTH_COUNT 0`, `PACED_EXAM_PASS_VISIBLE true`, `UNEXPECTED_MSGS []`. Also ran
`probe-056-repro.mjs` (the original blocked-pass probe: load-only, immediate exam-final
completion, 10 rounds of extended play, then the free-tier teleported-state edge case) —
phases 1-3 (load/exam/extended-play) consistently clean across multiple runs:
`MAX_UPDATE_DEPTH_COUNT 0`, `UNEXPECTED_MSGS []`, console output limited to the documented
pre-existing 404s plus vite/DevTools debug lines, identical shape to what the delivery
notes report. Phase 4 (the separately-flagged free-tier + teleported-19 edge case,
already called out in this assignment's own earlier "blocked" pass as an out-of-scope
quirk a real free-tier player can never reach) intermittently crashed the headless
Chromium tab ("Page crashed") partway through its 8-round loop on **both** pre-fix and
post-fix code — confirmed identical behavior on both by re-running phase 4 against the
reverted pre-fix file. Since it reproduces unchanged on baseline, it is pre-existing
environment/script flakiness in that already-out-of-scope phase, not a regression from
this fix; not blocking. Filed as a new, low-confidence finding below rather than an AC
failure.

**Step 5 — correctness of the restructure.** Wrote
`qa-scripts/_v056_probe-keyboard-highlight.mjs`: paced typing (20ms/keystroke) through a
plain exercise, reading `.kb-key.next`'s displayed character before each keystroke and
comparing it to the actual next expected character. 15/15 steps matched
(`HIGHLIGHT_MISMATCHES 0`), `MAX_UPDATE_DEPTH_COUNT 0` — the on-screen keyboard's next-key
highlight still advances correctly every keystroke now that the notification fires from
`onKeyDown` instead of the removed `pos`-keyed effect. No stale-highlight regression.

**Step 6 — full suite / build, and a critical read of the root-cause claim.** `npm test`:
**211/211** unit tests pass, `gen-content.mjs` clean (22 URLs + sitemap), `vite build`
clean (99 modules, no warnings), `check-no-dutch-en.mjs` PASS. The root-cause mechanism
(a `setState`-inside-`useEffect` chain keyed on `pos`, dense enough under a *zero-delay,
no-yield* keydown burst to never let the browser reach the idle point React's nested-
update heuristic resets on, but finite/bounded and therefore invisible under paced typing
where each keystroke's chain settles before the next arrives) is internally consistent
and matches what I observed directly: identical warning-producing pre-fix behavior under
burst-only, and identical clean behavior under paced-only, on the same unmodified file —
i.e. it's the keystroke *timing*, not the seed/state, that flips the outcome, which is
exactly what the mechanism predicts and what the 050-dev's original session apparently hit
by chance (an automated zero-delay burst) rather than any real child's typing cadence ever
producing.

**Verdict: all 4 acceptance criteria hold.** Per-criterion:
1. Repro no longer warns — **met**: pre-fix 6/6 warnings across 3 runs, post-fix 0/0
   across 3 runs, same probe, same worktree.
2. Root cause identified and documented — **met**: matches what I reproduced directly
   (timing-dependent, not state-dependent); mechanism explanation checked and holds up.
3. Realistic-play flows unaffected — **met**: full suite green; paced browser passes
   (exam-final, exam-1 seed, plain exercises, dashboard/records/friends/sharecard/
   handscheck/themepicker, print) all zero new console errors; on-screen keyboard
   highlight regression-checked directly and found correct.
4. `npm test` green / `npm run build` clean — **met**: 211/211, clean build, as above.

**New finding (not an AC of this assignment, filed for awareness, not blocking):**
`qa-scripts/probe-056-repro.mjs`'s phase 4 (free-tier + `curriculumIndex 19`-teleported,
already-maxed-confidence save, 8 rounds of repeated-paywall churn — the same edge case
this assignment's earlier "blocked" pass flagged as a narrow, out-of-scope UX quirk, and
which the assignment itself confirms a real free-tier player is gated out of long before
reaching) intermittently crashes the headless Chromium renderer tab ("Page crashed",
`page.waitForTimeout` throwing) partway through the loop. Reproduces on **both** pre-fix
and post-fix `TypingSurface.jsx` (confirmed by re-running phase 4 against the reverted
pre-fix file), and one earlier run did complete cleanly, so this looks like Chromium/
Playwright memory or renderer instability under this environment's headless setup after
sustained heavy overlay churn across ~18+ typed exercises and multiple full-page reloads
in one browser session, rather than a product defect — but a real memory-growth issue in
the repeated-paywall path can't be fully ruled out either (that path was already flagged
as a quirk worth a narrower follow-up). Severity: low/cosmetic for the product
(unreachable state for real players; a QA-script-only crash, not a user-facing one), low
confidence on root cause (could be sandbox/Chromium flakiness or a real accumulation
bug) — worth a follow-up look if the free-tier teleported-paywall-loop quirk ever gets
its own assignment, but not a reason to bounce 056.

**Files touched (tester):** `company/assignments/056-max-update-depth-teleported-save.md`
(this note, `status: done`). New: `qa-scripts/_v056_probe-056-burst-repro.mjs`,
`qa-scripts/_v056_probe-056-paced-regression.mjs`, `qa-scripts/_v056_probe-056-repro.mjs`,
`qa-scripts/_v056_probe-056-dashboard.mjs`, `qa-scripts/_v056_probe-056-print.mjs`
(port/root-adjusted copies of the developer's committed probes, for this worktree/port
4207 — logic unchanged), `qa-scripts/_v056_probe-generic-burst.mjs` and
`qa-scripts/_v056_probe-keyboard-highlight.mjs` (new, tester-authored, AC-3/AC-5-style
coverage). No `src/` changes — the fix as committed in `99744b4` is verified as-is.
