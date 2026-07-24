---
id: 117
title: "Narrowing the window below the 1024px desktop floor mid-exercise silently discards the current typed exercise/combo/exam state (reactive width gate unmounts GameScreen)"
owner: developer
status: needs_verification
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

- [x] Decide and document the intended behaviour for this case (this is a product/UX call,
      not just an implementation one — flag to product-owner if the fix approach isn't
      obvious): options include (a) accept the current behaviour as-is and explicitly note
      it's out of scope (bounded, no data loss, same as an accidental reload), (b) lift the
      width-gate check to only apply to `view === 'home'`/pre-game screens and let an
      already-in-progress play/factory session ride through a brief narrow excursion
      without unmounting (matching "the gate protects entry to a game surface, not an
      already-open one"), or (c) some other resolution — but a decision should be recorded,
      not left implicit.
- [x] Whatever is decided, verify no regression to assignment 106's own acceptance criteria
      (the width-hint must still appear for a genuinely fresh/narrow visitor).
- [x] `npm test` stays green.

## Decision

**Refinement of (c), landing closer to (b) than (a) — but not literally (b).** Option (b)'s
literal text ("ride through... without unmounting") reads as *stop gating play/factory while
narrow*, i.e. the raw game surfaces would become visible (reflowed) below the floor for an
open session. That would directly re-open the door ADR 015 closed: ADR 015 rule 2 is a
categorical, no-exception standing rule ("a narrow-viewport... finding on a game surface
is... handled... covered by the width floor... always the friendly gate, never a
responsive/mobile layout for a game surface") and its consequence is that `FactoryPage`
(`Shop.jsx`'s diorama, `.hal`/`.mch`) is *exactly* the surface 106 fixed — letting it render
reflowed again for any window, even briefly and only for an open session, contradicts the
product-owner's own ruling.

The two goals are not actually in tension once separated: ADR 015 constrains what is
*visually shown* below the floor (always the calm hint, zero exceptions); 117's defect is
about what gets *unmounted* (destroying local component state). Nothing requires those to be
coupled — the app can keep showing the hint and stop destroying the mounted tree underneath
it.

**Implemented: same visual gate, different mechanism.** Below the floor, the calm hint is
still the *only* thing the player sees, in every view, exactly as ADR 015 requires — no
observable regression to 106. What changes is that `GameScreen`/`FactoryPage`, if already
mounted (an open `view === 'play'`/`'factory'` session), are no longer unmounted by the
gate — they're kept mounted but CSS-hidden (`display: none`) behind the hint, and reappear
exactly as they were the moment the window crosses back over 1024px. A brand-new/pre-game
visitor (`view === 'home'`, `'onboarding'`, etc., or `view === 'play'`/`'factory'` with no
`game` yet) still hits the original early-return exactly as before 117 — entry stays fully
gated, matching 106's own acceptance criteria verbatim.

This also required one small, mechanically-forced follow-on: `TypingSurface`'s keydown
listener is attached at the `window` level regardless of visibility, so leaving `GameScreen`
mounted-but-hidden would otherwise let a stray keystroke silently advance the *invisible*
exercise while the hint is shown. `GameScreen` now accepts a `paused` prop (App passes
`narrowWindow`) that gates `TypingSurface`'s `active` the same way an open vier-moment
overlay already does (`active={!overlayOpen && !paused}`) — no other behaviour change.

This was judged a developer-level call, not a product-owner escalation: it does not trade
off against any stated design goal (ADR 015's visual guarantee is fully preserved, with no
exception, for every view), it strictly improves state continuity with no user-visible
downside, and it does not introduce any new UI, copy, or styling decision (no new visual
tokens; `display: none` is structural, not a design value). If a reviewer disagrees that
this is within developer discretion, the concrete disagreement to raise is: *should ADR 015's
"never reflowed below the floor" guarantee ever bend for an open session* — this
implementation's answer is no, never; a narrower/looser answer would be the product call to
escalate.

## Delivery notes (developer d117, tick #41)

**Root cause.** `App.jsx`'s `narrowWindow` early return (assignment 106) sat above every
`view === '...'` branch, so it was an unconditional `if (narrowWindow) return <hint/>` — the
entire previously-rendered tree (`GameScreen`/`FactoryPage` and everything below them) was
thrown away by React and rebuilt from scratch on the way back, discarding any local
`useState`/`useRef` that hadn't yet been flushed into `game`/localStorage (typed-so-far
`pos` in `TypingSurface`, session `combo`, an open `examMode`, etc.).

**Mechanism (fix).** `src/game/App.jsx`:
- Added a `liveSession = (view === 'play' || view === 'factory') && !!game` check; the
  narrow-window early return now only fires `if (narrowWindow && !liveSession)`, unchanged
  in every other respect (touchOnly() gate, home/onboarding/refresh/dashboard/etc. all still
  early-return exactly as before).
- The `view === 'play'` and `view === 'factory'` branches now always render their component
  (never conditioned on `narrowWindow`), wrapped in a `<div style={narrowWindow ? {display:
  'none'} : undefined}>` so React keeps the same component instance mounted across the
  resize instead of unmounting/remounting it; a `<NarrowHint/>` (factored out of the
  previous 3x-duplicated markup, same `desktop.widthTitle`/`widthBody` copy, unchanged) is
  rendered alongside when narrow, so the visible page is unchanged from 106's behaviour.
- `src/game/GameScreen.jsx`: added a `paused` prop (`App` passes `narrowWindow`), combined
  into `TypingSurface`'s `active` prop (`!overlayOpen && !paused`) so the window-level
  keydown listener doesn't silently advance a hidden exercise while the hint covers it.

**Decision:** see `## Decision` above — hint stays the only visible thing below the floor in
every view (ADR 015 unchanged, zero exceptions), but the mounted tree is preserved instead
of destroyed. Not a literal reading of filed option (b); closer to a refinement of (b) that
also satisfies ADR 015's letter, which the filing's literal (b) would have broken for the
`factory` view (the diorama ADR 015/106 exists to protect).

**Verification run** (dev server on port 4299, this worktree):
- `npm test` (unit tests + `vite build` + `check-no-dutch-en`): 266/266 unit tests PASS,
  build succeeds, `check-no-dutch-en` PASS. Confirmed both before touching source (baseline)
  and after the change.
- `qa-scripts/117-dev-verify.mjs` (new, written this tick, evidence under
  `company/assignments/117-screenshots/`): 19/19 PASS —
  - A1: the exact 117 repro (1360→700→1360 mid-word) — typed `.tchar.done` progress and the
    exercise text itself now survive the round trip (previously: reset to a fresh exercise,
    0 progress); `TypingSurface` confirmed to stay mounted (hidden) under the hint while
    narrow.
  - A2: 12 rapid boundary crossings in ~1s mid-exercise — no uncaught `pageerror`, typed
    progress still intact afterward (stability probe from 106's own tick-40 verification,
    re-run against the new code path).
  - A3: narrowing while on the `factory` view shows the hint and the diorama (`.hal`) is
    NOT visible (0 visible `.hal` elements) while narrow — confirms ADR 015's guarantee
    holds for an open factory session too, not just at entry; widening back restores it.
  - B1/B2/B3: assignment 106 regression checks — fresh narrow visitor at home gets the
    hint; exact 1023 (hint) / 1024 (game) boundary at entry unaffected; `touchOnly()`
    coarse-pointer gate unaffected (original touch copy, not the width copy).
  - Also re-ran `qa-scripts/106-tester-verify.mjs` unmodified against this worktree's dev
    server as an extra cross-check (not committed — it writes into 106's own tracked
    screenshot dir, restored via `git checkout` afterward both times): 24/25 passed. The
    one failure (`1024px fine-pointer: no .mch/.mch overlap`, ~1.6px overlap) reproduces
    **identically on the pre-117 code** (confirmed by stashing this change and re-running
    against the same server) — pre-existing, unrelated to this assignment's surface (a
    `Shop.jsx` diorama-width measurement at exactly the 1024px floor, not the gating logic
    117 touches). Filed separately as assignment 120 rather than fixed here (out of scope
    for 117's surface).

**Judgment calls flagged for the tester:**
- The core design call (never literally let a reflowed game surface render below the floor,
  even for an open session; instead hide-not-unmount) is recorded above in `## Decision`
  with its rationale — worth an independent sanity check given it's a refinement of the
  filed options rather than a literal pick of (a)/(b)/(c).
- `examMode` continuity was **not** independently reproduced in a live browser run: the
  `buildSave5()` fixture (shared with 106/117's own qa scripts) doesn't reach exam-ready
  `keyStats` confidence, so no exam pill/banner is ever offered to click through to
  `examMode` in this fixture. The fix mechanism is generic (it preserves the *entire*
  mounted `GameScreen` subtree indiscriminately, not anything exercise-specific), so
  `examMode` survival follows from the same code path already verified for `pos`/exercise
  text — but this is reasoning from the mechanism, not a live repro. A tester wanting a
  dedicated exam-state screenshot would need a fixture with a ready exam (e.g. seeded
  `keyStats` confidence ≥ 0.82 for the relevant curriculum keys).
- `FactoryPage`'s own local state (`unlockOffer`, `offline` banner) was not individually
  probed for survival — it now rides the same "hidden, not unmounted" mechanism as
  `GameScreen` by construction, but no `.overlay`/offline-banner-specific check was written
  (neither holds anything as consequential as typed progress/combo/exam).

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
