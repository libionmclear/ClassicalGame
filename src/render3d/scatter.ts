// HEGEMON — climate-aware scatter (TERRAIN-RELIEF-SPEC §6). Instanced props dress each
// biome, SELECTED THROUGH THE MAP'S CLIMATE PROFILE — the same biome looks different by
// latitude (no olives in the north, no oaks in the desert). Placement is deterministic:
// seeded by tile coordinate so the same map always dresses identically (replay-safe).
// Pure data + selection here; board3d builds the InstancedMeshes on the relief surface.

// Deterministic per-tile RNG (fixed hash of q,r — never Math.random; §8.3).
function tileRng(q: number, r: number, salt: number): () => number {
  let a = (Math.imul(q | 0, 0x9e3779b1) ^ Math.imul(r | 0, 0x85ebca77) ^ Math.imul(salt | 0, 0xc2b2ae3d)) >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Climate = "mediterranean" | "northern" | "arid";

// Per climate → per biome → prop entries (key + expected count "density"). Weighted so a
// tile draws a small, varied handful. Papyrus is applied by the Nile rule below, not here.
type Entry = { key: string; n: number };
const M: Record<string, Entry[]> = {
  plains:    [{ key: "scatter/dry-grass", n: 3.0 }, { key: "scatter/limestone-boulder", n: 0.3 }],
  valley:    [{ key: "scatter/dry-grass", n: 3.6 }, { key: "scatter/olive", n: 0.4 }],
  hills:     [{ key: "scatter/rock-cluster", n: 1.0 }, { key: "scatter/olive", n: 0.8 }, { key: "scatter/desert-scrub", n: 0.7 }, { key: "scatter/limestone-boulder", n: 0.5 }],
  forest:    [{ key: "scatter/stone-pine", n: 1.6 }, { key: "scatter/cypress", n: 1.4 }, { key: "scatter/olive", n: 0.7 }, { key: "scatter/fallen-trunk", n: 0.4 }],
  highlands: [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/rock-shard", n: 0.6 }, { key: "scatter/olive", n: 0.3 }],
  mountains: [{ key: "scatter/rock-shard", n: 1.1 }],
  marsh:     [{ key: "scatter/reeds", n: 3.0 }],
  desert:    [{ key: "scatter/desert-scrub", n: 0.9 }, { key: "scatter/rock-cluster", n: 0.5 }],
  coast:     [{ key: "scatter/rock-cluster", n: 0.5 }, { key: "scatter/driftwood", n: 0.3 }]
};
const N: Record<string, Entry[]> = {
  plains:    [{ key: "scatter/dry-grass", n: 3.4 }, { key: "scatter/mossy-boulder", n: 0.4 }],
  valley:    [{ key: "scatter/dry-grass", n: 3.8 }],
  hills:     [{ key: "scatter/mossy-boulder", n: 1.2 }, { key: "scatter/rock-cluster", n: 0.6 }, { key: "scatter/oak", n: 0.5 }],
  forest:    [{ key: "scatter/oak", n: 1.4 }, { key: "scatter/beech", n: 1.2 }, { key: "scatter/fir", n: 1.2 }, { key: "scatter/fallen-trunk", n: 0.5 }],
  highlands: [{ key: "scatter/mossy-boulder", n: 0.9 }, { key: "scatter/rock-shard", n: 0.6 }, { key: "scatter/fir", n: 0.4 }],
  mountains: [{ key: "scatter/rock-shard", n: 1.1 }],
  marsh:     [{ key: "scatter/reeds", n: 3.2 }],
  desert:    [{ key: "scatter/desert-scrub", n: 0.6 }],
  coast:     [{ key: "scatter/rock-cluster", n: 0.6 }, { key: "scatter/driftwood", n: 0.4 }]
};
const A: Record<string, Entry[]> = {
  plains:    [{ key: "scatter/dry-grass", n: 1.2 }, { key: "scatter/desert-scrub", n: 0.6 }],
  valley:    [{ key: "scatter/dry-grass", n: 1.6 }, { key: "scatter/date-palm", n: 0.5 }],
  hills:     [{ key: "scatter/rock-cluster", n: 1.0 }, { key: "scatter/desert-scrub", n: 0.7 }],
  forest:    [{ key: "scatter/date-palm", n: 1.2 }, { key: "scatter/desert-scrub", n: 0.6 }],
  highlands: [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/rock-shard", n: 0.6 }],
  mountains: [{ key: "scatter/rock-shard", n: 1.0 }],
  marsh:     [{ key: "scatter/reeds", n: 2.0 }],
  desert:    [{ key: "scatter/desert-scrub", n: 1.1 }, { key: "scatter/rock-cluster", n: 0.5 }],
  coast:     [{ key: "scatter/rock-cluster", n: 0.5 }, { key: "scatter/driftwood", n: 0.3 }]
};
const TABLES: Record<Climate, Record<string, Entry[]>> = { mediterranean: M, northern: N, arid: A };

export interface Placement { key: string; dx: number; dz: number; yaw: number; scale: number }

// Deterministically choose the props for one tile. `density` scales counts (mobile ~0.4);
// `riverAdj` swaps in the Nile signature (papyrus on marsh, date-palms on valley). Props
// avoid the tile centre (unit/city readability).
export function pickScatter(terrain: string, q: number, r: number, climate: Climate, density: number, riverAdj: boolean): Placement[] {
  const table = TABLES[climate] || M;
  let entries = table[terrain];
  if (!entries) return [];
  // Nile signature (§6): riverside marsh → papyrus; riverside valley → date palms.
  if (riverAdj && terrain === "marsh") entries = [{ key: "scatter/papyrus", n: 3.2 }];
  else if (riverAdj && (terrain === "valley" || terrain === "plains")) entries = entries.concat([{ key: "scatter/date-palm", n: 0.8 }]);

  const rng = tileRng(q, r, 0x5ca1);
  const out: Placement[] = [];
  const R = 0.72; // keep props inside the hex, off the very centre
  for (const e of entries) {
    let count = e.n * density;
    count = Math.floor(count) + (rng() < count - Math.floor(count) ? 1 : 0); // fractional → probabilistic
    for (let i = 0; i < count && out.length < 24; i += 1) {
      const ang = rng() * Math.PI * 2;
      const rad = 0.28 + rng() * R; // ring: off-centre, within the hex
      out.push({
        key: e.key,
        dx: Math.cos(ang) * rad,
        dz: Math.sin(ang) * rad,
        yaw: rng() * Math.PI * 2,       // random yaw
        scale: 0.85 + rng() * 0.3       // ±15% scale
      });
    }
  }
  return out;
}
