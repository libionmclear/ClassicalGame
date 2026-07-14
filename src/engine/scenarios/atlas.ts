import type { Coord, CreateGameConfig, TerrainType } from "../types";
import { keyOf, neighborsOf } from "../hex";

// Odd-r offset (pointy-top) -> axial, matching the generator and renderer. An
// atlas is drawn as an ASCII grid in OFFSET space (line = row, column = char),
// so the picture you type is exactly the board you see.
function offsetToAxial(col: number, row: number): Coord {
  return { q: col - ((row - (row & 1)) >> 1), r: row };
}

// One glyph per hex. Blank and ~ are open sea, so land can be drawn on an ocean
// canvas. ':' is shallow coast (ships only). Digits 1-9 mark a player's capital
// (on plains); they map to the players array by index (1 -> players[0], ...).
const LEGEND: Record<string, TerrainType> = {
  " ": "sea",
  "~": "sea",
  ":": "coast",
  ".": "plains",
  ",": "valley",
  f: "forest",
  h: "hills",
  "^": "mountains",
  M: "mountains",
  d: "desert"
};

export interface AtlasPlayer {
  id: string;
  civ: string;
  food?: number;
  production?: number;
  gold?: number;
  techs?: string[];
}

export interface AtlasOptions {
  seed: string;
  turnLimit?: number;
  /** The map, one string per offset row. Land drawn over an implicit ocean. */
  rows: string[];
  /** Players in capital-marker order: digit "1" -> players[0], etc. */
  players: AtlasPlayer[];
  /** Weather regions, bucketed left-to-right across the map by column. */
  regions?: string[];
}

const isLand = (terrain?: string): boolean =>
  !!terrain && terrain !== "sea" && terrain !== "coast";

// Compile an ASCII atlas into a CreateGameConfig: a filled rectangle of ocean
// with the drawn landmasses, each capital seated with a warrior and a settler
// on adjacent dry land.
export function fromAscii(opts: AtlasOptions): CreateGameConfig {
  const rows = opts.rows;
  const height = rows.length;
  const width = rows.reduce((m, r) => Math.max(m, r.length), 0);

  const regionNames = opts.regions && opts.regions.length ? opts.regions : ["world"];
  const bandW = Math.max(1, Math.ceil(width / regionNames.length));
  const regionOf = (col: number): string =>
    regionNames[Math.min(regionNames.length - 1, Math.floor(col / bandW))];

  const tiles: Record<string, { terrain: TerrainType; region: string }> = {};
  const capitalAt: Record<number, Coord> = {};
  const usedRegions = new Set<string>();

  for (let row = 0; row < height; row += 1) {
    const line = rows[row];
    for (let col = 0; col < width; col += 1) {
      const ch = col < line.length ? line[col] : " ";
      let terrain: TerrainType;
      if (ch >= "1" && ch <= "9") {
        terrain = "plains";
        capitalAt[Number(ch) - 1] = offsetToAxial(col, row);
      } else {
        terrain = LEGEND[ch] ?? "sea";
      }
      const region = regionOf(col);
      usedRegions.add(region);
      tiles[keyOf(offsetToAxial(col, row))] = { terrain, region };
    }
  }

  const cities: NonNullable<CreateGameConfig["map"]>["cities"] = {};
  const units: NonNullable<CreateGameConfig["map"]>["units"] = {};
  const occupied = new Set<string>();

  opts.players.forEach((p, i) => {
    const cap = capitalAt[i];
    if (!cap) return;
    cities[`${p.id}_capital`] = {
      id: `${p.id}_capital`,
      ownerId: p.id,
      position: cap,
      population: 2,
      hp: 40,
      maxHp: 40,
      isCapital: true
    };
    occupied.add(keyOf(cap));

    // Seat the starting warrior and Explorer on adjacent dry land where possible.
    // (Explorer, not Settler — the fast scout/diplomat; found later cities by
    // training a Settler.)
    const spots: Coord[] = [];
    for (const n of neighborsOf(cap)) {
      const k = keyOf(n);
      if (isLand(tiles[k]?.terrain) && !occupied.has(k)) spots.push(n);
      if (spots.length >= 2) break;
    }
    const warriorPos = spots[0] ?? cap;
    occupied.add(keyOf(warriorPos));
    const explorerPos = spots[1] ?? cap;
    occupied.add(keyOf(explorerPos));
    units[`${p.id}_warrior`] = { id: `${p.id}_warrior`, type: "warrior", ownerId: p.id, position: warriorPos };
    units[`${p.id}_explorer`] = { id: `${p.id}_explorer`, type: "explorer", ownerId: p.id, position: explorerPos };
  });

  const players = opts.players.map((p) => ({
    id: p.id,
    civ: p.civ,
    food: p.food ?? 8,
    production: p.production ?? 30,
    gold: p.gold ?? 20,
    techs: p.techs ?? []
  }));

  return {
    seed: opts.seed,
    turnLimit: opts.turnLimit,
    players,
    map: {
      width,
      height,
      regions: Array.from(usedRegions),
      rivers: {},
      tiles,
      cities,
      units
    }
  };
}
