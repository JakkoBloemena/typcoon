---
id: 042
title: Scope the next build milestone — game content/depth
owner: product-owner
status: needs_verification
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Shareholder direction (/ceo channel 2026-07-23, decisions/006 rider): typcoon
keeps building while it grows, with explicit focus "more game content/depth". Scope
the next build milestone: what genuinely deepens the game for the kids playing
today — candidates to evaluate against the product record (DESIGN.md,
PLAYTEST_LOG.md, REVENUE.md): more machines/tiers, themes, exercise variety,
progression past full-alphabet (the rebirth/stars loop), streak/retention depth.
Ground every candidate in evidence (playtest notes, engine capabilities, what the
free-vs-paid split implies per guardrails 2/5) — not invented features. Decompose
into developer-sized assignments with acceptance criteria drafted inside the scope
doc, priorities proposed, ids TBD for the dispatcher. The CEO reviews the scope
before build assignments materialize (it lands as needs_verification like 023 did).

## Acceptance criteria

- [ ] Written scope in research/: candidate list with evidence-based rationale,
      an explicit cut line (what NOT to build), and a recommended build order.
- [ ] Guardrail check per candidate: nothing sells learning speed, free tier
      stays a complete education, breadth-vs-power split respected.
- [ ] Paid-tier impact stated per candidate (does it enrich the unlock's value
      per REVENUE.md, or the free tier, and why that balance).
- [ ] Build assignments drafted inside the doc with acceptance criteria, ids TBD.

## Notes

Authority: decisions/006 rider (Shareholder). Sibling motion: the en chain
(014→017) was un-gated the same day — sequencing/collision judgment between en
lanes and game-depth lanes belongs to the dispatcher at claim time. Terminal
state needs_verification.

Scope delivered: research/game-depth-scope.md (2026-07-23, product-owner). Two
candidates to build (typ-diploma spine, factory themes), an explicit cut line,
build order, and 4 draft assignments (+1 optional), ids TBD. Two items for the
CEO at review: (1) the paywall promises themes + "fabrieks-uitbreidingen" that do
not exist in code — themes candidate closes half, optional Assignment 5 or a copy
softening closes the rest; (2) the highest lever is latent, not new — the engine's
exam/diploma module (src/engine/exams.js) is built and tested but unwired.
