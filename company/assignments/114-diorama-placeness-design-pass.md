---
id: 114
title: "Designer: \"From blueprint to place\" — atmosphere/place-ness design pass for the Maquette diorama (076 critique intake)"
owner: designer
status: open
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

- [ ] **At least two genuinely distinct atmosphere directions**, built as real,
      font-loaded HTML on the shipped `_base.css` token layer and **rendered at desktop
      scale** (≥1024px, designed 1360px) — same method as the 067/079 passes. They must
      differ in the *place* concept (e.g. "a warehouse you look into" vs "a workshop on a
      lit workbench" vs "a model-city under a sky"), not merely in decoration density.
- [ ] **A pairwise, ranked-not-scored selection** (PROTOCOL §3) naming a winner and saying
      plainly why, judged against the critique's "does it read as a place?" bar and the
      pinned Muntpers look. Flattery is a defect (ADR 013).
- [ ] **A DESIGN-FACTORY.md addendum** (a new PART III / W-series section, appended — do
      not rewrite PART II) specifying the winner: the backdrop/atmosphere layers, how depth
      and scale are conveyed, what ambient dressing exists and where, and how each element
      degrades to a **finished still resting state** under `prefers-reduced-motion`.
- [ ] **The decorative belt (assignment 091) is reconciled into the atmosphere**, not left
      as an orphan element on a bare floor. State where the belt sits in the winning
      direction so 091 builds it onto the finished backdrop coherently.
- [ ] **A live-verifiable motion checklist.** The 076 critique could not judge felt motion
      quality from stills. The spec must list each ambient/atmosphere motion with its
      intended *felt* read (e.g. "belt: barely-there drift, reads alive-at-rest, never
      draws the eye") so the next playtest tester can confirm it **in the running app**,
      not guess from a screenshot.

## Hard scope caps (scope-down — record these IN the spec so the build cannot over-reach)

- [ ] **Zero new `:root` tokens.** The whole world is still built from the existing set +
      the two 067 aliases (`--goal`, `--reward`). A `[data-theme]` swap must recolour every
      new atmosphere element for free. Tints/glows use `color-mix(in srgb, var(--token) N%,
      transparent)`, never raw `rgba()`/hex (W6 discipline).
- [ ] **No real weather/day-night/time engine and no crowd simulation.** The genre
      benchmark is a *quality comparison*, not a feature order. Atmosphere is achieved with
      CSS on the token layer (gradients, layered backdrops, parallax-on-arrival, ambient
      restraint) — a static-but-rich *sense* of place, not a simulation. If a direction
      needs a runtime system, an asset pipeline, or spend, it is out of bounds — say so and
      pick a direction that does not.
- [ ] **Guardrail 2 (no idle income) is visible in the motion.** Ambient life is *at rest*
      — machines/dressing never spout, carry, or imply coins; typing stays the only faucet.
- [ ] **`--sky` stays prestige-only** (the ledger star-context exception aside, W6). A sky
      backdrop, if a direction uses one, must be built from other tokens, not `--sky`.
- [ ] **Keyboard-first, desktop/laptop only** (ADR 012 ruling 3). Design at ≥1024px /
      1360px; **no mobile or narrow-viewport variants** for this game surface (narrow-window
      handling is assignment 106's separate concern, not this pass's).
- [ ] **Typing view is untouched** — this pass is the factory page only; the typing view's
      zero-ambient-motion calm mandate (ADR 011) is not reopened.

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
