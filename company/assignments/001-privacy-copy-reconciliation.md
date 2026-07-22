---
id: 001
title: Reconcile privacy claims with shipped opt-in accounts
owner: developer
status: open
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

- [ ] `index.html:65` and `index.html:248` no longer claim no-account/no-server; new
      wording states local-first play + optional parent account honestly.
- [ ] All meta descriptions in `index.html` (including OG/Twitter tags) match the
      honest wording.
- [ ] `speel/index.html:8` updated the same way.
- [ ] `README.md` ("Geen backend, geen account …") updated to describe reality:
      local-first, optional serverless backend per DEPLOY.md.
- [ ] Repo-wide search (landing, blog/content pages under `public/`, JSON-LD/FAQ
      blocks, sitemap'd pages) for "geen account", "geen gegevens", "geen server" and
      equivalents: every hit is either updated or verifiably honest as-is; list the
      hits and their disposition in Notes.
- [ ] No privacy claim anywhere is *stronger* than what the code does; claims that are
      true (no ads, no trackers, no passwords, no kid PII beyond chosen username, plays
      without account) are kept — they are our position, not collateral damage.
- [ ] Dutch stays natural and parent-friendly; page titles/descriptions stay within
      sensible SEO length; build passes and tests stay green.

## Notes

Gap map (adoption survey 2026-07-22) lists the exact known locations. Honest-wording
reference: DEPLOY.md § "Backend: account, voortgang-sync & ouder-mails" and the in-app
ParentEmail/consent copy. Developer terminal state is `needs_verification`; a tester
flips to `done` after independently re-running the repo-wide search.
