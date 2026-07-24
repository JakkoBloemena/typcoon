---
id: 073
title: Calm typing view — goal sliver, one-line bar, remove FactoryFloor + meters
owner: developer
status: open
priority: 2
blocked_by: [071, 072]
opened_by: product-owner
---

## Goal

Make the typing view calm: typing is the work surface, one named goal visible, zero
ambient motion. This carries the PO adjudication on `FactoryFloor` (scope
`research/milestone-factory.md` §4): the always-on animated factory-floor strip is
**removed** from the typing view — it is the single most on-target instance of ADR-011's
"basic and distracting" complaint and removing it changes no economy or learning. Authority:
decisions/011, design `design/DESIGN-FACTORY.md` §4/§5a/§7.

Rework the play view (design §5a) to: a **thin one-line bar** (`← Menu` · `×mult · acc%
· ● coins` in the mono `--data` face + a `🏭 Fabriek` button); a **goal sliver** fed by
`nextGoal` (071) — `🦾 [name] · JE VOLGENDE MACHINE ▓▓▓░ nog N`, bar in `--reward`; the
existing `ui/TypingSurface.jsx` typing card (unchanged) with the next-key hint only. Remove
from the typing view: `FactoryFloor` (delete the component file if nothing else references
it after removal), the separate `.meters` block (fold `×mult · acc%` into the one-line bar),
and the `.shop` rail (it now lives on the factory page from 072).

## Acceptance criteria

- [ ] The typing view no longer renders `FactoryFloor` or the `.meters` block or the
      `.shop` rail; the sentence/typing card is the visually dominant element.
- [ ] The typing view has **zero ambient/idle animation** (no floor animation, no idle
      wiggle/pulse); only the next-key hint and caret move per keystroke, and celebration
      overlays still fire between exercises as before.
- [ ] **Preserved-value clause (required):** the calm typing view retains a minimal,
      non-ambient **live earn signal** — as the child earns, the coin readout ticks up and
      the goal-sliver bar advances toward the named next machine. Typing does not feel dead.
- [ ] The goal sliver shows the correct `nextGoal` output (icon, name, "JE VOLGENDE
      MACHINE", progress bar = fraction, "nog N") and updates as coins/levels/letters change.
- [ ] If `FactoryFloor.jsx` is now unreferenced, it is deleted (no dead component left).
- [ ] Save-compat: `store.js` shape, `economy.js` data, engine state, `theme.js` unchanged;
      a pre-existing save loads and plays identically. 071 invariant test stays green.
- [ ] `npm test` green.

## Notes

Do NOT re-open the FactoryFloor removal as a CEO question — the PO adjudicated it inside
the ADR-011 mandate (scope §4). If, while building, the calm view genuinely feels dead
even with the preserved earn signal, set `blocked` and describe it — do not re-add the
animated floor. Shares `App.jsx`/`game.css` with 074 — coordinate worktrees. Terminal
state needs_verification.
