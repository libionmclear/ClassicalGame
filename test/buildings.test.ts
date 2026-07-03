import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, BUILDINGS } from "../src/engine/index";

function cityState(techs: string[] = [], production = 100) {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 3; r += 1) {
    for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  }
  return createInitialGameState({
    seed: "bld",
    players: [
      { id: "p1", civ: "Rome", production, science: 0, techs },
      { id: "p2", civ: "Carthage" }
    ],
    map: {
      width: 3,
      height: 3,
      regions: ["core"],
      tiles,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40 } }
    }
  });
}

test("building a granary spends production and boosts the city's food yield", () => {
  let state = cityState();
  const beforeProd = state.playersById.p1.production;

  // Baseline food yield banked over one end-turn cycle.
  const baseline = applyAction(state, { type: "END_TURN", playerId: "p1" });
  const baseFood = baseline.map.cities.c1.food ?? 0;

  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "granary" });
  assert.equal(state.playersById.p1.production, beforeProd - BUILDINGS.granary.cost, "granary cost deducted");
  assert.ok(state.map.cities.c1.buildings?.includes("granary"), "granary recorded on the city");

  const withGranary = applyAction(state, { type: "END_TURN", playerId: "p1" });
  assert.ok(
    (withGranary.map.cities.c1.food ?? 0) > baseFood,
    `granary should raise banked food (${withGranary.map.cities.c1.food} > ${baseFood})`
  );
});

test("walls raise the city's max HP", () => {
  let state = cityState(["masonry"]);
  const before = state.map.cities.c1.maxHp;
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "walls" });
  assert.equal(state.map.cities.c1.maxHp, before + (BUILDINGS.walls.cityHp ?? 0));
  assert.ok(state.map.cities.c1.hp > before, "current HP rose with the walls");
});

test("tech-gated buildings need their tech, and nothing can be built twice", () => {
  const noTech = cityState([]);
  assert.throws(
    () => applyAction(noTech, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" }),
    /requires tech writing/
  );

  let state = cityState(["writing"]);
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" });
  assert.throws(
    () => applyAction(state, { type: "BUILD_BUILDING", playerId: "p1", cityId: "c1", buildingId: "library" }),
    /already built/
  );
});
