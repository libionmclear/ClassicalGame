// HEGEMON — discovery.ts (Game Design Brief §10.2): ancient RUINS. Sites of
// cultures that flourished before ~800 BC; an Explorer that ends its turn on one
// EXCAVATES it for a fixed, deterministic reward (any other unit gets half and no
// Codex entry). Pure helpers + a mutator that applyEndTurn calls.
import type { GameState } from "./types";
import { neighborsOf, parseKey } from "./hex";

// Reward vocabulary — each maps to a concrete engine effect (faith/culture fold
// into science; "progress toward tech X" is granted as science; a "trade good"
// is a persistent per-turn gold perk).
export interface RuinReward {
  gold?: number;          // to the finder's treasury
  science?: number;       // to the finder's research pool
  xp?: boolean;           // every one of the finder's units gains a veterancy step
  reveal?: boolean;       // reveal the tiles around the ruin
  cityProduction?: number; // banked at the nearest own city
  cityFood?: number;       // banked at the nearest own city
  walls?: boolean;         // free Walls at the nearest own city
  goldPerTurn?: number;    // a lasting trade good (perk gold)
}

export interface RuinDef {
  id: string;
  name: string;
  region: string;         // flavour / where it belongs on the Old World
  /** Terrain the ruin prefers (placement hint): a TerrainType or "any". */
  terrain: string;
  text: string;           // the discovery card's line
  reward: RuinReward;
}

// A curated subset of the brief's §10.2 table (region-authentic flavour, terrain
// hints drive placement on generated maps that lack named geography).
export const RUINS: RuinDef[] = [
  { id: "hammurabi", name: "Stele of Hammurabi", region: "Mesopotamia", terrain: "desert", text: "A basalt pillar of 282 laws — 'an eye for an eye' — carved a thousand years before your grandfathers.", reward: { science: 45 } },
  { id: "ur", name: "Ziggurat of Ur", region: "Mesopotamia", terrain: "plains", text: "A mountain built by hands, stair upon stair toward the moon-god Nanna.", reward: { science: 25, cityProduction: 10 } },
  { id: "ashurbanipal", name: "Library of Ashurbanipal", region: "Nineveh", terrain: "hills", text: "Thirty thousand clay tablets — the fire that destroyed the palace baked its words immortal.", reward: { science: 60 } },
  { id: "hattusa", name: "Walls of Hattusa", region: "Anatolia", terrain: "hills", text: "The Hittite kings forged black iron here while the world still fought with bronze.", reward: { science: 30, walls: true } },
  { id: "gobekli", name: "Göbekli Tepe", region: "Anatolia", terrain: "highlands", text: "Carved pillars raised by hunters seven thousand years before the pyramids. No one remembers why.", reward: { science: 20 } },
  { id: "knossos", name: "Palace of Knossos", region: "Crete", terrain: "coast", text: "A labyrinth of a thousand rooms; its sea-kings ruled the waves before Greece had a name.", reward: { science: 25, gold: 20 } },
  { id: "mycenae", name: "Lion Gate of Mycenae", region: "Greece", terrain: "hills", text: "Cyclopean stones no mortal should lift; the fortress of Agamemnon's line.", reward: { xp: true } },
  { id: "troy", name: "Mound of Troy", region: "Hellespont", terrain: "plains", text: "Nine cities stacked in one hill of ash and legend.", reward: { gold: 70 } },
  { id: "giza", name: "Pyramids of Giza", region: "Nile", terrain: "desert", text: "Already ancient beyond reckoning; tombs of god-kings whose names outlived their gods.", reward: { cityProduction: 25 } },
  { id: "kerma", name: "Necropolis of Kerma", region: "Nubia", terrain: "desert", text: "Burial mounds of Kush's first kingdom, older than most of Egypt's glories.", reward: { gold: 40 } },
  { id: "nuraghe", name: "Nuraghe Towers", region: "Sardinia", terrain: "hills", text: "Seven thousand stone towers raised by a people who left no words, only walls.", reward: { walls: true } },
  { id: "terramare", name: "Terramare Embankments", region: "Po Valley", terrain: "valley", text: "Banked and ditched farm-towns, abandoned in a single generation none can explain.", reward: { science: 30, cityFood: 10 } },
  { id: "nebra", name: "Nebra Sky Hoard", region: "Germania", terrain: "forest", text: "A bronze disc inlaid with sun, moon, and the Pleiades — the heavens, cast in metal.", reward: { science: 25, reveal: true } },
  { id: "hallstatt", name: "Hallstatt Salt Galleries", region: "Alps", terrain: "mountains", text: "Miners' picks and fur caps preserved in salt; the white gold that made the first Celtic princes rich.", reward: { goldPerTurn: 2 } },
  { id: "stonehenge", name: "Stonehenge", region: "Britain", terrain: "plains", text: "Rings of standing stones aligned to midsummer's first light.", reward: { science: 20, reveal: true } },
  { id: "tartessos", name: "Silver Hoards of Tartessos", region: "Iberia", terrain: "hills", text: "A kingdom the Greeks called rich beyond measure — vanished, its river-mouth city never found.", reward: { gold: 90 } }
];

export const RUIN_BY_ID: Record<string, RuinDef> = {};
for (const r of RUINS) RUIN_BY_ID[r.id] = r;

const VET_NEXT: Record<string, string> = { recruit: "veteran", veteran: "elite", elite: "elite" };

// Excavate every ruin the given player is standing on this turn-end. An Explorer
// gets the full reward + a Codex entry; any other unit gets half and no Codex.
export function excavateRuins(state: GameState, playerId: string): void {
  if (!state.map.ruins) return;
  const player = state.playersById[playerId];
  if (!player) return;
  for (const unitId of player.unitIds) {
    const unit = state.map.units[unitId];
    if (!unit) continue;
    const key = `${unit.position.q},${unit.position.r}`;
    const site = state.map.ruins[key];
    if (!site || site.excavated) continue;
    const ruin = RUIN_BY_ID[site.ruinId];
    if (!ruin) continue;
    const explorer = unit.type === "explorer";
    applyRuinReward(state, playerId, ruin.reward, explorer ? 1 : 0.5, parseKey(key));
    site.excavated = true;
    site.by = playerId;
    if (explorer) {                       // the archaeologist earns the Codex entry
      player.codex = player.codex ?? [];
      if (!player.codex.includes(ruin.id)) player.codex.push(ruin.id);
    }
  }
}

function applyRuinReward(state: GameState, playerId: string, reward: RuinReward, factor: number, at: { q: number; r: number }): void {
  const player = state.playersById[playerId];
  const scale = (n: number) => Math.round(n * factor);
  if (reward.gold) player.gold += scale(reward.gold);
  if (reward.science) player.science += scale(reward.science);
  if (reward.goldPerTurn) { player.perks = player.perks ?? {}; player.perks.gold = (player.perks.gold ?? 0) + scale(reward.goldPerTurn); }
  if (reward.xp) {
    for (const uid of player.unitIds) { const u = state.map.units[uid]; if (u) u.veterancy = (VET_NEXT[u.veterancy ?? "recruit"] ?? "veteran") as typeof u.veterancy; }
  }
  if (reward.reveal) {
    state.discovered = state.discovered ?? {};
    const seen = new Set(state.discovered[playerId] ?? []);
    seen.add(`${at.q},${at.r}`);
    for (const n of neighborsOf(at)) for (const nn of neighborsOf(n)) if (state.map.tiles[`${nn.q},${nn.r}`]) seen.add(`${nn.q},${nn.r}`);
    state.discovered[playerId] = [...seen];
  }
  const city = reward.cityProduction || reward.cityFood || reward.walls ? nearestCity(state, playerId, at) : null;
  if (city) {
    if (reward.cityProduction) city.production = (city.production ?? 0) + scale(reward.cityProduction);
    if (reward.cityFood) city.food = (city.food ?? 0) + scale(reward.cityFood);
    if (reward.walls && !(city.buildings ?? []).includes("walls")) { city.buildings = city.buildings ?? []; city.buildings.push("walls"); }
  }
}

function nearestCity(state: GameState, playerId: string, at: { q: number; r: number }) {
  let best = null, bestD = Infinity;
  for (const cid of state.playersById[playerId]?.cityIds ?? []) {
    const c = state.map.cities[cid];
    if (!c) continue;
    const d = Math.abs(c.position.q - at.q) + Math.abs(c.position.r - at.r);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}
