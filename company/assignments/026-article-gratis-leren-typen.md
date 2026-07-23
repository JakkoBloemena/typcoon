---
id: 026
title: Write nl article — gratis leren typen (P0 money term)
owner: developer
status: done
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

### Verification (tester, 2026-07-23)

**Verdict: PASS — all shared A–D criteria (content-batch-2-scope.md §3) and the
§3-A extra criteria met. Status → done.**

Worked in isolated worktree `C:\companies\typcoon-lanes\v026` (branch
`verify/026`). `npm install` clean. `npm run build` → prebuild
`gen-content.mjs` reports `17 URLs (pijler + blog + 13 artikelen + 1
pagina's) + sitemap` (13 articles now, since siblings 027–029 have also
landed in the shared `nl.mjs`/build since this assignment's build notes were
written — expected, not a defect). `vite build` succeeds clean.

- **Article object / build output:** `scripts/content/nl.mjs` has the
  `gratis-leren-typen-kind` object in the existing field shape.
  `public/blog/gratis-leren-typen-kind/index.html` is generated;
  `public/sitemap.xml` contains its `<url>` entry with `lastmod
  2026-07-23`. Confirmed by direct file read, not by trusting the build log.
- **Keyword placement:** "gratis leren typen" appears in `<title>`, `<h1>`,
  slug, meta description, and once in the lead (first ~100 words) — each a
  single natural placement, verified by reading the rendered HTML. Two more
  natural mentions: the h2 "Ja — een kind kan gratis leren typen" and the FAQ
  question "Wat kost gratis leren typen echt?". Note for the record: a
  regex count over the rendered `<main>` found **one further** natural
  mention the build notes didn't call out — a body sentence in "De eerlijke
  grens" ("Gratis leren typen betekent niet dat het hele alfabet..."). Total
  6 occurrences of the exact phrase in ~1000 words of body content, each in a
  distinct, topic-intrinsic spot (title/h1 template dup via breadcrumb, lead,
  h2, one body sentence, one FAQ question) — reads naturally on the
  screenshot, not stuffed. Minor documentation-accuracy note only, not a
  guardrail-7 violation.
- **Word count:** measured 1039 words (lead + section HTML + FAQ, including
  h2/FAQ-question text) via script over the generated HTML — inside the
  800–1500 range. Dev's own count (1011) used a slightly different method;
  both land solidly inside range, no issue.
- **Distinguishes from `gratis-of-betaalde-typecursus`:** confirmed — this
  article is the "can it be done free, how" step-by-step piece; it links
  `gratis-of-betaalde-typecursus` once, framed exactly as "wil je
  vergelijken?", not repeated content.
- **Internal links resolve:** verified every linked slug
  (`welke-vinger-welke-toets`, `typen-oefenen-10-minuten-per-dag`,
  `gratis-of-betaalde-typecursus`, pillar `/leren-typen-voor-kinderen/`) has
  a real generated `index.html` on disk. Blog index and pillar's "Lees ook"
  both list the new article (`grep -c` = 1 in each).
- **Schema:** `Article` + `BreadcrumbList` + `FAQPage` JSON-LD present and
  well-formed in the generated HTML; `FAQPage` questions match the visible
  `<details>` accordion in the body exactly.
- **Guardrail 5 (free tier honesty):** cross-checked the article's claim
  ("thuisrij + eerste twee machines, geen tijdslimiet, geen account, hele
  alfabet zit in de familie-unlock") against actual product code —
  `src/game/premium.js`: `FREE_LETTER_CAP = 10`, `FREE_MACHINES =
  ['typewriter', 'printer']`, cap is letters-learned-based (no time limit),
  one-time family unlock (`PRICE.now = '19,99'`). Exact match, no
  over-claim. Also confirmed gameplay is not gated behind login
  (`App.jsx`'s `Login` is opened only via an explicit "ander apparaat"
  button) — supports the "spelen kan volledig zonder account" claim.
- **Pricing claim (€200 competitor course):** not dated/sourced inline in
  this specific article, but it's a reused, already-established company
  figure (charter.md / `research/payments-decision-package.md`: "Dutch
  parents pay €150–250 for typecursussen") and matches the identical framing
  used consistently in the already-generated sibling article
  `typles-op-school-of-thuis` ("€150 à €200"). Not a fabricated or
  freshly-invented claim — flagging only as a minor observation, not a
  failure.
- **Guardrail 7 (no tricks):** no keyword stuffing (see above), no
  disparagement (no competitor mentioned in this article), no invented
  claims, genuinely actionable step-by-step content for a skeptical parent.
- **`npm test`:** 126/126 pass (dev's build notes said 111/111 — the gap is
  from other sibling assignments' tests landing in the shared repo since,
  not a regression; 0 failures either way).
- **Commit hygiene:** re-ran `npm run build` myself; it re-touched the same
  10+ already-generated pages with LF→CRLF-only diffs (`git diff
  --ignore-all-space --stat` = empty), confirmed no real content drift, and
  reverted with `git checkout -- public/` before finishing — worktree left
  clean.
- **Real-browser check (Playwright/Chromium):** served `public/` locally,
  loaded `/blog/gratis-leren-typen-kind/` in headless Chromium. Renders
  cleanly on desktop (1280×900) and mobile (375×812) viewports — screenshots
  saved to `C:\tmp\verify026\desktop.png` and `mobile.png`. Clicked the
  pillar link; navigation lands on `/leren-typen-voor-kinderen/` with the
  correct title. The only network failure observed (`404
  /api/track`) is a pre-existing, site-wide artifact of local static
  serving (that endpoint is a Vercel serverless function, absent from
  `serve public`) — reproduced identically on an already-verified sibling
  article (`typediploma-nodig`), so it is not specific to or caused by this
  article; not filed.

No adjacent defects found that block this assignment. Two minor,
non-blocking observations recorded above (keyword-mention undercount in the
build notes; the €200 figure isn't re-sourced inline in this specific
article) — neither rises to a guardrail violation or a functional bug, so
not filed as separate assignments.
