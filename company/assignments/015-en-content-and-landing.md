---
id: 015
title: en content pack + /en/ landing
owner: developer
status: needs_verification
priority: 4
blocked_by: [013, 014]
opened_by: ceo
---

## Goal

Materializes draft **D** of research/en-locale-scope.md §7: `scripts/content/en.mjs`
in the nl.mjs shape (pillar + ≥2 spokes), `en` added to LOCALES, hand-authored
`/en/index.html` landing with English JSON-LD and a "Play free" CTA opening the
English app; zero Dutch on any en page.

## Acceptance criteria

The checklist under "### D —" in research/en-locale-scope.md §7 is normative.

## Notes

Effectively gated by the §6 trigger via 014. Terminal state needs_verification.

### Delivered (developer, 2026-07-23)

Built to the "### D —" checklist in research/en-locale-scope.md §7, using the exact
pillar/spoke targets, slugs and intent from research/en-keyword-research.md (014).

- **`scripts/content/en.mjs`** — `locale:'en'`, `htmlLang:'en'`, `ogLocale:'en_US'`, full
  `ui` block, `pillar` (`/en/learn-typing-for-kids/`), and 2 launch spokes:
  `/en/blog/free-typing-games-for-kids/` and `/en/blog/what-age-to-learn-typing/` — the
  required minimum per 014 (spoke 3, `nitro-type-alternative`, is the documented
  fast-follow, not built). Content is freshly authored native English (not translated
  Dutch): competitor mentions (TypingClub course-first, Typing.com ad-supported, Nitro
  Type assumes existing skill, KidzType a mini-game grab-bag) match the dated claims in
  014 §1/§2. Free-tier claims (home row + first 2 machines free, one-time family unlock,
  no subscription/ads/child-completable purchases) match charter guardrails 2/3/5 and
  existing code behaviour. `en` added to `LOCALES` in `gen-content.mjs`.
- **`npm run build`** emits `/en/learn-typing-for-kids/`, `/en/blog/`,
  `/en/blog/free-typing-games-for-kids/`, `/en/blog/what-age-to-learn-typing/` — English
  content, `lang="en"`, `inLanguage:"en"`, `og:locale="en_US"`, Article/Breadcrumb (+FAQ
  where present) schema, styled identically to nl (shared generator CSS, unchanged).
- **`/en/index.html`** hand-authored (mirrors `/index.html`'s structure/CSS exactly),
  English copy, `VideoGame` + `FAQPage` + `Organization` + `WebSite` JSON-LD, `lang="en"`,
  `og:locale="en_US"`, "▶ Play free" CTA → `/speel/?lang=en` (the existing §3.7 locale
  signal from 012/013 — confirmed the app reads `?lang=en` and sets the English pack).
  Registered as a third Vite build input (`vite.config.js`) alongside `index.html` /
  `speel/index.html`, since it's a hand-authored root page, not generator output.
- **Reciprocal cross-link + hreflang between the two landings only** (`/` ⇄ `/en/`):
  added `hreflang="nl"/"en"/"x-default"` to both hand-authored landings (unambiguous 1:1
  URL correspondence, no slug-mapping issue), plus a small footer language-switch link
  each way ("Dutch" on the en page — deliberately not the Dutch word "Nederlands", to
  keep the en page's own text 100% English). This does **not** extend to the
  pillar/blog/article hreflang (see gap below — that needs the real cross-locale key map,
  assignment E's job).
- **Small generator fix folded in (in scope for D's own "no Dutch on any en page" bullet,
  not the broader E cleanup):** `renderBlogIndex`'s two hard-coded Dutch strings (title/
  description/lead, and the `': de complete gids'` H1-strip hack) are now sourced from
  `pack.ui.blogTitle/blogDescription/blogLead` and a new `pack.pillar.blogHeading` field —
  added to both `nl.mjs` (unchanged rendered output) and `en.mjs`.
- **Second small generator fix (also folded in, not E-scope):** the nav/footer/cta-box
  "Play free" link was hard-coded to `/speel/` for every locale. Added an `appUrl(pack)`
  helper so non-default locales append `?lang=<locale>` — otherwise every en blog/pillar
  page's CTA would silently drop an English reader into the **Dutch** app, which is
  exactly the "zero Dutch" bar the D checklist is testing for.
- **Zero Dutch verified two ways:** (1) grepped the entire built `dist/en/` tree +
  `en/index.html` for a whole-word Dutch lexicon (je, het, een, voor, met, van, niet, dat,
  deze, kinderen, typen, leren, gratis, vinger, ouder, advertenties, thuisrij, munten,
  spelletjes, typecursus, vingerzetting, nauwkeurigheid, toetsenbord, toetsen) — zero
  hits (one false-positive, the English word "kind" inside "the kind kids already...",
  confirmed by inspection); (2) grepped the `en.mjs` source itself — only hits are
  developer comments citing nl's own slugs for assignment E's future key-map, not
  rendered content. Blog index nav links resolve (both spokes + pillar exist; no 404s).
- **`npm test`: 146/146 pass** (`node --test test/*.test.js`, incl. pre-existing
  `en-pack.test.js` and `locale.test.js` from 012/013 — untouched, still green).
  **`npm run build`: clean** (`vite build` succeeds, `dist/en/{index.html,
  learn-typing-for-kids/,blog/}` all present alongside unchanged `dist/index.html` and
  `dist/speel/index.html`).

### Known, expected gap — flagged for 016/017, not fixed here (out of D's scope)

Adding `en` to `LOCALES` exposes the exact gap research/en-locale-scope.md §5.2 predicted:
`gen-content.mjs`'s `head()` builds hreflang alternates by **string-swapping the path
prefix**, assuming identical slugs across locales. Since en slugs genuinely differ
(`/en/learn-typing-for-kids/` vs. `/leren-typen-voor-kinderen/`), **every generated nl
pillar/blog/article page now emits one broken hreflang alternate to a non-existent en
URL, and vice versa** (verified: nl pillar's `en` alternate resolves to
`/en/leren-typen-voor-kinderen/`, which 404s). This is explicitly assignment E's fix (the
cross-locale key map), which is `blocked_by: [D]` and was pre-anticipated with matching
hreflang keys in 014 (`pillar`, `games-listicle`, `age`) for exactly this reason. **Do
not deploy this branch to production standalone** — merge/deploy D and E together (or in
immediate sequence) so the hreflang cluster is never live in the broken state. The
sitemap also does not yet list `/en/` or the en landing's alternates (E's job, §5.3);
the en spoke/pillar/blog URLs are already in `sitemap.xml` since those come from the
generator's normal per-locale loop.

### Proposal for the dispatcher (not actioned here — priority 4, per protocol)

Consider a small automated "no-Dutch-on-en-pages" regression test (grep the built
`dist/en/` tree against a Dutch lexicon) so future en content/generator changes can't
silently reintroduce Dutch text without a human running the manual check again. Not
built here — 017's launch QA gate already covers this check once, and this would be new
scope beyond D's checklist.
