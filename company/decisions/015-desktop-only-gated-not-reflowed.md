# ADR 015 — Desktop-only means gated, not reflowed: a width floor for the game surfaces

- **Date:** 2026-07-24 (product-owner adjudication of assignment 106, tick #39 intake).
- **Type:** Product-owner presentation/IA ruling. Interprets and applies **ADR 012
  ruling 3** ("keyboard-first, desktop/laptop only; who ordered mobile? nobody") to the
  operational question of *what the game does at narrow widths*. Does **not** amend
  ADR 012 (that is the Shareholder's) — it resolves how the ruling lands in code, and
  resolves a standing tension between two prior tester rulings. Same authority and shape
  as ADR 014 (which applied ADR 012 ruling 1 to the typing-view pills).
- **Decided by:** product-owner (scope authority for presentation/IA within the factory
  milestone; ADR 013 removed the Shareholder gate for such calls). No CEO escalation —
  this is inside the milestone mandate and touches no guardrail.

## Context — the tension this resolves

Two prior tester rulings on the same class of finding contradict each other:

- **v092 declined to file a 390px diorama overlap**, citing ADR 012 ruling 3 ("no mobile
  target"). The 076 critique's own "Mobile note" agrees: mobile "is expected and
  consistent with the explicit product decision, not a regression to fix."
- **v089 filed the same overlap as assignment 106 at priority 2**, reasoning that 390px
  is a mainstream phone width and "the core factory/progress screen is visually broken"
  for a target user who "plausibly plays or checks in on a phone or tablet."

Both cannot stand. The resolving fact, established by reading the code this tick:

- The app's device gate is `touchOnly()` in `src/game/App.jsx` (~ln 39–43):
  `matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches`.
  It fires on **touch-only devices** (phones), which see a friendly "use a keyboard" hint
  and never reach the game surfaces. **A real iPhone never sees the broken diorama** — the
  390px overlap the testers reproduced is reachable only by setting a narrow viewport width
  in Playwright *without* emulating a coarse pointer, i.e. by bypassing the gate.
- The gate keys on **pointer type, not viewport width.** So a legitimate target user — a
  desktop/laptop with a mouse (`pointer: fine`) and a physical keyboard — with a **narrow
  browser window** passes the gate and reaches the same broken diorama. v104 independently
  reproduced this exact path for the `.ticket` (BOUWBON) layout, which squeezes to one word
  per line at 375px: *"a real desktop/laptop user with a narrow browser window (not a touch
  device) reaches this exact broken layout — it is not fully screened out by the existing
  gate."*

So "narrow viewport" is **two different questions** that the single 106 filing conflated:
1. **A touch device (phone/tablet without a keyboard)** — out of the product target
   (ADR 012 ruling 3) *and already gated out*. Not a bug; not built.
2. **A keyboard user with a narrow desktop window** — in-target (has a keyboard), *not*
   gated, currently sees a broken layout. A real, if minority, defect.

## Decision

**1. Mobile / touch-device layouts for the game surfaces are OUT of target, and the
existing `touchOnly()` gate is the correct enforcement.** ADR 012 ruling 3 stands
verbatim: the game requires a physical keyboard; no mobile or reflow layouts are built for
the diorama or any game surface. v092's instinct was right. The 390px overlap is not a
defect to fix by building a responsive diorama — doing so would directly contradict the
Shareholder's ruling. (Marketing pages remain responsive, per ADR 012 — this ADR is about
*game* surfaces only.)

**2. "Desktop-only" is enforced by GATING, never by REFLOWING.** The honest gap ADR 012
left open is that the gate keys on pointer type, not width, so a keyboard user with a
too-narrow window falls through it into a layout that was only ever designed for
≥1024px / 1360px. The fix is to **complete the gate**, not to build the mobile layout the
ADR forbids: below the desktop design floor, the game surfaces show the *same calm,
friendly hint* idiom the touch gate already uses — a "make your window a little wider to
play" invitation — instead of a broken diorama or a squeezed ticket. We told the target
user the truth (this is a keyboard, desktop-width experience); the gate simply enforces
what we said. This is completing ADR 012's decision, not overriding it.

**3. Standing rule for the loop (so this is not re-litigated every tick):** a narrow-
viewport or small-screen finding on a game surface is **not** a layout-reflow defect. It
is handled one of two ways and no other:
- a **touch device** → already gated; not a bug;
- a **too-narrow desktop window** → covered by the width floor (assignment 106); the fix
  is always the friendly gate, never a responsive/mobile layout for a game surface.
A future tester who reproduces "the factory looks broken at width X" checks this ADR first:
if the reproduction bypassed the touch gate or used a narrow desktop window, the answer is
the width floor, not a reflow. This mirrors ADR 014's "apply this before adding any future
pill" standing rule.

## Consequences

- **Assignment 106 is re-scoped in place** from "diorama overlaps at common *mobile*
  widths (priority 2)" to "narrow-desktop-window graceful degradation: add a width floor to
  the `touchOnly()` gate (priority 3)." Priority drops from 2 to 3 because the load-bearing
  part of the original priority-2 reasoning — "390px is a mainstream *phone* width for a
  user who plays on a phone" — is removed by this ruling: phones are out of target and
  already gated, so the remaining in-scope harm is a narrow *desktop window*, a much
  smaller population of in-target users. It is a real degradation, cheaply fixed the honest
  way, but not a mainstream-flow break. Full re-scope and acceptance criteria live in
  `company/assignments/106-*.md`.
- **v104's `.ticket` narrow-viewport squeeze folds into re-scoped 106** — same root cause
  (a game surface with no width floor), same fix (the gate). It does not get its own id.
- The `touchOnly()` gate, the touch hint copy (`desktop.title`/`desktop.body`), and the
  `(pointer: fine)` desktop path are otherwise unchanged.
- **No mobile/responsive work is authorised for any game surface.** Assignment 075's mobile
  half stays cancelled (ADR 012); this ADR closes the door on re-opening it via bug filings.
