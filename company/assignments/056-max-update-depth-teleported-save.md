---
id: 056
title: React "Maximum update depth exceeded" on artificially seeded end-state saves
owner: developer
status: blocked
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

- [ ] The repro (seed `curriculumIndex = 19`, all confidences maxed, no practice
      history, load the game) no longer emits "Maximum update depth exceeded".
- [ ] The root cause is identified and documented in the delivery notes (which effect
      loops, and why only on the teleported state).
- [ ] Realistic-play flows are unaffected: full suite green, and a normal
      play/exam/theme browser pass shows zero new console errors.
- [ ] `npm test` green; `npm run build` clean.

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
