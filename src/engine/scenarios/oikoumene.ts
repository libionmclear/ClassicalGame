import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// "The Known World" — the classical oikoumene, traced to the ancient-world map.
// Built the sculptor's way: lay down one connected Afro-Eurasian landmass (so
// Iberia joins Gaul over the Pyrenees, and Italy joins Europe over the Alps),
// THEN carve the seas — the Atlantic, the Mediterranean around the Italian boot
// and the Greek peninsula, the Black and Caspian seas, the Aegean, the Red Sea
// and the Persian Gulf — and finally drop Britannia in as an island.
const W = 90;
const H = 56;

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
// Overlay onto LAND only (ranges/deserts that must not spill into the sea).
function onLand(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
  }
}
function set(c: number, r: number, ch: Cell): void { if (inB(c, r)) grid[r][c] = ch; }

// ============ 1. ONE CONNECTED AFRO-EURASIAN LANDMASS (plains) ============
rect(8, 8, 56, 24, ".");                 // Europe: Iberia → Gaul → Germania → Balkans
blob(13, 29, 9, 7, ".");                 // Iberia (hangs south)
rect(12, 22, 22, 27, ".");               // the Pyrenees isthmus — Iberia joins Gaul
rect(50, 4, 88, 14, ".");                // Scythia / Sarmatia (the northern steppe)
rect(28, 18, 38, 26, ".");              // the Alps massif — Italy joins Europe
stroke(35, 24, 38, 34, 1.5, ".");        // the Italian boot down to the toe
blob(38, 35, 2, 1.3, ".");               // Sicilia (rejoined to the toe, carved off later)
blob(28, 26, 1.4, 1.7, ".");             // Corsica
blob(28, 30, 1.5, 1.9, ".");             // Sardinia
blob(49, 28, 5, 5, ".");                 // Greece (Balkan peninsula)
set(47, 33, "."); set(50, 34, ".");      // the Peloponnese
blob(53, 35, 1.3, 0.9, ".");             // Crete
blob(64, 28, 11, 5, ".");                // Anatolia
rect(64, 20, 82, 32, ".");               // Armenia / the Caucasus land-bridge
rect(63, 28, 67, 46, ".");               // the Levant (Syria, Judaea)
blob(76, 38, 7, 4, ".");                 // Mesopotamia
blob(84, 34, 9, 9, ".");                 // the Persian plateau
rect(4, 42, 60, 55, ".");                // North Africa (west → east)
rect(52, 40, 66, 47, ".");               // Egypt + the Sinai bridge to the Levant
blob(72, 48, 11, 8, ".");                // Arabia

// ============ 2. CARVE THE SEAS ============
rect(0, 0, 5, 55, "~");                  // the Atlantic (western edge)
blob(3, 30, 4, 9, "~");                  // Iberia's Atlantic coast
rect(10, 0, 40, 6, "~"); rect(50, 0, 90, 4, "~"); // the northern ocean / North Sea
// the Mediterranean, carved AROUND the boot and Greece
blob(26, 38, 11, 4.5, "~");              // the western Mediterranean
blob(32, 33, 3, 4, "~");                 // the Tyrrhenian Sea (west of Italy)
blob(43, 37, 6, 4, "~");                 // the Ionian Sea (south of Italy)
blob(59, 40, 10, 4.5, "~");              // the eastern Mediterranean
blob(41, 28, 2, 5, "~");                 // the Adriatic (east of Italy)
blob(53, 30, 2.6, 4, "~");               // the Aegean (east of Greece)
blob(58, 20, 9, 4.5, "~");               // the Black Sea
blob(86, 21, 5, 6, "~");                 // the Caspian Sea
rect(55, 47, 58, 55, "~"); blob(56, 51, 2.4, 5, "~"); // the Red Sea
blob(80, 44, 4, 3, "~");                 // the Persian Gulf

// ============ 3. BRITANNIA & HIBERNIA (islands in the northern sea) ============
rect(10, 3, 30, 12, "~");                // clear the sea around them first
blob(18, 6, 3, 3.4, ".");                // Britannia
blob(18, 10, 2.2, 1.6, ".");             // southern Britannia
blob(10, 9, 2.4, 2, ".");                // Hibernia
blob(28, 41, 5, 3, ".");                 // the Tunisian cape — Carthage juts into the Med

// ============ 4. MOUNTAINS, FORESTS, DESERTS (overlay on land) ============
blob(40, 10, 14, 4.5, "f");              // Germania's great forest (over the plain)
rect(30, 6, 60, 9, "f");
onLand(17, 24, 6, 1.3, "^");             // the Pyrenees
onLand(31, 20, 8, 1.6, "^");             // the Alps (the arc between Gaul and Italy)
onLand(36, 27, 0.7, 5, "^");             // the Apennine spine
onLand(13, 41, 8, 1.5, "^");             // the Atlas
onLand(48, 13, 6, 1.4, "^");             // the Carpathians
onLand(72, 22, 7, 1.8, "^");             // the Caucasus
onLand(64, 31, 9, 1, "^");               // the Taurus
stroke(74, 30, 86, 43, 1.8, "^", true);  // the Zagros (diagonal)
onLand(64, 30, 8, 2.5, "h");             // Anatolian highland
onLand(50, 30, 3, 3, "h");               // the Greek highlands
rect(6, 48, 58, 55, "d");                // the Sahara
onLand(66, 41, 9, 4, "d");               // the Syrian desert
onLand(72, 48, 11, 8, "d");              // Arabia is desert
onLand(54, 42, 4, 3, "d"); onLand(53, 45, 3, 6, "d"); // the Egyptian desert
// keep the Nile a green thread down through the sand
stroke(52, 42, 52, 53, 0.6, ".");

// ============ 5. CAPITALS (historical seats) ============
set(36, 27, "1"); // Roma — central Italy
set(28, 41, "2"); // Carthago — the African coast opposite Sicily
set(49, 30, "3"); // Athenai — Attica, on the Aegean
set(53, 43, "4"); // Aegyptus — the Nile delta (Alexandria / Memphis)
set(20, 15, "5"); // Lutetia — the heart of Gallia
set(74, 38, "6"); // Ktesiphon — Mesopotamia, between the rivers

const rows = grid.map((row) => row.join(""));

export const oikoumeneScenario: CreateGameConfig = fromAscii({
  seed: "oikoumene",
  turnLimit: 160,
  rows,
  regions: ["Occidens", "Europa", "Italia", "Graecia", "Mediterraneum", "Africa", "Asia", "Oriens"],
  players: [
    { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
    { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
    { id: "greece", civ: "Greece", food: 8, production: 30, gold: 22, techs: ["sailing"] },
    { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
    { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
    { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
  ]
});
