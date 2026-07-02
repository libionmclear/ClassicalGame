import test from "node:test";
import assert from "node:assert/strict";

import { computeVisibility, createInitialGameState } from "../src/engine/index";

test("visibility includes nearby tiles around player's city and units", () => {
  const state = createInitialGameState({
    players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 6,
      height: 6,
      tiles: Object.fromEntries(
        Array.from({ length: 6 }).flatMap((_, q) =>
          Array.from({ length: 6 }).map((__, r) => [`${q},${r}`, { terrain: "plains", region: "core" }])
        )
      ),
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2 }
      },
      units: {
        u1: { id: "u1", ownerId: "p1", type: "warrior", position: { q: 2, r: 1 } }
      }
    }
  });

  const visibility = computeVisibility(state, "p1");
  const visible = new Set(visibility.visibleTiles);

  assert.ok(visible.has("1,1"));
  assert.ok(visible.has("2,1"));
  assert.ok(visible.has("3,1"));
});

test("visibility excludes distant tiles but keeps them discovered once seen", () => {
  let state = createInitialGameState({
    players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 8,
      height: 8,
      tiles: Object.fromEntries(
        Array.from({ length: 8 }).flatMap((_, q) =>
          Array.from({ length: 8 }).map((__, r) => [`${q},${r}`, { terrain: "plains", region: "core" }])
        )
      ),
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2 }
      },
      units: {
        u1: { id: "u1", ownerId: "p1", type: "warrior", position: { q: 0, r: 0 } }
      }
    }
  });

  const first = computeVisibility(state, "p1");
  const farTile = "7,7";
  assert.equal(first.visibleTiles.includes(farTile), false);

  state.map.units.u1.position = { q: 6, r: 6 };
  const second = computeVisibility(state, "p1");
  assert.equal(second.visibleTiles.includes(farTile), true);

  state.map.units.u1.position = { q: 0, r: 0 };
  const third = computeVisibility(state, "p1");
  assert.equal(third.visibleTiles.includes(farTile), false);
  assert.equal(third.discoveredTiles.includes(farTile), true);
});
