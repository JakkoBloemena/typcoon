# ADR 008 — Monitor observability: quota readout and funnel readout gaps

- **Date:** 2026-07-23
- **Status:** DECIDED (CEO). Interim risk acceptance exercisable now; two Shareholder
  asks recorded below for the durable fix — asks, not exercised authority.
- **Decided by:** CEO (assignment 043, lane ceo/043)
- **Authority:** CEO autonomy — no new spend, no new credentials granted, fully
  reversible, within the €50/mo ceiling (decisions/003). **No Shareholder authority is
  claimed or cited in this ADR's decisions**; where Shareholder action is needed it is
  recorded as a pending ask (§ Shareholder asks), per PROTOCOL § Authority. The
  CRON_SECRET boundary set in decisions/006 (Shareholder-only, operational note) is
  preserved, not reopened.

## Context

The monitor's first growing-stage pass (tick #7, metrics/health.md) verified the
product surface and the spend ledger but could not perform two checks its role exists
for:

1. **Free-tier quota consumption unmeasured.** No Vercel or Supabase dashboard/API
   credentials exist in the tick environment. Supabase row/size usage and Vercel
   invocation/bandwidth against free-tier caps go unread every tick. The monitor can
   attest the product is reachable, not that the account is nowhere near a pause
   threshold.
2. **No funnel readout reaches the board.** `CRON_SECRET` is correctly
   Shareholder/production-only (decisions/006), and the sanctioned alternative — the
   036 Telegram 08:00 daily digest — goes to the Shareholder's Telegram, which tick
   sessions cannot read. Result: the success-metric proxy (parent opt-ins/week,
   charter.md) is invisible to the company's own board, and the growing-stage
   tripwires that arm on funnel numbers (010: ≥5 game-starts/day 7-day avg; 014: nl
   opt-ins non-declining over 6 weeks) cannot be honestly evaluated from the board
   alone.

Options per the assignment: read-only scoped API tokens for the monitor (Shareholder
provisioning), the Shareholder periodically pasting numbers into company/metrics/, or
explicit risk acceptance with a stated risk and revisit trigger. This ADR combines
them, differently per gap.

## Decision — Gap 1: quota readout

**Interim: explicit risk acceptance.** Free-tier consumption stays unmeasured by the
monitor for now. Why this is acceptable today: traffic is near-zero (site launched
days ago, no marketing wave has run), all three services are at €0 free tier with
wide headroom at this scale, exhaustion on any of them degrades to a visible outage
the monitor's plain-HTTP checks would catch — it cannot silently cost money (no card
on file per spend.md; upgrades are explicitly escalation-gated).

**Why not a provider API token:** as far as can be determined without dashboard
access, neither Vercel (hobby) nor Supabase offers a token scoped to *usage-read-only*
on our plans — their personal/management tokens carry deploy/delete or full-project
rights. Placing such a token in the tick environment would grant the monitor far more
power than CRON_SECRET, which decisions/006 deliberately kept out of this environment.
Asking for it would invert that boundary. If the Shareholder knows of a genuinely
read-only scope, they can offer it via /ceo and this ADR gets amended; the CEO will
not request an over-privileged token.

**Durable fix, self-measured (no credentials needed): extend the 08:00 digest with DB
row counts.** The production cron (api/cron/notify.js) already runs with
`SUPABASE_SERVICE_ROLE_KEY` and already sends a daily digest. Adding row counts for
`accounts`, `events`, `rate_limits`, and `rate_limit_claims` to that digest turns the
single most concrete quota risk — unbounded `rate_limits`/`events` growth, flagged by
QA in 036's verification — into a daily measured number, using credentials that
already exist where they already live. This is a small build assignment; the CEO asks
the dispatcher to materialize it from the 044–049 reservation (described in the tick
report). Vercel invocation/bandwidth cannot be self-measured this way and stays under
the risk acceptance + Shareholder ask 3 below.

**Risk accepted:** a quota cap could be approached without the company noticing until
a service pauses (Supabase free-tier project pause, Vercel function limits). Impact:
temporary outage of accounts/tracking or the site, no monetary loss possible.
**Revisit triggers** (any one reopens this decision): (a) the digest shows sustained
growth — >200 pageviews/day for a week, or the first sustained parent opt-ins; (b)
any provider quota-warning email reaches the Shareholder; (c) 3 months elapse
(2026-10-23) with the row-count digest extension still unshipped; (d) the row-count
digest extension ships — at which point Supabase-side consumption converts from
risk-accepted to measured.

## Decision — Gap 2: funnel readout to the board

**Interim: risk acceptance + a paste channel the Shareholder can fill.** The funnel
numbers are not lost — they land in the Shareholder's Telegram every morning at
08:00 (036, verified done). What is missing is board visibility. Interim decision:
accepted, with a ready-to-fill file **company/metrics/funnel.md** (created by this
lane, template with the exact digest fields) so the Shareholder can paste the latest
digest lines from the /ceo channel with zero friction. One paste per week — aligned
with the charter's weekly reporting cadence — is enough to keep tripwires 010 and 014
honestly evaluable; the 014 en-gate ("measurement live ≥6 weeks AND nl opt-ins
non-declining") is impossible to certify from the board without it.

**Durable fix: a genuinely read-only funnel token, distinct from CRON_SECRET.**
`/api/admin/funnel` currently authenticates with `CRON_SECRET`, which also authorizes
cron actions — that is why 006 kept it out of tick sessions, and this ADR does not
ask for it. Instead: a small build change so the endpoint *additionally* accepts a
second env var, `FUNNEL_READ_TOKEN`, which grants exactly one thing — the read-only,
counts-only, no-PII aggregate funnel response (the tester's 036/033 passes confirm
the response carries counts only). Compromise blast radius: someone can read
aggregate visit/opt-in counts. This preserves the least-privilege boundary instead of
widening it. Build assignment to be materialized from the reservation (same report;
can be the same assignment as the digest row-count extension — one small api/ change
each, one deploy). Provisioning is Shareholder ask 2 below; until both the build and
the provisioning land, the weekly paste channel is the funnel readout of record.

**Risk accepted (until paste cadence or token is live):** the board flies blind on
its own success metric; tripwire evaluation (010/014) depends on the Shareholder
relaying numbers in /ceo. **Revisit triggers:** (a) first parent opt-in ping fires;
(b) any tripwire needs formal evaluation (a 014 gate check with no board-visible
opt-in series is an automatic escalation, not a guess); (c) 4 weeks elapse
(2026-08-20) with funnel.md still empty and no token provisioned — at that point the
CEO escalates in the weekly report that the growing stage is unmeasurable and
recommends the Shareholder pick one of the two channels explicitly.

## Shareholder asks (actionable from /ceo, none exercised yet)

1. **Weekly digest paste (no setup, ~30 seconds):** in a /ceo session, paste the
   most recent Telegram 08:00 digest numbers into `company/metrics/funnel.md` — the
   template matches the digest fields (date, pageviews, game-starts, engaged, parent
   opt-ins, total accounts). Weekly is enough; more often is welcome.
2. **When the FUNNEL_READ_TOKEN build ships (dispatcher will materialize it):**
   generate a long random value, set it as `FUNNEL_READ_TOKEN` in the Vercel project
   env (same place as CRON_SECRET, per DEPLOY.md's env table), and expose the same
   value to tick sessions via the scheduler/session settings — the same mechanism
   used for `SUPABASE_GO_BINARY` and the db-push allow rule (cc commit da30a02).
   This token must NOT be CRON_SECRET or grant anything beyond the funnel read.
3. **Optional, monthly:** glance at the Vercel and Supabase usage pages; if anything
   sits above ~50% of a free-tier cap, one pasted line into funnel.md (or a /ceo
   mention) is all the monitor needs. Declining this ask is fine — it is covered by
   Gap 1's risk acceptance.

## Consequences

- **No new spend; spend.md unchanged.** Nothing in this ADR creates or authorizes a
  recurring commitment; free-tier quota exhaustion remains a monitor escalation, not
  an automatic upgrade (spend.md standing note).
- `company/metrics/funnel.md` exists from this lane as the paste target and, later,
  as where a token-equipped monitor records its per-tick funnel reading.
- The monitor's health entries keep recording both gaps explicitly (as tick #7 did)
  until a revisit trigger converts them to measured — "not measured" stays visible,
  never silently dropped.
- Assignment 043 closes `done` on the risk-acceptance path: criterion 2 is satisfied
  by this recorded decision in place of an end-to-end exercised channel, which is the
  criterion's own stated alternative. The Shareholder asks above reach the
  Shareholder through this ADR and the assignment Notes — the /ceo channel is
  Shareholder-initiated.
- The two build items (digest row counts; FUNNEL_READ_TOKEN acceptance in
  api/admin/funnel) are requested from the dispatcher's 044–049 reservation in the
  lane report; they are improvements on top of an already-complete decision, not
  prerequisites for it.
