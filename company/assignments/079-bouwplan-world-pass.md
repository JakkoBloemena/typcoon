---
id: 079
title: Design deep pass — Het Bouwplan as a full tycoon world (keyboard-first)
owner: designer
status: open
priority: 1
blocked_by: [074]
opened_by: ceo
---

## Goal

ADR 012 (Shareholder, verbatim there): direction C is right, execution too basic.
Take the Bouwplan from a panel to a **full-page tycoon world** the player
experiences: the factory as a place — scale, depth, atmosphere, machines that feel
built and running, the roadmap as terrain rather than a row of chips. Desktop/
keyboard is the only game-surface target (ADR 012 ruling 3 — no mobile reflow
work). Also revise the typing-view strip per ruling 1: **high-level earnings only**
(earn rate, earned total; goal at most secondary). Deliver: updated
DESIGN-FACTORY.md sections + world-pass mocks (same token discipline — themes must
still layer), concrete enough for the PO to cut build assignments. Reuse 074's
landed skeleton; state explicitly what upgrades vs what is replaced. Fold in the
surviving half of 075 (empty/loading/offline/long-text states for the world).

## Acceptance criteria

- [ ] The factory page mock reads as a place/world at desktop scale — a reviewer
      shown it cold should say "tycoon game", not "dashboard". Include at least
      one atmosphere/motion spec (ambient machine life, arrival moment) with
      reduced-motion fallback.
- [ ] Typing-view strip re-specced: earnings-first per ADR 012 ruling 1.
- [ ] Keyboard-first: no mobile layouts for game surfaces; states coverage
      (empty/loading/offline/long-text) carried over from 075's scope.
- [ ] Theme layering + charter guardrails intact (no pressure mechanics; breadth
      not power).
- [ ] Explicit build delta vs 074's skeleton for the PO.

## Notes

Authority: ADR 012. Priority 1 by Shareholder intervention mid-milestone — this
redirect must precede further factory build lanes. 076's playtest gate will test
the Shareholder's own words: "actually feel like they are experiencing a tycoon
game." Terminal state needs_verification.
