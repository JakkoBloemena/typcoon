# Typcoon — SEO & Growth Plan (max-optimization playbook)

> **The one fact that governs everything (from REVENUE.md):** revenue is *traffic-bound*.
> At ~€0,46 per game-start, 10× the visitors ≈ 10× the money; conversion tweaks are 2–4×.
> **Distribution is the lever, not price.** So this plan optimizes for one thing: qualified
> visitors — parents (the buyer) and kids (the player) — at the lowest marginal cost.
> The dominant free, compounding channel for a kids' typing tool is **organic search +
> the schools channel**. Paid UA does not pay back yet (kids-app CPI €0,50–2 vs €0,46 ARPU).

**The buyer is a parent; the player is a child (8–12).** We must rank for *both* intents:
the parent's research queries ("gratis leren typen", "typecursus kind") **and** the kid's
play queries ("typspelletjes", "gratis typspel"). Our unique wedge is the bridge between
them: a **free tycoon game that actually teaches touch-typing** — fun enough for the kid,
credible enough for the parent.

---

## 0. TL;DR — the priority stack

1. **Content / topical authority (biggest lever).** One page can't rank for a category.
   Build a Dutch content hub around "leren typen voor kinderen" (~12–15 articles). Reuse
   the 4 articles that already exist in the typie repo as a head start.
2. **Technical SEO is 90% done** — finish the last 10% (auto-sitemap, Article/Breadcrumb/
   Organization schema, CWV, Search Console). Cheap, do it first so content indexes fast.
3. **Schools channel** — a free classroom tier + a teacher landing page + outreach. Warm,
   cheap, high-LTV, and a strong backlink/word-of-mouth source (REVENUE.md §5).
4. **Internationalization** — nl first (home-field, "typediploma" culture, prove the
   funnel), then **en** (largest market), then de/es/fr. hreflang. A 3–5× TAM multiplier.
5. **Off-page** — directories, education/parenting links, creator gifting, digital PR, and
   the typie.fun 301 (already live) passing residual equity.

SEO is a 3–9 month compounding play. Technical + content this quarter; links + i18n next.

---

## 1. Where we stand (current audit)

**Already shipped (good foundation) — `/index.html`, `/public/`:**
- Solid on-page: unique `<title>`, meta description, `<link rel=canonical>`, theme-color,
  self-hosted favicon.
- Full Open Graph + Twitter card + `og.png`.
- Structured data: `VideoGame` + `FAQPage` JSON-LD.
- `robots.txt` (allow all + sitemap ref), `sitemap.xml`.
- Clean, semantic landing (`h1` + 3 `h2`s), Dutch, `lang="nl"`.
- Self-hosted fonts (woff2) — fast + GDPR-clean, no render-blocking third parties.
- `/speel/` (the app) is `noindex` so the landing carries ranking. **Correct.**
- Vercel `cleanUrls` + `trailingSlash` + security headers + immutable asset caching.
- typie.fun now 301-redirects to typcoon.com → residual link equity flows in.

**Gaps this plan closes:**
- ❌ **Only one indexable page.** No blog, no topic pages → can't rank for the category.
- ❌ **One language.** nl only; the engine is language-neutral but UI+content aren't.
- ❌ **Sitemap has 1 URL**, hand-maintained. Needs generation as pages grow.
- ❌ **No `Organization` / `WebSite` schema**, no `BreadcrumbList`/`Article` (needed for blog).
- ❌ **No off-page motion** (links, schools, directories, PR).
- ❌ **No measurement wired** (Search Console, rank tracking, privacy-first analytics).
- ⚠️ **CWV / mobile** unverified. The *game* needs a physical keyboard (desktop), but the
  *landing* must be flawless on mobile — parents research on phones.

---

## 2. Keyword & search-demand strategy (Dutch-first)

> Honest note: exact volumes need a keyword tool (Google Keyword Planner / Ahrefs /
> Semrush) — get one before finalizing the calendar. Below is the intent map + relative
> priority; validate volumes, then sort by volume × intent × attainability.

**Primary money terms (parent intent, commercial):**
- `gratis leren typen` / `gratis typen leren` — our sweet spot (free + intent). **P0.**
- `leren typen kinderen` / `typen leren kind`
- `typecursus kind` / `typecursus kinderen` (commercial; competitors bid here)
- `blind typen leren`
- `typediploma` (huge in NL — a cultural expectation; own this topic)

**Player/fun terms (kid intent, high volume, lower commercial):**
- `typspelletjes` / `typ spelletjes` / `typspel` — position us #1 as *the* typing game
- `gratis spelletjes typen`
- `nitro type` (competitor brand — write a comparison, capture the alternative-seekers)

**Long-tail (high intent, low competition — win these first):**
- `leren typen groep 6` / `groep 7` / `groep 8` (Dutch school grades)
- `op welke leeftijd leren typen`
- `hoe leer je blind typen`
- `welke vinger welke toets` / `vingerzetting toetsenbord` (ties to our onboarding feature!)
- `typen oefenen kind`
- `hoe lang duurt het om te leren typen`
- `gratis of betaalde typecursus`

**Competitor set (NL):** TypeTopia, De Typetuin, Typ10, Pro-8 / Typ Wereld, Typ Top —
mostly *paid* courses. Free tools: typ.nl, leren-typen.nl. International: TypingClub,
typing.com, Nitro Type (games), Keybr/Monkeytype (adults). **Our angle vs all of them:**
"gratis én leuk (tycoon-game) én het leert écht typen (adaptieve engine)." The paid courses
can't say "gratis"; the free tools can't say "leuk spel"; the games (Nitro Type) can't say
"leert je van nul af aan blind typen." We sit in the empty middle.

---

## 3. Content plan — topical authority (the growth engine)

**Structure: hub-and-spoke.** One pillar page that Google reads as "this site is *about*
learning to type," linked to/from focused spoke articles. Internal links flow authority to
the pillar and to `/speel/`-CTA pages.

**Pillar (P0):** `/leren-typen-voor-kinderen/` — a long, genuinely useful guide (method,
age, home row, practice habits, free vs paid, diploma) that naturally CTAs into the game.
This is the page we want ranking for the broad head terms.

**Spokes (target one long-tail each; ~800–1500 words; real value, not thin):**
1. Gratis leren typen: kan een kind dat écht? *(→ gratis leren typen)*
2. Op welke leeftijd kan een kind leren typen? *(reuse typie article)*
3. Blind typen leren: 10 tips die werken *(reuse typie article)*
4. Heb je een typediploma nodig? *(reuse typie article)*
5. Gratis of betaalde typecursus — wat kies je? *(reuse typie article)*
6. Welke vinger hoort bij welke toets? (vingerzetting) — *links to our color-coded onboarding.*
7. Leren typen in groep 6 / 7 / 8 (one article, grade-segmented)
8. De beste gratis typspelletjes voor kinderen (listicle — we rank #1 on it, honestly)
9. Hoe lang duurt het om te leren typen?
10. Typen oefenen: waarom 10 minuten per dag genoeg is *(ties to our streak/daily hook)*
11. Blind typen zonder naar het toetsenbord te kijken
12. Typles op school of thuis? (school angle → feeds the schools channel)
13. Nitro Type alternatief: een typspel dat je van nul leert typen (comparison)
14. Typen leren met een spelletje: werkt dat? (the pedagogy behind Typcoon — E-E-A-T)

> **Quick win:** the typie repo already contains 4 of these (`blog/typediploma-nodig`,
> `blog/gratis-of-betaalde-typecursus`, `blog/op-welke-leeftijd-leren-typen`,
> `blog/blind-typen-leren-tips`) plus a static blog generator (`scripts/gen-blog.mjs`).
> Port that generator + rewrite the 4 articles for the Typcoon brand/voice = 4 indexable
> pages in an afternoon. Then write the pillar + the rest on a cadence.

**Cadence:** 1–2 articles/week. Every article: one target query in the `<title>`, `<h1>`,
first 100 words, URL slug, and image alt; a clear internal link to the pillar + a "Speel
gratis"-CTA to `/speel/`; `Article` + `BreadcrumbList` schema; an author/reviewer byline
(E-E-A-T — "geschreven door [naam], met een adaptieve leer-engine"). Refresh top pages
quarterly (freshness).

**E-E-A-T / YMYL note:** kids' education leans "your-money-or-your-life-adjacent" — Google
weighs trust. Show a real author, an "over ons"/method page explaining the pedagogy
(spaced repetition, accuracy-first), privacy/no-ads/no-in-app-purchase promises, and
parent-facing transparency. This is also our differentiation, so it's free to lean in.

---

## 4. Technical SEO checklist (Vite + Vercel)

**Do now (cheap, unblocks indexing):**
- [ ] **Google Search Console + Bing Webmaster** — verify `typcoon.com`, submit
      `sitemap.xml`. This is the single most important setup step.
- [ ] **Auto-generate `sitemap.xml`** in the build (port/extend typie's `gen-*` scripts) so
      every landing + blog URL (+ `lastmod`) is included. Add blog + pillar as they ship.
- [ ] **`WebSite` + `Organization` JSON-LD** on the homepage (name, logo, sameAs socials).
      Optional `SearchAction` (sitelinks searchbox) later.
- [ ] **`Article` + `BreadcrumbList` schema** template for every blog post.
- [ ] Keep `/speel/` `noindex,follow` (it is) — the app isn't a landing page.
- [ ] Ensure a real **404** and that thin/utility pages (`/prefs/`) are `noindex` (they are).

**Performance / Core Web Vitals (parents on mobile):**
- [ ] Run PageSpeed Insights / Lighthouse on `/` and every blog template; target LCP < 2.5s,
      CLS < 0.1, INP < 200ms. Static + self-hosted fonts already help.
- [ ] `font-display: swap` (already), preload the LCP font, `width/height` on all images
      (no layout shift), `loading="lazy"` below the fold, compress `og.png`/illustrations
      (AVIF/WebP where raster), inline critical CSS if needed.
- [ ] `rel="preconnect"` only if any third-party remains (aim: none — privacy + speed).

**Crawl / indexation hygiene:**
- [ ] One canonical host: force `www` → apex (or vice-versa) + `https` (Vercel handles).
- [ ] `cleanUrls`/`trailingSlash` already consistent — keep internal links matching to
      avoid redirect chains.
- [ ] Descriptive, keyword-first slugs (`/leren-typen-voor-kinderen/`, not `/blog/post-1/`).
- [ ] Internal linking: pillar ↔ spokes ↔ `/speel/`; no orphan pages.

**Mobile & accessibility (both are ranking + UX):**
- [ ] Landing must be perfect on phones (parents browse there); the *game* honestly needs a
      keyboard — say so on mobile with a friendly "pak een laptop erbij" (already in-app),
      but let the landing fully inform + capture the parent (email/reminder) on mobile.
- [ ] Semantic headings, alt text, focus states, color contrast (also helps SEO signals).

---

## 5. Internationalization — the same five locales as typie (a core pillar, not an add-on)

**Ship all five languages typie ran: `nl · en · de · es · fr`.** This is one of the biggest
traffic levers we have — it multiplies the addressable search market 3–5× — and the hard
part is already done: the learning engine is **language-neutral**, so only the **UI strings +
content + keywords** are per-locale (typie proved this exact structure). We reuse the same
data-pack-per-language approach here.

**Sequence by ROI (all five are in scope; this is just the order of rollout):**
1. **nl (now):** home-field advantage — the "typediploma" culture means Dutch parents
   *actively search and pay* for typing courses, with less English-competitor noise. Prove
   the funnel here first.
2. **en (next):** by far the largest search market. Translate UI + rewrite content for en
   intent ("typing games for kids", "learn to type free", "typing practice for kids").
   Different competitors (TypingClub, typing.com, Nitro Type).
3. **de, es, fr:** roll out once en proves the playbook — same engine, translated data pack +
   content per locale, localized keyword research per market (each language has its own
   competitor set and search phrasing; don't just machine-translate the Dutch keywords).

**Implementation (do it right so it compounds, like typie):**
- Locale-prefixed paths — `/` (nl, `x-default`), `/en/`, `/de/`, `/es/`, `/fr/`.
- Full **hreflang** cluster on every page: each URL references all five locale variants +
  `x-default`, reciprocally. This is what stops Google from treating them as duplicates and
  serves the right language per country.
- Per-locale `<title>`/meta/OG, `lang` attribute, `inLanguage` in JSON-LD, and **per-locale
  content** (translate the pillar + spokes, and research keywords natively per language).
- **Per-locale sitemaps** (or one sitemap with `<xhtml:link hreflang>` alternates), all
  referenced from `robots.txt`.
- **Localized OG images** and locale-appropriate examples where it helps CTR.
- **Never ship a half-translated locale** — mixed-language pages hurt trust and rankings.
  Launch each language whole (UI + landing + at least the pillar), then fill its blog.
- The build should generate all locale landings + blogs from data packs (extend typie's
  `gen-landings.mjs` / `gen-blog.mjs`), so adding a language stays "add a data pack," not
  "rewrite the site."

---

## 6. Off-page & distribution (links + reach)

**Schools channel (highest-value, warm):** a free **classroom/teacher tier** + a dedicated
`/voor-scholen/` (or `/leerkrachten/`) landing. Outreach to Dutch teacher communities and
lesson-material sites; get listed in school-resource directories. Teachers linking from
school sites = high-authority, on-topic backlinks *and* the €99–299 license business
(REVENUE.md §5). This is the best €/effort backlink source we have.

**Directories & listings (easy links, referral traffic):**
- Educational-game & free-game directories, "beste gratis educatieve spelletjes" listicles,
  Dutch parenting portals/blogs, homeschool communities.
- Kid-safety review sites (Common Sense Media-style) — our no-ads/no-IAP/privacy stance is a
  strong pitch for a favorable review + link.
- Product Hunt / Show HN style launches (one-time spike + a link).

**Creator gifting (REVENUE.md §5):** Dutch family & "educatieve apps" YouTubers/TikTokers;
gift family-unlock codes; provide a clean 30-second demo. Cheap, targeted, and drives both
traffic *and* branded search ("typcoon") which lifts rankings.

**Digital PR (link magnets):** a free, shareable asset that journalists/schools cite — e.g.
a "Nationale Typtest" mini-tool or a short report on kids' typing speed by grade. One good
PR hit = dozens of authority links you can't buy.

**Community (careful, no spam):** genuinely helpful answers in NL parenting/teacher forums
and relevant subreddits when typing questions come up — value first, link only if it helps.

**Brand consistency:** same NAP-style brand entity everywhere (Typcoon, logo, socials) to
build the entity Google associates with "kids typing game."

---

## 7. Measurement & tooling

**Wire before content ships (so you learn from day one):**
- **Google Search Console** (queries, impressions, CTR, position, coverage, CWV) — the
  source of truth. **Bing Webmaster** too.
- **Privacy-first analytics** (kids' site → avoid GA4 if possible): Plausible/Umami, or the
  cookieless pageview endpoint typie already had. Track the funnel from REVENUE.md:
  `visit → game-start → engaged (≥2 sessions) → parent account/opt-in`.
- **Rank tracking** for the ~20 target keywords (Ahrefs/Semrush/cheaper: SerpRobot).

**KPIs (leading → lagging):**
- Leading: indexed pages, keywords ranking top-20, impressions, avg position.
- Mid: organic sessions, game-starts from organic, branded-search volume.
- Lagging: parent opt-ins/accounts, (later) unlock conversions, school leads.

Review Search Console monthly: promote near-miss pages (positions 5–15) with better titles/
internal links/content depth — the cheapest ranking gains you'll find.

---

## 8. Prioritized roadmap

| Phase | Weeks | Focus | Deliverables |
|-------|-------|-------|--------------|
| **0 — Foundations** | 1 | Technical + measurement | Search Console/Bing verified + sitemap submitted; auto-sitemap in build; `Organization`/`WebSite` schema; CWV audit + fixes |
| **1 — Content seed** | 1–6 | Rank for the category | Port the 4 typie articles (Typcoon voice) + blog template with `Article`/`Breadcrumb` schema; write the pillar; internal linking |
| **2 — Content depth + schools** | 4–12 | Topical authority + warm links | Reach ~12–15 articles; `/voor-scholen/` landing + free classroom tier + teacher outreach; directory submissions |
| **3 — Internationalization** | mo. 3–6 | TAM multiplier | en locale (UI + content + hreflang); per-locale sitemaps; then de/es/fr |
| **4 — Links & PR (ongoing)** | continuous | Authority + reach | Creator gifting, digital-PR asset, reviews/directories, monthly Search Console-driven optimization |

---

## 9. Honest caveats & what NOT to do

- **SEO is slow.** Expect little for 6–12 weeks, then compounding. Don't judge week 2.
- **No live volume data here.** Validate keywords with a real tool before over-investing in
  any single article; I've prioritized by intent + attainability, not measured volume.
- **Don't** keyword-stuff, spin thin AI pages, buy links, or cloak. For a kids' YMYL-
  adjacent site, a Google trust penalty is existential — every page must earn its ranking by
  being genuinely useful. Our real differentiation (free, fun, actually teaches, no ads/IAP,
  privacy) *is* the content strategy; lean on truth, not tricks.
- **Kid-safety is also SEO:** no ads, no third-party trackers, no dark patterns → better
  reviews, better links, better trust signals. Keep it that way.
- **The game needs a keyboard** — don't chase mobile *gameplay* rankings; chase mobile
  *parent-research* rankings and convert the parent (email/opt-in) on mobile.
