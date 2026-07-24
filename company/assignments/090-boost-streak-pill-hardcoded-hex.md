---
id: 090
title: .boost-chip / .streak-pill use raw hex colours, not theme tokens
owner: developer
status: done
priority: 4
blocked_by: []
opened_by: developer (proposed during 083)
---

## Goal

`src/game/game.css`'s `.streak-pill` and `.boost-chip` rules (the 🔥 streak count and
the "Opwarm-boost" daily-warmup chip, both on the typing view's `.wallet`) use raw
hardcoded hex/rgba colours instead of `var(--token)`/`color-mix(...)`:

```css
.streak-pill {
  color: #5a2a00; background: linear-gradient(180deg, #ffd0a0, #ff9f43);
  box-shadow: 0 4px 0 #b5651d;
}
.boost-chip {
  color: #5a2a00; background: linear-gradient(180deg, #ffd0a0, #ff9f43);
  box-shadow: 0 4px 0 #b5651d, 0 0 20px rgba(255, 159, 67, 0.4);
}
```

These predate the theme system (assignment 052) and were never migrated. Per
`design/DESIGN-FACTORY.md` §W6, a `[data-theme]` swap is supposed to recolour the
*entire* diorama for free — these two elements are the one place left that stays a
fixed warm-orange regardless of the active theme (confirmed via `qa-scripts/
contrast-052.mjs`'s scope, which does not cover these two selectors). Discovered while
fixing `.boost-chip`'s animation for assignment 083 (typing-strip earnings-first) —
left untouched there to stay in scope for that slice.

## Acceptance criteria

- [x] `.streak-pill` and `.boost-chip` use only `var(--token)` (or `color-mix(in srgb,
      var(--token) N%, transparent)`) colours — no raw hex/rgba, except the acceptable
      case of a genuinely themable warm/flame token if one already exists (e.g.
      `--flame`) or a documented reason none fits.
- [x] Visually equivalent (or better) under the default Muntpers theme — a screenshot
      diff shows no unintended visual regression.
- [x] Re-tints correctly under at least one non-default `[data-theme]` (verify with
      `qa-scripts/contrast-052.mjs` or an equivalent WCAG check if the token choice
      changes contrast).
- [x] `npm test` stays green.

## Notes

Zero new `:root` tokens unless the designer determines one is genuinely missing — if
so, stop and open a design-system assignment instead of improvising a value (per
`framework/PROTOCOL.md`'s "design system before feature work" rule). Cosmetic-only;
not blocking any other in-flight assignment.

## Delivery notes (developer, dev/090, 2026-07-24)

**Token mapping** (old hex → new token expression, both rules):

| Declaration | Old | New |
|---|---|---|
| `color` | `#5a2a00` | `var(--on-accent)` |
| `background` gradient, light stop | `#ffd0a0` | `var(--brass-hi)` |
| `background` gradient, dark stop | `#ff9f43` | `var(--brass)` (kept `.unlock-pill`'s `55%` stop position) |
| `box-shadow` hard edge | `#b5651d` | `var(--brass-deep)` |
| `.boost-chip` outer glow | `rgba(255, 159, 67, 0.4)` (= `#ff9f43` @ 40%, i.e. the same colour as the dark gradient stop) | `color-mix(in srgb, var(--brass) 40%, transparent)` |

Chose `--brass`/`--brass-hi`/`--brass-deep`/`--on-accent` over `--flame` (the assignment's
suggested example). Two reasons: (1) `--flame` is documented and used in this file
exclusively as an error/alarm semantic (`.tchar.current.err`, `.friends-msg.bad`,
`.acc-err`, `.link-reset:hover`) and the `.offline` banner's comment (line ~850)
explicitly rules it out for anything non-alarming in this kids' product ("Nooit --flame
(fout/heet) — dit is een kinderproduct, niets mag hier alarmerend lezen") — a positive
gamification element (streak count, warm-up boost) would misuse that contract; (2)
`.unlock-pill`/`.premium-cta` already implement the *exact* pill idiom being migrated
here — pill shape, `var(--on-accent)` ink, `linear-gradient(180deg, var(--brass-hi),
var(--brass) 55%)` fill, `box-shadow: 0 Npx 0 var(--brass-deep)` hard edge — so reusing
it is both a closer visual match to the original bespoke orange and consistent with
"match the codebase" (no new idiom introduced). `--on-accent`'s own `:root` comment
literally reads "inkt op --brass" (ink on brass), which is precisely this pair's job.
The `color-mix` glow percentage (40%) was carried over directly from the original
`rgba(..., 0.4)` alpha, since the rgba's RGB channel was already identical to the dark
gradient stop.

**Files touched:** `src/game/game.css` (only the `.streak-pill`/`.boost-chip` rule
bodies + one added comment line above them — no other line in the file changed, verified
via `git diff`). No changes to `store.js`, `economy.js`, `src/engine/`, `theme.js`,
`goals.js`, or any other game.css rule (checked the diff doesn't touch `.emptyline`/
`.sk`/`.offline`/shimmer, `.ghost .ghost-ico`, or `.floor`).

**Evidence:**
- Screenshots (`company/assignments/090-*.png`), captured via `qa-scripts/090-screenshot.mjs`
  against a real `vite build` + `vite preview --port 4266 --strictPort` (not drawn), with a
  save that has `streak: 5` (daily.js recomputes it to 1 on load with `lastDay: null`,
  which is fine — same behaviour before and after) and `boostLeft: 8` so both elements
  render together in the typing view's wallet:
  - `090-before-full.png` / `090-before-wallet.png` — default Muntpers, pre-fix (orange
    peach→amber gradient, unaffected by theme).
  - `090-before-{snoepfabriek,nachtploeg}-full.png` — same pre-fix orange chip/pill under
    two alternate themes, confirming the bug (stuck orange regardless of `[data-theme]`).
  - `090-after-full.png` / `090-after-wallet.png` — default Muntpers, post-fix: visually
    equivalent warm-orange/amber pill (now sharing the coin-pill's brass material, which
    reads as *more* consistent with the rest of the "one loud voice = brass" theme, not
    less).
  - `090-after-{snoepfabriek,nachtploeg,diepzee}-full.png` — post-fix: pill/chip now
    correctly re-tint to each theme's `--brass` family (pink in Snoepfabriek, violet in
    Nachtploeg, coral in Diepzee), same as every other brass-accented surface.
- Contrast: `node qa-scripts/contrast-052.mjs` — ALL CHECKS PASS across all four themes.
  The relevant rows (identical token pair to the migrated rules) are "on-accent ink on
  brass (button label)" (7.83/7.26/5.42/7.10 : 1 for muntpers/nachtploeg/snoepfabriek/
  diepzee) and "on-accent ink on brass-hi (button top)" (9.39/10.82/8.04/9.64 : 1) — all
  comfortably above the 4.5:1 AA text threshold. No new qa script was needed since this
  exact token pair was already covered.
- `npm test`: 266/266 pass, including `check-no-dutch-en` (`gen-content` + `vite build`
  + the Dutch-lexicon leak check all green).

**Judgment calls:**
- Read "genuinely themable warm/flame token if one already exists (e.g. `--flame`)" as
  an example, not a mandate — picked `--brass` instead for the semantic/contrast/idiom
  reasons above. If the designer disagrees, this is a one-line token swap (the structure
  — `--X-hi`/`--X`/`--X-deep`/`--on-accent` — is identical either way).
- Kept the `55%` gradient stop on `var(--brass)` to match `.unlock-pill`'s existing
  pattern exactly, even though the original `.streak-pill`/`.boost-chip` gradient had no
  explicit stop percentage (defaulted to 100%). Visually negligible (screenshots show no
  banding difference) and keeps the two idioms byte-identical for future maintainers.
- Left `src/game/shareCard.js`'s `STREAK_TEXT`/`STREAK_HI`/`STREAK_LO`/`STREAK_SHADOW`
  hardcoded hex constants untouched — out of this assignment's scope (game.css only) and
  explicitly documented there as a canvas-can't-read-CSS-vars mirror of the *old*
  `.streak-pill` values. They're now stale relative to the live pill's new brass tokens;
  filed as company/assignments/095 (proposed, not consumed by fixing here).

**Ports/cleanup:** `vite preview` ran on port 4266 (`--strictPort`) for both before/after
screenshot passes; each server was killed by PID via `netstat -ano` immediately after
capture and port-free was confirmed both times. `public/**` build churn from `npm test`
/`npm run build` was reverted via `git checkout -- public/` before staging this commit.
`playwright-core` was installed via `npm install playwright-core --no-save`;
`package.json`/`package-lock.json` are diff-clean.

## Verification (tester, v090, 2026-07-24)

Verdict: **met — status: done.**

**AC1 (token discipline).** Read `git show 4da665b -- src/game/game.css` directly rather
than trusting the delivery-notes table. The full diff touches exactly two rule bodies
(`.streak-pill`, `.boost-chip`) plus one new comment above them; both rule bodies now
contain only `var(--on-accent)`, `var(--brass-hi)`, `var(--brass)`, `var(--brass-deep)`,
and `color-mix(in srgb, var(--brass) 40%, transparent)` — scanned the two rules
character-by-character for `#`/`rgb`/`rgba` and found none. `git diff` on `:root` and every
`[data-theme=...]` block is untouched (confirmed via `grep -c "^\s*--" ` before/after and a
visual read of lines 15-145) — zero new tokens added, satisfying the Notes' "zero new
`:root` tokens" rule and W6.

**AC2 (visual equivalence, default theme).** Independent build+serve, not the dev's
server: `npx vite build` then `npx vite preview --port 4269 --strictPort` (reserved lane
port). Wrote my own probe (`qa-scripts/tester-090-probe.mjs`, not a copy of the dev's
`090-screenshot.mjs` — same seeding shape since that's the only way to get both elements
on screen, but written independently and extended to dump live `getComputedStyle()`
values, not just screenshots) against a save with `streak: 5`/`boostLeft: 8`. Computed
styles for `.streak-pill`/`.boost-chip` under default (no `data-theme` attr, i.e.
Muntpers/`:root`) resolved to `color: rgb(61,44,0)` (`--on-accent` = `#3d2c00`),
`background: linear-gradient(rgb(255,210,94), rgb(255,185,21) 55%)` (`--brass-hi` =
`#ffd25e` → `--brass` = `#ffb915`), `box-shadow` hard edge `rgb(198,127,0)`
(`--brass-deep` = `#c67f00`) — an exact token-value match, confirmed live in the DOM, not
by reading source. Screenshots (`company/assignments/tester-090-default-{wallet,full}.png`)
show both the 🔥 streak pill and the "Opwarm-boost ×1.5 — nog 5 opdrachten" chip rendering
with the same warm peach→amber gradient pill as the dev's `090-before-wallet.png` /
`090-after-wallet.png` — no visible regression, layout, sizing, or legibility change.

**AC3 (re-tint under alternate theme).** Ran `node qa-scripts/contrast-052.mjs` myself
(fresh `npm ci` + `npm install playwright-core --no-save` in this worktree first) — **ALL
CHECKS PASS** across all four themes, numbers matching the delivery notes exactly
(on-accent-on-brass: 7.83/7.26/5.42/7.10; on-accent-on-brass-hi: 9.39/10.82/8.04/9.64,
muntpers/nachtploeg/snoepfabriek/diepzee order). Beyond the computational check, drove the
actual browser under `data-theme=nachtploeg`: computed styles flipped to `color:
rgb(28,10,62)` (`--on-accent` nachtploeg = `#1c0a3e`), gradient
`rgb(211,190,255)→rgb(180,145,255)` (`--brass-hi`/`--brass` nachtploeg), edge
`rgb(106,63,206)` (`--brass-deep` nachtploeg) — both pill and chip visibly re-tinted to
violet in the screenshot (`tester-090-tester-nachtploeg-{wallet,full}.png`), fixing the
pre-fix "stuck orange" bug the assignment describes. Also spot-checked `.coin-pill`
(uses the same `--brass` family, out of this assignment's scope but a useful sanity
check) re-tinted identically — the coin *icon* glyph looked visually gold-ish in the
screenshot at a glance, which I initially misread as a re-tint miss, but its computed
background gradient confirmed violet (`rgb(211,190,255)`/`rgb(180,145,255)`); the icon
itself is a small fixed-color asset unrelated to the pill background, not a defect.

**AC4 (tests green).** `npm test`: **266/266 passing**, including
`check-no-dutch-en: PASS — 5 built en file(s) checked against 59 Dutch lexicon words,
zero unallowlisted hits.` — ran it myself in this worktree, not re-quoted from the dev.

**Judgment-call adjudication (brass vs. `--flame`): upheld.** Read the AC's "e.g.
`--flame`" as an example, same as the dev. Verified the two supporting claims against the
file directly rather than taking them on faith: (1) `--flame` is in fact used exclusively
for error/alarm semantics in this file — `.tchar.current.err`, `.link-reset:hover`,
`.friends-msg.bad`, `.acc-err`, and `.price-tag` (a "SALE"-style urgency badge) — and the
`.offline` banner's own comment (game.css:859-863) states in Dutch, verbatim, "Nooit
--flame (fout/heet) — dit is een kinderproduct, niets mag hier alarmerend lezen" ("never
--flame (error/hot) — this is a kids' product, nothing here should read as alarming"),
which is a real, pre-existing, documented constraint, not an invented one. A streak count
and a positive daily-warmup boost are reward/encouragement UI, not error/urgency UI, so
routing them through `--flame` would misuse that documented contract. (2) `.unlock-pill`
(game.css:892-899) and `.premium-cta`/`.plot .pnote` badge (game.css:668-671) already
implement the exact `--brass-hi`→`--brass` 55%/`--brass-deep`/`--on-accent` pill idiom
being reused here — confirmed by direct inspection, not the dev's say-so. Weighed against
`design/DESIGN-FACTORY.md` §W6 ("Zero new `:root` tokens... every colour is a
`var(--token)`... `color-mix` not raw `rgba()`"): W6 requires token discipline and
re-tinting, and is silent on *which* token family to use for a given semantic — it does
not mandate `--flame` for warmth. Brass satisfies W6's letter (zero new tokens, no raw
hex/rgba, `color-mix` for the glow) and its intent (full re-tint per `[data-theme]`) at
least as well as `--flame` would have, while `--flame` would have introduced a semantic
mismatch the file's own comments explicitly warn against. Adjudication: **brass-over-
flame stands**, no design escalation needed.

**Scope check (AC "touched nothing outside the two rule bodies").** `git show 4da665b`
confirms the only source-file change is `src/game/game.css`, and within it only the two
rule bodies + the new comment line changed — independently confirmed by reading the full
diff hunk myself: no touch to `.emptyline`, `.sk`, `.offline`, any shimmer/goldpulse
keyframe, `.ghost .ghost-ico`, or `.floor`. No changes to `store.js`, `economy.js`,
`src/engine/`, `theme.js`, or `goals.js`.

**No new defect filed under 098.** Nothing found here rises to a new bug — the one thing
that gave me pause (the coin-pill icon's apparent color mismatch in the nachtploeg
screenshot) was a visual misread on my part, not a real defect once checked against
computed styles. Assignment 095 (shareCard.js's stale `STREAK_*` hex constants) was
already filed by the developer and is not refiled here. Reserved id 098 is unused and
lapses.

**Environment notes.** Fresh worktree: `npm ci` (22 packages), `npm install
playwright-core --no-save` (package.json/package-lock.json confirmed diff-clean after).
Server ran on the reserved lane port 4269 (`--strictPort`), killed by PID via `netstat
-ano` immediately after both screenshot passes; port confirmed free afterward (only
`TIME_WAIT` residue, no `LISTENING` entry). `public/**` build churn from `npm test`/
`vite build` reverted via `git checkout -- public/` before staging. New files added by
this verification: `qa-scripts/tester-090-probe.mjs` (my independent probe script) and
`company/assignments/tester-090-{default,tester-nachtploeg}-{wallet,full}.png`
(screenshot evidence) — both committed alongside this note.
