---
id: 073
title: Calm typing view — goal sliver, one-line bar, remove FactoryFloor + meters
owner: developer
status: needs_verification
priority: 2
blocked_by: [071, 072]
opened_by: product-owner
---

## Goal

Make the typing view calm: typing is the work surface, one named goal visible, zero
ambient motion. This carries the PO adjudication on `FactoryFloor` (scope
`research/milestone-factory.md` §4): the always-on animated factory-floor strip is
**removed** from the typing view — it is the single most on-target instance of ADR-011's
"basic and distracting" complaint and removing it changes no economy or learning. Authority:
decisions/011, design `design/DESIGN-FACTORY.md` §4/§5a/§7.

Rework the play view (design §5a) to: a **thin one-line bar** (`← Menu` · `×mult · acc%
· ● coins` in the mono `--data` face + a `🏭 Fabriek` button); a **goal sliver** fed by
`nextGoal` (071) — `🦾 [name] · JE VOLGENDE MACHINE ▓▓▓░ nog N`, bar in `--reward`; the
existing `ui/TypingSurface.jsx` typing card (unchanged) with the next-key hint only. Remove
from the typing view: `FactoryFloor` (delete the component file if nothing else references
it after removal), the separate `.meters` block (fold `×mult · acc%` into the one-line bar),
and the `.shop` rail (it now lives on the factory page from 072).

## Acceptance criteria

- [ ] The typing view no longer renders `FactoryFloor` or the `.meters` block or the
      `.shop` rail; the sentence/typing card is the visually dominant element.
- [ ] The typing view has **zero ambient/idle animation** (no floor animation, no idle
      wiggle/pulse); only the next-key hint and caret move per keystroke, and celebration
      overlays still fire between exercises as before.
- [ ] **Preserved-value clause (required):** the calm typing view retains a minimal,
      non-ambient **live earn signal** — as the child earns, the coin readout ticks up and
      the goal-sliver bar advances toward the named next machine. Typing does not feel dead.
- [ ] The goal sliver shows the correct `nextGoal` output (icon, name, "JE VOLGENDE
      MACHINE", progress bar = fraction, "nog N") and updates as coins/levels/letters change.
- [ ] If `FactoryFloor.jsx` is now unreferenced, it is deleted (no dead component left).
- [ ] Save-compat: `store.js` shape, `economy.js` data, engine state, `theme.js` unchanged;
      a pre-existing save loads and plays identically. 071 invariant test stays green.
- [ ] `npm test` green.

## Notes

Do NOT re-open the FactoryFloor removal as a CEO question — the PO adjudicated it inside
the ADR-011 mandate (scope §4). If, while building, the calm view genuinely feels dead
even with the preserved earn signal, set `blocked` and describe it — do not re-add the
animated floor. Shares `App.jsx`/`game.css` with 074 — coordinate worktrees. Terminal
state needs_verification.

### Delivery notes (developer, dev/073, 2026-07-24)

**What was built**, all in `src/game/GameScreen.jsx` + `src/game/game.css` + a small
`src/game/strings.js`/`test/locale.test.js` addition — `App.jsx`, `economy.js`,
`store.js`, `theme.js`, `Shop.jsx`, `FactoryPage.jsx` untouched:

- **Removed** the `FactoryFloor` import/render, the `typingActive` state that only fed
  it (dead once the floor is gone — the production-tick effect still runs `tick()`
  unconditionally on the interval, so coin production is unaffected), and the whole
  `.meters` block (mult-meter + combo-meter). Deleted `src/game/FactoryFloor.jsx`
  (confirmed unreferenced first: `grep -rn FactoryFloor src` showed only its own file).
  Removed the now-dead `.floor*`/`.meter*`/`.combo-meter` CSS and the two now-orphaned
  strings `play.idleFloor`/`play.floorEmpty` (their only consumer was `FactoryFloor.jsx`)
  from both locale maps and `test/locale.test.js`'s `STATIC_FLOW_KEYS`.
- **One-line bar**: folded `×mult` and `acc%` into the existing `.wallet` (game-bar),
  as two new pills (`.mult-pill`/`.acc-pill`) styled identically to the existing
  `.cps-pill` idiom, reusing the already-computed `liveMult`/`accPct`. Combo count
  itself is dropped from persistent display per design §7 ("folded into ×mult · acc%
  … combo milestones still celebrate via the existing combo-flash") — the milestone
  burst (`comboFlash`/`.combo-flash`) is untouched and still fires at 25/50/100.
  Scoped `font-family: var(--data)` (new token, added to `:root`) to `.game-bar .wallet`'s
  numeric pills (mult/acc/coins/cps) only, so the home screen's `.coin-pill.big` etc. are
  unaffected.
- **Goal sliver** (`.goalsliver`, new): renders `nextGoal(state.tycoon, lettersLearned)`
  (071's helper, imported read-only) every render — icon, name (Lilita One display font,
  per design §4), the literal kicker `JE VOLGENDE MACHINE`/`YOUR NEXT MACHINE` (two new
  `goal.sliverLabel`/`goal.remaining` string keys, added to both locale maps + the
  `STATIC_FLOW_KEYS` flow list), a fill bar using the new `--reward` token
  (`var(--brass)`, per design §4/§5a — no hardcoded colour), and `nog {n}`/`{n} to go`
  formatted with the existing `fmt()`. No stored "current goal" — recomputed from
  `state.tycoon`/`lettersLearned` on every render, so it advances live as coins/levels/
  letters change (research/milestone-factory.md §3b), same as the design intent.
  `goal.locked` (071's premium-flag) is intentionally **not** specially handled here:
  the sliver is a read-only display with no buy affordance, so the 071 tester's flagged
  "combine `locked` with `isUnlocked()`" concern applies to whichever UI adds a routable
  buy button (074's spotlit goal panel / factory page) — there's no purchase action on
  the sliver to route incorrectly. Documented here for the record, not filed as a defect.
- Added `.game { max-width: 760px; margin: 0 auto; }` (design §5a: "top-to-bottom,
  centred, max ~760px") now that the shop rail (072) and the floor (073) are both gone —
  makes the typing card the visually dominant element on wide screens, satisfying that
  AC without inventing any new token.
- `.goalsliver` uses `flex-wrap: wrap` so on narrow viewports it wraps to multiple lines
  rather than overflowing horizontally; a dedicated mobile-specific stacked layout is
  075's job (not built here — verified only that 375px doesn't overflow, per instruction).

**Preserved-value clause, verified, not assumed.** Built a pre-073-shaped save (real
`newProfile`/`newState`, `coins:500`, `robotarm` next at cost 600, matching `nextGoal`'s
rung-1 selection), served it, and: (a) coin-pill showed `500` before typing, `551` after
one exercise — ticks up; (b) `.goalsliver-fill`'s inline `width` went `83.3333%` →
`91.9747%` in the same run — the bar visibly advances. Both driven by real state changes
(the exercise-complete `earnFromExercise` payout and the already-existing production-tick
`setInterval`), not a decorative loop — confirms zero ambient motion otherwise (no
`animation`/`@keyframes` left on the typing view besides the pre-existing caret blink
inside the untouched `ui/TypingSurface.jsx` and the discrete `coinBump`/`comboBurst`
event flashes).

**How I verified it end-to-end.** Worktree had no `node_modules`: ran `npm install`
(22 packages) then `npm test`: **229/229 unit tests pass** (unchanged count from 072's
merged baseline — no test added/removed by this assignment, it's presentation-only),
`vite build` succeeds (101 modules), `check-no-dutch-en` PASS (5 built en files, 0
unallowlisted Dutch hits). `gen-content` churned `public/**`/`sitemap.xml` as its known
side effect; confirmed with `git diff --stat` and reverted with `git checkout -- public/`
before committing.

Then built (`vite build`) and served with `vite preview --port 4228` (only port used, per
instruction), installed `playwright-core --no-save` (Chromium 1228 already cached
system-wide), and drove the real app with a new script at `qa-scripts/073-verify.mjs`
(matches the repo's `qa-scripts/*-verify.mjs` convention, modelled on 072's). Loaded a
pre-073-shaped save via `localStorage` (same shape `store.js` writes) and confirmed:
- `.floor`, `.meters`, `.shop` all absent from the play view (counts: 0/0/0).
- `.mult-pill` reads `×3.0`, `.acc-pill` reads `100% netjes` — folded correctly.
- Goal sliver: name `Robotarm`, kicker `JE VOLGENDE MACHINE`, `nog 100` (cost 600 - coins
  500) — matches `nextGoal`'s rung-1 output for this save exactly.
- Preserved-value clause (coin tick-up + bar advance) — see above.
- `🏭 Fabriek` → factory page (`.shop` present there) → `← Typen` → back on
  `.typing-surface`, goal sliver still present — nav round-trips, never a dead end.
- 375px viewport: `document.documentElement.scrollWidth > clientWidth` is `false` — no
  horizontal overflow.
- Console/page errors: only the pre-existing `/api/track` 404 (the analytics beacon
  hitting a serverless function `vite preview` doesn't serve — confirmed via a second,
  minimal script that it fires on a bare page load with no interaction, i.e. unrelated
  to anything this assignment touches; the 072 tester independently documented the same
  404 reproducing on an unmodified `master` checkout). No errors originating from any
  code this assignment changed.
- Killed the preview server afterward (`netstat -ano | grep LISTENING.*4228` empty).

**Save-compat guardrail.** `git diff --stat -- src/game/store.js src/game/economy.js
src/game/theme.js src/engine/ src/game/App.jsx src/game/Shop.jsx src/game/FactoryPage.jsx`
is empty — none of those files were touched. `test/store.test.js` (071's save-schema
invariant) is included in the 229/229 green run above.

**Guardrail on scope.** Commit is scoped to exactly the files this assignment touches
(`src/game/GameScreen.jsx`, `src/game/game.css`, `src/game/strings.js`,
`test/locale.test.js`, the new `qa-scripts/073-verify.mjs`, the deletion of
`src/game/FactoryFloor.jsx`) plus this assignment file — `public/**` build-churn reverted
before committing, nothing from 074/075's scope touched.

**078 not used.** Nothing discovered during this assignment warranted a new proposed
assignment — the two things I might otherwise have filed (the `goal.locked`/`isUnlocked()`
combination question, and the mobile stacked-layout treatment) are already explicitly
owned by other in-flight/queued assignments (074's spotlit-goal buy button; 075's mobile
reflow), not gaps this assignment introduced. 078 lapses, unused.
