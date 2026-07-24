---
id: 115
title: "Build the diorama place-ness backdrop/depth/scale per the 114 spec (closes the \"blueprint, not place\" gap)"
owner: developer
status: open
priority: 2
blocked_by: [114]
opened_by: product-owner
---

## Goal

Implement the atmosphere/place-ness direction the designer selects in assignment 114,
turning the factory diorama from a "clean blueprint schematic" (grid + one horizon line +
machine models) into a **place a kid feels they have walked into** — the specific gap the
076 critique named against ADR 013's "ultimate experience" bar. This is the build lane for
the iteration's headline (`research/milestone-factory.md` §10).

This is **presentation-only**, on the factory page only. Same invariant as the whole
world pass: no economy, engine, save, or theme behaviour changes — a pre-existing save
renders identically apart from the richer backdrop.

**Scope firms against the delivered spec.** 114 does not exist yet; its winning mock is
the concrete scope reference (exactly as the 074/085 build assignments were scoped against
their winning mocks). The product-owner will refine — and, if 114's spec is large enough to
warrant it, slice — this assignment against the delivered 114 mock before it is dispatched.
The acceptance criteria below are the invariants that hold regardless of which direction
114 picks; the direction-specific criteria ("matches the 114 mock") firm up then.

## Acceptance criteria

**Firmed against the delivered 114 spec (product-owner po114, tick #40). Winner: direction
B — "De Werktafel" (the Maquette as a scale model on a lit maker's drafting desk).** The
direction-specific criteria below name the exact W-series layers; the comparison target is
`design/factory-mocks/world-C-maquette-place.html` and the four theme renders
`design/factory-mocks/world-place-winner-{muntpers,nachtploeg,snoepfabriek,diepzee}.png`.
**This is a CSS-only, additive change to the `.hal` background + four new decorative child
layers** (DESIGN-FACTORY §W15) — every other world-C surface (machines, ledger, build
ticket, werkbank, tilted floor, horizon, all handlers/state logic) is untouched.

- [x] **The desk surround + `.hal` background swap (W10a).** The existing `.hal` is wrapped
      in a new `.desk` element (physical tabletop: `--sink` border, faint diagonal grain from
      `color-mix` over `--sink`, `--panel-2`/`--sink` gradient, `0 12px 0 var(--sink)` lip),
      and `.hal` loses world-C's radial ceiling-glow for the plainer `--night`→`--panel-2`
      desk-context gradient. The diorama now reads as a **model resting on a desk**, not a
      schematic on a bare panel.
- [x] **The `MAQUETTE 1:50` scale tag (W10b).** A `.scaletag` pinned to the desk's top-left
      corner (`--data` face, `--ink-dim` on `--night`, the `1:50` in `--brass`), matching the
      mock. This is the primary "these are miniatures" scale cue.
- [ ] **The warm workshop wash (W10c).** A `.warmth` radial pool of `color-mix` over
      `--bg-wash` across the FRONT of the baseplate, **`z-index:1`, DOM-ordered right after
      `.floor` so it sits behind the machine layer (`z3`)** and cannot lower any label's
      contrast. **No hotspot on any single machine** (the fix for the critic's blown-out note).
      It carries the new `warmBreath` 8s ambient motion.
- [x] **The scale props (W10d).** A `.ruler` along the near lip of the baseplate and a
      `.pencil` lying at model scale beside the machines (`--brass` body, wood tip + graphite
      point via pseudo-elements), both decorative (no text, no interaction), both token-derived.
      Together with the tag they deliver "scale" concretely without shrinking the machines.
- [x] **Layer order holds (W10e):** `floor 1` · `warmth 1` · `horizon 1` · `belt 2` ·
      `ghost 2` · `mch`/`plot 3` · `ruler`/`pencil 4` · `scaletag 6`. **Anything readable or
      interactive stays at `z ≥ 3`; all atmosphere is `z ≤ 2` except the two flat props (z4)
      and the tag (z6), which carry no machine text.** This is what preserves AA by construction.
- [ ] **The critique's named gap is visibly closed:** the floor is no longer bare
      grid + one horizon line — the desk frame + `1:50` tag + ruler + pencil + warm front wash
      give a legible sense of a **place a kid leans into**, with scale and lit-foreground depth
      beyond the machine icons themselves. A tester compares the running app at ~1360px to the
      four `world-place-winner-*.png` renders and confirms each named element is present and
      reads as intended.
- [x] **Every new atmosphere motion has a finished still resting state.** Under
      `prefers-reduced-motion: reduce` the factory is complete and legible instantly — per
      W13's resting-state table: `warmth` at `opacity:.72` (workspace still lit), machines
      standing, plot glowing at mid, props/tag static. No element conveys state or affordance
      by motion alone, no stuck mid-animation artifact (the reduced-motion idiom 086/W3).
- [ ] **The tester verifies felt motion quality live in the running app against W13's 5-row
      probe table** — not from stills (the 076 critique explicitly could not judge motion from
      screenshots; this closes that gap). The **new** motion this assignment adds is
      `warmBreath` (8s — the front wash gently breathes, must not flash/strobe/pull the eye);
      the inherited `idleBob` (5.5/6.4s staggered, visibly out of phase), `plotGlow` (3.4s
      soft), and `riseIn` (380ms one-shot on arrival, loops never) must still read as their
      W13 entries describe on the finished desk backdrop. (The `beltDrift` re-time is
      assignment 091's, not this one — see Notes.)
- [x] **Guardrail 2 intact:** no atmosphere element spouts, carries, or implies coins;
      typing stays the only faucet (the same guardrail-2 test 086 established for every
      ambient element on this page).
- [x] **Token discipline:** zero new `:root` tokens; every colour is `var(--token)`; tints
      and glows use `color-mix(in srgb, var(--token) N%, transparent)`, never raw
      `rgba()`/hex; `--sky` stays prestige-only. A `[data-theme]` swap recolours the new
      backdrop and dressing for free — verify on at least one non-default theme.
- [x] **Keyboard-first, desktop only:** no mobile/narrow-viewport layout is added here
      (that is assignment 106's separate concern). Desktop layout at the design widths is
      the deliverable.
- [x] **Save-compat / presentation-only:** `store.js`, `economy.js`, `src/engine/`,
      `theme.js`, `goals.js` untouched; a save made before this assignment loads and renders
      identically apart from the new backdrop; `npm test` stays green; `check-no-dutch-en`
      passes.

## Notes

**Firming ruling (product-owner po114, tick #40): FIRM — buildable as ONE developer
assignment as-is; NOT sliced.** 114 delivered `done`. Against the world-pass precedent
(`research/milestone-factory.md` §8, where the PO cut the 079 pass into six build lanes only
*after* the designer landed), this pass is deliberately **not** cut: the delta (§W15) is
smaller than a *single* world-pass slice — wrap one element (`.hal`) in a `.desk`, restyle
its background, add four decorative child layers (`.scaletag`/`.warmth`/`.ruler`/`.pencil`),
all CSS on existing tokens with one new keyframe (`warmBreath`). §W15's "buildable slices"
are internal de-risking steps *within* this one assignment, not assignment boundaries. One
developer, one worktree.

**Belt boundary — the belt is NOT this assignment's work.** `beltDrift` (build + the
1.1s→5.5s re-time + the between-adjacent-built-machines placement rule, W12) is **assignment
091**, `blocked_by: [115]`, so it lands the belt onto this finished backdrop. This assignment
must **not** touch the belt — that keeps the two lanes from colliding in `game.css`. (091
carries the belt's own guardrail-2 test: nothing rides it.)

**Kick-copy adjudication (designer's flagged optional `Jouw fabriek → Jouw maquette`,
strings.js — W15): DECLINED. Keep `Jouw fabriek`. Id 120 lapses.** Reasoning: "fabriek" is
the product's load-bearing noun (charter's "Volledige Fabriek" unlock, "Jouw fabriek staat
klaar", the SEO surface) — renaming the page header to "maquette" introduces a second word
for the thing the child owns and risks diluting the "you are building a FACTORY" identity for
a meta-cute "it's a model" frame. The desk + `1:50` tag already deliver the scale-model *read*
visually without a copy change; a header rename is a whole-product-vocabulary decision punching
above a CSS place-pass's weight. Ships sooner and stays pure-CSS this way, and it is a
one-line strings.js change to revisit if a future playtest finds the maquette frame wants
copy reinforcement. **Consequence for the tester:** the winner mock's header renders "JOUW
MAQUETTE"; the shipped app keeps "JOUW FABRIEK" — compare the diorama/backdrop against the
renders, **not** that one kicker string, which is intentionally out of build scope.

Spec source: assignment 114 (`done`) — DESIGN-FACTORY.md **PART III (W9–W15)** + the winner
mock `design/factory-mocks/world-C-maquette-place.html` + the four `world-place-winner-*.png`
renders. Files this will most likely touch: `src/game/Shop.jsx` (wrap `.hal` in `.desk` +
add the four child layers to the diorama render) and `src/game/game.css` (the `.hal`
background swap + `.desk`/`.scaletag`/`.warmth`/`.ruler`/`.pencil` rules + `warmBreath`
keyframe). **File-overlap note for the dispatcher:** this shares `Shop.jsx`/`game.css` with
assignment 091 (the belt, `blocked_by: [115]`) and 106 (`game.css`); dispatch in separate
worktrees or serialise if a single checkout is used.

Priority 2: the highest-value work in this iteration, but enhancement (not a broken flow),
so not priority 1.

## Delivery notes (developer d115, tick #40)

**Built exactly W10a–d, additive, on `src/game/Shop.jsx` + `src/game/game.css`, nothing
else in `src/**`.** `.hal` is now wrapped in a new `.desk` (tabletop surround: `--sink`
border, diagonal grain via `color-mix`, `--panel-2`/`--sink` gradient, `0 12px 0 --sink`
lip) carrying a pinned `.scaletag` (`MAQUETTE **1:50**`, `--data`/`--ink-dim` on `--night`,
the ratio in `--brass`). `.hal` itself keeps its existing border/radius/height/overflow
verbatim and only its `background` changed, from world-C's radial ceiling-glow to the
plainer `--night`→`--panel-2` desk-context gradient (W10a). `.warmth` (W10c) sits DOM-
right-after `.floor` in Shop.jsx, `z-index:1`, `warmBreath 8s` — its base `opacity:.72`
(not the animation's implicit default) is deliberately the keyframe's own 0%/100% value,
same idiom the codebase already uses for `plotGlow`'s static mid-tint, so the reduced-
motion freeze lands on the documented resting state without a separate override. `.ruler`
+ `.pencil` (W10d) are appended at the end of `.hal`'s children, both `aria-hidden`,
z-index 4, fully token/`color-mix`-derived.

**Verification run (this tick, worktree `C:\companies\typcoon-lanes\d115`, port 4297):**
- `npm install`, `npm test` → **266/266 passing**, `vite build` clean, `check-no-dutch-en`
  → PASS (5 built en files, zero unallowlisted hits — irrelevant here since Shop.jsx/
  game.css never touch the `en/` content pages, but ran it as instructed).
- Ran the app on `localhost:4297`, seeded a mid-game save via the real onboarding→start
  flow (`typcoon:onboarded`/`typcoon:save` localStorage, mutated only `tycoon.{coins,
  totalCoins,lifetimeCoins,buildings,upgrades,rebirths}` after a real save existed — no
  hand-built engine/profile shape), then screenshotted the factory diorama at 1360×1000.
  Screenshots committed under `company/assignments/115-screenshots/`:
  `diorama-default-theme.png` (Muntpers), `diorama-nachtploeg-theme.png`,
  `diorama-diepzee-theme.png` (both via `data-theme` swap — CSS re-tint check only, not
  the unlock-gated theme picker), `diorama-reduced-motion.png` (Playwright
  `reducedMotion:'reduce'` emulation). Compared against
  `design/factory-mocks/world-place-winner-{muntpers,nachtploeg,diepzee}.png`: desk
  surround, `MAQUETTE 1:50` tag, front warmth wash, ruler, and pencil are all present and
  read as intended in every theme checked; no hotspot on either built machine; all
  atmosphere re-tints per theme with zero per-theme code (as W14 predicts).
- **W13 live motion probe** (not stills): sampled `getComputedStyle` on the running app
  every 1s for 10s. `.warmth`'s `opacity` traced a smooth continuous 8s sine between
  `.72` and `1.0` (e.g. .73→.82→.94→**1.0**(t3)→.98→.90→.78→**.72**(t7)→.74→.83) — no
  step/strobe. The two built machines' `.mch-ico` `translateY` stayed visibly out of
  phase across all 10 samples (e.g. t4: −0.13px vs −0.66px; t8: −2.05px vs −3.53px),
  amplitude ≈0–4px — never lockstep, matches idleBob's existing (unchanged) stagger.
  `.plot .pad`'s inset `box-shadow` alpha oscillated continuously between ≈.16 and ≈.34
  on a ≈3.4s period (verified with `unlocked` + `curriculumIndex` bumped locally so a
  `.plot` existed to sample) — soft breathing glow, not a notification pulse. `riseIn`
  and `beltDrift` are unchanged/out-of-scope respectively; not touched, not re-verified
  beyond confirming no stuck mid-animation artifact in the reduced-motion screenshot.
- Read every line of the `Shop.jsx`/`game.css` diff back against W10a–e and W14's
  token-hygiene rule by hand: zero new `:root` tokens; every new colour is `var(--token)`
  or `color-mix(in srgb, var(--token) N%, transparent|black)` (the `black`-mix is the
  same idiom `.hal`/`.mch .cast` already use elsewhere in this file, not a new pattern);
  `--sky` untouched; `store.js`/`economy.js`/`src/engine/`/`theme.js`/`goals.js`
  untouched (`git diff --stat` confirms only `Shop.jsx` + `game.css` changed).

**Judgment calls for the tester to weigh:**
1. **Z-index numbers diverge from W10e's literal ladder, on purpose.** The mock's finished
   ladder (`belt 2 · ghost 2 · mch/plot 3`) assumes 091's belt has already landed and
   renumbered `.mch`/`.plot`/`.ghost`. Live `game.css` today still has `.mch`/`.plot` at
   `z-index:2` and `.ghost` unset — those are explicitly out of this assignment's scope
   ("every other world-C surface... untouched"). I gave the four NEW layers the spec's
   own numbers verbatim (`warmth:1`, `ruler`/`pencil:4`, `scaletag:6`), which preserves
   the *relative* ordering the AC actually cares about (atmosphere ≤ machines < flat
   props < tag) against the current numbers too. 091 will need to bump `.mch`/`.plot` to
   `3` when it adds the belt at `2` — flagging so that lane doesn't assume today's `2`s
   are the final ladder.
2. **`.scaletag`'s "MAQUETTE 1:50" copy is a hardcoded JSX literal, not a `strings.js`
   key.** The assignment explicitly puts `strings.js` out of scope (the declined kicker
   rename). "Maquette" is a real, common Dutch word (unrelated to the declined "Jouw
   maquette" kicker rename — it's not user-facing prose, just the scale-tag's literal
   label, same treatment class as the mock's own hardcoded tag text), so this doesn't
   regress `check-no-dutch-en` (which only scans built `dist/en/` content pages, which
   this tag never appears on) or the guardrail against a second product-vocabulary word
   replacing "fabriek" (the page header stays exactly "JOUW FABRIEK", untouched).
3. **The loading skeleton (`Shop.jsx`'s `!state?.tycoon` branch) was NOT wrapped in
   `.desk`.** It's a separate `.hal` render Shop.jsx already documents as unreachable via
   real navigation today (App.jsx only mounts `factory` view after full hydration). The
   `.hal` background swap (W10a) still applies to it for free since it's the same CSS
   selector, but it won't get the desk frame/tag/warmth/props. Kept out of scope per "the
   diorama render" (the real one) rather than expanding into a second, currently-dead
   code path; flag in case a future async-load path makes this branch reachable.
4. **`.scaletag` is not `aria-hidden`.** `.floor`/`.horizon`/`.warmth`/`.ruler`/`.pencil`
   are all `aria-hidden` (pure decoration, no text). `.scaletag` has real text ("MAQUETTE
   1:50"), so I followed the closest existing precedent (`.ticket-kicker`'s visible
   "BOUWBON" label, also un-hidden) rather than hiding it — a screen-reader user gets one
   extra short label naming the diorama as a scale model, which reads as legitimate
   context rather than noise.

**122 not consumed** — no new defect found; the existing world-C surfaces (machines,
ledger, ticket, werkbank, floor/horizon, all handlers) render unchanged apart from the
new backdrop, exactly as the save-compat AC requires.

Commit: see `git log` on `dev/115` for the hash covering `src/game/Shop.jsx`,
`src/game/game.css`, this file, and `company/assignments/115-screenshots/*.png`.

## Verification (tester v115, tick #41)

**Verdict: FAIL.** Reproduced every check independently in worktree
`C:\companies\typcoon-lanes\v115` (branch `verify/115`, port 4298) against commit
`519caff` on main HEAD, with my own save fixture and probe script
(`qa-scripts/115-tester-verify.mjs`, not copied from the dev's or prior testers'
scripts). Automated checks: 28/29 PASS. `npm test`: **266/266**. `vite build`: clean.
`check-no-dutch-en`: **PASS** (5 built en files, zero unallowlisted hits). Everything
the dev claimed about structure, layering, token hygiene, and three of the four
motions is **true and independently confirmed**. One acceptance criterion fails, hard,
in a real browser, for a reason neither the dev's screenshots nor careful diff-reading
alone would catch.

### The failure: `.warmth` (W10c) never renders — the front wash is invisible

`game.css:640` (`.warmth`'s `background`):
```css
background: radial-gradient(78% 100% at 42% 118%,
  color-mix(in srgb, var(--bg-wash) 130%, transparent) 0,
  color-mix(in srgb, var(--bg-wash) 60%, transparent) 38%,
  transparent 66%);
```
`color-mix()`'s percentage argument is typed `<percentage [0,100]>` in the CSS Color 4
spec — a value outside `[0,100]` makes the whole `color-mix()` (and therefore the whole
`background` declaration containing it) **invalid at parse time**, which falls back to
the property's initial value. **130% is out of range.** Proven four independent ways in
the live app, headless Chromium (`HeadlessChrome/149.0.0.0`, the same engine real users
get):
1. `CSS.supports('background', 'color-mix(in srgb, red 130%, transparent)')` → `false`.
   Swept 99–130%: **101% is already invalid**, 100% and below are fine.
2. `getComputedStyle(document.querySelector('.warmth')).backgroundImage` → `"none"`,
   `.backgroundColor` → `"rgba(0, 0, 0, 0)"` — the element paints **nothing**, on every
   page load, every theme.
3. Reproduced the exact same invalidity by assigning the identical
   `radial-gradient(...) `string to a throwaway test `<div>` — confirms it's the value,
   not a Shop.jsx/React quirk.
4. Screenshots at 1360×1000 in **all four** themes (see
   `company/assignments/115-screenshots-verify/diorama-{muntpers,nachtploeg,
   snoepfabriek,diepzee}-theme.png`) show a perfectly flat baseplate front — no warm
   pool, no glow, nothing distinguishable from `.hal`'s own unrelated background
   gradient. Compare against the four `world-place-winner-*.png` renders: the renders
   *also* show no clearly visible wash (the `--bg-wash` alpha is only 5–7% to begin
   with, so "whisper-subtle but present" and "literally absent" are hard to
   distinguish by eye alone) — that's *why* this survived three theme-checks by eye in
   the dev's own verification and wasn't caught: it takes `getComputedStyle`, not a
   screenshot, to see the difference between "very faint" and "not there."

**This is not a defect the developer invented.** The identical `130%` value is already
present verbatim in `design/DESIGN-FACTORY.md` W10c's own code block (line ~856) and in
`design/factory-mocks/world-C-maquette-place.html` line 84 — both are assignment 114
deliverables, already `status: done`. The dev's job was to build W10a–d "exactly," and
did — this is a bug the dev *faithfully reproduced* from the spec, not one they
introduced. But 115's own written AC requires a *working* warm front wash in the
*shipped app* ("The critique's named gap is visibly closed: ... warm front wash ...
give a legible sense of a place"), and it is provably not there. That AC fails on its
own terms regardless of where the bad value originated, so this bounces back to 115 —
whoever picks this up needs to touch `game.css` (in scope for 115) and should also flag
`DESIGN-FACTORY.md`/the mock HTML so a future reader doesn't reintroduce the same value.

**Suggested fix (for the next dev pass, not applied by me):** clamp both stops to
`≤100%`, e.g. `color-mix(in srgb, var(--bg-wash) 100%, transparent) 0,
color-mix(in srgb, var(--bg-wash) 55%, transparent) 38%, transparent 66%` — preserves
the "hotter center, fading out" shape W10c describes without the invalid percentage.
Re-screenshot after the fix; the effect is expected to stay very subtle by design (W3
restraint), so confirm with `getComputedStyle(...).backgroundImage !== 'none'` and a
pixel-level before/after diff, not eyeballing alone — that's exactly what let this slip
through 114 and 115 both.

### AC-by-AC (12 boxes; 9 ticked above, 3 left open — all three trace to the one root cause)

- **W10a desk surround + `.hal` swap — PASS.** `.desk` wraps `.hal` 1:1, grain/lip/
  gradient all present and token-derived, `.hal`'s ceiling-glow is gone, replaced by
  the plainer `--night`→`--panel-2` gradient. Confirmed structurally and visually in
  all 4 themes.
- **W10b `.scaletag` — PASS.** Pinned top-left, text is exactly `MAQUETTE 1:50`,
  `1:50` renders in `--brass`, re-tints correctly per theme.
- **W10c warm wash — FAIL.** See above. `.warmth` exists in the DOM, animates its
  `opacity` correctly (proven live, see W13 below), but paints **zero pixels** in any
  theme — the `background` is invalid CSS.
- **W10d `.ruler`/`.pencil` — PASS.** Both present, `aria-hidden`, token-derived,
  visually read as a ruled lip + a brass pencil at model scale in every theme.
- **W10e layer order — PASS.** Probed `z-index` live: `.warmth`=1, `.mch`/`.plot`=2
  (pre-091, as the dev's judgment call 1 predicts), `.ruler`/`.pencil`=4,
  `.scaletag`=6; `.floor`/`.horizon` carry no explicit `z-index` (pre-existing,
  unrelated to 115) but per CSS stacking-order painting rules (`z-index:auto`
  positioned descendants paint in the same step as `z-index:0`, strictly before any
  positive-`z-index` descendant) they visually sit below `.warmth` regardless — DOM
  order confirms `.warmth` sits right after `.floor`, before `.horizon`, matching
  Shop.jsx. Relative ordering (atmosphere ≤ machines < flat props < tag) holds.
- **Critique's named gap visibly closed — FAIL.** Desk + tag + ruler + pencil are all
  present and do read as "a place," but the AC explicitly lists the "warm front wash"
  as one of the elements that must be present and read as intended, and it is not
  there. Partial credit isn't a pass.
- **Reduced-motion resting states — PASS.** `.warmth` freezes at exactly `opacity:.72`
  (sampled twice, 1s apart, identical) — the freeze *mechanism* is correct even though
  the layer it freezes is invisible either way. `idleBob` freezes to a standing
  machine (`transform: none`, stable across two 1s-apart samples). No stuck
  mid-animation artifact anywhere. Screenshot:
  `company/assignments/115-screenshots-verify/diorama-reduced-motion.png`.
- **W13 live motion probe — FAIL (partial).** Sampled `getComputedStyle` every ~0.9s
  for 10s on a live page (not stills): `idleBob` — two built machines' `.mch-ico`
  `translateY` visibly out of phase across all 11 samples, never identical, ✔.
  `plotGlow` — `.plot .pad`'s `box-shadow` alpha (Chromium reports `color-mix()`
  results as `oklab(... / alpha)`, not `rgba()` — parsed accordingly) oscillated
  smoothly between 0.162 and 0.340 on the built plot, matching the spec's 16%/34%
  almost exactly, ✔. `riseIn` — settled, no re-trigger observed late in the run, ✔.
  `warmBreath` — the underlying `opacity` value **does** animate correctly (0.72↔1.0,
  smooth, no strobe, confirmed via computed style) — but per W10c above, there is
  nothing visible for that opacity to apply to, so "the front wash gently breathes"
  (the AC's actual felt-experience requirement) **cannot be observed on screen at
  all**, by a human or otherwise. Same root cause as W10c, not a second independent
  bug, but it means this checkbox can't be honestly ticked either.
- **Guardrail 2 — PASS.** No coin/spark/parcel imagery/wording anywhere in the 4 new
  atmosphere layers' markup.
- **Token discipline — PASS.** Re-read the full `519caff` diff by hand: zero new
  `:root` tokens, every colour is `var(--token)` or `color-mix(in srgb, var(--token)
  N%, transparent|black)`, `--sky` untouched, no raw hex/`rgba()` introduced. (The
  `130%` bug is a malformed *argument* to a correctly-token-sourced `color-mix()`, not
  a token-discipline violation in the sense this AC is checking — grep confirms it's
  the *only* `color-mix()` call in the whole file with an out-of-range percentage.)
  Confirmed all 4 `--bg-wash` values are distinct across themes (re-tint cascade
  proven to work for the parts of W10 that do render).
- **Keyboard-first, desktop only — PASS.** No mobile/narrow layout added; out of
  scope, untouched.
- **Save-compat / presentation-only — PASS.** `git diff --stat 519caff^..519caff`
  touches only `src/game/Shop.jsx` and `src/game/game.css` — `store.js`, `economy.js`,
  `src/engine/`, `src/game/theme.js`, `goals.js` all untouched (confirmed directly,
  not taken on faith). Full Shop.jsx diff read line-by-line: purely a wrap/reindent
  plus 4 new decorative elements: zero handler/state logic changed. `npm test`
  266/266 green.

### Judgment call rulings

1. **Z-index numbers diverging from W10e's literal ladder (091 not landed yet) —
   UPHELD.** Confirmed live: `.mch`/`.plot` are `z-index:2` today, `.ghost` unset,
   `.belt` does not exist. The four new layers carry the spec's own numbers verbatim
   and the *relative* ordering the AC actually cares about holds against both today's
   numbers and the eventual post-091 ladder. Correctly flagged for 091's future
   `.mch`/`.plot` renumber.
2. **`MAQUETTE 1:50` as a hardcoded JSX literal, not a `strings.js` key — UPHELD.**
   Confirmed `check-no-dutch-en` still passes (independently re-run, PASS). strings.js
   is explicitly out of this assignment's scope per the PO's kicker-rename ruling; the
   tag text is decorative/non-prose, same treatment class as the mock's own hardcoded
   label. Reasonable.
3. **Loading skeleton `.hal` branch not desk-wrapped — UPHELD.** Confirmed in
   `Shop.jsx` lines 150–165: the `!state?.tycoon` branch renders raw `.hal` (still
   gets the W10a background swap for free, same CSS selector) without `.desk`/
   `.scaletag`/`.warmth`/`.ruler`/`.pencil`. Confirmed via `App.jsx`'s mount-gating
   comment (factory view only mounts post-hydration) that this path is unreachable via
   real navigation today. Reasonable, honestly disclosed scope call.
4. **`.scaletag` not `aria-hidden` — UPHELD.** Consistent with the `.ticket-kicker`
   precedent (a short, real, visible text label, not decoration). Reasonable
   accessibility judgment, not a defect.

### What the dispatcher needs to know

- **This is a rendering bug inherited from 114's own spec + mock**, not something the
  developer introduced during 115's build. Whoever re-opens 115 should fix
  `src/game/game.css`'s `.warmth` rule (the only file in-scope) and separately flag
  `design/DESIGN-FACTORY.md` W10c + `design/factory-mocks/world-C-maquette-place.html`
  line 84 (both outside 115's file scope, both `done` deliverables of 114) so the same
  invalid value doesn't get copy-pasted again.
- **091 (`blocked_by: [115]`) should stay blocked** until this re-lands — the belt is
  meant to land "on this finished backdrop," and the backdrop's warm-lit-front element
  is currently not finished.
- Everything else — desk, tag, ruler, pencil, layer order, token hygiene,
  idleBob/plotGlow/riseIn, reduced-motion freezing, save-compat, guardrail 2 — is
  solid and independently verified. This is a **one-line-value fix**, not a rebuild.
- **118 not consumed.** No adjacent defect independent of this root cause was found;
  everything found traces to the single `.warmth` `color-mix()` percentage. Per
  filed-not-bounced discipline this stays inside 115 (it fails 115's own written AC)
  rather than becoming a separate assignment. Id 118 lapses back to the pool for the
  next tester who needs it.

Screenshots: `company/assignments/115-screenshots-verify/diorama-{muntpers,
nachtploeg,snoepfabriek,diepzee}-theme.png`, `diorama-reduced-motion.png`. Probe
script: `qa-scripts/115-tester-verify.mjs` (28/29 automated checks pass; the 1 failure
is the `.warmth` background-resolves-to-a-gradient check, matching the manual findings
above exactly).
