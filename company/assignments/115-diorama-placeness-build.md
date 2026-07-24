---
id: 115
title: "Build the diorama place-ness backdrop/depth/scale per the 114 spec (closes the \"blueprint, not place\" gap)"
owner: developer
status: needs_verification
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

- [ ] **The desk surround + `.hal` background swap (W10a).** The existing `.hal` is wrapped
      in a new `.desk` element (physical tabletop: `--sink` border, faint diagonal grain from
      `color-mix` over `--sink`, `--panel-2`/`--sink` gradient, `0 12px 0 var(--sink)` lip),
      and `.hal` loses world-C's radial ceiling-glow for the plainer `--night`→`--panel-2`
      desk-context gradient. The diorama now reads as a **model resting on a desk**, not a
      schematic on a bare panel.
- [ ] **The `MAQUETTE 1:50` scale tag (W10b).** A `.scaletag` pinned to the desk's top-left
      corner (`--data` face, `--ink-dim` on `--night`, the `1:50` in `--brass`), matching the
      mock. This is the primary "these are miniatures" scale cue.
- [ ] **The warm workshop wash (W10c).** A `.warmth` radial pool of `color-mix` over
      `--bg-wash` across the FRONT of the baseplate, **`z-index:1`, DOM-ordered right after
      `.floor` so it sits behind the machine layer (`z3`)** and cannot lower any label's
      contrast. **No hotspot on any single machine** (the fix for the critic's blown-out note).
      It carries the new `warmBreath` 8s ambient motion.
- [ ] **The scale props (W10d).** A `.ruler` along the near lip of the baseplate and a
      `.pencil` lying at model scale beside the machines (`--brass` body, wood tip + graphite
      point via pseudo-elements), both decorative (no text, no interaction), both token-derived.
      Together with the tag they deliver "scale" concretely without shrinking the machines.
- [ ] **Layer order holds (W10e):** `floor 1` · `warmth 1` · `horizon 1` · `belt 2` ·
      `ghost 2` · `mch`/`plot 3` · `ruler`/`pencil 4` · `scaletag 6`. **Anything readable or
      interactive stays at `z ≥ 3`; all atmosphere is `z ≤ 2` except the two flat props (z4)
      and the tag (z6), which carry no machine text.** This is what preserves AA by construction.
- [ ] **The critique's named gap is visibly closed:** the floor is no longer bare
      grid + one horizon line — the desk frame + `1:50` tag + ruler + pencil + warm front wash
      give a legible sense of a **place a kid leans into**, with scale and lit-foreground depth
      beyond the machine icons themselves. A tester compares the running app at ~1360px to the
      four `world-place-winner-*.png` renders and confirms each named element is present and
      reads as intended.
- [ ] **Every new atmosphere motion has a finished still resting state.** Under
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
- [ ] **Guardrail 2 intact:** no atmosphere element spouts, carries, or implies coins;
      typing stays the only faucet (the same guardrail-2 test 086 established for every
      ambient element on this page).
- [ ] **Token discipline:** zero new `:root` tokens; every colour is `var(--token)`; tints
      and glows use `color-mix(in srgb, var(--token) N%, transparent)`, never raw
      `rgba()`/hex; `--sky` stays prestige-only. A `[data-theme]` swap recolours the new
      backdrop and dressing for free — verify on at least one non-default theme.
- [ ] **Keyboard-first, desktop only:** no mobile/narrow-viewport layout is added here
      (that is assignment 106's separate concern). Desktop layout at the design widths is
      the deliverable.
- [ ] **Save-compat / presentation-only:** `store.js`, `economy.js`, `src/engine/`,
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
