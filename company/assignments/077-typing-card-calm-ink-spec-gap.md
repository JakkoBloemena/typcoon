---
id: 077
title: Typing-card recolor ("done=dim / upcoming=calm-ink") is specified but no assignment builds it
owner: product-owner
status: in_progress
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

- [ ] PO decides: either (a) explicitly cut the done=dim/upcoming=calm-ink recolor from
      scope (update `research/milestone-factory.md` §1a and 073's text to say the char
      states are reused as-is, dropping the "calm-ink" line so the docs stop promising a
      change that won't happen), or (b) add an explicit AC to 073 (or a follow-up) to
      introduce `--calm-ink` in `game.css` `:root` and apply it + a "dim" done-state to
      `.tchar`/`.tchar.done` per the design doc.
- [ ] Whichever is chosen, `design/DESIGN-FACTORY.md`/`research/milestone-factory.md` and
      073's acceptance criteria agree with each other and with what actually gets built.

## Notes

Found during independent verification of assignment 068. Not a blocker for 068's own four
acceptance criteria (scope-doc completeness, save-compat, goals system, playtest gate),
which all pass independently of this. Scope: `research/milestone-factory.md` §1a,
`design/DESIGN-FACTORY.md` §5a/§7, `company/assignments/073-calm-typing-view.md`.
