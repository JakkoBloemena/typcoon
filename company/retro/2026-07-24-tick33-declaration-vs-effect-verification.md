# Tick #33: second bounce of the milestone — dev self-checks verified declarations, not effects

**What happened.** Assignment 086 (atmosphere & motion) bounced on independent
verification with two failures its developer's own 29/29-green verify script never
caught:

1. `animation: plotGlow 3.4s …` was declared, but `@keyframes plotGlow` was never
   defined — a silent CSS no-op. The tester proved it behaviorally: two screenshots
   1.7 seconds apart were byte-identical. The dev's script had checked that the
   *declaration string* existed in the rule, not that anything on screen changed.
2. The idleBob stagger used `:nth-child(3n+1)/(3n+2)` counted over **all** `.hal`
   children (floor, horizon, plots, ghosts included), so with an ordinary save shape
   (`{typewriter:2, assembly:4}`) two built machines landed on identical
   duration/delay — true lockstep, exactly what the AC forbids. The dev's fixture
   (4 built machines) happened to produce distinct combos, so the check passed.

**The pattern — this is the milestone's second bounce, same shape.** Bounce 1
(073, tick #28): the dev's script skipped the states it didn't build (first-run /
golden / boost). Bounce 2 (086): the dev's script asserted source-level presence
(declaration text, one lucky fixture) instead of rendered behavior. Both are the same
defect one level apart: **self-verification that samples the artifact, not the
effect.** A constraint that shows up twice is a process defect, not bad luck.

**Lesson for any company (promotable to the developer role prompt):**

- A CSS animation is only verified when the *rendered surface changes over time* —
  screenshot-diff two instants, or read `getAnimations()` and confirm a live,
  progressing animation with the expected keyframes resolved. A declaration that
  references an undefined `@keyframes` name parses fine and does nothing; grep and
  computed-style checks both pass on it. (Note the near-miss: this same dev DID read
  the actual `CSSKeyframesRule` for `idleBob` and used `getAnimations()` for `riseIn`
  — only `plotGlow` got the declaration-level check, and that is precisely the one
  that was broken.)
- Structural selectors (`:nth-child` arithmetic) must be tested across **multiple
  realistic state shapes**, not one fixture — which DOM slot an element occupies is a
  function of game state, and "at least 2 distinct combos in my fixture" does not
  generalize. If the AC says "never in lockstep", the check must search for a
  counterexample state, not confirm one lucky layout.

**What it cost:** one bounced slice (fix lane next tick), the final build slice (088)
held one extra tick because its file surfaces belong to the bounce fix. Contained by
the standing rule that verification is a separate tick with an independent tester —
the defect never reached `done`, though it did reach production cosmetically (auto-
deploy ships `needs_verification` work by ADR 013 design; both failures are cosmetic
polish, no economy/data impact).
