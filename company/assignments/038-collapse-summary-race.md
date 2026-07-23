---
id: 038
title: Fix double-send race in the >20/min collapse summary (atomic dedup claim)
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #5), filed by the 036 verification tester (reproduced defect — tester sets priority by user impact per PROTOCOL)
---

## Goal

The 036 per-visit-ping collapse rule can send its "+N bezoeken afgelopen minuut"
summary **twice** for the same overflowed minute. The dedup (`tgflag:<minute>` bucket
via `rateLimited()` in `api/_ratelimit.js`) is a non-atomic SELECT-count-then-INSERT:
two pageviews landing close together in the minute after an overflow can both observe
`count === 0` before either inserts, so both send. This is reproduced
deterministically in `qa-scripts/probe-036-race.mjs` (fetch shim with a forced
interleave point between the rate-limit SELECT and INSERT). It fails 036's acceptance
criterion "collapse the remainder into ONE summary message".

Fix: replace the check-then-act with an atomic claim on the `tgflag:<minute>` bucket —
a unique constraint + insert-on-conflict (or equivalent compare-and-set) so exactly one
concurrent invocation wins the right to send the summary. Prefer a solution that stays
inside the existing `rate_limits` table pattern and needs no new table; a migration
adding a unique index is acceptable if required (note it clearly — migrations are
applied per decisions/005 precedent).

## Acceptance criteria

- [x] `node qa-scripts/probe-036-race.mjs` (the 036 tester's reproduction) shows the
      summary sent exactly once under the forced interleave; adapt the probe into a
      permanent test in the suite (or port its scenario into test/visitping.test.js /
      test/track.test.js) so the race stays covered.
- [x] Normal collapse behavior unchanged: first 20 pings in a minute send
      individually, 21st+ counted silently, one summary on the next later-minute
      pageview, no summary when there was no overflow.
- [x] No behavior change to the digest dedup unless it shares the same racy helper —
      if it does, state whether it needs the same fix and either apply it or explain
      why the digest's hourly cadence makes the race unreachable there.
- [x] Full test suite green; clean build.

## Notes

Found and reproduced by the 036 verification tester (tick 2026-07-23 #5); severity 3 —
duplicate ops-notification spam under real traffic spikes, no user-facing/PII/data
impact. Reproduction and analysis: qa-scripts/probe-036-race.mjs and the Verification
section of assignment 036. 036 itself stays needs_verification, blocked_by this fix —
re-verification of 036 covers both after this lands.
Terminal state needs_verification.

## Build notes (developer, 2026-07-23, fix)

**The fix.** Replaced the `tgflag:<minute>` dedup's check-then-act (`rateLimited()`:
SELECT count then, separately, INSERT) with a genuinely atomic claim, `claimOnce()` in
`api/_ratelimit.js`. It does a single `INSERT ... ON CONFLICT (bucket) DO NOTHING` via
PostgREST (`?on_conflict=bucket` + `Prefer: resolution=ignore-duplicates,
return=representation`): Postgres serializes concurrent inserts against the unique
index, so of two concurrent callers exactly one gets the inserted row back
(`rows.length > 0` → "I won, send") and the other gets an empty array (`rows.length ===
0` → "already claimed, don't send"). `api/track.js`'s `pingVisit()` now calls
`claimOnce(base, H, \`tgflag:${mk - 1}\`)` instead of `rateLimited(...)` for this one
bucket; `overflowCount(prevTotal, !won)` keeps the existing pure signature (`alreadySent`
boolean) from `api/_visitping.js` unchanged — that pure module was not touched at all.

**Migration required — flagged, NOT applied.** The assignment's stated preference was to
stay inside the existing `rate_limits` table (no new table). I could not do that:
`rate_limits.bucket` is deliberately non-unique — other buckets in that same table
(`track:<iphash>`, `g:track`, `tgping:<minute>`) are counters that need many rows per
bucket value within a window, so a table-wide unique constraint on `bucket` would break
them. A *partial* unique index (`unique ... where bucket like 'tgflag:%'`) doesn't work
either: Postgres only uses a partial index for `ON CONFLICT` inference if the `ON
CONFLICT` clause repeats that index's exact predicate, and PostgREST's `on_conflict=`
query param only ever emits a plain `ON CONFLICT (columns)` with no predicate — so a
partial index is silently never chosen as the conflict target through the REST API.
Given that, I added one new minimal table, `rate_limit_claims (bucket text primary key,
created_at timestamptz)`, purely for "claim this key exactly once" semantics (the
`tgflag:<minute>` bucket moved here; all counting buckets stay in `rate_limits`
untouched). **Migration file:
`supabase/migrations/20260723000002_rate_limit_claims_table.sql`** — same
if-not-exists/RLS-on-no-policies posture as the existing `events`/`licenses` migrations.
Mirrored into `supabase/schema.sql` for consistency with how those two are handled there.
**Per decisions/005 precedent (031/019), migrations are applied by the CEO/Shareholder,
not by the developer — I did not run `supabase db push` or touch production.** This
migration must be applied (same path as 031) before the fix is live in production;
until then the old code stays deployed and the race remains reproducible against
production (it is fully fixed and tested in this worktree/branch).

**Digest dedup (`tg-digest:<yesterday>`, `api/cron/notify.js`) — verdict: same racy
*shape*, but unreachable in practice, left unfixed.** `bucketCount()`/`bucketMark()` is
also a check-then-act (count, then later mark) and shares the non-atomic shape in code.
However: (1) it's driven by a single Vercel cron (`vercel.json`: `0 * * * *`, one HTTP
invocation per hour, no fan-out/concurrency — unlike `track.js`, which is hit by many
real concurrent browser requests during exactly a traffic spike); (2) even in the
pathological case where one hourly invocation ran long enough to still be executing when
the next hour's invocation fired, Vercel's serverless function execution-time ceiling is
far shorter than the 3600s gap between cron ticks, so two invocations can never actually
overlap; (3) more importantly, the digest **deliberately** marks its bucket only *after*
a confirmed successful `tg()` send, specifically so a failed send gets retried by the
next hourly tick (documented behavior, verified by the 036 tester's
`probe-036-digest.mjs`). Applying `claimOnce()`'s pre-send atomic-claim pattern here
would break that retry semantics (the bucket would be claimed before send success is
known, so a failed send could never retry). Left `bucketCount`/`bucketMark` untouched, as
instructed.

**Tests.** `qa-scripts/probe-036-race.mjs` updated in place (kept, not replaced) so it
now models `claimOnce()`'s atomic on-conflict/ignore-duplicates path (still with a forced
`tick()` interleave before every DB call, so it stays a live regression check, not just a
historical record) — `node qa-scripts/probe-036-race.mjs` now prints "Overflow summary
messages sent: 1" and exits 0 (previously: 2, exit 1). Its pass condition was tightened
from "at most once" to "exactly once" to match the acceptance criterion wording. Ported
the same scenario plus two companion cases into `test/track.test.js` (shared
`withBackend()` shim extended with an opt-in `raceDelay` option and `on_conflict`/
`ignore-duplicates` simulation — the simulated claim itself has no `await` between its
exists-check and its push, mirroring what a real unique constraint guarantees, so the
race is only forceable via the explicit `raceDelay` ticks, not accidentally by the shim):
- "`>20/minuut-overloop stuurt ... precies één samengevoegde samenvatting`" — normal
  (sequential) minute-boundary crossing, asserts exactly 1 overflow message with the
  correct count.
- "`geen overloop ... stuurt geen samenvatting`" — ≤20 in the previous minute, asserts 0
  overflow messages.
- "`twee gelijktijdige bezoeken ... precies één keer (race, geport uit
  qa-scripts/probe-036-race.mjs)`" — the ported race, `Promise.all` of two concurrent
  invocations, asserts exactly 1.

No existing test was edited or had its assertions changed — `test/visitping.test.js`
(pure `_visitping.js` logic) is completely untouched, and the pre-existing
>20/minute test in `test/track.test.js` (same-minute overflow, no minute-boundary
crossing) is unmodified since it never exercised the `tgflag` dedup path at all.

**Exact counts.** `npm install` (fresh worktree, 22 packages) →
`npm test`: **146/146 passing** (baseline 143 + 3 new race/collapse tests).
`node qa-scripts/probe-036-race.mjs`: **PASS, exactly 1 overflow message**.
`npm run build`: clean (`vite build`, 94 modules transformed). Reverted the
`gen-content.mjs`-driven `public/**` churn with `git checkout -- public/` before
committing, per instructions.

**Files changed:** `api/_ratelimit.js` (new `claimOnce()`), `api/track.js` (`pingVisit`
now uses it for the `tgflag:<minute>` bucket), `supabase/migrations/
20260723000002_rate_limit_claims_table.sql` (new — **NOT applied, needs CEO/Shareholder
action per decisions/005 precedent**), `supabase/schema.sql` (mirrored the new table),
`qa-scripts/probe-036-race.mjs` (updated to model the fix), `test/track.test.js`
(3 new tests + shim support for the atomic on-conflict path), this assignment file.

**Adjacent, not fixed here (per PROTOCOL, noted for the board, not opened as
assignments):** `rate_limits` and now `rate_limit_claims` both have no prune/TTL job
(same pre-existing gap the 036 tester already flagged for `rate_limits`) — table growth
is unbounded over time for both. Not in scope for this fix.
