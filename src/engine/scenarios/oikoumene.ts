import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// "The Known World" — the classical oikoumene drawn to shape: the Mediterranean
// at its heart, with Iberia, the Italian boot, Greece and the Aegean, Anatolia,
// the Black and Caspian seas, the Levant, Mesopotamia and Persia, the North
// African coast, the Nile, the Red Sea and Arabia. The six great powers sit
// where history put them: Rome in Italy, Carthage in Africa, Athens on the
// Aegean, Egypt on the Nile, Gaul in the west, Parthia in Mesopotamia.
const W = 66;
const H = 34;

type Cell = string;
const grid: Cell[][] = Array.from({ length: H }, () => Array<Cell>(W).fill("~"));

function inBounds(c: number, r: number): boolean {
  return c >= 0 && r >= 0 && c < W && r < H;
}
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
// Overlay ch only onto tiles that are currently LAND (ranges/deserts/rivers that
// hug the coast without spilling into the sea).
function onLand(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
  }
}
function set(c: number, r: number, ch: Cell): void { if (inBounds(c, r)) grid[r][c] = ch; }

// ---- EUROPE (northern band) --------------------------------------------------
blob(4, 5, 2, 1.4, ".");                // Hibernia
blob(9, 3, 2.4, 2.2, ".");              // Britannia
rect(12, 5, 22, 8, ".");                // Belgica / northern Gaul
blob(15, 9, 6, 4, ".");                 // Gallia
blob(31, 5, 13, 4, "f");                // Germania (forest)
rect(21, 3, 44, 5, "f");
blob(46, 3, 6, 3, ".");                 // Dacia / the north-east
// Hispania — the Iberian peninsula, hung from the Pyrenees in the SW
blob(7, 15, 6, 4.2, ".");
rect(3, 13, 12, 18, ".");
set(2, 15, ".");
// Italia — the boot dipping into the Mediterranean, with Sicily at its toe
rect(22, 9, 26, 10, ".");               // Po plain
rect(23, 11, 25, 15, ".");
set(24, 16, "."); set(25, 16, ".");     // the toe
blob(25, 18, 1.6, 1.1, ".");            // Sicilia
blob(19, 12, 1.1, 1.4, ".");            // Corsica
blob(19, 15, 1.2, 1.5, ".");            // Sardinia
// Illyria + Graecia — the Balkan peninsula and the Peloponnese into the Aegean
rect(28, 7, 33, 10, "h");               // Illyria / Dalmatia
blob(32, 12, 3, 3, "h");                // Graecia
set(31, 15, "."); set(33, 15, ".");     // the Peloponnese
blob(34, 17, 1.4, 0.9, ".");            // Crete

// ---- ASIA (east) -------------------------------------------------------------
rect(38, 0, 62, 4, ".");                // Scythia / Sarmatia (the northern steppe)
blob(44, 11, 8, 3, "h");                // Asia Minor (Anatolia)
blob(46, 16, 1, 0.9, ".");              // Cyprus
rect(46, 13, 48, 20, ".");              // the Levant coast (Syria, Judaea)
blob(52, 16, 5, 3, ",");                // Mesopotamia (fertile valley)
blob(60, 13, 7, 6, "h");                // the Iranian plateau (Persia)

// ---- AFRICA (southern band) --------------------------------------------------
rect(5, 19, 42, 21, ".");               // the North African coast, west to east
blob(20, 19, 4, 1.6, ".");              // the bulge behind Carthage
blob(39, 19, 3, 1.6, ".");              // the Nile delta
rect(38, 20, 39, 28, ".");              // the Nile, running south into the desert
blob(53, 24, 8, 5, "d");                // Arabia

// ---- Inland seas (carved out of the land) -----------------------------------
blob(43, 7, 7, 3, "~");                 // the Black Sea
blob(61, 7, 3.5, 4, "~");               // the Caspian Sea
blob(36, 13, 2.6, 2.6, "~");            // the Aegean
rect(42, 22, 44, 30, "~");              // the Red Sea
blob(55, 21, 3, 2.4, "~");              // the Persian Gulf

// ---- Mountains, deserts, rivers ---------------------------------------------
onLand(23, 8, 4, 0.9, "^");             // the Alps
onLand(24, 13, 0.5, 4, "^");            // the Apennine spine (thin)
onLand(9, 12, 4, 1, "^");               // the Pyrenees
onLand(10, 20, 5, 1, "^");              // the Atlas
onLand(49, 9, 4, 1.5, "^");             // the Caucasus
onLand(46, 12, 4, 1, "^");              // the Taurus (Asia Minor)
onLand(57, 13, 4, 3, "^");              // the Zagros (western Persia)
rect(6, 22, 41, 33, "d");               // the Sahara, south of the coast
onLand(50, 20, 6, 3, "d");              // the Syrian desert
set(38, 26, "."); set(38, 27, "."); set(39, 25, "."); // keep the Nile green

// ---- Capitals, at their historical seats ------------------------------------
set(24, 12, "1"); // Roma — central Italy
set(20, 19, "2"); // Carthago — the African coast opposite Sicily
set(32, 14, "3"); // Athenai — Attica, on the Aegean
set(39, 19, "4"); // Aegyptus — the Nile delta (Alexandria / Memphis)
set(15, 9, "5");  // Lutetia — the heart of Gallia
set(51, 16, "6"); // Ktesiphon — Mesopotamia, between the rivers

const rows = grid.map((row) => row.join(""));

export const oikoumeneScenario: CreateGameConfig = fromAscii({
  seed: "oikoumene",
  turnLimit: 140,
  rows,
  regions: ["Hispania", "Europa", "Mediterraneum", "Africa", "Asia", "Oriens"],
  players: [
    { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
    { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
    { id: "greece", civ: "Greece", food: 8, production: 30, gold: 22, techs: ["sailing"] },
    { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
    { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
    { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
  ]
});
