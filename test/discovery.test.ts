import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import { RUIN_BY_ID, excavateRuins } from "../src/engine/discovery";
import { scatterRuins } from "../src/engine/mapgen";
import { UNITS, UNIT_BUILD_COSTS } from "../src/engine/data";
import type { GameState } from "../src/engine/types";

test("the Explorer is a fast, unarmed recon unit (§10.1)", () => {
  assert.equal(UNITS.explorer.movement, 4, "fastest land unit");
  assert.equal(UNITS.explorer.attack, 0, "cannot attack");
  assert.equal(UNITS.explorer.domain, "civilian");
  assert.ok(UNIT_BUILD_COSTS.explorer > 0, "buildable");
});

test("scatterRuins seeds valid ruins on land, never on a city, deterministically", () => {
  const map: { tiles: Record<string, { terrain: string }>; cities: Record<string, { position: { q: number; r: number } }> } = {
    tiles: {}, cities: { c: { position: { q: 0, r: 0 } } }
  };
  for (let q = 0; q < 8; q += 1) for (let r = 0; r < 8; r += 1) map.tiles[`${q},${r}`] = { terrain: "plains" };
  const ruins = scatterRuins(map, "seed1");
  const keys = Object.keys(ruins);
  assert.ok(keys.length >= 3, "at least the minimum density");
  assert.ok(!ruins["0,0"], "no ruin on the city tile");
  keys.forEach((k) => assert.ok(RUIN_BY_ID[ruins[k].ruinId], "each is a real ruin"));
  assert.deepEqual(scatterRuins(map, "seed1"), ruins, "same seed → same placement");
});

function ruinState(unitType: string): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const s = createInitialGameState({
    seed: "exc",
    players: [{ id: "p1", civ: "Rome", science: 0, gold: 0 }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      units: { u: { id: "u", type: unitType, ownerId: "p1", position: { q: 1, r: 1 } } },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } }
    }
  });
  s.map.ruins = { "1,1": { ruinId: "troy" } }; // Mound of Troy → gold 70
  return s;
}

test("ending a turn on a ruin excavates it (END_TURN integration)", () => {
  const s = applyAction(ruinState("explorer"), { type: "END_TURN", playerId: "p1" });
  assert.ok(s.map.ruins!["1,1"].excavated, "ruin consumed at turn end");
  assert.ok(s.playersById["p1"].gold >= 70, "the reward flowed through");
  assert.ok((s.playersById["p1"].codex ?? []).includes("troy"), "Codex entry earned");
});

test("an Explorer gets the full reward, a soldier only half (no Codex)", () => {
  const ex = ruinState("explorer"); excavateRuins(ex, "p1");
  assert.equal(ex.playersById["p1"].gold, 70, "Explorer: full 70");
  assert.ok((ex.playersById["p1"].codex ?? []).includes("troy"));

  const sol = ruinState("warrior"); excavateRuins(sol, "p1");
  assert.equal(sol.playersById["p1"].gold, 35, "soldier: half of 70");
  assert.ok(!(sol.playersById["p1"].codex ?? []).includes("troy"), "no Codex for a soldier");
});

test("a consumed ruin yields nothing to the next visitor", () => {
  const s = ruinState("explorer");
  excavateRuins(s, "p1");
  const after = s.playersById["p1"].gold;
  excavateRuins(s, "p1");
  assert.equal(s.playersById["p1"].gold, after, "no double-dip on an excavated ruin");
});

test("excavateRuins applies XP and reveal rewards", () => {
  const tiles: Record<string, { terrain: "hills"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "hills", region: "core" };
  const s = createInitialGameState({
    seed: "xp", players: [{ id: "p1", civ: "Greeks" }],
    map: { width: 4, height: 4, regions: ["core"], tiles, units: { u: { id: "u", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } } } }
  });
  s.map.ruins = { "1,1": { ruinId: "mycenae" } }; // reward: xp (all units +veterancy)
  excavateRuins(s, "p1");
  assert.equal(s.map.units["u"].veterancy, "veteran", "a recruit was promoted");
});
