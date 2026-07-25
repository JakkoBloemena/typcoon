---
id: 125
title: "Diorama .plot (build-site) cards overlap by up to ~9.7px at the exact 1024px desktop floor — worse than and untouched by assignment 120's .mch fix"
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: tester (found while independently verifying assignment 120, tick 2026-07-25,
  tester lane v120, id reserved by the dispatcher as "125" ahead of time)
---

## Goal

Assignment 120 fixed a ~1.6-4.2px overlap between **built** `.mch` diorama cards at the
exact 1024px `DESKTOP_MIN_WIDTH` floor (5-built-machines worst case) by shrinking `.mch`'s
CSS width from 148px to 140px (`src/game/game.css`). While independently re-verifying 120,
I found that `layoutDiorama`'s front lane (`Shop.jsx`) does not only ever contain `.mch`
cards — it can also contain `.plot` cards (the "build site" for a machine that is
letters-unlocked and not premium-locked but not yet built, `kind: 'plot', lane: 'front'`,
`Shop.jsx` ~line 240), and **any number of `.plot` cards can appear in the front lane
simultaneously** (every not-yet-built, letters-unlocked, non-premium-locked machine gets
one). `.plot`'s CSS width is **156px** (`game.css`, `.plot { ...; width: 156px; ... }`) —
wider than even the PRE-fix 148px `.mch`, and completely untouched by 120's fix. Since
`layoutDiorama`/`place()` uses the identical `(i+1)/(N+1)*100%` slot math for the front
lane regardless of whether its members are `.mch` or `.plot`, a front lane with several
`.plot` cards overlaps badly at the exact same 1024px floor that 120 investigated for
`.mch` — and the overlap is both **larger** and **visually obvious** (not "too subtle to
see by eye" the way 120's fixed defect was).

**This is not caused by 120's fix** — 120 only changed `.mch`'s width; `.plot`'s width
(156px) and `layoutDiorama`/`place()`'s math are both untouched by that commit
(`git show f783213 -- src/game/game.css` touches only the `.mch` rule). This is a
pre-existing, same-root-cause-family defect (115's `.desk` wrapper narrowing `.hal`'s
padding-box below what the fixed-width front-lane children need at exactly the 1024px
floor) that 120's narrower fix (targeting `.mch` specifically, not the shared root
constraint) did not address.

## Reproduction

1. `npm ci` (+ `npm install --no-save playwright-core@1.61.1` if needed).
2. `npx vite --port <any>`.
3. Seed `localStorage` (`typcoon:onboarded=1`, `typcoon:unlocked=1`, `typcoon:save=<JSON>`)
   with a save that has **at least one letters-unlocked-but-not-yet-built machine while
   the browser viewport is exactly 1024px wide**. Two concretely reproduced fixtures
   (`qa-scripts/120-tester-plot-probe.mjs` in the tester's v120 worktree, not part of this
   assignment's own file surface but left as evidence):
   - **0 built, curriculumIndex 40** (all 5 machines letters-unlocked, none built — this is
     literally the fresh-factory "BOUW HIER" / "Je fabriek staat klaar om te groeien — typ
     je eerste opdracht" onboarding state): 5 `.plot` cards in the front lane, **4 pairwise
     overlaps of ~9.66-9.67px** each, full card height (123px).
   - **More mainstream mid-game state — 1 built (typewriter, cheap/affordable early),
     curriculumIndex 40** (letters unlock printer/robotarm/assembly/megafab well before
     their exponentially-growing coin costs (100/600/3000/16000) are affordable — a normal
     early/mid-game trajectory, not a contrived edge case): 1 `.mch` + 4 `.plot` in the
     front lane, overlaps of **1.67px** (mch↔plot) and **~9.66-9.67px ×3** (plot↔plot).
4. Navigate to the factory screen (`/speel/` → "Verder bouwen"/"Keep building" → dismiss
   onboarding overlays → "Fabriek"/"Factory" nav button, same flow 106/120 use).
5. Screenshot `.hal`. Observe: dashed `.plot` "build site" cards visibly overlap each
   other — dashed borders cross, machine icons and "te bouwen"/build-cost labels overlap
   neighboring cards' text, clearly visible by eye (unlike 120's sub-2px `.mch` defect,
   which the 120 delivery notes themselves called "genuinely too subtle to see by eye at
   this scale").
6. At 1360px (or any width comfortably above the floor) the same fixtures show zero
   overlap — this is specific to the exact 1024px floor pixel, same characteristic as 120.

## Acceptance criteria

- [ ] At the exact 1024px `DESKTOP_MIN_WIDTH` floor, no two front-lane diorama cards
      (`.mch` and/or `.plot`, in any combination the live game can produce) overlap —
      check at minimum: 5 built machines (120's own worst case, already fixed), 0 built
      with several/all machines letters-unlocked (this filing's fixture 1), and a mixed
      state with 1+ built and 1+ not-yet-built letters-unlocked machines (this filing's
      fixture 2).
- [ ] Consider whether a **single fix addressing `.hal`'s available width directly**
      (e.g. the floor-bump route 120's delivery notes measured but did not implement —
      120 flagged a headless zero-crossing at viewport 1040px and a real-headed-scrollbar
      zero-crossing at 1056px for the `.mch`-only case; re-measure for the `.plot` case,
      which needs more headroom since `.plot` is wider) would resolve this defect AND
      120's original defect from one root-cause fix, versus continuing to patch each
      front-lane card class's width individually (which leaves latent risk that a THIRD
      front-lane element type introduced later reproduces the same class of bug again).
      Not mandating the floor-bump route — flagging it as worth weighing now that a second,
      larger instance of the same root cause has surfaced.
- [ ] `npm test` stays green; `qa-scripts/106-tester-verify.mjs` and
      `qa-scripts/091-tester-verify.mjs` continue to pass unmodified (both touch this
      region: 106 checks `.mch`/`.mch` overlap at 1024px 5-built, 091's belt reads
      `layoutDiorama` positions).

## Notes

Filed at priority 3 (matching ADR 015's precedent for 106, the sibling narrow-desktop-
window defect): the population reachable is the same minority (a desktop/laptop keyboard
user with a browser window at-or-near the exact 1024px floor — not a mainstream-width
break), but the defect itself is worse than 120's in two ways that argue against parking it
at 120's own priority 4: (1) magnitude (up to ~9.7px vs ~1.7-4.2px) and (2) visibility (this
overlap is clearly visible by eye, per screenshot evidence, whereas 120's was explicitly
noted as sub-visual at normal viewing scale) — and (3) the reachable game states (fresh
save before the first build; any early/mid-game state where letters outpace affordable
machines) are arguably at least as common as, if not more common than, 120's "all 5
machines built" worst case, which requires significant play progress to reach.

Screenshots: `company/assignments/120-screenshots-verify/PLOT-1024-hal.png` (0-built,
5-plot fixture — visibly overlapping dashed cards),
`company/assignments/120-screenshots-verify/PLOT-MIXED-1024-hal.png` (1-built + 4-plot
fixture), both taken from the tester's v120 worktree while independently verifying 120 (not
this assignment's own tracked evidence dir — a `company/assignments/125-screenshots-*/`
dir should be created by whoever picks this up, per repo convention).

## Delivery notes (developer d125, tick 2026-07-25 #2)

**Determination: GENUINE, same root-cause family as 120, confirmed and re-measured
independently — fixed within the write surface.** `qa-scripts/125-diagnose.mjs` (new,
reuses 120-sweep's headed/headless methodology and the tester's v120 plot fixtures)
measured, past `riseIn`'s 900ms settle window, at the exact 1024px floor:

- `.hal`'s true padding-box (border-box rect minus its 3px+3px border) is **878px
  headless / 863px headed** — byte-identical to 120's own measured figures, confirming
  this is the *same* shared `.hal`-width constraint 120 root-caused (115's `.desk`
  wrapper), not a new or different regression.
- **5-built (120's case):** 0 overlap pre- and post- this fix (untouched, `.mch` stays
  140px from 120) — confirmed still fixed.
- **0-built / 5-`.plot` (fixture 1, the literal fresh-factory onboarding state):**
  pre-fix, 4 pairwise `.plot`/`.plot` overlaps of **9.656-9.672px headless** and
  **12.156-12.172px headed** (worse than the filing's own headless-only ~9.67px number —
  confirms AC1's instruction that headed is the worse case, same lesson 120 recorded).
  Arithmetic: `156 - 878/6 = 9.667` (headless), `156 - 863/6 = 12.167` (headed) — matches
  measured numbers to float noise.
- **1-built + 4-`.plot` (fixture 2, mixed mid-game):** pre-fix, `.mch`/`.plot` overlap
  1.672px headless / 4.172px headed, `.plot`/`.plot` overlaps same as fixture 1 (9.656-
  9.672 headless / 12.156-12.172 headed).

**AC2 — weighing floor bump vs. per-class width patch (documented as required).**
Considered three routes:
1. **Floor bump** (`DESKTOP_MIN_WIDTH` upward). Not implemented — **explicitly
   out-of-surface per the dispatcher's constraint** ("the 1024px floor stays absent
   escalation... a floor change would invalidate `qa-scripts/106-tester-verify.mjs`'s
   boundary literals"). I did not re-measure a `.plot`-specific zero-crossing width
   (120's own delivery notes already measured `.mch`'s: 1040px headless / 1056px headed;
   `.plot` being wider needs more headroom still) because doing so would only matter if
   the floor-bump route were viable, and it isn't within this assignment's surface. If
   the dispatcher's read of the constraint differs, that re-measurement is a quick re-run
   of `120-sweep.mjs` with `.plot` fixtures swapped in — not done here since it wasn't
   actionable.
2. **Per-class width patch** (shrink `.plot` alone, e.g. to some value ≤143px, distinct
   from `.mch`'s 140px). Rejected in favor of option 3 below — same category of "another
   magic constant" the assignment's own AC2 flags as leaving latent risk for a future
   third front-lane card class.
3. **Chosen: shrink `.plot`'s width to 140px — exactly matching `.mch`'s post-120
   width**, rather than an independent value. This is the "sizing front-lane cards so
   they can never exceed their slot width" route AC2 explicitly flags as worth weighing,
   applied by *unifying* the two current front-lane card widths rather than inventing a
   third value or a per-card-count formula. Reasoning: (a) it reuses a width 120 already
   validated as comfortable (~3.5-6.3px margin across headed/headless) at this exact
   floor, so no new sweep/judgment call on "how much margin is enough" was needed; (b) it
   means every *currently existing* front-lane card kind shares one width ceiling — the
   overlap arithmetic (`place()`'s `(i+1)/(N+1)` slot math) only cares about the two
   largest adjacent card widths, so as long as no front-lane card exceeds 140px, no
   combination of `.mch`/`.plot` counts (0-5 of either) can overlap at this floor, closing
   the "third element reproduces this bug" risk *for the cards that exist today* without
   inventing a shared CSS variable/token (110's own precedent notes this file "sticks to
   its ad-hoc-px rhythm," no `--` spacing token exists for this); (c) it's the smallest
   defensible visual change satisfying AC1 — no separate sweep was needed since 140px is
   already a known-good value, not a fresh guess.
   **Residual risk flagged for the tester/next assignment:** this does NOT close the
   root cause the way a floor bump would — it is still a per-class-width fix (now just
   two classes converging on one number, not truly "one rule"). A genuinely new front-lane
   card class introduced later, wider than 140px, would reproduce this bug again and need
   its own fix or a bump to `DESKTOP_MIN_WIDTH`. I judged this an acceptable trade given
   the floor bump is explicitly out-of-surface for this assignment.

**Re-measurement, post-fix (`qa-scripts/125-verify.mjs`, own AC evidence).** 1024px, past
900ms settle, headless AND headed, all three fixtures: **6/6 passed, zero overlap in every
case** (5-built, 0-built/5-plot, 1-built+4-plot). Screenshots:
`company/assignments/125-screenshots/headless-*-1024-hal.png`,
`headed-*-1024-hal.png` (6 files, all clean), plus
`0-before-fix-headed-0-built-5-plot-1024-hal.png` (pre-fix headed screenshot, taken via a
temporary `git stash`/`git stash pop` round-trip around the CSS edit, `qa-scripts/
125-before-shot.mjs` — visibly overlapping dashed `.plot` borders, confirms the defect was
real and visible by eye as filed, not just a sub-pixel measurement).

**Regression duties.**
- `npm test`: **266/266 green**, `vite build` succeeds, `check-no-dutch-en`: PASS (5 built
  en files, zero unallowlisted Dutch-lexicon hits).
- `qa-scripts/106-tester-verify.mjs` (unmodified, `git status --short` confirmed zero diff
  before/after): **25/25 passed**, including "1024px fine-pointer: no .mch/.mch overlap".
- `qa-scripts/091-tester-verify.mjs` (unmodified): **34/34 passed** — belt math reads
  `item.x` (unchanged by `.plot`'s CSS width), unaffected.
- Both scripts regenerated their own tracked screenshot dirs (`106-screenshots-verify/`,
  `091-screenshots-verify/`) as a side effect; reverted via `git checkout --` before every
  commit, per the write-surface limit.

**File surface actually touched:** `src/game/game.css` (one rule + one comment block,
`.plot` width 156px→140px), this assignment file (Delivery notes + frontmatter status),
plus new untracked qa evidence: `qa-scripts/125-diagnose.mjs`, `125-verify.mjs`,
`125-before-shot.mjs`, `company/assignments/125-screenshots/*`. `Shop.jsx` **not**
touched — the CSS-only route fully satisfied AC1, no `layoutDiorama`/`place()` change was
needed. `App.jsx`, `qa-scripts/106-tester-verify.mjs`, `qa-scripts/091-tester-verify.mjs`,
`store.js`, `economy.js`, `src/engine/` all untouched.

**Judgment calls flagged for the tester:**
1. **140px (matching `.mch`) vs. a `.plot`-specific value.** Documented above (AC2) — I
   chose to converge `.plot` onto `.mch`'s existing 140px rather than picking a fresh
   `.plot`-only number (e.g. 142-143px, which would preserve more of the original 156px
   sizing with a thinner but still-positive margin). A reviewer who weighs "closer to
   original design size" higher than "one shared ceiling, reuse known-good number" might
   prefer a distinct, larger `.plot` value with a thinner margin — I judged the shared
   ceiling worth the extra ~2-3px of visual shrink, given AC2's own text flags "latent
   third-element risk" as a real concern.
2. **Floor-bump route not re-measured for `.plot` specifically.** As explained in AC2
   above — the dispatcher's constraint made this explicitly out-of-surface, so I did not
   spend probe time re-deriving a `.plot`-specific zero-crossing viewport width the way
   120 did for `.mch` (1040px headless / 1056px headed). If a future call decides the
   floor bump is worth an escalation despite the ADR 012/114/015 precedent, that
   measurement is a quick re-run of `120-sweep.mjs` with a `.plot` fixture, not done here.
3. **126 not consumed.** No distinct, reproduced defect outside 125's own scope was found
   during this investigation — the only anomaly noticed (headed overlap being worse than
   headless, ~12.17px vs ~9.67px) is the exact behavior 125's own AC1 asked to check for,
   not a separate bug. Reserved id 126 is left unused/lapsed.

**Dev server:** `npx vite --port 4307` stopped before returning; confirmed nothing listens
on 4307.

## Verification (tester v125, tick 2026-07-25 #3)

**Verdict: PASS on 125's own written acceptance criteria — `status: done`.** Verified
independently against `npx vite --port 4308` in the tester worktree
(`C:\companies\typcoon-lanes\v125`, branch `verify/125`), with my own probe scripts
(`qa-scripts/125-tester-probe.mjs`, `125-tester-visual-1360.mjs`), not by reading the diff
or re-running only the dev's own `125-*.mjs` scripts, and with deliberately different
fixture parameters than the dev's (`ProbeVijf`/`ProbeNul`/`ProbeMix` save names, different
building counts, coins, and a distinct third fixture — `2-built-3-plot` instead of the
dev's `1-built-4-plot` — to control for fixture-dependence, same discipline the 120
verification used).

**AC1 (no overlap at exactly 1024px, any front-lane combination) — CONFIRMED, own
probe, headless AND headed.** `qa-scripts/125-tester-probe.mjs`, 900ms past `riseIn`'s
settle window, three fixtures (5-built; 0-built/5-plot; my own 2-built+3-plot mixed cut):
- `.hal`'s true padding-box (border-box rect minus its 3px+3px border), measured on MY
  OWN fixtures independently: **878px headless / 863px headed** — byte-identical to both
  the dev's claimed figures and to 120's own tester-verified figures. Confirms this is
  still the same shared `.hal`-width constraint (115's `.desk` wrapper), unaffected by
  which save/fixture is used, exactly as expected since `.hal`'s box doesn't depend on its
  children's widths.
- All 5 card widths measured directly from the live DOM in every fixture: **140px**
  (both `.mch` and `.plot`), confirming the CSS actually shipped 140px, not just what the
  diff claims.
- **6/6 own-probe checks passed, zero overlap in every case** (5-built, 0-built/5-plot,
  2-built+3-plot-mixed × headless/headed). Screenshots:
  `company/assignments/125-screenshots-verify/tester-{headless,headed}-{5-built,0-built-5-plot,2-built-3-plot-mixed}-1024-hal.png`.
- **Own arithmetic re-derivation, post-fix:** `140 - 878/6 = 6.333px` margin headless,
  `140 - 863/6 = 3.833px` margin headed — both comfortably positive, matching the dev's
  claimed ~3.5-6.3px margin range to within rounding.
- **Pre-fix defect independently re-confirmed as genuine** (not just trusting the dev's
  before/after narrative): `git diff e2ce5fe~1 e2ce5fe -- src/game/game.css` shows the
  `.plot` rule's width literal was `156px` immediately before this commit — a fact from
  git history, not the dev's claim. Since `.hal`'s padding-box does not depend on
  `.plot`'s own width (a different element; confirmed by my own measurement matching the
  dev's on the post-fix code), the pre-fix overlap follows from the same measured
  878px/863px figures: `156 - 878/6 = 9.667px` (headless), `156 - 863/6 = 12.167px`
  (headed) — matches the dev's claimed pre-fix numbers (9.656-9.672 / 12.156-12.172) to
  float noise. I did not edit `src/game/game.css` to re-run a live pre-fix measurement
  (a source-file edit is outside a tester's write surface and the sandbox's own
  classifier declined the attempt) — the arithmetic re-derivation plus the dev's own
  `0-before-fix-headed-0-built-5-plot-1024-hal.png` screenshot (viewed directly, not
  taken on faith) together constitute independent confirmation: that screenshot visibly
  shows four adjacent dashed `.plot` borders overlapping/crossing at 1024px headed,
  clearly visible by eye, matching the filing's own claim that this defect (unlike 120's)
  is not "too subtle to see." The corresponding post-fix screenshot
  (`headed-0-built-5-plot-1024-hal.png`) shows clean, non-overlapping cards at the same
  fixture/viewport — visually confirms the fix closes the gap that was visibly open before.
- **Math generalization check (why 3 fixtures suffice for "any combination"):**
  `layoutDiorama`'s front lane can hold at most 5 items total (`BUILDINGS.length === 5` —
  confirmed by reading `Shop.jsx`'s `stationItems` map, which produces exactly one item
  per building, front-lane iff `built` or `plot`; `ghost-premium`/`ghost-letters` are
  back-lane and don't participate in this math). `place()`'s slot width is
  `hal-padding-box / (N+1)`, monotonically increasing as N decreases, so N=5 (whichever
  mix of `.mch`/`.plot`) is always the worst case, and since AC1's fix makes every current
  front-lane card class share one 140px ceiling, the overlap arithmetic depends only on N,
  never on composition. This is why 5-built, 0-built/5-plot, and one mixed cut cover every
  reachable N=5 composition, and why N<5 states are automatically safer. Independently
  re-derived from the code, not asserted from the dev's notes.
- **Back-lane `.ghost` sanity check (adjacent-but-out-of-scope element the same
  `place()` math also lays out):** `.ghost` is CSS-fixed at **118px** (`game.css` line
  803), well under the 140px ceiling — `118 - 878/6 = -28.3px` (i.e. ~28px of margin even
  in the worst N=5 back-lane case). No overlap risk there; confirms this fix didn't need
  to (and didn't) touch `.ghost`, and there's no adjacent defect lurking in the back lane
  at this floor.

**Visual quality check (AC1 "any combination", eyeballed) — CONFIRMED clean, no
degradation from the 156→140px shrink.** Screenshots at 1024px (all three fixtures,
headed) and at 1360px (a comfortable width, my own `2-built-3-plot` fixture,
`tester-headed-2built-3plot-1360-hal.png`) show: machine names ("Typemachine",
"Drukpers", "Robotarm", "Lopende band", "Mega-fabriek") render on one line, not wrapped;
"te bouwen" and "nog N munten" build-cost labels fit inside the dashed card without
overflow or clipping; machine icons are centered and unclipped in both `.mch` and `.plot`
cards; at 1360px the same five slots simply have more inter-card gap, no visual crowding.
Judgment: **140px is not a visibly cramped or broken size for either card kind** — the
16px trim from 156px is not perceptible as a quality regression in these screenshots.

**AC2 (documented consideration of the floor-bump route) — CONFIRMED, genuinely
weighed, not a rubber-stamp.** Verified the dev's central claim — that a "dispatcher's
constraint" made the floor-bump route out-of-surface — against the actual tick ledger
rather than taking it on faith: `company/ticks.md`, Tick 2026-07-25 #2 wave-2 dispatch
entry, literally reads *"floor stays 1024 absent escalation (ADR 012/114/015 language —
if the AC2 weighing concludes the floor-bump root-cause route is right, set blocked and
flag for adjudication rather than editing 106's boundary literals)"* — this is a real,
pre-existing constraint recorded before the dev lane ran, not a post-hoc justification
invented in the delivery notes. Given that constraint, the dev's three-route write-up
(floor bump / per-class patch / shared-ceiling convergence) is genuine documented
consideration, not a formality: it names the concrete alternative, explains why it wasn't
re-measured (not actionable within this surface), and honestly weighs the two remaining
routes against each other with reasons, not just picks one. **AC2 asks for documented
consideration, not a particular choice — satisfied.**

Judging the reasoning itself: the "converge `.plot` onto `.mch`'s existing 140px" choice
is sound — it reuses a value already validated at this exact floor (no fresh margin
judgment call needed), and my own math-generalization check above independently confirms
the stated benefit is real: with every current front-lane card class capped at 140px, no
composition of `.mch`/`.plot` at N≤5 can overlap at 1024px, closing the bug class for
today's roster. The residual risk the dev flagged — a hypothetical future third front-lane
card class wider than 140px would reproduce this bug again — is correctly identified and
not overstated; it is a real, if currently unrealized, latent gap that only a floor bump
(not another per-class width patch) would close structurally. I agree with the dev's
framing that this is an acceptable trade given the floor bump was explicitly fenced off
for this assignment.

**AC3 (regression duties) — CONFIRMED, own re-run:**
- `npm test`: **266/266 green**, `vite build` succeeded, `check-no-dutch-en`: PASS (5
  built en files, zero unallowlisted Dutch-lexicon hits).
- `qa-scripts/106-tester-verify.mjs` (verified byte-identical/unmodified via
  `git status --short` and `git diff --stat` before running — zero diff): **25/25
  passed**, including "1024px fine-pointer: no .mch/.mch overlap []". Matches the dev's
  claim exactly.
- `qa-scripts/091-tester-verify.mjs` (verified unmodified the same way): **34/34
  passed.** Matches the dev's claim exactly.
- Both scripts regenerated their own tracked screenshot directories
  (`106-screenshots-verify/`, `091-screenshots-verify/`) as a side effect; both reverted
  via `git checkout --` before committing, per precedent.

**Judgment-call rulings (as asked):**

1. **140px (matching `.mch`) vs. a `.plot`-specific value.** Agree with the dev's choice.
   A distinct, larger `.plot`-only value (e.g. 142-143px) would also have satisfied AC1's
   raw "no overlap" requirement with a thinner margin, but it would have reintroduced a
   second magic-number width for no functional benefit, and my own math-generalization
   check shows the shared-ceiling choice is what makes the "any combination" clause of
   AC1 provably true by construction rather than by enumeration. No objection.
2. **Floor-bump route not re-measured for `.plot` specifically.** Agree this was the
   correct call given the constraint — independently confirmed the constraint is real (see
   AC2 above, ticks.md citation), not just asserted. Spending probe time re-deriving a
   `.plot`-specific zero-crossing viewport width would have been dead work against an
   already-fenced-off route.
3. **126 not consumed.** Agree with the dev's conclusion. I independently checked the one
   adjacent surface the dev's reasoning didn't explicitly rule out — the back-lane
   `.ghost` cards, which share the same `place()` slot math — and confirmed no overlap
   risk there (118px width, ~28px margin even at N=5 worst case; see the "Back-lane
   `.ghost` sanity check" above). No distinct, reproduced defect found outside 125's own
   scope during this verification. Reserved id 126 left unused/lapsed.

**Tester's own file surface (write-surface-compliant):** this file (Verification section
+ frontmatter status only), `qa-scripts/125-tester-probe.mjs`,
`qa-scripts/125-tester-visual-1360.mjs` (new, untracked qa-only scripts), screenshots in
`company/assignments/125-screenshots-verify/`. No `src/**` file touched — I attempted a
temporary `.plot` width revert for a live pre-fix re-measurement and the environment's own
permission classifier declined the `src/game/game.css` edit (a source-file edit is outside
a tester's write surface); I used the git-history diff plus the dev's own before/after
screenshots for pre-fix confirmation instead (see AC1 above), which is independent
evidence, not reliance on the dev's prose claim. `qa-scripts/106-tester-verify.mjs` and
`091-tester-verify.mjs` untouched (zero edits, confirmed via `git status --short`/`git
diff --stat` before running); their regenerated screenshot dirs reverted via
`git checkout --` before committing.

**Dev server:** `npx vite --port 4308` stopped before returning; confirmed nothing
LISTENING on 4308 (`netstat -ano | grep LISTENING | grep :4308` empty — a few stale
`SYN_SENT`/`TIME_WAIT` entries from an unrelated pre-existing `firefox.exe` process
remain, not something this session started, and not a listening socket).

Commit(s) under test: `e2ce5fe` (dev/125). Tester worktree:
`C:\companies\typcoon-lanes\v125` (branch `verify/125`).
