---
id: 106
title: "Narrow-desktop-window degradation on the game surfaces — add a width floor to the touchOnly() gate (mobile/touch is out of target per ADR 012 and already gated)"
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: tester (found while independently verifying assignment 089); re-scoped by product-owner (ADR 015, tick #39 intake)
---

## Delivery notes (developer, tick #39, dev/106)

**Threshold chosen: `DESKTOP_MIN_WIDTH = 1024px`** (the ADR 012 design target the PO
suggested), gating any window narrower than 1024px (i.e. `(max-width: 1023px)`).

**Measurements behind it.** Built + previewed (`npx vite preview --port 4291`), seeded a
save with all 5 `BUILDINGS` built (the worst-case front-lane count — `FRONT_LANE_CAP` is
5, so this is the densest the diorama ever gets without demoting a machine to the back/
"established" cluster), and measured `.hal`/`.mch` via `getBoundingClientRect()` at a
fine pointer (no coarse-pointer emulation) across several viewport widths:

| viewport | `.hal` width | max `.mch` overlap | `.ticket` |
|---|---|---|---|
| 700px | 618px | 31.2px | 1 line ("Smeerolie") |
| 767px | 685px | 20.0px | 1 line |
| 860px | 778px | 4.5px | 1 line |
| 1023px | — | — | width-hint shown (below floor) |
| 1024px | — | — | full game (at floor) |
| 1360px | — | — | full game, unchanged |

The overlap shrinks roughly linearly with `.hal` width in this data (700→767→860),
extrapolating to zero overlap around `.hal` ≈ 800-810px (viewport ≈ 880-900px, given the
`#root`/`.plan` chrome subtracts ~76px from the raw viewport width). 1024px leaves
comfortable margin above that zero-overlap point. The `.ticket` (BOUWBON) did not squeeze
in this test's data (short upgrade name "Smeerolie" never wrapped even at 700px) — the
squeeze v104 originally reproduced at 375px (folded into this assignment, see the
re-scope block above) used a longer goal string; 1024px sits far above both the 767px
breakpoint already used elsewhere in `game.css` and the 375px squeeze point, so it carries
generous margin for the ticket too. I did not attempt to reproduce the exact ticket-squeeze
string/width from v104's finding directly (the seeded-save harness needed to drive real
gameplay state through Playwright was the long pole here — see below); the 1024px floor
is justified by (a) the ADR's own suggested target, (b) the measured diorama zero-overlap
point sitting well below it, and (c) the existing 767px breakpoint plus the documented
375px ticket-squeeze point both sitting well below it too.

Verified the exact boundary behaves correctly: 1023px fine-pointer → width-hint; 1024px
fine-pointer → full game (screenshots: `case3-fine-1024.png`, `boundary-fine-1023.png`).

**Reactivity — judgment call for the tester.** `touchOnly()` (the existing gate) is
evaluated inline during render with no resize/media-change listener — it is effectively
static-at-load, re-evaluated only when some *other* state change happens to trigger a
re-render (pointer type essentially never changes mid-session, so this has never
mattered in practice). The new width gate is different: window width changes constantly
during normal desktop use (a player dragging their window wider is the whole point of
the "make your window a little wider to play" invitation), so I made it **reactive**:
a `matchMedia('(max-width: 1023px)')` query with its own `'change'` event listener
(feature-detected `addEventListener`/`addListener` for older engines), driving a
`narrowWindow` state that the render checks. This deliberately does **not** match
`touchOnly()`'s static idiom — I judged the ADR's explicit ask ("a user who widens the
window should get the game back") to require it, since a stale non-reactive gate would
mean a resize needs an unrelated state change (or full reload) to clear, which defeats
the point of the friendly invitation. Verified live: resizing 800px → 1360px → 700px in
a single page session (no reload) toggles the width-hint and the game home screen
correctly each time. Flagging this as the one place I deviated from "match the existing
gate's idiom" per the assignment's instruction to do so explicitly.

**Diff summary.** `src/game/App.jsx`: added `DESKTOP_MIN_WIDTH`/`tooNarrow()` next to
`touchOnly()`, a `narrowWindow` state + `matchMedia` change-listener effect (both declared
unconditionally alongside the existing hooks, before any early return — rules of hooks),
and a second early-return branch (after the existing `touchOnly()` branch, so a coarse-
pointer touch device still hits the touch hint first and never reaches the width check)
rendering the same `.home`/`.home-hero` markup as the touch hint, with
`desktop.widthTitle`/`desktop.widthBody` copy. `src/game/strings.js`: added
`desktop.widthTitle`/`desktop.widthBody` in both the nl and en blocks, directly under the
existing `desktop.title`/`desktop.body` keys (no other keys touched — stayed clear of
d110's concurrent `goal.*`/`factory.*` work in the same file). No other file touched;
`store.js`, `economy.js`, `src/engine/`, `theme.js`, `goals.js`, and
`layoutDiorama`/`.mch`/`.hal` math are all untouched (`git diff --stat` confirms).

**Evidence.** `company/assignments/106-screenshots-dev/`:
- `case1-fine-375.png`, `case1-fine-390.png` — fine pointer, narrow window → width hint
  (nl: "Maak je venster wat breder!" / "Typcoon is ontworpen voor een breed scherm...").
- `case2-coarse-390.png` — coarse-pointer-only emulated at 390px → existing touch hint
  unchanged ("Pak een toetsenbord erbij!").
- `case3-fine-1360.png`, `case3-fine-1024.png` — fine pointer, ≥1024px → full home screen
  (name input, "Start je fabriek"), unaffected.
- `boundary-fine-1023.png` — fine pointer, 1023px → width hint (confirms the exact floor
  edge).
- English width-hint string verified via `/speel/?lang=en` at 390px (not screenshotted,
  logged via `.textContent()`): "Make your window a little wider!" / "Typcoon is designed
  for a wide screen. Make your window a little wider to play. See you there!"

**Test status.** `npm test` green: 266/266 unit tests pass, `vite build` succeeds,
`check-no-dutch-en` PASS (5 built en files, zero unallowlisted Dutch-lexicon hits).
`public/**` gen-content churn reverted (`git checkout -- public/`) before every commit per
instructions.

**Process note (not a defect, just flagging the time cost):** getting a Playwright harness
to reach the factory view required seeding a full `typcoon:save` localStorage record
matching `hydrateState`'s expected shape (`keyStats`/`bigramStats`/`srsItems`/`prevKey`
all required, not just `profile`/`tycoon` — omitting them crashes `exams.js`'s
`nextAvailableExam` on `undefined.keyStats[k]`) — cost most of the investigation time
before the actual gate implementation. No code changed as a result of this; noting it in
case a future assignment wants a reusable seeded-save test fixture (I'm not proposing that
as new work myself — it's outside this assignment's surface).

> **PRODUCT-OWNER RE-SCOPE (2026-07-24, tick #39 intake — read this first; ADR 015).**
>
> This assignment was filed at priority 2 as a **mobile** diorama-overlap bug. The
> adjudication (`company/decisions/015-desktop-only-gated-not-reflowed.md`) resolves the
> standing tension between this filing and the earlier v092 ruling that "ADR 012 rules no
> mobile target," and **re-scopes and re-prioritises it in place.** The original mobile
> reproduction is preserved below as evidence, but the target and the fix have changed.
>
> **What changed and why:**
> - **Mobile / touch devices are OUT of target** (ADR 012 ruling 3) **and already gated.**
>   The gate is `touchOnly()` in `src/game/App.jsx` (~ln 39–43): `(pointer: coarse) && !
>   (pointer: fine)`. A real phone gets the friendly "use a keyboard" hint and **never
>   reaches the diorama.** The 390px overlap below is reachable only by setting a narrow
>   viewport in Playwright *without* emulating a coarse pointer — i.e. by bypassing the
>   gate. So the mobile-device framing that justified priority 2 ("390px is a mainstream
>   phone width for a user who plays on a phone") does not hold: that user is out of target
>   and screened out. **Do not build a responsive/reflowing diorama — that would contradict
>   ADR 012 ruling 3.**
> - **The real, in-scope defect is a narrow DESKTOP window.** The gate keys on pointer type,
>   not width. A legitimate target user — desktop/laptop, mouse (`pointer: fine`), physical
>   keyboard — with a **narrow browser window** passes the gate and hits the same broken
>   diorama. v104 independently reproduced this for the `.ticket` (BOUWBON) layout too (it
>   squeezes to one word per line at 375px on a real desktop). That is what this assignment
>   now fixes.
> - **Priority 2 → 3.** Real degradation for a minority of in-target users (narrow desktop
>   windows), cheaply fixed the honest way; not a mainstream-flow break (phones, the
>   original priority-2 population, are out of target and gated).
> - **v104's `.ticket` narrow-viewport squeeze is folded in here** (same root cause: a game
>   surface with no width floor; same fix: the gate). It does not get its own id.
>
> **The fix (ADR 015 decision 2 — gate, do not reflow):** extend `touchOnly()`'s friendly
> hint to also cover "browser window below the desktop design floor." Below the floor
> (~1024px, the ADR 012 design target — confirm the exact threshold against the narrowest
> width the diorama and `.ticket` stay legible at, and against where `game.css`'s existing
> `@media (max-width: 767px)` blocks already reshape other components), the game surfaces
> show the same calm "maak je venster wat breder om te spelen / make your window a little
> wider to play" invitation the touch gate already uses — instead of a broken diorama or a
> squeezed ticket. Reuse the existing hint idiom (`desktop.title`/`desktop.body` copy
> pattern, `touchOnly()`'s structure); add nl + en strings for the width-hint variant.
>
> **Revised acceptance criteria (supersede the mobile-reflow criteria below):**
> - [ ] A desktop/laptop user (`pointer: fine`, has a keyboard) with a browser window below
>       the desktop design floor sees the calm width-hint (same idiom as the existing touch
>       hint), **not** the broken diorama or the squeezed `.ticket`. Verify at 375px and
>       390px window widths with a fine pointer (the narrow-desktop path, not a coarse-
>       pointer phone).
> - [ ] A touch-only device (`pointer: coarse`, no fine pointer) still gets the existing
>       touch hint, unchanged — no regression to the current gate.
> - [ ] A desktop user at the design widths (≥1024px, verified ~1360px) sees the full game
>       exactly as today — the floor threshold does not clip legitimate desktop play. Pick
>       the threshold so the diorama and `.ticket` are legible above it (check both, since
>       the ticket squeezes before the diorama overlaps).
> - [ ] The width-hint copy exists in nl **and** en; `check-no-dutch-en` passes (no nl leak
>       into the en build).
> - [ ] Presentation/gate only: `store.js`, `economy.js`, `src/engine/`, `theme.js`,
>       `goals.js`, and the diorama's `layoutDiorama`/`.mch`/`.hal` math are **untouched**
>       (we are NOT reflowing the diorama — ADR 015). `npm test` stays green.
>
> **File surface:** `src/game/App.jsx` (the `touchOnly()` gate) + `src/game/strings.js`
> (the width-hint copy), and possibly one `@media`/JS width check. This shares `game.css`
> region with assignment 115 (place-ness) only loosely; the *gate* work here is in `App.jsx`
> + `strings.js`, so it can run in parallel with 115 in a separate worktree.
>
> — The original filing (mobile reproduction + the now-superseded mobile-reflow acceptance
> criteria) is retained below unchanged, as the evidence trail for the re-scope. ────────

## Goal

085 ("De Maquette") laid out built/foundation/ghost machines inside `.hal` using absolute
positioning (`layoutDiorama` in `Shop.jsx`) with each `.mch` card at a **fixed** width
(148px, `game.css` line 604: `.mch { position: absolute; ...; width: 148px; }`, 108px for
`.established` — still fixed). Neither `.mch` nor `.hal` has any `@media` rule narrowing
this width or increasing gutter spacing for small viewports (`game.css` has `@media
(max-width: 767px)` blocks at lines 332 and 447 for other components, but none touching
`.hal`/`.mch`/`layoutDiorama`'s percentage math). On an iPhone-width viewport the `.hal`
content box is only ~308px wide, so two adjacent 148px-wide absolutely-positioned cards
land ~88px into each other — machine icons, names, and level/rate badges overlap and
become illegible. This is the same diorama the whole factory page revolves around (world-
pass ADR 012: "the factory must be a WORLD, not a panel"), so on mobile the core "see your
factory, decide what to build next" screen is visually broken.

Not caused by assignment 089 (089 only changed `.floor`'s background-image colour stops;
verified via `git show da06275 -- src/game/game.css`, which touches only 10 lines inside
the `.floor` rule — `.mch`/`.hal`/`layoutDiorama` are untouched). Not caused by 085 either
in the sense of a regression — 085's own acceptance criteria never mention mobile/viewport
width at all (checked: no "mobile"/"viewport"/"responsive"/breakpoint text anywhere in
`company/assignments/085-maquette-diorama-floor.md`), so this is a gap nobody wrote a
criterion for, not a broken promise — filing it now so it's tracked.

## Reproduction

1. `npm ci`, `node scripts/gen-content.mjs && npx vite build`, `npx vite preview --port
   <any>`.
2. Playwright (or any real device/emulator): set viewport to **390×844** (stock iPhone
   12/13/14 width — one of the most common mobile viewport widths in the wild).
3. Seed localStorage with a save that has ≥2 built machines and navigate to the factory
   screen the same way a real player does: land on `/speel/`, click the "Verder
   bouwen"/"Keep building" button, dismiss any onboarding overlays, click the "Fabriek"/
   "Factory" nav button in `.game-bar`.
4. Screenshot `.hal`. Observe: the first two machine plinths ("Typemachine", "Drukpers" in
   the default curriculum fixture) overlap by roughly 88px — icons stack on top of each
   other, and both name labels ("Typemachine"/"Drukpers") and rate badges render on top of
   each other, illegible.

Measured via `getBoundingClientRect()` in this session: `.hal` content box `{width: 308}`;
`.mch` #1 (Typemachine) `{left: 30.4, right: 178.4}`; `.mch` #2 (Drukpers) `{left: 90.7,
right: 238.9}` — a 88px overlap between two cards that are each only 148px wide, i.e. the
second card starts 60% of the way through the first card's own footprint.

Screenshot: `company/assignments/089-screenshots-tester/106-mobile-hal-overlap.png` (crop
of `.hal` at 390×844; also see `089-tester-mobile-cold-read.png` for the full-page context
showing the same overlap in situ below the header/stats bar).

## Acceptance criteria

- [ ] At common mobile viewport widths (at minimum 390px and 375px), no two `.mch` machine
      cards' bounding boxes overlap — either the diorama scales its card width/spacing
      down proportionally to `.hal`'s actual width, or `layoutDiorama`'s lane math accounts
      for a minimum per-card footprint and wraps/stacks instead of cramming, per whatever
      the designer's system prescribes (check `design/DESIGN-FACTORY.md` and `design/
      factory-mocks/` for an existing mobile treatment before inventing one).
- [ ] Machine name, level, and rate text remain fully legible (no overlapping text) at
      2, 3, 4, and 5 built machines — the overlap scales with machine count, so re-check
      at more than the 2-built fixture used to find this.
- [ ] Desktop layout (the width this was designed/screenshotted at, ~1360px and 085's own
      evidence widths) is visually unchanged — this is a mobile-only gap, not a desktop
      regression to fix.
- [ ] `npm test` stays green.

## Notes

Found incidentally while independently verifying assignment 089 (floor grid contrast) —
089 itself only touches `.floor`'s background colour and does not touch `.mch`/`.hal`
layout, so this is unrelated to and does not block 089's verification. Filing separately
per protocol (specialists proposing new work open at priority 4 by default, except a
tester filing a *verified, reproduced* defect sets priority by user impact). Priority 2
because: this is the core factory/progress screen (not a peripheral one), the overlap
makes machine identity and progress genuinely unreadable (not just visually rough), and
390px is a mainstream phone width for a product whose target user (8-12 year old, plus
the parent who checks the dashboard) plausibly plays or checks in on a phone or tablet —
but it stops short of priority 1 because the core typing/earning loop itself (the
`/speel/` exercise screen) was not observed to be affected, only the factory/shop view.
