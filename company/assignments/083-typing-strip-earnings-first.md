---
id: 083
title: Typing strip — earnings-first, remove goal sliver, one-shot chips (world-pass slice 1)
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

The play/typing screen is the surface where the child types. Per ADR 012 ruling 1 it must
carry **only high-level earnings** — what the factory earns per second and what it has
earned — nothing else from the factory world, and zero ambient motion. Today it still shows
a "goal sliver" (a `JE VOLGENDE MACHINE · nog N` line with a progress bar) and three little
chips (`.golden-banner`, `.boost-chip`, `.type-hint`) that pulse **forever** (`animation:
… infinite`). Rework the typing view in `GameScreen.jsx` / `game.css`: remove the goal
sliver entirely (the "next goal" now lives only on the factory page's build ticket), add an
**earnings cluster** (earn rate + earned total as the primary readout, `×mult` + `acc%` as
quiet secondary readouts), and change those three chips from an infinite pulse to a
**one-shot entrance** that then rests still. This same motion change also resolves the
assignment 073 bounce — those three chips are the exact offenders 073 was bounced on. No
economy, engine, store, or theme change; this is presentation only.

## Acceptance criteria

- [ ] The typing view no longer renders the goal sliver (`.goalsliver`): no next-machine
      name, "JE VOLGENDE MACHINE" kicker, or next-goal progress bar appears on the typing
      screen. (W4)
- [ ] The typing view shows an **earnings cluster** in the `--data` LED face: earn rate
      (`+N/s`) and earned-total coins are the visually **primary** readouts; `×mult` and
      `acc%` are present but visibly smaller / subordinate. (W4)
- [ ] `.golden-banner`, `.boost-chip`, and `.type-hint` no longer animate infinitely:
      `getComputedStyle(el).animationIterationCount` is **not** `"infinite"` for any of them
      in each state they appear — default first-run (`.type-hint`), an active daily-warmup
      boost (`.boost-chip`), and a forced golden run (`.golden-banner`). Each may play one
      one-shot entrance (`dropIn`/`cardPop` idiom) then rest still. (W3; closes 073 AC2)
- [ ] Zero ambient / idle animation anywhere on the typing view: only the caret and the
      next-key hint move per keystroke; celebration overlays still fire between exercises,
      unchanged. (073 AC2 verbatim)
- [ ] Preserved earn signal: as the child completes exercises, the earned-total coin readout
      ticks up live (real state, not a decorative loop) — typing does not feel dead. (073 AC3)
- [ ] A long Dutch typing sentence wraps within the typing card (the `--data`
      `clamp(...)` size) with no clipping or horizontal overflow at desktop width. (W5,
      typing-card portion)
- [ ] Token discipline: every colour is a `var(--token)` or `color-mix(in srgb, var(--token)
      N%, transparent)`; **zero new `:root` tokens**; grep-clean of themable hex/rgba (only
      `#000` inside a `mask:` stencil permitted). (W6)
- [ ] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`,
      `theme.js`, and `goals.js` untouched; a save made before this assignment loads and
      plays identically. No idle income — typing stays the only coin faucet.
- [ ] `npm test` green (currently 230/230 — must not regress); `check-no-dutch-en` passes;
      any `public/**` / `sitemap.xml` build-churn is reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W3** (typing-view motion ban + the 073 chip
re-spec) and **W4** (typing-strip earnings-first). Mock: `design/factory-mocks/
world-typing-strip.html`.

**File surfaces (for the dispatcher's overlap judgment):** `src/game/GameScreen.jsx`,
`src/game/game.css`, and `src/game/strings.js` + `test/locale.test.js` if goal-sliver string
keys are removed / earnings labels added. Shares `game.css` and `strings.js` with 084 — not
file-disjoint from 084; **is** file-disjoint from 069 (`App.jsx`/`index.html`).

**Closes 073.** Assignment 073 is `blocked_by` this slice. This slice's tester must
independently re-check 073's AC2 on the built tree (the three chips no longer pulse infinitely
in default / boost / golden states — repro is in `qa-scripts/073-tester.mjs`) and flip 073 →
`done` if it holds. Do **not** re-add the goal sliver: if 076's playtest later finds the
typing→factory thread feels severed, the cheapest re-add (a single "🏭 Fabriek → [name] bijna
klaar" line on the factory button, W4) is a future PO call, not this slice. Terminal state
`needs_verification`.

### Delivery notes (developer, dev/083, 2026-07-24)

**What changed, per AC**, all in `src/game/GameScreen.jsx` + `src/game/game.css` +
`src/game/strings.js`/`test/locale.test.js` (for the two orphaned keys) — `store.js`,
`economy.js`, `theme.js`, `goals.js`, `src/engine/`, `App.jsx`, `Shop.jsx`,
`FactoryPage.jsx`, `index.html` all untouched (confirmed, see save-compat evidence below):

- **AC1 (goal sliver gone).** Removed the whole `.goalsliver` JSX block, the `nextGoal`
  import, and the `goal` computation from `GameScreen.jsx` (no `goal` consumer left in
  this file) plus all `.goalsliver*` rules from `game.css`. `goal.sliverLabel`/
  `goal.remaining` were only ever consumed by this block (confirmed via grep — `Shop.jsx`
  uses the *object field* `goal.remaining`, a different thing from the *string key*
  `'goal.remaining'`, and its own `goal.togoLine`/`goal.spotKicker`/`goal.effort` keys,
  none of which I touched) — removed both keys from both locale maps in `strings.js` and
  from `STATIC_FLOW_KEYS` in `test/locale.test.js` per the assignment's own instruction.
- **AC2 (earnings cluster, primary vs subordinate).** Kept the existing `.cps-pill`
  (earn rate, `⚙️ +N/s`) and `.coin-pill` (earned total) — they already *were* the
  earnings readout, just visually equal-weight with `×mult`/`acc%`. Wrapped them in a new
  `.earn-cluster` span (leads the wallet, right after the contextual streak/star badges)
  and wrapped `.mult-pill`/`.acc-pill` in a new `.lever` span (trails). Made the
  hierarchy real, not just DOM order: scoped `.game-bar .wallet .cps-pill { font-size:
  1.05rem }` (matching `.coin-pill`'s pre-existing 1.15rem — both now visibly bigger),
  and shrank `.mult-pill, .acc-pill` to `font-size: 0.8rem` + tighter padding. Verified
  via computed style: rate=16.8px vs mult=12.8px, total=18.4px vs acc=12.8px (16px root).
- **AC3 (no more infinite chip animation) + AC4 (zero ambient motion).** Changed
  `.golden-banner`, `.boost-chip`, `.type-hint` from `animation: goldpulse/hintPulse …
  infinite` to `animation: dropIn 0.6s var(--pop)` — the *existing* `dropIn` keyframe
  (defined once, already used by the home-screen entrance) rather than a near-duplicate,
  per W3's "reuse the same idiom" instruction. Default animation-iteration-count is 1
  (one-shot), so these play their entrance once on mount and rest still — confirmed none
  of these three elements get remounted on re-render (no `key` prop, same JSX position
  across keystroke-driven re-renders), so there's no replay-on-every-render bug. Deleted
  the now-dead `goldpulse`/`hintPulse` `@keyframes` (confirmed zero remaining references).
- **AC5 (preserved live earn signal).** Untouched mechanism (`tick()` production interval
  + `earnFromExercise` payout) — verified the coin-pill text changes after a real
  exercise completion (500 → 551 in the driven run below), not a decorative loop.
- **AC6 (long-sentence wrap).** Did not touch `.typing-surface`/`.typing-text` sizing
  (still the pre-existing `clamp`-free `2.1rem` + `word-break: break-word`, unchanged) —
  verified with an injected long Dutch sentence that neither the typing card nor the
  page scrolls horizontally at 1280px.
- **AC7 (token discipline).** See the grep evidence below — zero new `:root` tokens,
  every new/changed declaration is `var(--token)`.
- **AC8 (save-compat).** `git diff --stat -- src/game/store.js src/game/economy.js
  src/game/theme.js src/engine/ src/game/App.jsx src/game/Shop.jsx
  src/game/FactoryPage.jsx src/game/goals.js index.html` is empty.
- **AC9 (tests green).** See below.

**Token-discipline self-check (grep the diff, not the whole file — per the dispatcher's
instruction).** `git diff -- src/game/game.css | grep -E '^[+-]' | grep -E
'#[0-9a-fA-F]{3,6}|rgba?\('` returns exactly one hit: the pre-existing
`text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35);` line on `.type-hint`, unchanged in value —
it only shows up because it shares a source line with the `animation:` declaration I
changed on that same line, so a line-based diff re-emits it as removed+added text.
Flagging honestly since AC7's literal text only carves out "`#000` inside a `mask:`
stencil": this is a **black** (not brand) text-shadow, an established pre-existing
codebase idiom for ink-on-color legibility (three more identical `rgba(0,0,0,…)`
text-shadows already exist elsewhere in `game.css`, e.g. `.home-title`, all predating
this assignment) — not a themable brand colour, and not introduced or altered by me. No
new hex/rgba was added anywhere; `.boost-chip`'s pre-existing raw hex
(`#5a2a00`/`#ffd0a0`/`#ff9f43`/`#b5651d`/`rgba(255,159,67,…)`) does **not** appear in the
diff at all (only its `animation:` line was touched, on its own line) — I deliberately
left that debt untouched rather than expand scope; filed as 090 (see below).
`--reward` (the token the removed `.goalsliver-fill` used) is now unconsumed anywhere in
`game.css` — left it defined in `:root`, untouched: it's pre-existing infrastructure
(not new), explicitly documented in the design doc as the alias for "earned munten" that
the factory-page build ticket (074, and 084/085's ledger/diorama slices) are expected to
keep using, so removing it wasn't this slice's call to make.

**How I verified it end-to-end.** `npm install` (22 packages, clean), `npm test`:
**230/230 green** (same count as before — removing two now-unused locale keys doesn't
change the flow-key test's assertion count, it iterates the same array), `vite build`
succeeds (101 modules), `check-no-dutch-en` PASS (5 built en files, 0 unallowlisted
Dutch hits). `gen-content` churned `public/**`/`sitemap.xml` as its known side effect
both times I ran the full pipeline; reverted with `git checkout -- public/` before
committing (confirmed clean via `git status --porcelain`).

Then built and served with `vite preview --port 4237` (only port used, per instruction),
installed `playwright-core --no-save` (Chromium 1228 already cached system-wide at
`C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228`), and drove the real app with
a new script, `qa-scripts/083-verify.mjs` (modelled on the tester's `073-tester.mjs`
forcing techniques, since that bounce was specifically caused by a verify script that
never drove the first-run/boost/golden states). **24/24 checks passed**, covering:
- **The three-chip animation audit, all three states** (the actual verification bar this
  assignment exists to clear): first-run pre-keystroke (`.type-hint`,
  `animationIterationCount` = `"1"`), an active daily-warmup boost forced via a fixture
  with `boostLeft: 3` + `lastDay` set to today's `dayKey()` (so `checkDailyReturn`'s
  `last === today` branch is a no-op and `boostLeft` survives untouched into render —
  `.boost-chip` renders, iter=`"1"`), and a forced-golden exercise via
  `Math.random = () => 0` in an `addInitScript` (`.golden-banner` renders, iter=`"1"`).
  A full-page `.game *` animation sweep (same technique as `073-tester.mjs`) found zero
  `animationIterationCount === "infinite"` offenders in any of the four driven states
  (default, first-run, boost, golden) — only the pre-existing caret blink (explicitly
  allowlisted by class, matching the AC's own carve-out) was excluded from the sweep.
- Earnings-cluster hierarchy: computed `font-size` of `.cps-pill`/`.coin-pill` (16.8px /
  18.4px) vs `.mult-pill`/`.acc-pill` (12.8px each) — primary readouts are visibly bigger.
- Goal-sliver absence: `.goalsliver` count 0, no "JE VOLGENDE MACHINE"/"YOUR NEXT
  MACHINE" text anywhere on `.game`, in both nl and en locale saves.
- Live earn signal: coin-pill text `500` → `551` after a real driven exercise (same
  interaction as before — no decorative loop touched).
- Long-sentence wrap: injected a long Dutch sentence into `.typing-text` at 1280px width
  — no `.typing-surface` overflow, no page-level horizontal scroll.
- Both locales checked for the strings this assignment touches — no leftover goal-sliver
  text, earnings pills render correctly in the en-locale save.
- Console/page errors: only the pre-existing, documented `/api/track` 404 (analytics
  beacon `vite preview` doesn't serve — not this assignment's concern, per instruction).
- Killed the port-4237 server afterward (`Get-NetTCPConnection -LocalPort 4237 -State
  Listen` empty; only a residual `TimeWait` socket, which is not a listener).

**What I did NOT verify** (honest gaps, not claimed): mobile/narrow-viewport reflow of
the new `.earn-cluster`/`.lever` wallet groups (075's mobile-reflow scope, not this
slice's AC — the existing `@media (max-width: 767px)` wrap rule on `.wallet` is
untouched and still applies to the new wrapper spans the same way it did to the old flat
pill list, but I didn't screenshot it); the `prefers-reduced-motion` fallback for the new
`dropIn` usages specifically (the global `@media (prefers-reduced-motion: reduce)` rule
in `game.css` is untouched and unconditionally zeroes all animation durations/iterations,
so it mechanically still applies — I didn't additionally screenshot it for this slice).

**090 filed.** `company/assignments/090-boost-streak-pill-hardcoded-hex.md` — the
pre-existing `.boost-chip`/`.streak-pill` raw hex colours (not tokens) that predate this
assignment, discovered while fixing `.boost-chip`'s animation. `status: open, priority:
4`, noted as developer-proposed. Left untouched here to stay in scope.

## Verification (tester, tick #30)

Worktree `v083` (branch `verify/083`), merged tree at `d2833b3` (main, includes 069's
htmllang tests). Independent pass — own fixtures, own script
(`qa-scripts/083-tester.mjs`), not a re-run of the dev's `083-verify.mjs`. Ran on
`vite preview --port 4239` (only port used), `playwright-core` against the system
Chromium at `C:/Users/Jakko/AppData/Local/ms-playwright/chromium-1228`.

**Pipeline:** `npm install` (22 pkgs) → `npm test`: **232/232 green** (232, not the
AC's pre-069-merge "230/230" — expected per dispatcher instruction, includes 069's 2
htmllang tests). `vite build` OK (101 modules). `check-no-dutch-en` PASS (5 built en
files, 0 unallowlisted Dutch hits). `gen-content` churned `public/**`/`sitemap.xml` as
its documented side effect; reverted via `git checkout -- public/` before and after,
confirmed clean via `git status --porcelain`.

**Per-AC verdict, all independently re-derived:**
- **AC1 (goal sliver gone)** — PASS. `.goalsliver` count 0 and no "JE VOLGENDE
  MACHINE"/"YOUR NEXT MACHINE" text anywhere on `.game`, checked in nl (default) and
  en (forced-boost) states.
- **AC2 (earnings cluster hierarchy)** — PASS. Own computed-style read: rate=16.8px,
  total=18.4px vs mult=12.8px, acc=12.8px (independently reproduces the dev's numbers).
  Also confirmed DOM order: `.earn-cluster` precedes `.lever` inside `.wallet`.
- **AC3+AC4 (no infinite chip animation / zero ambient motion — the 073 bounce bar)**
  — PASS. Full `.game *` computed-style animation sweep (`tchar` caret allowlisted) run
  in **six** driven states: default mid-session, first-run pre-keystroke (`.type-hint`,
  iter=`"1"`), forced daily-warmup boost via fixture `boostLeft:3`+`lastDay=dayKey()`
  (`.boost-chip`, iter=`"1"`), forced golden run via `Math.random=()=>0` addInitScript
  (`.golden-banner`, iter=`"1"`), **and two states the dev's script did not
  cover**: (a) boost AND golden simultaneously (both chips render together, sweep
  clean) and (b) the en locale in a forced-boost state (`.boost-chip` present, no
  "YOUR NEXT MACHINE" leftover, sweep clean). Zero `infinite` offenders in any of the
  six states. Also probed `prefers-reduced-motion: reduce` (adversarial, not an
  explicit AC): the global rule correctly zeroes duration (`0.01ms` → `1e-05s`
  computed) and forces `animation-iteration-count: 1` on all three chips even under a
  forced golden+first-run state.
- **AC5 (preserved live earn signal)** — PASS. Coin-pill ticked `500` → `550` after a
  real driven exercise (own fixture, own text, not a re-run of the dev's numbers).
- **AC6 (long-sentence wrap)** — PASS. Injected a longer stress sentence than the
  dev's at 1280px: `.typing-surface` `overflowsCard: false`, page `overflowsPage:
  false`. Noted for the record (not a defect): `.typing-text` is still a flat
  `font-size: 2.1rem` with `word-break: break-word`, not literally the
  `clamp(1.25rem,4.4vw,2.1rem)` W5 describes — this predates 083 (083 did not touch
  `.typing-surface`/`.typing-text` sizing, confirmed via the diff), is honestly
  flagged as unverified-for-clamp in the dev's own delivery notes, and the AC's actual
  wording ("wraps... no clipping or horizontal overflow at desktop width") holds
  regardless. Not filed as a new defect — pre-existing, out of this slice's diff.
- **AC7 (token discipline)** — PASS. `git diff 5a2d3c2 8b82cce -- src/game/game.css`
  shows zero new `:root` token declarations added. The only hex/rgba hit in the diff
  is the pre-existing `text-shadow: 0 2px 0 rgba(0, 0, 0, 0.35)` line on `.type-hint`,
  value unchanged — it only appears because it shares a source line with the changed
  `animation:` declaration, a line-diff artifact, exactly as the dev described. The
  `.boost-chip`/`.streak-pill` raw-hex debt is confirmed genuinely pre-existing (only
  the `animation:` line on `.boost-chip` is touched; the hex-bearing lines do not
  appear in the diff at all) — 090 is a truthful flag, not scope-dodging.
- **AC8 (save-compat)** — PASS. `git diff 5a2d3c2 083b6ee --stat -- src/game/store.js
  src/game/economy.js src/engine/ src/game/theme.js src/game/goals.js src/game/App.jsx
  src/game/Shop.jsx src/game/FactoryPage.jsx index.html` is empty. Drove a
  pre-existing-shaped save (`coins:1234`, `curriculumIndex:20`, `exercisesDone:80`)
  through a full exercise with no errors; coin total displayed correctly and updated
  as expected — plays identically.
- **AC9 (tests green)** — PASS, see pipeline above.

**Also checked, adversarial, no explicit AC:** 375px mobile viewport with the new
`.earn-cluster`/`.lever` wallet groups — no horizontal page overflow. No unexpected
4xx/5xx (only the documented `/api/track` 404). `.mult-pill`/`.acc-pill`'s new global
`font-size: 0.8rem` and `.cps-pill`'s `.game-bar .wallet`-scoped `1.05rem` bump
confirmed not to leak onto the home screen's `.coin-pill.big`/`.cps-pill.big` (separate
selectors, different scope).

**Overall verdict: PASS, all 9 ACs hold. No new defect filed — 089 lapses, unused.**
Killed the port-4239 preview server afterward (`Get-NetTCPConnection`/`netstat` confirm
no LISTENING socket on 4239, only residual TIME_WAIT). New file kept for the record:
`qa-scripts/083-tester.mjs` (31/31 own checks passed).
