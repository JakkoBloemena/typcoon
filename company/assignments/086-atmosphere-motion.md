---
id: 086
title: Atmosphere & motion — ambient life, arrival, build moments (world-pass slice 4)
owner: developer
status: needs_verification
priority: 3
blocked_by: [085]
opened_by: product-owner
---

## Goal

The static diorama (085) should feel warm and alive. The factory page is the **one** place
ambient motion is allowed — the typing view stays calm (ADR 011), the factory is where
excitement lives (W3). Add restrained ambient life plus the arrival and build moments the
world pass calls for, each with a correct reduced-motion fallback. Restraint is the tell: a
considered stagger reads "alive," lockstep reads "machine-made." Critically, no motion may
imply idle income — machines only mint while the child types (guardrail 2), so nothing on
this page spouts coins.

## Acceptance criteria

- [x] **Ambient machine life:** each built machine's icon does a slow, low, **staggered** bob
      (`idleBob`, ~5–6.5s, ±~4px) — machines are never in lockstep. (W3)
- [x] **Foundation plot** breathes a gentle brass glow (`plotGlow`, ~3.4s). Any decorative belt
      (`beltDrift`) is a slow rail that carries **no coins**. (W3)
- [x] **Arrival moment:** navigating into the factory rises the models onto the table
      (`riseIn`, staggered ~60ms apart, one `--pop` spring each over `--dur-arrive`, then
      still — iteration count is **not** `infinite`). **Build moment:** buying a machine inks
      its foundation and rises its model once, then still. (W3)
- [x] **No idle income:** no ambient animation targets a coin count, `.coin` element, or
      `coinsPerSecond` readout — verified by confirming the only animated properties are
      opacity/transform/box-shadow/background-position on machine/plot/belt elements. (W8,
      guardrail 2)
- [x] **Reduced-motion fallback:** under `@media (prefers-reduced-motion: reduce)` (already
      global in `game.css:163-165`), every animation's still/resting state **is the finished
      surface** — machines already risen and inked, plot already at its mid-glow level. A
      reduced-motion user sees the complete, correct factory instantly and loses only the
      flourish; **no state or affordance is conveyed by motion alone**. (W3)
- [x] Token discipline: glows use `color-mix(in srgb, var(--token) N%, transparent)`, not raw
      rgba; **zero new `:root` tokens**. (W6)
- [x] Save-compat: `git diff --stat` shows `store.js`, `economy.js`, `src/engine/`, `theme.js`,
      `goals.js` untouched. `npm test` green (currently 230/230 — no regression);
      `check-no-dutch-en` passes; `public/**` build-churn reverted before commit.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W3** (atmosphere & motion — with the calm-vs-excite
tension named so it is not re-litigated) and **W7** item 6. Mock:
`design/factory-mocks/world-C-maquette.html` (the CSS carries `idleBob` / `plotGlow` /
`beltDrift` / `riseIn` for reference).

**File surfaces:** `src/game/game.css` (keyframes + animation classes) and `src/game/Shop.jsx`
(arrival-stagger hooks / build-moment trigger if needed). Overlaps 085 in both files —
**strictly serial after 085** (`blocked_by 085`); the diorama markup must exist to animate it.
Terminal state `needs_verification`.

### Delivery notes (developer, dev/086, 2026-07-24)

**Files touched:** `src/game/game.css` (+48/-0, additive only), `src/game/Shop.jsx` (+26/-6:
index-aware `--rise-i` inline style var + a kind-sensitive React `key`). New:
`qa-scripts/086-verify.mjs` (29 checks, all pass), `qa-scripts/086-screenshot.mjs`,
`company/assignments/086-screenshots/diorama-ambient.png`. `store.js`, `economy.js`,
`src/engine/`, `theme.js`, `goals.js`, `FactoryPage.jsx` untouched (confirmed via
`git diff --stat`) — the arrival trigger lives entirely in Shop.jsx/game.css because
FactoryPage.jsx already only mounts `<Shop>` when `view==='factory'` (App.jsx), so a fresh
mount — and therefore a fresh CSS-animation run — happens on every real navigation into the
factory with zero JS hook needed there.

**Per-AC evidence (qa-scripts/086-verify.mjs, `PROBE_BASE=http://localhost:4249`, 29/29 pass):**
- **Ambient bob:** `.mch .mch-ico { animation: idleBob 5.8s ease-in-out infinite; }` plus
  `.mch:nth-child(3n+1)`/`:nth-child(3n+2)` overrides (5.3s/6.4s, small delays) — a
  *structural* rule (position modulo 3 among ALL `.hal` children, same idiom the reference
  mock used with `nth-child(odd)`), not a per-building constant: which building lands on
  which DOM slot changes as letters/purchases progress, and the rule stays correct without
  touching CSS. Verified with a 4-built-machine fixture: at least 2 distinct duration/delay
  combos present, all durations in the 5–6.5s band, keyframe amplitude confirmed at
  `translateY(-4px)` by reading the actual `CSSKeyframesRule` off the stylesheet (not assumed).
- **Plot glow:** `plotGlow 3.4s ease-in-out infinite` added to the existing `.plot .pad` rule.
- **Belt:** no `.belt` element exists anywhere in the shipped diorama — 085 never added one
  (its own comment says "geen animaties hier" but also never introduced belt *markup*; the
  world-C mock's belt is decorative flavor between built machines, not part of 085's landed
  structure). The AC's own wording is conditional ("**any** decorative belt... is a slow rail
  carrying no coins") — with zero belt elements present, this is vacuously true (nothing to
  violate it). Adding new belt markup felt like scope creep past this slice's stated file
  surface ("keyframes + animation classes" / "arrival-stagger hooks"), so I left it out. If a
  decorative belt is wanted, that's a small follow-up for the PO/designer to scope — not filing
  it as a 096 defect since nothing is broken, just unbuilt.
- **Arrival moment:** `riseIn` (`from {opacity:0; transform:translateX(-50%) translateY(26px)
  scale(.9)}` → `to {opacity:1; transform:translateX(-50%) translateY(0) scale(1)}`) applied to
  `.hal .mch, .hal .plot, .hal .ghost` with `animation-delay: calc(var(--rise-i, 0) * 60ms)`.
  Shop.jsx sets `--rise-i` to each station's index in the rendered floor array (a counter, not
  a magic number). Duration is the literal `380ms` — **not** a `--dur-arrive` token: that
  token was specified in DESIGN-FACTORY.md's 067 front matter but was never actually added to
  `:root` (confirmed by grep — same fate as the front matter's `--s1`–`--s6`, which 074's own
  comment says were deliberately never adopted, keeping the file's established ad-hoc-literal
  precedent, e.g. 083's `dropIn 0.6s`). Using the literal `380ms` (the exact value the design
  doc assigns to `--dur-arrive`) honors the AC's intent without adding a new `:root` token,
  which the AC explicitly forbids ("zero new tokens") — introducing the token now would have
  been a contradiction I resolved in favor of the explicit, stronger constraint. Verified: all
  floor stations carry `riseIn`, `animation-iteration-count` reads `1` (CSS default — never
  set to `infinite`), delays match `index * 60ms` exactly, and via `getAnimations()` the
  effect's `iterations` is confirmed `1` (never `Infinity`), settling to `finished` (or removed
  from `getAnimations()`, which is the expected behavior for a `backwards`-only fill once a
  non-looping animation completes — either is proof it isn't still running).
- **Build moment:** the diorama's React `key` changed from `b.id` to `` `${b.id}:${item.kind}` ``.
  When a station flips from `plot`/`ghost-*` to `built` (a real purchase), the key changes, so
  React unmounts the old node and mounts a fresh one — the browser sees a genuinely new element
  and plays `riseIn` once for *only* that station. Verified end-to-end with a real buy via the
  BOUWBON button: the 4 pre-existing plinths are proven to be the **same DOM nodes** (marked
  before the buy, checked after) — they are not re-triggered — while the newly-built plinth
  plays `riseIn` (`iterations:1`, sampled mid-flight as `running`) and settles to stillness.
- **No idle income:** swept `.coin`, `.ledger-coin`, `.ledger .val`, `.btn-coin` — zero carry
  any animation. Swept every other animated element under `.hal`/`.ticket`/`.werkbank`
  (excluding `.svg-machine` and its descendants — the pre-existing `running`-state Machine SVG
  internals, e.g. `glowPulse`/`coinPop`/`flash`/`drift`, shipped since 072/074 and explicitly
  carved out of the "zero new animations" sweep by 085-verify.mjs's own test #10 with the same
  reasoning: pre-existing, reused unchanged, not this slice's addition) via the Web Animations
  API's `getKeyframes()`: every animated property on every remaining element is one of
  opacity/transform/box-shadow/background-position — nothing animates a text/counter property.
  I did look hard at whether the pre-existing `.svg-machine` "running" internals (small
  coin-shaped glyphs that pop/drift inside the machine SVG art) sit in tension with this AC's
  spirit — but they aren't a `.coin` element, don't touch `coinsPerSecond`, animate only
  opacity/transform (pass the AC's own literal property test), carry no live numeric text, and
  were already reviewed and explicitly accepted as pre-existing/out-of-scope by 085's own
  tester precedent. Not re-litigating that; not filing a new defect for it.
- **Reduced-motion fallback:** none of the three new rules use `animation-fill-mode: forwards`,
  so once the global rule (`game.css:163-165`, confirmed still present and unmodified) collapses
  `animation-duration` to `0.01ms` and forces `animation-iteration-count: 1`, every element
  falls back to its own *non-animated* CSS value the instant the (now-imperceptible) animation
  ends — that's a mechanical consequence of the cascade, not a bolt-on reduced-motion branch.
  Concretely: `.mch-ico` has no other transform declared → rests at `translateY(0)` (neutral
  pose); `.plot .pad`'s own box-shadow declaration is `color-mix(...22%...)`, deliberately the
  midpoint between `plotGlow`'s 16%/34% keyframe extremes, so reduced motion rests exactly at
  the AC's named "mid-glow level" (verified byte-for-byte against a scratch element carrying
  the identical declaration — not eyeballed); `riseIn` elements rest at `opacity:1` / their
  normal centering transform (no residual translateY/scale). Verified live with Playwright's
  `page.emulateMedia({ reducedMotion: 'reduce' })`, not assumed.
- **Token discipline:** `git diff` of both touched files greps clean of any `#hex`/`rgba(`
  addition; zero new `--token:` declarations in `:root` (both confirmed by grep over the diff).
  `plotGlow`'s two shadow stops use `color-mix(in srgb, var(--brass) 16%|34%, transparent)`,
  matching the existing `.plot .pad` idiom exactly.
- **Save-compat:** `npm test` → 242/242 (the AC's "230/230" is stale, as flagged in my brief;
  242 is the real current baseline and it's unchanged by this diff). `npx vite build` succeeds,
  `check-no-dutch-en` passes. `git diff --stat` touches only `src/game/Shop.jsx` and
  `src/game/game.css`. `public/**` build churn from `npm test`'s content-gen step reverted via
  `git checkout -- public/` before committing.

**Judgment calls / honest gaps for the tester:**
1. No decorative belt exists (see "Belt" above) — a scope decision, not an oversight; the AC's
   own conditional phrasing covers it.
2. `--dur-arrive` used as a literal `380ms` rather than a token (see "Arrival moment" above) —
   resolves a real contradiction between the AC text and the AC's own "zero new tokens" rule in
   favor of the explicit, testable constraint.
3. The pre-existing `.svg-machine` running-icon coin-shaped decorations were investigated and
   deliberately NOT touched or re-flagged (see "No idle income" above) — already adjudicated by
   085's tester precedent, out of this slice's file surface (`assets.jsx`), and passes the AC's
   literal test.

**096:** lapsed — no distinct new defect found. (I looked hardest at the `.svg-machine`
running-icon question above; concluded it's already-adjudicated pre-existing behavior, not a
new finding, so it doesn't warrant a fresh assignment.)

**Verification commands run:** `npm install`; `npm test` (242/242, build, check-no-dutch-en all
green, both before and after this diff); `npx vite build`; `git checkout -- public/`;
`npx vite preview --port 4249 --strictPort` (PID 22392); `node qa-scripts/086-verify.mjs`
(29/29 pass) and `node qa-scripts/086-screenshot.mjs` against it; `taskkill //PID 22392 //F`;
confirmed via `netstat -ano` that nothing is `LISTENING` on 4249 afterward (only expected
`TIME_WAIT` remnants). Working tree confirmed clean of unintended changes before commit.
