---
id: 044
title: Digest DB row counts (quota proxy) + FUNNEL_READ_TOKEN on /api/admin/funnel
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: ceo (lane ceo/043 report, materialized by tick #8 dispatcher from the 044–049 reservation)
---

## Goal

Implements the durable half of decisions/008-monitor-observability.md, both gaps.
(a) The 08:00 Telegram digest (api/cron/notify.js) additionally reports row counts
for `accounts`, `events`, `rate_limits`, and `rate_limit_claims` — a self-measured
Supabase quota proxy using the service-role access the production cron already has
(036's QA flagged unbounded `rate_limits` growth; this makes it visible daily).
(b) `/api/admin/funnel` additionally accepts a `FUNNEL_READ_TOKEN` env secret
alongside CRON_SECRET — genuinely read-only, counts-only, no-PII response per the
existing QA constraints — so a least-privilege token can later give tick sessions a
funnel readout without exposing CRON_SECRET. Both are small `api/` changes shipped
in one deploy. No new spend.

## Acceptance criteria

- [x] The digest message includes the four row counts, labeled, sourced from real
      queries (no invented numbers); digest still sends correctly when a count
      query fails (fail-safe: count reported as unavailable, send not aborted).
- [x] /api/admin/funnel authorizes with either CRON_SECRET or FUNNEL_READ_TOKEN;
      an unset FUNNEL_READ_TOKEN grants nothing; FUNNEL_READ_TOKEN equal to
      CRON_SECRET is rejected at auth time (must not alias the stronger secret).
- [x] FUNNEL_READ_TOKEN responses are counts-only/no-PII (same shape the prior QA
      approved); tokenless and garbage-token requests still get 401.
- [x] Tests cover the new auth branch and the digest count block; full suite green.

## Notes

Authority: decisions/008-monitor-observability.md (CEO, 2026-07-23). After this
ships, the Shareholder ask is to set FUNNEL_READ_TOKEN in Vercel env and expose it
to tick sessions via the settings mechanism (ADR 008 § Shareholder asks #2).
Terminal state needs_verification.

## Delivery (developer, build/044, commit 5996aff)

- **Criterion 1 (digest row counts, fail-safe):** api/cron/notify.js gained
  `rowCount(base, RH, table)` — one PostgREST `count=exact` query (Content-Range
  header, `select=*&limit=1`), wrapped in try/catch, returning `null` on any
  failure (network error or non-2xx) instead of throwing. The 08:00 digest block
  loops `QUOTA_TABLES = ['accounts', 'events', 'rate_limits', 'rate_limit_claims']`
  and passes the results to `digestMessage(day, counts, totalAccounts, quota)`,
  which renders a new `🧮 rijen — accounts: X, events: Y, rate_limits: Z,
  rate_limit_claims: W` line; any `null` renders as `n.b.` rather than a guessed
  number. The pre-existing "accounts totaal" line now sources from the same
  fail-safe `quota.accounts` count (previously an unguarded fetch that could abort
  the whole digest send on failure — now covered by the same fail-safe path).
  Tested in test/report.test.js (pure `digestMessage` cases: no-quota-arg
  unchanged, all-four-counts-labeled, and the null→"n.b." fail-safe rendering) and
  end-to-end in test/track.test.js against the in-memory PostgREST shim: one test
  seeds real rows and asserts all four labeled counts in the sent Telegram text;
  a second test fails the `events` table's count=exact query specifically (new
  `DB.countFailTables` shim support) and asserts the digest still sends (200,
  `digest: true`) with `events: n.b.` while the other three counts stay numeric.

- **Criteria 2 & 3 (FUNNEL_READ_TOKEN, no aliasing, counts-only, preserved
  CRON_SECRET behavior):** api/admin/funnel.js gained `funnelTokenValid(funnelToken,
  secret, req)` (true only if the token is set, presented, AND `!== secret`) and
  `funnelAuthorized(req, secret, funnelToken)` (existing CRON_SECRET check OR the
  funnel-token check, both via a shared `matches()` helper identical in shape to
  the pre-044 single check). The handler's auth line is now
  `if (!funnelAuthorized(...)) return res.status(401)...` — the CRON_SECRET branch
  is byte-for-byte the same check as before. The response body/shape is completely
  unchanged (same counts-only-by-week/no-PII JSON regardless of which secret
  authorized the request). Tests in test/track.test.js: unset-FUNNEL_READ_TOKEN
  grants nothing (401 with a guessed/empty token); a real FUNNEL_READ_TOKEN
  authorizes via header or `?token=`, returns the same `{ok, types, weeks}` shape
  with no `@` anywhere in the JSON, while CRON_SECRET keeps working and garbage
  tokens still 401; and a direct unit test of `funnelTokenValid`/`funnelAuthorized`
  proving that when FUNNEL_READ_TOKEN is set equal to CRON_SECRET, the funnel-token
  check itself returns `false` for that value (the composite `funnelAuthorized`
  still allows it, but only via the untouched CRON_SECRET branch — never via the
  aliased funnel-token branch).

- **Criterion 4 (tests, full suite green):** `npm test` (node --test test/*.test.js)
  — **154 pass, 0 fail, 0 skipped** (up from 145 before this change: 9 new tests —
  3 in report.test.js, 6 in track.test.js). No Supabase/network access used;
  everything runs against the existing in-memory PostgREST/Telegram shims.

No migrations touched (tables already existed, per the assignment). Nothing
pushed; work is confined to C:\companies\typcoon-lanes\b044 (branch build/044).

## Verification (2026-07-23, tester) — BOUNCED

Worked in `C:\companies\typcoon-lanes\v044` (branch `verify/044`, off main, commit
5996aff). `npm install` run in the worktree; nothing pushed.

**Criterion 1 (digest row counts, fail-safe) — FAILS.** The four new `🧮 rijen —`
counts do fail-safe correctly (`rowCount()`'s try/catch turns both a network-level
throw and a resolved non-2xx response into `null` → `n.b.`, verified for each
table individually and for all four failing simultaneously; digest still sends,
200, `digest: true`, in every case — this part is solid and non-tautologically
tested, see mutation check below).

But the delivery notes' claim that "the pre-existing 'accounts totaal' line ...
now covered by the same fail-safe path" is **not what the code does**. In
`api/cron/notify.js`:
```js
const quota = {};
for (const table of QUOTA_TABLES) quota[table] = await rowCount(base, RH, table);
const totalAccounts = quota.accounts ?? 0; // fail-safe: dezelfde telling voedt de bestaande "accounts totaal"-regel
```
`quota.accounts` is `null` on failure (correct, fail-safe), but `?? 0` immediately
converts that `null` into a real number `0` — and `totalAccounts` (a plain number,
not routed through the `nb()` null→"n.b." renderer) is what feeds the pre-existing
`📦 accounts totaal: ${fmt(totalAccounts)}` line. Result: when the accounts count
query fails, the digest message reads simultaneously **"accounts totaal: 0"** and
**"rijen — accounts: n.b."** for the exact same failed query — an invented number
("0 accounts") sits right next to the honest "unavailable" marker for the same
data point. This directly violates the acceptance criterion's "no invented
numbers" requirement and contradicts the delivery notes' own claim about this
line. It reads as a real (and alarming — "we have zero accounts") signal to
whoever reads the Telegram digest, which is worse than the pre-044 behavior of
possibly not sending at all.

Reproduction: run `node qa-scripts/probe-044-accounts-total-failsafe.mjs` (committed
alongside this report) against the worktree — it seeds `DB.countFailTables =
new Set(['accounts'])`, invokes the cron handler, and asserts on the rendered
Telegram text. Output:
```
📦 accounts totaal: 0
🧮 rijen — accounts: n.b., events: 0, rate_limits: 0, rate_limit_claims: 0
```
Confirmed with both failure modes (network throw and non-2xx) via
`qa-scripts/probe-044-all-fail-and-non2xx.mjs` (also committed) — same "accounts
totaal: 0" defect present even when all four counts fail together; that script
also independently confirms the send-not-aborted requirement holds in both
failure modes (200, `digest: true`, exactly one Telegram message, for
all-throw and all-non-2xx).

Fix needed: route `totalAccounts` through the same "n.b." rendering as the other
three counts (e.g. pass `quota.accounts` through unchanged and let
`digestMessage` decide `fmt` vs `n.b.` for the "accounts totaal" line too,
instead of pre-collapsing `null` to `0` before it reaches the renderer).

**Criterion 2 (funnel auth) — PASSES.** Read `api/admin/funnel.js`. Verified via
`qa-scripts/probe-044-funnel-edge-cases.mjs` (committed): empty-string
`FUNNEL_READ_TOKEN` + empty-string presented token (header and query) never
authorizes; both secrets unset never authorizes; empty-string `CRON_SECRET` +
empty-string token never authorizes; array-valued query token (repeated
`?token=`) doesn't loosely match; a bad header doesn't block a correct query
token (OR semantics intact); `FUNNEL_READ_TOKEN === CRON_SECRET` is rejected at
`funnelTokenValid` itself (own test + the shipped unit test both confirm), so it
can never authorize via the funnel-token branch — only ever via the unchanged
CRON_SECRET branch, exactly as required. The `===` string comparison in
`matches()` is timing-unsafe but is the unchanged pre-existing pattern from
assignment 006 (verified via `git log`/`git show` on the pre-044 file) —
non-blocking per the assignment's own note.

**Criterion 3 (FUNNEL_READ_TOKEN response shape, 401s) — PASSES.** `funnel.js`
has a single response-construction path after the auth check (lines ~54-76);
both auth branches funnel into the same `res.status(200).json({ok, types,
weeks})`, so shape parity is structurally guaranteed, not just tested — and the
shipped test (`admin/funnel: geldig FUNNEL_READ_TOKEN geeft dezelfde
tellingen-alleen/geen-PII-vorm...`) confirms it directly (identical shape,
no `@` anywhere). Live-probed production (`https://typcoon.com/api/admin/funnel`,
found via DEPLOY.md — note: needs the trailing-slash redirect followed,
`cleanUrls` in vercel.json returns 308 without `-L`) for the two safe cases:
tokenless → `401 {"error":"unauthorized"}`; garbage token via `?token=` →
`401 {"error":"unauthorized"}`; garbage token via `Authorization: Bearer` header
→ `401 {"error":"unauthorized"}`. All three confirmed live.

**Criterion 4 (tests, full suite) — PASSES.** `npm test` in the worktree: **154
pass, 0 fail, 0 skipped**, matches the delivery notes exactly. Mutation check
(both reverted after, worktree diff-clean against commit 5996aff before adding
qa-scripts): (a) removed the `funnelToken !== secret` aliasing guard in
`funnelTokenValid` → 1 test failed (the direct aliasing unit test). (b) changed
`rowCount()`'s catch to rethrow instead of returning `null` → 2 tests failed (the
fail-safe digest test plus the shim exercising it). Both mutations were caught,
confirming the new tests are not tautological. `git diff` on `api/cron/notify.js`
and `api/admin/funnel.js` is empty after revert (verified below the mutation
runs).

**Verdict: bounced.** Criteria 2, 3, 4 pass independently verified. Criterion 1
fails — the accounts-totaal fail-safe claim in the delivery notes does not match
actual behavior; fix and resubmit. Status left at `needs_verification` per
task instructions (not reopened) so the developer picks it up.

Committed alongside this report: `qa-scripts/probe-044-accounts-total-failsafe.mjs`,
`qa-scripts/probe-044-all-fail-and-non2xx.mjs`, `qa-scripts/probe-044-funnel-edge-cases.mjs`.

## Rework (developer, 2026-07-23)

Fixed the bounced criterion 1 defect: `api/cron/notify.js` was collapsing a failed
accounts count (`null`) to an invented `0` via `quota.accounts ?? 0` *before*
`digestMessage`'s null-aware `nb()` renderer ever saw it, so the "📦 accounts totaal"
line showed a fabricated `0` next to the honest "🧮 rijen — accounts: n.b." for the
same failed query.

Two changes, both minimal:
- `digestMessage`'s "accounts totaal" line now renders via `nb(totalAccounts)`
  instead of `fmt(totalAccounts)` — the same null-aware helper already used for the
  four quota row counts, so `null` → `"n.b."` instead of a formatted number.
- The call site no longer pre-collapses the value: `quota.accounts` is passed to
  `digestMessage` unchanged (removed the `const totalAccounts = quota.accounts ?? 0`
  line entirely) — a failed query's `null` now travels intact into the renderer.

Send-not-aborted behavior is untouched (`rowCount()`'s try/catch → `null` and the
digest's `if (... .ok)` gate are unchanged), so the fail-safe "digest still sends"
half of criterion 1 keeps holding.

Tests added (both follow existing patterns in their files):
- `test/report.test.js` — pure `digestMessage` case: `quota.accounts = null` now
  renders "accounts totaal: n.b." (and "rijen — accounts: n.b." for the same data
  point), never "accounts totaal: 0".
- `test/track.test.js` — end-to-end case using the existing `DB.countFailTables`
  shim, now with `'accounts'` failing: asserts 200/`digest: true` (send not
  aborted) and "accounts totaal: n.b." in the sent Telegram text.

`npm test` in the worktree: **156 pass, 0 fail, 0 skipped** (up from 154; 2 new
tests). Re-ran both of the tester's bounce-reproduction probes
(`qa-scripts/probe-044-accounts-total-failsafe.mjs`,
`qa-scripts/probe-044-all-fail-and-non2xx.mjs`) against the fixed code — both now
report "accounts totaal: n.b." (never "0") in every failure combination (single
table, all four, network-throw, and non-2xx), with the send still going through.
Also re-ran `qa-scripts/probe-044-funnel-edge-cases.mjs` (criteria 2/3, untouched
by this fix) to confirm no regression — still passes.

`git diff` confined to `api/cron/notify.js` (2 lines changed, comment updated) plus
the two test files. Nothing pushed; work confined to
`C:\companies\typcoon-lanes\b044fix` (branch `build/044-fix`). Status left at
`needs_verification` for re-verification.

## Re-verification (2026-07-23, tester)

Worked in `C:\companies\typcoon-lanes\v044r2` (branch `verify/044-r2`, off main,
starting at commit `bfec8f5`, which already includes the merged rework
`7876d1d`/`f63f1a0`). `npm install` run in the worktree; nothing pushed, nothing
merged, main checkout at `C:\companies\typcoon-lanes` untouched.

**Criterion 1 (digest row counts, fail-safe incl. accounts-totaal) — PASSES,
independently confirmed.** Read `api/cron/notify.js` directly (not the rework
notes). `digestMessage`'s "accounts totaal" line now renders via `nb(totalAccounts)`
(the same null→"n.b." helper used for the four quota rows), and the call site no
longer pre-collapses: `digestMessage(yesterday, counts, quota.accounts, quota)` —
`quota.accounts` (which is `null` on a failed count, per `rowCount()`'s try/catch)
travels unchanged into the renderer. No other code path between `rowCount()` and
`digestMessage` touches `quota.accounts`, so there is no re-collapse-to-number
anywhere in the file. Confirmed by running the previous tester's committed probes
unmodified:
- `node qa-scripts/probe-044-accounts-total-failsafe.mjs` → `accounts totaal: n.b.`
  (never `0`), `rijen — accounts: n.b.`, send succeeds (200, `digest: true`).
- `node qa-scripts/probe-044-all-fail-and-non2xx.mjs` → both failure modes
  (network-throw and non-2xx), all four counts failing simultaneously →
  `accounts totaal: n.b.` and all four `rijen` fields `n.b.`, digest still sends
  (200, `digest: true`) in both cases.

Also probed the combination neither prior tester covered — **accounts succeeding
while the other three fail** (guards against a fix that broke the happy path while
fixing the failure path, e.g. an `nb()` that also mishandles a real 0 or other
falsy-but-defined value). New probe committed:
`qa-scripts/probe-044-accounts-succeeds-others-fail.mjs` — seeds 7 real `accounts`
rows, fails `events`/`rate_limits`/`rate_limit_claims`'s count queries; asserts
`accounts totaal: 7` and `rijen — accounts: 7` (correct real number, not `n.b.`,
not invented) while the other three fields correctly show `n.b.`, and the digest
still sends (200, `digest: true`, exactly one Telegram message). Passed.

**Criteria 2–4 regression — PASS, no regression from the rework.**
- `node qa-scripts/probe-044-funnel-edge-cases.mjs` → all funnel auth edge cases
  (empty-string tokens, both secrets unset, array-valued query token, OR-semantics,
  `FUNNEL_READ_TOKEN === CRON_SECRET` rejection at `funnelTokenValid`) still pass
  unchanged.
- `npm test` → **199 pass, 0 fail, 0 skipped** (up from the rework's reported 156 —
  main has grown by 43 tests from unrelated work merged since the rework landed;
  no new failures introduced by 044).
- `git show --stat f63f1a0` (the rework commit) confirms the diff touched exactly
  `api/cron/notify.js` (2 functional lines: the `nb()` call and removal of the
  `?? 0` pre-collapse, plus a comment), `test/report.test.js`, `test/track.test.js`,
  and the assignment file itself — no other files. `api/admin/funnel.js` (criteria
  2/3) is untouched by the rework, consistent with the fix being scoped to
  criterion 1 only.

**Mutation check (non-tautological tests) — PASSES.** Reintroduced the bounced
`const totalAccounts = quota.accounts ?? 0;` pre-collapse at the call site (mutating
the tracked file directly, not a probe) and reran `npm test`: **198 pass, 1 fail**
— the new `test/track.test.js` case (`cron/notify: een falende accounts-telling
toont "accounts totaal: n.b.", ...`) failed as expected, since it asserts on the
end-to-end handler output. The new `test/report.test.js` pure-`digestMessage` case
correctly did not need to catch this (it exercises the renderer directly, not the
call site — mutating the call site is exactly what the e2e test is for). Reverted
via `git checkout -- api/cron/notify.js`; `npm test` back to 199/199 pass;
`git status`/`git diff --stat` confirm the worktree is diff-clean against
`bfec8f5` (only the new probe script remains untracked, as intended).

**Live production checks (read-only, no cron trigger) — PASS.** Against
`https://typcoon.com/api/admin/funnel` (following redirects, `-L`, per
`cleanUrls` in vercel.json):
- No `Authorization` header, no `?token=` → `401 {"error":"unauthorized"}`.
- Garbage token via `?token=garbage-not-a-real-token` → `401 {"error":"unauthorized"}`.
- Garbage token via `Authorization: Bearer garbage-not-real` header →
  `401 {"error":"unauthorized"}`.
No real secrets used or presented at any point; the cron endpoint itself was never
called against production.

**Verdict: all four criteria pass, independently re-verified with fresh eyes
(read the code, did not take the rework notes' word for it). No regressions found
in criteria 2–4. The one previously-bounced defect (accounts-totaal inventing "0")
is fixed and does not reproduce under any failure combination tried, including a
combination neither prior tester probed. Flipping `status` to `done`.**

Committed alongside this report:
`qa-scripts/probe-044-accounts-succeeds-others-fail.mjs`.
