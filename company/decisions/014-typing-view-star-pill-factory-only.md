# ADR 014 — Typing-view pills vs ADR 012 ruling 1: star moves, streak stays

- **Date:** 2026-07-24 (product-owner adjudication of assignment 105).
- **Type:** Product-owner presentation/IA ruling. Interprets and applies **ADR 012
  ruling 1** to two specific pills on the typing view's top bar. Does **not** amend
  ADR 012 (that is the Shareholder's) — it resolves how the ruling's "nothing else
  from the factory world" language lands on the `⭐ rebirths` and `🔥 streak` pills.
- **Decided by:** product-owner (scope authority for presentation/IA within the
  factory milestone; same authority as the FactoryFloor removal, milestone-factory §4,
  and the calm-ink cut, §1a). No CEO escalation — this is inside the milestone mandate.

## Context

Tester t076 (`company/research/076-playtest-critique.md`, filing 105) verified live
that the calm typing view's top bar shows six discrete readouts —
`🔥 streak · ⭐ rebirths · ⚙️ coins/s · 🪙 coins · ×mult · acc%`
(`src/game/GameScreen.jsx` ~310–328; screenshot
`076-screenshots/41-loaded-save-typing-view.png`). ADR 012 ruling 1 states the typing
view "carries only high-level earnings — what the factory earns per second and what
has been earned — **nothing else from the factory world**." The code comment at
GameScreen.jsx ~316–320 (from assignment 083) reasons the earn cluster and
`×mult`/`acc%` against this ADR, but is **silent** on the `⭐` and `🔥` pills — they were
carried over from before the 083 sharpening, not re-affirmed against it.

The tester laid out two readings and asked the PO to adjudicate, treating the two pills
separately.

## Decision

**1. `⭐ rebirths` — MOVE. Remove it from the typing view; keep it single-surfaced on
the factory page.**

The star is the prestige count. Prestige is `🌟 Fabriek verkopen` (sell the factory) —
a purely factory-world action whose reward is a star (+25% on everything). A trophy
earned by a factory-world action is, plainly, "from the factory world"; the
trophy-vs-live-readout distinction does not rescue it, because ADR 012 ruling 1 draws
its line at *origin* ("from the factory world"), not at *update cadence*. This is the
literal reading, and it also matches the milestone's own information architecture:
milestone-factory §3d deliberately routes the "how far I've come" signals — "lifetime +
⭐ stars carried as objective-row context" — to the **factory page**, not the typing
view. The star already renders on the factory ledger (`FactoryPage.jsx` STERREN cell,
assignment 084, when `rebirths > 0`), so moving it loses the stat nowhere; it single-
surfaces it where the design already put "progress." Calmness is the milestone's core
promise, and 076 independently found six readouts "more simultaneous numeric
information than 'calm' evokes" — removing the star serves both the ADR text and that
observation.

The tester's counter — that removing it might weaken a kid's sense of persistent
progress on the calm view — is real but outweighed: the persistent-progress signal is
by design a factory-page signal (§3d), and it survives there intact. The calm view's
job is the live earn loop (coins ticking, payout pops), not a status wall.

**2. `🔥 streak` — KEEP. Documented exception; not factory-world information.**

The streak is a daily-return / typing-habit stat: it counts days the child returned to
type, and it gates the warm-up boost (`boostMultiplier`) that multiplies **typing
earnings** in the current session (the `boost-chip` renders on this same surface). It
is native to the typing/earnings loop, not the factory world — it has no factory-page
home (the ledger is coins/rate/stars; a streak would not belong there). ADR 012 ruling
1's target, in the Shareholder's own words, is the *factory world* crowding the typing
page ("a lot of factory stuff happening around it"); the streak is not that. It is the
closest of the pills to earnings context and the honest place for it is beside the
earnings. Kept as an intentional, reasoned exception so a future tester reading the ADR
against the code finds it already adjudicated rather than re-raising it.

**3. No new issue.** The residual "six readouts feels busy for 'calm'" observation is
already recorded in 076 as critique for the next design iteration (ADR 013 flywheel),
not a defect. Removing the star reduces the bar to five; whether `×mult`/`acc%` density
should be tuned further is a design-pass question, not this ruling. Pre-allocated id
113 is **not used** and lapses.

## Consequences

- **Assignment 105 is re-scoped in place into a developer implementation** (status
  `open`, owner `developer`): remove the `⭐ rebirths` pill from GameScreen.jsx's
  typing-view bar and its now-orphaned `prestige`/`prestigeMultiplier` usage; keep the
  `🔥 streak` pill; update the 083 comment to note the streak exception and star
  removal per this ADR. The star stays on the factory ledger, unchanged. Presentation
  only — no `store.js` / `economy.js` / engine / `theme.js` change; a pre-existing save
  renders identically apart from the removed pill; `npm test` stays green. Full change
  spec and acceptance criteria live in `company/assignments/105-*.md`.
- `.star-pill` CSS and the `play.stars` string are **shared** (App.jsx home-screen
  `⭐ big`, share card) and are **not** removed.
- **Standing rule for this bar going forward:** a pill belongs on the typing view only
  if it is high-level earnings (per-second / earned-total) or native to the
  typing/daily-return loop. Factory-world stats (levels, machines, stars, upgrades,
  prestige) live on the factory page. Apply this before adding any future pill.
