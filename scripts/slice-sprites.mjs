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

// These sheets ship with a baked-in "transparency" checkerboard (near-white +
// a muted tan) plus soft drop shadows. Both are bright and nearly grey, while
// the sprite art is either saturated (reds, blues, terracotta) or dark (its
// outlines). So "bright and low-saturation" keys the background — and because
// the flood starts at the border, dark sprite outlines keep it out of figures.
function isBackground(r, g, b) {
  const max = Math.max(r, g, b);
  const sat = max - Math.min(r, g, b);
  return max >= 150 && sat <= 52;
}

// Flood-fill the checkerboard from the borders and make it transparent. Flooding
// (rather than a global colour key) avoids punching holes in light sprite areas
// like stone walls or skin, since those are enclosed by darker sprite outlines.
export function keyOutBackground(png) {
  const { width: W, height: H, data } = png;
  const visited = new Uint8Array(W * H);
  const stack = [];
  const consider = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    const p = y * W + x;
    if (visited[p]) return;
    const i = p * 4;
    if (!isBackground(data[i], data[i + 1], data[i + 2])) return;
    visited[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < W; x += 1) {
    consider(x, 0);
    consider(x, H - 1);
  }
  for (let y = 0; y < H; y += 1) {
    consider(0, y);
    consider(W - 1, y);
  }
  while (stack.length) {
    const p = stack.pop();
    data[p * 4 + 3] = 0;
    const x = p % W;
    const y = (p - x) / W;
    // 8-connectivity so the flood crosses the checker's diagonal corners and
    // clears isolated squares left by anti-aliasing shade variation.
    consider(x + 1, y);
    consider(x - 1, y);
    consider(x, y + 1);
    consider(x, y - 1);
    consider(x + 1, y + 1);
    consider(x - 1, y - 1);
    consider(x + 1, y - 1);
    consider(x - 1, y + 1);
  }
  return png;
}

// Remove tiny isolated opaque blobs (stray label pixels, keyout residue) so
// each sprite trims to its real bounds. Keeps anything a real figure's size.
export function despeckle(png, minArea = 60) {
  const { width: W, height: H, data } = png;
  const seen = new Uint8Array(W * H);
  const solid = (p) => data[p * 4 + 3] >= ALPHA_THRESHOLD;
  for (let p = 0; p < W * H; p += 1) {
    if (seen[p] || !solid(p)) continue;
    const comp = [p];
    seen[p] = 1;
    for (let qi = 0; qi < comp.length; qi += 1) {
      const q = comp[qi];
      const x = q % W;
      const neigh = [q + W, q - W];
      if (x > 0) neigh.push(q - 1);
      if (x < W - 1) neigh.push(q + 1);
      for (const np of neigh) {
        if (np < 0 || np >= W * H || seen[np] || !solid(np)) continue;
        seen[np] = 1;
        comp.push(np);
      }
    }
    if (comp.length < minArea) for (const q of comp) data[q * 4 + 3] = 0;
  }
  return png;
}

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

// The sprites in a band sit in a row of `count` cells. The gutters BETWEEN
// cells are the widest empty columns; gaps within a sprite (between figures,
// between buildings) are narrower. So: find the band's inked extent, then cut it
// at the `count-1` widest interior gaps. Robust to stray specks and uneven
// spacing, and it never over-merges the way gap-bridging did.
function columnsFor(png, bandY0, bandY1, count) {
  const W = png.width;
  const bandH = bandY1 - bandY0;
  const minInk = Math.max(2, Math.round(bandH * 0.05)); // ignore speck noise
  const colInk = new Array(W).fill(0);
  for (let x = 0; x < W; x += 1) {
    let n = 0;
    for (let y = bandY0; y < bandY1; y += 1) if (alphaAt(png, x, y) >= ALPHA_THRESHOLD) n += 1;
    colInk[x] = n;
  }
  const inked = (x) => colInk[x] >= minInk;

  let x0 = 0;
  while (x0 < W && !inked(x0)) x0 += 1;
  let x1 = W - 1;
  while (x1 > x0 && !inked(x1)) x1 -= 1;
  if (x1 <= x0) return [];

  // Interior empty runs = candidate gutters.
  const gaps = [];
  let gs = -1;
  for (let x = x0; x <= x1; x += 1) {
    if (!inked(x)) {
      if (gs < 0) gs = x;
    } else if (gs >= 0) {
      gaps.push({ a: gs, b: x - 1, w: x - gs });
      gs = -1;
    }
  }

  let cuts;
  if (gaps.length >= count - 1) {
    cuts = gaps
      .sort((p, q) => q.w - p.w)
      .slice(0, count - 1)
      .map((g) => Math.round((g.a + g.b) / 2))
      .sort((a, b) => a - b);
  } else {
    // Sprites merged with no clear gutters — divide the extent evenly.
    cuts = [];
    for (let i = 1; i < count; i += 1) cuts.push(x0 + Math.round(((x1 - x0) * i) / count));
  }

  const cols = [];
  let prev = x0;
  for (const c of cuts) {
    cols.push({ x0: prev, x1: c });
    prev = c;
  }
  cols.push({ x0: prev, x1: x1 + 1 });
  return cols;
}

// Slice one band into `count` tightly-trimmed PNGs. Returns [{name, png}].
export function sliceBand(png, band) {
  const bandY0 = Math.round(band.yTop * png.height);
  const bandY1 = Math.round(band.yBottom * png.height);
  const cols = columnsFor(png, bandY0, bandY1, band.count);
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
  keyOutBackground(png); // strip the baked-in checkerboard to real transparency
  despeckle(png, 120); // drop stray label/keyout specks so sprites trim tightly
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
    if (civ.startsWith("_") || civ.startsWith("@")) continue; // meta / shared blocks
    // Bands may be inline or a "@name" reference to a shared block.
    const bands = typeof spec.bands === "string" ? config[spec.bands] : spec.bands;
    console.log(`Slicing ${civ} …`);
    const civManifest = sliceCiv(civ, { ...spec, bands });
    if (civManifest) manifest[civ] = civManifest;
  }
  fs.writeFileSync(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nWrote manifest with civs: ${Object.keys(manifest).join(", ") || "(none)"}`);
}

// Run only when invoked directly (allows importing sliceBand for tests).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
