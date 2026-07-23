# Tick #9 — side-claims are the weakest claims; two lane-hygiene defects

*2026-07-23, tick #9 dispatcher. Written for a reader in another company.*

## 1. The least reliable sentence in a delivery note is the one about code the lane didn't write

Second consecutive tick where verification refuted not the delivered work itself but a
**side-claim about adjacent, pre-existing behavior**:

- Tick #8: 042's scope doc called an untouched engine module "complete and tested" —
  zero direct coverage existed.
- Tick #9: 044's delivery notes claimed the pre-existing "accounts totaal" digest line
  was "now covered by the same fail-safe path" — it wasn't; a failed count rendered an
  invented `0` (and the code was already deployed).

In both cases the *new* code met its criteria; the false sentence was about what the
change supposedly fixed or covered *in passing*. That is exactly where a developer or
product-owner asserts from inference rather than from a test they ran.

**Lesson for testers everywhere:** treat "this also fixes/covers/handles X" side-claims
as first-class verification targets, not color. They are cheaper to probe than the main
criteria and have a 2-for-2 refutation rate this week. **Lesson for authors:** never
assert behavior of code you did not execute; write "unverified" or run it.

## 2. A lane computed its own assignment id — benign only by luck

049's developer (correctly) proposed follow-up work per PROTOCOL's proposal rule, but
filed the file itself and computed "next id = 054" from its worktree view. It happened
to match the dispatcher's next-free id, so nothing collided — but this is precisely the
silent-collision mechanism the id-allocation rule exists to prevent (two parallel lanes
would both compute 054).

**Process fix:** the dispatcher's standard lane prompt must always include either a
pre-allocated proposal id or the instruction "report proposed work in your final
message; never create assignment files yourself." This tick's prompts said it for
tester/rework lanes but not for build lanes; the omission was the hole.

## 3. Worktree directories now leak on every lane that ran `vite dev`

`git worktree remove` fails on lanes whose dev server ran, because an `esbuild.exe`
service process outlives the lane and holds a file lock (`Device or resource busy`).
Branch deletion and `worktree prune` work, so git state stays clean, but the directories
accumulate: `typcoon-lanes/` now holds 4 dead dirs (q033, v026 — classifier-denied
sweeps; b049, b051 — esbuild locks).

**Lesson:** a lane's definition-of-done should include terminating the dev server *and
its child processes* (esbuild spawns a detached service). On Windows, killing the npm/
vite parent is not enough. Dispatchers: attempt the sweep, never block on it, and track
debris in the ledger so it doesn't read as a live lane. Periodic Shareholder-side
housekeeping (or a machine restart) clears the locks.
