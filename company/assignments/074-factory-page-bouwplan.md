---
id: 074
title: Factory page "Het Bouwplan" — roadmap, spotlit goal, objectives row
owner: developer
status: open
priority: 2
blocked_by: [071, 072]
opened_by: product-owner
---

## Goal

Turn the relocated shop (from 072) into the exciting factory page the Shareholder asked
for: "Het Bouwplan", a blueprint roadmap you fill in, where "my factory is growing" is
legible and the next goal is unmistakable. Authority: decisions/011, design
`design/DESIGN-FACTORY.md` §5b/§6, mocks `design/factory-mocks/dir-C-blueprint.html` +
`dir-C-states.html`, scope `research/milestone-factory.md` §1b/§3.

Build (design §5b), on the blueprint-grid panel, all from existing `:root` tokens so
themes cascade:
1. **Header** — `JOUW FABRIEK / Het Bouwplan` + `[N van 5 machines gebouwd]` mint tag +
   `← Typen` back.
2. **Roadmap** — one station per `BUILDINGS` entry, left→right by unlock order, connected:
   **built** (inked, mint connector, `Lv N · +N/s`), **current** (brass ring, `NU BOUWEN`),
   **locked** (dashed ghost, `nog N letters` or `🔒 volledige fabriek`), milestone badge
   (`Lv10 →×2`).
3. **Spotlit goal panel** — the `nextGoal` (071) enlarged: progress ring (fraction), name,
   reward (`+N/s`/`×N`), `nog N munten — dat haal je in ± N opdrachten`, buy button in
   `--reward`.
4. **Objectives row** — upgrades + `🌟 Fabriek verkopen` (prestige) tiles; prestige shows
   its own progress and stays sky-blue; lifetime + ⭐ stars as context.

## Acceptance criteria

- [ ] The roadmap renders all machines with the correct per-machine state (built / current
      "NU BOUWEN" / locked-ghost) computed from the current `tycoon` + `lettersLearned`, and
      a `N van 5 gebouwd` progress tag that matches how many are built.
- [ ] The spotlit goal panel matches `nextGoal` (071): correct name, reward, fraction ring,
      "nog N munten", and "± N opdrachten" effort estimate — no timer/countdown.
- [ ] Buying the spotlit/current goal and buying upgrades/prestige work via the existing
      handlers (from 072); after a purchase the roadmap, tag, and spotlight update to the
      new state.
- [ ] Locked/premium stations route to the existing parent-gated `Unlock.jsx` (breadth, not
      power); no purchase a child can complete alone.
- [ ] Prestige (`🌟`) is the only place `--sky` appears (DESIGN.md rule); no other surface
      recolours to sky-blue.
- [ ] Save-compat: `store.js` shape, `economy.js` data, engine state, `theme.js` unchanged;
      a pre-existing save's built machines/levels/coins/stars all appear correctly on the
      roadmap. 071 invariant test stays green.
- [ ] `npm test` green (add/keep the goal-selection test from 071 passing against the UI's
      inputs if the descriptor shape is touched).

## Notes

Mobile reflow and the empty/overflow/offline/loading state screens are 075, not here —
but build the desktop states correctly so 075 only adds the responsive layer. Shares
`App.jsx`/`game.css` with 073 — coordinate worktrees. Terminal state needs_verification.
