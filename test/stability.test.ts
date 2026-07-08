import test from "node:test";
import assert from "node:assert/strict";
import { computeCityStability, computeCityYield, createInitialGameState } from "../src/engine/index";
import { TECH_STABILITY } from "../src/engine/data";

// HEGEMON v2 Phase 5 — per-city stability stat (sources + yield modifier).

function makeCity(techs: string[] = []) {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  return createInitialGameState({
    seed: "stab",
    players: [{ id: "a", civ: "A", techs }],
    map: { width: 3, height: 3, regions: ["r"], tiles: tiles as never, cities: { c: { id: "c", ownerId: "a", position: { q: 1, r: 1 }, population: 5 } } }
  });
}

test("branch tech stability is a real stability source (no longer stubbed as gold)", () => {
  assert.ok((TECH_STABILITY["res-publica"] ?? 0) >= 1, "The Senate declares +stability");
});

test("stability sums buildings, techs, garrison and card perks, clamped to +5", () => {
  const s = makeCity(["res-publica"]); // +1 from the tech
  const c = s.map.cities.c;
  assert.equal(computeCityStability(s, "c"), 1);
  c.buildings = ["temple", "amphitheater", "forum"]; // +3
  assert.equal(computeCityStability(s, "c"), 4);
  s.playersById.a.perks = { stability: 3 }; // card +3 -> 7, clamps to 5
  assert.equal(computeCityStability(s, "c"), 5);
});

test("a fresh conquest is unstable and eases 1/turn over two turns", () => {
  const s = makeCity();
  const c = s.map.cities.c;
  c.capturedTurn = s.turn;
  assert.equal(computeCityStability(s, "c"), -2);
  s.turn += 1; assert.equal(computeCityStability(s, "c"), -1);
  s.turn += 2; assert.equal(computeCityStability(s, "c"), 0);
});

test("stability shifts all yields ±2%/point and grants +1 labour at +3", () => {
  const base = makeCity();
  const baseY = computeCityYield(base, "c");

  const stable = makeCity();
  stable.playersById.a.perks = { stability: 3 }; // pure stability (perks.stability isn't a pool yield)
  const stableY = computeCityYield(stable, "c");
  assert.ok(stableY.gold >= baseY.gold, "more stable = more (or equal) gold");
  assert.equal(stableY.production, Math.round(baseY.production * 1.06) + 1, "+6% labour, then +1 civic-pride labour at +3");

  const restive = makeCity();
  restive.map.cities.c.capturedTurn = restive.turn; // -2 stability
  const restiveY = computeCityYield(restive, "c");
  assert.ok(restiveY.gold <= baseY.gold, "an unstable city earns less");
});
