---
id: 014
title: en native keyword research (pillar + launch spokes)
owner: product-owner
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes draft **C** of research/en-locale-scope.md §7: native-intent English
keyword targets (pillar term + slug; term + slug + intent per launch spoke, ≥2) with
the English competitor set — not translated Dutch keywords (SEO.md §5).

## Acceptance criteria

The checklist under "### C —" in research/en-locale-scope.md §7 is normative.

## Notes

~~Blocked on the §6 trigger~~ **UN-GATED 2026-07-23 by explicit Shareholder order
("English launch now", /ceo channel — decisions/006 rider).** The §6 funnel-proof
window no longer applies to this chain; 014→015→016→017 proceeds on assignment
sequencing alone. 017's zero-Dutch whole-launch QA gate still binds before en goes
live, and 037's coin-flash fix is already done. Terminal state needs_verification.

**Delivered 2026-07-23 (product-owner):** `research/en-keyword-research.md` — pillar
`typing for kids` → `/en/learn-typing-for-kids/`; launch spokes `free typing games for kids`
+ `what age should kids learn to type` (required ≥2) and `nitro type alternative`
(fast-follow), each with slug + intent + cross-locale hreflang key; dated English competitor
set (TypingClub, Typing.com, Nitro Type, KidzType, Dance Mat, TurtleDiary, TypeKids…) with
web sources; native-vs-translated-Dutch proof; no volume tool available in env so prioritised
by intent × attainability per SEO.md §7 (scale-time tool acquisition flagged to dispatcher/CEO).
en-locale-scope.md §7 draft-C checklist ticked and pointed at the deliverable.

## Verification (tester, 2026-07-23)

Checked all three "### C —" items in `research/en-locale-scope.md` §7 against
`research/en-keyword-research.md` directly, not against the deliverer's claims. Ran
independent WebSearch/WebFetch probes (dated 2026-07-23) rather than reasoning from the
diff.

**1. Pillar term+slug, ≥2 spokes with term+slug+intent — PASS.** §4 of the deliverable
gives pillar `typing for kids` → `/en/learn-typing-for-kids/`, and two required spokes
(`free typing games for kids` → `/en/blog/free-typing-games-for-kids/`, intent:
kid+parent discovery; `what age should kids learn to type` →
`/en/blog/what-age-to-learn-typing/`, intent: parent research) plus a clearly-labelled
optional 3rd (`nitro type alternative`). All fields present.

**2. Native English intent + competitor set, not translated Dutch — PASS, spot-checked.**
- Slug/URL shape verified against the actual generator: `scripts/gen-content.mjs`
  `pillarUrl()`/`articleUrl()` = `prefix(locale) + '/' + slug + '/'` and
  `prefix(locale)+'/blog/'+slug+'/'` — the deliverable's `/en/learn-typing-for-kids/` and
  `/en/blog/<slug>/` match this exactly.
- Cross-locale hreflang keys checked against the *real* nl pack
  (`scripts/content/nl.mjs`): the deliverable's stated nl counterparts
  (`/leren-typen-voor-kinderen/`, `/blog/beste-gratis-typspelletjes-kinderen/`,
  `/blog/op-welke-leeftijd-leren-typen/`, `/blog/nitro-type-alternatief/`) all exist
  verbatim as slugs in `nl.mjs` (lines 29, 63, 176, 321) — the hreflang cluster in draft-E
  will resolve to live pages, not orphans.
- Native-phrasing spot check via WebSearch (2026-07-23): "typing for kids" / "learn to
  type for kids" is genuine SERP phrasing (e.g. TurtleDiary's own title "Learn to Type for
  Kids"); "free typing games for kids" matches real listicle titles verbatim (Today's
  Parent "10 Free Typing Games for Kids", Connections Academy "5 Free Typing Games for
  Kids"); "what age should kids learn to type" / "best age to learn typing" matches a real
  cluster of parent-blog results (Ratatype, SheKnows, Typing.com blog, Learning.com);
  "nitro type alternative" is a real, actively-served query cluster (SaaSHub, TypingFastest,
  AlternativeTo). None of these read as machine-translated Dutch.
- Competitor claims spot-checked: Typing.com confirmed ad-supported for its free tier
  (multiple independent sources); Dance Mat Typing confirmed BBC-abandoned (Flash-based,
  died with Flash EOL Dec 2020, ~33k/mo residual searches per one source, third-party
  mirrors like KidzType/dancemattypingguide.com now serve the intent); KidzType confirmed
  via WebFetch: "30+ free typing games designed for ages 5-12," "no login required" —
  matches the deliverable's description verbatim.
- The dropped-row proof (`typediploma`, `groep 6/7/8` have no en counterpart) is sound
  reasoning, not fabricated — these are genuinely Dutch-culture-specific intents.

**3. Volumes validated with a tool, else intent × attainability, method stated — PASS.**
No volume tool was fabricated or invented; §5 states the constraint plainly and applies
intent × attainability scored from the dated SERP character (listicle/Q&A/competitor-brand
vs. broad-mixed), consistent with SEO.md §7's stated fallback and how nl was prioritised.
Honest caveat about English being a harder market (TypingClub/Typing.com incumbents) is
included, not glossed over.

**Non-blocking observations (not defects):**
- The three WebSearch snapshots above are mine, run independently on 2026-07-23; they
  corroborate rather than merely trust the deliverable's own dated citations.
- `todaysparent.com` blocked WebFetch (403); corroborated via WebSearch result snippet
  instead (title + content summary matched the deliverable's characterisation).
- No en-locale-scope.md checklist edits were needed; the checkboxes were already ticked by
  the product-owner and independently verified true here.

**Verdict: all three normative "### C —" criteria hold. Status → done.**
