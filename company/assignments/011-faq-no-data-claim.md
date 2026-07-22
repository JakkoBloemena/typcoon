---
id: 011
title: Fix FAQ "geen gegevens naar een server" claim vs the anonymous beacon
owner: developer
status: done
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

The FAQ answer at index.html:65 ("Heb ik een account nodig?") says that without a
parent account "gaan er geen gegevens naar een server". Since assignment 006,
public/track.js fires an anonymous, cookieless pageview/event beacon on every page
load regardless of account state — so *some* data (anonymous, non-personal usage
events) does reach a server. Under charter guardrail 4 the claim must be narrowed to
what is true: no *personal* data / persoonsgegevens without an account, plus the
honest qualifier about anonymous statistics already used by assignment 008
("alleen anonieme, niet-herleidbare gebruiksstatistieken"). Reword only as much as
needed; keep assignment 001's account-optionality framing intact. Check both the
JSON-LD FAQ block and any visible HTML duplicate of the same answer, and any other
"geen gegevens" claim the 001/008 searches classified as honest that this beacon
now invalidates.

## Acceptance criteria

- [x] index.html FAQ (JSON-LD and any visible duplicate) no longer claims zero data
      reaches a server; new wording: no persoonsgegevens, anonymous non-traceable
      usage statistics only, parent account optional.
- [x] Repo-wide search for "geen gegevens" / "naar een server" / "geen server":
      every user-facing hit is compatible with the beacon's existence; hits and
      disposition in Notes.
- [x] JSON-LD still parses; Dutch stays natural; build passes, tests green.

## Notes

Found by the 008 lane (2026-07-22), out of its literal scope. Authority: charter
guardrail 4; wording precedent: assignments 001 and 008. Terminal state
needs_verification.

### Changes made

- `index.html:65` (FAQPage JSON-LD, "Heb ik een account nodig?") — was: "...
  zonder ouderaccount gaan er geen gegevens naar een server." (false since
  assignment 006: `public/track.js` fires an anonymous, cookieless pageview
  beacon to `api/track.js` on every load of this very page, ouderaccount or
  not). Now: "... zonder ouderaccount gaan er geen persoonsgegevens naar een
  server; alleen anonieme, niet-herleidbare gebruiksstatistieken worden
  geteld." — narrows the claim to persoonsgegevens (true: `track.js` sends no
  PII, only a per-visit anonymous session id + path + aggregated country, per
  006's Notes) and names the anonymous statistics using the exact phrase
  already established by assignment 008 (`index.html:248`,
  `scripts/content/nl.mjs:247`: "anonieme, niet-herleidbare
  gebruiksstatistieken"). Kept 001's account-optionality sentence
  (e-mailadres/ouderaccount/voortgang-sync/wekelijkse voortgangsmail) verbatim
  — only the final clause changed.

  Checked for a visible HTML duplicate of this specific FAQ answer (the
  "Veelgestelde vragen" `<details>` section at `index.html:253-271` duplicates
  the JSON-LD FAQ for "Is Typcoon gratis?", "Leert mijn kind hier echt blind
  typen?", "Voor welke leeftijd is het?" and "Kan het op een tablet?", but the
  "Heb ik een account nodig?" question is present only in the JSON-LD block,
  never rendered as visible HTML) — there is no visible duplicate of this
  answer to update.

### Repo-wide search: hits and disposition

Searched the whole repo (excluding `node_modules`/`.git`) case-insensitively
for `geen gegevens`, `naar een server`, `geen server`.

**Updated:**
- `index.html:65` — FAQ JSON-LD, fixed as above.

**Kept as-is — verifiably compatible with the beacon's existence:**
- `public/voor-scholen/index.html:82` and `scripts/content/nl.mjs:247` (same
  generated line, "Privacy & veiligheid (AVG)" section) — "... er wordt geen
  persoonsgegeven van het kind naar een server gestuurd ..." already scopes
  the claim to persoonsgegevens (assignment 001/008 left this alone as
  already-honest; re-confirmed here). This page's own preceding sentence
  already names the anonymous, cookieless usage statistics honestly ("We
  meten alleen anonieme, niet-herleidbare gebruiksstatistieken ... zonder
  cookies en zonder dat een individueel kind te herkennen is."). No change
  needed.
- `src/game/store.js:2` — code comment on the local-save module ("alles
  blijft in de browser, geen account, geen server"), scoped to what that one
  module does (save-game data never leaves the device, which remains true —
  `track.js` is a separate, unrelated beacon). Not a marketing surface, not
  user-facing, and true within its own scope; kept as-is per the 001/008
  precedent of leaving accurate code comments untouched.
- `company/assignments/001-privacy-copy-reconciliation.md`,
  `company/assignments/008-qualify-geen-tracking-claims.md`,
  `company/assignments/011-faq-no-data-claim.md` (this file) — quote the
  pre-fix/problem-statement wording in their own Goal sections; historical
  record, left untouched per the same precedent as 001 and 008.

No other hits found. No user-facing surface overclaims beyond what's listed
as "updated" above.

### Build / test verification

- `npm install` — clean (22 packages, same as prior lanes; 2 known
  pre-existing audit advisories, unrelated to this change).
- `npm run build` — passes: `prebuild` (`gen-content.mjs`) regenerates 13 URLs
  + sitemap, then `vite build` succeeds, 81 modules transformed, no errors.
  Confirmed with `git -c core.autocrlf=false diff --stat -- public/` that
  regeneration produced **zero** actual content diff (pure CRLF/LF churn);
  reverted `public/**` with `git checkout -- public/` before committing, same
  as assignments 001/008.
- `npm test` — **77/77 pass, 0 fail** (`node --test test/*.test.js`). No test
  or engine/account/track code touched.
- Verified all 4 JSON-LD `<script type="application/ld+json">` blocks in
  `index.html` still parse as valid JSON after the edit (checked with a small
  Node script that regex-extracts each block and `JSON.parse`s it).

### Verification (tester, 2026-07-22)

Independently re-ran everything rather than trusting the diff/notes.

- **Repo-wide search** for `geen gegevens`, `naar een server`, `geen server`,
  plus my own variants `geen data`, `niets naar`, `geen tracking`, `zonder
  data` (case-insensitive, whole tree, excluding `node_modules`/`.git`) —
  same hit set as the developer's disposition table. `index.html:65` is the
  only fixed occurrence; `public/voor-scholen/index.html:82` /
  `scripts/content/nl.mjs:247` already scope to persoonsgegeven (unchanged,
  correctly left alone); `src/game/store.js:2` is a non-user-facing code
  comment about the local-save module, true in its own scope (unchanged,
  correctly left alone); the only other hits are historical prose inside
  `company/assignments/001-*.md`, `008-*.md`, this file, and
  `company/retro/2026-07-22-tick1.md`. No user-facing overclaim left.
- **index.html:65 (JSON-LD FAQ, "Heb ik een account nodig?")** now reads "...
  zonder ouderaccount gaan er geen persoonsgegevens naar een server; alleen
  anonieme, niet-herleidbare gebruiksstatistieken worden geteld." Checked this
  against `api/track.js` and `public/track.js` directly: `public/track.js`
  posts only `{ type: 'pageview', path: location.pathname, sessionId: <fresh
  crypto.randomUUID() per page load, never persisted> }`, no cookies. `api/
  track.js` writes a row of `{ type, path, session_id, country }` to
  Supabase — `country` comes server-side from the `x-vercel-ip-country`
  header (coarse, not from the client payload), and the requester's IP is
  only ever SHA-256-hashed (`ipHash` in `api/_ratelimit.js`) as a rate-limit
  bucket key, never stored on the event row. No email, no name, no
  persistent identifier reaches the server without an account. Claim is
  true.
- **No visible HTML duplicate**: read `index.html:253-271` (`<details>`
  "Veelgestelde vragen" block) in full — it duplicates 4 of the 5 JSON-LD
  FAQ entries but never renders "Heb ik een account nodig?" as visible HTML.
  Confirmed there is nothing to fix there.
- **JSON-LD parses**: wrote a throwaway Node script (in my own scratchpad,
  not the repo) that regex-extracts every `<script type="application/
  ld+json">` block from `index.html` and `JSON.parse`s it — all 4 blocks
  (VideoGame, FAQPage, Organization, WebSite) parsed cleanly.
- **001/008 wording intact**: `index.html:65` still has the full
  e-mailadres/ouderaccount/voortgang-op-meerdere-apparaten/wekelijkse-
  voortgangsmail sentence verbatim; `index.html:248` still has the exact
  001/008 phrase "anonieme, niet-herleidbare gebruiksstatistieken" and "geen
  tracking door derden".
- **Build/test, run fresh in this worktree**: `npm install` — clean, 22
  packages added, 2 pre-existing audit advisories (unrelated). `npm run
  build` — `prebuild` regenerates 13 URLs + sitemap, `vite build` succeeds,
  81 modules transformed, no errors; confirmed via `git diff --stat --
  public/` that regeneration is pure CRLF/LF churn (zero content diff, same
  as the developer reported), reverted with `git checkout -- public/` before
  anything else. `npm test` — **77/77 pass, 0 fail**.

Verdict: all acceptance criteria independently confirmed met. Status → done.
