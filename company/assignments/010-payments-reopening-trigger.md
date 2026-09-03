---
id: 010
title: Reopen payments when the traction trigger fires
owner: ceo
status: blocked
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

decisions/002-payments-deferral.md deferred entity, processor, and payment
implementation until traction. This assignment is the standing watch: when the
funnel readout (`api/admin/funnel`, assignment 006) shows a **7-day average of ≥5
game-starts/day**, the CEO takes the reopening to the Shareholder — entity
registration (recommendation on file: eenmanszaak + KOR), processor confirmation
(recommendation: Stripe direct, iDEAL), and opening the implementation assignments
already drafted in research/payments-decision-package.md (checkout, webhook
free→paid, refund path, receipt email), plus unparking 003 (referral server seam —
guardrail 6 binds before any go-live).

## Acceptance criteria

- [ ] Monitor/CEO checks the trigger on every growing-stage tick once 006 is
      verified and deployed.
- [ ] When the trigger fires: Shareholder asked, decision recorded as a new ADR,
      implementation assignments opened with dispatcher-allocated ids, 003 unparked.
- [ ] Until then this assignment stays blocked — it is a tripwire, not work.

## Notes

Blocked on: the traction trigger (external — real users), not on any role.
Authority: decisions/002-payments-deferral.md §1–2.

**Amendment (CEO, 2026-07-25, assignment 126, decisions/016):** this trigger is
evaluated **only via Shareholder relay** — the 08:00 Telegram digest read in a
/ceo conversation, or a paste into `company/metrics/funnel.md` — on whatever
cadence the Shareholder sustains. There is **no session-level token**: do not
expect a tick/monitor session to read `/api/admin/funnel` directly, and do not
re-file that absence as a gap. Monitor passes record 010 in one line as
"unevaluable pending Shareholder relay — expected steady state per ADR 016,"
citing this note, instead of re-describing the gap. ADR 008 ask 2 (provision
`FUNNEL_READ_TOKEN` in Vercel env + expose it to tick sessions) remains a
**standing low-priority ask** — if the Shareholder acts on it, the monitor
switches to appending a funnel row per tick and this amendment is superseded
without further ceremony. Escalation backstops (ADR 016 §3): digest trend
approaching threshold or a first parent opt-in ping; or 2026-08-20 (ADR 008 T5)
with funnel.md still empty and no token.

**Amendment (CEO, 2026-09-03, assignment 127, decisions/017):** the digest-only
steady state above **ended on 2026-08-20** — ADR 008 T5 / ADR 016 §3 fired with
`funnel.md` still empty (no paste since c7f29a6, 2026-07-23) and no
`FUNNEL_READ_TOKEN` provisioned, and fired unobserved because no tick ran between
2026-07-26 and 2026-09-03 (framework-side outage; decisions/017 Context). The
escalation is now active: decisions/017 asks the Shareholder to pick the channel
explicitly (weekly paste vs. token — the CEO recommends the token — or "neither",
which parks the growing-stage board). Monitor passes now record this trigger in one
line as **"unevaluable — escalated per ADR 017 (backstop fired 2026-08-20), pending
Shareholder channel choice; NOT FIRED as far as the board can see"** — citing ADR 017,
no longer ADR 016's "expected steady state". The channel and no-session-token facts
from the 2026-07-25 amendment still hold; only the framing changed. This assignment
stays `blocked`: it is still a tripwire and it still cannot be read. Next backstop:
2026-10-01 with no Shareholder answer, at which point the CEO records the board parked
(decisions/017 Consequences).
