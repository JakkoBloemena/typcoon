---
id: 030
title: Rate-limit unknown-type track requests (check-order fix)
owner: developer
status: done
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

### Verification (tester, 2026-07-23)

**Verdict: all three acceptance criteria met. Status → `done`.**

**Build/test — re-run independently in the tester's worktree (`typcoon-lanes/v030`,
current main tip):**
- `npm install`: clean, 22 packages, no drift.
- `npm test`: **126/126 pass, 0 fail** (`node --test test/*.test.js`) — this is the
  current combined main-tip baseline (board log: tick 2026-07-23 #1 closed at
  126/126 after 8 builds landed), not the 112/112 figure quoted in the build note,
  which was this assignment's own before/after delta at build time (111 baseline +
  1 new test = 112). No discrepancy — different baselines, same delta.
- `npm run build`: clean — `prebuild` regenerates 17 URLs + sitemap, `vite build` 94
  modules, no errors/warnings. Regenerated `public/**`/`sitemap.xml` (line-ending
  noise only, `git diff` empty of content) reverted with `git checkout -- public/`
  before/after testing, per prior-lane precedent — not part of this commit.

**Criterion 1 — unknown-type requests count against both rate limits (121st →
429):**
- Read `api/track.js`: `TYPES.has(type)` now sits at line 48, immediately after
  both `rateLimited()` calls (lines 41-42) and immediately before the `sessionId`
  UUID check (line 49) — exactly the position the sessionId/path validation
  occupied pre-fix, as claimed.
- Read `test/track.test.js`'s new test (`onbekend type telt ook mee...`, line 185):
  confirmed it asserts 204 on each of the first 120 `nonsense-type-flood` requests,
  429 on the 121st, and `DB.events.length === 0` throughout. Not a tautology.
- **Regression-proofed it myself**, not just trusted the test: temporarily edited
  the live `api/track.js` to move `TYPES.has(type)` back to its pre-fix position
  (immediately after parsing `type`, before `supa()`/both `rateLimited()` calls),
  ran the new test in isolation — it failed exactly as expected
  (`AssertionError: 204 !== 429` at the `last.statusCode` assertion). Restored the
  file from a backup (`git diff` empty afterward, confirmed byte-identical to
  HEAD). This proves the test is a real regression guard for this exact bug, not
  a vacuous assertion.
- **Reproduced the original attack independently**, own from-scratch shim in a
  temp scratch script outside the repo (not `test/track.test.js`, deleted after
  use, no repo files touched): 121 consecutive `{type:'totally-bogus-flood-type'}`
  from one IP → first 120 all `204`, 121st `429`, `DB.events.length === 0`
  throughout, `DB.rate_limits.length === 240` (2 buckets × 120 counted hits before
  the block). Matches the developer's test exactly under an independently-written
  harness.
- **Adversarial extension — mixed valid+invalid traffic from one IP shares the
  same bucket**: alternated `bogus-mixed-flood` and valid `pageview` (odd/even) for
  121 requests from one IP. 429 fired on request 121 as expected (bucket is keyed
  on IP only, not type, so it can't be evaded by alternating shapes); 60 valid
  pageviews landed before the limit hit. Confirms the fix isn't type-scoped in a
  way that would leave a bypass via type-alternation.

**Criterion 2 — unknown type below the limit still 204, stores nothing (025's
probe-proof ruling preserved):**
- Confirmed in both the full suite (multiple `track.test.js` cases) and the
  independent scratch repro: a single unknown-type request returns `204` (not
  `400`) and leaves `DB.events` unchanged. No status-code oracle distinguishing
  "unknown type" from "accepted."

**Criterion 3 — valid events still land:**
- Full suite's existing valid-event tests (anonymous landing, real-client path
  regression across all 5 real path shapes, funnel readout) all pass at 126/126.
- Independent scratch repro: a `pageview` with valid UUID `sessionId` and `path:
  '/'` returns `204` and lands in `DB.events` with the correct `type`.

**Sweep for other pre-rate-limit early-return paths in `api/track.js`:** only two
remain, both reviewed and judged not in scope / not new flood vectors:
- Line 26, `req.method !== 'POST'` → `405`: never touches `supa()` or
  `rateLimited()` at all, so there is no Supabase cost to meter on this path
  either way (the rate limiter's own purpose, per its file comment, is guarding
  Supabase query/write cost). Pre-existing since assignment 006, untouched by 025
  or 030, not the class of bug being fixed here (that bug was "shape-valid POST
  traffic bypassing metering," not "non-POST traffic").
- Line 32, `if (!db) return res.status(204).end()`: only reachable when
  Supabase env vars are entirely unconfigured, in which case `rateLimited()`
  itself is uncallable (no `base`/`H` to build the request from) — nothing to
  meter by construction, not a runtime attack surface on a deployed instance with
  a configured backend. Pre-existing, not introduced or touched by 030.
- No other `return` precedes both `rateLimited()` calls. The `TYPES.has`/
  `sessionId`/`path` checks are the only three shape-validation gates, and all
  three now sit consecutively after both rate-limit calls, in that order.
- The `//evil.com`-shaped and `/../`-style path regex admission (informational
  from 025) is out of scope per this assignment's notes — not re-litigated.

**Adjacent defects found:** none. No new issues to report to the dispatcher.
