// Old World map <-> paintable indexed PNG round-trip (the bitmap-template pipeline).
//
//   node scripts/map-png.mjs export   # oldworld.grid.ts -> assets/maps/oldworld.png
//   node scripts/map-png.mjs import   # assets/maps/oldworld.png -> oldworld.grid.ts
//
// One PIXEL = one hex (96x64, offset-row layout). Paint the PNG in any image editor using the
// palette below (each colour = one tile type; the eight bright dots are the capitals), then
// `import` to regenerate the text grid the engine loads. Or edit oldworld.grid.ts directly.
import { PNG } from "pngjs";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const GRID_TS = "src/engine/scenarios/oldworld.grid.ts";
const PNG_PATH = "assets/maps/oldworld.png";

// glyph -> [r,g,b]. Colours are deliberately spread out so an edited/anti-aliased PNG still
// snaps to the right tile on import (nearest-colour match).
const PALETTE = {
  "~": [20, 44, 84],    // deep sea
  ":": [90, 175, 214],  // coast / cataract
  ".": [128, 176, 92],  // plains
  ",": [96, 205, 96],   // valley
  "f": [30, 92, 44],    // forest
  "h": [162, 120, 68],  // hills
  "H": [132, 112, 82],  // highlands
  "^": [122, 122, 122], // mountains
  "d": [232, 202, 120], // desert
  "s": [70, 140, 116],  // marsh
  "=": [66, 150, 202],  // great-river
  "o": [40, 182, 120],  // oasis
  "1": [232, 30, 30], "2": [232, 128, 30], "3": [224, 214, 40], "4": [120, 232, 30],
  "5": [30, 232, 140], "6": [30, 150, 232], "7": [150, 30, 232], "8": [232, 30, 176] // capitals 1-8
};
const CHARS = Object.keys(PALETTE);

function readGrid() {
  const src = readFileSync(GRID_TS, "utf8");
  const m = src.match(/export const OLD_WORLD_GRID = \[([\s\S]*?)\]\.join/);
  if (!m) throw new Error("OLD_WORLD_GRID not found");
  return [...m[1].matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((x) => JSON.parse('"' + x[1] + '"'));
}
function writeGrid(rows) {
  const header = `// HEGEMON — THE OLD WORLD, terrain source of truth (bitmap-template pipeline).
//
// One character = one hex (offset-row layout), 96 wide x 64 tall. EDIT THIS to reshape the
// map — it is git-diffable and fixable in minutes, no regeneration. The loader in
// oldworld-epic.ts maps each glyph through LEGEND (the palette):
//   ~ deep sea    : coast/cataract   . plains    , valley    f forest
//   h hills       H highlands        ^ mountains  d desert    s marsh    = great-river   o oasis
//   1-8 = the eight capitals (rendered as plains; placed by digit).
// Rows are top (north, row 0) to bottom (south). Keep every row exactly 96 chars.
// Round-trips with a paintable PNG via scripts/map-png.mjs.
export const OLD_WORLD_GRID = [
`;
  writeFileSync(GRID_TS, header + rows.map((r) => "  " + JSON.stringify(r)).join(",\n") + '\n].join("\\n");\n');
}
function nearest(r, g, b) {
  let best = "~", bd = Infinity;
  for (const ch of CHARS) { const [pr, pg, pb] = PALETTE[ch]; const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2; if (d < bd) { bd = d; best = ch; } }
  return best;
}

const mode = process.argv[2];
if (mode === "export") {
  const rows = readGrid();
  const H = rows.length, W = rows[0].length;
  const img = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
    const ch = rows[y][x] || "~"; const [r, g, b] = PALETTE[ch] || PALETTE["~"]; const i = (y * W + x) << 2;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  }
  mkdirSync(path.dirname(PNG_PATH), { recursive: true });
  writeFileSync(PNG_PATH, PNG.sync.write(img));
  console.log(`exported ${W}x${H} -> ${PNG_PATH}`);
} else if (mode === "import") {
  const img = PNG.sync.read(readFileSync(PNG_PATH));
  const rows = [];
  for (let y = 0; y < img.height; y += 1) {
    let row = "";
    for (let x = 0; x < img.width; x += 1) { const i = (y * img.width + x) << 2; row += nearest(img.data[i], img.data[i + 1], img.data[i + 2]); }
    rows.push(row);
  }
  writeGrid(rows);
  console.log(`imported ${img.width}x${img.height} ${PNG_PATH} -> ${GRID_TS}`);
} else {
  console.log("usage: node scripts/map-png.mjs export|import");
  process.exit(1);
}
