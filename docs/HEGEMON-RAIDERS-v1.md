# HEGEMON — Off-grid corsairs & the frontiers of the unknown (v1)

Every 4X gives you fog of war — the unknown of **space**. HEGEMON's distinguishing
hook is the *other* unknowns, revealed only through play:

1. **The Sea Beyond** — raiders from off the map's edge, and the lost islands you
   can dare to sail out and find. **(Slice 1 — DONE, below.)**
2. **The Minds of the Age** — historical figures (Archimedes, Pytheas, …) who arrive
   *because of how you play* and open the other frontiers. **(Slice 2 — DONE, below.)**
3. **The Land Beneath** — natural resources that start hidden and are uncovered by
   exploring or settling. *(planned)*

The systems interlock: a naval crisis summons Archimedes, whose burning mirrors or a
navigator's boon let you cross the belt to hunt the raiders' isle; settling the ore
coast you defend summons a prospector who reveals its wealth. Threat → the mind who
answers it → the frontier that mind opens.

---

## Slice 1 — Off-grid corsairs (DONE)

Raiders don't sit on the map like barbarian camps. They gather **beyond the world's
edge**, out in the open-sea belt (`Tile.open`, 8 rings) that the player can't see
into, and fall on a **coastal city**. You never see their home, so you can't march on
it — you can only defend, or pay them off.

### The cycle (all seeded, deterministic, once per world-turn)

1. **Warning.** A raid gathers on the horizon and is announced a turn ahead
   ("sails on the horizon"), naming its target and rough strength. The human gets a
   decision card (`pendingRaid`); the AI just braces.
2. **Response.** *Stand and fight* (free — lean on your defences) or *Pay them off*
   (tribute in gold; the fleet turns away). Positioning troops/warships near the
   threatened city before the blow is the real counter-play.
3. **Strike.** Next turn the raid's `strength` is checked against the city's defence:
   - **Repelled** — defence ≥ strength. Walls hold, no loss.
   - **Sunk** — repelled *with a warship in port*: the raiders are wrecked for plunder
     (bonus gold).
   - **Pillaged** — defence < strength: gold carried off, walls damaged, and if badly
     overwhelmed (strength ≥ 2× defence) a point of population. The city always
     survives — a raid sacks, it does not hold ground.

### Numbers (tuning knobs in `src/engine/index.ts`)

- `RAID_START_TURN = 6`, `RAID_WARN_LEAD = 1`, `RAID_MAX_ACTIVE = 2`, `RAID_CHANCE = 0.28`.
- **Strength** = `(12 + (era−1)·14 + wealth) · (0.85 + 0.4·roll)`, where `era` is the
  target owner's age (1–3) and `wealth` scales with population + treasury. Longships
  early, organised Sea Peoples fleets late; rich cities attract bigger raids.
- **Defence** = `8 + age·4 + wall-integrity·6 (+5 harbour)` plus the defence of any
  friendly unit on the city (full) or adjacent (×0.6), with a warship in port ×1.3.
- **Tribute** = `round(strength·1.5 + 8)` (`raidTributeCost`).

### Where it lives

- Engine: `src/engine/index.ts` — `resolveRaids` / `scheduleRaid` run in the
  new-world-turn branch of `applyEndTurn`; `applyResolveRaid` handles the
  `RESOLVE_RAID` action; `raidDefense`, `raidTributeCost`, `beltTileNear`,
  `raidableCities` are the helpers. Constants exported for tuning/tests.
- Types: `Raid`, `RaidReport`, `Player.pendingRaid`, `GameState.raids` /
  `.raidReports`, `ResolveRaidAction` in `src/engine/types.ts`.
- Client: `game.js` — `showRaidModal` (the warning card), `surfaceRaidReports`
  (warning/strike toasts + log), reconciled in `render()`. `#raid-modal` in
  `game.html`, `.raid-card` styling in `game.css`. `HGTest.forceRaid(strength)`
  drives the modal/toast path in tests.
- Tests: `test/raiders.test.ts` (repel / pillage / sink / tribute / can't-afford /
  vanished-city / campaign-materialisation). Lockstep-safe: `pendingRaid` is set on
  the target's owner deterministically (never keyed to `humanPlayerId`).

### Deliberately deferred to later slices

- The raid fleet as an **attackable unit** on the belt you can intercept at sea
  (needs a pirates pseudo-faction / combat null-safety).
- **Hunting the haven**: sail past `LOST_AT_SEA_DIST` with Navigation / a figure's
  boon to reach lost islands + the raiders' home for treasure. (Pytheas's `seaReach`
  boon is the first step — it already lets you sail farther out.)
- Raider **escalation** tied to your coastal wealth over a campaign; a board marker
  for the approaching fleet on the `approach` belt tile.

---

## Slice 2 — Historical figures ("The Minds of the Age") (DONE)

Unlike a random Crossroads dilemma, a figure arrives **because of how you play** —
their arrival condition reads your current situation — and offers a branching,
historically-grounded boon. Each appears **at most once per player per game**, and
meeting one leaves a mark in your personal **chronicle** (a lightweight collection
hook; full card integration is a later slice).

### The interlock

This is the payoff that ties the frontiers together: **Archimedes** arrives to a
coastal power under naval threat and offers the **Burning Mirrors**, which *destroy
the raid bearing down on you* (a `burned` raid outcome) plus a lasting coastal ward.
**Pytheas** arrives once you've braved the open sea and grants `seaReach` — you sail
farther out before the deep claims you, the first step toward hunting the raiders'
haven.

### The roster (`src/engine/figures.ts`)

26 figures — far more than any one game surfaces (you meet a handful), so campaigns
don't repeat.

**These are deliberately NOT the Legend cards.** The Legend cards (the collectible
meta-game, `src/cards-data-v2.js`) are the era's kings, generals and statesmen —
Caesar, Hannibal, Pericles, Alexander, Cyrus… The people you MEET are the other half
of history: **thinkers and makers** — mathematicians, astronomers, physicians,
inventors, architects, naturalists, a poet, and the anonymous master-craftsmen of a
people. Some are household names; many are gloriously obscure. **No figure is a ruler
or commander, and none shares a name with a Legend card — the two casts are disjoint.**

Some figures are **unique to one people** (civ-gated) — where a civ's famous names are
all generals and kings, its figure is the anonymous guild that actually built its
greatness (Carthage's dockyard shipwrights, Gaul's ironsmiths, Meroë's ironmasters,
Parthia's qanat engineers). Every one of the eight civs has one. Arrival conditions
read the `FigureCtx`: `coastal, navalThreat, atSea, atWar, cityCount, age, foundRuins,
gold, unitCount, population`.

**Universal** (open to any people):

| Figure | Craft | Arrives when… |
|---|---|---|
| **Archimedes of Syracuse** | geometer / war-engineer | coastal & (raid threatens *or* age ≥ 2) — *the Burning Mirrors destroy the raid* |
| **Pytheas of Massalia** | navigator | a ship is in the open-sea belt — *`seaReach` +2* |
| **Hippocrates of Kos** | physician | age ≥ 2 |
| **Thales of Miletus** | natural philosopher | early (age ≤ 1) |
| **Anaximander of Miletus** | cartographer / cosmologist | age ≤ 1 or ≥ 2 cities |
| **Pythagoras of Samos** | mathematician | age ≥ 2 |
| **Democritus of Abdera** | atomist philosopher | age ≥ 2 |
| **Eratosthenes of Cyrene** | geographer | age ≥ 2 |
| **Euclid of Alexandria** | mathematician | age ≥ 2 |
| **Aristarchus of Samos** | astronomer (heliocentric) | age ≥ 2 |
| **Hipparchus of Nicaea** | astronomer | age ≥ 2 |
| **Herophilus of Chalcedon** | anatomist | age ≥ 2 |
| **Theophrastus of Eresos** | botanist / mineralogist | age ≥ 2 |
| **Ctesibius of Alexandria** | inventor (pneumatics) | age ≥ 2 or at war |
| **Hero of Alexandria** | inventor (steam, automata) | age ≥ 2 |
| **Sostratus of Cnidus** | architect (the Pharos) | coastal |
| **Herodotus of Halicarnassus** | historian | you've excavated a ruin |
| **Sappho of Lesbos** | poet | at peace |

**Unique to one people** (a master builder, or the guild that made the people great):

| Figure | People | Craft | Arrives when… |
|---|---|---|---|
| **Vitruvius** | Rome | architect / engineer | ≥ 2 cities |
| **Ictinus** | Greece | architect of the Parthenon | ≥ 2 cities or at peace |
| **The Shipwrights of the Cothon** | Carthage | prefab-fleet shipwrights | coastal or at sea (`seaReach`) |
| **Imhotep** | Egypt | architect / physician | ≥ 2 cities or age ≥ 2 |
| **The Smiths of La Tène** | Gaul | ironmasters (mail, blades) | at war or ≥ 2 cities |
| **The Ironmasters of Meroë** | Kush | iron smelters | ≥ 2 cities or age ≥ 2 |
| **The Druids of Ynys Môn** | Britons | keepers of lore & the heavens | ≥ 2 cities or a ruin found |
| **The Qanat Masters** | Parthia | irrigation engineers | ≥ 2 cities or age ≥ 2 |

Civ-gating is enforced in `maybeFireFigure` via `playerControlsCiv`; no civ figure is
guaranteed from turn one.

### Where it lives

- Data: `src/engine/figures.ts` — `FIGURES`, `FigureEffects`, `FigureCtx`,
  `getFigure`. Pure predicates + effect vocabulary, no engine internals.
- Engine: `src/engine/index.ts` — `maybeFireFigure` (conditional, seeded, spaced,
  once-each) beside `maybeFireEvent`; `applyResolveFigure` + `applyFigureEffects`
  (the full boon vocabulary incl. `cancelRaids` → `burned` report, `seaReach`,
  perks, xp, heal, reveal, spawn, tech); `figureContext` computes the arrival ctx.
  Constants `FIGURE_START_TURN/CHANCE/SPACING`.
- Types: `Player.pendingFigure` / `.metFigures` / `.lastFigureTurn`,
  `perks.seaReach`, `ResolveFigureAction`, `RaidReport` kind `"burned"`.
- AI: `src/engine/ai.ts` auto-resolves `pendingFigure` (richest boon) — same
  lockstep-safe pattern as events; `pendingFigure` is set on the player
  deterministically, never keyed to `humanPlayerId`.
- Client: `game.js` — `showFigureModal`, `figureEffectsSummary`, `recordFigureMet`
  (chronicle in the profile), the `"burned"` toast, and figure-priority over the
  raid modal. `#figure-modal` in `game.html`, `.figure-card` in `game.css`.
  `HGTest.forceFigure(id)` drives the modal in tests.
- Tests: `test/figures.test.ts` (each boon type, the mirrors-vs-raid interlock,
  `seaReach` survival, once-only arrival over a campaign). One decision card shows
  at a time — an unresolved event/figure holds the slot, freed as soon as it's
  answered.

### Deferred

- Full **card-collection** integration (figures as collectible Legend cards with
  equip perks) — v1 only records them in the profile chronicle + a toast.
- More figures, civ-specific figures, and figures that open **The Land Beneath**
  (a prospector who reveals hidden deposits, once that slice exists).
