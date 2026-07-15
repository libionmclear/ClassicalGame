// AI depth (§10): the opponent now works the Discovery layer — moves its Explorer
// to dig ruins and courts/absorbs Minor-People villages — instead of ignoring it.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState } from "../src/engine";
import { runAiTurn, exploreAction, villageAction } from "../src/engine/ai";
import { distance } from "../src/engine/hex";
import type { GameState } from "../src/engine/types";

// Explorer at (1,1); a warrior at (2,3) sits beside the test village (2,2) but off
// the Explorer's eastbound routes; city at (0,0). Ruins/villages set per test.
function baseState(seed = "aidisc"): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 6; r += 1) for (let q = 0; q < 6; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const s = createInitialGameState({
    seed,
    players: [{ id: "p1", civ: "Rome", gold: 100, science: 0 }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 6, height: 6, regions: ["core"], tiles,
      units: {
        ex: { id: "ex", type: "explorer", ownerId: "p1", position: { q: 1, r: 1 }, movementRemaining: 4 },
        w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 2, r: 3 }, movementRemaining: 2 },
      },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } },
    },
  });
  s.map.ruins = {};
  s.map.villages = {};
  return s;
}

test("exploreAction sends the Explorer toward the nearest un-excavated ruin", () => {
  const s = baseState();
  s.map.ruins = { "4,1": { ruinId: "giza" }, "1,4": { ruinId: "troy", excavated: true, by: "p2", full: true } };
  const action = exploreAction(s, s.playersById["p1"]!);
  assert.ok(action && action.type === "MOVE_UNIT", "the Explorer is ordered to move");
  if (action.type !== "MOVE_UNIT") return;
  assert.equal(action.unitId, "ex");
  // It heads for the UN-excavated ruin (4,1), not the already-dug one (1,4).
  assert.ok(distance(action.destination, { q: 4, r: 1 }) < distance({ q: 1, r: 1 }, { q: 4, r: 1 }), "steps closer to the ruin");
});

test("exploreAction falls back to approaching a village when there are no ruins", () => {
  const s = baseState();
  s.map.villages = { "4,3": { peopleId: "latins", disposition: "open" } };
  const action = exploreAction(s, s.playersById["p1"]!);
  assert.ok(action && action.type === "MOVE_UNIT" && action.unitId === "ex");
  if (action.type !== "MOVE_UNIT") return;
  assert.ok(distance(action.destination, { q: 4, r: 3 }) < distance({ q: 1, r: 1 }, { q: 4, r: 3 }), "moves toward the village");
});

test("villageAction courts an open village a unit is standing beside", () => {
  const s = baseState();
  s.map.villages = { "2,2": { peopleId: "latins", disposition: "open" } };
  const action = villageAction(s, s.playersById["p1"]!);
  assert.ok(action && action.type === "BEFRIEND_VILLAGE" && action.hex === "2,2", String(action));
});

test("villageAction does NOT court when the treasury is too thin", () => {
  const s = baseState();
  s.playersById["p1"]!.gold = 5; // below cost + reserve
  s.map.villages = { "2,2": { peopleId: "latins", disposition: "open" } };
  assert.equal(villageAction(s, s.playersById["p1"]!), null);
});

test("villageAction absorbs a village it has already befriended (a free town)", () => {
  const s = baseState();
  s.map.villages = { "2,2": { peopleId: "latins", disposition: "open", befriendedBy: "p1" } };
  const action = villageAction(s, s.playersById["p1"]!);
  assert.ok(action && action.type === "ABSORB_VILLAGE" && action.mode === "join" && action.hex === "2,2");
});

test("villageAction seizes a hostile village when a soldier is already adjacent", () => {
  const s = baseState();
  s.map.villages = { "2,2": { peopleId: "belgae", disposition: "hostile" } };
  const action = villageAction(s, s.playersById["p1"]!);
  assert.ok(action && action.type === "CONQUER_VILLAGE" && action.hex === "2,2");
});

test("an AI Explorer digs up a nearby ruin over its turn (full reward)", () => {
  const s = baseState();
  s.map.ruins = { "1,2": { ruinId: "troy" } }; // a gold ruin one step from the Explorer, path clear
  const goldBefore = s.playersById["p1"]!.gold;
  const { state: ns } = runAiTurn(s, "p1", 14);
  assert.ok(ns.map.ruins!["1,2"].excavated, "the ruin was excavated by the AI");
  assert.equal(ns.map.ruins!["1,2"].full, true, "an Explorer earns the FULL reward (not the half a soldier would)");
  assert.ok(ns.playersById["p1"]!.gold > goldBefore, "the treasure was banked");
});
