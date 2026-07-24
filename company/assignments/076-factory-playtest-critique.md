---
id: 076
title: Milestone gate — playtest-critique the factory experience (kid + parent)
owner: tester
status: open
priority: 2
blocked_by: [072, 073, 074, 075]
opened_by: product-owner
---

## Goal

The milestone gate. Play the **whole** factory experience end to end and critique its
**experience quality**, not just its correctness — the standing product-ambition check
ADR-011 mandates ("every milestone review must include a product-ambition check sourced
from *using the product*, not the plan's checkboxes"). Authority: decisions/011 (CEO
accountability note), scope `research/milestone-factory.md` §6/§7. This assignment
**subsumes** the designer's proposed playtest pass (067 delivery note (c)) — it is not
opened separately.

Play the full loop twice, with a real save (not a fresh one only):
- **As a kid (8–12):** type → earn → watch the goal sliver fill → go to the factory →
  see the roadmap grow → build the next machine → return to typing. Judge: is the typing
  view genuinely **calm** (does removing the FactoryFloor leave it feeling alive or dead?)?
  Is the **next goal obvious** at every moment on both surfaces? Does the factory feel like
  it is **growing** ("my factory is growing")? Can the child tell **what to build next** and
  roughly how close they are, without adult help?
- **As a parent:** does the experience read as **trustworthy** — no pressure, no
  countdowns, no dark patterns, breadth-not-power monetization (locked stations route to the
  parent gate)? Would a parent see proof of learning, not a manipulative game?

## Acceptance criteria

- [ ] A written critique covering both playthroughs (kid + parent), judging experience
      quality against ADR-011's ambition: calm-while-typing, excitement-in-factory, "my
      factory is growing" legibility, and goal clarity — with concrete observations, not a
      pass/fail checklist.
- [ ] **Save-compat confirmed on a real pre-existing save:** load a mid-game save captured
      before the milestone and verify every machine/level/coin/star the player owned is
      present and correct on **both** surfaces. Nothing a kid owns is lost.
- [ ] Guardrails verified in the running product: no timers/countdowns/pressure, no dark
      patterns, locked breadth routes to the parent-gated unlock, typing stays the only
      faucet.
- [ ] Any defect found is filed as its own assignment with a reproduction and an
      impact-based priority (broken core flow = 1, cosmetic = 4), per PROTOCOL.
- [ ] A verdict: does the milestone land the Shareholder's direction, or does it need
      another pass? If the calm typing view reads as **dead** (earn signal insufficient) or
      the factory does not read as **growing/exciting**, say so plainly — that is the
      product-ambition failure this gate exists to catch.

## Notes

This is a critique gate, not a correctness pass — correctness of each surface is verified
when its own assignment (071–075) is flipped `done`. Do not verify any assignment whose
code you wrote. Terminal state: this assignment is `done` when the critique + verdict are
delivered and any defects are filed. Scope: `research/milestone-factory.md`.
