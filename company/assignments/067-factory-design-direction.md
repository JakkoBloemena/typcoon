---
id: 067
title: Design direction — factory page + calm typing view (first designer dispatch)
owner: designer
status: needs_verification
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Shareholder direction (decisions/011, verbatim there): the current play experience —
typing surrounded by factory activity — reads as basic and distracting. Design the
split: a **separate factory/management page** (upgrades, stats, visible progress,
clear goals — the exciting "my factory is growing" surface) and a **calm typing
view** (typing as the focused work surface, minimal ornament, the reward loop
visible but not shouting). Produce 2–3 genuinely competing visual directions
(not variants of one idea), select by pairwise comparison against: kid appeal
(8–12), parent trust, calm-while-typing, excitement-in-factory, and feasibility on
the existing CSS-token/React stack. Deliver: the chosen direction as concrete
tokens (color/type/spacing/motion), layout structure for both surfaces, and
annotated mocks or HTML sketches the PO can scope against. Respect the existing
theme system (051/052) — directions must state how themes layer on.

## Acceptance criteria

- [ ] 2–3 competing directions documented with honest tradeoffs; selection made by
      stated pairwise criteria, not taste alone.
- [ ] Chosen direction delivers: token set, both-surface layout specs, and the
      goal/progress model made visually concrete (what a kid sees as "my next
      goal" and "how far I've come").
- [ ] Charter guardrails respected in the design: no pressure mechanics, no
      dark patterns, breadth-not-power monetization surfaces unchanged in intent.
- [ ] Explicitly states what of the current UI survives (reuse over rebuild where
      honest) and what is replaced.
- [ ] Written to design/ (DESIGN-FACTORY.md + assets), referenced from the
      existing DESIGN.md.

## Notes

Authority: decisions/011. This is typcoon's first designer dispatch — the adoption
skipped design-first and this feedback is the bill (011's accountability note).
Terminal state needs_verification (PO or tester reviews against criteria).

## Delivery notes (designer, 2026-07-24, branch design/067)

**Deliverable:** `design/DESIGN-FACTORY.md` (front matter = machine-readable 067 tokens;
body = directions, pairwise selection, winner spec, goal/progress model, reuse-vs-replace,
theme layering, state verification) + self-contained HTML mocks and renders in
`design/factory-mocks/`. Referenced from the root `DESIGN.md` (new section before
"Wat bewust NIET").

**Chosen direction:** **C — "Het Bouwplan"** (a blueprint roadmap you fill in). Selected
by an independent critic comparing head-to-head in pairs (A vs B → B, A vs C → C, B vs C
→ C) with both source + renders, ranked not scored. C best embodies "my factory is
growing" (the filled path *is* the progress) and answers the Shareholder's exact words
("clear goals / see how it's going"); its cost is a heavier-but-bounded mobile roadmap,
paid once.

**Per AC:**
1. 2–3 competing directions with honest tradeoffs + pairwise selection — DONE (§2–3;
   A "Twee Kamers", B "Werkblad & Lade", C "Het Bouwplan"; critic verdict recorded).
2. Winner delivers token set (§4, front matter), both-surface layouts (§5), and the
   goal/progress model made concrete (§6: "next goal" computed + shown twice; "how far
   I've come" = filled roadmap + "N van 5 gebouwd") — DONE.
3. Charter guardrails respected (§10): no pressure/timers, no dark patterns, breadth-
   not-power unlock intent unchanged — DONE.
4. Explicit reuse-vs-replace (§7): tokens/theme/TypingSurface/economy reused;
   shop+wallet relocated; `FactoryFloor` + in-typing meters removed (with a CEO
   escalation note since removing the always-on floor changes the per-second view) —
   DONE.
5. Written to design/ + referenced from DESIGN.md — DONE.

**Not blocking / flagged:** (a) DesignSync/Claude Design publish needs interactive OAuth,
unavailable in this tick — the committed `design/` files are the deliverable (standing
Shareholder ask). (b) Removing `FactoryFloor` from the typing view is inside the ADR-011
"typing becomes calm" mandate (no economy/learning change), but if the PO reads the
animated floor as a feature worth keeping, that is a CEO scope call — raise in 068.
(c) Proposed follow-up left for the dispatcher (id 071 reserved): a tester/playtest pass
on the shipped split once 068 builds it, checking the calm-vs-exciting split lands with a
real 8–12 kid.

Scratch tooling committed alongside (repo convention): `qa-scripts/design-067-before.mjs`,
`design-067-shoot.mjs`, `design-067-shoot-winner.mjs`.
