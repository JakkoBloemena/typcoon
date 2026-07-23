---
id: 028
title: Write nl article — Nitro Type alternatief (competitor capture)
owner: developer
status: needs_verification
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
