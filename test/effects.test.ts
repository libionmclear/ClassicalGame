import test from "node:test";
import assert from "node:assert/strict";
import { computeCombatPreview, createInitialGameState, effectiveItemCost, scaledResearchCost, computeCityYield, restHealAmount, applyAction } from "../src/engine/index";
import type { GameState, Player } from "../src/engine/types";

function city(opts: { techs?: string[]; farm?: boolean; capital?: boolean; building?: string }): GameState {
  const tiles: Record<string, { terrain: string; region: string; improvement?: string }> = {};
  for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  if (opts.farm) tiles["1,0"].improvement = "farm";
  return createInitialGameState({
    seed: "cy",
    players: [{ id: "p1", civ: "rome", techs: opts.techs || [] }],
    map: {
      width: 3, height: 3, regions: ["r"], tiles: tiles as never,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 4, isCapital: !!opts.capital, buildings: opts.building ? [opts.building] : [] } }
    }
  });
}

// Effect wiring, Slice 1 — branch-tech + equipped-card combat % actually reach the
// combat calculation (they were flagged/data-only before).

function duel(opts: { techs?: string[]; perks?: Player["perks"] }): GameState {
  const tiles: Record<string, { terrain: string; region: string }> = {};
  for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "r" };
  const s = createInitialGameState({
    seed: "duel",
    players: [{ id: "p1", civ: "macedon", techs: opts.techs || [] }, { id: "p2", civ: "rome" }],
    map: {
      width: 3, height: 3, regions: ["r"], tiles: tiles as never,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 2 }, population: 2 }, c2: { id: "c2", ownerId: "p2", position: { q: 2, r: 2 }, population: 2 } },
      units: { a: { id: "a", type: "warrior", ownerId: "p1", position: { q: 0, r: 0 } }, d: { id: "d", type: "warrior", ownerId: "p2", position: { q: 1, r: 0 } } }
    }
  });
  if (opts.perks) s.playersById.p1.perks = opts.perks;
  return s;
}

test("Slice 1: baseline duel has no branch/card combat modifier", () => {
  const mods = computeCombatPreview(duel({}), "a", "d").modifiers.join(" | ");
  assert.ok(!/Cards|Hammer/.test(mods), "no phantom bonus with nothing equipped");
});

test("Slice 1: an equipped card's flat +attack% reaches the combat calc", () => {
  const mods = computeCombatPreview(duel({ perks: { atkPct: 25 } }), "a", "d").modifiers;
  assert.ok(mods.some((m) => /Cards/.test(m) && /25%/.test(m)), `expected a Cards +25% modifier, got ${mods.join(", ")}`);
});

test("Slice 1: a branch tech's flat +attack% (hammer-and-anvil) reaches the combat calc", () => {
  const mods = computeCombatPreview(duel({ techs: ["hammer-and-anvil"] }), "a", "d").modifiers;
  assert.ok(mods.some((m) => /10%/.test(m)), `expected a +10% branch modifier, got ${mods.join(", ")}`);
});

test("Slice 2: a card's unit-cost % reduces the build cost", () => {
  const s = duel({});
  const before = effectiveItemCost(s, "p1", "warrior");
  s.playersById.p1.perks = { unitCostPct: -50 };
  assert.ok(effectiveItemCost(s, "p1", "warrior") < before, "cheaper units with a -50% cost card");
});

test("Slice 2: a card's research-cost % reduces the tech cost", () => {
  const s = duel({});
  const before = scaledResearchCost(s, "iron-working", "p1");
  s.playersById.p1.perks = { researchCostPct: -30 };
  assert.ok(scaledResearchCost(s, "iron-working", "p1") < before, "cheaper research with a -30% card");
});

test("Slice 3: a farm yield-special makes each worked farm worth more (helot-agriculture)", () => {
  const f = (techs: string[], farm: boolean) => computeCityYield(city({ techs, farm }), "c1").food;
  const delta = (f(["helot-agriculture"], true) - f(["helot-agriculture"], false)) - (f([], true) - f([], false));
  assert.ok(delta >= 1, `farm worth +${delta} more food with the tech`);
});

test("Slice 3: tech capitalYield lands only on the capital (ekklesia)", () => {
  const sci = (techs: string[], capital: boolean) => computeCityYield(city({ techs, capital }), "c1").science;
  const delta = (sci(["ekklesia"], true) - sci(["ekklesia"], false)) - (sci([], true) - sci([], false));
  assert.ok(delta >= 1, `capital gets +${delta} science from capitalYield`);
});

test("Slice 3: buildingBoost raises the boosted building's yield (forum-romanum)", () => {
  const g = (techs: string[], forum: boolean) => computeCityYield(city({ techs, building: forum ? "forum" : undefined }), "c1").gold;
  const delta = (g(["forum-romanum"], true) - g(["forum-romanum"], false)) - (g([], true) - g([], false));
  assert.ok(delta >= 1, `forum worth +${delta} more gold with forum-romanum`);
});

test("Slice 4: a card healPlus adds exactly that much to the heal amount", () => {
  const s0 = duel({}); s0.map.units.a.hp = 8;
  const before = restHealAmount(s0, s0.map.units.a);
  const s1 = duel({}); s1.map.units.a.hp = 8; s1.playersById.p1.perks = { healPlus: 4 };
  assert.equal(restHealAmount(s1, s1.map.units.a) - before, 4);
});

test("Slice 4: a branch tech healPlus (hippocratic-medicine) speeds healing", () => {
  const s0 = duel({}); s0.map.units.a.hp = 8;
  const before = restHealAmount(s0, s0.map.units.a);
  const s1 = duel({ techs: ["hippocratic-medicine"] }); s1.map.units.a.hp = 8;
  assert.ok(restHealAmount(s1, s1.map.units.a) > before, "field surgeons mend faster");
});

test("Slice 4: a card movePlus grants extra movement once the turn resets", () => {
  let s = duel({});
  s.playersById.p1.perks = { movePlus: 2 };
  s = applyAction(s, { type: "END_TURN", playerId: "p1" }); // -> p2
  s = applyAction(s, { type: "END_TURN", playerId: "p2" }); // -> back to p1, units reset
  assert.equal(s.map.units.a.movementRemaining, 2 + 2, "warrior 2 base +2 move card");
});
