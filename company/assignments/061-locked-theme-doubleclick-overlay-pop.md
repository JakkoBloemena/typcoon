---
id: 061
title: Rapid double-click on a locked theme card pops two overlay levels (lands on home instead of unlock)
owner: developer
status: done
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

## Verification (tester, 2026-07-23, verify/061)

Independently re-derived all evidence in `C:\companies\typcoon-lanes\v061`
(worktree branch `verify/061`, main checked out at `f1213fe`), headless
Chromium via `playwright-core` (`chromium-1228`, installed locally with
`npm install --no-save playwright-core` — same convention other lanes use;
package.json/package-lock stayed untouched), dev server on port 4216 only
(`npx vite --port 4216 --strictPort`). Adapted the dev's probes into
`qa-scripts/tester-061-repro.mjs` (port 4212→4216, output dir→this
worktree's own `061-screenshots/tester`, added an `ITERS`/`LABEL_PREFIX` loop
so the timing race gets enough tries) and `qa-scripts/tester-061-verify.mjs`
(same port/dir adaptation, plus two added edge probes for AC3's guard-window
boundary). Did not take the developer's prose or screenshots on faith — every
number below came from a script I ran myself against a running server.

**AC1 (before/after, timing race, ≥5/≥8 iterations)** — PASS.
- Pre-fix: `git checkout 4dadd49^ -- src/game/Unlock.jsx` (confirmed via
  `git diff --stat` showing the guard code removed, and `grep` showing plain
  `onClick={onClose}` on the backdrop with no `closeBackdrop`/`BACKDROP_GUARD_MS`),
  restarted the dev server, ran the rapid-double-click repro in two separate
  loops: 6 iterations (4/6 reproduced: `unlockCardCountAfter: 0,
  overlayCountAfter: 0`, landed on the dashboard, not the unlock card) and a
  second isolated run of 4 iterations with distinct screenshot filenames to
  keep persisted evidence (4/4 reproduced this time — bug is a timing race,
  rate varies run to run but reproduces readily, consistent with the dev's
  ~4/5 claim). Screenshots:
  `company/assignments/061-screenshots/tester/PREFIX-bug-persisted-iter0.png`
  through `iter3.png` (all four show the dashboard/home screen with both
  overlay levels closed — confirmed visually, not just via selector counts).
- Restored the fix: `git checkout HEAD -- src/game/Unlock.jsx`, then
  `git diff HEAD -- src/game/Unlock.jsx` produced empty output (restoration
  proven clean) and `grep` confirmed `BACKDROP_GUARD_MS`/`closeBackdrop` back
  in place. Restarted the dev server, ran the double-click repro 8 consecutive
  times: `unlockCardCountAfter: 1, overlayCountAfter: 1` on all 8/8 runs, 0/8
  reproductions. Screenshots
  `company/assignments/061-screenshots/tester/rapid-doubleclick-locked-iter0.png`
  through `iter7.png`.

**AC2 (single-click unchanged)** — PASS.
- Locked theme, single click: `unlockCardCount: 1, overlayCount: 1`, `attr`
  and `storage` both `null` (no bypass) —
  `verify-single-click-locked.png`.
- Unlocked theme, single click: `attrRightAfter: "snoepfabriek"`,
  `storageRightAfter: "snoepfabriek"`, and after a full `page.reload()`,
  `attrAfterReload: "snoepfabriek"` and `storageAfterReload: "snoepfabriek"` —
  applies immediately and survives a full reload —
  `verify-single-click-unlocked-applied.png`.

**AC3 (052 guarantee + guard edge cases)** — PASS.
- Rapid double-click on locked card: `attr: null, storage: null` (no theme
  applied/persisted), `unlockCardCount: 1, overlayCount: 1` (lands correctly).
- Rapid triple-click on locked card: same — `attr: null, storage: null`,
  `unlockCardCount: 1, overlayCount: 1` —
  `verify-triple-click-locked.png`.
- Edge — button inside the 400ms guard window: clicked the "Nog even niet"
  ghost button immediately after the Unlock overlay mounted (no artificial
  delay, well under 400ms). Result: `overlayCountAfterButtonClick: 0,
  unlockCardCountAfterButtonClick: 0` — the button closed the overlay as
  expected; the guard did not block the deliberate button click —
  `verify-button-closes-within-guard-window.png`.
- Edge — backdrop click after the 400ms window: waited ~550ms since mount,
  then clicked the backdrop itself (position `{5,5}`, well outside the
  centered card). Result: `overlayCountAfterBackdropClick: 0` — normal
  dismissal still works once the guard window has elapsed, confirming the fix
  did not break legitimate backdrop-click dismissal —
  `verify-backdrop-closes-after-guard-window.png`.

**AC4 (tests/build/console)** — PASS.
- `npm test`: `1..215` / `# pass 215` / `# fail 0`, `vite build` inside the
  test script succeeded, `check-no-dutch-en: PASS — 5 built en file(s)
  checked against 59 Dutch lexicon words, zero unallowlisted hits.`
- `npm run build` standalone: exit 0, clean output, no errors.
- Console errors across every probe run (repro loops + verify script, ~10
  browser pages total): exclusively `Failed to load resource: ... /api/track
  (404)` — the known dev-environment analytics-endpoint noise, present
  identically pre-fix and post-fix. Zero new console errors or page errors
  from the fix.
- `public/` churn from `npm test`/`npm run build` reverted with
  `git checkout -- public/` before committing; confirmed via `git status
  --short` showing no `public/` changes staged.

**Scope claim** — PASS. `git show --stat 4dadd49` (the fix commit) and the
merge `3240cd5` both show only: `src/game/Unlock.jsx`, `qa-scripts/dev-061-repro.mjs`,
`qa-scripts/dev-061-verify.mjs`, the assignment file, and dev screenshots
under `company/assignments/061-screenshots/dev/`. No `ThemePicker.jsx`,
`App.jsx`, or `game.css` in either diff — confirmed independently, not taken
from the delivery notes.

No new defects found. The only imprecision noted (not a product bug): the
`landedOnHome` field in both the dev's and my adapted verify script checks
DOM presence of a "Verder bouwen" button, which stays in the DOM behind the
modal overlay regardless of overlay state, so it reads `true` even when the
overlay is correctly showing — `unlockCardCount`/`overlayCount` are the
reliable signals and were used as the actual pass/fail criteria throughout
this verification.

Environment: worktree `C:\companies\typcoon-lanes\v061`, dev server killed
and port 4216 confirmed free before finishing; no background tasks left
running.
