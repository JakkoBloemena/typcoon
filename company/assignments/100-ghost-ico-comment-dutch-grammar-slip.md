---
id: 100
title: Dutch grammar slips in the new .ghost .ghost-ico comment clause (from 099)
owner: developer
status: open
priority: 4
blocked_by: []
opened_by: tester (found during 099 verification)
---

## Goal

099 rewrote the stale Dutch comment above `.ghost .ghost-ico` in `src/game/game.css`
to describe the post-092 `brightness(0) invert(1)` filter. The new clause is
substantively correct (accurately describes the filter mechanics, correctly cites
des092/DESIGN-FACTORY.md §W2b, doesn't overclaim — "alle vier thema's" is accurate,
there are exactly 4 entries in `THEMES` in `src/game/theme.js`) and comment-only, so
099 passes on its own acceptance criteria. But the new sentence has two real Dutch
grammar slips worth a follow-up polish pass, since this file otherwise holds itself
to native-quality Dutch (the retained first clause, and the rest of the file, are
grammatically clean).

Current text (`src/game/game.css`, directly above `.ghost .ghost-ico`, lines
687-693):

```css
/* geen extra opacity hier: de idle-variant van Machine is al gedempt (0.42, gebakken
   in de svg zelf) — een tweede opacity-laag erbovenop maakte het icoon vrijwel
   onzichtbaar tegen de gearceerde achtergrond; brightness(0) plat alle gevulde
   pixels naar zwart, invert(1) klapt dat om naar wit, zodat de silhouet leesbaar
   blijft tegen de donkere vloer in alle vier thema's — grayscale(1) alleen hield
   het icoon donker en dus onzichtbaar (designer-uitspraak des092, zie 092 /
   DESIGN-FACTORY.md §W2b). */
.ghost .ghost-ico { width: 48px; height: 42px; filter: brightness(0) invert(1); }
```

**Issue 1 — missing/wrong verb.** "brightness(0) plat alle gevulde pixels naar
zwart" uses "plat" (the adjective "flat") where a conjugated verb belongs — as
written the clause has no verb and doesn't parse as a sentence. "Plat" is not a
Dutch verb form; the intended verb is likely "pletten" (→ "plet") or the separable
"platdrukken"/"platmaken" (→ "drukt … plat" / "maakt … plat"). E.g.: "brightness(0)
drukt alle gevulde pixels plat naar zwart" or "brightness(0) plet alle gevulde
pixels naar zwart".

**Issue 2 — wrong article gender.** "zodat de silhouet leesbaar blijft" — "silhouet"
is a neuter (het-word) noun in standard Dutch (Van Dale: "het silhouet"), not a
de-word. Should read "zodat het silhouet leesbaar blijft".

Both are minor, comment-only, non-user-facing (no test checks source-comment Dutch
— `check-no-dutch-en` only checks built `public/**` output for stray English, not
code-comment grammar) — hence priority 4. Filed as a follow-up rather than bouncing
099, since 099's actual acceptance criteria (accurate content, comment-only diff,
green tests) are unaffected and already verified independently.

## Acceptance criteria

- [ ] `src/game/game.css`'s comment above `.ghost .ghost-ico` reads as grammatically
      correct Dutch: the "plat" clause has a proper conjugated verb (e.g. "plet" or
      "drukt … plat"/"maakt … plat"), and "silhouet" takes "het", not "de".
- [ ] No change to the technical content/attribution (still describes
      `brightness(0) invert(1)`, still cites des092 / 092 / DESIGN-FACTORY.md §W2b) —
      pure grammar fix, same substance.
- [ ] No functional/CSS-value change — comment-only edit, `.ghost .ghost-ico`
      declaration byte-identical.
- [ ] `npm test` stays green (266/266 + check-no-dutch-en).
