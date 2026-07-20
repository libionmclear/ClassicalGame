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
- Strategic resources on the map (v1): deposits with bonus yields + on-board
  badges; deeper mechanics (food upkeep, resource-gated builds) are phase 2.
- Player profile + stats + badges (local): games/win-loss, per-civ win-rate, and
  achievement badges, saved on device and recorded at each game's end.
- Mountains: +2 vision (see further), move cost 3 (slow), impassable without
  Mountain Paths.
- City borders grow with population: pop ≤2 → 1 hex ring, ≤5 → 2, else 3.
- Systems: per-city labour queues + rush-buy, tile improvements, roads, trade
  routes, harbours, amphibious embark, unit rest-healing, city repair, AI
  garrison/improvements/fleets, difficulty AI handicap + aggression.

## Next (big systems, roughly in priority order)

### Frontiers of the unknown (what sets HEGEMON apart) — see docs/HEGEMON-RAIDERS-v1.md
Three unknowns beyond fog-of-war, revealed only through play, that interlock:
- [done, slice 1] **The Sea Beyond — off-grid corsairs.** Raiders gather beyond the
  map's edge (the open-sea belt) and fall on a coastal city: warned a turn ahead,
  then struck (repelled / sunk by a warship / pillaged). Respond by defending or
  paying tribute. You never see their home. Fully seeded + lockstep-safe.
- [next] **Hunt the haven.** Sail past the lost-at-sea distance (with Navigation or a
  figure's boon) to reach the raiders' island + lost-island treasure. Raid fleet as
  an intercept-able unit at sea.
- [planned] **The Land Beneath — prospecting.** Deposits start hidden (like ruins),
  uncovered by exploring/settling/a tech; rare finds (marble, silver, naphtha) unlock
  unique options. Makes city placement a gamble.
- [planned] **The Minds of the Age — historical figures.** Archimedes (burning
  mirrors vs a raid fleet / siege / buoyancy), Pytheas (belt passage), a prospector
  (reveal deposits) — arrive from how you play, drop a card into your collection.

### Economy: strategic resources on the map
- [done, v1] Deposits scattered on tiles (grain, fish, timber, iron, stone,
  horses, wine, silver), placed deterministically on generated maps + scenarios,
  shown as on-board badges with tooltips. A city works the deposits in its
  territory for bonus yields (food / labour / gold).
- [done, phase 2] Food feeds troops: each soldier eats 1 food/turn beyond a free
  garrison of 1 per city; a deficit softly halts growth (no starvation). Net food
  shown in the HUD.
- [done, phase 2] Controlling a deposit gives -30% labour on the related builds
  (timber→ships/siege, iron→metal foot/barracks, horses→cavalry, stone→walls).
- [phase 3] Improving a resource tile increases what it yields; a full spendable
  stockpile (wood/ore/stone) if we want deeper consumption.

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

### Meta-game: profile progression + card collection (NOT pay-to-win)
Core rule: cards give at most a *small* advantage and everything is also earnable
by play; money only skips the grind, never buys power. Phases:
- [done] Profile + stats + badges (local / localStorage).
- [done] Card inventory + pack economy: a free daily **Standard** pack plus
  **Bronze/Silver/Gold** packs bought with coins (coins earned by playing; real
  money later). Every pack = 3 cards; higher tier tilts the odds toward good
  pulls. Card categories: civ-unlock, generals/governors, event (one-use),
  enhancers, and cosmetics. Unlock civs by finding their card (locked in the
  picker until then); cosmetics (crowns/emblems/titles) equip on the profile.
  Event & enhancer effects are placeholders for now.
- [done] Generals (Caesar, Augustus, Socrates, Xerxes, Cleopatra, Hannibal,
  Pericles, Alexander) — equip up to 3 for a small flat per-turn perk (engine
  `player.perks`, applied each turn, shown in the HUD income).
- Event cards (Vesuvius eruption, Nile flood) used once in-match; custom-picture
  cards; a rare Spartans people (now that Greece = Athenians).
- Backend: accounts/login, cross-device sync, anti-cheat inventory, real
  purchases. (Ties to the online + app goal.)

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
