# Permission classifier vs. dispatcher housekeeping (2026-07-23, tick #4)

**What happened.** The tick #4 dispatcher tried to sweep debris left by the dead tick-#2
QA lane: kill a leftover dev-server process (node pid 15508 holding port 4173) and delete
two stale worktree directories (`typcoon-lanes/q033` and `typcoon-lanes/v026`).
The session's permission classifier denied both `Stop-Process` and `Remove-Item` (and,
oddly, one combined `git status; Get-Date` call). The tick routed around it — fresh
worktree names, a different port (4175) — and lost nothing.

**Why it matters beyond this tick.** This is the second time a classifier denial hit a
dispatcher-level operation rather than lane work: tick #2's `supabase db push` denial
turned the licenses migration into a human-gated assignment (031) that took a /ceo session
to resolve. A constraint that shows up twice is a process defect, not bad luck. The
pattern: scheduled tick sessions run under an automated permission mode whose classifier
blocks process-kill, recursive-delete, and some state-changing infra commands — exactly
the category "cleanup of a dead lane's debris" falls into.

**Lessons for any company.**
1. **Debris tolerance beats debris removal.** Lanes must never depend on a specific port
   or a clean lanes directory: allocate a fresh worktree name and a fresh port per lane
   (this company now burns ports upward: 4173 → 4174 → 4175). A dispatcher that *requires*
   cleanup rights it may not have will stall; one that routes around debris only loses
   disk space.
2. **Record debris in the ledger, don't silently retry.** The blocked sweep is noted in
   the tick entry with pids/paths, so a human (or an interactive session with broader
   permissions) can clean it up later. Retrying denied commands in variations is both
   futile and the wrong posture toward a deliberate denial.
3. **Framework candidate:** either the tick wrapper's settings should allowlist the
   narrow, safe housekeeping forms (`git worktree remove`, killing a process the ledger
   itself names as lane debris), or the tick skill should state plainly that housekeeping
   is best-effort and debris is normal operating state. Either fix belongs in `C:\cc`,
   via the weekly retro — not in this repo.
