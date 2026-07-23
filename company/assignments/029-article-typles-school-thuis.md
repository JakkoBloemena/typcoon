---
id: 029
title: Write nl article — typles op school of thuis (schools-channel feeder)
owner: developer
status: needs_verification
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
