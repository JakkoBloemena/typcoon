---
id: 061
title: Rapid double-click on a locked theme card pops two overlay levels (lands on home instead of unlock)
owner: developer
status: needs_verification
priority: 4
blocked_by: []
opened_by: tester (reported during 052 verification; materialized by the tick #11 dispatcher from the 059-064 reservation)
---

## Goal

Near-simultaneous double-click on a locked theme card in the theme picker can pop
two overlay levels — the player lands back on the home screen instead of on the
unlock card. No paywall bypass: the locked theme is neither applied nor persisted
(re-verified during 052 verification). Likely pre-existing overlay-stack behavior
(each click handler fires a navigation), not introduced by 052. Make the locked-card
click handler idempotent per gesture (or debounce/guard the overlay navigation) so a
double-click lands on the unlock card exactly like a single click.

## Acceptance criteria

- [x] Scripted near-simultaneous double-click on a locked theme card lands on the
      unlock card (same end state as a single click), not the home screen —
      reproduce first on unmodified code, then show the fix closes it.
- [x] Single-click behavior unchanged (locked → unlock card; unlocked → theme
      applies and persists).
- [x] No theme is applied or persisted by any click pattern on a locked card
      (re-assert 052's guarantee).
- [x] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Repro: `qa-scripts/tester-052-edge.mjs` (052 verification lane), screenshot
`company/assignments/052-screenshots/tester/edge-rapid-doubleclick-locked.png`.
Environment: headless Chromium via playwright-core, scripted double-click —
reproduced only near-simultaneously; normal human clicking unaffected. Severity:
low (cosmetic navigation quirk, no economic/paywall impact), medium confidence on
mechanism (overlay stack) — diagnose before fixing. Priority 4 per protocol.

## Delivery notes (developer, 2026-07-23, build/061)

### Root cause

`ThemePicker.jsx`'s `choose(id)` calls `onLocked()` for a locked theme, which is
wired in `App.jsx` as `onLocked={() => { setShowThemePicker(false); setShowUnlock(true); }}`
— a single-tick swap of the ThemePicker overlay for the Unlock overlay, both
full-screen `.overlay` backdrops (`onClick={onClose}`) with a centered `.card`
that does **not** cover the full backdrop.

The locked theme `<li>` is a list item positioned wherever it sits in the theme
list — not necessarily under where the Unlock card's centered box lands. When
the first click of a rapid double-click fires: `choose()` → `onLocked()` →
ThemePicker unmounts, Unlock mounts, all synchronously in React's event-handler
batch. The **second** click (a distinct browser click, not a replay of the
first — confirmed by instrumenting `document.elementFromPoint(x, y)` between
the two clicks) then lands at the same screen coordinates, which are now over
the freshly-mounted Unlock overlay's *backdrop* `<div className="overlay">`
(verified: `elementFromPoint` returned `{tag: 'DIV', cls: 'overlay'}` at that
point right after click 1). That backdrop's `onClick={onClose}` fires,
immediately closing Unlock too → `setShowUnlock(false)` → back to home. Two
overlay levels close from two distinct clicks, not from one click firing twice.
This is the only place in the codebase where one click handler swaps overlay
A for overlay B in the same tick (`grep` for the pattern found nothing else),
so the bug is specific to this transition — not a general overlay-stack issue.

This confirms the "overlay stack" mechanism named in the assignment notes, with
the precise detail that it's backdrop click-bleed-through from stale click
coordinates, not a double-fired handler.

### Fix

`src/game/Unlock.jsx`: added a short (400ms) mount-guard on the overlay
backdrop's close handler (`closeBackdrop`, using a `useRef(Date.now())`
captured at mount) — a click on the backdrop within 400ms of the Unlock
overlay appearing is ignored, so a second click that bleeds through from the
overlay swap can't immediately dismiss it. The explicit "Nog even niet" /
"later" buttons still call `onClose` directly (unguarded — deliberate button
clicks are unaffected). This is a minimal, targeted guard on the one overlay
that gets swapped-into under this scenario; no other overlay in the codebase
does a same-tick swap, so no other file needed the guard.

### Per-criterion evidence

1. **Double-click lands on unlock card, not home (before/after)**: Reproduced
   on unmodified code — bug is a timing race (near-simultaneous clicks), not
   deterministic every run; observed ~4/5 repro rate pre-fix via
   `qa-scripts/dev-061-repro.mjs` against unmodified `Unlock.jsx` (stashed the
   fix, restarted dev server, ran the script in a loop; reproduced on the
   first run: `unlockCardCountAfter: 0, overlayCountAfter: 0`, landed on home
   — screenshot `company/assignments/061-screenshots/dev/BEFORE-rapid-doubleclick-locked.png`).
   Post-fix: ran the same script 8 consecutive times, `unlockCardCountAfter: 1`
   every single run (0/8 reproductions) — screenshot
   `company/assignments/061-screenshots/dev/verify-double-click-locked-after-fix.png`
   shows the parent-gate ("Even een volwassene erbij") unlock card, not home.
2. **Single-click unchanged**: `qa-scripts/dev-061-verify.mjs`, browser-verified
   post-fix — locked theme single-click → `unlockCardCount: 1, overlayCount: 1`
   (screenshot `verify-single-click-locked.png`); unlocked theme single-click →
   `data-theme` attr and `localStorage['typcoon:theme']` both set to
   `snoepfabriek` immediately and **still** `snoepfabriek` after a full page
   reload, i.e. applies and persists (screenshot
   `verify-single-click-unlocked-applied.png`).
3. **No bypass on any click pattern (052 guarantee re-asserted)**: post-fix,
   `data-theme` attr and `typcoon:theme` storage stayed `null` after both the
   rapid double-click and an added rapid **triple**-click on the locked card
   (`rapidTripleClickLocked` result in `dev-061-verify.mjs` output) — no
   theme applied or persisted under any click pattern tested.
4. `npm test` → 215/215 pass, build clean, `check-no-dutch-en` PASS.
   `npm run build` clean standalone. Console errors observed during all runs
   were exclusively `Failed to load resource: /api/track (404)` — a
   dev-environment analytics-endpoint 404 (no backend running locally),
   present identically before and after the fix and on a plain page load with
   no theme interaction at all; confirmed via `page.on('response')`
   instrumentation. Zero *new* console errors from the fix.

### Files touched

- `src/game/Unlock.jsx` — the fix (backdrop-click mount-guard).
- `qa-scripts/dev-061-repro.mjs` — adapted repro from `tester-052-edge.mjs`
  for this worktree/port (4212 instead of hardcoded 4205/v052 lane paths).
- `qa-scripts/dev-061-verify.mjs` — new script covering all four acceptance
  criteria in one run (single-click both states, rapid double, rapid triple).
- `company/assignments/061-screenshots/dev/` — evidence screenshots.
- `public/` build churn from `npm test`/`npm run build` was reverted before
  committing (per workspace rules); not part of the commit.

Did not touch `game.css` or `qa-scripts/contrast-052.mjs` (assignment 060's
concurrent lane files) — this was a pure JS logic fix in `Unlock.jsx`.
