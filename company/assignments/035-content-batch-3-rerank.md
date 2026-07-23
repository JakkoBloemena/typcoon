---
id: 035
title: Content batch 3 — re-rank on measured value (Search Console + funnel)
owner: product-owner
status: blocked
priority: 3
blocked_by: []
opened_by: product-owner
---

## Goal

The nl content hub sits at 13 articles — inside SEO.md's 12–15 target. Writing more now
would spend effort on an assumed keyword when the instrument to aim it (Google Search
Console, verified in 009) is only days-to-weeks from having real impression/CTR data. This
is a **tripwire**, not work yet: when GSC has accrued enough data, re-score the batch-2
gap map on *measured value* instead of intent-guess and scope the next content tranche —
which may be "refresh near-misses," not "write new pages." This keeps the content lever
from being idle-by-default in growing without writing on a guess today.

## Acceptance criteria

- [ ] A re-ranked content scope (research/ doc) exists, grounded in **real** data:
      Search Console queries/impressions/CTR/position for the live pages, plus the
      first-party funnel (`events` table) game-starts/opt-ins per published article.
- [ ] It applies SEO.md §7's rule — **promote existing near-misses (positions 5–15) with
      better titles/depth/internal links *before* net-new pages** — and lists which pages
      to refresh.
- [ ] It validates or kills batch-2-scope §4's held guesses against real numbers:
      `typecursus kind` (held for batch 3) and the `nitro type` article's actual pull; and
      the deferred `blind-typen-zonder-kijken` refresh. No article is scoped on assumed
      volume (batch-2-scope §4).
- [ ] It either scopes the resulting batch-3 article write-assignments (concrete, one
      article each, in the batch-2 shape) for a dispatcher to id, **or** recommends "no new
      articles this cycle — refresh only," honestly. Guardrail 7 / SEO.md §9: no thin or
      duplicative pages.

## Notes

**Blocked on (external trigger):** Google Search Console has accumulated a meaningful window
of data — proposed default **≥ ~4 weeks** of impressions/CTR since 009's verification — and
the first-party funnel is readable via `api/admin/funnel`. Until then this is a tripwire, not
work; the growing-stage monitor/analyst checks it. Authority: SEO.md §7/§9,
research/content-batch-2-scope.md §4, research/next-milestone-scope.md §3. Owner is
product-owner because the deliverable is a scoping decision (mirrors assignment 023); the
analyst supplies the GSC/funnel data.
