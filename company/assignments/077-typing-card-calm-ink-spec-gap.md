---
id: 077
title: Typing-card recolor ("done=dim / upcoming=calm-ink") is specified but no assignment builds it
owner: product-owner
status: needs_verification
priority: 4
opened_by: tester (proposed)
blocked_by: []
---

## Goal

While verifying 068 (factory milestone scope), found a small internal contradiction that
carried from `design/DESIGN-FACTORY.md` into `research/milestone-factory.md` and then into
assignment 073, which as scoped will silently not build a detail both docs describe.

**The contradiction:**
- `design/DESIGN-FACTORY.md` front matter defines a genuinely new token,
  `--calm-ink: #c7d2f2` ("slightly-dimmed paper for the low-arousal typing surface").
- §5a of that same doc specifies the typing card's char states as
  `done = dim, current = brass underline, upcoming = calm-ink`, then in the same breath
  calls this "the existing `ui/TypingSurface.jsx`... Mirrors `ui/TypingSurface`'s existing
  char states" — implying no change is needed.
- §7 (reuse-vs-replace) is explicit: "`ui/TypingSurface.jsx` **and its char-state styling**
  — it *is* the calm typing surface... the split removes what surrounds it, not it,"
  i.e. char-state colors are reused verbatim, not restyled.
- `research/milestone-factory.md` §1a repeats the same pairing verbatim ("done = dim...
  upcoming = calm-ink... This is the existing `ui/TypingSurface.jsx`, unchanged").
- The actual current implementation (`src/game/game.css` lines ~411-414) is:
  `.tchar` (upcoming) = `var(--ink-dim)`, `.tchar.done` = `var(--mint)`,
  `.tchar.current` = `var(--paper)` + brass underline. Neither "done" nor "upcoming"
  matches the "dim"/"calm-ink" pairing the docs describe, and `--calm-ink` does not exist
  anywhere in `game.css` yet (confirmed via grep — zero hits repo-wide outside the design
  doc and 067's delivery notes).
- Assignment 073's acceptance criteria say only: "the existing `ui/TypingSurface.jsx`
  typing card (**unchanged**) with the next-key hint only" — no AC instructs adding
  `--calm-ink` to `:root` or recoloring the char states. A developer building 073 to the
  letter of its AC will leave the typing card exactly as it renders today (mint/ink-dim/
  paper+brass), and the "done=dim / upcoming=calm-ink" treatment both design docs describe
  will simply never get built — not because it was rejected, but because no assignment's
  AC says to build it.

## Why this is minor (priority 4)

The current colors (mint for done, ink-dim for upcoming, paper+brass for current) are
functional and already themed via existing tokens — nothing breaks, nothing looks wrong,
and the milestone's actual goals (calm layout, single visible goal, factory-page roadmap)
are unaffected. This is a documentation/spec inconsistency, not a broken flow. Filed as a
proposal, not a reproduced product defect.

## Acceptance criteria

- [x] PO decides: **option (a) — CUT** the done=dim/upcoming=calm-ink recolor from scope.
      `research/milestone-factory.md` §1a and `design/DESIGN-FACTORY.md` §5a/§7 + front matter
      updated to say the char states are reused **as-is** (done = mint, current = paper + brass,
      upcoming = ink-dim), dropping the "calm-ink" promise. 073's text needs no change: its AC
      already says "typing card **unchanged**," which is now exactly what the design docs
      promise — the contradiction is resolved by making the docs agree with 073, not 073 with
      the docs. See `## Adjudication` below.
- [x] Docs now agree: `design/DESIGN-FACTORY.md` (front matter `--calm-ink` marked cut; §5a
      char-state line rewritten to "reused verbatim"; §7 reuse-as-is bullet made authoritative
      and cites the cut) and `research/milestone-factory.md` §1a both describe the existing
      `.tchar` colours, and 073's "typing card unchanged" AC matches what gets built.
      *(Both criteria are third-party-checkable, so terminal state is `needs_verification`.)*

## Notes

Found during independent verification of assignment 068. Not a blocker for 068's own four
acceptance criteria (scope-doc completeness, save-compat, goals system, playtest gate),
which all pass independently of this. Scope: `research/milestone-factory.md` §1a,
`design/DESIGN-FACTORY.md` §5a/§7, `company/assignments/073-calm-typing-view.md`.

## Adjudication (product-owner, 2026-07-24, tick #27)

**Decision: CUT the "done=dim / upcoming=calm-ink" typing-card recolor. Do not build it.
No follow-up assignment.** The docs are updated to stop promising it; the char states are
reused verbatim from today's `game.css` (`.tchar` upcoming = `--ink-dim`, `.tchar.done` =
`--mint`, `.tchar.current` = `--paper` + brass underline). Terminal state
`needs_verification` because the deliverable — decision made + docs agree — is
third-party-checkable.

Why cut, on the merits (not to save work — the merits point the same way):

1. **The design doc already decided "reuse" in the one section built to decide it.** §7
   (reuse-vs-replace — the authoritative "what changes" ledger) lists "`ui/TypingSurface.jsx`
   and its char-state styling — reused as-is (no change)." The recolor lives only in the front
   matter token list and one §5a clause, which itself contradicts the recolor in the same
   breath ("Mirrors `ui/TypingSurface`'s existing char states"). The token was drafted, never
   carried into the change ledger. The honest reading of the designer's own doc is *no recolor*.

2. **`--calm-ink` as specified breaks the milestone's core invariant.** It is a hardcoded hex
   (`#c7d2f2`), unlike its siblings `--goal: var(--mint)` and `--reward: var(--brass)`. Design
   §8 rule 1 forbids new hardcoded colour ("every colour is a `var(--token)`") so themes cascade
   for free — the whole point of the 051/052 discipline. Shipping calm-ink verbatim would leave
   the typing text a fixed cool lavender under Nachtploeg/Snoepfabriek/Diepzee, breaking the
   theme-parity invariant this milestone guarantees. Building it *correctly* (re-derived from a
   themed token) is net-new design work, not a spec-gap fill — it would need the designer, not a
   developer, and would need its own token justified against 052.

3. **On the calm goal (ADR 011) the recolor is ambiguous at best, and arguably anti-calm.**
   The question posed — is mint-on-done an arousal/reward signal the calm view should soften? —
   resolves against softening. Mint-on-done is a mild, **non-ambient, per-keystroke** progress
   cue (a discrete event, exactly the motion class §4 keeps), not the ambient distraction ADR
   011 names. The distraction the Shareholder complained about — the animated `FactoryFloor`
   strip, the meters block, the shop rail — is already removed by 072/073. Milestone §4's
   preserved-value clause explicitly commits to *retaining* a live earn signal so the calm view
   is not a *dead* view; the green marching-done text is one such gentle liveness cue. Dimming
   it trades a real liveness signal for a marginal, hard-to-perceive calm gain. WCAG is not a
   forcing function either way (067's tester measured `--calm-ink` at 9.68:1 / 11.26:1, clear
   AA), so accessibility does not decide this — the design/theme discipline and the calm merits
   do, and both favour reuse.

4. **Scope discipline this late in the milestone.** 073 is live, building "typing card
   unchanged." Adding a theme-breaking, self-contradicted recolor onto an actively-touched
   surface for a marginal benefit is exactly the over-build the charter's "scope down hard" and
   §5's cut-line guard against. Revisable later: if a future playtest (076) shows the mint
   done-state actually reads as too loud on the calmed surface, a designer can re-derive a
   *themed* low-arousal token then — a cheap, well-scoped follow-up on evidence, not a
   speculative recolor now.

**073 is unaffected:** its AC ("typing card unchanged") is now precisely what both design docs
promise. The contradiction is resolved by making the docs agree with 073, not the reverse — so
the live 073 lane's work stays valid with no edit to its file. No `--calm-ink` is added to
`:root`; no `.tchar` rule changes.
