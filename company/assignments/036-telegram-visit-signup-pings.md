---
id: 036
title: Typie pings — message on every site visit + signup, and a daily digest
owner: developer
status: open
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Shareholder direction (/ceo channel, 2026-07-23, verbatim ask: "I want a message on
every site visit + sign up", plus earlier "show site visitors, sign ups, etc"):

1. **Per-visit ping**: api/track.js sends a short Typie message via api/_telegram.js
   `tg()` on every stored `pageview` event (path + country, e.g. "👀 bezoek: / (NL)").
   Fire-and-forget AFTER the row insert — the beacon's 204 must never wait on or leak
   Telegram failures. Only for stored events (rejected/rate-limited events don't ping).
2. **Signup ping**: already wired in api/account/create.js — verify it still fires
   post-env-fix; do not duplicate it.
3. **Daily digest at 08:00 Europe/Amsterdam** via the existing api/cron/notify.js
   hourly cron: yesterday's totals (pageviews, game-starts, engaged sessions, parent
   opt-ins from the events table + total accounts). The digest doubles as a liveness
   check: it must send even when all counts are zero ("gisteren: 0 bezoeken") — a
   silent day is indistinguishable from a broken pipe, which is how the env outage
   hid for a month (see retro/2026-07-23-env-outage-and-headless-lessons.md).
4. **tg() failures must be visible**: keep sends best-effort but console.error the
   failure (Vercel function logs) instead of swallowing silently.

## Acceptance criteria

- [ ] A stored pageview triggers exactly one Telegram message; rejected/dropped
      events trigger none (extend test/track.test.js's shim with a tg spy).
- [ ] The beacon response stays 204 and is not delayed/failed by Telegram errors
      (test with a throwing tg stub).
- [ ] Digest: fires once per day at 08:00 Amsterdam from the hourly cron with
      correct yesterday-window counts (unit-test the window/dedup logic the same way
      _report.js is tested); sends explicitly-zero digests.
- [ ] tg() errors logged, not swallowed; no PII in any message (paths + counts only,
      no session ids, no emails).
- [ ] Per-visit pings respect Telegram's rate tolerance: if >20 pings would fire
      within a minute, collapse the remainder into one summary message ("+N bezoeken
      afgelopen minuut") — protects against both traffic spikes and beacon abuse.
- [ ] All tests green, clean build.

## Notes

Telegram creds are live in Vercel (TELEGRAM_BOT_TOKEN/CHAT_ID, set 14d ago). At
future real traffic, per-visit pings get noisy — switching to digest-only is a
one-line revert the Shareholder can order via /ceo; note this in the code comment.
Terminal state needs_verification.
