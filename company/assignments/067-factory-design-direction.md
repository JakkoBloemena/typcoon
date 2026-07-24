---
id: 067
title: Design direction — factory page + calm typing view (first designer dispatch)
owner: designer
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Shareholder direction (decisions/011, verbatim there): the current play experience —
typing surrounded by factory activity — reads as basic and distracting. Design the
split: a **separate factory/management page** (upgrades, stats, visible progress,
clear goals — the exciting "my factory is growing" surface) and a **calm typing
view** (typing as the focused work surface, minimal ornament, the reward loop
visible but not shouting). Produce 2–3 genuinely competing visual directions
(not variants of one idea), select by pairwise comparison against: kid appeal
(8–12), parent trust, calm-while-typing, excitement-in-factory, and feasibility on
the existing CSS-token/React stack. Deliver: the chosen direction as concrete
tokens (color/type/spacing/motion), layout structure for both surfaces, and
annotated mocks or HTML sketches the PO can scope against. Respect the existing
theme system (051/052) — directions must state how themes layer on.

## Acceptance criteria

- [x] 2–3 competing directions documented with honest tradeoffs; selection made by
      stated pairwise criteria, not taste alone.
- [x] Chosen direction delivers: token set, both-surface layout specs, and the
      goal/progress model made visually concrete (what a kid sees as "my next
      goal" and "how far I've come").
- [x] Charter guardrails respected in the design: no pressure mechanics, no
      dark patterns, breadth-not-power monetization surfaces unchanged in intent.
- [x] Explicitly states what of the current UI survives (reuse over rebuild where
      honest) and what is replaced.
- [x] Written to design/ (DESIGN-FACTORY.md + assets), referenced from the
      existing DESIGN.md.

## Notes

Authority: decisions/011. This is typcoon's first designer dispatch — the adoption
skipped design-first and this feedback is the bill (011's accountability note).
Terminal state needs_verification (PO or tester reviews against criteria).

## Delivery notes (designer, 2026-07-24, branch design/067)

**Deliverable:** `design/DESIGN-FACTORY.md` (front matter = machine-readable 067 tokens;
body = directions, pairwise selection, winner spec, goal/progress model, reuse-vs-replace,
theme layering, state verification) + self-contained HTML mocks and renders in
`design/factory-mocks/`. Referenced from the root `DESIGN.md` (new section before
"Wat bewust NIET").

**Chosen direction:** **C — "Het Bouwplan"** (a blueprint roadmap you fill in). Selected
by an independent critic comparing head-to-head in pairs (A vs B → B, A vs C → C, B vs C
→ C) with both source + renders, ranked not scored. C best embodies "my factory is
growing" (the filled path *is* the progress) and answers the Shareholder's exact words
("clear goals / see how it's going"); its cost is a heavier-but-bounded mobile roadmap,
paid once.

**Per AC:**
1. 2–3 competing directions with honest tradeoffs + pairwise selection — DONE (§2–3;
   A "Twee Kamers", B "Werkblad & Lade", C "Het Bouwplan"; critic verdict recorded).
2. Winner delivers token set (§4, front matter), both-surface layouts (§5), and the
   goal/progress model made concrete (§6: "next goal" computed + shown twice; "how far
   I've come" = filled roadmap + "N van 5 gebouwd") — DONE.
3. Charter guardrails respected (§10): no pressure/timers, no dark patterns, breadth-
   not-power unlock intent unchanged — DONE.
4. Explicit reuse-vs-replace (§7): tokens/theme/TypingSurface/economy reused;
   shop+wallet relocated; `FactoryFloor` + in-typing meters removed (with a CEO
   escalation note since removing the always-on floor changes the per-second view) —
   DONE.
5. Written to design/ + referenced from DESIGN.md — DONE.

**Not blocking / flagged:** (a) DesignSync/Claude Design publish needs interactive OAuth,
unavailable in this tick — the committed `design/` files are the deliverable (standing
Shareholder ask). (b) Removing `FactoryFloor` from the typing view is inside the ADR-011
"typing becomes calm" mandate (no economy/learning change), but if the PO reads the
animated floor as a feature worth keeping, that is a CEO scope call — raise in 068.
(c) Proposed follow-up left for the dispatcher (id 071 reserved): a tester/playtest pass
on the shipped split once 068 builds it, checking the calm-vs-exciting split lands with a
real 8–12 kid.

Scratch tooling committed alongside (repo convention): `qa-scripts/design-067-before.mjs`,
`design-067-shoot.mjs`, `design-067-shoot-winner.mjs`.

## Verification (tester, 2026-07-24)

Independently verified in worktree `v067` (branch `verify/067`), all 5 acceptance
criteria against the actual artifacts — not the delivery notes' word.

**AC1 (2–3 competing directions, pairwise selection).** Read `design/DESIGN-FACTORY.md`
§2–3 in full. Rendered all three source mocks (`dir-A-tworooms.html`,
`dir-B-ledger.html`, `dir-C-blueprint.html`) at desktop + mobile with a fresh
Playwright/Chromium pass (`qa-scripts/tester-067-shoot.mjs`, served on port 4222,
screenshots in `qa-out/` — not committed, scratch only). Confirmed the three are
genuinely different concepts (hard tab-switch dashboard / ambient rail + drawer /
blueprint roadmap), not skins of one idea, and each has a stated `+`/`–` tradeoff.
Pairwise verdicts (A vs B → B, A vs C → C, B vs C → C) are recorded with reasoning
tied to named criteria (kid appeal, legible growth, feasibility), not bare taste. PASS.

**AC2 (token set, both-surface layouts, goal/progress model).** Front matter
(`new_tokens`) plus §4 spell out spacing scale, the new `--data` type role, and the
`--goal`/`--reward` semantic aliases. §5a/5b give concrete layout structure for both
the typing view and factory page. Rendered `dir-C-blueprint.html` and
`dir-C-states.html` — the goal sliver, spotlit goal panel, roadmap with built/current/
ghost station states, and "3 van 5 gebouwd" progress tag all render exactly as
specified, at desktop and mobile, including the empty/long-text/loading/offline states
in §9. PASS.

**AC3 (charter guardrails).** §10 explicitly maps guardrails 2/3 to design decisions
(no timers/countdowns, effort estimate is encouragement not pressure, locked stations
route to the existing parent-gated unlock and gate breadth not power). Spot-checked
the parent math-gate claim against `src/game/Unlock.jsx` (`step === 'gate'` /
`gate-q` flow) — exists as described. No dark pattern or pressure mechanic found in
any of the three rendered directions. PASS.

**AC4 (reuse vs replace).** §7's claims checked against `src/` directly, not taken on
faith: `FactoryFloor.jsx` exists and is rendered unconditionally in `GameScreen.jsx`
(confirms it is a real removal candidate, not a strawman); `ui/TypingSurface.jsx`
exists; `economy.js` exports `BUILDINGS`/`UPGRADES`/`buyBuilding`/`buyUpgrade`, and
`GameScreen.jsx` wraps them in local `buy`/`buyUpg`/`doRebirth`/`BuyButton` exactly as
named in the doc; `.meters` exists in `game.css`; `theme.js`/`ThemePicker.jsx` exist;
`test/theme.test.js` exists (the claimed economy-parity guard). The CEO-escalation
note on `FactoryFloor` removal is present and appropriately framed as a scope
question for 068, not a quiet decision. PASS.

**AC5 (written to design/, referenced from DESIGN.md).** `design/DESIGN-FACTORY.md`
and `design/factory-mocks/` (14 files: 3 source HTML directions + states HTML + 9
PNG renders + `_base.css`) exist and are committed. `DESIGN.md` lines 129–139 add a
new section linking both, placed before "Wat bewust NIET" as claimed. PASS.

**Beyond the criteria.** Rendered `before-play-{desktop,mobile}.png` (real screenshots
of the live product, not mocks) and confirmed they substantiate the doc's framing of
today's problem — mobile genuinely scrolls past wallet, animated floor, and two meter
cards before the typing sentence. Computed WCAG contrast for the one genuinely new
(non-aliased) color, `--calm-ink` (#c7d2f2) against `--panel`/`--night`: 9.68:1 and
11.26:1, both comfortably over AA — no accessibility gap despite 052's contrast
discipline not being re-run for this one new token. Found no functional defects, no
guardrail violations in any corner case checked (empty state, long-Dutch-text
overflow, offline banner tone, mobile reflow); filed no 069/070 assignments.

**For the PO scoping 068:** the FactoryFloor-removal escalation in §7/§11 is real and
correctly flagged, not a triviality — `FactoryFloor.jsx` is currently the only
per-second animated feedback while typing, and removing it is a legitimate "is this a
beloved feature" product call, not something the design doc should have silently
decided. Adjudicate it explicitly in 068 rather than letting the build order (§11
step 2) default to removal. Everything else in the design direction is safe to scope
against as-is.

**Verdict: all 5 acceptance criteria PASS. Status set to `done`.**
