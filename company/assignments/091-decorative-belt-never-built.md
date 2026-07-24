---
id: 091
title: Decorative belt (beltDrift) named in W3 and the world-C mock was never built — zero .belt markup anywhere
owner: developer
status: done
priority: 3
blocked_by: [115]
opened_by: tester (proposed); re-sequenced by product-owner (tick #39 intake)
---

> **PRODUCT-OWNER RE-SCOPE (2026-07-24, tick #39 intake).** The belt is folded into the
> "from blueprint to place" iteration (`research/milestone-factory.md` §10) as one of the
> ambient/atmosphere elements the 076 critique's "blueprint, not place" gap points at.
>
> **Design-spec sufficiency (the question the PO was asked to judge):** the belt's *own*
> spec is **sufficient** — DESIGN-FACTORY.md PART II **W3** names it explicitly and
> `design/factory-mocks/world-C-maquette.html` ships a literal `.belt` element with the
> `@keyframes beltDrift` animation. A developer can build the belt directly from that; it
> does **not** need a new designer spec to *exist*. So this is **not** blocked for a
> missing-spec reason.
>
> **Why blocked_by [115] anyway (coordination, not spec):** building a lone drifting belt
> onto today's bare blueprint floor is low-value churn — it does not move the "blueprint,
> not place" needle, and the 114→115 atmosphere pass is about to rework the very floor the
> belt sits on and touches the same files (`Shop.jsx` + `game.css`). So the belt lands
> **after** 115's backdrop, placed onto the finished atmosphere, coherently. Assignment 114
> (the designer place-ness pass) is also asked to reconcile the belt into the winning
> direction, so its final placement follows the atmosphere spec rather than the old mock in
> isolation. Priority raised 4 → 3 to match the iteration it now belongs to (still
> atmosphere/cosmetic; below the 115 backdrop it completes).
>
> Acceptance criteria below stand, with one addition: the belt's placement matches wherever
> the 114 spec reconciles it into the winning atmosphere direction (falling back to the
> W3 / world-C-maquette placement idiom if 114 does not move it). ────────

## Goal

`design/DESIGN-FACTORY.md` PART II **W3** describes the factory's ambient atmosphere as
including a decorative conveyor belt: *"the belt (`beltDrift`) is a slow decorative rail...
**not** carrying coins"* (line ~560-561), and the reference mock
`design/factory-mocks/world-C-maquette.html` ships a literal `.belt` element with a
`beltDrift` `background-position` keyframe animation, placed between built machines
("built machines: near the front, big, running (belt between them)").

Neither 085 (the diorama-floor build, which laid out `.mch`/`.plot`/`.ghost` markup) nor
086 (the atmosphere/motion pass, scoped to `game.css` keyframes + `Shop.jsx` hooks) ever
added a `.belt` element to the shipped diorama. There is currently **zero** belt markup
anywhere in `src/game/Shop.jsx` or `src/game/game.css` — confirmed by grep
(`grep -rn "belt" src/game/` returns nothing outside comments discussing its absence).

086's own acceptance criteria phrased this conditionally ("**any** decorative belt...
carries no coins"), and the 086 tester's verification (see
`company/assignments/086-atmosphere-motion.md`'s Verification section, judgment call 1)
ruled that conditional wording is vacuously satisfied with zero risk to guardrail 2 (no
element exists to carry coins) — so this is **not** a bounce of 086, whose file surface
was correctly scoped away from adding new diorama markup. But it is a real, named piece
of the W3/mock ambition that nobody has built. This assignment tracks that gap
explicitly so it doesn't quietly stay missing forever.

This is cosmetic/atmosphere-only — no guardrail, save-compat, or gameplay logic is at
stake — hence priority 4.

## Acceptance criteria

- [x] A `.belt` element (or equivalent) is added to the diorama floor (`Shop.jsx`),
      positioned between/near built machines per the mock's placement idiom, using a
      rule-based position (not a hardcoded per-machine constant) consistent with
      `layoutDiorama`'s existing approach.
- [x] The belt plays a slow `beltDrift`-style animation (`background-position` drift,
      per the mock's `@keyframes beltDrift { to { background-position: 20px 0 } }`
      idiom) — restrained, ambient, consistent with W3's "restraint is the tell" framing.
- [x] The belt **never** carries or implies coins — no coin glyph, no `.coin` element, no
      property animation beyond opacity/transform/background-position (same guardrail-2
      test 086 already established for every other ambient element on this page).
- [x] Reduced-motion: the belt's resting state is a static rail (no residual mid-drift
      artifact), consistent with the reduced-motion idiom 086 established for
      `idleBob`/`plotGlow`/`riseIn`.
- [x] Token discipline: zero new `:root` tokens; colors via existing tokens/`color-mix`,
      matching the established idiom.
- [x] Save-compat: `store.js`, `economy.js`, `src/engine/`, `theme.js`, `goals.js`
      untouched; `npm test` green; `check-no-dutch-en` passes.

## Notes

Spec: `design/DESIGN-FACTORY.md` PART II **W3**. Reference: `design/factory-mocks/world-
C-maquette.html` lines ~98-103 (`@keyframes beltDrift`, `.belt` rule) and ~215-216 (belt
placement markup). Related but distinct from assignment 089 (floor-grid contrast) and 092
(ghost-icon contrast) — this is about a missing element, not a contrast problem on an
existing one.

Filed by the tester verifying 086 (v086, 2026-07-24) as a proposed, non-blocking follow-up
— not a bounce of 086 itself. Priority left at 4 (cosmetic) per the tester-filing rule in
`framework/PROTOCOL.md` (priority set by user impact; this affects atmosphere polish only,
no broken flow).

## Delivery notes (developer d091, tick #42)

Built exactly against `design/DESIGN-FACTORY.md` PART III **W12** ("Ambient dressing
inventory + the belt reconciliation"), which the PO re-scope pointed to and which
supplied a literal recipe (placement rule + CSS block) — no design judgment calls were
needed on the visual spec itself; the only calls made were where the spec was silent
(the 0/1-built-machine render, and the tester-facing z-index note).

**What I built:**
- `src/game/Shop.jsx`: `beltSegments(diorama)` — a rule function, same discipline as the
  existing `layoutDiorama`. Filters the already-laid-out diorama to `kind==='built' &&
  lane==='front'` items (front lane only, per W12 — an "established" back-lane built
  machine from the `FRONT_LANE_CAP` overflow case never gets a belt), then for each
  *consecutive pair* in that filtered list emits one segment: `left = a.x - BELT_INSET`,
  `width = b.x - a.x`, `top = LANE.front.top + BELT_TOP_OFFSET`. `BELT_INSET=4` and
  `BELT_TOP_OFFSET=16` are the two constants W12's own reference numbers imply
  (`world-C-maquette-place.html`: machines at x=20/44, belt at left:16/width:24/top:76 —
  i.e. `x1-4`, `x2-x1`, `LANE.front.top(60)+16`). These are *global* formula constants
  applied uniformly across every pair, not a per-machine magic number — the AC1
  "rule-based, not hardcoded per-machine" bar. Rendered as one `<div className="belt">`
  per segment, DOM-positioned before the machine layer (after `.horizon`, before
  `diorama.map`), so it paints under the machines per z-index (see below), not by DOM
  order accident.
- `src/game/game.css`: `.belt` + `@keyframes beltDrift` — copied verbatim from W12's own
  code block (repeating-linear-gradient stripe in `--mint-deep`, 1px `--mint-deep`
  border, `--sink` cast shadow, `animation: beltDrift 5.5s linear infinite`, keyframe
  `to { background-position: 22px 0 }`). Zero deviation from the spec's recipe, so the
  4px/s "barely-there" rate and the re-time from world-C's original 1.1s are both exactly
  what W12 prescribes.
- **W10e z-ladder** (the flag left for me in the assignment brief, from 115's judgment
  call 1): bumped `.mch`/`.plot` `z-index: 2 -> 3`, gave `.ghost` an explicit `z-index: 2`
  (was unset/`auto`), added `.belt` at `z-index: 2`. Did **not** touch `.floor`/`.horizon`
  (still no explicit `z-index`) — they paint at the `auto`≈0 level, which is already below
  every explicit z1+ layer and was out of the brief's ask; no functional or visual
  difference observed, so I left them alone rather than expand the write surface on a
  judgment call nobody asked for.

**Judgment call — 0/1 built machines (flagged for the tester per the assignment brief):**
Chose the conservative reading explicitly named in the assignment text itself ("the mock
idiom implies no belt until there are adjacent built machines") — `beltSegments` returns
an empty array whenever fewer than 2 built machines sit in the front lane, so **zero**
`.belt` elements render. Verified both the 0-built (fresh save, `BOUW HIER` state) and
1-built (only Typemachine) cases render with no belt at all (screenshots 4 and 5 below).
W12 doesn't explicitly rule on the 0/1 case in the text I read, so this is my own
conservative extension of its "between built machines" placement rule, not a literal W12
citation — flagging for the tester to confirm this reading is what's wanted.

**Verification (live, headless Chromium via `playwright-core@1.61.1`, installed
`--no-save`; dev server on port 4303, stopped before returning):**
- `npm test`: **266/266 before AND after**, `vite build` clean, `check-no-dutch-en` PASS
  both times.
- `qa-scripts/091-dev-verify.mjs` (new, this assignment's write surface): **20/20 PASS**.
  Notable probes, not just declaration checks (the 115 lesson — painted effect, not just
  an animated property):
  - 5-built fixture (`buildSave5`, same idiom as `qa-scripts/106-tester-verify.mjs`):
    exactly 4 `.belt` segments for 5 built machines; each segment's left/right edge
    cross-checked against its two flanking `.mch .plinth` bounding-box centers —
    confirms the rule-based formula, not a coincidence.
  - `getComputedStyle(.belt).backgroundImage` is a real `repeating-linear-gradient(...)`
    (not `"none"`), `animation-name === "beltDrift"`, `animation-duration === "5.5s"`.
  - Live motion probe: sampled `background-position` 8× over ~10s (two full 5.5s
    cycles). Measured rate ≈ (19.13px − 2.21px) / 4.2s ≈ **4.03px/s**, matching W12's
    documented "22px / 5.5s ≈ 4px/s" exactly. No forward jump >12px between consecutive
    1.4s-spaced samples (the one large *negative* delta per cycle is the expected
    linear-infinite wrap from 22px back to 0, not a strobe).
  - Guardrail 2 (three independent checks): zero `.coin`/coin-class elements inside any
    `.belt`; zero text content inside `.belt`; read the *live* `@keyframes beltDrift`
    rule off the actual stylesheet via `CSSKeyframesRule` and confirmed its property
    list contains **only** `background-position` (Chromium reports the shorthand as its
    two longhands `background-position-x`/`-y` internally — both allow-listed, nothing
    else present, so no opacity/transform smuggling either).
  - Reduced-motion (`reducedMotion: 'reduce'` context): `.belt` background-position
    sampled twice 1.2s apart — **byte-identical string**, and still a real painted
    gradient (not frozen-but-invisible). No `fill-mode` needed — same idiom as
    `.warmth`/`.plot .pad`: `.belt` never sets its own `background-position`, so
    reduced-motion's global duration-zero rule collapses the animation back onto the
    unset CSS default (`0% 0%`) automatically.
  - z-order: `getComputedStyle` confirms `.belt` z-index `2`, `.mch` z-index `3` —
    matches W10e's ladder.
  - Theme swap (`data-theme="nachtploeg"`): `.belt` border-color resolves to a real,
    different colour (re-tints for free via `--mint-deep`, no per-theme code).
  - 0-built and 1-built fixtures: `.belt` count is 0 in both (the judgment call above).
- Screenshots (1360×1000) under `company/assignments/091-screenshots/`: `1-default-
  theme-full-diorama.png` + `1b-default-theme-hal.png` (5 built, belt visible between
  every pair), `2-theme-nachtploeg.png` (re-tint confirmed by eye — mint stripe reads
  violet-adjacent under the theme), `3-reduced-motion.png` (static, fully-drawn rail),
  `4-zero-built.png` and `5-one-built.png` (no belt, per the judgment call above).

**Not consumed:** id 121 (defect-filing id allocated to this lane) — no distinct
reproduced defect found outside 091's scope during this build.

Status set to `needs_verification` (developer terminal state, never `done`) — a tester
should independently re-derive the fixtures and confirm the judgment call above before
flipping to `done`.

## Verification (tester v091, tick 2026-07-25 #1)

Independent re-verification, own fixtures, own probes (`qa-scripts/091-tester-verify.mjs`,
34/34 PASS) — the dev's own `qa-scripts/091-dev-verify.mjs` was also re-run as one input
(20/20 PASS, unchanged) but the verdict below rests on my own derivation, not that script.
Diff scope re-confirmed via `git diff a518130 HEAD --stat -- src/game/store.js
src/game/economy.js src/engine/ src/game/theme.js src/game/goals.js` = empty (save-compat
files genuinely untouched).

- **AC1 (rule-based placement).** Own 3-built fixture (`typewriter/printer/robotarm`
  built, `curriculumIndex: 12` — a different subset and letter-state than the dev's
  all-5-built fixture, deliberately exercising a live `.ghost` element too). 2 `.belt`
  segments for 3 built machines; each segment's left/right edge cross-checked against its
  two flanking `.mch .plinth` bounding-box centers (own fixture, own math) — spans
  confirmed, none touch the `.plot` or `.ghost` boxes (different vertical row, back
  lane). Also independently probed the 2-built boundary (exactly 1 segment) and
  re-derived `layoutDiorama`/`beltSegments` verbatim from the shipped source into a
  standalone pure-JS harness to exercise the **FRONT_LANE_CAP overflow** path (currently
  unreachable live — `BUILDINGS.length === FRONT_LANE_CAP === 5`, confirmed by reading
  `economy.js`'s `BUILDINGS` array and `Shop.jsx`'s `FRONT_LANE_CAP`): synthetic 6-built
  front lane correctly demotes the oldest (m1) to the back lane, and `beltSegments`
  correctly excludes it from every segment (4 segments among the remaining 5, none
  referencing m1). **Judgment call (a) confirmed correct**: 0-built and 1-built fixtures
  (own save shapes, different from the dev's) both render exactly 0 `.belt` elements.
  Back-lane built-machine exclusion (the FRONT_LANE_CAP overflow guardrail) verified by
  code-level re-derivation since it is structurally unreachable with the current
  5-building roster — ruling stands, no live contradiction possible today.
- **AC2 (beltDrift, painted not just animated).** `getComputedStyle(.belt).backgroundImage`
  is a real `repeating-linear-gradient(...)` (not `"none"`), `animation-name==='beltDrift'`,
  `animation-duration==='5.5s'`. **A/B pixel check** (the 115 lesson, done independently of
  the dev's approach): screenshotted the live `.belt` element, then cloned it in-page with
  `background:none; animation:none` and screenshotted the clone — the two PNG byte buffers
  differ, proving the real element is actually painting a gradient rather than resolving to
  an invisible/absent background that merely happens to sit under an animated property.
  Own motion-rate sample (6 points, 1s apart, independent timing window from the dev's
  1.4s/8-sample window): forward per-sample step ≈4.03-4.06px, consistent with 22px/5.5s≈
  4px/s and nowhere near the old 1.1s (~18px/s) rate. Reduced-motion resting position is
  the CSS default `0% 0%`, matching W13's documented finished state exactly.
- **AC3 (guardrail 2).** Zero coin/coin-ish elements and zero text content inside `.belt`
  in every fixture tested. Read the live `@keyframes beltDrift` rule off the actual
  stylesheet (`CSSKeyframesRule`): property list is only `background-position-x`/`-y`
  (Chromium's internal longhand split of the shorthand) — no opacity/transform/other
  property smuggled in.
- **AC4 (reduced-motion).** `reducedMotion:'reduce'` context: `background-position`
  byte-identical across a 1.5s window, background-image still a real painted gradient (not
  frozen-invisible) — a fully-drawn static rail, no mid-drift artifact.
- **AC5 (token discipline).** Confirmed zero new `:root` tokens added by the 704a084 diff
  (only `.belt`/`.mch`/`.plot`/`.ghost` selector/property changes, no new custom property
  declarations). `--mint-deep`/`--night`/`--sink` (the three tokens `.belt` uses) all
  pre-exist in `:root` and in all four theme blocks (`nachtploeg`/`snoepfabriek`/`diepzee`),
  confirmed by grep. **Literal-value substitution color-mix sweep** (per the 115 defect
  class — `CSS.supports()` defers validity on `var()`-containing values): extracted the
  `.belt` rule's one `color-mix(in srgb, var(--mint-deep) 38%, var(--night))` call with a
  balanced-paren parser (not a naive regex, which truncates at `var()`'s own closing
  paren), substituted the resolved literal hex values, and confirmed `CSS.supports('color',
  literal)` is true — 38% is in-range, no 115-class out-of-range percentage. **Theme
  sweep, all 4 themes** (default/nachtploeg/snoepfabriek/diepzee, not just nachtploeg):
  `.belt` renders a real gradient and a distinct border-color in every theme (4/4 distinct
  values), confirming free re-tint with zero per-theme belt code.
- **AC6 (save-compat).** `store.js`/`economy.js`/`src/engine/`/`theme.js`/`goals.js` diff
  vs. pre-091 is empty (git-diff-confirmed above). `npm test`: **266/266**, `vite build`
  clean, `check-no-dutch-en`: PASS.
- **Judgment call (b), W10e z-ladder.** Own fixture with a live `.ghost` (letter-locked
  back-lane building) confirms: `.belt`=2, `.ghost`=2, `.mch`=3, `.plot`=3, `.floor`/
  `.horizon`=`auto` — exact match to W10e's `floor 1 · warmth 1 · horizon 1 · belt 2 ·
  ghost 2 · mch/plot 3` ladder (the `auto` floor/horizon paint below all explicit
  z1+ layers, functionally equivalent to z≈0). Visual sweep across default + nachtploeg
  screenshots: no stacking regression — belt paints under machines, ghosts read correctly
  behind the readable mch/plot layer, floor grid stays furthest back in every theme.
- **Placement idiom.** Shipped `.belt`/`@keyframes beltDrift` CSS is byte-identical to
  `design/factory-mocks/world-C-maquette-place.html`'s reconciled recipe (z2, 5.5s,
  22px) — the 114-reconciled fallback idiom named in the PO re-scope note, not the
  original world-C 1.1s mock. Confirmed by direct grep/diff of both files.
- **Went past the ACs:** checked the mobile viewport (390×844) — the whole game (not just
  the factory/belt) gates behind an existing pre-091 "maak je venster wat breder" min-width
  screen (`src/game/strings.js`), unrelated to this assignment and not a regression; no
  belt-specific mobile issue exists because the belt never renders on that gate at all.
  No defect found outside 091's scope.

**Verdict: PASS on every acceptance criterion, independently re-derived.** Both judgment
calls ((a) 0/1-built suppression, (b) W10e z-ladder) are correct. Screenshots under
`company/assignments/091-screenshots-verify/`. Flipping status to `done`.

**Not consumed:** id 122 (defect-filing id allocated to this lane) — no distinct
reproduced defect found outside 091's scope during verification.
