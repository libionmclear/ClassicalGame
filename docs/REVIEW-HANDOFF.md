# HEGEMON — review handoff

**For a reviewing model (e.g. Fable Claude).** This is a self-contained brief to
orient you, tell you how to build and verify, and point you at what to review. For the
player-facing feature/content reference, see [GAME-OVERVIEW.md](GAME-OVERVIEW.md); for
the design of the newest systems, [HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md).

---

## 1. What this is

HEGEMON is a historically grounded, classical-age (~800 BC – AD 117) hex-strategy
game. Web-first: a **Three.js/TypeScript client** over a **pure, deterministic
TypeScript rules engine**. Single-player + AI + self-contained online multiplayer.

**Repo caveat:** this repository also contains a leftover, unrelated "Personal
Assistant" web app. **The game is only:** `src/engine/**`, `src/render3d/**`,
`src/*.js` (card/tech/unit data), `game.js` / `game.html` / `game.css`, `server/**`,
`scripts/**`, `test/**`. Ignore anything that doesn't fit that.

## 2. Architecture & invariants (please respect when reviewing)

- **The engine is a pure reducer.** `applyAction(state, action)` deep-clones state and
  dispatches through one switch (`src/engine/index.ts`). No I/O, no time, no
  randomness except via `seededRandom(seed, salt)` (`src/engine/rng.ts`). **These
  invariants are load-bearing:**
  - **Determinism / replay:** same seed + same action log ⇒ byte-identical state.
    `Date.now()`/`Math.random()` must never enter the engine.
  - **MP lockstep:** live play relays only human actions and runs AI locally on every
    client; they must stay byte-identical. So **no engine state may depend on
    `humanPlayerId`** (which differs per client). Pending decisions (`pendingEvent`,
    `pendingRaid`, `pendingFigure`) are therefore set on the *player* deterministically,
    and the client alone decides whether to show the human a modal. `mp-lockstep.test.ts`
    guards this — a real bug we already hit and fixed.
- **Client/engine split:** all rules + all data live in the engine and `game.js`; the
  board (`src/render3d/board3d.ts`) is fed a plain view object and renders it. The
  engine is exposed to the browser via `src/engine/browser-entry.ts` → `window.HegemonEngine`
  (esbuild). If you add an engine export the client needs, it must be re-exported there.
- **Meta-game rule (product invariant):** cards are **pay-to-enhance, never
  pay-to-win** — everything earnable by play; money only skips the grind; no card
  grants outright power.

## 3. Code map

**Engine (`src/engine/`):**
`index.ts` (the reducer + most systems — combat, cities, end-turn, raiders),
`types.ts`, `data.ts` (units/techs/buildings/improvements/resources), `ai.ts`,
`diplomacy.ts`, `districts.ts`, `events.ts` (Crossroads), `figures.ts` (the people you
meet), `discovery.ts` (ruins), `peoples.ts` (minor villages), `visibility.ts` (fog),
`mapgen.ts`, `pathfinding.ts`, `hex.ts`, `rng.ts`, `scenarios.ts`, `titles.ts`,
`branch-data.ts`, `browser-entry.ts` (browser export surface).

**Client:** `game.js` (large IIFE — UI, view build, modals, MP session),
`game.html`, `game.css`. **Board:** `src/render3d/board3d.ts`,
`src/render3d/cityModels.js`, `districtModels.js`. **Card/tech/unit data:**
`src/cards-data-v2.js`, `src/techs-v2.js`, `src/units-v2*.js`,
`src/districts-data-v2.js`. **Server:** `server/hegemon-server.mjs`.
**Build:** `scripts/build-web.mjs`. **Balance sim:** `scripts/balance-sim.ts`.

## 4. Build & verify

```bash
npm run typecheck        # tsc --noEmit
npm test                 # 286 unit tests (node --test over test/*.test.ts)
npm run build:web        # esbuild → public bundle
node test/browser-smoke.mjs   # boots the 3D board headless, drives it via window.HGTest, asserts 0 script errors
npm run balance          # AI-vs-AI sim (24 games) — sanity-check balance; buffers output until done (~2-4 min)
```

All green at time of writing: **typecheck clean, 286/286 tests pass, browser smoke
passes with 0 errors, balance sim healthy** (all games complete, no crashes).

Note the client can be exercised headlessly through `window.HGTest` (in `game.js`):
`snapshot()`, `clickTile`, `endTurn`, and test-only `forceRaid(strength)` /
`forceFigure(id)` to drive the raid/figure modals.

## 5. What's new and most wants review (this cycle)

Two large features were added — the first two "frontiers of the unknown." Design doc:
[HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md).

### (a) Off-grid corsairs — `e093ec0`
Raiders gather in the off-map open-sea belt (`Tile.open`) and strike coastal cities.
Warned a turn ahead, then resolved: **repelled / sunk (warship in port) / pillaged**;
respond by defending or paying tribute.
- Engine: `resolveRaids` / `scheduleRaid` in the new-world-turn branch of
  `applyEndTurn`; `applyResolveRaid` (`RESOLVE_RAID`); `raidDefense`,
  `raidTributeCost`, `beltTileNear`, `raidableCities`; constants `RAID_*` — all in
  `src/engine/index.ts`. Types `Raid`, `RaidReport`, `GameState.raids/raidReports`,
  `Player.pendingRaid` in `types.ts`.
- Client: `showRaidModal`, `surfaceRaidReports`, `#raid-modal`.
- Tests: `test/raiders.test.ts` (repel/pillage/sink/tribute/afford/vanish/campaign).

### (b) Historical figures ("the Minds of the Age") — `1c57808` → `f9982eb`
Figures arrive *because of how you play* and offer a branching one-time boon.
Interlock: **Archimedes' Burning Mirrors destroy an incoming raid** (`cancelRaids` →
`burned` report); **Pytheas/Carthage shipwrights** grant `seaReach`.
- **Deliberately disjoint from the Legend cards.** Cards = rulers/generals you
  collect & equip (`src/cards-data-v2.js`, 68 Legends); figures = **thinkers & makers**
  you meet mid-match (`src/engine/figures.ts`, 26). No figure is a ruler/general and
  **no name overlaps a card** (verified). Some figures are civ-gated maker guilds.
- Engine: `maybeFireFigure` / `applyResolveFigure` / `applyFigureEffects` /
  `figureContext` in `index.ts`; `FIGURES`, `FigureEffects`, `FigureCtx` in
  `figures.ts`; AI auto-resolves in `ai.ts`. Types `Player.pendingFigure/metFigures`,
  `ResolveFigureAction`, `perks.seaReach`.
- Client: `showFigureModal`, `figureEffectsSummary`, `recordFigureMet` (profile
  chronicle), `#figure-modal`.
- Tests: `test/figures.test.ts` (each boon, mirrors-vs-raid, seaReach, once-per-game,
  roster integrity, civ-gating).

### Suggested review targets
1. **Lockstep safety** of the raid/figure pending state (does anything read
   `humanPlayerId` into engine state? see §2). `mp-lockstep.test.ts` should still pass.
2. **Balance:** boons reuse the perk vocabulary; frequency is capped (spaced + seeded
   roll + once-each). Are any boons over/undertuned? The sim shows Britons/Gaul run
   strong — note this is a **pre-existing base-civ-balance** matter (present before
   figures), not caused by figures.
3. **Determinism:** any accidental non-seeded branch or object-key-order dependence in
   the new code (`scheduleRaid` target selection, `beltTileNear`, `figureContext`).
4. **Correctness/edge cases:** raid on a vanished/captured city; tribute you can't
   afford; a figure whose condition flips between arrival and resolution; the
   one-decision-card-at-a-time slot (`pendingEvent || pendingFigure`).
5. **Historical accuracy & tone** of the figure roster and boons (this is a
   "super historically-accurate" game — flag anything wrong or anachronistic).

## 6. Also touched recently (context)
- **Graphics:** full procedural render — post-FX (GTAO/SMAA/Bloom), procedural
  terrain normal/roughness maps, single-level reflective sea + depth-tint hexes,
  **day-only** lighting (night removed by request), city material progression
  (wood→mudbrick→stone→marble). See GAME-OVERVIEW.md §Graphics.
- **Multiplayer Phase 1–2a:** accounts/friends/admin backend + matchmaking lobby.

## 7. Known caveats
- The repo mixes in an unrelated leftover app (see §1) — don't review it as the game.
- `PROJECT-MEMORY.md` shows as modified in git but is a pre-existing, unrelated working
  change and is intentionally left untouched.
- Base civ balance (Britons/Gaul strong, Athens/Egypt weaker in AI hands) is a known,
  pre-existing tuning matter, separate from the recent features.

Thanks for reviewing — concrete, file-cited findings are most useful.
