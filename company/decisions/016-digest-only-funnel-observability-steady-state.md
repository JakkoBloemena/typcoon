# ADR 016 — Digest-only funnel observability accepted as the steady state (ADR 008 ask 2 stands, deprioritized)

- **Date:** 2026-07-25
- **Status:** DECIDED (CEO)
- **Decided by:** CEO (assignment 126, lane ceo/126)
- **Authority:** CEO autonomy — no spend, no new credentials, fully reversible by a
  later ADR or by the Shareholder acting on ADR 008 ask 2 at any time. **No
  Shareholder authority is claimed or cited**; the one Shareholder-facing item here
  is a standing *ask* (unchanged from ADR 008 § Shareholder asks #2), not exercised
  authority. This ADR exercises ADR 008's own revisit trigger (b) for Gap 2 — "any
  tripwire needs formal evaluation ... is an automatic escalation, not a guess" —
  which is exactly what assignment 126 (opened by monitor, mon3) invoked.

## Context

Tripwire 010 (reopen payments at a 7-day average of ≥5 game-starts/day, read from
`/api/admin/funnel`) has been recorded "UNEVALUABLE — no data" on every
growing-stage monitor pass from tick #14 (2026-07-23) through mon3 (2026-07-25) —
roughly a dozen consecutive passes — for one structural reason: the only channel
carrying funnel numbers is the 08:00 Telegram digest to the Shareholder, which no
tick or monitor session can read.

ADR 008 (2026-07-23) recorded this gap and set the durable fix as two halves:
a build half (done — assignment 044 shipped `FUNNEL_READ_TOKEN` support on
`/api/admin/funnel`, commits `5996aff`/`f63f1a0`, independently re-verified, live
in production) and a Shareholder half (ask 2: generate the token, set it in Vercel
env, expose it to tick sessions via the scheduler settings mechanism). The
Shareholder half has not happened; neither has ask 1's weekly paste into
`company/metrics/funnel.md`, which remains empty. Assignment 126 asked the CEO to
adjudicate rather than let monitors re-flag the identical gap indefinitely.

## Decision

**Hybrid: Option B now, Option A standing.**

1. **Digest-only observability is the accepted, recorded steady state** — not a
   degraded interim. Tripwire 010 (and 035's funnel half) is evaluated **only**
   via the Shareholder relaying digest numbers: either in a /ceo conversation or
   by pasting into `company/metrics/funnel.md`, on whatever cadence the
   Shareholder actually sustains. Monitor and tick passes record 010 as
   "unevaluable pending Shareholder relay — expected steady state per ADR 016 /
   010 Notes" in one line, **citing this ADR instead of re-describing the gap**.
   Each recurrence is no longer a fresh finding and must not be re-filed as one.

2. **ADR 008 ask 2 stands as a low-priority standing ask, not rescinded.** The
   build half is done and waiting; provisioning `FUNNEL_READ_TOKEN` remains a
   ~30-second Shareholder action that converts 010 to mechanical per-tick
   evaluation. It will be surfaced in the next /ceo conversation and in the
   weekly report — but the CEO will not escalate it as urgent while traffic is
   pre-traction, because it is not.

3. **Conditions that flip this back to an active escalation** (any one):
   - the digest shows game-starts trending toward the threshold (any 7-day
     stretch averaging ≥3/day), or a first parent opt-in ping fires (ADR 008
     Gap-2 revisit trigger (a));
   - ADR 008's existing T5 date arrives — **2026-08-20** with `funnel.md` still
     empty and no token provisioned — at which point the CEO escalates per ADR
     008's own text and asks the Shareholder to pick a channel explicitly;
   - the Shareholder provisions the token (happy path): the monitor then appends
     a funnel row per tick to `funnel.md` and 010 becomes mechanically evaluable,
     superseding the digest-only mode without further ceremony.

## Why this and not Option A alone

The adjudication question was never "is a token nicer than a digest" (it is); it
was "is the gap worth escalation pressure *today*." It is not: the company is
pre-traction, the funnel is near zero, and a dozen "unevaluable" verdicts in a row
are — with near-certainty — a dozen "not fired" verdicts. The Shareholder already
sees every number this tripwire needs, daily, in Telegram; if the trigger fires it
fires in front of the one person authorized to act on it (010's action is "CEO
takes reopening to the Shareholder" — the Shareholder is already at the end of
that path). Meanwhile a two-day-old un-actioned ask is not a declined ask, and
manufacturing urgency around it would spend Shareholder attention the charter
tells us to conserve. The real, present cost of the gap was board noise —
monitors re-flagging the same structural fact every pass — and that cost is
eliminated by recording the steady state, not by nagging the Shareholder faster.

## Consequences

- **No new spend; `spend.md` unchanged.** Nothing here creates or authorizes any
  commitment.
- `company/assignments/010-payments-reopening-trigger.md` Notes carry the
  operative amendment (cadence/channel, what monitors cite); this ADR is the
  reasoning of record behind it.
- Assignment 126 closes `done` on Option B's acceptance criteria, with the hybrid
  recorded in its Delivery notes.
- `company/metrics/funnel.md` keeps its dual role unchanged: paste target now,
  monitor-written log if/when the token lands.
- ADR 008 is amended in effect, not superseded: its Gap-2 risk acceptance
  converts from "interim, pending asks" to "steady state, asks standing," and its
  revisit triggers (a) and (c)/T5 remain armed exactly as written.
