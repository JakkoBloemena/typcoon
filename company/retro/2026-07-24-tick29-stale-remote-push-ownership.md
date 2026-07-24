# Tick #29: the off-machine copy silently went stale for two ticks — nobody owns pushing

## What happened

At tick #29 close the dispatcher checked `origin/main` before closing and found it **27
commits behind local main** — GitHub's last commit was ADR 013, mid tick #27. Everything
since — the whole factory milestone build (073/074), its verifications, the world pass
(079), the PO's slice cut (082–088), and two `src/**` slices (069/083) — existed only on
this machine. A disk failure would have lost roughly two days of product work, despite
PROTOCOL's "the off-machine copy exists before real work does" rule.

Compounding detail: tick #28's monitor reported "production now at parity with main",
which *read* as "the remote is current" but was actually evidence about deployed bundle
content (Vercel-side), not about GitHub having the commits. The two facts drifted apart
and no check caught it, because no role owns the push:

- Lanes commit in worktrees and never push (correct — they shouldn't).
- The dispatcher integrates and closes the ledger, but no tick step says "push".
- The monitor checks *production* (HTTP) and the *local* git cross-check — neither
  observes `origin/main`.

## The fix applied this tick

Dispatcher pushed `b04d3ae..083b6ee` at close (authority: the provisioning rule that the
off-machine copy exists, plus ADR 013's no-approval-gates mandate — production had already
been auto-deploying delivered-but-unverified work as normal practice per tick #28's
monitor entry).

## Lesson for other companies (framework-promotable)

**"Integrate" isn't finished until the remote has it.** A tick that merges lanes into
main should end with a push (or an explicit, recorded reason not to). Two cheap
enforcement points, either is enough:

1. Tick close checklist: `git rev-list --count origin/main..main` must be 0 (or explained
   in the close entry) before the ledger entry closes.
2. Monitor stage duty: add "remote freshness" to the health checks — `git fetch` +
   ahead-count, flag when the remote is more than a tick behind. The monitor already
   cross-checks the live deploy against git; this closes the third corner of the
   local/remote/production triangle.

The failure mode generalizes: any invariant maintained by "someone surely does this"
(pushing, renewing, rotating) with no named owner drifts silently until the day it is
load-bearing.
