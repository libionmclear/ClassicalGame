import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAction,
  canResearch,
  computeCombatPreview,
  computePlayerIncome,
  computeTerritory,
  createInitialGameState,
  getVictoryStatus,
  keyOf,
  movementCost,
  replayActions,
  rushProductionCost
} from "../src/engine/index";

import type { CreateGameConfig, GameAction } from "../src/engine/types";

function buildState() {
  const config: CreateGameConfig = {
    seed: "phase0-seed",
    players: [
      { id: "p1", civ: "Rome", production: 40, science: 500 },
      { id: "p2", civ: "Carthage", production: 40, science: 500 }
    ],
    map: {
      width: 5,
      height: 5,
      regions: ["west", "east"],
      rivers: {
        "1,1|2,1": true
      },
      tiles: {
        "0,0": { terrain: "plains", region: "west" },
        "1,0": { terrain: "plains", region: "west" },
        "2,0": { terrain: "plains", region: "west" },
        "0,1": { terrain: "plains", region: "west" },
        "1,1": { terrain: "plains", region: "west" },
        "2,1": { terrain: "forest", region: "east" },
        "3,1": { terrain: "hills", region: "east" },
        "4,1": { terrain: "plains", region: "east" },
        "2,2": { terrain: "desert", region: "east" },
        "3,2": { terrain: "plains", region: "east" },
        "4,2": { terrain: "coast", region: "east" }
      },
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2 },
        c2: { id: "c2", ownerId: "p2", position: { q: 4, r: 1 }, population: 2 }
      },
      units: {
        u1: { id: "u1", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } },
        u2: { id: "u2", type: "archer", ownerId: "p1", position: { q: 0, r: 1 } },
        u3: { id: "u3", type: "warrior", ownerId: "p2", position: { q: 2, r: 1 } }
      }
    }
  };

  return createInitialGameState(config);
}

test("weather generation is deterministic by seed and turn", () => {
  const a = buildState();
  const b = buildState();
  assert.deepEqual(a.weather.current, b.weather.current);
  assert.deepEqual(a.weather.forecast, b.weather.forecast);
});

test("movement accounts for river crossing", () => {
  const state = buildState();
  const unit = state.map.units.u1;
  const cost = movementCost(
    state,
    { ownerId: unit.ownerId, domain: "land", mounted: false },
    { q: 1, r: 1 },
    { q: 2, r: 1 }
  );
  assert.equal(cost, 3);
});

test("combat preview remains deterministic with visible modifiers", () => {
  const state = buildState();
  const preview1 = computeCombatPreview(state, "u1", "u3");
  const preview2 = computeCombatPreview(state, "u1", "u3");
  assert.deepEqual(preview1, preview2);
});

test("forked tech branches are mutually exclusive", () => {
  const state = buildState();
  state.playersById.p1.techs.push("bronze-working", "archery", "writing");

  assert.equal(canResearch(state.playersById.p1, "phalanx-doctrine"), true);

  const after = applyAction(state, {
    type: "RESEARCH_TECH",
    playerId: "p1",
    techId: "phalanx-doctrine"
  });

  assert.equal(canResearch(after.playersById.p1, "skirmish-doctrine"), false);
});

test("replay from action log produces same final state", () => {
  const initial = buildState();

  const actions: GameAction[] = [
    { type: "MOVE_UNIT", playerId: "p1", unitId: "u1", destination: { q: 1, r: 0 }, path: [{ q: 1, r: 1 }, { q: 1, r: 0 }] },
    { type: "END_TURN", playerId: "p1" },
    { type: "END_TURN", playerId: "p2" },
    { type: "RESEARCH_TECH", playerId: "p1", techId: "bronze-working" }
  ];

  let direct = initial;
  for (const action of actions) {
    direct = applyAction(direct, action);
  }

  const replayed = replayActions(initial, actions);
  assert.deepEqual(replayed, direct);
  assert.equal(direct.actionLog.length, actions.length);
});

test("scripted headless match flow reaches turn progression", () => {
  let state = buildState();

  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });

  assert.equal(state.turn, 3);
  assert.ok(state.weather.current.west);
  assert.ok(state.weather.forecast.east);

  const occupied = keyOf(state.map.cities.c1.position);
  assert.equal(typeof occupied, "string");
});

test("found city consumes settler and creates owned city", () => {
  let state = buildState();

  state = applyAction(state, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "settler", unitId: "x" });
  state.map.cities.c1.production = 60; // bank enough to finish the settler this turn
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });
  state = applyAction(state, { type: "END_TURN", playerId: "p2" });

  const settler = Object.values(state.map.units).find((u) => u.ownerId === "p1" && u.type === "settler");
  assert.ok(settler, "settler completed from the queue");

  state = applyAction(state, {
    type: "MOVE_UNIT",
    playerId: "p1",
    unitId: settler!.id,
    destination: { q: 1, r: 0 },
    path: [{ q: 0, r: 0 }, { q: 1, r: 0 }]
  });
  state = applyAction(state, { type: "FOUND_CITY", playerId: "p1", settlerId: settler!.id, cityId: "c1b" });

  assert.equal(state.map.cities.c1b.ownerId, "p1");
  assert.equal(state.map.cities.c1b.population, 1);
  assert.equal(state.map.units[settler!.id], undefined);
  assert.ok(state.playersById.p1.cityIds.includes("c1b"));
});

test("recruiting a unit queues it, and it completes as the city banks production", () => {
  let state = buildState();

  state = applyAction(state, { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "archer", unitId: "x" });
  assert.ok(state.map.cities.c1.queue?.includes("archer"), "archer queued, not instant");

  state.map.cities.c1.production = 60;
  const before = state.map.cities.c1.production;
  const archersBefore = Object.values(state.map.units).filter((u) => u.type === "archer").length;
  state = applyAction(state, { type: "END_TURN", playerId: "p1" });

  const archersAfter = Object.values(state.map.units).filter((u) => u.type === "archer").length;
  assert.equal(archersAfter, archersBefore + 1, "a new archer was built from the queue");
  // the new archer spawns on the city tile
  assert.ok(
    Object.values(state.map.units).some(
      (u) => u.type === "archer" && u.position.q === state.map.cities.c1.position.q && u.position.r === state.map.cities.c1.position.r
    ),
    "new archer sits on the city tile"
  );
  assert.ok((state.map.cities.c1.production ?? 0) < before, "production was spent");
});

test("city can be captured and domination victory is detected", () => {
  let state = buildState();

  state.map.cities.c1.isCapital = true;
  state.map.cities.c2.isCapital = true;
  state.map.cities.c2.position = { q: 2, r: 1 };
  state.map.cities.c2.hp = 6;

  state = applyAction(state, {
    type: "ATTACK_CITY",
    playerId: "p1",
    attackerId: "u1",
    cityId: "c2"
  });

  assert.equal(state.map.cities.c2.ownerId, "p1");

  const victory = getVictoryStatus(state);
  assert.equal(victory.type, "domination");
  assert.equal(victory.winnerId, "p1");
});

test("territory claims coast and land but never open sea", () => {
  const state = createInitialGameState({
    seed: "terr",
    players: [{ id: "a", civ: "A" }],
    map: {
      width: 3,
      height: 1,
      regions: ["r"],
      tiles: {
        "0,0": { terrain: "coast", region: "r" },
        "1,0": { terrain: "plains", region: "r" },
        "2,0": { terrain: "sea", region: "r" }
      },
      cities: {
        ca: { id: "ca", ownerId: "a", position: { q: 1, r: 0 }, population: 2 }
      }
    }
  });
  const terr = computeTerritory(state);
  assert.equal(terr["1,0"], "a", "the city's own land is claimed");
  assert.equal(terr["0,0"], "a", "the adjacent coast is claimed");
  assert.equal(terr["2,0"], undefined, "open sea is never claimed");
});

test("denarii rush completes the front of the build queue at once", () => {
  let state = buildState();
  // p1 queues a warrior in c1 (queue model banks labour over turns).
  state = applyAction(state, {
    type: "BUILD_UNIT",
    playerId: "p1",
    cityId: "c1",
    unitType: "warrior",
    unitId: "queued-warrior"
  });
  const unitsBefore = Object.keys(state.map.units).length;

  state.playersById.p1.gold = 999;
  const goldBefore = state.playersById.p1.gold;
  const rush = rushProductionCost(state, "c1");
  assert.ok(rush && rush.goldCost > 0, "there is production still to pay for");

  state = applyAction(state, { type: "RUSH_PRODUCTION", playerId: "p1", cityId: "c1" });

  assert.equal(Object.keys(state.map.units).length, unitsBefore + 1, "the unit is built now");
  assert.equal((state.map.cities.c1.queue || []).length, 0, "the queue is emptied");
  assert.equal(state.playersById.p1.gold, goldBefore - rush!.goldCost, "denarii were spent");
});

test("no winner while both capitals stand before the turn limit", () => {
  const state = buildState();
  state.map.cities.c1.isCapital = true;
  state.map.cities.c2.isCapital = true;
  state.turnLimit = 40;
  state.turn = 5;

  const victory = getVictoryStatus(state);
  assert.equal(victory.winnerId, null);
  assert.equal(victory.type, null);
});

test("difficulty handicaps the AI economy but never the human", () => {
  const base = buildState();
  base.humanPlayerId = "p1";

  const normalState = { ...base, difficulty: "normal" as const };
  const hardState = { ...base, difficulty: "hard" as const };
  const easyState = { ...base, difficulty: "easy" as const };

  const total = (i: { food: number; production: number; gold: number; science: number }) =>
    i.food + i.production + i.gold + i.science;

  // The AI (p2) earns more on hard and less on easy than on normal.
  const aiNormal = computePlayerIncome(normalState, "p2");
  const aiHard = computePlayerIncome(hardState, "p2");
  const aiEasy = computePlayerIncome(easyState, "p2");
  assert.ok(total(aiHard) > total(aiNormal), "hard AI out-earns normal AI");
  assert.ok(total(aiEasy) < total(aiNormal), "easy AI under-earns normal AI");

  // The human (p1) is exempt: identical income at every difficulty.
  const humanNormal = computePlayerIncome(normalState, "p1");
  const humanHard = computePlayerIncome(hardState, "p1");
  assert.deepEqual(humanHard, humanNormal);
});

test("score victory is awarded to the leader once the turn limit passes", () => {
  const state = buildState();
  // Both capitals still standing so no domination winner.
  state.map.cities.c1.isCapital = true;
  state.map.cities.c2.isCapital = true;
  state.turnLimit = 40;
  state.turn = 41;

  // p1 owns two cities and three units in buildState, so it leads on score.
  const victory = getVictoryStatus(state);
  assert.equal(victory.type, "score");
  assert.equal(victory.winnerId, "p1");
});
