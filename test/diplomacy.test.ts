import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import {
  pairKey, relationBand, getRelation, getPair, giftRelationGain,
  applyRelationDrift, PEACE_WARM_CAP, ensurePair
} from "../src/engine/diplomacy";
import type { GameState } from "../src/engine/types";

function makeState(playerCount = 3): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const players = [];
  for (let i = 1; i <= playerCount; i += 1) players.push({ id: `p${i}`, civ: `Civ${i}`, gold: 200 });
  return createInitialGameState({ seed: "diplo", players, map: { width: 4, height: 4, regions: ["core"], tiles } });
}

test("pairKey is order-independent", () => {
  assert.equal(pairKey("rome", "egypt"), pairKey("egypt", "rome"));
  assert.equal(pairKey("a", "b"), "a|b");
});

test("relationBand maps each threshold to the right band", () => {
  assert.equal(relationBand(-50), "hostile");
  assert.equal(relationBand(-49), "wary");
  assert.equal(relationBand(-10), "wary");
  assert.equal(relationBand(-9), "neutral");
  assert.equal(relationBand(0), "neutral");
  assert.equal(relationBand(9), "neutral");
  assert.equal(relationBand(10), "cordial");
  assert.equal(relationBand(49), "cordial");
  assert.equal(relationBand(50), "friendly");
});

test("a new game seeds every civ-pair at Neutral (0)", () => {
  const s = makeState(3);
  // 3 players → 3 unordered pairs, all at 0.
  assert.equal(Object.keys(s.diplomacy ?? {}).length, 3);
  assert.equal(getRelation(s, "p1", "p2"), 0);
  assert.equal(getRelation(s, "p2", "p3"), 0);
  // A civ is fully friendly with itself; an unknown civ reads Neutral.
  assert.equal(getRelation(s, "p1", "p1"), 100);
  assert.equal(getRelation(s, "p1", "ghost"), 0);
});

test("GIFT_GOLD transfers the coin and warms the pair (+1 per 25g)", () => {
  const s0 = makeState(2);
  const s = applyAction(s0, { type: "GIFT_GOLD", playerId: "p1", targetId: "p2", amount: 100 });
  assert.equal(s.playersById["p1"].gold, 100, "giver paid 100");
  assert.equal(s.playersById["p2"].gold, 300, "receiver got 100");
  assert.equal(getRelation(s, "p1", "p2"), 4, "100g → +4 at neutral");
});

test("a token gift (<25g) still transfers gold but does not move relations", () => {
  const s = applyAction(makeState(2), { type: "GIFT_GOLD", playerId: "p1", targetId: "p2", amount: 20 });
  assert.equal(s.playersById["p2"].gold, 220);
  assert.equal(getRelation(s, "p1", "p2"), 0);
});

test("gifts you cannot afford or to yourself are rejected", () => {
  const s = makeState(2);
  assert.throws(() => applyAction(s, { type: "GIFT_GOLD", playerId: "p1", targetId: "p2", amount: 9999 }), /Not enough gold/);
  assert.throws(() => applyAction(s, { type: "GIFT_GOLD", playerId: "p1", targetId: "p1", amount: 25 }), /gift yourself/);
});

test("gift warmth diminishes as relations improve", () => {
  assert.equal(giftRelationGain(100, 0), 4);
  assert.ok(giftRelationGain(100, 80) < giftRelationGain(100, 0), "a friend is harder to warm than a rival");
  assert.equal(giftRelationGain(100, 80), 1);
});

test("long peace warms relations ~0.5 per game turn", () => {
  let s = makeState(2);
  const before = getRelation(s, "p1", "p2");
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "END_TURN", playerId: "p2" }); // completes turn 1 → 2
  assert.equal(s.turn, 2);
  assert.ok(Math.abs(getRelation(s, "p1", "p2") - (before + 0.5)) < 1e-9, "warmed by 0.5");
});

test("passive warming stops at the Cordial cap and never lowers a high relation", () => {
  const s = makeState(2);
  const p = ensurePair(s, "p1", "p2");
  p.relation = PEACE_WARM_CAP - 0.3;   // just under the cap
  applyRelationDrift(s);
  assert.equal(getPair(s, "p1", "p2")!.relation, PEACE_WARM_CAP, "clamped to the cap");
  p.relation = 70;                     // already Friendly (above the cap)
  applyRelationDrift(s);
  assert.equal(getPair(s, "p1", "p2")!.relation, 70, "drift never pulls a high relation down");
});

test("gifting is deterministic", () => {
  const a = applyAction(makeState(2), { type: "GIFT_GOLD", playerId: "p1", targetId: "p2", amount: 75 });
  const b = applyAction(makeState(2), { type: "GIFT_GOLD", playerId: "p1", targetId: "p2", amount: 75 });
  assert.equal(getRelation(a, "p1", "p2"), getRelation(b, "p1", "p2"));
});
