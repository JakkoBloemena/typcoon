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
    --calm-ink: "#c7d2f2"        # CUT — PO 077 (2026-07-24): unused; typing char-states reuse existing tokens (see §5a/§7). Hardcoded hex — would break the §8 theme-cascade invariant.
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

# --- WORLD PASS (assignment 079, ADR 012). Supersedes the §5b factory-page layout
# and the §5a typing-strip goal-sliver below; the base token system (colour/type/
# theme cascade) is UNCHANGED. Body: see "PART II — WORLD PASS". ---
world_pass:
  authority: [decisions/012, decisions/013]
  selected_direction: "C — De Maquette"     # blueprint becomes a diorama floor you look across
  target_devices: "desktop/laptop + keyboard-attached tablets; >=1024px; designed 1360px. NO mobile (ADR 012 ruling 3)."
  motion_policy:
    factory_world: "ambient/idle motion ALLOWED here (excitement lives on the factory page). Restraint is the tell — slow, low, staggered, never lockstep."
    typing_view: "ZERO ambient/idle motion (ADR 011 calm mandate). Only caret + next-key hint move per keystroke."
    chip_respec: ".golden-banner/.boost-chip/.type-hint drop `infinite` pulse -> ONE-SHOT entrance (dropIn, one spring, then still). Resolves the 073 AC2 bounce."
    reduced_motion: "prefers-reduced-motion (global game.css rule) kills every animation; the still resting state is the FINISHED surface — no information is motion-only."
  new_semantics_no_new_tokens: true          # world pass adds ZERO new :root tokens
  glow_rule: "tints/glows use color-mix(in srgb, var(--token) N%, transparent) — NOT raw rgba() — so themes carry the glow too (a discipline tightening over 074's raw-rgba glows)."
  folds_in_defects: [070, 080]               # 070 coin balance on world; 080 obj-name mid-word break
  mocks:
    winner: design/factory-mocks/world-C-maquette.html      # the factory world at desktop scale
    typing_strip: design/factory-mocks/world-typing-strip.html   # earnings-first re-spec
    states: design/factory-mocks/world-states.html          # empty/loading/offline/long-text
    competitors: [design/factory-mocks/world-A-werkvloer.html, design/factory-mocks/world-B-skyline.html]
    renders: design/factory-mocks/world-*.png
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
3. **Typing card** (`.playcard`) — the sentence in the data face with `ui/TypingSurface`'s
   **existing char states reused verbatim** (done = mint, current = paper + brass underline,
   upcoming = ink-dim — the `.tchar` rules in `game.css`), then the **next-key hint only**
   (`[c][v][B][n]`), not the full keyboard chrome.
   *(PO adjudication 2026-07-24, assignment 077: the earlier "done = dim / upcoming = calm-ink"
   recolour and the `--calm-ink` token are **cut** — §7's reuse-as-is ledger governs. See §7.)*
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
  the split removes what surrounds it, not it. **This bullet governs:** the `.tchar`
  char-state colours (done = mint, current = paper + brass, upcoming = ink-dim) are reused
  **verbatim**; the front matter's `--calm-ink` token and the §5a "done = dim / upcoming =
  calm-ink" draft are **cut** (PO adjudication 2026-07-24, assignment 077 — the recolour was
  never carried into this reuse-vs-replace ledger, `--calm-ink` is a hardcoded hex that would
  break the §8 theme-cascade invariant, and the existing tokens already pass AA and theme for
  free).
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

---
---

# PART II — WORLD PASS (assignment 079 · authority ADR 012 + ADR 013)

**History note.** Everything above (§0–§11) is the honest record of the 067→074 pass: the
route split, the calm typing view, and the first "Het Bouwplan" build. It shipped (071–074
landed). It is *not deleted* — it is the skeleton this pass grows from. Where PART II
conflicts with §5a/§5b/§9, **PART II wins** (it is the newer decision). The base token
system — colour, type, the 051/052 theme cascade, §4/§8 — is **unchanged**; the world pass
adds **zero new `:root` tokens**.

## W0. Why this pass exists

The Shareholder saw 074 rendered and ruled (ADR 012, verbatim): *"It should be a tycoon
game the players actually feel like they are experiencing it… The direction chosen for the
design is good. But it's still very basic, trying to get cramped into the same page as
where the kid is typing. It should only show high level (maybe what it can earn and has
earned) there."* Two orders:

1. **The factory page is a WORLD, not a panel.** Grow "Het Bouwplan" from a dashboard-in-a-
   card into a full-page place a kid *experiences*: scale, depth, atmosphere, machines that
   feel built and running, the roadmap as **terrain** rather than a row of chips. The
   Bouwplan metaphor is confirmed (ruling 2) — **grow it, do not replace it.**
2. **The typing view carries only high-level earnings** (ruling 1): earn rate + earned
   total. The goal sliver (067/073) is re-reviewed against this bar and **demoted off the
   typing view**.

Keyboard-first, desktop/laptop only (ruling 3): no mobile layouts for game surfaces.
Target ≥1024px, designed at 1360px; keyboard-attached tablets take the desktop layout.

## W1. Three world directions, chosen by pairwise comparison

The honest axis here is *"how does terrain read?"* — so three genuinely distinct concepts
were built as real font-loaded HTML on the shipped token layer and **rendered at desktop
scale** (`world-{A,B,C}-*.png`). All keep the pinned Muntpers look; they differ in the
world metaphor, not the skin.

- **A — "De Werkvloer"** (`world-A-werkvloer.html`): an **isometric factory hall** you look
  down into (RollerCoaster Tycoon / SimCity). Max immersion — but it **abandons the confirmed
  blueprint/Bouwplan metaphor** (ruling 2 violation), needs true isometric machine art the
  existing front-on Machine SVGs do not provide, and faked-iso in CSS reads brittle.
- **B — "De Skyline"** (`world-B-skyline.html`): a **side cross-section that grows floor by
  floor** (Tiny Tower / Fallout Shelter). "Growing" is the most literal — the building gets
  taller — but the metaphor is a **tower, not a Bouwplan**, and vertical growth wants
  scroll, fighting "read the whole place at a glance on a desktop." It also structurally
  drifts back toward a **stacked list in a card** (the exact dashboard failure that opened
  this pass).
- **C — "De Maquette"** (`world-C-maquette.html`) · **WINNER**: the blueprint becomes the
  **floor of a diorama you look across** — a model-railway baseplate / a LEGO city on a
  table. Built machines **stand up off the plan** near the front (big, running, casting
  shadows); the next machine is a **glowing brass foundation plot** ("NU BOUWEN"); not-yet-
  reachable machines are **flat blue-line ghost drawings receding toward a horizon.** Depth
  = a tilted blueprint floor + near/big vs far/flat. It **grows** the confirmed Bouwplan
  (the plan is now literally the ground you build on) instead of replacing it.

**Selection — pairwise, ranked not scored (PROTOCOL §3).** An independent critic compared
head-to-head with both renders and source, no numeric scores:
- **A vs B → B.** A's mock forfeits the one thing it was traded in for — the "place" read
  isn't even present in the render (near-empty void, flat iso stickers) — while still paying
  the Bouwplan-abandonment tax. B at least ships a complete, scannable screen.
- **A vs C → C, not close.** C keeps Het Bouwplan (title *and* the floor conceit) and reads
  as a full game screen; A breaks the metaphor and doesn't deliver the immersion it promised.
- **B vs C → C.** C gets "the whole place at a glance" through **near/far depth**, sidestepping
  B's own problem: a tower must either scroll (breaks the no-scroll desktop rule) or shrink
  each floor until unreadable. B reads as a settings list; C reads as a place you stand in.

**Ranking: 1) C  2) B  3) A. Winner: C — De Maquette.** The losing costs are paid honestly:
A's immersion is a mirage without iso art; B's literal-growth legibility is real but chained
to a scroll-hungry tower metaphor off the confirmed direction.

## W2. Winner spec — "De Maquette": the factory as a place

Reference to hold in your head (specific, not a generic adjective): **an architect's scale
model on a drafting table, or a LEGO/model-railway baseplate a kid leans over** — the
blueprint is the tabletop; the machines are models you place on it and switch on.

### W2a. The diorama floor (the "place")
- A single large **stage** (`.hal`, ~460px tall on desktop, full content width) with a lit-
  hall backdrop: a warm ceiling glow up top (`--bg-wash`) fading into `--night`/`--panel-2`.
- The **floor** (`.floor`) is a *separate tilted layer* — `transform: perspective(560px)
  rotateX(56deg)` on a `--bg-grid` grid over `--night`, masked to fade in at the front. It
  is the ONLY transformed element; **all machines and text sit flat on top of it**, so
  nothing readable is ever distorted. A soft `.horizon` line marks where floor meets the
  back of the hall. This is what turns a chip-row into a floor you look across.
- **Depth is the growth story.** Near the front = **built** (big, full-colour, running,
  shadow-casting). Toward the horizon = **not yet yours** (small, flat, blue-line). Moving a
  machine from "ghost near the horizon" to "risen model at the front" *is* "my factory is
  growing" — no separate stat needed.

### W2b. Machine states (same per-machine state logic as 074's Shop.jsx, new presentation)
- **Built** (`.mch`): a **plinth** — the codebase's physical idiom (panel gradient, thick
  `0 8px 0 var(--sink)` bottom edge) — standing on the floor with an elliptical **cast
  shadow**, a large machine icon, a mint **status light**, a nameplate, and an LED `Lv N /
  +N/s` readout. Milestone teaser rides a mint `.badge` (`Lv10 → tempo ×2`).
- **Current / next** (`.plot`): a **glowing brass foundation plot** on the floor — a dashed
  brass rectangle with drafting ticks and an `inset` brass glow, a ghosted preview of the
  machine, a `🦾 NU BOUWEN` flag, and `nog N munten`. This is where you build.
- **Locked** (`.ghost`): a **flat blue-line drawing on the plan** (dashed `--line`, hatched
  fill, greyed icon), placed further back / smaller = "coming later". Letter-gate shows `nog
  N letters`; premium shows `🔒 … / volledige fabriek` and routes to the existing parent-
  gated `Unlock.jsx` (breadth, not power — guardrail kept). Premium ghost gets a faint brass
  border tint so "buyable breadth" reads differently from "keep learning".

### W2c. The placement rule (so a dev never hand-tunes magic percentages)
The mock hand-places five machines by percentage; **that is a mock convenience, not the
spec.** The economy roster is fixed at **5 machines** (`BUILDINGS`), but placement must be a
*rule*, not literals, so it stays correct as levels/builds change (and survives a future
premium roster expansion):
- Lay machines out by **build-order index** along a shallow front-to-back diagonal. Two
  depth lanes: a **front lane** (built + the current plot) and a **back lane** (locked
  ghosts, nearer the horizon).
- **Scale + opacity are a function of depth (lane), not of item identity:** front lane =
  `scale 1`, full colour; back lane ≈ `scale 0.72`, flat blue-line, dimmed. A dev computes
  `x` from the index within the lane and `y`/`scale` from the lane — no per-machine
  constants.
- **Roster-growth rule (future-proofing, addresses the critic):** if the front lane ever
  fills (a premium expansion past what fits), the *earliest/cheapest* built machines recede
  into an "established" back-left cluster (smaller, still running) so the front lane always
  frames the **live edge** of your factory — the newest built + the next plot. The diorama
  never gains a horizontal scrollbar; depth absorbs growth. (Not needed for today's 5, but
  the layout rule must be written so it does not have to be redesigned to add a 6th.)

### W2d. The ledger — fixes defect 070 (a tycoon world must show your money)
A small **control-desk ledger** (`.ledger`) bolted to the top-right of the plan shows, as
live LED readouts, the three numbers a tycoon page must always show:
- **Munten** = the raw spendable `tycoon.coins` (`--reward`/brass coin). *This is the exact
  fix for 070 AC1* — 074 showed only lifetime-earned and goal-relative cost, never the
  spendable balance; the ledger surfaces `fmt(state.tycoon.coins)` directly.
- **Per seconde** = `coinsPerSecond` (`--mint`).
- **Sterren** = `tycoon.rebirths`, shown when `> 0` (070 AC2, already met by 074's context
  line — kept). Star context is the one legitimate non-prestige `--sky` use (see W6).

### W2e. The build ticket (the goal, now the PRIMARY goal surface)
Because the typing view drops its goal sliver (W4), the factory page's spotlit goal becomes
the **single** place the "next goal" lives. Rendered as a pinned **"BOUWBON" (work-order)**
card (`.ticket`) = `nextGoal` (071) enlarged, unchanged fields: progress **ring** (`--goal`
fraction), name (display), reward (`+N/s` / `×N`), `nog N munten — dat haal je in ± N
opdrachten` (encouragement, never a countdown — guardrail), and the buy button in `--reward`.
Same buy handlers as 074.

### W2f. The werkbank (upgrades + prestige) — fixes defect 080
Upgrades and `🌟 Fabriek verkopen` (prestige) as tools on a **werkbank** shelf (`.tools`),
each a wide tile with icon / name / effect / buy-or-owned. Prestige is the **only `--sky`
surface** (guardrail kept). **080 fix:** `.obj-name`'s `overflow-wrap: anywhere` (which
broke `Precisiegereedschap` mid-word as `Precisiegereed / schap`) is **replaced** with
`hyphens: auto` (`-webkit-hyphens: auto`) on a comfortably-wide tile, so the compound word
breaks at a real point or fits on one line. Requires the active locale on `<html lang>` (nl/
en) for the correct hyphenation dictionary — verify the rendered break, don't trust the CSS
spec (per 080's own note). Fall back to `overflow-wrap: anywhere` only if hyphenation is
provably not applying in the target browser.

## W3. Atmosphere & motion spec (required deliverable — with the tension named)

**The tension, stated so no one re-litigates it.** ADR 011's calm mandate governs the
**typing view** (and the 073 bounce proves it is enforced literally). The **factory page is
where excitement lives** — ambient motion is *allowed here and only here*. This section says
exactly where each is permitted.

**Factory world — ambient motion ALLOWED (restraint is the tell):**
- **Ambient machine life** (`idleBob`): each built machine's icon does a slow, low bob
  (~5–6.5s, ±4px), **staggered** so machines are never in lockstep — lockstep reads as
  machine-made; a considered stagger reads alive. This shows the factory *warm and alive at
  rest*. It **must not imply coin production** — machines only mint while the kid types
  (guardrail 2, no idle income), so no coins spout on this page; the belt (`beltDrift`) is a
  slow decorative rail, **not** carrying coins.
- **The foundation plot** breathes a gentle brass glow (`plotGlow`, ~3.4s) to say "build
  here" without a pulse-shout.
- **Arrival moment** (`riseIn`): when the kid navigates *into* the factory, the models
  **rise onto the table**, staggered (one spring `--pop` over `--dur-arrive` each, ~60ms
  apart), then still. This is "walking into your factory" — the one discrete arrival the
  brief asks for. It loops **never**.
- **Build moment** (discrete, on purchase): the bought machine's foundation inks in and its
  model rises off the paper — one spring, then still (reuse the `riseIn`/`cardPop` idiom).

**Typing view — ambient motion BANNED (zero idle animation):**
- No floor, no idle wiggle, no infinite pulse. Only the caret and the next-key hint move,
  per keystroke.
- **The 073 bounce fix, folded in as one coherent surface:** `.golden-banner`,
  `.boost-chip`, and `.type-hint` currently carry `animation: goldpulse/hintPulse …
  infinite`. **Re-spec: replace `infinite` with a one-shot entrance** (`dropIn`, one
  `--pop` spring on appear, then still — the same idiom the codebase already uses for
  `cardPop`/`dropIn`). They still *appear* with life; they do not *pulse forever*. This
  resolves 073 AC2 and this pass's typing-strip spec in a single motion policy, so the dev
  fixes them once.

**Reduced-motion fallback (required).** `game.css`'s global `@media (prefers-reduced-motion:
reduce)` already zeroes animation duration + iteration. The design rule that makes that
*correct*: every animation's **still resting state is the finished surface** — machines are
already risen and inked, the plot is already glowing at its mid level, chips are already
visible. No state or affordance is conveyed by motion alone. A reduced-motion kid sees the
complete factory instantly; they lose only the flourish.

## W4. Typing-strip re-spec — earnings-first (ADR 012 ruling 1)

Mock: `world-typing-strip.html`. The typing view carries **only high-level earnings**:
- **Primary — the earnings cluster** (top bar, `--data` LED face): **earn rate** (`⚙️ +N/s`,
  mint) + **earned total** (`● N` coins, in the brass `--reward` pill). These are the two
  numbers ruling 1 names ("what it can earn and has earned").
- **Secondary — the teaching levers**, smaller and quieter than the earnings: `×mult` and
  `acc%`. These stay because accuracy *is* the earn multiplier — they are the child's live
  "what it can earn" feedback — but they are visibly subordinate, not co-equal readouts.
- **REMOVED from the typing view: the goal sliver.** The 067/073 `.goalsliver` ("JE VOLGENDE
  MACHINE · nog N" + progress bar) is the "cramped" element ruling 1 targets. It is **gone**
  from the typing view; the goal now lives fully on the factory page's build ticket (W2e).
  *Decision to challenge:* I chose **removal over demotion**. The alternative (keep a one-
  line secondary sliver) preserves an explicit typing→factory "thread", but it re-imports the
  exact clutter the Shareholder called out, and the earn rate already *is* the live thread
  (it climbs as you build). If 076's playtest finds the connection feels severed, the cheapest
  re-add is a single line "🏭 Fabriek → Robotarm bijna klaar" on the factory button, **not**
  the progress bar. Flagged for the verifier/PO.
- Nothing else from the factory world appears on the typing view. Celebration overlays
  (letter/machine/milestone/star) still fire between exercises, unchanged.

## W5. Edge states for the world (075's surviving scope)

Mock: `world-states.html`. Desktop only; no mobile variants.
- **Empty (fresh save):** the plan is not blank — the whole plan is drawn, the first machine
  (Typemachine) is a lit `🔨 BOUW HIER` foundation plot, the rest are blue-line ghosts with
  letter-gates, and one friendly line: *"Je fabriek staat klaar om te groeien — typ je
  eerste opdracht."* No dead screen.
- **Loading (save hydration):** a **blueprint skeleton** — plot/plinth placeholder blocks
  with a gentle `shimmer` on the floor while the save loads. (Factory page → shimmer allowed;
  reduced-motion shows the static skeleton.)
- **Offline / error:** a **calm, reassuring** banner — *"Geen verbinding. Je fabriek is
  lokaal opgeslagen — je raakt niets kwijt."* **Re-specced off `--sky`:** §9 drew this
  sky-blue, but `--sky` is reserved for prestige (guardrail). The banner is now a neutral
  `--panel` card with a **`--mint-deep` left accent** (safe/OK, not alarm), `--paper`/
  `--ink-dim` text — **never `--flame` (red) and never `--sky`.** This both keeps the child
  reassured and tightens the prestige-only-sky invariant.
- **Long-text overflow:** Dutch runs longer than English — the typing card sizes for the
  real text (`--data` at `clamp(1.25rem,4.4vw,2.1rem)`, wraps, no clip). Machine/upgrade
  names use the W2f `hyphens: auto` rule (080), verified on `Precisiegereedschap`.

## W6. Token discipline & theme layering (the invariant that must not slip)

- **Zero new `:root` tokens.** The whole world is built from the existing set + the two 067
  aliases (`--goal`, `--reward`). A `[data-theme]` swap recolours the entire diorama — floor
  grid, plinths, plot glow, ghosts, ledger, ticket, werkbank — for free (§8 mechanism
  unchanged).
- **Every colour is a `var(--token)`.** Tints and glows use **`color-mix(in srgb,
  var(--token) N%, transparent)`**, *not* raw `rgba()`. Rationale: 074's plinth/plot glows
  used raw `rgba(255,185,21,…)` — a hardcoded colour that does **not** re-tint under a theme
  (the same class of slip as the original mock's `--sky` kick that cost a dev a fix cycle).
  `color-mix` over a token means Snoepfabriek's glow is candy-pink and Diepzee's is coral,
  automatically. **Check every world mock for hex/raw-rgba before shipping** — the mocks in
  `design/factory-mocks/world-*.html` are clean (verified at render time).
- **`--sky` stays prestige-only**, with the single documented exception of the ledger's star
  context (rebirth count *is* prestige context, so it is on-rule). The offline banner is
  explicitly moved **off** sky (W5).
- The floor grid reuses **`--bg-grid`** (already a theme hook, 052) so the drafting paper
  themes per world, like §8 already promised for the flat version.

## W7. Reuse vs replace — the build delta vs 074's landed skeleton (for the PO)

**Reused as-is (no change):** the entire token layer + themes; `economy.js`, `goals.js`
(`nextGoal`), all buy/upgrade/rebirth **handlers** (`buy`/`buyUpg`/`doRebirth`/`BuyButton`)
and the **per-machine state precedence** logic in `Shop.jsx` (built/current/locked, incl.
the real 4th "te bouwen" case and the `machineLocked ∧ unlocked` premium rule); `Unlock.jsx`
routing; all four-moment celebration overlays; `ui/TypingSurface.jsx`.

**Upgraded / replaced (same data + handlers, new presentation + motion):**
1. `.plan` panel → the full-page **diorama stage** (`.hal` + tilted `.floor` + `.horizon`)
   + the **ledger** (070 fix).
2. `.road` horizontal chip-row → **depth-placed machine models** (built plinth / current
   foundation plot / locked blue-line ghost) with the W2c placement rule + ambient life.
3. `.goalspot` → the **BOUWBON build ticket** (same `nextGoal` fields), now the primary goal
   surface.
4. `.objrow` → the **werkbank** rail; **080 fix** (`hyphens:auto` over `overflow-wrap`).
5. Typing view: **remove the goal sliver**; add the **earnings cluster** (rate+total) with
   levers secondary; **fix the three chip animations** to one-shot (073 AC2).
6. Motion: ambient/arrival/build on the factory world; reduced-motion resting states.

**Buildable slices (de-risked order):**
- **Slice 1 — Typing strip (small, unblocks 073).** Remove `.goalsliver` from `GameScreen`;
  add the earnings cluster; change `.golden-banner`/`.boost-chip`/`.type-hint` from infinite
  pulse → one-shot. Self-contained; closes the 073 bounce.
- **Slice 2 — Ledger (tiny, high value).** Add the coin/rate/star ledger to the factory
  header. Closes 070 AC1. (Can ship before the diorama art.)
- **Slice 3 — The diorama floor.** `.hal`/`.floor`/`.horizon` + built-plinth / foundation-
  plot / blue-line-ghost treatments + the W2c placement rule. The big one.
- **Slice 4 — Atmosphere & motion.** Ambient life + arrival + build moments + reduced-motion
  verification.
- **Slice 5 — Werkbank + 080 fix.**
- **Slice 6 — Edge states** (empty / loading / offline / long-text) for the world.
No economy, engine, `store.js`, or `theme.js` change. `npm test` stays green (presentation
only); keep the 071 goal-selection test green.

**Build-delta headline for the PO:** *074 shipped a correct but flat chip-diagram; the world
pass keeps every handler and the state logic and re-skins the surface into a diorama you look
across — plus two defect fixes (070 coin balance, 080 word-break) folded in, and the typing
strip stripped to earnings-only (which also lands the 073 calm-motion fix). It cuts into 6
presentation-only slices; slices 1–2 are small and close two open defects on their own.*

## W8. Guardrails in the world pass (AC)

- **No pressure mechanics.** No timers, no countdowns, no "streak about to break". The `± N
  opdrachten` effort estimate encourages; it never threatens. Ambient machine life is *at
  rest* — it never spouts coins, so it implies **no idle income** (guardrail 2 intact:
  typing is still the only faucet).
- **Breadth-not-power.** Premium machines remain **locked breadth** (blue-line ghost / `🔒
  volledige fabriek`) routing to the parent-gated `Unlock.jsx`. Nothing sells speed.
- **Prestige stays the only `--sky` surface** (ledger star context excepted, W6). Not
  re-decided.
- **Free tier complete.** The default Muntpers world + the free machines render fully; the
  plan shows what more exists as ghosts (invitation, not a wall).
