# en locale — build scope

*Product-owner scope for assignment 005. Fulfils SEO.md §5 (five-locale pillar, en next
after nl) under the hard rule "never ship a half-translated locale." Reading:
charter.md, SEO.md §5 + §7, `src/data/nl/*`, `src/engine/curriculumCore.js`,
`scripts/gen-content.mjs`, `scripts/content/nl.mjs`, `scripts/sync-engine.mjs`,
`src/game/strings.js`, `src/game/App.jsx`, `src/layouts/*`, `index.html`.*

*Not production code. Where a design claim needs proving (typie-fun en data availability,
locale wiring), it is called out as a developer spike, not asserted.*

---

## 0. What the code already gives us (the starting line)

The engine is genuinely language-neutral, and the multi-locale seams are partly built —
this is not a greenfield i18n job. Concretely:

- **Engine + curriculum are shared and data-driven.** `curriculumCore.js` is the only
  hard-coded structure (stages 1–15, letter-unlock order `f j / d k / s l / a ; / g h /
  e i / r u / t y / n m / o w / c v / p q / b x / z`). Everything language-specific is a
  *data pack* (`src/data/<lang>/`: `bigrams`, `baseFreq`, `words`, `sentences`,
  `curriculumTail`) plus a curriculum *tail* appended after stage 15.
- **The content generator already loops locales.** `gen-content.mjs` has `LOCALES`,
  `DEFAULT='nl'`, `prefix()` (nl at `/`, others at `/<lang>/`), and it already emits a
  reciprocal `hreflang` cluster + `x-default`, per-locale `<title>/meta/OG`,
  `inLanguage` in JSON-LD, and one generated `sitemap.xml`. Adding a locale is
  structurally "add a pack to `LOCALES`."
- **UI strings are centralised** in `src/game/strings.js` (one flat `STRINGS` map behind
  `gt(key, vars)`), explicitly designed so "a second language is later one extra file."
- **The profile already anticipates locale:** `newProfile()` carries `uiTaal`,
  `trainTaal`, `layout` — they just are not wired to select anything yet.

Three things are **not** ready, and they are the real work (detailed in §3–§4):

1. **The player app is hard-wired to nl.** `App.jsx` and `GameScreen.jsx` do
   `import nlPack from '../data/nl/index.js'`, and `gt()` reads a single Dutch map.
   `uiTaal`/`trainTaal` select nothing. An English *player* needs a locale selector.
2. **The hreflang cluster assumes identical slugs across locales.** The generator
   computes the alternate URL by string-substituting the path prefix
   (`u.replace(prefix(pack.locale), '')`). English slugs differ
   (`learn-typing-for-kids` ≠ `leren-typen-voor-kinderen`), so the cluster would emit
   wrong alternates. This needs a cross-locale page-key map.
3. **The primary landing is hand-authored, outside the generator.** `/index.html` at the
   repo root is not produced by `gen-content.mjs` and has **no hreflang at all**. The en
   landing is therefore its own deliverable, and both landings must be cross-linked by
   hand (or the landing brought into the generator).

---

## 1. What a "whole" en launch is — the cut line

SEO.md §5: *"Launch each language whole (UI + landing + at least the pillar), then fill
its blog."* Translating that into a checkable definition for typcoon:

### SHIP (all of these, or en does not go live)

1. **en player UI, fully translated.** An `en` UI-strings file with **every** key from
   `src/game/strings.js` present (no Dutch fallbacks visible to a player), selected by
   locale. No mixed-language screen anywhere in the free flow: home → onboarding →
   gameplay → chapter-1 gate. (Paid/unlock/dashboard copy is included — it is part of the
   same flow and cheap to translate; it is not gated behind the payments decision 002.)
2. **en practice data pack** (`src/data/en/`, §3) so the English player types **English**
   words and sentences, ordered to the shared curriculum so real English words appear
   early — not transliterated Dutch.
3. **en layout** registered (`qwerty-us`; §3.5 — near-trivial, letter positions equal
   US-QWERTY) and selected for en players.
4. **en landing** at `/en/` — the parent-facing equivalent of `/index.html`: English
   copy, English `VideoGame` + `FAQPage` JSON-LD, `lang="en"`, `og:locale="en_US"`, a
   "Play free" CTA that lands the player in the **English** app.
5. **The pillar page** in English at `/en/<english-pillar-slug>/`, generated from an `en`
   content pack, targeting a natively-researched English head term (§4 — *not* a
   translated Dutch keyword).
6. **A working blog index** at `/en/blog/` (may list only the pillar + the launch
   spokes; see cut line) so no nav link 404s.
7. **Correct hreflang + sitemap** across the cluster: every en page and its nl
   counterpart reference each other reciprocally, plus `x-default`; the en landing and
   nl landing carry hreflang too; `sitemap.xml` includes the en URLs with alternates
   (§5).
8. **Native keyword research done** for en (a short deliverable: pillar target + the
   launch spokes' targets + slugs), so the pages are built against real English intent.

A launch is "whole" when a monolingual English parent can land on `/en/`, read a
credible English landing + pillar, click through, and their child plays a **fully
English** game that teaches English typing — with zero Dutch text and correct hreflang.

### CUT — explicitly waits (the more valuable half of this document)

- **The full en blog (12–15 articles).** Launch needs the pillar + a **minimum of 2**
  English spokes (enough that the pillar has real internal links and the blog index is
  not a stub of one). The remaining ~10 English articles are a later content-cadence
  assignment, mirroring how nl was filled. Rationale: SEO.md §5 requires "at least the
  pillar," and depth compounds over months — gating launch on 15 articles serialises the
  whole play behind a copywriting marathon.
- **de / es / fr.** Out of scope entirely. SEO.md §5: roll those out "once en proves the
  playbook." This assignment scopes en so that adding the next locale is "author a pack,"
  and records that as the success test — but builds none of them.
- **Localised OG images** (SEO.md §5 nice-to-have). Launch reuses the existing `og.png`
  (language-neutral factory art). A per-locale OG image is a later polish item, not a
  launch blocker.
- **`/en/voor-scholen/` (schools) equivalent.** The schools channel is nl-first
  (assignment 004, "typediploma" culture). No English schools page at en launch.
- **Currency/pricing localisation on the unlock screen.** Blocked upstream by the
  payments decision (002); the en unlock copy ships translated but the price display
  follows whatever 002 decides. en launch does **not** wait on 002 because payments are
  not live for any locale yet (charter guardrail 6).
- **Native en author/reviewer byline / separate E-E-A-T "about" page in English.** The
  generator already stamps an `Organization` author; a named English reviewer is a
  content-quality follow-up, not a launch gate.

---

## 2. Why en is decomposed the way it is

The launch has one long pole (**the data pack + player wiring**, §3) and one
tricky-but-small technical fix (**hreflang across differing slugs**, §5). Content (§4)
is real work but well-trodden — nl already did it. Sequencing (§6) is the live strategic
question. The draft assignments (§7) put the long pole first and independent of the
funnel-proof gate, because it is low-regret, and gate the content+launch behind the
trigger.

---

## 3. The en practice data pack — the long pole, answered concretely

`src/data/en/` must mirror `src/data/nl/`: five source files + an `index.js` exporting
`{ id:'en', bigrams, baseFreq, words, sentences, curriculumTail }`. The engine consumes
these unchanged. Here is exactly what each needs and where it comes from.

### 3.0 First: resolve whether typie-fun already ships an en pack (a spike, do this first)

`sync-engine.mjs` pulls the nl pack from typie-fun's `src/locales/nl/`. typie ran all
five locales (SEO.md §5 header: "the same five locales as typie"). **If typie-fun has
`src/locales/en/`, the en pack is a sync + review, not author-from-scratch** — this
collapses the long pole to days. If it does not, we author fresh (below). This unknown
swings the estimate by weeks, so it is the first task in the data-pack assignment:
`git clone`/inspect typie-fun, report which of the five files exist for en, and set the
pack approach accordingly. Either way, everything below is the acceptance bar; sourcing
from typie just changes "author" to "port + review."

### 3.1 `baseFreq.js` — English letter frequencies. *(easy)*

A single normalised map of relative letter frequencies. English letter frequency is a
public, well-established fact (canonical order e-t-a-o-i-n-s-h-r-…). Source: a standard
published English letter-frequency table, normalised to sum ~1, same shape as
`nl/baseFreq.js`. **Frequency counts are facts, not copyrightable.** Half a day.

### 3.2 `bigrams.js` — English letter-transition table. *(moderate, but forgiving)*

`bigrams[a][b]` = relative chance `b` follows `a`. The generator only needs an
*approximation*: it restricts to the active letter set, weights by weakness, and
epsilon-fills missing pairs (the nl file's own header says the table "need not be
complete"). Source: derive per-first-letter conditional probabilities from a public
English bigram-frequency dataset (e.g. a Google-Books-derived English bigram table),
normalising each row. This is strictly better than hand-guessing and is an afternoon's
transform. Acceptance: every letter a–z has a row; rows are plausibly normalised; `q`→`u`
dominant; common English digraphs (`th`, `he`, `in`, `er`, `an`) rank high.

### 3.3 `words.js` — the actual authoring work. *(hard — this is the pole within the pole)*

Not a translation. The nl list is **ordered so that early, home-row-typable words appear
first** (`al, af, ja, la, das, sla…`), because the generator filters to the active letter
set — a word with an un-unlocked letter is skipped. So the English list must be
**re-authored against `curriculumCore`'s unlock order**, not translated:

- Stages 1–4 unlock only `f j d k s l a ;` (the home row). English words typable from
  *only* those letters are sparse (`as, ask, add, all, lad, fad, dad, sad, salad,
  flask, alfalfa, falls, asks…`). This front section must be hand-built and checked
  key-by-key against the unlock order, exactly as nl was. This is the part that cannot
  be automated or machine-translated.
- Then high-frequency English function words (`the, and, a, to, in, is, it, you, that…`)
  as they become typable.
- Then kid-friendly content words (animals, colours, school, food, play) — age-8–12
  vocabulary, **kid-safe** (no profanity, no adult themes; a child-audience product,
  charter §Target user + guardrails). Machine word-lists must be human-filtered for
  safety before inclusion.
- Target size ~ the nl list (~200 words), ordered `letters-needed → frequency`.

Source approach: seed from a public high-frequency English word list (e.g. a standard
top-N frequency list) → filter to kid-safe + short-first → **hand-order and hand-verify
the early band against the stage table**. Budget this as the dominant line item.
Acceptance criteria in §7-A make the "typable-early" property testable.

### 3.4 `sentences.js` — kid-friendly English sentences. *(moderate authoring)*

All-lowercase, letters + spaces only (no hard-coded punctuation — the engine adds caps +
punctuation once Shift/punctuation unlock), ordered easy (few distinct letters) → harder.
Include the Typie-mascot flavour sentences (the nl pack has `typie eet…` lines; keep the
mascot in English: "typie eats cheese all day", etc.). ~35 original, kid-safe sentences.
Pure authoring — cannot be sourced from a corpus (must be original and age-appropriate).

### 3.5 `curriculumTail.js` — English tail. *(easy — simplest file)*

Per-locale because capitals/punctuation/accents differ. English tail = `Shift` (capitals)
→ basic punctuation `. ,` → extended `? ! ' -` → digit row `0–9`, and **drop the Dutch
accents** (`é ë ï ó`) — English needs none. Same object shape as `nl/curriculumTail.js`,
minus the accent stage. An hour.

### 3.6 `src/layouts/qwerty-us.js` + registry. *(near-trivial)*

`qwerty-nl.js`'s own header: letter positions equal US-QWERTY; only the tail differs.
So `qwerty-us` is a near-clone with `id:'qwerty-us'` (the finger map and rows are already
US-QWERTY). Register it in `layouts/index.js`. Half a day including making en profiles
select it.

### 3.7 Player-app locale wiring — required, and part of "whole." *(moderate)*

Data pack alone is invisible until the app can select it. Today `App.jsx` /
`GameScreen.jsx` hard-import `nlPack` and `gt()` is single-map. Minimum wiring:

- `gt()` becomes locale-aware (English strings map + the existing Dutch one, keyed by an
  active locale).
- Pack selection: `import` both packs (or a small registry `{ nl, en }`) and choose by
  `profile.trainTaal`; UI by `profile.uiTaal`.
- **Locale signal:** the en landing's "Play free" CTA sets the player to English —
  simplest is the app reads locale from the URL it was opened under (an `/en/`-scoped
  entry, or a `?lang=en` the en landing appends) and persists it into
  `profile.uiTaal`/`trainTaal` on first run. `/speel/` stays `noindex` for all locales;
  we are not indexing the app, only routing the right language into it.

Keep `/speel/` a single build; do not fork the SPA. Locale is a runtime selection, not a
second bundle.

---

## 4. en content pack + landing

### 4.1 Native keyword research (a prerequisite deliverable, not translated Dutch)

SEO.md §5 is explicit: "don't just machine-translate the Dutch keywords." English
competitors and phrasing differ (TypingClub, typing.com, Nitro Type; "typing games for
kids," "learn to type free," "typing practice for kids," "how to touch type"). Deliverable
is small and concrete: the **en pillar target term + slug**, and the target term + slug
for each launch spoke, with intent noted. SEO.md §7's honest caveat applies — validate
volumes with a real tool if one is available, else prioritise by intent × attainability
(same method nl used). This blocks the content pack (you can't write the pillar without
its target term) but not the data pack.

### 4.2 `scripts/content/en.mjs` — the content pack

Same shape as `scripts/content/nl.mjs`: `locale:'en'`, `htmlLang:'en'`,
`ogLocale:'en_US'`, a `ui:{}` block (nav/footer/CTA chrome — the page-furniture strings,
distinct from the *game* strings in §3.7), a `pillar`, and `articles:[]` (≥2 for launch).
Add `en` to `LOCALES` in `gen-content.mjs`. The generator then produces `/en/<pillar>/`,
`/en/blog/`, and `/en/blog/<slug>/` automatically. Note: the nl pack has hard-coded Dutch
strings in a couple of generator spots (blog-index lead, the `.replace(': de complete
gids','')`) — the en pass must move those into the `ui` block so they localise (a small
generator cleanup, folded into §7-E).

### 4.3 The en landing `/en/`

Because `/index.html` is hand-authored and outside the generator, `/en/` is its own page.
Two options — the assignment should pick the cheaper that still ships whole:
- **(a) Hand-author `/en/index.html`** mirroring `/index.html` (English copy + JSON-LD +
  hreflang). Fastest to launch; leaves two hand-maintained landings.
- **(b) Bring the landing into `gen-content.mjs`** as a generated `page` type so both
  locales' landings come from packs. More work now, removes the hand-maintained
  divergence and makes de/es/fr landings free later.
Recommendation: **(a) for launch speed**, with (b) noted as a fast-follow refactor —
consistent with "ship sooner, revise later." Either way the landing must carry the full
hreflang cluster (§5).

---

## 5. hreflang + sitemap — technical approach against the static build

### 5.1 Are typie-fun's generators portable? — Already ported.

`gen-content.mjs` **is** typcoon's port/extension of typie's `gen-landings.mjs` /
`gen-blog.mjs` (SEO.md §5 names them as the thing to extend; the file header says "nieuwe
taal = nieuw content-pack"). The multi-locale scaffolding (`LOCALES`, `prefix`,
per-locale sitemap entries, an hreflang loop) is present today. So portability is not the
question — **the generator does not need replacing.** en needs two corrections to it, not
a rewrite.

### 5.2 Fix 1 — reciprocal hreflang across *differing* slugs (the real gap)

Current head() builds each alternate as "same path, swapped prefix." That breaks the
moment en slugs differ from nl slugs. Fix: give every logical page a **stable cross-locale
key** and resolve each locale's real URL from its own pack:

- Add a shared `key` to each renderable (pillar → `key:'pillar'`; each article →
  `key:'age'`, `key:'fingers'`, …; blog index → `key:'blog'`; landing →
  `key:'home'`). nl and en articles that are counterparts share a key.
- Build a `key → { locale → url }` map across all `LOCALES` during the run.
- head() emits, for the current page's key, one `<link rel="alternate" hreflang=…>` per
  locale that **has** that key, plus `x-default` → the nl (DEFAULT) URL.
- **Only emit alternates for keys that exist in a locale.** If en launches with 2 spokes
  and nl has 10, only the shared pages get cross-links; nl-only articles correctly get
  no en alternate (no broken/duplicate signalling). This lets en launch "whole" without
  waiting for blog parity.

This map is also what the landing (§4.3) uses to cross-link, and what the sitemap uses.

### 5.3 Fix 2 — sitemap with hreflang alternates

SEO.md §5 offers a choice: per-locale sitemaps **or** one sitemap with
`<xhtml:link hreflang>` alternates. Recommend **one sitemap + `xhtml:link` alternates**
(fewer files, `robots.txt` already points at the single `sitemap.xml`). Extend `sitemap()`
to add the `xmlns:xhtml` namespace and, for each URL, emit an `<xhtml:link rel="alternate"
hreflang=…>` for every locale variant from the §5.2 key-map (including a self-reference
and `x-default`), per Google's sitemap-alternates spec. The generated `/` (nl landing) and
`/en/` (en landing) must appear with their alternates — which means the landing URLs must
flow through the same key-map even if the landing HTML itself is hand-authored (register
`home` in the map regardless of who renders the HTML).

### 5.4 What stays the same

`vercel.json` `cleanUrls`/`trailingSlash`, security headers, the `noindex` on `/speel/`,
`robots.txt` → single sitemap — all unchanged. No routing/rewrites needed: `/en/…`
directories are emitted as real files, exactly like today's `/leren-typen-voor-kinderen/`.

---

## 6. Sequencing recommendation and trigger

**Recommendation: split the work by regret.**

- **The data pack + player wiring (§3, draft assignment A) is low-regret and may proceed
  early — including before the funnel-proof gate.** It is the critical path, it is
  measurement-independent, and an English data pack is useful the day we ever go
  multilingual. Starting the §3.0 spike now also de-risks the whole estimate (typie-fun
  may already hand us the pack). Recommended: unblock A as soon as capacity exists;
  parallel to nl content cadence.
- **The content, landing, hreflang, and launch (§4–§5, draft assignments C/D/E/F) wait
  behind the funnel-proof gate.** SEO.md §5 is unambiguous: nl is home-field precisely to
  "prove the funnel here first," and §7 says wire measurement "so you learn from day one."
  Shipping a second locale before we can read whether the *first* one converts is spending
  the biggest traffic lever on an unproven funnel. And we currently **cannot even read**
  the nl funnel — assignment 006 (measurement) is still `open`. So en content/launch sits
  **behind 006** as a hard dependency (you cannot prove the funnel with no instrument) and
  behind an nl-signal trigger.

### Trigger condition (write it down, honestly)

Start en content/launch (assignments C→F) when **both** hold:

1. **006 (measurement) has been live for a meaningful window** — proposed default **≥ 6
   weeks** — so there is real funnel data, not a first-week blip; **and**
2. **the nl proxy metric shows life** — the charter's `parent opt-ins/week` is **non-zero
   and trending up**, i.e. the nl funnel `visit → game-start → engaged → opt-in` demonstrably
   converts at each step at all. The exact floor is the CEO's call (it depends on the
   traffic 006 reveals); proposed default: **opt-ins/week clearly > 0 and non-declining
   across the final 2 weeks of the window**, with engaged-rate and game-starts both
   non-trivial.

**Escape hatch (the honest part):** if, after the window, 006 shows nl traffic arriving
but **not** converting (opt-ins flat at ~0 despite game-starts), **en is not the fix** —
a second locale multiplies a broken funnel. That is a product/conversion problem, and the
right move is to **escalate to the CEO** (open an `owner: ceo` assignment) rather than
build en on top of a funnel that doesn't work. Conversely, if nl traffic itself never
arrives (indexing/content problem), that too is an nl problem to solve before multiplying
locales. en is a **TAM multiplier, not a funnel fix** — the trigger enforces that.

This is deliberately more conservative than "en is next, build it now": faithful to the
charter's success metric and SEO.md's own precondition. The data-pack carve-out (A early)
means we are not idle while we wait — the long pole gets shortened during the proof window.

---

## 7. Draft build assignments (ids TBD — allocated by the next dispatcher)

*Next free id is 007 per ticks.md. Drafted here only; no assignment files created.
Priorities per the dispatch (3–4). `blocked_by` uses the letter labels below; the
dispatcher maps them to real ids on creation.*

### A — en practice data pack + layout + player-app locale wiring  · priority 3 · blocked_by: []

*The long pole. Low-regret; may start before the §6 trigger.*

- [ ] **Spike first:** clone/inspect typie-fun; report which of `bigrams, baseFreq,
      words, sentences, curriculumTail` exist under `src/locales/en/`. If present, extend
      `sync-engine.mjs` to pull en and treat the rest as port + review; if absent, author
      fresh. Record the finding in the assignment.
- [ ] `src/data/en/` created with all five files + `index.js` exporting
      `{ id:'en', … }`, same shape as `src/data/nl/index.js`.
- [ ] `baseFreq.js`: normalised English letter frequencies (sum ~1), every letter a–z.
- [ ] `bigrams.js`: every letter a–z has a row; `q`→`u` dominant; common English
      digraphs (`th, he, in, er, an`) rank high in their rows.
- [ ] `words.js`: ~200 English words, kid-safe, ordered letters-needed → frequency; the
      **early band is typable from the home row alone** — verifiable: filtering the list
      to the stage-4 active set (`f j d k s l a ;`) yields ≥ 10 real English words, and no
      word in the first 20 contains a letter unlocked after stage 6.
- [ ] `sentences.js`: ~35 original kid-safe sentences, all-lowercase, letters + spaces
      only, ordered easy→hard, mascot ("typie") lines included.
- [ ] `curriculumTail.js`: Shift → `. ,` → `? ! ' -` → digits `0–9`; **no accent stage.**
- [ ] `src/layouts/qwerty-us.js` added and registered in `layouts/index.js`.
- [ ] `gt()` is locale-aware; the app selects data pack by `profile.trainTaal` and UI by
      `profile.uiTaal`; `/speel/` remains one build (no SPA fork).
- [ ] With locale forced to en, a full play session (home → onboarding → gameplay) shows
      **zero Dutch** and the player types English words/sentences; `npm test` green;
      clean `npm run build`.

### B — en player UI strings (`en` string map)  · priority 3 · blocked_by: [A]

*Split from A if useful; the string map is the bulk of the "no Dutch text" bar.*

- [ ] An `en` strings map covering **every** key in `src/game/strings.js` — no missing
      keys (a test asserts key-set parity with the nl map).
- [ ] English copy is age-appropriate and matches product voice; unlock/dashboard/parent
      copy included (translated, price display deferred to 002).
- [ ] No key renders as a raw `key` string or a Dutch fallback in the en flow.

### C — en native keyword research  · priority 3 · blocked_by: [] · gated by §6 trigger

- [ ] Deliverable doc: en **pillar** target term + slug, and target term + slug + intent
      for each launch spoke (≥ 2).
- [ ] Targets are native English intent with the English competitor set noted — **not**
      translated Dutch keywords (SEO.md §5).
- [ ] Volumes validated with a tool if available; else prioritised by intent ×
      attainability with the method stated (SEO.md §7 caveat honoured).

### D — en content pack + en landing  · priority 4 · blocked_by: [B, C]

- [ ] `scripts/content/en.mjs` in the `nl.mjs` shape (`locale:'en'`, `htmlLang:'en'`,
      `ogLocale:'en_US'`, `ui`, `pillar`, `articles` with **≥ 2** spokes); `en` added to
      `LOCALES`.
- [ ] `npm run build` emits `/en/<pillar>/`, `/en/blog/`, `/en/blog/<slug>/` with English
      content, `lang="en"`, `inLanguage:"en"`, `og:locale="en_US"`, Article/Breadcrumb
      schema — all styled identically to nl.
- [ ] en landing at `/en/` (hand-authored `/en/index.html` for launch) with English copy,
      `VideoGame` + `FAQPage` JSON-LD, `lang="en"`, and a "Play free" CTA that opens the
      **English** app (sets en locale per A/§3.7).
- [ ] No Dutch text on any en page; blog index nav links resolve (no 404).

### E — multi-locale hreflang + sitemap correctness  · priority 4 · blocked_by: [D]

- [ ] Cross-locale page-key map added to `gen-content.mjs`; hreflang alternates resolve
      each locale's **actual** slug (English slugs differ from Dutch) — verified on the
      pillar and one spoke.
- [ ] Every en page and its nl counterpart reference each other reciprocally; `x-default`
      → the nl (DEFAULT) URL on all clustered pages. Pages with no counterpart in the
      other locale emit **no** false alternate.
- [ ] Both landings (`/` and `/en/`) carry the full hreflang cluster.
- [ ] `sitemap.xml` regenerated with `xmlns:xhtml` and `<xhtml:link rel="alternate">`
      alternates (incl. self + `x-default`) for every clustered URL, landings included;
      `robots.txt` still points at the one sitemap.
- [ ] Dutch strings currently hard-coded in the generator (blog-index lead, the
      `': de complete gids'` replace) moved into the pack `ui` block so they localise.
- [ ] Validates: hreflang reciprocity checks clean (e.g. a validator or a scripted
      assertion); `npm run build` clean.

### F — en launch gate (whole-launch QA)  · priority 4 · blocked_by: [A, B, D, E]

- [ ] Checklist against §1 SHIP items 1–8 all pass on a production build preview.
- [ ] A monolingual-English walk-through (`/en/` → pillar → play) surfaces zero Dutch and
      correct hreflang; the nl experience is unchanged (no regression on `/`).
- [ ] Sign-off note recorded; only then is en considered launched (subject to the §6
      trigger having fired for C–F).

---

## 8. Open questions escalated / deferred

- **Exact nl opt-ins/week floor for the trigger (§6)** — proposed a default; the precise
  bar is the CEO's, and depends on the traffic 006 reveals. Flagged, not decided here.
- **typie-fun en data availability (§3.0)** — a spike inside assignment A, not assumed.
- **Landing generation (a) vs (b) (§4.3)** — recommended (a) for launch; (b) noted as a
  low-priority refactor, not scoped as a launch blocker.
