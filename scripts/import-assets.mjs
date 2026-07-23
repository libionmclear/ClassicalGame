// HEGEMON — asset import / promotion pipeline (DIRECTION-UPDATE §6; asset-version rule
// from WATER-SPEC). The gate for all art integration:
//
//   raw uploads  →  [promote]  →  approved (optimized, committed)  →  manifest  →  game
//
// Only assets listed in assets/asset-manifest.json ("promotions") are integrated —
// RAW assets are NEVER used until promoted. For each promotion the script resolves the
// LATEST source version (the asset-version rule: highest `vN` suffix, then newest file
// date), optimizes it by kind, writes the approved output, and emits a resolved runtime
// manifest (assets/approved/manifest.json) the game reads — so textures are swappable
// by re-running this, no code change.
//
// Usage:  npm run import-assets            (promote everything whose output is missing)
//         npm run import-assets -- --force (re-process every promotion)
//
// Raw sources are searched under the manifest's `rawDirs` (default assets/raw/, which
// is gitignored — drop raw Meshy/Midjourney exports there). Textures are copied at
// source resolution for now (no image lib installed); resize/KTX2 is a pluggable step.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FORCE = process.argv.includes("--force");
const manifestPath = path.join(root, "assets", "asset-manifest.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

// Recursively list files under a dir.
function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Raw sources are searched under the manifest's rawDirs AND the user's Downloads
// (where Meshy exports land) — the spec's designated raw + Downloads scan. Override
// Downloads with HEGEMON_DOWNLOADS.
const DOWNLOADS = process.env.HEGEMON_DOWNLOADS || path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads");
export const SCAN_DIRS = [...(manifest.rawDirs || ["assets/raw"]).map((d) => path.join(root, d)), DOWNLOADS];
const rawFiles = SCAN_DIRS.flatMap(walk);

// A Windows "(1)"/"(2)" copy is a duplicate, never the canonical file.
const isDupCopy = (name) => /\(\d+\)\.[a-z0-9]+$/i.test(name);

// The ASSET VERSION RULE: among files whose name contains `source`, pick the highest
// version suffix (v1, v2, …), then the newest modification time; ignore dup copies.
export function resolveLatest(source, files = rawFiles) {
  const matches = files.filter((f) => path.basename(f).toLowerCase().includes(source.toLowerCase()));
  if (!matches.length) return null;
  const scored = matches.map((f) => {
    const b = path.basename(f);
    const m = /\bv(\d+)\b/i.exec(b);
    return { f, ver: m ? parseInt(m[1], 10) : 0, mtime: statSync(f).mtimeMs, dup: isDupCopy(b) ? 1 : 0 };
  });
  scored.sort((a, b) => (a.dup - b.dup) || (b.ver - a.ver) || (b.mtime - a.mtime));
  return scored[0];
}

const mb = (n) => (n / 1048576).toFixed(2) + " MB";

function optimizeModel(src, out) {
  // shell:true does NOT escape args, so paths with spaces (…/Classical Age Game/…) must
  // be quoted or gltf-transform sees several broken args.
  // Scatter props are drawn small in many instances → optimise HARD (256px textures,
  // heavy decimation). Unit/city models (kept separately) can afford more detail.
  const isScatter = out.includes("approved/props") || out.includes("approved\\props");
  const texSize = isScatter ? "256" : "512";
  // Scatter props are drawn tiny in many instances → decimate HARD (~10k verts). Gate 1:
  // 0.03 left them at ~27k verts, heavy for dense forests; 0.012 → ~11k with no visible
  // loss at scatter scale. simplify-error loosened so the ratio is actually reached.
  const ratio = isScatter ? "0.012" : "0.04";
  const simpErr = isScatter ? "0.02" : "0.01";
  const r = spawnSync("npx", ["--yes", "@gltf-transform/cli@latest", "optimize", `"${src}"`, `"${out}"`,
    "--compress", "quantize", "--texture-size", texSize, "--texture-compress", "webp",
    "--simplify", "true", "--simplify-ratio", ratio, "--simplify-error", simpErr],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8", shell: true });
  if (r.status !== 0 && process.env.DEBUG_IMPORT) console.error(r.stderr || r.stdout);
  return r.status === 0;
}

const runtime = { generatedFrom: "assets/asset-manifest.json", assetVersionRule: manifest.assetVersionRule, assets: {} };
const log = [];
for (const p of manifest.promotions || []) {
  const outAbs = path.join(root, p.out);
  const outExists = existsSync(outAbs);
  const resolved = resolveLatest(p.source);
  const version = resolved ? (/(v\d+)/i.exec(path.basename(resolved.f)) || [, "v0"])[1] : (outExists ? "(pre-approved)" : null);

  if (!resolved) {
    // No raw source found. If the approved output already exists it's already promoted
    // (e.g. the unit models, whose 40 MB raws live outside assets/raw); record and skip.
    if (outExists) { runtime.assets[p.key] = { path: p.out, kind: p.kind, version, bytes: statSync(outAbs).size, note: "pre-approved (no raw in rawDirs)" }; log.push(`• ${p.key.padEnd(22)} pre-approved  ${p.out}`); }
    else log.push(`✗ ${p.key.padEnd(22)} NO SOURCE for "${p.source}" and no approved output — skipped`);
    continue;
  }
  if (outExists && !FORCE) {
    runtime.assets[p.key] = { path: p.out, kind: p.kind, version, bytes: statSync(outAbs).size, source: path.basename(resolved.f) };
    log.push(`• ${p.key.padEnd(22)} up-to-date    ${version}  ${p.out}`);
    continue;
  }
  mkdirSync(path.dirname(outAbs), { recursive: true });
  let ok = true;
  if (p.kind === "model") ok = optimizeModel(resolved.f, outAbs);
  else copyFileSync(resolved.f, outAbs); // texture/reference: copy at source res (resize hook goes here)
  if (!ok) { log.push(`✗ ${p.key.padEnd(22)} FAILED to optimize ${path.basename(resolved.f)}`); continue; }
  const bytes = statSync(outAbs).size;
  runtime.assets[p.key] = { path: p.out, kind: p.kind, version, bytes, source: path.basename(resolved.f) };
  log.push(`✓ ${p.key.padEnd(22)} promoted ${version}  ${path.basename(resolved.f)}  (${mb(bytes)})`);
}

const runtimePath = path.join(root, "assets", "approved", "manifest.json");
mkdirSync(path.dirname(runtimePath), { recursive: true });
writeFileSync(runtimePath, JSON.stringify(runtime, null, 2) + "\n");

console.log(log.join("\n"));
console.log(`\nResolved runtime manifest → ${path.relative(root, runtimePath)}  (${Object.keys(runtime.assets).length} assets)`);
