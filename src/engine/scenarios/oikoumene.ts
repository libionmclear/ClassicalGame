import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// "The Known World" — the classical oikoumene, from the Pillars of Hercules to
// the Indus, from Britain to the edge of the Sahara. Built from geographic
// shapes on a large offset grid so the six great powers sit where history put
// them: Rome in Italy, Carthage in Africa, Greece on the Aegean, Egypt on the
// Nile, Gaul in the west, Parthia in Mesopotamia. Not the Americas, not
// sub-Saharan Africa, not the Far East — the world as the ancients knew it.
const W = 66;
const H = 34;

type Cell = string;
const grid: Cell[][] = Array.from({ length: H }, () => Array<Cell>(W).fill("~"));

function inBounds(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < W && r < H;
}
// Filled ellipse.
function blob(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) {
    for (let c = 0; c < W; c += 1) {
      const dx = (c - cx) / rx;
      const dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[r][c] = ch;
    }
  }
}
// Filled rectangle (inclusive).
function rect(c0: number, r0: number, c1: number, r1: number, ch: Cell): void {
  for (let r = Math.max(0, r0); r <= Math.min(H - 1, r1); r += 1) {
    for (let c = Math.max(0, c0); c <= Math.min(W - 1, c1); c += 1) grid[r][c] = ch;
  }
}
// Overlay ch onto tiles that are currently land (never onto sea) — for ranges,
// deserts and rivers that should follow the coast, not spill into the water.
function overlayLand(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) {
    for (let c = 0; c < W; c += 1) {
      const dx = (c - cx) / rx;
      const dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
    }
  }
}
function set(c: number, r: number, ch: Cell): void {
  if (inBounds(c, r)) grid[r][c] = ch;
}

// ---- Europe (northern band) --------------------------------------------------
blob(11, 3, 4, 2, "."); // Britannia + Hibernia
blob(9, 19, 6, 5, "h"); // Hispania (Iberia)
blob(16, 11, 7, 5, "."); // Gallia
blob(28, 6, 13, 5, "f"); // Germania / central Europe (forest)
blob(36, 4, 4, 3, "."); // Dacia / the north-east
// Italia — the boot dipping into the Mediterranean
rect(23, 9, 26, 10, ".");
rect(24, 11, 25, 17, ".");
set(23, 16, ".");
set(23, 17, ".");
blob(24, 8, 3, 1, "h"); // Po plain
// Graecia — the Balkan peninsula + Peloponnese into the Aegean
blob(31, 11, 3, 3, "h");
rect(30, 14, 32, 16, "h");
set(31, 17, ".");
// Asia Minor (Anatolia) and on toward the Caucasus
blob(42, 10, 8, 3, "h");
blob(50, 8, 3, 2, "."); // Colchis / Caucasus foot

// ---- Asia (east) -------------------------------------------------------------
rect(43, 12, 45, 18, "."); // the Levant coast
blob(49, 15, 6, 4, "."); // Mesopotamia
blob(58, 13, 7, 6, "h"); // the Iranian plateau (Persia)
blob(64, 19, 4, 6, "."); // India (the Indus)

// ---- Africa (southern band) --------------------------------------------------
rect(6, 17, 41, 19, "."); // the North African coast, west to east
blob(21, 18, 4, 2, "."); // the bulge of Africa (Carthage's hinterland)
blob(38, 18, 4, 2, "."); // the Nile delta
rect(37, 19, 38, 27, "."); // the Nile, running south into the desert
blob(50, 22, 8, 6, "d"); // Arabia

// ---- Mountains, deserts, rivers ---------------------------------------------
overlayLand(24, 8, 4, 1, "^"); // the Alps
overlayLand(24, 13, 1, 5, "^"); // the Apennine spine
overlayLand(10, 15, 5, 1, "^"); // the Pyrenees
overlayLand(46, 8, 4, 2, "^"); // the Caucasus
overlayLand(60, 12, 5, 3, "^"); // the Zagros / Iranian ranges
rect(7, 21, 40, 29, "d"); // the Sahara, south of the coast
overlayLand(48, 20, 7, 3, "d"); // the Syrian / Arabian desert
set(37, 26, "."); // keep the Nile green through the desert
set(37, 25, ".");
set(38, 24, ".");

// ---- Capitals, at their historical seats ------------------------------------
set(24, 12, "1"); // Roma — central Italy
set(21, 18, "2"); // Carthago — the African coast opposite Sicily
set(31, 15, "3"); // Athenai — Attica / the Peloponnese
set(38, 18, "4"); // Aegyptus — the Nile delta (Alexandria / Memphis)
set(15, 10, "5"); // Gaul — the heart of Gallia
set(48, 15, "6"); // Ktesiphon — Mesopotamia, on the Tigris

const rows = grid.map((row) => row.join(""));

export const oikoumeneScenario: CreateGameConfig = fromAscii({
  seed: "oikoumene",
  turnLimit: 120,
  rows,
  regions: ["Europa", "Mediterraneum", "Africa", "Asia"],
  players: [
    { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
    { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
    { id: "greece", civ: "Greece", food: 8, production: 30, gold: 22, techs: ["sailing"] },
    { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
    { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
    { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
  ]
});
