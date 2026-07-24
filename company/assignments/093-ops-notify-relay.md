---
id: 093
title: CRON_SECRET-gated ops-notify relay endpoint (Telegram without local secrets)
owner: developer
status: needs_verification
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

## Notes

Authority: Shareholder ops-visibility request (/ceo 2026-07-23 "4-hour summary in
Telegram") + 2026-07-24 "can you get the values from Vercel" → this is the
no-secrets-on-the-machine answer. After this verifies and deploys, the CEO channel
rewires ops-summary-typcoon.ps1 to POST here using CRON_SECRET pulled at runtime
via the authenticated vercel CLI (standard encrypted var — retrievable, unlike
TELEGRAM_*). Terminal state needs_verification.
