// Engine hardening (Direction §3.1.4): every applyResolve* re-validates its context
// at resolution time and no-ops gracefully when the world has moved on between a
// decision arriving and being answered — a stale relay, a captured city, a spent
// treasury, a condition that flipped. One test per edge case.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import type { GameState, GameAction, Player, Raid } from "../src/engine/types";

// A small map: coastal city at (1,1) (a sea tile beside it), a rival p2, gold.
function baseState(gold = 200): GameState {
  const tiles: Record<string, { terrain: "plains" | "sea"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  tiles["2,1"] = { terrain: "sea", region: "core" };
  return createInitialGameState({
    seed: "reval",
    players: [{ id: "p1", civ: "Rome", gold }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 3, hp: 24, maxHp: 24, isCapital: true } }
    }
  });
}
const getP = (s: GameState, id: string): Player => s.players.find((p) => p.id === id)!;
const worldTurn = (s: GameState): GameState => {
  let ns = applyAction(s, { type: "END_TURN", playerId: s.players[s.currentPlayerIndex].id } as GameAction);
  return applyAction(ns, { type: "END_TURN", playerId: ns.players[ns.currentPlayerIndex].id } as GameAction);
};

test("RESOLVE_RAID for a raid that no longer exists no-ops and clears the warning", () => {
  const s = baseState();
  getP(s, "p1").pendingRaid = "ghost"; // it already struck / was bought off
  const ns = applyAction(s, { type: "RESOLVE_RAID", playerId: "p1", raidId: "ghost", choice: "tribute" } as GameAction);
  assert.equal(getP(ns, "p1").pendingRaid, undefined, "the stale warning is cleared, no crash");
  assert.equal(getP(ns, "p1").gold, 200, "no tribute charged for a phantom raid");
});

test("a raid whose target city was captured before it strikes resolves against the new owner", () => {
  const s = baseState();
  const raid: Raid = { id: "raid_x", targetCityId: "c1", warnTurn: s.turn, strikeTurn: s.turn + 1, strength: 80, era: 1 };
  s.raids = [raid];
  // The city changes hands before the blow lands (de-indexed properly).
  s.map.cities["c1"]!.ownerId = "p2";
  getP(s, "p1").cityIds = [];
  getP(s, "p2").cityIds = ["c1"];
  const ns = worldTurn(s); // must not throw; the raid resolves against whoever holds the city now
  assert.equal((ns.raids ?? []).length, 0, "the raid is spent, not stuck");
  const rep = (ns.raidReports ?? []).find((r) => r.cityId === "c1");
  assert.ok(rep, "an outcome was recorded");
  assert.equal(rep!.playerId, "p2", "…against the current owner");
});

test("a tribute the player can no longer afford is refused gracefully — the raid still comes", () => {
  const s = baseState(5); // far too little for the tribute on a strength-60 raid
  const raid: Raid = { id: "raid_y", targetCityId: "c1", warnTurn: s.turn, strikeTurn: s.turn + 1, strength: 60, era: 1 };
  s.raids = [raid];
  getP(s, "p1").pendingRaid = "raid_y";
  const ns = applyAction(s, { type: "RESOLVE_RAID", playerId: "p1", raidId: "raid_y", choice: "tribute" } as GameAction);
  assert.equal(getP(ns, "p1").gold, 5, "no coin left the empty purse");
  assert.equal((ns.raids ?? []).length, 1, "the raid still stands");
  assert.equal(getP(ns, "p1").pendingRaid, undefined, "the lapsed offer is cleared");
});

test("a figure resolved after its arrival condition has lapsed still grants the boon", () => {
  const s = baseState();
  // Hippocrates needs age ≥ 2 to ARRIVE — but once he has, answering him must not
  // re-gate on a condition that may have changed. p1 is age 1 here.
  getP(s, "p1").pendingFigure = "hippocrates";
  getP(s, "p1").metFigures = ["hippocrates"];
  const ns = applyAction(s, { type: "RESOLVE_FIGURE", playerId: "p1", figureId: "hippocrates", optionIndex: 1 } as GameAction);
  assert.equal(getP(ns, "p1").pendingFigure, undefined, "the visit concludes");
  assert.ok((getP(ns, "p1").perks?.food ?? 0) >= 1, "the sanitation boon applied regardless of current age");
});
