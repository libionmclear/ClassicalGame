import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, computeCombatPreview, applyAction } from "../src/engine/index";
import type { CreateGameConfig } from "../src/engine/types";

function makeState(
  units: NonNullable<NonNullable<CreateGameConfig["map"]>["units"]>,
  techs: string[] = [],
  cities: NonNullable<NonNullable<CreateGameConfig["map"]>["cities"]> = {}
) {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 6; r += 1) {
    for (let q = 0; q < 6; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  }
  return createInitialGameState({
    seed: "combat-test",
    players: [
      { id: "p1", civ: "Rome", production: 200, techs },
      { id: "p2", civ: "Carthage", production: 0 }
    ],
    map: { width: 6, height: 6, regions: ["core"], tiles, units, cities }
  });
}

test("spearmen resist cavalry better than warriors (anti-cavalry defense)", () => {
  const state = makeState({
    horse: { id: "horse", type: "horseman", ownerId: "p2", position: { q: 2, r: 2 } },
    spear: { id: "spear", type: "spearman", ownerId: "p1", position: { q: 2, r: 1 } },
    warr: { id: "warr", type: "warrior", ownerId: "p1", position: { q: 3, r: 2 } }
  });
  const vsSpear = computeCombatPreview(state, "horse", "spear");
  const vsWarrior = computeCombatPreview(state, "horse", "warr");
  assert.ok(
    vsSpear.damageToDefender < vsWarrior.damageToDefender,
    `spearman should take less cavalry damage (${vsSpear.damageToDefender}) than warrior (${vsWarrior.damageToDefender})`
  );
});

test("spearmen hit cavalry harder than warriors do (anti-cavalry attack)", () => {
  const state = makeState({
    horse: { id: "horse", type: "horseman", ownerId: "p2", position: { q: 2, r: 2 } },
    spear: { id: "spear", type: "spearman", ownerId: "p1", position: { q: 2, r: 1 } },
    warr: { id: "warr", type: "warrior", ownerId: "p1", position: { q: 3, r: 2 } }
  });
  const spearHit = computeCombatPreview(state, "spear", "horse");
  const warrHit = computeCombatPreview(state, "warr", "horse");
  assert.ok(
    spearHit.damageToDefender > warrHit.damageToDefender,
    `spearman charge bonus should out-damage warrior vs cavalry (${spearHit.damageToDefender} > ${warrHit.damageToDefender})`
  );
});

test("cavalry runs down archers (counter bonus vs ranged)", () => {
  const state = makeState({
    prey: { id: "prey", type: "archer", ownerId: "p2", position: { q: 2, r: 2 } },
    horse: { id: "horse", type: "horseman", ownerId: "p1", position: { q: 2, r: 1 } },
    warr: { id: "warr", type: "warrior", ownerId: "p1", position: { q: 3, r: 2 } }
  });
  const cav = computeCombatPreview(state, "horse", "prey");
  const foot = computeCombatPreview(state, "warr", "prey");
  assert.ok(cav.damageToDefender > foot.damageToDefender, "cavalry should out-damage infantry vs archers");
  assert.ok(cav.modifiers.some((m) => /cavalry vs ranged/i.test(m)), "modifier list should explain the counter");
});

test("spears blunt a cavalry charge (defensive counter is visible)", () => {
  const state = makeState({
    horse: { id: "horse", type: "horseman", ownerId: "p1", position: { q: 2, r: 2 } },
    spear: { id: "spear", type: "spearman", ownerId: "p2", position: { q: 2, r: 1 } }
  });
  const preview = computeCombatPreview(state, "horse", "spear");
  assert.ok(preview.modifiers.some((m) => /spearmen vs cavalry/i.test(m)), "defender's anti-cavalry counter should show");
});

test("combined arms: a mixed force hits harder than a lone unit", () => {
  const mixed = makeState(
    {
      lead: { id: "lead", type: "warrior", ownerId: "p1", position: { q: 2, r: 2 } },
      // adjacent to the attacker but NOT the target, so this is composition, not flanking
      arch: { id: "arch", type: "archer", ownerId: "p1", position: { q: 1, r: 2 } },
      horse: { id: "horse", type: "horseman", ownerId: "p1", position: { q: 1, r: 3 } },
      target: { id: "target", type: "settler", ownerId: "p2", position: { q: 3, r: 2 } }
    },
    ["combined-arms"] // the doctrine that unlocks the combined-arms bonus
  );
  const solo = makeState({
    lead: { id: "lead", type: "warrior", ownerId: "p1", position: { q: 2, r: 2 } },
    target: { id: "target", type: "settler", ownerId: "p2", position: { q: 3, r: 2 } }
  });
  const mixedHit = computeCombatPreview(mixed, "lead", "target");
  const soloHit = computeCombatPreview(solo, "lead", "target");
  assert.ok(mixedHit.damageToDefender > soloHit.damageToDefender, "combined arms should raise damage");
  assert.ok(mixedHit.modifiers.some((m) => /combined arms/i.test(m)), "combined-arms modifier should be listed");
  assert.ok(!mixedHit.modifiers.some((m) => /flanking/i.test(m)), "support units are not adjacent to the target, so no flanking");
});

test("combined arms requires the doctrine tech to be researched", () => {
  const units = {
    lead: { id: "lead", type: "warrior", ownerId: "p1", position: { q: 2, r: 2 } },
    arch: { id: "arch", type: "archer", ownerId: "p1", position: { q: 1, r: 2 } },
    horse: { id: "horse", type: "horseman", ownerId: "p1", position: { q: 1, r: 3 } },
    target: { id: "target", type: "settler", ownerId: "p2", position: { q: 3, r: 2 } }
  };
  const untrained = makeState(units, []); // no combined-arms tech
  const hit = computeCombatPreview(untrained, "lead", "target");
  assert.ok(!hit.modifiers.some((m) => /combined arms|supported/i.test(m)), "no composition bonus without the doctrine");
});

test("siege engines crack cities far harder than infantry", () => {
  const city = { c2: { id: "c2", ownerId: "p2", position: { q: 3, r: 3 }, population: 2, hp: 60, maxHp: 60, isCapital: true } };
  const siegeState = makeState(
    { s: { id: "s", type: "siege", ownerId: "p1", position: { q: 3, r: 1 } } },
    [],
    JSON.parse(JSON.stringify(city))
  );
  const warriorState = makeState(
    { w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 3, r: 2 } } },
    [],
    JSON.parse(JSON.stringify(city))
  );
  const afterSiege = applyAction(siegeState, { type: "ATTACK_CITY", playerId: "p1", attackerId: "s", cityId: "c2" });
  const afterWarrior = applyAction(warriorState, { type: "ATTACK_CITY", playerId: "p1", attackerId: "w", cityId: "c2" });
  const siegeDamage = 60 - afterSiege.map.cities.c2.hp;
  const warriorDamage = 60 - afterWarrior.map.cities.c2.hp;
  assert.ok(siegeDamage > warriorDamage, `siege (${siegeDamage}) should out-damage warrior (${warriorDamage}) vs a city`);
});

test("units gated by tech cannot be built until the tech is researched", () => {
  const cities = { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 40, maxHp: 40 } };
  const build = { type: "BUILD_UNIT", playerId: "p1", cityId: "c1", unitType: "swordsman", unitId: "sw1" } as const;

  const noTech = makeState({}, [], JSON.parse(JSON.stringify(cities)));
  assert.throws(() => applyAction(noTech, build), /requires tech iron-working/);

  const withTech = makeState({}, ["iron-working"], JSON.parse(JSON.stringify(cities)));
  const after = applyAction(withTech, build);
  assert.ok(after.map.units.sw1, "swordsman should exist once iron-working is known");
  assert.equal(after.playersById.p1.production, 200 - 20, "swordsman cost should be deducted");
});
