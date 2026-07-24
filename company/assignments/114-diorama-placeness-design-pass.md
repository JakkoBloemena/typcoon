---
id: 114
title: "Designer: \"From blueprint to place\" — atmosphere/place-ness design pass for the Maquette diorama (076 critique intake)"
owner: designer
status: needs_verification
priority: 2
blocked_by: []
opened_by: product-owner
---

## Goal

The world-pass milestone landed and is verified: the typing view is calm-alive-not-dead,
and the diorama's built/ghost grammar makes growth legible. But the 076 playtest-critique
(`company/research/076-playtest-critique.md`, the ADR-013 flywheel intake) found the
milestone does **not yet clear the "ultimate experience" bar**: *"the diorama is a clean,
legible **blueprint schematic** — grid background, one horizon line, no sky, weather,
parallax, or background dressing beyond the built-machine icons themselves. It's a good UI
for 'growing,' but it doesn't yet read as a **place** the way ADR 012's language ('scale,
atmosphere, place-ness... the factory as somewhere you go') asks for."*

This is the design-first gate for the next iteration (theme: **"from blueprint to
place"**, `research/milestone-factory.md` §10). Per PROTOCOL's design-before-features
rule, the designer runs before any place-ness markup is built. Produce competing
atmosphere directions for turning the current blueprint floor into a **place a kid feels
they have walked into**, select one by pairwise comparison, and deliver the spec (updated
mock + a DESIGN-FACTORY.md addendum) that assignment 115 builds against.

**This is a design pass, not code** — deliverables are mocks and the DESIGN-FACTORY.md
spec, not `src/**`. Do not touch product code.

## What the critique names as missing (the gap to close)

The floor today = a tilted `--bg-grid` grid + one `.horizon` line + the machine models.
The critique names, specifically, the absent "place" cues: **a sense of scale, a backdrop
/ sky, depth/parallax, ambient background dressing, a day-in-the-life read.** The genre
benchmark it cites (an idle-tycoon whose skyline visibly changes, weather/day-night,
crowds) is the *quality bar to compare against honestly*, **not** a build list — see the
hard scope caps below.

## Deliverables

- [x] **At least two genuinely distinct atmosphere directions**, built as real,
      font-loaded HTML on the shipped `_base.css` token layer and **rendered at desktop
      scale** (≥1024px, designed 1360px) — same method as the 067/079 passes. They must
      differ in the *place* concept (e.g. "a warehouse you look into" vs "a workshop on a
      lit workbench" vs "a model-city under a sky"), not merely in decoration density.
      → **THREE**: A "Onder de Kap" (lit hall), B "De Werktafel" (model on a lit desk),
      C "De Modelstad" (district under a sky). `design/factory-mocks/place-{A,B,C}-*.html`,
      renders `dir-place-{A,B,C}-muntpers.png`.
- [x] **A pairwise, ranked-not-scored selection** (PROTOCOL §3) naming a winner and saying
      plainly why, judged against the critique's "does it read as a place?" bar and the
      pinned Muntpers look. Flattery is a defect (ADR 013).
      → Independent critic, renders + source, no scores. Ranking **1) B  2) C  3) A**;
      winner **B — De Werktafel**. Reasoning: DESIGN-FACTORY.md **W9**.
- [x] **A DESIGN-FACTORY.md addendum** (a new PART III / W-series section, appended — do
      not rewrite PART II) specifying the winner: the backdrop/atmosphere layers, how depth
      and scale are conveyed, what ambient dressing exists and where, and how each element
      degrades to a **finished still resting state** under `prefers-reduced-motion`.
      → **PART III (W9–W15)** appended; PART II untouched. Exact selectors/gradients/
      color-mix recipes in W10–W12; reduced-motion resting-state table in W13.
- [x] **The decorative belt (assignment 091) is reconciled into the atmosphere**, not left
      as an orphan element on a bare floor. State where the belt sits in the winning
      direction so 091 builds it onto the finished backdrop coherently.
      → **W12**: front lane between built machines, `z2`, `beltDrift` re-timed 1.1s→5.5s,
      carries no coins (guardrail 2). Placement rule stated so it survives build changes.
- [x] **A live-verifiable motion checklist.** The 076 critique could not judge felt motion
      quality from stills. The spec must list each ambient/atmosphere motion with its
      intended *felt* read (e.g. "belt: barely-there drift, reads alive-at-rest, never
      draws the eye") so the next playtest tester can confirm it **in the running app**,
      not guess from a screenshot.
      → **W13**: 5-row probe table (idleBob, warmBreath, plotGlow, beltDrift, riseIn) —
      each with period, felt read, and a pass/fail live probe + a reduced-motion rest table.

## Hard scope caps (scope-down — record these IN the spec so the build cannot over-reach)

- [x] **Zero new `:root` tokens.** The whole world is still built from the existing set +
      the two 067 aliases (`--goal`, `--reward`). A `[data-theme]` swap must recolour every
      new atmosphere element for free. Tints/glows use `color-mix(in srgb, var(--token) N%,
      transparent)`, never raw `rgba()`/hex (W6 discipline). → Verified: token-hygiene grep
      clean (no raw rgba/hex in styling; no backdrop `--sky`); W14.
- [x] **No real weather/day-night/time engine and no crowd simulation.** The genre
      benchmark is a *quality comparison*, not a feature order. Atmosphere is achieved with
      CSS on the token layer (gradients, layered backdrops, parallax-on-arrival, ambient
      restraint) — a static-but-rich *sense* of place, not a simulation. If a direction
      needs a runtime system, an asset pipeline, or spend, it is out of bounds — say so and
      pick a direction that does not. → Winner is pure CSS; no runtime/asset/spend. W14.
- [x] **Guardrail 2 (no idle income) is visible in the motion.** Ambient life is *at rest*
      — machines/dressing never spout, carry, or imply coins; typing stays the only faucet.
      → Belt carries nothing; idleBob/warmth are at-rest ambience only. W12/W13.
- [x] **`--sky` stays prestige-only** (the ledger star-context exception aside, W6). A sky
      backdrop, if a direction uses one, must be built from other tokens, not `--sky`.
      → Winner uses no sky. (Even losing dir-C built its sky from `--night`/`--panel-2`/
      `--bg-wash`, never `--sky`.) W14.
- [x] **Keyboard-first, desktop/laptop only** (ADR 012 ruling 3). Design at ≥1024px /
      1360px; **no mobile or narrow-viewport variants** for this game surface (narrow-window
      handling is assignment 106's separate concern, not this pass's). → Designed/rendered
      1360px; no reflow. W14.
- [x] **Typing view is untouched** — this pass is the factory page only; the typing view's
      zero-ambient-motion calm mandate (ADR 011) is not reopened. → Factory page only.

## Notes

Intake: `company/research/076-playtest-critique.md` (verdict + "blueprint, not place").
Authority: ADR 012 ruling 2 (factory is a WORLD not a panel), ADR 013 (iterate toward the
ultimate experience; the flywheel). Prior design record to grow from, not replace:
`design/DESIGN-FACTORY.md` PART II (W0–W8) and `design/factory-mocks/world-*`. Iteration
map: `research/milestone-factory.md` §10.

Priority 2: this is the headline of the iteration — the specific ADR-013 "ultimate
experience" gap the flywheel's own intake named — but it is high-value enhancement, not a
broken flow or guardrail breach (the milestone is already trustworthy since 102 was
fixed), so it is not priority 1.

Blocks assignment 115 (the build). After this pass delivers, the product-owner firms/cuts
115 against the delivered mock (world-pass precedent: `research/milestone-factory.md` §8,
where the PO cut the build lanes only after the 079 designer pass landed).

## Delivery notes (designer des114, tick #39)

**Status set `needs_verification`** (the file names no terminal state for the designer;
this is a spec to be held against its ACs by a later lane — the PO firms 115 against it).
Deliverables + all six scope caps ticked above with pointers into DESIGN-FACTORY.md PART III.

**Deliverables (paths):**
- Winner mock (the scope reference): `design/factory-mocks/world-C-maquette-place.html`
  (self-contained; `?theme=nachtploeg|snoepfabriek|diepzee` re-tints via the embedded
  `[data-theme]` blocks).
- 4-theme reference renders (the 115 tester verifies the build against these):
  `design/factory-mocks/world-place-winner-{muntpers,nachtploeg,snoepfabriek,diepzee}.png`.
- The two runner-up direction mocks + renders: `place-A-onderdekap.html`,
  `place-C-modelstad.html`; `dir-place-{A,B,C}-muntpers.png` (winner B's competing render is
  `dir-place-B-muntpers.png`).
- Spec: `design/DESIGN-FACTORY.md` — front-matter `place_pass:` block + **PART III (W9–W15)**.
- Screenshot harness (my port 4289 only): `qa-scripts/114-shoot.mjs`.

**Directions considered.** Three genuinely distinct *places*, not decoration-density variants,
each keeping the machines/ledger/ticket/werkbank identical so the comparison was pure backdrop:
A "Onder de Kap" (you walked into a lit factory hall — back window, ceiling beam, hanging
work-lamps); B "De Werktafel" (the diorama is a scale model on a lit maker's drafting desk —
frame, `1:50` tag, ruler, pencil, warm wash); C "De Modelstad" (a district in a model city
under a dusk sky built without `--sky`, blue-line skyline receding into haze).

**Pairwise selection (ranked, not scored).** Independent critic, given both renders and source.
A-vs-B → B; A-vs-C → C; **B-vs-C → B** (the decider). Ranking **1) B  2) C  3) A**.
Winner **B — De Werktafel**. Why B: it is the only direction built on the product's own
confirmed reference (W2's "architect's scale model on a drafting table"), its scale cues
actually *render* (frame + `1:50` + ruler + pencil are unmistakable, unlike A's near-invisible
window), and it is the **most restrained** backdrop — the anti-default win over C, which is the
generic "dusk sky + haze + skyline" any model produces and the busiest of the three.

**What I rejected and why.** (1) **Direction A** — least transformation (its window/beam nearly
vanish in the render, so it reads closest to the bare schematic) and its full walk-in hall
*contradicts* the miniature grammar the plinths/tilted-grid/blue-line-ghosts assert. (2)
**Direction C** — genuinely clever (extends the blue-line "unbuilt" grammar to a skyline) and
honours the `--sky` cap, but it is fundamentally the default move and the closest to
screensaver density. (3) **The winner's literal drafting-lamp fixture** — the critic flagged
it read as an ambiguous streak with a hotspot blowing out one machine; I **dropped the
fixture** and replaced it with a broad, soft, low warm wash (`.warmth`, no hotspot). The frame
+ `1:50` + ruler + pencil carry the concept without it (restraint is the tell). (4) An optional
`Jouw fabriek → Jouw maquette` kick-copy tweak is flagged for the PO but is out of the CSS
build's scope (`strings.js`), and the visuals don't depend on it.

**Motion checklist (summary).** W13 gives the 115/playtest tester a 5-row probe table:
idleBob (5.5/6.4s staggered — machines out of phase, ~4px), warmBreath (8s — must not
strobe), plotGlow (3.4s — soft, not an alert), beltDrift (5.5s ≈ 4px/s — barely-there, no
coins on it), riseIn (380ms one-shot on arrival — must not loop). Plus a reduced-motion
resting-state table: every animation's frozen state is the finished surface (machines
standing, warmth on, plot glowing at mid, belt static, models risen) — nothing motion-only.

**4-theme verification.** Winner rendered in all four themes; every atmosphere element is
token-derived (desk/wash/ruler/pencil/tag/belt) and re-tints for free — Muntpers brass,
Nachtploeg violet, Snoepfabriek hot-pink, Diepzee coral. Token-hygiene grep clean (no raw
rgba/hex in styling; `--sky` only in the ledger star context + prestige tile, never backdrop).
AA preserved by construction: the pass adds no text over the raw backdrop, and `.warmth` sits
`z1` *behind* the machine layer (`z3`) so it cannot lower any label's contrast.

**Reserved id 122 — LAPSED (unused).** No out-of-scope work surfaced; atmosphere, the belt
reconciliation, and the motion checklist were all inside this pass's scope, so no new proposal
was filed. (No `src/**` touched; write surface was `design/**` + this assignment file only.)
