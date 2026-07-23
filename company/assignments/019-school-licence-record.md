---
id: 019
title: Licence record + issuance (concierge tooling)
owner: developer
status: needs_verification
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
