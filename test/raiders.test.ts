// Off-grid corsairs (raiders.md): raiders gather beyond the map's edge and fall on
// a coastal city — warned a turn ahead, then struck. Defence decides the outcome;
// gold can buy the fleet off. These prove the resolution, the tribute, and that
// raids actually materialise over a coastal campaign.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, raidTributeCost, RAID_START_TURN } from "../src/engine";
import type { GameState, GameAction, Raid, Player } from "../src/engine/types";

// A small map whose city at (1,1) has a genuine sea tile beside it (so it counts as
// coastal), optionally garrisoned, optionally with a friendly trireme in port.
function coastState(opts: { gold?: number; garrison?: boolean; trireme?: boolean } = {}): GameState {
  const tiles: Record<string, { terrain: "plains" | "sea"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  tiles["2,1"] = { terrain: "sea", region: "core" }; // a bay lapping the city at (1,1)

  const units: Record<string, { id: string; type: string; ownerId: string; position: { q: number; r: number } }> = {};
  if (opts.garrison) units["g"] = { id: "g", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } };
  if (opts.trireme) units["t"] = { id: "t", type: "trireme", ownerId: "p1", position: { q: 2, r: 1 } };

  return createInitialGameState({
    seed: "raiders",
    players: [{ id: "p1", civ: "Rome", gold: opts.gold ?? 100 }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles, units,
      cities: { c1: { id: "c1", name: "Ostia", ownerId: "p1", position: { q: 1, r: 1 }, population: 3, hp: 24, maxHp: 24 } }
    }
  });
}

const getPlayer = (s: GameState, id: string): Player => s.players.find((p) => p.id === id)!;

// Advance one full world-turn (both seats end their turn); the raid tick runs on the
// transition. Any raid injected onto `s` before this rides through the deep clone.
function worldTurn(s: GameState): GameState {
  let ns = applyAction(s, { type: "END_TURN", playerId: s.players[s.currentPlayerIndex].id } as GameAction);
  ns = applyAction(ns, { type: "END_TURN", playerId: ns.players[ns.currentPlayerIndex].id } as GameAction);
  return ns;
}

function injectRaid(s: GameState, strength: number): GameState {
  const raid: Raid = { id: "raid_test", targetCityId: "c1", warnTurn: s.turn, strikeTurn: s.turn + 1, strength, era: 1 };
  s.raids = [raid];
  return s;
}

test("a defended coastal city repels a weak raid, unharmed", () => {
  const s = injectRaid(coastState({ garrison: true }), 15);
  const ns = worldTurn(s);
  const report = (ns.raidReports ?? []).find((r) => r.cityId === "c1");
  assert.equal(report?.kind, "repelled");
  assert.ok(!report?.goldLost, "no coin was carried off");
  assert.equal(ns.map.cities["c1"]!.hp, 24, "the walls are untouched");
  assert.equal((ns.raids ?? []).length, 0, "the raid is spent");
});

test("an overwhelming raid pillages the city — coin lost and walls breached", () => {
  const s = injectRaid(coastState({ gold: 200 }), 90);
  const before = getPlayer(s, "p1").gold;
  const ns = worldTurn(s);
  const report = (ns.raidReports ?? []).find((r) => r.cityId === "c1");
  assert.equal(report?.kind, "pillaged");
  assert.ok((report?.goldLost ?? 0) > 0, "gold was pillaged");
  assert.ok(ns.map.cities["c1"]!.hp < 24, "the walls took damage");
  assert.ok(ns.map.cities["c1"]!.hp >= 1, "but the city survives the sack");
  // Gold fell by the pillage (net of the turn's income), never below zero.
  assert.ok(getPlayer(ns, "p1").gold < before + 50, "the treasury was raided");
});

test("a warship in port sinks the raiders for plunder", () => {
  const s = injectRaid(coastState({ trireme: true, garrison: true }), 15);
  const ns = worldTurn(s);
  const report = (ns.raidReports ?? []).find((r) => r.cityId === "c1");
  assert.equal(report?.kind, "sunk");
  assert.ok((report?.goldGained ?? 0) > 0, "salvage and ransom fill the coffers");
});

test("tribute buys off a raid outright", () => {
  const s = injectRaid(coastState({ gold: 300 }), 40);
  getPlayer(s, "p1").pendingRaid = "raid_test";
  const cost = raidTributeCost(s.raids![0]!);
  const before = getPlayer(s, "p1").gold;
  const ns = applyAction(s, { type: "RESOLVE_RAID", playerId: "p1", raidId: "raid_test", choice: "tribute" } as GameAction);
  assert.equal(getPlayer(ns, "p1").gold, before - cost, "the tribute was paid");
  assert.equal((ns.raids ?? []).length, 0, "the fleet turns away");
  assert.equal(getPlayer(ns, "p1").pendingRaid, undefined, "the warning is cleared");
  assert.equal((ns.raidReports ?? []).find((r) => r.cityId === "c1")?.kind, "bought-off");
});

test("a player who cannot afford the tribute must brace — the raid stands", () => {
  const s = injectRaid(coastState({ gold: 5 }), 60); // cost far exceeds the purse
  getPlayer(s, "p1").pendingRaid = "raid_test";
  const ns = applyAction(s, { type: "RESOLVE_RAID", playerId: "p1", raidId: "raid_test", choice: "tribute" } as GameAction);
  assert.equal(getPlayer(ns, "p1").gold, 5, "no coin left the treasury");
  assert.equal((ns.raids ?? []).length, 1, "the raid is still coming");
  assert.equal(getPlayer(ns, "p1").pendingRaid, undefined, "but the offer has lapsed");
});

test("a raid whose city has vanished simply finds nothing", () => {
  const s = injectRaid(coastState({ garrison: true }), 30);
  delete s.map.cities["c1"]; // the city fell to some other cause before the blow lands
  getPlayer(s, "p1").cityIds = []; // …and was de-indexed from its owner
  const ns = worldTurn(s);
  assert.equal((ns.raids ?? []).length, 0, "the raid dissolves");
  assert.ok(!getPlayer(ns, "p1").pendingRaid, "no dangling warning");
});

test("raids genuinely materialise over a coastal campaign, and never before they should", () => {
  let s = coastState({ garrison: true });
  let sawWarning = false;
  let earliestStrike = Infinity;
  for (let i = 0; i < 120 && !sawWarning; i += 1) {
    s = worldTurn(s);
    for (const rep of s.raids ?? []) {
      sawWarning = true;
      earliestStrike = Math.min(earliestStrike, rep.warnTurn);
    }
  }
  assert.ok(sawWarning, "corsairs appeared at least once");
  assert.ok(earliestStrike >= RAID_START_TURN, "and never before the raids-begin turn");
});
