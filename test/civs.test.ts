import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, effectiveItemCost } from "../src/engine";
import { CIV_ROSTER, MAX_PLAYERS } from "../src/engine/mapgen";
import { UNITS } from "../src/engine/data";
import type { GameState } from "../src/engine/types";

function plains(n: number): Record<string, { terrain: "plains"; region: string }> {
  const t: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < n; r += 1) for (let q = 0; q < n; q += 1) t[`${q},${r}`] = { terrain: "plains", region: "core" };
  return t;
}

test("the roster now includes Britons and Kush (8 civs)", () => {
  const ids = CIV_ROSTER.map((c) => c.id);
  assert.ok(ids.includes("britons") && ids.includes("kush"));
  assert.equal(MAX_PLAYERS, 8);
});

test("the unique units are civ-tagged and shaped right", () => {
  assert.equal(UNITS["chariot-isles"].civ, "britons");
  assert.equal(UNITS["chariot-isles"].special, "hit-and-run");
  assert.equal(UNITS["meroe-archer"].civ, "kush");
  assert.equal(UNITS["meroe-archer"].category, "ranged");
});

function duelState(p1civ: string, unitType: string): GameState {
  return createInitialGameState({
    seed: "civduel",
    players: [{ id: "p1", civ: p1civ, gold: 200 }, { id: "p2", civ: "Rome" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles: plains(4),
      units: {
        a: { id: "a", type: unitType, ownerId: "p1", position: { q: 1, r: 1 }, movementRemaining: 4 },
        d: { id: "d", type: "archer", ownerId: "p2", position: { q: 2, r: 1 }, hp: 2 }
      },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } }
    }
  });
}

test("Britons' chariot keeps moving after it strikes (hit-and-run)", () => {
  const after = applyAction(duelState("Britons", "chariot-isles"), { type: "ATTACK", playerId: "p1", attackerId: "a", defenderId: "d" });
  assert.ok(after.map.units["a"].movementRemaining >= 1, "the chariot can still move");
  const normal = applyAction(duelState("Rome", "horseman"), { type: "ATTACK", playerId: "p1", attackerId: "a", defenderId: "d" });
  assert.equal(normal.map.units["a"].movementRemaining, 0, "an ordinary rider is spent");
});

test("Kush's Bowmen of Ta-Seti make ranged units cheaper", () => {
  const s = createInitialGameState({ seed: "kc", players: [{ id: "kush", civ: "Kush" }, { id: "rome", civ: "Rome" }], map: { width: 4, height: 4, regions: ["core"], tiles: plains(4) } });
  assert.ok(effectiveItemCost(s, "kush", "archer") < effectiveItemCost(s, "rome", "archer"), "Kush archers cost less");
});

test("Kush's ranged units are born veterans", () => {
  let s = createInitialGameState({
    seed: "kv", players: [{ id: "kush", civ: "Kush" }],
    map: { width: 4, height: 4, regions: ["core"], tiles: plains(4), cities: { c1: { id: "c1", ownerId: "kush", position: { q: 0, r: 0 }, population: 5, hp: 24, maxHp: 24 } } }
  });
  s.map.cities["c1"].production = 100;
  s.map.cities["c1"].queue = ["archer"];
  s = applyAction(s, { type: "END_TURN", playerId: "kush" });
  const archer = Object.values(s.map.units).find((u) => u.type === "archer" && u.ownerId === "kush");
  assert.ok(archer, "the archer was recruited");
  assert.equal(archer!.veterancy, "veteran", "born a veteran");
});

test("unique buildings are civ-locked", () => {
  const britons = createInitialGameState({ seed: "ub", players: [{ id: "britons", civ: "Britons" }], map: { width: 4, height: 4, regions: ["core"], tiles: plains(4), cities: { bc: { id: "bc", ownerId: "britons", position: { q: 0, r: 0 }, population: 3, hp: 24, maxHp: 24 } } } });
  const built = applyAction(britons, { type: "BUILD_BUILDING", playerId: "britons", cityId: "bc", buildingId: "nemeton" });
  assert.ok((built.map.cities["bc"].queue ?? []).includes("nemeton"), "the Britons may raise a Nemeton");

  const rome = createInitialGameState({ seed: "ub2", players: [{ id: "rome", civ: "Rome" }], map: { width: 4, height: 4, regions: ["core"], tiles: plains(4), cities: { rc: { id: "rc", ownerId: "rome", position: { q: 0, r: 0 }, population: 3, hp: 24, maxHp: 24 } } } });
  assert.throws(() => applyAction(rome, { type: "BUILD_BUILDING", playerId: "rome", cityId: "rc", buildingId: "nemeton" }), /unique to the britons/);
});
