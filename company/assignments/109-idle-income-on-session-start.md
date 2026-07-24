---
id: 109
title: GameScreen grants a burst of "idle" coins on every session start before the first keystroke — violates the "typing is the only faucet" guardrail
owner: developer
status: needs_verification
priority: 2
blocked_by: []
opened_by: tester (v103 lane, tick #39, found while verifying assignment 103's AC3
  "actual coin accrual per second unchanged" — unrelated to 103's fix, pre-existing)
---

## Goal

Reproduced live, twice, with two independent probes. Loading the play (typing) view
with a save that has a nonzero `coinsPerSecond(tycoon)` and then doing **nothing** —
zero keystrokes — for the first few seconds still mints roughly one real second's
worth of production coins into `tycoon.coins`, with no typing at all. This directly
contradicts the charter's guardrail #2 ("Never sell learning speed... no idle income.
Typing stays the only faucet...") and `economy.js`'s own header comment ("Machines...
ALLEEN produceren terwijl het kind actief typt. Geen idle/offline winst").

## Root cause (found by reading, not guessed)

`src/game/GameScreen.jsx`:

```js
const lastKeyRef = useRef(0);      // line 68
const lastTickRef = useRef(0);     // line 69
...
const ACTIVE_WINDOW_MS = 3500;     // line 36 — machines draaien alleen als er kort geleden getypt is
...
useEffect(() => {                  // line 128, the production-tick effect
  const id = setInterval(() => {
    const now = performance.now();
    const active = now - lastKeyRef.current < ACTIVE_WINDOW_MS;   // line 131
    const dt = lastTickRef.current ? (now - lastTickRef.current) / 1000 : 0;
    lastTickRef.current = now;
    if (!active || dt <= 0) return;
    setGame((e) => (e ? { ...e, tycoon: tick(e.tycoon, dt) } : e));
  }, 1000);
  return () => clearInterval(id);
}, [setGame]);
```

`lastKeyRef` is seeded to `0`, not to `performance.now()` at mount (and there is no
real keystroke yet to set it to a meaningful value — `handleKeystroke`, line ~147,
only sets `lastKeyRef.current = performance.now()` when an actual key event fires).
`performance.now()` measures time since the page's navigation start, not since some
per-component origin. So on the very first tick(s) after the play view mounts —
as long as that happens within `ACTIVE_WINDOW_MS` (3.5s) of the page's navigation
start, which is the ordinary case (a player who just loaded/reloaded the app and
clicked through to play within a few seconds) — `now - 0 = now < 3500` is spuriously
**true**, so `active` is true and a full production tick fires, even though the
player has not typed a single key. This is a one-time burst per page load (it does
not repeat indefinitely — see reproduction below): once real elapsed time since
navigation start passes 3.5s, `active` correctly goes false and stays false until a
real keystroke sets `lastKeyRef.current` properly.

## Reproduction

1. Build (`npx vite build`) and serve (`npx vite preview`) the app.
2. Inject a save via `localStorage['typcoon:save']` with a built factory that has
   nonzero `coinsPerSecond(tycoon)` (any level-2+ machine works; the higher the
   level, the more visible the leak — a fully-built save easily leaks 100,000+
   coins in one burst). Reload.
3. Click through to the play/typing view (`button.btn-big` "Verder"/"Doorgaan").
4. Do **not** type anything. Poll `JSON.parse(localStorage.getItem('typcoon:save')).
   tycoon.coins` every ~700ms for 6 seconds.
5. Observed (this tester, `qa-scripts/103-tester-idle.mjs` and
   `qa-scripts/103-tester-idle2.mjs`, save: `buildings: { typewriter:25, printer:10,
   robotarm:1, assembly:50 }`, `upgrades:['oil','turbo']`, `rebirths:2` →
   `coinsPerSecond` = 235116/s):

   ```
   t=1568ms  coins=1000
   t=2278ms  coins=1000
   t=2994ms  coins=234869.8851971972   <- idle burst, ~1s worth of full production
   t=3704ms  coins=234869.8851971972   <- flattens; no further growth while idle
   t=4414ms  coins=234869.8851971972
   t=5126ms  coins=234869.8851971972
   t=5831ms  coins=234869.8851971972
   t=6541ms  coins=234869.8851971972
   ```

   Reproduced twice (a second run with a similarly-shaped save and `lastDay` set to
   today, ruling out any interaction with the daily-return/streak-milestone bonus in
   `daily.js`, gave the same magnitude burst: 1000 → ~237,362). Not a fluke of one
   run.

## Acceptance criteria

- [x] `lastKeyRef` (or equivalent activity-tracking state) is seeded such that the
      production-tick effect's `active` check is **false** until the player's first
      real keystroke of the session — no tick should ever fire with zero prior
      keystrokes in the current session.
- [x] Reproduction above (idle for 6+ seconds immediately after entering the play
      view, zero keystrokes, save with nonzero `coinsPerSecond`) shows `tycoon.coins`
      completely unchanged throughout.
- [x] No regression to the legitimate behavior: production still ticks normally
      within `ACTIVE_WINDOW_MS` of a **real** keystroke (i.e. don't overcorrect into
      "never produces" — only the zero-keystroke spurious-active window at mount is
      the bug).
- [x] `npm test` stays green.

## Notes

- Not a regression from assignment 103 — `src/game/GameScreen.jsx` is untouched by
  103's commit `9d4a417` (`git diff 9d4a417^..9d4a417 -- src/game/GameScreen.jsx` is
  empty). This bug pre-dates 103 and was found only because AC3's live probe went
  looking at real coin accrual rather than trusting the diff alone.
- Priority 2, not 1: the core typing/production loop still works correctly once a
  real keystroke has landed, and the leak is bounded (one tick's worth, once per
  session-start-within-3.5s, not an ongoing drain) — the game is not "broken." But it
  is a real, silently-repeatable violation of a hard charter guardrail ("no idle
  income... the cheat is nutteloos van constructie") that fires on essentially every
  normal session for any player with a built factory, not an exotic edge case, so it
  is not cosmetic either.
- Repro scripts (kept for the developer's own before/after check):
  `qa-scripts/103-tester-idle.mjs`, `qa-scripts/103-tester-idle2.mjs`.

## Delivery notes — status: needs_verification

**Root cause confirmed exactly as reported.** `src/game/GameScreen.jsx`'s production-
tick effect gates on `active = now - lastKeyRef.current < ACTIVE_WINDOW_MS`, and
`lastKeyRef` was seeded to `0`, not to a value that guarantees "no real keystroke yet".
Since `performance.now()` measures time since the page's navigation start, any
production tick that fires while the app is still within the first `ACTIVE_WINDOW_MS`
(3500ms) of page load sees `now - 0 < 3500` as spuriously true — one full tick's worth
of production minted with zero keystrokes.

**Fix (`src/game/GameScreen.jsx`, one line + comment, nothing else touched):**
```diff
-  const lastKeyRef = useRef(0);
+  // -Infinity: nog geen aanslag deze sessie, dus "active" (regel ~131) moet ONWAAR
+  // zijn tot de eerste ECHTE toets — performance.now() meet vanaf navigation start,
+  // dus een seed van 0 maakte "active" per ongeluk WAAR bij elke sessie-start binnen
+  // ACTIVE_WINDOW_MS na het laden van de pagina (109, idle-income-guardrail-lek).
+  const lastKeyRef = useRef(-Infinity);
```
`-Infinity` makes `now - lastKeyRef.current` unconditionally `Infinity` until
`handleKeystroke` (line ~147) sets it to a real `performance.now()` on the first
actual keydown — so `active` is false at mount regardless of how close to navigation
start the play view mounts, with no dependency on `ACTIVE_WINDOW_MS`'s current value.
**Judgment call:** picked `-Infinity` over the assignment's other suggested option
(`-ACTIVE_WINDOW_MS`) because it expresses "no keystroke has ever happened this
session" directly rather than "assume a keystroke happened impossibly long ago" —
slightly more self-documenting and doesn't silently need updating if `ACTIVE_WINDOW_MS`
ever changes. `lastTickRef`'s existing first-tick `dt` guard (`lastTickRef.current ?
... : 0`) was left untouched — it already correctly no-ops the very first interval
tick after mount (when `lastTickRef.current` is still its initial `0`) independent of
`active`, and does not interact with this fix.

**Entry-test probes — tester's originals, run UNMODIFIED, before and after:**
- `qa-scripts/103-tester-idle.mjs` — **before fix:** `coins before idle wait: 1000` /
  `coins after 2.5s idle: 236797.83640840842` / `unchanged: false` (bug reproduced,
  same order of magnitude as the tester's own numbers). **After fix:** `coins before
  idle wait: 1000` / `coins after 2.5s idle: 1000` / `unchanged: true`.
- `qa-scripts/103-tester-idle2.mjs` — **before fix:** flat at 1000 for the first two
  samples then jumps to `235340.117...` at t≈2970ms and stays flat (identical shape to
  the tester's write-up). **After fix:** flat at `1000` across all 9 samples,
  t=1551ms .. t=7220ms.

**My own permanent probe:** `qa-scripts/109-dev-verify.mjs` (new, committed). Covers:
(a) zero keystrokes across 5.6s+ idle immediately after entering the play view →
coins never move (8 samples, all equal). (b) real `page.keyboard.press()` keystrokes
(window-level `keydown`, the same path `TypingSurface.jsx` listens on — fires
`onKeystroke`/`handleKeystroke` regardless of correct/incorrect) → coins visibly grow
while typing (1000 → 385273.59 across ~2.5s of keystrokes). (c) after the last
keystroke, production keeps ticking for a bit (still within `ACTIVE_WINDOW_MS`) then
flattens again — sampled every 800ms for 4.8s post-typing, last two samples equal.
Ran on the fixed build: **all 3 checks PASS.** Discriminating power double-checked:
temporarily `git stash`ed just the `GameScreen.jsx` fix, rebuilt, re-ran the same
probe — check (a) correctly **FAILED** (`coins never moved: false`, burst visible at
t≈2136ms, same shape as before), checks (b)/(c) still passed (typing/stop-typing
behavior is orthogonal to the mount-time seed bug) — then `git stash pop`ped and
rebuilt to restore the fix before committing.

**Test suite / build / lint:** `npm test` → **266/266** unit tests pass, `gen-
content.mjs` clean (22 URLs + sitemap), `vite build` clean (101 modules, no warnings),
`check-no-dutch-en.mjs` → PASS (5 built en files, 59-word lexicon, zero unallowlisted
hits). `npm test`'s `gen-content.mjs` step regenerated `public/**` (expected,
unrelated to this fix); reverted with `git checkout -- public/` before committing —
confirmed via `git status` that only `src/game/GameScreen.jsx` and the new
`qa-scripts/109-dev-verify.mjs` remain.

**Environment notes:** fresh worktree needed `npm install` (node_modules was
missing) and `npm install playwright-core --no-save` (not a project dependency;
installed test-only, `--no-save` confirmed via `git status` to leave `package.json`/
`package-lock.json` untouched). Served the built app via `npx vite preview --port
4288` (my reserved port per the dispatch) for all probe runs; server process killed
(`taskkill`) before finishing.

**Per-criterion status:**
1. `lastKeyRef` seeded so `active` is false until a real keystroke — **met**: see
   diff above.
2. 6+ second idle repro shows `tycoon.coins` unchanged — **met**: both tester probes
   and my own probe confirm, before/after.
3. No regression to legitimate active-typing production — **met**: probe (b)/(c)
   above; production accrues while typing and correctly stops again ~3.5s after the
   last keystroke.
4. `npm test` stays green — **met**: 266/266.

**Files touched:** `src/game/GameScreen.jsx` (the fix — one line + comment, nothing
else). New: `qa-scripts/109-dev-verify.mjs` (permanent probe, committed).

**Scope discipline:** no changes to `economy.js`, `store.js`, engine, save shape, or
the active-typing production path — confirmed via `git diff --stat` showing only the
one file, 5 insertions / 1 deletion.

**id 121 (reserved for new defects filed by this lane):** lapsed, unused — no new
defect found outside this assignment's scope during this work.
