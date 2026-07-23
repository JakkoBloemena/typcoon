---
id: 023
title: Scope content batch 2 — nl article cadence toward SEO.md's 12–15 target
owner: product-owner
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

> **Tester verification — 2026-07-23:** All four acceptance criteria independently
> re-checked against the actual repo state, not the doc's own claims.
>
> - **Gap map vs reality:** `grep`'d every `slug:` in `scripts/content/nl.mjs` — exactly
>   9 spoke articles + 1 pillar (`leren-typen-voor-kinderen`) + 1 school page
>   (`voor-scholen`), matching the doc's "9 spokes + pillar + school landing" claim
>   exactly. Ran `node scripts/gen-content.mjs` myself: it reports "9 artikelen + 1
>   pagina's", confirming the count live, not just by reading source. Cross-checked all
>   14 SEO.md §3 rows one by one against nl.mjs content: every "covered" row has a real,
>   on-topic matching article/section (spot-checked `welke-vinger-welke-toets`,
>   `hoe-lang-duurt-leren-typen`, `typen-oefenen-10-minuten-per-dag`, the groep-6/7/8
>   "Op school of thuis?" section at nl.mjs:218, and `blind-typen-leren-tips`'s "2. Niet
>   spieken" tip at nl.mjs:93). **`gratis leren typen` specifically verified as a genuine
>   gap**: `grep -i "gratis leren typen"` across nl.mjs hits only the pillar's H2 (line 49,
>   inside the pillar's own section range) and the `gratis-of-betaalde-typecursus`
>   description/FAQ — no dedicated spoke exists, exactly as claimed. `nitro type` /
>   `typecursus kind` both return zero hits anywhere in nl.mjs — both gaps are real, not
>   overstated.
> - **The 4 chosen articles (A–D):** each has term/slug/intent/angle; none of the 4
>   proposed slugs (`gratis-leren-typen-kind`, `typen-leren-met-een-spelletje`,
>   `nitro-type-alternatief`, `typles-op-school-of-thuis`) collides with an existing
>   slug in nl.mjs or public/sitemap.xml — genuinely new pages. Judged against guardrail
>   7: no keyword-stuffing plan (explicit "once each, naturally" AC on every article), no
>   over-claiming (shared AC ties every product claim to what the code actually does —
>   cross-checked against README.md and charter.md: adaptive engine, up-to-3× accuracy
>   multiplier, plays fully without an account, optional email-only parent account all
>   confirmed accurate). **Nitro Type article (C):** plan explicitly commits to "a fair
>   comparison, not a takedown," "no disparagement, no false claims about the competitor,"
>   and frames it as a genuine now/later decision for the reader rather than a discredit —
>   satisfies the fair-treatment check.
> - **Write-assignments:** 4 drafted inside the doc (A priority 3, B priority 3, C
>   priority 4, D priority 4 — within the required 3–4 band), ids TBD as required. Verified
>   the build-path claim directly by reading `scripts/gen-content.mjs`: it does generate
>   `Article` + `BreadcrumbList` JSON-LD, hreflang `<link>` tags, the sitemap entry (with
>   `lastmod`), and the blog-index card per article, purely from one object added to
>   `pack.articles` — no per-article code changes needed. Ran `npm run build`'s `prebuild`
>   step myself; it regenerated all pages + sitemap cleanly (13 URLs). (Note for the
>   dispatcher, not a defect in this scope doc: `node_modules` is not installed in this
>   worktree, so the `vite build` half of `npm run build` cannot be exercised here — an
>   environment/setup matter, unrelated to the scope doc's claims about `gen-content.mjs`,
>   which was verified directly.)
> - **006 section:** confirmed 006 is `status: done` (tester-verified 2026-07-22) and this
>   assignment's `blocked_by: []` — the doc's "does not block this batch" claim holds. The
>   re-ranking order (Search Console primary, funnel events secondary, re-score at batch 3)
>   is a reasonable, explicit rule, not hand-waving.
> - **External citations:** every qualitative SERP claim in §1c carries a live source URL
>   (gratislerentypen.nl, Typeles Online, Pogo, typecursusvergelijker.nl, 10vingers.nl,
>   KlasCement); no invented volumes or percentages anywhere in the doc — confirmed by
>   grep across research/content-batch-2-scope.md.
>
> **Verdict: all 4 acceptance criteria met. Status: done.**

> **Note (product-owner, 2026-07-22):** Scope delivered at
> `research/content-batch-2-scope.md`. Gap map (9 existing spokes + pillar cover 9 of
> SEO.md §3's 14 ideas; 5 gaps identified), 4 next articles specified (term/slug/intent/
> angle), 4 write-assignments drafted inside the doc (priority 3–4, ids TBD), 1 gap
> deliberately deferred (blind-typen-zonder-kijken — folds into a refresh, not a thin
> new page), and an explicit section on how 006's funnel data re-ranks batch 3+ without
> blocking this batch. Terminal state: needs_verification.

## Goal

Charter "known open threads": 9 nl articles exist, SEO.md targets ~12–15. Scope the
next batch: which target keywords from SEO.md's list are not yet covered, which 3–6
articles close the highest-intent gaps, with per-article target term, slug, intent,
and a one-line angle that makes it genuinely useful (guardrail 7: every page earns
its ranking). Sequence them into developer-sized assignments with acceptance
criteria drafted inside the scope doc, ids TBD for the dispatcher. Note where the
new measurement (006) should influence choices once data exists — but do not block
on it; this batch can be chosen from SEO.md's existing keyword research.

## Acceptance criteria

- [ ] Scope doc in research/ mapping existing 9 articles against SEO.md's target
      keyword list — gaps identified explicitly.
- [ ] 3–6 next articles specified (term, slug, intent, angle), each defensibly
      useful, no keyword-stuffing plans.
- [ ] Follow-up write-assignments drafted inside the doc with acceptance criteria,
      priority 3–4, ids TBD.
- [ ] Explicit note on how funnel data (006) will re-rank future batches.

## Notes

Authority: charter "known open threads" + SEO.md. Terminal state
needs_verification.
