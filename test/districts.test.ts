import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, createInitialGameState, computeCityYield } from "../src/engine/index";
import { cityTier, districtSlots } from "../src/engine/districts";
import type { GameState } from "../src/engine/types";

// Cities v3 §2 — district system (Slice C1: slots, placement, yields, pillage/repair).

function base(civ = "rome", pop = 10, gold = 300): GameState {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = -2; r <= 2; r += 1) for (let q = -2; q <= 2; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  const s = createInitialGameState({
    seed: "distr",
    players: [{ id: "p1", civ }, { id: "p2", civ: "greece" }],
    map: {
      width: 5, height: 5, regions: ["r"], tiles: tiles as never,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: pop },
        c2: { id: "c2", ownerId: "p2", position: { q: 2, r: -2 }, population: 3 }
      }
    }
  });
  s.playersById.p1.gold = gold;
  return s;
}

test("§2 city tier from population, and district slots from tier", () => {
  assert.equal(cityTier(1), 1);
  assert.equal(cityTier(6), 3);
  assert.equal(cityTier(10), 4);
  assert.equal(cityTier(55), 10);
  assert.equal(districtSlots({ population: 10 } as never), 2); // tier 4 -> 2 slots
  assert.equal(districtSlots({ population: 3 } as never), 1);  // tier 2 -> 1 slot
});

test("§2 building a MARKET district costs gold and adds its yield", () => {
  const s = base();
  const goldBefore = s.playersById.p1.gold;
  const yieldBefore = computeCityYield(s, "c1").gold;
  const after = applyAction(s, { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "market", hex: "1,0" });
  assert.equal(after.map.cities.c1.districts?.length, 1);
  assert.ok(after.playersById.p1.gold < goldBefore, "gold was spent");
  assert.ok(computeCityYield(after, "c1").gold > yieldBefore, "the market adds gold");
});

test("§2 placement: a district must be adjacent, and a harbour needs a coast hex", () => {
  assert.throws(() => applyAction(base(), { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "market", hex: "2,0" }), /adjacent/);
  assert.throws(() => applyAction(base(), { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "harbour", hex: "1,0" }), /coast/);
});

test("§2 slots cap: a tier-2 (pop 3) city has one slot", () => {
  const s = base("rome", 3);
  const one = applyAction(s, { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "market", hex: "1,0" });
  assert.throws(() => applyAction(one, { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "civic", hex: "0,1" }), /slot/);
});

test("§2 Rome's civic district carries its unique +gold bonus", () => {
  const plain = computeCityYield(applyAction(base("greece"), { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "civic", hex: "1,0" }), "c1").gold;
  const rome = computeCityYield(applyAction(base("rome"), { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "civic", hex: "1,0" }), "c1").gold;
  assert.ok(rome > plain, "Forum & Curia earns an extra gold over the generic civic");
});

test("§2 an enemy unit pillages a district on entry; labour repairs it", () => {
  let s = base();
  s = applyAction(s, { type: "BUILD_DISTRICT", playerId: "p1", cityId: "c1", districtType: "market", hex: "1,0" });
  const wet = computeCityYield(s, "c1").gold;
  // drop an enemy soldier next to the district and march it on
  s.map.units.raider = { id: "raider", type: "warrior", ownerId: "p2", position: { q: 2, r: 0 }, hp: 20, maxHp: 20, movementRemaining: 3, veterancy: "recruit" } as never;
  s.playersById.p2.unitIds = [...s.playersById.p2.unitIds, "raider"];
  s.currentPlayerIndex = 1; // p2's turn
  s = applyAction(s, { type: "MOVE_UNIT", playerId: "p2", unitId: "raider", destination: { q: 1, r: 0 } });
  assert.ok(s.map.cities.c1.districts?.[0].pillaged, "the district is pillaged");
  assert.ok(computeCityYield(s, "c1").gold < wet, "a pillaged district yields nothing");
  s.currentPlayerIndex = 0; s.map.cities.c1.production = 60;
  s = applyAction(s, { type: "REPAIR_DISTRICT", playerId: "p1", cityId: "c1", hex: "1,0" });
  assert.ok(!s.map.cities.c1.districts?.[0].pillaged, "labour repaired it");
});
