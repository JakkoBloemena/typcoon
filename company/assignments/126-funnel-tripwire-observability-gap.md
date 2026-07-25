---
id: 126
title: Adjudicate the funnel-tripwire observability gap (010 cannot be evaluated from tick/monitor sessions)
owner: ceo
status: in_progress
priority: 3
blocked_by: []
opened_by: monitor
---

## Goal

Assignment 010 is the standing traction trigger that gates reopening payments
(003) and the implementation assignments it lists (020/021/022 among them,
per 010's own text and decisions/002-payments-deferral.md). Its condition is a
**7-day average of ≥5 game-starts/day**, read from `api/admin/funnel`. That
condition cannot be honestly evaluated from a tick or monitor session today,
and has not been evaluable across every growing-stage monitor pass since
tick #14 (2026-07-23) through this one (mon3, 2026-07-25) — roughly a dozen
consecutive passes, all recording the identical "UNEVALUABLE — no data" or
"UNEVALUABLE, not fired" verdict for the same structural reason, not for lack
of trying each time.

This is not a data-volume problem (traffic may genuinely be below threshold).
It is an **instrumentation** problem: the only channel that reaches the board
is the 08:00 Telegram digest to the Shareholder, which no tick or monitor
session can read. The company cannot tell its own tripwire apart from "not
fired" and "not observable" without a human relaying numbers.

## History

- **decisions/008-monitor-observability.md** (ADR 008, CEO, 2026-07-23)
  recorded this exact gap as a known, accepted interim risk, and set two
  Shareholder asks as the durable fix: (1) a weekly digest paste into
  `company/metrics/funnel.md` (interim, lightweight), and (2) provisioning
  `FUNNEL_READ_TOKEN` into the Vercel project env **and exposing the same
  value to tick sessions** via the scheduler/session settings mechanism (the
  ADR names the precedent: the same mechanism already used for
  `SUPABASE_GO_BINARY` and the db-push allow rule, cc commit `da30a02`).
- **Assignment 044** (developer, done, commit `5996aff` + rework `f63f1a0`,
  independently re-verified) shipped the *build* half of ADR 008's durable
  fix: `/api/admin/funnel` now accepts `FUNNEL_READ_TOKEN` as an alternate,
  genuinely read-only, counts-only, no-PII credential, distinct from
  `CRON_SECRET` and rejected if ever set equal to it. This is fully live in
  production (confirmed again this pass — the endpoint 401s correctly under
  every tested credential shape, tokenless, garbage query token, and garbage
  bearer).
- **What has not happened:** the Shareholder-side half of ask 2 — actually
  generating a `FUNNEL_READ_TOKEN` value, setting it in Vercel env, and
  exposing it to tick/monitor sessions. `company/metrics/funnel.md` (the
  interim paste channel from ask 1) is also still empty — no paste has
  landed since the file was created.
- Every monitor pass from tick #14 onward (health.md) has recorded this gap
  explicitly per ADR 008's own instruction ("not measured" stays visible,
  never silently dropped) rather than assuming 010 hasn't fired. mon1 and
  mon2 (2026-07-25) re-confirmed the environment still has no
  `FUNNEL_READ_TOKEN`/`CRON_SECRET` via direct `env` checks, not assumption.
  This pass (mon3) re-confirmed the same via `Get-ChildItem Env:` — only
  `SUPABASE_GO_BINARY` present, no funnel-auth secret of any kind.

## The ask

The gap has now persisted across enough passes that continuing to log
"unevaluable" without escalating is itself a silent failure mode — the point
of a tripwire is that someone eventually looks at whether it can fire at all.
This assignment asks the CEO to adjudicate between two closing moves, not to
build anything further (044's build side is done):

**Option A — close the loop the way ADR 008 already asked for.** Take
Shareholder ask 2 to the Shareholder via `/ceo`: generate a
`FUNNEL_READ_TOKEN` value, set it in the Vercel project env, and expose the
same value to tick/monitor sessions via the scheduler/session settings
mechanism (precedent: `SUPABASE_GO_BINARY`, cc commit `da30a02`). Once done,
010 (and 035's funnel half) become directly, mechanically evaluable by any
monitor pass without Shareholder involvement per-check.

**Option B — formally accept digest-only observability.** If Option A is
declined or deprioritized, record that decision explicitly as an amendment
to 010's own watch (and/or a new ADR): 010 is evaluated **only** via the
Shareholder relaying the 08:00 digest or pasting into `funnel.md`, on
whatever cadence the Shareholder actually sustains; monitor/tick passes
report "unevaluable, pending Shareholder relay" as the *expected*, not
degraded, steady state, and stop treating each recurrence as a fresh gap to
re-flag. This is a legitimate choice — it just needs to be a chosen, recorded
one instead of an unexamined default a dozen passes deep.

Either option is a small, bounded action (one `/ceo` conversation for A; one
short ADR/010-note edit for B) — this assignment is the adjudication trigger,
not a build task.

## Acceptance criteria

- [ ] The CEO has explicitly chosen Option A or Option B (or a stated
      alternative) and recorded the choice in a decision artifact (a new ADR,
      or an amendment note appended directly to `company/assignments/010-payments-reopening-trigger.md`'s
      Notes section) — a tester can find this choice by reading that file
      without asking anyone.
- [ ] If Option A: `FUNNEL_READ_TOKEN` is confirmed present in a tick/monitor
      session's environment (checkable via `Get-ChildItem Env:` / `env` in a
      fresh tick session showing the variable, without printing its value),
      and a monitor pass has successfully pulled a real `{ok, types, weeks}`
      response from `/api/admin/funnel` using it and recorded a non-empty
      reading — checkable by reading the next monitor `health.md` entry for a
      populated 010 verdict (not "unevaluable").
- [ ] If Option B: `company/assignments/010-payments-reopening-trigger.md`'s
      Notes section states the accepted cadence/channel explicitly (e.g.
      "evaluated only via Shareholder relay, no session-level token") — a
      tester can read that file alone and know not to expect a token-based
      reading, and subsequent monitor passes cite this note rather than
      re-describing the gap from scratch.
- [ ] Either way, this assignment is closed `done` with the chosen path
      recorded in its own Delivery notes, not left open indefinitely.

## Notes

Authority: decisions/008-monitor-observability.md (CEO, 2026-07-23) is the
standing risk-acceptance this assignment asks to be revisited, not
overridden — its own revisit trigger (b), "any tripwire needs formal
evaluation... is an automatic escalation, not a guess," is what this
assignment exercises. No new spend either way; Option A uses credentials
that already exist in production (per 044), Option B has zero cost. Opened
by monitor per the standing instruction from mon2's retro: do not keep
logging "unevaluable" silently once the gap has recurred across multiple
passes — file it once, explicitly, for the CEO to close.
