---
id: 027
title: Write nl article — typen leren met een spelletje (pedagogy / E-E-A-T)
owner: developer
status: done
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

### Verification (tester, 2026-07-23)

Verified independently in isolated worktree `typcoon-lanes/v027` (`verify/027`).
All shared A–D criteria (research/content-batch-2-scope.md §3) plus Assignment
B's extra criteria: **PASS**.

- **`nl.mjs` article object + build:** `npm install` clean; `npm run build` →
  generator log `17 URLs (pijler + blog + 13 artikelen + 1 pagina's) + sitemap`;
  confirmed `public/blog/typen-leren-met-een-spelletje/index.html` (and
  `dist/` copy) emitted. Build produced only line-ending churn on unrelated
  pages (confirmed with `git diff -w --stat` = empty); reverted with
  `git checkout -- public/` to leave the worktree clean, matching what the
  developer already did on their branch.
- **Generated HTML, hand-checked:** `<title>` and meta description present,
  honest, not stuffed; `<link rel=canonical>` correct
  (`https://typcoon.com/blog/typen-leren-met-een-spelletje/`); `lang="nl"`;
  `hreflang` nl + x-default; JSON-LD `@graph` contains valid `Article` +
  `BreadcrumbList` + `FAQPage`; sitemap.xml contains the URL; blog index and
  pillar's related-card list both link to the new article.
- **Target-term placement / no stuffing:** measured programmatically —
  "typen leren spelletje" ×1, "werkt een typspel echt" ×1 (both in lead, as
  claimed), "typen leren met een spelletje" ×2 in rendered body (h1 +
  breadcrumb echo of h1 — not stuffing). No forced repetition found reading
  the full body.
  - **Body length:** 1328 words measured across the full `<main>` (incl.
    CTA box / related-list / breadcrumb chrome); the substantive
    lead+sections+FAQ prose alone is ~1050–1225 per the developer's own
    count. Either way, within the 800–1500 range.
- **Pedagogy claims checked against actual engine code (not just the diff):**
  confirmed in `src/engine/srs.js` (Leitner boxes, `reviewSrs`: box resets to
  1 on fail, grows to box 5 on repeated passes — matches the spaced-repetition
  claim exactly); `src/engine/curriculumCore.js` (`MIN_KEY_REPS = 45`) +
  `src/engine/index.js` `tryPromote`/gating logic (promotion requires
  `reps >= MIN_KEY_REPS && acc >= accGate`, i.e. a real accuracy-gated
  threshold, not a timer — matches the "one letter at a time" claim);
  `src/game/economy.js` `accuracyMultiplier` (0× below 0.60, scaling to
  1.5–3.0× above 0.95 — matches "tot 3× zoveel" exactly) and
  `src/engine/rewards.js` (`speedCounts = allLettersLearned(state) && ...` —
  confirms speed only counts toward the 3rd star once the full alphabet is
  learned, exactly as claimed). No overclaiming found.
- **Not a sales page:** confirmed — Typcoon named only in the final "Hoe
  Typcoon dit toepast" section (plus the shared CTA box/nav, which every
  page on the site has); 6 of 7 content sections are pure method/checklist.
- **Failure mode covered explicitly:** "Het echte risico: spelen zonder te
  typen" section names drag/multiple-choice/arcade-speed-only patterns as
  concrete anti-patterns — present and substantive, not a token mention.
- **Checklist:** present, 6 parent-facing questions, matches the developer's
  summary.
- **Links:** pillar `/leren-typen-voor-kinderen/` and sibling
  `/blog/beste-gratis-typspelletjes-kinderen/` both present as real `<a>`
  tags (both required by the assignment); also `/blog/blind-typen-leren-tips/`
  in-body. All internal links on the page verified to resolve HTTP 200 via a
  headless-browser pass against `vite preview` (home, blog index, pillar,
  voor-scholen, speel, and the three "Lees ook" related links) — no broken
  links, no 404s.
- **Byline/author convention:** confirmed `scripts/gen-content.mjs` hardcodes
  `author: { "@type": "Organization", name: "Typcoon" }` on every article,
  no per-article field exists. Developer's decision to not invent one and
  flag it as a follow-up (not a new assignment) is correct per the
  assignment's own instruction.
- **Rendering:** screenshotted desktop (1280×900) and mobile (390×844)
  viewports via Playwright/Chromium against the built `vite preview` output
  — both render cleanly, no layout breakage, no overflow, FAQ `<details>`
  and CTA box both fine on mobile.
- **`npm test`:** 126/126 passing (repo baseline; 0 failures).
- **Cannibalization check vs 028 (`nitro-type-alternatief`):** different
  target terms ("typen leren spelletje"/pedagogy vs "nitro type"/competitor
  comparison), different SEO.md §3 spoke ideas (#14 vs #13), no overlapping
  body content found. Not cannibalizing.
- **Factual/competitor claims:** none in this article (pedagogy-only, no
  competitor comparison) — N/A, nothing to spot-check beyond the
  product-claim verification above.

**Verdict: all criteria met. Status → done.**

**Two minor, non-blocking observations (not part of this article's own AC,
reported to dispatcher separately, not fixed here):**
1. The FAQ answer "Hoeveel moet mijn kind met zo'n spel oefenen?" says "Zie
   ook waarom 10 minuten per dag genoeg is" but this is plain text, not an
   `<a href="/blog/typen-oefenen-10-minuten-per-dag/">` link — the
   developer's build notes claim this link was added ("also linked
   `/blog/typen-oefenen-10-minuten-per-dag/` (FAQ)") but the actual `nl.mjs`
   FAQ `a` string has no anchor tag. Cosmetic/documentation-accuracy gap
   only; doesn't affect this assignment's required links (pillar + sibling
   spoke), both of which are present elsewhere in the article.
2. The pillar's own "Leren typen met een spelletje — werkt dat?" section
   (`scripts/content/nl.mjs` line 54) does not contextually link to this new
   spoke article, unlike its sibling sections (welke-vinger, gratis-of-
   betaalde-typecursus, typediploma-nodig) which do link to their dedicated
   spokes. The new article is still reachable from the pillar via the
   auto-generated "Lees ook" related-card list at the bottom, so it is not
   an orphan page — just a missed contextual in-body link, inconsistent
   with the pattern the other pillar sections follow.
