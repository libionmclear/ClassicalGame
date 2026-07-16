// The open ocean beyond the map's edge: a sailable belt rings the board, but push
// too far out and the sea keeps you.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, openSeaDistance, isCoastalCity, OPEN_SEA_MARGIN, LOST_AT_SEA_DIST } from "../src/engine";
import type { GameState, GameAction } from "../src/engine/types";

// A 4x4 plains map with an inland city; optionally a trireme parked somewhere.
function seaState(unitPos?: { q: number; r: number }): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  return createInitialGameState({
    seed: "opensea",
    players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      units: unitPos ? { s: { id: "s", type: "trireme", ownerId: "p1", position: unitPos } } : {},
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 24, maxHp: 24 } },
    },
  });
}

const keyAtRing = (s: GameState, ring: number): { q: number; r: number } => {
  const k = Object.keys(s.map.tiles).find((key) => s.map.tiles[key]!.open === ring);
  assert.ok(k, `expected a tile ${ring} hexes past the border`);
  const [q, r] = k!.split(",").map(Number);
  return { q: q!, r: r! };
};

test("an open-ocean belt rings the map, tagged with how far past the border it lies", () => {
  const s = seaState();
  const belt = Object.values(s.map.tiles).filter((t) => t.open);
  assert.ok(belt.length > 0, "the belt exists");
  assert.ok(belt.every((t) => t.terrain === "sea"), "it is all open sea");
  const rings = new Set(belt.map((t) => t.open));
  assert.equal(Math.max(...(rings as Set<number>)), OPEN_SEA_MARGIN, "it reaches OPEN_SEA_MARGIN rings out");
  assert.ok(rings.has(1) && rings.has(LOST_AT_SEA_DIST), "the rings in between all exist");
});

test("playable tiles are untouched by the belt", () => {
  const s = seaState();
  assert.equal(s.map.tiles["1,1"]!.open, undefined);
  assert.equal(s.map.tiles["1,1"]!.terrain, "plains");
  assert.equal(openSeaDistance(s, { q: 1, r: 1 }), 0);
});

test("the world ocean is NOT a city's coast — an inland town gains no harbour", () => {
  const s = seaState();
  assert.equal(isCoastalCity(s, "c1"), false);
});

test("a ship that pushes LOST_AT_SEA_DIST past the border is lost at sea", () => {
  const at = keyAtRing(seaState(), LOST_AT_SEA_DIST);
  const s = seaState(at);
  assert.equal(openSeaDistance(s, at), LOST_AT_SEA_DIST);
  const ns = applyAction(s, { type: "END_TURN", playerId: "p1" } as GameAction);
  assert.equal(ns.map.units["s"], undefined, "the ship is gone");
  assert.ok(!ns.playersById["p1"]!.unitIds.includes("s"), "and is de-indexed from its owner");
  assert.equal(ns.lostAtSea?.length, 1, "the loss is reported for the client");
  assert.equal(ns.lostAtSea?.[0]!.type, "trireme");
  assert.equal(ns.lostAtSea?.[0]!.playerId, "p1");
});

test("a ship still short of that distance sails on", () => {
  const at = keyAtRing(seaState(), LOST_AT_SEA_DIST - 1);
  const s = seaState(at);
  const ns = applyAction(s, { type: "END_TURN", playerId: "p1" } as GameAction);
  assert.ok(ns.map.units["s"], "still afloat");
  assert.equal(ns.lostAtSea?.length, 0);
});
