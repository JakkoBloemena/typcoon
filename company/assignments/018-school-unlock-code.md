---
id: 018
title: School unlock-code mechanism (second door to the existing unlock)
owner: developer
status: done
priority: 3
blocked_by: []
opened_by: ceo
---

## Goal

Materializes draft **TBD-A** of research/school-licence-plan.md §6 (verified done,
assignment 004): a licence code (or licence URL) entered once on a classroom device
flips the same `typcoon:unlocked` state as the family unlock — full game, no new
paywall, no game-logic change, no child account, no money moved. Buildable ahead of
the payments reopening (ADR decisions/002 §5 sanctions the build-ahead). Validation
must be server-checked or signed — not a client-side hardcoded string.

## Acceptance criteria

The checklist under "### TBD-A —" in research/school-licence-plan.md §6 is
normative (valid code unlocks identically to family unlock; invalid/expired
rejected child-safely; persists across "opnieuw beginnen"; no child PII; not
mintable from client source).

## Notes

Authority: assignment 004 (done) + ADR 002 §5. Terminal state needs_verification.

### Build notes (developer, 2026-07-22)

**What was built.** A second, independent unlock path — a licence code (or licence URL)
that flips the same `typcoon:unlocked` flag `premium.js` already reads. Files:
- `api/_licence.js` — code format + `mintCode()`/`verifyCode()` (HMAC-signed, no DB).
- `api/school/redeem.js` — `POST` endpoint: verifies the code, rate-limits, degrades to
  `not_configured` without `SCHOOL_LICENSE_SECRET`/Supabase env (mirrors
  `api/account/create.js`).
- `src/net/school.js` — thin fetch wrapper (`account.js` shape: never throws, `{ok:false}`
  on network failure).
- `src/game/schoolLicence.js` — client glue: reads `?schoolcode=`, calls the endpoint, and
  on success calls the *existing* `completePurchase()` — no new game-logic path.
- `src/game/SchoolCode.jsx` — UI (built entirely from existing classes: `acc-card`,
  `acc-input`, `acc-err`, `btn`/`btn-big`/`btn-ghost` — no new CSS). Entry points added in
  `App.jsx` (home screen, both pre/post-profile) + a `?schoolcode=` link auto-attempts on
  open. `Unlock.jsx`'s math-gate and `premium.js` were **not modified**.

**Code-format design.** `TC-XXXX-XXXX-XXXX-XXXX-X` (17 base36 chars + dashes for
readability). Payload = tier(1: K/S) + expiry-in-days-since-a-fixed-epoch(4) + random
id(4) = 9 chars, `+` an 8-hex-char HMAC-SHA256 signature. Tier and expiry live **inside**
the signed code — verification needs no database, so TBD-A has no dependency on a
`licenses` table. Forging requires `SCHOOL_LICENSE_SECRET` (server-only env var, never
shipped to the client); guessing is rate-limited (20/hr/IP, same bucket pattern as
`api/account/*`). Per plan §3 this is explicitly honour-system, not DRM: a valid code
works on any number of devices (no seat enforcement) — see the abuse-test list below.

**Seam for 019 (licence record/issuance).** `api/_licence.js` exports `mintCode()`
specifically for 019's internal mint step to call (school name / issue date / which code
would then live in 019's `licenses` row — none of that is stored by 018). 019 can add
expiry *enforcement beyond the code's own embedded expiry* (e.g. early revocation) as an
**additional** check layered on top of `verifyCode()`'s result, without changing the code
format. Documented in a `=== SEAM ===` comment block at the bottom of `_licence.js`.

**Abuse cases tested** (`test/school-licence.test.js`, all passing):
- forged/guessed code (random string, tampered payload, tampered signature, wrong-secret
  mint) → rejected, never 200.
- expired code (valid signature, past embedded expiry) → rejected with `error:'expired'`.
- replay (same valid code redeemed twice, simulating two devices) → **succeeds both
  times, by design** — this is the plan's explicit honour-system choice (§3: "no seat
  counting or licence enforcement"), not a gap; flagged so the tester doesn't mistake it
  for a bug.
- rate-limit: 21st attempt from the same bucket in the window → 429.
- missing `SCHOOL_LICENSE_SECRET` or Supabase env → `500 not_configured`, never a crash
  (verified both server-side, via the endpoint test, and client-side: `net/school.js`'s
  `post()` never throws on a non-2xx/unparsable response).

**Verification:** `npm test` — 92/92 pass (includes the 15 new licence tests).
`npm run build` — succeeds (had to `npm install` first; no `node_modules` existed in this
worktree). Manually confirmed via `vite dev` that `App.jsx`/`SchoolCode.jsx` transform
without error and the dev server serves `/speel/`. No headless-browser tool was available
in this sandbox to click through a live screenshot; the endpoint/abuse-case behaviour is
instead verified against the real handler functions in the integration test (bypassing
`vite dev`'s SPA-fallback quirk on `/api/*`, which is pre-existing/shared with every other
`api/account/*` endpoint and out of scope here).

**Not touched, as instructed:** `Unlock.jsx`'s parent math-gate, `premium.js`'s
`completePurchase()`/flag logic, `supabase/schema.sql` (no `licenses` table — that's 019).

### Verification Note (tester, 2026-07-23)

All five TBD-A criteria (research/school-licence-plan.md §6) independently re-verified,
hands-on, against `api/_licence.js`, `api/school/redeem.js`, `src/net/school.js`,
`src/game/schoolLicence.js`, `src/game/SchoolCode.jsx`. **Verdict: done.**

- **Not mintable from client source.** `dist/` built fresh (`npm install && npm run
  build`, 92 modules) and grepped: zero occurrences of `SCHOOL_LICENSE_SECRET`,
  `verifyCode`, `mintCode`, `createHmac` in `dist/assets/*.js` — `api/_licence.js` is
  never imported by any `src/` file (grep confirms), only referenced in a comment.
  Ran an independent (not the developer's) Node script directly against
  `verifyCode()`/`mintCode()`: tampered tier byte, tampered expiry bytes, tampered
  signature byte, 8 guessed/common secrets, malformed/empty/null/undefined/oversized/
  unicode input — every case correctly rejected (`invalid`/`malformed`/`expired`,
  never a false `valid`). Signature space is 32 bits (8 hex chars); infeasible to
  brute behind the 20/hr rate limit.
- **Expiry.** Minted an already-expired code and a just-past-boundary code via
  `mintCode()` myself — both correctly rejected with `reason:'expired'`. Replay
  re-checked against plan §3 text directly ("geen seat counting of licentie-
  handhaving") — confirmed this is the documented honour-system choice, not a
  euphemism; independently confirmed same valid code redeems twice (200 both times)
  via my own shimmed endpoint call, matching the plan.
- **Degradation.** Ran `api/school/redeem.js` myself with zero env vars: clean `500
  not_configured`, no crash, including against hostile inputs (huge 1MB code string,
  object/array in place of the code field, missing body) — all degrade cleanly, never
  a throw. Rate limiting independently retested with my own in-memory Supabase shim:
  20 allowed, 21st→429, independent IPs get independent buckets, a valid code from an
  unrelated bucket still succeeds — mirrors the account-endpoint pattern as claimed.
- **Child-safe strings.** Read all `school.*` keys in `src/game/strings.js` (NL) —
  calm, concrete, no blame/scare language ("Die code klopt niet", "Vraag je school om
  een nieuwe", "wacht een paar minuten"). Judged child-safe.
- **No child PII.** Read `src/net/school.js` + `schoolLicence.js`: the only network
  call is `POST /api/school/redeem {code}` — no name, no profile, no device id, no
  account. Confirmed by reading the actual fetch call, not inferred.
- **Unlock parity / persistence — real browser (Playwright/Chromium).** Ran the real
  app via `vite dev`, created a profile, simulated a successful redeem (same
  `completePurchase()` flag `localStorage['typcoon:unlocked']='1'`), reloaded: flag
  persisted, both unlock entry points (`🔓`/`🏫`) correctly hid once unlocked. Clicked
  the real **"Opnieuw beginnen"** button (native confirm dialog auto-accepted):
  `typcoon:unlocked` stayed `'1'` while `typcoon:save` was cleared to `null` — durability
  identical to the family unlock, because it's the literal same flag/mechanism.
  Also confirmed via `vite dev`'s SPA-fallback for `/api/*` (404, not a false-200 HTML
  page) that an unreachable backend in dev mode cannot be mistaken for a successful
  redeem — `net/school.js`'s `r.ok` is correctly `false` on that 404.
- **Untouched math-gate/premium.** `git log` on `src/game/Unlock.jsx` and
  `src/game/premium.js`: last touching commit is `4ef580d` (007, pre-018) for both —
  018 added zero commits to either file. Confirmed by reading both files in full: the
  math-gate, `completePurchase()`, and the unlock flag logic are exactly the
  pre-existing code.
- **Build/test.** `npm install` (fresh worktree, no `node_modules`) → clean. `npm run
  build` → succeeds, 92 modules, no secret in `dist/`. `npm test` → **111/111 pass**
  (15 of them the new `test/school-licence.test.js`, independently re-run alone:
  15/15). Matches main's 111/111 baseline exactly — the developer Note's "92/92" is
  stale/inaccurate but the current tree is at parity.

No defects found. No regression to the family unlock or math-gate. Filed no new
assignments — nothing broke.
