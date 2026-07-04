import {
  TECHS,
  TERRAIN,
  UNITS,
  UNIT_BUILD_COSTS,
  WEATHER_STATES,
  MELEE_CATEGORIES,
  RANGED_CATEGORIES,
  CATEGORY_LABELS,
  BUILDINGS,
  IMPROVEMENTS
} from "./data";
import { distance, edgeKey, keyOf, neighborsOf, parseKey } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import { seededRandom } from "./rng";
import { computeVisibility } from "./visibility";
import { EVENTS, getEvent } from "./events";
import type { ResolveEventAction, BuildBuildingAction, UnqueueProductionAction, RushProductionAction, EstablishTradeRouteAction, ImproveTileAction } from "./types";
import type {
  AttackCityAction,
  ChooseForkAction,
  CombatPreview,
  Coord,
  CreateGameConfig,
  City,
  EndTurnAction,
  GameAction,
  GameMap,
  GameState,
  BuildUnitAction,
  FoundCityAction,
  MoveUnitAction,
  Player,
  ResearchTechAction,
  Tile,
  Unit,
  Veterancy,
  VictoryStatus,
  WeatherType
} from "./types";

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makePlayersById(players: Player[]): Record<string, Player> {
  const result: Record<string, Player> = {};
  for (const player of players) {
    result[player.id] = player;
  }
  return result;
}

function normalizePlayers(configPlayers?: Partial<Player>[]): Player[] {
  const fallback = [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }] as Array<Partial<Player>>;
  return (configPlayers ?? fallback).map((player, idx) => ({
    id: player.id ?? `p${idx + 1}`,
    civ: player.civ ?? "Rome",
    food: player.food ?? 0,
    production: player.production ?? 0,
    gold: player.gold ?? 25,
    science: player.science ?? 0,
    techs: player.techs ?? [],
    forkChoices: player.forkChoices ?? {},
    cityIds: player.cityIds ?? [],
    unitIds: player.unitIds ?? []
  }));
}

function normalizeMap(configMap: NonNullable<CreateGameConfig["map"]> | undefined): GameMap {
  const width = configMap?.width ?? 10;
  const height = configMap?.height ?? 10;
  const tiles: Record<string, Tile> = {};

  if (configMap?.tiles) {
    for (const [key, tile] of Object.entries(configMap.tiles)) {
      tiles[key] = {
        terrain: (tile.terrain ?? "plains") as Tile["terrain"],
        region: tile.region ?? "core"
      };
    }
  } else {
    for (let q = 0; q < width; q += 1) {
      for (let r = 0; r < height; r += 1) {
        const region = r < Math.ceil(height / 2) ? "north" : "south";
        tiles[`${q},${r}`] = { terrain: "plains", region };
      }
    }
  }

  const units: Record<string, Unit> = {};
  for (const [id, unit] of Object.entries(configMap?.units ?? {})) {
    const def = UNITS[unit.type];
    units[id] = {
      id,
      type: unit.type,
      ownerId: unit.ownerId,
      position: unit.position,
      maxHp: unit.maxHp ?? def.maxHp,
      hp: unit.hp ?? def.maxHp,
      movementRemaining: unit.movementRemaining ?? def.movement,
      veterancy: unit.veterancy ?? "recruit"
    };
  }

  return {
    width,
    height,
    tiles,
    rivers: configMap?.rivers ?? {},
    regions: configMap?.regions ?? Array.from(new Set(Object.values(tiles).map((t) => t.region))),
    cities: Object.fromEntries(
      Object.entries(configMap?.cities ?? {}).map(([id, city]) => [
        id,
        {
          id: city.id,
          ownerId: city.ownerId,
          position: city.position,
          population: city.population,
          hp: city.hp ?? 40,
          maxHp: city.maxHp ?? 40,
          isCapital: city.isCapital ?? false,
          food: city.food ?? 0,
          buildings: city.buildings ?? [],
          production: city.production ?? 0,
          queue: city.queue ?? []
        }
      ])
    ),
    units
  };
}

function syncOwnershipIndexes(state: GameState): void {
  for (const player of state.players) {
    player.cityIds = [];
    player.unitIds = [];
  }

  for (const city of Object.values(state.map.cities)) {
    const owner = state.playersById[city.ownerId];
    if (owner) owner.cityIds.push(city.id);
  }

  for (const unit of Object.values(state.map.units)) {
    const owner = state.playersById[unit.ownerId];
    if (owner) owner.unitIds.push(unit.id);
  }
}

function randomWeather(roll: number): WeatherType {
  if (roll < 0.5) return "clear";
  if (roll < 0.7) return "rain";
  if (roll < 0.85) return "fog";
  if (roll < 0.93) return "storm";
  return "heat";
}

function generateWeatherByRegion(state: GameState, turn: number): Record<string, WeatherType> {
  const result: Record<string, WeatherType> = {};
  const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
  for (const region of regions) {
    const rand = seededRandom(state.seed, `weather:${turn}:${region}`);
    result[region] = randomWeather(rand());
  }
  return result;
}

function getCurrentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex];
}

function assertPlayerTurn(state: GameState, playerId: string): void {
  const current = getCurrentPlayer(state);
  if (current.id !== playerId) {
    throw new Error(`Not this player's turn. Expected ${current.id}, got ${playerId}`);
  }
}

function tileAt(state: GameState, coord: Coord): Tile {
  const tile = state.map.tiles[keyOf(coord)];
  if (!tile) throw new Error(`Unknown tile ${keyOf(coord)}`);
  return tile;
}

function unitAt(state: GameState, unitId: string): Unit {
  const unit = state.map.units[unitId];
  if (!unit) throw new Error(`Unknown unit ${unitId}`);
  return unit;
}

function cityAt(state: GameState, cityId: string): City {
  const city = state.map.cities[cityId];
  if (!city) throw new Error(`Unknown city ${cityId}`);
  return city;
}

function movementBudgetFor(unit: Unit): number {
  return UNITS[unit.type].movement;
}

function applyMovement(state: GameState, action: MoveUnitAction): void {
  const unit = unitAt(state, action.unitId);
  assertPlayerTurn(state, action.playerId);
  if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");

  const start = unit.position;
  const destination = action.destination;
  const unitDef = UNITS[unit.type];
  const path =
    action.path ??
    findPath(
      state,
      {
        ownerId: unit.ownerId,
        domain: unitDef.domain,
        mounted: unitDef.mounted
      },
      start,
      destination
    );

  if (!path || path.length < 2) throw new Error("No valid path to destination");

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const step = movementCost(
      state,
      { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
      path[i],
      path[i + 1]
    );
    if (!Number.isFinite(step)) throw new Error("Path uses impassable terrain");
    totalCost += step;
  }

  if (totalCost > unit.movementRemaining) {
    throw new Error(`Insufficient movement: needs ${totalCost}, has ${unit.movementRemaining}`);
  }

  unit.position = destination;
  unit.movementRemaining -= totalCost;

  const destinationTile = tileAt(state, destination);
  if (destinationTile.terrain === "desert" && !state.playersById[unit.ownerId].techs.includes("caravan-logistics")) {
    const heatPenalty = state.weather.current[destinationTile.region] === "heat" ? 2 : 1;
    unit.hp = Math.max(1, unit.hp - heatPenalty);
  }
}

function veterancyMultiplier(veterancy: Veterancy): number {
  if (veterancy === "veteran") return 1.1;
  if (veterancy === "elite") return 1.2;
  return 1;
}

function defenderTerrainBonus(state: GameState, defender: Unit): number {
  return TERRAIN[tileAt(state, defender.position).terrain].defense || 0;
}

function flankingBonus(state: GameState, attacker: Unit, defender: Unit): number {
  let adjacentAllies = 0;
  for (const n of neighborsOf(defender.position)) {
    for (const maybeAlly of Object.values(state.map.units)) {
      if (maybeAlly.id === attacker.id) continue;
      if (maybeAlly.ownerId !== attacker.ownerId) continue;
      if (maybeAlly.hp <= 0) continue;
      if (maybeAlly.position.q === n.q && maybeAlly.position.r === n.r) {
        adjacentAllies += 1;
      }
    }
  }
  return adjacentAllies * 0.1;
}

function riverAttackPenalty(state: GameState, attacker: Unit, defender: Unit): number {
  const k = edgeKey(attacker.position, defender.position);
  return state.map.rivers[k] ? 0.25 : 0;
}

const pct = (n: number): string => `${n >= 0 ? "+" : "−"}${Math.round(Math.abs(n) * 100)}%`;
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function categoryOf(unit: Unit): string {
  return UNITS[unit.type].category || "infantry";
}

// A unit fights as part of a "force": itself, anything stacked on its tile, and
// friendly units adjacent to it. Diversity of roles grants a combined-arms bonus.
function combinedArmsBonus(state: GameState, attacker: Unit): { bonus: number; label: string | null } {
  // Combined-arms coordination is a learned doctrine (the manipular legion).
  const owner = state.playersById[attacker.ownerId];
  if (!owner || !owner.techs.includes("combined-arms")) return { bonus: 0, label: null };

  const zone = [attacker.position, ...neighborsOf(attacker.position)];
  const categories = new Set<string>();
  for (const unit of Object.values(state.map.units)) {
    if (unit.ownerId !== attacker.ownerId || unit.hp <= 0) continue;
    if (zone.some((c) => c.q === unit.position.q && c.r === unit.position.r)) {
      categories.add(categoryOf(unit));
    }
  }
  const hasMelee = [...categories].some((c) => MELEE_CATEGORIES.has(c));
  const hasRanged = [...categories].some((c) => RANGED_CATEGORIES.has(c));
  const hasMounted = categories.has("mounted");
  if (hasMelee && hasRanged && hasMounted) return { bonus: 0.15, label: "Combined arms +15%" };
  if (hasMelee && hasRanged) return { bonus: 0.1, label: "Supported +10%" };
  return { bonus: 0, label: null };
}

// A land unit sitting on a water tile is "embarked" (aboard transports): it is
// derived from position, so no stored flag is needed. Embarked units are soft
// targets and cannot themselves attack until they land.
export function isEmbarked(state: GameState, unit: Unit): boolean {
  const def = UNITS[unit.type];
  if (!def || def.domain !== "land") return false;
  const tile = state.map.tiles[keyOf(unit.position)];
  return !!tile && (tile.terrain === "coast" || tile.terrain === "sea");
}

export function computeCombatPreview(state: GameState, attackerId: string, defenderId: string): CombatPreview {
  const attacker = unitAt(state, attackerId);
  const defender = unitAt(state, defenderId);
  const attackerDef = UNITS[attacker.type];
  const defenderDef = UNITS[defender.type];

  if (distance(attacker.position, defender.position) > attackerDef.range) {
    throw new Error("Defender is out of range");
  }

  const defenderTile = tileAt(state, defender.position);
  const weather = state.weather.current[defenderTile.region] || "clear";
  const atkCat = categoryOf(attacker);
  const defCat = categoryOf(defender);
  const modifiers: string[] = [];

  let attackMult = veterancyMultiplier(attacker.veterancy);
  const flank = flankingBonus(state, attacker, defender);
  if (flank > 0) {
    attackMult += flank;
    modifiers.push(`Flanking ${pct(flank)}`);
  }
  const river = riverAttackPenalty(state, attacker, defender);
  if (river > 0) {
    attackMult -= river;
    modifiers.push(`River crossing ${pct(-river)}`);
  }
  const counterAtk = (attackerDef.counters && attackerDef.counters[defCat]) || 0;
  if (counterAtk > 0) {
    attackMult += counterAtk;
    modifiers.push(`${cap(CATEGORY_LABELS[atkCat] || atkCat)} vs ${CATEGORY_LABELS[defCat] || defCat} ${pct(counterAtk)}`);
  }
  const combined = combinedArmsBonus(state, attacker);
  if (combined.bonus > 0) {
    attackMult += combined.bonus;
    modifiers.push(combined.label as string);
  }

  const terrainBonus = defenderTerrainBonus(state, defender);
  let defenseMult = terrainBonus + veterancyMultiplier(defender.veterancy);
  if (terrainBonus > 0) modifiers.push(`Enemy terrain ${pct(terrainBonus)}`);
  const counterDef = (defenderDef.counters && defenderDef.counters[atkCat]) || 0;
  if (counterDef > 0) {
    defenseMult += counterDef;
    modifiers.push(`Enemy ${CATEGORY_LABELS[defCat] || defCat} vs ${CATEGORY_LABELS[atkCat] || atkCat} ${pct(counterDef)}`);
  }

  const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
  let defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);
  // An army caught embarked at sea is desperately exposed to warships.
  if (isEmbarked(state, defender)) {
    defPower *= 0.4;
    modifiers.push("Embarked at sea −60%");
  }

  let damageToDefender = Math.max(1, Math.round((20 * atkPower) / (atkPower + defPower)));
  let damageToAttacker = Math.max(0, Math.round((14 * defPower) / (atkPower + defPower)));

  if (weather === "fog") {
    damageToDefender = Math.max(1, Math.round(damageToDefender * 0.95));
    modifiers.push("Fog −5%");
  }

  const rangedNoRetaliation = attackerDef.range > 1 && distance(attacker.position, defender.position) > 1;
  if (rangedNoRetaliation) {
    damageToAttacker = 0;
    modifiers.push("Ranged — no retaliation");
  }

  return {
    damageToDefender,
    damageToAttacker,
    attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
    defenderRemainingHp: Math.max(0, defender.hp - damageToDefender),
    modifiers
  };
}

function applyCombat(state: GameState, action: Extract<GameAction, { type: "ATTACK" }>): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const defender = unitAt(state, action.defenderId);
  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack with enemy unit");
  if (defender.ownerId === action.playerId) throw new Error("Cannot attack friendly unit");
  if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can fight");

  const preview = computeCombatPreview(state, attacker.id, defender.id);
  attacker.hp = preview.attackerRemainingHp;
  defender.hp = preview.defenderRemainingHp;
  attacker.movementRemaining = 0;

  if (defender.hp <= 0) {
    delete state.map.units[defender.id];
    const defenderOwner = state.playersById[defender.ownerId];
    defenderOwner.unitIds = defenderOwner.unitIds.filter((id) => id !== defender.id);

    if (attacker.veterancy === "recruit") attacker.veterancy = "veteran";
    else if (attacker.veterancy === "veteran") attacker.veterancy = "elite";
  }

  if (attacker.hp <= 0) {
    delete state.map.units[attacker.id];
    const attackerOwner = state.playersById[attacker.ownerId];
    attackerOwner.unitIds = attackerOwner.unitIds.filter((id) => id !== attacker.id);
  }
}

function computeCityAttackDamage(state: GameState, attacker: Unit, city: City): number {
  const attackerDef = UNITS[attacker.type];
  const cityTile = tileAt(state, city.position);
  const weather = state.weather.current[cityTile.region] || "clear";

  const weatherMult = weather === "fog" ? 0.95 : 1;
  const siegeMult = 1 + (attackerDef.siegeBonus ?? 0);
  const attackPower =
    attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult * siegeMult;
  const cityDefense = 22 + city.population * 3;

  return Math.max(1, Math.round((18 * attackPower) / (attackPower + cityDefense)));
}

function applyAttackCity(state: GameState, action: AttackCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const city = cityAt(state, action.cityId);

  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack city with enemy unit");
  if (city.ownerId === action.playerId) throw new Error("Cannot attack friendly city");
  if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can assault a city");

  const attackerDef = UNITS[attacker.type];
  if (distance(attacker.position, city.position) > attackerDef.range) {
    throw new Error("City is out of range");
  }

  const damage = computeCityAttackDamage(state, attacker, city);
  city.hp = Math.max(0, city.hp - damage);
  city.lastAttackedTurn = state.turn; // besieged cities don't heal this turn
  attacker.movementRemaining = 0;

  if (city.hp <= 0) {
    city.ownerId = attacker.ownerId;
    city.population = Math.max(1, city.population - 1);
    city.hp = Math.ceil(city.maxHp * 0.6);
    syncOwnershipIndexes(state);
  }
}

/** True if this player belongs to the given civ id (matches the lowercase id or
 *  the display name), used to gate civ-unique techs and units. */
export function playerControlsCiv(player: Player, civId: string): boolean {
  if (!civId) return true;
  const want = civId.toLowerCase();
  return player.id.toLowerCase() === want || (player.civ || "").toLowerCase() === want;
}

export function canResearch(player: Player, techId: string): boolean {
  const tech = TECHS[techId];
  if (!tech) throw new Error(`Unknown tech ${techId}`);
  if (player.techs.includes(techId)) return false;

  // Civ-unique techs are researchable only by the people they belong to.
  if (tech.civ && !playerControlsCiv(player, tech.civ)) return false;

  for (const prereq of tech.prerequisites) {
    if (!player.techs.includes(prereq)) return false;
  }

  if (tech.forkGroup) {
    const chosenBranch = player.forkChoices[tech.forkGroup];
    if (chosenBranch && chosenBranch !== tech.forkBranch) return false;
  }

  return true;
}

function applyResearch(state: GameState, action: ResearchTechAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  if (!canResearch(player, action.techId)) {
    throw new Error(`Cannot research tech ${action.techId}`);
  }

  const cost = researchCost(action.techId);
  if (player.science < cost) {
    throw new Error(`Insufficient science for ${action.techId}: needs ${cost}, has ${player.science}`);
  }
  player.science -= cost;

  player.techs.push(action.techId);
  const tech = TECHS[action.techId];
  if (tech.forkGroup && !player.forkChoices[tech.forkGroup]) {
    player.forkChoices[tech.forkGroup] = tech.forkBranch || "";
  }
}

function applyChooseFork(state: GameState, action: ChooseForkAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  if (player.forkChoices[action.forkGroup] && player.forkChoices[action.forkGroup] !== action.branch) {
    throw new Error(`Fork already chosen for ${action.forkGroup}`);
  }
  player.forkChoices[action.forkGroup] = action.branch;
}

const MAX_POPULATION = 8;

// Food needed to grow from the current population to the next level.
function growthCost(population: number): number {
  return 8 + population * 6;
}

export function researchCost(techId: string): number {
  const tech = TECHS[techId];
  if (tech && typeof tech.cost === "number") return tech.cost;
  const age = tech ? tech.age : 1;
  return age === 1 ? 18 : age === 2 ? 36 : 60;
}

export function computeCityYield(
  state: GameState,
  cityId: string
): { food: number; production: number; gold: number; science: number } {
  const city = state.map.cities[cityId];
  if (!city) throw new Error(`Unknown city ${cityId}`);

  const centerTile = tileAt(state, city.position);
  const terrainYield = TERRAIN[centerTile.terrain].yields;
  const owner = state.playersById[city.ownerId];
  const pop = city.population;
  const writingBonus = owner && owner.techs.includes("writing") ? 1 : 0;

  const yields = {
    food: terrainYield.food + pop,
    production: terrainYield.production + Math.ceil(pop / 2) + 1,
    gold: terrainYield.gold + Math.floor(pop / 2) + 1,
    science: 2 + pop + writingBonus
  };

  for (const buildingId of city.buildings ?? []) {
    const b = BUILDINGS[buildingId];
    if (!b) continue;
    if (b.yields) {
      yields.food += b.yields.food ?? 0;
      yields.production += b.yields.production ?? 0;
      yields.gold += b.yields.gold ?? 0;
      yields.science += b.yields.science ?? 0;
    }
    // Trade-network buildings (harbours) earn more the more of them you hold —
    // a shipping lane needs ports at both ends. Count the owner's other copies.
    if (b.networkGold && owner) {
      const network = owner.cityIds.reduce((n, id) => {
        const c = state.map.cities[id];
        return n + (c && (c.buildings ?? []).includes(buildingId) ? 1 : 0);
      }, 0);
      yields.gold += b.networkGold * Math.max(0, network - 1);
    }
  }

  // Worked tile improvements in this city's slice of territory (each improved
  // tile counts for whichever city claims it, so borders never double-count).
  for (const key of tileKeysWithin(city.position, cityTerritoryRadius(city))) {
    const tile = state.map.tiles[key];
    if (!tile || !tile.improvement) continue;
    const imp = IMPROVEMENTS[tile.improvement];
    if (!imp) continue;
    const claim = claimingCity(state, parseKey(key));
    if (!claim || claim.id !== cityId) continue;
    yields.food += imp.yields.food ?? 0;
    yields.production += imp.yields.production ?? 0;
    yields.gold += imp.yields.gold ?? 0;
    yields.science += imp.yields.science ?? 0;
  }
  return yields;
}

// Axial tile keys within `radius` hexes of a centre that actually exist.
function tileKeysWithin(center: Coord, radius: number): string[] {
  const keys: string[] = [];
  for (let dq = -radius; dq <= radius; dq += 1) {
    for (let dr = -radius; dr <= radius; dr += 1) {
      if (distance({ q: 0, r: 0 }, { q: dq, r: dr }) > radius) continue;
      keys.push(`${center.q + dq},${center.r + dr}`);
    }
  }
  return keys;
}

// A city touches the sea if any neighbouring tile is coast or open water.
export function isCoastalCity(state: GameState, cityId: string): boolean {
  const city = state.map.cities[cityId];
  if (!city) return false;
  return neighborsOf(city.position).some((n) => {
    const tile = state.map.tiles[keyOf(n)];
    return tile && (tile.terrain === "coast" || tile.terrain === "sea");
  });
}

// A queue item is a unit type, a building id, or a tile improvement encoded as
// "imp:<type>:<q,r>" (they never collide).
export const ROAD_COST = 8;

export function productionItemCost(id: string): number {
  if (UNITS[id]) return UNIT_BUILD_COSTS[id] ?? Infinity;
  if (BUILDINGS[id]) return BUILDINGS[id].cost;
  if (id.startsWith("imp:")) {
    const type = id.split(":")[1];
    return IMPROVEMENTS[type]?.cost ?? Infinity;
  }
  if (id.startsWith("road:")) return ROAD_COST;
  return Infinity;
}

// Pick an empty water tile next to a coastal city to launch a new ship. Falls
// back to the city tile if the city is somehow landlocked or the water is full.
function navalLaunchTile(state: GameState, city: City): Coord {
  const occupied = new Set(Object.values(state.map.units).map((u) => keyOf(u.position)));
  for (const n of neighborsOf(city.position)) {
    const tile = state.map.tiles[keyOf(n)];
    if (!tile) continue;
    if (tile.terrain !== "coast" && tile.terrain !== "sea") continue;
    if (occupied.has(keyOf(n))) continue;
    return n;
  }
  return { ...city.position };
}

function completeQueueItem(state: GameState, city: City, id: string): void {
  if (UNITS[id]) {
    const def = UNITS[id];
    let counter = 1;
    let unitId = `${city.ownerId}_${id}_${state.turn}_${city.id}_${counter}`;
    while (state.map.units[unitId]) {
      counter += 1;
      unitId = `${city.ownerId}_${id}_${state.turn}_${city.id}_${counter}`;
    }
    // Ships launch into adjacent water, not onto the city's land tile.
    const spawn = def.domain === "naval" ? navalLaunchTile(state, city) : { ...city.position };
    state.map.units[unitId] = {
      id: unitId,
      type: id,
      ownerId: city.ownerId,
      position: spawn,
      hp: def.maxHp,
      maxHp: def.maxHp,
      movementRemaining: 0,
      veterancy: "recruit"
    };
    syncOwnershipIndexes(state);
  } else if (BUILDINGS[id] && !(city.buildings ?? []).includes(id)) {
    city.buildings = [...(city.buildings ?? []), id];
    const cityHp = BUILDINGS[id].cityHp;
    if (cityHp) {
      city.maxHp += cityHp;
      city.hp += cityHp;
    }
  } else if (id.startsWith("imp:")) {
    const [, type, coordKey] = id.split(":");
    const tile = coordKey ? state.map.tiles[coordKey] : undefined;
    if (tile && IMPROVEMENTS[type] && !tile.improvement) tile.improvement = type;
  } else if (id.startsWith("road:")) {
    const coordKey = id.slice("road:".length);
    const tile = state.map.tiles[coordKey];
    if (tile) tile.road = true;
  }
}

// Bank the turn's production, then finish as many queued items as it can afford.
function processCityQueue(state: GameState, city: City): void {
  city.queue = city.queue ?? [];
  let guard = 0;
  while (city.queue.length > 0 && guard < 32) {
    guard += 1;
    const id = city.queue[0];
    if (BUILDINGS[id] && (city.buildings ?? []).includes(id)) {
      city.queue.shift(); // already built elsewhere — discard
      continue;
    }
    if (id.startsWith("imp:")) {
      const coordKey = id.split(":")[2];
      const t = coordKey ? state.map.tiles[coordKey] : undefined;
      if (!t || t.improvement) {
        city.queue.shift(); // tile gone or already improved — discard
        continue;
      }
    }
    if (id.startsWith("road:")) {
      const t = state.map.tiles[id.slice("road:".length)];
      if (!t || t.road) {
        city.queue.shift(); // tile gone or already roaded — discard
        continue;
      }
    }
    const cost = productionItemCost(id);
    if (!Number.isFinite(cost) || (city.production ?? 0) < cost) break;
    city.production = (city.production ?? 0) - cost;
    completeQueueItem(state, city, id);
    city.queue.shift();
  }
}

function enqueueProduction(city: City, id: string): void {
  city.queue = [...(city.queue ?? []), id];
}

function applyBuildBuilding(state: GameState, action: BuildBuildingAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot build in an enemy city");
  const building = BUILDINGS[action.buildingId];
  if (!building) throw new Error(`Unknown building ${action.buildingId}`);
  if ((city.buildings ?? []).includes(action.buildingId)) throw new Error(`${action.buildingId} already built`);
  if ((city.queue ?? []).includes(action.buildingId)) throw new Error(`${action.buildingId} already queued`);

  const player = state.playersById[action.playerId];
  if (building.requiresTech && !player.techs.includes(building.requiresTech)) {
    throw new Error(`Building ${action.buildingId} requires tech ${building.requiresTech}`);
  }
  if (building.coastalOnly && !isCoastalCity(state, action.cityId)) {
    throw new Error(`Building ${action.buildingId} can only be raised in a coastal city`);
  }
  enqueueProduction(city, action.buildingId);
}

function applyUnqueueProduction(state: GameState, action: UnqueueProductionAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot edit an enemy city's queue");
  if (!city.queue || action.index < 0 || action.index >= city.queue.length) return;
  city.queue = city.queue.filter((_, i) => i !== action.index);
}

// Denarii can hurry the front of the build queue: pay coin for the production
// still missing and the item completes at once (this turn), without waiting for
// labour to accrue over several turns.
export const RUSH_GOLD_PER_PRODUCTION = 4;

export function rushProductionCost(
  state: GameState,
  cityId: string
): { itemId: string; missingProduction: number; goldCost: number } | null {
  const city = state.map.cities[cityId];
  if (!city || !city.queue || city.queue.length === 0) return null;
  const itemId = city.queue[0];
  const cost = productionItemCost(itemId);
  if (!Number.isFinite(cost)) return null;
  const missing = Math.max(0, cost - (city.production ?? 0));
  return { itemId, missingProduction: missing, goldCost: Math.ceil(missing * RUSH_GOLD_PER_PRODUCTION) };
}

function applyRushProduction(state: GameState, action: RushProductionAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot rush an enemy city's queue");
  const rush = rushProductionCost(state, action.cityId);
  if (!rush) throw new Error("Nothing to rush");
  const player = state.playersById[action.playerId];
  if (player.gold < rush.goldCost) throw new Error("Not enough denarii to rush");
  player.gold -= rush.goldCost;
  // Top the city's production up to the front item's cost, then build it now.
  const cost = productionItemCost(rush.itemId);
  city.production = Math.max(city.production ?? 0, cost);
  processCityQueue(state, city);
}

// --- Trade routes -------------------------------------------------------------

// A route still earns only while its home city is held by the owner and its
// destination still stands; drop the rest.
function tradeRouteIsLive(state: GameState, route: { ownerId: string; fromCityId: string; toCityId: string }): boolean {
  const from = state.map.cities[route.fromCityId];
  const to = state.map.cities[route.toCityId];
  return !!from && from.ownerId === route.ownerId && !!to;
}

function pruneTradeRoutes(state: GameState): void {
  state.tradeRoutes = (state.tradeRoutes ?? []).filter((r) => tradeRouteIsLive(state, r));
}

export function tradeRouteIncome(state: GameState, playerId: string): number {
  let gold = 0;
  for (const route of state.tradeRoutes ?? []) {
    if (route.ownerId !== playerId) continue;
    if (tradeRouteIsLive(state, route)) gold += route.gold;
  }
  return gold;
}

// Gold/turn a would-be route earns: base + half the distance between the two
// cities, plus a premium for reaching a foreign market.
export function tradeRouteValue(distanceBetween: number, foreign: boolean): number {
  return Math.max(2, Math.min(15, 2 + Math.floor(distanceBetween / 2) + (foreign ? 3 : 0)));
}

function applyEstablishTradeRoute(state: GameState, action: EstablishTradeRouteAction): void {
  assertPlayerTurn(state, action.playerId);
  if (!state.tradeRoutes) state.tradeRoutes = [];
  const merchant = unitAt(state, action.merchantId);
  if (merchant.ownerId !== action.playerId) throw new Error("Cannot use an enemy merchant");
  if (merchant.type !== "merchant") throw new Error("Only a merchant can open a trade route");

  const dest = state.map.cities[action.cityId];
  if (!dest) throw new Error(`Unknown destination city ${action.cityId}`);
  if (distance(merchant.position, dest.position) > 1) {
    throw new Error("The merchant must stand at or beside the destination city");
  }

  // Anchor the route at the owner's nearest other city.
  const player = state.playersById[action.playerId];
  let home: City | null = null;
  let bestDist = Infinity;
  for (const cityId of player.cityIds) {
    if (cityId === dest.id) continue;
    const city = state.map.cities[cityId];
    if (!city) continue;
    const d = distance(city.position, dest.position);
    if (d < bestDist) {
      bestDist = d;
      home = city;
    }
  }
  if (!home) throw new Error("You need another city to anchor the trade route");

  const duplicate = state.tradeRoutes.some(
    (r) =>
      r.ownerId === action.playerId &&
      ((r.fromCityId === home!.id && r.toCityId === dest.id) ||
        (r.fromCityId === dest.id && r.toCityId === home!.id))
  );
  if (duplicate) throw new Error("That trade route already exists");

  const foreign = dest.ownerId !== action.playerId;
  const gold = tradeRouteValue(distance(home.position, dest.position), foreign);
  state.tradeRoutes.push({ ownerId: action.playerId, fromCityId: home.id, toCityId: dest.id, gold });

  // The caravan settles into the route — the merchant is spent.
  delete state.map.units[merchant.id];
  syncOwnershipIndexes(state);
}

function applyImproveTile(state: GameState, action: ImproveTileAction): void {
  assertPlayerTurn(state, action.playerId);
  const tile = state.map.tiles[action.tileKey];
  if (!tile) throw new Error(`Unknown tile ${action.tileKey}`);
  if (tile.terrain === "sea" || tile.terrain === "coast") throw new Error("Cannot build on open water");
  const claim = claimingCity(state, parseKey(action.tileKey));
  if (!claim || claim.ownerId !== action.playerId) throw new Error("That tile is not in your territory");
  if (claim.id !== action.cityId) throw new Error("That city does not work this tile");

  // Roads live alongside a worked improvement (a farm can have a road too).
  if (action.improvement === "road") {
    if (tile.road) throw new Error("That tile already has a road");
    const item = `road:${action.tileKey}`;
    if ((claim.queue ?? []).includes(item)) throw new Error("A road is already queued for that tile");
    enqueueProduction(claim, item);
    return;
  }

  const rule = IMPROVEMENTS[action.improvement];
  if (!rule) throw new Error(`Unknown improvement ${action.improvement}`);
  if (tile.improvement) throw new Error("That tile is already improved");
  if (!rule.terrains.includes(tile.terrain)) {
    throw new Error(`${action.improvement} cannot be built on ${tile.terrain}`);
  }
  const owner = state.playersById[action.playerId];
  if (rule.requiresTech && !owner.techs.includes(rule.requiresTech)) {
    throw new Error(`${action.improvement} requires tech ${rule.requiresTech}`);
  }
  const item = `imp:${action.improvement}:${action.tileKey}`;
  const queued = (claim.queue ?? []).some((q) => q.startsWith("imp:") && q.endsWith(`:${action.tileKey}`));
  if (queued) throw new Error("An improvement is already queued for that tile");
  enqueueProduction(claim, item);
}

export const HEAL_IN_CITY = 8;
export const HEAL_IN_TERRITORY = 4;
export const HEAL_IN_FIELD = 1;
export const CITY_REGEN = 3;

// How much a unit would heal if left to rest this turn (0 if it is at full HP
// or has already moved/fought). Location decides the rate.
export function restHealAmount(state: GameState, unit: Unit): number {
  if (unit.hp >= unit.maxHp) return 0;
  if (unit.movementRemaining < movementBudgetFor(unit)) return 0; // it moved or fought
  const cityHere = Object.values(state.map.cities).find(
    (c) => c.position.q === unit.position.q && c.position.r === unit.position.r
  );
  if (cityHere && cityHere.ownerId === unit.ownerId) return HEAL_IN_CITY;
  const claim = claimingCity(state, unit.position);
  return claim && claim.ownerId === unit.ownerId ? HEAL_IN_TERRITORY : HEAL_IN_FIELD;
}

function applyEndTurn(state: GameState, action: EndTurnAction): void {
  assertPlayerTurn(state, action.playerId);
  const endingPlayer = getCurrentPlayer(state);

  const mult = aiEconomyMultiplier(state, endingPlayer.id);
  for (const cityId of endingPlayer.cityIds) {
    const yields = computeCityYield(state, cityId);
    endingPlayer.gold += Math.round(yields.gold * mult);
    endingPlayer.science += Math.round(yields.science * mult);

    const city = state.map.cities[cityId];
    if (city) {
      // Food is banked per-city and grows population when it fills the bar.
      city.food = (city.food ?? 0) + Math.round(yields.food * mult);
      let need = growthCost(city.population);
      while (city.population < MAX_POPULATION && city.food >= need) {
        city.food -= need;
        city.population += 1;
        need = growthCost(city.population);
      }
      // Production is banked per-city and drives the build queue.
      city.production = (city.production ?? 0) + Math.round(yields.production * mult);
      processCityQueue(state, city);

      // A city left in peace repairs its walls; one under assault this turn does
      // not — so taking a city needs sustained, concentrated force, not a lone
      // unit chipping at it turn after turn.
      if (city.hp < city.maxHp && (city.lastAttackedTurn ?? -1) < state.turn) {
        city.hp = Math.min(city.maxHp, city.hp + CITY_REGEN);
      }
    }
  }

  const upkeep = endingPlayer.unitIds.reduce((sum, unitId) => {
    const unit = state.map.units[unitId];
    if (!unit) return sum;
    return sum + (UNITS[unit.type].upkeep || 0);
  }, 0);
  endingPlayer.gold -= upkeep;

  // Trade routes deliver their gold to the owner each turn (dead ones drop off).
  pruneTradeRoutes(state);
  endingPlayer.gold += tradeRouteIncome(state, endingPlayer.id);

  // Rest & recover: a unit that held its ground (didn't move or fight) heals —
  // fastest garrisoned in a friendly city, slower in home territory, a trickle
  // in the open field.
  for (const unitId of endingPlayer.unitIds) {
    const unit = state.map.units[unitId];
    if (!unit) continue;
    const amount = restHealAmount(state, unit);
    if (amount > 0) unit.hp = Math.min(unit.maxHp, unit.hp + amount);
  }

  state.currentPlayerIndex += 1;
  if (state.currentPlayerIndex >= state.players.length) {
    state.currentPlayerIndex = 0;
    state.turn += 1;
    state.weather.current = generateWeatherByRegion(state, state.turn);
    state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
  }

  const nextPlayer = getCurrentPlayer(state);
  for (const unitId of nextPlayer.unitIds) {
    const unit = state.map.units[unitId];
    if (!unit) continue;

    unit.movementRemaining = movementBudgetFor(unit);

    const unitTile = tileAt(state, unit.position);
    if (unit.type === "trireme" && unitTile.terrain === "sea" && state.weather.current[unitTile.region] === "storm") {
      unit.hp = Math.max(1, unit.hp - 2);
    }
  }

  maybeFireEvent(state, nextPlayer);
}

// Deterministically hand the next player a Crossroads dilemma now and then,
// spaced out so they don't pile up. The human sees a card; the AI auto-resolves.
function maybeFireEvent(state: GameState, player: Player): void {
  if (player.pendingEvent) return;
  if (player.cityIds.length === 0) return;
  const since = state.turn - (player.lastEventTurn ?? 0);
  if (state.turn < 3 || since < 5) return;
  const roll = seededRandom(state.seed, `event:${state.turn}:${player.id}`)();
  if (roll >= 0.3) return;
  const pick = Math.floor(seededRandom(state.seed, `eventpick:${state.turn}:${player.id}`)() * EVENTS.length);
  player.pendingEvent = EVENTS[Math.min(pick, EVENTS.length - 1)].id;
  player.lastEventTurn = state.turn;
}

function applyResolveEvent(state: GameState, action: ResolveEventAction): void {
  const player = state.playersById[action.playerId];
  if (!player) throw new Error(`Unknown player ${action.playerId}`);
  if (player.pendingEvent !== action.eventId) {
    throw new Error(`No pending event ${action.eventId} for ${action.playerId}`);
  }
  const event = getEvent(action.eventId);
  const option = event && event.options[action.optionIndex];
  if (!event || !option) throw new Error(`Invalid event option`);

  const capitalCity =
    player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) ||
    state.map.cities[player.cityIds[0]];

  const fx = option.effects;
  if (fx.gold) player.gold += fx.gold;
  if (fx.production && capitalCity) capitalCity.production = (capitalCity.production ?? 0) + fx.production;
  if (fx.science) player.science += fx.science;
  if (fx.food) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (city) city.food = (city.food ?? 0) + fx.food;
    }
  }
  if (fx.spawnUnit && UNITS[fx.spawnUnit]) {
    const capital =
      player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) ||
      state.map.cities[player.cityIds[0]];
    if (capital) {
      const def = UNITS[fx.spawnUnit];
      let counter = 1;
      let unitId = `${player.id}_${fx.spawnUnit}_event_${state.turn}_${counter}`;
      while (state.map.units[unitId]) {
        counter += 1;
        unitId = `${player.id}_${fx.spawnUnit}_event_${state.turn}_${counter}`;
      }
      state.map.units[unitId] = {
        id: unitId,
        type: fx.spawnUnit,
        ownerId: player.id,
        position: { ...capital.position },
        hp: def.maxHp,
        maxHp: def.maxHp,
        movementRemaining: 0,
        veterancy: "recruit"
      };
      syncOwnershipIndexes(state);
    }
  }

  player.pendingEvent = undefined;
}

function applyFoundCity(state: GameState, action: FoundCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const settler = unitAt(state, action.settlerId);
  if (settler.ownerId !== action.playerId) throw new Error("Cannot use enemy settler");
  if (settler.type !== "settler") throw new Error("Only settler can found a city");
  if (state.map.cities[action.cityId]) throw new Error(`City id ${action.cityId} already exists`);

  for (const city of Object.values(state.map.cities)) {
    if (city.position.q === settler.position.q && city.position.r === settler.position.r) {
      throw new Error("A city already exists on this tile");
    }
  }

  state.map.cities[action.cityId] = {
    id: action.cityId,
    ownerId: action.playerId,
    position: { ...settler.position },
    population: 1,
    hp: 40,
    maxHp: 40
  };

  delete state.map.units[settler.id];
  syncOwnershipIndexes(state);
}

// Recruiting a unit now enqueues it in the city's build queue; it completes over
// turns as the city banks production (see processCityQueue).
// The elite type a unit could upgrade into, if the owner qualifies (right civ,
// tech researched). Null if this unit has no upgrade available to this player.
export function upgradeTargetFor(player: Player, unit: Unit): string | null {
  for (const [type, rule] of Object.entries(UNITS)) {
    if (rule.upgradesFrom !== unit.type) continue;
    if (rule.civ && !playerControlsCiv(player, rule.civ)) continue;
    if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) continue;
    return type;
  }
  return null;
}

// Gold to upgrade — the difference in build cost, floored, plus a small premium.
export function upgradeCost(fromType: string, toType: string): number {
  const base = UNIT_BUILD_COSTS[toType] ?? 24;
  const had = UNIT_BUILD_COSTS[fromType] ?? 0;
  return Math.max(12, Math.round((base - had) * 1.5) + 12);
}

function applyUpgradeUnit(state: GameState, action: { playerId: string; unitId: string }): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  const unit = state.map.units[action.unitId];
  if (!unit) throw new Error(`Unknown unit ${action.unitId}`);
  if (unit.ownerId !== action.playerId) throw new Error("Cannot upgrade another player's unit");

  const target = upgradeTargetFor(player, unit);
  if (!target) throw new Error(`No upgrade available for ${unit.type}`);

  const cost = upgradeCost(unit.type, target);
  if (player.gold < cost) throw new Error(`Insufficient gold to upgrade: needs ${cost}, has ${player.gold}`);
  player.gold -= cost;

  const rule = UNITS[target];
  const frac = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
  unit.type = target;
  unit.maxHp = rule.maxHp;
  unit.hp = Math.max(1, Math.round(rule.maxHp * frac));
}

function applyBuildUnit(state: GameState, action: BuildUnitAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot build from enemy city");
  if (!UNITS[action.unitType]) throw new Error(`Unknown unit type ${action.unitType}`);

  const player = state.playersById[action.playerId];
  const unitRule = UNITS[action.unitType];
  if (unitRule.requiresTech && !player.techs.includes(unitRule.requiresTech)) {
    throw new Error(`Unit ${action.unitType} requires tech ${unitRule.requiresTech}`);
  }
  if (unitRule.civ && !playerControlsCiv(player, unitRule.civ)) {
    throw new Error(`Unit ${action.unitType} is unique to ${unitRule.civ}`);
  }
  if (unitRule.domain === "naval" && !isCoastalCity(state, action.cityId)) {
    throw new Error(`Ships can only be built in a coastal city`);
  }
  enqueueProduction(city, action.unitType);
}

export function createInitialGameState(config: CreateGameConfig = {}): GameState {
  const players = normalizePlayers(config.players);
  const map = normalizeMap(config.map);

  const state: GameState = {
    version: 1,
    seed: String(config.seed || "hegemon-seed"),
    turn: 1,
    turnLimit: config.turnLimit ?? 60,
    difficulty: config.difficulty ?? "normal",
    humanPlayerId: config.humanPlayerId ?? null,
    currentPlayerIndex: 0,
    players,
    playersById: makePlayersById(players),
    map,
    weather: { current: {}, forecast: {} },
    tradeRoutes: [],
    actionLog: []
  };

  syncOwnershipIndexes(state);
  state.weather.current = generateWeatherByRegion(state, state.turn);
  state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);

  return state;
}

const TERRITORY_RADIUS = 3; // the largest a city's borders can ever reach

// Borders grow with the city: a young settlement holds only the ring of hexes
// around it; a town reaches two out; a great city three. (Contested tiles still
// go to the nearest city, so growth only fills unclaimed room.)
export function cityTerritoryRadius(city: City): number {
  const pop = city.population || 1;
  if (pop <= 2) return 1;
  if (pop <= 5) return 2;
  return 3;
}

// Each city claims nearby tiles; contested tiles go to the closest city. Returns
// tileKey -> owning playerId. A pure function of city positions (not stored).
export function computeTerritory(state: GameState): Record<string, string> {
  const claim: Record<string, { owner: string; dist: number }> = {};
  // Only scan each city's own neighbourhood (not every tile on the map), so cost
  // is O(cities x radius^2) rather than O(cities x tiles) — huge maps stay fast.
  for (const city of Object.values(state.map.cities)) {
    const rad = cityTerritoryRadius(city);
    for (let dq = -rad; dq <= rad; dq += 1) {
      for (let dr = -rad; dr <= rad; dr += 1) {
        const d = distance({ q: 0, r: 0 }, { q: dq, r: dr });
        if (d > rad) continue;
        const key = `${city.position.q + dq},${city.position.r + dr}`;
        const tile = state.map.tiles[key];
        // Open sea is nobody's land — only coastline and dry ground get claimed.
        if (!tile || tile.terrain === "sea") continue;
        const existing = claim[key];
        if (!existing || d < existing.dist) claim[key] = { owner: city.ownerId, dist: d };
      }
    }
  }
  const result: Record<string, string> = {};
  for (const [key, v] of Object.entries(claim)) result[key] = v.owner;
  return result;
}

// The city that works a given tile: the nearest city within the territory
// radius (ties to the first found), or null if the tile is unclaimed.
export function claimingCity(state: GameState, coord: Coord): City | null {
  let best: City | null = null;
  let bestDist = Infinity;
  for (const city of Object.values(state.map.cities)) {
    const d = distance(city.position, coord);
    if (d > cityTerritoryRadius(city)) continue;
    if (d < bestDist) {
      bestDist = d;
      best = city;
    }
  }
  return best;
}

// Difficulty is a per-turn economic handicap on every non-human player. The
// human (state.humanPlayerId) is always unaffected — "hard" means the AI grows
// faster, "easy" means it grows slower. A pure multiplier keeps it deterministic.
const DIFFICULTY_AI_MULTIPLIER: Record<string, number> = {
  easy: 0.7,
  normal: 1,
  hard: 1.4
};

export function aiEconomyMultiplier(state: GameState, playerId: string): number {
  if (!state.humanPlayerId || playerId === state.humanPlayerId) return 1;
  return DIFFICULTY_AI_MULTIPLIER[state.difficulty] ?? 1;
}

export function computePlayerIncome(
  state: GameState,
  playerId: string
): { food: number; production: number; gold: number; science: number } {
  const player = state.playersById[playerId];
  const income = { food: 0, production: 0, gold: 0, science: 0 };
  if (!player) return income;
  const mult = aiEconomyMultiplier(state, playerId);
  for (const cityId of player.cityIds) {
    if (!state.map.cities[cityId]) continue;
    const y = computeCityYield(state, cityId);
    income.food += Math.round(y.food * mult);
    income.production += Math.round(y.production * mult);
    income.gold += Math.round(y.gold * mult);
    income.science += Math.round(y.science * mult);
  }
  const upkeep = player.unitIds.reduce((sum, id) => sum + (state.map.units[id] ? UNITS[state.map.units[id].type].upkeep || 0 : 0), 0);
  income.gold -= upkeep;
  income.gold += tradeRouteIncome(state, playerId);
  return income;
}

// Score = cities + population + tech + army + claimed land. Drives the ranking.
export function computeScores(state: GameState): Record<string, number> {
  const territory = computeTerritory(state);
  const land: Record<string, number> = {};
  for (const owner of Object.values(territory)) land[owner] = (land[owner] ?? 0) + 1;

  const scores: Record<string, number> = {};
  for (const player of state.players) {
    const population = player.cityIds.reduce((s, id) => s + (state.map.cities[id]?.population ?? 0), 0);
    scores[player.id] =
      player.cityIds.length * 10 +
      population * 3 +
      player.techs.length * 6 +
      player.unitIds.length * 2 +
      (land[player.id] ?? 0) * 1 +
      Math.floor(player.gold / 10);
  }
  return scores;
}

export function getVictoryStatus(state: GameState): VictoryStatus {
  const capitals = Object.values(state.map.cities).filter((city) => city.isCapital);

  // Domination: one player holds every capital.
  if (capitals.length > 0) {
    const owner = capitals[0].ownerId;
    if (capitals.every((city) => city.ownerId === owner)) {
      return { winnerId: owner, type: "domination", reason: `${owner} controls all capitals` };
    }
  }

  // Score victory: once the turn limit is passed, the highest score wins.
  if (state.turnLimit && state.turn > state.turnLimit) {
    const scores = computeScores(state);
    let bestId: string | null = null;
    let best = -Infinity;
    for (const player of state.players) {
      const s = scores[player.id] ?? 0;
      if (s > best) {
        best = s;
        bestId = player.id;
      }
    }
    if (bestId) {
      return { winnerId: bestId, type: "score", reason: `${bestId} led on score at the turn limit (${state.turnLimit})` };
    }
  }

  return { winnerId: null, type: null, reason: null };
}

export function applyAction(inputState: GameState, action: GameAction): GameState {
  const state = deepClone(inputState);
  state.playersById = makePlayersById(state.players);

  switch (action.type) {
    case "MOVE_UNIT":
      applyMovement(state, action);
      break;
    case "ATTACK":
      applyCombat(state, action);
      break;
    case "RESEARCH_TECH":
      applyResearch(state, action);
      break;
    case "CHOOSE_FORK":
      applyChooseFork(state, action);
      break;
    case "END_TURN":
      applyEndTurn(state, action);
      break;
    case "FOUND_CITY":
      applyFoundCity(state, action);
      break;
    case "BUILD_UNIT":
      applyBuildUnit(state, action);
      break;
    case "ATTACK_CITY":
      applyAttackCity(state, action);
      break;
    case "RESOLVE_EVENT":
      applyResolveEvent(state, action);
      break;
    case "BUILD_BUILDING":
      applyBuildBuilding(state, action);
      break;
    case "UNQUEUE_PRODUCTION":
      applyUnqueueProduction(state, action);
      break;
    case "RUSH_PRODUCTION":
      applyRushProduction(state, action);
      break;
    case "ESTABLISH_TRADE_ROUTE":
      applyEstablishTradeRoute(state, action);
      break;
    case "IMPROVE_TILE":
      applyImproveTile(state, action);
      break;
    case "UPGRADE_UNIT":
      applyUpgradeUnit(state, action);
      break;
    default: {
      const unknownAction: never = action;
      throw new Error(`Unsupported action ${(unknownAction as { type: string }).type}`);
    }
  }

  state.actionLog.push({
    turn: inputState.turn,
    playerId: action.playerId,
    action
  });

  return state;
}

export function serializeState(state: GameState): string {
  return JSON.stringify(state);
}

export function deserializeState(serialized: string): GameState {
  return JSON.parse(serialized) as GameState;
}

export function replayActions(initialState: GameState, actions: GameAction[]): GameState {
  return actions.reduce((state, action) => applyAction(state, action), deepClone(initialState));
}

export {
  computeVisibility,
  movementCost,
  findPath,
  keyOf,
  parseKey,
  distance,
  WEATHER_STATES,
  TERRAIN,
  TECHS,
  UNITS,
  UNIT_BUILD_COSTS,
  BUILDINGS,
  IMPROVEMENTS,
  EVENTS,
  getEvent
};
