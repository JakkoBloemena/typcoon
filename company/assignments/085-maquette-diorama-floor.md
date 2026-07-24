---
id: 085
title: The Maquette — diorama floor, machine states, build ticket (world-pass slice 3)
owner: developer
status: in_progress
priority: 2
blocked_by: [084]
opened_by: product-owner
---

## Goal

The factory page today is a flat chip-diagram (074's roadmap in `Shop.jsx`). ADR 012 ruled the
factory must be a **WORLD, not a panel** — a full-page place a kid experiences. Rebuild the
factory surface as **"De Maquette"**: a tilted blueprint diorama you look across, like an
architect's scale model or a LEGO/model-railway baseplate on a table. **Built** machines stand
up off the plan as plinths near the front (big, full-colour, casting shadows, status light,
level/rate readout); the **current/next** machine is a glowing brass **foundation plot**
(`🦾 NU BOUWEN`, `nog N munten`); **locked** machines are flat blue-line **ghost drawings**
receding toward a horizon (letter-gate `nog N letters`, or premium `🔒 volledige fabriek`
routing to the parent-gated `Unlock.jsx`). Depth is the growth story: moving a machine from
"ghost near the horizon" to "risen model at the front" *is* "my factory is growing." Reuse
**every** existing buy/upgrade/state handler and the per-machine state-precedence logic in
`Shop.jsx` unchanged — this is a presentation re-skin, not new economy. Machine placement is a
**computed depth-lane rule**, never hand-tuned per-machine percentages. Ambient/arrival motion
is deliberately **not** in this slice (it is 086) — ship the static, correct diorama first.

## Acceptance criteria

- [ ] The factory page renders a diorama **stage** (`.hal`) with a single **tilted floor**
      layer (`perspective(...) rotateX(...)` over `--bg-grid`) and a `.horizon` line. The floor
      is the **only** transformed element — all machine icons and text sit flat and undistorted
      on top of it. (W2a)
- [ ] **Built** machines render as plinths (panel gradient, thick bottom edge, elliptical cast
      shadow, mint status light, nameplate, `Lv N / +N/s` LED, milestone teaser badge).
      **Current/next** renders as a glowing brass foundation plot (`🦾 NU BOUWEN`, `nog N
      munten`, ghosted machine preview). **Locked** renders as a flat blue-line ghost with a
      letter-gate (`nog N letters`) or premium `🔒 volledige fabriek`. State selection matches
      the existing `Shop.jsx` precedence exactly — built / current / locked, including the
      "te bouwen" case and the `machineLocked ∧ unlocked` premium rule. (W2b)
- [ ] Machine placement is **computed** from build-order index + depth lane (front lane =
      `scale 1`, full colour; back lane ≈ `scale 0.72`, flat/dimmed) — **no per-machine
      magic-percentage constants** in the code; a reviewer can confirm a 6th machine would slot
      in by rule with no layout redesign. (W2c)
- [ ] The **BOUWBON build ticket** renders `nextGoal` (from `goals.js`, read-only) as the
      single primary goal surface: progress ring (`fraction`), name, reward (`+N/s` / `×N`),
      `nog N munten — dat haal je in ± N opdrachten` (encouragement, **never** a countdown or
      timer), and a buy button in `--reward` using the same buy handlers as 074. (W2e)
- [ ] Cold-read test: a reviewer shown the built page cold reads it as a **tycoon place /
      world**, not a dashboard. (079 AC1 spirit — verified by the tester's own cold read)
- [ ] The ledger from slice 084 remains present, integrated into the diorama (top-right of the
      plan). (W2d)
- [ ] Guardrails: premium ghosts route to `Unlock.jsx` (breadth, not power); no idle income
      (no coin count / `coinsPerSecond` element animates); no pressure mechanics (the `± N
      opdrachten` line is an effort estimate, never a countdown). (W8)
- [ ] Token discipline: glows use `color-mix(in srgb, var(--token) N%, transparent)`, **not**
      raw `rgba()`; **zero new `:root` tokens**; a `[data-theme]` swap recolours the whole
      diorama (floor grid, plinths, plot glow, ghosts, ticket); grep-clean of themable hex/rgba
      (only `#000` in a `mask:` stencil). (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched; a pre-existing save (built machines, levels, coins, stars) renders
      correctly as the diorama. `npm test` green (currently 230/230 — no regression);
      `check-no-dutch-en` passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W2a / W2b / W2c / W2e**, and **W7** items 1–3
(reuse-vs-replace: `.plan` → diorama stage; `.road` chip-row → depth-placed models;
`.goalspot` → BOUWBON ticket). Mock: `design/factory-mocks/world-C-maquette.html`.

**File surfaces:** `src/game/Shop.jsx` (roadmap markup rework) and `src/game/game.css`
(diorama styling). This is the big one. Shares both files with 084, 086, 087, 088 — the hot
integration file across the milestone is `game.css`; the dispatcher should expect to merge
`Shop.jsx`/`game.css` when lanes run in parallel worktrees.

**Motion is out of scope here** — 086 layers ambient life, arrival, and build moments on top.
Ship each machine's **resting** state as its finished look (risen plinth / inked plot / flat
ghost) so 086 can add motion without changing this markup, and so a reduced-motion user already
sees a complete factory. `blocked_by 084` (the ledger must exist first; both touch
`Shop.jsx`/`game.css`). Terminal state `needs_verification`.
