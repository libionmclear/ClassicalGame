import test from "node:test";
import assert from "node:assert/strict";

import {
  applyAction,
  canResearch,
  claimingCity,
  computeCombatPreview,
  computeCityYield,
  computePlayerIncome,
  computeTerritory,
  createInitialGameState,
  effectiveItemCost,
  getVictoryStatus,
  isCoastalCity,
  keyOf,
  movementCost,
  playerFoodUpkeep,
  productionItemCost,
  replayActions,
  restHealAmount,
  rushProductionCost,
  scaledResearchCost,
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

test("a road bridges a river only once you have engineering", () => {
  const state = buildState();
  state.map.tiles["2,1"].road = true;
  const ctx = { ownerId: "p1", domain: "land" as const, mounted: false };
  // Without the bridge tech the ford still slows you (forest 2 + river 1).
  assert.equal(movementCost(state, ctx, { q: 1, r: 1 }, { q: 2, r: 1 }), 3);
  // Engineering lets the road bridge the river — and a road is half a move.
  state.playersById.p1.techs.push("engineering");
  assert.equal(movementCost(state, ctx, { q: 1, r: 1 }, { q: 2, r: 1 }), 0.5);
});

test("moving along a river bank travels at road speed", () => {
  const state = buildState();
  state.map.rivers["2,1|2,2"] = true; // (2,1) touches a river
  state.map.rivers["3,0|3,1"] = true; // (3,1) touches a river
  const ctx = { ownerId: "p1", domain: "land" as const, mounted: false };
  // (2,1) is forest (cost 2); entering it from riverside (3,1) without fording is road-fast (½).
  assert.equal(movementCost(state, ctx, { q: 3, r: 1 }, { q: 2, r: 1 }), 0.5);
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

test("a unit upgrades into its civ's elite for gold", () => {
  const state = buildState();
  const rome = state.playersById.p1;
  rome.techs.push("iron-working", "legionary-system");
  rome.gold = 100;
  rome.unitIds.push("sw");
  state.map.units.sw = {
    id: "sw", type: "swordsman", ownerId: "p1", position: { q: 1, r: 1 },
    hp: 22, maxHp: 22, movementRemaining: 2, veterancy: "recruit"
  };

  const before = rome.gold;
  const after = applyAction(state, { type: "UPGRADE_UNIT", playerId: "p1", unitId: "sw" });
  assert.equal(after.map.units.sw.type, "legionary");
  assert.ok(after.map.units.sw.maxHp === 26);
  assert.ok(after.playersById.p1.gold < before);

  // Carthage can't turn a swordsman into a Roman legionary.
  const carthage = buildState();
  carthage.playersById.p1.civ = "Carthage";
  carthage.playersById.p1.techs.push("iron-working");
  carthage.playersById.p1.unitIds.push("sw");
  carthage.map.units.sw = {
    id: "sw", type: "swordsman", ownerId: "p1", position: { q: 1, r: 1 },
    hp: 22, maxHp: 22, movementRemaining: 2, veterancy: "recruit"
  };
  assert.throws(() => applyAction(carthage, { type: "UPGRADE_UNIT", playerId: "p1", unitId: "sw" }));
});

test("improvements requiring a tech are gated until it is researched", () => {
  const state = buildState();
  // Make an adjacent tile hills with a stone deposit so c1 (at 0,0) works it,
  // then test the Quarry's Metallurgy gate directly.
  state.map.tiles["1,0"].terrain = "hills";
  state.map.tiles["1,0"].resource = "stone";

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

test("a worked resource deposit adds its yield to the city", () => {
  const state = buildState();
  const base = computeCityYield(state, "c1");
  // Grain (+2 food) on a plains tile c1 works (1,0 is within its territory).
  state.map.tiles["1,0"].resource = "grain";
  const withRes = computeCityYield(state, "c1");
  assert.equal(withRes.food, base.food + 2);
});

test("holding a resource discounts the builds that need it", () => {
  const state = buildState();
  // Trireme needs timber; tile 1,0 is worked by c1 (p1's territory).
  const full = effectiveItemCost(state, "p1", "trireme");
  assert.equal(full, productionItemCost("trireme")); // no timber yet -> full price
  state.map.tiles["1,0"].resource = "timber";
  const discounted = effectiveItemCost(state, "p1", "trireme");
  assert.ok(discounted < full);
});

test("troops levy a food upkeep that reduces net food (soft deficit)", () => {
  const lean = buildState();
  const leanUpkeep = playerFoodUpkeep(lean, "p1"); // 2 military - 1 city = 1
  const leanFood = computePlayerIncome(lean, "p1").food;

  const heavy = buildState();
  for (let i = 0; i < 8; i += 1) {
    const id = "w" + i;
    heavy.map.units[id] = {
      id, type: "warrior", ownerId: "p1", position: { q: 0, r: 1 },
      hp: 20, maxHp: 20, movementRemaining: 2, veterancy: "recruit"
    };
    heavy.playersById.p1.unitIds.push(id);
  }
  const heavyUpkeep = playerFoodUpkeep(heavy, "p1");
  assert.ok(heavyUpkeep > leanUpkeep);
  // A bigger army eats more, so net food is lower (and here goes into deficit).
  assert.ok(computePlayerIncome(heavy, "p1").food < leanFood);
});

test("equipped-general perks add a small flat per-turn bonus", () => {
  const base = buildState();
  const incBase = computePlayerIncome(base, "p1");
  const withPerk = buildState();
  withPerk.playersById.p1.perks = { gold: 3, science: 2, food: 1, production: 1 };
  const incPerk = computePlayerIncome(withPerk, "p1");
  assert.equal(incPerk.gold, incBase.gold + 3);
  assert.equal(incPerk.science, incBase.science + 2);
  assert.equal(incPerk.food, incBase.food + 1);
  assert.equal(incPerk.production, incBase.production + 1);

  // Ending a turn applies the pooled perks (gold/science) on top of everything else.
  const a = buildState();
  const b = buildState();
  b.playersById.p1.perks = { gold: 5, science: 4 };
  const ea = applyAction(a, { type: "END_TURN", playerId: "p1" });
  const eb = applyAction(b, { type: "END_TURN", playerId: "p1" });
  assert.equal(eb.playersById.p1.gold - ea.playersById.p1.gold, 5);
  assert.equal(eb.playersById.p1.science - ea.playersById.p1.science, 4);
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

test("a melee attacker advances into the tile after destroying the defender", () => {
  let state = buildState();
  state.map.units.u3.hp = 1; // one hit from death
  state = applyAction(state, { type: "ATTACK", playerId: "p1", attackerId: "u1", defenderId: "u3" });
  assert.equal(state.map.units.u3, undefined); // defender destroyed
  assert.deepEqual(state.map.units.u1.position, { q: 2, r: 1 }); // took the ground
});

test("a ranged attacker holds its ground after a kill", () => {
  let state = buildState();
  state.map.units.u2.position = { q: 2, r: 0 }; // archer adjacent to the enemy at (2,1)
  state.map.units.u3.hp = 1;
  state = applyAction(state, { type: "ATTACK", playerId: "p1", attackerId: "u2", defenderId: "u3" });
  assert.equal(state.map.units.u3, undefined);
  assert.deepEqual(state.map.units.u2.position, { q: 2, r: 0 }); // did NOT advance
});

test("a city cannot be founded on open water", () => {
  const state = buildState();
  state.map.units.s1 = { id: "s1", type: "settler", ownerId: "p1", position: { q: 4, r: 2 }, hp: 12, maxHp: 12, movementRemaining: 2, veterancy: "recruit" };
  state.playersById.p1.unitIds.push("s1");
  // (4,2) is a coast tile — founding there must be rejected.
  assert.throws(() => applyAction(state, { type: "FOUND_CITY", playerId: "p1", settlerId: "s1", cityId: "cX" }));
  // On land it succeeds.
  state.map.units.s1.position = { q: 1, r: 0 };
  const next = applyAction(state, { type: "FOUND_CITY", playerId: "p1", settlerId: "s1", cityId: "cX" });
  assert.equal(next.map.cities.cX.ownerId, "p1");
});

test("a player renames their own city but not an enemy's", () => {
  let state = buildState();
  state = applyAction(state, { type: "RENAME_CITY", playerId: "p1", cityId: "c1", name: "Roma Aeterna" });
  assert.equal(state.map.cities.c1.name, "Roma Aeterna");
  assert.throws(() => applyAction(state, { type: "RENAME_CITY", playerId: "p1", cityId: "c2", name: "Nope" }));
});

test("victors march into a captured city", () => {
  let state = buildState();
  state.map.units.u3.position = { q: 3, r: 1 }; // move the garrison out of the tile
  state.map.cities.c2.position = { q: 2, r: 1 };
  state.map.cities.c2.hp = 4;
  state = applyAction(state, { type: "ATTACK_CITY", playerId: "p1", attackerId: "u1", cityId: "c2" });
  assert.equal(state.map.cities.c2.ownerId, "p1");
  assert.deepEqual(state.map.units.u1.position, { q: 2, r: 1 }); // marched into the fallen city
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

test("a fishery needs a fish deposit, and can't go on open sea or as a road", () => {
  let state = seaState(); // player "a" has sailing
  state.map.tiles["4,0"].terrain = "coast"; // shallow water beside coast1 (3,0)
  // Without a fish deposit the fishery is refused.
  assert.throws(
    () => applyAction(state, { type: "IMPROVE_TILE", playerId: "a", cityId: "coast1", tileKey: "4,0", improvement: "fishery" }),
    /fish/
  );
  // With one, it's built.
  state.map.tiles["4,0"].resource = "fish";
  state = applyAction(state, { type: "IMPROVE_TILE", playerId: "a", cityId: "coast1", tileKey: "4,0", improvement: "fishery" });
  assert.ok((state.map.cities.coast1.queue || []).some((q) => q.includes("fishery")), "the fishery was queued");

  // A land improvement (fishery is coast-only) can't go on deep sea.
  const s2 = seaState();
  assert.throws(
    () => applyAction(s2, { type: "IMPROVE_TILE", playerId: "a", cityId: "coast2", tileKey: "4,1", improvement: "fishery" })
  );
  // Roads never cross open water.
  const s3 = seaState();
  s3.map.tiles["4,0"].terrain = "coast";
  assert.throws(
    () => applyAction(s3, { type: "IMPROVE_TILE", playerId: "a", cityId: "coast1", tileKey: "4,0", improvement: "road" }),
    /water/
  );
});

test("a built Harbour improvement lets an army embark from beside it", () => {
  const state = seaState(); // "a" has sailing
  state.map.tiles["4,0"].terrain = "coast";
  const ctx = { ownerId: "a", domain: "land" as const, mounted: false };
  // No harbour yet: a land unit at the coastal city (3,0) can't step onto the water.
  assert.equal(movementCost(state, ctx, { q: 3, r: 0 }, { q: 4, r: 0 }), Number.POSITIVE_INFINITY);
  // Build a Harbour on the coast tile (4,0) next to the city — now it can embark.
  state.map.tiles["4,0"].improvement = "harbour";
  assert.ok(Number.isFinite(movementCost(state, ctx, { q: 3, r: 0 }, { q: 4, r: 0 })), "the army embarks through the harbour");
});

test("a mine needs an ore deposit and a quarry needs stone", () => {
  const bare = seaState(["metallurgy"]);
  bare.map.tiles["1,0"].terrain = "hills"; // worked by the inland city (0,0)
  assert.throws(
    () => applyAction(bare, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "mine" }),
    /iron|silver|deposit/
  );
  const ore = seaState(["metallurgy"]);
  ore.map.tiles["1,0"].terrain = "hills";
  ore.map.tiles["1,0"].resource = "iron";
  const built = applyAction(ore, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "mine" });
  assert.ok((built.map.cities.inland.queue || []).some((q) => q.includes("mine")), "a mine goes on an iron deposit");
  // A quarry wants stone, not iron.
  const iron = seaState(["metallurgy"]);
  iron.map.tiles["1,0"].terrain = "hills";
  iron.map.tiles["1,0"].resource = "iron";
  assert.throws(
    () => applyAction(iron, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "quarry" }),
    /stone|deposit/
  );
});

test("a slow unit can always take one step, even onto ground it can't afford", () => {
  const tiles: Record<string, { terrain: string; region: string }> = {
    "0,0": { terrain: "plains", region: "r" },
    "1,0": { terrain: "hills", region: "r" },
    "1,1": { terrain: "plains", region: "r" },
    "2,1": { terrain: "hills", region: "r" }
  };
  let s = createInitialGameState({
    seed: "siege",
    players: [{ id: "a", civ: "A", techs: ["siegecraft"] }],
    map: {
      width: 3, height: 2, regions: ["r"], tiles: tiles as never,
      cities: { c: { id: "c", ownerId: "a", position: { q: 0, r: 0 }, population: 2 } },
      units: { sg: { id: "sg", type: "siege", ownerId: "a", position: { q: 1, r: 1 } } as never }
    }
  });
  const sg = s.map.units.sg;
  assert.equal(sg.movementRemaining, 1, "a fresh siege has 1 movement");
  const step = movementCost(s, { ownerId: "a", domain: "land" }, { q: 1, r: 1 }, { q: 2, r: 1 });
  assert.ok(step > 1, "the hills step costs more than it has");
  s = applyAction(s, { type: "MOVE_UNIT", playerId: "a", unitId: "sg", destination: { q: 2, r: 1 } });
  assert.deepEqual(s.map.units.sg.position, { q: 2, r: 1 }, "it still moves the one tile");
  assert.equal(s.map.units.sg.movementRemaining, 0, "spending all its movement");
});

test("disbanding a unit removes it, refunds scrap gold, and can't touch enemies", () => {
  const s = buildState();
  assert.ok(s.map.units.u1, "the unit exists");
  const goldBefore = s.playersById.p1.gold;
  const after = applyAction(s, { type: "DISBAND_UNIT", playerId: "p1", unitId: "u1" });
  assert.equal(after.map.units.u1, undefined, "the disbanded unit is gone");
  assert.ok(after.playersById.p1.gold >= goldBefore, "some scrap gold comes back");
  // You can't disband an enemy's unit (u3 belongs to p2).
  assert.throws(
    () => applyAction(buildState(), { type: "DISBAND_UNIT", playerId: "p1", unitId: "u3" }),
    /another player/
  );
});

test("an idle city sells surplus labour for coin instead of hoarding it", () => {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 2; r += 1) for (let q = 0; q < 2; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  let s = createInitialGameState({
    seed: "idle",
    players: [{ id: "a", civ: "A" }],
    map: { width: 2, height: 2, regions: ["r"], tiles: tiles as never, cities: { c: { id: "c", ownerId: "a", position: { q: 0, r: 0 }, population: 3 } } }
  });
  s.map.cities.c.production = 200;
  s.map.cities.c.queue = []; // nothing left to build
  const goldBefore = s.playersById.a.gold;
  s = applyAction(s, { type: "END_TURN", playerId: "a" });
  assert.ok((s.map.cities.c.production ?? 0) <= 25, "hoarded labour drains to a small reserve");
  assert.ok(s.playersById.a.gold > goldBefore, "the surplus labour became gold");
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
  let s = seaState(["sailing", "irrigation"]);
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
  let s = seaState(["sailing", "masonry"]); // roads need Masonry
  s.map.tiles["1,0"].terrain = "hills"; // normally slow to cross
  s = applyAction(s, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "road" });
  assert.ok((s.map.cities.inland.queue || []).includes("road:1,0"));
  s.map.cities.inland.production = 999;
  s = applyAction(s, { type: "END_TURN", playerId: "a" });
  assert.equal(s.map.tiles["1,0"].road, true, "the road is laid");

  const ctx = { ownerId: "a", domain: "land" as const };
  const hillsNoRoad = movementCost(seaState(), ctx, { q: 0, r: 0 }, { q: 1, r: 0 });
  const onRoad = movementCost(s, ctx, { q: 0, r: 0 }, { q: 1, r: 0 });
  assert.equal(onRoad, 0.5, "moving onto a road costs half a move");
  assert.ok(onRoad <= hillsNoRoad, "the road is faster than open ground");
});

test("roads need the Masonry tech to lay", () => {
  const s = seaState(); // only sailing
  s.map.tiles["1,0"].terrain = "hills";
  assert.throws(
    () => applyAction(s, { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "1,0", improvement: "road" }),
    /Masonry/
  );
});

test("Parthia's Parthian shot: no retaliation and the horse archer keeps moving", () => {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 2; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  let s = createInitialGameState({
    seed: "parthia",
    players: [
      { id: "a", civ: "Parthia", techs: ["horseback-riding", "horse-archery", "parthian-shot"] },
      { id: "b", civ: "Rome", production: 0 }
    ],
    map: {
      width: 4, height: 2, regions: ["r"], tiles: tiles as never,
      cities: { ca: { id: "ca", ownerId: "a", position: { q: 3, r: 1 }, population: 2 }, cb: { id: "cb", ownerId: "b", position: { q: 3, r: 0 }, population: 2 } },
      units: {
        ha: { id: "ha", type: "horse-archer", ownerId: "a", position: { q: 0, r: 0 } } as never,
        foe: { id: "foe", type: "warrior", ownerId: "b", position: { q: 1, r: 0 } } as never
      }
    }
  });
  const preview = computeCombatPreview(s, "ha", "foe"); // adjacent target
  assert.equal(preview.damageToAttacker, 0, "the enemy can't strike back at the Parthian shot");
  s = applyAction(s, { type: "ATTACK", playerId: "a", attackerId: "ha", defenderId: "foe" });
  assert.ok((s.map.units.ha?.movementRemaining ?? 0) > 0, "the horse archer keeps movement to wheel away");
});

test("techs add real per-city yield (research always counts)", () => {
  const s = buildState();
  const base = computeCityYield(s, "c1");
  s.playersById.p1.techs.push("philosophy"); // +1 science/city
  assert.equal(computeCityYield(s, "c1").science, base.science + 1);
  s.playersById.p1.techs.push("nile-bureaucracy"); // +1 food, +1 science
  const after = computeCityYield(s, "c1");
  assert.equal(after.food, base.food + 1);
  assert.equal(after.science, base.science + 2);
});

test("Rhetoric makes research cheaper", () => {
  const s = buildState();
  const before = scaledResearchCost(s, "mathematics", "p1");
  s.playersById.p1.techs.push("rhetoric");
  const after = scaledResearchCost(s, "mathematics", "p1");
  assert.ok(after < before, "rhetoric discounts research");
});

test("Medicine mends wounds faster", () => {
  const s = buildState();
  const unit = s.map.units.u1;
  unit.maxHp = 20; unit.hp = 5;
  const before = restHealAmount(s, unit);
  s.playersById.p1.techs.push("medicine");
  assert.ok(restHealAmount(s, unit) > before, "medicine heals more per turn");
});

test("Gaul's Furor sharpens the charge", () => {
  const s = buildState();
  const before = computeCombatPreview(s, "u1", "u3"); // p1 warrior (infantry) attacks
  s.playersById.p1.techs.push("furor");
  const after = computeCombatPreview(s, "u1", "u3");
  assert.ok(after.damageToDefender > before.damageToDefender, "furor hits harder");
  assert.ok((after.modifiers || []).some((m) => /Furor/.test(m)));
});

test("Rome's Testudo shields infantry from missiles", () => {
  const s = buildState();
  // u2 is p1's archer (ranged); u3 is p2's warrior (infantry). Same target, before
  // and after p2 drills the Testudo — missile damage should fall.
  const before = computeCombatPreview(s, "u2", "u3");
  s.playersById.p2.techs.push("testudo");
  const after = computeCombatPreview(s, "u2", "u3");
  assert.ok(after.damageToDefender < before.damageToDefender, "testudo cuts missile damage to infantry");
  assert.ok((after.modifiers || []).some((m) => /Testudo/.test(m)), "the modifier is shown");
});

test("a farm cannot be built on the sea or outside your territory", () => {
  // Tile 4,0 is open water far from the inland city — rejected as not its tile.
  assert.throws(
    () => applyAction(seaState(), { type: "IMPROVE_TILE", playerId: "a", cityId: "inland", tileKey: "4,0", improvement: "farm" }),
    /water|sea|territory|work this tile/
  );
  // And even on a worked coastal tile, a farm is the wrong terrain (water now takes
  // fisheries/harbours, not farms).
  const s = seaState();
  s.map.tiles["4,0"].terrain = "coast";
  const claim = claimingCity(s, { q: 4, r: 0 });
  assert.throws(
    () => applyAction(s, { type: "IMPROVE_TILE", playerId: "a", cityId: claim!.id, tileKey: "4,0", improvement: "farm" }),
    /cannot be built on/
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

test("a land army embarks only from a harbour, and only with sailing", () => {
  const withPort = embarkState(["sailing"]);
  withPort.map.cities.port = { id: "port", ownerId: "a", position: { q: 0, r: 0 }, population: 2, hp: 40, maxHp: 40, buildings: ["harbor"] };
  const noPort = embarkState(["sailing"]); // can sail, but no harbour to launch from
  const noSail = embarkState([]);
  const ctx = { ownerId: "a", domain: "land" as const };
  assert.ok(
    Number.isFinite(movementCost(withPort, ctx, { q: 0, r: 0 }, { q: 1, r: 0 })),
    "from a harbour city a sailing civ can embark onto the coast"
  );
  assert.ok(
    !Number.isFinite(movementCost(noPort, ctx, { q: 0, r: 0 }, { q: 1, r: 0 })),
    "no harbour, no putting to sea"
  );
  assert.ok(
    !Number.isFinite(movementCost(noSail, ctx, { q: 0, r: 0 }, { q: 1, r: 0 })),
    "without sailing it cannot enter the water"
  );
  // Open sea still needs the deeper tech even from a harbour.
  assert.ok(!Number.isFinite(movementCost(withPort, ctx, { q: 1, r: 0 }, { q: 2, r: 0 })));
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
