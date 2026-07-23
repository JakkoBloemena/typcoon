---
id: 055
title: Game header horizontally overflows at narrow mobile viewports
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: tester (reproduced during 049 verification; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

At a 390px viewport (iPhone 12-class) the game header's content measures 521px wide
against a 390px client width, producing horizontal overflow/scroll in the game
screen's chrome. Fix the header layout so it fits common narrow mobile viewports
(~360–430px) without horizontal overflow, without hiding load-bearing UI (coins,
stars, exam pill when present).

## Acceptance criteria

- [x] At 390px (and 360px) viewport width, the game header no longer overflows
      horizontally (content width ≤ client width, no horizontal scrollbar on body).
      **Header itself: fixed and verified (see Delivery notes).** At delivery time the
      literal document-level check ("no horizontal scrollbar on body") still failed
      because of a SEPARATE, unrelated defect in the on-screen `Keyboard` component
      (fixed 44px-key rows, independent of viewport) — correctly isolated and deferred
      to assignment 057 rather than fixed here. **057 has since landed and is present
      on this tree** (`src/game/game.css` `.keyboard`/`.kb-row`/`.kb-key` inside the
      same `@media (max-width: 767px)` boundary, fluid `--kb-key: clamp(20px, calc(10vw
      - 13px), 44px)`). Tester re-verified `document.documentElement.scrollWidth ===
      document.documentElement.clientWidth` (zero overflow) at 360/390px on the
      combined tree — see Verification section below. Checking the box now that the
      literal document-level wording is satisfied by the combined state.
- [x] All header elements remain visible and usable (or intentionally collapse into
      a documented compact form) — coins, prestige stars, the exam pill when an exam
      is available, and any nav affordances.
- [x] Desktop layout unchanged (no visual regression at ≥768px).
- [x] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Pre-existing defect, NOT introduced by 049 — the 049 verification measured identical
overflow with and without the exam pill present (see
`qa-scripts/probe-049-mobile-overflow-check.mjs`, `probe-049-mobile-baseline.mjs`,
and screenshots `company/assignments/049-screenshots/v-12..v-14-*-verify.png`).
Priority 4 per the tester's user-impact call: layout blemish, core flow still
playable. Reuse existing design tokens (DESIGN.md); no new styling values without
the designer.

## Delivery notes (developer, build/055)

**Root cause of the header's own overflow.** `.game-bar` (the `<header>`) is a flex
row with `justify-content: space-between` and no wrap; its two children, `.bar-left`
(back, sound, unlock-pill, exam-pill) and `.wallet` (streak/star/coin/⚙️-pills), also
never wrapped. With the header grown this week (coin pill, coins/sec, prestige stars,
049's exam pill), `.bar-left`'s own content (e.g. 372px at 390px viewport, with the
exam pill present) already exceeds the 354px content box of `.game-bar` by itself —
flexbox can't shrink a non-wrapping row below its children's min-content width, so it
overflows instead. Measured directly (`qa-scripts/probe-055-header-overflow.mjs` +
ad-hoc bounding-box probes), confirmed via `company/assignments/049-screenshots/v-12`
(the "Toets beschikbaar" pill visibly cut off at the right edge).

**Fix.** `src/game/game.css`: added one `@media (max-width: 767px)` block (below
AC3's `≥768px` desktop boundary, so desktop stays byte-identical) that lets `.game-bar`
wrap, and lets `.bar-left`/`.wallet` each claim their own full-width row
(`flex: 1 1 100%`) instead of clinging to the single-line right-hand side. `.wallet`
right-aligns its pills (`justify-content: flex-end`) on its own row so it still reads
as "the wallet" on the right, same relative position as desktop. No new colors, sizes,
or radii — every value used (gaps, pill styling) was already in `game.css`; only
wrapping/flex-basis changed. Two new comments in the CSS explain the "why" per the
file's existing density.

**Per-criterion evidence:**

1. **No header overflow at 360/390px** — element-level: at 390px, the widest header
   child now ends at x=355px (`game-bar` box itself is x:18 w:354, i.e. right edge
   372px, inside the 390px viewport); at 360px, widest child ends at 325px (vs. a
   360px viewport). Verified with and without the exam pill, and with rebirths>0 +
   streak>0 (the fullest possible header: unlock-pill + exam-pill + streak-pill +
   star-pill + coin-pill + cps-pill all visible at once — worse than any real save,
   since unlock+exam+star don't all coexist in practice, but useful as a ceiling
   case). Screenshots: `company/assignments/055-screenshots/w360-with-exam-after.png`,
   `w390-no-exam-after.png`, `w390-with-exam-after.png` — every pill fully on-screen
   and legible, wrapped into 2-4 tidy rows depending on how much is present. Compare
   to `*-before.png`, where the exam pill is cut off past the right edge.
   **Caveat (why this line isn't checked off outright):** `document.documentElement.scrollWidth`
   is STILL 521px at 360/390px, byte-identical before and after this fix — i.e. the
   page still horizontal-scrolls. Isolated the cause: it's the on-screen `Keyboard`
   component (`src/ui/Keyboard.jsx` + `.kb-row`/`.kb-key` in `game.css`), whose rows
   of 10 keys × 44px + 9 × 7px gaps = a fixed 503px row, independent of viewport width
   — present with a MINIMAL header (no exam pill, no star, `fresh` save) just as much
   as with the fullest header (`qa-scripts/probe-055-header-overflow.mjs` output:
   `scrollWidth` identical across every header-content variant at a given width). This
   also explains why 049's own probes reported "identical overflow with/without the
   exam pill" — that was never about the pill; it was already the keyboard. This is a
   distinct, previously-undiscovered bug, unrelated to the header (title/goal/notes of
   this assignment are all specifically about the header), so I did not fix it here —
   see "Proposed new work" below. Reported to the dispatcher rather than guessed at.

2. **Header elements stay visible/usable** — confirmed via screenshots at 360/390 with
   the full pill set: nothing is clipped, truncated, or hidden; the compact form is
   "wrap into as many rows as needed," matching `game.css`'s existing idiom (`.wallet`
   already used `flex-wrap: wrap` before this change; `.dash-grid`/`.records-grid` already
   collapse columns at a `max-width` breakpoint elsewhere in the same file).

3. **Desktop unchanged ≥768px** — the fix is gated behind `@media (max-width: 767px)`
   specifically so nothing changes at the 768px boundary. Verified: computed styles at
   768px/1280px show `.game-bar` still `flex-wrap: nowrap` / `justify-content: space-between`,
   `.bar-left`/`.wallet` still default `flex: 0 1 auto` (i.e. the media query doesn't
   apply) — byte-identical to before. Screenshots
   `w768-desktop-before.png`/`-after.png` and `w1280-desktop-before.png`/`-after.png`
   are visually identical (same wrap pattern, same pill positions).
   Also spot-checked the `nachtploeg` theme at 390px with the full header
   (`w390-theme-nachtploeg-after.png`) — wraps identically to the default theme; only
   the colors differ (theme tokens untouched by this fix, as expected).

4. **Tests/build/console** — `npm test`: **211/211 pass**, then `vite build` (chained)
   succeeds, then `check-no-dutch-en.mjs` passes ("5 built en file(s) checked against
   59 Dutch lexicon words, zero unallowlisted hits"). `npm run build` standalone:
   clean, same output. Console errors: 45 logged across all probe runs, all
   `Failed to load resource: 404` for `/api/track` — a pre-existing dev-only analytics
   endpoint 404 (confirmed via a dedicated check: `http://localhost:4199/api/track`,
   present on a plain page load with NO game state at all, unrelated to this change),
   identical count before and after the fix. Zero *new* console errors.

**Files touched:** `src/game/game.css` (the fix, 13 lines). New QA scratch tooling
(not shipped): `qa-scripts/probe-055-header-overflow.mjs`. Screenshots:
`company/assignments/055-screenshots/*-before.png` (pre-fix) and `*-after.png`
(post-fix), 7 viewport/content combinations each.

**Proposed new work (not built here, reporting to dispatcher per protocol — do not
invent an id):** the on-screen `Keyboard` component overflows the viewport below
~540px regardless of the header (fixed 503px-wide rows of 44px keys), which is the
actual, sole cause of the residual `document.documentElement.scrollWidth` overflow
at 360/390px measured above, and is also visible on the onboarding/hands-tutorial
screen (`Unlock.jsx` or similar — same `Keyboard.jsx`), not just `GameScreen`. This
is a distinct, previously-undocumented defect from the one this assignment named;
fixing it is a real design decision (shrink key size at narrow widths? reflow rows?
allow horizontal scroll just for the keyboard strip?) that deserves its own
assignment and, per the design-system rule, a designer's sign-off on any new sizing
token rather than an improvised shrink. Priority 4 suggested (same class of "layout
blemish, core flow still playable" as this one). I'm not fixing it here since it's
outside this assignment's stated scope (title/goal/notes all specifically name the
header) and is a materially bigger UX call than the header wrap fix.

## Verification (tester, 2026-07-23)

Independently re-derived on worktree `C:\companies\typcoon-lanes\v055` (branch
`verify/055`), dev server on port 4206, chromium via `playwright-core`. Confirmed
`src/game/game.css` on this tree contains BOTH the 055 header media query (line
~292-296) and the 057 fluid-keyboard media query (line ~446-456), i.e. this is the
"combined tree" the assignment's caveat anticipated.

1. **`npm test`**: 211/211 pass. **`npm run build`**: clean (vite build + `vite build`
   chained from `npm test` + standalone `npm run build`), `check-no-dutch-en.mjs`
   passes.
2. **Overflow re-measured, both header-level and document-level**, at 360/390px, with
   the fullest header (exam pill + streak + stars + coin + coins/sec, via
   `qa-scripts/probe-055-tester-verify.mjs`, same fixture pattern as the developer's
   probe: `rebirths=2, streak=5` + `gen-exam-save.mjs ready`) AND a fresh/minimal save
   (`gen-exam-save.mjs fresh`, no exam pill/star):
   - 360px full header: `docOverflowPx=0`, `childOverflowPx=0`, `scrollWidth===clientWidth===360`.
   - 390px full header: `docOverflowPx=0`, `childOverflowPx=0`, `scrollWidth===clientWidth===390`.
   - 360px/390px minimal (fresh) save: same, zero overflow.
   - Bonus stress test at 320px (iPhone SE, narrower than the assignment's stated
     360-430 range) with the fullest header: still zero overflow
     (`tester-w320-extreme.png`).
   - Document-level check (the literal AC1 wording) now passes on this combined tree —
     confirms the assignment's own prediction that 057 would close the residual gap.
   - Keyboard rows independently re-measured (`.kb-row` bounding boxes) at 360/390px:
     widest row right-edge is well inside the viewport (e.g. 390px: row right=344.9px
     vs vw=390px), confirming 057's fluid `--kb-key` sizing is active and is what
     closes the document-level gap.
3. **All header elements visible/usable in wrapped form**: screenshots at 360/390px
   with the full pill set show unlock-pill, exam-pill ("Toets beschikbaar"),
   streak-pill (🔥5), star-pill (⭐2), coin-pill (500), and the ⚙️ coins/sec pill all
   fully on-screen, legible, not clipped or truncated
   (`tester-w360-full-header.png`, `tester-w390-full-header.png`).
4. **Desktop ≥768px unchanged**: computed styles at 768px and 1280px show
   `.game-bar { flex-wrap: nowrap; justify-content: space-between }` — i.e. the mobile
   media query does not apply, matching pre-fix behavior byte-for-byte. Visual check
   confirms single-row header, pills right-aligned as before
   (`tester-w768-desktop-full-header.png`, `tester-w1280-desktop-full-header.png`).
5. **Alternate theme spot-check**: `nachtploeg` theme at 390px with the full header
   wraps identically to the default theme (same 2-3 row layout), only color tokens
   differ, zero overflow (`tester-w390-theme-nachtploeg.png`).
6. **Console**: 45 console errors across all probe runs, independently confirmed via a
   dedicated network-response check to be exclusively `GET /api/track` returning 404 —
   the pre-existing dev-only analytics endpoint, present even on a bare page load, zero
   new errors introduced.

**Verdict: all 4 acceptance criteria pass**, including AC1's literal document-level
wording, now that 057 is merged into this tree as the assignment anticipated. Per the
tester's instructions this box is now checked and status is set to `done`.

Screenshots: `company/assignments/055-screenshots/tester-*.png` (9 files: w360/w390
full-header + minimal, w768/w1280 desktop full-header + minimal, w390 nachtploeg
theme, w320 extreme stress test). QA script:
`qa-scripts/probe-055-tester-verify.mjs` (new, not shipped — scratch tooling,
committed alongside this file per repo convention for other `probe-0NN-*` scripts).

No new defects found outside the acceptance criteria during this pass.
