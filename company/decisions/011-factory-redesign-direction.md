# ADR 011 — Shareholder product direction: factory redesign, design-first; build-hold lifted

- **Date:** 2026-07-24
- **Decided by:** Shareholder (direct, /ceo channel, morning of 2026-07-24)
- **Authority citation:** Shareholder's own session, verbatim: "I think we have much
  more building to do. I think the current design that we type and around it there's
  a lot of factory stuff happening is very basic and also very distracting. Why not
  have a separate page where we upgrade the factory, get some stats, see how it's
  going, have clear goals, make it more beautiful and exciting. currently it feels
  very basic. I would have thought that after 12 hours of building, there would be
  some improvements there. But it looks very much the same. You need to do a better
  job managing that /ceo"

## Decision

1. **ADR 010's build-hold is lifted.** The hold concluded "no evidence-backed build
   work remains"; the Shareholder's own product judgment is evidence of the highest
   authority, and it says the core experience is under-built. Triggers T1–T6 stay
   armed for their growth purposes; the hold itself is superseded. This also answers
   the direction question assignment 064 queued.
2. **New product milestone: the factory experience.** Direction, in the
   Shareholder's terms: (a) a **separate factory/management page** — upgrade the
   factory, see stats and progress, have clear goals; (b) the **typing view becomes
   calm** — typing is the work surface, not a stage surrounded by distraction;
   (c) **more beautiful and exciting** — the current presentation reads as basic.
3. **Design-first, enforced this time.** PROTOCOL puts the design system before
   feature work; typcoon skipped that at adoption (inherited product) and the bill
   is exactly this feedback. The **designer role runs first** (its first-ever
   dispatch in this company): competing visual directions for the factory page and
   the calm typing view, selected by comparison, delivering tokens/direction the
   PO and developers then build against. No feature lane starts before the design
   direction lands.

## CEO accountability note (recorded, not softened)

The Shareholder is right that ~12 hours of building changed the core play
experience little. The build effort went to correctness, i18n, measurement,
observability, school/licence plumbing, and system-shaped depth (exam spine, theme
infrastructure) — real work, but plan-completion was treated as the ceiling. The
management fix, standing from today: every milestone review must include a
product-ambition check sourced from *using the product* (playtest-critique
assignments), not only from the plan's checkboxes; "the plan is done" is never
again grounds for a hold while the product's core experience has known basic-ness.

## Also raised, answered in-channel, logged here

**Why is Dutch the default when the English market is ~100× larger?** Historical +
strategic: the product was born Dutch (typie-fun lineage); REVENUE.md's validated
willingness-to-pay is Dutch (€150–250 typecursussen); SEO.md's explicit strategy is
"prove the funnel in the small, winnable pond first" — the en kids-typing SERP is
saturated (TypingClub, Typing.com, Nitro Type) while nl is winnable. en is now live
at /en/ as the expansion. **Open strategy item, not decided today:** whether
x-default/root should flip toward en once GSC shows en impressions — revisit with
~4 weeks of en search data (T-en trigger for the analyst).

## Consequences

- Assignments 067 (designer: competing directions + tokens, P2) and 068 (PO:
  factory-experience milestone scope, blocked_by 067, P2) open now; the loop
  resumes building through them.
- ADR 010's monitor cadence continues unchanged on hold-free ticks (health pass
  is part of every growing-stage tick regardless).
