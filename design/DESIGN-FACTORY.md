---
# DESIGN-FACTORY.md — machine-readable design tokens for the factory/typing split.
# Assignment 067 · authority decisions/011 · designer, 2026-07-24.
# These tokens ADD to src/game/game.css :root (they do not replace it). Every new
# token is DERIVED from an existing themed token via var(), so a [data-theme] swap
# (051/052) recolours the new surfaces for free — theme authors touch nothing here.
surface_split:
  typing_view: calm        # focused work surface, one goal sliver, zero ambient motion
  factory_page: exciting   # "Het Bouwplan" — a blueprint roadmap you fill in
selected_direction: C      # "Het Bouwplan" — chosen by pairwise comparison (see body)
new_tokens:
  spacing:                 # 4px base scale; replaces the ad-hoc px in game.css
    --s1: 4px
    --s2: 8px
    --s3: 12px
    --s4: 16px
    --s5: 24px
    --s6: 40px
  type_utility:            # THIRD type role: an LED/instrument readout for numbers
    --data: "ui-monospace,'Cascadia Mono','Roboto Mono','SF Mono',monospace"
    rule: "all coin counts, /s rates, levels, %, 'nog N' use var(--data) + font-variant-numeric:tabular-nums"
  semantic_roles:         # derived from themed tokens → themes cascade automatically
    --goal: "var(--mint)"        # progress toward a goal = 'production/good'
    --reward: "var(--brass)"     # coins earned = the one loud accent
    --calm-ink: "#c7d2f2"        # slightly-dimmed paper for the low-arousal typing surface
  motion:
    --dur-quick: 120ms      # calm surface transitions
    --dur-arrive: 380ms     # one spring (--pop) on a discrete arrival, then still
    rule: "typing view has ZERO ambient/idle animation; celebration motion only on discrete events (coin flash, station 'built')."
reused_tokens:            # unchanged, from src/game/game.css :root
  ground: --night
  panels: [--panel, --panel-2, --line, --sink]
  accent: [--brass, --brass-hi, --brass-deep, --on-accent]
  semantic: [--mint, --mint-deep, --flame, --sky, --sky-deep]
  ink: [--paper, --ink-dim]
  radii: [--r-lg, --r-md, --r-sm]
  spring: --pop
  theme_hooks: [--on-accent, --sink, --bg-wash, --bg-grid, --stripe]
mocks:                    # self-contained, load via the dev server for the brand fonts
  base: design/factory-mocks/_base.css
  winner: design/factory-mocks/dir-C-blueprint.html
  states: design/factory-mocks/dir-C-states.html
  competitors: [design/factory-mocks/dir-A-tworooms.html, design/factory-mocks/dir-B-ledger.html]
  renders: design/factory-mocks/*.png   # dir-{A,B,C}-{desktop,mobile}.png, C-*, before-*
---

# Typcoon — de fabriekspagina + de rustige typweergave

**What this is.** The design direction for splitting today's single play screen into a
**calm typing view** and a separate **exciting factory page** — the milestone from
ADR 011. It layers on the existing Muntpers token system and the 051/052 theme system;
it does not restyle the game world. Read `DESIGN.md` first for the world, `PROTOCOL.md`
for the method. The winner is **Direction C, "Het Bouwplan"**, chosen by pairwise
comparison against the five stated criteria.

---

## 0. The problem, seen rendered

`design/factory-mocks/before-play-{desktop,mobile}.png` is today's screen with a
mid-game save. It is exactly the Shareholder's complaint: the typing text is boxed on
the left while a **factory-floor strip** (top) and a full **machine + upgrade shop rail**
(right) compete for the eye. On mobile you scroll past the wallet, the floor strip, and
two meter boxes *before* you reach the sentence you are supposed to type. Typing — the
one thing that teaches — is the least prominent element on the screen, and the "factory"
is a static shopping list, not a place that visibly grows.

## 1. What is pinned, and where the freedom actually is

The charter pins the **look**: this is the Muntpers blueprint control-room (navy ground,
brass accent, mint production, Lilita One / Nunito), and the 051/052 theme system reskins
it. Changing the palette would fight both. So the honest axis of design freedom here is
**not colour — it is layout and information architecture**: how the typing view goes
calm, how the factory page presents growth and goals, and how the two connect. That is
where the three directions genuinely differ.

**Self-similarity check (PROTOCOL §1).** A two-tab "typing screen / management screen"
split (Direction A) is the answer I would produce for *any* game with a build-meta — it
is a default, not a decision, and I say so in the selection below. The move that is
specific to *this* brief's own words — the Shareholder asked for "clear goals," "see how
it's going," "my factory is growing" — is to make the factory page a **plan you fill in**,
not a dashboard you read. That is why the winner is C, and it is the part that would *not*
fall out of a generic brief. The one default I carried in on purpose: keeping every
existing colour/type token. That default is correct here because the charter mandates it.

## 2. The three competing directions

All three were built as real, font-loaded HTML on the shipped token layer (`_base.css`)
and rendered at desktop + mobile. They differ in concept, not skin.

### Direction A — "Twee Kamers" (Two Rooms) · `dir-A-tworooms.html`
A hard tab switch `[⌨ Typen | 🏭 Fabriek]`. While you type, the factory is **not on
screen at all** — a bare workbench. You leave typing to manage in a rich dashboard.

```
TYPING                          FACTORY (separate route)
┌───────────────────────────┐   ┌──────────────────────────────────┐
│        [Typen] Fabriek•    │   │ ◔  JE VOLGENDE DOEL      [🔒1049] │
│   ← Menu      ● 4.820 +140 │   │    Bouw de Robotarm  +28/s       │
│ ┌───────────────────────┐  │   ├────┬────┬────┬────┐              │
│ │   ×3.0  100% NETJES    │  │   │140/s│18K│⭐1│3/5│  (stat row)  │
│ │  fijne·dag·v̲riend·je   │  │   ├─────────────┬────────────────┐ │
│ │      [c][v][B][n][m]   │  │   │ 🏭 Machines  │ ⚡ Upgrades     │ │
│ └───────────────────────┘  │   │ list…        │ list…          │ │
│  ● Robotarm bijna → fabriek│   │              │ 🌟 verkopen     │ │
└───────────────────────────┘   └──────────────┴────────────────┘
```
- **+** Calmest typing view of the three; most feasible (plain lists/grids).
- **–** Over-corrects the brief: the reward loop is *hidden* while typing (a text nudge),
  not "visible but not shouting." The factory reads as a **stat dashboard / admin panel**
  — the exact spreadsheet feel that triggered the redesign. This is the generic default.

### Direction B — "Werkblad & Lade" (Worksheet + pull-up drawer) · `dir-B-ledger.html`
Typing is the persistent home; the reward loop is an **ambient vertical rail** that fills
toward the next machine (no numbers). The factory is a bottom **drawer** you pull up.

```
TYPING (home)                        FACTORY (drawer pulled up)
┌────────────────────────┐ ┌──┐      ┌─────────── ↓ Terug typen ──┐
│ ← Menu     ×3.0 100%   │ │🦾│      │ ◔ Robotarm bouwen  [🔒1049]│
│ fijne·dag·v̲riend·je    │ │▓▓│      │ ┌────┬────┬────┐           │
│ [c][v][B][n][m]        │ │▓▓│78%   │ │ ⌨️ │ 🖨️ │ 🦾 │ (cards)   │
└────────────────────────┘ └──┘      │ ├────┼────┼────┤           │
┌──────────────────────────────┐     │ │📦 │🏢 │🌟 │           │
│●4.820 +140  ═  1 machine ↑🏭  │     │ └────┴────┴────┘ chips…   │
└──────────────────────────────┘     └───────────────────────────┘
```
- **+** The rail literally embodies "visible but not shouting." Card-grid factory reads
  as a game; drawer reflows well on mobile; feasible.
- **–** The numberless rail shows *that* something fills, not *toward what* — weaker on
  the "clear goals" ask. The drawer means the factory is always half-present, a softer
  separation than the brief's "separate page."

### Direction C — "Het Bouwplan" (blueprint roadmap) · `dir-C-blueprint.html` · WINNER
The organising metaphor is the **goal, drawn as a blueprint you fill in**. The factory
page is a **roadmap path** of machines: built ones inked and green-linked, the next one
spotlit **"NU BOUWEN"** in brass, later ones ghosted blueprint outlines. Typing keeps a
single slim **goal sliver** at the top — a bar filling toward the named next machine.

```
TYPING                               FACTORY ("Het Bouwplan")
┌───────────────────────────────┐    ┌────────────────────────────────────┐
│ ← Menu    ×3.0 100% ● 4.820    │    │ JOUW FABRIEK   [3 van 5 gebouwd] ✅ │
│ ┌🦾 Robotarm ▓▓▓▓▓▓░ nog 229 ┐ │    │ ⌨️━━━🖨️━━━🦾┈┈┈📦┈┈┈🏢            │
│ │  JE VOLGENDE MACHINE        │ │    │ built  built  NU   ghost ghost      │
│ ├───────────────────────────┐ │    │              BOUWEN                 │
│ │ fijne·dag·v̲riend·je·tikt   │ │    │ ┌ NU BOUWEN ──────────── [●1049] ┐ │
│ │      [c][v][B][n][m]       │ │    │ │ ◔ Robotarm  +28/s  nog 229     │ │
│ └───────────────────────────┘ │    │ └────────────────────────────────┘ │
└───────────────────────────────┘    │ [⚙ assen✓][💰 munten][🌟 verkopen] │
                                      └────────────────────────────────────┘
```
- **+** Best "my factory is growing": the filled path *is* the progress; ghosted stations
  are goals you "see coming"; "3 van 5 gebouwd" is the plainest possible "how far I've
  come." Highest kid appeal (a level-path/world-map metaphor, not an app). Answers the
  brief's exact words. Typing stays calm with one named goal per keystroke.
- **–** The roadmap is the most custom CSS and needs a real mobile treatment (it became a
  vertical snake — see §6). More build than A/B. Honest cost, and it is paid once.

## 3. Selection — pairwise, ranked not scored (PROTOCOL §3)

An independent critic compared the candidates head-to-head with both the source and the
renders, no numeric scores:

- **A vs B → B.** A's bench is the calmest in the absolute, but *hides* the reward loop
  (brief wants it visible), and A's stat-row + two lists drift back to the admin feel
  that caused the redesign. B's ambient rail + card-grid reads as a game.
- **A vs C → C.** Same failure for A's blank bench; C keeps a named goal visible and its
  roadmap is a far stronger growth narrative than A's dashboard. Not close.
- **B vs C → C (narrow).** B is more feasible and more mobile-robust. C wins the two
  criteria weighted highest for a kids' tycoon — **kid appeal** and **legible excitement
  of growth** — and answers "clear goals / see how it's going / my factory is growing"
  more directly than B's numberless rail. C's fit outweighs its heavier build.

**Ranking: 1) C  2) B  3) A. Winner: Direction C, "Het Bouwplan."**

Feasibility, stated honestly: C is the most work of the three, but all of it is CSS on
the existing token layer plus one React route — no new dependency, no economy change, no
theme change. The cost is bounded and one-time; design is reused for months.

## 4. Winner spec — tokens

Colour and type are **unchanged** from `game.css` (the whole point — themes must
cascade). What 067 adds is captured in the front matter; the rules and rationale:

**Colour.** Reuse the Muntpers set verbatim. Two *semantic aliases* are introduced so the
split reads consistently and still themes for free: `--goal: var(--mint)` (a filling
progress bar is "production/good") and `--reward: var(--brass)` (coins earned stay in the
one loud accent). Because they are `var()` of themed tokens, Nachtploeg/Snoepfabriek/
Diepzee recolour them with no new per-theme entries.

**Type — three roles (PROTOCOL §1 wants a utility face; the product had two).**
- *Display* — **Lilita One**, used with restraint: page titles ("Het Bouwplan"),
  celebration cards, the goal name. Never for data.
- *Body* — **Nunito**: all sentence text, descriptions, buttons.
- *Utility/data (NEW)* — a **monospace** stack `--data` with `tabular-nums` for every
  number: coin counts, `+N/s` rates, `Lv N`, `%`, "nog N". Rationale: a control-room has
  **LED instrument readouts**; monospaced tabular figures stop the climbing coin counter
  from jittering its own width, and give the calm typing text a machine-precise feel that
  matches the world. This is the third role, earned by a concrete reference, not a generic
  "add a mono font."

**Spacing.** A 4px scale `--s1…--s6` (4/8/12/16/24/40) replaces the ad-hoc pixel values
in `game.css`. Rationale: the split introduces new layout (roadmap, sliver, stat chips);
a shared step keeps rhythm across two surfaces that a developer builds separately.

**Motion — restraint is the tell (PROTOCOL §1).**
- Typing view: **zero ambient motion.** No idle machine wiggle, no pulsing — the current
  FactoryFloor's constant animation *is* the distraction. `--dur-quick: 120ms` for the
  next-key hint and caret only.
- Factory page: motion **only on a discrete event** — a station snapping to "built", the
  coin flash, the goal bar advancing — each one spring (`--pop`) over `--dur-arrive:
  380ms`, then still. Reduced-motion already disables all of it (`game.css`).

## 5. Winner spec — layout for both surfaces

### 5a. The calm typing view
Top-to-bottom, centred, max ~760px:
1. **Thin bar** — `← Menu` · `×mult · acc% · ● coins` (data face). One line, quiet.
2. **Goal sliver** (`.goalsliver`) — `🦾 [name] · JE VOLGENDE MACHINE  ▓▓▓▓░ nog N`. This
   *is* the reward loop: visible, single, named, not shouting. The bar uses `--reward`.
3. **Typing card** (`.playcard`) — the sentence in the data face (done = dim, current =
   brass underline, upcoming = calm-ink), then the **next-key hint only** (`[c][v][B][n]`),
   not the full keyboard chrome. Mirrors `ui/TypingSurface`'s existing char states.
4. Nothing else. No floor strip, no shop rail. Celebration overlays (the existing
   four-moment cards) still fire between exercises, unchanged.

### 5b. The factory page — "Het Bouwplan"
A dedicated route (`view: 'factory'`), on a **blueprint-grid panel** (`.plan`, a denser
version of the body grid so it reads as drafting paper):
1. **Header** — `JOUW FABRIEK / Het Bouwplan` (display) with a `[N van 5 machines
   gebouwd]` progress tag (mint) top-right.
2. **The roadmap** (`.road`) — one `.station` per machine, left→right by unlock order,
   connected by a line. States: **built** (inked node, mint connector, `Lv N · +N/s`),
   **current** (brass ring, `NU BOUWEN` badge), **locked** (dashed ghost node, `nog N
   letters` or `🔒 volledige fabriek`). Milestone teasers ride a station badge
   (`Lv10 →×2`).
3. **Spotlit goal panel** (`.goalspot`) — the single next goal enlarged under the path:
   progress ring, name (display), what it gives (`+28/s`), `nog N munten — dat haal je in
   ± 2 opdrachten`, and the buy button (`--reward`).
4. **Objectives row** (`.objrow`) — upgrades + `🌟 Fabriek verkopen` (prestige) as three
   objective tiles; prestige shows its own progress (`74% · nog 6.600`) and stays sky-blue
   (rebirth is the only place `--sky` appears — DESIGN.md rule kept).

**Navigation between the two.** A persistent way back and forth (a two-item switch or a
`🏭 Fabriek` button on the typing bar + `← Typen` on the factory). The typing goal sliver
is the always-present thread: it names what the factory is building, so leaving to manage
feels like *advancing the plan*, not context-switching.

## 6. The goal / progress model, made visually concrete (required deliverable)

This is the spine of the winner, so it is specified exactly.

**"My next goal"** = the single most motivating next step, shown **twice, consistently**:
as the **goal sliver** on the typing view and as the **spotlit goal panel** (and the
`NU BOUWEN` station) on the factory page. It is computed, in priority order:
1. the next **machine unlock** the child has the letters for but has not built, else
2. the cheapest **machine level-up that reaches a milestone** (`Lv10 →×2`), else
3. the next **upgrade**, else
4. **prestige** progress (`🌟`), once nothing cheaper is meaningful.
Every goal shows: icon · name · reward (`+N/s` or `×2`) · a progress fraction
(`coins / cost`) rendered as the ring **and** the sliver bar · `nog N munten` · and a
**friendly effort estimate** ("± 2 opdrachten") so a kid reads *time*, not just a number.
No countdown, no timer, no urgency (charter guardrail 3) — the estimate is encouragement,
not pressure.

**"How far I've come"** = three always-legible signals, no separate "stats screen":
- the **filled roadmap** itself — built stations are ink, ghosts are future;
- the **`N van 5 machines gebouwd`** tag;
- **lifetime** (`18.400 ooit verdiend`) and **⭐ stars** carried as objective-row context.
For a brand-new player the plan is not empty: Typemachine is spotlit `te bouwen`, the rest
ghost with their letter-gates, and a one-line empty-state ("Je fabriek staat klaar om te
groeien — typ je eerste opdracht") explains the first move
(`design/factory-mocks/C-states-desktop.png`).

## 7. Reuse vs replace (required — reuse over rebuild where honest)

**Reused as-is (no change):**
- The **entire token layer** and both fonts; the **theme system** (`theme.js`,
  `ThemePicker.jsx`, all `[data-theme]` blocks) — untouched.
- `ui/TypingSurface.jsx` and its char-state styling — it *is* the calm typing surface;
  the split removes what surrounds it, not it.
- `economy.js`, all four-moment celebration overlays, `Unlock.jsx`, the daily/weekly/
  exam/achievement systems, the physical `.btn`, `.pill`, `.overlay`/`.card` primitives.
- All buy/upgrade/rebirth **logic** in `GameScreen.jsx` (`buy`, `buyUpg`, `doRebirth`,
  `BuyButton`) — it moves surface, it does not change.

**Restyled / relocated (same data, new container):**
- The **shop rail** (`.shop`, machine + upgrade lists) → becomes the **roadmap + spotlit
  goal + objectives row** on the factory page. Same `BUILDINGS`/`UPGRADES` data and buy
  handlers; new presentation.
- The **wallet** (`.wallet` pills) → the quiet typing-bar readout + the factory header.

**Replaced / removed:**
- **`FactoryFloor.jsx`** — the always-on animated floor strip. This is the concrete
  "basic and distracting" element; its job (see your empire work) is now done far better
  by the roadmap on the factory page. Remove it from the typing view. *(Escalation note:
  ADR 011 says "typing becomes calm"; removing the floor changes what the player sees
  every second. It removes no economy or learning behaviour — machines still only produce
  while typing — so I judge it inside the design mandate, not a product-scope change. If
  the PO reads the animated floor as a beloved feature worth keeping, that is a scope call
  for the CEO, not a quiet redesign; flag it in 068.)*
- The in-typing **meters block** (`.meters`: separate accuracy + combo cards) → folded
  into the one-line typing bar (`×mult · acc%`) so the sentence is the focus. Combo
  milestones still celebrate via the existing `combo-flash`.

## 8. How themes (051/052) layer onto the new surfaces

Unchanged mechanism, and that is the point. Both new surfaces are built **only** from the
`:root` custom properties, so a `data-theme` swap on `<html>` recolours the typing view
*and* the factory page together — the roadmap, the blueprint grid, the goal ring, the
sliver — with **no new work for a theme author**. Two rules keep this true:
1. **No new hardcoded colour.** Every colour on both surfaces is a `var(--token)`. The two
   new aliases (`--goal`, `--reward`) are themselves `var(--mint)` / `var(--brass)`, so
   they inherit each theme's mint/brass automatically.
2. **The blueprint grid uses `--bg-grid`** (already a theme hook, 052) — so Snoepfabriek's
   plan reads as candy-paper and Diepzee's as seabed drafting, for free.
A theme is still "done" by 052's rule (every `:root` token reset + nl/en label + a
`[data-theme]` block); 067 adds **no** token a theme must set. `test/theme.test.js`'s
economy-parity guard is unaffected — the split touches presentation only.

## 9. States verified (rendered, not drawn — PROTOCOL §4)

Winner shot at desktop + mobile (`dir-C-{desktop,mobile}.png`) and states at both
(`C-states-{desktop,mobile}.png`):
- **Empty** (0 machines) — roadmap still reads: first station spotlit `te bouwen`, rest
  ghosted with letter-gates + a friendly one-liner. No dead screen.
- **Long-string overflow** — a deliberately long Dutch sentence ("…ingewikkelde
  achtbaanconstructie wordt nauwkeurig samengesteld") **wraps** across three lines with no
  overflow. `--data` is `clamp(1.25rem,5.2vw,2.1rem)` + `overflow-wrap:anywhere`. Dutch
  runs longer than English — sized for the real text.
- **Loading** — a skeleton for the plan while the save hydrates.
- **Offline / error** — a **calm, reassuring** banner ("Geen verbinding. Je fabriek is
  lokaal opgeslagen — je raakt niets kwijt"), sky-blue, never alarming to a child.
- **Mobile** — the roadmap reflows to a **vertical snake** (all five stations visible, no
  horizontal scroll), goal panel and objectives stack, sliver bar drops to its own row.
  These fixes came straight from the critic's flagged flaws and are in `dir-C-blueprint.html`'s
  `@media (max-width:620px)`.

## 10. Charter guardrails in the design (AC)

- **No pressure mechanics / no dark patterns.** No timers, no countdowns, no "streak about
  to break" fear. The effort estimate ("± 2 opdrachten") encourages; it never threatens.
- **Breadth-not-power monetization unchanged in intent.** Premium machines/themes still
  show as **locked breadth** (ghost stations, `🔒 volledige fabriek`) routing to the
  existing parent-gated `Unlock.jsx`. Nothing sells speed or power; typing stays the only
  faucet. The unlock surfaces' *intent* is untouched — only their frame moves onto the
  plan.
- **Free tier stays complete.** The default (Muntpers) typing view and the first machines
  render fully; the plan simply shows what more exists.

## 11. For the PO (068) — what to scope against

The mocks in `design/factory-mocks/` are the scope reference. Build order that de-risks:
1. Extract the factory into its own route (`view:'factory'`) reusing the existing buy
   handlers — this alone splits the surfaces even before the roadmap art.
2. The **goal sliver** + one-line typing bar; remove `FactoryFloor` + `.meters` from the
   typing view. (Confirm the `FactoryFloor` removal with the CEO if it is contested — §7.)
3. The **roadmap** (`.station` states) + **spotlit goal** + **objectives row**.
4. Mobile reflow (`@media` in the winner mock) and the state screens (§9).
No economy, engine, or theme file needs to change. `npm test` should stay green because
none of this is economy; add a small test that the goal-selection helper picks the
expected next goal from a representative save.
