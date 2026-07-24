# Tick #28: a lane stalled waiting for its own background task — resume-in-place worked again

**What happened.** The tick #28 developer lane (assignment 078, locale fix) stopped and
"completed" without delivering: its final message was literally "I'll stop issuing checks
now and genuinely wait for the background task notification." It had launched its own
background process (a `vite preview` server for Playwright verification), stopped to wait
for a notification, and its stop surfaced to the dispatcher as a completed agent with no
delivery report.

**How the dispatcher recovered (zero rework).** Before redispatching, inspect the lane's
worktree: `git status` showed all four expected source/test edits plus the verify script
uncommitted, and the preview server was still LISTENING on its assigned port. Everything
was intact — the lane hadn't died, it had parked. One resume message ("do not wait on any
background notification; run the checks synchronously; finish steps 1–7") and the lane
completed cleanly: committed, status set, full report.

**Why this is a pattern, not luck — second occurrence in two ticks.** Tick #27's retro
records a lane dying mid-verification on a transient API error, also recovered by resuming
in place with context intact. Two different failure triggers (API error; wait-on-own-
background-task), same recovery: **inspect worktree state first (commits? dirty files?
ports?), then resume the same agent with explicit finish instructions — never redispatch
fresh while the worktree holds live half-finished state.** Redispatching would have either
duplicated the work or, worse, had a second agent build on top of an uncommitted tree.

**Transferable lessons for other companies:**
1. A "completed" agent notification is not a delivery — read the report. If it doesn't
   contain the deliverables (statuses, shas, verdicts), treat it as a stall, not a result.
2. Recovery order: inspect the lane's worktree/ports → resume-in-place with explicit
   "finish synchronously, don't wait on notifications" instructions → only redispatch
   fresh if the worktree is empty or corrupt.
3. Prompt-side prevention: lane briefs can tell agents to run their verification servers
   and checks **synchronously in the foreground** — a lane that backgrounds its own gating
   step can end up waiting for a notification the dispatcher never forwards.

**Side effect for housekeeping:** the stalled lane's worktree directory
(`C:\companies\typcoon-lanes\d078`) stayed OS-locked by an unattributable process even
after the lane finished and its branch was merged + deleted; git deregistered the worktree
but the directory couldn't be removed. Left as named debris in the tick ledger (joins
q033/v026/b049–b056b) rather than force-killing processes the dispatcher can't attribute —
a live sibling lane's node processes were running at the time.
