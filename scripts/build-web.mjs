import { mkdir, copyFile, rm, cp, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
import { PNG } from "pngjs";

const root = process.cwd();
const publicDir = path.join(root, "public");
const publicWebDir = path.join(publicDir, "web");
const spriteDist = path.join(root, "assets", "sprites", "dist");

// A simple app icon: a gold hex with a red core on navy, sized within the
// maskable safe zone. Rendered per pixel (point-in-convex-polygon) — no deps
// beyond pngjs (already used for sprite slicing).
function hexIcon(size) {
  const png = new PNG({ width: size, height: size });
  const cx = size / 2, cy = size / 2, R = size * 0.36;
  const verts = (scale) => {
    const v = [];
    for (let k = 0; k < 6; k += 1) {
      const a = (Math.PI / 180) * (60 * k - 90); // pointy-top
      v.push([cx + R * scale * Math.cos(a), cy + R * scale * Math.sin(a)]);
    }
    return v;
  };
  const outer = verts(1), inner = verts(0.58);
  const inside = (px, py, vs) => {
    let sign = 0;
    for (let i = 0; i < 6; i += 1) {
      const [ax, ay] = vs[i], [bx, by] = vs[(i + 1) % 6];
      const cross = (bx - ax) * (py - ay) - (by - ay) * (px - ax);
      if (cross !== 0) { const s = cross > 0 ? 1 : -1; if (sign === 0) sign = s; else if (s !== sign) return false; }
    }
    return true;
  };
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const idx = (size * y + x) << 2;
      let r = 10, g = 26, b = 47; // navy background
      if (inside(x + 0.5, y + 0.5, outer)) { r = 242; g = 204; b = 105; } // gold hex
      if (inside(x + 0.5, y + 0.5, inner)) { r = 192; g = 57; b = 43; } // red core
      png.data[idx] = r; png.data[idx + 1] = g; png.data[idx + 2] = b; png.data[idx + 3] = 255;
    }
  }
  return PNG.sync.write(png);
}

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicWebDir, { recursive: true });
await mkdir(path.join(publicDir, "icons"), { recursive: true });

await Promise.all([
  copyFile(path.join(root, "game.html"), path.join(publicDir, "game.html")),
  copyFile(path.join(root, "game.css"), path.join(publicDir, "game.css")),
  copyFile(path.join(root, "game.js"), path.join(publicDir, "game.js")),
  copyFile(path.join(root, "net.js"), path.join(publicDir, "net.js")),
  copyFile(path.join(root, "audio.js"), path.join(publicDir, "audio.js")),
  copyFile(path.join(root, "gallery.html"), path.join(publicDir, "gallery.html")),
  copyFile(path.join(root, "board3d.html"), path.join(publicDir, "board3d.html")),
  // PWA: installable app shell.
  copyFile(path.join(root, "manifest.webmanifest"), path.join(publicDir, "manifest.webmanifest")),
  copyFile(path.join(root, "sw.js"), path.join(publicDir, "sw.js")),
  writeFile(path.join(publicDir, "icons", "icon-192.png"), hexIcon(192)),
  writeFile(path.join(publicDir, "icons", "icon-512.png"), hexIcon(512))
]);

await build({
  entryPoints: [path.join(root, "src", "engine", "browser-entry.ts")],
  bundle: true,
  format: "iife",
  globalName: "HegemonEngine",
  platform: "browser",
  outfile: path.join(publicWebDir, "engine.bundle.js")
});

// The Three.js 3D board prototype (self-contained: bundles three + the engine).
await build({
  entryPoints: [path.join(root, "src", "render3d", "board3d.ts")],
  bundle: true,
  format: "iife",
  platform: "browser",
  outfile: path.join(publicWebDir, "board3d.bundle.js")
});

// Sliced civ sprites (if any have been generated) ship as static assets, and the
// manifest is emitted as a global so the client needs no fetch (works on file://).
const exists = async (p) => {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
};

// Drop-in glTF models (assets/models/units|cities/*.glb) — copied as static
// files so the 3D board's loader can fetch them (see assets/models/README.md).
const modelsDir = path.join(root, "assets", "models");
if (await exists(modelsDir)) {
  await cp(modelsDir, path.join(publicDir, "assets", "models"), { recursive: true });
}

// Terrain biome textures (assets/terrain/<biome>/albedo|height|normal.png) — the
// continuous-landscape renderer loads these; missing ones fall back to procedural.
const terrainDir = path.join(root, "assets", "terrain");
if (await exists(terrainDir)) {
  await cp(terrainDir, path.join(publicDir, "assets", "terrain"), { recursive: true });
}

let manifest = {};
if (await exists(spriteDist)) {
  await cp(spriteDist, path.join(publicDir, "assets", "sprites"), { recursive: true });
  const manifestPath = path.join(spriteDist, "manifest.json");
  if (await exists(manifestPath)) {
    try {
      manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    } catch {
      manifest = {};
    }
  }
}
await writeFile(path.join(publicWebDir, "sprites.js"), `window.HEGEMON_SPRITES = ${JSON.stringify(manifest)};\n`);

// Cards v2 (design of record: src/cards-data-v2.js, an ES module). game.js is a
// classic script and can't `import`, so emit a browser global from the same
// single source: strip the `export` keywords and expose window.HEGEMON_CARDS_V2.
{
  const cardsSrc = await readFile(path.join(root, "src", "cards-data-v2.js"), "utf8");
  const asClassic = cardsSrc.replace(/^export const /gm, "const ") +
    "\nwindow.HEGEMON_CARDS_V2 = { RARITY, CIV_CARDS, LEGENDS, EDICTS, EVENT_CARDS, PACK_ECONOMY };\n";
  await writeFile(path.join(publicDir, "cards-data.js"), asClassic);
}

console.log(`Built public game bundle.${Object.keys(manifest).length ? " Sprites: " + Object.keys(manifest).join(", ") : ""}`);
