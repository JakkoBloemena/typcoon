---
id: 102
title: "\"ALLEEN VANDAAG\" (today only) badge on the €14,99 unlock offer never expires — live, unconditional false urgency, contradicting ADR 002 §3"
owner: developer
status: open
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

- [ ] The "ALLEEN VANDAAG" (`unlock.today`) badge never renders while real payments
      remain deferred (i.e., while `completePurchase()` stays the local-flag
      placeholder) — either remove the badge/urgency framing entirely until real
      payments exist, or gate it behind a genuine, real check (e.g. only after the
      30-day-post-launch condition ADR 002 §3 names, with an actual expiring offer
      window persisted and enforced, not just displayed).
- [ ] Whatever replaces it makes no time-limited claim that isn't backed by a real,
      enforced expiry — no copy implying scarcity/urgency that the app cannot actually
      make true (same bar ADR 002 §3 already set and assignment 007 already enforced
      for the anchor price).
- [ ] `€14,99` vs `€19,99` (offer vs. now pricing) may still differ if desired, but the
      "only today"/expiring-claim framing specifically is what must go (or become real).
- [ ] Verified live (not just in the diff): trigger the chapter-1 paywall in the running
      app twice in separate sessions (e.g. two separate `localStorage` states) and
      confirm the offer screen no longer makes an urgency claim it can't back up.
- [ ] `npm test` stays green; no change to `store.js` save shape, `economy.js` data,
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
