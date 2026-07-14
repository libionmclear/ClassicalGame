import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import { UNITS } from "../src/engine/data";
import type { GameState, Unit } from "../src/engine/types";

function cityState(techs: string[] = [], pop = 2): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  return createInitialGameState({
    seed: "gar",
    players: [{ id: "p1", civ: "Rome", gold: 100, techs }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: pop, hp: 40, maxHp: 40 } }
    }
  });
}
function garrisonOf(s: GameState, ownerId: string): Unit | undefined {
  return Object.values(s.map.units).find((u) => u.garrison && u.ownerId === ownerId);
}

test("an undefended city musters a free garrison on its owner's turn", () => {
  let s = cityState();
  assert.equal(garrisonOf(s, "p1"), undefined, "no garrison before the first turn ends");
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  const g = garrisonOf(s, "p1");
  assert.ok(g, "a garrison mustered");
  assert.equal(g!.position.q, 1);
  assert.equal(g!.position.r, 1, "it stands on the city centre");
  assert.equal((UNITS[g!.type].attack ?? 0) > 0, true, "it's a real defender");
});

test("the garrison gets tougher as the owner's age advances", () => {
  const early = applyAction(cityState([]), { type: "END_TURN", playerId: "p1" });
  const late = applyAction(cityState(["bronze-working", "iron-working"]), { type: "END_TURN", playerId: "p1" });
  const ge = garrisonOf(early, "p1")!;
  const gl = garrisonOf(late, "p1")!;
  assert.ok((UNITS[gl.type].defense ?? 0) >= (UNITS[ge.type].defense ?? 0), "a more advanced civ fields a stronger defender");
});

test("a garrison holds its post and cannot be disbanded", () => {
  const s = cityState();
  s.map.units.g = { id: "g", type: "spearman", ownerId: "p1", position: { q: 1, r: 1 }, hp: 20, maxHp: 20, movementRemaining: 2, veterancy: "recruit", garrison: true } as Unit;
  s.playersById.p1.unitIds = [...s.playersById.p1.unitIds, "g"];
  assert.throws(() => applyAction(s, { type: "MOVE_UNIT", playerId: "p1", unitId: "g", destination: { q: 2, r: 1 } }), /holds its post/);
  assert.throws(() => applyAction(s, { type: "DISBAND_UNIT", playerId: "p1", unitId: "g" }), /cannot be disbanded/);
});

test("a city still on its garrison cooldown does not muster yet", () => {
  let s = cityState();
  s.map.cities.c1.garrisonReadyTurn = s.turn + 5; // as if the last one just fell
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  assert.equal(garrisonOf(s, "p1"), undefined, "it waits out the cooldown before mustering again");
});

test("a city already holding a soldier does not also spawn a garrison", () => {
  const s = cityState();
  s.map.units.sol = { id: "sol", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 }, hp: 20, maxHp: 20, movementRemaining: 1, veterancy: "recruit" } as Unit;
  s.playersById.p1.unitIds = [...s.playersById.p1.unitIds, "sol"];
  const after = applyAction(s, { type: "END_TURN", playerId: "p1" });
  assert.equal(garrisonOf(after, "p1"), undefined, "the standing soldier already defends the centre");
});
