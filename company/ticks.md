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

## Tick 2026-07-22 #1 — OPEN
- opened: 2026-07-22 15:20
- claimed: 001, 002, 004, 005
- worktrees: 001 → C:\companies\typcoon-lanes\a001 (branch lane/001); 002 → C:\companies\typcoon-lanes\a002 (lane/002); 004 → C:\companies\typcoon-lanes\a004 (lane/004); 005 → C:\companies\typcoon-lanes\a005 (lane/005); main checkout: dispatcher/integration only
- ids allocated: decisions/002 reserved for the payments ADR (002 lane / post-decision); lanes draft any follow-up assignments inside their plan docs with ids TBD — next free assignment id remains 007
- notes: 006 deliberately deferred — would collide with 001 in index.html; 003 blocked_by 002
- closed:
- retro:

*(board established at adoption, 2026-07-22; ids 001–006 allocated by the adopting
dispatcher)*
