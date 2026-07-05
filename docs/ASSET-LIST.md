# HEGEMON — 3D asset list

A complete, organized shopping/production list for the game's visuals, grounded in
what the engine actually has (terrains, resources, units, cities, civs). Target a
**stylized low-poly** look — great-looking *and* fast on web + mobile (see
[ROADMAP.md](../ROADMAP.md)).

---

## Where to get / make them

**Buy (best fit):**
- **Synty Store** (syntystore.com) — POLYGON *Ancient Empire / Egypt* packs. Best
  for civ soldiers & buildings. Paid, animated, game-ready (FBX → convert to glb).
- **Sketchfab Store** (sketchfab.com/store) — individual models that **download as
  glTF** directly (ideal for Three.js).
- **CGTrader / TurboSquid** — filter *low-poly + rigged/animated*.
- **itch.io** (game assets), **Fab** (fab.com) — indie packs, often cheap.

**Free (CC0 — safe to ship in an app):**
- **Kenney** (kenney.nl) — *Hexagon Kit*, *Nature Kit* → terrain tiles, trees, rocks.
- **Quaternius** (quaternius.com) — animated low-poly characters + animals.
- **Mixamo** (mixamo.com, Adobe) — auto-rig + animations (idle/march/attack/die).
- **Poly Haven / ambientCG** — HDRIs + PBR textures for lighting/tile tops.

**Create:** **Blender** (free) — model/rig/animate + convert FBX→.glb. AI 3D gens
(Meshy/Luma/Rodin) only for rough prototypes.

**Rules:** target **glTF / .glb**; confirm each asset's **license allows
distribution** (web + app); pick ONE primary art source per category for a
consistent style; keep tris low + textures atlased for mobile.

---

## 1. Terrain tiles (hex tops) — 8 base + variants
One low-poly hex tile per terrain, **2–3 variants each** for visual variety, plus
matching **cliff/edge** and **coastline** transition pieces.
- Plains (dry grass)
- Valley / grassland (lush)
- Forest (tree-covered hex)
- Hills (rolling, rocky)
- Mountains (peaks, snow caps on the tallest)
- Desert (sand, dunes)
- Coast (shallow water / beach)
- Sea (deep water)
- Extras: river tiles/segments, lake, oasis (desert), marsh/reeds, road-worn ground.

## 2. Water & sea levels — 4
- Deep sea surface (dark), Shallow coast (light/turquoise), River, Lake.
- Shore **foam/transition** ring, animated ripple/normal map (optional), waterfall.

## 3. Resource deposits (props on tiles) — 8 core
Match the engine's resources exactly:
- **Grain** — wheat field / sheaves
- **Fish** — shoal / fish jumping (on water)
- **Timber** — dense tree cluster (distinct from plain forest)
- **Iron** — dark ore outcrop / rusty rocks
- **Stone** — marble/boulder outcrop
- **Horses** — small herd
- **Wine** — grapevines / trellis
- **Silver** — glinting ore vein
- (Future luxuries: gold, gems, incense, ivory, dyes, salt.)

## 4. Vegetation, rocks & scatter (decorative) — ~20
- **Trees:** pine, oak, olive, cypress, palm (desert/oasis), poplar, dead/bare.
- **Plants:** bushes, grass tufts, reeds (coast/river), cacti/scrub (desert),
  flowers, wheat clumps.
- **Rocks:** boulders (small/med/large), rocky outcrops, cliff faces, gravel.

## 5. Animals (fauna props) — ~10
- Cattle, sheep, goat, horse (herd), deer/stag, boar, camel (desert), elephant
  (wild — also Carthage's war beast), eagle/hawk (flavour, flying), fish (water).

## 6. Tile improvements & built structures — ~12
Match the engine's improvements + roads/buildings:
- Farm (ploughed fields), Pasture (fenced/animals), Mine (shaft + spoil), Lumber
  camp (logs + saw), Trade post (caravan tents), Quarry (cut stone), Vineyard.
- **Road** segments + junctions + **bridge** (over river), **Harbor** (quay + moored ship).
- City buildings for detail/skyline: granary, workshop, market, library, temple,
  academy, lyceum, aqueduct, barracks, amphitheater, **walls**.

## 7. Cities — 5 tiers × 6 civ styles
**Settlement progression** (population): Settlement → Town → Small City → Major
City → Metropolis. Each in **6 architectural styles**:
- Rome, Athenians (Greek), Carthage (Punic), Egypt, Gaul (Celtic), Parthia (Persian).
- Add-ons: **city walls** (appear with the Walls tech), harbor for coastal cities,
  a landmark/wonder per civ (Colosseum, Parthenon, Pyramids, Cothon, Oppidum,
  Ctesiphon arch).
- *Efficient approach:* a shared low-poly base per tier + swappable civ roof/banner/
  accent props, rather than 30 unique models.

## 8. Units — by category, development & civ
Each unit needs **idle / march / attack / death** animations (naval: sail/row).
Show **3 development tiers** (recruit → veteran → elite: more armour, a banner) and
tint/shield by civ colour.

**Generic line (all civs):**
- Light infantry — **Warrior**
- Ranged — **Archer**
- Anti-cavalry — **Spearman**
- Heavy infantry — **Swordsman**
- Cavalry — **Horseman**
- Siege — **Siege Ballista / Onager**
- Warship — **Trireme** (→ Quinquereme)
- Civilian — **Settler**, **Merchant / Caravan**

**Civ-unique elites (signature look each):**
- Rome — **Legionary** (pilum, scutum, lorica)
- Athenians — **Hoplite** (aspis, crest, phalanx)
- Carthage — **War Elephant** (tower + crew)
- Egypt — **War Chariot** (two-horse, archer)
- Gaul — **Gaesatae** (naked warrior, torc, long sword)
- Parthia — **Horse Archer** (mounted bow, Parthian shot)
- (Future: Spartans — a rare Athenian/Greek variant.)

## 9. Effects & overlays — ~15
- Selection ring, reachable/attack highlights, move-path arrows, territory borders.
- Combat: sword clash, arrow volley, dust, blood/impact, unit death poof.
- Weather: rain, fog bank, storm clouds + lightning, heat shimmer, snow (peaks).
- **Event cards:** Vesuvius (lava + ash plume), Nile flood (rising water), Plague
  (green miasma), Golden Age (warm glow/rays).
- Fog-of-war edge, city smoke, harbour flags.

## 10. UI & card art — ~40
- **Card frames** per rarity (common/rare/epic/legendary) × category tint.
- **General/figure portraits:** Caesar, Augustus, Socrates, Pericles, Xerxes,
  Cleopatra, Hannibal, Alexander (+ more later).
- **Event art:** Vesuvius, Nile Flood, Plague, Golden Age.
- **Cosmetics:** crowns (laurel, gold diadem, iron), emblems (eagle, wolf, owl,
  trireme, elephant, sun), banners/titles.
- **Civ emblems/flags** ×6; **pack art** (Standard/Bronze/Silver/Gold); **icons**
  for each resource, badge, and the coin currency.

---

## Suggested build order (biggest visual win first)
1. **Terrain tiles** (8 + variants) + **water** — the whole board reads better.
2. **Units** — the generic line with animations (kills the flat-sprite problem).
3. **Resource deposits + trees/rocks/animals** — the map comes alive.
4. **Cities** (shared base + civ accents).
5. **Civ-unique elite units**, then **effects**, then **card/UI art**.
