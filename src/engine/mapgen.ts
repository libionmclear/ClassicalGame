import { seededRandom } from "./rng";
import { keyOf, neighborsOf, parseKey, distance } from "./hex";
import type { Coord, CreateGameConfig, TerrainType } from "./types";

export type MapSize = "small" | "medium" | "large" | "xl";

interface SizeSpec {
  width: number;
  height: number;
  bands: number;
  label: string;
}

export const MAP_SIZES: Record<MapSize, SizeSpec> = {
  small: { width: 9, height: 7, bands: 2, label: "Small" },
  medium: { width: 13, height: 10, bands: 2, label: "Medium" },
  large: { width: 18, height: 13, bands: 3, label: "Large" },
  xl: { width: 24, height: 17, bands: 3, label: "XL" }
};

export interface GenerateMapOptions {
  size?: MapSize;
  seed?: string;
}

// Land tiles a basic (unteched) land unit can traverse — used for connectivity so
// the two capitals are always joined by a walkable route (domination stays possible).
const WALKABLE: ReadonlySet<TerrainType> = new Set<TerrainType>([
  "plains",
  "valley",
  "forest",
  "hills",
  "desert"
]);
const CAPITAL_TERRAIN: ReadonlySet<TerrainType> = new Set<TerrainType>(["plains", "valley", "hills"]);

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

function lattice(seed: string, salt: string, x: number, y: number): number {
  return seededRandom(seed, `${salt}:${x}:${y}`)();
}

// Bilinearly interpolated value noise on a lattice of cell size `cell`.
function valueNoise(seed: string, salt: string, x: number, y: number, cell: number): number {
  const gx = x / cell;
  const gy = y / cell;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const v00 = lattice(seed, salt, x0, y0);
  const v10 = lattice(seed, salt, x0 + 1, y0);
  const v01 = lattice(seed, salt, x0, y0 + 1);
  const v11 = lattice(seed, salt, x0 + 1, y0 + 1);
  const sx = smooth(fx);
  const sy = smooth(fy);
  const top = v00 + (v10 - v00) * sx;
  const bottom = v01 + (v11 - v01) * sx;
  return top + (bottom - top) * sy;
}

// Fractal (multi-octave) noise, normalized to ~[0, 1].
function fbm(seed: string, salt: string, x: number, y: number): number {
  return (
    0.55 * valueNoise(seed, salt, x, y, 5.5) +
    0.3 * valueNoise(seed, salt, x, y, 2.7) +
    0.15 * valueNoise(seed, salt, x, y, 1.4)
  );
}

function terrainFor(elev: number, moist: number): TerrainType {
  if (elev < 0.3) return "sea";
  if (elev < 0.38) return "coast";
  if (elev > 0.83) return "mountains";
  if (elev > 0.7) return "hills";
  if (moist < 0.3) return "desert";
  if (moist > 0.68 && elev < 0.55) return "valley";
  if (moist > 0.52) return "forest";
  return "plains";
}

function bandName(r: number, height: number, bands: number): string {
  const idx = Math.min(bands - 1, Math.floor((r / height) * bands));
  if (bands <= 2) return idx === 0 ? "north" : "south";
  return ["north", "central", "south"][idx];
}

interface TerrainField {
  tiles: Record<string, { terrain: TerrainType; region: string }>;
  regions: string[];
}

function buildTerrain(seed: string, spec: SizeSpec): TerrainField {
  const { width, height, bands } = spec;
  const tiles: Record<string, { terrain: TerrainType; region: string }> = {};
  const regionSet = new Set<string>();

  for (let r = 0; r < height; r += 1) {
    for (let q = 0; q < width; q += 1) {
      let elev = fbm(seed, "elev", q, r) + 0.06;
      // Edge falloff sinks the borders into sea, leaving a central landmass with coasts.
      const nx = width <= 1 ? 0 : (q / (width - 1)) * 2 - 1;
      const ny = height <= 1 ? 0 : (r / (height - 1)) * 2 - 1;
      const edge = Math.max(Math.abs(nx), Math.abs(ny));
      elev -= 0.55 * Math.pow(edge, 3);

      // South of the map trends drier (a North-Africa-style desert belt).
      const moist = fbm(seed, "moist", q, r) - 0.22 * (height <= 1 ? 0 : r / (height - 1));

      const region = bandName(r, height, bands);
      regionSet.add(region);
      tiles[keyOf({ q, r })] = { terrain: terrainFor(elev, moist), region };
    }
  }

  const order = ["north", "central", "south"];
  const regions = order.filter((name) => regionSet.has(name));
  return { tiles, regions };
}

function largestWalkableComponent(
  tiles: Record<string, { terrain: TerrainType; region: string }>,
  spec: SizeSpec
): string[] {
  const inBounds = (c: Coord) => c.q >= 0 && c.r >= 0 && c.q < spec.width && c.r < spec.height;
  const isWalkable = (key: string) => tiles[key] && WALKABLE.has(tiles[key].terrain);

  const seen = new Set<string>();
  let best: string[] = [];

  for (const startKey of Object.keys(tiles)) {
    if (seen.has(startKey) || !isWalkable(startKey)) continue;
    const component: string[] = [];
    const queue = [startKey];
    seen.add(startKey);
    while (queue.length > 0) {
      const key = queue.pop() as string;
      component.push(key);
      for (const n of neighborsOf(parseKey(key))) {
        if (!inBounds(n)) continue;
        const nk = keyOf(n);
        if (!seen.has(nk) && isWalkable(nk)) {
          seen.add(nk);
          queue.push(nk);
        }
      }
    }
    if (component.length > best.length) best = component;
  }

  return best;
}

function farthestPair(keys: string[]): [string, string] | null {
  if (keys.length < 2) return null;
  let best: [string, string] | null = null;
  let bestDist = -1;
  for (let i = 0; i < keys.length; i += 1) {
    for (let j = i + 1; j < keys.length; j += 1) {
      const d = distance(parseKey(keys[i]), parseKey(keys[j]));
      if (d > bestDist) {
        bestDist = d;
        best = [keys[i], keys[j]];
      }
    }
  }
  return best;
}

function placeStarters(
  capitalKey: string,
  tiles: Record<string, { terrain: TerrainType; region: string }>,
  spec: SizeSpec,
  taken: Set<string>
): { warrior: Coord; settler: Coord } {
  const cap = parseKey(capitalKey);
  const inBounds = (c: Coord) => c.q >= 0 && c.r >= 0 && c.q < spec.width && c.r < spec.height;
  const free = neighborsOf(cap).filter(
    (c) => inBounds(c) && tiles[keyOf(c)] && WALKABLE.has(tiles[keyOf(c)].terrain) && !taken.has(keyOf(c))
  );
  const warrior = free[0] ?? cap;
  taken.add(keyOf(warrior));
  const settler = free.find((c) => keyOf(c) !== keyOf(warrior)) ?? cap;
  taken.add(keyOf(settler));
  return { warrior, settler };
}

function tryGenerate(seed: string, spec: SizeSpec): CreateGameConfig | null {
  const { tiles, regions } = buildTerrain(seed, spec);
  const component = largestWalkableComponent(tiles, spec);
  const minComponent = Math.max(8, Math.floor(spec.width * spec.height * 0.15));
  if (component.length < minComponent) return null;

  const preferred = component.filter((k) => CAPITAL_TERRAIN.has(tiles[k].terrain));
  const pool = preferred.length >= 2 ? preferred : component;
  const pair = farthestPair(pool);
  if (!pair) return null;

  const [romeKey, carthageKey] = pair;
  const minSeparation = Math.max(4, Math.floor((spec.width + spec.height) / 4));
  if (distance(parseKey(romeKey), parseKey(carthageKey)) < minSeparation) return null;

  const taken = new Set<string>([romeKey, carthageKey]);
  const romeStart = placeStarters(romeKey, tiles, spec, taken);
  const carthageStart = placeStarters(carthageKey, tiles, spec, taken);

  const romePos = parseKey(romeKey);
  const carthagePos = parseKey(carthageKey);

  return {
    seed,
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
      { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
    ],
    map: {
      width: spec.width,
      height: spec.height,
      regions,
      rivers: {},
      tiles,
      cities: {
        rome_capital: {
          id: "rome_capital",
          ownerId: "rome",
          position: romePos,
          population: 2,
          hp: 40,
          maxHp: 40,
          isCapital: true
        },
        carthage_capital: {
          id: "carthage_capital",
          ownerId: "carthage",
          position: carthagePos,
          population: 2,
          hp: 40,
          maxHp: 40,
          isCapital: true
        }
      },
      units: {
        r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: romeStart.warrior },
        r_settler: { id: "r_settler", type: "settler", ownerId: "rome", position: romeStart.settler },
        c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: carthageStart.warrior },
        c_settler: { id: "c_settler", type: "settler", ownerId: "carthage", position: carthageStart.settler }
      }
    }
  };
}

export function generateMap(options: GenerateMapOptions = {}): CreateGameConfig {
  const size = options.size ?? "medium";
  const spec = MAP_SIZES[size];
  if (!spec) throw new Error(`Unknown map size ${size}`);
  const baseSeed = options.seed ?? "hegemon-map";

  // Deterministic retries: a few noise variants until one yields a big enough
  // landmass with two well-separated capitals.
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const seed = attempt === 0 ? baseSeed : `${baseSeed}#${attempt}`;
    const config = tryGenerate(seed, spec);
    if (config) return config;
  }

  throw new Error(`Map generation failed for size ${size} (seed ${baseSeed})`);
}
