---
id: 116
title: "Correct the invalid W10c color-mix() percentages in DESIGN-FACTORY.md and the world-C-maquette-place mock"
owner: designer
status: done
priority: 4
opened_by: developer (proposed, d115fix tick #41)
---

## Goal

`design/DESIGN-FACTORY.md` W10c's own code block and
`design/factory-mocks/world-C-maquette-place.html` both contain the identical invalid
`color-mix()` percentage that bounced assignment 115: `color-mix(in srgb, var(--bg-wash)
130%, transparent)`. CSS Color 4 types `color-mix()`'s percentage argument as
`<percentage [0,100]>` — 130% is out of range, which invalidates the *entire*
`background` declaration containing it at parse time (falls back to `none`). Both files
are `status: done` deliverables of assignment 114 and are the reference spec/mock for
this whole world-C place-ness pass; left as-is, any future reader who copies W10c's code
block or re-derives from the mock's CSS will silently reintroduce the exact bug the
tester (v115, tick #41) spent a four-way live-Chromium proof establishing.

This is presentation-only spec/mock hygiene — no new visual direction, no new token, no
change to what the wash is supposed to look like. It brings the two design artifacts
back in sync with the value the shipped app now uses, so they stop being a trap for the
next reader.

## Acceptance criteria

- [x] `design/DESIGN-FACTORY.md` W10c's `.warmth` code block (currently line ~856,
      `color-mix(in srgb,var(--bg-wash) 130%, transparent) 0,` /
      `color-mix(in srgb,var(--bg-wash) 60%, transparent) 38%,`) is updated to valid
      percentages (`≤100%` each) that preserve the documented intent — "a broad, low,
      soft pool of warm light," "deliberately whisper-subtle," "no hotspot on any one
      machine." The shipped fix in `src/game/game.css` (assignment 115, developer
      d115fix, tick #41) used `100%`/`55%` — reasoning: 100% is the strongest valid mix
      (resolves to `--bg-wash` itself, no artificial oversaturation) and 55% is one
      notch below the original 60%, keeping the same hotter-center/fading-edge falloff
      shape. Use that pairing unless the designer has a specific reason to pick
      different (still-valid) numbers, but the pairing should stay reasoned rather than
      arbitrary since it drives the "no hotspot" AC downstream.
- [x] `design/factory-mocks/world-C-maquette-place.html` line 84 (the same `.warmth`
      rule, inline in the mock's `<style>` block) gets the identical corrected
      percentages, so the mock renders the wash for real in a browser instead of
      silently failing the same way the shipped app did before 115's fix.
- [x] Both files' prose (the comments/paragraphs around the code, which describe the
      wash as "whisper-subtle but present") is left otherwise unchanged — this is a
      value correction, not a rewrite of the W10c direction.
- [x] No other `color-mix()` call in either file is touched — this assignment is scoped
      to the one already-identified invalid value, not a general spec audit. (The
      developer's 115 fix already swept `src/game/game.css` for any other
      out-of-range `color-mix()` percentage and found none; a similar quick check of
      these two files is reasonable but the AC is specifically the W10c value.)

## Notes

**Not to be done by the developer.** `design/DESIGN-FACTORY.md` and
`design/factory-mocks/*.html` are designer-owned deliverables (assignment 114, `done`);
115's fix (`src/game/game.css` only) intentionally left them untouched per the
assignment's file scope. This assignment exists solely so the spec/mock stop being a
copy-paste trap.

**Origin:** flagged by the tester (v115, tick #41) in
`company/assignments/115-diorama-placeness-build.md`'s "Verification" section — "This is
not a defect the developer invented. The identical 130% value is already present
verbatim in `design/DESIGN-FACTORY.md` W10c's own code block (line ~856) and in
`design/factory-mocks/world-C-maquette-place.html` line 84." — and reconfirmed by the
developer (d115fix, tick #41) while fixing 115: both files still contain the byte-
identical invalid value as of this writing (verified directly, not taken on faith).

**Reference for the exact locations, quoted verbatim (developer d115fix, tick #41):**

`design/DESIGN-FACTORY.md` (around line 856):
```css
.warmth{position:absolute;left:0;right:0;bottom:-30px;height:62%;z-index:1;pointer-events:none;
  background:radial-gradient(78% 100% at 42% 118%,
    color-mix(in srgb,var(--bg-wash) 130%, transparent) 0,
    color-mix(in srgb,var(--bg-wash) 60%, transparent) 38%,
    transparent 66%);
  animation:warmBreath 8s ease-in-out infinite}
```

`design/factory-mocks/world-C-maquette-place.html` (line 84, same rule inline):
```css
.warmth{position:absolute;left:0;right:0;bottom:-30px;height:62%;z-index:1;pointer-events:none;
  background:radial-gradient(78% 100% at 42% 118%, color-mix(in srgb,var(--bg-wash) 130%, transparent) 0, color-mix(in srgb,var(--bg-wash) 60%, transparent) 38%, transparent 66%);
  animation:warmBreath 8s ease-in-out infinite}
```

**Shipped reference value** (`src/game/game.css`, `.warmth`'s `background`, assignment
115 fix, developer d115fix tick #41, verified live: `CSS.supports(...)` → `true`,
`getComputedStyle(...).backgroundImage` → a real gradient, re-ran
`qa-scripts/115-tester-verify.mjs` → 29/29):
```css
background: radial-gradient(78% 100% at 42% 118%,
  color-mix(in srgb, var(--bg-wash) 100%, transparent) 0,
  color-mix(in srgb, var(--bg-wash) 55%, transparent) 38%,
  transparent 66%);
```

Priority 4 per protocol: a specialist-proposed assignment (not opened by CEO/product-
owner) defaults to priority 4 regardless of the interest of the finding, since only the
CEO/product-owner reprioritize the board — this is spec/mock hygiene behind an
already-shipped fix, not a live defect blocking a user-facing flow.

## Delivery notes (designer des116, tick #41)

Value correction only — no prose, comment, or direction touched. Adopted the shipped
115 pairing verbatim (`130%`→`100%`, `60%`→`55%`); no design-reason deviation, so the
spec/mock now match live `src/game/game.css` and preserve W10c's "whisper-subtle, no
hotspot" intent (100% resolves to `--bg-wash` itself with no artificial oversaturation;
55% keeps the hotter-center → fading-edge falloff one notch below the original).

**1. `design/DESIGN-FACTORY.md` — W10c `.warmth` code block (line ~856)**

Before:
```css
    color-mix(in srgb,var(--bg-wash) 130%, transparent) 0,
    color-mix(in srgb,var(--bg-wash) 60%, transparent) 38%,
```
After:
```css
    color-mix(in srgb,var(--bg-wash) 100%, transparent) 0,
    color-mix(in srgb,var(--bg-wash) 55%, transparent) 38%,
```

**2. `design/factory-mocks/world-C-maquette-place.html` — `.warmth` rule (line 84, inline)**

Before:
```css
  background:radial-gradient(78% 100% at 42% 118%, color-mix(in srgb,var(--bg-wash) 130%, transparent) 0, color-mix(in srgb,var(--bg-wash) 60%, transparent) 38%, transparent 66%);
```
After:
```css
  background:radial-gradient(78% 100% at 42% 118%, color-mix(in srgb,var(--bg-wash) 100%, transparent) 0, color-mix(in srgb,var(--bg-wash) 55%, transparent) 38%, transparent 66%);
```

**Other out-of-range percentages found:** none. Read-only scan of both files for any
`color-mix()` percentage ≥101% returned only the two just-corrected sites. The other
three-digit hits in each file (`color-mix(in srgb,var(--night) 86%, black)` at
DESIGN-FACTORY.md:836 / mock:66) are valid — the `86%` is the mix amount, the `100%` on
those lines is a gradient color-stop *position*, not a `color-mix()` argument. Nothing
else to fix, and nothing out-of-scope to file.

**Mock render check:** attempted, could not run in this lane. Playwright's
`playwright-core` package is currently an empty/partial install at
`C:\Users\Jakko\node_modules` (unresolvable from every cwd tried, incl. the main repo);
it worked for the tester at tick #41 but has since been cleaned, and reinstalling is out
of scope for this correction. Falling back to the deterministic guarantee: per CSS
Color 4, `color-mix()`'s percentage is typed `<percentage [0,100]>`, so `100%` and `55%`
are both in range and the whole `background` declaration now parses (where `130%`
previously invalidated it → `none`). The byte-identical `100%`/`55%` pairing was already
proven to render live by the developer in shipped `src/game/game.css`
(`CSS.supports(...)`→`true`, `getComputedStyle(...).backgroundImage`→a real gradient,
`qa-scripts/115-tester-verify.mjs`→29/29), so the corrected mock renders the wash for the
same reason the shipped app does.

Reserved id 122 was **not** consumed — no distinct defect or proposal surfaced.
