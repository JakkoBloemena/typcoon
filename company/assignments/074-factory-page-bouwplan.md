---
id: 074
title: Factory page "Het Bouwplan" — roadmap, spotlit goal, objectives row
owner: developer
status: needs_verification
priority: 2
blocked_by: [071, 072]
opened_by: product-owner
---

## Goal

Turn the relocated shop (from 072) into the exciting factory page the Shareholder asked
for: "Het Bouwplan", a blueprint roadmap you fill in, where "my factory is growing" is
legible and the next goal is unmistakable. Authority: decisions/011, design
`design/DESIGN-FACTORY.md` §5b/§6, mocks `design/factory-mocks/dir-C-blueprint.html` +
`dir-C-states.html`, scope `research/milestone-factory.md` §1b/§3.

Build (design §5b), on the blueprint-grid panel, all from existing `:root` tokens so
themes cascade:
1. **Header** — `JOUW FABRIEK / Het Bouwplan` + `[N van 5 machines gebouwd]` mint tag +
   `← Typen` back.
2. **Roadmap** — one station per `BUILDINGS` entry, left→right by unlock order, connected:
   **built** (inked, mint connector, `Lv N · +N/s`), **current** (brass ring, `NU BOUWEN`),
   **locked** (dashed ghost, `nog N letters` or `🔒 volledige fabriek`), milestone badge
   (`Lv10 →×2`).
3. **Spotlit goal panel** — the `nextGoal` (071) enlarged: progress ring (fraction), name,
   reward (`+N/s`/`×N`), `nog N munten — dat haal je in ± N opdrachten`, buy button in
   `--reward`.
4. **Objectives row** — upgrades + `🌟 Fabriek verkopen` (prestige) tiles; prestige shows
   its own progress and stays sky-blue; lifetime + ⭐ stars as context.

## Acceptance criteria

- [x] The roadmap renders all machines with the correct per-machine state (built / current
      "NU BOUWEN" / locked-ghost) computed from the current `tycoon` + `lettersLearned`, and
      a `N van 5 gebouwd` progress tag that matches how many are built.
- [x] The spotlit goal panel matches `nextGoal` (071): correct name, reward, fraction ring,
      "nog N munten", and "± N opdrachten" effort estimate — no timer/countdown.
- [x] Buying the spotlit/current goal and buying upgrades/prestige work via the existing
      handlers (from 072); after a purchase the roadmap, tag, and spotlight update to the
      new state.
- [x] Locked/premium stations route to the existing parent-gated `Unlock.jsx` (breadth, not
      power); no purchase a child can complete alone.
- [x] Prestige (`🌟`) is the only place `--sky` appears (DESIGN.md rule); no other surface
      recolours to sky-blue.
- [x] Save-compat: `store.js` shape, `economy.js` data, engine state, `theme.js` unchanged;
      a pre-existing save's built machines/levels/coins/stars all appear correctly on the
      roadmap. 071 invariant test stays green.
- [x] `npm test` green (add/keep the goal-selection test from 071 passing against the UI's
      inputs if the descriptor shape is touched).

## Notes

Mobile reflow and the empty/overflow/offline/loading state screens are 075, not here —
but build the desktop states correctly so 075 only adds the responsive layer. Shares
`App.jsx`/`game.css` with 073 — coordinate worktrees. Terminal state needs_verification.

### Delivery notes (developer, 2026-07-24, worktree `C:\companies\typcoon-lanes\d074`, branch `dev/074`)

**What was built.** `FactoryPage.jsx` now renders the blueprint-grid `.plan` panel: a
`planhead` (kicker `JOUW FABRIEK` + `Het Bouwplan` title + `[N van 5 machines
gebouwd]` mint tag, computed from `BUILDINGS`/`tycoon.buildings` directly — no new
state, can't drift from the roadmap). `Shop.jsx` — per 072's delivery note "Shop.jsx's
buy/buyUpg/doRebirth are the handlers 074 should keep reusing (do not re-lift them a
second time)" — keeps its handlers (`buy`, `buyUpg`, `doRebirth`, `BuyButton`,
`rebirthAsk` overlay, `moment` celebration overlay) **byte-identical**, and only its
*returned JSX* was rewritten: the old `<aside className="shop">` list is replaced with
`.road` (roadmap), `.goalspot` (spotlit `nextGoal` panel) and `.objrow` (upgrades +
prestige tiles + lifetime/star context line). `nextGoal` (071) is imported and read
directly — both the goal sliver (073, `GameScreen.jsx`) and the spotlight (074,
`Shop.jsx`) now compute the identical descriptor from the same `tycoon`/`lettersLearned`
each render, so they can't fall out of sync (no shared/cached "current goal" state).

**Roadmap station-state logic (the note-4 integration point).** Per-machine state is
computed in this precedence: (1) `level > 0` → **built** (or **current**, brass ring +
`NU BOUWEN`, if it's the levelup goal); else (2) `machineLocked(b.id, unlocked)` →
**locked-premium** ghost (`🔒 <name>` / `In de volledige fabriek`, click routes to
`onUnlockOffer('plain')` → `Unlock.jsx`); else (3) `!buildingUnlocked(id,
lettersLearned)` → **locked-letters** ghost (`nog N letters`); else (4) the build goal
→ **current** (brass ring, `NU BOUWEN`), or a rare 4th case — unlocked+unbuilt but not
the chosen goal — styled as a plain "te bouwen" node (no badge). That 4th case is
**not** the "vanishingly rare, manual-save-only" edge I assumed while writing it —
verification with a fast-letter-learner fixture (`curriculumIndex=12` → `lettersLearned`
already covering both robotarm's and assembly's `unlockAt`) hit it immediately: a kid
who learns letters faster than they save coins can have *two* buildable-but-unbuilt
machines at once, and only the cheaper one is `nextGoal`'s spotlight. Kept the
"te bouwen, no badge" rendering for it (real state, not a bug) rather than trying to
force a purely 3-state model the real economy doesn't produce.

**Critical integration note from 071 (applied).** `goal.locked` (from `nextGoal`) only
knows `FREE_MACHINES`, not the real family purchase (`isUnlocked()`/`unlocked` prop).
Both the roadmap (via `machineLocked(b.id, unlocked)`, same helper `Shop.jsx` already
used pre-074) and the spotlight (`goalLocked = goal.kind === 'build' &&
machineLocked(goal.id, unlocked)`) combine the descriptor's `locked` intent with the
live `unlocked` flag before deciding whether to route to `Unlock.jsx` or show a normal
buy button — a paying family sees robotarm/assembly/megafab as normally buildable, not
paywalled, even though `nextGoal` itself can't see their purchase.

**`--goal` token added.** `design/DESIGN-FACTORY.md` §4/§8 specifies a second semantic
alias, `--goal: var(--mint)`, for "progress toward a goal" (the spotlight ring),
distinct from `--reward: var(--brass)` (073's sliver bar, "coins earned"). 073 didn't
need it; 074 does (the ring fill) — added to `:root` only, one line, a `var()` of an
existing themed token, so it cascades for free like `--reward` already does. No new
hardcoded colour anywhere in the new CSS — grepped `game.css`'s new `.plan`/`.road`/
`.goalspot`/`.objrow` block for hex literals: zero.

**`--sky` bug caught in my own review.** The winning mock's own CSS
(`dir-C-blueprint.html`) colours the `.planhead .kick` label sky-blue; I copied that
verbatim at first, then caught it against this assignment's own AC ("Prestige is the
only place `--sky` appears") before committing — the mock predates that AC's explicit
statement and isn't itself gospel. Fixed to `--ink-dim` (matches this codebase's other
kicker/eyebrow labels, e.g. `.cert-kicker`). Verified via a computed-style scan (see
Verification below): after the fix, `--sky`/`--sky-deep` only appear on
`.rebirth-btn`/`.obj-star`/`.obj-pct`/`.goalspot-locked-pct` — all prestige-only.

**No new `--sN` spacing tokens.** Design's front matter lists a 4px `--s1..--s6` scale,
but neither 072 nor 073 adopted it — both kept the file's existing ad-hoc-px rhythm.
074 follows that established precedent (matching neighbouring code over the aspirational
doc) rather than introducing a scale no sibling assignment uses.

**Dead-code cleanup, checked for shared use first.** Removed `.factory-body`, the
`.shop` aside wrapper + `.shop h2`, `.shop-thumb`, `.ms-teaser`, `.rebirth-box`/
`.rebirth-progress`/`.rebirth-bar`/`@keyframes shimmer` from `game.css` — all dead once
`Shop.jsx`'s list markup was replaced. **Before removing**, grepped every `.shop-*`/
`.rebirth-*`/`.premium-*`/`.owned-tag` class across `src/`: `ThemePicker.jsx` reuses
`.shop-list`/`.shop-item`/`.shop-info`/`.shop-name`/`.shop-meta`/`.owned-tag`/
`.premium-cta`/`.shop-item.premium-lock` for its own theme list, and `Shop.jsx`'s new
markup reuses `.rebirth-btn`/`.btn.buy` — all of those were **kept**, only the
exclusively-Shop.jsx-owned rules were deleted.

**New strings** (`strings.js`, both nl/en, added to `test/locale.test.js`'s
`STATIC_FLOW_KEYS`): `factory.planTitle`, `factory.builtTag`, `factory.currentBadge`,
`factory.toBuild`, `factory.prestigeMeta`, `factory.prestigeReady`,
`factory.contextLine`, `goal.spotKicker`, `goal.togoLine`. Reused existing strings
verbatim everywhere else (`premium.inFull`/`premium.unlockShort`/`play.unlockIn(1)`/
`play.nextMilestone`/`play.buyLabel`/`rebirth.*`/`upgrade.*`/`building.*`) rather than
inventing near-duplicates.

**Bugs found and fixed during my own visual verification (not just element-count
checks):** (1) the spotlight ring's icon was invisible — a CSS `mask` on the ring
element clips its *entire subtree*, so the icon (a child) was masked out with the
donut's hollow centre; fixed by making the icon an absolutely-positioned **sibling**
inside a `position:relative` wrapper, matching how the winning mock's own `_base.css`
(`.ring-wrap .rc`) actually does it — I'd missed that structural detail copying the
mock's inline HTML. (2) `.objrow`'s `minmax(200px,1fr)` (copied from the mock, which
only ever showed 3 tiles) was too narrow for 5 real tiles (4 upgrades + prestige):
`Precisiegereedschap`'s one long word ran texted under the buy button uncut (no
`overflow-wrap`) — raised the minmax floor to 260px *and* added `overflow-wrap:
anywhere` to `.obj-name`. (3) `.goalspot`'s `1fr` middle grid column doesn't imply
`minmax(0,1fr)`, so at narrow widths the buy button visually broke out of the card's
own rounded border (page itself never overflowed, confirmed separately, but the card
looked broken) — fixed with `minmax(0, 1fr)` + `overflow:hidden` on `.goalspot`. (4) a
375px-viewport page-level horizontal-overflow regression (not present before my
change) traced to `.planhead`'s `justify-content:space-between` with no wrap — the
title block + `progresstag` together didn't fit one line at 375px and forced page
width; fixed with `flex-wrap: wrap` on `.planhead` (same overflow-bug class 055 already
fixed on `.game-bar`; confirmed `scrollWidth === clientWidth` after the fix). None of
these four were caught by the AC-level element-count checks alone — only actually
rendering the page and looking at it found them.

**070 (factory page missing coin/star readout) — my build satisfies its intent, but I
did not touch 070's file per instructions.** The objectives row's `plan-context` line
shows `{lifetimeCoins} ooit verdiend · ⭐ {rebirths}` and the spotlit goal panel shows
the live coin cost/remaining (`goal.cost`/`goal.remaining`) plus a coin-icon buy button
— a kid can now see lifetime coins and star count on the factory page, which 070
reported as entirely absent. Evidence: verification run against a fixture with
`lifetimeCoins: 18400, rebirths: 1` shows `.plan-context` rendering exactly `"18.400
ooit verdiend · ⭐ 1"`. This is presented as evidence for the dispatcher/tester to
resolve 070, not a self-resolution — 070's file was not edited.

**Out-of-scope discovery filed separately, not fixed here:** `nextGoal`'s `effort`
field (`src/game/goals.js`, 071) is hardcoded Dutch (`` `± ${n} opdrachten` ``)
regardless of active locale — invisible until now because no prior surface rendered
`effort` (073's sliver only shows `remaining`). 074's `goal.togoLine` is the first to
render it, so an `en` session would show a literal Dutch word. Not fixed inline (it's
071's file, and a proper fix needs a new `gt()` key + updating 071's own locale-blind
regex test) — filed as **`company/assignments/078-goal-effort-string-hardcoded-dutch.md`**,
priority 4, `opened_by: developer (proposed)`.

**Verification (real, not just described).** `npm install` (worktree had no
`node_modules`), then `npm test`: **229/229 unit tests pass** (unchanged count from
071/072 merged tip — 074 added no new test files, per its presentation-only scope),
`vite build` succeeds (101 modules), `check-no-dutch-en` PASS (0 unallowlisted hits,
5 built en files). Served the built app with `vite preview --port 4229` (only port
used) and drove it with Playwright (`playwright-core`, `npm install --no-save`, not
committed) via `qa-scripts/074-verify.mjs` (matches the repo's `qa-scripts/*-verify.mjs`
convention, committed as the lasting script). Built a "pre-074"-shaped save with the
real engine functions (`newProfile`/`newState`, same shape `store.js` writes):
`buildings:{typewriter:12,printer:8}, upgrades:['oil'], rebirths:1,
lifetimeCoins:18400, coins:500`, `curriculumIndex:12` (lettersLearned high enough to
unlock robotarm+assembly, not megafab). Confirmed, against this fixture:
- Roadmap: 5 stations in order; typewriter/printer show `Lv N`/`+N/s` with correct
  milestone-teaser badges (`Lv 25 → tempo ×2`, `Lv 10 → tempo ×2`); robotarm is the
  single `.station.cur` with `NU BOUWEN`; assembly renders open/"te bouwen" (the real
  4th state above); megafab is the one `.station.locked` (`Nog 3 letters leren...`).
  `[2 van 5 machines gebouwd]` tag matches.
- Spotlight matches `nextGoal` exactly: name `Robotarm`, reward `+28/s`, ring `--p:83`
  (500/600), `nog 100 munten — dat haal je in ± 6 opdrachten`.
- Objectives row: 5 tiles (4 upgrades + prestige `⭐`); `oil` shows owned (✓); prestige
  tile shows `+25% ⭐ · nog 99.500` (not ready).
- Bought the spotlit goal (bumped coins via `localStorage` + reload, real click on the
  real `BuyButton`): built-station count 2→3, tag `2 van 5`→`3 van 5`, spotlight moved
  off Robotarm (to `Lopende band`) — roadmap/tag/spotlight all updated together from one
  purchase, as required.
- Bought an upgrade from the objectives row (`Precisiegereedschap`): owned-tag count
  1→2 via the real `buyUpg` handler.
- Triggered prestige from the objectives row's star tile (real `rebirth-btn` →
  the confirm dialog (real `doRebirth`): star count in `plan-context` 1→2, `builtTag`
  reset to `0 van 5` (rebirth resets `tycoon.buildings`, confirming the roadmap reads
  live state, not stale).
- Confirmed a locked/premium station routes to the parent gate: reloaded
  after removing `typcoon:unlocked`; still-unbought Mega-fabriek (robotarm was already
  bought earlier in the same run, so it no longer qualifies — used megafab instead,
  which is both premium and letter-gated, to confirm the premium check runs *before*
  the letter check): shows `🔒 Mega-fabriek` / `In de volledige fabriek`, clicking it
  opens `.unlock-card` (`Unlock.jsx`) — never a bare purchase.
- `--sky` computed-style scan across every element inside `.plan`: zero hits outside
  the prestige tile/button (confirmed via `getComputedStyle` equality check against
  `--sky`'s resolved value, not just a source grep).
- 375px viewport: `document.documentElement.scrollWidth === clientWidth` (no overflow)
  after the `.planhead`/`.goalspot`/`.objrow` fixes above.
- Console/page errors: only the same `/api/track` 404 noise 072's tester already
  documented as pre-existing under plain `vite preview` (no serverless function
  present) — reproduces on an unmodified checkout, unrelated to this assignment; zero
  errors from the app's own code.
- Killed the `vite preview` server before finishing (confirmed no `LISTENING` socket
  on 4229 afterward).

**Guardrails.** `git diff --stat -- src/game/store.js src/game/economy.js
src/game/theme.js src/engine/` is empty — byte-identical. Changed files: `App.jsx`
untouched (072 already wired the `factory` route/nav; 074 needed no App.jsx change),
`src/game/FactoryPage.jsx`, `src/game/Shop.jsx`, `src/game/game.css`,
`src/game/strings.js`, `test/locale.test.js`, plus this assignment file, the new
`company/assignments/078-goal-effort-string-hardcoded-dutch.md`, and
`qa-scripts/074-verify.mjs`. `gen-content`'s `public/**`/`sitemap.xml` churn from
running `npm test` was reverted with `git checkout -- public/` before committing (byte-
identical diff, confirmed each time).
