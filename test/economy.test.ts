import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, researchCost } from "../src/engine/index";

function economyState() {
  const tiles: Record<string, { terrain: "valley" | "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) {
    for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "valley", region: "core" };
  }
  return createInitialGameState({
    seed: "econ",
    players: [
      { id: "p1", civ: "Rome", science: 0, production: 0 },
      { id: "p2", civ: "Carthage" }
    ],
    map: {
      width: 4,
      height: 4,
      regions: ["core"],
      tiles,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40 } }
    }
  });
}

function endRound(state: ReturnType<typeof economyState>) {
  let s = applyAction(state, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "END_TURN", playerId: "p2" });
  return s;
}

test("science accrues over turns and cannot be spent before it's earned", () => {
  let state = economyState();
  assert.equal(state.playersById.p1.science, 0);

  // Bronze Working is free of prereqs but costs science — unaffordable at turn 1.
  assert.throws(
    () => applyAction(state, { type: "RESEARCH_TECH", playerId: "p1", techId: "bronze-working" }),
    /Insufficient science/
  );

  // Accrue several turns of science, then it becomes affordable.
  for (let i = 0; i < 6; i += 1) state = endRound(state);
  assert.ok(state.playersById.p1.science >= researchCost("bronze-working"), "should have banked enough science");

  const after = applyAction(state, { type: "RESEARCH_TECH", playerId: "p1", techId: "bronze-working" });
  assert.ok(after.playersById.p1.techs.includes("bronze-working"));
  assert.equal(after.playersById.p1.science, state.playersById.p1.science - researchCost("bronze-working"));
});

test("cities bank food and grow their population over time", () => {
  let state = economyState();
  const startPop = state.map.cities.c1.population;
  for (let i = 0; i < 12; i += 1) state = endRound(state);
  assert.ok(
    state.map.cities.c1.population > startPop,
    `city should have grown from ${startPop} (now ${state.map.cities.c1.population})`
  );
});

test("bigger cities yield more (production/gold/science scale with population)", () => {
  const small = createInitialGameState({
    seed: "y",
    players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 3,
      height: 3,
      regions: ["core"],
      tiles: Object.fromEntries(
        [...Array(9)].map((_, i) => [`${i % 3},${Math.floor(i / 3)}`, { terrain: "plains", region: "core" }])
      ),
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 1 } }
    }
  });
  const big = JSON.parse(JSON.stringify(small));
  big.map.cities.c1.population = 6;
  big.playersById.p1.cityIds = ["c1"];

  const afterSmall = applyAction(small, { type: "END_TURN", playerId: "p1" });
  const afterBig = applyAction(big, { type: "END_TURN", playerId: "p1" });
  assert.ok(
    (afterBig.map.cities.c1.production ?? 0) > (afterSmall.map.cities.c1.production ?? 0),
    "a size-6 city should bank more production than a size-1 city"
  );
  assert.ok(afterBig.playersById.p1.science > afterSmall.playersById.p1.science, "bigger city yields more science");
});
