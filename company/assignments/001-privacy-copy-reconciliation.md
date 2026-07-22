---
id: 001
title: Reconcile privacy claims with shipped opt-in accounts
owner: developer
status: needs_verification
priority: 1
blocked_by: []
opened_by: ceo
---

## Goal

Marketing surfaces still claim "geen account, geen gegevens naar een server" while
opt-in parent accounts shipped (commit 79cbe9b: Supabase + Resend, parent email +
chosen kid username, consent-gated, no passwords). On a kids' product a false privacy
claim is a trust and legal exposure. Update every such claim to the honest position —
in the spirit of: **"speelt volledig zonder account — alle voortgang blijft lokaal.
Optioneel ouderaccount (alleen je e-mail) voor voortgang op meerdere apparaten en een
wekelijkse voortgangsmail."** In-app copy and DEPLOY.md are already honest; use them as
the reference wording. Shareholder ruling: accounts stay, copy gets fixed
(decisions/001-adoption.md) — do NOT touch account code.

## Acceptance criteria

- [x] `index.html:65` and `index.html:248` no longer claim no-account/no-server; new
      wording states local-first play + optional parent account honestly.
- [x] All meta descriptions in `index.html` (including OG/Twitter tags) match the
      honest wording.
- [x] `speel/index.html:8` updated the same way.
- [x] `README.md` ("Geen backend, geen account …") updated to describe reality:
      local-first, optional serverless backend per DEPLOY.md.
- [x] Repo-wide search (landing, blog/content pages under `public/`, JSON-LD/FAQ
      blocks, sitemap'd pages) for "geen account", "geen gegevens", "geen server" and
      equivalents: every hit is either updated or verifiably honest as-is; list the
      hits and their disposition in Notes.
- [x] No privacy claim anywhere is *stronger* than what the code does; claims that are
      true (no ads, no trackers, no passwords, no kid PII beyond chosen username, plays
      without account) are kept — they are our position, not collateral damage.
- [x] Dutch stays natural and parent-friendly; page titles/descriptions stay within
      sensible SEO length; build passes and tests stay green.

## Notes

Gap map (adoption survey 2026-07-22) lists the exact known locations. Honest-wording
reference: DEPLOY.md § "Backend: account, voortgang-sync & ouder-mails" and the in-app
ParentEmail/consent copy. Developer terminal state is `needs_verification`; a tester
flips to `done` after independently re-running the repo-wide search.

### Changes made

- `index.html:7,16,22` — meta description / og:description / twitter:description no
  longer say a bare "zonder account"-in-a-vacuum without qualification is the whole
  story; reworded to "speelt (volledig) zonder account" (scoped to *playing*, still
  true) so it can't be read as "this product has no account feature at all". Meta
  description trimmed back to ~184 chars (was 180 originally) to stay near the prior
  SEO length rather than growing it.
- `index.html:65` (FAQPage JSON-LD, "Heb ik een account nodig?") — was: "... er gaan
  geen gegevens naar een server" (false — Supabase/Resend exist). Now explains the
  optional ouderaccount and scopes the no-server claim to the case where no
  ouderaccount is linked.
- `index.html:248` (privacy bullet under "Voor ouders") — was: "geen account, geen
  tracking; alle voortgang blijft op het eigen apparaat" (false as a blanket claim).
  Now: "speelt volledig zonder account, geen tracking; alle voortgang blijft lokaal.
  Optioneel een ouderaccount (alleen e-mail) voor sync en een wekelijkse
  voortgangsmail." — matches the assignment's reference phrasing.
- `speel/index.html:8` — meta description "Gratis, zonder account" → "Gratis, speelt
  volledig zonder account" (same scoping fix as above).
- `README.md` — "Geen backend, geen account: alle voortgang blijft lokaal in de
  browser." → "Speelt volledig zonder account: alle voortgang blijft lokaal in de
  browser. Optioneel een serverless backend (`api/*`, zie DEPLOY.md) voor een
  ouderaccount — alleen e-mail, voor voortgang op meerdere apparaten en een
  wekelijkse voortgangsmail." (previously flatly false: `api/*` backend exists.)

Did **not** touch account code (`src/net/account.js`, `src/net/session.js`,
`src/game/ParentEmail.jsx`, `src/game/Login.jsx`) or in-app strings
(`src/game/strings.js`) — these were already honest (explicitly scoped, "optioneel",
mentions e-mail-only, no passwords) and served as reference wording, per the
assignment. Did not touch `DEPLOY.md` (assignment states it's already honest).

### Repo-wide search: hits and disposition

Searched the whole repo (excluding `node_modules`/`dist`) for `geen account`,
`zonder account`, `geen gegevens`, `geen server`, `geen backend`, `zonder backend`,
`no account`, `no server`, `server`, `gegevens`, `privacyvriendelijk`,
`persoonsgegevens`, `tracking` (case-insensitive), then read every hit in context.

**Updated (marketing/user-facing surfaces, listed above):**
- `index.html` — lines 7, 16, 22, 65, 248
- `speel/index.html` — line 8
- `README.md` — line 23

**Kept as-is — verifiably true, matches the guardrail's kept-claims list
("plays without account", no ads, no tracking):**
- `DEPLOY.md:39` — "De frontend werkt 100% zonder backend (kinderen spelen lokaal,
  zonder account)." — this *is* the honest reference wording the assignment names;
  correctly scoped (frontend/no-backend-required), already distinguishes the
  optional `api/*` backend in the very next sentence.
- `index.html:50` and `index.html:257` (FAQ "Is Typcoon gratis?", JSON-LD + visible
  HTML duplicate) — "de eerste letters ... zonder account" describes the free tier
  needing no account, which is true; doesn't claim data never reaches a server.
- `scripts/content/nl.mjs` `ui.footerTag` ("... gratis, zonder account, zonder
  advertenties.") and `ui.ctaBody` ("... Gratis te proberen, zonder account.") —
  shared UI strings rendered into every generated page's footer/CTA box
  (`public/blog/*`, `public/blog/index.html`, `public/leren-typen-voor-kinderen/`,
  `public/voor-scholen/`). Scoped to "playing/trying is free and needs no account" —
  true, and this is exactly the "plays without account" claim the acceptance
  criteria says to keep, not collateral damage.
- `scripts/content/nl.mjs` pillar/article body copy repeating the same "zonder
  account" framing (lines ~191, ~242) — same scoping, true, kept.
- `scripts/content/nl.mjs` (`pages[0]`, voor-scholen page) meta description (236),
  lead (239), and the "Meteen te gebruiken ... geen accounts nodig" bullet (242) —
  scoped to "no signup needed to start playing in class", true. Its own
  "Privacy & veiligheid (AVG)" section (247) already states the honest position
  verbatim: "Gratis spelen kan volledig zonder account — er wordt geen
  persoonsgegeven van het kind naar een server gestuurd ... Een ouder- of
  leerkracht-account ... is optioneel en vraagt alleen een e-mailadres van de
  volwassene." Its FAQ (252, 253) is likewise already honest and explicit about
  the optional account. No changes needed — this page was already reconciled.
- `src/game/store.js:2`, `src/net/account.js:2`, `src/game/weekly.js:4`,
  `src/game/ParentEmail.jsx:1-2`, `src/game/strings.js:27` — code comments and
  in-app copy, not marketing surfaces; already accurate (accounts are explicitly
  framed as optional/opt-in) and are the assignment's own reference wording.
- `public/robots.txt`, `public/sitemap.xml`, `public/prefs/index.html` — no privacy
  claims present.

**Kept as-is — historical/governance record, not a marketing surface (editing
would falsify the record of the problem this assignment fixes):**
- `company/charter.md:62-66` (guardrail 4) — describes the *pre-fix* state as
  context for why the guardrail exists; already written in the past tense
  ("assignment 001 fixes this").
- `company/decisions/001-adoption.md:23-24,33-35` (ADR 001) — records the gap as
  found at adoption; this is the audit trail, not live copy.
- `company/assignments/001-privacy-copy-reconciliation.md` (this file) — quotes the
  false claim in its own Goal section as the problem statement; left untouched
  per instructions (Notes/status are the only parts I edit).
- `PLAYTEST_LOG.md:258-282` — dev log entries describing what was built and
  tested at the time (accounts optional, opt-in, fails gracefully without
  backend); historical record, not a live marketing claim, and already accurate.

No hit anywhere overclaimed beyond what's listed above as "updated". No account
code was touched.

### Build / test verification

- `npm install` (node_modules wasn't present in this worktree) — clean.
- `npm run build` — passes (`prebuild` regenerates `public/*` + sitemap via
  `gen-content.mjs`, then `vite build` succeeds; 80 modules transformed, no errors).
  Note: rerunning the generator on this machine rewrites `public/**/index.html` and
  `public/sitemap.xml` with LF line endings, which git then reports as modified
  purely due to CRLF checkout — confirmed with `git -c core.autocrlf=false diff`
  showing **zero** actual content diff. Reverted those with `git checkout --
  public/` before committing so the commit only contains the intended copy changes.
- `npm test` — 70/70 pass, 0 fail (`node --test test/*.test.js`). Did not modify
  any test or engine/account code.
- Verified JSON-LD blocks in `index.html` still parse as valid JSON after edits
  (all 4 `<script type="application/ld+json">` blocks parse OK).
- Checked meta/OG/Twitter description lengths after edits: description 184 chars
  (was 180 before this change), og:description 137, twitter:description 82,
  speel meta description 108 — all in the same ballpark as before, no blowout.
