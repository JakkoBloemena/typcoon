# ADR 017 — The funnel-channel backstop fired (2026-08-20): growing stage unmeasurable since launch; Shareholder asked to pick a channel and relay the GSC export

- **Date:** 2026-09-03
- **Status:** DECIDED (CEO). The escalation is exercised by this ADR; the three
  Shareholder asks below are asks, not exercised authority.
- **Decided by:** CEO (assignment 127, lane ceo/127)
- **Authority:** CEO autonomy — no spend, no new credentials created by this ADR,
  fully reversible. The escalation itself is **mandatory, not discretionary**: ADR 008
  Gap-2 revisit trigger (c) — *"4 weeks elapse (2026-08-20) with funnel.md still empty
  and no token provisioned — at that point the CEO escalates ... and recommends the
  Shareholder pick one of the two channels explicitly"* — and ADR 016 §3, second
  bullet, which re-armed that exact date as the condition that ends the digest-only
  steady state. Both conditions are met on disk (see Context). **No Shareholder
  authority is claimed or cited**; per PROTOCOL § Authority every Shareholder-facing
  item here is recorded as a pending ask.

## Context

**The outage.** Per the dispatcher's open entry for tick 2026-09-03 #1 (`company/ticks.md`)
and `C:\cc\logs\tick-typcoon.log`: the last tick before today closed 2026-07-26 14:22;
no runs 07-26 → 08-03; then 32 consecutive hourly ticks 2026-08-03 13:17 → 2026-08-04
20:17 all exited 1 with "Fable 5 requires usage credits"; then nothing until 2026-09-03
15:17. That is a **~39-day gap** in which no company agent ran. During the same window
the framework's 4-hourly ops summary (`C:\cc\logs\ops-summary-typcoon.log`) sent
"geen nieuwe activiteit - board idle, loop gezond." at 2026-08-04 16:03 and 20:03 —
while every tick that day was failing. The summary reads commit activity, not scheduler
exit status, so a dead loop and an idle loop produced the same message. This is a
framework/Shareholder-side outage, not a company defect; nothing in the product broke
(mon21 verifies the surface this tick in its own lane).

**Backstop 1 — the funnel channel (ADR 008 (c) / ADR 016 §3), fired 2026-08-20.**
`company/metrics/funnel.md` is still the empty template committed in c7f29a6
(2026-07-23). No `FUNNEL_READ_TOKEN` has been provisioned (the build half, assignment
044, has been live in production since 2026-07-24). Neither ADR 008 ask 1 (weekly
paste) nor ask 2 (token) has been acted on once. The company entered `growing` on
2026-07-23 (decisions/006); today is 2026-09-03. **The growing stage has therefore been
unmeasurable from the board for its entire life — ~42 days — not just for the outage.**
ADR 016 accepted that as a steady state for exactly four weeks on the explicit reasoning
that a two-day-old un-actioned ask is not a declined ask; a 42-day-old one with zero
pastes is a different fact, and ADR 016 §3 said so in advance.

**Backstop 2 — assignment 035's accrual gate, elapsed ~2026-08-20.** 035 (content batch
3, re-rank on measured value) is gated on "≥ ~4 weeks of Search Console impressions/CTR
since 009's verification." The GSC baseline commit be2a450 is dated 2026-07-23; four
weeks elapsed ~2026-08-20 and ~42 days have elapsed today. The wall-clock half of the
gate is satisfied. But GSC Prestaties data, like the funnel, lives only with the
Shareholder (`metrics/search-console.md`: "screenshots live with the Shareholder,
numbers live here") — so 035's remaining blocker is a relay, not time. Monitor passes
mon16–mon20 were computing "days remaining" against this gate; that computation is now
meaningless and stops (see Decision 3).

**What is gated on this.** Tripwire 010 (reopen payments at a 7-day average of ≥5
game-starts/day) is the root of the growing-stage board: 020 is `blocked_by: [010]`,
021 is `blocked_by: [020]`, 022 is `blocked_by: [010]`, and 003 (referral server seam,
guardrail 6) stays blocked "until 010 fires" per its own Notes. 035 is gated on the GSC
relay. **Six assignments — 010, 003, 020, 021, 022 and 035 — are frozen behind two
pieces of data that exist and that only the Shareholder can move onto the board.** No
role in this company can compress either; the tick ledger shows fifteen consecutive
null-or-monitor-only ticks on 2026-07-26 saying exactly that.

## Decision

1. **The digest-only steady state (ADR 016 §1) ended on 2026-08-20. The escalation is
   now active and recorded here.** Monitor and tick passes record tripwire 010 in one
   line as *"unevaluable — escalated per ADR 017 (backstop fired 2026-08-20), pending
   Shareholder channel choice; NOT FIRED as far as the board can see"*, citing this ADR
   instead of ADR 016's "expected steady state." Each recurrence is still not a fresh
   finding — the finding is this ADR — but the wording must no longer imply the gap
   is accepted. 010's Notes carry the operative amendment.

2. **The Shareholder is asked to pick the funnel channel explicitly** (ask 1 below).
   The CEO's recommendation is the token: the paste channel has had 42 days and zero
   pastes, which is evidence about the channel, not about the Shareholder — a weekly
   manual step competes with everything else in their week, whereas the token is one
   ~30-second action that makes 010 mechanically evaluable on every tick forever. But
   the choice is theirs, and "neither" is a legitimate answer with a consequence the
   CEO will then act on (see Consequences).

3. **Assignment 035 stays `blocked`; its gate is restated as relay-only.** The
   wall-clock half elapsed ~2026-08-20. What remains is: a GSC Prestaties reading for
   the live pages over the ~6-week window committed under `company/metrics/`
   (search-console.md is the file of record). 035 flips to `open` only when that
   reading exists on disk — never on the calendar. Monitors stop computing days
   remaining for 035 and record it as *"blocked on GSC relay (ADR 017 ask 2)."*

4. **The outage is recorded as a Shareholder/framework ask, not acted on** (ask 3).
   PROTOCOL forbids any company agent from editing `C:\cc`. The sanctioned path for the
   lesson — an ops summary that reports "loop gezond" from commit silence alone — is a
   `company/retro/` entry for the weekly retro; this lane's file scope did not include
   retro/, so that entry is left for the dispatcher or the next retro pass and is
   named in the assignment's Delivery section rather than silently dropped.

5. **No stage change, no kill.** The product is live, healthy on every monitor pass,
   and costs €0 against the €50/mo ceiling (spend.md unchanged). An unmeasurable
   growing stage is a reason to escalate, not to stop — but it is not a growing stage
   either, and the CEO will not let the board keep implying it is one.

## Shareholder asks (actionable from /ceo; none exercised yet)

1. **Pick the funnel channel — one of:**
   - **(a) Weekly paste (no setup):** in a /ceo session, paste the latest Telegram
     08:00 digest lines into `company/metrics/funnel.md` (template matches the digest
     fields). Weekly. If chosen, the CEO will treat a second missed month as a
     declined channel and record that, rather than re-escalating.
   - **(b) `FUNNEL_READ_TOKEN` (recommended, ~30 seconds, once):** generate a long
     random value, set it as `FUNNEL_READ_TOKEN` in the Vercel project env (must not
     equal `CRON_SECRET` — the endpoint rejects that), and expose the same value to
     tick sessions via the scheduler/session settings mechanism (precedent:
     `SUPABASE_GO_BINARY`, cc commit da30a02). The monitor then appends a funnel row
     per tick and 010 becomes mechanically evaluable with no further Shareholder
     involvement. The build half (assignment 044) is already live.
   - **(c) Neither** — say so, and the CEO records the growing-stage board as parked
     (see Consequences) instead of leaving it frozen by omission.

2. **Relay the Search Console Prestaties export so 035 can activate:** for the live
   pages (the 13 sitemap URLs), queries / impressions / clicks / CTR / average
   position, over the window 2026-07-23 → today (~6 weeks). A paste into a /ceo
   conversation or directly as a dated section in `company/metrics/search-console.md`
   is enough — the CEO/monitor commits it under `metrics/`. Screenshots are not
   needed; numbers are. This is the only remaining input 035 needs.

3. **Framework side (`C:\cc`, Shareholder-only — no company agent may touch it):**
   - the scheduler needs usage credits, or a model that runs: 32 consecutive
     "Fable 5 requires usage credits" exits on 2026-08-03/04, then no runs at all for
     30 days. While that holds, every backstop on this board fires unobserved and
     every weekly report is skipped — the company cannot report on its own outage.
   - the 4-hourly ops summary should reflect scheduler exit status, not only commit
     activity: it reported "loop gezond" twice on a day of 32 failed ticks. A
     summary that cannot distinguish idle from dead is not an ops summary.

**Where this ask lives.** The /ceo channel is Shareholder-initiated; the CEO cannot
open it. Until the Shareholder opens a /ceo conversation, this ADR and assignment 127's
Notes/Delivery are the ask of record — and the commit that lands this ADR is the line
the framework's ops summary will relay to Telegram, so the commit message carries the
headline deliberately.

## Consequences

- **No new spend; `spend.md` unchanged.** Nothing here creates or authorizes a
  commitment. Choosing (b) creates one Shareholder-held credential, provisioned by
  the Shareholder, scoped by 044 to a counts-only read — not by this ADR.
- `010` Notes amended: monitors cite ADR 017 (escalated) instead of ADR 016 (steady
  state). 010 stays `blocked` — it is a tripwire, and it still cannot be read.
- `035` Notes amended: wall-clock half elapsed, relay half remains, no more
  days-remaining arithmetic. 035 stays `blocked` until the GSC reading is on disk.
- If the Shareholder chooses **(a)** or **(b)**: 010 becomes evaluable; the day it
  fires, 003/020/021/022 unfreeze per their own gates, and the CEO takes the payments
  reopening to the Shareholder per decisions/002. 035 opens the moment ask 2 lands,
  independently of the channel choice.
- If the Shareholder chooses **(c)** or does not answer by the next backstop — **four
  more weeks, 2026-10-01** — the CEO will record the growing-stage board as parked
  (no kill: the product stays live at €0), stop monitor evaluation of 010/035 as
  tripwires, and report that the company is in maintenance, not growth, so the board
  says what is true.
- ADR 016 is amended in effect, not superseded: its §1 wording is retired, its §2
  standing ask is promoted to ask 1(b) above, and its §3 happy-path bullet (token
  provisioned → monitor appends rows) remains exactly as written.
- ADR 008's Gap-1 quota risk acceptance and its trigger (c) (2026-10-23, row-count
  digest extension) are untouched by this ADR.
