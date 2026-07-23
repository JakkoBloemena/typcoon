---
id: 026
title: Write nl article — gratis leren typen (P0 money term)
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes Assignment A of research/content-batch-2-scope.md §3 (verified done,
assignment 023). One article object added to scripts/content/nl.mjs: slug
`gratis-leren-typen-kind`, primary term "gratis leren typen" — the honest,
actionable answer to a sceptical parent that a child CAN learn touch typing free,
with the concrete free path. See the scope doc §3-A for angle and distinctions.

## Acceptance criteria

The shared A–D checklist in research/content-batch-2-scope.md §3 is normative,
plus §3-A's extra criteria: distinguish from gratis-of-betaalde-typecursus (link
it as follow-up, don't repeat it); describe the free tier exactly (home row +
first machines — never imply the whole alphabet is free, guardrail 5).

## Notes

Serialized with 027–029: all four edit nl.mjs's articles array — one lane at a
time by dispatcher order. Terminal state needs_verification.

**Done, needs_verification.** Article object added to `scripts/content/nl.mjs`
`articles` array (slug `gratis-leren-typen-kind`, date/updated `2026-07-23`,
readMin 7).

- **Word count:** 941 words of body prose (lead + section HTML + FAQ answers),
  1011 including h2 headings and FAQ questions — inside the 800–1500 range.
- **Distinguishes itself from `gratis-of-betaalde-typecursus`:** that page is a
  decision/comparison ("which should I pick?"); this page answers "can it be
  done free, and how, concretely, today" — the step-by-step free path (thuisrij
  → letter voor letter → nauwkeurigheid vóór snelheid → 10 min/dag), then an
  honest section on exactly where the free tier stops (thuisrij + eerste twee
  machines, per guardrail 5 — explicitly states the whole alphabet is *not*
  free). It links to `gratis-of-betaalde-typecursus` as the "wil je
  vergelijken?" follow-up rather than repeating its comparison content.
- **Keyword placement:** "gratis leren typen" appears in title, h1, slug
  (`gratis-leren-typen-kind`), description, and once in the lead (first ~100
  words) — each a single natural placement. Two further natural mentions occur
  in a section heading ("Ja — een kind kan gratis leren typen") and one FAQ
  question, both intrinsic to the article's own topic, not repetition for its
  own sake — no stuffing.
- **Internal links:** pillar `/leren-typen-voor-kinderen/`; sibling spokes
  `welke-vinger-welke-toets`, `typen-oefenen-10-minuten-per-dag`; follow-up
  `gratis-of-betaalde-typecursus` (framed as "wil je vergelijken?").
- **Build:** `npm install` clean; `npm run build` → `gen-content: 14 URLs
  (pijler + blog + 10 artikelen + 1 pagina's) + sitemap`, then `vite build`
  succeeds. Verified `/blog/gratis-leren-typen-kind/index.html` is emitted
  with valid Article + BreadcrumbList (+ FAQPage) JSON-LD, and the URL appears
  in `public/sitemap.xml`. Blog index and pillar's "Lees ook" list both pick
  up the new article (expected, real content diffs).
- **Tests:** `npm test` → 111/111 pass, unchanged (content-only change).
- **Commit hygiene:** build also touched 10 other already-generated pages with
  LF→CRLF-only diffs (no content change, `git diff` confirmed empty after
  stripping the CRLF warning) — reverted with `git checkout --`, per prior
  lanes' precedent. Committed only the real content changes: `scripts/content/
  nl.mjs`, `public/blog/gratis-leren-typen-kind/` (new), `public/blog/
  index.html`, `public/leren-typen-voor-kinderen/index.html`,
  `public/sitemap.xml`.
