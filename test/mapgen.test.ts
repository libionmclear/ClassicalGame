import test from "node:test";
import assert from "node:assert/strict";

import { generateMap, MAP_SIZES, type MapSize } from "../src/engine/mapgen";
import { createInitialGameState, findPath, UNITS } from "../src/engine/index";

const SIZES: MapSize[] = ["small", "medium", "large", "xl"];

test("generateMap is deterministic for the same size and seed", () => {
  const a = generateMap({ size: "medium", seed: "abc" });
  const b = generateMap({ size: "medium", seed: "abc" });
  assert.deepEqual(a, b);
});

test("different seeds produce different maps", () => {
  const a = generateMap({ size: "medium", seed: "seed-one" });
  const b = generateMap({ size: "medium", seed: "seed-two" });
  assert.notDeepEqual(a.map?.tiles, b.map?.tiles);
});

test("generateMap places N dispersed capitals, all reachable from player 0", () => {
  for (const playerCount of [2, 3, 4, 5, 6]) {
    const config = generateMap({ size: "large", seed: `mp-${playerCount}`, playerCount });
    const capitals = Object.values(config.map?.cities ?? {}).filter((c) => c.isCapital);
    assert.equal(capitals.length, playerCount, `${playerCount} players -> ${capitals.length} capitals`);

    // Each rival capital must be reachable by a land unit from Rome's capital.
    const state = createInitialGameState(config);
    const rome = capitals.find((c) => c.ownerId === "rome");
    assert.ok(rome, "rome capital present");
    const warrior = UNITS.warrior;
    for (const other of capitals) {
      if (other.ownerId === "rome") continue;
      const path = findPath(
        state,
        { ownerId: "rome", domain: warrior.domain, mounted: warrior.mounted },
        rome!.position,
        other.position
      );
      assert.ok(path && path.length >= 2, `no path rome -> ${other.ownerId} with ${playerCount} players`);
    }
  }
});

test("generateMap clamps player count to the roster range", () => {
  const tooMany = generateMap({ size: "medium", seed: "clamp-hi", playerCount: 99 });
  assert.equal(Object.values(tooMany.map?.cities ?? {}).filter((c) => c.isCapital).length, 6);
  const tooFew = generateMap({ size: "medium", seed: "clamp-lo", playerCount: 1 });
  assert.equal(Object.values(tooFew.map?.cities ?? {}).filter((c) => c.isCapital).length, 2);
});

for (const size of SIZES) {
  test(`generateMap(${size}) has correct dimensions and full tile coverage`, () => {
    const spec = MAP_SIZES[size];
    const config = generateMap({ size, seed: `dims-${size}` });
    assert.equal(config.map?.width, spec.width);
    assert.equal(config.map?.height, spec.height);
    assert.equal(Object.keys(config.map?.tiles ?? {}).length, spec.width * spec.height);
  });

  test(`generateMap(${size}) places two separated capitals joined by a land route`, () => {
    const config = generateMap({ size, seed: `route-${size}` });
    const cities = Object.values(config.map?.cities ?? {});
    const capitals = cities.filter((c) => c.isCapital);
    assert.equal(capitals.length, 2);

    const [a, b] = capitals;
    assert.notDeepEqual(a.position, b.position);

    // A basic land unit must be able to path between the capitals (domination stays winnable).
    const state = createInitialGameState(config);
    const warrior = UNITS.warrior;
    const path = findPath(
      state,
      { ownerId: a.ownerId, domain: warrior.domain, mounted: warrior.mounted },
      a.position,
      b.position
    );
    assert.ok(path && path.length >= 2, `no land path between capitals on ${size}`);
  });

  test(`generateMap(${size}) starts each player with a warrior and a settler`, () => {
    const config = generateMap({ size, seed: `units-${size}` });
    const units = Object.values(config.map?.units ?? {});
    for (const owner of ["rome", "carthage"]) {
      const owned = units.filter((u) => u.ownerId === owner);
      assert.ok(owned.some((u) => u.type === "warrior"), `${owner} missing warrior`);
      assert.ok(owned.some((u) => u.type === "settler"), `${owner} missing settler`);
    }
  });
}
