// HEGEMON — peoples.ts (Brief §10.3): Minor Peoples — the living villages. Real
// historical peoples who never expand or found empires but DO act. You may
// Befriend (rich, keeps their knowledge), Demand tribute (quick gold, sours
// them), Conquer (fast, but archives burn — knowledge benefits lost), or Ignore.
// Data + placement + a benefit applier; index.ts owns the action handlers.
import type { GameState } from "./types";
import { hash01 } from "./mapgen";
import { neighborsOf, parseKey } from "./hex";
import { UNITS } from "./data";

export type Disposition = "open" | "wary" | "hostile";
export const DISPOSITIONS: Disposition[] = ["hostile", "wary", "open"];

export interface VillageBenefit {
  pop?: number;          // +population at the nearest own city (intermarriage/migration)
  science?: number;
  gold?: number;
  goldPerTurn?: number;  // a lasting trade good (perk gold)
  recruit?: string;      // spawn this unit type beside the village
  walls?: boolean;       // free Walls at the nearest own city
  knowledge?: boolean;   // LOST if the village is taken by force (§10.3)
}

export interface MinorPeople {
  id: string;
  name: string;
  text: string;          // the "meet" line
  terrain: string;       // placement hint
  hostile?: boolean;     // Wary/Hostile-leaning at spawn
  benefit: VillageBenefit;
}

// A geographically + mechanically varied cut of the brief's §10.3 pool.
export const MINOR_PEOPLES: MinorPeople[] = [
  { id: "latins", name: "Latins", text: "Kin-cities of Alba Longa, bound by league, festival, and shared blood.", terrain: "plains", benefit: { pop: 2, science: 10 } },
  { id: "samnites", name: "Samnites", text: "A warrior confederation of the mountains; their Linen Legion swears death before retreat.", terrain: "hills", hostile: true, benefit: { recruit: "swordsman" } },
  { id: "etruscans", name: "Etruscans", text: "The Rasenna: engineers, augurs, lords of twelve cities who taught Rome to build.", terrain: "hills", benefit: { science: 35, knowledge: true } },
  { id: "veneti", name: "Veneti", text: "Horse-breeders at the amber road's end, open-handed to traders.", terrain: "plains", benefit: { recruit: "horseman", gold: 15 } },
  { id: "lydians", name: "Lydians", text: "Inventors of struck coin, wealthy beyond proverb.", terrain: "hills", benefit: { gold: 50, science: 15, knowledge: true } },
  { id: "thracians", name: "Thracians", text: "Wild horsemen and peltasts who drink from golden rhyta.", terrain: "highlands", benefit: { recruit: "archer" } },
  { id: "getae", name: "Getae (Dacians)", text: "A mountain kingdom rich in gold, whose men believe they do not die.", terrain: "mountains", benefit: { goldPerTurn: 2 } },
  { id: "illyrians", name: "Illyrians", text: "Coast-dwellers in swift light ships — half traders, half pirates.", terrain: "coast", hostile: true, benefit: { recruit: "trireme" } },
  { id: "armenians", name: "Armenians", text: "Highlanders among fortress crags, heirs of Urartu's citadels.", terrain: "mountains", benefit: { walls: true, knowledge: true } },
  { id: "numidians", name: "Numidians", text: "Riders without bridle or bit — the finest light horse alive.", terrain: "desert", benefit: { recruit: "horseman" } },
  { id: "nabataeans", name: "Nabataeans", text: "Caravan-masters of a rose-red city, wizards of hidden water.", terrain: "desert", benefit: { science: 20, goldPerTurn: 1, knowledge: true } },
  { id: "judeans", name: "Judeans", text: "A hill people bound by covenant to one God alone.", terrain: "hills", benefit: { science: 25, knowledge: true } },
  { id: "chaldeans", name: "Chaldeans", text: "Star-readers of Babylon who mapped the heavens onto clay.", terrain: "desert", benefit: { science: 40, knowledge: true } },
  { id: "belgae", name: "Belgae", text: "'Of all the Gauls, the bravest' — so wrote the man who conquered them.", terrain: "forest", hostile: true, benefit: { recruit: "swordsman" } }
];

export const PEOPLE_BY_ID: Record<string, MinorPeople> = {};
for (const p of MINOR_PEOPLES) PEOPLE_BY_ID[p.id] = p;

export const BEFRIEND_COST = 30;
export const TRIBUTE_GAIN = 15;
export const CONQUEST_REPUTATION_HIT = -8;

// Seeded initial disposition; hostile-leaning peoples skew colder.
export function villageDisposition(people: MinorPeople, seed: string, key: string): Disposition {
  const r = hash01(seed + ":disp:" + key);
  if (people.hostile) return r < 0.5 ? "hostile" : r < 0.85 ? "wary" : "open";
  return r < 0.2 ? "hostile" : r < 0.5 ? "wary" : "open";
}

// Place villages on suitable land tiles, avoiding cities and ruin tiles.
export function scatterVillages(
  map: { tiles: Record<string, { terrain: string }>; cities: Record<string, { position: { q: number; r: number } }> },
  seed: string,
  avoid: Set<string>
): Record<string, { peopleId: string; disposition: Disposition }> {
  const out: Record<string, { peopleId: string; disposition: Disposition }> = {};
  const land = Object.keys(map.tiles).filter((k) => { const t = map.tiles[k].terrain; return t && t !== "sea" && t !== "coast"; });
  if (!land.length) return out;
  const used = new Set<string>([...avoid, ...Object.values(map.cities).map((c) => `${c.position.q},${c.position.r}`)]);
  const n = Math.max(4, Math.min(20, Math.round(land.length / 30)));
  const pool = [...MINOR_PEOPLES].sort((a, b) => hash01(seed + ":vord:" + a.id) - hash01(seed + ":vord:" + b.id));
  let placed = 0;
  for (const people of pool) {
    if (placed >= n) break;
    const includeCoast = people.terrain === "coast";
    const scope = includeCoast ? Object.keys(map.tiles).filter((k) => map.tiles[k].terrain === "coast") : land;
    const fit = scope.filter((k) => !used.has(k) && (people.terrain === "any" || map.tiles[k].terrain === people.terrain));
    const list = fit.length ? fit : land.filter((k) => !used.has(k));
    if (!list.length) continue;
    const key = list.sort((a, b) => hash01(seed + ":vpos:" + people.id + ":" + a) - hash01(seed + ":vpos:" + people.id + ":" + b))[0];
    out[key] = { peopleId: people.id, disposition: villageDisposition(people, seed, key) };
    used.add(key);
    placed += 1;
  }
  return out;
}

// Is any of the player's units on or adjacent to this hex? (militaryOnly → attack > 0)
export function unitNear(state: GameState, playerId: string, key: string, militaryOnly = false): boolean {
  const at = parseKey(key);
  const ring = new Set([key, ...neighborsOf(at).map((n) => `${n.q},${n.r}`)]);
  for (const uid of state.playersById[playerId]?.unitIds ?? []) {
    const u = state.map.units[uid];
    if (!u) continue;
    if (militaryOnly && (UNITS[u.type]?.attack ?? 0) <= 0) continue;
    if (ring.has(`${u.position.q},${u.position.r}`)) return true;
  }
  return false;
}

// Apply a village benefit. byForce (conquest) forfeits knowledge benefits.
export function applyVillageBenefit(state: GameState, playerId: string, benefit: VillageBenefit, at: { q: number; r: number }, byForce: boolean): void {
  const player = state.playersById[playerId];
  if (!player) return;
  // Knowledge is the science component — it burns when a village is taken by
  // force (archives burn, elders flee); material gains still come to the victor.
  if (benefit.science && !byForce) player.science += benefit.science;
  if (benefit.gold) player.gold += benefit.gold;
  if (benefit.goldPerTurn) { player.perks = player.perks ?? {}; player.perks.gold = (player.perks.gold ?? 0) + benefit.goldPerTurn; }
  if (benefit.recruit) {
    const id = `${playerId}_levy_${at.q}_${at.r}`;
    const hp = UNITS[benefit.recruit]?.maxHp ?? 20;
    if (!state.map.units[id]) {
      state.map.units[id] = { id, type: benefit.recruit, ownerId: playerId, position: { q: at.q, r: at.r }, hp, maxHp: hp, movementRemaining: 0, veterancy: "recruit", mercenary: true };
      player.unitIds = player.unitIds.includes(id) ? player.unitIds : [...player.unitIds, id];
    }
  }
  const needCity = benefit.pop || benefit.walls;
  if (needCity) {
    let best = null, bestD = Infinity;
    for (const cid of player.cityIds) { const c = state.map.cities[cid]; if (!c) continue; const d = Math.abs(c.position.q - at.q) + Math.abs(c.position.r - at.r); if (d < bestD) { bestD = d; best = c; } }
    if (best) {
      if (benefit.pop) best.population += benefit.pop;
      if (benefit.walls && !(best.buildings ?? []).includes("walls")) { best.buildings = best.buildings ?? []; best.buildings.push("walls"); }
    }
  }
}
