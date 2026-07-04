import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, getVictoryStatus } from "../src/engine";
import { chooseAiAction, runAiTurn, aggression } from "../src/engine/ai";
import { loadScenario } from "../src/engine/scenarios";
import type { CreateGameConfig, GameState } from "../src/engine/types";

function makeState(
  units: NonNullable<NonNullable<CreateGameConfig["map"]>["units"]>,
  cities: NonNullable<NonNullable<CreateGameConfig["map"]>["cities"]> = {},
  techs: string[] = [],
  production = 40
) {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 8; r += 1) {
    for (let q = 0; q < 8; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  }
  return createInitialGameState({
    seed: "ai-test",
    players: [
      { id: "p1", civ: "Rome", production, techs },
      { id: "p2", civ: "Carthage", production: 0 }
    ],
    map: { width: 8, height: 8, regions: ["core"], tiles, units, cities }
  });
}

test("aggression temperament scales monotonically with difficulty", () => {
  const easy = aggression({ difficulty: "easy" } as GameState);
  const normal = aggression({ difficulty: "normal" } as GameState);
  const hard = aggression({ difficulty: "hard" } as GameState);

  // Aggressive AIs break off later (lower wounded threshold) and prize assaults.
  assert.ok(hard.wounded < normal.wounded && normal.wounded < easy.wounded);
  assert.ok(hard.cityBias > normal.cityBias && normal.cityBias > easy.cityBias);
  // Hard accepts losing trades; easy only takes clearly winning ones.
  assert.equal(hard.acceptLoss, true);
  assert.equal(easy.requireBetter, true);
  assert.equal(normal.acceptLoss, false);
  assert.equal(normal.requireBetter, false);
});

test("a bolder AI takes an even trade a cautious AI declines", () => {
  // An archer striking a spearman is an even swap (both lose the same hp) that
  // the attacker survives. Normal/hard press it; easy holds out for a clear win.
  const units = {
    a: { id: "a", type: "archer", ownerId: "p1", position: { q: 1, r: 1 }, movementRemaining: 1 },
    d: { id: "d", type: "spearman", ownerId: "p2", position: { q: 2, r: 1 } }
  };
  // Enemy city kept far away so no city-assault option competes.
  const cities = { c2: { id: "c2", ownerId: "p2", position: { q: 7, r: 7 }, population: 1 } };
  const base = makeState(units, cities);

  assert.equal(chooseAiAction({ ...base, difficulty: "normal" as const }, "p1").type, "ATTACK");
  assert.equal(chooseAiAction({ ...base, difficulty: "hard" as const }, "p1").type, "ATTACK");
  assert.notEqual(chooseAiAction({ ...base, difficulty: "easy" as const }, "p1").type, "ATTACK");
});

test("a coastal AI builds a fleet and fights across the water", () => {
  // Two coastal capitals separated by a single strait (q=3 is all sea). Land
  // units can never cross it, so any combat here MUST be naval.
  const tiles: Record<string, { terrain: "plains" | "sea"; region: string }> = {};
  for (let r = 0; r < 5; r += 1) {
    for (let q = 0; q < 7; q += 1) {
      tiles[`${q},${r}`] = { terrain: q === 3 ? "sea" : "plains", region: "strait" };
    }
  }
  let state = createInitialGameState({
    seed: "naval-ai",
    players: [
      { id: "p1", civ: "Rome", production: 40, science: 0, techs: ["sailing", "open-sea-sailing"] },
      { id: "p2", civ: "Carthage", production: 40, science: 0, techs: ["sailing", "open-sea-sailing"] }
    ],
    map: {
      width: 7,
      height: 5,
      regions: ["strait"],
      tiles,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 2, r: 2 }, population: 3, isCapital: true, hp: 24, maxHp: 24 },
        c2: { id: "c2", ownerId: "p2", position: { q: 4, r: 2 }, population: 3, isCapital: true, hp: 24, maxHp: 24 }
      }
    }
  });

  let sawTrireme = false;
  let navalAttacks = 0;
  for (let i = 0; i < 160; i += 1) {
    const current = state.players[state.currentPlayerIndex].id;
    const result = runAiTurn(state, current, 12);
    state = result.state;
    if (Object.values(state.map.units).some((u) => u.type === "trireme")) sawTrireme = true;
    navalAttacks += result.actions.filter((a) => a.type === "ATTACK" || a.type === "ATTACK_CITY").length;
    if (getVictoryStatus(state).winnerId) break;
  }

  assert.ok(sawTrireme, "the AI should build a trireme from its coastal city");
  assert.ok(navalAttacks > 0, "the fleets should engage across the strait");
});

test("the AI works its land with tile improvements", () => {
  const cities = {
    c1: { id: "c1", ownerId: "p1", position: { q: 3, r: 3 }, population: 3, hp: 40, maxHp: 40 }
  };
  let state = makeState({}, cities, [], 40);
  for (let i = 0; i < 70 && !Object.values(state.map.tiles).some((t) => t.improvement); i += 1) {
    const current = state.players[state.currentPlayerIndex].id;
    state = runAiTurn(state, current, 12).state;
  }
  assert.ok(
    Object.values(state.map.tiles).some((t) => t.improvement),
    "the AI improved at least one tile it works"
  );
});

test("ai chooses a valid action for the active player", () => {
  const state = createInitialGameState(loadScenario("italia").config);
  assert.equal(chooseAiAction(state, "rome").playerId, "rome");
});

test("ai turn runner always finishes with END_TURN", () => {
  const state = createInitialGameState(loadScenario("italia").config);
  const result = runAiTurn(state, "rome", 6);
  assert.ok(result.actions.length > 0);
  assert.equal(result.actions[result.actions.length - 1].type, "END_TURN");
});

test("ai does not throw its unit into a losing attack", () => {
  const state = makeState({
    // A near-dead warrior next to a healthy enemy: attacking would kill it for ~nothing.
    weak: { id: "weak", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 }, hp: 3 },
    strong: { id: "strong", type: "warrior", ownerId: "p2", position: { q: 2, r: 1 } }
  });
  const action = chooseAiAction(state, "p1");
  assert.notEqual(action.type, "ATTACK", "should not suicide-attack; should retreat/do something else");
});

test("ai takes a favorable kill when offered", () => {
  const state = makeState({
    hero: { id: "hero", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } },
    prey: { id: "prey", type: "archer", ownerId: "p2", position: { q: 2, r: 1 }, hp: 2 }
  });
  const action = chooseAiAction(state, "p1");
  assert.equal(action.type, "ATTACK");
  assert.equal((action as { defenderId: string }).defenderId, "prey");
});

test("ai expands with a settler when it has room to grow", () => {
  const state = makeState(
    {},
    { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40 } }
  );
  const action = chooseAiAction(state, "p1");
  assert.equal(action.type, "BUILD_UNIT");
  assert.equal((action as { unitType: string }).unitType, "settler");
});

test("ai builds the best unlocked unit once teched (and done expanding)", () => {
  // Three cities => expansion target met, so it should build military, not a settler.
  const state = makeState(
    {},
    {
      c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40 },
      c2: { id: "c2", ownerId: "p1", position: { q: 5, r: 1 }, population: 2, hp: 40, maxHp: 40 },
      c3: { id: "c3", ownerId: "p1", position: { q: 1, r: 5 }, population: 2, hp: 40, maxHp: 40 }
    },
    ["bronze-working", "iron-working"],
    40
  );
  const action = chooseAiAction(state, "p1");
  assert.equal(action.type, "BUILD_UNIT");
  assert.equal((action as { unitType: string }).unitType, "swordsman");
});

test("two AIs actually fight and drive the game to a conclusion", () => {
  // A land-connected arena so the two land armies can actually reach each other
  // (the authored scenarios are amphibious — fighting across them needs fleets).
  const units = {
    p1a: { id: "p1a", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 }, movementRemaining: 2 },
    p1b: { id: "p1b", type: "swordsman", ownerId: "p1", position: { q: 1, r: 2 }, movementRemaining: 2 },
    p2a: { id: "p2a", type: "warrior", ownerId: "p2", position: { q: 6, r: 6 }, movementRemaining: 2 },
    p2b: { id: "p2b", type: "swordsman", ownerId: "p2", position: { q: 6, r: 5 }, movementRemaining: 2 }
  };
  const cities = {
    p1c: { id: "p1c", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, isCapital: true, hp: 24, maxHp: 24 },
    p2c: { id: "p2c", ownerId: "p2", position: { q: 7, r: 7 }, population: 2, isCapital: true, hp: 24, maxHp: 24 }
  };
  let state = makeState(units, cities, [], 40);

  let attacks = 0;
  let winner: string | null = null;
  for (let i = 0; i < 240 && !winner; i += 1) {
    const current = state.players[state.currentPlayerIndex].id;
    const result = runAiTurn(state, current, 12);
    state = result.state;
    attacks += result.actions.filter((a) => a.type === "ATTACK" || a.type === "ATTACK_CITY").length;
    winner = getVictoryStatus(state).winnerId;
  }

  assert.ok(attacks > 0, "the AIs should engage in combat");
  assert.ok(winner === "p1" || winner === "p2", `expected a decisive winner, got ${winner}`);
});
