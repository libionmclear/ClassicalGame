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

// §11 positional climate: map a tile's region (a latitude band on random maps —
// north/central/south — or a named Old-World region) to its scatter climate, so regions
// are recognisable at a glance. Germania/Britannia/Alps = northern oak/beech/birch/fir;
// the south + Nile/Africa = arid palms/scrub; the Mediterranean middle = olive/cypress/pine.
export function climateOf(region: string | undefined): Climate {
  const r = (region || "").toLowerCase();
  if (/north|germ-|germania|britann|britain|gaul|gallia|alps|alpes|noricum|pannon|dacia|scyth|belgica|rhen|danub/.test(r)) return "northern";
  if (/south|nile|nubia|egypt|aegypt|africa|libya|numid|arabia|sahara|desert|mesopotam|syria|judea/.test(r)) return "arid";
  return "mediterranean"; // central band + Italia/Graecia/Hispania/Anatolia/islands
}

// Per climate → per biome → prop entries (key + expected count "density"). Weighted so a
// tile draws a small, varied handful. Papyrus is applied by the Nile rule below, not here.
type Entry = { key: string; n: number };
const M: Record<string, Entry[]> = {
  plains:    [{ key: "scatter/dry-grass", n: 3.0 }, { key: "scatter/limestone-boulder", n: 0.3 }],
  valley:    [{ key: "scatter/dry-grass", n: 3.6 }, { key: "scatter/olive", n: 0.4 }],
  hills:     [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/olive", n: 0.8 }, { key: "scatter/desert-scrub", n: 0.7 }, { key: "scatter/limestone-boulder", n: 0.5 }, { key: "scatter/rock-shard", n: 0.5 }],
  forest:    [{ key: "scatter/stone-pine", n: 1.6 }, { key: "scatter/cypress", n: 1.4 }, { key: "scatter/olive", n: 0.7 }, { key: "scatter/fallen-trunk", n: 0.4 }],
  highlands: [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/rock-shard", n: 0.6 }, { key: "scatter/olive", n: 0.3 }],
  mountains: [{ key: "scatter/rock-shard", n: 1.1 }],
  marsh:     [{ key: "scatter/reeds", n: 3.0 }],
  desert:    [{ key: "scatter/desert-scrub", n: 0.9 }, { key: "scatter/rock-cluster", n: 0.45 }, { key: "scatter/rock-shard", n: 0.6 }, { key: "scatter/limestone-boulder", n: 0.3 }],
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
  hills:     [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/desert-scrub", n: 0.7 }, { key: "scatter/rock-shard", n: 0.6 }],
  forest:    [{ key: "scatter/date-palm", n: 1.2 }, { key: "scatter/desert-scrub", n: 0.6 }],
  highlands: [{ key: "scatter/rock-cluster", n: 0.9 }, { key: "scatter/rock-shard", n: 0.6 }],
  mountains: [{ key: "scatter/rock-shard", n: 1.0 }, { key: "scatter/rock-cluster", n: 0.4 }],
  marsh:     [{ key: "scatter/reeds", n: 2.0 }],
  desert:    [{ key: "scatter/desert-scrub", n: 1.1 }, { key: "scatter/rock-cluster", n: 0.4 }, { key: "scatter/rock-shard", n: 0.7 }],
  coast:     [{ key: "scatter/rock-cluster", n: 0.5 }, { key: "scatter/driftwood", n: 0.3 }]
};
const TABLES: Record<Climate, Record<string, Entry[]>> = { mediterranean: M, northern: N, arid: A };

export interface Placement { key: string; dx: number; dz: number; yaw: number; scale: number }

// Smooth value-noise (deterministic, continuous across tiles) — drives the grove/clearing
// field so vegetation CLUMPS instead of spreading as even confetti.
function vhash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function vnoise(x: number, y: number): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = vhash(xi, yi), b = vhash(xi + 1, yi), c = vhash(xi + 1, yi + 1), d = vhash(xi, yi + 1);
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + d * (1 - u) * v + c * u * v;
}
// Big "canopy" props anchor a grove; everything else is understory that clusters around them.
const CANOPY = new Set(["scatter/olive", "scatter/cypress", "scatter/stone-pine", "scatter/oak", "scatter/beech", "scatter/fir", "scatter/date-palm", "scatter/papyrus"]);
// Rocks get WIDER size variance (§6: ±25%) and scatter loosely — a boulder field, not a stamp.
const ROCK = new Set(["scatter/rock-cluster", "scatter/rock-shard", "scatter/limestone-boulder", "scatter/mossy-boulder"]);

// Deterministically choose the props for one tile. `density` scales counts (mobile ~0.4);
// `riverAdj` swaps in the Nile signature (papyrus on marsh, date-palms on valley).
// Gate 4: a low-frequency grove field carves clearings between dense copses, props cluster
// around an anchor (a grove, not confetti), and canopy trees follow a size hierarchy.
export function pickScatter(terrain: string, q: number, r: number, climate: Climate, density: number, riverAdj: boolean): Placement[] {
  const table = TABLES[climate] || M;
  let entries = table[terrain];
  if (!entries) return [];
  // Nile signature (§6): riverside marsh → papyrus; riverside valley → date palms.
  if (riverAdj && terrain === "marsh") entries = [{ key: "scatter/papyrus", n: 3.2 }];
  else if (riverAdj && (terrain === "valley" || terrain === "plains")) entries = entries.concat([{ key: "scatter/date-palm", n: 0.8 }]);

  const rng = tileRng(q, r, 0x5ca1);
  // Grove/clearing multiplier — 0 in clearings (bare ground), ramping up in groves. Marsh
  // reeds genuinely blanket, so they ignore it.
  let groveMul = 1;
  if (terrain !== "marsh") {
    const gv = vnoise(q * 0.33 + 11.2, r * 0.33 + 7.7);
    const t = Math.max(0, (gv - 0.34) / 0.42);
    groveMul = Math.min(1.7, t * t * 1.6); // squared → crisp grove-vs-clearing contrast
  }
  if (groveMul <= 0.001) return []; // a clearing

  // Cluster this tile's props around ONE anchor (a copse), slightly off the centre.
  const aAng = rng() * Math.PI * 2, aRad = 0.08 + rng() * 0.38;
  const ax = Math.cos(aAng) * aRad, az = Math.sin(aAng) * aRad;

  const out: Placement[] = [];
  for (const e of entries) {
    let count = e.n * density * groveMul;
    count = Math.floor(count) + (rng() < count - Math.floor(count) ? 1 : 0);
    const canopy = CANOPY.has(e.key), rock = ROCK.has(e.key);
    for (let i = 0; i < count && out.length < 26; i += 1) {
      const spread = canopy ? 0.32 : rock ? 0.56 : 0.5; // canopy tight; rocks strewn wider
      const ang = rng() * Math.PI * 2, rad = rng() * spread;
      const dx = Math.max(-0.82, Math.min(0.82, ax + Math.cos(ang) * rad));
      const dz = Math.max(-0.82, Math.min(0.82, az + Math.sin(ang) * rad));
      // Size: canopy has a hierarchy (tall anchor → smaller), rocks vary widely (±28%),
      // understory ±15%. Every instance also gets a random yaw so nothing looks stamped.
      const scale = canopy ? (i === 0 ? 1.2 : 0.88) + rng() * 0.26
        : rock ? 0.72 + rng() * 0.56
          : 0.68 + rng() * 0.3;
      out.push({ key: e.key, dx, dz, yaw: rng() * Math.PI * 2, scale });
    }
  }
  return out;
}
