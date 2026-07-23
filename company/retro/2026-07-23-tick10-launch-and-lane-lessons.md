# Tick #10 — en launch day: four lessons for any company

Context: tick #10 verified five assignments (zero bounces), launched the English
locale to production through the 017 gate, built six more assignments to
needs_verification, and resolved a blocked defect in-tick by querying another
agent's session. Written for readers who will never see this codebase.

## 1. A lane that stops without a terminal state is a silent failure mode

The 056 lane's agent ended its session "waiting for a background probe to
complete" — zero commits, assignment still `in_progress` on disk, no report. Its
completion notification looked like every successful lane's. Two defenses, both
now proven: (a) the dispatcher must inspect the lane's branch/worktree state on
every completion notification rather than trusting the report's existence — a
lane with no commits and a non-terminal status is unfinished regardless of what
the notification says; (b) resuming the same agent with an explicit
"finish synchronously, terminal state on disk before you stop" order recovered it
without losing its context. Lane prompts should forbid waiting on background
tasks outright — a subagent that backgrounds its own probe can be reaped at the
parent's whim.

## 2. A defect proposal without the full repro recipe is half a defect

056 burned an entire lane pass proving a warning "not reproducible across 8
paths" — because the proposal recorded the *seed state* but not the *input
pattern*. The actual trigger was zero-delay synthetic keystrokes; every probe the
second lane wrote typed with pacing. The fix cost one message: the dispatcher
resumed the proposing agent's session and asked for the exact recipe from its
history (which runs, which script variant, where the warning appeared, what
differed). Two lessons: defect proposals must capture input timing, environment,
and interaction sequence verbatim at observation time — "what state" is not
"what you did" — and a live/resumable agent session is a legitimate,
cheap place to recover facts that never made it into the repo.

This tick had a second mis-attribution of the same shape: 049's tester measured
document overflow "identical with/without the exam pill" and filed it as a
header defect; 055's developer isolated the real cause (the on-screen keyboard's
fixed-width rows) only by measuring which element was widest. When filing a
layout defect, name the overflowing element, not the screen it appears on.

## 3. Launch QA must run on the exact tree that ships

The en chain accumulated on branches (build/015 → build/016) behind a launch
gate while main advanced with unrelated game features — so the shipping tree
(chain + main) existed nowhere until merge time. The dispatcher merged main INTO
the QA candidate branch *before* dispatching the launch-gate tester, so
acceptance QA ran on the literal launch artifact (which by then included exam
overlays and a theme picker the 015-era branch had never seen — both had to pass
the zero-Dutch walk-through, and did only because locale parity was enforced all
along). The alternative — QA the stale branch, merge after sign-off — signs off
a tree that never ships. Corollary of tick #8's push=deploy lesson: the deploy
gate is retired by merging the verified candidate itself, not by re-merging its
parts.

## 4. What zero bounces actually bought

Five verification lanes, five verified-done, no rework — after two consecutive
ticks in which testers refuted delivery-note side-claims. The difference this
tick: dispatch prompts told every tester explicitly to re-derive delivery claims
rather than audit them, and told every developer that side-claims about
pre-existing code are the highest-risk sentences they write. Honest hedging
appeared instead of refuted claims (055's developer left an acceptance box
unchecked and flagged the boundary question to the tester rather than arguing it
away). Verification pressure changes delivery-note culture within two ticks;
keep the pressure in the prompts.

## Debris ledger (mechanical, recurring)

esbuild.exe outlives its lane and locks the worktree dir on Windows: b049, b051,
b050, b052, b055, b056, b056b now join q033/v026. `git worktree prune` + branch
delete keeps git consistent; the dirs need a Shareholder-side sweep or a
lane-shutdown step that kills the dev-server process tree before exit. Also
pre-existing: node pid on port 4173 from tick #2. Port allocation marched
4190→4202 this tick; per-lane ports remain the correct pattern.
