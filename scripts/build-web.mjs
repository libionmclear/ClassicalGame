import { mkdir, copyFile, rm } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

const root = process.cwd();
const publicDir = path.join(root, "public");
const publicWebDir = path.join(publicDir, "web");

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicWebDir, { recursive: true });

await Promise.all([
  copyFile(path.join(root, "game.html"), path.join(publicDir, "game.html")),
  copyFile(path.join(root, "game.css"), path.join(publicDir, "game.css")),
  copyFile(path.join(root, "game.js"), path.join(publicDir, "game.js"))
]);

await build({
  entryPoints: [path.join(root, "src", "engine", "browser-entry.ts")],
  bundle: true,
  format: "iife",
  globalName: "HegemonEngine",
  platform: "browser",
  outfile: path.join(publicWebDir, "engine.bundle.js")
});

console.log("Built public game bundle.");
