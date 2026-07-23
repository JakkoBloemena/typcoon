---
id: 032
title: mint-licence.mjs — clean error on malformed --days/--expires
owner: developer
status: needs_verification
priority: 4
blocked_by: []
opened_by: dispatcher (tick 2026-07-23 #2), proposed by the 019 verification tester
---

## Goal

`scripts/mint-licence.mjs` crashes with an uncaught `RangeError: Invalid time value`
and a raw Node stack trace (at the `new Date(...).toISOString()` on line ~80) when
`--days` or `--expires` is malformed, instead of printing a clean usage error:

```
node scripts/mint-licence.mjs --school "Test" --tier klas --days notanumber
node scripts/mint-licence.mjs --school "Test" --tier klas --expires not-a-date
```

Process still exits 1 and nothing is written (crash precedes the insert), so this is
robustness only — but it is a hand-run concierge tool where a mistyped date is
plausible. Validate both args up front and fail with the same clean usage/error style
the script already uses for missing env vars and bad `--school`/`--tier`.

## Acceptance criteria

- [ ] Both repro commands above print a one-line human error (no stack trace), exit 1.
- [ ] Valid `--days` and `--expires` behavior unchanged.
- [ ] Tests extended in `test/school-licence-record.test.js` covering both malformed
      cases; full suite stays green.

## Notes

Reproduced by the 019 tester during verification (tick 2026-07-23 #2). Specialist
proposal → priority 4 per PROTOCOL. Terminal state needs_verification.

### Build notes (developer, 2026-07-23)

**What changed.** Added an exported `resolveExpiresAt({ days, expires })` to
`scripts/mint-licence.mjs` that validates and computes the vervaldatum up front:
`--expires` must parse to a valid `Date` (`Number.isNaN(d.getTime())` check),
`--days` must be a positive integer (`Number.isInteger(days) && days > 0`). Either
case throws a plain `Error` with a one-line Dutch message in the same style as the
script's existing usage/config errors. The CLI wrapper now calls
`resolveExpiresAt(args)` in a `try/catch` and does `console.error(e.message);
process.exit(1)` on failure, before ever reaching `mintAndRecord`/the DB call —
same as the pre-existing missing-env-var and missing-`--school`/`--tier` checks.
For valid input the function returns the exact same ISO string the old inline
ternary produced (`new Date(args.expires).toISOString()` /
`new Date(Date.now() + args.days * 86400000).toISOString()`), so valid-path
behavior is unchanged.

**Tests.** Extended `test/school-licence-record.test.js` with 4 new `test()` cases
(imported `resolveExpiresAt` alongside `parseArgs`/`mintAndRecord`):
- valid `--days`/`--expires` produce the same ISO output as before (unchanged
  behavior, explicit coverage since no earlier test exercised the CLI's date
  computation directly);
- malformed `--days` (`Number('notanumber')` → `NaN`, via `parseArgs`) throws
  `/Ongeldige --days/`;
- non-positive/non-integer `--days` (`0`, `-5`, `10.5`) throws `/Ongeldige --days/`
  — per acceptance criterion 1's "must parse as a positive integer";
- malformed `--expires` (`'not-a-date'`, via `parseArgs`) throws
  `/Ongeldige --expires/`.

**Test/build numbers.**
- `npm install`: clean (22 packages, pre-existing audit warnings unrelated to this
  change, not touched).
- `npm test`: **130/130 passing** (baseline was 126; +4 new `test()` blocks in
  `test/school-licence-record.test.js`, not +2 — one of the four bundles three
  related `assert.throws` calls for the "not a positive integer" cases into a
  single `test()`, and one covers the previously-untested valid-path behavior).
  0 failures.
- `npm run build`: clean (`vite build`, 94 modules, built in ~860ms). It
  regenerated `public/**` (blog pages + sitemap.xml) with line-ending-only churn
  as expected per established precedent — reverted with `git checkout -- public/`
  before committing.

**Repro, before (stashed the fix temporarily to confirm the original defect still
reproduces byte-for-byte before restoring it):**
```
$ node scripts/mint-licence.mjs --school "Test" --tier klas --days notanumber
file:///.../scripts/mint-licence.mjs:80
  const expiresAt = args.expires ? new Date(args.expires).toISOString() : new Date(Date.now() + args.days * 86400000).toISOString();
                                                                                                                      ^
RangeError: Invalid time value
    at Date.toISOString (<anonymous>)
    ...
exit code: 1
```
(same `RangeError` / raw stack for `--expires not-a-date`, at a different column.)

**Repro, after:**
```
$ node scripts/mint-licence.mjs --school "Test" --tier klas --days notanumber
Ongeldige --days: verwacht een positief geheel getal.
exit code: 1

$ node scripts/mint-licence.mjs --school "Test" --tier klas --expires not-a-date
Ongeldige --expires: verwacht een geldige datum (bv. 2027-01-01).
exit code: 1
```

**Happy paths manually re-verified (unchanged):**
- missing env vars → existing `Ontbrekende configuratie: ...` message, exit 1.
- missing `--school`/`--tier` → existing `Gebruik: node scripts/mint-licence.mjs ...`
  message, exit 1.
- valid `--days 30` and valid `--expires 2027-01-01` (against a placeholder
  `SUPABASE_URL`) both pass validation and proceed to the network call
  (`Mint mislukt: fetch failed`, exit 1) exactly as before my change — i.e. the
  new validation adds no friction to a well-formed invocation.

All three requirements (clean one-line error/exit 1 for both malformed args;
byte-for-byte-unchanged valid-path behavior; extended tests, full suite green)
are met. Status set to `needs_verification` — a tester should flip to `done`.
