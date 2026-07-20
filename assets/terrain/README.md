# Terrain biome textures — drop-in art

The continuous-landscape renderer (see `docs/TERRAIN-RELIEF-SPEC.md`, and the module
`src/render3d/terrain.ts`) uses one **texture set per biome**. Until you drop art here,
the surface renders with procedural biome colours — so the game works today, and the
moment a file appears it is used automatically.

## Where to drop files

One folder per biome (already created):

```
assets/terrain/<biome>/albedo.png    ← the painted colour texture   (required to switch a biome off procedural)
assets/terrain/<biome>/height.png    ← grayscale micro-relief        (optional; else derived from albedo luminance)
assets/terrain/<biome>/normal.png    ← optional                      (else generated from height at build time)
```

Biomes: `plains · valley · marsh · forest · hills · highlands · mountains · desert · coast`
(`sea` is the reflective water plane — no texture needed.)

## Art requirements (spec §4)

- **Seamless-tileable**, square, power-of-two.
- `albedo`: **1024×1024** (a 512 mobile variant is fine later), painterly, classical
  palette (terracotta / ochre / Egyptian-blue / verdigris). No baked lighting or
  shadows — flat, evenly-lit.
- `height`: **512×512** grayscale (white = high, black = low).
- Tiling scale is ~one repeat per 3–4 hexes (configurable in `terrain.ts`).

## How they get used

- The web build copies `assets/terrain/` → `public/assets/terrain/` (static).
- The renderer loads `assets/terrain/<biome>/albedo.png` (and height/normal); a missing
  file just leaves that biome procedural — you can fill biomes in one at a time.

Drop them in as you finish each biome; no code change needed to see them.
