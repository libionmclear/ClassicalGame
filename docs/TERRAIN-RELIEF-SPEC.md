# HEGEMON — Terrain Relief Spec (Path A: Continuous Landscape)
*Direction decision: the board is a continuous Total War-style landscape, NOT a
hex-diorama board. Hexes remain the logic grid; visually the world is one flowing
surface with the hex grid drawn as an overlay. This spec defines the terrain
upgrade replacing the current flat surface. Renderer-only work — zero engine/rules
changes; the view object contract is untouched.*

---

## 1. The layer stack (bottom to top)

1. **Macro heightfield** — geography: hills rise, valleys dip, mountains loom
2. **Micro displacement** — tileable per-biome relief: dirt clods, rock ridges, dune ripples
3. **Textures** — painted tileable albedo (+ height + optional normal) per biome
4. **Slope-based blending** — rock breaks through where the ground steepens
5. **Scatter props** — instanced grass/rocks/trees/reeds (Meshy GLBs)
6. **Overlays** — hex grid, borders, fog-of-war, movement/selection highlights

## 2. Macro heightfield
- Derive a continuous heightfield from tile data: per-terrain target elevations
  (sea < coast < plains/valley/marsh < hills < mountains), smoothed/interpolated
  across tile centers so slopes flow between hexes — no cliffs at hex borders
  except intentionally at mountains.
- Subdivide the board mesh (target: enough vertices per hex for smooth slopes;
  make subdivision level a quality-tier setting).
- Rivers carve a shallow channel along their edge paths; valleys sit slightly
  concave; coasts shelve gently into the sea level.
- Gameplay readability cap: total relief must never obscure a unit behind a hill
  at default camera inclination. Clamp amplitudes accordingly (config values).

## 2b. Mountain construction (kill the smooth cones)
The current per-hex smooth bumps are explicitly rejected. Mountains are built
from four parts:
1. **Ridged noise.** Mountain-tile displacement uses ridged multifractal noise
   (sharp crests, steep faces, gullies) — never the smooth noise used elsewhere.
   This is the toy-vs-real switch.
2. **Ranges, not pimples.** Adjacent mountain hexes merge into a continuous
   ridgeline: fit a spine path through the group, place peaks as high points ON
   the spine, saddles/passes between them. A lone mountain hex still gets a
   ridged asymmetric massif, never a cone. Historic map: hand-tuned spine paths
   for the Alps, Apennines, Pyrenees, Taurus, Zagros, Atlas so their shapes are
   recognizable.
3. **Altitude/slope shading.** Layer by height and steepness: foot scrub →
   exposed rock on steep faces (slope blend) → scree in gullies → snow above a
   climate-profile snowline with a noise-jittered, slope-aware edge (snow holds
   on shelves, streaks in couloirs, never a painted cap). Northern profile:
   low heavy snowline; temperate: high; arid: none except designated hero peaks.
   Scatter rock-shard props on lower slopes.
4. **Atmosphere.** Subtle blue-grey depth haze with distance + slightly deeper
   ambient shadow in inter-ridge valleys. Mass comes from steepness + shading +
   haze — NOT raw height; the §2 readability clamp still rules.
- **Hero peaks:** each range gets 1–2 slightly taller, distinctly shaped summits
  with permanent snow (seeded; stable per map) so ranges become memorable
  geography.
- Acceptance: screenshot a 5-hex range at default camera — it must read as one
  massif with a crestline and passes; zero isolated smooth cones anywhere.

## 2c. Slope grammar & passability language (terrain affordance)
The terrain itself must communicate movement rules at a glance — before any
tooltip. Two visual grammars, applied by passability state:
1. **Climbable slopes = gradients.** Hills and (post-tech) mountain flanks:
   gentle inclines, scree runs, stepped/terraced rock ledges, grass thinning
   with altitude. Shape says "walkable with effort."
2. **Impassable faces = walls.** Pre-tech mountain cores and any hard barrier:
   sheer cliff bands with horizontal rock-strata texture, near-vertical
   geometry, no ledges. Shape says "no." Requires one new tileable texture:
   layered sedimentary cliff strata (add to the texture production list).
3. **Tech changes the map:** when a player researches Mountain Paths, faint
   switchback trail decals and worn pass notches appear on mountain ranges for
   that player (client-side per-player presentation of the shared state — same
   pattern as fog). The world visibly opens; technology is seen carving the
   Alps. Trails follow the §2b spine saddle points.
4. **Clamber feel:** on steep climbable segments, units slow slightly and tilt
   to the surface during move animation (presentation only; costs unchanged).
5. **Cost chevrons:** with a unit selected, the reachable-tile overlay marks
   expensive edges on the ground — double chevron up a slope, ford mark at
   river crossings, attrition sun icon entering desert. Projected decals, same
   system as §7 overlays.
- Acceptance: a new player, no tutorial, points correctly at "where can this
  unit go" for hills vs. cliff vs. pass in a blind test screenshot.

## 3. Micro displacement (the "not flat, not boring" layer)
- Each biome texture set includes a tileable grayscale **heightmap**; displace
  the subdivided mesh by it at small amplitude (per-biome strength in config —
  desert ripples subtle, mountain rock strong).
- Because the maps tile, relief continues seamlessly across hexes.
- Mobile/low tier: skip micro displacement, keep the same map as a normal map —
  visual continuity at lower cost.

## 4. Texture format (what art production delivers)
Per biome, square, seamless-tileable, power-of-two:
- `albedo` 1024 (ship 512 mobile) — painted, painterly, from image tools
- `height` 512 grayscale — micro relief source (image tools or derived from
  albedo luminance as a fallback)
- `normal` optional 512 — else generate from height in the build step
Runtime: KTX2/Basis compressed; PNG masters in the art source folder.
Terrain UV tiling scale: configurable, default one repeat per ~3–4 hexes.

## 5. Slope-based blending
- In the terrain shader, blend in a shared rock texture as slope increases
  (smoothstep on surface normal vs. up vector; thresholds in config).
- This one technique carries most of the "expensive landscape" look: hillsides
  and mountain flanks automatically show stone through grass with zero authoring.
- Secondary blend: per-vertex noise variation tint (±5% hue/value) to kill
  large-area flatness.

## 6. Scatter system (uses the Meshy prop kit) — CLIMATE-AWARE
- Props per biome **selected through the map's climate profile (§11)** — the same
  biome dresses differently by latitude. All via InstancedMesh, seeded by tile
  coordinate (deterministic per map seed):

  **Mediterranean/temperate-south profile:**
  plains: dry grass clumps, wildflowers, sparse boulders · valley: dense grass,
  flowers · hills: rocks, olive trees, desert scrub · forest: stone pines,
  cypress, olives, fallen trunks · marsh: reed clusters · coast: sparse rocks,
  driftwood.

  **Northern profile (Britannia, Germania, Gaul north):**
  plains: lush green grass, heather/gorse patches · hills: mossy boulders,
  hawthorn scrub, birch · forest: oaks, beech, fir/spruce, fallen mossy trunks ·
  marsh: dense sedge and reeds · coast: grey shingle rocks, driftwood.
  **No olives, no cypress, no stone pines, no palms north of the climate line.**

  **Desert/arid profile (Sahara edge, Arabia):**
  desert: dry scrub, rock clusters · oasis: date palms, green sedge ring.

  **Nile signature set:** riverbank and delta-marsh tiles along the Nile (and
  optionally Mesopotamian rivers) scatter **papyrus clumps** instead of generic
  reeds, plus date palms on adjacent valley tiles — the river must be readable
  as THE Nile at a glance.

- Density per biome and global density multiplier in config; quality tiers scale
  density (mobile ~40%).
- Placement rules: avoid city tiles' built area, roads, and district footprints;
  sink props to displaced surface height; random yaw + ±15% scale per instance;
  never between a unit and the default camera at spawn (readability).
- Props sway: cheap vertex-shader wind on grass/reeds/canopies only.

## 6b. Shoreline & riverbank treatment (beaches)
- **Beach ring:** where land meets sea, blend a pale **beach-sand texture** into
  the land albedo over a 0.3–0.6 hex-width band (shader blend by
  distance-to-water, noise-jittered so the line wanders naturally). Wet-sand
  darkening in the last sliver before waterline; the existing foam/ripple shader
  meets it.
- **Riverbanks:** same treatment at reduced width along river channels — a thin
  moist-earth/sand strip; along the Nile specifically, a green fertile strip
  blends OUTWARD into desert (the Black Land against the Red Land — Egypt's own
  ancient names for it; the game should show that contrast plainly).
- Beach band width, jitter, and wet-edge darkness in config.

## 7. Overlays
- Hex grid drawn as a projected overlay on the displaced surface (not geometry):
  thin lines styled as **mosaic tessera dashes** — the board-game layer that
  remains is on-brand. Opacity configurable; brighter on hover/selection.
- Realm borders, fog-of-war, and highlights project onto the surface the same
  way (decal/projected UV, not flat quads), so they hug the relief.

## 8. Acceptance criteria
1. Orbit the default camera 360° over a mixed region: relief parallax is visible;
   no seams or texture grid readable; no repeated-feature "clone stamping."
2. A unit on any tile remains fully visible at default inclination.
3. Same map seed twice → identical dressing (determinism).
4. Mid-range Android at mobile quality tier: ≥30 fps on the epic map with the
   scatter layer on.
5. Screenshot test: plains/hills/mountain junction at gameplay zoom reads as one
   continuous landscape in the classical palette — not a board of tiles.

## 9. Build order
1. Macro heightfield + subdivision (biggest visual jump)
2. Slope blending + variation tint
3. Micro displacement with placeholder heights (albedo-derived)
4. Scatter system with placeholder primitives → swap in Meshy props as approved
5. Overlay projection (grid/borders/fog onto relief)
6. Quality tiers + mobile pass
7. §6b shoreline/riverbank blending
8. §10 map archetypes + §11 climate profiles in mapgen

---

## 10. MAP ARCHETYPES (mapgen upgrade — variety of strategy, not just scenery)
Random maps draw from **named, weighted recipes** controlling landmass shape,
water ratio, and biome mix. Each archetype must change how the game *plays*:

- **Inland Sea** — a mini-Mediterranean; all civs on the rim; naval trade central
- **Archipelago** — island clusters; seafaring mandatory; corsair pressure high
- **Great River Valley** — one Nile-like fertile ribbon through arid land; the
  river IS the map (gets the Nile signature set + Black-Land/Red-Land contrast)
- **Mountain Spine** — a barrier range splits two theaters; passes are chokepoints
- **Twin Continents** — two landmasses, a strait between; late-game invasion arc
- **Highlands** — hill/mountain-heavy; defense and hill-fighting favored
- **Oasis Chain** — arid world; water sources are the strategic resource
- **Broad Plains** — open grassland; cavalry paradise, few natural defenses
- **Broken Coast** — fjord-like deep coastline; every city nearly coastal
- **Heartland** — one big landmass, sea only at edges; land-power game

Weights and all recipe parameters in config. Raider intensity scales with coastal
exposure per archetype. Historic maps (Old World, scenarios) are exempt — fixed
and hand-authored; their sameness is the point.

## 11. CLIMATE PROFILES (per-map mood — same assets, different world)
Each random map rolls a climate profile from its seed (weighted; some archetypes
constrain it). The profile drives, as parameters only:
- **Grading LUT bias** — north: cooler, mossier, greyer stone; temperate: the
  classic Mediterranean palette; south/arid: sun-bleached golds and rose
- **Variation tint range** and base grass hue
- **Scatter set selection** (§6 profiles: northern / Mediterranean / arid)
- **Weather weights** — north: more rain and fog; arid: more heat, rare storms;
  temperate: balanced
- **Biome mix bias** — north: more forest and marsh, no desert; arid: inverse
Profiles: **Northern, Temperate, Mediterranean (default), Arid, plus a Nile
variant** (arid with the river signature). On the historic Old World map, climate
is positional — latitude bands apply the profiles geographically, so Britannia is
mossy and grey while the Sahara edge bakes, on one map.

**Acceptance addition:** generate 6 maps across archetypes/climates and place
their screenshots side by side — a player must be able to tell every pair apart
at a glance, and name at least one strategic difference per archetype.
