---
id: 011
title: Fix FAQ "geen gegevens naar een server" claim vs the anonymous beacon
owner: developer
status: in_progress
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

- [ ] index.html FAQ (JSON-LD and any visible duplicate) no longer claims zero data
      reaches a server; new wording: no persoonsgegevens, anonymous non-traceable
      usage statistics only, parent account optional.
- [ ] Repo-wide search for "geen gegevens" / "naar een server" / "geen server":
      every user-facing hit is compatible with the beacon's existence; hits and
      disposition in Notes.
- [ ] JSON-LD still parses; Dutch stays natural; build passes, tests green.

## Notes

Found by the 008 lane (2026-07-22), out of its literal scope. Authority: charter
guardrail 4; wording precedent: assignments 001 and 008. Terminal state
needs_verification.
