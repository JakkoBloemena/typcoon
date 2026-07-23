---
id: 038
title: Fix double-send race in the >20/min collapse summary (atomic dedup claim)
owner: developer
status: done
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

## Verification (tester, 2026-07-23)

**Setup.** Worktree `verify/038` (already checked out on top of the integrated build,
`a0350fd`/`baba123`), `npm install` (fresh, 22 packages), `npm test`, `npm run build`,
reverted the established `scripts/gen-content.mjs`-driven `public/**` churn with
`git checkout -- public/` before committing, per precedent.

**Results — all four acceptance criteria independently verified, all pass:**

1. **`node qa-scripts/probe-036-race.mjs`** → `PASS: overflow summary sent exactly once
   even under concurrent next-minute invocations.` Exit 0. Matches build notes. The probe
   genuinely models PostgREST's real `on_conflict`/`ignore-duplicates` return shape (empty
   array = loser, `[row]` = winner), not a hand-wave.

2. **`npm test` → 146/146 passing** (baseline 143 + 3 new). Matches build notes exactly.

3. **Read `api/_ratelimit.js`'s `claimOnce()` and `api/track.js`'s `pingVisit()`
   critically, then probed the edge cases by hand** — wrote
   `qa-scripts/probe-038-claimonce-edges.mjs` (new, committed) covering three angles the
   existing suite/probe don't exercise directly:
   - **Missing-table fail-safe (039 unapplied)**: simulated the real PostgREST 404/PGRST205
     shape a POST to a nonexistent `rate_limit_claims` relation would actually return
     (JSON error body, not an empty array, `ok: false`). `claimOnce()` correctly returns
     `false` (never throws); the full `pingVisit()` path through `track.js`'s handler
     still returns 204, never throws into the request path, and correctly sends **no**
     overflow summary at all (fails safe to "not won" exactly as the build notes claim —
     confirmed this is a real behavior, not just an assertion in the notes).
   - **Claim fetch throws (network blip)**: same result — `false`, no throw, no summary
     sent, request path unaffected.
   - **Three-way concurrency**: extended the two-way race to three simultaneous callers
     racing the same `tgflag:<minute>` claim (`Promise.all` of three, same
     `setImmediate`-tick interleave forcing technique as the existing race test/probe) —
     exactly one summary sent, not zero, not two, not three.
   All 7 checks in the new probe pass (`node qa-scripts/probe-038-claimonce-edges.mjs` →
   exit 0). PostgREST semantics assumption (`on_conflict=bucket` +
   `Prefer: resolution=ignore-duplicates,return=representation` → winner gets `[row]`,
   loser gets `[]`, all via a real Postgres unique-index conflict) checked against
   documented PostgREST upsert behavior and found consistent with the code's assumptions.

4. **Normal collapse behavior unchanged** — re-read `api/_visitping.js` (fully untouched,
   confirmed via the pure unit tests at lines 139-141 in the suite output: `minuteKey`,
   `shouldPingVisit`, `overflowCount` all still pass unmodified) and the three new
   `test/track.test.js` cases read skeptically line by line:
   - The "normal overflow" test genuinely exercises the minute-boundary path (freezes
     `Date.now`, fills 25 pings in minute 0 sequentially, advances a full minute, asserts
     exactly one `+5 bezoeken afgelopen minuut`) — not tautological, it would fail against
     the pre-038 code path if the atomic claim were removed.
   - The "no overflow" test (15 ≤ 20 in the previous minute) asserts zero overflow
     messages — real negative-case coverage.
   - The ported race test is the same scenario as `probe-036-race.mjs`, `raceDelay: true`
     forcing a `setImmediate` tick before every DB call including inside the claim POST
     path, so the race window is genuinely forced open; the claim itself has no `await`
     between the shim's exists-check and its push (mirroring what a real unique
     constraint guarantees atomically at the DB level) — this is the correct way to
     model "atomic at the DB, but the surrounding I/O still has real latency", not a shim
     that accidentally can't race. Confirmed by manually reverting `api/track.js` to call
     `rateLimited()` instead of `claimOnce()` for the `tgflag` bucket and re-running just
     this test — it fails (2 overflow messages) as expected, proving the test has actual
     teeth and isn't tautological. Reverted after confirming.
   - Confirmed independently (separate from these three) that first-20-individual /
     21st+-silent behavior is untouched: pre-existing `>20 bezoeken binnenzelfde minuut`
     test in `test/track.test.js` still passes and was not modified (diff-checked against
     036's version).

5. **Digest dedup verdict re-derived independently, not taken on faith:**
   - Confirmed `api/cron/notify.js` still uses `bucketCount`/`bucketMark` (not
     `claimOnce`) for `tg-digest:<yesterday>` — grepped the file directly, zero
     `claimOnce` references there.
   - Confirmed `vercel.json` has exactly one cron entry (`0 * * * *`, hourly, single
     path) — no fan-out, no second cron that could overlap it.
   - Ran the pre-existing `qa-scripts/probe-036-digest.mjs` standalone (untouched by this
     assignment) — all 8 probes still pass, confirming the digest's mark-after-confirmed-
     send retry semantics genuinely still work end to end and weren't accidentally
     affected by the `claimOnce()` addition living in the same file
     (`api/_ratelimit.js`).
   - The reasoning that Vercel's execution-time ceiling is far below the 3600s
     inter-cron gap holds generically (Vercel serverless function limits top out in the
     minutes, not the hour, on every plan tier) — no plausible overlap path exists for a
     single hourly cron with no concurrent trigger source, unlike `track.js` which is hit
     by many real concurrent browser requests. Verdict endorsed as sound.
   - **Non-blocking observation (pre-existing, not introduced by 038):** both
     `claimOnce()` (new, for the per-visit overflow summary) and the pre-existing
     `rateLimited()` it replaces claim/mark the bucket *before* `tg()` confirms the send
     succeeded — unlike the digest, which deliberately marks only *after* a confirmed
     send specifically to get retry-on-failure semantics. This means if the "winning"
     caller's `tg()` call for the overflow summary itself fails (Telegram transiently
     down), that overflowed minute's summary is lost with no retry — the bucket is
     already claimed, so a later pageview's `claimOnce()` call correctly reports "already
     claimed" and stays silent. Checked `git show a84b890:api/track.js` (the pre-038,
     036-authored version) and confirmed this ordering (mark-before-confirmed-send) is
     unchanged by this fix — `rateLimited()` also inserted its row before knowing whether
     `tg()` would succeed, so this is not a regression 038 introduced, just an existing
     trait carried over unmodified. Not filed as a defect (pre-existing, severity would be
     4/cosmetic — an occasional missed ops notification on a rare Telegram outage, not a
     duplicate or data-loss issue), noted here for completeness per the tester contract.

6. **`npm run build`** → clean, `vite build`, 94 modules transformed, no errors/warnings.
   `public/**` gen-content churn reverted with `git checkout -- public/` before
   committing, per precedent.

7. **Additional probing beyond the listed criteria:** the three-scenario
   `qa-scripts/probe-038-claimonce-edges.mjs` above (missing table, claim-fetch-throws,
   three-way race) was written specifically because the assignment's own text called out
   "hunt for edge cases... what if the PostgREST request errors, times out, returns
   non-2xx? What happens on the FIRST minute after deploy when the table doesn't exist
   yet" — these were read/reasoned-about in the build notes but not actually exercised
   by any existing test or probe before this verification pass. All pass.

**Verdict: VERIFIED DONE.** All four acceptance criteria hold under independent
re-derivation and hands-on probing, not just re-reading the build notes. No defect
found. One non-blocking, pre-existing (not introduced by this assignment) observation
recorded above for completeness. Setting `status: done`.

Files added by this verification pass: `qa-scripts/probe-038-claimonce-edges.mjs` (new,
standalone, `node qa-scripts/probe-038-claimonce-edges.mjs`, not part of `npm test`) and
this Verification section.
