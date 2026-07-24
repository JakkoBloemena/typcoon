---
id: 097
title: notify relay — accept OPS_NOTIFY_TOKEN as alternative bearer (one-line auth extension)
owner: developer
status: done
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

## Verification (tester, v097, 2026-07-24)

Independently verified in worktree `C:\companies\typcoon-lanes\v097`, branch `verify/097`.
Did not re-run the developer's assertions — added 7 new probes of my own construction to
`test/notify.tester.test.js` (the v093-tester-owned file, deliberately left untouched by the
developer for the same reason), exercising the real handler against my own fixtures, not a
re-implementation.

**AC1 — valid OPS_NOTIFY_TOKEN (Bearer + ?token=) authorizes exactly like CRON_SECRET;
invalid/missing still 401; absent env grants nothing** — HOLDS.
- Own fixture (`tester-alt-token-9317`, distinct from the dev's `ops-secret`): Bearer path →
  `{ ok: true }`, `tg()` called once with verbatim text; `?token=` path → same; CRON_SECRET
  continues to authorize alongside it in the same run (two sends in one test, one per
  credential).
- Method-check-before-auth cross-check: GET with a *valid* OPS_NOTIFY_TOKEN in the query is
  still 405, not 401-then-405 — confirms the new token didn't shift the method-check position.
- Duplicated/array `?token=a&token=b` (what real query parsers produce) never authorizes via
  the alt-token path either — re-derived the array-rejection angle this file already
  established for CRON_SECRET in 093, specifically against the new 097 branch. 401, `tg()`
  never called.
- Whitespace-only `OPS_NOTIFY_TOKEN='   '` (a variant the dev did not probe — dev covered
  unset and `''`): this is a *truthy* string, distinct from the empty-string case, so
  `opsTokenValid` falls through to an exact-string match same as any other token value. A
  wrong guess still 401; the literal whitespace as Bearer value authorizes. This is not a
  fail-safe hole (an attacker still needs to send the exact whitespace string, which they
  can't guess any easier than a real token) — recording it as a real-world footgun worth
  awareness (accidental whitespace-only provisioning in Vercel would be silently "valid"
  rather than caught), not a defect against this assignment's stated criteria.

**AC1/2 — ordering (030 lesson) re-derived independently** — HOLDS. Built my own variant
rather than re-running the dev's verbatim 31-request/cap-30 pattern: `text: null` (not the
dev's invalid-number `12345`) as the invalid shape, and `MAX_NOTIFY_HOUR=5` (not the default
30) as the cap, using OPS_NOTIFY_TOKEN as the credential — request 6 of 6 gets 429, `tg()`
never called, confirming the alt-token path doesn't disturb rate-limit-counts-before-
validation at an arbitrary cap value, not just the default one.

**AC1 — alias judgment call (OPS_NOTIFY_TOKEN === CRON_SECRET)** — ruled sound, verified by
cross-checking behavior, not by trusting the delivery note. Read `api/admin/funnel.js`
directly: `funnelTokenValid(funnelToken, secret, req) = !!funnelToken && funnelToken !== secret
&& matches(req, funnelToken)`, OR'd into `funnelAuthorized` with the unchanged
`matches(req, secret)` CRON_SECRET branch — byte-for-byte the same shape as notify.js's
`opsTokenValid`/`notifyAuthorized`. Added a parametrized test that imports both modules'
exported functions side by side and asserts `opsTokenValid`≡`funnelTokenValid` and
`notifyAuthorized`≡`funnelAuthorized` across the alias case, a normal distinct-token case, an
empty-token case, and an unset-token case — all four pairs agree exactly, and the alias case
specifically resolves to `true` in both modules (denied at the weak-token layer, still
authorized via the untouched strong-secret branch). The developer's framing — "044's fail-safe
*is* both unset-grants-nothing AND no-aliasing as one idiom" — is correct: it is not an
extrapolation beyond the literal assignment text, it is the actual shipped 044 behavior, now
proven identical rather than merely "mirrored in spirit."
- Contextual note (not a defect, just a fact worth recording since it stands in some tension
  with 093's own tester ruling): 093's verification explicitly ruled CRON_SECRET-only auth as
  the *correct asymmetry* for notify.js specifically **because** it is a send endpoint, unlike
  funnel.js's read-only counts. 097 revisits that call and extends the dual-token idiom to
  notify.js anyway — but this is a CEO-opened, Shareholder-authorized scope change (see Notes:
  "Authority: Shareholder ops-visibility thread"), not the developer or tester silently
  reversing a prior verified ruling, so there is nothing to bounce here. Flagging for the
  record only.

**AC2 — existing notify tests stay green; new cases cover the alt token + absent-env
fail-safe** — HOLDS. `node --test test/notify.test.js test/notify.tester.test.js`: 34/34 pass
(11 pre-existing tester probes from v093 + 7 new ones added this pass, alongside the dev's own
16 in notify.test.js — 10 baseline + 6 new from 097).

**AC3 — all tests green, clean build** — HOLDS.
- `node --test test/*.test.js`: **266/266 green** (259 baseline + 7 new tester probes).
- `npm test`: 266/266 tests, `gen-content` (22 URLs), `vite build` clean (5 built en files),
  `check-no-dutch-en` PASS (0 unallowlisted hits against the 59-word Dutch lexicon).
- `git checkout -- public/` reverted the `npm test`-triggered `gen-content`/build churn before
  committing; `git status --porcelain` clean afterward except the intentional test-file change.

**Handler-scope check (independent, per the assignment's "auth check only" scope claim)** —
confirmed via `git diff 0f68169^ 0f68169 -- api/admin/notify.js` (the dev's own 097 commit
against its parent): the only functional changes are the two new exported functions
(`opsTokenValid`, `notifyAuthorized`) and swapping the handler's bare `matches(req, secret)`
check for `notifyAuthorized(req, secret, opsToken)`, same line position — before the `try`
block, before rate-limit/validation. No other line in the handler changed; rate-limit
ordering, validation, and response shapes are untouched, matching the delivery notes exactly.

**Verdict: all three acceptance criteria HOLD. Status set to `done`.**

New defect scan: nothing outside 097's scope surfaced during this pass beyond the
whitespace-env observation above (recorded as a footgun note, not filed as a defect — no
actual access-control failure, no criterion violated). **098 lapsed.**

Commands run: `npm ci` (worktree had no `node_modules`), `node --test test/notify.test.js
test/notify.tester.test.js`, `node --test test/*.test.js`, `npm test`, `git checkout --
public/`, `git status --porcelain`.
