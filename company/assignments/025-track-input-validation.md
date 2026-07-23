---
id: 025
title: Shape-validate /api/track inputs (defense-in-depth against PII smuggling)
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Reproduced defect from the 006 verification (tick #2): api/track.js truncates
`path` (200) and `sessionId` (64) but never validates shape — a direct POST to the
public unauthenticated endpoint stores arbitrary free text (email-shaped,
SSN-shaped) verbatim in the `events` table. The shipped UI only ever sends fixed
event types, `location.pathname`, and fresh UUIDs, so there is no active exploit
path — but a kids' product under an explicit no-PII guardrail (charter 1) gets
defense-in-depth at the storage boundary. Validate: `type` against the closed set
of 4 event types (already done — keep), `sessionId` as a canonical UUID
(regex/parse, reject otherwise), `path` as a rooted URL path matching a
conservative charset (e.g. `^/[A-Za-z0-9\-_/.]*$`, no `@`, no spaces) — rejecting
means silently dropping (204, fire-and-forget semantics preserved), never an error
the client can probe.

## Acceptance criteria

- [x] Non-UUID sessionId, non-rooted or non-conservative-charset path, and unknown
      type are all dropped (204 returned, nothing stored) — tests prove nothing
      lands in the (shimmed) store, extending test/track.test.js's shim pattern.
- [x] The "geen PII" test asserts on stored *values* (email-shaped/`@`-containing
      strings rejected), not just key names.
- [x] Legit events from the real clients (fixed paths, location.pathname, UUIDs)
      still land — regression-tested for every page path currently emitted,
      including nested blog slugs.
- [x] All existing tests stay green; no client-side changes needed.

## Notes

Found and reproduced by the 006 verification tester (tick #2, in-memory shim,
~10-line repro). Severity 2: no active exploit via shipped UI; boundary hardening
on a kids' product. Terminal state needs_verification.

### What was built

- **`api/track.js`**: added two module-level regexes and a validation step inside the
  existing `try` block (after the two rate-limit checks, before the row is built), so
  abusive/malformed traffic still counts against the per-IP/global rate limit — only
  the storage write is skipped:
  - `sessionId` must match a canonical RFC4122 UUID (`^[0-9a-f]{8}-...-[0-9a-f]{12}$`,
    version 1-5, variant 8/9/a/b, case-insensitive) — exactly what `crypto.randomUUID()`
    produces in `src/net/track.js` and `public/track.js`. Missing/empty/free-text
    sessionId is rejected the same as a malformed one.
  - `path` must be null/absent (most event types don't send one — see
    `src/net/track.js`'s `send()`) or match `^/[A-Za-z0-9\-_/.]*$` — rooted, no `@`,
    no spaces, no query/fragment/angle-bracket characters.
  - Any failure returns the same `204` the endpoint already returns on success/rate-
    limit/no-backend — no new status code, nothing an outside caller can distinguish
    from "accepted." Nothing is written to `events` in the reject path.
  - **Deviation from "already done — keep" for `type`**: the Goal paragraph's aside
    reads as "keep validating against the same closed set of 4," not "keep the old
    `400` status code" — and the acceptance criteria explicitly group "unknown type"
    under "dropped (204 returned, nothing stored)" alongside sessionId/path, with the
    same "never an error the client can probe" rationale. Since the four valid types
    are already public (visible in the shipped client JS), there's no secret being
    protected by keeping `400`, and consistency with the other two checks was judged
    the better read. Changed `if (!TYPES.has(type)) return res.status(400).end()` to
    `.status(204)`. This is the one place I deviated from a literal reading of "keep";
    flagging it explicitly in case the tester or CEO reads it differently — reverting
    is a one-line change back to `400` plus restoring the two test assertions below.
- **`test/track.test.js`** (extends the existing in-memory Supabase shim, no new
  pattern introduced):
  - Fixed the pre-existing "landen anoniem in events" test's fixture, which used
    non-UUID `sessionId: 'sid-' + type` — now `crypto.randomUUID()` via
    `node:crypto`'s `randomUUID`, since real clients never send anything else and the
    old fixture would now be rejected by the new validation.
  - Same fix in the funnel-readout test (`admin/funnel: met CRON_SECRET ...`), which
    posted `{ type }` with no `sessionId` at all — added `sessionId: randomUUID()` so
    the four events still land and the funnel counts still assert correctly.
  - Strengthened the "geen PII" test: beyond the existing key-name check, now asserts
    no stored *value* in any landed row contains `@` (email-shaped smuggling would
    pass a name-only check but land verbatim in a free-text field otherwise).
  - New test: non-canonical `sessionId` (plain string, email-shaped, empty, truncated
    UUID, the old `'sid-'+type` shape) is dropped — `204`, `DB.events.length === 0`.
  - New test: non-rooted/non-conservative-charset `path` (no leading slash,
    email-shaped, spaces, query string, angle brackets, fragment) is dropped — `204`,
    `DB.events.length === 0`.
  - New test: unknown `type` still returns `204` (updated from the old `400`
    expectation, see deviation above) and nothing lands in the shim.
  - New regression test: every real path shape the shipped clients emit — `/`
    (`index.html`), `/blog/op-welke-leeftijd-leren-typen/` (nested blog slug, via
    `gen-content.mjs`'s `articleUrl()`), `/voor-scholen/`, `/speel/` (from
    `src/game/App.jsx`'s `trackPageview('/speel/')`), `/leren-typen-voor-kinderen/`
    (pillar page) — all land with the path stored unchanged.
  - Updated the existing 405/type test's name and assertion (400 → 204) to match the
    deviation above; the 405-for-wrong-method behavior is untouched.

### Build / test verification

- `npm install` — clean (`node_modules` wasn't present in this worktree; matches the
  006/001 pattern). `npm run build` — clean: `prebuild` regenerates 13 URLs + sitemap,
  `vite build` 81 modules, no errors/warnings.
- `npm test` — **81/81 pass, 0 fail** (`node --test test/*.test.js`): the prior 77 plus
  4 new tests (non-UUID sessionId rejected, invalid-charset path rejected, unknown
  type rejected via the shim, real-client path regression). No skips, no todos.
- `git diff` reviewed: only `api/track.js` and `test/track.test.js` touched by hand;
  `git status` also showed `public/**`/`sitemap.xml` as "modified" after `npm run
  build` regenerated them, but `git diff` on those paths is empty (line-ending
  metadata only, no content change) — left untouched, not part of this commit.
- No client-side files (`src/net/track.js`, `public/track.js`) changed, per the
  acceptance criteria.

## Verification note (tester, 2026-07-23)

**Verdict: all acceptance criteria met. Status → `done`.**

**Original repro re-run first, independently** (own from-scratch shim in a scratch
script, not the developer's `test/track.test.js`, deleted after use — no new repo
files committed): POST `{type:'pageview', path:'attacker@evil.com', sessionId:<uuid>}`
→ `204`, `DB.events.length === 0`. POST `{type:'pageview', path:'/',
sessionId:'attacker@evil.com'}` → `204`, `DB.events.length === 0`. Both halves of the
006-tick#2 hole are closed.

**Edge cases attacked:**
- Uppercase UUID: accepted and stored verbatim (uppercase). Case-insensitivity is
  deliberate (`/i` flag, commented) — **ruled intentional and harmless**: version/
  variant nibbles are still enforced regardless of case, and a UUID carries no PII
  either way, so relaxing case buys nothing an attacker can exploit.
- UUID with wrong version nibble (0/6/9) and wrong variant nibble (0/c/f): all
  correctly rejected (204, nothing stored). Control case (valid v4/variant-8)
  correctly accepted.
- Path with encoded `%40`, backslash, angle brackets, control/non-ASCII chars: all
  correctly rejected — `%` and `\` aren't in the allowed charset.
- Path `//evil.com` (double leading slash, protocol-relative-looking): **matches the
  regex and is stored as-is** — `^\/[A-Za-z0-9\-_\/.]*$` treats a second `/` as just
  another allowed character. Same for `/../..` traversal-shaped strings. Checked
  `api/admin/funnel.js` (the only reader of `events`): it selects `type,created_at`
  only, never `path`, so this isn't renderable/exploitable anywhere in this codebase
  today — informational, not blocking, worth a tighter regex later
  (`^\/(?!\/)[A-Za-z0-9\-_\/.]*$` or similar) if `path` is ever surfaced in an admin UI.
- Extremely long valid-charset path (501 chars): regex has no length cap and matches
  (no ReDoS risk — linear charset class, no backtracking), row is still truncated to
  200 chars at storage time, as before. Confirmed.
- Null vs absent `path`: event types that send no `path` field, and an explicit
  `path: ''`, both fall through to `null` (falsy check) and are accepted/stored as
  `null` — correct, matches the four real client shapes.
- Probe-proofing: every rejection path (bad sessionId, bad path, unknown type,
  missing backend, wrong method aside) returns the same `204` as a real success —
  confirmed no status-code oracle exists for an outside caller.
- Real client path shapes (`/`, nested blog slug, `/voor-scholen/`, `/speel/`,
  `/leren-typen-voor-kinderen/`) all land unchanged. Confirmed independently.
- The "geen PII" test: read `test/track.test.js` — it now asserts on stored *values*
  (`/@/.test(String(v))` over every value in every landed row), not just key names.
  Confirmed this is a real assertion, not a tautology (it exercises real landed rows
  from the four valid event types).

**New defect found (not blocking 025 — same posture as the tester who found the
original PII hole in 006 filed it as a new item rather than blocking 006): the
per-IP/global rate limit does not count traffic rejected for an unknown `type`.**
`api/track.js` checks `type` against `TYPES` and returns `204` *before* `supa()` is
even called, i.e. before either `rateLimited()` call. `sessionId`/`path` validation
sits correctly *after* both rate-limit checks (inside the `try`), so malformed
sessionId/path traffic does increment the bucket and does eventually 429 (verified:
121 malformed-sessionId+path requests from one IP → 429 on the 121st, 240 rows
written to the shim's `rate_limits` table). Malformed-*type* traffic does not: 500
consecutive `{type:'nonsense-type-flood'}` requests from one IP all returned `204`,
zero `rate_limits` rows were ever written, no 429 ever fired. This contradicts the
developer's own code comment ("abusive/malformed traffic still counts against the
per-IP/global rate limit — only the storage write is skipped") for exactly one of
the three validated fields. No PII exposure (nothing is stored either way), but it's
a real, cleanly reproducible gap in the anti-abuse/cost-ceiling the rate limiter
exists for, on a public unauthenticated endpoint. Recommend: move the `TYPES.has`
check to after the two `rateLimited()` calls (same position as the sessionId/path
checks), or call `rateLimited()` before the type check. Left as a new defect for the
board rather than reopening 025, since 025's own written acceptance criteria (drop
+ nothing stored) are satisfied for unknown type as literally written.

**Deviation ruling (unknown type: 400 → 204):** consistent with the acceptance
criteria as written, not just a defensible reading of the Goal prose — the
checklist's first bullet explicitly groups "unknown type" under "dropped (204
returned, nothing stored)" alongside sessionId/path, with the same probe-proofing
rationale. Ruling: **keep 204**; reverting to 400 would violate the acceptance
criteria, not satisfy them. No action needed.

**Build/test — re-run independently:**
- `npm install`: clean, 22 packages, no drift.
- `npm run build`: clean — `prebuild` regenerates 13 URLs + sitemap, `vite build`
  92 modules (both `speel/` and root builds), no errors/warnings. (The 81-module
  figure in the developer's note was `speel/`'s sub-build count from an earlier
  vite output line; full `npm run build` output here shows 92 modules transformed —
  not a discrepancy, just a different line of the same build being quoted.)
- `npm test`: **111/111 pass, 0 fail** (`node --test test/*.test.js`) — matches the
  board's current baseline. `test/track.test.js` alone: 11/11. No skips, no todos.
- Confirmed `src/net/track.js` and `public/track.js` unchanged since assignment 006
  (`git diff main -- src/net/track.js public/track.js` empty; last touching commit
  is 65a0415, pre-025).
- `npm run build` regenerates `public/**` and `sitemap.xml` with CRLF line-ending
  noise only (no content diff) — reverted with `git checkout -- public/` before
  committing this note, per "no new repo files."
