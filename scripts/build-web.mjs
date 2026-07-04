import { mkdir, copyFile, rm, cp, readFile, writeFile, stat } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const publicDir = path.join(root, "public");
const publicWebDir = path.join(publicDir, "web");
const spriteDist = path.join(root, "assets", "sprites", "dist");

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicWebDir, { recursive: true });

await Promise.all([
  copyFile(path.join(root, "game.html"), path.join(publicDir, "game.html")),
  copyFile(path.join(root, "game.css"), path.join(publicDir, "game.css")),
  copyFile(path.join(root, "game.js"), path.join(publicDir, "game.js")),
  copyFile(path.join(root, "board3d.html"), path.join(publicDir, "board3d.html"))
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

console.log(`Built public game bundle.${Object.keys(manifest).length ? " Sprites: " + Object.keys(manifest).join(", ") : ""}`);
