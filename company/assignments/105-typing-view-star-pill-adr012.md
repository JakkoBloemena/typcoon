---
id: 105
title: Typing-view star (⭐ rebirths) pill is factory-world info beyond "earnings only" — ADR 012 ruling 1 fidelity gap
owner: product-owner
status: open
priority: 3
blocked_by: []
opened_by: tester (t076, playtest-critique gate, verified live in the running product)
---

## Goal

Reproduced live (`company/assignments/076-screenshots/41-loaded-save-typing-view.png`,
any save with `tycoon.rebirths > 0`): the typing view's top bar shows, left to right,
`🔥 streak`, `⭐ rebirths`, `⚙️ coins/s`, `🪙 coins`, then a second row `×mult` / `acc%`.

ADR 012 ruling 1 (`company/decisions/012-tycoon-world-direction.md`) is explicit and
quoted verbatim in `src/game/GameScreen.jsx`'s own comment above this bar (lines
~316-320): *"the earnings cluster — earn rate + earned total — is the PRIMARY readout
on the typing view... ×mult/acc% stay as smaller, quieter secondary 'lever' feedback."*
The ADR itself says: *"the typing view carries only high-level earnings — what the
factory earns per second and what has been earned — **nothing else** from the factory
world."*

The `⭐ rebirths` star pill (`GameScreen.jsx` line 314) is exactly that: a factory-world
stat (prestige/rebirth count) that is neither "earn rate" nor "earned total." It
predates 083/the ADR-012 sharpening (rebirths existed before this milestone) and appears
not to have been re-examined against the newly-sharpened "nothing else" bar when 083
rebuilt this bar — the code comment carefully justifies keeping `×mult`/`acc%` against
the ADR, but is silent on the star pill, suggesting it was carried over rather than
deliberately re-affirmed.

This is a judgment call, not a clear-cut bug — a star badge could reasonably be read as
a "trophy" rather than a live factory readout, and the streak flame (🔥, a daily-return
stat, arguably not "factory world" at all) is a separate, more defensible case. Filing
this to the product-owner rather than as a straight developer defect, since it's a
scope/fidelity question the PO should adjudicate (keep as an intentional exception and
document why, or fold it into the factory-only surface) rather than a clear
implementation error a developer should just "fix."

## Acceptance criteria

- [ ] Product-owner reviews whether the `⭐ rebirths` (and optionally `🔥 streak`) pill(s)
      on the typing view's bar are an intentional, documented exception to ADR 012
      ruling 1's "nothing else from the factory world" language, or should move
      factory-only.
- [ ] Whichever way it's decided, the decision and reasoning are recorded (a short note
      in `research/milestone-factory.md` or a new decision file) so a future tester
      doesn't re-raise the same question against the same ADR text.
- [ ] If moved: the star (and/or streak) pill is removed from `GameScreen.jsx`'s bar and
      relocated to (or left exclusively on) the factory page's ledger, where it already
      appears (`FactoryPage.jsx`'s `.ledger` "STERREN" cell) — no loss of the stat
      anywhere, just single-surfaced per the ADR's earnings-only typing view.
- [ ] No save-shape/economy change either way — this is presentation/IA only.

## Notes

Spec: `company/decisions/012-tycoon-world-direction.md` ruling 1. Code:
`src/game/GameScreen.jsx` lines 310-328 (the full bar, comment at 316-320 explicitly
reasons about `×mult`/`acc%` against this ADR but not about the star/streak pills).
This is a lower-confidence, judgment-call finding relative to 102/103 — flagged
honestly as such per the tester's mandate to surface everything worth a second look,
not just clear-cut bugs.
