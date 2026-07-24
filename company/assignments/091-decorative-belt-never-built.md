---
id: 091
title: Decorative belt (beltDrift) named in W3 and the world-C mock was never built — zero .belt markup anywhere
owner: developer
status: in_progress
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

- [ ] A `.belt` element (or equivalent) is added to the diorama floor (`Shop.jsx`),
      positioned between/near built machines per the mock's placement idiom, using a
      rule-based position (not a hardcoded per-machine constant) consistent with
      `layoutDiorama`'s existing approach.
- [ ] The belt plays a slow `beltDrift`-style animation (`background-position` drift,
      per the mock's `@keyframes beltDrift { to { background-position: 20px 0 } }`
      idiom) — restrained, ambient, consistent with W3's "restraint is the tell" framing.
- [ ] The belt **never** carries or implies coins — no coin glyph, no `.coin` element, no
      property animation beyond opacity/transform/background-position (same guardrail-2
      test 086 already established for every other ambient element on this page).
- [ ] Reduced-motion: the belt's resting state is a static rail (no residual mid-drift
      artifact), consistent with the reduced-motion idiom 086 established for
      `idleBob`/`plotGlow`/`riseIn`.
- [ ] Token discipline: zero new `:root` tokens; colors via existing tokens/`color-mix`,
      matching the established idiom.
- [ ] Save-compat: `store.js`, `economy.js`, `src/engine/`, `theme.js`, `goals.js`
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
