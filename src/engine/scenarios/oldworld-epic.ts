// HEGEMON — THE OLD WORLD (hand-authored epic map, MAP-SPEC).
// Built the sculptor's way (as the shipped oikoumene map is, and proven recognizable): lay
// down ONE connected Afro-Eurasian landmass, THEN carve the seas — the Atlantic, the
// Mediterranean around the Italian boot and the Greek peninsula, the Black/Caspian/Aegean/
// Red seas and the Persian Gulf — then drop Britannia in as an island. On top of that we add
// what the epic map needs: the FIVE great rivers as navigable great-river tiles (Nile,
// Danube, Rhine, Tigris, Euphrates), all EIGHT starts, LATITUDE climate regions (§11), and
// region-locked ruins/villages. ~96×64, huge tier.
import type { Coord, CreateGameConfig, TerrainType } from "../types";
import { keyOf, neighborsOf } from "../hex";

const W = 96, H = 64;
type Cell = string;
const grid: Cell[][] = Array.from({ length: H }, () => Array<Cell>(W).fill("~"));

function inB(c: number, r: number): boolean { return c >= 0 && r >= 0 && c < W && r < H; }
function blob(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1) grid[r][c] = ch;
  }
}
function rect(c0: number, r0: number, c1: number, r1: number, ch: Cell): void {
  for (let r = Math.max(0, r0); r <= Math.min(H - 1, r1); r += 1)
    for (let c = Math.max(0, c0); c <= Math.min(W - 1, c1); c += 1) grid[r][c] = ch;
}
function stroke(c0: number, r0: number, c1: number, r1: number, w: number, ch: Cell, landOnly = false): void {
  const steps = Math.max(1, Math.round(Math.hypot(c1 - c0, r1 - r0)));
  for (let i = 0; i <= steps; i += 1) {
    const cx = c0 + ((c1 - c0) * i) / steps, cy = r0 + ((r1 - r0) * i) / steps;
    for (let r = Math.round(cy - w); r <= Math.round(cy + w); r += 1)
      for (let c = Math.round(cx - w); c <= Math.round(cx + w); c += 1) {
        if (!inB(c, r) || (cx - c) * (cx - c) + (cy - r) * (cy - r) > w * w + 0.5) continue;
        if (landOnly && grid[r][c] === "~") continue;
        grid[r][c] = ch;
      }
  }
}
// Overlay onto LAND only (ranges/deserts/rivers that must not spill into the open sea).
function onLand(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
  }
}
function set(c: number, r: number, ch: Cell): void { if (inB(c, r)) grid[r][c] = ch; }

// ===== 1. ONE CONNECTED AFRO-EURASIAN LANDMASS (plains "."), scaled to 96×64 =====
rect(9, 9, 60, 27, ".");                 // Europe: Iberia → Gaul → Germania → Balkans
blob(14, 33, 10, 8, ".");                // Iberia (hangs south)
rect(13, 25, 24, 31, ".");               // the Pyrenees isthmus — Iberia joins Gaul
rect(54, 4, 94, 16, ".");                // Scythia / Sarmatia (northern steppe)
rect(30, 20, 41, 30, ".");               // the Alps massif — Italy joins Europe
stroke(38, 28, 42, 44, 1.5, ".");        // the Italian boot down to the toe
blob(43, 45, 2.2, 1.4, ".");             // Sicilia (rejoined to the toe, carved off later)
blob(30, 29, 1.5, 1.9, ".");             // Corsica
blob(30, 34, 1.6, 2.1, ".");             // Sardinia
blob(54, 32, 5.5, 5.5, ".");             // Greece (Balkan peninsula)
set(52, 38, "."); set(55, 39, ".");      // the Peloponnese
blob(58, 40, 1.4, 1, ".");               // Crete
blob(69, 32, 12, 5.5, ".");              // Anatolia
rect(69, 22, 88, 36, ".");               // Armenia / the Caucasus land-bridge
rect(68, 32, 72, 52, ".");               // the Levant (Syria, Judaea)
blob(82, 43, 7.5, 4.5, ".");             // Mesopotamia
blob(90, 38, 9.5, 10, ".");              // the Persian plateau
rect(4, 47, 64, 62, ".");                // North Africa (west → east)
rect(56, 45, 71, 54, ".");               // Egypt + the Sinai bridge to the Levant
rect(58, 54, 70, 63, ".");               // the upper-Nile land down to Kush
blob(78, 55, 11, 9, ".");                // Arabia

// ===== 2. CARVE THE SEAS =====
rect(0, 0, 5, 63, "~");                  // the Atlantic (western edge)
blob(3, 34, 4, 10, "~");                 // Iberia's Atlantic coast
rect(11, 0, 44, 6, "~"); rect(54, 0, 96, 4, "~"); // the northern ocean / North Sea
blob(29, 45, 13, 5, "~");                // the western Mediterranean
blob(35, 38, 3, 4.5, "~");               // the Tyrrhenian Sea (west of Italy)
blob(47, 44, 7, 4.5, "~");               // the Ionian Sea (south of Italy)
blob(64, 47, 12, 5, "~");                // the eastern Mediterranean
blob(45, 32, 2.2, 5.5, "~");             // the Adriatic (east of Italy)
blob(58, 35, 2.8, 4.5, "~");             // the Aegean (east of Greece)
blob(63, 23, 10, 5, "~");                // the Black Sea
blob(93, 24, 5, 6.5, "~");               // the Caspian Sea
rect(60, 54, 63, 63, "~"); blob(61, 58, 2.6, 6, "~"); // the Red Sea
blob(86, 50, 4.5, 3.5, "~");             // the Persian Gulf

// ===== 3. BRITANNIA & HIBERNIA (islands in the northern sea) + Tunisian cape =====
rect(11, 3, 32, 13, "~");                // clear the sea around them first
blob(19, 7, 3.2, 3.8, ".");              // Britannia
blob(19, 11, 2.4, 1.7, ".");             // southern Britannia
blob(11, 10, 2.6, 2.2, ".");             // Hibernia
blob(30, 46, 5, 3.2, ".");               // the Tunisian cape — Carthage juts into the Med

// ===== 4. MOUNTAINS, FORESTS, DESERTS (overlay on land) =====
blob(43, 11, 15, 5, "f");                // Germania's great forest (over the plain)
rect(32, 7, 64, 10, "f");
onLand(18, 27, 6.5, 1.4, "^");           // the Pyrenees
onLand(33, 22, 9, 1.6, "^");             // the Alps (arc between Gaul and Italy — Hannibal country)
onLand(39, 30, 0.8, 5.5, "^");           // the Apennine spine of Italy
onLand(14, 46, 8.5, 1.6, "^");           // the Atlas
onLand(51, 14, 6.5, 1.5, "^");           // the Carpathians
onLand(77, 24, 7.5, 1.9, "^");           // the Caucasus
onLand(68, 34, 9.5, 1.1, "^");           // the Taurus
stroke(79, 33, 92, 47, 1.9, "^", true);  // the Zagros (diagonal wall of Mesopotamia)
onLand(68, 33, 8.5, 2.7, "h");           // Anatolian highland
onLand(54, 33, 3, 3, "h");               // the Greek highlands
onLand(14, 33, 5, 4, "h");               // the Iberian meseta hills
rect(7, 53, 62, 62, "d");                // the Sahara
onLand(70, 45, 9.5, 4.3, "d");           // the Syrian desert
onLand(78, 55, 11, 9, "d");              // Arabia is desert
onLand(58, 47, 4.3, 3.2, "d"); onLand(59, 51, 3.2, 8, "d"); // the Egyptian desert (Red/Black land)

// ===== 5. THE FIVE GREAT RIVERS (navigable great-river TILES, "=") =====
// Nile: south (Kush) → the valley → a delta at the Mediterranean's south shore.
stroke(60, 62, 60, 55, 0.7, "=", true); stroke(60, 55, 59, 47, 0.7, "=", true);
rect(57, 46, 61, 47, "=");               // the delta fan into the Med
set(60, 58, ":");                        // the Nile cataract (rapids/coast — ends navigation, Egypt↔Kush chokepoint)
// Lower Danube: the Balkans → the Black Sea.
stroke(46, 20, 62, 24, 0.7, "=", true);
// Lower Rhine: the Alps foreland → the North Sea.
stroke(34, 26, 31, 12, 0.7, "=", true);
// Tigris & Euphrates → the Persian Gulf.
stroke(84, 36, 86, 49, 0.7, "=", true);  // Tigris
stroke(80, 36, 84, 49, 0.7, "=", true);  // Euphrates

// ===== 6. THE EIGHT CAPITALS (digits 1-8 → players by index; MAP-SPEC §3) =====
set(39, 36, "1"); // Roma — central Italy, west coast on the Tiber
set(30, 46, "2"); // Carthago — the Tunisian cape opposite Sicily
set(54, 37, "3"); // Athenai — Attica, on the Aegean
set(58, 51, "4"); // Aegyptus — mid-Nile (Memphis)
set(60, 61, "5"); // Kush — upriver beyond the cataract
set(25, 17, "6"); // the Gauls — the heart of Gallia
set(19, 8, "7");  // the Britons — southern Britannia
set(84, 40, "8"); // Parthia — the Iranian plateau

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

  return {
    seed,
    turnLimit: 160,
    players,
    map: { width: W, height: H, regions: Array.from(usedRegions), rivers: {}, tiles, cities, units, ruins }
  };
}
