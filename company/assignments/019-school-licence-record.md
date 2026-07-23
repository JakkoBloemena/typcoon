---
id: 019
title: Licence record + issuance (concierge tooling)
owner: developer
status: done
priority: 3
blocked_by: [018]
opened_by: ceo
---

## Goal

Materializes draft **TBD-B** of research/school-licence-plan.md §6: a minimal
`licenses` table (school, tier, issued, expiry, code) on the existing Supabase
pattern, an internal mint step, expiry enforcement, and quote/invoice template
stubs for scholen@typcoon.com with TODO markers where the entity/BTW details from
the payments reopening plug in. Mechanism only — an actual paid sale waits on the
entity (assignment 010).

## Acceptance criteria

The checklist under "### TBD-B —" in research/school-licence-plan.md §6 is
normative.

## Notes

Authority: assignment 004 + ADR 002 §5. Terminal state needs_verification.

### Build notes (developer, 2026-07-23)

**What was built.**
- `supabase/migrations/20260723000001_licenses_table.sql` — new `public.licenses` table:
  `school_name`, `tier`, `code`, `issued_at`, `expires_at`, plus `id`/`created_at`. Same
  posture as `20260722000001_events_table.sql`/`schema.sql`: RLS **on**, zero policies —
  only reachable with the service-role key, never the anon key. Unique index on `code`,
  index on `lower(school_name)`. **Not applied to production** — file only, per
  instructions; the dispatcher applies it.
- `scripts/mint-licence.mjs` — the internal mint step. Exports a pure `mintAndRecord()`
  (calls `mintCode()` from `api/_licence.js`, then inserts one row into `licenses`) plus a
  thin CLI wrapper (`node scripts/mint-licence.mjs --school "..." --tier klas|school
  [--days 365 | --expires 2027-01-01]`). Degrades cleanly (prints an error, exits 1)
  without `SCHOOL_LICENSE_SECRET`/`SUPABASE_*`, same posture as `api/school/redeem.js`.
- `company/templates/school-licence/quote-reply-nl.txt` and `invoice-nl.txt` — plain-text
  stubs for the `scholen@typcoon.com` concierge motion, with explicit `[TODO: ...]`
  markers everywhere the 002 entity/BTW/KvK/IBAN details plug in, and an inline warning on
  the invoice stub not to send a real invoice before 002 resolves the entity.
- `test/school-licence-record.test.js` — 6 new tests (mint+record end-to-end, arg parsing,
  whitespace/empty-school validation, unknown-tier rejection, RLS-posture self-check).

**Mint-step design: script, not an `api/admin/` endpoint.** Justification (also in the
script's header comment): `api/admin/funnel.js`'s `CRON_SECRET` gate exists because cron
runs *unattended* on a schedule (`vercel.json`) — that has to be an authenticated HTTP
path. Minting a licence is the opposite shape: a rare (a few times a month), human-
triggered step after an email exchange with a school (plan §3/§4: concierge, not self-
serve). Whoever runs it already needs production credentials (the same
`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`SCHOOL_LICENSE_SECRET` the redeem endpoint
uses, pulled locally via `vercel env pull`) — a script reuses those without adding a new
authenticated public HTTP endpoint to secure/rate-limit/monitor for something with no
unattended trigger. Same reasoning that keeps schools on invoice instead of self-serve
checkout (plan §4) applies one level down to the tooling that issues the licence.

**How expiry enforcement layers on the 018 seam.** `api/_licence.js`'s `verifyCode()`
already enforces expiry entirely from the signed code itself (tier + expiry live inside
the HMAC payload, per the `=== SEAM ===` comment) — no database lookup needed, so this
was already true before 019. 019's job was the *record*, not new enforcement, and the
`licenses` table intentionally does **no** validity checking of its own: `mintAndRecord()`
calls `mintCode()` unchanged and then just logs the resulting row. Verified end-to-end in
`test/school-licence-record.test.js`: minting a licence with `expiresAt` in the past
*does* get recorded in `licenses` (so it stays in the audit trail/invoicing history) but
its code independently fails `verifyCode()` with `reason: 'expired'` — the table and the
code format can never disagree because the table only ever mirrors what's already
inside the signed code. I did **not** implement the optional revocation layer the SEAM
comment describes (an additional check beyond the code's embedded expiry, e.g. an
early-revoked list) — it is explicitly optional in the SEAM ("you may add ... without
changing the format") and is not in TBD-B's acceptance criteria; `licenses` is shaped so a
future assignment could add a `revoked_at` column and a check in `redeem.js` without
touching the code format, if the business ever needs early revocation.

**Not touched, as instructed:** `api/track.js` (another lane); no assignment files/ticks.md
edited beyond this one.

**Verification.** `npm install` (clean). `npm test` → **117/117 pass** (111 baseline + 6
new). `npm run build` → succeeds, 92 modules. Manually ran
`node scripts/mint-licence.mjs` with no env vars (clean exit 1, no crash) and with env vars
but no `--school`/`--tier` (usage message, exit 1) to confirm the CLI degrades the same way
the endpoints do.

### Verification (tester, 2026-07-23)

**Verdict: PASS — all 4 TBD-B criteria independently verified. status → done.**

Build/test numbers reproduced independently in the worktree (`C:\companies\typcoon-lanes\v019`,
branch `verify/019`): `npm install` clean; `npm test` → **126/126 pass** (repo has grown since
the developer's 117 baseline via other integrated lanes; all 6 new tests in
`test/school-licence-record.test.js` present and passing — `parseArgs`, mint+record,
whitespace/empty-school rejection, EXPIRY, unknown-tier rejection, RLS-posture self-check.
Read each test body: they assert real things (e.g. the EXPIRY test independently calls
`verifyCode()` on the minted code rather than just checking the DB row) — not vacuous.
`npm run build` → succeeds, 94 modules.

Per TBD-B checklist (research/school-licence-plan.md §6):

1. **"A licence can be minted and recorded ... and the resulting code unlocks the game via
   TBD-A."** PASS. Beyond the unit test, drove the real integration myself: minted a code
   with `mintCode()` and fed it straight into the real `api/school/redeem.js` handler (with
   `fetch` stubbed only for the rate-limiter's DB call, not for licence logic) →
   `{status: 200, body: {ok: true, tier: 'klas'}}`. Confirms the code minted by 019's tool is
   the same code TBD-A's endpoint accepts, not just a same-format lookalike.
2. **"Expiry is enforced ... verifiable by setting a past expiry."** PASS. Minted a code with
   `expiresAt` 5 days in the past and fed it into the real redeem handler →
   `{status: 400, body: {ok: false, error: 'expired'}}`. Also confirmed at the `_licence.js`
   level directly (`verifyCode()` → `{valid: false, reason: 'expired'}`) and via the shipped
   test. The `licenses` row is still written (audit trail) while the code independently
   fails verification — table and code format never disagree, as claimed.
3. **"A reply/quote template and an invoice template stub exist ... with a clear TODO
   marker."** PASS. Both `company/templates/school-licence/quote-reply-nl.txt` and
   `invoice-nl.txt` read in full: `[TODO: ...]` markers cover every 002-gated detail (price,
   entity name, KvK, BTW-nummer, IBAN, invoice number). `invoice-nl.txt` opens with an
   explicit "GEEN echte factuur... mag er GEEN echte factuur met dit sjabloon worden
   verstuurd" warning gated on 002. Neither template states a committed price (correctly
   flagged TODO pending CEO/002 confirmation) or promises anything the code doesn't deliver.
4. **"RLS-safe ... only reachable server-side ... never via the anon key."** PASS. Compared
   `20260723000001_licenses_table.sql` line-by-line against `20260722000001_events_table.sql`:
   identical posture (`enable row level security`, zero `create policy` statements — service
   role only). Unique index on `code`, index on `lower(school_name)`, sane column types
   (`text`, `timestamptz`). **Not applied to the remote/production Supabase project** — file
   verification only, per instructions; this migration is still pending application by the
   dispatcher.

**Security / surface check.** `git show --stat` on the build commit (`fc065ed`) confirms zero
files under `api/` were touched by 019 — no new HTTP endpoint. `find api -type f` and
`vercel.json` show no new route. `scripts/mint-licence.mjs` requires
`SCHOOL_LICENSE_SECRET` + `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` and exits 1 cleanly
with no partial writes when any are absent (reproduced: no env vars → clean exit 1 before
any network call).

**CLI edge cases exercised:** empty `--school` → usage/exit 1; whitespace-only `--school`
→ `mintAndRecord` rejects with `school_required`, exit 1; unknown `--tier` → `mintCode`
rejects with `unknown_tier`, exit 1; both `--days` and `--expires` supplied → `--expires`
wins, no partial write on downstream failure. All exit 1, no crash, no partial writes — as
claimed.

**Adjacent defect found (outside TBD-B's criteria, reported to dispatcher, not filed as an
assignment):** malformed `--days`/`--expires` values crash the CLI with an uncaught
`RangeError` and a raw Node stack trace instead of a clean usage/error message. Repro:
`node scripts/mint-licence.mjs --school "Test" --tier klas --days notanumber` (also
`--expires not-a-date`) → `RangeError: Invalid time value` at `mint-licence.mjs:80`,
process still exits 1 but via an unhandled exception, not the script's own error handling.
No data is written (crash happens before the insert), so this is not a safety issue, but it
is a real robustness gap in a tool a human runs by hand and can easily mistype a date into.
Low severity, does not block this verdict since it is not one of TBD-B's 4 checklist items.
