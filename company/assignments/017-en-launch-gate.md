---
id: 017
title: en launch gate — whole-launch QA against the §1 SHIP list
owner: tester
status: done
priority: 4
blocked_by: [012, 013, 015, 016]
opened_by: ceo
---

## Goal

Materializes draft **F** of research/en-locale-scope.md §7: the hard gate enforcing
"never ship a half-translated locale" — checklist against §1 SHIP items 1–8 on a
production build preview, a monolingual-English walk-through with zero Dutch and
correct hreflang, and no nl regression. Only after sign-off is en launched (subject
to the §6 trigger having fired for 014–016).

## Acceptance criteria

The checklist under "### F —" in research/en-locale-scope.md §7 is normative.

## Notes

Owner is tester by design — this is acceptance QA, not a build. Terminal state:
done (set by the tester after the walk-through) or open with reproduced failures.

## Launch-gate QA (2026-07-23, tester)

Worked exclusively in `C:\companies\typcoon-lanes\q017` (branch `qa/017`), off
`e47426b` ("qa/017: integrate main into en chain for launch-preview QA"). Did not touch
the main checkout, did not merge, did not push. `node_modules` pre-installed;
`npm install --no-save playwright-core` added for browser automation (Chromium
`chromium-1228` from the machine's ms-playwright cache, same executable prior lanes used).

**Pre-flight.** Worktree had 20 files showing as "modified" under `git status`
(blog/pillar HTML + `sitemap.xml`) — diffed with `--ignore-all-space`: **zero real content
lines changed**, pure CRLF/LF line-ending noise (matches the exact phenomenon 016's own
verification flagged from its build-regen churn). Not a defect, not touched.

**`npm test`: 199/199 pass** (`node --test test/*.test.js`, 0 fail). **`npm run build`:
clean** — `gen-content: 22 URLs (pijler + blog + 15 artikelen + 1 pagina's) + sitemap`,
`vite build` 0 warnings/errors. **`npm run preview -- --port 4195`** served the build for
the entire QA session; killed after (port 4195 confirmed free afterward).

### §1 SHIP items 1–8 — checked against the served preview (not dev server)

1. **en player UI fully translated, no mixed-language screen.** PASS. Walked home →
   onboarding → gameplay → chapter-1-adjacent flow, plus the exam offer/pass/fail overlays
   and the theme picker (§7 F's explicit "new game surfaces" ask) — zero Dutch anywhere,
   verified both by an independent Dutch-lexicon grep of rendered body text at every step
   and by reading every screenshot.
2. **en practice data pack, English words/sentences.** PASS. Exercise text observed live:
   `"fj fj fj fj ff fff"`, `"ld j; f; h; hds all sssh lash hal;"`, `"al a; s; g; llda alas
   sad flash has;"`, `"jh h; f; a; fad add ask agsa js; sa"` — real English words
   (all, salad, flash, add, ask, fad, sad, has) built from the home-row unlock order, not
   transliterated Dutch. Matches research §3.3's acceptance description exactly.
3. **en layout registered (`qwerty-us`).** PASS. `src/layouts/qwerty-us.js` has
   `id:'qwerty-us'`; `src/layouts/index.js` registers `'qwerty-us': qwertyUs`; the seeded
   en save's `profile.layout` resolves to it without error.
4. **en landing at `/en/`.** PASS. `lang="en"`, English copy, `og:locale` present, "Play
   free" CTA → `/speel/?lang=en`, which rendered "Type coins. Build your factory. Become a
   tycoon." — genuinely English, confirmed live (not a lang-agnostic default).
5. **en pillar page.** PASS. `/en/learn-typing-for-kids/` — `lang="en"`, English title
   ("Typing for Kids: The Complete Guide to Learning to Type (2026)"), English body, zero
   Dutch.
6. **Working `/en/blog/` index.** PASS. `/en/blog/` renders, links to both launch spokes
   (`free-typing-games-for-kids`, `what-age-to-learn-typing`) resolve 200, no 404s.
7. **Correct hreflang + sitemap.** PASS. `node scripts/check-hreflang.mjs` against the
   built `dist/`: **`check-hreflang: PASS — 64 hreflang alternates checked across dist/,
   all resolve.`** Spot-checked in the live preview: `/en/` emits
   `{nl: https://typcoon.com/, en: https://typcoon.com/en/, x-default: nl}`; the en pillar's
   `nl` alternate resolves to the *real* nl slug
   (`https://typcoon.com/leren-typen-voor-kinderen/`), not a broken locale-prefix guess —
   confirms 016's slug-mapping fix survived the merge. `sitemap.xml` has 22 `<url>` entries
   (17 pre-existing nl + 5 new en: `/en/`, `/en/learn-typing-for-kids/`, `/en/blog/`,
   `/en/blog/free-typing-games-for-kids/`, `/en/blog/what-age-to-learn-typing/`) — verified
   by diffing the preview's sitemap URL list against production's (below).
8. **Native keyword research.** PASS (deliverable, not re-derived here).
   `research/en-keyword-research.md` exists in the worktree with the pillar/spoke targets
   14/15/16 built against.

### Monolingual-English walk-through (zero Dutch)

Drove `/en/` → pillar → blog index → blog spoke → "Play free" CTA → `/speel/?lang=en` →
onboarding → gameplay, in a real headless Chromium via Playwright, checking rendered body
text against a ~25-word Dutch-lexicon grep at every stop (script:
`qa-scripts/017-launch-gate-walkthrough.mjs`). All clean. Beyond the base path, per the
assignment's explicit ask, spot-checked the **new game surfaces added since 015/016**:

- **Exam offer (live-triggered, not just pill-click).** Seeded a "near-ready" en save,
  played real exercises until the engine's own edge-trigger fired the offer overlay live:
  *"Ready for an exam? You know these letters well! Want to try the Home Row Exam? Just
  for the glory — if it doesn't go your way, you just keep playing."* / "Start the exam!"
  / "Not right now" — fully English (screenshot `16-en-live-exam-offer.png`).
- **Exam pass.** *"Exam passed! Nice work! You passed the Home Row Exam with 100%
  accuracy."* + "+150" + "Nice!" — fully English (`12-en-exam-pass.png`).
- **Exam fail** (deliberately mistyped to force <passAcc). *"Not quite yet — no worries!
  You were at 50% accuracy. Practise a bit more and you'll ace it!"* — fully English,
  British-English "Practise" spelling used correctly as a verb (`15-en-exam-fail.png`).
- **Theme picker.** *"Choose your theme" / "The default theme is free and complete..." /
  "The Coin Press" / "Night Shift" / "Not right now"* — fully English
  (`09-en-theme-picker.png`).
- **Coin flash.** *"+50 · neat · combo · warm-up"* breakdown text, fully English
  (`08-en-coin-flash.png`).

All 18 screenshots saved to `company/assignments/017-screenshots/` (numbered 01–18,
covering desktop + a mobile-viewport (390×844) spot-check of the landing and app home —
both render correctly responsive, fully English, no layout breakage).

**One false alarm, resolved, not a defect:** my first walkthrough pass flagged
`en-*-body-dutch` FAILs because my own Dutch-tell wordlist naively included the string
"letters" — which is also a normal English word ("the first letters", "introduces letters
one at a time"). Confirmed by reading the actual HTML context on the landing/pillar/blog
pages — all genuine English usage, zero real Dutch. Fixed the check (removed the ambiguous
word) and re-ran; all pass. Recorded here for transparency, not filed as a product defect.

**Also not a defect:** 11 `404` network responses observed during gameplay, all
`GET /api/track` — expected under `vite preview`, which does not serve Vercel serverless
functions (`api/track.js` exists in the repo and is deployed as a real endpoint in
production; this is a local-preview limitation, not locale-specific, not new, and not
something 017 is scoped to fix). Confirmed via a dedicated isolated request-log run.

### hreflang survival check

`node scripts/check-hreflang.mjs` after the merge-plus-build: **PASS — 64/64 resolve.**
Matches 016's own verified count exactly, confirming the fix survived the main-branch
merge into this chain cleanly.

### nl regression check (no changes beyond documented hreflang additions)

Fetched live production (`https://typcoon.com/`, `https://typcoon.com/leren-typen-voor-kinderen/`,
`https://typcoon.com/sitemap.xml`, `https://typcoon.com/robots.txt`) read-only and diffed
byte-for-byte against the preview's equivalents (hreflang `<link>` lines excluded from the
diff since those are the documented addition):

- **`/` (nl landing):** exactly one diff line — the footer language-switch link
  `· <a href="/en/">English</a>` appended, which is the documented 015 addition. No other
  change.
- **`/leren-typen-voor-kinderen/` (nl pillar):** **zero** diff lines outside hreflang.
- **`robots.txt`:** byte-identical, still points at the single `sitemap.xml`; `/speel/`
  still serves `<meta name="robots" content="noindex">`.
- **Sitemap URL set:** all 17 production nl URLs present unchanged in the preview's
  sitemap, plus exactly 5 new en URLs (22 total, matches the build log and 016's claim).
- **nl game still plays in Dutch:** fresh nl onboarding rendered *"Jouw vingers zijn de
  werkers 🧤 — Elke vinger heeft een eigen kleur én een eigen plekje op het
  toetsenbord..."* — genuinely Dutch, unchanged (`14-nl-onboarding.png`).

### Suite / build / checker output summary

- `npm test` → `# tests 199 / # pass 199 / # fail 0`
- `npm run build` → clean, `gen-content: 22 URLs ... + sitemap`, `vite build ✓ built in
  804ms`
- `node scripts/check-hreflang.mjs` → `PASS — 64 hreflang alternates checked across
  dist/, all resolve.`
- `npm run preview -- --port 4195` → served throughout; all key routes (`/`, `/en/`,
  `/en/learn-typing-for-kids/`, `/en/blog/`, both en spokes, `/sitemap.xml`, `/speel/`)
  returned `200`.

### Probe scripts committed (qa-scripts/)

- `017-gen-en-exam-save.mjs` — en-locale exam-ready save generator (uiTaal/trainTaal
  forced to `en`), modelled on 049's `gen-exam-save.mjs`.
- `017-gen-en-nearready-save.mjs` — en-locale "near-ready" save so the live exam-offer
  moment can be watched firing naturally (not just via pill-click).
- `017-launch-gate-walkthrough.mjs` — the main walkthrough: `/en/` → pillar → blog →
  spoke → play CTA → onboarding → gameplay → coin-flash → theme picker → exam pill/pass,
  plus an nl-landing/nl-onboarding sanity pass, all asserting against a Dutch-lexicon grep
  and recording pass/fail per check.
- `017-en-exam-fail.mjs` — forces an exam FAIL via deliberate mistypes, captures the
  English fail-card copy.
- `017-en-exam-offer-live.mjs` — drives real play on a near-ready save until the engine's
  own edge-trigger opens the exam offer, captures the live English offer copy.
- `017-mobile-check.mjs` — 390×844 viewport spot-check of `/en/` and `/speel/?lang=en`.

### Verdict: SIGNED OFF

All §1 SHIP items 1–8 pass on the production build preview. The monolingual-English
walk-through — extended to the new exam/theme/coin-flash surfaces per this assignment's
explicit ask — shows zero Dutch anywhere reached, including a live-triggered exam offer,
an exam pass, an exam fail, the theme picker, and the coin-flash breakdown. hreflang
resolves 64/64 and survived the main-branch merge unchanged from 016's own count. nl is
unchanged in substance versus live production except the one documented footer-link
addition; the nl game still plays in Dutch. No defects found. Status flipped to `done`.

Commit on `qa/017`: this note + the `qa-scripts/017-*.mjs` probes, committed with explicit
paths per protocol (see commit log). Screenshots at
`company/assignments/017-screenshots/01-en-landing.png` through `18-en-app-mobile.png`.
