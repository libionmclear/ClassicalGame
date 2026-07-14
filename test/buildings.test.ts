import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, BUILDINGS } from "../src/engine/index";

function cityState(techs: string[] = []) {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 3; r += 1) {
    for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  }
  return createInitialGameState({
    seed: "bld",
    players: [
      { id: "p1", civ: "Rome", science: 0, techs },
      { id: "p2", civ: "Carthage" }
    ],
    map: {
      width: 3,
      height: 3,
      regions: ["core"],
      // give the capital a big production stockpile so queued items finish next turn
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40, production: 60 } }
    }
  });
}

test("a queued building banks production and completes on the next turn", () => {
  let state = cityState(["pottery"]); // Granary now needs Pottery (storage jars)
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "granary" });
  assert.ok(state.map.cities.c1.queue?.includes("granary"), "granary is queued, not built instantly");
  assert.ok(!(state.map.cities.c1.buildings ?? []).includes("granary"), "not built yet");

  const before = state.map.cities.c1.production ?? 0;
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  assert.ok(state.map.cities.c1.buildings?.includes("granary"), "granary built after the turn");
  assert.equal(state.map.cities.c1.queue?.length, 0, "queue drained");
  assert.ok((state.map.cities.c1.production ?? 0) < before + 10, "production spent on the granary");
});

test("walls raise the city's max HP once built", () => {
  let state = cityState(["masonry"]);
  const before = state.map.cities.c1.maxHp;
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "walls" });
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  assert.equal(state.map.cities.c1.maxHp, before + (BUILDINGS.walls.cityHp ?? 0));
  assert.ok(state.map.cities.c1.hp > before, "current HP rose with the walls");
});

test("queueing needs the tech, and a building can't be queued or built twice", () => {
  const noTech = cityState([]);
  assert.throws(
    () => applyAction(noTech, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" }),
    /requires tech writing/
  );

  let state = cityState(["writing"]);
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" });
  assert.throws(
    () => applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" }),
    /already queued/
  );
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" }); // back to p1's turn
  assert.ok(state.map.cities.c1.buildings?.includes("library"));
  assert.throws(
    () => applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" }),
    /already built/
  );
});

test("the build queue processes items in order and UNQUEUE removes one", () => {
  let state = cityState(["masonry"]);
  // queue three items
  state = applyAction(state, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "warrior", unitId: "x" });
  state = applyAction(state, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "archer", unitId: "y" });
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "walls" });
  assert.deepEqual(state.map.cities.c1.queue, ["warrior", "archer", "walls"]);

  // remove the archer (index 1)
  state = applyAction(state, { type: "UNQUEUE_PRODUCTION", playerId: "p1", cityId: "c1", index: 1 });
  assert.deepEqual(state.map.cities.c1.queue, ["warrior", "walls"]);

  // 60 production builds warrior (12) + walls (22) = 34, both this turn
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  assert.ok(state.map.cities.c1.buildings?.includes("walls"), "walls built");
  assert.ok(
    Object.values(state.map.units).some((u) => u.ownerId === "p1" && u.type === "warrior"),
    "warrior built"
  );
  assert.ok(
    !Object.values(state.map.units).some((u) => u.type === "archer"),
    "the unqueued archer was never built"
  );
});
