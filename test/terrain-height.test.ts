// Terrain relief (docs/TERRAIN-RELIEF-SPEC.md): the continuous heightfield sampler.
// It must be deterministic, flow smoothly between hexes (no cliffs), and honour the
// per-biome elevation order — all with zero engine involvement (renderer-only).
import test from "node:test";
import assert from "node:assert/strict";

import { sampleSurface, axialToWorld, elevationOf, TERRAIN_ELEV, type TileSample } from "../src/render3d/terrain";

// A tileAt over a small terrain map; off-map returns undefined (→ treated as sea).
function mapOf(cells: Record<string, string>) {
  return (q: number, r: number): TileSample | undefined => {
    const t = cells[`${q},${r}`];
    return t ? { elev: elevationOf(t), r: 0.5, g: 0.5, b: 0.5 } : undefined;
  };
}

const allPlains = () => {
  const cells: Record<string, string> = {};
  for (let r = -3; r <= 3; r += 1) for (let q = -3; q <= 3; q += 1) cells[`${q},${r}`] = "plains";
  return cells;
};

test("is deterministic — same point, same height", () => {
  const at = mapOf(allPlains());
  const c = axialToWorld(0, 0);
  assert.equal(sampleSurface(c.x, c.z, at).y, sampleSurface(c.x, c.z, at).y);
});

test("a flat field returns exactly its biome elevation", () => {
  const at = mapOf(allPlains());
  const c = axialToWorld(0, 0);
  assert.ok(Math.abs(sampleSurface(c.x, c.z, at).y - TERRAIN_ELEV.plains) < 1e-9, "flat plains = plains height");
});

test("honours the biome elevation order — a mountain rises above the plain", () => {
  const cells = allPlains();
  cells["0,0"] = "mountains";
  const at = mapOf(cells);
  const peak = axialToWorld(0, 0);
  const flat = axialToWorld(3, 0);
  assert.ok(sampleSurface(peak.x, peak.z, at).y > sampleSurface(flat.x, flat.z, at).y + 0.3, "the summit clearly rises");
});

test("flows smoothly between hexes — no cliffs across a plains→mountain seam", () => {
  const cells = allPlains();
  cells["0,0"] = "mountains";
  const at = mapOf(cells);
  const a = axialToWorld(0, 0), b = axialToWorld(1, 0); // adjacent hex centres
  let prev = sampleSurface(a.x, a.z, at).y;
  let maxStep = 0;
  for (let i = 1; i <= 20; i += 1) {
    const x = a.x + ((b.x - a.x) * i) / 20;
    const z = a.z + ((b.z - a.z) * i) / 20;
    const y = sampleSurface(x, z, at).y;
    maxStep = Math.max(maxStep, Math.abs(y - prev));
    prev = y;
  }
  // The whole drop is ~0.8 units over the span; no single 1/20 step should be a cliff.
  assert.ok(maxStep < 0.15, `slope is continuous (max step ${maxStep.toFixed(3)})`);
});

test("blends biome colour by the same kernel", () => {
  const cells = allPlains();
  const at = (q: number, r: number): TileSample | undefined => {
    const t = cells[`${q},${r}`];
    if (!t) return undefined;
    return { elev: elevationOf(t), r: q === 0 && r === 0 ? 1 : 0, g: 0, b: 0 };
  };
  const c = axialToWorld(0, 0);
  const s = sampleSurface(c.x, c.z, at);
  assert.ok(s.r > 0.4 && s.r < 1.0, "the centre's colour dominates but neighbours soften it");
});

test("off-map samples fall back to sea level", () => {
  const at = mapOf({}); // no tiles anywhere
  assert.ok(sampleSurface(999, 999, at).y <= 0, "empty world reads as sea");
});
