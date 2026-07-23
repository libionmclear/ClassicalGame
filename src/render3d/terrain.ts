// HEGEMON — terrain relief (docs/TERRAIN-RELIEF-SPEC.md, "Path A: continuous
// landscape"). Renderer-only: the board becomes ONE flowing surface whose height is
// derived from the hex tiles, with the hex grid drawn as an overlay. Zero engine/rules
// changes — this reads the same view object the board always got.
//
// This module is the pipeline + infrastructure:
//   • the elevation model (per-biome target heights),
//   • a continuous heightfield SAMPLER that smooths across hex centres (no cliffs
//     except at mountains),
//   • the biome texture drop-in convention (assets/terrain/<biome>/…), and
//   • a subdivided surface-mesh builder (procedural colour now; swaps to painted
//     biome textures the moment the art lands).
import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

// Deterministic noise for the relief (same map → identical dressing, TERRAIN §8.3):
// a fixed-seed permutation, never Math.random.
function mulberry32(a: number): () => number {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const _noise = new SimplexNoise({ random: mulberry32(0x9e3779b1) } as { random(): number });

// Ridged multifractal — sharp crests, steep faces, gullies. This is the toy-vs-real
// switch for mountains (§2b): NEVER the smooth noise used elsewhere.
function ridged(x: number, z: number): number {
  let sum = 0, freq = 0.85, amp = 0.9, weight = 1;
  for (let o = 0; o < 5; o += 1) {
    let n = 1 - Math.abs(_noise.noise(x * freq, z * freq));
    n *= n;                    // sharpen the ridge
    n *= weight;
    weight = Math.max(0, Math.min(1, n * 1.8));
    sum += n * amp;
    freq *= 2.03; amp *= 0.5;
  }
  return sum;                  // ~0 (gully) .. ~1.3 (crest)
}

// Hex layout — MUST match board3d.ts (pointy-top, SIZE = 1).
export const SIZE = 1;
export function axialToWorld(q: number, r: number): { x: number; z: number } {
  return { x: SIZE * Math.sqrt(3) * (q + r / 2), z: SIZE * 1.5 * r };
}

// Per-biome target elevation. Kept in the same range as the board's terraces so units
// are never hidden behind a hill at the default inclination (spec §2 readability cap).
export const TERRAIN_ELEV: Record<string, number> = {
  sea: -0.12, coast: -0.04, plains: 0.14, valley: 0.18, marsh: 0.10,
  forest: 0.34, hills: 0.58, highlands: 0.82, mountains: 1.12, desert: 0.14
};
export const SEA_LEVEL = -0.1;
const WATER = new Set(["sea", "coast"]);
export function elevationOf(terrain: string): number {
  return WATER.has(terrain) ? SEA_LEVEL : (TERRAIN_ELEV[terrain] ?? 0.12);
}

// Per-biome render config (extended as the art pipeline fills in). tiling = texture
// repeats per world unit (~one repeat per 3–4 hexes per spec §4); dispAmp = micro
// relief strength; tint = procedural fallback colour until an albedo is dropped in.
export interface BiomeCfg { tint: number; tiling: number; dispAmp: number; }
export const BIOME_CFG: Record<string, BiomeCfg> = {
  plains:    { tint: 0x7a955a, tiling: 0.30, dispAmp: 0.04 },
  valley:    { tint: 0x6f9a52, tiling: 0.30, dispAmp: 0.03 },
  marsh:     { tint: 0x5f7d55, tiling: 0.30, dispAmp: 0.03 },
  forest:    { tint: 0x3e6440, tiling: 0.28, dispAmp: 0.05 },
  hills:     { tint: 0x8a744c, tiling: 0.26, dispAmp: 0.08 },
  highlands: { tint: 0x877a5c, tiling: 0.26, dispAmp: 0.10 },
  mountains: { tint: 0x7c7264, tiling: 0.24, dispAmp: 0.14 },
  desert:    { tint: 0xcbab68, tiling: 0.26, dispAmp: 0.05 },
  coast:     { tint: 0xb8a06a, tiling: 0.30, dispAmp: 0.02 },
  sea:       { tint: 0x2f5177, tiling: 0.30, dispAmp: 0.0 }
};
export const BIOMES = Object.keys(BIOME_CFG);

// The art drop-in convention (spec §4). Drop painted, seamless-tileable PNGs at these
// paths and the build ships them; the loader uses them, else falls back to procedural.
export function biomeTexPaths(biome: string): { albedo: string; height: string; normal: string } {
  return {
    albedo: `assets/terrain/${biome}/albedo.png`,
    height: `assets/terrain/${biome}/height.png`,
    normal: `assets/terrain/${biome}/normal.png`
  };
}

// What a vertex needs to know about a tile. Off-map returns undefined → treated as sea.
export interface TileSample { elev: number; r: number; g: number; b: number; mtn?: number }
export type TileAt = (q: number, r: number) => TileSample | undefined;

// How mountainous a terrain is (drives ridged crests §2b): mountains full, highlands
// foothills, hills a touch. Everything else flat.
export function mountainnessOf(terrain: string): number {
  return terrain === "mountains" ? 1 : terrain === "highlands" ? 0.55 : terrain === "hills" ? 0.15 : 0;
}
export const MOUNTAIN_AMP = 0.86; // ridged-crest amplitude on full mountains — taller so ranges tower under the softer Gate 2 light (mountains are impassable; units never stand on the crest)

// The heightfield: a smooth, distance-weighted blend of the surrounding hex centres'
// elevations, so the surface flows between hexes with no cliffs (spec §2). Colour is
// blended by the same kernel so biomes cross-fade at their borders. Deterministic —
// same tiles in → same surface out.
const BLEND_R = 2.8 * SIZE;               // blend radius (~1.5 hexes)
const RING = 2;                           // axial neighbourhood scanned per sample
const SEA_SAMPLE: TileSample = { elev: SEA_LEVEL, r: 0x2f / 255, g: 0x51 / 255, b: 0x77 / 255, mtn: 0 };
export function sampleSurface(x: number, z: number, tileAt: TileAt): { y: number; r: number; g: number; b: number; mtn: number } {
  const rf = z / (1.5 * SIZE);
  const qf = x / (SIZE * Math.sqrt(3)) - rf / 2;
  const bq = Math.round(qf), br = Math.round(rf);
  let ysum = 0, rsum = 0, gsum = 0, bsum = 0, msum = 0, wsum = 0;
  let nearest: TileSample | undefined; let nearestD = Infinity;
  for (let dr = -RING; dr <= RING; dr += 1) {
    for (let dq = -RING; dq <= RING; dq += 1) {
      const q = bq + dq, r = br + dr;
      const c = axialToWorld(q, r);
      const d = Math.hypot(c.x - x, c.z - z);
      const s = tileAt(q, r);
      if (d < nearestD) { nearestD = d; nearest = s; }
      if (d >= BLEND_R) continue;
      const samp = s ?? SEA_SAMPLE;
      const w = (1 - d / BLEND_R) * (1 - d / BLEND_R); // smooth falloff
      ysum += w * samp.elev; rsum += w * samp.r; gsum += w * samp.g; bsum += w * samp.b; msum += w * (samp.mtn ?? 0); wsum += w;
    }
  }
  if (wsum <= 0) {
    const n = nearest ?? SEA_SAMPLE;
    return { y: n.elev, r: n.r, g: n.g, b: n.b, mtn: n.mtn ?? 0 };
  }
  let y = ysum / wsum;
  const mtn = msum / wsum; // blended mountainness — fades at range edges so hexes MERGE
  if (mtn > 0.02) {
    // Ridged crests only in mountain country. Adjacent mountain hexes share one ridged
    // field → a continuous range with crests and gullies, never isolated smooth cones.
    // Subtract only a little (not the ridge's mean) so the term adds NET HEIGHT — the
    // elevation blend otherwise flattens peaks to gentle humps. mtn² sharpens the range
    // core vs its skirts so summits tower and foothills stay walkable.
    y += (ridged(x, z) - 0.12) * MOUNTAIN_AMP * (mtn * mtn);
  }
  return { y, r: rsum / wsum, g: gsum / wsum, b: bsum / wsum, mtn };
}

// Build the continuous ground surface: a subdivided grid over the board's world
// bounds, displaced by the heightfield and vertex-coloured by biome. Procedural for
// now; painted biome textures blend in later via the same UVs (biomeTexPaths).
export interface SurfaceOpts {
  subdiv?: number; margin?: number; maxSeg?: number;
  rock?: THREE.Texture | null;   // slope-rock: generic rock on any steepening ground (§5)
  snow?: THREE.Texture | null;   // alpine-snow: high gentle shelves above the snowline (§2b)
  cliff?: THREE.Texture | null;  // cliff-strata: layered sedimentary walls on the steepest faces (§2c)
  scree?: THREE.Texture | null;  // mountain-scree: loose debris on lower/gentler mountain ground (§2b)
  flatten?: Map<string, number>; // §7b: tileKey "q,r" → platform height; city hexes level off + skirt
}
function smooth01(a: number, b: number, x: number): number { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
// The surface mesh PLUS a sampler that returns the mesh's OWN height at any (x,z) — a
// bilinear lookup of the vertex grid, so it matches what the tessellated triangles actually
// render (the continuous sampleSurface has sub-grid ridges the mesh can't, which is why
// props seated on the analytic height float above mountain crests).
export interface TerrainSurface { mesh: THREE.Mesh; heightAt(x: number, z: number): number }
export function buildTerrainSurface(
  tiles: Array<{ q: number; r: number }>,
  tileAt: TileAt,
  opts: SurfaceOpts = {}
): TerrainSurface {
  const subdiv = opts.subdiv ?? 3.9;      // grid vertices per world unit (finer = sharper ridges)
  const margin = opts.margin ?? 2.0;
  const maxSeg = opts.maxSeg ?? 400;      // per-axis cap (perf / quality tier)
  const flat = opts.flatten;              // §7b city platforms

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const t of tiles) {
    const c = axialToWorld(t.q, t.r);
    if (c.x < minX) minX = c.x; if (c.x > maxX) maxX = c.x;
    if (c.z < minZ) minZ = c.z; if (c.z > maxZ) maxZ = c.z;
  }
  if (!isFinite(minX)) { minX = -1; maxX = 1; minZ = -1; maxZ = 1; }
  minX -= margin; maxX += margin; minZ -= margin; maxZ += margin;
  const w = maxX - minX, d = maxZ - minZ;
  const segX = Math.max(1, Math.min(maxSeg, Math.round(w * subdiv)));
  const segZ = Math.max(1, Math.min(maxSeg, Math.round(d * subdiv)));
  const nx = segX + 1, nz = segZ + 1;

  const pos = new Float32Array(nx * nz * 3);
  const col = new Float32Array(nx * nz * 3);
  const uv = new Float32Array(nx * nz * 2);
  const mtnAttr = new Float32Array(nx * nz);   // per-vertex mountainness → scree/cliff selection (§2b/§2c)
  const UV_SCALE = 0.28; // ~one texture repeat per 3–4 hexes (spec §4)
  for (let iz = 0; iz < nz; iz += 1) {
    for (let ix = 0; ix < nx; ix += 1) {
      const wx = minX + (ix / (nx - 1)) * w;
      const wz = minZ + (iz / (nz - 1)) * d;
      const s = sampleSurface(wx, wz, tileAt);
      const vi = (iz * nx + ix) * 3;
      let vy = s.y;
      // §7b: flatten a city hex to a level platform, skirting back to natural terrain by the
      // hex edge (a terrace cut) — so the city model never tilts or embeds on a slope.
      if (flat) {
        const rf = wz / (1.5 * SIZE), qf = wx / (SIZE * Math.sqrt(3)) - rf / 2;
        const plat = flat.get(Math.round(qf) + "," + Math.round(rf));
        if (plat !== undefined) {
          const cc = axialToWorld(Math.round(qf), Math.round(rf));
          const k = 1 - smooth01(0.60, 0.98, Math.hypot(wx - cc.x, wz - cc.z)); // 1=flat centre → 0=natural edge
          vy = vy * (1 - k) + plat * k;
        }
      }
      pos[vi] = wx; pos[vi + 1] = vy; pos[vi + 2] = wz;
      // Per-vertex variation tint (±5%) to kill large-area flatness (§5 secondary blend).
      const jit = 1 + (_noise.noise(wx * 3.1, wz * 3.1) * 0.10);
      col[vi] = s.r * jit; col[vi + 1] = s.g * jit; col[vi + 2] = s.b * jit;
      const ui = (iz * nx + ix) * 2;
      uv[ui] = wx * UV_SCALE; uv[ui + 1] = wz * UV_SCALE;
      mtnAttr[iz * nx + ix] = s.mtn;
    }
  }
  const idx: number[] = [];
  for (let iz = 0; iz < segZ; iz += 1) {
    for (let ix = 0; ix < segX; ix += 1) {
      const a = iz * nx + ix, b = a + 1, c2 = a + nx, e = c2 + 1;
      idx.push(a, c2, b, b, c2, e);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setAttribute("aMtn", new THREE.BufferAttribute(mtnAttr, 1));
  geo.setIndex(idx);
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0.0 });
  // §5 slope-based blending + §2b altitude shading: where the ground STEEPENS, the
  // promoted rock texture breaks through the biome colour; SNOW settles on high, gentle
  // shelves above the snowline (noise-jittered edge). This one shader carries most of
  // the "expensive landscape" look. Textures are the promoted, swappable assets.
  if (opts.rock) {
    const rock = opts.rock, snow = opts.snow || opts.rock;
    const cliff = opts.cliff || opts.rock, scree = opts.scree || opts.rock;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uRock = { value: rock };
      shader.uniforms.uSnow = { value: snow };
      shader.uniforms.uCliff = { value: cliff };
      shader.uniforms.uScree = { value: scree };
      shader.uniforms.uRockSlope = { value: new THREE.Vector2(0.24, 0.68) }; // slope where rock starts / is full
      shader.uniforms.uSnowY = { value: new THREE.Vector2(1.80, 2.28) };     // world-height snowline band (summits only — rock faces show below; raised for taller peaks)
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aMtn;\nvarying vec3 vWN_t;\nvarying vec3 vWP_t;\nvarying float vMtn_t;")
        .replace("#include <project_vertex>", "#include <project_vertex>\nvWN_t = normalize(mat3(modelMatrix) * normal);\nvWP_t = (modelMatrix * vec4(transformed, 1.0)).xyz;\nvMtn_t = aMtn;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nuniform sampler2D uRock;\nuniform sampler2D uSnow;\nuniform sampler2D uCliff;\nuniform sampler2D uScree;\nuniform vec2 uRockSlope;\nuniform vec2 uSnowY;\nvarying vec3 vWN_t;\nvarying vec3 vWP_t;\nvarying float vMtn_t;\n// The promoted rock art is warm/tan; pull it toward cool grey stone so mountains read rocky, not sandy.\nvec3 coolStone(vec3 c){ float l = dot(c, vec3(0.299, 0.587, 0.114)); return mix(c, vec3(l) * vec3(0.82, 0.88, 1.04), 0.55); }")
        .replace("#include <color_fragment>", [
          "#include <color_fragment>",
          "{",
          "  vec2 tuv = vWP_t.xz * 0.35;",
          "  float slope = clamp(1.0 - vWN_t.y, 0.0, 1.0);",
          // (1) mountain scree — loose debris blankets gentle-to-moderate MOUNTAIN ground
          //     (shelves, gully floors, lower slopes); slides off the steep faces.
          "  float scree = vMtn_t * smoothstep(0.03, 0.22, slope) * (1.0 - smoothstep(0.44, 0.72, slope));",
          "  vec3 screeC = coolStone(texture2D(uScree, tuv * 0.85).rgb);",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, screeC, scree * 0.9);",
          // (2) generic slope rock — any biome, wherever the ground merely steepens (§5).
          "  float rk = smoothstep(uRockSlope.x, uRockSlope.y, slope);",
          "  vec3 rockC = coolStone(texture2D(uRock, tuv).rgb);",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, rockC, rk);",
          // (3) cliff strata — the STEEPEST faces (mountain country) become layered
          //     sedimentary walls; sample banded by WORLD HEIGHT so strata read level (§2c).
          "  float cliff = smoothstep(0.58, 0.82, slope) * smoothstep(0.06, 0.32, vMtn_t);",
          "  vec2 cuv = vec2(vWP_t.x * 0.28 + vWP_t.z * 0.06, vWP_t.y * 0.95);",
          "  vec3 cliffC = coolStone(texture2D(uCliff, cuv).rgb);",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, cliffC, cliff);",
          // (4) alpine snow — settles last, on the high GENTLE shelves above the snowline.
          "  float edge = 0.06 * (texture2D(uSnow, tuv * 0.7).r - 0.5);",
          "  float snow = smoothstep(uSnowY.x + edge, uSnowY.y + edge, vWP_t.y) * (1.0 - smoothstep(0.46, 0.72, slope));",
          "  vec3 snowC = texture2D(uSnow, tuv * 0.5).rgb * 1.06;",
          "  diffuseColor.rgb = mix(diffuseColor.rgb, snowC, snow);",
          "}"
        ].join("\n"));
    };
    mat.customProgramCacheKey = () => "hg-terrain-slope-3";
  }
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  mesh.castShadow = true;
  mesh.name = "terrainSurface";
  // Bilinear height lookup on the vertex grid (heights live in pos[..*3+1]). Matches the
  // rendered surface; used to seat scatter/props/units so nothing floats or sinks.
  const heightAt = (x: number, z: number): number => {
    const fx = ((x - minX) / w) * (nx - 1), fz = ((z - minZ) / d) * (nz - 1);
    const ix = Math.max(0, Math.min(nx - 2, Math.floor(fx)));
    const iz = Math.max(0, Math.min(nz - 2, Math.floor(fz)));
    const tx = Math.max(0, Math.min(1, fx - ix)), tz = Math.max(0, Math.min(1, fz - iz));
    const h = (r0: number, c0: number): number => pos[((r0 * nx) + c0) * 3 + 1];
    const top = h(iz, ix) * (1 - tx) + h(iz, ix + 1) * tx;
    const bot = h(iz + 1, ix) * (1 - tx) + h(iz + 1, ix + 1) * tx;
    return top * (1 - tz) + bot * tz;
  };
  return { mesh, heightAt };
}
