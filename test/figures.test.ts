// The Minds of the Age (figures.ts): historical figures who arrive because of how
// you play, each offering a branching boon. These prove the boons apply, that
// Archimedes' mirrors answer the corsairs, that Pytheas extends how far you can sail,
// and that a figure appears over a campaign but never twice.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, LOST_AT_SEA_DIST } from "../src/engine";
import type { GameState, GameAction, Player, Raid } from "../src/engine/types";

// A coastal city at (1,1) with a bay beside it; optional extra cities, a unit, gold.
function figState(opts: { gold?: number; cities?: number; withUnit?: boolean } = {}): GameState {
  const tiles: Record<string, { terrain: "plains" | "sea"; region: string }> = {};
  for (let r = 0; r < 6; r += 1) for (let q = 0; q < 6; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  tiles["2,1"] = { terrain: "sea", region: "core" };

  const cities: Record<string, { id: string; ownerId: string; position: { q: number; r: number }; population: number; hp: number; maxHp: number; isCapital?: boolean }> = {
    c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 3, hp: 24, maxHp: 24, isCapital: true }
  };
  for (let i = 1; i < (opts.cities ?? 1); i += 1) cities["c" + (i + 1)] = { id: "c" + (i + 1), ownerId: "p1", position: { q: 1 + i, r: 3 }, population: 2, hp: 24, maxHp: 24 };

  const units: Record<string, { id: string; type: string; ownerId: string; position: { q: number; r: number } }> = {};
  if (opts.withUnit) units["u"] = { id: "u", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } };

  return createInitialGameState({
    seed: "figures",
    players: [{ id: "p1", civ: "Rome", gold: opts.gold ?? 100 }, { id: "p2", civ: "Carthage" }],
    map: { width: 6, height: 6, regions: ["core"], tiles, units, cities }
  });
}

const getP = (s: GameState, id: string): Player => s.players.find((p) => p.id === id)!;

// Hand the player a specific pending figure, then resolve the chosen option.
function meet(s: GameState, figureId: string, optionIndex: number): GameState {
  const p = getP(s, "p1");
  p.pendingFigure = figureId;
  p.metFigures = [figureId];
  return applyAction(s, { type: "RESOLVE_FIGURE", playerId: "p1", figureId, optionIndex } as GameAction);
}

test("Archimedes' Burning Mirrors destroy a raid bearing down on you", () => {
  const s = figState();
  const raid: Raid = { id: "raid_x", targetCityId: "c1", warnTurn: s.turn, strikeTurn: s.turn + 1, strength: 40, era: 1 };
  s.raids = [raid];
  getP(s, "p1").pendingRaid = "raid_x";
  const ns = meet(s, "archimedes", 0);
  assert.equal((ns.raids ?? []).length, 0, "the fleet is burned on the water");
  assert.equal(getP(ns, "p1").pendingRaid, undefined, "no warning left to answer");
  assert.equal((ns.raidReports ?? []).find((r) => r.cityId === "c1")?.kind, "burned");
  assert.equal(getP(ns, "p1").perks?.defPct, 8, "and the coast is warded");
});

test("Archimedes' War Engines bank production and sharpen the army", () => {
  const s = figState();
  const capProdBefore = s.map.cities["c1"]!.production ?? 0;
  const ns = meet(s, "archimedes", 1);
  assert.equal((ns.map.cities["c1"]!.production ?? 0), capProdBefore + 22);
  assert.equal(getP(ns, "p1").perks?.atkPct, 6);
});

test("Pytheas extends how far your ships may sail before the deep claims them", () => {
  const s = figState();
  const ns = meet(s, "pytheas", 0);
  assert.equal(getP(ns, "p1").perks?.seaReach, 2, "the boon is banked as extra reach");
  assert.ok(getP(ns, "p1").science >= 24, "and brings fresh knowledge");
});

test("seaReach actually keeps a ship afloat one ring farther out", () => {
  // Find a belt tile exactly at the lost-at-sea distance and park a trireme there.
  const probe = createInitialGameState({ seed: "reach", players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }],
    map: { width: 4, height: 4, regions: ["core"], tiles: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`${i % 4},${Math.floor(i / 4)}`, { terrain: "plains", region: "core" }])),
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 24, maxHp: 24 } } } });
  const key = Object.keys(probe.map.tiles).find((k) => probe.map.tiles[k]!.open === LOST_AT_SEA_DIST)!;
  const [q, r] = key.split(",").map(Number);

  const build = (reach: number): GameState => createInitialGameState({
    seed: "reach", players: [{ id: "p1", civ: "Rome", perks: reach ? { seaReach: reach } : undefined }, { id: "p2", civ: "Carthage" }],
    map: { width: 4, height: 4, regions: ["core"], tiles: Object.fromEntries(Array.from({ length: 16 }, (_, i) => [`${i % 4},${Math.floor(i / 4)}`, { terrain: "plains", region: "core" }])),
      units: { s: { id: "s", type: "trireme", ownerId: "p1", position: { q: q!, r: r! } } },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 24, maxHp: 24 } } } });

  const lost = applyAction(build(0), { type: "END_TURN", playerId: "p1" } as GameAction);
  assert.equal(lost.map.units["s"], undefined, "without the boon, the deep takes it");
  const kept = applyAction(build(1), { type: "END_TURN", playerId: "p1" } as GameAction);
  assert.ok(kept.map.units["s"], "with Pytheas's reach, it sails on");
});

test("Xenophon drills the whole army a veterancy step; Hippocrates heals it", () => {
  const s = figState({ withUnit: true });
  s.map.units["u"]!.hp = 5; // wounded
  const drilled = meet(s, "xenophon", 0);
  assert.equal(drilled.map.units["u"]!.veterancy, "veteran", "raw recruits become veterans");
  const healed = meet(s, "hippocrates", 0);
  assert.equal(healed.map.units["u"]!.hp, healed.map.units["u"]!.maxHp, "the wounded are made whole");
});

test("a figure resolves cleanly and cannot be resolved twice", () => {
  const s = figState({ gold: 50 });
  const ns = meet(s, "solon", 1); // Cancel the Debts: food + production
  assert.equal(getP(ns, "p1").pendingFigure, undefined, "the visit concludes");
  assert.throws(() => applyAction(ns, { type: "RESOLVE_FIGURE", playerId: "p1", figureId: "solon", optionIndex: 0 } as GameAction),
    /No pending figure/, "the figure has already been answered");
});

test("figures materialise over a campaign, each at most once", () => {
  let s = figState({ cities: 3 }); // three cities → Solon is eligible from the start
  let met: string[] = [];
  for (let i = 0; i < 100 && met.length === 0; i += 1) {
    s = applyAction(s, { type: "END_TURN", playerId: s.players[s.currentPlayerIndex].id } as GameAction);
    s = applyAction(s, { type: "END_TURN", playerId: s.players[s.currentPlayerIndex].id } as GameAction);
    met = getP(s, "p1").metFigures ?? [];
    // Answer any Crossroads dilemma so it doesn't hold the one-card-at-a-time slot
    // (the human/AI would in a real game).
    const ev = getP(s, "p1").pendingEvent;
    if (ev) s = applyAction(s, { type: "RESOLVE_EVENT", playerId: "p1", eventId: ev, optionIndex: 0 } as GameAction);
  }
  assert.ok(met.length > 0, "a figure called at least once");
  assert.equal(met.length, new Set(met).size, "and none appeared twice");
});
