// HEGEMON — THE OLD WORLD (bitmap-template pipeline).
// Terrain is AUTHORED as a per-hex grid in oldworld.grid.ts (one character per hex, 96x64,
// git-diffable, paintable in any text/image editor). This module loads that grid, maps each
// glyph through LEGEND (the palette), and overlays the point features: the eight capitals
// (digit glyphs), the five great rivers (already "=" tiles in the grid), region-locked
// ruins/villages, and latitude climate. Coordinate-based blob/stroke generation is retired.
import type { Coord, CreateGameConfig, TerrainType } from "../types";
import { keyOf, neighborsOf } from "../hex";
import { OLD_WORLD_GRID } from "./oldworld.grid";

const W = 96, H = 64;
type Cell = string;
// The paintable source of truth — edit oldworld.grid.ts to reshape the map (fixable in minutes).
const grid: Cell[][] = OLD_WORLD_GRID.split("\n").map((line) => line.split(""));

// ===== 7. COMPILE the glyph grid → CreateGameConfig =====
const LEGEND: Record<string, TerrainType> = {
  "~": "sea", " ": "sea", ":": "coast", ".": "plains", ",": "valley",
  f: "forest", h: "hills", H: "highlands", "^": "mountains", M: "mountains", d: "desert", "=": "great-river"
};
function offsetToAxial(col: number, row: number): Coord { return { q: col - ((row - (row & 1)) >> 1), r: row }; }
// §11 positional climate by LATITUDE (drives scatter climate + weather): northern <30%,
// temperate 30–55%, mediterranean 55–75%, arid >75%.
function climateBand(row: number): string {
  const y = (row / (H - 1)) * 100;
  if (y < 30) return "north";
  if (y < 55) return "temperate";
  if (y < 75) return "mediterranean";
  return "arid";
}

export function oldWorldEpic(seed = "old-world"): CreateGameConfig {
  const tiles: Record<string, { terrain: TerrainType; region: string }> = {};
  const capitalAt: Record<number, Coord> = {};
  const usedRegions = new Set<string>();
  for (let row = 0; row < H; row += 1) {
    for (let col = 0; col < W; col += 1) {
      const ch = grid[row][col];
      let terrain: TerrainType;
      if (ch >= "1" && ch <= "9") { terrain = "plains"; capitalAt[Number(ch) - 1] = offsetToAxial(col, row); }
      else terrain = LEGEND[ch] ?? "sea";
      const region = climateBand(row);
      usedRegions.add(region);
      tiles[keyOf(offsetToAxial(col, row))] = { terrain, region };
    }
  }

  const cities: NonNullable<CreateGameConfig["map"]>["cities"] = {};
  const units: NonNullable<CreateGameConfig["map"]>["units"] = {};
  const occupied = new Set<string>();
  const STARTS = [
    { id: "rome", civ: "rome" }, { id: "carthage", civ: "carthage" }, { id: "greece", civ: "greece" },
    { id: "egypt", civ: "egypt" }, { id: "kush", civ: "kush" }, { id: "gaul", civ: "gaul" },
    { id: "britons", civ: "britons" }, { id: "parthia", civ: "parthia" }
  ];
  const players = STARTS.map((s) => ({ id: s.id, civ: s.civ, food: 8, production: 30, gold: 20, techs: [] as string[] }));
  STARTS.forEach((s, i) => {
    const cap = capitalAt[i];
    if (!cap) return;
    tiles[keyOf(cap)] = { terrain: "plains", region: climateBand(cap.r) };
    cities[`${s.id}_capital`] = { id: `${s.id}_capital`, ownerId: s.id, position: cap, population: 2, hp: 40, maxHp: 40, isCapital: true };
    occupied.add(keyOf(cap));
    const spots: Coord[] = [];
    for (const n of neighborsOf(cap)) {
      const k = keyOf(n); const tt = tiles[k]?.terrain;
      if (tt && tt !== "sea" && tt !== "coast" && tt !== "great-river" && tt !== "mountains" && !occupied.has(k)) spots.push(n);
      if (spots.length >= 2) break;
    }
    const wp = spots[0] ?? cap; occupied.add(keyOf(wp));
    const ep = spots[1] ?? cap; occupied.add(keyOf(ep));
    units[`${s.id}_warrior`] = { id: `${s.id}_warrior`, type: "warrior", ownerId: s.id, position: wp };
    units[`${s.id}_explorer`] = { id: `${s.id}_explorer`, type: "explorer", ownerId: s.id, position: ep };
  });

  // Region-locked RUINS at their historical seats (ids from discovery.ts), snapped to the
  // nearest land and away from capitals. Authored here, so the engine won't scatter them.
  const RUIN_SITES: Array<[number, number, string]> = [
    [58, 47, "giza"], [86, 45, "ur"], [88, 42, "ashurbanipal"], [72, 30, "hattusa"],
    [74, 34, "gobekli"], [58, 40, "knossos"], [56, 38, "mycenae"], [63, 33, "troy"],
    [60, 60, "kerma"], [30, 34, "nuraghe"], [40, 30, "terramare"], [45, 12, "nebra"],
    [35, 24, "hallstatt"], [19, 12, "stonehenge"], [14, 34, "tartessos"]
  ];
  const isLand = (c: number, r: number): boolean => { const t = tiles[keyOf(offsetToAxial(c, r))]; return !!t && t.terrain !== "sea" && t.terrain !== "coast" && t.terrain !== "great-river"; };
  const snap = (c0: number, r0: number): Coord | null => {
    for (let rad = 0; rad < 6; rad += 1) for (let dr = -rad; dr <= rad; dr += 1) for (let dc = -rad; dc <= rad; dc += 1) {
      if (isLand(c0 + dc, r0 + dr)) { const p = offsetToAxial(c0 + dc, r0 + dr); if (!occupied.has(keyOf(p))) return p; }
    }
    return null;
  };
  const ruins: Record<string, { ruinId: string; excavated?: boolean }> = {};
  for (const [c, r, id] of RUIN_SITES) {
    const p = snap(c, r); if (!p) continue;
    const k = keyOf(p); if (ruins[k]) continue;
    ruins[k] = { ruinId: id, excavated: false }; occupied.add(k);
  }

  // Region-locked minor-people VILLAGES (§10.3, ids from peoples.ts) at their real seats,
  // snapped to nearby land off capitals/ruins. Authored here so the engine won't scatter them.
  type Disp = "open" | "wary" | "hostile";
  const VILLAGE_SITES: Array<[number, number, string, Disp]> = [
    [42, 38, "latins", "open"], [43, 40, "samnites", "hostile"], [37, 33, "etruscans", "wary"],
    [41, 30, "veneti", "open"], [49, 33, "illyrians", "wary"], [58, 31, "thracians", "wary"],
    [55, 27, "getae", "hostile"], [66, 37, "lydians", "open"], [80, 35, "armenians", "wary"],
    [68, 45, "judeans", "wary"], [72, 50, "nabataeans", "hostile"], [86, 48, "chaldeans", "wary"],
    [28, 50, "numidians", "hostile"], [28, 15, "belgae", "wary"]
  ];
  const villages: Record<string, { peopleId: string; disposition: Disp; contacted?: boolean; attempts?: number }> = {};
  for (const [c, r, id, disp] of VILLAGE_SITES) {
    const p = snap(c, r); if (!p) continue;
    const k = keyOf(p); if (villages[k] || ruins[k]) continue;
    villages[k] = { peopleId: id, disposition: disp }; occupied.add(k);
  }

  return {
    seed,
    turnLimit: 160,
    players,
    map: { width: W, height: H, regions: Array.from(usedRegions), rivers: {}, tiles, cities, units, ruins, villages }
  };
}
