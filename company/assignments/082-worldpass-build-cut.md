---
id: 082
title: World-pass build cut — slice the verified Maquette design (079) into developer assignments
owner: product-owner
status: done
priority: 1
blocked_by: [079]
opened_by: ceo
---

## Goal

Assignment 079 (the world-pass design deep pass) is `done` — the tester verified all five
ACs on tick #29 and confirmed `design/DESIGN-FACTORY.md` **PART II — WORLD PASS (W0–W8)** is
buildable as written. ADR 012 said the design redirect "must precede further factory build
lanes"; it now has. This assignment is the **cut**: it turns PART II into a sequenced set of
buildable developer assignments (083–088) and adjudicates the open defects that were
deliberately held for this cut (070, 073, 080) and the assignments the redirect stranded
(075, 069, 076). No production code is written here — this is scope and sequencing.

The world pass keeps **every** economy/engine handler and the per-machine state logic from
074's landed skeleton and re-skins the surface into "De Maquette" — a tilted blueprint
diorama you look across — plus two folded-in defect fixes (070 coin ledger, 080 word-break)
and an earnings-only typing strip (which also lands the 073 calm-motion fix). It is
presentation-only: `store.js` / `economy.js` / engine / `theme.js` / `goals.js` stay
untouched, so a child's built factory survives with zero migration.

## The slice plan (six slices, ids 083–088)

Following the designer's proposed six presentation-only slices (W7), lightly re-cut so the
two small defect-closing slices (typing strip, ledger) are the dispatchable first wave.

| Id  | Title | Owner | Prio | blocked_by | Closes | File surfaces |
|-----|-------|-------|------|------------|--------|---------------|
| 083 | Typing strip — earnings-first + one-shot chips | developer | 2 | — | 073 | `GameScreen.jsx`, `game.css`, `strings.js`, `test/locale.test.js` |
| 084 | Factory ledger — coin / rate / star readout | developer | 2 | — | 070 | `FactoryPage.jsx`/`Shop.jsx`, `game.css`, `strings.js` |
| 085 | The Maquette diorama floor | developer | 2 | 084 | — | `Shop.jsx`, `game.css` |
| 086 | Atmosphere & motion (ambient / arrival / build) | developer | 3 | 085 | — | `game.css`, `Shop.jsx` |
| 087 | Werkbank (upgrades + prestige) + 080 hyphens fix | developer | 2 | 069 | 080 | `Shop.jsx`, `game.css` |
| 088 | Edge states for the world (empty/loading/offline) | developer | 3 | 085 | 075 | `Shop.jsx`, `FactoryPage.jsx`, `game.css`, `strings.js`, `test/locale.test.js` |

Plus the pre-existing correctness fix that gates the hyphenation slice:

| Id  | Title | Owner | Prio | blocked_by | File surfaces |
|-----|-------|-------|------|------------|---------------|
| 069 | `<html lang>` never syncs to active locale | developer | 2 | — | `App.jsx`, `index.html` |

And the milestone gate, re-pointed at the new chain:

| Id  | Title | Owner | Prio | blocked_by |
|-----|-------|-------|------|------------|
| 076 | Milestone playtest-critique gate | tester | 2 | 083, 084, 085, 086, 087, 088 |

## Sequencing rationale

- **Something demonstrable early, each step unblocks the next.** 083 (typing strip) and 084
  (ledger) are small, self-contained, and each *closes an open defect on its own* — they are
  dispatchable immediately with no blocker and give visible progress before the big build.
  069 (locale/lang sync) is also immediately dispatchable and is the precondition for 087's
  hyphenation.
- **The diorama is the marquee, built on a stable base.** 085 (the diorama floor) is blocked
  by 084 so the coin ledger exists and the diorama incorporates it (W2d places the ledger in
  the diorama's top-right) rather than two lanes both rendering it; both also share
  `Shop.jsx`/`game.css`. 086 (motion) is blocked by 085 because you cannot animate machine
  models that do not exist yet — and 085 ships each machine's *resting* state as its finished
  look, so 086 layers motion without changing markup (this is what makes the reduced-motion
  fallback correct).
- **069 → 087 is a real dependency, not a false one.** `hyphens: auto` picks its dictionary
  from `<html lang>`. 069 makes `<html lang>` track the active UI locale; without it, an
  English session silently hyphenates a compound word under the Dutch dictionary. So 087 is
  blocked by 069. 087 is otherwise independent of the diorama chain — it can run in its own
  worktree in parallel with 085/086 once 069 is done (it shares `Shop.jsx`/`game.css` with
  them, so parallel means separate worktree + integration merge, not the same checkout).
- **Edge states last.** 088 is blocked by 085 (it draws states *of* the diorama world). Long
  machine-name hyphenation in the long-text state is owned by 087, not re-verified in 088; the
  typing-card long-sentence wrap is owned by 083.

## Dispositions (the held defects and stranded assignments)

Rule applied throughout (PROTOCOL + dispatch brief): **nothing flips to `done` without a
tester verifying the fix on the built tree.** Each folded defect is set `blocked` on the
slice that fixes it, and that slice's ACs are written so its tester can also close the defect.

- **073 (calm typing view, bounced on AC2)** — **folded into 083.** W3/W4 re-spec the exact
  three chips 073 bounced on (`.golden-banner` / `.boost-chip` / `.type-hint`, infinite pulse
  → one-shot) as part of the earnings-only typing strip; a separate assignment would touch the
  same file (`GameScreen.jsx`/`game.css`) for the same fix. Set `status: blocked`,
  `blocked_by: [083]`. 083 AC includes the "no infinite iteration on those three chips in all
  live states" check; 083's tester closes 073.
- **070 (factory page shows no coin/star balance, AC1 open)** — **folded into 084.** W2d's
  ledger surfaces `fmt(state.tycoon.coins)` directly — the exact missing number. Set
  `status: blocked`, `blocked_by: [084]`. 084's tester closes 070.
- **080 (upgrade name mid-word break)** — **folded into 087.** W2f replaces
  `overflow-wrap: anywhere` with `hyphens: auto` on the werkbank tile. Set `status: blocked`,
  `blocked_by: [087]`. 087's tester closes 080.
- **075 (mobile reflow + states, blocked)** — **superseded.** ADR 012 ruling 3 cancelled its
  mobile half (game surfaces have no mobile target); 079 carried its surviving edge-states
  scope into W5, which 088 builds. Its remaining value is fully absorbed by 088. Set
  `blocked_by: [088]` with an explicit absorption note; 088's tester closes 075 as delivered
  via 088. (No mobile work will ever be built under it — that is the truthful terminal.)
- **069 (`<html lang>` locale sync, open)** — **sequenced, not folded.** It is a real
  pre-existing `src/**` fix already filed by the tester; it stays its own assignment. Raised
  priority 3 → 2 and made the `blocked_by` of 087 (see rationale). Dispatchable now.
- **076 (milestone playtest gate)** — **re-pointed.** Old chain `[072, 073, 074, 075]` is
  obsolete (072/074 done; 073/075 folded/superseded). New `blocked_by: [083, 084, 085, 086,
  087, 088]` — it gates on the world-pass build chain, per ADR 013 (076 is the flywheel's
  intake, not a pass/fail gate).

## Ids

- **Used:** 083, 084, 085, 086, 087, 088 (six slices). 082 is this cut record.
- **Returned unused:** 089, 090.
- Existing ids touched (disposition edits only, not new): 069, 070, 073, 075, 076, 080.

## For the CEO / anything above the PO

- Nothing here needs a Shareholder decision — the whole cut lives inside ADR 012/013 and the
  charter guardrails, and 079's designer already flagged the two challengeable calls (goal
  sliver removed vs demoted; ambient life "at rest" not producing coins) which the tester
  upheld. Both are carried into the slices as-specced.
- **One thing for 076 to watch, not a blocker:** W4 removes the typing→factory goal thread
  entirely from the typing view. If 076's playtest finds the connection feels severed, the
  cheapest re-add (a single "🏭 Fabriek → [name] bijna klaar" line on the factory button, per
  W4) is a future PO call — it is deliberately *not* in any slice, to honour ruling 1.

## Notes

Authority: ADR 012 (world-pass redirect, keyboard-first), ADR 013 (autonomous experience
flywheel), `design/DESIGN-FACTORY.md` PART II (W0–W8, verified in 079). This is the PO work
product delivered this dispatch, so terminal state `needs_verification` — a role that did not
write it confirms the cut is faithful to PART II and the dispositions are truthful before it
is `done`. Milestone map appended to `research/milestone-factory.md` §8.

## Verification (tester, tick #30)

Worktree `v082` (branch `verify/082`, off `main` at `d2833b3`). Docs/board-consistency pass
only — no app serving, no npm. Read `company/assignments/082-worldpass-build-cut.md`,
`design/DESIGN-FACTORY.md` PART II W0–W8 (esp. W7), ADR 012, ADR 013, `company/charter.md`,
all six slice files (083–088), and every disposition target (069, 070, 073, 075, 076, 080) by
reading their frontmatter and body directly on disk — nothing taken on the cut's word.

1. **Slice files exist and match the cut table — PASS.** `company/assignments/083…088` all
   exist with exactly the owner/priority/blocked_by the table states: 083 `developer/2/[]`,
   084 `developer/2/[]`, 085 `developer/2/[084]`, 086 `developer/3/[085]`, 087
   `developer/2/[069]`, 088 `developer/3/[085]` (verified via each file's frontmatter). Each
   slice's ACs are concrete/checkable (DOM selector counts, `getComputedStyle` checks,
   `git diff --stat` file lists, rendered-break spot checks) and each cites the PART II
   section it traces to: 083→W3/W4, 084→W2d, 085→W2a/W2b/W2c/W2e (+W7 items 1–3),
   086→W3 (+W7 item 6), 087→W2f (+W7 item 4), 088→W5 (+W7 slice 6). Every slice carries a
   "File surfaces" note naming exact files and explicitly flagging overlap with sibling
   slices (e.g. 085's "the dispatcher should expect to merge `Shop.jsx`/`game.css`").

2. **Coverage faithful to PART II — PASS.** W7's designer-proposed six-slice build order
   (typing strip → ledger → diorama floor → atmosphere/motion → werkbank+080 → edge states)
   maps 1:1 onto 083–088 in the same order, same defect closures (073→083, 070→084, 080→087),
   same "absorbs 075" landing (→088). Nothing in W0–W8 is unaccounted for; no slice invents
   scope PART II doesn't contain — checked each AC list against its cited W-section and found
   no addition beyond what the section specifies. Presentation-only claim holds: all six
   slices (083–088) carry an explicit AC requiring `git diff --stat` show `store.js`,
   `economy.js`, `src/engine/`, `theme.js`, `goals.js` untouched.

3. **Dispositions truthfully recorded on disk — PASS**, each read directly:
   - `069-html-lang-locale-sync.md`: priority `2` (raised from 3, per its own cut-note banner),
     `blocked_by: []` (dispatchable now), and it is `087`'s `blocked_by` — confirmed in
     087's own frontmatter (`blocked_by: [069]`).
   - `070-factory-page-missing-coin-star-readout.md`: `status: blocked`, `blocked_by: [084]`.
   - `073-calm-typing-view.md`: `status: blocked`, `blocked_by: [083]`.
   - `075-mobile-reflow-states.md`: `status: blocked`, `blocked_by: [088]`, with the explicit
     absorption/supersession banner citing ADR 012 ruling 3 (mobile half cancelled, edge-states
     half absorbed into 088).
   - `076-factory-playtest-critique.md`: `blocked_by: [083, 084, 085, 086, 087, 088]` exactly.
   - `080-obj-name-overflow-wrap-anywhere-ugly-break.md`: `status: blocked`,
     `blocked_by: [087]`.
   All match the cut record's claims exactly.

4. **Authority — PASS.** Read ADR 012 and ADR 013 in full: 082's citations of ruling 1
   (earnings-first typing strip), ruling 2 (Bouwplan grows, doesn't replace), ruling 3
   (keyboard-first, 075's mobile half cancelled) and ADR 013's flywheel-intake framing for 076
   all match the source ADRs verbatim in substance — no forged authority. Charter guardrails
   (no idle income, no pressure mechanics, breadth-not-power, €50/mo ceiling) are respected:
   this is a scope/sequencing document, zero spend, zero new recurring commitment, and no
   slice's ACs permit a guardrail violation. Nothing here usurps a CEO/Shareholder decision —
   082 explicitly defers the one open judgment call (076's future goal-thread re-add) to a
   future PO/CEO call rather than deciding it now.

5. **Id hygiene — PASS.** Directory listing of `company/assignments/` confirms exactly one
   file per id, no collisions. Ids 083–088 used as claimed; 082 is the cut record itself. 089
   does not exist anywhere in the tree (never consumed). 090 exists
   (`090-boost-streak-pill-hardcoded-hex.md`, `open`/priority 4) — per the brief this was filed
   by a developer lane in tick #29 *after* the cut returned it to the pool, which is legitimate
   dispatcher re-allocation, not a cut error; 082's own "returned unused: 089, 090" claim was
   true at the time the cut landed.

6. **Sequencing sanity — PASS.** Chain verified directly from frontmatter, not from the cut's
   prose: 085←[084], 086←[085] (084→085→086 holds); 087←[069] (069→087 holds); 088←[085]
   (085→088 holds). 083, 084, 069 are all `blocked_by: []` and immediately dispatchable. No
   cycles (each blocker set is upstream-only, terminating at the three unblocked ids). No slice
   is unreachable — every one of 083–088 either has no blocker or chains back to one that does.

**Overall: PASS on all six checks.** No dropped scope, no untruthful disposition, no
sequencing error, no authority overreach. Status set `done`.
