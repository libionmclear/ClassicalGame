// Engine hardening (Direction §3.1.1): the determinism invariant, enforced as a
// build failure. The engine is a pure reducer — same seed + same action log ⇒
// byte-identical state — so it must NEVER read the wall clock or draw unseeded
// randomness. All randomness goes through seededRandom(seed, salt); time comes in via
// args. This test fails CI the moment a banned call lands in src/engine/**.
import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const ENGINE_DIR = "src/engine";

const BANNED: Array<{ re: RegExp; name: string; why: string }> = [
  { re: /\bMath\.random\s*\(/, name: "Math.random()", why: "use seededRandom(seed, salt)" },
  { re: /\bDate\.now\s*\(/, name: "Date.now()", why: "pass the turn/time in via args" },
  { re: /\bperformance\.now\s*\(/, name: "performance.now()", why: "no wall clock in the engine" },
  { re: /\bnew\s+Date\s*\(\s*\)/, name: "new Date() (argless)", why: "pass the time in via args" }
];

// Drop // line comments and /* */ block comments so a mention in prose doesn't trip
// the guard (keeps ":" in http:// from eating a following slash-slash).
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

test("the engine uses no wall-clock time and no unseeded randomness", () => {
  const files = readdirSync(ENGINE_DIR).filter((f) => f.endsWith(".ts"));
  assert.ok(files.length > 5, "found the engine sources");
  const violations: string[] = [];
  for (const file of files) {
    const lines = stripComments(readFileSync(path.join(ENGINE_DIR, file), "utf8")).split("\n");
    lines.forEach((line, i) => {
      for (const b of BANNED) if (b.re.test(line)) violations.push(`${ENGINE_DIR}/${file}:${i + 1}  ${b.name} — ${b.why}`);
    });
  }
  assert.deepEqual(
    violations,
    [],
    "\nDeterminism invariant broken — the engine must be a pure, replayable reducer:\n  " + violations.join("\n  ") + "\n"
  );
});
