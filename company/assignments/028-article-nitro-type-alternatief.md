---
id: 028
title: Write nl article — Nitro Type alternatief (competitor capture)
owner: developer
status: done
priority: 4
blocked_by: [027]
opened_by: ceo
---

## Goal

Materializes Assignment C of research/content-batch-2-scope.md §3: slug
`nitro-type-alternatief` — a fair comparison, not a takedown. Nitro Type = racing
practice for kids who already type; Typcoon = teaches from zero. Help the reader
choose by where their child is now.

## Acceptance criteria

The shared A–D checklist in research/content-batch-2-scope.md §3 is normative,
plus §3-C's extra criteria: zero disparagement, zero false claims about the
competitor (guardrail 7 — accuracy is existential on a trust-sensitive site).

## Notes

blocked_by [027] is serialization only (same nl.mjs array). Terminal state
needs_verification.

## Developer notes (2026-07-23)

Article added to `scripts/content/nl.mjs` `articles` array (slug
`nitro-type-alternatief`), matching the existing field shape exactly.

- **Word count:** 922 words (lead + section bodies + h2 headings + FAQ,
  measured programmatically) — within the 800–1500 range.
- **Target term placement:** "Nitro Type alternatief" appears in the title,
  h1 and once naturally in the lead's first sentence; "Nitro Type" (the bare
  brand/product term) appears naturally throughout since the whole article
  is a comparison — that repetition is structurally required by the genre,
  not stuffing of the money phrase. No forced repetition of "alternatief".
- **Frame delivered exactly as specified:** the article splits on where the
  child is *now* — a 3-question checklist ("Check dit eerst: kan je kind al
  typen?") routes a not-yet-typing child to Typcoon as the from-zero worked
  example, and explicitly, non-grudgingly affirms Nitro Type as a good
  choice for a child who already types and wants speed/fun ("Kan al typen en
  wil vooral snelheid? Nitro Type is een prima keuze" — no hedging, no
  backhanded praise).
- **Guardrail 7 self-check:** re-read every sentence naming Nitro Type for
  disparagement — found none. Weaknesses are framed as "waar Nitro Type van
  uitgaat" (what it assumes/is built for), never as a flaw or inferiority;
  strengths (fun, motivating, team competition, genuinely good speed
  practice) are stated plainly and given their own section. No comparison
  claims Typcoon is "better" — only that the two serve different stages.
- **Competitor claims made and their dated sources (checked 2026-07-23):**
  1. *Nitro Type is a free, real-time competitive typing race game (race
     against/with others, cars).* — official site
     [nitrotype.com](https://www.nitrotype.com/) (fetched 2026-07-23,
     title/header confirms "Race Your Friends"); corroborated by
     [Nitro Type Fandom wiki](https://nitro-type-guideandtips.fandom.com/wiki/Nitro_Type)
     (accessed via search 2026-07-23).
  2. *Garage/car progression funded by in-race earnings, unlockable/
     customizable cars.* — Fandom wiki (accessed 2026-07-23) and
     [nitrotype.net beginner's guide](https://nitrotype.net/what-is-nitro-type-a-beginners-guide/)
     (accessed 2026-07-23).
  3. *Team races / team leaderboards exist alongside individual ("Top
     Racers"/"Top Teams").* — Fandom wiki (accessed 2026-07-23).
  4. *Free to play; optional paid "Gold Membership" removes ads and
     unlocks extra cars/cosmetics, not required to play or improve.* —
     [Modulo review](https://www.modulo.app/all-resources/nitro-type-review)
     (fetched 2026-07-23: "free to play" with ads for free users, paid tier
     removes them) and Fandom wiki (accessed 2026-07-23).
  5. *Nitro Type does not teach touch-typing fundamentals from scratch
     (no finger-placement/home-row instruction); it assumes the player
     already knows the keyboard and is best used as speed/fluency practice
     once basics are in place.* — search-aggregated review consensus
     (accessed 2026-07-23, sources include
     [nitrotype.net beginner's guide](https://nitrotype.net/what-is-nitro-type-a-beginners-guide/)
     and the Modulo review above: "start with basic typing skills before
     introducing Nitro Type"; "best suited for learners who thrive in
     dynamic, competitive environments," not those needing "a more
     structured, step-by-step instructional approach"). This is the load-
     bearing factual claim for the whole article's frame, and it is the one
     most corroborated across independent sources.
  6. *NL context: Nitro Type is referenced in the Dutch typing-education
     space as a "leuke oefensite."* — already verified in
     research/content-batch-2-scope.md §1c, citing
     [10vingers.nl](https://10vingers.nl/leren-typen/nitro-type-racer-is-ook-een-leuke-oefen-site)
     (checked by product-owner 2026-07-22, reused here rather than
     re-fetched); reflected in the article as "in Nederland komt de naam
     regelmatig voorbij."
  No claim about Nitro Type in the article goes beyond what these sources
  support; nothing about pricing/mechanics was invented or guessed.
- **Product claims about Typcoon match code** (reused, not re-verified here,
  from the already-shipped 026/027 articles' established phrasing): free
  tier = home row + first machines, no account required to play, adaptive
  engine with letter-by-letter promotion, accuracy multiplier up to 3×.
- **Links:** pillar `/leren-typen-voor-kinderen/` and sibling
  `/blog/beste-gratis-typspelletjes-kinderen/` (both required by the
  assignment), each used once in context rather than bolted on.
- **Verification run:** `npm install` (clean, pre-existing audit warnings
  only, unrelated to this change). `npm run build` → generator log now
  `16 URLs (pijler + blog + 12 artikelen + 1 pagina's) + sitemap`; confirmed
  `public/blog/nitro-type-alternatief/index.html` emitted; JSON-LD `@graph`
  parses and contains `Article` + `BreadcrumbList` + `FAQPage`; new URL
  present in `public/sitemap.xml` with today's date. `npm test` → 118/118
  passing (repo baseline has grown from 112 since 026/027 merged; 0
  failures either way — green held). Reverted line-ending-only churn on 11
  unrelated generated pages (`git checkout --`, confirmed 0 real diff lines
  on each before reverting); kept the genuinely additive diffs (new article
  directory, `public/blog/index.html` card,
  `public/leren-typen-voor-kinderen/index.html` related-list entry, and
  `public/sitemap.xml` entry).

### Verification (tester, 2026-07-23)

Independently verified in worktree `typcoon-lanes/v028`, isolated from the main
checkout. All shared A-D criteria (research/content-batch-2-scope.md section 3) and
section 3-C's extra criteria checked directly; nothing taken on the developer's word.

- **Article shape / build:** `npm install` clean, `npm run build` succeeds;
  generator log reads `17 URLs (pijler + blog + 13 artikelen + 1 pagina's) +
  sitemap` (9 original + A/B/C/D = 13, correct). `public/blog/nitro-type-alternatief/index.html`
  and a matching `dist/` copy are emitted. Reverted the same CRLF/LF-only
  churn the developer flagged on 17 unrelated generated files after my own
  build run (`git diff` showed 0 content lines on each before revert) -
  worktree left clean.
- **Term placement / no stuffing:** "Nitro Type alternatief" present once,
  naturally, in title, h1, slug (`nitro-type-alternatief`) and the lead's
  first sentence - confirmed by reading the generated HTML directly. Bare
  "Nitro Type" recurs ~22x in the ~830-word body, which is the literal
  subject of a whole-article comparison, not a synthetic keyword - read the
  full body text and it never reads as forced/listy. "alternatief" itself is
  used sparingly (title/h1/lead only), matching the no-forced-repetition
  criterion.
  Word count measured programmatically (lead + section bodies/headings +
  FAQ): **922 words** - inside 800-1500.
- **Product claims vs. code:** cross-checked against README.md and the
  actual engine/economy code, not reused verbatim. `accuracyMultiplier` in
  `src/game/economy.js` confirms "tot 3x zoveel" (comment: `0.95..1.00 ->
  1.5x..3.0x`); README confirms adaptive engine/letter promotion, free base
  tier, no account required to play. No overclaim found - free tier
  described exactly as "thuisrij + eerste machines, zonder tijdslimiet en
  zonder account" (guardrail 5 compliant); no privacy claim is made beyond
  "zonder account," which matches guardrail 4 as coded.
- **Internal links:** pillar `/leren-typen-voor-kinderen/` and sibling
  `/blog/beste-gratis-typspelletjes-kinderen/` both present in body copy, in
  context. Verified all internal targets resolve on disk
  (`public/leren-typen-voor-kinderen/`, `public/blog/beste-gratis-typspelletjes-kinderen/`,
  plus the generator's auto-added "Lees ook" related links). Confirmed the
  blog index card and the pillar's related-list both link back to
  `/blog/nitro-type-alternatief/`. Loaded the built page in a real Chromium
  browser via Playwright (desktop 1280px + mobile 390px viewports): renders
  cleanly, all `<main>` links resolve, no console/page JS errors (the one
  405 on `/api/track` is the static test server not running the Vercel
  function - not an article defect).
- **Structured data / sitemap:** JSON-LD `@graph` parses; contains `Article`
  + `BreadcrumbList` + `FAQPage`. `lang="nl"` confirmed on `<html>`. New URL
  present in `public/sitemap.xml` with today's date.
- **Tests:** `npm test` -> **126/126 passing**, 0 failures (baseline grown
  from the dev's 118 as later lanes/029 landed on top; green held).
- **Competitor-claim spot-check (independent WebSearch/WebFetch, not just
  checking the dev's citations are dated):**
  1. Free real-time typing race game, cars/garage - confirmed
     (nitrotype.com header "Race Your Friends"; general web consensus).
  2. Garage/car progression via in-race earnings - confirmed (nitro.fandom.com,
     search consensus).
  3. Teams that compete on rankings - **substantively true but the
     dev's own citation is dated**: the classic "Top Racers"/"Top Teams"
     leaderboards the dev's source names were removed 2024-01-28 and
     replaced by weekly "Leagues" (Personal + Team Leagues), per
     nitro.fandom.com/wiki/Leagues. The *published article text* only says
     "een team dat meestrijdt op de ranglijsten" (generic "rankings"),
     which remains accurate under Leagues - so this is not a false claim in
     the shipped copy, only a stale citation in the dev's build notes.
     Flagging as a low-severity, low-confidence nit, not a blocker.
  4. Free to play; optional paid Gold membership removes ads and unlocks
     extra cars, not required to play/improve - confirmed independently via
     nitrotype.net's beginner's guide ("Ad-free website experience,"
     "Exclusive car access unavailable to free players," "completely free"
     core game) and modulo.app's review.
  5. Nitro Type does not teach touch-typing fundamentals from scratch, best
     used once basics are in place - **the load-bearing frame claim,
     independently confirmed** via modulo.app ("start with basic typing
     skills before introducing Nitro Type," "not a fit for" learners
     needing "a more structured, step-by-step instructional approach") and
     nitrotype.net ("designed to take someone who is okay at typing and
     make them an expert," recommends beginners start elsewhere first).
  6. NL "leuke oefensite" framing - reused from already-verified
     research/content-batch-2-scope.md section 1c (10vingers.nl), reasonable to
     not re-fetch.
  No false or unfair claim found in the shipped article text. Tone re-read
  end-to-end for disparagement: none found - weaknesses are consistently
  framed as "waar Nitro Type van uitgaat" (what it's built/assumes), Nitro
  Type's strengths get their own unhedged section ("Nitro Type is een
  prima keuze"), and the FAQ's direct "niet echt" answer is supported by
  the sourced consensus above, not editorializing.
- **Kid-safety:** no outbound links to nitrotype.com or any third party in
  the generated page - a curious kid can't click away to the competitor
  from this article. No ads/tracking beyond the existing site-wide
  first-party `/track.js` used on every page.
- **027 overlap check:** 027 (`typen-leren-met-een-spelletje`) targets
  general learning-game pedagogy; 028 targets the "nitro type" brand/competitor
  query specifically. Different primary terms, different angles, no
  cannibalization; neither article links to the other, which is fine since
  neither scope required it.

**Verdict: all criteria pass.** Status set to `done`.
