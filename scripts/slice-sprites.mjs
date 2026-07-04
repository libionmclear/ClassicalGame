// Slice a civ sprite sheet into individual transparent PNGs.
//
// A sheet is a transparent image with one or more horizontal BANDS (e.g. a row
// of army-size tiers, a row of city-size tiers). Within a band the sprites are
// separated by empty (transparent) gutters. For each band this tool finds the
// sprite columns automatically, trims each to its tight alpha bounds, cleans
// stray near-transparent pixels, and writes public/assets/sprites/<civ>/<kind>-<name>.png.
//
// Config: assets/sprites/sheets.json (see the "rome" entry). Run: npm run slice-sprites
//
// Because a sheet's exact vertical layout varies, each band gives yTop/yBottom
// as fractions of the image height — set those by eye from the sheet, then run.

import { PNG } from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE_DIR = path.join(ROOT, "assets", "sprites", "sources");
// Tracked output — build-web copies this into public/ (public is rebuilt each time).
const OUT_DIR = path.join(ROOT, "assets", "sprites", "dist");
const CONFIG = path.join(ROOT, "assets", "sprites", "sheets.json");

const ALPHA_THRESHOLD = 24; // below this a pixel counts as empty / is knocked out

const alphaAt = (png, x, y) => png.data[(y * png.width + x) * 4 + 3];

// Crop a sub-rectangle into a fresh transparent PNG, knocking out faint pixels.
function crop(png, x0, y0, x1, y1) {
  const w = x1 - x0;
  const h = y1 - y0;
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const si = ((y + y0) * png.width + (x + x0)) * 4;
      const di = (y * w + x) * 4;
      const a = png.data[si + 3];
      out.data[di] = png.data[si];
      out.data[di + 1] = png.data[si + 1];
      out.data[di + 2] = png.data[si + 2];
      out.data[di + 3] = a < ALPHA_THRESHOLD ? 0 : a;
    }
  }
  return out;
}

// Tight bounding box of non-empty pixels inside a region (null if fully empty).
function tightBounds(png, x0, y0, x1, y1) {
  let minX = x1;
  let minY = y1;
  let maxX = x0;
  let maxY = y0;
  let found = false;
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      if (alphaAt(png, x, y) >= ALPHA_THRESHOLD) {
        found = true;
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }
  return found ? { x0: minX, y0: minY, x1: maxX + 1, y1: maxY + 1 } : null;
}

// Column ink profile within a band, then split into runs, bridging small gaps.
function findColumns(png, bandY0, bandY1, count) {
  const W = png.width;
  const colInk = new Array(W).fill(0);
  for (let x = 0; x < W; x += 1) {
    let n = 0;
    for (let y = bandY0; y < bandY1; y += 1) if (alphaAt(png, x, y) >= ALPHA_THRESHOLD) n += 1;
    colInk[x] = n;
  }
  const gapTol = Math.max(4, Math.round(W * 0.018)); // bridge intra-sprite gutters
  const runs = [];
  let start = -1;
  let gap = 0;
  for (let x = 0; x < W; x += 1) {
    if (colInk[x] > 0) {
      if (start < 0) start = x;
      gap = 0;
    } else if (start >= 0) {
      gap += 1;
      if (gap > gapTol) {
        runs.push({ x0: start, x1: x - gap + 1 });
        start = -1;
        gap = 0;
      }
    }
  }
  if (start >= 0) runs.push({ x0: start, x1: W });

  // Keep the `count` widest runs (drops stray specks / labels), ordered L→R.
  runs.sort((a, b) => b.x1 - b.x0 - (a.x1 - a.x0));
  const chosen = runs.slice(0, count).sort((a, b) => a.x0 - b.x0);
  return chosen;
}

// Slice one band into `count` tightly-trimmed PNGs. Returns [{name, png}].
export function sliceBand(png, band) {
  const bandY0 = Math.round(band.yTop * png.height);
  const bandY1 = Math.round(band.yBottom * png.height);
  const cols = findColumns(png, bandY0, bandY1, band.count);
  const out = [];
  cols.forEach((col, i) => {
    const bounds = tightBounds(png, col.x0, bandY0, col.x1, bandY1);
    if (!bounds) return;
    const name = (band.names && band.names[i]) || String(i + 1);
    out.push({ name, png: crop(png, bounds.x0, bounds.y0, bounds.x1, bounds.y1) });
  });
  return out;
}

function sliceCiv(civ, spec) {
  const src = path.join(SOURCE_DIR, spec.file);
  if (!fs.existsSync(src)) {
    console.warn(`SKIP ${civ}: source not found at ${path.relative(ROOT, src)}`);
    return null;
  }
  const png = PNG.sync.read(fs.readFileSync(src));
  const civOut = path.join(OUT_DIR, civ);
  fs.mkdirSync(civOut, { recursive: true });
  const manifestCiv = {};
  for (const band of spec.bands) {
    const slices = sliceBand(png, band);
    manifestCiv[band.kind] = [];
    for (const s of slices) {
      const file = `${band.kind}-${s.name}.png`;
      fs.writeFileSync(path.join(civOut, file), PNG.sync.write(s.png));
      manifestCiv[band.kind].push(s.name);
    }
    console.log(`  ${civ}/${band.kind}: ${slices.map((s) => s.name).join(", ")}`);
  }
  return manifestCiv;
}

function main() {
  if (!fs.existsSync(CONFIG)) {
    console.error(`No config at ${path.relative(ROOT, CONFIG)}`);
    process.exit(1);
  }
  const config = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = {};
  for (const [civ, spec] of Object.entries(config)) {
    console.log(`Slicing ${civ} …`);
    const civManifest = sliceCiv(civ, spec);
    if (civManifest) manifest[civ] = civManifest;
  }
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest with civs: ${Object.keys(manifest).join(", ") || "(none)"}`);
}

// Run only when invoked directly (allows importing sliceBand for tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
