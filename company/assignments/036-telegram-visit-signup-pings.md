---
id: 036
title: Typie pings — message on every site visit + signup, and a daily digest
owner: developer
status: needs_verification
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

- [x] A stored pageview triggers exactly one Telegram message; rejected/dropped
      events trigger none (extend test/track.test.js's shim with a tg spy).
- [x] The beacon response stays 204 and is not delayed/failed by Telegram errors
      (test with a throwing tg stub).
- [x] Digest: fires once per day at 08:00 Amsterdam from the hourly cron with
      correct yesterday-window counts (unit-test the window/dedup logic the same way
      _report.js is tested); sends explicitly-zero digests.
- [x] tg() errors logged, not swallowed; no PII in any message (paths + counts only,
      no session ids, no emails).
- [x] Per-visit pings respect Telegram's rate tolerance: if >20 pings would fire
      within a minute, collapse the remainder into one summary message ("+N bezoeken
      afgelopen minuut") — protects against both traffic spikes and beacon abuse.
- [x] All tests green, clean build.

## Notes

Telegram creds are live in Vercel (TELEGRAM_BOT_TOKEN/CHAT_ID, set 14d ago). At
future real traffic, per-visit pings get noisy — switching to digest-only is a
one-line revert the Shareholder can order via /ceo; note this in the code comment.
Terminal state needs_verification.

## Build notes (developer, 2026-07-23)

**Per-visit ping (api/track.js).** Restructured the handler to respond `res.status(204)
.end()` immediately after the events insert, then (still inside the same async function,
so Vercel's Node runtime keeps the invocation alive until it settles — no separate
`waitUntil` needed) run `pingVisit()` for stored `pageview` rows only. `stored` is only
set when the insert didn't throw, so rejected/rate-limited/invalid events never ping.
The client-facing 204 is written before any Telegram call, so a throwing `tg()` can
never delay or change the response — verified with a throwing-fetch stub in the test's
shim (`DB.tgThrows`).

**Collapse rule (api/_visitping.js, pure).** Fixed (non-sliding) one-minute buckets in
the existing `rate_limits` table (`tgping:<minuteKey>`, no new table): the first 20
pings in a minute send individually; the 21st+ are silently counted. When the next
pageview lands in a later minute, it opportunistically checks the just-elapsed minute's
total and — once, deduped via a `tgflag:<minute>` bucket through the existing
`rateLimited()` — sends one "+N bezoeken afgelopen minuut" summary. `shouldPingVisit` /
`overflowCount` / `minuteKey` are pure and unit-tested in test/visitping.test.js.

**Signup ping (api/account/create.js).** Left untouched — already wired (line ~66),
masks the email, no duplicate call added. Verified it actually fires post-env-fix by
setting live-shaped TELEGRAM_BOT_TOKEN/CHAT_ID in test/backend.integration.test.js and
asserting on a new Telegram spy (previously those env vars weren't set in that test, so
tg() was silently short-circuiting and the call path was never exercised).

**Daily digest (api/cron/notify.js + api/cron/_report.js).** Runs first in the handler,
before the accounts early-return, so it always evaluates even with zero opted-in
accounts. Dedup uses the existing `rate_limits` table as a lock (`tg-digest:<yesterday>`,
via new `bucketCount`/`bucketMark` helpers in api/_ratelimit.js) rather than a new
per-account or meta column — mirrors the existing anti-abuse-bucket pattern, no schema
change. `digestDue({hour, alreadySent})` (hour>=8, same resilience pattern as
weeklyDue's hour>=18) and `yesterdayKey`/`tallyByType` are pure, unit-tested in
test/report.test.js exactly like weeklyDue/reminderDue. The digest message is built
even when every count is 0 (asserted directly). `tg()` now returns `{ ok }`; the digest
bucket is only marked sent after a confirmed send, so a transient Telegram failure gets
retried on the next hourly tick instead of silently losing that day's liveness signal.

**tg() (api/_telegram.js).** No longer swallows: logs via `console.error` on both a
non-OK HTTP status and a thrown/rejected fetch, and returns `{ ok, reason? }` so callers
that need confirmed-delivery semantics (the digest) can act on it. Never throws itself,
so it's still safe to call unawaited/best-effort everywhere else.

**No PII:** all three message types (visit, signup — pre-existing, digest) carry only
path/country/counts/masked-email; no session ids, no raw emails. Checked with `/@/`-free
assertions in the new tests.

**Tests:** 143/143 passing (baseline was 130; +13: 5 in test/track.test.js — single
ping per stored pageview, no ping for non-pageview types, no ping for
rejected/unstored pageviews, 204+stored-row survives a throwing tg stub, >20/minute
collapse; 3 in new test/visitping.test.js — pure minuteKey/shouldPingVisit/
overflowCount; 5 in test/report.test.js — digestDue/yesterdayKey/tallyByType/
digestMessage-zero/digestMessage-real). test/backend.integration.test.js extended
with a Telegram spy + live-shaped creds; asserts the signup ping fires and that the
cron response always carries a `digest: boolean` field.

**Build:** `npm install` (node_modules wasn't present in this fresh worktree) then
`npm run build` — clean (vite build succeeds). `npm run build` regenerates
`public/**` (unrelated line-ending/whitespace churn from scripts/gen-content.mjs,
same as prior assignments) — reverted with `git checkout -- public/` before
committing, per established precedent; no public/ files are part of this commit.

No new assignment/decision ids allocated. No schema/migration changes (reused the
existing `rate_limits` table for both the digest dedup and the per-minute ping
counters instead of adding a table).

## Verification (tester, 2026-07-23)

**Setup.** Fresh worktree at `verify/036` (main `8245c9b`), `npm install` (no
node_modules present), `npm test`, `npm run build`, reverted the established
`public/**` gen-content churn with `git checkout -- public/` before finishing.

**Results:** `npm test` → **143/143 passing** (matches build notes). `npm run build` →
clean (`vite build` succeeds, 94 modules transformed). No console errors during build.

**Criteria independently re-derived from code (not from build notes):**
- Stored pageview → exactly one ping; rejected/non-pageview/non-stored → none. Verified
  by reading `api/track.js` (ping only inside `if (stored && stored.type === 'pageview')`,
  `stored` only set after a non-throwing insert) and re-running the existing
  `test/track.test.js` suite (5 new cases cover this).
- 204-never-blocked-by-Telegram: verified structurally, not just by test — `res.status
  (204).end()` (track.js:79) executes unconditionally *before* `pingVisit()` is ever
  called, and `tg()` (api/_telegram.js) wraps its fetch in try/catch and can never throw
  by construction, so there is no code path where a Telegram failure could reach the
  response. Confirmed with the existing `DB.tgThrows` test (event still stored, 204
  still returned, `DB.tg.length === 0`).
- Digest window/DST/dedup: wrote `qa-scripts/probe-036-digest.mjs` (freezes `Date.now()`
  to exercise real wall-clock scenarios the unit tests can't reach) — probed: digest
  fires at 08:00 Amsterdam in both winter (CET, UTC+1) and summer (CEST, UTC+2) from a
  UTC-based hourly cron tick (confirms `amsParts()`'s `Intl.DateTimeFormat` with
  `timeZone: 'Europe/Amsterdam'` is genuinely timezone-aware, not a hardcoded offset);
  does not fire before 08:00 local; correctly tallies only the Amsterdam yesterday-window
  (an event at 22:01 UTC, i.e. just after midnight Amsterdam, is correctly excluded from
  "yesterday"); sends explicit-zero counts for empty categories; when `tg()` returns
  `ok:false` the digest bucket is *not* marked sent and a later hourly tick correctly
  retries and then dedupes; when the events-table query throws, the cron returns 500
  without marking the bucket sent, and recovers cleanly on the next hourly tick (no
  digest is permanently lost). All 8 probes in this script pass — **no defect found**
  here; this is solid.
- `tg()` errors: confirmed `console.error` on both non-OK HTTP status and thrown/rejected
  fetch, never rethrows (api/_telegram.js).
- No PII: `pingVisit`'s message uses only `row.path` (already constrained by `PATH_RE`,
  so no `<`/`&`/`@` can reach it) and `row.country` (4-char cut of the Vercel geo header);
  digest message is counts-only; signup ping (pre-existing, untouched, not duplicated —
  confirmed only one `tg()` call in `api/account/create.js`) uses the masked email it
  already built. No raw email/session-id path found in any of the three message builders.
- Collapse rule (>20/min): unit tests + read confirm the first 20 in a fixed minute send
  individually and the 21st+ are silently counted, with the summary opportunistically
  sent once a pageview lands in a later minute.

**Defect found — collapse-summary can double-send under concurrent invocations.**
`api/_visitping.js`'s dedup for the overflow summary rides `rateLimited()`
(`tgflag:<minute>`, max 1) in `api/_ratelimit.js`, which does a non-atomic
SELECT-count-then-INSERT. Two pageviews landing in the same "next minute" close enough
in time (realistic on Vercel during exactly the traffic-spike conditions this feature
exists to handle — multiple concurrent invocations are the norm, not the exception,
right when a minute has overflowed) can both read `count === 0` on the `tgflag:<minute>`
bucket before either has inserted, so both compute `alreadyFlagged = false` and both
send the "+N bezoeken afgelopen minuut" summary — a duplicate Telegram message for the
same overflowed minute. This violates the acceptance criterion "one ... summary message
sent once (deduped)".

Reproduced deterministically in `qa-scripts/probe-036-race.mjs`: fill minute 0 with 25
pageviews (prevMinuteTotal 25, i.e. overflowed by 5), then fire two pageviews
"concurrently" (`Promise.all`) in minute 1 against a fetch shim that yields a tick
(`setImmediate`) between the SELECT and INSERT phases of every rate_limits call, mirroring
real network latency. Result: **`+5 bezoeken afgelopen minuut` sent twice**, not once.
Run with `node qa-scripts/probe-036-race.mjs` (exits 1 and prints both duplicate messages
on failure).

Filing as a defect for the developer (dispatcher to allocate the id from 038-039):
Telegram digest/ping duplicate-summary race — the per-minute overflow dedup uses a
check-then-act pattern (`rateLimited()`) that isn't atomic against concurrent serverless
invocations; needs either an atomic upsert/unique-constraint-based claim on
`tgflag:<minute>`, or an equivalent compare-and-swap, to guarantee at-most-one send.
Proposed severity: 3 (duplicate ops-notification spam under real traffic spikes — the
exact scenario the feature is meant to handle gracefully; not a security or core-flow
issue, no PII, no data loss, no user-facing impact).

**Other observations, not filed as defects (low confidence / low severity / pre-existing
patterns, listed for completeness):**
- The digest's events query (`limit=200000`, no explicit `order=`) could theoretically
  under-count "yesterday" if the 2-day window ever exceeds 200k rows and PostgREST's
  default ordering doesn't favor the most recent rows — unrealistic at current traffic,
  and mirrors the `limit=5000` pattern used elsewhere in this cron already.
- `bucketMark`/`bucketCount` add unbounded rows to `rate_limits` (one per stored
  pageview, forever — no prune/TTL job exists for this table). This already happens
  today for the pre-existing `track:<iphash>`/`g:track` buckets on every non-blocked
  `track.js` call; 036 adds one more bucket to the same pattern rather than introducing
  a new problem. Flagging only as a heads-up for whoever eventually owns table hygiene.
- The overflow summary is, by design, never sent if no pageview lands in a later minute
  (traffic just stops after the spike) — confirmed via probe. This matches the
  assignment's own description ("zodra het eerstvolgende bezoek in de volgende minuut
  binnenkomt") so it is not treated as a defect, just documented as a known edge the
  feature accepts.

**Verdict: NOT verified done.** All criteria pass except the collapse-rule dedup
guarantee, which fails under concurrent invocations (reproduced above). Leaving
`status: needs_verification` per instructions; re-verify once the race is fixed.

Files touched by this verification pass: this assignment file (this section) and two
new throwaway-but-worth-keeping probe scripts, `qa-scripts/probe-036-digest.mjs` and
`qa-scripts/probe-036-race.mjs` (not part of `npm test`, run standalone with `node`).
