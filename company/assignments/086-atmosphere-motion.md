---
id: 086
title: Atmosphere & motion — ambient life, arrival, build moments (world-pass slice 4)
owner: developer
status: in_progress
priority: 3
blocked_by: [085]
opened_by: product-owner
---

## Goal

The static diorama (085) should feel warm and alive. The factory page is the **one** place
ambient motion is allowed — the typing view stays calm (ADR 011), the factory is where
excitement lives (W3). Add restrained ambient life plus the arrival and build moments the
world pass calls for, each with a correct reduced-motion fallback. Restraint is the tell: a
considered stagger reads "alive," lockstep reads "machine-made." Critically, no motion may
imply idle income — machines only mint while the child types (guardrail 2), so nothing on
this page spouts coins.

## Acceptance criteria

- [ ] **Ambient machine life:** each built machine's icon does a slow, low, **staggered** bob
      (`idleBob`, ~5–6.5s, ±~4px) — machines are never in lockstep. (W3)
- [ ] **Foundation plot** breathes a gentle brass glow (`plotGlow`, ~3.4s). Any decorative belt
      (`beltDrift`) is a slow rail that carries **no coins**. (W3)
- [ ] **Arrival moment:** navigating into the factory rises the models onto the table
      (`riseIn`, staggered ~60ms apart, one `--pop` spring each over `--dur-arrive`, then
      still — iteration count is **not** `infinite`). **Build moment:** buying a machine inks
      its foundation and rises its model once, then still. (W3)
- [ ] **No idle income:** no ambient animation targets a coin count, `.coin` element, or
      `coinsPerSecond` readout — verified by confirming the only animated properties are
      opacity/transform/box-shadow/background-position on machine/plot/belt elements. (W8,
      guardrail 2)
- [ ] **Reduced-motion fallback:** under `@media (prefers-reduced-motion: reduce)` (already
      global in `game.css:163-165`), every animation's still/resting state **is the finished
      surface** — machines already risen and inked, plot already at its mid-glow level. A
      reduced-motion user sees the complete, correct factory instantly and loses only the
      flourish; **no state or affordance is conveyed by motion alone**. (W3)
- [ ] Token discipline: glows use `color-mix(in srgb, var(--token) N%, transparent)`, not raw
      rgba; **zero new `:root` tokens**. (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched. `npm test` green (currently 230/230 — no regression);
      `check-no-dutch-en` passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W3** (atmosphere & motion — with the calm-vs-excite
tension named so it is not re-litigated) and **W7** item 6. Mock:
`design/factory-mocks/world-C-maquette.html` (the CSS carries `idleBob` / `plotGlow` /
`beltDrift` / `riseIn` for reference).

**File surfaces:** `src/game/game.css` (keyframes + animation classes) and `src/game/Shop.jsx`
(arrival-stagger hooks / build-moment trigger if needed). Overlaps 085 in both files —
**strictly serial after 085** (`blocked_by 085`); the diorama markup must exist to animate it.
Terminal state `needs_verification`.
