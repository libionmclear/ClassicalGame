import test from "node:test";
import assert from "node:assert/strict";
import { computeCombatPreview, createInitialGameState, effectiveItemCost, scaledResearchCost } from "../src/engine/index";
import type { GameState, Player } from "../src/engine/types";

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
