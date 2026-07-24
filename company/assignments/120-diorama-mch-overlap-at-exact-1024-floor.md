---
id: 120
title: "Diorama .mch cards overlap by ~1.6px at the exact 1024px desktop floor (5 built machines)"
owner: developer
status: needs_verification
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

## Delivery notes (developer d120, tick 2026-07-25 #1)

**Determination: GENUINE defect (AC1), not a headless/font-rendering artifact — and
reproduces WORSE in a real, headed (non-headless) Chromium window than the original
headless filing.**

**Root cause.** `layoutDiorama`'s `place()` (Shop.jsx, unchanged) spaces N front-lane
items at `(i+1)/(N+1)*100%` of `.hal`'s padding-box width — for the 5-built worst case
that's 6 evenly-spaced slots. `.mch` was a CSS-fixed `width: 148px` (`game.css` line
661). Zero overlap requires `.hal`'s padding-box ≥ 6×148 = 888px. Measured (Playwright,
`playwright-core@1.61.1`, `qa-scripts/120-diagnose.mjs` + `120-sweep.mjs`) at the exact
1024px floor, past the `riseIn` arrival animation's worst-case 620ms settle window (the
900ms `waitForTimeout` in both scripts — without it, `riseIn`'s spring-overshoot made the
overlap magnitude jitter run-to-run, which is why the original filing's 1.671875px and my
first unsettled run's 1.85-2.9px both looked "off" from each other; the SETTLED number is
exactly, deterministically 1.671875/1.65625px, matching the filing precisely):
`.hal`'s padding-box was 878px headless (deficit 10px → overlap 148-878/6=1.667px, exact
match to the filed number) and as low as **863px in a real headed Chromium window**
(deficit 25px → overlap 148-863/6=**4.17px**, using this actual dev machine's real ~15px
Windows scrollbar, confirmed via `window.innerWidth - document.documentElement.clientWidth`
— the factory page's `scrollHeight` (1250px) genuinely exceeds a 900px-tall window, so a
real vertical scrollbar is not hypothetical, it reproduces on this exact page at this exact
viewport). `deviceScaleFactor` sweeps (1, 1.25, 2) produced byte-identical logical-px
results — ruled out DPI/font-metric artifacts as the AC asked. **So: this is a genuine,
deterministic CSS/JS sizing shortfall, not a measurement artifact, and a real desktop
browser with a classic (non-overlay) scrollbar sees a WORSE overlap (~4.17px) than
headless Playwright's own filed number (~1.67px)** — the opposite of "artifact," if
anything headless under-reported it.

**Why it wasn't there when 106 measured (hypothesis (b) confirmed).** 106's own measured
table (`company/assignments/106-*.md`) extrapolates a zero-overlap `.hal` width of
~800-810px from its own pre-115 measurements (its 4.5px-overlap-at-778px-hal data point
extrapolates to zero at hal=805, and its own numbers fit `overlap = 134.167 - hal/6`
almost exactly, i.e. the SAME 1/6-slope math as today, just with a smaller effective card
footprint at the time). Assignment 115 (the `.desk` "Werktafel" wrapper, landed after 106)
added a new `.desk` layer around `.hal` with its own `border: 3px` + `padding: 22px 26px
26px` (58px of net new horizontal chrome) that 106 never measured against — this is what
pushed `.hal`'s padding-box below the 888px six-card threshold at exactly 1024px, a width
106 itself never re-verified after 115 landed. (106's own tester screenshots at 1024px
predate 115 and would have shown zero overlap at the time; a fresh screenshot at 1024px
today, pre-fix, reproduces the overlap regardless of anything from 117 — confirmed by the
120 filing's own repro steps, which I independently re-ran.)

**Fix chosen: shrink `.mch`'s fixed CSS width (148px → 140px), not the `DESKTOP_MIN_WIDTH`
floor.** AC2 offers both options ("either nudge the floor... or the diorama card sizing").
I chose card sizing over a floor bump for three reasons: (1) it requires **zero edits** to
`qa-scripts/106-tester-verify.mjs` — that file's write surface is explicitly restricted to
"tolerance route only" in my brief, and a floor bump would force edits to its hardcoded
1023/1024 boundary-probe literals (not a tolerance change) to keep the script meaningful,
which the write-surface limit doesn't authorise; (2) it keeps `DESKTOP_MIN_WIDTH` at 1024,
matching the repeated "≥1024px" design-floor language in ADR 012, assignment 114's AC, and
ADR 015, rather than moving a value multiple other records treat as fixed; (3) 148px was
never a designer-owned token — `game.css`'s own long-standing comment on this section notes
the file "sticks to its existing ad-hoc-px rhythm" rather than introducing new `--`
spacing tokens, and the original design mock (`design/factory-mocks/world-C-maquette-place.html`
line 106) itself uses 150px, 2px off from the shipped 148px — so this component's exact
pixel width has never been pinned to a canonical design-system value; a further, purely
static (non-viewport-dependent, so not a "reflow" under ADR 015) 8px trim is a bug-fix
sizing correction, not an invented design value.

140px was chosen by sweeping the real numbers (`qa-scripts/120-sweep.mjs`): at 1024px it
leaves ~6.3px of margin headless and ~3.5-6px margin in the real headed/scrollbar case
(vs. 148px's -1.7px to -4.2px deficit) — comfortably positive under every measured
condition, with no `.hal`/`layoutDiorama` math touched. Full comment trail is in
`src/game/game.css` directly above the changed `.mch` rule.

**Re-measurement, 106's own methodology.** Re-ran `qa-scripts/106-tester-verify.mjs`
UNMODIFIED (zero edits to that file) against the fixed code, `npx vite --port 4305`:
**25/25 passed** (up from 24/25 pre-fix), including "1024px fine-pointer: no .mch/.mch
overlap []" and "1360px fine-pointer: no .mch/.mch overlap []". Boundary (1023 → hint,
1024 → full game), touch-gate regression, reactive-resize, and state-safety checks all
unaffected (none of those paths touch `.mch` sizing). Screenshots:
`company/assignments/120-screenshots/` — `0-before-fix-headed-hal-1024.png` (pre-fix, real
headed browser, 1024px — the ~4px overlap is genuinely too subtle to see by eye at this
scale, consistent with the assignment's own "cosmetic" priority-4 framing, but is real per
the bounding-box math above), `1-after-fix-headless-hal-1024.png`,
`2-after-fix-headed-hal-1024.png` (both post-fix, zero overlap, visually clean 5-card
diorama). Did **not** commit into `company/assignments/106-screenshots-verify/` or
`091-screenshots-verify/` — both directories got regenerated by re-running their tester
scripts against my fix and were reverted via `git checkout --` before every commit, per
instructions.

**Regression duties.**
- `npm test`: **266/266 green**, `vite build` succeeds, `check-no-dutch-en`: PASS (5 built
  en files, zero unallowlisted Dutch-lexicon hits) — this all runs as one `npm test`
  pipeline per `package.json`.
- `qa-scripts/106-tester-verify.mjs`: **25/25 passed** (unmodified file, see above).
- `qa-scripts/091-tester-verify.mjs` (the belt, rule-based off machine positions, re-run
  because diorama sizing changed): **34/34 passed** — belt segments still span exactly
  between flanking `.mch` centers (`beltSegments` reads `item.x`, which
  `layoutDiorama`/`place()` never changed; only the CSS-rendered card width moved, which
  the belt math doesn't consume), z-order ladder, theme sweep, reduced-motion, and
  FRONT_LANE_CAP-overflow re-derivation all unaffected.
- `node scripts/check-no-dutch-en.mjs` (via `npm test`): PASS.

**File surface actually touched:** `src/game/game.css` (one rule + one comment block,
`.mch` width 148px→140px), `company/assignments/120-diorama-mch-overlap-at-exact-1024-floor.md`
(this section + frontmatter status), plus new untracked qa evidence:
`qa-scripts/120-diagnose.mjs`, `120-sweep.mjs`, `120-evidence.mjs`, `120-before-repro.mjs`,
`company/assignments/120-screenshots/*`. `App.jsx` was **not** touched — `DESKTOP_MIN_WIDTH`/
`tooNarrow()` and their comments are unchanged, since the floor value didn't move.
`qa-scripts/106-tester-verify.mjs` was **not** touched (zero edits — see reasoning above).
`Shop.jsx`, `store.js`, `economy.js`, `src/engine/`, `theme.js`, `goals.js` untouched.

**Judgment calls flagged for the tester:**
1. **Sizing fix vs. floor bump.** I picked the card-sizing route specifically because the
   write-surface instruction restricted `106-tester-verify.mjs` edits to "tolerance route
   only," and a floor-bump fix (which I also fully measured — see `120-sweep.mjs` output:
   headless zero-crossing at viewport 1040px, real-headed-scrollbar zero-crossing at
   1056px; 1080px would have given ~6px margin in both) would have required updating that
   script's hardcoded 1023/1024 boundary literals, which isn't a "tolerance" edit. If the
   tester's read of that constraint differs (e.g. boundary-literal updates are considered
   in-scope as a mechanical consequence of a sanctioned floor change), the floor-bump
   route is fully measured and ready as an alternative — I did not implement it, only the
   card-sizing fix is in this commit.
2. **140px vs. a smaller/larger trim.** I chose margins of ~3.5-6px (real-scrollbar) /
   ~6.3px (headless) as "comfortable" by eye, matching the qualitative bar 106/ADR 015 set
   ("ample margin") rather than a hard numeric spec (none exists for this). A different
   margin target (e.g. 145px for a smaller visual change with ~1-3px margin, or 135px for
   more headroom) would also satisfy the ACs; 140px is my judgment call on where "genuine
   fix with comfortable margin" meets "smallest visible change to an already-shipped
   visual."
3. **106's own historical screenshots are now stale** (they predate 115's `.desk` wrapper
   and show a since-regressed zero-overlap state at 1024px) — this isn't something I fixed
   or touched (106 is `done`, its screenshot directory is tracked history per my
   instructions), just flagging it exists as a documentation gap for whoever next touches
   106's record.

**Defect 124:** lapsed — no distinct, reproduced defect outside 120's scope was found
during this investigation. (The stale-106-screenshots observation above is documentation
drift on a `done` assignment, not a new reproduced product defect, so it doesn't warrant
its own filing.)

**Dev server:** `npx vite --port 4305` stopped (process killed) before returning; nothing
listening on 4305, confirmed via `netstat`.
