import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, computeCombatPreview, movementCost } from "../src/engine/index";
import type { CreateGameConfig, GameState, Coord, Tile } from "../src/engine/types";

type Units = NonNullable<NonNullable<CreateGameConfig["map"]>["units"]>;
type Cities = NonNullable<NonNullable<CreateGameConfig["map"]>["cities"]>;

// A 8×8 plains board, with per-tile terrain overrides, that seats the given units
// and cities. p1 (Rome) opens; p2 (Carthage) is the foil.
function makeState(opts: {
  units?: Units;
  cities?: Cities;
  terrain?: Record<string, Tile["terrain"]>;
  techs?: string[];
} = {}): GameState {
  const tiles: Record<string, Tile> = {};
  for (let r = 0; r < 8; r += 1) {
    for (let q = 0; q < 8; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" } as Tile;
  }
  for (const [k, terrain] of Object.entries(opts.terrain ?? {})) {
    tiles[k] = { ...(tiles[k] as Tile), terrain };
  }
  return createInitialGameState({
    seed: "hist-test",
    players: [
      { id: "p1", civ: "Rome", production: 200, gold: 200, techs: opts.techs ?? [] },
      { id: "p2", civ: "Carthage", production: 0, gold: 200 }
    ],
    map: { width: 8, height: 8, regions: ["core"], tiles, units: opts.units ?? {}, cities: opts.cities ?? {} }
  });
}

function play(state: GameState, instant: string, extra: Record<string, unknown> = {}): GameState {
  return applyAction(state, { type: "PLAY_EVENT_CARD", playerId: "p1", cardId: "test-card", instant, ...extra } as never);
}
function endRound(state: GameState): GameState {
  // Two end-turns in a 2-player linear game = one world-turn (fires the History-Deck tick).
  let s = applyAction(state, { type: "END_TURN", playerId: "p1" });
  s = applyAction(s, { type: "END_TURN", playerId: "p2" });
  return s;
}
const ctx = (domain: "land" | "naval") => ({ ownerId: "p1", domain, mounted: false });

// ---------- Marius' Mules — infantry +1 movement ----------
test("Marius' Mules grants +1 movement to infantry for its duration", () => {
  let s = makeState({ units: { w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } } } });
  const base = s.map.units.w.movementRemaining;
  s = play(s, "infantry+1move-3-turns");
  assert.ok((s.activeEffects ?? []).some((e) => e.kind === "forced-march"), "forced-march effect is registered");
  s = endRound(s);
  assert.equal(s.map.units.w.movementRemaining, base + 1, "the warrior marches one tile further");
});

// ---------- Hannibal Crosses the Alps — cross mountains + attrition ----------
test("Hannibal lets a unit cross impassable mountains, then bleeds it", () => {
  const from: Coord = { q: 2, r: 2 };
  const mtn: Coord = { q: 3, r: 2 };
  let s = makeState({
    units: { army: { id: "army", type: "warrior", ownerId: "p1", position: from } },
    terrain: { "3,2": "mountains" }
  });
  assert.equal(movementCost(s, ctx("land"), from, mtn), Number.POSITIVE_INFINITY, "mountains are impassable without the card");
  s = play(s, "cross-mountains-attrition");
  assert.ok(Number.isFinite(movementCost(s, ctx("land"), from, mtn)), "the Alps become crossable");

  // A unit that ends its turn on the mountains loses men.
  let s2 = makeState({ units: { army: { id: "army", type: "warrior", ownerId: "p1", position: mtn } }, terrain: { "3,2": "mountains" } });
  const hp0 = s2.map.units.army.hp;
  s2 = play(s2, "cross-mountains-attrition");
  s2 = endRound(s2);
  assert.ok(s2.map.units.army.hp < hp0, `crossing the range cost men (${hp0} → ${s2.map.units.army.hp})`);
});

// ---------- Thermopylae's Stand — bulwark: huge defence, no flanking ----------
test("Thermopylae makes the held unit tougher and immune to flanking", () => {
  const setup = () => makeState({
    units: {
      def: { id: "def", type: "spearman", ownerId: "p1", position: { q: 4, r: 4 } },
      atk: { id: "atk", type: "warrior", ownerId: "p2", position: { q: 4, r: 3 } },
      flank: { id: "flank", type: "warrior", ownerId: "p2", position: { q: 5, r: 3 } }
    }
  });
  const before = computeCombatPreview(setup(), "atk", "def");
  const s = play(setup(), "pass-defense-immunity-2-turns", { unitId: "def" });
  const after = computeCombatPreview(s, "atk", "def");
  assert.ok(after.damageToDefender < before.damageToDefender, `bulwark absorbs the blow (${before.damageToDefender} → ${after.damageToDefender})`);
  assert.ok(after.modifiers.some((m) => /bulwark/i.test(m)), "the bulwark modifier is shown");
});

// ---------- Fabian Strategy — the defender gives ground; half the blow lands ----------
test("Fabian Strategy halves the damage an attacker lands on the withdrawing side", () => {
  const setup = () => makeState({
    units: {
      def: { id: "def", type: "warrior", ownerId: "p1", position: { q: 4, r: 4 } },
      atk: { id: "atk", type: "warrior", ownerId: "p2", position: { q: 4, r: 3 } }
    }
  });
  const before = computeCombatPreview(setup(), "atk", "def");
  const s = play(setup(), "withdraw-before-combat-3-turns");
  const after = computeCombatPreview(s, "atk", "def");
  assert.ok(after.damageToDefender < before.damageToDefender, `withdrawal blunts the attack (${before.damageToDefender} → ${after.damageToDefender})`);
  assert.ok(after.modifiers.some((m) => /fabian/i.test(m)), "the Fabian modifier is shown");
});

// ---------- Caesar's Bridge — span a great river, then it lapses ----------
test("Caesar's Bridge makes a great river crossable, then is pruned", () => {
  const from: Coord = { q: 2, r: 2 };
  const river: Coord = { q: 3, r: 2 };
  let s = makeState({
    units: { army: { id: "army", type: "warrior", ownerId: "p1", position: from } },
    terrain: { "3,2": "great-river" },
    techs: ["sailing"]
  });
  assert.equal(movementCost(s, ctx("land"), from, river), Number.POSITIVE_INFINITY, "land can't cross an open great river here");
  s = play(s, "bridge-adjacent-river-2-turns");
  assert.equal(s.map.tiles["3,2"].improvement, "bridge", "a bridge is placed on the river tile");
  assert.equal(movementCost(s, ctx("land"), from, river), 1, "land units cross the bridge freely");
  // Advance past its lifetime — the bridge is torn down.
  for (let i = 0; i < 4; i += 1) s = endRound(s);
  assert.notEqual(s.map.tiles["3,2"].improvement, "bridge", "the temporary bridge is gone once it lapses");
});

// ---------- Xerxes' Pontoon — bridge a one-hex sea strait ----------
test("Xerxes' Pontoon bridges a one-hex sea strait", () => {
  // Land at 2,2 — water at 3,2 — land again at 4,2: a genuine strait.
  const from: Coord = { q: 2, r: 2 };
  const strait: Coord = { q: 3, r: 2 };
  let s = makeState({
    units: { army: { id: "army", type: "warrior", ownerId: "p1", position: from } },
    terrain: { "3,2": "coast" }
  });
  s = play(s, "bridge-sea-strait-2-turns");
  assert.equal(s.map.tiles["3,2"].improvement, "bridge", "a pontoon spans the strait");
  assert.equal(movementCost(s, ctx("land"), from, strait), 1, "the army marches across dry-shod");
});

// ---------- Cincinnatus — an emergency levy that goes home ----------
test("Cincinnatus musters a levy at the capital that disbands after the crisis", () => {
  let s = makeState({ cities: { rome: { id: "rome", ownerId: "p1", position: { q: 2, r: 2 }, population: 8, isCapital: true } } });
  const before = Object.keys(s.map.units).length;
  s = play(s, "spawn-militia-capital-level");
  const levy = Object.values(s.map.units).find((u) => u.ownerId === "p1" && u.type === "warrior");
  assert.ok(levy, "a warrior levy is raised");
  assert.ok(Object.keys(s.map.units).length > before, "the roster grew by the levy");
  const vet = levy!.veterancy; // population 8 → veteran
  assert.equal(vet, "veteran", "a level-8 capital raises a veteran levy");
  // March it forward through its whole lifetime — it disbands.
  for (let i = 0; i < 5; i += 1) s = endRound(s);
  assert.ok(!s.map.units[levy!.id], "the levy has gone home");
});

// ---------- March of the Ten Thousand — a stranded army retreats home ----------
test("March of the Ten Thousand brings a stranded army home to the nearest city", () => {
  let s = makeState({
    cities: { rome: { id: "rome", ownerId: "p1", position: { q: 1, r: 1 }, population: 5, isCapital: true } },
    units: { lost: { id: "lost", type: "warrior", ownerId: "p1", position: { q: 7, r: 7 } } }
  });
  const startDist = Math.max(Math.abs(7 - 1), Math.abs(7 - 1)); // far away
  s = play(s, "retreat-army-to-nearest-city", { unitId: "lost" });
  const p = s.map.units.lost.position;
  const near = Math.abs(p.q - 1) <= 6 && Math.abs(p.r - 1) <= 6;
  assert.ok(near && (Math.abs(p.q - 1) + Math.abs(p.r - 1)) < startDist * 2, `the army is now beside Rome (at ${p.q},${p.r})`);
});

// ---------- Ver Sacrum — a free settler far from home ----------
test("Ver Sacrum sends out a settler at least four hexes from every city", () => {
  let s = makeState({ cities: { rome: { id: "rome", ownerId: "p1", position: { q: 1, r: 1 }, population: 6, isCapital: true } } });
  s = play(s, "free-settler-4hex");
  const settler = Object.values(s.map.units).find((u) => u.ownerId === "p1" && u.type === "settler");
  assert.ok(settler, "a settler is founded");
  const d = Math.abs(settler!.position.q - 1) + Math.abs(settler!.position.r - 1);
  assert.ok(d >= 4, `the colony sets out far from Rome (distance-ish ${d})`);
});

// ---------- Sacred Geese — the watch is roused; ground is revealed ----------
test("Sacred Geese reveals the ground around your forces", () => {
  let s = makeState({ units: { scout: { id: "scout", type: "warrior", ownerId: "p1", position: { q: 4, r: 4 } } } });
  const before = new Set((s.discovered?.["p1"]) ?? []);
  s = play(s, "cancel-ambush-reveal-adjacent");
  const after = new Set((s.discovered?.["p1"]) ?? []);
  assert.ok(after.size > before.size, "new tiles are now known");
  assert.ok(after.has("4,4") && after.has("5,4"), "the unit's own tile and its neighbours are revealed");
});

// ---------- Circumvallation — siege lines strangle a city ----------
test("Circumvallation stops a city healing and bleeds it", () => {
  const build = () => makeState({
    cities: { carth: { id: "carth", ownerId: "p2", position: { q: 4, r: 4 }, population: 6, hp: 60, maxHp: 100 } },
    units: { sieger: { id: "sieger", type: "warrior", ownerId: "p1", position: { q: 4, r: 3 } } }
  });
  // Control: no siege — the city repairs over a world-turn.
  const control = endRound(build());
  const healed = control.map.cities.carth.hp;
  assert.ok(healed > 60, "an unbesieged city repairs its walls");
  // Under siege lines: no repair, and it bleeds.
  let s = play(build(), "siege-lines", { cityId: "carth" });
  assert.ok((s.activeEffects ?? []).some((e) => e.kind === "siege-lines" && e.cityId === "carth"), "siege lines are drawn");
  s = endRound(s);
  assert.ok(s.map.cities.carth.hp < healed, "the invested city does not recover");
  assert.ok(s.map.cities.carth.hp <= 60, "and it loses ground each turn");
});

// ---------- Evocatio — the city's defence collapses ----------
test("Evocatio makes an enemy city easier to storm", () => {
  const build = () => makeState({
    cities: { carth: { id: "carth", ownerId: "p2", position: { q: 4, r: 4 }, population: 6, hp: 100, maxHp: 100 } },
    units: { ram: { id: "ram", type: "warrior", ownerId: "p1", position: { q: 4, r: 3 } } }
  });
  const plain = applyAction(build(), { type: "ATTACK_CITY", playerId: "p1", attackerId: "ram", cityId: "carth" } as never);
  const withEvo0 = play(build(), "besieged-city-loyalty-defense-down", { cityId: "carth" });
  const withEvo = applyAction(withEvo0, { type: "ATTACK_CITY", playerId: "p1", attackerId: "ram", cityId: "carth" } as never);
  assert.ok(withEvo.map.cities.carth.hp < plain.map.cities.carth.hp, `evocatio deepens the wound (${plain.map.cities.carth.hp} vs ${withEvo.map.cities.carth.hp})`);
});

// ---------- Scorched Earth — burn the province; the invader starves ----------
test("Scorched Earth pillages your own province and bleeds enemies who linger", () => {
  let s = makeState({
    cities: { rome: { id: "rome", ownerId: "p1", position: { q: 2, r: 2 }, population: 6, isCapital: true } },
    units: {
      farmer: { id: "farmer", type: "warrior", ownerId: "p1", position: { q: 3, r: 2 } },
      invader: { id: "invader", type: "warrior", ownerId: "p2", position: { q: 3, r: 3 } }
    }
  });
  // Put an improvement on a claimed tile so we can watch it burn.
  s.map.tiles["3,2"] = { ...(s.map.tiles["3,2"]), improvement: "farm" } as Tile;
  s = applyAction(s, { type: "DECLARE_WAR", playerId: "p1", targetId: "p2" } as never);
  const invaderHp0 = s.map.units.invader.hp;
  s = play(s, "self-pillage-region-attrition");
  assert.ok((s.activeEffects ?? []).some((e) => e.kind === "scorched-earth"), "the province is set to burn");
  assert.notEqual(s.map.tiles["3,2"].improvement, "farm", "your own improvement is torched");
  s = endRound(s);
  assert.ok(s.map.units.invader.hp < invaderHp0, `the invader starves in the ash (${invaderHp0} → ${s.map.units.invader.hp})`);
});

// ---------- Guardrails ----------
test("a card that cannot legally apply throws and changes nothing", () => {
  const s = makeState({ units: { w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } } } });
  const snapshot = JSON.stringify(s);
  assert.throws(() => play(s, "siege-lines"), /beside an enemy city/i, "no enemy city to invest → clear error");
  assert.equal(JSON.stringify(s), snapshot, "the reducer never mutates its input on a throw");
});

test("playing a card is deterministic (same inputs → identical effects)", () => {
  const a = play(makeState({ units: { w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } } } }), "infantry+1move-3-turns");
  const b = play(makeState({ units: { w: { id: "w", type: "warrior", ownerId: "p1", position: { q: 1, r: 1 } } } }), "infantry+1move-3-turns");
  assert.deepEqual(a.activeEffects, b.activeEffects, "identical plays yield identical effect records");
});
