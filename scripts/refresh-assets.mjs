// HEGEMON — refresh-assets ("grab new images automatically"). Runnable on demand and
// at session start. Scans the raw art locations (assets/raw + Downloads) for files
// added since the last run, matches each to its canonical target by name, promotes new
// VERSIONS of known assets (re-optimize + update manifest, latest-version rule), and
// lists anything unmatched as "pending promotion — need a canonical name from Marco".
// Never auto-promotes unmatched/ambiguous files. Every promotion is logged for
// provenance.
//
//   npm run refresh-assets            # scan + promote new versions, report pending
//   npm run refresh-assets -- --all   # also (re)consider everything, not just new files
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, appendFileSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALL = process.argv.includes("--all");
const manifest = JSON.parse(readFileSync(path.join(root, "assets", "asset-manifest.json"), "utf8"));
const STATE = path.join(root, "assets", ".asset-scan.json");
const PROV = path.join(root, "assets", ".asset-provenance.log");
const RUNTIME = path.join(root, "assets", "approved", "manifest.json");

const DOWNLOADS = process.env.HEGEMON_DOWNLOADS || path.join(process.env.USERPROFILE || process.env.HOME || "", "Downloads");
const SCAN_DIRS = [...(manifest.rawDirs || ["assets/raw"]).map((d) => path.join(root, d)), DOWNLOADS];
const isDupCopy = (name) => /\(\d+\)\.[a-z0-9]+$/i.test(name);
const verOf = (name) => { const m = /\bv(\d+)\b/i.exec(name); return m ? parseInt(m[1], 10) : 0; };

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const n of readdirSync(dir)) {
    const p = path.join(dir, n);
    try { if (statSync(p).isDirectory()) out.push(...walk(p)); else out.push(p); } catch { /* skip */ }
  }
  return out;
}

const lastScan = (() => { try { return JSON.parse(readFileSync(STATE, "utf8")).lastScan || 0; } catch { return 0; } })();
const now = Date.now();
const runtime = (() => { try { return JSON.parse(readFileSync(RUNTIME, "utf8")); } catch { return { assets: {} }; } })();

// All candidate art files (glb/png), newest first, dup copies dropped.
const files = SCAN_DIRS.flatMap(walk)
  .filter((f) => /\.(glb|png)$/i.test(f) && !isDupCopy(path.basename(f)))
  .map((f) => ({ f, name: path.basename(f), mtime: statSync(f).mtimeMs }));

const newFiles = files.filter((x) => ALL || x.mtime > lastScan);
if (!newFiles.length) { console.log(`No new art since last scan (${new Date(lastScan).toISOString?.() || lastScan}). Nothing to do.`); saveState(); process.exit(0); }

const promotions = manifest.promotions || [];
const matched = [];   // { promo, file } — a new version of a known asset
const pending = [];   // files with no canonical match

for (const x of newFiles) {
  const promo = promotions.find((p) => x.name.toLowerCase().includes(String(p.source).toLowerCase()));
  if (!promo) { pending.push(x); continue; }
  // Is this newer than what we last promoted for that key? (higher vN, else newer mtime)
  const cur = runtime.assets?.[promo.key];
  const curName = cur?.source || "";
  const newer = verOf(x.name) > verOf(curName) || (verOf(x.name) === verOf(curName) && x.mtime > (cur ? 0 : -1));
  if (newer) matched.push({ promo, file: x });
}

// Re-optimize the changed keys by removing their approved output and re-running import
// (which re-resolves the latest source per the version rule and rebuilds the manifest).
if (matched.length) {
  for (const { promo } of matched) { const out = path.join(root, promo.out); if (existsSync(out)) { try { rmSync(out); } catch { /* keep */ } } }
  const r = spawnSync("npm", ["run", "import-assets"], { cwd: root, stdio: "inherit", shell: true });
  for (const { promo, file } of matched) {
    const line = `${new Date(now).toISOString()}  ${file.name}  →  ${promo.key}`;
    appendFileSync(PROV, line + "\n");
  }
  if (r.status !== 0) console.error("import-assets reported an error; check its output.");
}

console.log(`\n=== refresh-assets ===`);
console.log(`Scanned ${SCAN_DIRS.length} location(s); ${newFiles.length} new file(s) since last run.`);
console.log(`Promoted ${matched.length} new version(s):`);
for (const { promo, file } of matched) console.log(`  ✓ ${file.name}  →  ${promo.key}`);
if (pending.length) {
  console.log(`\nPENDING PROMOTION — ${pending.length} file(s) with no canonical match (need a canonical name from Marco):`);
  for (const x of pending) console.log(`  ? ${x.name}`);
  console.log(`\nAdd a promotion entry (key + source) to assets/asset-manifest.json for each, then re-run.`);
} else {
  console.log(`\nNo unmatched files. All new art is either promoted or a known duplicate.`);
}

saveState();
function saveState() { writeFileSync(STATE, JSON.stringify({ lastScan: now }, null, 2) + "\n"); }
