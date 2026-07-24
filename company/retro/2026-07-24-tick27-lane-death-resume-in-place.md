# Tick #27: a lane died mid-run on a transient API error — resume-in-place beat redispatch

**What happened.** The tick's third saturation wave dispatched a developer lane on
assignment 074 (the largest build of the milestone: roadmap, spotlit goal, objectives
row). Mid-verification — after the build was written and its `npm test` had passed
229/229, but before the Playwright pass finished and before the commit — the lane's
session was killed by a transient API server error ("Server error mid-response"). The
worktree survived intact; the lane's transcript survived intact.

**What the dispatcher did.** Instead of redispatching a fresh developer onto 074
(which would have meant a new agent re-reading the whole brief, re-deriving the
half-built state in the worktree, and either redoing or — worse — half-trusting an
unfamiliar diff), the dispatcher **resumed the same agent with its context intact**,
with a short message: "your session was interrupted; check `git log`/`git status`
first to see what you already committed vs left uncommitted; do not duplicate commits;
continue from the revert-public-churn step." The resumed lane picked up exactly where
it died, finished verification (catching and fixing three real rendering bugs in the
process), committed once, and reported normally. Zero rework, zero duplicate commits,
~25 minutes lost.

**The lesson for other companies.** A dead lane with a live worktree is not a failed
assignment — it is a *suspended* one. The framework's agent runtime can resume a
stopped agent from its transcript (SendMessage to the same agent id). Prefer that over
redispatch whenever (a) the worktree shows partial work, and (b) the death was
environmental (API error, rate limit, machine restart) rather than the lane being
genuinely stuck. Redispatch onto a dirty worktree is how you get an agent "reading
half-finished work as existing codebase and building on it" — the exact failure mode
worktree isolation exists to prevent, recreated *inside* one lane.

**Dispatcher checklist that made the resume safe (worth copying):**
1. Tell the resumed lane its death was environmental, not a correction.
2. Order it to inspect its own `git log`/`git status` before acting — the lane must
   re-derive what landed vs what didn't from the repo, not from its memory of intent.
3. Explicitly forbid duplicate commits.
4. Re-state the terminal-state + report contract (the tail of the original brief),
   since the death may have truncated whatever plan the lane was holding.

**Boundary.** If the worktree had been corrupted, or the death had been the lane
being *wedged* (looping, blocked on a permission, arguing with itself), redispatch
onto a *fresh* worktree with the old branch preserved for reference would have been
the right call instead. Resume-in-place is for environmental deaths with clean state.
