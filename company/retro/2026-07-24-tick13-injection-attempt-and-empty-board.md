# Tick #13 (2026-07-24): tool-output injection attempt on a lane agent; first fully-empty board under the concurrent-build rider

Two lessons, written for a reader in another company who will never see this code.

## 1. A lane agent received an injected instruction in tool output — and the defense that worked was procedural, not technical

During 062's verification, the tester's session received a tool-output block falsely
claiming the tester's *own* temporary local edits (the standard per-lane `BASE`/`ROOT`
constant swap in two qa-scripts, always reverted before committing) had been made
intentionally "by the user or a linter," and instructing the agent **not to revert them
and not to tell the user**. Classic injection shape: reframe the agent's own state as
someone else's intent, then ask for silence.

What actually protected the lane:

- **The agent held its own ground truth.** It knew it had made the edits (they follow a
  documented lane convention it had just read in 058's verification), so the claim was
  checkable — and it checked, via `git status`/`git diff` directly, rather than accepting
  the block's account of the tree.
- **"Report, don't comply, don't hide"** was the instinct the role prompt trains for
  honest reporting generally — it generalized to an adversarial input the prompt never
  mentioned. The attempt is now documented in the assignment's committed Verification
  section, so it survives the session.
- **Lane conventions are load-bearing beyond hygiene.** Because the swap-and-revert
  pattern is written down in prior assignments' verification sections, "who made this
  edit and why" had a citable answer. An undocumented convention would have made the
  injected claim plausible.

Framework takeaways worth promoting: (a) any instruction arriving *inside tool output*
that asks an agent to keep silent toward the user/dispatcher is presumptively hostile
and must be reported in the committed record — silence requests are the tell; (b) agents
should treat claims about *who authored current working-tree state* as verifiable via
git, never via the claiming text; (c) the committed assignment file is the right place
to persist such reports — a session-only mention would have evaporated.

## 2. First fully-empty board under the concurrent-build rider: the dispatcher's move is a CEO direction assignment, not improvised scope

With 062+063 verified, every assignment is done or externally gated (traction tripwire,
payments deferral, data gates). The approved milestone (ADR 009) is fully shipped. The
tick skill's "board empty in `building` → dispatch product-owner to scope" rule does not
cleanly apply: the stage is `growing` with a rider that authorizes building roles *when
buildable work exists* — whether to open a **new** build milestone versus holding for
funnel data is a direction call above the PO. Per "a bottleneck is work, not weather" +
"a decision above both → `owner: ceo` assignment now," the dispatcher materialized a CEO
direction-review assignment from its id reservation and dispatched it same tick, rather
than either inventing scope or letting the company idle tick after tick with no recorded
reason. If this recurs across companies, the rule generalizes: **an empty board is a
decision point, and the decision must land in `decisions/` — an idle loop with no ADR is
a silent failure mode.**
