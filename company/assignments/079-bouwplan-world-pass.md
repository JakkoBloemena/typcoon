---
id: 079
title: Design deep pass — Het Bouwplan as a full tycoon world (keyboard-first)
owner: designer
status: needs_verification
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

### Delivery notes (designer, design/079, tick #28)

**Doc.** `design/DESIGN-FACTORY.md` gets a new front-matter `world_pass:` block and a
clearly-marked **PART II — WORLD PASS** appended after the intact §0–§11 history (PART II
wins where it conflicts with §5a/§5b/§9; base token/type/theme system unchanged, **zero new
`:root` tokens**). Sections: W0 why · W1 three directions + pairwise selection · W2 winner
spec (diorama floor / machine states / **placement RULE** / ledger=070 / build ticket /
werkbank=080) · W3 atmosphere & motion (allowed-on-factory vs banned-on-typing, arrival +
ambient + build moments, reduced-motion fallback, **073 chip re-spec**) · W4 typing-strip
earnings-first · W5 edge states · W6 token/theme discipline · W7 reuse-vs-replace + build
delta + slices · W8 guardrails.

**Mocks** (`design/factory-mocks/`, rendered at 1360px via Playwright and looked at; every
colour a `var(--token)` or `color-mix()` OF a token — grep-clean of themable hex/rgba, only
`#000` inside a `mask:` alpha stencil, same as shipped game.css):
- `world-C-maquette.html` (+ `.png`) — **WINNER**: the factory as a diorama floor you look
  across. Built machines stand up off the plan (plinths, cast shadows, running); next = a
  glowing brass foundation plot; locked = flat blue-line ghosts receding to a horizon.
  Ledger (coin/rate/star) top-right, BOUWBON build ticket + werkbank below.
- `world-typing-strip.html` (+ `.png`) — earnings-first typing view (rate+total primary,
  ×mult/acc% secondary, **goal sliver removed**, three chips as one-shot).
- `world-states.html` (+ `.png`) — empty / loading / offline / long-text for the world.
- `world-A-werkvloer.html`, `world-B-skyline.html` (+ `.png`) — the two losing directions
  (isometric hall; growing cross-section) with their costs noted in-file.

**Selection.** Independent critic (pairwise, ranked not scored, both render + source) →
**1) C  2) B  3) A.** A (iso hall) abandons the confirmed Bouwplan metaphor (ADR 012 ruling
2) and its immersion isn't even present in the render; B (skyline tower) drifts to a
scroll-hungry stacked list off the confirmed direction; C grows the Bouwplan into a place
via near/far depth. Critic's one open flag — placement was hand-tuned percentages — is
answered in W2c (a depth-lane placement rule + a roster-growth rule).

**Decisions a verifier should challenge:**
1. **Goal sliver REMOVED from the typing view** (not just demoted) — boldest reading of
   ruling 1. Alt + cheapest re-add flagged in W4 if 076 finds the thread feels severed.
2. **Offline banner moved OFF `--sky`** onto a neutral `--panel` + `--mint-deep` accent —
   corrects §9's "sky-blue banner" to keep `--sky` prestige-only. Calm, not alarm.
3. **Ambient machine life is "at rest", not producing coins** — deliberate, to keep
   guardrail 2 (no idle income; typing is the only faucet) true on a page where you're not
   typing.
4. **Glows use `color-mix()` over a token, not raw rgba** — a discipline tightening over
   074's raw-rgba glows so themes carry the glow.
5. **Ledger star = the one non-prestige `--sky`** (rebirth count is prestige context).

**Folded-in defects:** 070 (coin balance) → the ledger surfaces raw `tycoon.coins` (W2d).
080 (`Precisiegereedschap` mid-word break) → `hyphens:auto` over `overflow-wrap:anywhere`
(W2f). Both should be cut with the world work, not separately.

**Build-delta headline (PO):** 074's handlers + state logic are all reused; only the surface
is re-skinned into a diorama, plus 070/080 fixes and the earnings-only typing strip (which
also lands the 073 calm-motion fix). Six presentation-only slices; slices 1–2 (typing strip,
ledger) are small and each close an open defect on their own. No economy/engine/store/theme
change; `npm test` stays green.

**Scope/guardrails.** Touched only `design/**` + this assignment file. No `src/**` edits.
No `public/**`/`sitemap.xml` churn (no build/test run). `playwright-core` installed
`--no-save` (node_modules gitignored; package.json untouched); render harness deleted, not
committed. No 083 proposed — the follow-ups (goal-thread playtest, ambient-life QA) are
already owned by 076's flywheel intake.
