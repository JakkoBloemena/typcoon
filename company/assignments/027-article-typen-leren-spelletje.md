---
id: 027
title: Write nl article — typen leren met een spelletje (pedagogy / E-E-A-T)
owner: developer
status: needs_verification
priority: 3
blocked_by: [026]
opened_by: ceo
---

## Goal

Materializes Assignment B of research/content-batch-2-scope.md §3: slug
`typen-leren-met-een-spelletje` — the pedagogy behind learning-by-playing (spaced
repetition, letter promotion, accuracy-gated pacing) plus a checklist for telling
a real learning game from entertainment. Not a sales page; Typcoon is the worked
example, not the article.

## Acceptance criteria

The shared A–D checklist in research/content-batch-2-scope.md §3 is normative,
plus §3-B's extra criteria (honest method incl. the failure mode; byline
convention if the generator has one, noted as follow-up if not).

## Notes

blocked_by [026] is serialization only (same nl.mjs array), not a logical
dependency — the next dispatcher may run it as soon as 026's lane has merged.
Terminal state needs_verification.

## Developer notes (2026-07-23)

Article added to `scripts/content/nl.mjs` `articles` array (slug
`typen-leren-met-een-spelletje`), matching the existing field shape exactly.

- **Word count:** ~1050 words (lead + section bodies), ~1225 including h2
  headings and FAQ — within the 800–1500 range.
- **Target term placement:** "typen leren spelletje" and "werkt een typspel
  echt?" both appear once, naturally, in the lead; the title/h1/slug carry
  the natural expansion "typen leren met een spelletje" (same pattern as the
  pillar's existing section title). No repeated stuffing.
- **Pedagogy covered, checked against the real engine (not just claimed):**
  spaced repetition (`src/engine/srs.js` — Leitner boxes, box resets to 1 on
  a miss, growing intervals on a pass), one-letter-at-a-time promotion
  (`curriculumCore.js` + `tryPromote` in `src/engine/index.js` — gated on
  `MIN_KEY_REPS` correct reps at a real accuracy threshold, not a fixed
  timer), and accuracy-before-speed (`rewards.js`/`economy.js` —
  `accuracyMultiplier`: 0× below 60%, up to 3.0× above 95%; speed only ever
  counts toward the 3rd star, and only once the full alphabet is learned).
  The "tot 3× zoveel" claim reuses the pillar's existing phrasing and matches
  `accuracyMultiplier` exactly.
- **Checklist written (6 parent questions, summarized):** (1) does the child
  actually strike keys, not drag/click/watch; (2) does it build one letter
  at a time from the home row, or demand whole sentences immediately; (3) do
  weak keys come back more often, or is every round equally random; (4) is
  accuracy rewarded over raw speed/score; (5) does difficulty rise only on
  demonstrated mastery, or just on a timer/level; (6) does it keep the
  child's eyes on the screen (on-screen key highlight) rather than the hands.
- **Failure mode covered explicitly** ("Het echte risico: spelen zonder te
  typen" section): drag-to-match, multiple-choice-about-typing, and
  arcade/speed-only scoring named as concrete patterns where a child plays
  and barely types, or is rewarded for sloppy speed.
- **Not a sales page:** 6 of 7 sections are pure method/checklist with no
  product mention; Typcoon appears only in the final "Hoe Typcoon dit
  toepast" section as the worked example, framed as one instance of the
  checklist rather than the point of the article.
- **Links:** pillar `/leren-typen-voor-kinderen/` and sibling
  `/blog/beste-gratis-typspelletjes-kinderen/` (both required); also linked
  `/blog/blind-typen-leren-tips/` (tip 6, same one-letter-at-a-time point)
  and `/blog/typen-oefenen-10-minuten-per-dag/` (FAQ) for richer internal
  linking, matching the existing articles' style.
- **Byline/author convention:** checked `scripts/gen-content.mjs` — there is
  no per-article author/reviewer field; every Article schema hardcodes
  `author: { "@type": "Organization", name: "Typcoon" }` and there is no
  byline UI anywhere in the generated pages. Per the assignment, **not
  blocking on this** — flagged here as a follow-up only (no convention to
  reuse, so none was invented for this article): worth a future assignment
  to decide whether a site-wide author/reviewer byline is wanted for
  E-E-A-T on the YMYL-adjacent pages. Not opened as a new assignment file
  per this task's own instructions (no new assignment files).
- **Verification run:** `npm install` (clean), `npm run build` → generator
  log now `15 URLs (pijler + blog + 11 artikelen + 1 pagina's) + sitemap`;
  confirmed `public/blog/typen-leren-met-een-spelletje/index.html` (and
  `dist/` copy) emitted; JSON-LD parses and contains `Article` +
  `BreadcrumbList` + `FAQPage` in the `@graph`; new URL present in
  `public/sitemap.xml`. `npm test` → 112/112 passing (baseline held).
  Reverted line-ending-only churn on 11 unrelated generated pages
  (`git checkout --`); kept the genuinely additive diffs (new article
  directory, `public/blog/index.html` card, `public/leren-typen-voor-kinderen/index.html`
  related-list entry, `public/sitemap.xml` entry).
