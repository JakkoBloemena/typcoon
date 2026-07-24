---
id: 093
title: CRON_SECRET-gated ops-notify relay endpoint (Telegram without local secrets)
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

The scheduler-side 4-hourly ops summary (cc framework/scheduler/ops-summary-
typcoon.ps1, Shareholder-requested) cannot send to Telegram: TELEGRAM_* are
Vercel Sensitive vars (write-only, verified 2026-07-24) and the Shareholder should
not have to hand-copy bot tokens. Production already holds working creds at
runtime — so build the relay: `api/admin/notify.js`, POST, gated exactly like
api/admin/funnel.js (CRON_SECRET Bearer or ?token=), body `{ text }` (cap length
~3500 chars), sends via the existing `tg()` from api/_telegram.js and returns
`{ ok }` from the send. Rate-limited (existing _ratelimit.js pattern, modest cap
e.g. 30/hr global — it is an internal ops channel, not a public surface).

## Acceptance criteria

- [x] POST /api/admin/notify with valid CRON_SECRET + text → tg() called once,
      response `{ ok: true/false }` mirroring the send result; no token → 401;
      GET → 405. Tests via the existing in-memory shim + tg spy patterns.
- [x] Text is passed through verbatim (it is our own ops content) but length-capped
      and type-checked; no PII processing, nothing stored.
- [x] Rate limit trips at the cap (test), counting before validation per the 030
      ordering lesson.
- [x] All tests green, clean build. Lands as needs_verification.

### Delivery notes (developer, dev/093, 2026-07-24)

Implemented `api/admin/notify.js` matching `api/admin/funnel.js`'s auth shape
(local `matches()` helper: `Bearer <CRON_SECRET>` header or `?token=`), the
`api/track.js`/`api/account/create.js` method-check-first/try-catch shape, and
reused `rateLimited()` (api/_ratelimit.js) + `tg()` (api/_telegram.js) verbatim
— no new helpers introduced where existing ones fit.

Per-AC evidence (all covered by `test/notify.test.js`, new file, 10 tests):
- AC1 (gate + method + mirrored `{ ok }`): "GET wordt geweigerd (405)", "zonder
  geldig token 401" (missing + wrong Bearer), "geldige CRON_SECRET (Bearer) +
  tekst stuurt precies één Telegram-melding ... { ok: true }", "via ?token=
  werkt ook", "{ ok: false } weerspiegelt een mislukte verzending (tg-stub
  gooit), zonder 500" — confirms tg() called exactly once per accepted
  request and the response mirrors tg()'s own `{ ok }` (true and false cases).
- AC2 (verbatim + type-check + length cap, no storage): the "stuurt precies
  één Telegram-melding" test asserts `DB.tg[0]` equals the input string
  unchanged (verbatim passthrough — no reformatting). "niet-string/lege tekst
  wordt geweigerd (4xx)" covers number/null/undefined/object/array/empty-
  string/boolean/missing-field, all → 400, tg() never called. "tekst exact op
  de cap (3500) wordt geaccepteerd, één teken erover wordt geweigerd (400)"
  makes the cap boundary explicit (3500 passes, 3501 rejected). Nothing is
  persisted anywhere (no DB write in the handler at all — only rate_limits
  rows via the existing limiter, same as every other rate-limited endpoint).
- AC3 (rate limit trips at cap, counting before validation): "rate-limit
  (30/uur) telt óók ongeldige tekst mee, vóór de validatie — 31e verzoek
  krijgt 429" sends 31 requests with an invalid `text` (a number) — the first
  30 each get 400 (rejected by validation, but still counted), the 31st gets
  429, proving the limiter counts before the type/length check runs (the
  030 ordering lesson, mirrored from the equivalent track.js test). A second
  test confirms the trip also blocks a fully-valid 31st request after 30
  valid sends. Also covered: `not_configured` (500) when Supabase env is
  missing, matching funnel.js/create.js/redeem.js's existing convention for
  admin/rate-limited endpoints (notify never falls back to unlimited sending
  when the rate-limit store is unreachable).
- AC4: `npm test` → 242/242 green (232 baseline + 10 new in
  test/notify.test.js), `npx vite build` clean, `check-no-dutch-en` PASS.
  `git checkout -- public/` run after the build to drop the incidental
  public/** regeneration churn — no public/** changes committed.

Judgment calls / notes for the tester:
- Auth is CRON_SECRET only (no FUNNEL_READ_TOKEN-style secondary weaker
  token) — the assignment says "gated exactly like api/admin/funnel.js
  (CRON_SECRET Bearer or ?token=)" and this is an active *send* endpoint
  (arbitrary-text relay to a real Telegram chat), not a read-only counts
  endpoint, so I did not extend funnel.js's dual-secret pattern to it. Flag
  if the intent was actually to share funnel.js's exported `matches`/token
  logic verbatim — funnel.js doesn't export `matches()` itself (only the
  composed `funnelAuthorized`/`funnelTokenValid`), so I mirrored the same
  Bearer/`?token=` shape locally rather than reaching into funnel.js's
  internals or adding a new shared helper for a single call site.
- Rate limit is a single global bucket (`g:notify`, cap via `MAX_NOTIFY_HOUR`
  env override, default 30/hr) — no per-IP bucket, since this is a single
  authenticated caller (the scheduler), not a public multi-client surface;
  matches the assignment's "modest cap e.g. 30/hr global" wording.
- `not_configured` (500) when Supabase env vars are absent: chose to require
  the DB (same as funnel.js/create.js/redeem.js) rather than track.js's
  "silently degrade" pattern, because notify is authenticated/internal and
  its whole purpose is the rate-limited relay — silently skipping rate-
  limiting when unconfigured would remove the abuse guard entirely rather
  than degrade gracefully.
- Did not touch src/game/**, game.css, Shop.jsx, store.js, economy.js,
  src/engine/, theme.js, goals.js, strings.js, or any other test file.

## Verification (tester, v093, 2026-07-24)

Independently re-derived, not re-run: wrote `test/notify.tester.test.js` (11 new tests,
own copy of the in-memory Supabase/PostgREST shim + tg-spy idiom, not the dev's file) to
probe angles the delivery notes don't claim coverage of. All 11 pass against the shipped
`api/admin/notify.js` unmodified. Also statically re-read `api/admin/notify.js` against
`api/admin/funnel.js`, `api/track.js`, `api/_ratelimit.js`, `api/_telegram.js`, `api/_db.js`.

Per-AC verdict:
- **AC1 (gate + method + mirrored `{ ok }`)** — HOLDS. Confirmed independently: GET *and*
  PUT/PATCH/DELETE/HEAD all 405 (dev only tested GET); missing token, wrong Bearer, and a
  battery of *malformed* Authorization shapes (`"Bearer"` alone, `"Bearer "` empty value,
  `"Bearertestsecret"` no space, bare token with no scheme, lowercase `"bearer ..."`, double
  space, trailing space on the value, `"Basic ..."`) all 401, none crash. Header/query are a
  true OR (not "each works in isolation" as the dev's tests show, but genuine independence):
  correct-header+wrong-query → 200, wrong-header+correct-query → 200. A query token
  delivered as an array (`?token=a&token=b`, which real query-string parsers produce) never
  authorizes — `===` against an array is always false, confirmed safe. `{ ok: true }` and a
  non-throwing Telegram failure (`tg()` returns `{ ok: false }` because Telegram itself
  replied non-2xx, not because it threw — a case the dev's suite didn't isolate) both mirror
  through as HTTP 200 with the correct body, never a 500.
- **AC2 (verbatim + type/length cap, no storage)** — HOLDS. Extra/unexpected body fields
  (including an `__proto__` entry) are ignored; only `text` is forwarded, unmangled.
  Entirely missing `body` (`undefined`, not `{}`) is a clean 400, not a crash. Cap semantics
  verified precisely: the 3500 cap is JS `.length` (UTF-16 code units), and Telegram's own
  Bot API entity-offset limit is likewise UTF-16-code-unit-based, so the two are consistent
  — not a byte-vs-length mismatch. Proved with real astral-plane emoji (😀 = 1 code point but
  2 UTF-16 units): 1750 emoji = exactly `.length` 3500 → accepted verbatim, no surrogate-pair
  corruption; 1751 emoji = `.length` 3502 → rejected, `tg()` never called. Because the
  handler *rejects* over-cap text rather than truncating it, there is no risk of a truncation
  slicing a surrogate pair in half. Confirmed nothing resembling the sent text lands in the
  `rate_limits` ledger — rows contain only `{ bucket: 'g:notify' }`, verified against a
  distinctive payload string.
- **AC3 (rate limit trips at cap, counting before validation)** — HOLDS, dev's tests
  (31st-request-429 with invalid text, and the valid-then-429 variant) independently spot-
  checked by re-reading the handler: the `rateLimited()` call is the first statement inside
  the `try`, strictly before the `typeof`/length check, so unauthenticated (401) traffic is
  the only thing that does *not* count — which is correct, since counting failed-auth probes
  against an authenticated internal caller's own quota would let an attacker exhaust the
  scheduler's real budget with wrong tokens.
- **AC4 (green/clean)** — HOLDS. `npm test`: 253/253 green (242 baseline + 11 new tester
  probes in `test/notify.tester.test.js`; did not touch `test/notify.test.js`). `npx vite
  build` clean. `check-no-dutch-en`: PASS (5 built en files, 0 unallowlisted hits). Reverted
  the incidental `public/**` regeneration churn (`git checkout -- public/`) both before and
  after adding my own test file, before committing — none landed.

Judgment-call verdicts (all three: sound, no bounce):
1. **CRON_SECRET-only auth, no FUNNEL_READ_TOKEN-style secondary** — sound. funnel.js's
   weaker secondary token exists specifically because funnel.js is read-only, no-PII counts
   — a plausible thing to hand to a lower-trust caller. notify.js is an active *send* surface
   to a real human's Telegram chat; a leaked secondary token here would buy an attacker
   arbitrary-text delivery, not just read access. Declining to extend the dual-secret pattern
   to a send endpoint is the correct asymmetry, not an oversight.
2. **Single global `g:notify` bucket, no per-IP** — sound. The only credential that grants
   access is `CRON_SECRET`, held by exactly one caller (the scheduler); per-IP bucketing
   would add a dimension with no distinguishing power here (a leaked secret is exploitable
   from any IP regardless) while doing nothing to lower the real cost (Telegram spam volume,
   which a global cap already bounds). Matches the assignment's own "modest cap e.g. 30/hr
   global" wording.
3. **`not_configured` → 500 when Supabase env is absent, vs. track.js's silent-degrade** —
   sound, and correctly distinguished from track.js on the right axis: track.js degrades
   silently because it is public/unauthenticated and its failure mode (a dropped analytics
   event) is low-stakes compared to ever blocking a child's play session. notify.js is
   authenticated/internal and the *entire* value of the endpoint beyond raw `tg()` access is
   the rate limit; if Supabase is unreachable, `rateLimited()`'s own fail-open behavior means
   the guard would vanish, not degrade — a compromised or merely double-fired `CRON_SECRET`
   could spam the channel as fast as Telegram allows. Requiring the DB (matching
   funnel.js/create.js/redeem.js's existing convention for admin/rate-limited endpoints) is
   the safer default, not an inconsistency.

No distinct new defect found. 094 lapsed (not filed).

## Notes

Authority: Shareholder ops-visibility request (/ceo 2026-07-23 "4-hour summary in
Telegram") + 2026-07-24 "can you get the values from Vercel" → this is the
no-secrets-on-the-machine answer. After this verifies and deploys, the CEO channel
rewires ops-summary-typcoon.ps1 to POST here using CRON_SECRET pulled at runtime
via the authenticated vercel CLI (standard encrypted var — retrievable, unlike
TELEGRAM_*). Terminal state needs_verification.
