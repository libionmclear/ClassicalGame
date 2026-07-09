import test from "node:test";
import assert from "node:assert/strict";
import { applyAction, createInitialGameState, unitPopCost, RECRUITMENT } from "../src/engine/index";
import type { GameState } from "../src/engine/types";

// Cities v3 §1 — population-based recruitment (districts-data-v2.js RECRUITMENT).

function base(pop = 4): GameState {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  return createInitialGameState({
    seed: "recruit",
    players: [{ id: "p1", civ: "rome" }, { id: "p2", civ: "greece" }],
    map: {
      width: 4, height: 4, regions: ["r"], tiles: tiles as never,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: pop },
        c2: { id: "c2", ownerId: "p2", position: { q: 3, r: 3 }, population: 3 }
      }
    }
  });
}

test("§1 unitPopCost: military & settler cost 1 pop, civilians 0", () => {
  assert.equal(unitPopCost("warrior"), RECRUITMENT.militaryPopCost);
  assert.equal(unitPopCost("archer"), 1);
  assert.equal(unitPopCost("settler"), RECRUITMENT.settlerPopCost);
  assert.equal(unitPopCost("merchant"), 0); // civilian — exempt
});

test("§1 training a military unit spends a population point", () => {
  let s = base(4);
  s = applyAction(s, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "warrior", unitId: "w" });
  s.map.cities.c1.production = 80;
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  assert.equal(s.map.cities.c1.population, 3, "pop 4 -> 3");
  assert.ok(Object.values(s.map.units).some((u) => u.type === "warrior" && u.ownerId === "p1"), "the soldier was trained");
});

test("§1 a city cannot recruit below pop 2 — it waits, production stays banked", () => {
  let s = base(1); // a lone hamlet defends, it does not recruit
  s = applyAction(s, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "warrior", unitId: "w" });
  s.map.cities.c1.production = 80;
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  assert.equal(s.map.cities.c1.population, 1, "pop unchanged");
  assert.ok(!Object.values(s.map.units).some((u) => u.type === "warrior" && u.ownerId === "p1"), "no soldier trained");
  assert.ok((s.map.cities.c1.queue ?? []).includes("warrior"), "still queued, waiting to grow");
  assert.ok((s.map.cities.c1.production ?? 0) >= 80, "production not spent");
});

test("§1 disband: full-health soldier returns a full pop point to its home city", () => {
  let s = base(3);
  s.map.units.sol = { id: "sol", type: "warrior", ownerId: "p1", position: { q: 1, r: 0 }, hp: 20, maxHp: 20, movementRemaining: 0, veterancy: "recruit", homeCityId: "c1" } as never;
  s.playersById.p1.unitIds = [...s.playersById.p1.unitIds, "sol"];
  s = applyAction(s, { type: "DISBAND_UNIT", playerId: "p1", unitId: "sol" });
  assert.equal(s.map.cities.c1.population, 4, "3 -> 4");
});

test("§1 disband: a wounded soldier credits banked food, not a whole pop", () => {
  let s = base(3);
  const foodBefore = s.map.cities.c1.food ?? 0;
  s.map.units.sol = { id: "sol", type: "warrior", ownerId: "p1", position: { q: 1, r: 0 }, hp: 10, maxHp: 20, movementRemaining: 0, veterancy: "recruit", homeCityId: "c1" } as never;
  s.playersById.p1.unitIds = [...s.playersById.p1.unitIds, "sol"];
  s = applyAction(s, { type: "DISBAND_UNIT", playerId: "p1", unitId: "sol" });
  assert.equal(s.map.cities.c1.population, 3, "no whole pop at half health");
  assert.ok((s.map.cities.c1.food ?? 0) > foodBefore, "the fraction credits banked food");
});

test("§1 disband: a mercenary returns nothing", () => {
  let s = base(3);
  s.map.units.merc = { id: "merc", type: "warrior", ownerId: "p1", position: { q: 1, r: 0 }, hp: 20, maxHp: 20, movementRemaining: 0, veterancy: "recruit", homeCityId: "c1", mercenary: true } as never;
  s.playersById.p1.unitIds = [...s.playersById.p1.unitIds, "merc"];
  const foodBefore = s.map.cities.c1.food ?? 0;
  s = applyAction(s, { type: "DISBAND_UNIT", playerId: "p1", unitId: "merc" });
  assert.equal(s.map.cities.c1.population, 3, "hired men go home, not to your city");
  assert.equal(s.map.cities.c1.food ?? 0, foodBefore, "no food credit either");
});
