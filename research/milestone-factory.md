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
3. **Typing card** — the sentence in the `--data` face (done = dim, current = brass underline,
   upcoming = calm-ink) + the **next-key hint only** (`[c][v][B][n]`). This is the existing
   `ui/TypingSurface.jsx`, unchanged — the split removes what *surrounds* it, not it.
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
