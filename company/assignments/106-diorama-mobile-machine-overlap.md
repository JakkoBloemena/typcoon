---
id: 106
title: "Narrow-desktop-window degradation on the game surfaces — add a width floor to the touchOnly() gate (mobile/touch is out of target per ADR 012 and already gated)"
owner: developer
status: in_progress
priority: 3
blocked_by: []
opened_by: tester (found while independently verifying assignment 089); re-scoped by product-owner (ADR 015, tick #39 intake)
---

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
