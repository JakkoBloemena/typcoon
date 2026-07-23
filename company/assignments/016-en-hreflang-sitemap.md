---
id: 016
title: Multi-locale hreflang + sitemap correctness (page-key map)
owner: developer
status: needs_verification
priority: 4
blocked_by: [015]
opened_by: ceo
---

## Goal

Materializes draft **E** of research/en-locale-scope.md §7: cross-locale page-key
map in gen-content.mjs so hreflang alternates resolve each locale's actual slug (no
false alternates), full reciprocal cluster incl. x-default on both landings,
sitemap.xml with xhtml:link alternates, and the generator's hard-coded Dutch strings
moved into the pack ui block.

## Acceptance criteria

The checklist under "### E —" in research/en-locale-scope.md §7 is normative.

## Notes

Terminal state needs_verification.

### Delivered (developer, 2026-07-23)

Built to the normative "### E —" checklist in research/en-locale-scope.md §7. Worked in
worktree `C:\companies\typcoon-lanes\b016` (branch `build/016`); `npm install` run first
(node_modules was missing). No dev server needed — this is a static-generator + build-time
fix, verified against `dist/` output directly.

**Cross-locale page-key map (§5.2).** Added `buildKeyMap()`/`KEY_MAP` to
`scripts/gen-content.mjs`: every renderable that has a `key` field (pillar, articles,
pages) is registered as `key -> { locale -> actual rendered URL }`; the hand-authored
landings (`/`, `/en/`) are registered too, under key `'home'`, via an explicit `LANDINGS`
map (§5.3's "register home in the map regardless of who renders the HTML"). `head()`'s
old logic — string-swapping the locale prefix and assuming identical slugs — is gone,
replaced by `resolveAlternates(key)` which looks up the real map. Added explicit `key`
fields to `scripts/content/nl.mjs` and `scripts/content/en.mjs`: `'pillar'` (both packs'
pillar), `'age'` (nl `op-welke-leeftijd-leren-typen` ↔ en `what-age-to-learn-typing`),
`'games-listicle'` (nl `beste-gratis-typspelletjes-kinderen` ↔ en
`free-typing-games-for-kids`) — these three match 014's pre-planned hreflang keys exactly.
Also added `'nitro'` to nl's `nitro-type-alternatief` (014's documented fast-follow spoke,
no en counterpart yet — clusters nl-only today, will auto-reciprocate the day the en
article lands, no code change needed then). `'blog'` is a structural key added directly
in the map builder (both locales always have a blog index). Verified on the pillar and
one spoke (`age`): nl pillar's `en` alternate now resolves to
`https://typcoon.com/en/learn-typing-for-kids/` (previously the 404ing
`/en/leren-typen-voor-kinderen/`); nl's `op-welke-leeftijd-leren-typen` now correctly
alternates to `/en/blog/what-age-to-learn-typing/`.

**Reciprocal clusters + x-default (checklist bullet 2).** For every clustered key, each
locale's page emits one `<link rel="alternate" hreflang>` per locale that has that key,
plus `x-default` pointing at the nl (DEFAULT) URL — verified reciprocal on `pillar`,
`age`, `games-listicle`, `blog`, and `home` (identical alternate sets on both sides of
each pair). Keys with only one locale (the 7 nl-only articles with no `key` field at all,
`voor-scholen`, and `nitro` until its en counterpart ships) now correctly emit **no**
alternate to a locale that doesn't have that page — confirmed by diffing every changed
`public/*/index.html` against the pre-change committed output: the *only* lines that
changed on any nl-only page are the hreflang `<link>` lines (the previously-broken `en`
alternate is gone; nl-only pages that had no counterpart lose the block entirely rather
than keep a dangling entry).

**Both landings carry the full cluster (bullet 3).** `/index.html` and `/en/index.html`
already had a correct, reciprocal, hand-authored `nl`/`en`/`x-default` hreflang block
since 015 (unambiguous 1:1 correspondence, no slug-mapping needed there) — confirmed
still true and unchanged; now also participate in the page-key map (key `'home'`) so the
sitemap can carry their alternates too (bullet 4).

**sitemap.xml with xhtml:link alternates (bullet 4).** `sitemap()` now declares
`xmlns:xhtml="http://www.w3.org/1999/xhtml"` and emits one `<xhtml:link rel="alternate"
hreflang=… href=…>` per cluster entry (including a self-reference and `x-default`) for
every URL that has a `key` — driven by the same `KEY_MAP`/`resolveAlternates()` as
`head()`, so sitemap and per-page hreflang can never drift apart. `/` and `/en/` are now
both explicit sitemap entries (previously `/en/` was entirely missing from the sitemap;
only `/` was hardcoded) with their full reciprocal alternates. `robots.txt` unchanged —
still points at the single `sitemap.xml`. URL count: 22 (was 21; +1 for the newly-added
`/en/` landing entry).

**Hard-coded Dutch strings in the generator (bullet 5).** Already fixed in 015's folded-in
generator work (`blogTitle`/`blogDescription`/`blogLead`/`pillar.blogHeading` sourced from
the pack `ui`/`pillar` blocks) — re-verified here: grepped `gen-content.mjs` for any
remaining literal Dutch/accented strings or hard-coded blog-index copy; none found. No
further change needed for this bullet.

**Validation (bullet 6).** Wrote `scripts/check-hreflang.mjs` — walks every `*.html` file
in the built `dist/` tree plus `dist/sitemap.xml`, collects every `<link
rel="alternate" hreflang>` / `<xhtml:link rel="alternate" hreflang>`, and asserts each
`href` resolves to a file that was actually built. Sanity-checked the checker itself: fed
it a deliberately broken sitemap alternate first (it failed correctly, 2 broken/64
checked), then restored the real build (passes clean). Final run against the full built
`dist/`: **`check-hreflang: PASS — 64 hreflang alternates checked across dist/, all
resolve.`** Not added to `npm test` (that suite's count is a tracked invariant — see
below); it's a standalone script, run via `node scripts/check-hreflang.mjs` after
`npm run build`.

**Non-blocking observation from 015 (fixed, folded in — it was in this file anyway).**
Added a `homeUrl(pack)` helper (`prefix(pack.locale) + '/'`) and replaced every prior
`p(pack) || '/'` / local `p || '/'` home-link usage (nav brand link, footer home link, and
all four breadcrumb-trail root URLs) with it. En generator pages now emit `/en/` directly
instead of `/en` (previously relied on prod's `trailingSlash` 301; still correct there,
but no longer needed and no longer wrong locally). Confirmed via diff: this also
incidentally fixed the `BreadcrumbList` JSON-LD's "Home" `item` URL on every en generator
page (was `https://typcoon.com/en`, now `https://typcoon.com/en/`) — a bonus correctness
fix from routing through one helper instead of two inconsistent ones.

**nl rendered output unchanged except hreflang/sitemap.** Diffed every changed file in
`public/` against the pre-016 committed baseline: nl pages' diffs are hreflang-`<link>`
lines only (no body/content/schema changes besides the `BreadcrumbList` item-URL fix
described above, which only affects en pages since only en's home link changed). Full
`public/` diff reviewed line by line — no unexpected changes.

**`npm test`: 146/146 pass** (`node --test test/*.test.js` — same command, same count as
015's verification; no test files added or modified). **`npm run build`: clean** (`vite
build` succeeds, no warnings/errors).

Files touched: `scripts/gen-content.mjs` (key-map, `head()`, `sitemap()`, `homeUrl()`,
Run section), `scripts/content/nl.mjs` (+`key` fields on pillar/age/games-listicle/nitro),
`scripts/content/en.mjs` (+`key` fields on pillar/age/games-listicle, header comment
updated), `scripts/check-hreflang.mjs` (new), regenerated `public/**/index.html` +
`public/sitemap.xml` (generator output, committed per existing repo convention).
