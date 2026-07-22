---
id: 018
title: School unlock-code mechanism (second door to the existing unlock)
owner: developer
status: needs_verification
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
