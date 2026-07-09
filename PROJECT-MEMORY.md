# HEGEMON — Project Memory & Handoff

> A single, comprehensive reference for the HEGEMON game so any collaborator or
> AI session (e.g. Fable) can pick up the project with full context. This is the
> authoritative narrative; the exact record of every change is in `git log` (each
> commit has a detailed message). Keep this file current when big systems change.

---

## 1. What this is

**HEGEMON** — a historically‑grounded, classical‑age (~800 BC–AD 117) hex‑based
**light‑civilization strategy game**. Six civilizations vie across the ancient
world: found cities, work the land, research a tech tree, field era‑appropriate
armies, and win by domination or by score at the turn limit.

- **Deployed:** https://classicalgame.vercel.app (Vercel project **`classicalgame`**).
- **Ultimate goal:** ship to **BOTH** the web AND an installable app (PWA shell
  already present: `manifest.webmanifest`, `sw.js`). This is why the stack stays
  **web‑first** — everything runs in the browser with no native engine.
- **Design pillars:** historically accurate; deterministic engine; the only luck
  is weather; meta‑progression via a card collection that is **strictly NOT
  pay‑to‑money‑wins** (money only skips grind).

---

## 2. Tech stack & architecture

Three layers, cleanly separated:

1. **Deterministic TypeScript engine** — `src/engine/`. Pure `(state, action) → newState`,
   fully JSON‑serializable, no rendering/DOM. This is the source of truth for all
   rules. Runs headless and is unit‑tested.
2. **Three.js 3D board** — `src/render3d/board3d.ts`. A real WebGL scene (terrain
   elevation, a sun with shadows, orbit camera, fog of war, weather, unit/city
   models). Everything is **procedural geometry generated in code** — no external
   3D assets required (an optional glTF loader path swaps in `.glb` files if present).
3. **DOM app / UI** — `game.html` + `game.css` + `game.js` (a large IIFE) plus
   `audio.js`. This is the actual game client: menus, HUD, city/unit panels,
   research tree, cards, accounts, and it drives the engine + board.

**No framework** (no React/Vue). No native game engine (no Unity/Godot). Just
TypeScript compiled with **esbuild**, and Three.js.

### Data flow
`game.js` holds a `state` (from the engine), builds a **view** object, and calls
`board3d.render(view)`. User actions become engine **actions** dispatched through a
central `apply(action)` in `game.js`, which calls `engine.applyAction(state, action)`,
re‑renders, runs AI turns, and saves.

---

## 3. Build, run, test, deploy

| Task | Command |
|---|---|
| Type‑check | `npm run typecheck` (`tsc --noEmit`) |
| Engine + game tests | `npm test` (node's test runner via `tsx`) — **109 tests** |
| Build the web bundle | `npm run build:web` → wipes/rebuilds **`public/`** (gitignored) |
| Deploy | Vercel runs `vercel-build` → `build:web`; serves `public/` |

- **`scripts/build-web.mjs`** copies `game.html`, `game.css`, `game.js`, `audio.js`,
  `gallery.html`, `board3d.html`, PWA files, and **esbuild‑bundles** the engine
  (`web/engine.bundle.js`, exposed as `window.HEGEMON` / `engine`) and the board
  (`web/board3d.bundle.js`) into `public/web/`. It also copies `assets/models/*.glb`
  and sliced sprites if present.
- **`public/` is gitignored** — Vercel rebuilds it. Source of truth is the repo.
- **Dependencies:** `three` (+ `@types/three`). **Dev:** `esbuild`, `playwright`,
  `tsx`, `typescript`, `pngjs`.

### How changes are verified (established workflow)
- `npm run typecheck` (board3d/engine are TS) + `node -e "new Function(fs.read('game.js'))"`
  to syntax‑check `game.js`/`audio.js` (they're plain JS, not type‑checked).
- `npm test` for engine rules.
- **Playwright + `channel:"msedge"`** with WebGL flags
  `--use-gl=angle --use-angle=swiftshader --ignore-gpu-blocklist`, served from an
  inline Node http server over `public/`, logging in as **admin / 1234567**, to
  smoke‑test the real client and take screenshots. Temp scripts live in the
  session scratchpad or a throwaway `_verify.mjs` (deleted after).

---

## 4. Repo layout (key files)

```
src/engine/
  index.ts        # THE engine: applyAction + all rule logic, yields, combat, end-turn
  data.ts         # TERRAIN, WEATHER_STATES, TECHS, UNITS, BUILDINGS, IMPROVEMENTS,
                  #   RESOURCES, TECH_CITY_YIELD, counters/categories
  types.ts        # GameState, actions (the GameAction union), rules interfaces
  pathfinding.ts  # movementCost + findPath (roads, rivers, embarking, mountains)
  mapgen.ts       # random maps: MAP_SIZES, CIV_ROSTER, terrain bands, resources
  ai.ts           # the opponent AI (chooseAiAction / runAiTurn)
  visibility.ts   # fog of war (computeVisibility; discovered persists in state)
  events.ts       # one-time "Crossroads" event cards
  hex.ts, rng.ts  # axial hex math; seeded deterministic RNG
  scenarios/      # hand-authored maps: italia, hellas, oikoumene, oldworld + atlas.ts
src/render3d/board3d.ts   # the Three.js board (all procedural models + weather)
game.html / game.css / game.js   # the DOM client (game.js is the big IIFE)
audio.js          # procedural Web Audio engine (window.HGAudio)
gallery.html      # standalone 3D showcase of all civ units + city tiers
scripts/build-web.mjs      # the web build
test/*.test.ts    # 9 suites (engine, combat, economy, ai, buildings, events,
                  #   mapgen, scenario, visibility)
```

Docs already in repo: `ROADMAP.md`, `KNOWN-ISSUES.md`, `HEGEMON_Game_Design_Brief_v1.md`,
`docs/ASSET-LIST.md`, `docs/SCREENSHOTS.md`, `DEPLOY_VERCEL_AZURE_PLAN.md`.

---

## 5. Game systems (current behaviour)

### Map & terrain
- **Axial hex** grid. Offset→axial: `q = col - ((row - (row&1))>>1), r = row`.
- **Terrain:** `plains, valley, forest, hills, mountains, desert, coast, sea`.
  Each has move cost, yields, defense, vision. Mountains are **impassable without
  the `mountain-paths` tech**; deep `sea` needs `open-sea-sailing`.
- **Map sizes:** small 15×13, medium 21×18, large 27×24, **huge 48×38 ("ludicrous")**.
  `state.costScale = mapCostScale(w,h)` (≈`clamp(sqrt(area/378),1,3)`) scales
  research **and** build costs so bigger maps take proportionally longer.
- **Scenarios (hand‑drawn):** `italia`, `hellas`, `oikoumene` (the whole
  Mediterranean world, fill‑then‑carve so Britannia is an island, Italy joins
  Europe over the Alps, Iberia joins Gaul over the Pyrenees), `oldworld`.

### Civilizations (6)
`rome` (Rome, #c0392b), `carthage` (Carthage, #8e44ad), `greece` (**Athenians**,
#2e86de), `egypt` (Egypt, #d4ac0d), `gaul` (Gaul, #27ae60), `parthia` (Parthia,
#e67e22). Each has a **signature unit tech** and a **signature doctrine tech**
(see §6). A civ's unique techs are hidden from other civs in the tech tree.

### Units (45 — v2 roster)
Common: `warrior, archer, spearman, swordsman, horseman, siege, trireme, merchant,
settler`. **Each of the 12 civs has 3 unique units** (`units-v2.js`), gated by
`civ` + `requiresTech` (the unlocking branch tech, or a trunk tech + `civLocked`).
Wave‑1 (playable) uniques include Rome `velites`/`legionary`/`praetorian`, Athens
`peltast`/`hoplite`/`athenian-trireme`, Parthia `horse-archer`/`cataphract`/
`camel-train`, etc.; wave‑2 civ units (spartiate, phalangite, immortal, crossbowman,
companion‑cavalry, …) exist but are inert until those civs are playable. Stats are
derived from a base unit + numeric mods; the **`special` behaviours are STUBBED**
(base stats only — see §8). **Elite caps:** `UnitRule.buildCap` limits how many a
player may field/queue (praetorian ≤2, spartiate ≤4), enforced in `BUILD_UNIT`.
Categories drive rock‑paper‑scissors counters (infantry/spear/heavy/mounted/ranged/
siege/support). Units carry **upkeep**. Each new unit renders on its **category
rig** today; distinct per‑unit 3D silhouettes (`UNIT_SILHOUETTES`) are a visual
follow‑up.

### Combat
`computeCombatPreview` (deterministic) → damage both ways, with modifiers:
veterancy, flanking, river‑crossing penalty, terrain defense, category counters,
Combined Arms, weather (fog −5%), ranged **no‑retaliation** at range, and the
**civ doctrines** (Testudo, Phalanx Wall, Furor, Thalassocracy, Parthian Shot).
Killing a defender promotes the attacker's veterancy and **advances melee units
into the tile**. Cities have HP and repair when not besieged.

### Movement
- `movementCost` per step; **roads cost ½** a move (twice the distance) and bridge
  rivers with `engineering`; rivers act as roads along a bank.
- **A fresh unit may always take one step** onto an adjacent passable tile even if
  it can't afford the terrain (so a 1‑move siege isn't boxed in).
- **Embarking:** land units go to sea only with `sailing`, and only from a city
  with the Harbour building **or** beside a built **Harbour improvement**.
- **Stacking:** moving onto a friendly unit **combines them into one army** (the
  engine fights stacks as a combined force); clicking a stack cycles its units;
  3D fans them out with a `⚔×N` badge.
- **Roads & Logistics** tech gives every land unit +1 movement.

### Research / tech tree (see §6 for the full list)
- **Shared trunk + civ‑unique BRANCHES (v2, `docs/HEGEMON-TECHTREE-v2.md`).** The
  shared trunk (bronze, writing, irrigation, philosophy, forks, …) is unchanged.
  On top, each civ has a named **branch** of ~10 techs ending in a **capstone
  doctrine** (Rome *Via Romana* → Testudo, Athens *School of Hellas* → Wooden Walls,
  etc.), interleaved with the trunk via prerequisites (e.g. `legionary-system`
  needs trunk `iron-working` + branch `castra`). Branches are hidden from rival
  civs. The 12 signature unit/doctrine techs were **absorbed** into their branch
  (same ids, new prereq edges → old saves still load). Data of record:
  `src/techs-v2.js` → generated into typed `src/engine/branch-data.ts` by
  `scripts/gen-branch-data.mjs`, merged into `TECHS` at `data.ts` load.
- Deep tree across 3 ages (Villages / Kingdoms / Empires) with prerequisites and a
  few **forks**. Base costs by age **20 / 46 / 82**, ×`costScale`. `rhetoric` −15%.
- **Effects:** trunk techs and the six existing doctrines all have concrete engine
  effects. For the ~90 new branch techs, **`cityYield` is wired** (into
  `TECH_CITY_YIELD`; `cityYield.stability` now routes to **`TECH_STABILITY`**, a
  real per‑city stat as of Phase 5 — no longer a `+gold` stub); `unlocks` gate
  units/buildings via `requiresTech`. **Combat %,
  `capitalYield`, `buildingBoost`, `upkeepPct` and every `special:` hook are
  FLAGGED, not built** (their `effect` block is carried on the tech for later
  wiring). The AI research picker (`ai.ts`) is **branch‑aware** (own branch ×1.5,
  economy trunk early, capstone only with a real army).
- The UI tech tree (`game.js`) reads a tech's name/note from `TECH_INFO` or falls
  back to the engine's merged data; branch techs get a civ‑colour edge, capstones a
  gold glow. The full tech‑tree UI redesign is Phase 7.

### Economy
- Cities produce food/production(labour)/gold/science each turn from terrain, pop,
  buildings, worked improvements, and resource deposits in their territory.
- **Buildings (12):** granary, workshop, market, library, walls, harbor, temple,
  academy, lyceum, aqueduct, barracks, amphitheater.
- **Tile improvements (9):** `farm` (needs Irrigation), `pasture` (Animal Husbandry),
  `lumber-camp` (Bronze Working), `mine` (needs an iron/silver **deposit**),
  `quarry` (Metallurgy + stone deposit), `vineyard` (Pottery), `trade-post`,
  `fishery` (Sailing + fish deposit), `harbour` (Sailing; a coastal port hex that
  lets armies embark). **Roads** need Masonry. Improvements are built through a
  city's labour queue.
- **Resources (9):** grain, fish, coral, timber, iron, stone, horses, wine, silver.
  A worked deposit adds yields (and discounts the builds that need it).
- **Idle labour → coin:** a city with an empty queue sells surplus production above
  a small reserve for gold, so cities don't hoard hundreds of unspendable labour.
- **Trade routes** (merchants) pay gold every turn; **harbours** form a trade
  network. Population grows from banked food.

### Weather (the only luck)
- Five states: `clear, rain, fog, storm, heat`, generated **per region** as
  **multi‑turn "fronts"** (`WEATHER_FRONT = 4`, staggered per region) so it settles
  in rather than flickering.
- Effects: rain slows mounted + rivers; fog −vision/+ambush and −5% ranged damage;
  storm blocks/damages deep‑sea ships; heat causes desert attrition (negated by
  `caravan-logistics`).
- **Mediterranean climate:** `randomWeather` is ~64% clear, 16% heat (dry summer),
  10% rain, 5.5% fog, 4.5% storm; weather still holds in ~4‑turn fronts.
- **3D visuals:** the sky dome, sun, fog and sea colour shift to the home region's
  weather (clear = bright blue with a sun on the horizon; overcast = grey + drifting
  clouds); **rain** falls as dense streaks over the actually‑wet tiles; **fog** rolls
  in as ground mist; **storms** flash lightning. No weather text bar (removed).
- **The sea renders FLAT** — coast and open water sit at one level (thin slabs);
  depth is shown by colour only, and water is kept unambiguously blue (no warm
  ownership/dim wash, which used to read purple).

### Cities (3D) — 10 tiers, 12 styles
Procedural generator `src/render3d/cityModels.js` (design of record
`HEGEMON-VISUALS-v2.md §1`): `buildCity(THREE, {tier, style, seed, accent})`.
board3d calls it for every city with `tier` from population (thresholds 1/3/6/10/
15/21/28/36/45/55 → tiers 1–10: Hamlet → Wonder of the age), `style` = civ id (12
architectural identities), `seed` from hex coords (stable look), `accent` = the
player colour (tier‑5+ banner). Walls appear from tier 4 (Sparta only from t8,
Scythia rings wagons instead); monuments from t6, civ landmark from t8, gilding at
t10. `gallery.html` has a **12‑style city row + a tier slider (1–10)** to art‑direct.

### Fog of war
`state.discovered` (per player) persists what's been seen. Undiscovered tiles are
flat/blank; seen‑but‑not‑visible keep their discovered colour, dimmed (water dims
toward deep blue so it doesn't read purple). Your own territory is always in view.
Admin can toggle **Reveal map** for testing.

### Accounts & meta‑progression (client‑side)
- **localStorage** accounts (`hegemon_accounts`, salted + SHA‑256 via SubtleCrypto),
  session (`hegemon_session`), per‑account profile (`hegemon_profile__<user>`).
  Seeded **admin**: name `admin`, email `mclear@gmail.com`, password `1234567`
  (intended to be changed). Tracks wins/losses.
- **Cards v2** (design of record: `docs/HEGEMON-CIVS-CARDS-v2.md`; data of record:
  `src/cards-data-v2.js`, an ES module the build turns into the browser global
  `window.HEGEMON_CARDS_V2` — see `scripts/build-web.mjs`, loaded before `game.js`).
  Card kinds: **civ** cards (30, waves 1–3, a `playable` flag), **Legends** (68 —
  historical people with a role: commander/statesman/sage/builder/navigator),
  **Edicts** (18 policy cards), **Events** (9 one‑use), plus **cosmetics**. Rarities
  starter/common/rare/epic/legendary; earned via coins/packs/daily. Rendered as
  **playing cards** (art slot, name, benefit text). **Never pay‑to‑win**.
  - **Loadout (v2):** exactly **one Legend + one Edict + one Event**, all
    civ‑matched (universal `civ:null` always applies). `profile.loadout` is
    `{legend,edict,event}`; only slots matching the played civ take effect (the
    hand marks mismatches inactive).
  - **Effect mapping:** the declarative effect vocabulary (`docs` §7 / the data
    file's EFFECT KEYS) is translated in `game.js`. **Today the engine only has one
    card hook — flat per‑turn `player.perks`** — so only `capitalYield`/`cityYield`
    map (per‑city is approximated as flat). **`stability` now maps to the real
    `perks.stability`** (Phase 5 un‑stub; feeds every city via
    `computeCityStability` — no longer approximated as `+gold`). Everything else
    (combat %, cost %, movement, heal, plunder, trade‑route gold, all `special` /
    `instant`) is **flagged** on `card.flags`, not applied. Two event instants
    (+food to capital, +science) work; the rest are flagged and not consumed.
  - The **five civ‑signature DOCTRINE techs** (Testudo etc.) are a separate engine
    system (see §6), unrelated to these person/policy cards.

### Audio (procedural, `audio.js` → `window.HGAudio`)
Everything **synthesized** with the Web Audio API (no files, no copyright — do NOT
rip YouTube). Ancient/modal music bed, continuous weather ambience (rain/storm +
thunder), forest wind + birdsong, and one‑shot SFX (march thump, combat clang,
build, research chime, coins, UI clicks). Boots on first user gesture; 🔊 topbar
button toggles it.

### Admin map editor
Signed in as admin: **☰ Menu → account → 🖉 Map editor** — a terrain palette to
click‑paint tiles on the live map, and **Export atlas** to dump the map as an
offset ASCII grid to paste into a scenario file.

### Tech‑tree UI (`docs/HEGEMON-TECHTREE-UI-SPEC-v2.md`, v2.1 swimlanes)
The research modal (`renderTechTree` in `game.js`, `.tt*` in `game.css`) is a
**swimlane grid**: rows = the five **tracks** (`TT_TRACKS`/`TT_TECH_TRACK` —
military/construction/economy/civic/naval), columns = the three eras; each
track×age cell lays its chain left‑to‑right by same‑age depth. Techs behind a
**closed era gate** render as **name‑only dashed chips** (`.tt-chip`, no icon/
effect/cost/connectors); once the gate opens they become full **`.tt-node`**
cards (icon, name, one‑line effect, real cost pill). **Era‑gate badge** per era
header (`.tt-gate`, `cur/req`, amber; `.near` pulses one‑away, `.open` gold); a
gold **"The age of X begins" toast** (`showCombatToast(...,"gate")`) fires in
`render()` on the closed→open flip (tracked in `ttGateAnnounced`). The
**civ branch band** (dashed `--civ`, name from `engine.BRANCHES`, done/total,
crowned capstone) is unchanged below the grid. **Connectors** (`drawTechLinks`):
only between full cards (chips never enter `ttNodeById`); same‑row = straight,
else orthogonal routed through clear row/column channels (gaps in the union of
node rects); cross‑track = coral dashed. Hover still lights the full prereq
chain (`highlightTechChain`). **Background is `--ground`, NOT `--ink`** (in this
codebase `--ink` was repointed to parchment in Phase 6 — that was the "parchment
background" §6 bug). Engine exposes `AGE_GATES`, `techTier`, `BRANCHES` to the
browser. **Known gap:** connectors render *behind* the opaque cards so none show
over a card, but the strict §7a geometric zero‑intersection isn't met (edges into
deep chained nodes route under cards); true zero needs a sub‑column‑aligned grid.

### UI design system (`docs/HEGEMON-UI-SPEC.md`, Phase 6)
The DOM client (`game.html`/`game.css`/`game.js`) uses one design language:
**carved stone, bronze, gold, civ colour** on an ink ground — the old "aged
papyrus" menu/HUD skin is gone. Tokens live in `:root` (`--ink/--panel/--panel-2/
--line`, `--parchment/--muted/--faint`, `--gold/--gold-dim/--bronze`, semantic
`--ok/--bad/--sci/--food/--prod/--coin`, `--civ`, `--display`/`--body`, `--r/--r-lg`).
**Key lever:** the ~40 legacy `--papyrus*`/`--ink`/`--ink-soft` references were
*repointed* (papyrus→stone, ink→parchment text, ink‑soft→gold) so every old
surface flipped at once; the few hardcoded light gradients were patched by hand.
**Civ accent:** `<body data-civ="…">` (set each frame in `render()`) maps to `--civ`
via a 12‑civ CSS block; it floods the turn‑pill border and the context‑panel edge.
**Icons:** an inline‑SVG sprite in `game.html` (`#ic-wheat/hammer/coin/flask/shield/
people/laurel`, `currentColor`) replaces the resource‑HUD emoji; `renderHud` tags
each chip `r-<key>` so numbers+icon wear their resource colour. Motifs (`.meander`,
`.rule`, `.civ-edge`) are pure CSS; the gold meander crowns full‑screen surfaces
(auth, menu) and theatrical modals (event/hand) only. Buttons: base = stone
secondary (gold hover border), `.primary-btn` = gold fill / ink text / serif caps
(one per screen). Tabs are text + 2px gold underline. `prefers-reduced-motion` and
`env(safe-area-inset-*)` are honoured. **Deferred (net‑new IA, not restyle):** a
distinct pause menu (Resume/Save/Load/Concede + ESC toggle) and Continue/scenario
tiles per §5, the slim bottom‑centre unit **selection footer** (still the right‑side
panel), a dedicated settings panel, and emoji→SVG beyond the HUD.

---

## 6. Data reference — techs

All in `src/engine/data.ts`. **Age I** (villages), **II** (kingdoms), **III** (empires).

**Shared:** `bronze-working` (→Spearman, Lumber Camp), `sailing`, `writing`
(+1 sci/city, Library, economy fork), `masonry` (Walls, **Roads**), `archery`,
`irrigation` (Farm, →Crop Rotation), `animal-husbandry` (Pasture), `pottery`
(Temple, Vineyard), `iron-working` (Swordsman), `combined-arms` (combat bonus),
`open-sea-sailing` (Trireme, deep sea, naval fork), `engineering` (bridges,
→Mountain Paths), `horseback-riding` (Horseman), `mountain-paths`,
`caravan-logistics` (no desert attrition), `mathematics` (+1 labour/city, Academy),
`philosophy` (+1 sci/city, Lyceum), `metallurgy` (Barracks, Quarry), `aqueducts`
(+1 food/city, Aqueduct), `astronomy` (+1 sci/city), `crop-rotation` (+1 food/city),
`roads-logistics` (+1 move to land units), `siegecraft` (Siege Ballista),
`medicine` (+3 heal/turn), `law-administration` (+1 gold/city), `currency-reform`
(+1 gold/city), `cartography`, `rhetoric` (−15% research cost), `assimilation`/
`tribute-empire` (imperial fork), `republic`/`monarchy`, `temple-economy`/`coinage`,
`phalanx-doctrine`/`skirmish-doctrine`, `ramming-fleets`/`merchant-marine`.

**Civ signature UNIT techs:** `legionary-system` (Rome), `hoplite-phalanx` (Greece),
`chariotry` (Egypt), `war-elephants` (Carthage), `iron-mastery` (Gaul),
`horse-archery` (Parthia).

**Civ signature DOCTRINE techs (distinct effects):**
- **Rome — `testudo`**: Roman infantry +50% def vs ranged/siege, +20% melee.
- **Greece — `phalanx-wall`**: spearmen +35% def (+60% vs cavalry).
- **Egypt — `nile-bureaucracy`**: +1 food & +1 science per city.
- **Carthage — `thalassocracy`**: warships +30% combat and cost 25% less.
- **Gaul — `furor`**: infantry/warbands +35% attack.
- **Parthia — `parthian-shot`**: mounted archers take no return fire and keep half
  their move after shooting; +20% attack.

`TECH_CITY_YIELD` (per‑city flat yields): philosophy, mathematics, astronomy,
aqueducts, law-administration, currency-reform, crop-rotation, nile-bureaucracy.

---

## 7. Conventions & working agreements

- **Commits:** end the message with
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
  Push to `origin/main` is authorized each increment; commit messages are the
  detailed changelog. Line endings warn LF→CRLF on Windows (harmless).
- **Keep science yields unchanged** when deepening research — add layers/costs, not
  fewer points.
- **Default board is 3D.** Keep the stack web‑first (weighs against native engines).
- **Cards are never pay‑to‑win.**
- **Verify before claiming done** (typecheck + tests + Playwright smoke).
- Working style the user asked for: **answer/ask first and wait for an explicit
  go‑ahead** before large or ambiguous work; double‑check; don't assume scope.

---

## 8. Session history (recent major work, newest first)

The last push of work (see `git log` for exact diffs) delivered, roughly:

- **Tech tree v2.1 — research economy + swimlane UI** (`docs/HEGEMON-TECHTREE-UI-SPEC-v2.md`).
  *Engine (commit 38dce62):* §2 hard AND‑prereqs (tightened trunk), §3 **era gates**
  (`AGE_GATES` 2:5/3:6 in `canResearch`), §3b **depth‑tiered costs** (age×tier×costMod,
  replaces flat 20/46/82 → entries 13/32/62, capstones 125, −11%), §3c **linearised
  within‑age track chains** (`TRUNK_CHAINS` overlay) so the trunk frontier stays ≤10.
  *UI:* rewrote the research modal into a **swimlane grid** (5 track rows × 3 era
  columns), gated techs collapse to **chips**, **era‑gate badges** + gold open‑toast,
  cost pills show the real tiered cost, connectors re‑routed through clear gutters
  (behind opaque cards), §6 dark‑ground fix. *AI:* uses `canResearch` (gate‑legal) +
  a **value‑per‑cost** term. New `test/techtree-v2.test.ts` (AND‑prereq, gate, cost
  formula, 30‑tech frontier sim). 127/127 tests. **Balance decisions on record:**
  monarchy trades the Age III civic trunk line (sits behind republic) for its other
  strengths; ≤7 frontier ruled infeasible with 5 tracks + civ branches (shipped ≤10);
  strict §7a zero‑intersection connectors deferred (need sub‑column alignment).
- **Elevation system — visual half (commit 1 of 2).** Terrain now rises in clear
  terraces and **mountains carry snow‑capped twin‑spike peaks** (`buildPeak` in
  `board3d.ts`; `TERRAIN_ELEV` raised — sea/coast L0, plains/valley/desert L1,
  forest L2, hills L3, mountains L5). Mapgen was producing near‑zero mountains, so
  `mapgen.ts` got elevation **contrast** (`×1.35` around 0.5) + lower thresholds
  (mountains >0.82, hills >0.64) → ~0–9% mountains / 12–33% hills (a spine, not a
  wall). **Rain fix:** the falling‑rain volume now shows only when ≥34% of *visible*
  tiles are wet (was ≥1 tile → constant flicker); rain rarer (10→7%) and fronts
  longer (`WEATHER_FRONT` 4→6). *Chosen design for the pending **movement half
  (commit 2)**: level derived from terrain; ascent limited to +1/step (descend
  free); level‑3 entry costs the whole turn; level‑5 peaks impassable; Mountain
  Paths still crosses L3–4. Not built yet — awaiting review of the visuals.*
- **HEGEMON v2 — PHASE 7 (Tech‑tree UI).** Per `docs/HEGEMON-TECHTREE-UI-SPEC.md`,
  rebuilt the research modal into the approved layout: **3 era columns** of shared
  trunk + a **civ‑unique branch band** ("Via Romana" etc. from `engine.BRANCHES`,
  now re‑exported), four node states, a one‑line effect per node, cost pills, a
  **capstone** crown, and a **bezier connector layer** (`<svg.tt-links>`,
  `drawTechLinks`) with done/next/branch link colours. **Hover‑lights the full
  prereq chain** (nodes + links) and dims the rest; rival branches aren't rendered.
  Smoke on a fresh Rome game: 38 trunk + 11 unique nodes, 1 capstone, 43 connector
  paths, band "Via Romana 0 / 11", 0 rival nodes, 0 page errors. typecheck clean,
  123/123 tests. See §5 "Tech‑tree UI".
- **HEGEMON v2 — PHASE 6 (Menu/HUD restyle).** Per `docs/HEGEMON-UI-SPEC.md`,
  migrated the whole DOM client to one **carved‑stone / bronze / gold / civ‑colour**
  design language (was "aged papyrus"): added the §1 token system to `:root`,
  repointed the ~40 legacy `--papyrus*`/`--ink`/`--ink-soft` refs so every surface
  flipped at once, and hand‑patched the few hardcoded light gradients. Restyled
  the top bar, resource HUD (SVG icon sprite + resource‑coloured chips), turn pill
  (civ border), End‑Turn (gold serif), the right‑side city/unit context panel
  (civ‑edge, gold section heads, gold‑underline text tabs), the menu/setup overlay,
  auth card, briefing, and all modals (event/hand get a gold meander crown). Added
  `<body data-civ>` (§7.4, set in `render()`), the `.meander/.rule/.civ-edge` motifs,
  `prefers-reduced-motion`, and `env(safe-area-inset-*)`. No engine change — 123/123
  tests, typecheck clean, screenshot smoke clean (auth/menu/HUD/panel/research/hand).
  See §5 "UI design system" for the deferred net‑new IA (pause menu, unit footer,
  settings panel, Continue/scenario tiles).
- **HEGEMON v2 — PHASE 5 (Stability, phase 1).** Per `HEGEMON-VISUALS-v2.md` §3:
  added a **per‑city stability stat** (`computeCityStability`, clamped −5..+5).
  **Sources wired:** buildings (temple/amphitheater/forum +1 each), owner techs
  (`TECH_STABILITY`, un‑stubbed from the Phase 2 gold approximation), card perks
  (`perks.stability`, un‑stubbed from Phase 1), **garrison** +1, and **recently
  captured** −2 decaying 1/turn (new `City.capturedTurn`). **Effect wired:** each
  point shifts *all* city yields **±2%** and **+3 grants +1 labour** (in
  `computeCityYield`). **UI:** a **🌿 laurel** on the city panel (green/grey/red)
  + the deck perk preview. New `test/stability.test.ts`. Exposed via
  `browser-entry`/`window.HegemonEngine`. **FLAGGED / phase 2:** war‑weariness
  (no war‑state tracking yet), starving −2, and the unrest (−3) / revolt (−5)
  events — sources+yield only for now. Science yields unchanged.
- **HEGEMON v2 — PHASE 4 (City models) + sea/weather polish.** Wired the new
  procedural city generator (`cityModels.js` `buildCity(THREE,{tier,style,seed,accent})`)
  into board3d — every city now renders at one of **10 tiers** (pop thresholds
  1/3/6/10/15/21/28/36/45/55) in one of **12 architectural styles**, seeded by hex
  coords; added a `.d.ts` so the pure‑TS engine build resolves the `.js`. Added the
  12‑style **city row + tier slider (1–10)** to `gallery.html`. Also: the **sea is
  now flat and blue** (thin slabs, one level, no purple ownership/dim wash) and the
  **weather is Mediterranean** (clear‑dominant, rain rare). Verified via Playwright
  gallery screenshots at tiers 1/5/10.
- **HEGEMON v2 — PHASE 3 (Units roster).** Added the **25 remaining unique units**
  (`units-v2.js`; 3 per civ, minus the 6 pre‑existing and 5 added in Phase 2) to
  `data.ts` with stats from `basedOn`+mods, `requiresTech`=unlockedBy, `civLocked`
  handled via civ+trunk‑tech, and build costs. Added **elite build caps**
  (`UnitRule.buildCap`, enforced in `BUILD_UNIT`: praetorian ≤2, spartiate ≤4) and
  a `support` category (camel‑train). New `test/units.test.ts`. Every new unit
  **renders on its category rig** (unitForm handles them; armoured‑elephant → the
  elephant rig, camel‑train → civilian). **STUBBED:** all `special` unit behaviours
  (retreat‑after‑attack, elite auras, terrain conditionality, camel resupply,
  upkeep‑in‑food, target‑terrain‑def‑halved, spawns‑vet, never‑retreats, …) ship as
  base stats only. **DEFERRED:** distinct per‑unit 3D silhouettes (the prop/palette
  variations in `UNIT_SILHOUETTES`). Phases 4–5 (cities, real stability) NOT started.
- **HEGEMON v2 — PHASE 2 (Tech‑tree data merge).** Per `HEGEMON-TECHTREE-v2.md` §3:
  merged the **12 civ‑unique branches (121 techs)** into `TECHS` (via generated
  `src/engine/branch-data.ts`), **absorbed** the 12 signature ids with new branch
  prereqs (old saves load), reassigned **phalanx‑wall → Sparta** and gave **Athens
  a new capstone `wooden-walls`**, added the **5 branch units** (cataphract wave‑1;
  spartiate/phalangite/immortal/crossbowman gated to wave‑2 civs) + the **forum**
  building, wired branch **`cityYield`** (stability→`TECH_STABILITY` since Phase 5;
  was a gold stub) and `unlocks`, made
  the **AI branch‑aware**, and adapted the tech‑tree UI (name/note fallback + branch
  colour + capstone glow). New `test/branches.test.ts` (§3.10 validity). *Combat %,
  capitalYield, buildingBoost, upkeepPct and all `special:` hooks are FLAGGED, not
  built. Phases 3–5 (units roster/models, cities, real stability) NOT started.*
- **HEGEMON v2 — PHASE 1 (Cards migration).** Per `docs/HEGEMON-CIVS-CARDS-v2.md`
  §7 and the `CLAUDE-CODE-HANDOFF.md` five‑phase plan: **Generals → Legends** (68) +
  new **Edicts** (18), v2 **Events** (9) and **30 civ cards** (waves 1–3); the
  loadout is now exactly **1 Legend + 1 Edict + 1 Event** (civ‑matched); **Greece →
  Athens** display (id kept); the **4 edict renames** from `HEGEMON-TECHTREE-v2.md`
  §3.3 (Royal Road→Angarium Couriers, Arthashastra Statecraft→Spy Network,
  The Agoge→Laconic Discipline, Companion Cavalry→Hetairoi Honours). Effects map
  only to the flat‑yield `perks` hook; **`stability` is stubbed as `+gold`**; all
  other effects are **flagged, not built** (awaiting Phase‑2+ engine hooks — see the
  handoff). Data pipeline: `src/cards-data-v2.js` → `window.HEGEMON_CARDS_V2` via the
  web build. *Phases 2–5 (tech‑tree merge, units, cities, real stability) NOT yet
  started — await authorization.*
- **Research revamp** — every civ got a **signature doctrine** with a distinct
  effect (Testudo/Phalanx Wall/Nile Bureaucracy/Thalassocracy/Furor/Parthian Shot);
  every tech now has a concrete effect (per‑city yields, medicine heal, rhetoric
  cheaper research, roads‑logistics +move); improvements gated behind research
  (Farm/Pasture/Lumber/Road) and deposits (Mine/Quarry/Fishery); roads made ½‑move;
  weather turned into multi‑turn **fronts** with fog mist + storm lightning; costs
  steepened by age; tech tooltips state each EFFECT.
- **Unit control** — siege/slow units always get one step; **combine armies** by
  moving onto a friendly; **Disband** action.
- **Cards** redesigned as **playing cards** (art slot, name, benefits).
- **Coastal economy** — buildable **Harbour** & **Fishery** on water hexes, **Coral**
  resource; idle cities sell surplus labour for gold.
- **Procedural audio** engine; rain made continuous.
- **Weather‑driven 3D** (sky/sun/light/sea), **health bars**, real movement
  animation, army stacking, HUD cleanup (End Turn by the turn pill, no status box).
- **Oikoumene** Mediterranean map rebuilt for real connectivity; **admin map editor**.
- Fixes: out‑of‑sight/owned sea reading purple; health bar drawing twice.

---

## 9. Known gaps / things to watch

- Gating early improvements behind tech makes the **opening economy slower**; may
  want civs to **start** with 1–2 foundational techs if it feels too slow.
- The **AI** researches techs in list order and may under‑prioritise economy techs;
  its improvement picker now respects tech + deposits.
- Card **art** is emoji placeholders in a ready “art slot” — drop in real images
  and wire the slot to load them.
- Roadmap for larger planned systems (deeper diplomacy, more scenarios, graphics
  upgrade to stylized low‑poly glTF) lives in `ROADMAP.md`; open issues in
  `KNOWN-ISSUES.md`.

---

*Keep this file honest and current. When you land a system‑level change, update the
relevant section here so the next session (human or AI) starts with the truth.*
