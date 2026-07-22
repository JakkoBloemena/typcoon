# Tick ledger

Operational log of ticks (PROTOCOL § The tick). **Every tick opens an entry here —
committed together with its `in_progress` claims, before dispatching — and closes it as
the tick's last act.** Append-only, newest first.

A *stale* OPEN entry (hours old) means the previous tick died: reconcile — check each
claimed id for committed lane output, integrate or revert, flip unfinished claims back
to `open`, close the entry INTERRUPTED — then proceed. A *recent* OPEN entry, or foreign
work with no entry at all, means a live concurrent dispatcher: stop.

Entry format:

```markdown
## Tick <date> #<n> — OPEN | CLOSED | INTERRUPTED
- opened: <local timestamp>
- claimed: <assignment ids set in_progress>
- worktrees: <lane → worktree path; or "main checkout only">
- ids allocated: <any NNN handed to lanes for new artifacts, or "none">
- closed: <local timestamp>
- retro: <one line if the tick stalled, blocked, or died — else "clean">
```

---

## Tick 2026-07-22 #2 — OPEN
- opened: 2026-07-22 21:38
- claimed: 001, 004, 005, 006, 007, 008, 011 — verification pass (statuses stay needs_verification; this ledger entry is the claim)
- worktrees: one per lane, C:\companies\typcoon-lanes\v001 … v011 (branches verify/001 … verify/011); main checkout: dispatcher/integration only
- ids allocated: none to verify lanes. Mid-tick after 004/005 verified done: 012–017 materialized from en-locale-scope §7 (A–F), 018–022 from school-licence-plan §6 (TBD-A–E), 023–024 from the charter's known-open-threads list. 012, 018, 023 claimed in_progress and dispatched (worktrees b012/b018/b023, branches build/012 build/018 build/023); 024 carries a file-collision guard behind 012. Next free assignment id 025, next decision id 004
- notes: 006's GSC/Bing criterion was transferred to assignment 009 by CEO decision (tick #1); testers verify the remainder. 003/009/010 blocked, 002 done — nothing else eligible.
- closed:
- retro:

## Tick 2026-07-22 #1 — CLOSED
- opened: 2026-07-22 15:20
- claimed: 001, 002, 004, 005; 006 claimed mid-tick (edee18b) after 001's merge cleared the index.html collision
- worktrees: 001 → C:\companies\typcoon-lanes\a001 (branch lane/001); 002 → C:\companies\typcoon-lanes\a002 (lane/002); 004 → C:\companies\typcoon-lanes\a004 (lane/004); 005 → C:\companies\typcoon-lanes\a005 (lane/005); 006 → C:\companies\typcoon-lanes\a006 (lane/006); main checkout: dispatcher/integration only
- ids allocated: decisions/002 (payments-deferral ADR, written), decisions/003 (budget/domain ADR, written); assignments 007–010 opened mid-tick by the CEO (007/008 claimed in_progress this tick; 009/010 blocked-on-human/trigger); 011 opened+claimed after the 008 lane surfaced a stale FAQ claim — next free assignment id 012, next decision id 004
- notes: 006 deliberately deferred — would collide with 001 in index.html; 003 blocked_by 002
- closed: 2026-07-22 16:55
- outcomes: 001 needs_verification (privacy copy fixed, 70/70→77/77 tests across tick); 002 done (Shareholder decided same tick — decisions/002-payments-deferral.md; implementation deliberately not opened); 004 needs_verification (research/school-licence-plan.md); 005 needs_verification (research/en-locale-scope.md); 006 needs_verification (measurement stack, claimed mid-tick); 007 needs_verification (anchor removed, mid-tick); 008 needs_verification (tracking claims qualified, mid-tick); 011 needs_verification (FAQ persoonsgegevens claim, mid-tick, found by 008 lane). Board additions: 009 (blocked — Shareholder: GSC/Bing + Supabase events migration), 010 (blocked — traction tripwire). 003 parked per decisions/002. Decisions recorded: 002 (payments deferral), 003 (budget €50/mo + domain auto-renew). All lanes merged to main, worktrees removed, pushed to origin.
- retro: clean — see retro/2026-07-22-tick1.md (live-Shareholder latency, claim-space reconciliation chain 001→008→011, recorded dissent)

*(board established at adoption, 2026-07-22; ids 001–006 allocated by the adopting
dispatcher)*
