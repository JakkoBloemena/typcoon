# Milestone scope — the factory experience (product-owner, 2026-07-24)

*Authority: decisions/011 (Shareholder direction, factory redesign, design-first) and
assignment 068. Design gate: assignment 067 — `design/DESIGN-FACTORY.md` + `design/factory-mocks/`,
chosen direction **C "Het Bouwplan"**, verified `done` by the tester. This is a plan, not
code; no production code is written here. Ids 071–085 pre-allocated to me by the dispatcher;
I use 071–076 and leave 077–085 free (no overflow, no TBD). Read `design/DESIGN-FACTORY.md`
first — the mocks in `design/factory-mocks/` are the visual scope reference this document
sequences into buildable assignments.*

---

## 0. The one thing this milestone does

Split today's single play screen — typing boxed on the left while a factory-floor strip and
a shop rail compete for the eye — into **two surfaces the Shareholder asked for**:

- a **calm typing view** — typing is the work surface, one named goal visible, zero ambient
  motion; and
- a separate **exciting factory page ("Het Bouwplan")** — a blueprint roadmap you fill in,
  where "my factory is growing" is legible and the next goal is unmistakable.

Everything is **presentation and information architecture**. No economy value, no engine
behaviour, no theme, and — the hard guardrail — **no persisted save field** changes. A child's
built machines, levels, coins, stars and learned letters are untouched; they are simply drawn
better. That invariant is what makes this milestone safe to ship without a migration.

---

## 1. Surfaces (what exists after the milestone)

Two surfaces plus the thread between them. Both are built **only** from the existing `:root`
tokens (051/052 themes recolour them for free — design §8), and both reuse the existing buy /
upgrade / rebirth **logic** unchanged (design §7).

### 1a. Calm typing view (an edit of today's play view)
Top-to-bottom, centred, max ~760px (design §5a):
1. **Thin bar** — `← Menu` · `×mult · acc% · ● coins` (mono `--data` face), one quiet line,
   plus a `🏭 Fabriek` button to the factory page.
2. **Goal sliver** — `🦾 [name] · JE VOLGENDE MACHINE  ▓▓▓▓░ nog N`. This *is* the reward loop:
   single, named, visible-not-shouting; bar uses `--reward`. Fed by the goal helper (§3).
3. **Typing card** — the sentence with `ui/TypingSurface.jsx`'s **existing char-state colours
   reused verbatim** (done = mint, current = paper + brass underline, upcoming = ink-dim — the
   `.tchar` rules in `game.css`, unchanged) + the **next-key hint only** (`[c][v][B][n]`). This
   is the existing `ui/TypingSurface.jsx`, unchanged — the split removes what *surrounds* it, not
   it. *(The design docs' draft "done = dim / upcoming = calm-ink" recolour and the `--calm-ink`
   token are **cut** — PO adjudication 2026-07-24, assignment 077.)*
4. Nothing else. **No floor strip, no shop rail, no separate meters block.** The four-moment
   celebration overlays still fire between exercises, unchanged.

### 1b. Factory page — "Het Bouwplan" (new route `view: 'factory'`)
On a blueprint-grid panel (design §5b):
1. **Header** — `JOUW FABRIEK / Het Bouwplan` (display) + a `[N van 5 machines gebouwd]`
   progress tag (mint) top-right; and `← Typen` back to the typing view.
2. **Roadmap** — one `.station` per machine, left→right by unlock order, connected by a line.
   States: **built** (inked node, mint connector, `Lv N · +N/s`), **current** (brass ring,
   `NU BOUWEN`), **locked** (dashed ghost, `nog N letters` or `🔒 volledige fabriek`).
   Milestone teasers ride a station badge (`Lv10 →×2`).
3. **Spotlit goal panel** — the single next goal enlarged: progress ring, name (display), reward
   (`+28/s`), `nog N munten — dat haal je in ± 2 opdrachten`, and the buy button (`--reward`).
4. **Objectives row** — upgrades + `🌟 Fabriek verkopen` (prestige) as objective tiles; prestige
   shows its own progress and stays sky-blue (the one place `--sky` appears — DESIGN.md rule kept).
   Locked/premium stations route to the existing parent-gated `Unlock.jsx` — breadth, never power.

### 1c. Navigation
A persistent way both ways (`🏭 Fabriek` on the typing bar ↔ `← Typen` on the factory). The
goal sliver is the always-present thread: it names what the factory is building, so leaving to
manage reads as *advancing the plan*, not a context switch.

---

## 2. Migration plan and save-compatibility (guardrail: never lose a child's earned state)

**Statement of compatibility: existing kids' factories and progress survive unchanged, with
zero migration code.** Why this is true and not a hope:

- The persisted save is `store.js` → `localStorage['typcoon:save']`, written as
  `JSON.stringify({ ...engineState, tycoon })` minus the derived `curriculum`. There is **no
  version field and no schema** — the save is the live engine + `tycoon` object.
- Every assignment in this milestone is **presentation-only**. None touches `economy.js` data
  (`BUILDINGS`, `UPGRADES`, `MILESTONE_LEVELS`, costs, rates, `unlockAt`), the engine state
  shape, `theme.js`, or the fields `saveGame` writes. The factory page reads the *same*
  `tycoon` (levels, coins, stars, lifetime) and the *same* `lettersLearned` the shop rail reads
  today; it just draws them as a roadmap instead of a list.
- Because no written field changes, `loadGame()` on an old save deserialises identically. A
  machine a kid built is still `tycoon`'s level for that building; it renders as a **built
  station** instead of an **owned shop row**. Nothing is dropped, reset, or re-keyed.

**How this is enforced (tester-checkable), not just asserted:**
1. **Schema-invariant test (in 071):** round-trip a set of representative pre-milestone saves
   through `saveGame → loadGame` and assert every `tycoon` field (coins, per-building levels,
   owned upgrades, stars, lifetime) is preserved byte-for-byte. This fails loudly if any
   assignment quietly changes the persisted shape.
2. **Per-assignment guard line:** 072/073/074 each carry the acceptance line *"a save made
   before this assignment loads and renders identically; `store.js` key/shape, `economy.js`
   data, and engine state are unchanged."*
3. **Gate check (in 076):** the tester loads a **real pre-existing save** (their own mid-game
   save captured before the milestone) and confirms every machine/level/coin/star the kid owned
   is present and correct on **both** new surfaces.

**If any assignment finds it must change the save shape, that is out of scope for this
milestone — the developer sets `blocked` and escalates; it is not done quietly.**

---

## 3. The goals system, specified concretely (not a vibe)

The spine of direction C. It is a **pure, deterministic helper** plus **two consistent
surfacings**. A developer can implement it and a tester can check it without asking what was
meant.

### 3a. What a goal is — the helper contract
Add a pure function (in `economy.js`, or a small `goals.js` beside it):

```
nextGoal(tycoon, lettersLearned) -> GoalDescriptor
```

**Selection ladder (design §6), first match wins — the single most-motivating *cheapest
meaningful* next step:**
1. **Build a machine** — the cheapest `BUILDINGS` entry where `buildingUnlocked(id,
   lettersLearned)` is true **and** the child has not built it (level 0). Reward = `+{rate}/s`.
2. else **Level-up to a milestone** — the cheapest owned building whose *next* level is in
   `MILESTONE_LEVELS` (`[10, 25, 50]`), costed by `buildingCost(id, currentLevel)`. Reward =
   `×{milestoneMultiplier(next)}` at `Lv {next}`.
3. else **Buy an upgrade** — the cheapest unowned `UPGRADES` entry. Reward = its `prod`/`payout`
   multiplier label.
4. else **Prestige** — `🌟 Fabriek verkopen` progress toward `rebirthCost`, once nothing cheaper
   is meaningful. Reward = a star (`+25%` on everything).

**`GoalDescriptor` fields (exactly what both surfaces render):**
- `kind`: `'build' | 'levelup' | 'upgrade' | 'prestige'`
- `id`: building/upgrade id (`null` for prestige)
- `icon`, `name`: via `strings.js` `gt(...)` (theme/locale-correct)
- `reward`: label string (`'+28/s'`, `'×2'`, `'nog een ster'`)
- `cost`: target coins for this goal
- `have`: `tycoon.coins`
- `fraction`: `clamp(have / cost, 0, 1)` — drives the ring **and** the sliver bar
- `remaining`: `max(0, cost - have)` → `nog N munten`
- `effort`: a friendly estimate `± N opdrachten` = `ceil(remaining / estPerExercise)`, where
  `estPerExercise` is a rough current per-exercise coin yield (e.g. `payoutForExercise` at the
  player's current multiplier, or a recent-average). **A kid reads *time*, not just a number.**
  **No countdown, no timer, no urgency** (charter guardrail 3) — the estimate encourages.

**Locked/premium edge:** if the next meaningful machine is behind the family unlock, the goal is
surfaced as **locked breadth** (`🔒 volledige fabriek`) routing to the parent-gated `Unlock.jsx`
— never a purchase a child completes alone (guardrail 3), never selling power (guardrail 2).

**Empty state (brand-new player):** letters = 0, no machines. Ladder rule 1 selects `typewriter`
(`unlockAt: 0`) as "te bouwen"; the sliver and spotlight show it; the roadmap ghosts the rest
with their letter-gates; a one-line empty-state ("Je fabriek staat klaar om te groeien — typ je
eerste opdracht") explains the first move. No dead screen.

### 3b. How it is chosen
Computed each render from `tycoon` + `lettersLearned` (cheap, deterministic). It recomputes
whenever coins/levels/letters change, so the goal advances live as the child earns. No stored
"current goal" to drift out of sync.

### 3c. How it is surfaced — twice, consistently
- **Typing view:** the **goal sliver** (icon · name · `JE VOLGENDE MACHINE` · bar = `fraction` in
  `--reward` · `nog N`).
- **Factory page:** the **spotlit goal panel** (ring = `fraction`, name, reward, `nog N munten —
  ± N opdrachten`, buy button) **and** the matching `NU BOUWEN` station on the roadmap.

### 3d. "How far I've come" (no separate stats screen — design §6)
Three always-legible signals, folded into the surfaces: the **filled roadmap** (built = ink,
ghost = future), the **`N van 5 machines gebouwd`** tag, and **lifetime + ⭐ stars** carried as
objective-row context. A dedicated stats page is explicitly **cut** (§5).

### 3e. Verifiability
`nextGoal` gets a unit test (in 071) asserting the expected descriptor from representative saves:
(a) fresh player → build typewriter; (b) has-letters-for-an-unbuilt-machine → build that machine;
(c) all-available-built, a building one level below a milestone → that level-up; (d) machines
maxed / upgrades bought → prestige. This is the tester's proof the goal logic is right.

---

## 4. FactoryFloor removal — PO adjudication (decided, not deferred)

**The question (designer 067 §7/§11; tester seconded):** removing `FactoryFloor.jsx` from the
typing view deletes the only per-second animated feedback while the child types. Is that inside
ADR-011's "typing becomes calm" mandate — a PO call — or a beloved feature worth keeping *against*
the design's removal, which would need the CEO?

**Decision: REMOVE it from the typing view. This is inside the ADR-011 mandate; it is my call and
I make it. Not escalated to the CEO.**

Reasoning:
- ADR-011 verbatim: *"the current design that we type and around it there's a lot of factory stuff
  happening is very basic and also very distracting."* The always-on animated `FactoryFloor` strip
  **is** the "factory stuff happening around it" — it is the single most on-target instance of the
  Shareholder's own complaint, not a bystander.
- The mandate is explicit: *"the typing view becomes calm — typing is the work surface, not a
  stage surrounded by distraction."* Design §4 requires **zero ambient motion** on the typing
  view; the floor's constant animation is exactly the ambient motion named.
- Removing it removes **no economy and no learning behaviour** — machines still only produce while
  typing; coins/s is unchanged. Nothing a child *owns* is lost; the "my factory is growing" feeling
  the floor gestured at is **relocated and made better** (the roadmap + goal sliver).

**But the tester's real worry is legitimate and I honour it:** a calm typing view must not become a
*dead* typing view. So the adjudication has a **preserved-value clause**, carried as a hard
acceptance criterion in 073: *the calm typing view must retain a minimal, non-ambient live earn
signal* — the coin readout ticks up and the goal-sliver bar advances as the child earns — so typing
still feels alive and rewarding, without the distracting animated strip. We remove the distraction,
not the reward.

**Consequence:** `FactoryFloor` is removed from the play/typing render (073). If nothing else
references the component after removal, the file is deleted in the same assignment (dead-code
hygiene). **No CEO escalation is raised** — per 068's instruction, escalation was reserved *only if*
I concluded the floor was worth keeping against the design, and I did not.

---

## 5. The cut line (what this milestone does NOT build)

Per the charter's "scope down hard" and PROTOCOL's warning that agents over-build: the MVP of this
milestone is the smallest thing that delivers the Shareholder's two surfaces and lets a kid feel
the factory grow. Explicitly **cut** (later assignments or never):

- **A dedicated stats screen.** Design §6 folds "how far I've come" into the roadmap + tags +
  objective-row context. No separate analytics page. (Out.)
- **Any economy / engine / theme change** — no new machine, upgrade, rate tuning, milestone,
  rebirth math, or theme. This milestone is presentation-only. (Out — and it is the save-compat
  guarantee.)
- **New celebration/animation art** beyond reusing the existing four-moment overlays plus the one
  discrete `--pop` spring on coin-flash and station-built. No new particle work. (Out.)
- **Milestone-teaser art** beyond a simple `Lv10 →×2` station badge. (Out.)
- **Sound redesign.** (Out.)
- **Parent dashboard rework.** ADR-011 is about the *play* surfaces; `Dashboard.jsx` is a separate
  surface not in scope. (Out.)
- **The DesignSync / Claude Design publish** of the design system. It needs interactive OAuth,
  unavailable in autonomous ticks; the committed `design/` files are the deliverable (standing
  Shareholder note, designer 067 flag (a)). Not a blocker for this milestone. (Out of build scope;
  a standing ops item, not a feature.)

**In scope (the milestone MVP):** the route split, the calm typing view (with FactoryFloor +
meters + shop rail removed and the goal sliver added), the roadmap + spotlit goal + objectives row,
navigation both ways, the goal-selection helper, mobile reflow + the essential state screens
(empty / long-Dutch-text overflow / offline banner / loading skeleton), the save-compat guards, and
the playtest-critique gate.

---

## 6. Build order and the assignments (071–076)

Design-first is satisfied globally: **067 is the design spec for all four surfaces and is `done`**,
so no feature lane precedes its design. The chain below sequences so something demonstrable exists
early (071 pure logic + tests; 072 splits the surfaces even before the roadmap art) and each step
unblocks the next. The playtest-critique gate (076) blocks on everything it plays.

| Id  | Title | Owner | Prio | blocked_by | Demonstrable result |
|-----|-------|-------|------|------------|---------------------|
| 071 | Goal-selection helper + save-schema invariant test | developer | 2 | — | `nextGoal` + green tests; save round-trip proven stable |
| 072 | Factory route split + relocate shop/upgrades/rebirth + nav | developer | 2 | — | Two surfaces exist; factory reachable (pre-roadmap) |
| 073 | Calm typing view: goal sliver, one-line bar, remove FactoryFloor + meters | developer | 2 | 071, 072 | Typing view is calm; live earn signal retained |
| 074 | Factory page "Het Bouwplan": roadmap + spotlit goal + objectives row | developer | 2 | 071, 072 | The exciting factory surface, goals legible |
| 075 | Mobile reflow + state screens (empty/overflow/offline/loading) | developer | 3 | 073, 074 | Works on a phone; degrades gracefully |
| 076 | Milestone playtest-critique gate (kid + parent, experience quality) | tester | 2 | 072, 073, 074, 075 | Signed critique + defects; save-compat confirmed on a real save |

**Notes on the chain:**
- 071 and 072 are independent and can run **in parallel** (071 is pure logic + tests; 072 is
  routing/relocation). Neither has a design dependency beyond 067 (done).
- 073 and 074 can run **in parallel** after 071+072, but **both add to `game.css` and may both
  touch `App.jsx`** (nav) — dispatch them in separate worktrees, or serialise 073→074 if a single
  checkout is used. Flagged for the dispatcher.
- 076 is AC4, the milestone gate. **It subsumes the designer's proposed id-071 playtest pass
  (067 delivery note (c)) — do not open that separately.** It is a *critique*, not a correctness
  checklist: the tester plays the full loop **as a kid** (is typing calm? is the next goal
  obvious? does the factory feel like it's growing? can they find what to build next?) **and as a
  parent** (does it read as trustworthy, no pressure, breadth-not-power?), and judges experience
  quality against ADR-011's ambition — the standing product-ambition check ADR-011 mandates.

Ids **077–085 are unused** and returned to the dispatcher. No overflow, no TBD drafts.

---

## 7. Per-assignment drafts

The materialised files are `company/assignments/071..076-*.md`. Their acceptance criteria are
authored below (and in the files) so a tester can check each without asking what was meant. Every
build assignment (072–075) additionally carries the standing guard: *"no change to `store.js` save
shape, `economy.js` data, engine state, or `theme.js`; a save made before this assignment loads and
renders identically; `npm test` stays green."*

See the individual assignment files for the full text; this document is the rationale and the map.

---

## 8. World-pass re-cut (product-owner, 2026-07-24, assignment 082) — appended, not a rewrite

The 071–076 chain above shipped its first form (071/072/074 done; 073 bounced), and then the
Shareholder saw 074 rendered and intervened mid-milestone: **ADR 012** (the factory must be a
full-page tycoon *world*, not a panel; typing view carries only high-level earnings;
keyboard-first, no mobile) and **ADR 013** (iterate autonomously toward the ultimate experience;
playtest gates become the flywheel's intake). The designer's world-pass deep dive landed as
assignment **079** (`design/DESIGN-FACTORY.md` **PART II — WORLD PASS, W0–W8**), verified `done`
by the tester on tick #29. This section records how 079 was cut into build lanes. **History above
stands; this is the current plan.**

**The re-cut chain (assignment 082 is the cut record):**

| Id  | Title | Owner | Prio | blocked_by | Demonstrable result |
|-----|-------|-------|------|------------|---------------------|
| 069 | `<html lang>` syncs to active locale | developer | 2 | — | English sessions carry `lang="en"`; hyphenation dictionary correct (precondition for 087) |
| 083 | Typing strip — earnings-first, one-shot chips | developer | 2 | — | Typing view is earnings-only + calm; **closes 073** |
| 084 | Factory ledger — coin/rate/star | developer | 2 | — | Spendable balance visible; **closes 070** |
| 085 | The Maquette diorama floor | developer | 2 | 084 | Factory reads as a place/world, not a dashboard |
| 086 | Atmosphere & motion | developer | 3 | 085 | Ambient life + arrival/build moments; reduced-motion correct |
| 087 | Werkbank + 080 hyphens fix | developer | 2 | 069 | Upgrades/prestige as tools; **closes 080** |
| 088 | Edge states for the world | developer | 3 | 085 | Empty/loading/offline degrade gracefully; **absorbs/closes 075** |
| 076 | Milestone playtest-critique gate | tester | 2 | 083,084,085,086,087,088 | Signed tycoon-feel critique (ADR 013 flywheel intake) |

**Dispositions of the held/stranded work:** 073 → folded into 083 (blocked, closed by 083's
tester). 070 → folded into 084. 080 → folded into 087. 075 → superseded (mobile half cancelled
by ADR 012 ruling 3; states half absorbed into 088). 069 → sequenced as 087's precondition, not
folded. 076 → re-pointed off the obsolete 072/073/074/075 chain onto the world-pass chain.

**Guardrail carried unchanged:** every world-pass slice is presentation-only —
`store.js` / `economy.js` / engine / `theme.js` / `goals.js` untouched, no idle income (typing
stays the only faucet), zero new `:root` tokens, `npm test` green (currently 230/230). The
save-compat guarantee (§2) holds: no persisted field changes, no migration.

**Ids:** 082 (cut record) + 083–088 (six slices) used; **089–090 returned unused**. Full
sequencing rationale, file surfaces, and parallelism notes live in
`company/assignments/082-worldpass-build-cut.md`.

---

## 9. Typing-strip pill fidelity vs ADR 012 ruling 1 (product-owner, 2026-07-24, assignment 105)

Tester 076 flagged that 083's earnings-first strip still carries `⭐ rebirths` and
`🔥 streak` pills that the 083 comment never re-justified against ADR 012 ruling 1's
"nothing else from the factory world." Adjudicated: **the `⭐ rebirths` star moves
factory-only** (it is a factory-world prestige trophy; it already lives on 084's ledger;
§3d already routes "how far I've come" to the factory page), and **the `🔥 streak` stays
on the typing view** (a daily-return/typing-habit stat that gates the warm-up
earnings boost — native to the typing loop, not the factory world). The ruling and its
reasoning are the deliverable and are recorded in full in
**`company/decisions/014-typing-view-star-pill-factory-only.md`** (my reserved decision
id, used — this refines an ADR reading and is where a future tester checking code
against ADR 012 will look). 105 is re-scoped in place into the developer implementation
(remove the star pill only; presentation-only; save/economy untouched).

---

## 10. Iteration "from blueprint to place" — 076 flywheel intake (product-owner, 2026-07-24, tick #39)

*Authority: ADR 013 (the experience flywheel is the standing work supply; each critique's
findings are the next iteration's backlog) and ADR 012 (the factory is a WORLD, not a
panel). Intake: `company/research/076-playtest-critique.md`. This is the pre-declared
scoping pass turning 076's design-headroom findings into the next scoped iteration. New ids
allocated to me: **114–120**; I use **114–115** and let 116–120 lapse. Decision id **015
used** (the 106 adjudication). No production code is written here.*

### 10a. What the intake said, and the theme

The world pass landed and is verified (069–105 family; 100/109 pending in parallel lanes,
not this pass's concern). 076's verdict: the milestone **lands the direction** — calm
typing alive-not-dead, growth legible, save-compat airtight, guardrails hold (once 102 was
fixed) — **but does not yet clear ADR-013's "ultimate experience" bar: the diorama reads
blueprint, not place.** Named gaps: grid + one horizon line + machine models, but **no sky,
weather, parallax, background dressing, sense of scale, or day-in-the-life read**; and
motion quality was **unverifiable from stills**.

**Theme: "from blueprint to place."** Close the specific ADR-013 gap the flywheel's own
intake named — turn the blueprint schematic into a *place a kid feels they walked into* —
and clear the small copy/scope debris the same intake surfaced.

### 10b. What is IN (this iteration's MVP)

| Id | Title | Owner | Prio | blocked_by | Result |
|----|-------|-------|------|------------|--------|
| 114 | Designer: place-ness/atmosphere design pass for the diorama | designer | 2 | — | Competing atmosphere directions, pairwise-selected; mock + DESIGN-FACTORY addendum; belt reconciled; live-verifiable motion checklist |
| 115 | Build the place-ness backdrop/depth/scale per 114 | developer | 2 | 114 | The diorama reads as a place; motion verified live; token-clean; save-compat |
| 091 | Decorative belt (beltDrift) — build onto the finished backdrop | developer | 3 | 115 | Ambient belt, coherent with the new atmosphere (re-scoped, was prio 4 / unblocked) |
| 110 | Affordable-state copy coherence: `.pnote` ready-line + locked-goal "bouw maar!" contradiction | developer | 3 | — | Both affordable-state copy defects fixed in one pass (re-scoped/expanded, was prio 4) |
| 106 | Narrow-desktop-window degradation: width floor on the touchOnly() gate | developer | 3 | — | Keyboard user with a narrow window sees the calm width-hint, not a broken diorama/ticket (re-scoped, was prio 2 "mobile") |

**Design-first is honoured:** 114 (designer) gates 115 (markup) — `blocked_by: [114]` — per
PROTOCOL's design-before-features rule; the place-ness build cannot precede its spec. 091
(belt) is `blocked_by: [115]` for **coordination** (same diorama files; place the belt on
the finished backdrop), not for missing spec — the belt's own spec (W3 + world-C mock) is
sufficient. 110 and 106 are copy/gate work in different files and run in parallel with the
design track.

**Sequencing rationale.** 114 is the headline and the gate; it starts now. 110 and 106 are
independent quick wins (different files: 110 = `Shop.jsx`/`strings.js`; 106 =
`App.jsx`/`strings.js`) that can land in parallel while 114 designs. 115 follows 114; 091
follows 115. After 114 delivers, the PO firms/cuts 115 against the delivered mock (world-
pass precedent, §8: build lanes were cut only *after* the 079 designer pass landed) — if
114's spec is large, 115 is sliced then, using a fresh id block.

### 10c. What is explicitly OUT (scope down hard)

- **Mobile / touch-device layouts for game surfaces** — out per ADR 012 ruling 3, and
  already enforced by the `touchOnly()` gate. **No responsive/reflowing diorama is built**
  (ADR 015). Narrow *desktop windows* are handled by a width-hint gate (106), never a
  reflow. This closes the door on re-filing "the factory is broken at width X" as a layout
  bug — see ADR 015's standing rule.
- **Any real weather / day-night / time-of-day engine, or crowd simulation.** The genre
  benchmark (a tycoon with changing skyline, weather, crowds) is a *quality bar to compare
  against*, **not** a feature list. Atmosphere is CSS on the pinned token layer — a rich
  *sense* of place, not a simulation. If a design direction needs a runtime system, an asset
  pipeline, or spend, it is out of bounds (114 must pick a direction that is not).
- **Any economy / engine / save / theme change.** The presentation-only + zero-new-`:root`-
  tokens + save-compat invariants of the whole milestone (§2) are unchanged. `--sky` stays
  prestige-only.
- **The typing view.** This iteration is the factory page only; ADR 011's calm mandate on
  the typing surface is not reopened.
- **New machine/particle art, a third per-machine "ghost" SVG variant** (W2b addendum
  forbids it), **sound redesign, parent-dashboard rework, DesignSync publish** — all remain
  out (§5), unchanged.
- **Priority 1 is deliberately left free.** Nothing this iteration is a broken core flow or
  a guardrail breach; the milestone is trustworthy since 102 was fixed. Place-ness is
  high-value *enhancement* (prio 2); the rest is cleanup (prio 3).

### 10d. Adjudications recorded this pass

1. **106 — mobile vs narrow-window (ADR 015 used).** Resolved the v092-vs-v089 tension: the
   game gate `touchOnly()` (`App.jsx`) keys on **pointer type, not width**, so phones are
   out-of-target *and already gated* (v092 right), but a keyboard user with a **narrow
   desktop window** falls through and hits a broken layout (the real, in-scope defect;
   v104 reproduced it for `.ticket` too). Ruling: **gate, don't reflow** — add a width floor
   to the friendly hint; never build a mobile diorama. 106 re-scoped, prio 2 → 3; v104's
   `.ticket` squeeze folded in. Durable rule recorded in ADR 015 so it is not re-litigated.
2. **Locked-goal contradiction (v104 finding, folded into 110, prio 3).** "Je hebt genoeg
   munten — bouw maar!" next to a 🔒 Ontgrendel button tells the kid to build when only the
   parent-gated unlock is possible. Ruled **priority 3** (above the pure-cosmetic 4): a copy
   *logic* contradiction on the trust-sensitive premium surface, but rare and non-functional
   (the gate still gates correctly → **not** a guardrail breach, no CEO escalation). Fix
   routes toward the parent gate ("vraag een volwassene om te ontgrendelen") instead of
   contradicting it. Folded into 110 (same files/family) rather than spawning a duplicate id.

### 10e. Budget & guardrails

Entirely presentation/copy/gate work — CSS, strings, one media-query gate. **No new spend;**
well within the €50/mo ceiling. Guardrails intact: no idle income (ambient life is at rest,
never spouts coins), breadth-not-power (premium still routes to the parent gate — the
locked-goal fix *reinforces* this), no pressure/dark patterns, free tier complete,
privacy/SEO untouched.

### 10f. 114 verdict + 115 firming (product-owner po114, tick #40)

**114 PASS → `done`.** The design pass met every AC and every hard scope cap; caps were
spot-checked in the winner mock's own CSS + the four theme renders, not trusted from the
ticked boxes (ADR 013). Winner: **direction B — "De Werktafel"** (the Maquette as a scale
model on a lit maker's drafting desk), selected pairwise/ranked-not-scored (1) B 2) C 3) A)
with the critic's fix (drop the literal lamp fixture → soft `.warmth` wash) taken. PART III
(W9–W15) appended; PART II untouched; `--sky` backdrop-free (grep-verified); zero new tokens
(no `:root` in the mock); no `@media`/reflow. Full review in `company/assignments/114-*.md`.

**115 firmed: FIRM — buildable as ONE developer assignment, NOT sliced.** Plan shape is
**unchanged** (114 done → 115 → 091; 110/106 parallel). Against the §8 world-pass precedent
(build lanes cut only after the designer pass landed), this pass is deliberately *not* cut:
the §W15 delta is smaller than a single world-pass slice — one element (`.hal`) wrapped in a
`.desk`, its background restyled, four decorative child layers added, all CSS on existing
tokens with one new keyframe (`warmBreath`). 115's direction-specific ACs were made concrete
against W10a–e + W13, with `world-C-maquette-place.html` and the four `world-place-winner-*.png`
renders as the tester's comparison target. The dispatcher may dispatch d115 this tick.

**Belt boundary confirmed:** `beltDrift` build + re-time (W12) stays **091** (`blocked_by:[115]`),
not folded into 115 — keeps the two `game.css`/`Shop.jsx` lanes from colliding.

**Kick-copy adjudication:** the designer's optional `Jouw fabriek → Jouw maquette` header
tweak (strings.js) is **DECLINED** — "fabriek" is the product's load-bearing noun (charter
unlock/SEO); the desk + `1:50` tag already carry the scale-model read visually; a header
rename is a whole-vocabulary call above a CSS place-pass's weight, revisable in one line if a
future playtest asks. The shipped app keeps "JOUW FABRIEK" though the winner mock renders
"JOUW MAQUETTE" — the tester compares backdrop, not that kicker.

**Ids this firming pass:** 016 (ADR) **LAPSED** — routine PO scoping + a minor reversible copy
call, recorded in the assignment + here per the §8 precedent (which used no ADR), not worth an
ADR. 120 (proposal) **LAPSED** — kick-copy declined, no proposal filed. No other ids used.
