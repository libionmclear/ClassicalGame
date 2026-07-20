# HEGEMON — Off-grid corsairs & the frontiers of the unknown (v1)

Every 4X gives you fog of war — the unknown of **space**. HEGEMON's distinguishing
hook is the *other* unknowns, revealed only through play:

1. **The Sea Beyond** — raiders from off the map's edge, and the lost islands you
   can dare to sail out and find. **(Slice 1 — this doc, DONE.)**
2. **The Land Beneath** — natural resources that start hidden and are uncovered by
   exploring or settling. *(planned)*
3. **The Minds of the Age** — historical figures (Archimedes, Pytheas, …) who arrive
   *because of how you play* and open the other two frontiers. *(planned)*

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
  boon to reach lost islands + the raiders' home for treasure.
- Raider **escalation** tied to your coastal wealth over a campaign; a board marker
  for the approaching fleet on the `approach` belt tile.
