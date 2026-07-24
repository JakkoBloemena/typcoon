---
id: 067
title: Design direction — factory page + calm typing view (first designer dispatch)
owner: designer
status: in_progress
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
