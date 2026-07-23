import { test } from "node:test";
import assert from "node:assert/strict";
import { generateMap } from "../src/engine/mapgen";

// Action 2: the Great River Valley archetype upgrades long/merged river courses to
// navigable great-river TILES; normal maps get none. Must be deterministic.
test("great rivers appear only under the archetype, and deterministically", () => {
  for (const seed of ["aa", "bb", "cc", "delta"]) {
    const on = generateMap({ size: "large", seed, greatRivers: true, playerCount: 4 });
    const grid = (cfg: typeof on) => Object.values(cfg.map?.tiles ?? {}).filter((t) => t.terrain === "great-river").length;
    const n = grid(on);
    const again = grid(generateMap({ size: "large", seed, greatRivers: true, playerCount: 4 }));
    assert.equal(n, again, `great-river count must be deterministic for seed ${seed}`);
    const off = grid(generateMap({ size: "large", seed, playerCount: 4 }));
    assert.equal(off, 0, `no great-river tiles without the archetype (seed ${seed})`);
  }
});

test("a great-river map yields at least one great-river across several seeds", () => {
  let total = 0;
  for (const seed of ["aa", "bb", "cc", "dd", "ee", "ff"]) {
    const m = generateMap({ size: "large", seed, greatRivers: true, playerCount: 4 });
    total += Object.values(m.map?.tiles ?? {}).filter((t) => t.terrain === "great-river").length;
  }
  assert.ok(total > 0, "the archetype should produce some great-river tiles across seeds");
});
