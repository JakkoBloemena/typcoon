---
id: 075
title: Factory + typing view — mobile reflow and state screens
owner: developer
status: open
priority: 3
blocked_by: [073, 074]
opened_by: product-owner
---

## Goal

Make both new surfaces work on a phone and degrade gracefully in every edge state. This
is design §9, and the mobile treatment is the honest cost the winner (direction C) was
chosen knowing about. Authority: decisions/011, design `design/DESIGN-FACTORY.md` §9,
mock `design/factory-mocks/dir-C-blueprint.html` (`@media max-width:620px`) +
`dir-C-states.html`, scope `research/milestone-factory.md` §1/§5.

Implement:
- **Mobile roadmap** — reflow the horizontal roadmap to a **vertical snake** so all five
  stations are visible with **no horizontal scroll**; goal panel and objectives stack; the
  typing-view goal sliver drops to its own row.
- **Empty state** — brand-new player: first station spotlit "te bouwen", rest ghosted with
  letter-gates, and the one-line copy "Je fabriek staat klaar om te groeien — typ je eerste
  opdracht". No dead screen.
- **Long-text overflow** — a long Dutch sentence **wraps** (no overflow) in the typing card
  (`overflow-wrap:anywhere`, the clamped `--data` size).
- **Offline / error** — a calm, reassuring sky-blue banner ("Geen verbinding. Je fabriek is
  lokaal opgeslagen — je raakt niets kwijt"), never alarming to a child.
- **Loading** — a skeleton for the plan while the save hydrates.

## Acceptance criteria

- [ ] On a ~360–414px viewport, the factory roadmap shows all machines with **no horizontal
      scroll** (vertical snake), and the goal panel + objectives stack cleanly.
- [ ] On the same viewport, the typing view is calm and the sentence is reachable without
      scrolling past factory chrome (the pre-milestone mobile complaint is gone).
- [ ] Empty state renders as specified (first station "te bouwen", ghosts with letter-gates,
      one-line copy) — no blank/dead screen for a fresh save.
- [ ] A deliberately long Dutch sentence wraps within the typing card with no clipping or
      horizontal overflow at mobile width.
- [ ] The offline/error banner is calm and reassuring (sky-blue, "je raakt niets kwijt"),
      not alarming; the loading skeleton shows while the save hydrates.
- [ ] Save-compat: `store.js` shape, `economy.js` data, engine state, `theme.js` unchanged.
      071 invariant test stays green.
- [ ] `npm test` green.

## Notes

Purely responsive/stateful CSS + small render guards; no economy, engine, or theme change.
Reduced-motion already disables celebration motion in `game.css` — keep it that way.
Terminal state needs_verification.
