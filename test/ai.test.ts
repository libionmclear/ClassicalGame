import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, getVictoryStatus } from "../src/engine";
import { chooseAiAction, runAiTurn } from "../src/engine/ai";
import { loadScenario } from "../src/engine/scenarios";
import type { CreateGameConfig } from "../src/engine/types";

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
  let state = createInitialGameState(loadScenario("italia").config);
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
  assert.ok(winner === "rome" || winner === "carthage", `expected a decisive winner, got ${winner}`);
});
