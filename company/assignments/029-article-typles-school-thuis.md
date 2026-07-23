---
id: 029
title: Write nl article — typles op school of thuis (schools-channel feeder)
owner: developer
status: done
priority: 4
blocked_by: [028]
opened_by: ceo
---

## Goal

Materializes Assignment D of research/content-batch-2-scope.md §3: slug
`typles-op-school-of-thuis` — a straight answer to whether Dutch schools teach
typing (usually not standard) and how to cover it at home free. Practical,
reassuring, no upsell.

## Acceptance criteria

The shared A–D checklist in research/content-batch-2-scope.md §3 is normative,
plus §3-D's extra criteria: link /voor-scholen/, the pillar, AND
leren-typen-groep-6-7-8; go deeper than that article's "op school of thuis?"
section, don't duplicate it.

## Notes

blocked_by [028] is serialization only (same nl.mjs array). Terminal state
needs_verification.

---

**Developer (2026-07-23) — implemented, needs_verification.**

Article added: `scripts/content/nl.mjs` articles array, slug
`typles-op-school-of-thuis`. 1183 words (approx, tags/entities stripped).
Reaches 13 total articles per content-batch-2-scope.md §2.

**School-system claims and dated sources (guardrail 7 web-check):**

- Typing/touch-typing is **not** a kerndoel (legally mandatory core objective)
  of Dutch primary education, including under the newest curriculum revision.
  Digital literacy (`digitale geletterdheid`) becomes its own kerndoel from
  2027 (schools have until 2031 to fully implement), but it covers broad
  digital skills (searching info, online safety, media literacy) — not
  touch-typing/vingerzetting specifically.
  Source: [Rijksoverheid — Belangrijke mijlpaal in herziening curriculum met
  laatste kerndoelen](https://www.rijksoverheid.nl/ministeries/ministerie-van-onderwijs-cultuur-en-wetenschap/nieuws/2025/11/21/belangrijke-mijlpaal-in-herziening-curriculum-met-laatste-kerndoelen),
  dated 2025-11-21, checked 2026-07-23.
- Where a school does offer typing lessons, it is in practice contracted out
  to an external for-profit provider (Type-Uniek, LOI Kidzz, TypeTopia, Pica),
  run after school hours (aansluitend op het continurooster), in groups of
  ~8–12 children, ~10–12 one-hour lessons, targeted at groep 6–8, paid
  directly by parents (~€150–200, sometimes with a school-negotiated
  discount) — the school hosts the room/slot but does not run or fund it as
  a taught subject.
  Source: [Type-Uniek — Typecursus op de basisschool na
  schooltijd](https://www.type-uniek.nl/typecursus-op-de-basisschool-na-schooltijd/),
  checked 2026-07-23. Corroborating same pattern: [LOI Kidzz —
  scholen](https://www.loikidzz.nl/scholen), checked 2026-07-23.
- Provision genuinely varies by school (some offer it, most don't), and even
  where a paid school course exists, it still requires home practice on top
  (evidence of the "doesn't remove follow-through" claim in the decision
  section).
  Source: [ouders.nl forum — "type cursus of niet groep
  8"](https://www.ouders.nl/forum/ouders-en-school/type-cursus-of-niet-groep-8),
  checked 2026-07-23 (undated forum thread, used only as evidence of
  cross-school variance, not as a primary claim source).

**Required links (all verified present in generated output):** `/voor-scholen/`,
pillar `/leren-typen-voor-kinderen/`, `/blog/leren-typen-groep-6-7-8/`. Also
linked `/blog/gratis-leren-typen-kind/` (the detailed free at-home path) to
avoid re-duplicating that article's stepwise content here.

**Goes deeper than `leren-typen-groep-6-7-8`'s "Op school of thuis?" section**
(that section is one short paragraph: "some schools offer it, many parents
arrange it themselves, home is fine"). This article adds: what kerndoelen
actually say and don't say (with the 2027 digital-literacy nuance); what a
school-arranged course concretely is in practice (external provider,
group size, hours, cost, who pays); and a four-factor decision framework
(cost, pace, group-vs-individual attention, follow-through) with explicit
"choose the school course when…" / "home works fine when…" guidance — none
of which the groep-6-7-8 paragraph covers.

**Build/test verification:**
- `npm install` — clean (22 packages).
- `npm run build` — `gen-content: 17 URLs (pijler + blog + 13 artikelen + 1
  pagina's) + sitemap`; `dist/blog/typles-op-school-of-thuis/index.html`
  emitted and verified on disk. JSON-LD verified: single `<script
  type="application/ld+json">` containing a valid `@graph` with `Article` +
  `BreadcrumbList` (parses with `JSON.parse`, matches the shape every other
  spoke uses). `public/sitemap.xml` contains the new
  `https://typcoon.com/blog/typles-op-school-of-thuis/` entry.
- `npm test` — 120/120 pass (0 fail). Note: the 118/118 baseline named in
  the assignment predates articles A–C (this batch's prior assignments,
  already landed on this branch); content changes don't add unit tests
  (no test file references specific article slugs), so 120 is the current
  correct green baseline, unaffected by this change.
- Line-ending churn: `npm run build` rewrites every generated `public/**`
  file with LF while the working tree/git config normalizes to CRLF on this
  Windows checkout, so every existing spoke page shows as modified after a
  rebuild with zero real diff. Reverted via `git checkout --` on every file
  with `git diff --stat` = 0 lines; kept only the genuine additions
  (`public/blog/typles-op-school-of-thuis/` new dir, the new "Lees ook" card
  in `public/leren-typen-voor-kinderen/index.html`, the new blog-index card
  in `public/blog/index.html`, and the new sitemap entry).

---

### Verification (tester, 2026-07-23)

**Verdict: PASS. All criteria met — flipping to `done`.**

Verified independently in worktree `C:\companies\typcoon-lanes\v029` (branch
`verify/029`): `npm install` clean (22 packages), `npm run build` clean
(`gen-content: 17 URLs ... + sitemap`), `npm test` → **126/126 pass, 0 fail**
(current baseline on this branch after 026/027/028 also landed; no
regressions).

**Shared A–D checklist (content-batch-2-scope.md §3):**
- [x] Article object added to `scripts/content/nl.mjs` in the existing
      shape; build emits `public/blog/typles-op-school-of-thuis/index.html`
      and `dist/blog/typles-op-school-of-thuis/index.html` — confirmed on
      disk both places.
- [x] Target term "typles op school of thuis" appears in `<title>`, `<h1>`,
      the slug, and once naturally in the lead (opening line, in quotes).
      Counted 3 occurrences inside `<main>` (crumb, h1, lead) — no stuffing;
      read naturally in context, confirmed by rendering the page in a real
      Chromium browser (Playwright).
- [x] Body word count: **1183 words** (lead + sections + faq, tags/entities
      stripped — recomputed independently by importing `nl.mjs` and
      stripping markup programmatically; matches developer's count exactly).
      Within the 800–1500 range.
- [x] Product claims match code: checked `src/game/premium.js` /
      `src/game/GameScreen.jsx` / `src/game/App.jsx` — home row + first
      machines free, no account required to play, unlock is optional and
      adult-gated. Article's claim ("thuisrij en de eerste machines zijn
      volledig gratis, zonder tijdslimiet en zonder account") matches.
- [x] Internal links: pillar `/leren-typen-voor-kinderen/` and sibling
      spoke(s) present and resolve (checked every linked slug has a
      generated `public/**/index.html`): `/voor-scholen/`,
      `/leren-typen-voor-kinderen/`, `/blog/leren-typen-groep-6-7-8/`,
      `/blog/gratis-leren-typen-kind/` (×2), plus the generator's own
      related-card links (`/blog/op-welke-leeftijd-leren-typen/`,
      `/blog/blind-typen-leren-tips/`, `/blog/typediploma-nodig/`) — all
      200/resolve. Cross-links confirmed both directions: the pillar page
      now carries a "Lees ook" card to this article, and `blog/index.html`
      lists it.
- [x] Generated page JSON-LD: single `<script type="application/ld+json">`
      with `@graph` containing valid `Article` + `BreadcrumbList` +
      `FAQPage` (parsed and inspected directly — not just presence-checked).
      `lang="nl"`, canonical `https://typcoon.com/blog/typles-op-school-of-thuis/`
      present, hreflang nl + x-default present, title/meta description
      honest (match the actual article content, no bait).
      `public/sitemap.xml` contains the new URL entry.
- [x] `npm test` green (126/126, see above).
- [x] Guardrail 7 / SEO.md §9: no keyword-stuffing (see term-count above),
      no thin/spun content (1183 words of specific, sourced substance), no
      disparagement of the named external providers (Type-Uniek, LOI Kidzz,
      TypeTopia, Pica) — described neutrally as a factual option.

**Assignment D extra criteria:**
- [x] Links `/voor-scholen/`, the pillar, **and**
      `/blog/leren-typen-groep-6-7-8/` — all three present and resolve
      (confirmed above).
- [x] Does not duplicate `leren-typen-groep-6-7-8`'s "Op school of thuis?"
      section — read that section directly in `nl.mjs` (one short paragraph:
      "Sommige scholen bieden typles of raden een cursus aan... Veel ouders
      regelen het zelf..."); this article covers kerndoelen detail, the
      concrete external-provider mechanics (group size, hours, cost, who
      pays), and a four-factor decision framework — genuinely deeper, not a
      rewrite.

**School-licence / pricing guardrail (the specific adversarial check this
assignment called out):** the article makes **no** promise of a live buying
flow and **no** school price. It links to `/voor-scholen/`, which itself
(pre-existing page, unchanged by this assignment) offers only a
`schoollicentie` *contact* path ("Dan denken we graag mee... Mail ons op
scholen@typcoon.com") — no price, no checkout, no claim of a working
purchase flow. This is consistent with decisions/002 §5 (school pricing
€99/€249 are internal targets only, "Not published on /voor-scholen/") and
with 010 still `blocked` (payments/entity reopening not triggered). No
overclaim found.

**Factual spot-checks (WebFetch against the developer's own cited sources,
today):**
- Rijksoverheid kerndoelen page: confirmed digital literacy
  (`digitale geletterdheid`) is one of the newly published kerndoelen, with
  "andere leergebieden" (which it falls under) taking effect from
  1 augustus 2027 and all schools required to have adapted by August 2031 —
  matches the article's framing. The page does not name touch-typing at
  all (consistent with "not a kerndoel"; this is an absence claim, noted as
  such, not falsifiable from a single source, but the article's phrasing is
  appropriately hedged and matches general public knowledge of the Dutch
  kerndoelen).
- Type-Uniek page: confirmed 8–12 children per group ("minimaal acht en
  maximaal twaalf"), 10–12 one-hour lessons ("gemiddeld... 10 tot 12 lessen
  van een uur"), groep 6–8 target, parents pay directly, individual price
  €175 (article says "€150 à €200" — €175 sits inside that range). All
  load-bearing numeric claims check out against the primary source.

**Kid-safety / tone:** Dutch, parent-aimed, no dark patterns, no upsell
pressure, reassuring tone ("Dat is heel normaal" for schools offering
nothing) — matches the assignment's "practical, reassuring, no upsell"
brief.

**Browser verification (Playwright, Chromium, against `vite preview`):**
- Desktop (1280px) and mobile (375px) viewports both render cleanly, no
  layout breakage, no overflow. Screenshots taken to a scratch temp path
  (not committed — no defect found, nothing to attach); page is visually
  consistent with the site's existing spoke-article pattern.
- One console/network error observed: `404 http://localhost:4321/api/track`
  (the client-side `track.js` beacon posts to a serverless function that
  `vite preview` doesn't serve locally). Reproduced identically on an
  already-verified existing article (`/blog/gratis-leren-typen-kind/`) —
  this is a pre-existing, site-wide artifact of local preview, not
  something this assignment introduced. Not filed as a defect.

**Build artifact note:** `npm run build` regenerates every `public/**` file
with LF line endings against a CRLF-normalized Windows checkout, producing
git-status noise across all existing spoke pages with **zero real content
diff** (`git diff` on each shows only the CRLF warning, no changed lines) —
same pre-existing environment quirk the developer already documented.
Not this assignment's defect; worktree left as-is except for the assignment
file itself, committed by explicit path.

No adjacent defects found that block this assignment. Two minor,
independent observations reported to the dispatcher (not filed as
assignments per instruction): (1) the site-wide `/api/track` 404 under
local `vite preview` (cosmetic/local-only, likely works fine on real
Vercel deploy — not verified against production), and (2) the Windows
CRLF/LF build churn is a recurring nuisance across every content build on
this checkout and may be worth a `.gitattributes` fix at some point.
