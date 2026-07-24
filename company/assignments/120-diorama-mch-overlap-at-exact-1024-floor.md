---
id: 120
title: "Diorama .mch cards overlap by ~1.6px at the exact 1024px desktop floor (5 built machines)"
owner: developer
status: in_progress
priority: 4
blocked_by: []
opened_by: developer (found incidentally while re-verifying assignment 106/ADR 015 for
  assignment 117, tick #41)
---

## Goal

While verifying assignment 117 (narrow-resize mid-exercise state loss), the developer
re-ran the tester's own `qa-scripts/106-tester-verify.mjs` unmodified against this
worktree's dev server as an extra regression cross-check (not part of 117's own required
evidence). One of that script's own assertions failed:

```
FAIL - 1024px fine-pointer: no .mch/.mch overlap
  [{"i":0,"j":1,"xOverlap":1.671875,"yOverlap":145},
   {"i":1,"j":2,"xOverlap":1.65625,"yOverlap":145},
   {"i":2,"j":3,"xOverlap":1.671875,"yOverlap":145},
   {"i":3,"j":4,"xOverlap":1.671875,"yOverlap":145}]
```

At exactly 1024px (the `DESKTOP_MIN_WIDTH` floor itself, `src/game/App.jsx`), with the
worst-case fixture of 5 built machines (`buildSave5()` in the qa script), four adjacent
pairs of `.mch` diorama cards (`.hal .mch` in `Shop.jsx`) overlap by ~1.6-1.7px
horizontally across their full card height (145px). This is the exact scenario ADR 015 /
assignment 106 measured and used to justify the 1024px floor ("1024px laat ruim marge
over voor zowel de diorama als het BOUWBON-kaartje" — see `App.jsx`'s `tooNarrow()`
comment and `company/decisions/015-desktop-only-gated-not-reflowed.md`), so either:
(a) the floor's margin was measured slightly optimistically for this exact width in this
rendering environment (font metrics / sub-pixel layout can differ by browser/OS), or
(b) something has shifted since 106's original measurement (a later assignment nudged
diorama card widths/spacing).

**Confirmed NOT caused by assignment 117:** the developer stashed all of 117's changes
(reverting `src/game/App.jsx`/`GameScreen.jsx` to pre-117 state) and re-ran the identical
script against the identical dev server — the same overlap reproduced identically. 117's
surface (the `narrowWindow` gate's mount/unmount behaviour) never touches `Shop.jsx` or
any diorama sizing. This is a pre-existing, narrow (~1.6px, only at the exact floor
pixel, only at the 5-built-machines worst case) measurement gap in 106/ADR 015's own
"ample margin" claim, not a new regression.

## Reproduction

1. `npm ci` (+ `npm install --no-save playwright-core@1.61.1` if not already present in
   this worktree — it is a qa-only tool, untracked, same as other lanes' worktrees).
2. `npx vite --port <any>`.
3. `PROBE_BASE=http://localhost:<port> node qa-scripts/106-tester-verify.mjs` — the
   "1024px fine-pointer: no .mch/.mch overlap" check fails with 4 pairwise overlaps of
   ~1.6-1.7px. (Screenshot evidence: re-run the script; it writes
   `company/assignments/106-screenshots-verify/4-fine-1024-hal.png` — do not commit
   regenerated screenshots into that directory without checking with whoever owns 106's
   evidence, since it's tracked history for a `done` assignment.)
4. At 1360px (or any width comfortably above the floor) the same check passes with zero
   overlaps — this is specific to being pixel-exact at 1024px.

## Acceptance criteria

- [ ] Determine whether this is a genuine (if tiny) visual defect a real user could hit
      (a keyboard/mouse desktop user with a browser window at exactly 1024px logical
      width, 5 machines built) or a headless-browser/font-rendering measurement artifact
      that would not reproduce in a real browser — check in a real browser at 1024px if
      possible, not just Playwright headless.
- [ ] If genuine: either nudge the floor (e.g. `DESKTOP_MIN_WIDTH` up slightly) or the
      diorama card sizing so the measured margin actually holds at the floor pixel,
      re-measure per 106's own methodology (see `company/decisions/015-*.md` and
      assignment 106's Delivery notes for the original measurement table), and update
      the `tooNarrow()`/`DESKTOP_MIN_WIDTH` comment in `App.jsx` if the floor value
      changes.
- [ ] If it's a measurement artifact only (not reproducible in a real desktop browser):
      document that finding and close as not-a-bug, updating `qa-scripts/106-tester-verify.mjs`'s
      assertion or tolerance if appropriate.
- [ ] `npm test` stays green; re-run `qa-scripts/106-tester-verify.mjs` and confirm the
      1024px overlap check passes (or is documented as intentionally tolerant).

## Notes

Filed at priority 4: cosmetic, ~1.6px, only at one exact pixel width, only at the
worst-case 5-built-machines fixture — not a functional break, and importantly not a
regression from any recent work (confirmed identical on pre-117 code). Does not block
117, which does not touch `Shop.jsx` or any diorama sizing.
