import test from "node:test";
import assert from "node:assert/strict";
import { UNITS, TECHS, UNIT_BUILD_COSTS } from "../src/engine/data";
import { createInitialGameState, applyAction } from "../src/engine/index";

// HEGEMON v2 Phase 3 — unique-unit roster validity + elite caps.

test("every civ-unique unit gates on a real tech, upgrades from a real unit, and has a cost", () => {
  for (const [id, u] of Object.entries(UNITS)) {
    if (!u.civ) continue; // only the civ-unique roster
    if (u.requiresTech) assert.ok(TECHS[u.requiresTech], `${id} requiresTech "${u.requiresTech}" must exist`);
    if (u.upgradesFrom) assert.ok(UNITS[u.upgradesFrom], `${id} upgradesFrom "${u.upgradesFrom}" must exist`);
    assert.ok(typeof UNIT_BUILD_COSTS[id] === "number", `${id} has a build cost`);
  }
});

test("the wave-1 unique units all exist and are gated to their people", () => {
  const wave1: Record<string, string> = {
    velites: "rome", praetorian: "rome", "sacred-band": "carthage", "numidian-cavalry": "carthage",
    peltast: "greece", "athenian-trireme": "greece", "nubian-archer": "egypt", machimoi: "egypt",
    "noble-horse": "gaul", soldurii: "gaul", "camel-train": "parthia", cataphract: "parthia"
  };
  for (const [id, civ] of Object.entries(wave1)) {
    assert.ok(UNITS[id], `${id} exists`);
    assert.equal(UNITS[id].civ, civ, `${id} belongs to ${civ}`);
  }
});

function romeState() {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  return createInitialGameState({
    seed: "guard",
    players: [{ id: "rome", civ: "Rome", production: 999, techs: ["marian-reforms"] }],
    map: { width: 3, height: 3, regions: ["r"], tiles: tiles as never, cities: { c: { id: "c", ownerId: "rome", position: { q: 1, r: 1 }, population: 4 } } }
  });
}

test("elite-guard cap: no more than 2 Praetorians may be queued/fielded", () => {
  let s = romeState();
  s = applyAction(s, { type: "BUILD_UNIT", playerId: "rome", cityId: "c", unitType: "praetorian", unitId: "p1" });
  s = applyAction(s, { type: "BUILD_UNIT", playerId: "rome", cityId: "c", unitType: "praetorian", unitId: "p2" });
  assert.throws(
    () => applyAction(s, { type: "BUILD_UNIT", playerId: "rome", cityId: "c", unitType: "praetorian", unitId: "p3" }),
    /at most 2/
  );
});

test("camel-train is a non-combat support unit", () => {
  assert.equal(UNITS["camel-train"].category, "support");
  assert.equal(UNITS["camel-train"].attack, 0);
  assert.equal(UNITS["camel-train"].domain, "civilian");
});
