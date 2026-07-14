import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import { getRelation } from "../src/engine/diplomacy";
import { scatterVillages, PEOPLE_BY_ID, rollReaction, villageReactionChance, leaderReactionBonus, befriendCostFor, EXPLORER_ENVOY_BONUS, BEFRIEND_COST_ENVOY } from "../src/engine/peoples";
import type { GameState } from "../src/engine/types";
import type { Disposition, VillageDeed } from "../src/engine/peoples";

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
function villageState(peopleId: string, disposition: Disposition, unitType = "warrior", seed = "vil", befriendedBy?: string): GameState {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 4; r += 1) for (let q = 0; q < 4; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  const s = createInitialGameState({
    seed,
    players: [{ id: "p1", civ: "Rome", gold: 100, science: 0 }, { id: "p2", civ: "Carthage" }],
    map: {
      width: 4, height: 4, regions: ["core"], tiles,
      units: { u: { id: "u", type: unitType, ownerId: "p1", position: { q: 1, r: 1 } } },
      cities: { c1: { id: "c1", ownerId: "p1", position: { q: 0, r: 0 }, population: 2, hp: 24, maxHp: 24 } }
    }
  });
  s.map.villages = { "1,1": befriendedBy ? { peopleId, disposition, befriendedBy } : { peopleId, disposition } };
  return s;
}

// The overtures are seeded rolls now (§10.3). Find a seed that deterministically
// comples/refuses so we can exercise BOTH branches — using the real roll (no
// formula duplication), so it self-adjusts if the constants change.
function seedFor(peopleId: string, disp: Disposition, deed: VillageDeed, want: boolean, attempt = 1, bonus = 0): string {
  for (let i = 0; i < 500; i += 1) {
    const seed = "seed" + i;
    if (rollReaction(PEOPLE_BY_ID[peopleId], disp, deed, bonus, seed, "1,1", attempt).comply === want) return seed;
  }
  throw new Error(`no seed makes ${deed} comply=${want}`);
}

test("reaction odds: a friendlier mood and a gentler deed comply more often", () => {
  const latins = PEOPLE_BY_ID["latins"];
  assert.ok(villageReactionChance(latins, "open", "befriend", 0) > villageReactionChance(latins, "wary", "befriend", 0));
  assert.ok(villageReactionChance(latins, "wary", "befriend", 0) > villageReactionChance(latins, "hostile", "befriend", 0));
  assert.ok(villageReactionChance(latins, "open", "befriend", 0) > villageReactionChance(latins, "open", "tribute", 0), "a demand offends more than a gift");
  assert.ok(villageReactionChance(latins, "open", "befriend", 5) <= 0.95, "clamped — never a sure thing");
  assert.ok(villageReactionChance(latins, "hostile", "befriend", -5) >= 0.05, "clamped — never hopeless");
});

test("befriending (comply) pays gold and grants the full benefit", () => {
  const seed = seedFor("latins", "open", "befriend", true);
  const s = applyAction(villageState("latins", "open", "warrior", seed), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.ok(s.lastReaction!.comply, "the seed complies");
  assert.equal(s.playersById["p1"].gold, 70, "paid the 30 courtship cost");
  assert.equal(s.playersById["p1"].science, 10, "Latins: +science");
  assert.equal(s.map.cities["c1"].population, 4, "Latins: +2 pop to the nearest city");
  assert.equal(s.map.villages!["1,1"].befriendedBy, "p1");
  assert.equal(s.map.villages!["1,1"].disposition, "open");
});

test("befriending (threaten) spends nothing and sours them", () => {
  const seed = seedFor("latins", "open", "befriend", false);
  const s = applyAction(villageState("latins", "open", "warrior", seed), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.ok(!s.lastReaction!.comply, "the seed refuses");
  assert.equal(s.playersById["p1"].gold, 100, "no gold spent on a refusal");
  assert.equal(s.map.villages!["1,1"].befriendedBy, undefined, "not befriended");
  assert.equal(s.map.villages!["1,1"].disposition, "wary", "open → wary");
});

test("a recruit-benefit village hands you a levy when befriended", () => {
  const seed = seedFor("samnites", "open", "befriend", true);
  const s = applyAction(villageState("samnites", "open", "warrior", seed), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.equal(Object.values(s.map.units).filter((u) => u.ownerId === "p1" && u.type === "swordsman").length, 1);
});

test("befriending needs a unit near, gold, and a non-hostile village", () => {
  assert.throws(() => applyAction(villageState("latins", "hostile"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" }), /hostile/);
  const poor = villageState("latins", "open"); poor.playersById["p1"].gold = 5;
  assert.throws(() => applyAction(poor, { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" }), /Not enough gold/);
});

test("demanding tribute (comply) pays now but sours them", () => {
  const seed = seedFor("lydians", "open", "tribute", true);
  const s = applyAction(villageState("lydians", "open", "warrior", seed), { type: "DEMAND_TRIBUTE_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.ok(s.lastReaction!.comply, "the seed complies");
  assert.equal(s.playersById["p1"].gold, 115, "gained the tribute");
  assert.equal(s.map.villages!["1,1"].disposition, "wary", "they cool a step");
});

test("a refused overture that curdles to hostile lets them raid the offender", () => {
  // Start Wary so a single refusal drops straight to Hostile and triggers the raid.
  const seed = seedFor("belgae", "wary", "befriend", false);
  const s = applyAction(villageState("belgae", "wary", "warrior", seed), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.ok(!s.lastReaction!.comply);
  assert.equal(s.map.villages!["1,1"].disposition, "hostile", "wary → hostile");
  assert.ok(s.playersById["p1"].gold < 100, "they raided the treasury");
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

test("assimilating a befriended village: join founds a town, migrate swells a city", () => {
  const seed = seedFor("latins", "open", "assimilate", true);
  const joined = applyAction(villageState("latins", "open", "warrior", seed, "p1"), { type: "ABSORB_VILLAGE", playerId: "p1", hex: "1,1", mode: "join" });
  assert.ok(joined.lastReaction!.comply, "the seed complies");
  assert.ok(Object.values(joined.map.cities).some((c) => c.position.q === 1 && c.position.r === 1), "join → town");
  assert.equal(joined.map.villages!["1,1"], undefined);

  const base = villageState("latins", "open", "warrior", seed, "p1");
  const popBefore = base.map.cities["c1"].population;
  const migrated = applyAction(base, { type: "ABSORB_VILLAGE", playerId: "p1", hex: "1,1", mode: "migrate" });
  assert.equal(migrated.map.cities["c1"].population, popBefore + 2, "migrate → +2 pop");
});

test("assimilating requires having befriended them first", () => {
  assert.throws(() => applyAction(villageState("latins", "open"), { type: "ABSORB_VILLAGE", playerId: "p1", hex: "1,1", mode: "join" }), /Befriend them/);
});

test("a general's role and rarity shift the reaction odds", () => {
  const statesman = { role: "statesman", rarity: "legendary" };
  const commander = { role: "commander", rarity: "legendary" };
  assert.ok(leaderReactionBonus(statesman, "befriend") > leaderReactionBonus(commander, "befriend"), "a diplomat is better at befriending");
  assert.ok(leaderReactionBonus(commander, "tribute") > leaderReactionBonus(statesman, "tribute"), "a warlord is better at coercion");
  assert.ok(leaderReactionBonus({ role: "statesman", rarity: "legendary" }, "befriend") > leaderReactionBonus({ role: "statesman", rarity: "rare" }, "befriend"), "rarer general = stronger sway");
  assert.equal(leaderReactionBonus(undefined, "befriend"), 0, "no general → no bonus");
});

test("an Explorer envoy courts for less gold and can court the openly hostile", () => {
  assert.equal(befriendCostFor(villageState("latins", "open", "explorer"), "p1", "1,1"), BEFRIEND_COST_ENVOY, "envoy discount");
  assert.equal(befriendCostFor(villageState("latins", "open", "warrior"), "p1", "1,1"), 30, "no discount without an envoy");
  // A non-Explorer is refused at a hostile village...
  assert.throws(() => applyAction(villageState("latins", "hostile", "warrior"), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" }), /hostile/);
  // ...but an Explorer may court them (it still rolls — use a comply seed with the envoy bonus).
  const seed = seedFor("latins", "hostile", "befriend", true, 1, EXPLORER_ENVOY_BONUS);
  const s = applyAction(villageState("latins", "hostile", "explorer", seed), { type: "BEFRIEND_VILLAGE", playerId: "p1", hex: "1,1" });
  assert.ok(s.lastReaction!.comply, "the envoy wins them over");
  assert.equal(s.map.villages!["1,1"].befriendedBy, "p1");
  assert.equal(s.playersById["p1"].gold, 90, "spent only the 10g envoy cost");
});

test("an Explorer envoy makes first contact with a nearby civ (goodwill)", () => {
  const s0 = villageState("latins", "open", "explorer");
  s0.map.units["e2"] = { id: "e2", type: "warrior", ownerId: "p2", position: { q: 2, r: 2 }, hp: 20, maxHp: 20, movementRemaining: 1, veterancy: "recruit" };
  const rel0 = getRelation(s0, "p1", "p2");
  const s = applyAction(s0, { type: "END_TURN", playerId: "p1" });
  assert.ok((s.contact?.["p1"] ?? []).includes("p2"), "the envoy met p2 within 2 tiles");
  assert.ok(getRelation(s, "p1", "p2") > rel0, "first contact opens on a warm note");
});

test("an Explorer ending beside a wary village warms it a step (§10.3)", () => {
  const s0 = villageState("thracians", "wary", "explorer");
  const s = applyAction(s0, { type: "END_TURN", playerId: "p1" });
  assert.equal(s.map.villages!["1,1"].disposition, "open", "first contact by an Explorer");
  assert.ok(s.map.villages!["1,1"].contacted);
});
