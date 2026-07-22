---
id: 025
title: Shape-validate /api/track inputs (defense-in-depth against PII smuggling)
owner: developer
status: needs_verification
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
