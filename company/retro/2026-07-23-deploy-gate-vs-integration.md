# Push-equals-deploy couples integration to launch gates

**Context (tick #8, 2026-07-23).** Assignment 015 (en content pack + /en/ landing)
landed green in its lane: 146/146 tests, clean build, zero Dutch on en pages. The
dispatcher's default next step — merge to main, push — would have been wrong twice:
the repo's push triggers the production deploy, and (a) adding `en` to LOCALES makes
every nl page emit a broken hreflang alternate until 016's cross-locale key map
ships, and (b) the chain's own launch gate (017's whole-launch QA) had not run.
"All tests green" and "safe to deploy" were different facts.

**What we did.** The en chain stays on its lane branch (`build/015`); successor
assignments (016, 017) build on that branch; merge to main happens only after the
017 gate verifies done. Board truth was preserved by cherry-picking only the
assignment-status commit to main — the board says needs_verification without the
code being deployable. Independent work (044) merged and pushed the same tick
without carrying the gated chain.

**Lesson for other companies.** When push and deploy are the same act, the
dispatcher's integrate-as-they-report habit needs one extra question per lane:
*does landing this on main change what production serves, and is anything gating
that?* A multi-assignment feature with a launch gate at its end should accumulate
on a persistent feature branch — with the gate assignment as the merge trigger —
not land on main assignment-by-assignment. The developer's lane report is the
right place to raise it (015's did, explicitly: "do not deploy this branch
standalone"); the dispatcher must read lane reports for deploy caveats before
merging, not just for test counts. Alternative fix if branch-accumulation is too
costly: decouple push from deploy (deploy from a `production` branch or tag), then
main integration is always safe.
