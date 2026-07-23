---
id: 030
title: Rate-limit unknown-type track requests (check-order fix)
owner: developer
status: needs_verification
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Reproduced defect from the 025 verification (tick 2026-07-23 #1): in api/track.js
the `TYPES.has(type)` check returns 204 BEFORE the two `rateLimited()` calls,
unlike the sessionId/path validation which correctly sits after them. Result: 500
consecutive unknown-type requests from one IP → all 204, zero rate_limits rows,
never a 429 — an unmetered flood path on a public unauthenticated endpoint, and it
contradicts the code's own comment that malformed traffic still counts against the
limit. Move the type check to the same position as the sessionId/path validation
(after both rate-limit checks, before the row build), so all malformed traffic is
metered identically.

## Acceptance criteria

- [x] Unknown-type requests count against both the per-IP and global rate limits:
      test proves the 121st consecutive unknown-type request from one IP gets 429
      (extend test/track.test.js's shim pattern, mirroring the tester's repro).
- [x] Unknown type still returns 204 (not 400) below the limit and stores nothing
      — the 025 deviation ruling (probe-proof silent drop) is preserved.
- [x] Valid events still land; all existing tests green (main baseline 111/111).

## Notes

Found and reproduced by the 025 verification tester. Severity: no PII exposure,
real cost/abuse-control gap. Informational from the same pass, NOT in scope here:
`path` regex admits `//evil.com`-shaped and `/../`-style strings (stored as inert
text; funnel.js never reads path) — tighten only if path is ever surfaced.
Terminal state needs_verification.

### What was built

- **`api/track.js`**: moved `if (!TYPES.has(type)) return res.status(204).end();`
  from immediately after parsing `type` (before `supa()`, before both `rateLimited()`
  calls) to inside the `try` block, directly after both rate-limit checks and
  immediately before the `sessionId` UUID check — the exact position the
  sessionId/path validation already occupied. No other line moved; the check itself
  (`TYPES.has(type)`, status `204`) is unchanged, only its position. Updated the two
  adjacent comments to record why the order matters (rate-limit must run before any
  shape validation, including the type check, or malformed traffic of that shape
  goes unmetered).
- **`test/track.test.js`**: added one test, `track: onbekend type telt ook mee tegen
  de rate-limit — 121e opeenvolgende verzoek van één IP krijgt 429`, extending the
  existing shim/rate-limit pattern (same `withBackend()`, same `x-forwarded-for`
  per-IP bucket, same 121-iteration shape as the existing per-IP rate-limit test,
  mirroring the tester's repro from the 025 verification note). Sends 121
  consecutive `{ type: 'nonsense-type-flood' }` requests from one IP: asserts `204`
  on each of the first 120 (still silently dropped, not 400, not distinguishable
  from a real accepted event) and `429` on the 121st. Also asserts
  `DB.events.length === 0` throughout — nothing is ever stored, rate-limited or not.

### Build / test verification

- `npm install`: clean, 22 packages audited, no drift (node_modules wasn't present
  in this fresh worktree — matches prior lanes' pattern).
- `npm run build`: clean — `prebuild` regenerates 13 URLs + sitemap, `vite build`
  92 modules, no errors/warnings. `npm run build` regenerates `public/**` and
  `sitemap.xml` with CRLF line-ending noise only (`git diff` on those paths empty
  of content changes) — reverted with `git checkout -- public/` before staging,
  same as the 025 precedent; not part of this commit.
- `npm test`: **112/112 pass, 0 fail** (`node --test test/*.test.js`) — the 111
  baseline plus the 1 new test. No skips, no todos, no failures.
- `git status`/`git diff` reviewed before commit: only `api/track.js` and
  `test/track.test.js` touched by hand; no other files staged.
