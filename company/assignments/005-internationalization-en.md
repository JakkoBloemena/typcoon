---
id: 005
title: Internationalization — scope the en locale per SEO.md
owner: product-owner
status: needs_verification
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

SEO.md §5 makes five locales (nl·en·de·es·fr) a core pillar — a 3–5× TAM multiplier —
but only src/data/nl exists and no hreflang anywhere. The engine is language-neutral;
what's per-locale is UI strings, the practice data pack, landing + content, and
keywords. Scope the **en** rollout (the next locale by SEO.md's own ROI order) as a
buildable plan honoring the hard rule "never ship a half-translated locale": a locale
launches whole (UI + landing + at least the pillar page) or not at all. Deliverable is
the decomposition — locale-prefixed paths (`/en/`), full reciprocal hreflang cluster
incl. x-default, per-locale titles/meta/OG/JSON-LD, en practice data pack, en keyword
research (native intent, not translated Dutch keywords), sitemap generation — into
developer-sized assignments, ids left for the dispatcher.

## Acceptance criteria

- [ ] Written scope: exactly what constitutes a "whole" en launch, with an explicit
      cut line (what waits: blog depth, de/es/fr).
- [ ] Data-pack question answered concretely: what src/data/en needs (bigrams,
      frequencies, words, sentences, curriculum) and its source/authoring approach —
      this is the long pole and must not be hand-waved.
- [ ] hreflang/sitemap technical approach specified against the current static build
      (SEO.md §5 implementation list), including whether typie-fun's generators are
      portable.
- [ ] Build assignments drafted with acceptance criteria, priority 3–4, ids to be
      allocated by the next dispatcher.

## Notes

nl funnel proof is the stated precondition in SEO.md ("prove the funnel here first") —
the plan should say explicitly whether we hold the en build until the nl proxy metric
(parent opt-ins/week, charter) shows life, and recommend a trigger. Sequencing en
behind 006 (measurement) may be the honest call; the product-owner decides and writes
it down.

## Note (product-owner, 2026-07-22)

Scope delivered: `research/en-locale-scope.md`. It covers all four acceptance criteria —
the "whole" en launch definition with an explicit cut line (§1), the en data-pack answer
including the words/curriculum-order long pole and the typie-fun sync spike (§3),
the hreflang/sitemap approach against the current static build with the portability
verdict (§5 — the generator is already the port; it needs a cross-locale page-key fix,
not a rewrite), and the sequencing recommendation with an explicit trigger (§6). Six
follow-up build assignments (A–F, priority 3–4, ids TBD) are drafted with acceptance
criteria inside the doc at §7. No assignment files created; board not reprioritised.

Recommendation in brief: start the data pack + player wiring (assignment A) early —
low-regret, off the funnel-proof gate; hold en content/landing/hreflang/launch (C–F)
behind assignment 006 (measurement) being live ≥6 weeks AND the nl proxy (opt-ins/week)
showing life, with a CEO-escalation escape hatch if nl traffic arrives but does not
convert.
