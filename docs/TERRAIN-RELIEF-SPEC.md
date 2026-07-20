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

## 6. Scatter system (uses the Meshy prop kit)
- Props per biome, all via InstancedMesh, seeded by tile coordinate
  (deterministic per map seed — same map always dresses the same):
  plains: grass clumps, wildflowers, sparse boulders ·
  valley: dense grass, flowers · hills: rocks, olive trees, scrub ·
  forest: stone pines, cypress, fallen trunks (in addition to existing tree
  props) · desert: scrub, rock clusters, palms at oases · marsh: reed clusters ·
  mountains: rock shards, boulders · coast: sparse rocks.
- Density per biome and global density multiplier in config; quality tiers scale
  density (mobile ~40%).
- Placement rules: avoid city tiles' built area, roads, and district footprints;
  sink props to displaced surface height; random yaw + ±15% scale per instance;
  never between a unit and the default camera at spawn (readability).
- Props sway: cheap vertex-shader wind on grass/reeds/canopies only.

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
