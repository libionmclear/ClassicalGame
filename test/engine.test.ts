import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAction,
  canResearch,
  computeCombatPreview,
  computeCityYield,
  computePlayerIncome,
  computeTerritory,
  createInitialGameState,
  getVictoryStatus,
  isCoastalCity,
  keyOf,
  movementCost,
  replayActions,
  rushProductionCost,
  tradeRouteIncome
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

test("civ-unique tech and unit are gated to their people", () => {
  const state = buildState();
  const rome = state.playersById.p1; // civ "Rome"
  const carthage = state.playersById.p2; // civ "Carthage"
  rome.techs.push("iron-working");
  carthage.techs.push("iron-working");

  // Only Rome may research the Legionary System, even with the prerequisite met.
  assert.equal(canResearch(rome, "legionary-system"), true);
  assert.equal(canResearch(carthage, "legionary-system"), false);

  // Rome researches it and can queue a Legionary in its city.
  const after = applyAction(state, {
    type: "RESEARCH_TECH",
    playerId: "p1",
    techId: "legionary-system"
  });
  const built = applyAction(after, {
    type: "BUILD_UNIT",
    playerId: "p1",
    cityId: "c1",
    unitType: "legionary",
    unitId: "leg1"
  });
  assert.ok((built.map.cities.c1.queue ?? []).includes("legionary"));

  // Another people cannot field it even if handed the tech directly.
  const forged = buildState();
  forged.currentPlayerIndex = 1; // p2's turn
  forged.playersById.p2.techs.push("legionary-system");
  assert.throws(() =>
    applyAction(forged, {
      type: "BUILD_UNIT",
      playerId: "p2",
      cityId: "c2",
      unitType: "legionary",
      unitId: "leg2"
    })
  );
});

test("improvements requiring a tech are gated until it is researched", () => {
  const state = buildState();
  // Make an adjacent tile hills so c1 (at 0,0) works it, then test the Quarry's
  // Metallurgy gate directly.
  state.map.tiles["1,0"].terrain = "hills";

  assert.throws(
    () =>
      applyAction(state, {
        type: "IMPROVE_TILE",
        playerId: "p1",
        cityId: "c1",
        tileKey: "1,0",
        improvement: "quarry"
      }),
    /requires tech metallurgy/
  );

  state.playersById.p1.techs.push("metallurgy");
  const after = applyAction(state, {
    type: "IMPROVE_TILE",
    playerId: "p1",
    cityId: "c1",
    tileKey: "1,0",
    improvement: "quarry"
  });
  assert.ok((after.map.cities.c1.queue ?? []).some((q) => q === "imp:quarry:1,0"));
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

function seaState(techs: string[] = ["sailing"]) {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 3; r += 1) {
    for (let q = 0; q < 5; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  }
  // The eastern edge is open water, so cities beside it are coastal.
  tiles["4,0"] = { terrain: "sea", region: "r" };
  tiles["4,1"] = { terrain: "sea", region: "r" };
  tiles["4,2"] = { terrain: "sea", region: "r" };
  return createInitialGameState({
    seed: "sea",
    players: [{ id: "a", civ: "A", techs }],
    map: {
      width: 5,
      height: 3,
      regions: ["r"],
      tiles: tiles as never,
      cities: {
        coast1: { id: "coast1", ownerId: "a", position: { q: 3, r: 0 }, population: 2 },
        coast2: { id: "coast2", ownerId: "a", position: { q: 3, r: 1 }, population: 2 },
        inland: { id: "inland", ownerId: "a", position: { q: 0, r: 0 }, population: 2 }
      }
    }
  });
}

test("coastal detection: a city beside water is coastal, an inland one is not", () => {
  const state = seaState();
  assert.equal(isCoastalCity(state, "coast1"), true);
  assert.equal(isCoastalCity(state, "inland"), false);
});

test("harbor is coastal-only", () => {
  let state = seaState();
  assert.throws(
    () => applyAction(state, { type: "BUILD_BUILDING", playerId: "a", cityId: "inland", buildingId: "harbor" }),
    /coastal/
  );
  state = applyAction(state, { type: "BUILD_BUILDING", playerId: "a", cityId: "coast1", buildingId: "harbor" });
  assert.ok((state.map.cities.coast1.queue || []).includes("harbor"));
});

test("harbors earn extra gold as a trade network", () => {
  const state = seaState();
  state.map.cities.coast1.buildings = ["harbor"];
  const solo = computeCityYield(state, "coast1").gold;
  state.map.cities.coast2.buildings = ["harbor"];
  const networked = computeCityYield(state, "coast1").gold;
  assert.equal(networked, solo + 1, "a second harbor adds one trade-network gold");
});

test("a trireme launches onto adjacent water, not the city's land tile", () => {
  let state = seaState(["sailing", "open-sea-sailing"]);
  state = applyAction(state, {
    type: "BUILD_UNIT",
    playerId: "a",
    cityId: "coast1",
    unitType: "trireme",
    unitId: "t1"
  });
  state.map.cities.coast1.production = 999; // fund it so End Turn completes it
  state = applyAction(state, { type: "END_TURN", playerId: "a" });

  const trireme = Object.values(state.map.units).find((u) => u.type === "trireme");
  assert.ok(trireme, "the trireme was built");
  const tile = state.map.tiles[`${trireme!.position.q},${trireme!.position.r}`];
  assert.ok(tile.terrain === "sea" || tile.terrain === "coast", "the trireme sits on water");
});

test("ships cannot be built in a landlocked city", () => {
  const state = seaState(["sailing", "open-sea-sailing"]);
  assert.throws(
    () => applyAction(state, { type: "BUILD_UNIT", playerId: "a", cityId: "inland", unitType: "trireme", unitId: "t2" }),
    /coastal/
  );
});

test("a merchant opens a trade route that pays gold every turn", () => {
  const state = seaState();
  // Merchant sitting in the inland city; route anchors to the nearest other city.
  state.map.units.m1 = {
    id: "m1",
    type: "merchant",
    ownerId: "a",
    position: { q: state.map.cities.inland.position.q, r: state.map.cities.inland.position.r },
    hp: 12,
    maxHp: 12,
    movementRemaining: 0,
    veterancy: "recruit"
  };
  // Relink ownership so the merchant is counted.
  let s = applyAction(state, {
    type: "ESTABLISH_TRADE_ROUTE",
    playerId: "a",
    merchantId: "m1",
    cityId: "inland"
  });
  assert.equal(s.tradeRoutes.length, 1, "a route was created");
  assert.ok(s.map.units.m1 === undefined, "the merchant was consumed");
  const route = s.tradeRoutes[0];
  assert.ok(route.gold >= 2, "the route pays gold");

  // The route contributes exactly its gold to income (isolate it from city yields).
  assert.equal(tradeRouteIncome(s, "a"), route.gold);
  const withRoute = computePlayerIncome(s, "a").gold;
  const withoutRoute = computePlayerIncome({ ...s, tradeRoutes: [] }, "a").gold;
  assert.equal(withRoute - withoutRoute, route.gold, "income reflects the trade route");
});

test("a tile improvement adds its yield to the claiming city", () => {
  const state = seaState();
  // (1,0) is plains, one tile from the inland city — inland claims it.
  const before = computeCityYield(state, "inland").food;
  state.map.tiles["1,0"].improvement = "farm";
  const after = computeCityYield(state, "inland").food;
  assert.equal(after, before + 2, "the farm's +2 food reaches the city");
});

test("improving a tile queues in the claiming city and completes with labour", () => {
  let s = seaState();
  s = applyAction(s, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "farm" });
  assert.ok((s.map.cities.inland.queue || []).includes("imp:farm:1,0"), "the improvement is queued");
  s.map.cities.inland.production = 999; // fund it
  s = applyAction(s, { type: "END_TURN", playerId: "a" });
  assert.equal(s.map.tiles["1,0"].improvement, "farm", "the farm is built at end of turn");
});

test("a city repairs itself in peace but not while besieged", () => {
  let calm = buildState();
  calm.map.cities.c1.maxHp = 40;
  calm.map.cities.c1.hp = 10;
  calm = applyAction(calm, { type: "END_TURN", playerId: "p1" });
  assert.ok(calm.map.cities.c1.hp > 10, "an unattacked city repairs its walls");

  let siege = buildState();
  siege.map.cities.c1.maxHp = 40;
  siege.map.cities.c1.hp = 10;
  siege.map.cities.c1.lastAttackedTurn = siege.turn; // assaulted this turn
  siege = applyAction(siege, { type: "END_TURN", playerId: "p1" });
  assert.equal(siege.map.cities.c1.hp, 10, "a city under assault does not repair");
});

test("a road is built through the labour queue and speeds movement", () => {
  let s = seaState();
  s.map.tiles["1,0"].terrain = "hills"; // normally slow to cross
  s = applyAction(s, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "road" });
  assert.ok((s.map.cities.inland.queue || []).includes("road:1,0"));
  s.map.cities.inland.production = 999;
  s = applyAction(s, { type: "END_TURN", playerId: "a" });
  assert.equal(s.map.tiles["1,0"].road, true, "the road is laid");

  const ctx = { ownerId: "a", domain: "land" as const };
  const hillsNoRoad = movementCost(seaState(), ctx, { q: 0, r: 0 }, { q: 1, r: 0 });
  const onRoad = movementCost(s, ctx, { q: 0, r: 0 }, { q: 1, r: 0 });
  assert.equal(onRoad, 1, "moving onto a road costs 1");
  assert.ok(onRoad <= hillsNoRoad, "the road is no slower than open ground");
});

test("a farm cannot be built on the sea or outside your territory", () => {
  assert.throws(
    () => applyAction(seaState(), { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "4,0", improvement: "farm" }),
    /water|sea|territory/
  );
});

test("a trade route dies when its home city is lost", () => {
  const state = seaState();
  state.tradeRoutes = [{ ownerId: "a", fromCityId: "coast1", toCityId: "inland", gold: 5 }];
  assert.equal(tradeRouteIncome(state, "a"), 5);
  // Home city changes hands -> the route stops paying.
  state.map.cities.coast1.ownerId = "b";
  assert.equal(tradeRouteIncome(state, "a"), 0);
});

function embarkState(techs: string[]) {
  return createInitialGameState({
    seed: "embark",
    players: [
      { id: "a", civ: "A", techs },
      { id: "b", civ: "B", techs: ["sailing", "open-sea-sailing"] }
    ],
    map: {
      width: 3,
      height: 1,
      regions: ["r"],
      tiles: {
        "0,0": { terrain: "plains", region: "r" },
        "1,0": { terrain: "coast", region: "r" },
        "2,0": { terrain: "sea", region: "r" }
      },
      units: {
        u: { id: "u", type: "warrior", ownerId: "a", position: { q: 0, r: 0 }, movementRemaining: 3 }
      }
    }
  });
}

test("a land army can embark onto water only once its people can sail", () => {
  const withSail = embarkState(["sailing"]);
  const noSail = embarkState([]);
  const ctx = { ownerId: "a", domain: "land" as const };
  assert.ok(
    Number.isFinite(movementCost(withSail, ctx, { q: 0, r: 0 }, { q: 1, r: 0 })),
    "a sailing civ's land unit can embark onto the coast"
  );
  assert.ok(
    !Number.isFinite(movementCost(noSail, ctx, { q: 0, r: 0 }, { q: 1, r: 0 })),
    "without sailing it cannot enter the water"
  );
  // Open sea still needs the deeper tech even with sailing.
  assert.ok(!Number.isFinite(movementCost(withSail, ctx, { q: 1, r: 0 }, { q: 2, r: 0 })));
});

test("an embarked army is a soft target and cannot attack", () => {
  const state = embarkState(["sailing"]);
  state.map.units.emb = { id: "emb", type: "warrior", ownerId: "a", position: { q: 1, r: 0 }, hp: 20, maxHp: 20, movementRemaining: 2, veterancy: "recruit" };
  state.map.units.landv = { id: "landv", type: "warrior", ownerId: "b", position: { q: 0, r: 0 }, hp: 20, maxHp: 20, movementRemaining: 2, veterancy: "recruit" };
  state.map.units.ship = { id: "ship", type: "trireme", ownerId: "b", position: { q: 2, r: 0 }, hp: 24, maxHp: 24, movementRemaining: 3, veterancy: "recruit" };

  assert.throws(
    () => applyAction(state, { type: "ATTACK", playerId: "a", attackerId: "emb", defenderId: "landv" }),
    /land|embark/i
  );
  const prev = computeCombatPreview(state, "ship", "emb");
  assert.ok(prev.modifiers.some((m) => /Embarked/.test(m)), "the embarked penalty applies against a warship");
});

test("a resting unit heals, and one that moved does not", () => {
  let rested = buildState();
  rested.map.units.u1.hp = 5;
  rested.map.units.u1.movementRemaining = 99; // held its ground
  rested = applyAction(rested, { type: "END_TURN", playerId: "p1" });
  assert.ok(rested.map.units.u1.hp > 5, "the resting unit recovered");

  let moved = buildState();
  moved.map.units.u1.hp = 5;
  moved.map.units.u1.movementRemaining = 0; // spent its move / fought
  moved = applyAction(moved, { type: "END_TURN", playerId: "p1" });
  assert.equal(moved.map.units.u1.hp, 5, "a unit that acted does not heal");
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
