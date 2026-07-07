import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// "The Known World" — the classical oikoumene traced to the shape of the ancient
// Mediterranean map: Britannia and the Atlantic in the north-west; Iberia, Gaul,
// Germania and the Italian boot; Greece and the Aegean; the Black and Caspian
// seas; Anatolia, the Levant, Mesopotamia and the Persian plateau; the North
// African coast, the Nile through the desert, the Red Sea, the Persian Gulf and
// Arabia. Big — a grand campaign — with the six great powers at their historical
// seats.
const W = 90;
const H = 56;

type Cell = string;
const grid: Cell[][] = Array.from({ length: H }, () => Array<Cell>(W).fill("~"));

function inB(c: number, r: number): boolean { return c >= 0 && r >= 0 && c < W && r < H; }
// Filled ellipse.
function blob(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1) grid[r][c] = ch;
  }
}
// Filled rectangle (inclusive).
function rect(c0: number, r0: number, c1: number, r1: number, ch: Cell): void {
  for (let r = Math.max(0, r0); r <= Math.min(H - 1, r1); r += 1)
    for (let c = Math.max(0, c0); c <= Math.min(W - 1, c1); c += 1) grid[r][c] = ch;
}
// A fat brush stroke from (c0,r0) to (c1,r1) — coastlines, boots, mountain arcs.
function stroke(c0: number, r0: number, c1: number, r1: number, w: number, ch: Cell, landOnly = false): void {
  const steps = Math.max(1, Math.round(Math.hypot(c1 - c0, r1 - r0)));
  for (let i = 0; i <= steps; i += 1) {
    const cx = c0 + ((c1 - c0) * i) / steps;
    const cy = r0 + ((r1 - r0) * i) / steps;
    for (let r = Math.round(cy - w); r <= Math.round(cy + w); r += 1)
      for (let c = Math.round(cx - w); c <= Math.round(cx + w); c += 1) {
        if (!inB(c, r)) continue;
        if ((cx - c) * (cx - c) + (cy - r) * (cy - r) > w * w + 0.5) continue;
        if (landOnly && grid[r][c] === "~") continue;
        grid[r][c] = ch;
      }
  }
}
// Overlay onto LAND only (ranges/deserts that hug the coast).
function onLand(cx: number, cy: number, rx: number, ry: number, ch: Cell): void {
  for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
    const dx = (c - cx) / rx, dy = (r - cy) / ry;
    if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
  }
}
function set(c: number, r: number, ch: Cell): void { if (inB(c, r)) grid[r][c] = ch; }

// ===================== LAND =====================
// --- Britannia & Hibernia (north-west isles) ---
blob(17, 6, 3, 3.4, ".");
blob(19, 10, 2.6, 2.2, ".");            // southern Britannia
blob(9, 9, 2.4, 2, ".");                // Hibernia
// --- Gaul, Belgica, Germania, the steppe ---
blob(21, 16, 7.5, 5.5, ".");            // Gallia
rect(20, 10, 34, 14, ".");              // Belgica / the northern plain
blob(40, 10, 15, 5.5, "f");             // Germania (great forest)
rect(30, 6, 66, 9, "f");                // the northern forest belt
blob(70, 8, 12, 5, ".");                // Scythia / Sarmatia (open steppe)
rect(52, 5, 86, 8, ".");
// --- Iberia (Hispania) ---
blob(13, 28, 8.5, 6, ".");
rect(6, 24, 20, 31, ".");
set(5, 27, "."); set(5, 28, ".");
// --- Italia (the boot) + the great isles ---
rect(29, 20, 35, 22, ".");              // the Po plain / northern Italy
stroke(33, 22, 36, 30, 1.2, ".");       // the boot down to the toe
blob(35, 30, 1.6, 1.1, ".");            // the toe
blob(35, 33, 2, 1.3, ".");              // Sicilia
blob(28, 25, 1.3, 1.6, ".");            // Corsica
blob(28, 29, 1.4, 1.8, ".");            // Sardinia
// --- The Balkans, Greece, the Aegean shore ---
blob(43, 20, 5, 4, ".");                // Illyria / Dalmatia
blob(49, 23, 3.5, 2.5, ".");            // Macedonia / Thrace
blob(48, 29, 3.5, 3.5, "h");            // Greece
set(46, 32, "."); set(49, 33, ".");     // the Peloponnese
blob(52, 34, 1.3, 0.9, ".");            // Crete
// --- Anatolia, the Levant, Mesopotamia, Persia ---
blob(62, 28, 9, 3.5, "h");              // Asia Minor
blob(58, 30, 1, 0.9, ".");              // Cyprus
rect(63, 30, 66, 44, ".");              // the Levant coast (Syria, Judaea)
blob(74, 37, 6, 3.5, ",");              // Mesopotamia (the fertile crescent)
blob(83, 32, 8, 7, "h");                // the Iranian plateau (Persia)
blob(70, 22, 5, 3, ".");                // the Caucasus land-bridge / Colchis
// --- North Africa, the Nile, Arabia ---
rect(5, 43, 58, 47, ".");               // the African coast, west → east
blob(28, 39, 5, 3, ".");                // the Tunisian bulge (Carthage's cape)
blob(52, 43, 4, 2, ".");                // the Nile delta
rect(51, 44, 52, 52, ".");              // the Nile, running south into the desert
blob(68, 45, 9, 6, "d");                // Arabia

// ===================== SEAS (carved from the land) =====================
blob(58, 21, 9, 5, "~");                // the Black Sea
blob(82, 21, 5, 5, "~");                // the Caspian Sea
blob(51, 30, 3, 4, "~");                // the Aegean
rect(53, 46, 56, 55, "~");              // the Red Sea
blob(78, 42, 4, 3, "~");                // the Persian Gulf
// keep the Mediterranean open between southern Europe and the African coast
rect(24, 34, 62, 41, "~");
set(35, 33, "."); set(35, 34, ".");     // but not through Sicily

// ===================== MOUNTAINS, DESERTS =====================
onLand(16, 23, 6, 1, "^");              // the Pyrenees
onLand(28, 18, 6, 1.2, "^");            // the Alps (arc)
onLand(33, 25, 0.7, 5, "^");            // the Apennine spine
onLand(13, 41, 7, 1.4, "^");            // the Atlas
onLand(48, 14, 6, 1.4, "^");            // the Carpathians
onLand(70, 22, 6, 1.6, "^");            // the Caucasus
onLand(62, 31, 8, 1, "^");              // the Taurus
stroke(72, 30, 84, 42, 1.6, "^", true); // the Zagros (diagonal, on land only)
rect(6, 48, 56, 55, "d");               // the Sahara
onLand(66, 40, 8, 4, "d");              // the Syrian desert
// keep the Nile a green thread through the sand
set(51, 49, "."); set(51, 50, "."); set(52, 48, "."); set(52, 51, ".");

// ===================== CAPITALS (historical seats) =====================
set(33, 25, "1"); // Roma — central Italy
set(28, 39, "2"); // Carthago — the Tunisian cape, opposite Sicily
set(48, 30, "3"); // Athenai — Attica, on the Aegean
set(52, 43, "4"); // Aegyptus — the Nile delta (Alexandria / Memphis)
set(20, 15, "5"); // Lutetia — the heart of Gallia
set(73, 37, "6"); // Ktesiphon — Mesopotamia, between the rivers

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
