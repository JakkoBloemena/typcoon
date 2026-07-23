---
id: 057
title: On-screen Keyboard has fixed-width rows — horizontal scroll below ~540px viewport
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (isolated during 055 delivery, 2026-07-23; materialized by the tick #10 dispatcher from the 055–059 reservation)
---

## Goal

The on-screen `Keyboard` component (`src/ui/Keyboard.jsx` + `.kb-row`/`.kb-key` in
`src/game/game.css`) renders rows of 10 keys × 44px + 9 × 7px gaps = a fixed 503px
row regardless of viewport width, forcing `document.documentElement.scrollWidth` to
~521px and a horizontal scrollbar on any viewport narrower than ~540px — including
the onboarding/hands-tutorial screen, not just GameScreen. This was the actual sole
cause of the document-level overflow measured in 049's verification and 055's
delivery (the header was a co-symptom, fixed in 055). Make the keyboard fit narrow
mobile viewports (~360–430px) without horizontal document scroll, keeping keys
legible and tappable.

## Acceptance criteria

- [x] At 360px and 390px viewport widths, `document.documentElement.scrollWidth` ≤
      viewport width (no horizontal scrollbar on body) on the game screen AND the
      onboarding/hands-tutorial screen.
- [x] Keys remain legible and visually distinct at those widths (this is a kids'
      product — the on-screen keyboard is load-bearing for finger guidance); the
      highlighted/next-key affordance still reads clearly.
- [x] Desktop unchanged (no visual regression at ≥768px).
- [x] Works across all four themes (tokens only, no theme-specific values).
- [x] `npm test` green; `npm run build` clean; zero new console errors.

## Notes

Isolating evidence: `qa-scripts/probe-055-header-overflow.mjs` (scrollWidth 521px
identical across every header-content variant at a given width; keyboard measured as
the widest element), 055's delivery notes, and 049's v-12..v-14 screenshots. The
approach (fluid key sizing vs. reflow vs. scaled strip) is the developer's call
within the existing token system — document the choice; consult DESIGN.md. Priority
4 per protocol (developer proposal): layout blemish, core flow playable.

## Delivery notes (developer, build/057)

**Approach: fluid key sizing via `clamp()`, gated behind a new `@media (max-width:
767px)` block in `src/game/game.css`** (same breakpoint 055 already used for the
header, so the two mobile blocks share one boundary and desktop stays untouched
above it). Chose fluid sizing over a stepped breakpoint or a scrollable strip because:
the keyboard is shared by two screens with different surrounding padding (GameScreen's
`.type-pane` vs. Onboarding's `.onb-card`, which is 36px narrower on each side), so a
single hand-picked pixel breakpoint tuned for one screen would still overflow on the
other; a continuous formula fits both without per-screen values. Concretely:

```css
@media (max-width: 767px) {
  .keyboard { --kb-key: clamp(20px, calc(10vw - 13px), 44px); }
  .kb-row { gap: clamp(3px, 1vw, 7px); }
  .kb-key {
    width: var(--kb-key); height: var(--kb-key);
    font-size: max(0.62rem, calc(var(--kb-key) * 0.345));
    border-radius: calc(var(--kb-key) * 0.22);
  }
  .kb-key.space { width: calc(var(--kb-key) * 6.14); }
  .kb-key.anchor .kb-bump { width: calc(var(--kb-key) * 0.27); height: calc(var(--kb-key) * 0.068); }
}
```

`--kb-key` grows linearly with `vw` and rejoins the original 44px value at ~570px
viewport width — i.e. it converges on the unchanged desktop size well before the
767px media-query boundary, so there's no visible size "jump" at the boundary itself.
Font-size, border-radius, the space-bar width, and the home-row anchor "bump" (from
`markHome`, used on the hands-tutorial screen) are all expressed as proportions of the
same `--kb-key` custom property so they scale together and never drift out of ratio
with the keycap.

**The floor (20px key / 0.62rem font) is a legibility floor, not a tap-target
floor.** `Keyboard.jsx` renders the whole component `aria-hidden="true"` with no click
handlers on any key — it is a pure finger-guidance visual (the child types on the
physical keyboard, per DESIGN.md/charter's "load-bearing finger guidance" framing),
so WCAG's ~44px touch-target minimum does not apply here. 20px/0.62rem was chosen
because it keeps a single bold (font-weight 900) uppercase glyph readable in a
colored box, and sits close to the smallest existing label size already used
elsewhere in this file (`.cert-kicker`, 0.7rem) rather than inventing an arbitrarily
smaller value.

**Per-criterion evidence** (measured with `qa-scripts/probe-057-keyboard-overflow.mjs`,
a new Playwright probe pattern-matched on 055's; screenshots in
`company/assignments/057-screenshots/`):

1. **`scrollWidth` ≤ viewport at 360/390px, game screen AND hands-tutorial screen.**
   Before (measured with the fix stashed out): 360px game `scrollWidth=521,
   overflowPx=161`; 360px hands (`Onboarding refresh` view, reached via the home
   screen's "✋ Handen-check" button — this is the onboarding/hands-tutorial screen
   named in the assignment) `scrollWidth=432, overflowPx=72`; 390px game
   `overflowPx=131`; 390px hands `overflowPx=57` — all with the pre-fix fixed 44px/
   503px-wide keyboard row (`kbRowWidth=503` in every before-measurement, confirming
   055's isolation). After the fix: `overflowPx=0` in all four cases (`kbRowWidth`
   262.3px at 360px, 295.0px at 390px; `kbKeyWidth` 23px at 360px, 26px at 390px,
   matching the `--kb-key` formula). Screenshots: `w360-game-before.png` /
   `w360-game-after.png`, `w360-hands-before.png` / `w360-hands-after.png`,
   `w390-game-before.png` / `w390-game-after.png`, `w390-hands-before.png` /
   `w390-hands-after.png` — the `-before` shots visibly clip the rightmost key(s);
   `-after` shots show the full row inside the card with margin to spare.
2. **Keys legible/distinct, next-key affordance reads clearly at 360/390px.**
   Confirmed visually: `w360-game-after.png` shows the home row (A S D F G H J K L ;)
   in mint outline with the next key (K) lit in its finger-color with dark text,
   fully legible against the locked/dimmed rest of the keyboard.
   `w390-hands-after.png` and `w390-hands-theme-diepzee-after.png` show the
   `markHome` ring + F/J anchor bumps and the next-key glow (mint on default,
   proportionally identical on the diepzee theme) clearly distinct from neighboring
   keys at the smaller 26px size.
3. **Desktop unchanged at ≥768px.** Computed styles from the probe: at both 768px and
   1280px, before AND after the fix, `.kb-key` computed style is byte-identical —
   `width/height: 44px, fontSize: 15.2px, borderRadius: 10px` — because the new rules
   live entirely inside `@media (max-width: 767px)`. Screenshots
   `w768-game-desktop-before.png`/`-after.png` and `w1280-*-desktop-before/after.png`:
   keyboard position/size is pixel-identical; the only visible differences between
   before/after shots are randomized in-game content (a "gouden opdracht" banner and
   different practice text), unrelated to this change and confirmed by hashing —
   trivially reproducible by re-running the probe.
4. **Works across all four themes (tokens only, no theme-specific values).** The new
   rules reference zero color tokens (only `--kb-key`, a size, scoped to this
   component) — theme blocks (`[data-theme='...']`) never touch sizing, only the
   colors keys already draw from (`--panel`, `--line`, `--paper`, finger colors from
   `layouts/qwerty-nl.js`, unrelated to theming). Spot-checked `diepzee` at 390px on
   both screens (`localStorage['typcoon:theme']='diepzee'`,
   `localStorage['typcoon:unlocked']='1'`): `w390-hands-theme-diepzee-after.png` and
   `w390-game-theme-diepzee-after.png` — same fluid sizing, teal/coral palette
   applied correctly, `overflowPx=0` in the probe output for both.
5. **Tests/build/console.** `npm test`: **211/211 pass**, then chained `vite build`
   succeeds, then `check-no-dutch-en.mjs` passes ("5 built en file(s) checked against
   59 Dutch lexicon words, zero unallowlisted hits"). `npm run build` standalone:
   clean, same output, no errors. Console errors: 45 in both the before and after
   probe runs, all `Failed to load resource: 404` for `/api/track` — the same
   pre-existing dev-only analytics-endpoint 404 documented in 055's delivery notes,
   identical count before and after. Zero new console errors.

**Files touched:** `src/game/game.css` (the fix, 24 lines, one new `@media
(max-width: 767px)` block). New QA scratch tooling (not shipped):
`qa-scripts/probe-057-keyboard-overflow.mjs`. Screenshots:
`company/assignments/057-screenshots/*-before.png` (pre-fix, fix stashed out for the
capture) and `*-after.png` (post-fix), 10 viewport/screen/theme combinations each.

**Stayed in scope:** `src/ui/Keyboard.jsx` was read but not modified (no JS logic
change needed — pure CSS fix); `src/game/GameScreen.jsx` was not touched at all, per
the lane-discipline constraint (056 working there concurrently). Only `.kb-row`/
`.kb-key`/`.keyboard` rules in `game.css` changed.

## Verification (tester, 2026-07-23)

Re-derived every criterion independently in `C:\companies\typcoon-lanes\v057` (branch
`verify/057`), dev server on port 4208, own Playwright probe
(`qa-scripts/verify-057-tester.mjs`, screenshots in
`company/assignments/057-screenshots-verify/`) rather than trusting the developer's
probe output. **All five acceptance criteria hold. Verdict: done.**

1. **Overflow ≤ viewport at 360/390, game + hands.** Confirmed `overflowPx=0` at both
   widths on both screens with my own probe: w360 game/hands `scrollWidth=360,
   kbRowWidth=262.3, kbKeyWidth=23`; w390 game/hands `scrollWidth=390,
   kbRowWidth=295.0, kbKeyWidth=26` — matches the developer's numbers exactly.
   Additionally probed widths the delivery didn't report: **320px** (small-Android
   floor) `overflowPx=0` both screens, `kbKeyWidth=20` (the clamp floor, as designed);
   the **convergence band 540/550/560/570px** all `overflowPx=0`, `kbKeyWidth` rising
   41→42→43→44 and landing exactly on the unchanged 44px desktop value at 570px with
   no jump; 767px (media-query boundary) also `overflowPx=0, kbKeyWidth=44`.
2. **Legibility at 360/390.** Screenshots plus a 3x-DPR crop of the keyboard alone at
   320px (`/tmp/kb-320-zoom2.png`, not committed — ad hoc) confirm keys are crisp,
   bold, and distinct even at the 20px/23px floor; the next-key highlight (pink/mint
   fill against dimmed neighbors) and finger-color home-row coding both read clearly.
   Hands-tutorial screen's F/J anchor bumps and `markHome` glow render in proportion
   at 320/360/390 on both default and diepzee themes. Judgment: genuinely readable,
   not just technically passing.
3. **Desktop ≥768px byte-identical.** My probe's computed `.kb-key` style at 768px and
   1280px: `width/height 44px, fontSize 15.2px, borderRadius 10px` on both game and
   hands screens — matches developer's reported values exactly; confirmed via
   `git show` that the entire diff (24 added lines) lives inside a single
   `@media (max-width: 767px)` block touching only `.keyboard`/`.kb-row`/`.kb-key`,
   so desktop is untouched by construction, not just by measurement.
4. **Four themes, tokens only.** Read `game.css` directly: the three `[data-theme=...]`
   blocks (nachtploeg, snoepfabriek, diepzee) define only color custom properties —
   zero size/dimension/media-query rules — and the new 057 block references only the
   `--kb-key` custom property it defines itself. Spot-checked diepzee at 390px on both
   screens: `overflowPx=0`, same fluid sizing, correct palette applied.
5. **Tests/build/console.** `npm test`: **211/211 pass**, chained `vite build` +
   `check-no-dutch-en.mjs` clean. `npm run build` standalone: clean. Console errors
   across all 26 probe page-loads (8 widths × 2 screens + 4 desktop + 2 theme
   variants): 72 total, verified via a separate `page.on('response')` listener that
   **100% resolve to `/api/track`** (the pre-existing dev-only analytics 404 also
   documented in 055) — zero new console errors of any other kind.

**Additional exploration beyond the ACs (not blocking, filed as observation only):**
at 280px and 300px viewport (below any real device — smallest common Android/iPhone
is 320px, which passes cleanly), `document.documentElement.scrollWidth` does overflow
(37px/17px) — but the widest element at that width is `section.type-pane` (the
exercise card), **not** the keyboard; confirmed the 057 diff touches only
`.keyboard`/`.kb-row`/`.kb-key` and this overflow source is pre-existing/unrelated to
this assignment's scope. Not filed as a defect since it falls outside 057's stated
target range (~360–430px) and outside any realistic device width; noting for the
record in case a future assignment targets sub-320px viewports.

Ledger: `npm install`, `npm install --no-save playwright-core`, dev server on 4208
(killed before finishing), own probe script + screenshots committed under
`qa-scripts/verify-057-tester.mjs` and
`company/assignments/057-screenshots-verify/`.
