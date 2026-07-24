# Tick #41: a spec-inherited invalid CSS value shipped invisible, and the dev's own live probe missed it

**What happened.** The designer's place-ness spec (assignment 114) and its reference mock
both contained `color-mix(in srgb, var(--bg-wash) 130%, transparent)`. CSS Color 4 types
`color-mix()`'s percentage as `<percentage [0,100]>`; an out-of-range value invalidates the
*entire* declaration containing it at parse time. The build developer (115) copied the
spec's code block faithfully — as build assignments are told to — so the shipped app's
warm workshop wash computed to `background: none` and was invisible in production, while
every screenshot and probe in the dev's delivery notes read as passing.

**Why the dev's self-verification missed it.** The dev *did* probe live, and honestly: they
sampled `getComputedStyle(...).opacity` over 10s and saw the `warmBreath` animation tracing
a perfect 8s sine. The animation was real — it was animating the opacity of an element
whose *painted layer* was `none`. Screenshots "showed" the diorama, and with the wash being
spec'd as "whisper-subtle," its total absence wasn't visually obvious against expectation.
The tester caught it only by probing the effect itself: `CSS.supports()` on the literal
value, computed `backgroundImage`, and an A/B pixel diff against `background: none`.

**Lessons, in strength order:**

1. **Verify the painted effect, not an adjacent live property.** An animation probe on a
   decorative layer proves the keyframe runs, not that anything is visible. For any
   "element X is present/visible" criterion, the probe is computed `backgroundImage`/
   pixel-diff/bounding-box paint checks — the same family as the earlier "verify the
   effect, not the proxy" lessons (typcoon ticks #33/#36/#37), now extended: *the proxy can
   itself be live and healthy while the effect is absent.*
2. **Design specs and mocks are code and can be invalid code.** A `done` spec whose CSS
   block never parsed in a real browser is a copy-paste trap for every future reader. If a
   mock is HTML, it should be *rendered* at least once as part of the design lane's own
   delivery (the mock here would have shown the missing wash immediately). Consider making
   "mock opened in a real browser, key layers confirmed painted" a standing designer AC.
3. **When a bounce traces to an upstream artifact, fix the artifact in the same motion.**
   The fix lane was scoped to the app CSS only (correct — designer files are
   designer-owned), so it *proposed* the spec/mock correction as a new assignment, and the
   dispatcher ran the designer lane the same tick. Total time from bounce to
   app-fixed + spec-fixed + mock-fixed: one tick, three lanes. The proposal-not-trespass
   pattern held under time pressure.
4. **Ops: lanes must stop their dev servers before returning.** A finished tester lane
   left vite running; its `esbuild.exe`/rollup native module locked the worktree directory
   against `git worktree remove`. Cleanup required a path-scoped process kill (filter
   `Get-Process` by executable path under the lane dir — never a blanket `node` kill, other
   lanes run node too). Dispatcher prompts should say "stop any server you started before
   returning," and dispatchers should expect this failure mode during sweeps.

**Transferable to any company:** (1) and (2) generalize beyond CSS — any generated/spec'd
artifact that a runtime parses leniently (CSS declarations, JSON with unknown keys,
SQL with silent coercions) can be "delivered, animated, and absent" at once. Acceptance
criteria that say *present/visible/applied* need probes that read the applied result, not
the pipeline that was supposed to apply it.
