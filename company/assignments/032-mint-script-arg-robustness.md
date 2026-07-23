---
id: 032
title: mint-licence.mjs — clean error on malformed --days/--expires
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #2), proposed by the 019 verification tester
---

## Goal

`scripts/mint-licence.mjs` crashes with an uncaught `RangeError: Invalid time value`
and a raw Node stack trace (at the `new Date(...).toISOString()` on line ~80) when
`--days` or `--expires` is malformed, instead of printing a clean usage error:

```
node scripts/mint-licence.mjs --school "Test" --tier klas --days notanumber
node scripts/mint-licence.mjs --school "Test" --tier klas --expires not-a-date
```

Process still exits 1 and nothing is written (crash precedes the insert), so this is
robustness only — but it is a hand-run concierge tool where a mistyped date is
plausible. Validate both args up front and fail with the same clean usage/error style
the script already uses for missing env vars and bad `--school`/`--tier`.

## Acceptance criteria

- [ ] Both repro commands above print a one-line human error (no stack trace), exit 1.
- [ ] Valid `--days` and `--expires` behavior unchanged.
- [ ] Tests extended in `test/school-licence-record.test.js` covering both malformed
      cases; full suite stays green.

## Notes

Reproduced by the 019 tester during verification (tick 2026-07-23 #2). Specialist
proposal → priority 4 per PROTOCOL. Terminal state needs_verification.
