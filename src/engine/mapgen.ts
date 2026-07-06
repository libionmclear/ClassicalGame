import { seededRandom } from "./rng";
import { keyOf, neighborsOf, parseKey, distance, edgeKey } from "./hex";
import { RESOURCES } from "./data";
import type { Coord, CreateGameConfig, TerrainType } from "./types";

// Deterministic 0..1 hash of a string (FNV-1a), so resource placement is stable
// for a given seed without threading an RNG object through the terrain builder.
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967296;
}

// Scatter strategic resource deposits across suitable tiles (~13% density).
// Accepts full or partial tiles (scenarios use partials), keyed by axial "q,r".
export function sprinkleResources(
  tiles: Record<string, { terrain?: string; resource?: string }>,
  seed: string
): void {
  const byTerrain: Record<string, string[]> = {};
  for (const [id, rule] of Object.entries(RESOURCES)) {
    for (const t of rule.terrains) (byTerrain[t] ||= []).push(id);
  }
  for (const key of Object.keys(tiles)) {
    const tile = tiles[key];
    if (tile.resource || !tile.terrain) continue;
    const opts = byTerrain[tile.terrain];
    if (!opts || !opts.length) continue;
    if (hash01(seed + ":res:" + key) > 0.13) continue;
    const pick = hash01(seed + ":pick:" + key);
    tile.resource = opts[Math.min(opts.length - 1, Math.floor(pick * opts.length))];
  }
}

export type MapSize = "small" | "medium" | "large" | "xl" | "huge";

interface SizeSpec {
  width: number;
  height: number;
  bands: number;
  rivers: number;
  label: string;
}

// width = offset columns, height = offset rows. Bigger and much squarer than
// before (near-equal cols/rows read as a square board, not a wide strip).
export const MAP_SIZES: Record<MapSize, SizeSpec> = {
  small: { width: 15, height: 13, bands: 2, rivers: 2, label: "Small" },
  medium: { width: 21, height: 18, bands: 3, rivers: 3, label: "Medium" },
  large: { width: 27, height: 24, bands: 3, rivers: 5, label: "Large" },
  xl: { width: 34, height: 30, bands: 4, rivers: 6, label: "XL" },
  huge: { width: 48, height: 38, bands: 5, rivers: 9, label: "Huge (ludicrous)" }
};

// Odd-r offset (pointy-top) <-> axial. Generation walks a rectangle in offset
// space and stores tiles under axial keys, so the engine keeps axial adjacency
// while the board draws as a clean rectangle.
function offsetToAxial(col: number, row: number): Coord {
  return { q: col - ((row - (row & 1)) >> 1), r: row };
}

export interface GenerateMapOptions {
  size?: MapSize;
  seed?: string;
  playerCount?: number;
  /** Civ id the human wants to play — seated first so it is always present. */
  humanCiv?: string;
  /** Exact seat order of civ ids (overrides humanCiv); used to measure balance. */
  civOrder?: string[];
}

export interface CivInfo {
  id: string;
  civ: string;
  color: string;
  adjective: string;
  capital: string;
}

// Player 0 is always the human (Rome). Rivals are drawn in order.
// Colours are historically evocative and mutually distinct.
export const CIV_ROSTER: ReadonlyArray<CivInfo> = [
  { id: "rome", civ: "Rome", color: "#c0392b", adjective: "Roman", capital: "Roma" },
  { id: "carthage", civ: "Carthage", color: "#8e44ad", adjective: "Carthaginian", capital: "Carthago" },
  { id: "greece", civ: "Athenians", color: "#2e86de", adjective: "Athenian", capital: "Athenai" },
  { id: "egypt", civ: "Egypt", color: "#d4ac0d", adjective: "Egyptian", capital: "Memphis" },
  { id: "gaul", civ: "Gaul", color: "#27ae60", adjective: "Gallic", capital: "Bibracte" },
  { id: "parthia", civ: "Parthia", color: "#e67e22", adjective: "Parthian", capital: "Ktesiphon" }
];

export const MAX_PLAYERS = CIV_ROSTER.length;

// Sensible default rival count per map size (still user-overridable).
export const DEFAULT_PLAYERS: Record<MapSize, number> = {
  small: 2,
  medium: 3,
  large: 4,
  xl: 5,
  huge: 6
};

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
  elevation: Record<string, number>;
}

function buildTerrain(seed: string, spec: SizeSpec): TerrainField {
  const cols = spec.width;
  const rows = spec.height;
  const bands = spec.bands;
  const tiles: Record<string, { terrain: TerrainType; region: string }> = {};
  const elevation: Record<string, number> = {};
  const regionSet = new Set<string>();

  // Walk a rectangle in offset (col, row); noise is sampled in offset space so
  // terrain reads coherently on the rectangular board.
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      let elev = fbm(seed, "elev", col, row) + 0.06;
      // Edge falloff sinks the borders into sea, leaving a central landmass with coasts.
      const nx = cols <= 1 ? 0 : (col / (cols - 1)) * 2 - 1;
      const ny = rows <= 1 ? 0 : (row / (rows - 1)) * 2 - 1;
      const edge = Math.max(Math.abs(nx), Math.abs(ny));
      elev -= 0.55 * Math.pow(edge, 3);

      // South of the map trends drier (a North-Africa-style desert belt).
      const moist = fbm(seed, "moist", col, row) - 0.22 * (rows <= 1 ? 0 : row / (rows - 1));

      const region = bandName(row, rows, bands);
      regionSet.add(region);
      const key = keyOf(offsetToAxial(col, row));
      tiles[key] = { terrain: terrainFor(elev, moist), region };
      elevation[key] = elev;
    }
  }

  const order = ["north", "central", "south"];
  const regions = order.filter((name) => regionSet.has(name));
  return { tiles, regions, elevation };
}

// Carve rivers by tracing downhill from high, wet interior tiles to the sea.
// Each step marks the crossed edge; the renderer draws them as flowing lines.
function carveRivers(
  tiles: Record<string, { terrain: TerrainType; region: string }>,
  elevation: Record<string, number>,
  spec: SizeSpec,
  count: number
): Record<string, boolean> {
  const rivers: Record<string, boolean> = {};
  const inBounds = (c: Coord) => tiles[keyOf(c)] !== undefined;

  // Sources: the highest land tiles, greedily spaced apart.
  const sources = Object.keys(tiles)
    .filter((k) => WALKABLE.has(tiles[k].terrain))
    .sort((a, b) => elevation[b] - elevation[a]);

  const chosen: string[] = [];
  for (const key of sources) {
    if (chosen.length >= count) break;
    const c = parseKey(key);
    if (chosen.every((ck) => distance(parseKey(ck), c) >= 3)) chosen.push(key);
  }

  for (const source of chosen) {
    let currentKey = source;
    const visited = new Set<string>([currentKey]);
    for (let step = 0; step < spec.width + spec.height; step += 1) {
      const current = parseKey(currentKey);
      let bestKey: string | null = null;
      let bestElev = elevation[currentKey];
      for (const n of neighborsOf(current)) {
        if (!inBounds(n)) continue;
        const nk = keyOf(n);
        if (visited.has(nk)) continue;
        if (elevation[nk] < bestElev) {
          bestElev = elevation[nk];
          bestKey = nk;
        }
      }
      if (!bestKey) break;
      rivers[edgeKey(current, parseKey(bestKey))] = true;
      visited.add(bestKey);
      currentKey = bestKey;
      const t = tiles[bestKey].terrain;
      if (t === "sea" || t === "coast") break; // reached the coast
    }
  }

  return rivers;
}

function largestWalkableComponent(
  tiles: Record<string, { terrain: TerrainType; region: string }>,
  spec: SizeSpec
): string[] {
  const inBounds = (c: Coord) => tiles[keyOf(c)] !== undefined;
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

// Greedy farthest-point dispersion: seed with the two most distant candidates,
// then repeatedly add the candidate maximizing distance to the nearest chosen one.
function pickDispersed(pool: string[], n: number): string[] {
  const pair = farthestPair(pool);
  if (!pair) return pool.slice(0, n);
  const chosen = [pair[0], pair[1]];
  while (chosen.length < n) {
    let best: string | null = null;
    let bestMin = -1;
    for (const k of pool) {
      if (chosen.includes(k)) continue;
      let nearest = Infinity;
      for (const c of chosen) nearest = Math.min(nearest, distance(parseKey(k), parseKey(c)));
      if (nearest > bestMin) {
        bestMin = nearest;
        best = k;
      }
    }
    if (!best) break;
    chosen.push(best);
  }
  return chosen.slice(0, n);
}

function placeStarters(
  capitalKey: string,
  tiles: Record<string, { terrain: TerrainType; region: string }>,
  spec: SizeSpec,
  taken: Set<string>
): { warrior: Coord; settler: Coord } {
  const cap = parseKey(capitalKey);
  const inBounds = (c: Coord) => tiles[keyOf(c)] !== undefined;
  const free = neighborsOf(cap).filter(
    (c) => inBounds(c) && tiles[keyOf(c)] && WALKABLE.has(tiles[keyOf(c)].terrain) && !taken.has(keyOf(c))
  );
  const warrior = free[0] ?? cap;
  taken.add(keyOf(warrior));
  const settler = free.find((c) => keyOf(c) !== keyOf(warrior)) ?? cap;
  taken.add(keyOf(settler));
  return { warrior, settler };
}

function tryGenerate(
  seed: string,
  spec: SizeSpec,
  playerCount: number,
  roster: ReadonlyArray<CivInfo> = CIV_ROSTER
): CreateGameConfig | null {
  const { tiles, regions, elevation } = buildTerrain(seed, spec);
  const component = largestWalkableComponent(tiles, spec);
  const minComponent = Math.max(8, playerCount * 3, Math.floor(spec.width * spec.height * 0.15));
  if (component.length < minComponent) return null;

  const preferred = component.filter((k) => CAPITAL_TERRAIN.has(tiles[k].terrain));
  const pool = preferred.length >= playerCount ? preferred : component;
  if (pool.length < playerCount) return null;

  const capitalKeys = pickDispersed(pool, playerCount);
  if (capitalKeys.length < playerCount) return null;

  // Reject cramped layouts: the two closest capitals must be reasonably apart.
  const minSeparation = Math.max(3, Math.floor((spec.width + spec.height) / (playerCount + 2)));
  let closest = Infinity;
  for (let i = 0; i < capitalKeys.length; i += 1) {
    for (let j = i + 1; j < capitalKeys.length; j += 1) {
      closest = Math.min(closest, distance(parseKey(capitalKeys[i]), parseKey(capitalKeys[j])));
    }
  }
  if (closest < minSeparation) return null;

  const taken = new Set<string>(capitalKeys);
  const players: CreateGameConfig["players"] = [];
  const cities: NonNullable<CreateGameConfig["map"]>["cities"] = {};
  const units: NonNullable<CreateGameConfig["map"]>["units"] = {};

  for (let i = 0; i < playerCount; i += 1) {
    const { id, civ } = roster[i];
    const capitalKey = capitalKeys[i];
    const position = parseKey(capitalKey);
    players.push({ id, civ, food: 8, production: 30, gold: 20 });
    cities[`${id}_capital`] = {
      id: `${id}_capital`,
      ownerId: id,
      position,
      population: 2,
      hp: 40,
      maxHp: 40,
      isCapital: true
    };
    const start = placeStarters(capitalKey, tiles, spec, taken);
    units[`${id}_warrior`] = { id: `${id}_warrior`, type: "warrior", ownerId: id, position: start.warrior };
    units[`${id}_settler`] = { id: `${id}_settler`, type: "settler", ownerId: id, position: start.settler };
  }

  const rivers = carveRivers(tiles, elevation, spec, spec.rivers);
  sprinkleResources(tiles, seed);

  return {
    seed,
    players,
    map: { width: spec.width, height: spec.height, regions, rivers, tiles, cities, units }
  };
}

export function generateMap(options: GenerateMapOptions = {}): CreateGameConfig {
  const size = options.size ?? "medium";
  const spec = MAP_SIZES[size];
  if (!spec) throw new Error(`Unknown map size ${size}`);
  const baseSeed = options.seed ?? "hegemon-map";
  const requested = Math.max(2, Math.min(MAX_PLAYERS, Math.floor(options.playerCount ?? 2)));
  const turnLimit = TURN_LIMITS[size] ?? 60;
  // Seat the human's chosen civ first so it is always in the game (and player 0).
  // A full civOrder (used by the balance harness) overrides this to seat civs in
  // an exact order, so every civ can be measured at every seat.
  const roster = options.civOrder
    ? (options.civOrder
        .map((id) => CIV_ROSTER.find((c) => c.id === id))
        .filter((c): c is CivInfo => Boolean(c)))
    : orderRoster(options.humanCiv);

  // Deterministic retries: a few noise variants until one yields a big enough
  // landmass with well-separated capitals. If a small map genuinely can't seat
  // the requested civs, step the count down rather than fail — never throw.
  for (let playerCount = requested; playerCount >= 2; playerCount -= 1) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const seed = attempt === 0 ? baseSeed : `${baseSeed}#${attempt}`;
      const config = tryGenerate(seed, spec, playerCount, roster);
      if (config) {
        config.turnLimit = turnLimit;
        return config;
      }
    }
  }

  // Last resort: a flat 2-player fallback so the caller always gets a playable map.
  const fallback = tryGenerate(`${baseSeed}#fallback`, spec, 2, roster) ?? buildFlatFallback(spec, baseSeed);
  fallback.turnLimit = turnLimit;
  return fallback;
}

// Roster with the chosen civ moved to the front (rest keep historic order).
function orderRoster(humanCiv?: string): ReadonlyArray<CivInfo> {
  if (!humanCiv) return CIV_ROSTER;
  const chosen = CIV_ROSTER.find((c) => c.id === humanCiv);
  if (!chosen) return CIV_ROSTER;
  return [chosen, ...CIV_ROSTER.filter((c) => c.id !== humanCiv)];
}

export const TURN_LIMITS: Record<MapSize, number> = {
  small: 40,
  medium: 60,
  large: 80,
  xl: 100,
  huge: 140
};

// A guaranteed-valid map: all plains rectangle, two capitals on opposite sides.
function buildFlatFallback(spec: SizeSpec, seed: string): CreateGameConfig {
  const tiles: Record<string, { terrain: TerrainType; region: string }> = {};
  for (let row = 0; row < spec.height; row += 1) {
    for (let col = 0; col < spec.width; col += 1) {
      tiles[keyOf(offsetToAxial(col, row))] = { terrain: "plains", region: bandName(row, spec.height, spec.bands) };
    }
  }
  const midRow = Math.floor(spec.height / 2);
  const romePos = offsetToAxial(1, midRow);
  const carthagePos = offsetToAxial(spec.width - 2, midRow);
  const romeSettler = offsetToAxial(1, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
  const carthageSettler = offsetToAxial(spec.width - 2, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
  return {
    seed,
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
      { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
    ],
    map: {
      width: spec.width,
      height: spec.height,
      regions: Array.from(new Set(Object.values(tiles).map((t) => t.region))),
      rivers: {},
      tiles,
      cities: {
        rome_capital: { id: "rome_capital", ownerId: "rome", position: romePos, population: 2, hp: 40, maxHp: 40, isCapital: true },
        carthage_capital: { id: "carthage_capital", ownerId: "carthage", position: carthagePos, population: 2, hp: 40, maxHp: 40, isCapital: true }
      },
      units: {
        r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: offsetToAxial(2, midRow) },
        r_settler: { id: "r_settler", type: "settler", ownerId: "rome", position: romeSettler },
        c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: offsetToAxial(spec.width - 3, midRow) },
        c_settler: { id: "c_settler", type: "settler", ownerId: "carthage", position: carthageSettler }
      }
    }
  };
}
