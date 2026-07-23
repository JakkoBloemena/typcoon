---
id: 016
title: Multi-locale hreflang + sitemap correctness (page-key map)
owner: developer
status: done
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

## Verification (2026-07-23, tester)

Verified independently in worktree `C:\companies\typcoon-lanes\v016` (branch
`verify/016`, off `build/016`), against the normative "### E —" checklist in
research/en-locale-scope.md §7. `npm install` run first (node_modules was missing, 22
packages added). Did not trust the delivery notes' side-claims — re-derived every
bullet from the built `dist/` output and from diffing raw commits myself.

**`npm test`: 146/146 pass**, exact count reproduced (`node --test test/*.test.js`,
`# tests 146 / # pass 146 / # fail 0`). **`npm run build`: clean** — `vite build`,
0 warnings/errors, `gen-content: 22 URLs (pijler + blog + 15 artikelen + 1 pagina's) +
sitemap`.

**Bullet 1 — cross-locale page-key map, resolves actual slugs.** Read
`buildKeyMap()`/`resolveAlternates()` in `scripts/gen-content.mjs`: keys collected from
`LANDINGS` (hand-authored `/`, `/en/`) plus every pack's `pillar`/`articles`/`pages` that
carry a `key`. Confirmed on the pillar and (going beyond "one spoke") on all three
clustered spokes: nl pillar's `en` alternate resolves to
`https://typcoon.com/en/learn-typing-for-kids/` (real slug, not a locale-prefix guess);
same pattern independently confirmed for `age`
(`op-welke-leeftijd-leren-typen` ↔ `what-age-to-learn-typing`) and `games-listicle`
(`beste-gratis-typspelletjes-kinderen` ↔ `free-typing-games-for-kids`). PASS.

**Bullet 2 — reciprocal clusters + x-default; no false alternates.** Dumped the
`hreflang` `<link>` block from both sides of every cluster in the built `dist/`
(pillar, age, games-listicle, blog index, home) — identical `{nl, en, x-default}` sets
on both sides in every case, `x-default` always the nl URL. Then checked every nl-only
page for false alternates: all 10 keyless blog articles
(`blind-typen-leren-tips`, `gratis-leren-typen-kind`, `gratis-of-betaalde-typecursus`,
`hoe-lang-duurt-leren-typen`, `leren-typen-groep-6-7-8`, `typediploma-nodig`,
`typen-leren-met-een-spelletje`, `typen-oefenen-10-minuten-per-dag`,
`typles-op-school-of-thuis`, `welke-vinger-welke-toets`) plus `voor-scholen` emit **no**
hreflang block at all (correct — no `key`, no cluster, no dangling link).
`nitro-type-alternatief` (has `key:'nitro'`, en counterpart doesn't exist yet) emits only
`self` + `x-default`, no `en` alternate — correct, not a false one. Cross-checked against
the pre-016 commit (`cb2e166`): `git diff cb2e166 ac1ddce -- public/` shows the nl-only
articles *used* to carry a false `en` alternate pointing at a 404ing guessed URL (e.g.
`nitro-type-alternatief` used to declare
`hreflang="en" href=".../en/blog/nitro-type-alternatief/"`, which 016 correctly removes)
— confirms the bug this assignment fixes was real and is gone. PASS.

**Bullet 3 — both landings carry the full cluster.** `dist/index.html` and
`dist/en/index.html` both emit `{nl: https://typcoon.com/, en: https://typcoon.com/en/,
x-default: https://typcoon.com/}` — reciprocal, correct x-default. Confirmed via
`git diff cb2e166 ac1ddce` that the hand-authored landing source files
(root `index.html`, presumably `public/en/index.html` equivalent — not present as a
separate rendered artifact touched by this commit) were **not** modified by 016 (no
`index.html`/`en/index.html` hand-authored source in the commit's file list beyond the
generator-produced tree) — consistent with the notes' claim these blocks were already
correct since 015 and only now additionally participate in the sitemap. PASS.

**Bullet 4 — sitemap.xml.** `dist/sitemap.xml` declares
`xmlns:xhtml="http://www.w3.org/1999/xhtml"`; every clustered `<url>` carries
`<xhtml:link rel="alternate">` entries including a self-reference and `x-default`,
matching the per-page `<link>` blocks exactly (both driven by the same `KEY_MAP`, so
they structurally cannot drift). `/en/` is present as an explicit entry (`<loc>
https://typcoon.com/en/</loc>`) with its full cluster — confirmed via `git diff` this
entry did not exist pre-016. Counted 22 `<url>` entries total (matches the
build-log-reported 22 URLs; pre-016 sitemap had 21, `+1` for `/en/`, as claimed).
`robots.txt` unchanged: `Sitemap: https://typcoon.com/sitemap.xml`, still the one file.
PASS.

**Bullet 5 — hard-coded Dutch strings moved to pack `ui`.** Read the full
`gen-content.mjs`: every rendering function (`nav`, `footer`, `ctaBox`, `faqBlock`,
`breadcrumb`, `renderBlogIndex`) sources copy exclusively from `pack.ui.*` /
`pack.pillar.*` / pack fields — no literal Dutch/English UI strings in the generator
itself (only Dutch in code *comments*, which don't render). `blogTitle`,
`blogDescription`, `blogLead`, `pillar.blogHeading` are present and localised in both
`scripts/content/nl.mjs` and `scripts/content/en.mjs` with distinct nl/en values. This
was actually 015's fix (re-verified here, not a new 016 change) — correctly not
re-claimed as new work by the developer. PASS.

**Bullet 6 — validation script + build.** Read `scripts/check-hreflang.mjs` in full:
it walks every built `.html` file plus `sitemap.xml`, collects every
`<link>`/`<xhtml:link rel="alternate" hreflang>`, and asserts the `href` resolves to a
file that was actually built. Ran it clean: `check-hreflang: PASS — 64 hreflang
alternates checked across dist/, all resolve.` — matches the delivery's claimed count.
Sanity-checked the checker myself (not trusting the dev's word): edited a real `href` in
a built `dist/en/index.html` to a nonexistent path — checker correctly failed
(`FAIL — 1/64 alternates broken`, exact file/hreflang/href reported); restored via a
clean `npm run build` re-run and the checker passed again. Worktree confirmed diff-clean
of the experiment afterward (rebuild churn was CRLF/LF line-ending noise only —
`git diff` showed 0 real content lines — `git checkout -- public/` used to fully
restore). One nuance for the record, not a failure: the checker validates *resolution*
(every href points at a real file) but does not itself assert *reciprocity* — reciprocity
was verified by hand in bullet 2 above and holds everywhere checked; the checklist's
"reciprocity checks clean (e.g. a validator or a scripted assertion)" wording is
satisfied by the combination of the scripted resolution-check plus the manual reciprocity
verification, but a future tightening could fold reciprocity assertions into the script
itself. Not filing as a defect — noting for awareness only. `npm run build`: clean
(reconfirmed above). PASS.

**Additional independent checks (beyond the checklist, nothing broke):**
- Diffed every changed file in `public/` between `cb2e166` (pre-016) and `ac1ddce` (016)
  line by line: on the nl side, changes are hreflang-`<link>`-line-only (fixed or removed
  false alternates, as above) plus the `sitemap.xml` restructure. On the en side, the
  *only* additional change is the documented `homeUrl()` fix: `/en` → `/en/` in the nav
  brand link, breadcrumb trail, and footer home link on every en generator page, which
  also fixes the `BreadcrumbList` JSON-LD "Home" `item` URL the same way. No unexpected
  content/copy/schema changes anywhere.
- Content packs: confirmed `key` fields present exactly where claimed
  (`pillar`/`age`/`games-listicle` in both `nl.mjs` and `en.mjs`; `nitro` in `nl.mjs`
  only), no duplicate keys, no accidental key collisions.
- `vercel.json` unchanged (`trailingSlash: true` still active in prod, so the local-only
  `/en` no-trailing-slash SPA-fallback quirk flagged in 015 is now moot anyway since
  generator output itself emits `/en/` directly).

**Verdict: PASS on all six E-checklist bullets.** Every claim in the delivery notes was
independently re-derived from the built output and the raw commit diff, not taken on
trust. No defects found. Status set to `done`.

No probe script needed beyond the sanity-check of the existing `check-hreflang.mjs`
(performed in-place against `dist/`, then reverted via a fresh `npm run build`; no new
file committed since nothing needed fixing).
