---
id: 012
title: en practice data pack + qwerty-us layout + player-app locale wiring
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes draft **A** of research/en-locale-scope.md §7 (verified done, assignment
005). The long pole of the English locale: build `src/data/en/` (all five files +
index), the `qwerty-us` layout, and make the player app select data pack by
`profile.trainTaal` and UI by `profile.uiTaal` so a forced-en session shows zero
Dutch. Starts with the typie-fun spike (does `src/locales/en/` exist there? then
sync+review via sync-engine.mjs, else author fresh). Explicitly sanctioned to start
before the §6 funnel trigger (low-regret). English words must be re-authored against
curriculumCore's unlock order, not translated — see §3 of the scope doc.

## Acceptance criteria

The checklist under "### A —" in research/en-locale-scope.md §7 is normative,
including the spike-first step, the home-row-typability bar on words.js, the
no-accent-stage curriculumTail, and green build + tests. A tester verifies against
that checklist directly.

## Notes

Authority: assignment 005 (done) + its verified scope doc. blocked_by is empty by
the plan's own sequencing ("start early"); en *content/launch* (014–017) remains
gated by the §6 trigger — this assignment does not launch anything user-visible.
Terminal state needs_verification.

### Spike finding (§3.0, done first)

Cloned/inspected typie-fun (github.com/JakkoBloemena/typie-fun). `src/locales/`
contains **only `nl`** — no `src/locales/en/`, and `src/layouts/` has only
`qwerty-nl.js`. The top-level `en/ de/ es/ fr/` directories in that repo are
generated static blog/landing output (marketing pages from their content
generator), not an engine data pack. **Conclusion: author fresh** — nothing to
sync via `sync-engine.mjs` for `bigrams/baseFreq/words/sentences/curriculumTail`.
`sync-engine.mjs` itself is unchanged (still nl-only; extending it for en would
be sync-ing from a source that doesn't have the data).

### What was built

- `src/data/en/{baseFreq,bigrams,words,sentences,curriculumTail}.js` + `index.js`,
  same shape as `src/data/nl/index.js` (`{ id:'en', bigrams, baseFreq, words,
  sentences, curriculumTail }`).
  - `baseFreq.js`: standard published English letter frequencies, normalised
    (sums to 0.9999).
  - `bigrams.js`: every a–z letter has a row; `q→u` dominant (0.95); `th/he/in/
    er/an` rank top-1 in their respective rows.
  - `words.js`: 308 words, re-authored (not translated) against
    `curriculumCore`'s stage order. Hand-built + verified against the real
    `curriculumCore.js`/`buildCurriculum` (not a guess): filtering to the
    stage-4 set (`f j d k s l a`) yields 23 real English words (`as, ask, add,
    sad, lad, dad, fad, fall, flask, salad, alas, lass, alfalfa…`); none of the
    first 20 words needs a letter unlocked after stage 6. Ordered
    letters-needed → frequency, ending in kid-safe content vocabulary
    (animals/food/school/weather), hand-reviewed for age 8–12 appropriateness.
  - `sentences.js`: 38 original, kid-safe, all-lowercase sentences (letters +
    spaces only), ordered easy→hard by the actual per-letter stage requirement
    (computed programmatically, not eyeballed), including 3 "typie" mascot
    lines.
  - `curriculumTail.js`: Shift → `. ,` → `? ! ' -` → digits `0–9`, **no accent
    stage** (nl's `é ë ï ó` intentionally dropped).
- `src/layouts/qwerty-us.js` (near-clone of `qwerty-nl.js`, `id:'qwerty-us'`,
  same US-QWERTY positions/finger map) + registered in `src/layouts/index.js`.
- `src/data/packs.js`: `{ nl, en }` registry + `getPack(trainTaal)`.
- `src/game/strings.js`: `gt()` is now locale-aware (`setLocale()`/`getLocale()`
  over a `{ nl, en }` table registry). A missing en key falls back to the raw
  key string, **never** to the Dutch text, so an untranslated key can never
  leak Dutch — it shows an ugly-but-honest placeholder instead (assignment 013
  fills the remaining key set with full parity + a test).
- `src/game/App.jsx`: locale detection (`?lang=en` on the `/speel/` URL, per an
  existing profile's `uiTaal`/`trainTaal` once one exists — one build, no SPA
  fork, per §3.7) → `setLocale()` + pack selection via `getPack(profile.
  trainTaal)`, replacing the hard-imported `nlPack`. New profiles get
  `layout:'qwerty-us'` when created under `?lang=en`.
- `src/game/GameScreen.jsx`: pack selection via `getPack(state.profile.
  trainTaal)` instead of the hard-imported `nlPack`.
- Three pre-existing hardcoded-Dutch leaks found and fixed while wiring the
  flow (all outside `strings.js`, so `gt()` alone wouldn't have caught them):
  - `GameScreen.jsx` joined newly-unlocked letters with the literal `' en '`
    (Dutch "and") and appended the literal `' kopen'` (Dutch "buy") to a buy
    button's a11y label — both now route through `gt('common.and')` /
    `gt('play.buyLabel', …)`.
  - `src/ui/Keyboard.jsx` (explicitly NOT synced from typie-fun — "eigen
    kopie") had a hardcoded-Dutch `FINGERS` map rendered as **visible** text in
    the on-screen finger-hint during onboarding/gameplay; `src/game/Hands.jsx` +
    `handmap.js`'s `FINGER_LABEL` had the Dutch finger names in an aria-label.
    Both now read `gt('fingers.*')` (new keys, nl + en).
  - `src/game/format.js` hardcoded `toLocaleString('nl-NL')` plus Dutch
    `mln/mld/bjn` abbreviations for the coin counter — would show Dutch once
    coins passed 1M in an en session. Now reads `getLocale()` and uses
    `en-US`/`M·B·T` for en.
  - Not fixed (flagged only): `src/ui/TypingSurface.jsx`'s `aria-label="Typ
    hier"` is hardcoded Dutch, but that file **is** synced from typie-fun
    (`sync-engine.mjs`) and upstream has the same string — fixing it locally
    would just be reverted by the next sync, and proper plumbing needs a
    locale prop through 3 call sites. Left as a follow-up, not filed as an
    assignment per this task's instructions (developer was told not to create
    assignment files this run).

### How the hard bars were validated

- Home-row bar: `test/en-pack.test.js` imports the *real*
  `curriculumCore.js`/`buildCurriculum` (not a hand-rolled stage map) and
  asserts the stage-4 filter (≥10 words) and first-20/stage-6 bound directly
  against the shipped `en/words.js`.
- Zero-Dutch bar: `test/locale.test.js` enumerates every `gt()` key that
  `App.jsx`/`GameScreen.jsx`/`Onboarding.jsx` use in the home → onboarding →
  gameplay flow (including the dynamic `building.*`/`upgrade.*`/`ach.*`/
  `fingers.*` families, derived from `economy.js`/`achievements.js` so it
  can't drift), forces `en`, and asserts every one resolves to real English
  (not the raw key). A second test asserts `gt()` never silently falls back to
  the nl string for a key genuinely missing from en (out-of-flow keys like
  `dash.title` show the raw key, not Dutch).
- Beyond unit tests: server-rendered (`react-dom/server`) the actual
  `Onboarding`, `Hands`, and `GameScreen` components with locale forced to
  `en` and scanned the HTML for nl diacritics/tells — zero hits, including the
  a11y `aria-label` on the hands illustration ("Use your left index finger.").
  Also ran a 400-exercise headless engine simulation on the en pack from
  stage 1 through full core-alphabet promotion (curriculumIndex reached 15,
  14 promotions) with no errors, confirming real-word picks come from
  `en/words.js` (not incidental Markov letter combinations that happen to
  spell a short Dutch word by chance, e.g. "ik" — that token isn't in the en
  word list; it's the same pseudo-word generator nl also uses).
- `npm test`: 92/92 passing (77 pre-existing + 15 new: `en-pack.test.js` ×9,
  `locale.test.js` ×6).
- `npm run build`: clean (`vite build` succeeds, emits `dist/speel/index.html`
  + `dist/index.html` + assets; `prebuild`'s `gen-content.mjs` unaffected).

### Scope note

`words.js` landed at 308 entries rather than the scope doc's "~200" — the
early curriculum-ordered bands plus a kid-vocabulary tail both wanted more
than 200 to feel substantive; trimmed once from an initial 402-word draft.
All hard bars (stage-4 filter, first-20/stage-6 bound, no duplicates,
kid-safety) hold regardless of list length; flagging the size delta for the
tester rather than silently deviating from the scope doc's stated target.

### Tester verification (2026-07-23)

Independently re-derived every item under research/en-locale-scope.md §7 "### A —"
against the code, not the Notes above. All pass; nothing here is taken on the
developer's word.

- **Home-row bar** (own throwaway script importing the real `curriculumCore.js`):
  stage-4 active set = `{f,j,d,k,s,l,a}` (`;` excluded, not `[a-z]`). Filtering
  `en/words.js` to that set yields **23** words (≥10 met): as, ad, ask, add, all,
  sad, lad, dad, fad, fall, flask, salad, alas, lass, asks, adds, fads, lads,
  dads, falls, flasks, salads, alfalfa. First-20/stage-6 bound (stage 1-6 letters
  `{f,j,d,k,s,l,a,g,h,e,i}`): zero violations. No duplicates across all 308
  words.
- **bigrams.js**: all 26 a-z rows present; `q→u`=0.95 dominant; top rank per row
  confirmed programmatically — `t→h`, `h→e`, `i→n`, `e→r`, `a→n` (th/he/in/er/an
  all rank #1 in their row).
- **baseFreq.js**: all 26 letters present, sums to 0.9999.
- **curriculumTail.js**: diffed against nl's — identical shape minus the accent
  stage line; Shift → `.,` → `?!'-` → digits, confirmed no accent stage.
- **sentences.js**: read all 38 sentences myself for kid-safety — all
  age-appropriate (animals, family, school, play; nothing objectionable).
  Regex-verified all 38 are `^[a-z ]+$` (lowercase, letters+spaces only), 3
  mascot ("typie") lines confirmed.
- **qwerty-us**: diffed against qwerty-nl.js — comments translated only,
  positions/finger map/id identical pattern (`id:'qwerty-us'`), registered in
  `layouts/index.js`.
- **Wiring**: confirmed in source — `App.jsx` `detectLocale()` reads `?lang=en`,
  `setLocale()` called before any `gt()` in render, new profiles get
  `trainTaal/uiTaal: locale, layout: layoutForLocale(locale)`; `GameScreen.jsx`
  selects pack via `getPack(state.profile.trainTaal)`. One `/speel/` build
  (single `speel/index.html`, one Vite entry) — no SPA fork.
- **Zero-Dutch bar**: re-ran the developer's approach independently rather than
  trusting it — wrote my own SSR script (custom esbuild-JSX loader + Node,
  outside the repo) that renders `Onboarding` (full + refresh), `Hands`, and
  `GameScreen` via `react-dom/server` with locale forced to `en`, plus my own
  400-exercise headless engine simulation (curriculumIndex reached 19, 18
  promotions, 0 errors; 454/2556 generated tokens matched real `en/words.js`
  entries, e.g. "add", "lad", "sad", "dads" surfacing as real words from stage 4
  on). Findings:
  - Confirmed the **known, excused** gap: `src/ui/TypingSurface.jsx`'s
    `aria-label="Typ hier"` does render literally in the SSR'd Onboarding output
    (it's included via `<TypingSurface>` in the drill/refresh screens) — this is
    the exact issue the assignment's own Notes already flag as a deliberate
    follow-up (file is synced from typie-fun), matches instructions to not fail
    012 for it.
  - Confirmed the **known, excused** gap: `school.linkLabel` is missing from
    `STRINGS_EN` (assignment 018's addition, post-dates this lane) — renders as
    the raw key on the home screen for a new/unlocked-false profile. Matches
    instructions to not fail 012 for this (013's scope).
  - Also independently reproduced the "ik" pseudo-word artifact the developer's
    notes call out (Markov noise coincidentally spelling a Dutch word,
    e.g. exercise `"hagefa if ik is ii heeeesi eheeese"`) — confirmed this is
    generator noise, not a real-word pick from a Dutch source (not in
    `en/words.js`), and is architecture shared with nl, not a 012-introduced
    leak.
  - No other Dutch text found: scanned SSR output for diacritics and common
    Dutch function words (0 hits outside the two excused items above); grepped
    all `src/game` + `src/ui` JSX for hardcoded `aria-label=`/`title=`/
    `placeholder=` and Dutch text nodes — only the pre-existing input
    placeholders in Login/Friends/ParentEmail/SchoolCode (usernames/example
    codes, e.g. `bv. sanne_09`), which are sub-screens explicitly out of 012's
    "home → onboarding → gameplay" flow scope (013's key-parity job covers
    those screens) — same as `school.linkLabel`.
  - Minor observation, not a leak: `src/game/assets.jsx`'s `Svg()` component is
    passed a `title="munt"/"ster"/"Muntje"` prop by `Coin`/`Star`/`Mascot` but
    never spreads/renders `title` onto the DOM node (the JSX destructures only
    `{ markup, className }`) — so these hardcoded-Dutch strings are dead code,
    never actually reach the DOM. Not a real Dutch leak; flagging only as a
    trivial code-quality note, not a defect.
- **Build/tests**: `npm install` clean. `npm test` → **111/111 passing**
  (matches the cited main-tree number); `en-pack.test.js` (9) and
  `locale.test.js` (6) both green and independently reviewed — they genuinely
  import the real `curriculumCore.js`/`buildCurriculum`, not a hand-rolled
  stub. `npm run build` → clean (`gen-content` prebuild + `vite build`,
  emits `dist/speel/index.html` + `dist/index.html` + assets).

**Verdict: all criteria under §7 "### A —" met. Status → done.**
