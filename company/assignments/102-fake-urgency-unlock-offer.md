---
id: 102
title: "\"ALLEEN VANDAAG\" (today only) badge on the €14,99 unlock offer never expires — live, unconditional false urgency, contradicting ADR 002 §3"
owner: developer
status: needs_verification
priority: 1
blocked_by: []
opened_by: tester (t076, playtest-critique gate, verified live in the running product)
---

## Goal

Reproduced live in the built app (`npx vite preview`, Playwright, desktop 1360px), not
just read in the diff: play a fresh kid session, type real exercises until the free
letter cap (10 letters) is crossed. The very first time this happens, the "Hoofdstuk 1
voltooid!" celebration card fires (`src/game/GameScreen.jsx`, the `moment.kind ===
'paywall'` branch) with a CTA "Bekijk de volledige fabriek", which calls
`setUnlockOffer('offer')`. That renders `Unlock.jsx` with `offer={true}`, and the buy
screen shows:

```
€14,99
ALLEEN VANDAAG
Eenmalig · geen abonnement · geen advertenties · geen aankopen voor je kind
Ontgrendel voor €14,99
```

Screenshot: `company/assignments/076-screenshots/32-unlock-buy-offer-screen.png`
(and the preceding chapter card: `076-screenshots/30-paywall-chapter-card.png`).

**Why this is a real defect, not a design nit:** `company/decisions/002-payments-
deferral.md` §3 explicitly rules on this exact discount: *"The €14,99 first-session
offer may only start ~30 days after real payments launch and must genuinely expire."*
Per the same ADR §4 and its own consequences, **real payments have not launched** —
`completePurchase()` in `src/game/premium.js` is still a local flag-flip placeholder
("de rest van de app gedraagt zich alsof de betaling geslaagd is"), confirmed current
by decisions/002's still-standing "silent free unlock" ruling. Yet the "ALLEEN VANDAAG"
badge (`Unlock.jsx` line 82, `gt('unlock.today')`) renders unconditionally, every single
time `offer=true` is passed — there is no date check, no session/first-time gate, no
expiry of any kind (`offer` is just a boolean prop threaded from the `moment.kind ===
'paywall'` CTA in GameScreen.jsx and the `premium.chapterTitle` overlay). A parent who
declines today and returns next week (or next session) sees the exact same "only today"
badge on the exact same €14,99 price — the claim is false on its face and would be false
again on every future viewing. This is precisely the "nepkorting" (fake-discount)
pattern the team already caught and fixed once for the struck-through €29,99 anchor
price (ADR 002 §3, assignment 007) — the same principle applies here and was not
carried through to the "only today" framing on the offer price.

This is also exactly the class of finding the playtest-critique gate exists to catch
per ADR-011/013's mandate: "no pressure, no countdowns, no dark patterns" is a named
guardrail this milestone gate must verify in the running product, and it fails here.

## Acceptance criteria

- [x] The "ALLEEN VANDAAG" (`unlock.today`) badge never renders while real payments
      remain deferred (i.e., while `completePurchase()` stays the local-flag
      placeholder) — either remove the badge/urgency framing entirely until real
      payments exist, or gate it behind a genuine, real check (e.g. only after the
      30-day-post-launch condition ADR 002 §3 names, with an actual expiring offer
      window persisted and enforced, not just displayed).
- [x] Whatever replaces it makes no time-limited claim that isn't backed by a real,
      enforced expiry — no copy implying scarcity/urgency that the app cannot actually
      make true (same bar ADR 002 §3 already set and assignment 007 already enforced
      for the anchor price).
- [x] `€14,99` vs `€19,99` (offer vs. now pricing) may still differ if desired, but the
      "only today"/expiring-claim framing specifically is what must go (or become real).
- [x] Verified live (not just in the diff): trigger the chapter-1 paywall in the running
      app twice in separate sessions (e.g. two separate `localStorage` states) and
      confirm the offer screen no longer makes an urgency claim it can't back up.
- [x] `npm test` stays green; no change to `store.js` save shape, `economy.js` data,
      engine state, or `theme.js` (this is copy/gating in `Unlock.jsx`/`premium.js`
      only).

## Notes

Spec citation: `company/decisions/002-payments-deferral.md` §3, §4. Code:
`src/game/Unlock.jsx` lines 48, 82 (`unlock.today` badge); `src/game/premium.js`
lines 25, 31-36 (`PRICE.offer`, `completePurchase` placeholder); the trigger path is
`src/game/GameScreen.jsx`'s `moment.kind === 'paywall'` card → `setUnlockOffer('offer')`
(the always-visible `🔓 Ontgrendel` pill uses `setUnlockOffer('plain')` instead — the
`€19,99` no-badge variant — so this specific defect is reached via the chapter-1
completion celebration, not the header pill). Repro path used: fresh save → onboarding
→ type ~40-60 exercises until `applyFreeCapGuard` fires the paywall (see
`src/game/premium.js`) → click "Bekijk de volledige fabriek" → solve the parent math
gate → screenshot the buy screen.

## Delivery notes (developer, dev/102, 2026-07-24)

**Change:** removed the unconditional `{offer && <span className="price-tag">{gt('unlock.today')}</span>}`
badge render from `src/game/Unlock.jsx` (the price row now just shows `€{price}`,
nothing else). Chose **removal**, not gating, per direction: ADR 002 §3 only permits the
"only today" claim to *start* ~30 days after real payments launch, and real payments
don't exist yet (`completePurchase()` in `premium.js` is still the local flag-flip
placeholder) — building a real expiry-window system now would be speculative work for a
condition (a live "offer window") that can't occur yet. Deleted the now-unused
`unlock.today` key from both the `nl` and `en` maps in `src/game/strings.js` (prefer
deletion over dead weight, matching how the anchor-price fix — assignment 007 — handled
its own now-unused pieces). `test/locale.test.js` needed **no change**: its key-set
parity test (`localeKeys('nl')` vs `localeKeys('en')`) is a set comparison, not an
enumeration, and `unlock.today` was never in `STATIC_FLOW_KEYS`. Added a short comment
in `premium.js` next to `PRICE.offer` recording why the badge is gone and what has to be
true (a real, enforced expiry, per ADR 002 §3) before any urgency framing returns. Left
`€14,99` (offer) vs `€19,99` (now) as-is — AC3 explicitly allows the price difference
itself to stay, only the "only today"/expiring-claim framing had to go.

**Judgment call — does the offer framing still read honest without "today only"?** Yes.
With the badge gone, the offer screen is just a price (`€14,99`) with the standard trust
line ("Eenmalig · geen abonnement · geen advertenties · geen aankopen voor je kind") and
no scarcity/urgency copy anywhere — nothing implies the price will change or the offer
will disappear. The `€14,99` (paywall-celebration entry) vs `€19,99` (header-pill entry)
difference is now just "the number differs by which door you came in," not a "hurry or
you'll pay more" claim — no unenforceable promise is being made. Flagging for the tester
in case the two-price-without-explanation framing itself reads as odd, but it makes no
false claim and AC3 names it as acceptable.

**Judgment call — dead CSS:** `.price-tag` in `src/game/game.css` (line 939) is now
unused (only consumer was the removed span). Left it in place: `game.css` is outside this
assignment's hard scope (only `Unlock.jsx`, `premium.js`, and `unlock.*` string keys were
authorized, to stay safe alongside other lanes live on other sections this tick). Not
opening a new assignment for this — it's a one-line, zero-risk dead-CSS cleanup, not
worth a board entry; noting it here for whoever next touches `game.css`.

**Live two-session verification (AC4), against `npx vite preview --port 4275`:** built
scratch QA scripts (not shipped, `qa-scripts/102-*.mjs`, same convention as the existing
`gen-exam-save.mjs`/`near-ready` fixture pattern already in this repo):
- `qa-scripts/102-gen-nearcap-save.mjs` — seeds a save via the **real engine functions**
  (`newProfile`, `newState`, `gatingKeys`) at `curriculumIndex: 5` (9 active letters: f j
  d k s l a g h) with every gating key's confidence/reps pre-drilled to mastery. This is
  the same "near-ready" technique `gen-exam-save.mjs` already uses for exam-1 — the state
  is only as fake as "a lot of practice happened"; the actual promotion, paywall trigger,
  and offer screen are all genuine live app behavior, not mocked. This avoids replaying
  ~40-60 real exercises through Playwright to reach the same defect trigger.
- `qa-scripts/102-verify.mjs` — for each of TWO independent sessions (`localStorage.clear()`
  + fresh seed each time, run back-to-back in the same script, i.e. two separate
  "sessions" per AC4's own framing): loads `/speel/`, seeds the save, clicks "▶ Verder
  bouwen", reads the live-generated exercise text straight off the DOM and types it for
  real (`page.keyboard.type`), which completes a genuine exercise → `finalizeExercise` →
  `tryPromote` → crosses `FREE_LETTER_CAP` (10) live → `applyFreeCapGuard` fires the
  chapter-1 paywall card for real → clicks "Bekijk de volledige fabriek" → reads the real
  parent math-gate question off the DOM, computes and types the real answer → lands on
  the buy screen.
  - **Session A:** paywall card appeared (`Hoofdstuk 1 voltooid!`), offer screen showed
    `€14,99`, `.price-tag` count `0`, no "alleen vandaag"/"today only" text anywhere in
    the card. Screenshots: `company/assignments/102-screenshots/a-00-typing-view.png`,
    `a-01-paywall-card.png`, `a-02-parent-gate.png`, `a-03-offer-screen.png`.
  - **Session B** (independent localStorage state, same script run immediately after,
    i.e. a "returning later" repeat viewing): identical result — `€14,99`, `.price-tag`
    count `0`, no urgency text. Screenshots: `b-00` through `b-03-offer-screen.png`.
  - Console errors in both sessions were only repeated `404` on `/api/track` (no backend
    mounted under plain `vite preview`, unrelated to this change — confirmed present on
    a fresh `/speel/` load with zero interaction too).
- `qa-scripts/102-plain-verify.mjs` — confirms the **'plain' variant is unaffected**:
  real onboarding flow (name → "Laat maar zien!" → "Ik voel de bultjes!" → typed home-row
  practice → "Ik ben er klaar voor!" → dismissed the daily-welcome overlay), then clicked
  the always-visible header "🔓 Ontgrendel" pill (`setUnlockOffer('plain')`, `offer=false`)
  → solved the real parent gate → offer screen showed `€19,99`, `.price-tag` count `0`
  (never had the badge to begin with — `offer` prop is falsy on this path). Screenshots:
  `plain-00-after-onboarding.png`, `plain-01-unlock-plain-gate.png`,
  `plain-02-offer-screen.png`.

**AC5 — tests:** `npm test` → **266/266 passing**, matching the stated baseline,
including `check-no-dutch-en`. No changes to `store.js`, `economy.js`, engine, or
`theme.js` — diff is scoped to `Unlock.jsx`, `premium.js`, and the `unlock.*` keys in
`strings.js` only. `public/**` build churn from both the verification build and the
`npm test` build step was reverted (`git checkout -- public/`) before committing;
`package.json`/`package-lock.json` were diff-clean after `npm ci`.

**Assignment 110 (pre-allocated for a new defect):** not used — no new defect was found
during this work. It lapses.
