import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, computeCityStability, getVictoryStatus } from "../src/engine";
import {
  pairKey, relationBand, getRelation, getPair, giftRelationGain,
  applyRelationDrift, PEACE_WARM_CAP, ensurePair,
  isAtWar, isOathbreaker, enterWar, playerWarWeariness, WAR_DECLARE_RELATION, OATHBREAKER_VICTIM_HIT,
  hasAgreement, canProposeAgreement, aiAcceptsProposal,
  canDemandVassalage, establishVassalage, isVassal, personalityOf
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

// ---- D2: war & Oathbreaker ------------------------------------------------

function combatState(): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  return createInitialGameState({
    seed: "war",
    players: [{ id: "p1", civ: "Rome", gold: 100 }, { id: "p2", civ: "Carthage", gold: 100 }, { id: "p3", civ: "Egypt", gold: 100 }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      units: {
        a: { id: "a", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 }, movementRemaining: 1 },
        d: { id: "d", type: "warrior", ownerId: "p2", position: { q: 2, r: 1 } }
      },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } }
    }
  });
}

test("DECLARE_WAR opens a war and cools the pair (no brand without a pact)", () => {
  const s = applyAction(combatState(), { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" });
  assert.ok(isAtWar(s, "p1", "p2"));
  assert.equal(getRelation(s, "p1", "p2"), WAR_DECLARE_RELATION);
  assert.equal(isOathbreaker(s, "p1"), false, "plain declaration is not oathbreaking");
});

test("DECLARE_WAR rejects self and repeat declarations", () => {
  const s = combatState();
  assert.throws(() => applyAction(s, { type: "DECLARE_WAR", playerId: "p1", targetId: "p1" }), /yourself/);
  const s2 = applyAction(s, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" });
  assert.throws(() => applyAction(s2, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" }), /already at war/);
});

test("the first attack auto-opens a war (surprise) via the engine", () => {
  const s = applyAction(combatState(), { type: "ATTACK", playerId: "p1", attackerId: "a", defenderId: "d" });
  assert.ok(isAtWar(s, "p1", "p2"), "attacking a peaceful neighbour starts the war");
  assert.equal(isOathbreaker(s, "p1"), false, "no pact broken → no brand");
});

test("a NAP blocks a formal declaration; surprise-attacking it brands you", () => {
  const s0 = combatState();
  // A standing NAP between p1 and p2 (D3 creates these through proposals).
  ensurePair(s0, "p1", "p2").agreements.push({ type: "nap", expires: s0.turn + 30 });
  // Formal declaration is forbidden while the pact holds.
  assert.throws(() => applyAction(s0, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" }), /non-aggression pact/);
  // Surprise-attacking anyway breaks the pact and brands you with the world.
  const s = applyAction(s0, { type: "ATTACK", playerId: "p1", attackerId: "a", defenderId: "d" });
  assert.ok(isOathbreaker(s, "p1"), "broke the NAP → branded");
  // victim: −30 (war) then −40 (brand)
  assert.equal(getRelation(s, "p1", "p2"), WAR_DECLARE_RELATION + OATHBREAKER_VICTIM_HIT);
  assert.equal(getRelation(s, "p1", "p3"), -15, "everyone else sours by −15");
});

test("an Oathbreaker brand and war weariness both dock city stability", () => {
  const s0 = combatState();
  ensurePair(s0, "p1", "p2").agreements.push({ type: "nap", expires: s0.turn + 30 });
  const before = computeCityStability(s0, "c1");
  const s = applyAction(s0, { type: "ATTACK", playerId: "p1", attackerId: "a", defenderId: "d" });
  assert.ok(isOathbreaker(s, "p1"));
  assert.equal(computeCityStability(s, "c1"), before - 1, "brand costs 1 stability");
  // Age the war 30 turns → 2 weariness steps.
  getPair(s, "p1", "p2")!.warSince = s.turn - 30;
  assert.equal(playerWarWeariness(s, "p1"), 2);
});

test("relations cool while at war instead of warming", () => {
  const s = enterWarState();
  const before = getRelation(s, "p1", "p2");
  applyRelationDrift(s);
  assert.ok(getRelation(s, "p1", "p2") < before, "war cools the pair");
});

function enterWarState(): GameState {
  const s = makeState(2);
  enterWar(s, "p1", "p2");
  return s;
}

// ---- D3: agreements, tribute, denounce ------------------------------------

test("propose → accept forms a Trade Pact that pays both sides each turn", () => {
  let s = makeState(2);
  s = applyAction(s, { type: "PROPOSE_AGREEMENT", playerId: "p1", targetId: "p2", agreementType: "trade-pact" });
  assert.deepEqual(s.playersById["p2"].pendingProposal, { from: "p1", kind: "trade-pact" });
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });          // hand the turn to p2
  s = applyAction(s, { type: "RESOLVE_PROPOSAL", playerId: "p2", accept: true });
  assert.ok(hasAgreement(s, "p1", "p2", "trade-pact"));
  const g1 = s.playersById["p1"].gold, g2 = s.playersById["p2"].gold;
  s = applyAction(s, { type: "END_TURN", playerId: "p2" });          // p2 banks +1, turn → 2
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });          // p1 banks +1
  assert.equal(s.playersById["p2"].gold, g2 + 1, "p2 earned trade-pact gold");
  assert.equal(s.playersById["p1"].gold, g1 + 1, "p1 earned trade-pact gold");
});

test("a NAP needs Cordial relations; a cold pair cannot propose one", () => {
  const s = makeState(2);
  assert.notEqual(canProposeAgreement(s, "p1", "p2", "nap"), true, "neutral is too cold for a NAP");
  ensurePair(s, "p1", "p2").relation = 20; // cordial
  assert.equal(canProposeAgreement(s, "p1", "p2", "nap"), true);
});

test("declining an offer clears it and cools relations a touch", () => {
  let s = makeState(2);
  s = applyAction(s, { type: "PROPOSE_AGREEMENT", playerId: "p1", targetId: "p2", agreementType: "trade-pact" });
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "RESOLVE_PROPOSAL", playerId: "p2", accept: false });
  assert.equal(s.playersById["p2"].pendingProposal, undefined);
  assert.ok(!hasAgreement(s, "p1", "p2", "trade-pact"));
  assert.ok(getRelation(s, "p1", "p2") < 0, "a snub sours relations");
});

test("tribute buys peace and flows gold from payer to receiver each turn", () => {
  let s = enterWarState(); // p1 & p2 at war
  s.playersById["p1"].gold = 100;
  s.playersById["p2"].gold = 0;
  // p1 (weaker, losing) offers p2 tribute to end the war.
  s = applyAction(s, { type: "OFFER_TRIBUTE", playerId: "p1", targetId: "p2", amount: 8, turns: 12 });
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });                 // hand the turn to p2
  s = applyAction(s, { type: "RESOLVE_PROPOSAL", playerId: "p2", accept: true });
  assert.ok(!isAtWar(s, "p1", "p2"), "tribute bought peace");
  assert.ok(hasAgreement(s, "p1", "p2", "nap"), "and a guaranteed-peace NAP");
  const before1 = s.playersById["p1"].gold, before2 = s.playersById["p2"].gold;
  s = applyAction(s, { type: "END_TURN", playerId: "p2" });                 // turn → next; p2 (receiver) pays nothing
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });                 // payer transfers on their turn
  assert.equal(s.playersById["p1"].gold, before1 - 8);
  assert.equal(s.playersById["p2"].gold, before2 + 8);
});

test("denounce then wait out the cooldown lets you declare war without a brand", () => {
  const s0 = makeState(2);
  ensurePair(s0, "p1", "p2").agreements.push({ type: "nap", expires: s0.turn + 30 });
  let s = applyAction(s0, { type: "DENOUNCE", playerId: "p1", targetId: "p2" });
  assert.ok(getRelation(s, "p1", "p2") < 0, "a public denouncement sours relations");
  // Still blocked immediately after denouncing.
  assert.throws(() => applyAction(s, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" }), /non-aggression pact/);
  // Fast-forward past the 5-turn cooldown; now the declaration is clean.
  s.turn += 6;
  const after = applyAction(s, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" });
  assert.ok(isAtWar(after, "p1", "p2"));
  assert.equal(isOathbreaker(after, "p1"), false, "renounced pact → no brand");
});

test("expired agreements are cleaned up at the turn boundary", () => {
  let s = makeState(2);
  ensurePair(s, "p1", "p2").agreements.push({ type: "nap", expires: 2 });
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "END_TURN", playerId: "p2" }); // turn → 2, expiry runs
  assert.ok(!hasAgreement(s, "p1", "p2", "nap"), "the NAP lapsed");
});

test("aiAcceptsProposal: takes a trade pact when peaceful, refuses an oathbreaker", () => {
  const s = makeState(2);
  assert.equal(aiAcceptsProposal(s, "p2", "p1", "trade-pact"), true);
  s.playersById["p1"].oathbreakerUntil = s.turn + 5;
  assert.equal(aiAcceptsProposal(s, "p2", "p1", "trade-pact"), false, "nobody signs with an oathbreaker");
});

// ---- E1: alliances + defensive auto-join ----------------------------------

test("the alliance ladder gates on band and 'held N turns' prereqs", () => {
  const s = makeState(2);
  const p = ensurePair(s, "p1", "p2");
  assert.notEqual(canProposeAgreement(s, "p1", "p2", "passage"), true, "passage needs Cordial");
  p.relation = 60; // friendly
  assert.equal(canProposeAgreement(s, "p1", "p2", "passage"), true);
  assert.notEqual(canProposeAgreement(s, "p1", "p2", "defensive-alliance"), true, "def-alliance needs a held NAP");
  p.agreements.push({ type: "nap", expires: s.turn + 30, since: s.turn - 15 });
  assert.equal(canProposeAgreement(s, "p1", "p2", "defensive-alliance"), true);
  assert.notEqual(canProposeAgreement(s, "p1", "p2", "full-alliance"), true, "full needs a held def-alliance");
  p.agreements.push({ type: "defensive-alliance", expires: 0, since: s.turn - 15 });
  assert.equal(canProposeAgreement(s, "p1", "p2", "full-alliance"), true);
});

test("a defensive ally auto-joins the war against an aggressor", () => {
  const s = makeState(3);
  ensurePair(s, "p1", "p2").agreements.push({ type: "defensive-alliance", expires: 0, since: s.turn });
  enterWar(s, "p3", "p2"); // p3 attacks p2 (p1's ally)
  assert.ok(isAtWar(s, "p3", "p2"));
  assert.ok(isAtWar(s, "p1", "p3"), "the ally joined the defensive war");
  assert.ok(!isAtWar(s, "p1", "p2"), "allies are not turned against each other");
});

test("auto-join fires only for the DEFENDER, not the aggressor's side", () => {
  const s = makeState(3);
  ensurePair(s, "p1", "p2").agreements.push({ type: "defensive-alliance", expires: 0, since: s.turn });
  enterWar(s, "p2", "p3"); // p2 (allied to p1) is the aggressor
  assert.ok(isAtWar(s, "p2", "p3"));
  assert.ok(!isAtWar(s, "p1", "p3"), "you are not dragged into your ally's own aggression");
});

test("honouring an alliance never brands you, even against a NAP partner", () => {
  const s = makeState(3);
  ensurePair(s, "p1", "p2").agreements.push({ type: "defensive-alliance", expires: 0, since: s.turn });
  ensurePair(s, "p1", "p3").agreements.push({ type: "nap", expires: s.turn + 30, since: s.turn });
  enterWar(s, "p3", "p2"); // p3 attacks p1's ally → p1 auto-joins vs p3
  assert.ok(isAtWar(s, "p1", "p3"));
  assert.equal(isOathbreaker(s, "p1"), false, "an ally honouring its pact is not an oathbreaker");
});

// ---- E2: vassalage --------------------------------------------------------

function powerState(): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 5; r += 1) for (let q = 0; q < 5; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const units: Record<string, { id: string; type: "warrior"; ownerId: string; position: { q: number; r: number } }> = {};
  for (let i = 0; i < 4; i += 1) units["u" + i] = { id: "u" + i, type: "warrior", ownerId: "p1", position: { q: i, r: 0 } };
  units["w"] = { id: "w", type: "warrior", ownerId: "p2", position: { q: 0, r: 2 } };
  return createInitialGameState({
    seed: "vass",
    players: [{ id: "p1", civ: "Rome", gold: 50 }, { id: "p2", civ: "Carthage", gold: 50 }, { id: "p3", civ: "Egypt", gold: 50 }],
    map: {
      width: 5, height: 5, regions: ["core"], tiles, units,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 4, r: 4 }, population: 2, isCapital: true, hp: 24, maxHp: 24 },
        c2: { id: "c2", ownerId: "p2", position: { q: 0, r: 4 }, population: 8, isCapital: true, hp: 24, maxHp: 24 }
      }
    }
  });
}

test("DEMAND vassalage needs a 2:1 military edge", () => {
  const s = powerState(); // p1 strength 6, p2 strength 3
  assert.equal(canDemandVassalage(s, "p1", "p2"), true);
  assert.notEqual(canDemandVassalage(s, "p2", "p1"), true, "the weak cannot demand submission of the strong");
});

test("accepting a demand makes a vassal whose capital counts for domination", () => {
  let s = powerState();
  s = applyAction(s, { type: "PROPOSE_VASSALAGE", playerId: "p1", targetId: "p2", vassalId: "p2" });
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "RESOLVE_PROPOSAL", playerId: "p2", accept: true });
  assert.ok(isVassal(s, "p2"));
  assert.equal(s.playersById["p2"].vassalOf, "p1");
  assert.equal(getVictoryStatus(s).winnerId, "p1", "a hegemon wins through its vassal's capital");
});

test("a vassal remits a quarter of its gold income to the overlord", () => {
  let s = powerState();
  establishVassalage(s, "p1", "p2");
  s = applyAction(s, { type: "END_TURN", playerId: "p1" });   // p1 takes its own income
  const p1mid = s.playersById["p1"].gold;
  s = applyAction(s, { type: "END_TURN", playerId: "p2" });   // p2 remits its share
  assert.ok(s.playersById["p1"].gold > p1mid, "the overlord received the vassal's remittance");
});

test("a vassal joins its overlord's defensive war", () => {
  const s = powerState();
  establishVassalage(s, "p1", "p2");
  enterWar(s, "p3", "p1");                                     // p3 attacks the overlord
  assert.ok(isAtWar(s, "p2", "p3"), "the vassal defends its overlord");
});

test("a vassal revolts when the overlord's army halves", () => {
  const s = powerState();
  establishVassalage(s, "p1", "p2");                           // baseline p1 strength = 6
  for (const id of Object.keys(s.map.units)) if (s.map.units[id].ownerId === "p1") delete s.map.units[id];
  s.playersById["p1"].unitIds = [];                            // p1 strength now 2 ( <= 3 )
  let cur = s;
  const start = cur.turn;
  for (let g = 0; cur.turn === start && g < 8; g += 1) cur = applyAction(cur, { type: "END_TURN", playerId: cur.players[cur.currentPlayerIndex].id });
  assert.equal(isVassal(cur, "p2"), false, "the vassal threw off the yoke");
  assert.ok(isAtWar(cur, "p1", "p2"), "a war of secession");
});

test("a vassal cannot make its own alliances", () => {
  const s = powerState();
  establishVassalage(s, "p1", "p2");
  ensurePair(s, "p2", "p3").relation = 60;
  assert.notEqual(canProposeAgreement(s, "p2", "p3", "defensive-alliance"), true, "a vassal follows its overlord's policy");
});

test("an overlord can release its vassal", () => {
  let s = powerState();
  establishVassalage(s, "p1", "p2");
  s = applyAction(s, { type: "RELEASE_VASSAL", playerId: "p1", targetId: "p2" });
  assert.equal(isVassal(s, "p2"), false);
});

// ---- E3: alliance victory -------------------------------------------------

function twoCapitalState(): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 3; r += 1) for (let q = 0; q < 3; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  return createInitialGameState({
    seed: "ally-win",
    players: [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Athens" }],
    map: {
      width: 3, height: 3, regions: ["core"], tiles,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, isCapital: true, hp: 24, maxHp: 24 },
        c2: { id: "c2", ownerId: "p2", position: { q: 2, r: 2 }, population: 2, isCapital: true, hp: 24, maxHp: 24 }
      }
    }
  });
}

test("two long-standing Full Allies win jointly (alliance victory)", () => {
  const s = twoCapitalState();
  ensurePair(s, "p1", "p2").agreements.push({ type: "full-alliance", expires: 0, since: s.turn - 30 });
  const v = getVictoryStatus(s);
  assert.equal(v.type, "alliance");
  assert.deepEqual((v.allies ?? []).slice().sort(), ["p1", "p2"]);
  assert.ok(v.winnerId === "p1" || v.winnerId === "p2");
});

test("a young Full Alliance does not win, and the setup toggle disables it", () => {
  const s = twoCapitalState();
  ensurePair(s, "p1", "p2").agreements.push({ type: "full-alliance", expires: 0, since: s.turn - 5 });
  assert.equal(getVictoryStatus(s).type, null, "5 turns is too young to win jointly");
  ensurePair(s, "p1", "p2").agreements[0].since = s.turn - 30; // now old enough...
  s.allianceVictory = false;                                    // ...but switched off
  assert.equal(getVictoryStatus(s).type, null, "alliance victory disabled at setup");
});

// ---- E4: civ personalities ------------------------------------------------

test("personalityOf maps civs to their §5 levers (default otherwise)", () => {
  assert.equal(personalityOf("carthage").eagerTrade, true);
  assert.equal(personalityOf("sparta").rejectsPassage, true);
  assert.equal(personalityOf("rome").demandsVassals, true);
  assert.equal(personalityOf("greece").seeksAlliances, true);
  assert.equal(personalityOf("atlantis").eagerTrade, false);
});

test("a mercantile civ trades even Wary; an isolationist won't at Neutral", () => {
  const s = makeState(2);
  s.playersById["p1"].civ = "carthage";
  s.playersById["p2"].civ = "sparta";
  ensurePair(s, "p1", "p2").relation = -20; // wary
  assert.equal(aiAcceptsProposal(s, "p1", "p2", "trade-pact"), true, "Carthage trades while Wary");
  ensurePair(s, "p1", "p2").relation = 0;   // neutral
  assert.equal(aiAcceptsProposal(s, "p2", "p1", "trade-pact"), false, "Sparta needs Cordial to trade");
});

test("an isolationist never grants Passage Rights", () => {
  const s = makeState(2);
  s.playersById["p1"].civ = "sparta";
  ensurePair(s, "p1", "p2").relation = 60;  // friendly — would normally pass
  assert.equal(aiAcceptsProposal(s, "p1", "p2", "passage"), false);
});

test("a submitter yields at a smaller military gap than a proud civ", () => {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let q = 0; q < 6; q += 1) { tiles[`${q},0`] = { terrain: "plains", region: "core" }; tiles[`${q},1`] = { terrain: "plains", region: "core" }; }
  const s = createInitialGameState({
    seed: "sub",
    players: [{ id: "p1", civ: "rome" }, { id: "p2", civ: "egypt" }],
    map: {
      width: 6, height: 2, regions: ["core"], tiles,
      units: {
        a: { id: "a", type: "warrior", ownerId: "p1", position: { q: 0, r: 0 } },
        b: { id: "b", type: "warrior", ownerId: "p1", position: { q: 1, r: 0 } },
        c: { id: "c", type: "warrior", ownerId: "p1", position: { q: 2, r: 0 } },
        d: { id: "d", type: "warrior", ownerId: "p2", position: { q: 0, r: 1 } },
        e: { id: "e", type: "warrior", ownerId: "p2", position: { q: 1, r: 1 } }
      }
    }
  }); // p1 strength 3, p2 strength 2 → a 1.5:1 edge
  assert.equal(aiAcceptsProposal(s, "p2", "p1", "vassalage", 0, "p2"), true, "Egypt submits at 1.5:1");
  s.playersById["p2"].civ = "rome";
  assert.equal(aiAcceptsProposal(s, "p2", "p1", "vassalage", 0, "p2"), false, "a proud civ holds out for 2:1");
});
