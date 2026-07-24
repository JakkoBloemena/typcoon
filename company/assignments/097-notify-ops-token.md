---
id: 097
title: notify relay — accept OPS_NOTIFY_TOKEN as alternative bearer (one-line auth extension)
owner: developer
status: needs_verification
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

The 093 relay works but its caller cannot obtain CRON_SECRET: this Vercel project
stores ALL env vars write-only (verified 2026-07-24 — even SITE_URL pulls as
"[Sensitive]"), so the scheduler-side summarizer can retrieve nothing. Fix per the
funnel.js dual-token precedent (044): api/admin/notify.js additionally accepts
`OPS_NOTIFY_TOKEN` (already provisioned in Vercel production by the CEO channel,
2026-07-24) as a valid Bearer/?token= credential, alongside CRON_SECRET. Scope is
the auth check only — behavior, rate limit, validation unchanged.

## Acceptance criteria

- [x] Valid OPS_NOTIFY_TOKEN (Bearer and ?token=) authorizes exactly like
      CRON_SECRET; invalid/missing still 401; when the OPS_NOTIFY_TOKEN env var
      is absent it grants nothing (no undefined-equals-undefined hole — mirror
      044's fail-safe and test it explicitly).
- [x] Existing notify tests stay green; new cases cover the alt token + the
      absent-env fail-safe.
- [x] All tests green, clean build. Lands as needs_verification.

## Notes

Authority: Shareholder ops-visibility thread (/ceo 2026-07-23/24). After this
deploys, the CEO channel's summarizer (cc framework/scheduler/ops-summary-
typcoon.ps1) posts with the locally-minted token from its gitignored env file —
the only secret on the Shareholder machine is one minted there for this purpose.
Terminal state needs_verification.

## Delivery notes (developer, dev/097, 2026-07-24)

**Files touched** (worktree `C:\companies\typcoon-lanes\d097`, branch `dev/097`):
- `api/admin/notify.js` — +29/-2. Added `opsTokenValid(opsToken, secret, req)` and
  `notifyAuthorized(req, secret, opsToken)`, exported, mirroring funnel.js's
  `funnelTokenValid`/`funnelAuthorized` (044) exactly: `!!opsToken && opsToken !== secret
  && matches(req, opsToken)`, OR'd with the unchanged `matches(req, secret)` CRON_SECRET
  branch. Handler now reads `process.env.OPS_NOTIFY_TOKEN` alongside `CRON_SECRET` and
  calls `notifyAuthorized` in place of the old bare `matches(req, secret)` — same line,
  same position (before the try block, before rate-limit/validation). No other line in
  the handler changed.
- `test/notify.test.js` — +105. Six new tests appended after the existing
  not-configured-500 test: (1) unset OPS_NOTIFY_TOKEN grants nothing, explicitly probing
  `Authorization: Bearer undefined`, `Bearer ` (empty value), `?token=` empty string, and
  `?token=undefined` — all 401; (2) OPS_NOTIFY_TOKEN set to `''` (empty-string env, not
  just absent) also grants nothing; (3) valid OPS_NOTIFY_TOKEN via Bearer header
  authorizes like CRON_SECRET, CRON_SECRET still works unchanged, garbage still 401;
  (4) valid OPS_NOTIFY_TOKEN via `?token=` works; (5) OPS_NOTIFY_TOKEN equal to
  CRON_SECRET is rejected by `opsTokenValid` itself (no aliasing of the stronger secret),
  while the composite `notifyAuthorized` still lets that same value through via the
  unchanged CRON_SECRET branch — unit-tested directly against the exported functions,
  same pattern as funnel.js's 044 alias test; (6) rate-limit-before-validation ordering
  (030 lesson) re-run with OPS_NOTIFY_TOKEN as the credential (31 invalid-text requests,
  30th still 400, 31st 429) to confirm the alt-token path didn't disturb check order.

**Per-AC evidence:**
1. Valid OPS_NOTIFY_TOKEN (Bearer + ?token=) authorizes exactly like CRON_SECRET;
   invalid/missing still 401 — covered by the two "geldig OPS_NOTIFY_TOKEN" tests above
   (both header and query paths get `{ ok: true }` + a Telegram send) plus the
   garbage-token assertion inside the header test.
2. Absent-env fail-safe, tested explicitly — the "onbekend/leeg OPS_NOTIFY_TOKEN"
   test deletes `process.env.OPS_NOTIFY_TOKEN` and sends `Authorization: Bearer undefined`
   and `Bearer ` (empty), both 401; a second test sets the env var to `''` (empty string,
   distinct from unset) and confirms 401 there too — the assignment called out both
   "absent" and "empty-string env" as separate cases.
3. Existing tests stay green + new cases added — `node --test test/*.test.js`:
   259/259 pass (253 baseline + 6 new). Rate-limit-before-validation ordering (030
   lesson) verified unchanged by re-running the exact 31-request/429-on-31st pattern
   with OPS_NOTIFY_TOKEN as the credential, in addition to the pre-existing CRON_SECRET
   version of that test (untouched, still passing).
4. `npm test` (node --test + gen-content + vite build + check-no-dutch-en): all green —
   259/259 tests, build succeeds (5 built en files), check-no-dutch-en PASS (0
   unallowlisted hits). `public/**` build churn from `npm test`'s own `gen-content.mjs`
   step reverted via `git checkout -- public/` before commit; `git status` afterward
   shows only `api/admin/notify.js` and `test/notify.test.js` modified.

**Judgment calls (flagging for the tester):**
- Mirrored 044's alias fail-safe (`opsToken !== secret` rejected) even though the
  assignment text only explicitly named the absent/empty-env fail-safe, not the
  alias-collision one. The assignment says "mirror 044's fail-safe" and 044's fail-safe
  *is* both unset-grants-nothing AND no-aliasing-the-stronger-secret as one idiom in
  funnel.js — treated them as one package rather than picking just the literal example
  given. If OPS_NOTIFY_TOKEN and CRON_SECRET are ever accidentally provisioned with the
  same value in Vercel, this endpoint will silently fall through to the (still-valid)
  CRON_SECRET branch rather than erroring — same behavior as funnel.js today.
- Function names `opsTokenValid`/`notifyAuthorized` are new (notify.js had no
  previously-exported auth helpers to match names against); chosen to parallel funnel.js's
  `funnelTokenValid`/`funnelAuthorized` 1:1 by role.
- Did not add OPS_NOTIFY_TOKEN coverage to `test/notify.tester.test.js` — that file's own
  header states it was written independently by the tester role (v093) specifically to
  avoid re-running the developer's own assertions; adding dev-authored tests there would
  undercut that independence. Left it untouched; the tester may want to add an
  OPS_NOTIFY_TOKEN independence probe there as part of verification.
- `node_modules` did not exist in this worktree at task start (`npx vite build` failed
  with `ERR_MODULE_NOT_FOUND`); ran `npm ci` to populate it from the existing
  `package-lock.json` (no edits to `package.json`/`package-lock.json` — confirmed via
  `git diff --stat` on both, no changes reported).

**Verification commands run:**
- `node --test test/notify.test.js test/notify.tester.test.js` — 21/21 pass (pre-check).
- `node --test test/*.test.js` — 259/259 pass.
- `npm ci` (worktree had no `node_modules`).
- `npm test` — 259/259 tests, vite build, check-no-dutch-en PASS.
- `git checkout -- public/` before commit; `git status --short` confirmed only
  `api/admin/notify.js` and `test/notify.test.js` modified.

**Assignment 095:** lapsed — nothing surfaced during this task that warranted a new
proposal/defect. Scope stayed within the auth-check-only surface; no adjacent bug or
missing coverage found outside what's already flagged as judgment calls above.
