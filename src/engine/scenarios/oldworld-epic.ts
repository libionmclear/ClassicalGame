// HEGEMON — THE OLD WORLD (hand-authored epic map, MAP-SPEC).
// A ~96×64 classical Europe/Mediterranean world, authored from the spec's PERCENTAGE
// coordinates (x,y in 0..100). Acceptance is recognizability: the Med basin, Italy's boot,
// Britain, and the Nile must read at a glance. Built as a coordinate generator (not ASCII)
// because the spec is coordinate-based and the map needs LATITUDE climate regions, minor +
// great rivers, and starts at exact points — none of which the ASCII atlas carries.
//
// FIRST PASS: topology + all five great rivers + eight starts + latitude climate bands +
// the eight mountain spines. Coastline recognizability is refined iteratively against
// renders. Ruins/villages (region-locked) are a follow-up once the terrain is locked.
import type { Coord, CreateGameConfig, TerrainType } from "../types";
import { keyOf, neighborsOf, edgeKey } from "../hex";

const W = 96, H = 64;
const px = (pctX: number): number => Math.round((pctX / 100) * (W - 1));
const py = (pctY: number): number => Math.round((pctY / 100) * (H - 1));
function offsetToAxial(col: number, row: number): Coord { return { q: col - ((row - (row & 1)) >> 1), r: row }; }

// §11 positional climate by LATITUDE band (drives scatter climate + weather):
// northern <30%, temperate 30–55%, mediterranean 55–75%, arid >75%.
function climateBand(row: number): string {
  const y = (row / (H - 1)) * 100;
  if (y < 30) return "north";
  if (y < 55) return "temperate";
  if (y < 75) return "mediterranean";
  return "arid";
}

interface Cell { terrain: TerrainType; region: string }

export function oldWorldEpic(seed = "old-world"): CreateGameConfig {
  // Ocean canvas; land + features painted over it.
  const grid: Cell[][] = [];
  for (let row = 0; row < H; row += 1) {
    grid[row] = [];
    for (let col = 0; col < W; col += 1) grid[row][col] = { terrain: "sea", region: climateBand(row) };
  }
  const inB = (c: number, r: number): boolean => c >= 0 && c < W && r >= 0 && r < H;
  const set = (c: number, r: number, t: TerrainType, region?: string): void => {
    if (!inB(c, r)) return;
    grid[r][c].terrain = t;
    if (region) grid[r][c].region = region;
  };
  const setPct = (x: number, y: number, t: TerrainType, region?: string): void => set(px(x), py(y), t, region);

  // Fill an axis-aligned percentage box with terrain (used for landmass blocks + seas).
  const box = (x0: number, y0: number, x1: number, y1: number, t: TerrainType, region?: string): void => {
    for (let c = px(x0); c <= px(x1); c += 1) for (let r = py(y0); r <= py(y1); r += 1) set(c, r, t, region);
  };
  // A filled ellipse in percentage space — for organic landmasses/seas.
  const ellipse = (cx: number, cy: number, rx: number, ry: number, t: TerrainType, region?: string): void => {
    const c0 = px(cx - rx), c1 = px(cx + rx), r0 = py(cy - ry), r1 = py(cy + ry);
    const ccx = px(cx), ccy = py(cy), arx = px(cx + rx) - ccx || 1, ary = py(cy + ry) - ccy || 1;
    for (let c = c0; c <= c1; c += 1) for (let r = r0; r <= r1; r += 1) {
      const dx = (c - ccx) / arx, dy = (r - ccy) / ary;
      if (dx * dx + dy * dy <= 1) set(c, r, t, region);
    }
  };
  // Paint a terrain along a poly-line path (mountain spines, river courses).
  const path = (pts: Array<[number, number]>, t: TerrainType, thick = 0, region?: string): void => {
    for (let i = 0; i < pts.length - 1; i += 1) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
      const c0 = px(ax), r0 = py(ay), c1 = px(bx), r1 = py(by);
      const steps = Math.max(Math.abs(c1 - c0), Math.abs(r1 - r0)) || 1;
      for (let s = 0; s <= steps; s += 1) {
        const c = Math.round(c0 + ((c1 - c0) * s) / steps), r = Math.round(r0 + ((r1 - r0) * s) / steps);
        for (let dc = -thick; dc <= thick; dc += 1) for (let dr = -thick; dr <= thick; dr += 1) set(c + dc, r + dr, t, region);
      }
    }
  };

  // ---- LATITUDE SKELETON: EUROPE (north) | a wide central MED sea | AFRICA (south). ----
  // (A) EUROPE — one landmass, y 8..54; its Mediterranean coast is sculpted by Italy/Greece
  // jutting down and the sea band below. The y54..71 gap is left as the Mediterranean.
  box(8, 8, 96, 54, "plains", "temperate");
  box(18, 22, 34, 50, "forest", "Gaul");             // wooded Gaul
  box(34, 12, 55, 40, "forest", "Germania");         // the Hercynian forest
  box(46, 40, 62, 52, "hills", "Balkans");
  box(64, 26, 96, 46, "plains", "Steppe");           // Pontic-Caspian steppe
  box(60, 46, 96, 60, "plains", "Anatolia"); box(64, 48, 92, 58, "hills", "Anatolia"); // Anatolia dips just below the sea line
  box(8, 44, 22, 66, "hills", "Iberia"); box(9, 46, 20, 63, "plains", "Iberia");       // Iberian squarish peninsula reaching south
  // (B) AFRICA — southern landmass, y 71..100; north coast fades into the Sahara.
  box(8, 71, 80, 77, "plains", "Africa"); box(8, 77, 82, 100, "desert", "Africa");
  box(60, 72, 72, 92, "desert", "Egypt"); box(63, 92, 72, 100, "desert", "Kush");
  ellipse(38, 71, 5, 3, "plains", "Africa");         // the Carthaginian bulge (Tunisia) reaching for Sicily
  // (C) EASTERN lands south of the sea line: Levant, Mesopotamia, Persia.
  box(68, 60, 80, 78, "plains", "Levant"); box(74, 58, 90, 80, "hills", "Mesopotamia");
  box(84, 48, 96, 82, "hills", "Persia"); box(87, 52, 96, 76, "highlands", "Persia");

  // ---- SEAS carved into the land ----
  // The MEDITERRANEAN — carve one clear central sea (Europe above it, Africa below), wide W &
  // E basins narrowing at Sicily; Italy/Greece/islands are painted back into it afterwards.
  box(20, 58, 42, 70, "sea", "Mediterranean");       // western basin
  box(50, 57, 78, 70, "sea", "Mediterranean");       // eastern basin
  box(42, 62, 50, 68, "sea", "Mediterranean");       // the Sicilian narrows join them
  box(0, 0, 6, 100, "sea", "Atlantic");              // Atlantic west edge
  ellipse(26, 12, 8, 7, "sea", "North Sea");         // North Sea (frees Britain)
  ellipse(70, 50, 9, 4, "sea", "Black Sea");         // Black Sea, north of Anatolia
  ellipse(89, 42, 4, 6, "sea", "Caspian");           // Caspian (landlocked)
  box(66, 84, 70, 100, "sea", "Red Sea");            // Red Sea inlet east of Egypt
  box(82, 78, 88, 86, "sea", "Persian Gulf");
  ellipse(48, 60, 2.5, 7, "sea", "Adriatic");        // Adriatic splits Italy from the Balkans
  ellipse(60, 64, 3, 4, "sea", "Aegean");            // Aegean, east of Greece

  // ---- Signature lands painted BACK into the sea (islands + the boot) ----
  ellipse(17, 15, 4, 7, "plains", "Britain"); box(15, 4, 21, 11, "highlands", "Caledonia"); // Britain
  ellipse(9, 15, 2, 4, "plains", "Hibernia");        // Ireland
  // ITALY — the boot: hangs from Europe (y52) down through the Med toward Sicily.
  box(38, 50, 44, 55, "hills", "Italia");            // Po plain + top of the boot (attached to Europe)
  path([[41, 55], [42, 60], [43, 64], [45, 68]], "hills", 1, "Italia"); // the leg down to the toe
  setPct(41, 56, "plains", "Italia");                // Latium (Rome), west coast
  ellipse(47, 70, 2.5, 2, "hills", "Sicily");        // Sicily off the toe (Messina narrows kept 1 hex)
  ellipse(35, 62, 2, 2.5, "hills", "Sardinia"); ellipse(36, 57, 1.5, 2, "hills", "Corsica");
  // GREECE — peninsulas + Peloponnese jutting into the E Med.
  box(53, 55, 60, 61, "hills", "Greece"); path([[56, 60], [57, 64], [58, 67]], "hills", 1, "Greece");

  // ---- MOUNTAIN SPINES (§2b) — the great ranges as ridge paths ----
  path([[15, 47], [19, 47], [23, 47]], "mountains", 0, "Pyrenees");         // Pyrenees seal Iberia
  path([[36, 45], [40, 44], [44, 45], [47, 47]], "mountains", 1, "Alps");   // Alps arc (Hannibal country)
  path([[41, 52], [42, 58], [44, 64]], "mountains", 0, "Apennines");        // Apennine spine of Italy
  path([[62, 56], [66, 57], [72, 56]], "mountains", 0, "Taurus");           // Taurus (south Anatolia)
  path([[84, 52], [87, 60], [88, 68]], "mountains", 0, "Zagros");           // Zagros wall of Mesopotamia
  path([[76, 44], [80, 44], [84, 45]], "mountains", 0, "Caucasus");         // Caucasus (Black↔Caspian)
  path([[13, 74], [18, 75], [23, 75]], "mountains", 0, "Atlas");            // Atlas (NW Africa)
  path([[50, 40], [55, 41], [61, 42]], "mountains", 0, "Carpathians");      // Carpathians (N of Danube)

  // Straits — exactly 1 hex of water between two lands (naval chokepoints).
  setPct(11, 68, "sea", "Gibraltar"); setPct(62, 52, "sea", "Bosporus"); setPct(22, 22, "sea", "Channel");

  // ---- 3 + rivers: RIVERS. Great rivers become great-river TILES; minors = edge rivers. ----
  // Nile: south edge (Kush) → the valley → a delta fan at the Mediterranean's south shore.
  const nile: Array<[number, number]> = [[67, 98], [67, 90], [66, 82], [66, 76], [65, 72], [64, 70]];
  path(nile, "great-river", 0, "Egypt");
  box(61, 70, 67, 72, "great-river", "Egypt");        // delta fan into the Med (2 hexes wide)
  // Lower Danube: the Balkans → the Black Sea.
  path([[50, 44], [56, 46], [62, 48], [66, 49]], "great-river", 0, "Danube");
  // Lower Rhine: delta stretch to the North Sea.
  path([[32, 34], [31, 26], [29, 18], [28, 15]], "great-river", 0, "Rhine");
  // Tigris & Euphrates → Persian Gulf.
  path([[76, 64], [78, 70], [80, 76], [81, 80]], "great-river", 0, "Mesopotamia"); // Euphrates
  path([[80, 64], [82, 70], [83, 76], [82, 80]], "great-river", 0, "Mesopotamia"); // Tigris

  // ---- Coast ring: any land tile touching the sea becomes shallow coast's neighbour;
  // mark a one-hex coast band so ships hug the shore (and cities sit on real coasts).
  const isSea = (c: number, r: number): boolean => inB(c, r) && grid[r][c].terrain === "sea";
  const coastMark: Array<[number, number]> = [];
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const t = grid[r][c].terrain;
    if (t === "sea" || t === "great-river") continue;
    const ax = offsetToAxial(c, r);
    for (const n of neighborsOf(ax)) {
      // convert axial neighbour back to offset to test sea adjacency
      const nr = n.r, nc = n.q + ((nr - (nr & 1)) >> 1);
      if (isSea(nc, nr)) { coastMark.push([c, r]); break; }
    }
  }
  for (const [c, r] of coastMark) if (grid[r][c].terrain === "plains" || grid[r][c].terrain === "desert") grid[r][c].terrain = "coast";

  // ---- Compile to CreateGameConfig ----
  const tiles: Record<string, Cell> = {};
  const rivers: Record<string, boolean> = {};
  const usedRegions = new Set<string>();
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const cell = grid[r][c];
    usedRegions.add(cell.region);
    tiles[keyOf(offsetToAxial(c, r))] = cell;
  }

  // Minor edge-rivers: Po, Rhone, Tiber, Ebro, Seine (short flavour courses).
  const minorEdges: Array<Array<[number, number]>> = [
    [[38, 49], [42, 51], [46, 52]],   // Po → Adriatic
    [[42, 45], [40, 52], [38, 58]],   // Rhone → W Med
    [[42, 54], [41, 56], [40, 58]],   // Tiber past Rome
    [[16, 55], [12, 58], [9, 60]],    // Ebro → Atlantic-ish
    [[26, 34], [22, 30], [20, 26]]    // Seine → Channel
  ];
  for (const line of minorEdges) {
    for (let i = 0; i < line.length - 1; i += 1) {
      const a = offsetToAxial(px(line[i][0]), py(line[i][1]));
      const b = offsetToAxial(px(line[i + 1][0]), py(line[i + 1][1]));
      rivers[edgeKey(a, b)] = true;
    }
  }

  // ---- 3. THE EIGHT STARTS (spec §3) ----
  const STARTS: Array<{ id: string; civ: string; x: number; y: number }> = [
    { id: "rome", civ: "rome", x: 41, y: 56 },
    { id: "carthage", civ: "carthage", x: 38, y: 70 },
    { id: "greece", civ: "greece", x: 56, y: 62 },
    { id: "egypt", civ: "egypt", x: 66, y: 82 },
    { id: "kush", civ: "kush", x: 67, y: 95 },
    { id: "gaul", civ: "gaul", x: 26, y: 38 },
    { id: "britons", civ: "britons", x: 19, y: 22 },
    { id: "parthia", civ: "parthia", x: 88, y: 62 }
  ];
  const cities: NonNullable<CreateGameConfig["map"]>["cities"] = {};
  const units: NonNullable<CreateGameConfig["map"]>["units"] = {};
  const occupied = new Set<string>();
  const players = STARTS.map((s) => ({ id: s.id, civ: s.civ, food: 8, production: 30, gold: 20, techs: [] as string[] }));
  for (const s of STARTS) {
    const col = px(s.x), row = py(s.y);
    // Seat the capital on the nearest dry, non-mountain land (searching outward).
    let cap: Coord | null = null;
    outer: for (let rad = 0; rad < 8 && !cap; rad += 1) {
      for (let dr = -rad; dr <= rad; dr += 1) for (let dc = -rad; dc <= rad; dc += 1) {
        const c = col + dc, r = row + dr;
        if (!inB(c, r)) continue;
        const t = grid[r][c].terrain;
        if (t === "plains" || t === "valley" || t === "hills" || t === "coast" || t === "desert") {
          grid[r][c].terrain = "plains"; cap = offsetToAxial(c, r); break outer;
        }
      }
    }
    if (!cap) cap = offsetToAxial(col, row);
    const ck = keyOf(cap);
    tiles[ck] = { terrain: "plains", region: climateBand(cap.r) }; // capital always on dry plains
    cities[`${s.id}_capital`] = { id: `${s.id}_capital`, ownerId: s.id, position: cap, population: 2, hp: 40, maxHp: 40, isCapital: true };
    occupied.add(ck);
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
  }

  return {
    seed,
    turnLimit: 120,
    players,
    map: { width: W, height: H, regions: Array.from(usedRegions), rivers, tiles, cities, units }
  };
}
