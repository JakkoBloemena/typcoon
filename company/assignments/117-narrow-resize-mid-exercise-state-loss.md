---
id: 117
title: "Narrowing the window below the 1024px desktop floor mid-exercise silently discards the current typed exercise/combo/exam state (reactive width gate unmounts GameScreen)"
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: tester (found while independently verifying assignment 106, tick #40)
---

## Goal

Assignment 106 (ADR 015) added a reactive `matchMedia('(max-width: 1023px)')` width floor
to `src/game/App.jsx`'s device gate: below 1024px, the app shows a calm "make your window
wider" hint instead of the game surfaces, and — unlike the pre-existing `touchOnly()` gate,
which is effectively static-at-load — this new gate is *reactive*, flipping live as the
window crosses the boundary in either direction while the page stays open. That reactivity
is the right call (a desktop user resizing mid-session should get the game back without a
reload) and is not what this assignment is about.

The gap: the gate's early return in `App.jsx` sits **above** the `view === 'play'` (and
`'factory'`, `'onboarding'`, etc.) branches, so when it fires it unmounts the entire
`GameScreen` subtree — not just re-skins it. `GameScreen` (and its child `TypingSurface`,
`src/ui/TypingSurface.jsx`) hold real in-progress state in local `useState`/`useRef` that
is never written to `game`/localStorage until an exercise *completes*: the current
exercise's typed-so-far position (`TypingSurface`'s `pos`), the session combo/live-accuracy
counters, and (most notably) an in-progress exam's `examMode` (`{ exam, text, startedAt }`)
if one was open. None of that is preserved across an unmount/remount.

Reproduced concretely: with a live exercise "ng fi fc fg ff tde" and 2 characters already
typed correctly (`.tchar.done` count = 2, confirmed via screenshot), resizing the window
1360px → 700px → 1360px in a single session returns the player to a **different, freshly
generated exercise** ("et fs fu fr ff ter") with zero typed progress — the in-flight
exercise was silently discarded, not resumed. See
`company/assignments/106-screenshots-verify/11-mid-word-before-resize.png` (before) and
`12-mid-word-after-roundtrip.png` (after) for the visual before/after.

To be fair to the existing design: this is **not** a crash, **not** save corruption, and
**not** a new class of loss in the abstract — a full page reload mid-exercise already
discards the same in-flight state today (it was never persisted), and `GameScreen`'s
production-tick `setInterval` (line ~133) cleans up correctly on unmount, so there's no
leaked timer either. The narrow-but-real problem is that a **window resize** is a much
easier action to trigger *by accident while still intending to keep playing* than a
deliberate reload — an OS aero-snap, a second monitor drag, or a window manager tiling
action can cross the 1024px line for a moment without the player ever meaning to leave the
game. Losing the current word/exam because of that is a rough edge worth smoothing, even
though it is bounded (only the current, uncommitted exercise; no lifetime/save progress is
at risk) and requires a fairly specific sequence (fine-pointer desktop user, actively
mid-exercise, resizes across the exact 1024px boundary) to hit.

## Reproduction

1. `npm ci`, `npx vite --port <any>`.
2. Seed a `typcoon:save` in localStorage with a valid hydratable state (see
   `qa-scripts/106-tester-verify.mjs`'s `buildSave5()`/`seedAndGoToFactory()` for a working
   fixture) and `typcoon:onboarded`/`typcoon:unlocked`, then reload.
3. Set the viewport to ≥1024px (e.g. 1360px). Click through to the typing/play view
   (`view === 'play'`) so an exercise (`TypingSurface`) is live.
4. Type 1-2 correct characters of the current exercise (confirm `.tchar.done` increments).
5. Resize the viewport below 1024px (e.g. 700px), then back above it (e.g. 1360px), in the
   same page session — no reload.
6. Observe: the player is back on the play view, but on a **new** exercise, with typed
   progress reset to zero. If an exam had been offered/started (`examMode`) before step 5,
   it is silently abandoned rather than resumed (though — checked — no exam "attempt" is
   burned for this, since `finishExam`/the attempts counter in `src/engine/exams.js` is
   only incremented on a completed attempt, not an abandoned one).

## Acceptance criteria

- [ ] Decide and document the intended behaviour for this case (this is a product/UX call,
      not just an implementation one — flag to product-owner if the fix approach isn't
      obvious): options include (a) accept the current behaviour as-is and explicitly note
      it's out of scope (bounded, no data loss, same as an accidental reload), (b) lift the
      width-gate check to only apply to `view === 'home'`/pre-game screens and let an
      already-in-progress play/factory session ride through a brief narrow excursion
      without unmounting (matching "the gate protects entry to a game surface, not an
      already-open one"), or (c) some other resolution — but a decision should be recorded,
      not left implicit.
- [ ] Whatever is decided, verify no regression to assignment 106's own acceptance criteria
      (the width-hint must still appear for a genuinely fresh/narrow visitor).
- [ ] `npm test` stays green.

## Notes

Filed at priority 4: real and reproducible, but narrow in scope (bounded to in-flight,
uncommitted exercise state; requires a specific fine-pointer-desktop-mid-exercise-resize
sequence; not a crash or save-loss). Does not block 106, which is `done` — this is a
newly-surfaced consequence of 106's design, not a violation of any of 106's own written
acceptance criteria (which are silent on resize-during-play). See
`company/assignments/106-diorama-mobile-machine-overlap.md`'s "Verification (tester v106,
tick #40)" section for the full investigation, including confirmation that rapid boundary
oscillation (12 crossings in ~1s) causes no crash and no uncaught `pageerror`s — this is
purely a state-continuity gap, not a stability one.
