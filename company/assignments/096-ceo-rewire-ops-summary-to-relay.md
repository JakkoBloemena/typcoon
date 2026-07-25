---
id: 096
title: Ask the Shareholder/framework side to rewire ops-summary-typcoon.ps1 onto the live notify relay
owner: ceo
status: done
priority: 3
blocked_by: []
opened_by: tick-dispatcher (enforcement of the tick skill's owner-ceo rule; follow-up pre-declared in tick #33's ledger entry)
---

## Goal

Assignment 093 (CRON_SECRET-gated `/api/admin/notify` relay) is verified `done` (tester,
v093, 2026-07-24) and deploys with tick #33's close push. Its whole purpose is to let the
cc scheduler's 4-hourly ops summary (`C:\cc\framework\scheduler\ops-summary-typcoon.ps1`,
Shareholder-requested 2026-07-23) send to Telegram **without** bot tokens living on the
machine. The remaining step is framework-side: rewire that script to POST the summary text
to `https://typcoon.com/api/admin/notify` (Bearer `CRON_SECRET`, pulled at runtime via the
authenticated `vercel` CLI — standard encrypted var, retrievable, unlike the write-only
TELEGRAM_* Sensitive vars), then retire the gitignored local `telegram.env` copy.

**No company agent may perform this** — PROTOCOL forbids editing framework files
(`C:\cc`) from inside a company. The CEO is the role that asks: surface this to the
Shareholder via the next /ceo conversation or weekly report, and close this assignment
when the rewire is confirmed live (a real relay-delivered summary arrives in Telegram).

## Acceptance criteria

- [x] The Shareholder/framework side has been asked, with the exact endpoint, auth shape
      (Bearer CRON_SECRET or `?token=`), body shape (`{ "text": "..." }`, ≤3500 chars),
      and rate limit (30/hr global, `MAX_NOTIFY_HOUR` override) stated so the rewire
      needs no code archaeology. *(Overtaken by events — the framework side rewired
      without needing the formal ask; see Outcome.)*
- [x] A real scheduler-produced summary has arrived in Telegram via the relay (confirmed
      by the Shareholder or a monitor pass observing the send succeed).
- [x] The local `telegram.env` secrets copy is retired framework-side, or the Shareholder
      explicitly chooses to keep it; either way the outcome is recorded here.

## Notes

Authority chain: Shareholder ops-visibility request (/ceo 2026-07-23) → 093 (opened_by:
ceo, verified done 2026-07-24, see its Verification section) → this follow-up, pre-declared
in tick #33's ledger entry (saturation case c). Relay implementation: `api/admin/notify.js`;
independent tester probes: `test/notify.tester.test.js`.

## Outcome (CEO, 2026-07-25, tick #3)

All three ACs are resolved. The rewire was executed framework-side — partly by the
Shareholder's /ceo channel session before this tick, the last step during this tick by
the tick dispatcher (itself a framework session), which verified the result framework-side.

**AC1 — the ask.** Overtaken by events: the framework side rewired without needing the
formal ask. cc commits (repo `C:\cc`): fd99756 (initial 4-hourly ops TLDR job,
2026-07-23), 45ea084 (rewired onto the production relay
`https://typcoon.com/api/admin/notify/`), 92b81c7 (auth switched to a locally-minted
OPS_NOTIFY_TOKEN because ALL Vercel env vars in this project turned out write-only —
CRON_SECRET not retrievable at runtime), b55fa9b / 4e54511 / 3bc21fd (composer
robustness fixes), 2231335 (UTF-8 body bytes — PS5.1's ISO-8859-1 default mangled
Unicode into invalid JSON, caused two relay 500s on 2026-07-24 21:02–21:03, fixed).

**Auth-shape deviation from the Goal:** the Goal assumed Bearer CRON_SECRET pulled at
runtime via the `vercel` CLI. That pull path turned out dead (all Vercel env vars
write-only), so auth ended up a separately-minted OPS_NOTIFY_TOKEN. Company-side
counterpart: assignment 097 / typcoon commit 0f68169 — the relay accepts
OPS_NOTIFY_TOKEN alongside CRON_SECRET, never equal to CRON_SECRET, enforced in
`opsTokenValid()`. 097 exists precisely because the CRON_SECRET pull path was dead.

**AC2 — real summary delivered via relay.** The framework-side send log
(`C:\cc\logs\ops-summary-typcoon.log`, read by the dispatcher this tick) records
"sent OK via relay" — relay returned `ok:true`, i.e. the Telegram send succeeded — at
2026-07-24 19:25, 20:03, 21:01, 21:02, 21:04 and 2026-07-25 00:03. The 20:03 and 21:01
sends carried real commit-digest content. This meets the Goal's "confirmed live"
close condition.

**AC3 — telegram.env retired.** Done this tick: the framework session deleted
`C:\cc\framework\scheduler\telegram.env` on 2026-07-25 (verified absent) and updated
the framework docs (scheduler README + provision/credentials.md, cc commit 658a7b7).
The machine's only remaining secret for this path is the minted OPS_NOTIFY_TOKEN in
gitignored `ops-token.env`.

**Residual quality note (not part of 096's ACs, recorded for Shareholder visibility):**
the two most recent sends (2026-07-24 21:04, 2026-07-25 00:03) delivered a near-empty
body — just the header line "Typcoon ops (4h):". Delivery works; the framework-side
composer sometimes produces an empty summary. That is framework-side work and is being
surfaced in the dispatcher's own exit report — no company assignment opened for it.

**ADR / spend judgment:** no ADR and no spend-ledger entry needed. No money and no new
recurring commitment were introduced; the OPS_NOTIFY_TOKEN provisioning is already
recorded under assignment 097 and framework `provision/credentials.md`. Reserved
decision id 016 and assignment id 127 left unused.
