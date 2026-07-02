import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/engine";
import { loadScenario, listScenarios } from "../src/engine/scenarios";

test("scenario registry exposes italia", () => {
  const all = listScenarios();
  assert.ok(all.some((s) => s.id === "italia"));
});

test("italia scenario loads into deterministic game state", () => {
  const scenario = loadScenario("italia");
  const stateA = createInitialGameState(scenario.config);
  const stateB = createInitialGameState(scenario.config);

  assert.equal(stateA.players.length, 2);
  assert.ok(Object.keys(stateA.map.cities).length >= 2);
  assert.ok(Object.keys(stateA.map.units).length >= 2);
  assert.deepEqual(stateA.weather.current, stateB.weather.current);
});
