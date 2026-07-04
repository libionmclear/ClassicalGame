# HEGEMON — roadmap

Vision: a historically accurate classical-age (~800 BC–AD 117) hex strategy game
on a real 3D board. Everything should be grounded in history and, where it
matters, unique per civilization.

## Done
- 3D board (Three.js): nested pointy-top hex terrain with elevation, sun +
  shadows, tilt/orbit/zoom camera, fog of war, growing realm borders, sprites.
- Sprites planted on the ground: fit to art aspect, offset to the tile's
  camera-facing edge, with a contact shadow (no more floating cut-outs).
- Deeper research + civ-unique techs & signature units; new tech-gated
  buildings/improvements.
- In-play context menu: the command panel floats at the clicked tile and shows
  only the relevant groups (unit / city / tile).
- Unit upgrades: advance a base unit into its people's elite for gold.
- Flat, frontal, fixed-rectangular board by default (tilt removed); 3D is opt-in.
- HUD: compact top-left readout (Populus/Labour/Denarii/Scientia), standings
  openable bottom-right, a Research button that glows when a tech is ready.
- Mountains: +2 vision (see further), move cost 3 (slow), impassable without
  Mountain Paths.
- City borders grow with population: pop ≤2 → 1 hex ring, ≤5 → 2, else 3.
- Systems: per-city labour queues + rush-buy, tile improvements, roads, trade
  routes, harbours, amphibious embark, unit rest-healing, city repair, AI
  garrison/improvements/fleets, difficulty AI handicap + aggression.

## Next (big systems, roughly in priority order)

### Economy: strategic resources on the map
- Place basic resources on tiles: **wood, ore, stone, food**.
- Food drives population growth AND feeds troops (upkeep in food).
- Wood/ore/stone gate/lower the cost of buildings and units (e.g. ore for
  metal units, wood for ships/siege, stone for walls/monuments).
- Improving a tile (farm/mine/lumber/quarry) increases the resource it yields.
- Labour = people + workshops + tools, but capped by available resources.

### Research: deeper, historical, civ-unique
- Many more techs so science isn't exhausted mid-game; costs scale by age.
- Shared historical techs (agriculture, pottery, mathematics, astronomy,
  philosophy, medicine, rhetoric, metallurgy, engineering, aqueducts, currency,
  logistics, siegecraft, navigation, …).
- Civ-unique techs/doctrines that reflect what made each people distinct
  (Rome: the Legion, concrete, roads; Greece: philosophy, the phalanx,
  democracy; Carthage: merchant fleets, war elephants; Egypt: monumental
  building, Nile irrigation; Gaul: iron mastery, druidic lore; Parthia: horse
  archery, cataphracts).

### Units: more, unique, and upgradeable
- Civ-unique unit lines and upgrades — e.g. Rome swordsman → Legionary →
  Legionary cohort; Greek hoplite → phalangite; Carthaginian Sacred Band /
  war elephants; Egyptian chariots; Gallic warband / chieftains; Parthian
  cataphracts and horse archers. Study the real armies; keep it accurate.
- Upgrade action on a selected unit (spend resources/gold to advance a type).

### UI: everything on the play screen — DONE
- [done] Select a city → contextual city menu; unit → actions incl. upgrade;
  tile → improvements/info, as an on-board floating popover.
- [done] Research: a glowing indicator when a tech is available; click to open.
- [done] Standings: openable from the bottom-right.
- [done] Compact top-left resource readout (Populus, Labour, Denarii, Scientia).

### Graphics / 3D polish
- Redo the sprites with better, animated art (unit idle/attack, city bustle).
- Animation: units glide along their path; combat flashes/knock-back; camera
  eases to the action.
- Roads & rivers rendered in 3D (ribbons/waterways on the terrain).
- Terrain textures on the tile tops (grass, rock, sand, water) + per-tier
  sprite scaling and grounded drop-shadows.

### Assets pending
- Carthage & Parthia sprite sheets (drop into assets/sprites/sources/, then
  `npm run slice-sprites`).
