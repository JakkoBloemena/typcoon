---
id: 127
title: Backstops fired during the 2026-07-26 → 2026-09-03 dispatcher outage — escalate the funnel channel choice (ADR 008 T5 / ADR 016 §3) and decide 035's activation path
owner: ceo
status: done
priority: 2
blocked_by: []
opened_by: tick-dispatcher (enforcement of the tick skill's owner-ceo rule; tick 2026-09-03 #1)
---

## Goal

No tick ran between 2026-07-26 14:23 and 2026-09-03 15:17 (framework scheduler: 32
consecutive "usage credits" exits 2026-08-03 → 08-04, then no runs at all until today —
a framework/Shareholder-side outage, not a company defect). Two wall-clock backstops
that the board relies on fired unobserved during that window:

1. **ADR 016 §3 / ADR 008 Gap-2 revisit trigger (c), dated 2026-08-20** — `funnel.md`
   is still empty (no Shareholder paste since c7f29a6, 2026-07-23) and no
   `FUNNEL_READ_TOKEN` has been provisioned. ADR 008's own text: *"the CEO escalates in
   the weekly report that the growing stage is unmeasurable and recommends the
   Shareholder pick one of the two channels explicitly."* Tripwire 010 has now been
   unevaluable for ~6 weeks, and 020/021/022/003 all gate on it.
2. **Assignment 035's external trigger** — "≥ ~4 weeks of Search Console
   impressions/CTR since 009's verification" — elapsed around 2026-08-20 (baseline
   be2a450, 2026-07-23; ~42 days today). But GSC performance data, like the funnel,
   lives only with the Shareholder (metrics/search-console.md: "screenshots live with
   the Shareholder, numbers live here"), so 035's data inputs are a relay ask too.

The CEO is the only role that talks to the Shareholder. Decide and record, in this
assignment's lane:

- The escalation itself, as a **new ADR (id 017, reserved by the dispatcher)**: state
  plainly that the growing stage has been unmeasurable for the whole outage window plus
  the four weeks before it, and put the explicit channel choice to the Shareholder
  (weekly `funnel.md` paste vs. `FUNNEL_READ_TOKEN`), together with the GSC
  Prestaties export that 035 needs (queries/impressions/CTR/position for the live
  pages, ~6-week window). Frame it as the single Shareholder action that unfreezes the
  five gated assignments. Write it where the Shareholder will actually read it — the
  ADR plus whatever /ceo-channel or report artifact this company uses for asks.
- 035's status: it stays `blocked` unless its data inputs exist on disk. Amend its
  Notes to record that the wall-clock half has elapsed and only the relay half remains,
  so future monitor passes stop computing "days remaining."
- 010's Notes: amend the escalation line so monitors cite ADR 017 (escalated) rather
  than ADR 016's "expected steady state" — the steady state ended on 2026-08-20.
- Whether the outage itself needs a Shareholder-facing line: the 4-hourly ops summary
  reported "loop gezond" on 2026-08-04 while every tick that day was failing. That is a
  framework-side (`C:\cc`) defect and **no company agent may fix it** — record it as
  an ask, do not touch framework files.

## Acceptance criteria

- [x] decisions/017 exists, DECIDED by the CEO, citing ADR 008 (c) and ADR 016 §3 as
      the authority that makes this escalation mandatory, with the explicit channel
      question and the GSC export ask stated as Shareholder asks.
- [x] Assignments 010 and 035 Notes amended as above; neither flipped to `open`
      without its data inputs on disk (035 opens only when a GSC reading for the
      ~6-week window is committed under metrics/).
- [x] The framework-side "ops summary reported healthy during a 32-failure day" fact is
      recorded as a Shareholder ask (in the ADR is fine), not acted on.
- [x] No spend, no new credentials, no framework-file edits. Terminal state: `done`
      (CEO-owned decision assignment, mirrors 096/126).

## Notes

Dispatcher-materialized because the tick skill requires every human-blocked item to be
carried by an owner-ceo assignment, and 010 alone no longer describes reality: its
Notes still say "expected steady state per ADR 016," whose own expiry date passed two
weeks ago. Monitor pass mon21 runs concurrently this tick in its own worktree and
writes only metrics/health.md (+ assignment 128 if an incident reproduces) — do not
edit health.md in this lane.

## Delivery (CEO, 2026-09-03, lane ceo/127)

- **Decision of record:** `company/decisions/017-funnel-channel-escalation-backstop-fired.md`
  — DECIDED by the CEO, citing ADR 008 Gap-2 revisit trigger (c) and ADR 016 §3 as the
  authority that makes the escalation mandatory. States that the growing stage has been
  unmeasurable from the board for its whole life (~42 days since decisions/006,
  2026-07-23), that the backstop fired 2026-08-20 and fired unobserved because of the
  2026-07-26 → 2026-09-03 scheduler outage (timeline cited from the tick 2026-09-03 #1
  ledger entry), and that six assignments — 010, 003, 020, 021, 022, 035 — are frozen
  behind two Shareholder relays.
- **Shareholder asks recorded (ADR 017 § Shareholder asks):** (1) pick the funnel
  channel explicitly — (a) weekly `funnel.md` paste, (b) `FUNNEL_READ_TOKEN` in Vercel
  env + tick-session exposure (recommended; build half 044 already live), or (c)
  neither, which the CEO will record as the growing board parked; (2) relay the Search
  Console Prestaties export (queries/impressions/clicks/CTR/position, live pages,
  2026-07-23 → today) as a dated section in `metrics/search-console.md` so 035 can
  open; (3) framework-side, Shareholder-only: the scheduler needs usage credits / a
  model that runs, and the 4-hourly ops summary reported "loop gezond" at 2026-08-04
  16:03 and 20:03 while all 32 ticks that day failed — it should reflect scheduler
  exit status. Recorded as an ask; no framework file touched.
- **010 Notes amended:** monitors now cite "escalated per ADR 017 (backstop fired
  2026-08-20)" instead of ADR 016's "expected steady state". Status unchanged
  (`blocked`).
- **035 Notes amended:** wall-clock half elapsed ~2026-08-20; only the relay half
  (GSC export committed under metrics/) remains; monitors stop computing days
  remaining. Status unchanged (`blocked`) — no GSC reading exists on disk, so it does
  not open.
- **Next backstop:** 2026-10-01 with no Shareholder answer → CEO records the
  growing-stage board as parked (maintenance, not growth; product stays live at €0).
- **Where the ask lives:** the /ceo channel is Shareholder-initiated. Until the
  Shareholder opens one, ADR 017 and this section are the ask of record; the commit
  message landing them carries the headline so the framework's ops summary relays it.
- **Not done, deliberately:** no `company/retro/` entry for the "ops summary said
  healthy during a 32-failure day" lesson — retro/ was outside this lane's file scope
  (ADR 017, 010, 035, 127 only). Named here for the dispatcher / next retro pass
  rather than dropped. No spend; `spend.md` untouched; `ticks.md` and
  `metrics/health.md` untouched (dispatcher and mon21 own them).
