import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import { getRelation } from "../src/engine/diplomacy";
import { scatterVillages, PEOPLE_BY_ID } from "../src/engine/peoples";
import type { GameState } from "../src/engine/types";

test("villages seed on land, off cities and ruin tiles, deterministically", () => {
  const map: { tiles: Record<string, { terrain: string }>; cities: Record<string, { position: { q: number; r: number } }> } = {
    tiles: {}, cities: { c: { position: { q: 0, r: 0 } } }
  };
  for (let q = 0; q < 8; q += 1) for (let r = 0; r < 8; r += 1) map.tiles[`${q},${r}`] = { terrain: "plains" };
  const avoid = new Set(["1,1"]);
  const v = scatterVillages(map, "s", avoid);
  const keys = Object.keys(v);
  assert.ok(keys.length >= 4, "minimum density");
  assert.ok(!v["0,0"] && !v["1,1"], "avoids the city and the ruin tile");
  keys.forEach((k) => assert.ok(PEOPLE_BY_ID[v[k].peopleId], "valid people id"));
  assert.deepEqual(scatterVillages(map, "s", avoid), v, "deterministic");
});

// A player unit sits ON the village at (1,1); a rival p2 exists for reputation.
function villageState(peopleId: string, disposition: "open" | "wary" | "hostile", unitType = "warrior"): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const s = createInitialGameState({
    seed: "vil",
    players: [{ id: "p1", civ: "Rome", gold: 100, science: 0 }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      units: { u: { id: "u", type: unitType, ownerId: "p1", position: { q: 1, r: 1 } } },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } }
    }
  });
  s.map.villages = { "1,1": { peopleId, disposition } };
  return s;
}

test("befriending pays gold and grants the full benefit", () => {
  const s = applyAction(villageState("latins", "open"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(s.playersById["p1"].gold, 70, "paid the 30 courtship cost");
  assert.equal(s.playersById["p1"].science, 10, "Latins: +science");
  assert.equal(s.map.cities["c1"].population, 4, "Latins: +2 pop to the nearest city");
  assert.equal(s.map.villages!["1,1"].befriendedBy, "p1");
  assert.equal(s.map.villages!["1,1"].disposition, "open");
});

test("a recruit-benefit village hands you a levy when befriended", () => {
  const s = applyAction(villageState("samnites", "open"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(Object.values(s.map.units).filter((u) => u.ownerId === "p1" && u.type === "swordsman").length, 1);
});

test("befriending needs a unit near, gold, and a non-hostile village", () => {
  assert.throws(() => applyAction(villageState("latins", "hostile"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" }), /hostile/);
  const poor = villageState("latins", "open"); poor.playersById["p1"].gold = 5;
  assert.throws(() => applyAction(poor, { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" }), /Not enough gold/);
});

test("demanding tribute pays now but sours them", () => {
  const s = applyAction(villageState("lydians", "open"), { type: "DEMAND_TRIBUTE_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(s.playersById["p1"].gold, 115, "gained the tribute");
  assert.equal(s.map.villages!["1,1"].disposition, "wary", "they cool a step");
});

test("conquest yields a town + material gold but burns the knowledge", () => {
  // Lydians: gold 50 + science 15 (knowledge). By force → gold kept, science lost.
  const s = applyAction(villageState("lydians", "open", "warrior"), { type: "CONQUER_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(s.playersById["p1"].gold, 150, "material gold (50) taken");
  assert.equal(s.playersById["p1"].science, 0, "archives burned — no science");
  assert.ok(Object.values(s.map.cities).some((c) => c.position.q === 1 && c.position.r === 1 && c.ownerId === "p1"), "a new town");
  assert.equal(s.map.villages!["1,1"], undefined, "village consumed");
  assert.ok(getRelation(s, "p1", "p2") < 0, "the world frowns on the conquest");
});

test("conquering a knowledge village needs a soldier and yields an empty town", () => {
  assert.throws(() => applyAction(villageState("chaldeans", "open", "settler"), { type: "CONQUER_VILLAGE", playerId: "p1", hex: "1,1" }), /soldier/);
  const s = applyAction(villageState("chaldeans", "open", "warrior"), { type: "CONQUER_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(s.playersById["p1"].science, 0, "star-lore lost to the sword");
});

test("absorbing a befriended village: join founds a town, migrate swells a city", () => {
  const befriended = applyAction(villageState("latins", "open"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  const joined = applyAction(befriended, { type: "ABSORB_VILLAGE", playerId: "p1", hex: "1,1", mode: "join" });
  assert.ok(Object.values(joined.map.cities).some((c) => c.position.q === 1 && c.position.r === 1), "join → town");
  assert.equal(joined.map.villages!["1,1"], undefined);

  const popBefore = befriended.map.cities["c1"].population;
  const migrated = applyAction(befriended, { type: "ABSORB_VILLAGE", playerId: "p1", hex: "1,1", mode: "migrate" });
  assert.equal(migrated.map.cities["c1"].population, popBefore + 2, "migrate → +2 pop");
});

test("an Explorer ending beside a wary village warms it a step (§10.3)", () => {
  const s0 = villageState("thracians", "wary", "explorer");
  const s = applyAction(s0, { type: "END_TURN", playerId: "p1" });
  assert.equal(s.map.villages!["1,1"].disposition, "open", "first contact by an Explorer");
  assert.ok(s.map.villages!["1,1"].contacted);
});
