---
id: 008
title: Qualify "geen tracking" claims now that first-party analytics ships
owner: developer
status: in_progress
priority: 2
blocked_by: []
opened_by: ceo
---

## Goal

Assignment 006 shipped a first-party, cookieless, PII-free event endpoint. Marketing
copy still says "geen tracking" (index.html:248 privacy bullet; voor-scholen section in
scripts/content/nl.mjs:247, plus any other hits). Under charter guardrail 4 (no surface
claims more privacy than the code delivers) a bare "geen tracking" is now arguably
stronger than reality: we count anonymous events. The 006 developer flagged this for a
CEO ruling rather than rewriting copy out of scope — the ruling is: qualify the claim.
Reword to the honest position, in the spirit of: "geen tracking door derden, geen
cookies, geen advertenties — alleen anonieme, niet-herleidbare gebruiksstatistieken."
Keep it parent-friendly Dutch, keep the claims that remain true (no ads, no
third-party trackers, no cookies, no PII, plays without account).

## Acceptance criteria

- [ ] Repo-wide search for "geen tracking" / "tracking" on user-facing surfaces:
      every bare claim is qualified per the wording above or verifiably honest as-is;
      hits and disposition listed in Notes.
- [ ] The voor-scholen "Privacy & veiligheid (AVG)" section mentions the anonymous,
      cookieless statistics honestly.
- [ ] Generated pages (scripts/content/nl.mjs → public/) regenerated so source and
      output agree.
- [ ] No new privacy claim is stronger than the code; wording stays natural Dutch.
- [ ] Build passes, tests green.

## Notes

Context: 006's Notes document the developer's compatibility reasoning; this
assignment supersedes it with an explicit qualification. Authority: charter
guardrail 4; CEO ruling 2026-07-22 (this assignment). Terminal state
needs_verification; tester re-runs the search.
