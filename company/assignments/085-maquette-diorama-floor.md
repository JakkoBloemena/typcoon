---
id: 085
title: The Maquette — diorama floor, machine states, build ticket (world-pass slice 3)
owner: developer
status: done
priority: 2
blocked_by: [084]
opened_by: product-owner
---

## Goal

The factory page today is a flat chip-diagram (074's roadmap in `Shop.jsx`). ADR 012 ruled the
factory must be a **WORLD, not a panel** — a full-page place a kid experiences. Rebuild the
factory surface as **"De Maquette"**: a tilted blueprint diorama you look across, like an
architect's scale model or a LEGO/model-railway baseplate on a table. **Built** machines stand
up off the plan as plinths near the front (big, full-colour, casting shadows, status light,
level/rate readout); the **current/next** machine is a glowing brass **foundation plot**
(`🦾 NU BOUWEN`, `nog N munten`); **locked** machines are flat blue-line **ghost drawings**
receding toward a horizon (letter-gate `nog N letters`, or premium `🔒 volledige fabriek`
routing to the parent-gated `Unlock.jsx`). Depth is the growth story: moving a machine from
"ghost near the horizon" to "risen model at the front" *is* "my factory is growing." Reuse
**every** existing buy/upgrade/state handler and the per-machine state-precedence logic in
`Shop.jsx` unchanged — this is a presentation re-skin, not new economy. Machine placement is a
**computed depth-lane rule**, never hand-tuned per-machine percentages. Ambient/arrival motion
is deliberately **not** in this slice (it is 086) — ship the static, correct diorama first.

## Acceptance criteria

- [x] The factory page renders a diorama **stage** (`.hal`) with a single **tilted floor**
      layer (`perspective(...) rotateX(...)` over `--bg-grid`) and a `.horizon` line. The floor
      is the **only** transformed element — all machine icons and text sit flat and undistorted
      on top of it. (W2a)
- [x] **Built** machines render as plinths (panel gradient, thick bottom edge, elliptical cast
      shadow, mint status light, nameplate, `Lv N / +N/s` LED, milestone teaser badge).
      **Current/next** renders as a glowing brass foundation plot (`🦾 NU BOUWEN`, `nog N
      munten`, ghosted machine preview). **Locked** renders as a flat blue-line ghost with a
      letter-gate (`nog N letters`) or premium `🔒 volledige fabriek`. State selection matches
      the existing `Shop.jsx` precedence exactly — built / current / locked, including the
      "te bouwen" case and the `machineLocked ∧ unlocked` premium rule. (W2b)
- [x] Machine placement is **computed** from build-order index + depth lane (front lane =
      `scale 1`, full colour; back lane ≈ `scale 0.72`, flat/dimmed) — **no per-machine
      magic-percentage constants** in the code; a reviewer can confirm a 6th machine would slot
      in by rule with no layout redesign. (W2c)
- [x] The **BOUWBON build ticket** renders `nextGoal` (from `goals.js`, read-only) as the
      single primary goal surface: progress ring (`fraction`), name, reward (`+N/s` / `×N`),
      `nog N munten — dat haal je in ± N opdrachten` (encouragement, **never** a countdown or
      timer), and a buy button in `--reward` using the same buy handlers as 074. (W2e)
- [x] Cold-read test: a reviewer shown the built page cold reads it as a **tycoon place /
      world**, not a dashboard. (079 AC1 spirit — verified by the tester's own cold read)
- [x] The ledger from slice 084 remains present, integrated into the diorama (top-right of the
      plan). (W2d)
- [x] Guardrails: premium ghosts route to `Unlock.jsx` (breadth, not power); no idle income
      (no coin count / `coinsPerSecond` element animates); no pressure mechanics (the `± N
      opdrachten` line is an effort estimate, never a countdown). (W8)
- [x] Token discipline: glows use `color-mix(in srgb, var(--token) N%, transparent)`, **not**
      raw `rgba()`; **zero new `:root` tokens**; a `[data-theme]` swap recolours the whole
      diorama (floor grid, plinths, plot glow, ghosts, ticket); grep-clean of themable hex/rgba
      (only `#000` in a `mask:` stencil). (W6)
- [x] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched; a pre-existing save (built machines, levels, coins, stars) renders
      correctly as the diorama. `npm test` green (currently 230/230 — no regression);
      `check-no-dutch-en` passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W2a / W2b / W2c / W2e**, and **W7** items 1–3
(reuse-vs-replace: `.plan` → diorama stage; `.road` chip-row → depth-placed models;
`.goalspot` → BOUWBON ticket). Mock: `design/factory-mocks/world-C-maquette.html`.

**File surfaces:** `src/game/Shop.jsx` (roadmap markup rework) and `src/game/game.css`
(diorama styling). This is the big one. Shares both files with 084, 086, 087, 088 — the hot
integration file across the milestone is `game.css`; the dispatcher should expect to merge
`Shop.jsx`/`game.css` when lanes run in parallel worktrees.

**Motion is out of scope here** — 086 layers ambient life, arrival, and build moments on top.
Ship each machine's **resting** state as its finished look (risen plinth / inked plot / flat
ghost) so 086 can add motion without changing this markup, and so a reduced-motion user already
sees a complete factory. `blocked_by 084` (the ledger must exist first; both touch
`Shop.jsx`/`game.css`). Terminal state `needs_verification`.

### Delivery notes (developer, dev/085, 2026-07-24)

Built "De Maquette" exactly per W2a/W2b/W2c/W2e, reusing every existing buy/upgrade/rebirth
handler and the exact per-machine state-precedence logic unchanged (only the markup/CSS around
them changed). Touched only my two designated sections — `.road` → `.hal` diorama and
`.goalspot` → `.ticket` (BOUWBON) — and left `.objrow`/`.plan-context`/overlays and every
`.obj-*` CSS rule byte-for-byte untouched (d087's surface, confirmed by re-reading the final
`Shop.jsx`/`game.css` diff before committing).

- **AC1 (diorama stage, W2a).** `src/game/Shop.jsx` renders `.hal > .floor + .horizon +
  {machines}`; `.floor` is the only element with a `transform` beyond the `translateX(-50%)`
  centering trick shared by `.mch`/`.plot`/`.ghost` (that trick is not a distortion — no
  rotate/perspective/scale). Verified live (`qa-scripts/085-verify.mjs` scenario 1): `.floor`'s
  computed `transform` is a real `matrix3d(...)` (the `perspective(560px) rotateX(56deg)`), and
  every `.mch`/`.plot`/`.ghost` node's computed transform is only the `translateX` matrix — no
  perspective/rotate/scale ever leaks onto machine icons or text.
- **AC2 (machine states + exact precedence, W2b).** `stationItems` in `Shop.jsx` reproduces the
  old `.road`'s precedence **byte-for-byte in logic** — `level>0` (built/plinth) > `machineLocked`
  (premium ghost) > `!buildingUnlocked` (letter ghost) > `goal.kind==='build' && goal.id===b.id`
  (flagged "NU BOUWEN" plot) > else (plain "te bouwen" plot, the same rare edge-case branch the
  original code documented). Verified live: built plinth (nameplate, `Lv N`, mint status light,
  cast shadow, milestone badge — scenario 2); the single flagged foundation plot with `🦾 NU
  BOUWEN` and `nog N munten` (scenario 3); the rare "unlocked-but-not-goal" plain-plot branch,
  constructed with all 5 machines letter-unlocked and none built, showing exactly 1 flagged plot
  + 4 plain "te bouwen" plots (scenario 4); a letter-gated ghost showing "nog N letter(s)"
  (scenario 5); a premium ghost (name prefixed 🔒, "in de volledige fabriek" text, **not** a
  letter count) that **routes to `Unlock.jsx`** on click (scenario 6); and — the distinct
  `machineLocked ∧ unlocked` rule that also governs the **ticket's own** `goalLocked` branch
  (nextGoal is letters-only/premium-blind per `goals.js`, so it can pick a premium-gated machine
  as the goal) — verified as a separate code path in scenario 6b: the BOUWBON shows a 🔒 unlock
  button instead of a buy button and **also** routes to `Unlock.jsx`, while the ring/name still
  render normally.
- **AC3 (computed placement rule, W2c).** `layoutDiorama`/`FRONT_LANE_CAP`/`LANE` in `Shop.jsx`
  contain zero per-machine constants: x comes from `(index-within-lane)/(lane-count+1)`, y/size
  come from one of exactly two lane constants (front top 60%, back top 22% — plus the CSS
  `.mch`/`.plot` vs `.ghost` sizes for the "scale 1 vs ≈0.72" description). Since `economy.js`'s
  `BUILDINGS` is fixed at 5 and read-only for this assignment, I could not construct a real
  6-machine save to exercise the roster-growth (overflow) branch through the browser — instead I
  isolation-tested the **literal, byte-identical** `layoutDiorama` source (copied verbatim, not
  reimplemented — confirmed against the shipped file with `sed`) against a synthetic 6-item
  roster in `qa-scripts/085-layout-unit.mjs`: today's real 5/5-built max never triggers overflow
  (`FRONT_LANE_CAP` is 5, exactly today's ceiling), and a hypothetical 6th machine correctly
  caps the front lane at 5, recedes the earliest/cheapest station to an `established` back-left
  slot, and keeps the live edge (the newest built + next plot) in front — 7/7 checks pass. A
  reviewer can add a 6th `BUILDINGS` entry with zero layout-code changes.
- **AC4 (BOUWBON ticket, W2e).** `.ticket` renders exactly `nextGoal`'s fields unchanged — ring
  (`--goal` fraction), name, reward, `goal.togoLine` ("nog N munten — dat haal je in ± N
  opdrachten", an effort estimate, never a countdown), and the same `BuyButton`/handlers as
  before. Verified live: the pinned "BOUWBON" label (en: "BUILD TICKET"), the ring renders, and a
  **real buy** through the ticket's buy button drops the ledger's raw balance by exactly the
  cost and turns that machine into a plinth (scenario 7) — same `buy`/`buyUpg` callbacks, zero
  new economy code.
- **AC5 (cold-read — tester's own read, not self-certified).** My own honest first read: the
  page now shows a lit hall with a receding blueprint floor, physical podiums with shadows and
  glowing status lights, a glowing brass construction site, and flat blue-line drawings fading
  toward a horizon — reads as a place, not a settings list. Screenshot evidence:
  `company/assignments/085-maquette-diorama.png` (mid-game fixture: 2 built plinths, 1 glowing
  foundation plot, 2 letter-gated ghosts, ledger top-right, BOUWBON ticket, werkbank below,
  all in one frame). Deferring the actual verdict to the tester per the AC's own wording.
- **AC6 (ledger stays present, W2d).** Made **zero changes** to `FactoryPage.jsx` — 084's ledger
  already sat top-right of `.planhead`, which **is** "top-right of the plan" per W2d's own text
  (the mock's `.stagehead` ledger position, read literally, matches the existing `.planhead-right`
  position — no relocation was needed to satisfy this AC, so none was made, minimizing collision
  with 084's already-`done` file surface). Verified still renders and reads the same cells
  (scenario 1) and still updates live after a real buy (scenario 7, ledger balance drop).
- **AC7 (guardrails, W8).** Premium ghosts and the ticket's own `goalLocked` branch both route to
  the existing parent-gated `Unlock.jsx` (scenarios 6, 6b) — breadth, not power, unchanged. No
  idle income: the factory page still has no tick loop of its own (untouched from 084/074); the
  animation sweep (scenario 10) found zero coin-count or `coinsPerSecond` element animating.
  `± N opdrachten` stays `goal.effort` verbatim — an estimate, never a countdown (scenario 3's
  plot pnote text asserted no seconde/minuut/tijd wording either, belt-and-braces).
- **AC8 (token discipline, W6).** `git diff 8eaca73 -- src/game/Shop.jsx src/game/game.css |
  grep -nE "^\+.*(#[0-9a-fA-F]{3,8}|rgba?\()"` returns **zero** hits — every new colour is
  `var(--token)` or `color-mix(in srgb, var(--token) N%, transparent)`. The one `#000` in the
  file (`.ticket .ring`'s `mask: radial-gradient(..., #000 100%)`) is the explicitly-allowed
  mask-stencil exception, and it isn't even a line I added — it's the same literal text the old
  `.goalspot-ring` mask already had (git's diff matches it as unchanged context). **Zero new
  `:root` tokens** — grepped the full diff for `--[a-z-]+:` inside a `:root`/`[data-theme]` block:
  none added. Verified a `[data-theme='diepzee']` swap live recolours the plot flag (brass →
  coral) and the ticket border (brass-deep → its diepzee equivalent), both via computed-style
  comparison before/after (scenario 8) — the floor grid, ghosts, and plinths all read `--bg-grid`/
  `--line`/`--mint-deep` etc., so they recolour by the same mechanism (spot-checked in the same
  scenario's detail log).
- **AC9 (save-compat/tests/build).** `git diff --stat 8eaca73` touches only `src/game/Shop.jsx`,
  `src/game/game.css`, `src/game/strings.js`, `test/locale.test.js` (plus this assignment file,
  the new 092 file, and `qa-scripts/`) — `store.js`, `economy.js`, `src/engine/`, `theme.js`,
  `goals.js` are absent (confirmed with an explicit `git diff --stat` against those paths:
  empty). `npm test`: **232/232**, no regression (this tree's real baseline, matching 084's own
  note that "230" in older assignment headers is stale). `vite build` green. `check-no-dutch-en`:
  PASS (5 built en files, 0 unallowlisted Dutch hits) — the two new keys (`factory.ticketLabel`,
  `factory.plotRemaining`) have real en translations, added to `STATIC_FLOW_KEYS` in
  `test/locale.test.js` alongside the other `factory.*` keys. No idle income (see AC7). `git
  checkout -- public/` reverted all build churn before every commit; `git status --porcelain`
  clean of `public/**` at commit time.

**Locale:** `factory.ticketLabel` ("BOUWBON" / "BUILD TICKET") and `factory.plotRemaining`
("nog {n} munten" / "{n} coins to go") added to both nl/en maps in `strings.js` and to
`STATIC_FLOW_KEYS`. Every other string on the diorama/ticket reuses existing keys verbatim
(`factory.currentBadge`, `factory.toBuild`, `premium.inFull`, `play.unlockIn`/`unlockIn1`,
`play.nextMilestone`, `goal.spotKicker`/`togoLine`, `premium.unlockShort`) — no duplication of
near-identical strings.

**`.plan` width.** Bumped `.plan`'s `max-width` from 880px → 1100px (still inside `#root`'s own
1140px ceiling, untouched) so the diorama has room to read as a place rather than a cramped
chip-row's old width. This was explicitly inside my touchable section per the dispatch note
("the roadmap/.plan/.road markup" is mine); `#root` itself was left alone since it's shared by
every other screen in the app.

**Live verification:** `npm install` (worktree had no `node_modules`) → `npm test` (232/232,
build green, check-no-dutch-en PASS) → `git checkout -- public/` → `npx vite build` → `npx vite
preview --port 4244` (my port) → `node qa-scripts/085-verify.mjs` (playwright-core, Chromium
cached at `C:\Users\Jakko\AppData\Local\ms-playwright`) → **42/42 checks passed** → `node
qa-scripts/085-layout-unit.mjs` → **7/7 checks passed** → `node qa-scripts/085-screenshot.mjs` for
the evidence screenshot. Server killed (`taskkill`), `netstat` reconfirmed no `LISTENING` socket
on 4244 before finishing (twice — once after the first pass, again after strengthening the
verify script and re-running).

**Honest gaps / judgment calls flagged for the tester:**
- **Ghost machine icon legibility.** The locked-ghost's machine glyph (idle SVG variant +
  `grayscale(1)`) is barely visible against the diorama's dark floor — the SVG's own baked-in
  `opacity:0.42` fills are very dark already, and this was already true of the pre-085
  `.station.locked` chip on the same dark background (not a regression I introduced), just more
  noticeable now that it sits directly on the darker `.hal` backdrop with a hatched overlay.
  Removing my own extra CSS opacity didn't meaningfully help (the dimming is baked into the SVG,
  not stackable CSS). Filed **assignment 092** (priority 4) rather than improvising a fix inside
  this slice (would mean touching `assets.jsx`, a different file surface, and possibly a design
  call on the intended "blueprint tracing" look). Ghost state is otherwise fully functional and
  legible via name + letter-gate/lock text.
- **AC3's roster-growth branch is code-verified, not save-verified** — see AC3 above; I could
  not construct a real 6-building save since `economy.js` is read-only for this assignment.
- **AC5 (cold-read)** is explicitly the tester's own call per the AC text; I gave my honest
  first impression and a screenshot but did not self-certify this AC.

**092 used** (not lapsed): filed `092-ghost-icon-low-contrast-on-diorama-floor.md`, priority 4,
`opened_by: developer (proposed during 085)`.

### Verification (tester, v085, 2026-07-24)

Independently verified in an isolated worktree (`verify/085`, port 4246 — never the
dev's 4244). `npm install` → `npm test` (232/232 green, matches dev's own re-baselined
count) → `npx vite build` (green) → `git checkout -- public/` → `npx vite preview --port
4246` → drove it with `playwright-core` against the cached Chromium. Wrote my own
assertions in `qa-scripts/085-tester.mjs` (37/37 pass) plus two screenshot scripts
(`085-tester-screenshot.mjs`, `085-tester-screenshot-crop.mjs`); I also re-ran the dev's
own `qa-scripts/085-verify.mjs` as a sanity cross-check (still 42/42) but my verdict
rests on my own script and manual probes, not on trusting theirs.

- **AC1 (diorama stage/floor, W2a) — PASS.** `.hal > .floor + .horizon` structure
  confirmed; `.floor`'s computed transform is a genuine `matrix3d(1, 0, 0, 0, 0,
  0.559193, 0.829038, ...)` (T7) — real perspective+rotateX, not just "non-identity" as
  the dev's own check only asserted. Every `.mch`/`.plot`/`.ghost` node's transform is a
  plain 2D `matrix(1, 0, 0, 1, x, 0)` (the translateX centering trick), confirmed on a
  different fixture than the dev used.
- **AC2 (machine states + exact precedence, W2b) — PASS**, and I found two precedence
  branches the dev's script never exercised: (T1) a machine that is **simultaneously**
  letter-locked AND premium-locked (robotarm, 3 letters learned, family not unlocked) —
  code correctly renders it as `.ghost.premium` with "in de volledige fabriek" text, not
  a letter-count ghost, confirming `premiumLocked` really is checked before `lettersOk`
  in the precedence chain, not just when letters happen to already be sufficient (the
  dev's own scenario 6 only tested the latter). (T2) the `isCurrentLevelup` branch on a
  **built** plinth (all 5 machines built, typewriter at level 9 so the next level is a
  milestone and `nextGoal` returns `kind:'levelup'`) — the plinth's badge correctly reads
  "NU BOUWEN" (`.badge.cur`) instead of the milestone-count badge, and the BOUWBON
  ticket names the same machine. This exact branch was not touched anywhere in the dev's
  42 checks. (T3) clicking a non-premium (letter-gated) ghost does **not** open
  `Unlock.jsx` — only premium ghosts are wired clickable, confirmed.
- **AC3 (computed placement rule, W2c) — PASS.** Read `layoutDiorama`/`FRONT_LANE_CAP`/
  `LANE` directly in the shipped `src/game/Shop.jsx` myself (not just the dev's prose):
  confirmed zero per-machine constants — `x` is `(i+1)/(list.length+1)*100`, `y` comes
  from one of exactly two lane constants. I did not reuse the dev's hand-copied unit
  script; instead `qa-scripts/085-tester.mjs` (T10) regex-extracts `FRONT_LANE_CAP`/
  `LANE`/the function body straight from the shipped file at test time and feeds it a
  synthetic **7**-item roster (one more than the dev's 6-item test): front lane correctly
  caps at 5, the two oldest/cheapest items recede to the back lane flagged
  `established`, and no per-machine literal appears anywhere in the computation. Also
  independently verified the real, reachable 5/5-all-built save (T9: today's actual
  maximum front-lane load) renders as exactly 5 plinths, 0 established, no overflow —
  confirming the cap is never spuriously tripped by real data either. On the AC's own
  wording ("a reviewer can confirm a 6th machine would slot in by rule") — I did that
  confirmation myself, independently, and it holds. The gap the dev flagged (no real
  6-building save possible since `economy.js` is read-only) is real but does not weaken
  this: the rule lives entirely in presentation code with no hidden economy dependency,
  so code-level proof is sufficient evidence for what the AC asks.
- **AC4 (BOUWBON ticket, W2e) — PASS.** `nextGoal` fields render read-only; `goal.effort`
  line never contains countdown/timer wording (spot-checked). A **real buy** via the
  ticket's buy button dropped the ledger's raw balance by exactly the cost (independent
  fixture, `cost=15`→`before=500`/`after=485` in my own run of the dev's script, and I
  separately confirmed the buy handler is untouched via the `economy.js`/`goals.js` diff
  below). Additionally verified two edge cases the dev did not: (T5) with `coins:1` the
  buy button is `disabled`, and force-clicking it through Playwright does not mutate the
  ledger balance; (T4) over a real 3-second wait on the factory page with
  `coinsPerSecond > 0` and zero typing, the ledger balance does not move at all — a
  **behavioural** no-idle-income check, not just an animation-absence check.
- **AC5 (cold-read) — PASS, my own independent judgment.** Screenshot evidence:
  `company/assignments/085-screenshots-verify/085-tester-cold-read.png` (full page) and
  `085-tester-hal-crop.png` (tight crop of just `.hal`), a different mid-game fixture
  from the dev's own screenshot (2 built machines at different levels, 1 rebirth star, 1
  flagged plot, 1 plain plot, 1 letter-gated ghost). My honest read: this is clearly no
  longer a settings/dashboard list — physical plinths with rounded panel gradients,
  mint status lights, a flagged glowing brass foundation plot, and small greyed ghost
  drawings sitting further back and higher up all read as distinct **build states**, and
  the near/far size difference genuinely communicates depth and growth ("built stuff is
  big and close, not-yet stuff is small and far"). It passes the bar the AC actually sets
  ("not a dashboard"). **However**, I do not think the specific "tilted blueprint floor
  you look across" metaphor reads clearly: the `--bg-grid` pattern that is supposed to
  be the visible floor terrain is, in practice, nearly imperceptible against `--night` in
  my screenshots (contrast delta of roughly 6-11 out of 255 per channel — see 089 below)
  — a viewer reads "icons at two distances on a dark background with a line," not "a
  floor I'm looking across." That's a real, named gap against W2a's own ambition, but it
  does not drag this below "reads as a place, not a dashboard" — the depth/physicality
  signals that do work (scale, position, plinth styling, status lights, atmosphere
  gradient) are enough on their own. Filed as a **separate, non-blocking** defect (089)
  rather than bouncing this AC, since the AC's bar ("not a dashboard") is met even though
  the specific floor-grid execution underdelivers on the mock's ambition.
- **AC6 (ledger, W2d) — PASS.** `.ledger` renders top-right, unchanged from 084;
  confirmed live in every one of my fixtures and updates correctly after a real buy.
- **AC7 (guardrails, W8) — PASS.** Premium ghosts and the ticket's own `goalLocked`
  branch route to `Unlock.jsx` (re-confirmed). No idle income confirmed two ways: (a)
  animation sweep — T6 swept the **entire page body** (not just `.hal`/`.ticket` like the
  dev's scenario 10) for any element with an `infinite` animation at rest: zero found;
  (b) the behavioural wait-test (T4) above, which the dev's script did not do at all.
  `± N opdrachten` verified as `goal.effort` text, never a countdown, on multiple
  fixtures.
- **AC8 (token discipline, W6) — PASS.** Independently re-ran the grep the dev
  describes (`git diff 638a8f0 -- src/game/Shop.jsx src/game/game.css | grep -nE
  "^\+.*(#[0-9a-fA-F]{3,8}|rgba?\()"`) myself: zero hits. Also grepped independently for
  any new `--token:` declaration inside the diff: zero. Extended the dev's single-theme
  (diepzee) swap check to **three** themes (nachtploeg, snoepfabriek, diepzee) and more
  surfaces than the dev checked (`.floor` grid, `.horizon` line, ghost border, plinth
  border, werkbank tile border) — all recolour correctly under every theme tested (T8,
  12 checks).
- **AC9 (save-compat/tests/build) — PASS.** Independently ran `git diff --stat 638a8f0 --
  src/store.js src/game/store.js src/game/economy.js src/engine src/game/theme.js
  src/game/goals.js` myself: empty output, confirming all five save-compat surfaces are
  byte-for-byte untouched (not just trusting the dev's own note). `npm test`: 232/232 in
  my own fresh `npm install`. `vite build`: green. `check-no-dutch-en`: PASS (part of the
  `npm test` pipeline output I ran myself). en locale: independently spot-checked outside
  either verify script (`qa-scripts/_tmp-en-check.mjs`, not committed, scratch only) —
  confirmed `"ticket kicker": "BUILD TICKET"` and `"plot note": "60 coins to go"` render
  live from a fresh en fixture. `public/**` churn reverted with `git checkout -- public/`
  before every commit; `git status --porcelain` clean of `public/**` at commit time.

**New defect filed: 089** (`089-diorama-floor-grid-imperceptible.md`, priority 3,
`opened_by: tester (proposed)`) — the `.floor`'s `--bg-grid` terrain pattern is visually
almost invisible against `--night` in a real render (confirmed by screenshot, not just
computed CSS), undermining the "tilted floor you look across" read that W2a names as
the point of this pass, even though the transform itself and AC1's narrow "only
transformed element" guarantee both hold correctly. Not blocking 085 — see the AC5 note
above for why.

**Verdict: all acceptance criteria pass. Status set to `done`.**
