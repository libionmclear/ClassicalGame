import { TECHS, UNIT_BUILD_COSTS, UNITS, BUILDINGS, IMPROVEMENTS } from "./data";
import { applyAction, computeCombatPreview, researchCost, canResearch, isCoastalCity, claimingCity, isEmbarked, playerControlsCiv, computeCityStability, computePlayerIncome, upgradeTargetFor, upgradeCost } from "./index";
import { districtSlots, districtForbidden } from "./districts";
import { canProposeAgreement, aiAcceptsProposal, personalityOf, relationBand, getRelation, isVassal, canDemandVassalage, militaryStrength, isAtWar } from "./diplomacy";
import { unitNear, explorerNear, befriendCostFor } from "./peoples";
import { getEvent } from "./events";
import { distance, DIRECTIONS, keyOf, parseKey, neighborsOf } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import type { City, Coord, GameAction, GameState, Player, Unit } from "./types";

// Tech order: unlock the army (spears -> swords -> cavalry -> siege), grab a few
// economy/statecraft nodes, and commit to one side of each fork.
const RESEARCH_PRIORITY = [
  "bronze-working",
  "archery",
  "iron-working",
  // A people beelines its own signature tech once the prerequisite is in hand
  // (civ gate skips the ones that aren't yours).
  "hoplite-phalanx",
  "chariotry",
  "legionary-system",
  "war-elephants",
  "iron-mastery",
  "combined-arms",
  "horseback-riding",
  "horse-archery",
  "writing",
  "mathematics",
  "sailing",
  "masonry",
  "engineering",
  "metallurgy",
  "siegecraft",
  "phalanx-doctrine",
  "coinage",
  "philosophy",
  "aqueducts",
  "republic",
  "open-sea-sailing",
  "roads-logistics",
  "astronomy",
  "rhetoric",
  "pottery",
  "law-administration",
  "assimilation"
];

const EXPANSION_TARGET = 3;

// Difficulty shapes how boldly the AI fights (the economy handicap lives in the
// engine's income step; this governs combat temperament).
//  - wounded:      hp fraction below which a unit breaks off to heal
//  - cityBias:     added to the score of assaulting an enemy city
//  - minHpFrac:    minimum survivable hp fraction before a cautious AI will strike
//  - requireBetter: only strike trades it comes out strictly ahead on (easy)
//  - acceptLoss:   strike whenever it survives — even a losing trade — or can kill (hard)
export interface AggressionProfile {
  wounded: number;
  cityBias: number;
  minHpFrac: number;
  requireBetter: boolean;
  acceptLoss: boolean;
}

export function aggression(state: GameState): AggressionProfile {
  switch (state.difficulty) {
    case "easy":
      return { wounded: 0.55, cityBias: -150, minHpFrac: 0.35, requireBetter: true, acceptLoss: false };
    case "hard":
      return { wounded: 0.25, cityBias: 220, minHpFrac: 0, requireBetter: false, acceptLoss: true };
    default:
      return { wounded: 0.4, cityBias: 0, minHpFrac: 0, requireBetter: false, acceptLoss: false };
  }
}

function moveCtx(unit: Unit) {
  const def = UNITS[unit.type];
  return { ownerId: unit.ownerId, domain: def.domain, mounted: def.mounted };
}

function unitsOf(state: GameState, player: Player): Unit[] {
  // Garrisons hold their post automatically — the AI never commands them.
  return player.unitIds.map((id) => state.map.units[id]).filter((u) => u && !u.garrison) as Unit[];
}

function unitAt(state: GameState, c: Coord): Unit | undefined {
  return Object.values(state.map.units).find((u) => u.position.q === c.q && u.position.r === c.r);
}

function cityAtCoord(state: GameState, c: Coord): City | undefined {
  return Object.values(state.map.cities).find((ci) => ci.position.q === c.q && ci.position.r === c.r);
}

function nearestCity(cities: City[], from: Coord): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const c of cities) {
    const d = distance(from, c.position);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function enemyCities(state: GameState, playerId: string): City[] {
  return Object.values(state.map.cities).filter((c) => c.ownerId !== playerId);
}

function ownCities(state: GameState, playerId: string): City[] {
  return Object.values(state.map.cities).filter((c) => c.ownerId === playerId);
}

function isMilitary(unit: Unit): boolean {
  const def = UNITS[unit.type];
  return def.attack > 0 && def.domain === "land";
}

function enemyCavalryNear(state: GameState, player: Player): boolean {
  const mine = unitsOf(state, player);
  for (const enemy of Object.values(state.map.units)) {
    if (enemy.ownerId === player.id) continue;
    if (!UNITS[enemy.type].mounted) continue;
    if (mine.some((m) => distance(m.position, enemy.position) <= 4)) return true;
  }
  return false;
}

// Branch-aware research pick (HEGEMON-TECHTREE-v2 §3.8): consider EVERY buildable
// tech (so the new civ-unique branch techs — absent from the old priority list —
// are actually researched), weight your own branch ×1.5, keep the economy trunk
// flowing early, and hold the capstone until the war machine is real.
const RESEARCH_BASE: Record<string, number> = {};
RESEARCH_PRIORITY.forEach((id, i) => { RESEARCH_BASE[id] = RESEARCH_PRIORITY.length - i; });
const ECON_TRUNK = new Set(["irrigation", "animal-husbandry", "pottery", "writing", "masonry", "coinage", "currency-reform", "mathematics", "aqueducts"]);

function bestBuildableTech(state: GameState, player: Player): string | null {
  const military = unitsOf(state, player).filter((u) => (UNITS[u.type]?.attack ?? 0) > 0).length;
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const techId of Object.keys(TECHS)) {
    if (player.techs.includes(techId)) continue;
    const tech = TECHS[techId];
    if (!tech) continue;
    // v2.1 §3: canResearch now enforces AND-prereqs, the era gate, civ and fork — use
    // it as the candidate filter so the AI never picks an illegal (gated) tech.
    let ok = false;
    try { ok = canResearch(player, techId); } catch { ok = false; }
    if (!ok) continue;
    let score = RESEARCH_BASE[techId] ?? 8; // branch techs missing from the old list get a mid base
    if (tech.civ) score *= 1.5;             // your own unique branch is a priority
    if (ECON_TRUNK.has(techId)) score += 6; // keep the economy moving early
    if (tech.capstone && military < 4) continue; // capstone only with a real army
    // v2.1 §3c/§3.8 cost-efficiency: value per science, so it grabs cheap foundations
    // early and only commits to an expensive line (deep track / capstone) deliberately.
    score = (score * 36) / (24 + researchCost(techId));
    if (tech.capstone) score += 3; // keep the branch capstone attractive once it unlocks
    if (score > bestScore) { bestScore = score; best = techId; }
  }
  return best;
}

// --- Actions -------------------------------------------------------------

function foundCityAction(state: GameState, player: Player): GameAction | null {
  const cities = ownCities(state, player.id);
  for (const unit of unitsOf(state, player)) {
    if (unit.type !== "settler") continue;
    if (cityAtCoord(state, unit.position)) continue;
    // Found once we've spread at least 2 tiles from every existing city.
    const tooClose = cities.some((c) => distance(c.position, unit.position) < 2);
    if (tooClose) continue;
    return {
      type: "FOUND_CITY",
      playerId: player.id,
      settlerId: unit.id,
      cityId: `${player.id}_city_${state.turn}_${unit.id}`
    };
  }
  return null;
}

function attackAction(state: GameState, player: Player): GameAction | null {
  let best: { action: GameAction; score: number } | null = null;
  const agg = aggression(state);

  for (const attacker of unitsOf(state, player)) {
    const def = UNITS[attacker.type];
    if (def.attack <= 0 || attacker.movementRemaining <= 0) continue;
    if (isEmbarked(state, attacker)) continue; // must land before it can fight

    // Enemy units — willingness to trade scales with difficulty.
    for (const target of Object.values(state.map.units)) {
      if (target.ownerId === player.id) continue;
      if (distance(attacker.position, target.position) > def.range) continue;
      const preview = computeCombatPreview(state, attacker.id, target.id);
      const kills = preview.defenderRemainingHp <= 0;
      const survives = preview.attackerRemainingHp > 0;
      const evenOrBetter = preview.damageToDefender >= preview.damageToAttacker;

      let favorable: boolean;
      if (agg.acceptLoss) {
        // Hard: press the attack whenever it survives, can kill, or trades even.
        favorable = kills || survives || evenOrBetter;
      } else if (agg.requireBetter) {
        // Easy: only clean, winning trades that leave the unit reasonably whole.
        const healthy = preview.attackerRemainingHp >= UNITS[attacker.type].maxHp * agg.minHpFrac;
        favorable = survives && healthy && (kills || preview.damageToDefender > preview.damageToAttacker);
      } else {
        // Normal: any non-losing trade it survives.
        favorable = survives && (kills || evenOrBetter);
      }
      if (!favorable) continue;

      const score = (kills ? 1000 : 0) + preview.damageToDefender - preview.damageToAttacker;
      if (!best || score > best.score) {
        best = { action: { type: "ATTACK", playerId: player.id, attackerId: attacker.id, defenderId: target.id }, score };
      }
    }

    // Enemy cities — always safe (no retaliation); siege excels. Aggressive AIs
    // prize the assault more, timid ones hang back.
    for (const city of enemyCities(state, player.id)) {
      if (distance(attacker.position, city.position) > def.range) continue;
      const score = 450 + (def.siegeBonus ? 300 : 0) - city.hp * 0.5 + agg.cityBias;
      if (!best || score > best.score) {
        best = { action: { type: "ATTACK_CITY", playerId: player.id, attackerId: attacker.id, cityId: city.id }, score };
      }
    }
  }

  return best ? best.action : null;
}

function buildAction(state: GameState, player: Player): GameAction | null {
  const cities = player.cityIds.map((id) => state.map.cities[id]).filter(Boolean) as City[];
  if (cities.length === 0) return null;

  const settlersInFlight = unitsOf(state, player).filter((u) => u.type === "settler").length;
  const wantSettler = cities.length < EXPANSION_TARGET && settlersInFlight === 0;

  // Want a merchant once there's an army to guard the roads and untapped city
  // pairs left to link by trade (defend first, then enrich).
  const merchantsInFlight = unitsOf(state, player).filter((u) => u.type === "merchant").length;
  const routesOwned = (state.tradeRoutes ?? []).filter((r) => r.ownerId === player.id).length;
  const hasArmy = unitsOf(state, player).some(isMilitary);
  const wantMerchant =
    cities.length >= 2 && hasArmy && merchantsInFlight === 0 && routesOwned < cities.length - 1;

  const canBuild = (type: string): boolean => {
    const rule = UNITS[type];
    if (!rule) return false;
    if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) return false;
    if (rule.civ && !playerControlsCiv(player, rule.civ)) return false;
    return true;
  };

  // A people fields its signature unit ahead of the generic line when it can.
  const civElite = Object.keys(UNITS).filter(
    (t) => UNITS[t].civ && (UNITS[t].attack ?? 0) > 0 && canBuild(t)
  );
  const spearFirst = enemyCavalryNear(state, player);
  const militaryPref = [
    ...civElite,
    ...(spearFirst
      ? ["spearman", "swordsman", "horseman", "archer", "warrior"]
      : ["swordsman", "horseman", "spearman", "archer", "warrior"])
  ];

  // Naval ambition: want roughly one warship per enemy coastal city, so an
  // amphibious rival can actually be reached and fought across the water.
  const triremeCount = unitsOf(state, player).filter((u) => u.type === "trireme").length;
  const enemyCoastalCities = enemyCities(state, player.id).filter((c) => isCoastalCity(state, c.id)).length;
  const desiredShips = Math.min(4, enemyCoastalCities);

  for (const city of cities) {
    // Don't over-queue; production banks and builds these over turns.
    if ((city.queue?.length ?? 0) >= 2) continue;
    const coastal = isCoastalCity(state, city.id);
    let chosen: string | null = null;
    if (wantSettler && canBuild("settler") && !(city.queue ?? []).includes("settler")) chosen = "settler";
    if (!chosen && wantMerchant && canBuild("merchant") && !(city.queue ?? []).includes("merchant")) chosen = "merchant";
    // A coastal city yards a warship when the fleet is short of its target size.
    if (
      !chosen &&
      coastal &&
      canBuild("trireme") &&
      triremeCount < desiredShips &&
      !(city.queue ?? []).includes("trireme")
    ) {
      chosen = "trireme";
    }
    if (!chosen) chosen = militaryPref.find(canBuild) ?? null;
    if (!chosen) continue;
    // NOTE (v3 §1): the engine enforces "no recruiting below pop 2" (units wait to
    // spawn). Fuller AI population-weighting (train mercs when pop-tight, value the
    // pop cost) is deferred to STEP C §6.7.
    return {
      type: "BUILD_UNIT",
      playerId: player.id,
      cityId: city.id,
      unitType: chosen,
      unitId: `${player.id}_${chosen}_${state.turn}_${city.id}`
    };
  }
  return null;
}

function buildingAction(state: GameState, player: Player): GameAction | null {
  for (const cityId of player.cityIds) {
    const city = state.map.cities[cityId];
    if (!city) continue;
    if ((city.queue?.length ?? 0) >= 3) continue;
    const built = new Set([...(city.buildings ?? []), ...(city.queue ?? [])]);
    for (const [id, b] of Object.entries(BUILDINGS)) {
      if (built.has(id)) continue;
      if (b.civ && String(player.civ || "").toLowerCase() !== b.civ) continue; // civ-unique
      if (b.requiresTech && !player.techs.includes(b.requiresTech)) continue;
      if (b.coastalOnly && !isCoastalCity(state, cityId)) continue;
      return { type: "BUILD_BUILDING", playerId: player.id, cityId, buildingId: id };
    }
  }
  return null;
}

// Cities v3 §6.7 — once a city has grown a district slot and the treasury can
// spare the gold, the AI raises the district its situation most calls for:
// barracks under threat, leisure/civic when order frays, an aqueduct when it is
// hungry, otherwise a market. (Mercenary hiring — the other §6.7 lever — has no
// action path yet, so it is intentionally skipped.)
export function districtAction(state: GameState, player: Player): GameAction | null {
  if (player.gold < 55) return null; // keep a small reserve over the 40g cost
  // Empire-wide: is growth being throttled by the army's food-tax? computePlayerIncome
  // returns food NET of upkeep, so ≤1 means troops are eating into what would feed cities.
  const foodTight = computePlayerIncome(state, player.id).food <= 1;
  for (const cityId of player.cityIds) {
    const city = state.map.cities[cityId];
    if (!city) continue;
    const built = city.districts ?? [];
    if (built.length >= districtSlots(city)) continue; // no free slot at this tier

    // A land hex, adjacent to the city, actually worked by it, and still empty.
    const takenHexes = new Set(built.map((d) => d.hex));
    const freeHex = neighborsOf(city.position)
      .map((n) => keyOf(n))
      .find((k) => {
        const tile = state.map.tiles[k];
        if (!tile || tile.terrain === "coast" || tile.terrain === "sea") return false;
        if (takenHexes.has(k)) return false;
        const claim = claimingCity(state, parseKey(k));
        return !!claim && claim.id === city.id;
      });
    if (!freeHex) continue;

    // Read the city's situation and rank the district that answers it first.
    const threatened = Object.values(state.map.units).some(
      (u) => u.ownerId !== player.id && isMilitary(u) && distance(u.position, city.position) <= 4
    );
    const stability = computeCityStability(state, cityId);
    const alreadyType = new Set(built.map((d) => d.type));

    const prefs: string[] = [];
    if (threatened) prefs.push("barracks");
    if (stability <= 3) prefs.push("leisure", "civic");
    if (foodTight) prefs.push("aqueduct");
    prefs.push("market", "civic", "temple", "leisure", "affluent");

    for (const type of prefs) {
      if (alreadyType.has(type)) continue; // no point doubling up
      if (districtForbidden(type, String(player.civ))) continue;
      return { type: "BUILD_DISTRICT", playerId: player.id, cityId, districtType: type, hex: freeHex };
    }
  }
  return null;
}

// Farthest empty tile a unit can reach along a path this turn (stops before any
// occupied tile or enemy city — those are handled by the attack step).
function reachableAlong(state: GameState, unit: Unit, path: Coord[]): Coord | null {
  const ctx = moveCtx(unit);
  let cost = 0;
  let lastIndex = 0;
  for (let i = 1; i < path.length; i += 1) {
    const step = movementCost(state, ctx, path[i - 1], path[i]);
    if (!Number.isFinite(step) || cost + step > unit.movementRemaining) break;
    if (unitAt(state, path[i])) break;
    const cityHere = cityAtCoord(state, path[i]);
    if (cityHere && cityHere.ownerId !== unit.ownerId) break;
    cost += step;
    lastIndex = i;
  }
  return lastIndex > 0 ? path[lastIndex] : null;
}

function maneuverAction(state: GameState, player: Player): GameAction | null {
  const woundedFraction = aggression(state).wounded;
  const myCities = ownCities(state, player.id);
  const myMilitary = unitsOf(state, player).filter(isMilitary);
  for (const unit of unitsOf(state, player)) {
    if (!isMilitary(unit) || unit.movementRemaining <= 0) continue;

    // Keep a garrison: don't march off the last defender of a city. Undefended
    // capitals get rushed and eliminated — the main source of runaway games.
    const guarding = myCities.find((c) => distance(unit.position, c.position) <= 1);
    if (guarding) {
      const otherDefender = myMilitary.some(
        (u) => u.id !== unit.id && distance(u.position, guarding.position) <= 1
      );
      if (!otherDefender) continue; // hold this city
    }

    const wounded = unit.hp < UNITS[unit.type].maxHp * woundedFraction;
    const target = wounded
      ? nearestCity(ownCities(state, player.id), unit.position)
      : nearestCity(enemyCities(state, player.id), unit.position);
    if (!target) continue;

    const path = findPath(state, moveCtx(unit), unit.position, target.position);
    if (!path || path.length < 2) continue;
    const dest = reachableAlong(state, unit, path);
    if (!dest) continue;

    return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: dest };
  }
  return null;
}

// Best improvement for a terrain — favour labour, then food, then gold.
const IMPROVE_PREFERENCE = ["mine", "quarry", "lumber-camp", "farm", "pasture", "vineyard", "trade-post"];
function pickImprovement(tile: { terrain: string; resource?: string }, player: Player): string | null {
  for (const id of IMPROVE_PREFERENCE) {
    const rule = IMPROVEMENTS[id];
    if (!rule || !rule.terrains.includes(tile.terrain)) continue;
    if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) continue;
    if (rule.requiresResource && !(tile.resource && rule.requiresResource.includes(tile.resource))) continue;
    return id;
  }
  return null;
}

// Work the land: queue an improvement on an unimproved tile a city claims. Gated
// to a spare queue slot so it never starves the war effort.
function improveAction(state: GameState, player: Player): GameAction | null {
  for (const cityId of player.cityIds) {
    const city = state.map.cities[cityId];
    if (!city) continue;
    if ((city.queue?.length ?? 0) >= 3) continue; // leave the first slots for units
    for (let dq = -2; dq <= 2; dq += 1) {
      for (let dr = -2; dr <= 2; dr += 1) {
        if (distance({ q: 0, r: 0 }, { q: dq, r: dr }) > 2) continue;
        const key = `${city.position.q + dq},${city.position.r + dr}`;
        const tile = state.map.tiles[key];
        if (!tile || tile.improvement) continue;
        const claim = claimingCity(state, parseKey(key));
        if (!claim || claim.id !== city.id) continue;
        if ((city.queue ?? []).some((q) => q.startsWith("imp:") && q.endsWith(`:${key}`))) continue;
        const imp = pickImprovement(tile, player);
        if (!imp) continue;
        return { type: "IMPROVE_TILE", playerId: player.id, cityId: city.id, tileKey: key, improvement: imp };
      }
    }
  }
  return null;
}

// A merchant standing in one of the player's cities opens an internal trade
// route back to the nearest other city — instant gold every turn thereafter.
function tradeAction(state: GameState, player: Player): GameAction | null {
  const owned = ownCities(state, player.id);
  if (owned.length < 2) return null;
  for (const unit of unitsOf(state, player)) {
    if (unit.type !== "merchant") continue;
    const dest = cityAtCoord(state, unit.position);
    if (!dest) continue;
    let home: City | null = null;
    let bestDist = Infinity;
    for (const c of owned) {
      if (c.id === dest.id) continue;
      const d = distance(c.position, dest.position);
      if (d < bestDist) {
        bestDist = d;
        home = c;
      }
    }
    if (!home) continue;
    const dup = (state.tradeRoutes ?? []).some(
      (r) =>
        r.ownerId === player.id &&
        ((r.fromCityId === home!.id && r.toCityId === dest.id) ||
          (r.fromCityId === dest.id && r.toCityId === home!.id))
    );
    if (dup) continue;
    return { type: "ESTABLISH_TRADE_ROUTE", playerId: player.id, merchantId: unit.id, cityId: dest.id };
  }
  return null;
}

// Sail warships toward the nearest enemy coastal city (to bombard it) or hunt
// enemy ships, stepping only over water. Once adjacent, attackAction bombards.
function navalManeuverAction(state: GameState, player: Player): GameAction | null {
  for (const unit of unitsOf(state, player)) {
    if (UNITS[unit.type].domain !== "naval" || unit.movementRemaining <= 0) continue;

    // Prefer a coastal enemy city; otherwise chase the nearest enemy ship.
    const coastalTargets = enemyCities(state, player.id).filter((c) => isCoastalCity(state, c.id));
    let targetPos: Coord | null = nearestCity(coastalTargets, unit.position)?.position ?? null;
    if (!targetPos) {
      let bestDist = Infinity;
      for (const enemy of Object.values(state.map.units)) {
        if (enemy.ownerId === player.id) continue;
        if (UNITS[enemy.type].domain !== "naval") continue;
        const d = distance(unit.position, enemy.position);
        if (d < bestDist) {
          bestDist = d;
          targetPos = enemy.position;
        }
      }
    }
    if (!targetPos) continue;

    const ctx = moveCtx(unit);
    let bestStep: Coord | null = null;
    let bestScore = distance(unit.position, targetPos);
    for (const dir of DIRECTIONS) {
      const next = { q: unit.position.q + dir[0], r: unit.position.r + dir[1] };
      if (!state.map.tiles[keyOf(next)]) continue;
      const step = movementCost(state, ctx, unit.position, next);
      if (!Number.isFinite(step) || step > unit.movementRemaining) continue;
      if (unitAt(state, next) || cityAtCoord(state, next)) continue;
      const d = distance(next, targetPos);
      if (d < bestScore) {
        bestScore = d;
        bestStep = next;
      }
    }
    if (bestStep) {
      return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: bestStep };
    }
  }
  return null;
}

function settlerMoveAction(state: GameState, player: Player): GameAction | null {
  const cities = ownCities(state, player.id);
  for (const unit of unitsOf(state, player)) {
    if (unit.type !== "settler" || unit.movementRemaining <= 0) continue;
    // Walk to the adjacent tile that gets furthest from our nearest city.
    const currentNearest = nearestCity(cities, unit.position);
    const currentDist = currentNearest ? distance(unit.position, currentNearest.position) : 0;
    let bestStep: Coord | null = null;
    let bestScore = currentDist;
    const ctx = moveCtx(unit);
    for (const dir of DIRECTIONS) {
      const next = { q: unit.position.q + dir[0], r: unit.position.r + dir[1] };
      if (!state.map.tiles[`${next.q},${next.r}`]) continue;
      const step = movementCost(state, ctx, unit.position, next);
      if (!Number.isFinite(step) || step > unit.movementRemaining) continue;
      if (unitAt(state, next) || cityAtCoord(state, next)) continue;
      const near = nearestCity(cities, next);
      const score = near ? distance(next, near.position) : 99;
      if (score > bestScore) {
        bestScore = score;
        bestStep = next;
      }
    }
    if (bestStep) {
      return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: bestStep };
    }
  }
  return null;
}

// Diplomacy (D3 + E4 personalities §5): the AI's foreign policy, in priority
// order — subjugate the weak, sue for peace when losing, climb the alliance
// ladder with friends, else seek a Trade Pact. canProposeAgreement enforces the
// band / no-war / no-dup / no-pending / no-vassal rules; the personality flags
// decide WHICH move a given civ reaches for. Trade pacts never block war, so this
// step (which sits late in the priority list) never stalls a conquest.
function diplomacyAction(state: GameState, player: Player): GameAction | null {
  const per = personalityOf(player.civ);
  const others = state.players.filter((o) => o.id !== player.id);

  // 1. Demand vassalage from a much weaker neighbour you don't hate (Rome, Macedon, Persia).
  if (per.demandsVassals) {
    for (const o of others) {
      if (o.pendingProposal || isVassal(state, o.id)) continue;
      if (relationBand(getRelation(state, player.id, o.id)) === "hostile") continue;
      if (canDemandVassalage(state, player.id, o.id) === true) {
        return { type: "PROPOSE_VASSALAGE", playerId: player.id, targetId: o.id, vassalId: o.id };
      }
    }
  }
  // 2. Losing a war? Submit to survive (Egypt, Persia) or buy peace with tribute (Carthage, …).
  if (per.submitsWhenLosing || per.buysPeace) {
    for (const o of others) {
      if (!isAtWar(state, player.id, o.id) || o.pendingProposal) continue;
      const strong = militaryStrength(state, o.id), me = militaryStrength(state, player.id);
      if (per.submitsWhenLosing && !isVassal(state, player.id) && strong >= me * 2) {
        return { type: "PROPOSE_VASSALAGE", playerId: player.id, targetId: o.id, vassalId: player.id };
      }
      if (per.buysPeace && player.gold >= 10 && strong >= me * 1.6) {
        return { type: "OFFER_TRIBUTE", playerId: player.id, targetId: o.id, amount: 5, turns: 12 };
      }
    }
  }
  // 3. League-builders climb the alliance ladder with a trusted friend (Athens, Macedon).
  if (per.seeksAlliances) {
    for (const o of others) {
      for (const t of ["full-alliance", "defensive-alliance", "nap"] as const) {
        if (canProposeAgreement(state, player.id, o.id, t) === true) {
          return { type: "PROPOSE_AGREEMENT", playerId: player.id, targetId: o.id, agreementType: t };
        }
      }
    }
  }
  // 4. Baseline: a Trade Pact with anyone peaceful enough (the mercantile default).
  for (const o of others) {
    if (canProposeAgreement(state, player.id, o.id, "trade-pact") === true) {
      return { type: "PROPOSE_AGREEMENT", playerId: player.id, targetId: o.id, agreementType: "trade-pact" };
    }
  }
  return null;
}

// Upgrade veterans into the people's signature elite once the tech is in hand (a
// Roman Swordsman → Legionary, etc.). The AI used to field elites only when it
// built them fresh, leaving units trained before the tech stuck at the base type.
export function upgradeAction(state: GameState, player: Player): GameAction | null {
  if (player.gold < 22) return null; // nothing to spend
  for (const unit of unitsOf(state, player)) {
    const target = upgradeTargetFor(player, unit);
    if (!target) continue;
    if (player.gold < upgradeCost(unit.type, target) + 10) continue; // keep a reserve
    return { type: "UPGRADE_UNIT", playerId: player.id, unitId: unit.id };
  }
  return null;
}

// --- Discovery & Minor Peoples (§10) -----------------------------------------
// The AI used to ignore the whole discovery layer: its Explorer never moved, no
// ruin was ever dug, no village ever courted — all rewards (gold/science/XP, and
// free towns) went to the human alone. These steps put the Explorer to work and
// engage villages a unit is standing beside.

function nearestRuinKey(state: GameState, from: Coord): string | null {
  const ruins = state.map.ruins;
  if (!ruins) return null;
  let best: string | null = null, bestD = Infinity;
  for (const [key, site] of Object.entries(ruins)) {
    if (site.excavated) continue;
    const d = distance(from, parseKey(key));
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

// The nearest village this player could still gain from (not already their friend).
function nearestOpenVillageKey(state: GameState, from: Coord, playerId: string): string | null {
  const vs = state.map.villages;
  if (!vs) return null;
  let best: string | null = null, bestD = Infinity;
  for (const [key, v] of Object.entries(vs)) {
    if (v.befriendedBy === playerId) continue; // already friends — nothing new to court
    const d = distance(from, parseKey(key));
    if (d < bestD) { bestD = d; best = key; }
  }
  return best;
}

// Engage a Minor-People village a unit is standing beside: absorb a friend into
// the realm (a free town), court a newcomer for its gifts, or — when a soldier is
// already adjacent and there's no peaceful path — take a hostile one by force.
export function villageAction(state: GameState, player: Player): GameAction | null {
  const vs = state.map.villages;
  if (!vs) return null;
  const agg = aggression(state);
  for (const [hex, v] of Object.entries(vs)) {
    if (!unitNear(state, player.id, hex)) continue; // must be standing on/beside it
    // 1) Already our friend → absorb them (join = a free town at their hex).
    if (v.befriendedBy === player.id && v.disposition !== "hostile") {
      return { type: "ABSORB_VILLAGE", playerId: player.id, hex, mode: "join" };
    }
    // 2) A newcomer we can still court: decent odds, gold in hand (keep a reserve),
    //    and we haven't already worn out our welcome (attempts cap avoids gold spam).
    const cost = befriendCostFor(state, player.id, hex);
    const canCourt = v.disposition !== "hostile" || explorerNear(state, player.id, hex);
    if (v.befriendedBy !== player.id && canCourt && (v.attempts ?? 0) < 2 && player.gold >= cost + 15) {
      return { type: "BEFRIEND_VILLAGE", playerId: player.id, hex };
    }
    // 3) Hostile / unfriendable, but a soldier is already adjacent → take it (a free
    //    town at a reputation cost; aggressive AIs also seize the merely-resistant).
    if (v.befriendedBy !== player.id && unitNear(state, player.id, hex, true) && (v.disposition === "hostile" || agg.acceptLoss)) {
      return { type: "CONQUER_VILLAGE", playerId: player.id, hex };
    }
  }
  return null;
}

// Send the Explorer to WORK the map: stand on the nearest un-excavated ruin (it
// auto-digs at turn-end for the FULL reward), else approach the nearest village to
// court it, else scout toward the nearest rival. (Without this the Explorer, not
// being military, was never moved at all.)
export function exploreAction(state: GameState, player: Player): GameAction | null {
  for (const unit of unitsOf(state, player)) {
    if (unit.type !== "explorer" || unit.movementRemaining <= 0) continue;
    const ruinKey = nearestRuinKey(state, unit.position);
    const villageKey = nearestOpenVillageKey(state, unit.position, player.id);
    let targetPos: Coord | null = null;
    if (ruinKey) targetPos = parseKey(ruinKey);
    else if (villageKey) targetPos = parseKey(villageKey);
    else {
      const foe = nearestCity(enemyCities(state, player.id), unit.position);
      targetPos = foe ? foe.position : null;
    }
    if (!targetPos || distance(unit.position, targetPos) === 0) continue;
    const path = findPath(state, moveCtx(unit), unit.position, targetPos);
    if (!path || path.length < 2) continue;
    const dest = reachableAlong(state, unit, path);
    if (!dest) continue;
    return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: dest };
  }
  return null;
}

export function chooseAiAction(state: GameState, playerId: string): GameAction {
  const player = state.playersById[playerId];
  if (!player) throw new Error(`Unknown player ${playerId}`);

  const steps: Array<() => GameAction | null> = [
    () => {
      // Answer any diplomatic offer on the table before anything else.
      if (!player.pendingProposal) return null;
      const p = player.pendingProposal;
      return { type: "RESOLVE_PROPOSAL", playerId, accept: aiAcceptsProposal(state, playerId, p.from, p.kind, p.amount ?? 0, p.vassalId) };
    },
    () => {
      // Resolve any pending Crossroads dilemma first (pick the better payoff).
      if (!player.pendingEvent) return null;
      const event = getEvent(player.pendingEvent);
      if (!event) return null;
      const score = (o: (typeof event.options)[number]) =>
        (o.effects.gold ?? 0) * 0.5 +
        (o.effects.production ?? 0) +
        (o.effects.science ?? 0) * 0.8 +
        (o.effects.food ?? 0) * 3 +
        (o.effects.spawnUnit ? 25 : 0);
      const optionIndex = score(event.options[0]) >= score(event.options[1]) ? 0 : 1;
      return { type: "RESOLVE_EVENT", playerId, eventId: player.pendingEvent, optionIndex };
    },
    () => attackAction(state, player),
    () => foundCityAction(state, player),
    () => villageAction(state, player),      // §10: absorb/court/seize a village beside a unit
    () => buildAction(state, player),
    () => buildingAction(state, player),
    () => upgradeAction(state, player),      // turn veterans into the civ elite with spare gold
    () => districtAction(state, player),
    () => tradeAction(state, player),
    () => improveAction(state, player),
    () => maneuverAction(state, player),
    () => navalManeuverAction(state, player),
    () => settlerMoveAction(state, player),
    () => exploreAction(state, player),      // §10: send the Explorer to ruins/villages
    () => diplomacyAction(state, player),
    () => {
      const techId = bestBuildableTech(state, player);
      if (!techId || player.science < researchCost(techId)) return null;
      return { type: "RESEARCH_TECH", playerId, techId };
    }
  ];

  for (const step of steps) {
    const action = step();
    if (action) return action;
  }
  return { type: "END_TURN", playerId };
}

export function runAiTurn(inputState: GameState, playerId: string, maxActions = 10): { state: GameState; actions: GameAction[] } {
  let state = inputState;
  const actions: GameAction[] = [];

  for (let i = 0; i < maxActions; i += 1) {
    const action = chooseAiAction(state, playerId);
    if (action.type === "END_TURN") {
      actions.push(action);
      state = applyAction(state, action);
      break;
    }
    try {
      const next = applyAction(state, action);
      state = next;
      actions.push(action);
    } catch {
      // A heuristic produced an illegal action; don't crash the game — just end
      // this player's turn cleanly.
      const forcedEnd: GameAction = { type: "END_TURN", playerId };
      actions.push(forcedEnd);
      state = applyAction(state, forcedEnd);
      return { state, actions };
    }
  }

  if (actions.length === maxActions && actions[actions.length - 1].type !== "END_TURN") {
    const forcedEnd: GameAction = { type: "END_TURN", playerId };
    actions.push(forcedEnd);
    state = applyAction(state, forcedEnd);
  }

  return { state, actions };
}
