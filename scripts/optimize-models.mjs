// HEGEMON — optimize 3D unit/prop models for the web (Direction §6.3).
//
// Raw Meshy/Tripo image-to-3D exports are ~40 MB and ~400k triangles — far too heavy
// (the board clones a unit into a squad, so one tile can be millions of tris, which
// crashes the renderer). This pass makes them shippable while staying loadable by the
// board's plain GLTFLoader (no external decoder):
//   • simplify geometry to ~4% of vertices  (~15-20k tris — plenty at strategy zoom)
//   • resize textures to 512px, WebP        (EXT_texture_webp — supported by all browsers)
//   • quantize positions/uvs                 (KHR_mesh_quantization — GLTFLoader-native)
// Result on our first three: 42-46 MB → ~0.4-0.5 MB each (~100× smaller), rendering
// identically at gameplay zoom.
//
// Usage:
//   node scripts/optimize-models.mjs                 # optimize every .glb in assets/models/_raw/ → assets/models/units/
//   node scripts/optimize-models.mjs in.glb out.glb  # one file
//
// Put RAW exports in assets/models/_raw/ (gitignored). The optimized outputs in
// assets/models/units|cities/ ARE committed and shipped by the web build.

import { spawnSync } from "node:child_process";
import { mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, "$1"), "..");
const RAW_DIR = path.join(root, "assets", "models", "_raw");
const OUT_DIR = path.join(root, "assets", "models", "units");

const FLAGS = [
  "--compress", "quantize",         // KHR_mesh_quantization — no external decoder needed
  "--texture-size", "512",
  "--texture-compress", "webp",
  "--simplify", "true",
  "--simplify-ratio", "0.04",
  "--simplify-error", "0.01"
];

function optimize(inPath, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const before = statSync(inPath).size;
  const r = spawnSync("npx", ["--yes", "@gltf-transform/cli@latest", "optimize", inPath, outPath, ...FLAGS],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", shell: true });
  if (r.status !== 0) { console.error(`✗ ${path.basename(inPath)}\n${r.stderr || r.stdout}`); return false; }
  const after = statSync(outPath).size;
  const mb = (n) => (n / 1048576).toFixed(2) + " MB";
  console.log(`✓ ${path.basename(inPath)}  ${mb(before)} → ${mb(after)}  (${(before / after).toFixed(0)}× smaller)`);
  return true;
}

const [inArg, outArg] = process.argv.slice(2);
if (inArg && outArg) {
  process.exit(optimize(path.resolve(inArg), path.resolve(outArg)) ? 0 : 1);
}

if (!existsSync(RAW_DIR)) {
  console.log(`No raw models. Drop raw .glb exports in ${path.relative(root, RAW_DIR)}/ and re-run, or pass an in/out pair.`);
  process.exit(0);
}
const raws = readdirSync(RAW_DIR).filter((f) => f.toLowerCase().endsWith(".glb"));
if (!raws.length) { console.log(`No .glb files in ${path.relative(root, RAW_DIR)}/.`); process.exit(0); }
let ok = 0;
for (const f of raws) if (optimize(path.join(RAW_DIR, f), path.join(OUT_DIR, f))) ok += 1;
console.log(`\nOptimized ${ok}/${raws.length} model(s) → ${path.relative(root, OUT_DIR)}/`);
