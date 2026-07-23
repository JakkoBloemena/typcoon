# Game-depth milestone — scope (2026-07-23, product-owner)

*Assignment 042. Authority: charter.md (thesis + guardrails 2 & 5), decisions/006 rider
(Shareholder, "more game content/depth"), REVENUE.md §1/§2/§6, DESIGN.md, PLAYTEST_LOG.md,
and the game source under `src/` (paths cited inline). Format precedent:
research/next-milestone-scope.md and research/content-batch-2-scope.md. Terminal state:
needs_verification — the CEO reviews this scope before any build assignment materializes.
Ids below are literally "TBD"; the dispatcher allocates them.*

---

## TL;DR

- **Two candidates ship, in this order: (1) the typing-diploma spine, (2) factory themes.**
  Both are grounded in the code, both are pure breadth/mastery (never learning-speed), and
  both make an *already-sold-but-non-existent* paywall promise true.
- **The biggest lever is latent, not new.** `src/engine/exams.js` is a complete, tested
  mini-exam + final-diploma module (5 exams, culminating in a real "typ-diploma" at 100
  keys/min + 95% accuracy) that **is not wired into the game** — no file under `src/game/`
  imports it. Wiring it in delivers the genuine "progression past full alphabet" the
  assignment asks for *and* hits REVENUE.md's #1 purchase driver (parent-visible proof of
  learning) — at spike-verified feasibility, because the hard part (readiness gating, text
  generation, grading) already exists and is tested.
- **The paywall lies today, harmlessly but really.** `src/game/strings.js`
  `unlock.perkPrestige` = "Alle thema's en fabrieks-uitbreidingen" / "Every theme and
  factory expansion", and `premium.chapterBody` promises "alle machines, sterren en thema's".
  **No theme system exists** (grep of `src/game/` for theme/thema/skin wiring: zero hits).
  Building themes is therefore not gold-plating — it closes a live gap between paid copy and
  code (guardrail 4 is adjacent: surfaces must not claim more than the code delivers).
- **4 build assignments drafted** (+1 optional), priorities 2–4, ids TBD.
- **The cut line is the valuable half:** no mini-games / exercise-variety surface, no
  dashboard-analytics build, no extra retention mechanics, no grind-only machine tiers, and
  nothing that touches the economy multipliers. Rationale per item in §3.

---

## 1. What exists today (verified in code — the baseline this milestone deepens)

| System | State | Source of truth |
|---|---|---|
| Machines | 5, unlocked by letters learned: typewriter(0) → printer(5) → robotarm(10) → assembly(18) → megafab(26) | `src/game/economy.js` `BUILDINGS` |
| Upgrades / milestones | 4 one-time upgrades; per-machine ×2 at Lv 10/25/50 | `economy.js` `UPGRADES`, `MILESTONE_LEVELS` |
| Rebirth / prestige | Sell factory for a permanent +25%/star, cost ×4 each; learning never resets | `economy.js` `rebirth`, `REBIRTH_BONUS` |
| Free/paid split | Free = 10 letters + typewriter & printer; rest premium | `src/game/premium.js` `FREE_LETTER_CAP=10`, `FREE_MACHINES` |
| Curriculum | Core 15 stages (f/j→z + consolidation) + NL tail: Shift, `. ,`, `? ! ' -`, digits, accents | `src/engine/curriculumCore.js`, `src/data/nl/curriculumTail.js` |
| Parent dashboard | 6 stat tiles (letters/26, accuracy%, exercises, best combo, coins, stars); free to view | `src/game/Dashboard.jsx` |
| Achievements | 15 badges incl. `alle-letters` (26), `drie-rebirths` | `src/game/achievements.js` |
| Retention | Daily streak + warm-up boost + 3/7/14/30 milestones; weekly "beat-your-ghost" records; referral | PLAYTEST_LOG "Retention/Referral/Leaderboards", `daily.js`/`weekly.js`/`referral.js` |
| **Exams / diploma** | **Built in the engine, UNWIRED in the game** — 5 exams, final = 100 kpm + 95% acc | `src/engine/exams.js` (imported by *no* `src/game/` file — verified) |
| **Themes** | **Promised in paywall copy, does not exist** | `strings.js` promises it; grep of `src/game/` finds no theme code |

**The end-state gap.** After 26 letters the only remaining depth is the (excellent, already
juicy) rebirth loop — PLAYTEST_LOG cycle 3 confirms a maxed factory is balanced and
overflow-safe. What is *missing* past the alphabet is a **mastery spine**: a reason the
child's accumulated skill is recognised and shown, and a crown moment a parent can point at.
The engine already computes exactly this and it sits dark.

---

## 2. Candidates evaluated

### Candidate A — Wire the typing-diploma + mini-exams into the game  ✅ BUILD (priority 2)

**Evidence.** `src/engine/exams.js` is a finished, tested module: `EXAMS` = five staged
exams (exam-1 home row @stage 5, exam-2 @stage 8, exam-3 all letters @stage 14, exam-4
punct+caps @stage 18, exam-final @stage 19 requiring 100 keys/min + 95% accuracy), with
`examReady()` (only offers an exam when the confidence model says the child is ~certain to
pass within ~3 tries), `generateExamText()`, `gradeExam()`, and `applyExamResult()`. The
one wiring change needed: it awards `state.rewards.stars` (typie's cosmetic layer, which
typcoon does **not** use — grep confirms no `src/game/` file touches `state.rewards`), so
the reward must be re-pointed to typcoon's own economy (`tycoon` coins and/or a prestige
star). DESIGN.md's "vier-momenten vieren meesterschap" and the existing SEO article
`typediploma-nodig` both confirm a diploma is on-brand and demanded.

**Why it is the top pick.** It is the assignment's "progression past full-alphabet" done as
genuine mastery, not grind; and it is REVENUE.md §1.1/§6's single highest-leverage lever —
"parents don't buy a game, they buy visible proof of learning," and a diploma is the
strongest possible proof. Feasibility is de-risked because the engine work is done and
tested.

**Guardrail check.**
- *G2 (never sell learning speed).* Exams are **earned by typing**, never bought; passing
  unlocks *recognition*, not power or content. The final exam's 100 kpm bar is an earned
  skill milestone (real Dutch typediploma's require speed), not a sold one — and critically,
  **it must gate nothing**: all premium content stays unlocked by *learning letters* as
  today, the diploma is optional celebration. State this in the AC so no one wires the
  diploma as a content gate.
- *G5 (free tier is a complete education).* exam-1 sits at stage 5 (home row, ~9 letters),
  inside the free cap of 10 letters — so **the free chapter earns its own "thuisrij-diploma"**,
  a real standalone completion moment. exam-2+ and the final diploma fall past the free cap
  and are naturally premium. The free tier gains a payoff; it is not diminished.

**Paid-tier impact.** Enriches **both** sides of the split: the free mini-diploma is a
conversion moment ("your child just earned their first typing certificate — see the whole
course"), and the full typ-diploma becomes the crown of the paid unlock and the concrete
thing the parent dashboard can show. Directly serves REVENUE.md's top-ranked product change.

### Candidate B — Factory themes / skins  ✅ BUILD (priority 3)

**Evidence.** REVENUE.md §1.2 lists "all themes/cosmetics" as legitimate paid breadth; §2
picks freemium-**breadth**-unlock precisely so we sell cosmetics, never power. DESIGN.md's
core finding is that *seeing your empire* is the hook (build > numbers) — themes amplify the
one thing kids demonstrably return for. And the paywall **already sells this**:
`strings.js` `unlock.perkPrestige` ("Alle thema's en fabrieks-uitbreidingen") and
`premium.chapterBody` ("alle machines, sterren en thema's"). No theme system exists in code.

**Guardrail check.**
- *G2.* Cosmetic by construction — a theme changes zero economy values, sells no speed. This
  is the textbook "breadth, not power" purchase.
- *G5.* Free tier keeps a genuinely nice **default** theme (AC requires it not read as a
  stripped demo); premium unlocks the alternates. Complete education unaffected.

**Paid-tier impact.** Makes a live paid promise true (closes the copy-vs-code gap that is
guardrail-4-adjacent), and adds durable "want the rest" pull to the unlock without touching
the learning loop. Pure enrichment of the unlock's value.

### Candidate C — Parent-dashboard depth (per-letter, over-time)  ⚠️ EVALUATED → below the cut line for *this* milestone

**Evidence.** `Dashboard.jsx`'s own header comment says deeper analysis ("per-letter,
verloop over tijd") "is de premium-uitbreiding" — promised, unbuilt; REVENUE.md §6 ranks it
change #1. **But** it is parent-facing analytics, not "depth for the kids playing today"
(this milestone's remit per 042), and its natural home is the conversion/payments lane, not
game depth. Candidate A already delivers the dashboard's most valuable *new* content (the
diploma / mastery state) for it to show. **Recommendation: do not build dashboard analytics
here;** let it be scoped with the conversion work once payments arm (tripwire 010), fed by
the diploma data this milestone produces. Recorded as a deliberate non-build in §3.

### Candidate D — More machines / higher tiers  ⚠️ EVALUATED → deferred, optional diploma-reward only

**Evidence.** A 6th machine would need an `unlockAt` past 26 (curriculum has stages past 26:
caps/punct/digits) — feasible. **But** PLAYTEST_LOG cycle 3 shows the 5-machine maxed factory
is already balanced, juicy, and overflow-safe, and the infinite rebirth loop already supplies
endless numeric depth. A machine that is *just* a bigger number is low-novelty grind, and
REVENUE.md §0 warns explicitly against grind-shaped additions. The **only** version worth
building is a machine/expansion **gated on passing the diploma** — a mastery reward that also
backs the paywall's "fabrieks-uitbreidingen" copy. Drafted as an **optional** priority-4
assignment (depends on Candidate A) so the CEO can choose it or instead soften the copy.

### Candidate E — Exercise variety / mini-games (e.g. Word Rain)  ❌ CUT

**Evidence.** `exams.js` references `minigamesUnlocked` (a Word Rain-style layer in typie),
but no mini-game is built in typcoon and wiring one is a *new UI surface + new engine
integration* — a large build. Worse, arcade mini-games are exactly the "kid plays but barely
types" failure mode our own content article B warns about, and they risk weakening "typing is
the only faucet" (G2). High effort, high pedagogy risk, unproven demand. Cut — revisit only
if measurement later shows a variety/retention gap the diploma spine did not fill.

### Candidate F — More streak / retention depth  ❌ CUT

**Evidence.** Daily streak + warm-up boost + 3/7/14/30 milestones + weekly records + referral
are **already shipped** (PLAYTEST_LOG). REVENUE.md §5 flagged D1/D7 as the gap; the streak
system now addresses it. Adding more retention mechanics now is speculative and, like content
batch 3, should be **gated on measurement** (does the funnel actually show a D1/D7 problem?)
rather than built on a guess in the growing stage. Cut for this milestone.

---

## 3. The cut line — what this milestone deliberately does NOT build

| Not building | Why (evidence) |
|---|---|
| **Dashboard analytics (per-letter / over-time)** | Parent-facing conversion feature, not kid-facing game depth (042 remit); belongs with the payments/conversion lane (tripwire 010), fed by the diploma data built here. REVENUE.md §6 keeps it #1 *there*, not here. |
| **Mini-games / new exercise-type surface** | Large new surface; "plays but barely types" pedagogy risk (content article B); threatens G2's single-faucet rule. Unproven. |
| **Extra retention/streak mechanics** | Retention layer already shipped (PLAYTEST_LOG); further depth must be measurement-gated in growing, not guessed. |
| **Grind-only machine tiers** | Maxed factory already balanced (PLAYTEST_LOG cycle 3); rebirth already gives infinite numeric depth; REVENUE.md §0 warns against grind. Only a *diploma-gated* expansion is worth it, and that is optional (Candidate D). |
| **Any change to economy multipliers / faucet** | Hard guardrail-2 line: typing stays the only faucet, accuracy the only multiplier. Out of scope, full stop. |
| **Multi-child profiles** | Named in REVENUE.md but it is an account/infra feature tied to payments, not game depth; the unlock UI does not currently promise it, so no copy gap forces it now. Leave to the accounts/payments lane. |

**Concern to surface to the CEO (not a build):** the paywall currently promises themes *and*
"fabrieks-uitbreidingen" that don't exist. Candidate B backs the themes half. The
"fabrieks-uitbreidingen" half is backed only if the optional Candidate-D expansion ships;
otherwise the copy should be softened. Flagged in §6.

---

## 4. Recommended build order

Sequenced so something demonstrable exists early and each step unblocks the next. The two
tracks (diploma, themes) are independent and can run in **parallel** lanes — the `blocked_by`
edges are only *within* each track.

1. **Diploma spine** (Assignment 1) — demonstrable end-to-end the moment it lands: a child
   can be offered, take, and pass the home-row mini-exam and earn the reward. Unblocks 2.
2. **Diploma certificate + dashboard proof** (Assignment 2, blocked_by 1) — the parent-visible
   payoff and the conversion moment.
3. **Theme infrastructure + picker** (Assignment 3) — parallel to track 1; unblocks 4.
   Demonstrable: switch the factory's look, default free, others premium-locked.
4. **First theme batch** (Assignment 4, blocked_by 3) — the concrete cosmetics on the infra.
5. *(optional)* **Diploma-gated factory expansion** (Assignment 5, blocked_by 1) — only if the
   CEO wants to back the "fabrieks-uitbreidingen" copy rather than soften it.

---

## 5. Draft build assignments (ids TBD — the dispatcher allocates)

> Shared context for every assignment: this is a Vite + React app; `npm test` runs the pure
> node test suite (currently green — see PLAYTEST_LOG), `npm run build` must stay clean, and
> the browser console must be error-free. A developer's terminal state is
> `needs_verification` (PROTOCOL); the tester flips `done`.

---

### Assignment 1 — Wire mini-exams + the typ-diploma into the game

```
title: Wire the engine exam/diploma system into the Typcoon game loop
owner: developer
priority: 2
blocked_by: []
opened_by: product-owner
```

**Goal.** Make `src/engine/exams.js` playable inside Typcoon. When the engine reports an exam
is ready (`nextAvailableExam(state)`), offer the child an optional "toets" they can take
instead of a normal exercise; generate its text with `generateExamText()`; grade the attempt
with `gradeExam()`; on pass, mark it passed (`applyExamResult`) and grant a Typcoon reward
mapped to **this game's** economy (coins and/or one prestige star) — **not** typie's
`state.rewards.stars`, which Typcoon does not use. Passing/failing gets a clear celebration or
gentle "nog een keer" (never a punishment — DESIGN.md). exam-1 (stage 5, home row) must be
reachable and takeable by a **free** player; exam-2+ and exam-final fall past the free letter
cap and are premium by nature.

**Acceptance criteria.**
- [ ] Playing to home-row mastery as a **new/free** player, the game offers exam-1 as an
      optional exam (clearly labelled a "toets"/exam, distinct from a normal exercise) and
      lets the player decline and keep playing.
- [ ] Taking exam-1 presents an exam text (longer than a normal exercise, covering the exam's
      keys) and, on typing it at ≥ the exam's `passAcc`, shows a **pass** result with a
      celebration and grants the mapped Typcoon reward (coins and/or a prestige star); the
      reward is visible in the balance/stars immediately after.
- [ ] Failing an exam (accuracy below the bar, or below `minKpm` on the final) shows an
      encouraging retry message, grants **no** reward, and returns the player to normal play —
      no dead-end, no lockout.
- [ ] Passed exams **persist** across a hard refresh and across "opnieuw beginnen" if the
      curriculum progress persists (verify: pass exam-1, refresh, confirm it is not re-offered
      and the passed state is retained).
- [ ] The exam reward is sourced from Typcoon's economy — grep confirms the game does **not**
      grant `state.rewards.stars`; the wiring uses `tycoon` coins and/or `rebirths`/prestige.
- [ ] **No content or machine is gated behind passing any exam** — all premium content still
      unlocks purely by learning letters (verify: a player who never takes an exam can still
      reach every machine and letter they otherwise could). The diploma is recognition only.
- [ ] The final exam's speed requirement (100 keys/min) is the only place speed is required,
      and it gates **only the final certificate**, nothing else.
- [ ] `npm test` green (add tests for the reward mapping and the "no reward on fail" path);
      `npm run build` clean; zero console errors across an exam pass and an exam fail.

**Notes.** The engine module is done and tested — the work is UI + reward remapping +
persistence wiring, not exam logic. Keep exam-1 free; do not let the exam offer bypass the
paywall for premium letters.

---

### Assignment 2 — Diploma certificate + dashboard proof-of-learning

```
title: Diploma certificate on pass + surface it as parent proof-of-learning
owner: developer
priority: 3
blocked_by: [<Assignment 1 id>]
opened_by: product-owner
```

**Goal.** Turn a passed exam — especially the final typ-diploma — into a concrete, shareable
proof a parent can see and keep. On passing an exam, show a certificate (child's chosen
username, the exam/level passed, accuracy achieved, date); make the final diploma printable
or savable (browser print/screenshot is acceptable — no new backend). Surface earned exams in
the parent `Dashboard.jsx` as a proof-of-learning row (e.g. "Thuisrij-diploma behaald",
"Typ-diploma behaald — 96% nauwkeurigheid").

**Acceptance criteria.**
- [ ] Passing an exam renders a certificate showing: the child's username, the exam/level
      passed, the accuracy achieved, and the date — text matches what the player actually did
      (no invented numbers).
- [ ] The final diploma certificate is printable or savable via the browser (a visible
      "print/bewaar" affordance that triggers the browser print dialog is sufficient); it
      renders cleanly with no app chrome bleeding into the printout.
- [ ] The parent dashboard shows which exams/diplomas have been earned; a player who has
      earned none sees no false "earned" state; a player who earned exam-1 sees exactly that.
- [ ] All certificate/dashboard copy exists in both `nl` and `en` string tables
      (`src/game/strings.js`) — no hardcoded Dutch on the en path (cf. defect 037).
- [ ] `npm test` green; `npm run build` clean; zero console errors rendering a certificate and
      the dashboard with/without earned diplomas.

**Notes.** This is the REVENUE.md §1.1/§6 "visible proof of learning" payoff. Local-only —
no server, no PII beyond the already-local username. Free players who earn the thuisrij-diploma
see their certificate too (a conversion moment), per guardrail 5.

---

### Assignment 3 — Theme infrastructure + picker (default free, alternates premium)

```
title: Factory theme system: swappable cosmetic themes, default free, rest premium-locked
owner: developer
priority: 3
blocked_by: []
opened_by: product-owner
```

**Goal.** Add a cosmetic theme system that reskins the factory/UI **without** touching any
economy value. A theme registry (a default theme + slots for alternates) applied via a single
mechanism (e.g. a `data-theme` attribute on the root + CSS custom properties), a theme-picker
UI, and persistence of the choice. The **default** theme is free and must look complete; all
alternate themes are locked behind the premium unlock (`premium.js` `isUnlocked()`), shown
but not selectable when locked, routing a tap to the existing unlock screen.

**Acceptance criteria.**
- [ ] A theme picker is reachable from the game; selecting the default theme works for a free
      (locked) player and the game looks complete and polished on it (not a stripped demo).
- [ ] Alternate themes are visible in the picker but **not selectable** for a locked player;
      attempting to select one routes to the existing unlock screen (verify the unlock screen
      opens, no crash).
- [ ] For an unlocked player, every alternate theme is selectable and visibly changes the
      factory/UI look; the choice **persists** across a hard refresh.
- [ ] Switching themes changes **only** appearance — coins/sec, payouts, costs, milestones,
      prestige are byte-for-byte identical across themes (verify: note coins/sec and a payout
      on the default theme, switch theme, confirm unchanged). No economy value lives in a theme.
- [ ] Theme names/labels exist in both `nl` and `en` string tables; no hardcoded Dutch on en.
- [ ] `npm test` green; `npm run build` clean; zero console errors switching themes and
      opening the picker as both locked and unlocked players.

**Notes.** Per PROTOCOL "design system before feature work": the theme tokens/values should
come from the designer (theme = a named set of the existing design tokens), with the developer
wiring the swap mechanism. This assignment builds the **mechanism + default**; concrete
alternate themes are Assignment 4. Closes the live paywall promise of "alle thema's".

---

### Assignment 4 — First theme batch (3 concrete alternate themes)

```
title: Author 3 concrete premium factory themes on the theme system
owner: designer (with developer wiring)
priority: 4
blocked_by: [<Assignment 3 id>]
opened_by: product-owner
```

**Goal.** Deliver three visually distinct, kid-appealing alternate themes on top of Assignment
3's mechanism (e.g. a night/neon factory, a candy/sweets factory, a space/rocket factory —
final set is the designer's call), each a coherent recolour/restyle using the design tokens,
each premium-locked.

**Acceptance criteria.**
- [ ] Three alternate themes exist and are each selectable by an unlocked player, each visibly
      and coherently distinct from the default and from each other (not just an accent-colour
      tweak — the factory reads as a different place).
- [ ] Each theme keeps text/contrast legible (WCAG AA for body text) and the machines, coin,
      and typing surface all remain clearly readable on every theme.
- [ ] All three are premium-locked for a free player (consistent with Assignment 3) and
      persist when chosen by an unlocked player.
- [ ] Each theme changes appearance only — economy values identical across all four themes
      (same check as Assignment 3).
- [ ] `npm test` green; `npm run build` clean; zero console errors cycling through all four
      themes.

**Notes.** Keep it to three — enough to make the unlock feel richer without a sprawling art
task. More themes are a later, measurement-informed batch, not this milestone.

---

### Assignment 5 *(OPTIONAL — CEO's call)* — Diploma-gated factory expansion

```
title: (Optional) A mastery-gated factory expansion unlocked by the typ-diploma
owner: developer
priority: 4
blocked_by: [<Assignment 1 id>]
opened_by: product-owner
```

**Goal.** Only if the CEO wants to back the paywall's "fabrieks-uitbreidingen" copy with a
real feature rather than soften the wording: add a single premium factory expansion — a 6th
machine or a prestige-tier perk — that unlocks on **passing the final typ-diploma** (mastery),
not on raw grind. It must not disturb the balance PLAYTEST_LOG cycle 3 verified.

**Acceptance criteria.**
- [ ] The expansion is unavailable until the final diploma is passed; passing it makes the
      expansion available to an unlocked (premium) player.
- [ ] Adding the expansion does not break big-number formatting, cause overflow/NaN, or
      soft-lock at a fully-maxed factory (repeat PLAYTEST_LOG cycle 3's maxed-factory check).
- [ ] It sells no learning speed and gates no *learning* content (G2): it is a reward for
      demonstrated mastery, cosmetic/economic-flavour only, reachable by any premium player
      who passes the diploma.
- [ ] `npm test` green; `npm run build` clean; zero console errors at a maxed factory with the
      expansion active.

**Notes.** If the CEO instead prefers to soften the copy, this assignment is dropped and
`strings.js` `unlock.perkPrestige` should read (roughly) "Alle thema's" without
"fabrieks-uitbreidingen". Either path closes the copy-vs-code gap; this one ships more.

---

## 6. Guardrail & paid-tier summary (one table)

| Candidate | G2 — never sell speed | G5 — free tier complete | Paid-tier impact |
|---|---|---|---|
| **A — diploma spine** (build) | Earned, never bought; gates no content | exam-1 is a **free** thuisrij-diploma; free chapter gains a payoff | Free mini-diploma = conversion moment; full diploma = crown of the unlock + the dashboard's proof-of-learning |
| **B — themes** (build) | Cosmetic; zero economy change | Default theme free and complete | Makes a live paid promise true; adds "want the rest" pull, no learning touched |
| C — dashboard depth (cut here) | n/a (parent-facing) | n/a | Real driver, but belongs to the conversion lane; fed by A's data |
| D — machine tiers (deferred/optional) | Only as a diploma reward, never grind-for-power | Free tier unaffected | Backs "fabrieks-uitbreidingen" copy *if* built (Assignment 5) |
| E — mini-games (cut) | Risks weakening the single faucet | Would need free/paid line drawn carefully | Not built — risk > value now |
| F — retention depth (cut) | n/a | Already complete | Not built — gate on measurement |

**Concern for the dispatcher / CEO:** the paywall copy in `src/game/strings.js`
(`unlock.perkPrestige`, `premium.chapterBody`) promises themes and factory expansions that do
not exist in code today — a live copy-vs-code gap (guardrail-4-adjacent). Assignment B closes
the themes half; the "fabrieks-uitbreidingen" half is closed only by the **optional**
Assignment 5, otherwise the copy should be softened. This is the CEO's call at review and is
flagged here, not silently built.
