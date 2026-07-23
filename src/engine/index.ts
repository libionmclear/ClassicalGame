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
  IMPROVEMENTS,
  RESOURCES,
  BUILD_RESOURCE,
  BUILD_DISCOUNT,
  TECH_CITY_YIELD,
  TECH_STABILITY
} from "./data";
import { distance, edgeKey, keyOf, neighborsOf, parseKey } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import { seededRandom } from "./rng";
import { computeVisibility } from "./visibility";
import { EVENTS, getEvent } from "./events";
import { FIGURES, getFigure } from "./figures";
import type { FigureCtx, FigureEffects } from "./figures";
import { cityTier, districtSlots, districtType, districtName, districtForbidden, greatWork, greatWorkAllowed } from "./districts";
import { initDiplomacy, applyRelationDrift, adjustRelation, getRelation, giftRelationGain, enterWar, isAtWar, isOathbreaker, playerWarWeariness, napBlocksDeclaration, canProposeAgreement, haveMet, addAgreement, denounce, ensurePair, expireDiplomacy, hasAgreement, NAP_TURNS, ACCEPT_RELATION, DECLINE_RELATION, TRIBUTE_MIN_TURNS, TRIBUTE_MAX_TURNS, TRADE_PACT_GOLD, canDemandVassalage, establishVassalage, releaseVassal, isVassal, topOverlord, shouldRebel, VASSAL_GOLD_SHARE, fullAlliancesHeld, ALLIANCE_VICTORY_HOLD } from "./diplomacy";
import { scatterRuins } from "./mapgen";
import { excavateRuins } from "./discovery";
import { scatterVillages, PEOPLE_BY_ID, unitNear, applyVillageBenefit, BEFRIEND_COST, TRIBUTE_GAIN, CONQUEST_REPUTATION_HIT, DISPOSITIONS, rollReaction, souredDisposition, pillageOnThreaten, THREATEN_RAID_GOLD, leaderReactionBonus, explorerNear, EXPLORER_ENVOY_BONUS, befriendCostFor } from "./peoples";
import type { VillageDeed } from "./peoples";
import type { BefriendVillageAction, DemandTributeVillageAction, ConquerVillageAction, AbsorbVillageAction } from "./types";
import type { ResolveEventAction, ResolveRaidAction, ResolveFigureAction, BuildBuildingAction, UnqueueProductionAction, RushProductionAction, EstablishTradeRouteAction, ImproveTileAction, RenameCityAction, DisbandUnitAction, BuildDistrictAction, RepairDistrictAction, GiftGoldAction, DeclareWarAction, ProposeAgreementAction, ResolveProposalAction, OfferTributeAction, DenounceAction, ProposeVassalageAction, ReleaseVassalAction } from "./types";
import type { Raid, RaidReport } from "./types";
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
    unitIds: player.unitIds ?? [],
    ...(player.perks ? { perks: player.perks } : {})
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
      if (tile.improvement) tiles[key].improvement = tile.improvement;
      if (tile.road) tiles[key].road = tile.road;
      if (tile.resource) tiles[key].resource = tile.resource;
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

// Mediterranean climate: mostly clear skies and hot, dry summers; rain is the
// exception, not the rule; storms and fog are rare.
function randomWeather(roll: number): WeatherType {
  if (roll < 0.70) return "clear"; // 70%
  if (roll < 0.86) return "heat";  // 16% — the long dry summer
  if (roll < 0.93) return "rain";  // 7% — rain is the exception
  if (roll < 0.97) return "fog";   // 4%
  return "storm";                  // 3%
}

// A weather FRONT holds for several turns before it shifts, so rain settles in
// for a spell rather than flickering on and off every single turn. Fronts are
// staggered per region so the whole map doesn't change weather on the same turn.
const WEATHER_FRONT = 6;
function generateWeatherByRegion(state: GameState, turn: number): Record<string, WeatherType> {
  const result: Record<string, WeatherType> = {};
  const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
  for (const region of regions) {
    const phase = Math.floor(seededRandom(state.seed, `wphase:${region}`)() * WEATHER_FRONT);
    const epoch = Math.floor((turn + phase) / WEATHER_FRONT);
    const rand = seededRandom(state.seed, `weather:${epoch}:${region}`);
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

function movementBudgetFor(state: GameState, unit: Unit): number {
  const def = UNITS[unit.type];
  const owner = state.playersById[unit.ownerId];
  // Roads & Logistics — an imperial road network: land units march one tile more.
  const logistics = def.domain === "land" && (owner?.techs.includes("roads-logistics") ?? false) ? 1 : 0;
  // Slice 4: flat +move from branch techs / cards (movePlus, per-cat, +navalMovePlus).
  let bonus = playerPctMod(owner, "movePlus", def.category);
  if (def.domain === "naval") bonus += playerPctMod(owner, "navalMovePlus");
  return def.movement + logistics + bonus;
}

function applyMovement(state: GameState, action: MoveUnitAction): void {
  const unit = unitAt(state, action.unitId);
  assertPlayerTurn(state, action.playerId);
  if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");
  if (unit.garrison) throw new Error("A city garrison holds its post"); // free defenders don't march

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

  // A unit with its FULL movement may always take a single step onto an adjacent
  // passable tile, even when the terrain costs more than it has — otherwise a slow
  // unit (a siege engine with 1 move) gets permanently boxed in by rough ground.
  const oneStep = path.length === 2;
  const fresh = unit.movementRemaining >= unitDef.movement;
  if (totalCost > unit.movementRemaining && !(oneStep && fresh)) {
    throw new Error(`Insufficient movement: needs ${totalCost}, has ${unit.movementRemaining}`);
  }

  unit.position = destination;
  unit.movementRemaining = Math.max(0, unit.movementRemaining - totalCost);

  // Cities v3 §2: a combat unit entering an enemy district hex pillages it.
  const destKey = keyOf(destination);
  const unitDefCat = UNITS[unit.type];
  if (unitDefCat && unitDefCat.domain !== "civilian") {
    for (const c of Object.values(state.map.cities)) {
      if (c.ownerId === unit.ownerId) continue;
      const d = (c.districts ?? []).find((x) => x.hex === destKey && !x.pillaged);
      if (d) d.pillaged = true;
    }
  }

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

// −25% for a land unit assaulting from a great-river tile it's floating on (an embarked
// boat assault) — unless that tile carries a bridge, i.e. it crossed on dry land.
function greatRiverAssaultPenalty(state: GameState, attacker: Unit): number {
  const def = UNITS[attacker.type];
  if (def && def.domain === "naval") return 0; // ships fight on the river normally
  const at = state.map.tiles[keyOf(attacker.position)];
  return at && at.terrain === "great-river" && at.improvement !== "bridge" ? 0.25 : 0;
}

const pct = (n: number): string => `${n >= 0 ? "+" : "−"}${Math.round(Math.abs(n) * 100)}%`;
const cap = (s: string): string => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function categoryOf(unit: Unit): string {
  return UNITS[unit.type].category || "infantry";
}

// ===== Effect wiring, Slice 1 — generic combat % from branch techs + equipped cards =====
// The five original doctrines below keep their own bespoke logic in the combat calc,
// so exclude them here to avoid double-counting. Handles flat `atkPct`/`defPct`
// (optionally `infantryOnly`) and `unitCatPct:{cat, atkPct/defPct, vsCat}`. Effects
// gated by `condition` (e.g. fortified) are deferred to a later slice.
const HARDCODED_COMBAT_TECHS = new Set(["furor", "thalassocracy", "parthian-shot", "testudo", "phalanx-wall"]);
function techCardCombat(owner: Player | undefined, selfCat: string, foeCat: string, role: "atk" | "def"): { bonus: number; labels: string[] } {
  const out = { bonus: 0, labels: [] as string[] };
  if (!owner) return out;
  const key = role === "atk" ? "atkPct" : "defPct";
  const add = (v: number, name: string) => { out.bonus += v / 100; out.labels.push(`${name} ${v >= 0 ? "+" : "−"}${Math.abs(v)}%`); };
  for (const techId of owner.techs) {
    if (HARDCODED_COMBAT_TECHS.has(techId)) continue;
    const rule = TECHS[techId];
    const eff = rule && (rule.effect as Record<string, unknown> | undefined);
    if (!eff || eff.condition) continue;
    const name = (rule && rule.name) || techId;
    const flat = eff[key];
    if (typeof flat === "number" && flat !== 0 && (!eff.infantryOnly || selfCat === "infantry")) add(flat, name);
    const uc = eff.unitCatPct as { cat?: string; atkPct?: number; defPct?: number; vsCat?: string[] } | undefined;
    if (uc && uc.cat === selfCat && typeof uc[key] === "number" && uc[key] !== 0 && (!uc.vsCat || uc.vsCat.includes(foeCat))) add(uc[key] as number, name);
  }
  const cardPct = owner.perks && (owner.perks as Record<string, number | undefined>)[key];
  if (typeof cardPct === "number" && cardPct !== 0) add(cardPct, "Cards");
  return out;
}

// Effect wiring, Slice 2 — sum a numeric % effect (unitCostPct/upkeepPct/
// researchCostPct/buildFasterPct) across a player's non-hardcoded researched techs +
// equipped-card perks. `catId` also picks up a per-category `unitCatPct.<key>`.
function playerPctMod(owner: Player | undefined, key: string, catId?: string): number {
  if (!owner) return 0;
  let total = 0;
  for (const techId of owner.techs) {
    if (HARDCODED_COMBAT_TECHS.has(techId)) continue;
    const eff = TECHS[techId]?.effect as Record<string, unknown> | undefined;
    if (!eff) continue;
    if (typeof eff[key] === "number") total += eff[key] as number;
    const uc = eff.unitCatPct as (Record<string, unknown> & { cat?: string }) | undefined;
    if (catId && uc && uc.cat === catId && typeof uc[key] === "number") total += uc[key] as number;
  }
  const perkVal = owner.perks && (owner.perks as Record<string, number | undefined>)[key];
  if (typeof perkVal === "number") total += perkVal;
  return total;
}

// Effect wiring, Slice 3 — parse a yield-type `special:` string like
// "farm+1food, mine+2gold, library-city+1sci" into structured bonuses. Non-yield
// clauses (farm-buildable-on-desert, repair-ships-2x, …) are ignored here (behavioural
// hooks are a later slice / STEP C-D).
type YKey = "food" | "production" | "gold" | "science";
const YIELD_ALIAS: Record<string, YKey> = { food: "food", gold: "gold", labour: "production", production: "production", sci: "science", science: "science" };
function parseYieldSpecial(special: string): { target: string; y: YKey; n: number }[] {
  const out: { target: string; y: YKey; n: number }[] = [];
  for (const part of special.split(",")) {
    const m = /^\s*([a-z-]+)\+(\d+)(food|gold|labour|production|sci|science)\s*$/.exec(part);
    if (m && YIELD_ALIAS[m[3]]) out.push({ target: m[1], y: YIELD_ALIAS[m[3]], n: parseInt(m[2], 10) });
  }
  return out;
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
  if (!tile) return false;
  // On a great river the unit is embarked (afloat) UNLESS a bridge makes it a dry crossing.
  if (tile.terrain === "great-river") return tile.improvement !== "bridge";
  return tile.terrain === "coast" || tile.terrain === "sea";
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
  const atkG = techCardCombat(state.playersById[attacker.ownerId], atkCat, defCat, "atk");
  const defG = techCardCombat(state.playersById[defender.ownerId], defCat, atkCat, "def");

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
  const boatAssault = greatRiverAssaultPenalty(state, attacker);
  if (boatAssault > 0) {
    attackMult -= boatAssault;
    modifiers.push(`Assault by boat ${pct(-boatAssault)}`);
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
  // Civilisation attack doctrines.
  const atkOwner = state.playersById[attacker.ownerId];
  if (atkOwner) {
    if (atkOwner.techs.includes("furor") && (atkCat === "heavy" || atkCat === "infantry")) {
      attackMult += 0.35;
      modifiers.push("Furor charge +35%");
    }
    if (atkOwner.techs.includes("thalassocracy") && attackerDef.domain === "naval") {
      attackMult += 0.3;
      modifiers.push("Thalassocracy +30%");
    }
    if (atkOwner.techs.includes("parthian-shot") && attackerDef.mounted && attackerDef.range > 1) {
      attackMult += 0.2;
      modifiers.push("Parthian shot +20%");
    }
  }
  // Generic branch-tech + card attack bonuses (effect wiring, Slice 1).
  if (atkG.bonus) { attackMult += atkG.bonus; modifiers.push(...atkG.labels); }

  const terrainBonus = defenderTerrainBonus(state, defender);
  let defenseMult = terrainBonus + veterancyMultiplier(defender.veterancy);
  if (terrainBonus > 0) modifiers.push(`Enemy terrain ${pct(terrainBonus)}`);
  const counterDef = (defenderDef.counters && defenderDef.counters[atkCat]) || 0;
  if (counterDef > 0) {
    defenseMult += counterDef;
    modifiers.push(`Enemy ${CATEGORY_LABELS[defCat] || defCat} vs ${CATEGORY_LABELS[atkCat] || atkCat} ${pct(counterDef)}`);
  }
  // Rome's Testudo: shield-locked legionaries shrug off missiles. A big defensive
  // bonus for Roman infantry against ranged/siege fire, a smaller one in melee.
  const defOwner = state.playersById[defender.ownerId];
  if (defOwner && defOwner.techs.includes("testudo") && defCat === "infantry") {
    const shell = atkCat === "ranged" || atkCat === "siege" ? 0.5 : 0.2;
    defenseMult += shell;
    modifiers.push(`Testudo ${pct(shell)}`);
  }
  // Greece's phalanx wall — spearmen hold an unbreakable line.
  if (defOwner && defOwner.techs.includes("phalanx-wall") && defCat === "spear") {
    const wall = atkCat === "mounted" ? 0.6 : 0.35;
    defenseMult += wall;
    modifiers.push(`Phalanx wall ${pct(wall)}`);
  }
  // Carthage's thalassocracy — her warships are hard to sink.
  if (defOwner && defOwner.techs.includes("thalassocracy") && defenderDef.domain === "naval") {
    defenseMult += 0.3;
    modifiers.push("Thalassocracy +30%");
  }
  // Generic branch-tech + card defence bonuses (effect wiring, Slice 1).
  if (defG.bonus) { defenseMult += defG.bonus; modifiers.push(...defG.labels); }

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
  } else if (atkOwner && atkOwner.techs.includes("parthian-shot") && attackerDef.mounted && attackerDef.range > 1 && damageToAttacker > 0) {
    // The Parthian shot: horse archers wheel away before the enemy can strike back.
    damageToAttacker = 0;
    modifiers.push("Parthian shot — no retaliation");
  }

  return {
    damageToDefender,
    damageToAttacker,
    attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
    defenderRemainingHp: Math.max(0, defender.hp - damageToDefender),
    modifiers
  };
}

// After winning, a MELEE attacker advances into the tile it just cleared (the
// classic "take the ground"). Ranged/siege units hold their position, and we
// never advance into a tile that still holds other units or an enemy city.
function tryAdvanceInto(state: GameState, attacker: Unit, target: Coord): void {
  if (!attacker || attacker.hp <= 0) return;
  const def = UNITS[attacker.type];
  if ((def.range ?? 1) > 1) return; // ranged/siege don't move onto the target
  if (distance(attacker.position, target) !== 1) return; // must have been adjacent
  const blocked = Object.values(state.map.units).some(
    (u) => u.id !== attacker.id && u.position.q === target.q && u.position.r === target.r
  );
  if (blocked) return; // an enemy (or friendly) unit still stands there
  const cityHere = Object.values(state.map.cities).find(
    (c) => c.position.q === target.q && c.position.r === target.r
  );
  if (cityHere && cityHere.ownerId !== attacker.ownerId) return; // don't walk into an enemy city
  const step = movementCost(
    state,
    { ownerId: attacker.ownerId, domain: def.domain, mounted: def.mounted },
    attacker.position,
    target
  );
  if (!Number.isFinite(step)) return; // terrain the attacker can't enter
  attacker.position = { q: target.q, r: target.r };
}

function applyCombat(state: GameState, action: Extract<GameAction, { type: "ATTACK" }>): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const defender = unitAt(state, action.defenderId);
  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack with enemy unit");
  if (defender.ownerId === action.playerId) throw new Error("Cannot attack friendly unit");
  if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can fight");
  enterWar(state, action.playerId, defender.ownerId); // the first blow opens a war (§3)

  const preview = computeCombatPreview(state, attacker.id, defender.id);
  attacker.hp = preview.attackerRemainingHp;
  defender.hp = preview.defenderRemainingHp;
  // The Parthian shot: a mounted archer keeps half its movement to wheel away after
  // loosing; everyone else spends the turn on the attack.
  const atkDefC = UNITS[attacker.type];
  const parthian = !!atkDefC.mounted && atkDefC.range > 1 && (state.playersById[attacker.ownerId]?.techs.includes("parthian-shot") ?? false);
  // Britons' chariot of the isles: hit-and-run — it keeps moving after it strikes.
  const hitRun = atkDefC.special === "hit-and-run";
  attacker.movementRemaining = (parthian || hitRun) ? Math.max(1, Math.floor(atkDefC.movement / 2)) : 0;

  const defenderPos: Coord = { q: defender.position.q, r: defender.position.r };

  if (defender.hp <= 0) {
    // A fallen garrison leaves the city to muster a fresh one in a few turns.
    if (defender.garrison) { const c = cityAtPos(state, defenderPos); if (c) c.garrisonReadyTurn = state.turn + GARRISON_RESPAWN; }
    delete state.map.units[defender.id];
    const defenderOwner = state.playersById[defender.ownerId];
    defenderOwner.unitIds = defenderOwner.unitIds.filter((id) => id !== defender.id);

    if (attacker.veterancy === "recruit") attacker.veterancy = "veteran";
    else if (attacker.veterancy === "veteran") attacker.veterancy = "elite";

    // Take the ground the enemy held.
    if (attacker.hp > 0) tryAdvanceInto(state, attacker, defenderPos);
  }

  if (attacker.hp <= 0) {
    delete state.map.units[attacker.id];
    const attackerOwner = state.playersById[attacker.ownerId];
    attackerOwner.unitIds = attackerOwner.unitIds.filter((id) => id !== attacker.id);
  }
}

function applyRenameCity(state: GameState, action: RenameCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = cityAt(state, action.cityId);
  if (city.ownerId !== action.playerId) throw new Error("Cannot rename an enemy city");
  const name = action.name.trim().slice(0, 24);
  if (!name) throw new Error("City name cannot be empty");
  city.name = name;
}

function computeCityAttackDamage(state: GameState, attacker: Unit, city: City): number {
  const attackerDef = UNITS[attacker.type];
  const cityTile = tileAt(state, city.position);
  const weather = state.weather.current[cityTile.region] || "clear";

  const weatherMult = weather === "fog" ? 0.95 : 1;
  const siegeMult = 1 + (attackerDef.siegeBonus ?? 0);
  // −25% when the assault comes by boat off a great river with no bridge (§ great rivers).
  const boatMult = 1 - greatRiverAssaultPenalty(state, attacker);
  const attackPower =
    attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult * siegeMult * boatMult;
  // Cities grow tougher as their age advances — walls, ditches, drilled militia.
  const owner = state.playersById[city.ownerId];
  const cityDefense = 22 + city.population * 3 + (playerAge(owner) - 1) * 10;

  return Math.max(1, Math.round((18 * attackPower) / (attackPower + cityDefense)));
}

// The player's age = the highest-age tech they hold (1 = Villages … 3 = Empires).
export function playerAge(player: Player | undefined): number {
  let age = 1;
  if (!player) return age;
  for (const id of player.techs) { const t = TECHS[id]; if (t && t.age > age) age = t.age; }
  return age;
}

// ---- Free city garrisons (§ defence): every city keeps an age-scaled defender
// on its tile, so an attacker must beat it before assaulting the city. Costs no
// upkeep, holds its post (cannot move), and musters afresh a few turns after it
// falls. AI and human cities alike are defended by default.
export const GARRISON_RESPAWN = 4;
function isLandMilitary(u: Unit | undefined): boolean {
  const d = u && UNITS[u.type];
  return !!d && d.domain === "land" && (d.attack ?? 0) > 0;
}
// The owner's best available (uncapped, tech-satisfied, civ-legal) land defender.
function bestGarrisonType(player: Player): string {
  let best = "warrior", bestDef = -1;
  for (const [type, def] of Object.entries(UNITS)) {
    if (def.domain !== "land" || (def.attack ?? 0) <= 0) continue;
    if (def.buildCap) continue; // don't hand out capped elites for free
    if (def.civ && !playerControlsCiv(player, def.civ)) continue;
    if (def.requiresTech && !player.techs.includes(def.requiresTech)) continue;
    const d = def.defense ?? 0;
    if (d > bestDef) { bestDef = d; best = type; }
  }
  return best;
}
function cityAtPos(state: GameState, at: Coord): City | undefined {
  return Object.values(state.map.cities).find((c) => c.position.q === at.q && c.position.r === at.r);
}
function refreshGarrisons(state: GameState, player: Player): void {
  for (const cityId of player.cityIds) {
    const city = state.map.cities[cityId];
    if (!city) continue;
    const at = city.position;
    // Already defended if any friendly land-military unit stands on the centre.
    const defended = player.unitIds.some((id) => { const u = state.map.units[id]; return isLandMilitary(u) && u!.position.q === at.q && u!.position.r === at.r; });
    if (defended) continue;
    if (state.turn < (city.garrisonReadyTurn ?? 0)) continue; // still mustering
    const type = bestGarrisonType(player);
    const def = UNITS[type];
    const id = `${player.id}_gar_${at.q}_${at.r}_${state.turn}`;
    if (state.map.units[id]) continue;
    state.map.units[id] = {
      id, type, ownerId: player.id, position: { q: at.q, r: at.r },
      hp: def.maxHp, maxHp: def.maxHp, movementRemaining: 0,
      veterancy: playerAge(player) >= 3 ? "veteran" : "recruit", garrison: true
    };
    player.unitIds = player.unitIds.includes(id) ? player.unitIds : [...player.unitIds, id];
    city.garrisonReadyTurn = state.turn;
  }
}

function applyAttackCity(state: GameState, action: AttackCityAction): void {
  assertPlayerTurn(state, action.playerId);
  const attacker = unitAt(state, action.attackerId);
  const city = cityAt(state, action.cityId);

  if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack city with enemy unit");
  if (city.ownerId === action.playerId) throw new Error("Cannot attack friendly city");
  if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can assault a city");
  enterWar(state, action.playerId, city.ownerId); // assaulting a city opens a war (§3)

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
    city.capturedTurn = state.turn; // a fresh conquest is briefly unstable (stability)
    syncOwnershipIndexes(state);
    // March the victors into the fallen city.
    tryAdvanceInto(state, attacker, { q: city.position.q, r: city.position.r });
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

  // v2.1 §3 — era gate: a tech of age N is locked until enough age N−1 techs are in.
  const gate = AGE_GATES[tech.age];
  if (gate) {
    const prevAgeDone = player.techs.filter((id) => TECHS[id] && TECHS[id].age === tech.age - 1).length;
    if (prevAgeDone < gate.requiredPrevAgeTechs) return false;
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

  const cost = scaledResearchCost(state, action.techId, action.playerId);
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

// ===== Cities v3 §1 — population-based recruitment =====
// Mirrors districts-data-v2.js RECRUITMENT. Training a citizen unit spends a point
// of population; a city can't recruit below `minCityPopToTrain`. Civilians
// (merchant/engineer) and mercenaries are exempt; settlers ARE people leaving.
export const RECRUITMENT = {
  militaryPopCost: 1,
  minCityPopToTrain: 2,
  settlerPopCost: 1,
  civilianPopCost: 0,
  mercenaryPopCost: 0
};
// The population a given queued unit costs to train (0 = exempt).
export function unitPopCost(id: string): number {
  const def = UNITS[id];
  if (!def) return 0;
  if (id === "settler") return RECRUITMENT.settlerPopCost; // settlers leave the city
  if (def.domain === "civilian") return RECRUITMENT.civilianPopCost; // merchant/engineer — exempt
  return RECRUITMENT.militaryPopCost; // any combat unit is a citizen-soldier
}

// v2.1 §3b — depth-tiered pricing: cheap to ENTER a track, expensive to go DEEP.
// cost = AGE_BASE[age] × TIER_MULT[tier] × costMod, tier = 1 + longest SAME-AGE
// prereq chain above the tech (capstones use a fixed steeper multiplier).
export const AGE_BASE: Record<number, number> = { 1: 16, 2: 40, 3: 78 };
export const TIER_MULT: Record<string, number> = { "1": 0.8, "2": 1.0, "3": 1.3, capstone: 1.6 };
// v2.1 §3 — era gates: a tech of age N needs this many age N−1 techs first.
export const AGE_GATES: Record<number, { requiredPrevAgeTechs: number }> = {
  2: { requiredPrevAgeTechs: 5 },
  3: { requiredPrevAgeTechs: 6 }
};

const _sameAgeDepth: Record<string, number> = {};
function sameAgeDepth(techId: string): number {
  if (_sameAgeDepth[techId] != null) return _sameAgeDepth[techId];
  _sameAgeDepth[techId] = 0; // tentative, breaks any accidental cycle
  const tech = TECHS[techId];
  if (!tech) return 0;
  const same = tech.prerequisites.filter((p) => TECHS[p] && TECHS[p].age === tech.age);
  const d = same.length ? 1 + Math.max(...same.map(sameAgeDepth)) : 0;
  _sameAgeDepth[techId] = d;
  return d;
}
// tier index (1..3) from the same-age prereq depth; capstones are priced separately.
export function techTier(techId: string): number {
  return Math.min(3, 1 + sameAgeDepth(techId));
}
export function researchCost(techId: string): number {
  const tech = TECHS[techId];
  if (!tech) return AGE_BASE[1];
  const mult = tech.capstone ? TIER_MULT.capstone : TIER_MULT[String(techTier(techId))];
  const costMod = typeof tech.costMod === "number" ? tech.costMod : 1;
  return Math.max(1, Math.round(AGE_BASE[tech.age] * mult * costMod));
}

// Bigger maps take proportionally longer to develop: research + build costs scale
// with the map's area (dampened by a square root, relative to a Medium map, and
// capped so the ludicrous Oikoumene doesn't become impossible).
const REFERENCE_AREA = 21 * 18; // a Medium map = scale 1.0
export function mapCostScale(width: number, height: number): number {
  const area = Math.max(1, (width || 0) * (height || 0));
  return Math.min(3, Math.max(1, Math.round(Math.sqrt(area / REFERENCE_AREA) * 100) / 100));
}
// Research cost after the map-size scaling. Rhetoric — schools of oratory and
// argument — makes a people learn faster, so their research costs 15% less.
export function scaledResearchCost(state: GameState, techId: string, playerId?: string): number {
  let cost = researchCost(techId) * (state.costScale || 1);
  if (playerId && state.playersById[playerId]?.techs.includes("rhetoric")) cost *= 0.85;
  // Slice 2: extra research-cost % from other techs/cards (rhetoric stays explicit).
  const rc = playerPctMod(playerId ? state.playersById[playerId] : undefined, "researchCostPct");
  if (rc) cost *= Math.max(0.3, 1 + rc / 100);
  return Math.max(1, Math.round(cost));
}

// ===== Per-city STABILITY (Phase 5) =====
// An integer clamped −5..+5. Sources: stabilising buildings (temple/amphitheater/
// forum +1 each), the owner's researched branch techs (TECH_STABILITY) + equipped
// card perks (perks.stability), a garrison standing in the city (+1), minus the
// lingering shock of a fresh conquest (−2, easing 1/turn). Effect (Phase 5): each
// point is ±2% to all city yields, and +3 grants +1 labour (civic pride). Unrest
// and revolt are Phase-6+.
const STABILITY_BUILDINGS: Record<string, number> = { temple: 1, amphitheater: 1, forum: 1 };
export function computeCityStability(state: GameState, cityId: string): number {
  const city = state.map.cities[cityId];
  if (!city) return 0;
  const owner = state.playersById[city.ownerId];
  let s = 0;
  for (const b of city.buildings ?? []) s += STABILITY_BUILDINGS[b] ?? 0;
  // Cities v3 §2: districts adjust stability (civic/leisure/temple +, crammed −).
  const civId = owner ? String(owner.civ || "").toLowerCase() : "";
  for (const d of city.districts ?? []) {
    if (d.pillaged) continue;
    if (d.type === "greatwork" && d.work) {
      const gwc = greatWork(d.work)?.effect.cityYield;
      if (gwc && typeof gwc.stability === "number") s += gwc.stability;
      continue;
    }
    const cy = districtType(d.type)?.effect.cityYield;
    if (cy && typeof cy.stability === "number") s += cy.stability;
    const bonus = districtName(d.type, civId)?.bonus;
    if (bonus && typeof bonus.stability === "number") s += bonus.stability;
  }
  // Empire-wide Great Work stability (e.g. Colosseum +1 all cities).
  if (owner) {
    for (const cid of owner.cityIds) {
      for (const d of state.map.cities[cid]?.districts ?? []) {
        if (d.pillaged || d.type !== "greatwork" || !d.work) continue;
        const emp = greatWork(d.work)?.effect.empire as Record<string, number> | undefined;
        if (emp && typeof emp.stability === "number") s += emp.stability;
      }
    }
  }
  if (owner) {
    for (const techId of Object.keys(TECH_STABILITY)) if (owner.techs.includes(techId)) s += TECH_STABILITY[techId];
    s += owner.perks?.stability ?? 0;
    // Diplomacy §3: an Oathbreaker brand shames every city; long wars breed weariness.
    if (isOathbreaker(state, owner.id)) s -= 1;
    s -= playerWarWeariness(state, owner.id);
  }
  if (Object.values(state.map.units).some((u) => u.ownerId === city.ownerId && u.position.q === city.position.q && u.position.r === city.position.r)) s += 1;
  if (city.capturedTurn != null) s -= Math.max(0, 2 - (state.turn - city.capturedTurn));
  return Math.max(-5, Math.min(5, s));
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

  // Every research counts: certain techs add a flat per-city yield each turn.
  if (owner) {
    for (const techId of Object.keys(TECH_CITY_YIELD)) {
      if (!owner.techs.includes(techId)) continue;
      const y = TECH_CITY_YIELD[techId];
      yields.food += y.food ?? 0;
      yields.production += y.production ?? 0;
      yields.gold += y.gold ?? 0;
      yields.science += y.science ?? 0;
    }
  }

  // Slice 3: gather per-improvement / per-building yield bonuses, a capital-only
  // bonus (tech capitalYield), and buildingBoost — all from the owner's branch techs.
  const impBonus: Record<string, Partial<Record<YKey, number>>> = {};
  const bldExtra: Record<string, Partial<Record<YKey, number>>> = {};
  const YK: YKey[] = ["food", "production", "gold", "science"];
  if (owner) {
    const addTo = (map: Record<string, Partial<Record<YKey, number>>>, k: string, y: YKey, n: number) => { (map[k] ??= {})[y] = (map[k][y] ?? 0) + n; };
    for (const techId of owner.techs) {
      const eff = TECHS[techId]?.effect as Record<string, unknown> | undefined;
      if (!eff) continue;
      const cap = eff.capitalYield as Partial<Record<YKey, number>> | undefined;
      if (cap && city.isCapital) for (const k of YK) if (typeof cap[k] === "number") yields[k] += cap[k] as number;
      const boost = eff.buildingBoost as Record<string, Partial<Record<YKey, number>>> | undefined;
      if (boost) for (const bid in boost) for (const k of YK) if (typeof boost[bid][k] === "number") addTo(bldExtra, bid, k, boost[bid][k] as number);
      if (typeof eff.special === "string") for (const b of parseYieldSpecial(eff.special)) {
        const bid = b.target.replace(/-city$/, "");
        if (IMPROVEMENTS[b.target]) addTo(impBonus, b.target, b.y, b.n);
        else if (BUILDINGS[bid]) addTo(bldExtra, bid, b.y, b.n);
      }
    }
  }

  for (const buildingId of city.buildings ?? []) {
    const b = BUILDINGS[buildingId];
    if (!b) continue;
    if (b.yields) {
      yields.food += b.yields.food ?? 0;
      yields.production += b.yields.production ?? 0;
      yields.gold += b.yields.gold ?? 0;
      yields.science += b.yields.science ?? 0;
    }
    const be = bldExtra[buildingId]; // Slice 3: tech buildingBoost / building yield-special
    if (be) { yields.food += be.food ?? 0; yields.production += be.production ?? 0; yields.gold += be.gold ?? 0; yields.science += be.science ?? 0; }
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
    if (!tile || (!tile.improvement && !tile.resource)) continue;
    const claim = claimingCity(state, parseKey(key));
    if (!claim || claim.id !== cityId) continue;
    const imp = tile.improvement ? IMPROVEMENTS[tile.improvement] : null;
    if (imp) {
      yields.food += imp.yields.food ?? 0;
      yields.production += imp.yields.production ?? 0;
      yields.gold += imp.yields.gold ?? 0;
      yields.science += imp.yields.science ?? 0;
      const ib = impBonus[tile.improvement as string]; // Slice 3: tech improvement yield-special
      if (ib) { yields.food += ib.food ?? 0; yields.production += ib.production ?? 0; yields.gold += ib.gold ?? 0; yields.science += ib.science ?? 0; }
    }
    // A strategic deposit worked by this city adds its bonus yields.
    const res = tile.resource ? RESOURCES[tile.resource] : null;
    if (res) {
      yields.food += res.yields.food ?? 0;
      yields.production += res.yields.production ?? 0;
      yields.gold += res.yields.gold ?? 0;
      yields.science += res.yields.science ?? 0;
    }
  }

  // Great-river fertility (the Black Land): every claimed LAND tile adjacent to a
  // great-river tile gains +2 food. Stacks additively with Egypt's Nilometers.
  for (const key of tileKeysWithin(city.position, cityTerritoryRadius(city))) {
    const tile = state.map.tiles[key];
    const trule = tile ? TERRAIN[tile.terrain] : null;
    if (!trule || trule.navalOnly) continue; // land tiles only
    const claim = claimingCity(state, parseKey(key));
    if (!claim || claim.id !== cityId) continue;
    for (const n of neighborsOf(parseKey(key))) {
      const nt = state.map.tiles[keyOf(n)];
      if (nt && nt.terrain === "great-river") { yields.food += 2; break; }
    }
  }

  // Cities v3 §2: districts on the urban ring add their yields (per-civ bonus too).
  // A pillaged district yields nothing until repaired. Stability from districts is
  // handled in computeCityStability.
  const civId = owner ? String(owner.civ || "").toLowerCase() : "";
  // Great Works use "labour" for production; ordinary districts use the plain keys.
  const addY = (src: Record<string, number> | undefined) => {
    if (!src) return;
    for (const k of YK) if (typeof src[k] === "number") yields[k] += src[k];
    if (typeof src.labour === "number") yields.production += src.labour;
  };
  for (const d of city.districts ?? []) {
    if (d.pillaged) continue;
    if (d.type === "greatwork" && d.work) {
      const gw = greatWork(d.work);
      if (gw) { addY(gw.effect.cityYield); if (city.isCapital) addY(gw.effect.capitalYield); }
      continue;
    }
    addY(districtType(d.type)?.effect.cityYield);
    addY(districtName(d.type, civId)?.bonus as Record<string, number> | undefined);
  }
  // Empire-wide Great Work yields — sourced from ANY of the owner's cities, applied
  // to every city (so a Weiyang Palace's +science lifts the whole realm).
  if (owner) {
    for (const cid of owner.cityIds) {
      for (const d of state.map.cities[cid]?.districts ?? []) {
        if (d.pillaged || d.type !== "greatwork" || !d.work) continue;
        addY(greatWork(d.work)?.effect.empire as Record<string, number> | undefined);
      }
    }
  }

  // Stability modifies everything: ±2% per point, and civic pride (+3) adds labour.
  const stability = computeCityStability(state, cityId);
  if (stability !== 0) {
    const sf = 1 + 0.02 * stability;
    yields.food = Math.max(0, Math.round(yields.food * sf));
    yields.production = Math.max(0, Math.round(yields.production * sf));
    yields.gold = Math.max(0, Math.round(yields.gold * sf));
    yields.science = Math.max(0, Math.round(yields.science * sf));
  }
  if (stability >= 3) yields.production += 1;
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
    // The open ocean ringing the world is NOT a city's coast — a town on the map's
    // edge shouldn't gain a harbour just because the belt starts next door.
    if (!tile || tile.open) return false;
    return tile.terrain === "coast" || tile.terrain === "sea";
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

// The distinct strategic resources a player works anywhere in their territory.
export function controlledResources(state: GameState, ownerId: string): Set<string> {
  const owned = new Set<string>();
  for (const [key, tile] of Object.entries(state.map.tiles)) {
    if (!tile.resource) continue;
    const claim = claimingCity(state, parseKey(key));
    if (claim && claim.ownerId === ownerId) owned.add(tile.resource);
  }
  return owned;
}

// 0.7 if the owner holds the resource this build needs (a discount), else 1.
export function buildDiscount(state: GameState, ownerId: string, id: string): number {
  const need = BUILD_RESOURCE[id];
  if (!need) return 1;
  return controlledResources(state, ownerId).has(need) ? BUILD_DISCOUNT : 1;
}

// Labour cost after any resource discount the owner qualifies for.
export function effectiveItemCost(state: GameState, ownerId: string, id: string): number {
  const base = productionItemCost(id);
  if (!Number.isFinite(base)) return base;
  let mult = buildDiscount(state, ownerId, id) * (state.costScale || 1);
  // Carthage's thalassocracy — her shipyards turn out warships 25% cheaper.
  if (UNITS[id]?.domain === "naval" && (state.playersById[ownerId]?.techs.includes("thalassocracy") ?? false)) mult *= 0.75;
  // Kush — Bowmen of Ta-Seti: ranged units cost 25% less (§4.1 trait).
  if (UNITS[id]?.category === "ranged" && String(state.playersById[ownerId]?.civ || "").toLowerCase() === "kush") mult *= 0.75;
  // Slice 2: build-faster (all items) + unit-cost % (units only, incl. per-category).
  const owner = state.playersById[ownerId];
  const faster = playerPctMod(owner, "buildFasterPct");
  if (faster) mult *= Math.max(0.4, 1 - faster / 100);
  if (UNITS[id]) {
    const uc = playerPctMod(owner, "unitCostPct", UNITS[id].category);
    if (uc) mult *= Math.max(0.4, 1 + uc / 100);
  }
  return Math.max(1, Math.round(base * mult));
}

// Food eaten by an empire's standing army each turn: 1 per non-civilian unit,
// with a free garrison allowance of one unit per city.
export const FOOD_UPKEEP_FREE_PER_CITY = 1;
export function playerFoodUpkeep(state: GameState, playerId: string): number {
  const player = state.playersById[playerId];
  if (!player) return 0;
  const military = player.unitIds.reduce((n, id) => {
    const u = state.map.units[id];
    return n + (u && UNITS[u.type].domain !== "civilian" ? 1 : 0);
  }, 0);
  const free = player.cityIds.length * FOOD_UPKEEP_FREE_PER_CITY;
  const net = Math.max(0, military - free);
  // Slice 2: army upkeep % from techs/cards (e.g. a logistics reform).
  const up = playerPctMod(player, "upkeepPct");
  return up ? Math.max(0, Math.round(net * (1 + up / 100))) : net;
}

// Pick an empty water tile next to a coastal city to launch a new ship. Falls
// back to the city tile if the city is somehow landlocked or the water is full.
function navalLaunchTile(state: GameState, city: City): Coord {
  const occupied = new Set(Object.values(state.map.units).map((u) => keyOf(u.position)));
  let firstWater: Coord | null = null;
  for (const n of neighborsOf(city.position)) {
    const tile = state.map.tiles[keyOf(n)];
    if (!tile || (tile.terrain !== "coast" && tile.terrain !== "sea")) continue;
    if (!firstWater) firstWater = n;
    if (!occupied.has(keyOf(n))) return n; // free water — the ideal berth
  }
  // No FREE adjacent water: stack onto adjacent water rather than beach the ship
  // on the city's land tile. (A landlocked city can't build ships anyway.)
  return firstWater ?? { ...city.position };
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
      // Kush — Bowmen of Ta-Seti: her ranged units are born veterans (§4.1 trait).
      veterancy: def.category === "ranged" && String(state.playersById[city.ownerId]?.civ || "").toLowerCase() === "kush" ? "veteran" : "recruit",
      homeCityId: city.id // Cities v3 §1 — where a disbanded citizen returns
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
    const cost = effectiveItemCost(state, city.ownerId, id);
    if (!Number.isFinite(cost) || (city.production ?? 0) < cost) break;
    // Cities v3 §1: a citizen unit spends a population point, and a city cannot
    // recruit below `minCityPopToTrain`. If it's too small, wait for it to grow —
    // production stays banked, the item stays queued.
    const popCost = unitPopCost(id);
    if (popCost > 0 && city.population < RECRUITMENT.minCityPopToTrain) break;
    city.production = (city.production ?? 0) - cost;
    completeQueueItem(state, city, id);
    if (popCost > 0) city.population = Math.max(1, city.population - popCost);
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
  if (building.civ && String(player.civ || "").toLowerCase() !== building.civ) {
    throw new Error(`${building.name} is unique to the ${building.civ}`);
  }
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
  const cost = effectiveItemCost(state, city.ownerId, itemId);
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
  const cost = effectiveItemCost(state, city.ownerId, rush.itemId);
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
  const isWater = tile.terrain === "sea" || tile.terrain === "coast";
  const claim = claimingCity(state, parseKey(action.tileKey));
  if (!claim || claim.ownerId !== action.playerId) throw new Error("That tile is not in your territory");
  if (claim.id !== action.cityId) throw new Error("That city does not work this tile");

  // Roads live alongside a worked improvement (a farm can have a road too) — but
  // never across open water, and only once your people know how to lay them.
  if (action.improvement === "road") {
    if (isWater) throw new Error("Roads can't cross open water");
    if (!state.playersById[action.playerId].techs.includes("masonry")) throw new Error("Roads need the Masonry tech");
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
  if (rule.requiresResource && !(tile.resource && rule.requiresResource.includes(tile.resource))) {
    throw new Error(`${action.improvement} needs a ${rule.requiresResource.join(" or ")} deposit`);
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
// Labour a city with an empty queue keeps banked; anything above it is sold off
// as coin so idle cities don't hoard hundreds of unspendable production.
export const IDLE_PROD_RESERVE = 20;

// How much a unit would heal if left to rest this turn (0 if it is at full HP
// or has already moved/fought). Location decides the rate.
export function restHealAmount(state: GameState, unit: Unit): number {
  if (unit.hp >= unit.maxHp) return 0;
  if (unit.movementRemaining < movementBudgetFor(state, unit)) return 0; // it moved or fought
  const cityHere = Object.values(state.map.cities).find(
    (c) => c.position.q === unit.position.q && c.position.r === unit.position.r
  );
  // Medicine — field surgeons and better care mend wounds faster everywhere.
  const owner = state.playersById[unit.ownerId];
  // Slice 4: medicine (+3) plus any branch-tech / card healPlus (per-category too).
  const medic = (owner?.techs.includes("medicine") ? 3 : 0) + playerPctMod(owner, "healPlus", categoryOf(unit));
  if (cityHere && cityHere.ownerId === unit.ownerId) return HEAL_IN_CITY + medic;
  const claim = claimingCity(state, unit.position);
  return (claim && claim.ownerId === unit.ownerId ? HEAL_IN_TERRITORY : HEAL_IN_FIELD) + medic;
}

function applyEndTurn(state: GameState, action: EndTurnAction): void {
  assertPlayerTurn(state, action.playerId);
  const endingPlayer = getCurrentPlayer(state);

  const mult = aiEconomyMultiplier(state, endingPlayer.id);

  // Troops eat food: the empire's total food output is taxed by the army's
  // upkeep before it banks toward growth. A surplus still grows cities (slower);
  // a deficit halts growth and slowly drains stored food (never starves — soft).
  const foodByCity: Record<string, number> = {};
  let foodProd = 0;
  for (const cityId of endingPlayer.cityIds) {
    const gained = Math.round(computeCityYield(state, cityId).food * mult);
    foodByCity[cityId] = gained;
    foodProd += gained;
  }
  const foodUpkeep = playerFoodUpkeep(state, endingPlayer.id);
  const net = foodProd - foodUpkeep;
  const foodMult = foodProd > 0 ? Math.max(0, net / foodProd) : 0;

  for (const cityId of endingPlayer.cityIds) {
    const yields = computeCityYield(state, cityId);
    endingPlayer.gold += Math.round(yields.gold * mult);
    endingPlayer.science += Math.round(yields.science * mult);

    const city = state.map.cities[cityId];
    if (city) {
      // Food is banked per-city (after the army's food-tax) and grows population.
      city.food = (city.food ?? 0) + Math.round((foodByCity[cityId] ?? 0) * foodMult);
      let need = growthCost(city.population);
      while (city.population < MAX_POPULATION && city.food >= need) {
        city.food -= need;
        city.population += 1;
        need = growthCost(city.population);
      }
      // Production is banked per-city and drives the build queue.
      city.production = (city.production ?? 0) + Math.round(yields.production * mult);
      processCityQueue(state, city);

      // An IDLE city (nothing left to build) turns surplus labour into coin at a
      // modest rate instead of hoarding it forever — public works, hired gangs,
      // roadwork. A small reserve is kept so queuing something next turn isn't lost.
      if ((city.queue ?? []).length === 0 && (city.production ?? 0) > IDLE_PROD_RESERVE) {
        const surplus = (city.production ?? 0) - IDLE_PROD_RESERVE;
        endingPlayer.gold += Math.floor(surplus / 3);
        city.production = IDLE_PROD_RESERVE;
      }

      // A city left in peace repairs its walls; one under assault this turn does
      // not — so taking a city needs sustained, concentrated force, not a lone
      // unit chipping at it turn after turn.
      if (city.hp < city.maxHp && (city.lastAttackedTurn ?? -1) < state.turn) {
        city.hp = Math.min(city.maxHp, city.hp + CITY_REGEN);
      }
    }
  }

  // Deficit: drain stored food from cities to cover the shortfall (floored at 0,
  // no population loss).
  if (net < 0) {
    let deficit = -net;
    for (const cityId of endingPlayer.cityIds) {
      if (deficit <= 0) break;
      const city = state.map.cities[cityId];
      if (!city) continue;
      const take = Math.min(city.food ?? 0, deficit);
      city.food = (city.food ?? 0) - take;
      deficit -= take;
    }
  }

  // Equipped-General perks: a small flat per-turn bonus (gold/science to the pool,
  // food/production banked in the capital for next turn).
  const perks = endingPlayer.perks;
  if (perks) {
    endingPlayer.gold += perks.gold ?? 0;
    endingPlayer.science += perks.science ?? 0;
    if (perks.food || perks.production) {
      const cap =
        endingPlayer.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) ||
        state.map.cities[endingPlayer.cityIds[0]];
      if (cap) {
        cap.food = (cap.food ?? 0) + (perks.food ?? 0);
        cap.production = (cap.production ?? 0) + (perks.production ?? 0);
      }
    }
  }

  const upkeep = endingPlayer.unitIds.reduce((sum, unitId) => {
    const unit = state.map.units[unitId];
    if (!unit || unit.garrison) return sum; // free city garrisons cost nothing
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

  applyDiplomacyIncome(state, endingPlayer); // trade-pact gold + tribute transfer
  loseShipsAtSea(state, endingPlayer);       // the open ocean swallows anyone who sails too far
  excavateRuins(state, endingPlayer.id);     // §10.2: units ending on a ruin dig it up
  contactVillages(state, endingPlayer.id);   // §10.3: an Explorer warms a wary village
  contactCivs(state, endingPlayer.id);       // §10.3: an Explorer envoy makes first contact with civs
  refreshGarrisons(state, endingPlayer);     // muster an age-scaled defender in any undefended city

  // Advance to the next player. With 3+ players we ROTATE initiative each round
  // (round r starts at seat r mod n) so no seat is permanently last — the last
  // seat was systematically squeezed (it acted after two established rivals).
  // Two-player games keep the simple linear order (seat 0 always first), which
  // also preserves the deterministic turn sequences the tests rely on. The
  // rotation is a pure function of turn + player count, so replay stays exact.
  const n = state.players.length;
  const prevTurn = state.turn;
  if (n >= 3 && state.rotateInitiative !== false) {
    const roundStart = (state.turn - 1) % n;
    if ((state.currentPlayerIndex + 1) % n === roundStart) {
      state.turn += 1;
      state.currentPlayerIndex = (state.turn - 1) % n; // next round's first seat
    } else {
      state.currentPlayerIndex = (state.currentPlayerIndex + 1) % n;
    }
  } else {
    state.currentPlayerIndex += 1;
    if (state.currentPlayerIndex >= n) {
      state.currentPlayerIndex = 0;
      state.turn += 1;
    }
  }
  if (state.turn !== prevTurn) {
    state.weather.current = generateWeatherByRegion(state, state.turn);
    state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
    applyRelationDrift(state); // long-peace warming / war cooling, once per game turn
    expireDiplomacy(state);    // drop lapsed agreements + tribute
    // Vassal revolts: an overlord grown weak, or a content vassal that hates you,
    // throws off the yoke — independence + a war of secession (§4).
    for (const p of state.players) {
      if (p.vassalOf && shouldRebel(state, p.id, (cid) => computeCityStability(state, cid))) {
        const overlord = p.vassalOf;
        p.vassalOf = undefined;
        p.overlordMilBaseline = undefined;
        adjustRelation(state, p.id, overlord, -60);
        enterWar(state, p.id, overlord);
      }
    }
    // Off-grid corsairs: land any raid due this turn, then perhaps raise a fresh
    // warning on the horizon. Once per world-turn, fully seeded (raiders.md).
    resolveRaids(state);
    scheduleRaid(state);
  }

  const nextPlayer = getCurrentPlayer(state);
  for (const unitId of nextPlayer.unitIds) {
    const unit = state.map.units[unitId];
    if (!unit) continue;

    unit.movementRemaining = movementBudgetFor(state, unit);

    const unitTile = tileAt(state, unit.position);
    if (unit.type === "trireme" && unitTile.terrain === "sea" && state.weather.current[unitTile.region] === "storm") {
      unit.hp = Math.max(1, unit.hp - 2);
    }
  }

  maybeFireFigure(state, nextPlayer); // a historical figure may call, given how they play
  maybeFireEvent(state, nextPlayer);
}

// Deterministically hand the next player a Crossroads dilemma now and then,
// spaced out so they don't pile up. The human sees a card; the AI auto-resolves.
function maybeFireEvent(state: GameState, player: Player): void {
  if (player.pendingEvent || player.pendingFigure || player.pendingRaid) return; // one decision card at a time (incl. an urgent raid warning)
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

// ---- The Minds of the Age (figures.ts) --------------------------------------
// A historical figure calls on the player BECAUSE OF how they play — their arrival
// condition reads the situation the engine has already worked out. Spaced out and
// seeded like Crossroads; each figure appears at most once per player per game.
export const FIGURE_START_TURN = 5;
export const FIGURE_CHANCE = 0.22;
export const FIGURE_SPACING = 6;

/** Summarise the player's situation for a figure's arrival condition. */
function figureContext(state: GameState, player: Player): FigureCtx {
  const coastal = player.cityIds.some((id) => isCoastalCity(state, id));
  const navalThreat = (state.raids ?? []).some((r) => {
    const c = state.map.cities[r.targetCityId];
    return !!c && c.ownerId === player.id;
  });
  const atSea = player.unitIds.some((id) => {
    const u = state.map.units[id];
    return !!u && openSeaDistance(state, u.position) > 0;
  });
  const atWar = state.players.some((o) => o.id !== player.id && isAtWar(state, player.id, o.id));
  const population = player.cityIds.reduce((n, id) => n + (state.map.cities[id]?.population ?? 0), 0);
  return {
    coastal,
    navalThreat,
    atSea,
    atWar,
    cityCount: player.cityIds.length,
    age: playerAge(player),
    foundRuins: (player.codex ?? []).length > 0,
    gold: player.gold,
    unitCount: player.unitIds.length,
    population
  };
}

function maybeFireFigure(state: GameState, player: Player): void {
  if (player.pendingEvent || player.pendingFigure || player.pendingRaid) return; // one decision card at a time (incl. an urgent raid warning)
  if (player.cityIds.length === 0) return;
  if (state.turn < FIGURE_START_TURN) return;
  if (state.turn - (player.lastFigureTurn ?? 0) < FIGURE_SPACING) return;
  if (seededRandom(state.seed, `figure:${state.turn}:${player.id}`)() >= FIGURE_CHANCE) return;

  const ctx = figureContext(state, player);
  const met = new Set(player.metFigures ?? []);
  const eligible = FIGURES.filter(
    (f) => !met.has(f.id) && (!f.civ || playerControlsCiv(player, f.civ)) && f.when(ctx)
  );
  if (eligible.length === 0) return;

  const pick = Math.floor(seededRandom(state.seed, `figurepick:${state.turn}:${player.id}`)() * eligible.length);
  const figure = eligible[Math.min(pick, eligible.length - 1)]!;
  player.pendingFigure = figure.id;
  player.metFigures = [...(player.metFigures ?? []), figure.id];
  player.lastFigureTurn = state.turn;
}

function applyResolveFigure(state: GameState, action: ResolveFigureAction): void {
  const player = state.playersById[action.playerId];
  if (!player) throw new Error(`Unknown player ${action.playerId}`);
  if (player.pendingFigure !== action.figureId) {
    throw new Error(`No pending figure ${action.figureId} for ${action.playerId}`);
  }
  const figure = getFigure(action.figureId);
  const option = figure && figure.options[action.optionIndex];
  if (!figure || !option) throw new Error(`Invalid figure option`);
  applyFigureEffects(state, player, option.effects);
  player.pendingFigure = undefined;
}

const VET_STEP: Record<string, Veterancy> = { recruit: "veteran", veteran: "elite", elite: "elite" };

function capitalOf(state: GameState, player: Player): City | undefined {
  return (
    player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) ||
    state.map.cities[player.cityIds[0]]
  );
}

function applyFigureEffects(state: GameState, player: Player, fx: FigureEffects): void {
  if (fx.gold) player.gold += fx.gold;
  if (fx.science) player.science += fx.science;
  const capital = capitalOf(state, player);
  if (fx.production && capital) capital.production = (capital.production ?? 0) + fx.production;
  if (fx.food) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (city) city.food = (city.food ?? 0) + fx.food;
    }
  }
  if (fx.spawnUnit && UNITS[fx.spawnUnit] && capital) {
    const def = UNITS[fx.spawnUnit];
    let counter = 1;
    let unitId = `${player.id}_${fx.spawnUnit}_figure_${state.turn}_${counter}`;
    while (state.map.units[unitId]) { counter += 1; unitId = `${player.id}_${fx.spawnUnit}_figure_${state.turn}_${counter}`; }
    state.map.units[unitId] = {
      id: unitId, type: fx.spawnUnit, ownerId: player.id, position: { ...capital.position },
      hp: def.maxHp, maxHp: def.maxHp, movementRemaining: 0, veterancy: "recruit"
    };
    syncOwnershipIndexes(state);
  }
  if (fx.xp) {
    for (const uid of player.unitIds) {
      const u = state.map.units[uid];
      if (u) u.veterancy = VET_STEP[u.veterancy ?? "recruit"] ?? "veteran";
    }
  }
  if (fx.heal) {
    for (const uid of player.unitIds) {
      const u = state.map.units[uid];
      if (u) u.hp = u.maxHp;
    }
  }
  if (fx.techUnlock && TECHS[fx.techUnlock] && !player.techs.includes(fx.techUnlock)) {
    player.techs.push(fx.techUnlock);
  }
  if (fx.reveal && capital) {
    state.discovered = state.discovered ?? {};
    const seen = new Set(state.discovered[player.id] ?? []);
    const at = capital.position;
    seen.add(keyOf(at));
    for (const n of neighborsOf(at)) { seen.add(keyOf(n)); for (const nn of neighborsOf(n)) if (state.map.tiles[keyOf(nn)]) seen.add(keyOf(nn)); }
    state.discovered[player.id] = [...seen];
  }
  if (fx.seaReach) {
    player.perks = player.perks ?? {};
    player.perks.seaReach = (player.perks.seaReach ?? 0) + fx.seaReach;
  }
  if (fx.perks) {
    player.perks = player.perks ?? {};
    for (const [key, value] of Object.entries(fx.perks)) {
      if (typeof value === "number") {
        const k = key as keyof NonNullable<Player["perks"]>;
        player.perks[k] = ((player.perks[k] as number | undefined) ?? 0) + value;
      }
    }
  }
  // The Burning Mirrors: any raid bearing down on this player is destroyed on the water.
  if (fx.cancelRaids) {
    const before = state.raids ?? [];
    const doomed = before.filter((r) => { const c = state.map.cities[r.targetCityId]; return !!c && c.ownerId === player.id; });
    if (doomed.length) {
      state.raids = before.filter((r) => !doomed.includes(r));
      player.pendingRaid = undefined;
      state.raidReports = [
        ...(state.raidReports ?? []),
        ...doomed.map((r) => {
          const c = state.map.cities[r.targetCityId];
          return { kind: "burned" as const, cityId: r.targetCityId, cityName: c ? cityDisplayName(c) : r.targetCityId, playerId: player.id, strength: r.strength };
        })
      ];
    }
  }
}

function applyFoundCity(state: GameState, action: FoundCityAction): void {
  assertPlayerTurn(state, action.playerId);
  assertPlayerTurn(state, action.playerId);
  const settler = unitAt(state, action.settlerId);
  if (settler.ownerId !== action.playerId) throw new Error("Cannot use enemy settler");
  if (settler.type !== "settler") throw new Error("Only settler can found a city");
  if (state.map.cities[action.cityId]) throw new Error(`City id ${action.cityId} already exists`);

  const here = tileAt(state, settler.position);
  if (here.terrain === "sea" || here.terrain === "coast") throw new Error("Cannot found a city on open water");

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

// Retire one of your own units. Its upkeep stops and a quarter of its build cost
// comes back as scrap coin.
// The player's city nearest a point (for resettling a unit whose home city was lost).
function nearestOwnCity(state: GameState, ownerId: string, from: Coord): City | undefined {
  let best: City | undefined;
  let bestD = Infinity;
  for (const c of Object.values(state.map.cities)) {
    if (c.ownerId !== ownerId) continue;
    const d = distance(c.position, from);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

function applyDisbandUnit(state: GameState, action: DisbandUnitAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  const unit = state.map.units[action.unitId];
  if (!unit) throw new Error(`Unknown unit ${action.unitId}`);
  if (unit.ownerId !== action.playerId) throw new Error("Cannot disband another player's unit");
  if (unit.garrison) throw new Error("A city garrison cannot be disbanded");

  // Cities v3 §1: a disbanded citizen-military unit returns to its HOME city's
  // population, prorated by health — a full pop point at 100%, otherwise the
  // fraction credits that city's banked food (fraction × food-per-pop). Mercenaries
  // and civilians (merchant/engineer) return nothing; a lost home city resettles to
  // the nearest own city. (Combat death, handled elsewhere, returns nothing.)
  const def = UNITS[unit.type];
  const isCitizenMilitary = def && def.domain !== "civilian" && !unit.mercenary;
  if (isCitizenMilitary) {
    let home = unit.homeCityId ? state.map.cities[unit.homeCityId] : undefined;
    if (!home || home.ownerId !== player.id) home = nearestOwnCity(state, player.id, unit.position);
    if (home) {
      const frac = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
      if (frac >= 1) home.population += 1;
      else home.food = (home.food ?? 0) + frac * growthCost(home.population);
    }
  }
  delete state.map.units[action.unitId];
  syncOwnershipIndexes(state);
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
  // Elite-guard cap (praetorian max 2, spartiate max 4): count what's alive plus
  // everything already queued across the player's cities.
  if (unitRule.buildCap) {
    let count = 0;
    for (const id of player.unitIds) { const u = state.map.units[id]; if (u && u.type === action.unitType) count += 1; }
    for (const cid of player.cityIds) { const c = state.map.cities[cid]; if (c) for (const q of c.queue ?? []) if (q === action.unitType) count += 1; }
    if (count >= unitRule.buildCap) throw new Error(`You may field at most ${unitRule.buildCap} ${action.unitType}`);
  }
  enqueueProduction(city, action.unitType);
}

// ---- The open ocean beyond the map's edge -----------------------------------
// The world does not stop at the border: a belt of open ocean rings the playable
// board so a fleet can genuinely sail "off the map". It is real, sailable DEEP sea
// (so it still needs open-sea-sailing), but a ship that pushes LOST_AT_SEA_DIST
// hexes past the border never finds its way home (see loseShipsAtSea). The belt is
// deliberately NOT part of map.width/height, so costScale — which paces research and
// building off the PLAYABLE map's area — is unchanged by it.
export const OPEN_SEA_MARGIN = 8;   // rings of ocean ringing the board
export const LOST_AT_SEA_DIST = 7;  // push this far past the border and you're lost

/** Hexes this position lies BEYOND the playable border (0 = on the map proper). */
export function openSeaDistance(state: GameState, pos: Coord): number {
  return state.map.tiles[keyOf(pos)]?.open ?? 0;
}

// Anyone who ends a turn LOST_AT_SEA_DIST hexes or more beyond the border is lost —
// ship, cargo and all. Reported on state.lostAtSea so the client can tell the story.
function loseShipsAtSea(state: GameState, player: Player): void {
  state.lostAtSea = [];
  // Pytheas's charts let a people sail farther before the deep claims them.
  const reach = LOST_AT_SEA_DIST + (player.perks?.seaReach ?? 0);
  for (const unitId of [...player.unitIds]) {
    const unit = state.map.units[unitId];
    if (!unit) continue;
    if (openSeaDistance(state, unit.position) < reach) continue;
    delete state.map.units[unitId];
    player.unitIds = player.unitIds.filter((id) => id !== unitId);
    state.lostAtSea.push({ playerId: player.id, unitId, type: unit.type });
  }
  if (state.lostAtSea.length) syncOwnershipIndexes(state);
}

// Grow the belt OUTWARD from the map's actual outline, one ring at a time, tagging
// each tile with how far past the border it lies. Flooding from the real shape (not a
// width/height rectangle) means this works for any layout — generated offset maps,
// hand-drawn scenarios, or the axial test maps — and `open` records a true hex
// distance, so nothing downstream has to guess where the border was.
function addOpenSeaMargin(map: GameMap): void {
  const region = map.regions?.[0] ?? "core";
  const seen = new Set(Object.keys(map.tiles));
  let frontier: Coord[] = Object.keys(map.tiles).map(parseKey);
  for (let ring = 1; ring <= OPEN_SEA_MARGIN; ring += 1) {
    const next: Coord[] = [];
    for (const c of frontier) {
      for (const n of neighborsOf(c)) {
        const k = keyOf(n);
        if (seen.has(k)) continue;
        seen.add(k);
        map.tiles[k] = { terrain: "sea", region, open: ring };
        next.push(n);
      }
    }
    frontier = next;
  }
}

// ---- Off-grid corsairs (raiders.md) -----------------------------------------
// Raiders don't sit on the map like barbarian camps — they gather beyond the
// world's edge, out in the open-sea belt you can't see into, and fall on a coastal
// city. A raid is WARNED a turn ahead ("sails on the horizon"), giving you time to
// muster, then STRIKES: its strength is checked against the city's defence. Beat it
// and your walls hold (a warship in port sinks the fleet for plunder); lose and the
// city is pillaged — gold and, if overwhelmed, people. You never see their home, so
// you can't march on it; you can only defend, or pay them off. Fully seeded.
export const RAID_START_TURN = 6;   // corsairs first appear once realms are established
export const RAID_WARN_LEAD = 1;    // world-turns of warning before the blow lands
export const RAID_MAX_ACTIVE = 2;   // raids in flight at once (keeps it a threat, not a flood)
export const RAID_CHANCE = 0.28;    // per-world-turn odds a fresh raid gathers

const cityDisplayName = (city: City): string => city.name || city.id;

/** Gold that buys a raid off outright — scales with how big the fleet is. */
export function raidTributeCost(raid: Raid): number {
  return Math.round(raid.strength * 1.5 + 8);
}

/** Coastal cities a raid could target, in a deterministic order. */
function raidableCities(state: GameState): City[] {
  return Object.values(state.map.cities)
    .filter((c) => isCoastalCity(state, c.id))
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** The nearest off-grid ocean tile to a city — where the fleet gathers on the horizon. */
function beltTileNear(state: GameState, city: City): Coord | undefined {
  let best: Coord | undefined;
  let bestKey = "";
  let bestDist = Infinity;
  for (const [key, tile] of Object.entries(state.map.tiles)) {
    if (!tile.open) continue;
    const pos = parseKey(key);
    const d = distance(pos, city.position);
    if (d < bestDist || (d === bestDist && key < bestKey)) {
      bestDist = d;
      bestKey = key;
      best = pos;
    }
  }
  return best;
}

/** How stoutly a city can meet a raid: fortifications (age + intact walls + a port)
 *  plus the troops standing on or beside it; a warship in port counts double. */
function raidDefense(state: GameState, city: City): { defense: number; naval: boolean } {
  const owner = state.playersById[city.ownerId];
  const age = playerAge(owner);
  let defense = 8 + age * 4 + (city.hp / Math.max(1, city.maxHp)) * 6;
  if ((city.buildings ?? []).includes("harbor")) defense += 5;

  let naval = false;
  for (const unit of Object.values(state.map.units)) {
    if (unit.ownerId !== city.ownerId) continue;
    const def = UNITS[unit.type];
    if (!def) continue;
    const dist = distance(unit.position, city.position);
    if (dist > 1) continue;
    const value = (def.defense ?? 0) * (unit.hp / Math.max(1, unit.maxHp)) * veterancyMultiplier(unit.veterancy);
    if (def.domain === "naval") {
      defense += value * 1.3; // a trireme in port meets the raiders at sea
      naval = true;
    } else if (def.domain === "land") {
      defense += dist === 0 ? value : value * 0.6; // the garrison holds; nearby troops rush in
    }
  }
  return { defense, naval };
}

/** Resolve every raid whose blow lands on the world-turn that just began, narrating
 *  each outcome on state.raidReports and clearing any human's pending warning. */
function resolveRaids(state: GameState): void {
  state.raidReports = [];
  const raids = state.raids ?? [];
  const survivors: Raid[] = [];

  for (const raid of raids) {
    const city = state.map.cities[raid.targetCityId];
    if (!city) continue; // the city fell or vanished — the raid finds nothing
    if (raid.strikeTurn > state.turn) {
      survivors.push(raid);
      continue;
    }

    const owner = state.playersById[city.ownerId];
    const { defense, naval } = raidDefense(state, city);
    const report: RaidReport = {
      kind: "repelled",
      cityId: city.id,
      cityName: cityDisplayName(city),
      playerId: city.ownerId,
      strength: raid.strength
    };

    if (defense >= raid.strength) {
      // Repelled. A warship on station turns the tide into a rout — salvage + ransom.
      if (naval) {
        report.kind = "sunk";
        report.goldGained = Math.round(raid.strength * 0.5);
        if (owner) owner.gold += report.goldGained;
      }
    } else {
      // The walls are breached: coin is carried off, and a badly outmatched city
      // loses people too. The city always survives (a raid sacks, it doesn't hold).
      report.kind = "pillaged";
      const overrun = raid.strength - defense;
      report.goldLost = Math.min(owner?.gold ?? 0, Math.round(overrun * 2 + 6));
      report.hpLost = Math.min(Math.max(0, city.hp - 1), Math.round(overrun * 1.5));
      report.popLost = raid.strength >= defense * 2 && city.population > 1 ? 1 : 0;
      if (owner) owner.gold -= report.goldLost;
      city.hp = Math.max(1, city.hp - (report.hpLost ?? 0));
      city.population = Math.max(1, city.population - (report.popLost ?? 0));
      city.lastAttackedTurn = state.turn; // a sacked city doesn't mend its walls this turn
    }

    state.raidReports.push(report);
  }

  state.raids = survivors;
  // Clear any player's pending warning that no longer points at a live raid (it
  // struck, was bought off, or its city vanished) — keeps the marker honest.
  const liveIds = new Set(survivors.map((r) => r.id));
  for (const p of state.players) {
    if (p.pendingRaid && !liveIds.has(p.pendingRaid)) p.pendingRaid = undefined;
  }
}

/** Once per world-turn, perhaps gather a fresh raid on the horizon and warn its target. */
function scheduleRaid(state: GameState): void {
  if (state.turn < RAID_START_TURN) return;
  const active = state.raids ?? [];
  if (active.length >= RAID_MAX_ACTIVE) return;

  const targets = raidableCities(state).filter(
    (c) => !active.some((r) => r.targetCityId === c.id)
  );
  if (targets.length === 0) return;

  const roll = seededRandom(state.seed, `raid:${state.turn}`)();
  if (roll >= RAID_CHANCE) return;

  const pickRand = seededRandom(state.seed, `raidtarget:${state.turn}`)();
  const city = targets[Math.min(targets.length - 1, Math.floor(pickRand * targets.length))]!;
  const owner = state.playersById[city.ownerId];
  const era = playerAge(owner);
  const wealth = Math.min(16, (city.population ?? 1) * 1.5 + Math.floor((owner?.gold ?? 0) / 40));
  const powerRand = seededRandom(state.seed, `raidpower:${state.turn}`)();
  const strength = Math.round((12 + (era - 1) * 14 + wealth) * (0.85 + 0.4 * powerRand));

  const raid: Raid = {
    id: `raid_${state.turn}_${city.id}`,
    targetCityId: city.id,
    approach: beltTileNear(state, city),
    warnTurn: state.turn,
    strikeTurn: state.turn + RAID_WARN_LEAD,
    strength,
    era
  };
  state.raids = [...active, raid];
  state.raidReports = [
    ...(state.raidReports ?? []),
    {
      kind: "warning",
      cityId: city.id,
      cityName: cityDisplayName(city),
      playerId: city.ownerId,
      strength,
      approach: raid.approach,
      strikeTurn: raid.strikeTurn
    }
  ];
  // Mark the target's owner as having a raid to answer — set DETERMINISTICALLY for
  // whichever player is targeted (never keyed to humanPlayerId, which differs per
  // client and would break lockstep). The client shows the card only for the local
  // human; the AI just braces (never sends RESOLVE_RAID), and the strike clears it.
  if (owner && !owner.pendingRaid) owner.pendingRaid = raid.id;
}

function applyResolveRaid(state: GameState, action: ResolveRaidAction): void {
  const player = state.playersById[action.playerId];
  if (!player) throw new Error(`Unknown player ${action.playerId}`);
  const raid = (state.raids ?? []).find((r) => r.id === action.raidId);
  if (!raid) {
    player.pendingRaid = undefined; // already resolved (it struck, or was bought off)
    return;
  }
  if (action.choice === "tribute") {
    const cost = raidTributeCost(raid);
    if (player.gold >= cost) {
      player.gold -= cost;
      state.raids = (state.raids ?? []).filter((r) => r.id !== raid.id);
      const city = state.map.cities[raid.targetCityId];
      state.raidReports = [
        ...(state.raidReports ?? []),
        {
          kind: "bought-off",
          cityId: raid.targetCityId,
          cityName: city ? cityDisplayName(city) : raid.targetCityId,
          playerId: player.id,
          strength: raid.strength,
          goldPaid: cost
        }
      ];
    }
    // Can't afford the tribute? The offer lapses and you must brace for the blow.
  }
  player.pendingRaid = undefined;
}

export function createInitialGameState(config: CreateGameConfig = {}): GameState {
  const players = normalizePlayers(config.players);
  const map = normalizeMap(config.map);
  addOpenSeaMargin(map); // sailable ocean around the board (see above)

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
    actionLog: [],
    costScale: mapCostScale(map.width, map.height),
    allianceVictory: config.allianceVictory ?? true,
    rotateInitiative: config.rotateInitiative ?? true
  };

  syncOwnershipIndexes(state);
  initDiplomacy(state); // every civ-pair starts Neutral (0)
  if (!state.map.ruins) state.map.ruins = scatterRuins(state.map, state.seed); // §10.2 discovery sites
  if (!state.map.villages) state.map.villages = scatterVillages(state.map, state.seed, new Set(Object.keys(state.map.ruins))); // §10.3 minor peoples
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
  const upkeep = player.unitIds.reduce((sum, id) => { const u = state.map.units[id]; return sum + (u && !u.garrison ? UNITS[u.type].upkeep || 0 : 0); }, 0);
  income.gold -= upkeep;
  income.gold += tradeRouteIncome(state, playerId);
  // Net food after the army's food-tax (can go negative — a deficit stalls growth).
  income.food -= playerFoodUpkeep(state, playerId);
  // Equipped-General perks show up in the per-turn readout.
  const perks = player.perks;
  if (perks) {
    income.food += perks.food ?? 0;
    income.production += perks.production ?? 0;
    income.gold += perks.gold ?? 0;
    income.science += perks.science ?? 0;
  }
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

  // Domination: one sovereign controls every capital — directly or through vassals
  // (§4: a hegemon can win without razing the world).
  if (capitals.length > 0) {
    const owner = topOverlord(state, capitals[0].ownerId);
    if (capitals.every((city) => topOverlord(state, city.ownerId) === owner)) {
      return { winnerId: owner, type: "domination", reason: `${owner} controls all capitals (directly or through vassals)` };
    }
  }

  // Alliance victory (§6): two Full Allies of 30+ turns whose capitals (with their
  // vassals) cover the whole world win JOINTLY — no mandatory endgame backstab.
  if (state.allianceVictory !== false && capitals.length > 0) {
    for (const [a, b] of fullAlliancesHeld(state, ALLIANCE_VICTORY_HOLD)) {
      if (capitals.every((city) => { const t = topOverlord(state, city.ownerId); return t === a || t === b; })) {
        const scores = computeScores(state);
        const lead = (scores[a] ?? 0) >= (scores[b] ?? 0) ? a : b;
        return { winnerId: lead, type: "alliance", allies: [a, b], reason: `${a} & ${b} share the world through their Full Alliance` };
      }
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

// Cities v3 §2 — found a district on one of the six hexes around a city.
const DISTRICT_GOLD_COST = 40;
const DISTRICT_REPAIR_LABOUR = 15;
function applyBuildDistrict(state: GameState, action: BuildDistrictAction): void {
  assertPlayerTurn(state, action.playerId);
  const player = state.playersById[action.playerId];
  const city = state.map.cities[action.cityId];
  if (!city || city.ownerId !== action.playerId) throw new Error("You can only build districts in your own city");
  // The requested id is either a district TYPE or a GREAT WORK card id (C2).
  const gw = greatWork(action.districtType);
  const dt = gw ? districtType("greatwork") : districtType(action.districtType);
  if (!dt) throw new Error(`Unknown district type ${action.districtType}`);
  city.districts = city.districts ?? [];
  if (city.districts.length >= districtSlots(city)) throw new Error("No free district slot at this city's tier");
  const adj = neighborsOf(city.position).map((n) => keyOf(n));
  if (!adj.includes(action.hex)) throw new Error("A district must sit on a hex adjacent to the city");
  if (city.districts.some((d) => d.hex === action.hex)) throw new Error("That hex already holds a district");
  const tile = state.map.tiles[action.hex];
  if (!tile) throw new Error("No such tile");
  const water = tile.terrain === "coast" || tile.terrain === "sea";
  if (dt.requires === "coast") { if (tile.terrain !== "coast") throw new Error("A harbour needs a coast hex"); }
  else if (water) throw new Error("A district needs a land hex");
  const claim = claimingCity(state, parseKey(action.hex));
  if (!claim || claim.id !== city.id) throw new Error("That hex is not worked by this city");
  if (gw) {
    // Great Work: civ must match (or civ:null universal), one Great Work per city.
    if (!greatWorkAllowed(gw, String(player.civ))) throw new Error(`${gw.name} is not your civilisation's Great Work`);
    if (city.districts.some((d) => d.type === "greatwork")) throw new Error("A city may hold only one Great Work");
    // heritage (restore an ancient monument) is cheaper than a from-scratch build.
    const cost = Math.round((gw.kind === "heritage" ? 40 : 100) * (state.costScale || 1));
    if (player.gold < cost) throw new Error("Not enough gold for the Great Work");
    player.gold -= cost;
    city.districts.push({ hex: action.hex, type: "greatwork", work: gw.id });
    return;
  }
  if (districtForbidden(action.districtType, String(player.civ))) throw new Error(`${player.civ} cannot build a ${action.districtType}`);
  if (dt.limit === "one-per-city" && city.districts.some((d) => districtType(d.type)?.limit === "one-per-city")) throw new Error("Only one such district per city");
  const cost = Math.round(DISTRICT_GOLD_COST * (state.costScale || 1));
  if (player.gold < cost) throw new Error("Not enough gold to found the district");
  player.gold -= cost;
  city.districts.push({ hex: action.hex, type: action.districtType });
}
// Diplomacy v1 §1 — a gift of gold. Transfers the coin and warms the pair's
// relation (+1 per 25g, diminishing as relations improve).
function applyGiftGold(state: GameState, action: GiftGoldAction): void {
  assertPlayerTurn(state, action.playerId);
  const giver = state.playersById[action.playerId];
  const target = state.playersById[action.targetId];
  if (!giver || !target) throw new Error("Unknown player in gift");
  if (action.targetId === action.playerId) throw new Error("You cannot gift yourself");
  const amount = Math.floor(action.amount);
  if (!(amount > 0)) throw new Error("A gift must be a positive amount of gold");
  if (giver.gold < amount) throw new Error("Not enough gold for that gift");
  giver.gold -= amount;
  target.gold += amount;
  adjustRelation(state, action.playerId, action.targetId, giftRelationGain(amount, getRelation(state, action.playerId, action.targetId)));
}

// Diplomacy §3 — a formal war declaration (the defender's 1-turn alert is
// flavour for now). Breaking a NAP this way brands you (handled in enterWar).
function applyDeclareWar(state: GameState, action: DeclareWarAction): void {
  assertPlayerTurn(state, action.playerId);
  if (action.targetId === action.playerId) throw new Error("You cannot declare war on yourself");
  if (!state.playersById[action.targetId]) throw new Error("Unknown target for the declaration");
  if (isAtWar(state, action.playerId, action.targetId)) throw new Error("You are already at war");
  // A standing NAP forbids a formal declaration until you denounce it and wait
  // out the cooldown (§2); to strike sooner you must surprise-attack (and be branded).
  if (napBlocksDeclaration(state, action.playerId, action.targetId)) throw new Error("A non-aggression pact forbids declaring war — denounce it first");
  enterWar(state, action.playerId, action.targetId);
}

// Diplomacy §2 — put a Trade Pact / NAP in front of the target as a pending offer.
function applyProposeAgreement(state: GameState, action: ProposeAgreementAction): void {
  assertPlayerTurn(state, action.playerId);
  const ok = canProposeAgreement(state, action.playerId, action.targetId, action.agreementType);
  if (ok !== true) throw new Error(ok);
  state.playersById[action.targetId].pendingProposal = { from: action.playerId, kind: action.agreementType };
}

// Diplomacy §4 — offer one-way gold/turn for guaranteed peace (held as a pending
// proposal by the receiver).
function applyOfferTribute(state: GameState, action: OfferTributeAction): void {
  assertPlayerTurn(state, action.playerId);
  if (action.targetId === action.playerId) throw new Error("You cannot pay tribute to yourself");
  const target = state.playersById[action.targetId];
  if (!target) throw new Error("Unknown civ");
  if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
  if (target.pendingProposal) throw new Error("They are still weighing another offer");
  const amount = Math.floor(action.amount);
  if (!(amount > 0)) throw new Error("Tribute must be a positive amount");
  const turns = Math.max(TRIBUTE_MIN_TURNS, Math.min(TRIBUTE_MAX_TURNS, Math.floor(action.turns) || TRIBUTE_MIN_TURNS));
  target.pendingProposal = { from: action.playerId, kind: "tribute", amount, turns };
}

// Diplomacy §2 — resolve the pending proposal held by action.playerId.
function applyResolveProposal(state: GameState, action: ResolveProposalAction): void {
  assertPlayerTurn(state, action.playerId);
  const me = state.playersById[action.playerId];
  if (!me || !me.pendingProposal) throw new Error("You have no proposal to answer");
  const prop = me.pendingProposal;
  me.pendingProposal = undefined;
  const from = prop.from;
  if (!action.accept) { adjustRelation(state, action.playerId, from, DECLINE_RELATION); return; }
  if (prop.kind === "trade-pact" || prop.kind === "passage" || prop.kind === "defensive-alliance" || prop.kind === "full-alliance") {
    addAgreement(state, action.playerId, from, prop.kind, 0); // standing until war / denounce
  } else if (prop.kind === "nap") addAgreement(state, action.playerId, from, "nap", state.turn + NAP_TURNS);
  else if (prop.kind === "vassalage") {
    const vassalId = prop.vassalId as string;
    const overlordId = vassalId === from ? action.playerId : from;
    establishVassalage(state, overlordId, vassalId);
  } else if (prop.kind === "tribute") {
    const pair = ensurePair(state, action.playerId, from);
    pair.warSince = undefined; // tribute buys peace
    pair.tribute = { to: action.playerId, amount: prop.amount ?? 0, expires: state.turn + (prop.turns ?? TRIBUTE_MIN_TURNS) };
    addAgreement(state, action.playerId, from, "nap", state.turn + (prop.turns ?? TRIBUTE_MIN_TURNS));
  }
  adjustRelation(state, action.playerId, from, ACCEPT_RELATION);
}

function applyDenounce(state: GameState, action: DenounceAction): void {
  assertPlayerTurn(state, action.playerId);
  if (action.targetId === action.playerId) throw new Error("You cannot denounce yourself");
  if (!state.playersById[action.targetId]) throw new Error("Unknown civ");
  if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
  denounce(state, action.playerId, action.targetId);
}

// Diplomacy §4 — put a vassalage (demand or submission) before the target.
function applyProposeVassalage(state: GameState, action: ProposeVassalageAction): void {
  assertPlayerTurn(state, action.playerId);
  const target = state.playersById[action.targetId];
  if (!target) throw new Error("Unknown civ");
  if (action.targetId === action.playerId) throw new Error("You cannot vassalise yourself");
  if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
  if (target.pendingProposal) throw new Error("They are still weighing another offer");
  if (action.vassalId !== action.playerId && action.vassalId !== action.targetId) throw new Error("The vassal must be one of the two parties");
  if (isVassal(state, action.vassalId)) throw new Error("That civ already serves an overlord");
  const overlordId = action.vassalId === action.playerId ? action.targetId : action.playerId;
  // A DEMAND (you propose the OTHER submit) needs the 2:1 edge; a submission does not.
  if (action.vassalId === action.targetId) {
    const ok = canDemandVassalage(state, overlordId, action.vassalId);
    if (ok !== true) throw new Error(ok);
  }
  target.pendingProposal = { from: action.playerId, kind: "vassalage", vassalId: action.vassalId };
}

function applyReleaseVassal(state: GameState, action: ReleaseVassalAction): void {
  assertPlayerTurn(state, action.playerId);
  const vassal = state.playersById[action.targetId];
  if (!vassal || vassal.vassalOf !== action.playerId) throw new Error("That civ is not your vassal");
  releaseVassal(state, action.playerId, action.targetId);
}

// ---- Minor Peoples §10.3 -------------------------------------------------
function villageAt(state: GameState, hex: string) {
  const v = state.map.villages?.[hex];
  if (!v) throw new Error("There is no village there");
  return v;
}
function makeTown(state: GameState, playerId: string, hex: string, pop: number): void {
  const at = parseKey(hex);
  if (Object.values(state.map.cities).some((c) => c.position.q === at.q && c.position.r === at.r)) return;
  const id = `${playerId}_town_${at.q}_${at.r}`;
  state.map.cities[id] = { id, ownerId: playerId, position: { q: at.q, r: at.r }, population: pop, hp: 24, maxHp: 24 };
}
// Your general (role + rarity) plus an Explorer-envoy edge shift the reaction
// odds. Exported so the client shows the SAME number the roll uses.
export function villageReactionBonus(state: GameState, playerId: string, hex: string, deed: VillageDeed): number {
  let bonus = leaderReactionBonus(state.leaders?.[playerId], deed);
  if (explorerNear(state, playerId, hex)) bonus += EXPLORER_ENVOY_BONUS;
  return bonus;
}
// Record the outcome for the client to surface (transient; reset each applyAction).
function setReaction(state: GameState, playerId: string, hex: string, peopleId: string, deed: VillageDeed, comply: boolean, chance: number, message: string): void {
  state.lastReaction = { hex, peopleId, action: deed, comply, chance, playerId, message };
}
function applyBefriendVillage(state: GameState, action: BefriendVillageAction): void {
  assertPlayerTurn(state, action.playerId);
  const v = villageAt(state, action.hex);
  const hasEnvoy = explorerNear(state, action.playerId, action.hex);
  // Only an Explorer envoy can court the openly hostile — anyone else is refused.
  if (v.disposition === "hostile" && !hasEnvoy) throw new Error("They are hostile — bring an Explorer to court them, or take them by force");
  if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
  const player = state.playersById[action.playerId];
  const cost = befriendCostFor(state, action.playerId, action.hex); // an Explorer courts them for far less
  if (player.gold < cost) throw new Error("Not enough gold to court them");
  const people = PEOPLE_BY_ID[v.peopleId];
  v.attempts = (v.attempts ?? 0) + 1;
  const react = rollReaction(people, v.disposition, "befriend", villageReactionBonus(state, action.playerId, action.hex, "befriend"), state.seed, action.hex, v.attempts);
  if (react.comply) {
    player.gold -= cost; // the gift only changes hands once they accept
    applyVillageBenefit(state, action.playerId, people.benefit, parseKey(action.hex), false);
    v.befriendedBy = action.playerId;
    v.disposition = "open";
    setReaction(state, action.playerId, action.hex, v.peopleId, "befriend", true, react.chance, `🤝 ${people.name} accept your friendship.`);
    syncOwnershipIndexes(state); // a recruited levy needs indexing
  } else {
    // They refuse — the gift is withheld, their mood sours a notch; if it curdles
    // to Hostile they raid the offender. Repeated pushy overtures get harder.
    v.disposition = souredDisposition(v.disposition);
    let msg = `🚫 ${people.name} rebuff your overture`;
    if (v.disposition === "hostile") { const loss = pillageOnThreaten(state, action.playerId, THREATEN_RAID_GOLD); msg += loss > 0 ? ` and raid you for ${loss}g` : " and turn hostile"; }
    setReaction(state, action.playerId, action.hex, v.peopleId, "befriend", false, react.chance, msg + ".");
  }
}
function applyDemandTributeVillage(state: GameState, action: DemandTributeVillageAction): void {
  assertPlayerTurn(state, action.playerId);
  const v = villageAt(state, action.hex);
  if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
  const people = PEOPLE_BY_ID[v.peopleId];
  v.attempts = (v.attempts ?? 0) + 1;
  v.befriendedBy = undefined; // a shakedown ends any friendship regardless
  const react = rollReaction(people, v.disposition, "tribute", villageReactionBonus(state, action.playerId, action.hex, "tribute"), state.seed, action.hex, v.attempts);
  if (react.comply) {
    state.playersById[action.playerId].gold += TRIBUTE_GAIN;
    v.disposition = souredDisposition(v.disposition); // they pay, but resent it
    setReaction(state, action.playerId, action.hex, v.peopleId, "tribute", true, react.chance, `💰 ${people.name} hand over ${TRIBUTE_GAIN}g, grumbling.`);
  } else {
    v.disposition = souredDisposition(v.disposition);
    let msg = `🚫 ${people.name} refuse to be shaken down`;
    if (v.disposition === "hostile") { const loss = pillageOnThreaten(state, action.playerId, THREATEN_RAID_GOLD); msg += loss > 0 ? ` and raid you for ${loss}g` : " and turn hostile"; }
    setReaction(state, action.playerId, action.hex, v.peopleId, "tribute", false, react.chance, msg + ".");
  }
}
function applyConquerVillage(state: GameState, action: ConquerVillageAction): void {
  assertPlayerTurn(state, action.playerId);
  const v = villageAt(state, action.hex);
  if (!unitNear(state, action.playerId, action.hex, true)) throw new Error("Bring a soldier to take the village");
  applyVillageBenefit(state, action.playerId, PEOPLE_BY_ID[v.peopleId].benefit, parseKey(action.hex), true); // knowledge burns
  makeTown(state, action.playerId, action.hex, 1);
  for (const other of state.players) if (other.id !== action.playerId) adjustRelation(state, action.playerId, other.id, CONQUEST_REPUTATION_HIT);
  delete state.map.villages![action.hex];
  syncOwnershipIndexes(state);
}
function applyAbsorbVillage(state: GameState, action: AbsorbVillageAction): void {
  assertPlayerTurn(state, action.playerId);
  const v = villageAt(state, action.hex);
  if (v.befriendedBy !== action.playerId) throw new Error("Befriend them before you absorb them");
  if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
  const people = PEOPLE_BY_ID[v.peopleId];
  v.attempts = (v.attempts ?? 0) + 1;
  const react = rollReaction(people, v.disposition, "assimilate", villageReactionBonus(state, action.playerId, action.hex, "assimilate"), state.seed, action.hex, v.attempts);
  if (react.comply) {
    if (action.mode === "join") makeTown(state, action.playerId, action.hex, 2);
    else applyVillageBenefit(state, action.playerId, { pop: 2 }, parseKey(action.hex), false); // migrate
    delete state.map.villages![action.hex];
    setReaction(state, action.playerId, action.hex, v.peopleId, "assimilate", true, react.chance, `🏘️ ${people.name} join your realm.`);
    syncOwnershipIndexes(state);
  } else {
    // They balk at union; friendship cools a notch. If it curdles to Hostile the
    // bond breaks and you must win them over again.
    v.disposition = souredDisposition(v.disposition);
    if (v.disposition === "hostile") v.befriendedBy = undefined;
    setReaction(state, action.playerId, action.hex, v.peopleId, "assimilate", false, react.chance, `🚫 ${people.name} are not ready to surrender their independence.`);
  }
}
// An Explorer that ends adjacent to an un-contacted village warms it a step (§10.3).
function contactVillages(state: GameState, playerId: string): void {
  if (!state.map.villages) return;
  const units = (state.playersById[playerId]?.unitIds ?? []).map((id) => state.map.units[id]).filter((u) => u && u.type === "explorer");
  if (!units.length) return;
  for (const key of Object.keys(state.map.villages)) {
    const v = state.map.villages[key];
    if (v.contacted) continue;
    const at = parseKey(key);
    const ring = new Set([key, ...neighborsOf(at).map((n) => `${n.q},${n.r}`)]);
    if (units.some((u) => ring.has(`${u.position.q},${u.position.r}`))) {
      v.contacted = true;
      v.disposition = DISPOSITIONS[Math.min(DISPOSITIONS.length - 1, DISPOSITIONS.indexOf(v.disposition) + 1)];
    }
  }
}

export const ENVOY_GOODWILL = 4; // first contact via an Explorer opens on a warm note
// First contact (§10.3): whatever the ending player can SEE this turn — any other
// civ's unit, city, or territory in their vision — establishes contact with that
// civ. Diplomacy is impossible until this is set (no envoy to a people you have
// never met). An Explorer that reaches them adds a one-time goodwill nudge.
function contactCivs(state: GameState, playerId: string): void {
  const player = state.playersById[playerId];
  if (!player) return;
  state.contact = state.contact ?? {};
  const met = new Set(state.contact[playerId] ?? []);
  const before = new Set(met);
  const vis = new Set(computeVisibility(state, playerId).visibleTiles);
  const territory = computeTerritory(state);
  for (const u of Object.values(state.map.units)) {
    if (u.ownerId !== playerId && vis.has(`${u.position.q},${u.position.r}`)) met.add(u.ownerId);
  }
  for (const c of Object.values(state.map.cities)) {
    if (c.ownerId !== playerId && vis.has(`${c.position.q},${c.position.r}`)) met.add(c.ownerId);
  }
  for (const [k, owner] of Object.entries(territory)) {
    if (owner !== playerId && vis.has(k)) met.add(owner);
  }
  for (const id of [...met]) if (!state.playersById[id]) met.delete(id);
  if (met.size === before.size) return;
  state.contact[playerId] = [...met];
  // An Explorer envoy that physically reached a newly-met civ opens warmly.
  const explorers = (player.unitIds ?? []).map((id) => state.map.units[id]).filter((u) => u && u.type === "explorer");
  for (const other of met) {
    if (before.has(other)) continue; // already known
    if ((state.contact[other] ?? []).includes(playerId)) continue; // they reached us first
    const envoyReached = explorers.some((ex) =>
      Object.values(state.map.units).some((u) => u.ownerId === other && distance(ex.position, u.position) <= 2) ||
      [`${ex.position.q},${ex.position.r}`, ...neighborsOf(ex.position).map((n) => `${n.q},${n.r}`)].some((k) => territory[k] === other)
    );
    if (envoyReached) adjustRelation(state, playerId, other, ENVOY_GOODWILL);
  }
}

// Per-turn diplomacy income for the player ending their turn: a standing Trade
// Pact pays +1 gold; tribute flows from the payer (once, on their turn) to the
// receiver — a payer who cannot afford it collapses the deal and sours relations.
function applyDiplomacyIncome(state: GameState, player: Player): void {
  if (!state.diplomacy) return;
  for (const key of Object.keys(state.diplomacy)) {
    const [a, b] = key.split("|");
    if (a !== player.id && b !== player.id) continue;
    const other = a === player.id ? b : a;
    const pair = state.diplomacy[key];
    if (hasAgreement(state, player.id, other, "trade-pact")) player.gold += TRADE_PACT_GOLD;
    const trib = pair.tribute;
    if (trib && trib.expires > state.turn && trib.to !== player.id) { // player is the payer
      const receiver = state.playersById[trib.to];
      const pay = Math.min(trib.amount, player.gold);
      player.gold -= pay;
      if (receiver) receiver.gold += pay;
      if (pay < trib.amount) { pair.tribute = null; adjustRelation(state, player.id, other, -10); }
    }
  }
  // A vassal remits a share of its gold income to its overlord (§4).
  if (player.vassalOf) {
    const overlord = state.playersById[player.vassalOf];
    if (overlord) {
      const share = Math.floor(VASSAL_GOLD_SHARE * Math.max(0, computePlayerIncome(state, player.id).gold));
      const pay = Math.min(share, player.gold);
      player.gold -= pay;
      overlord.gold += pay;
    }
  }
}
function applyRepairDistrict(state: GameState, action: RepairDistrictAction): void {
  assertPlayerTurn(state, action.playerId);
  const city = state.map.cities[action.cityId];
  if (!city || city.ownerId !== action.playerId) throw new Error("Not your city");
  const d = (city.districts ?? []).find((x) => x.hex === action.hex);
  if (!d || !d.pillaged) throw new Error("No pillaged district on that hex");
  const cost = Math.round(DISTRICT_REPAIR_LABOUR * (state.costScale || 1));
  if ((city.production ?? 0) < cost) throw new Error("Not enough banked labour to repair");
  city.production = (city.production ?? 0) - cost;
  d.pillaged = false;
}

export function applyAction(inputState: GameState, action: GameAction): GameState {
  const state = deepClone(inputState);
  state.playersById = makePlayersById(state.players);
  state.lastReaction = undefined; // transient — set only by a Minor-People reaction below

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
    case "RESOLVE_RAID":
      applyResolveRaid(state, action);
      break;
    case "RESOLVE_FIGURE":
      applyResolveFigure(state, action);
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
    case "DISBAND_UNIT":
      applyDisbandUnit(state, action);
      break;
    case "RENAME_CITY":
      applyRenameCity(state, action);
      break;
    case "BUILD_DISTRICT":
      applyBuildDistrict(state, action);
      break;
    case "REPAIR_DISTRICT":
      applyRepairDistrict(state, action);
      break;
    case "GIFT_GOLD":
      applyGiftGold(state, action);
      break;
    case "DECLARE_WAR":
      applyDeclareWar(state, action);
      break;
    case "PROPOSE_AGREEMENT":
      applyProposeAgreement(state, action);
      break;
    case "RESOLVE_PROPOSAL":
      applyResolveProposal(state, action);
      break;
    case "OFFER_TRIBUTE":
      applyOfferTribute(state, action);
      break;
    case "DENOUNCE":
      applyDenounce(state, action);
      break;
    case "PROPOSE_VASSALAGE":
      applyProposeVassalage(state, action);
      break;
    case "RELEASE_VASSAL":
      applyReleaseVassal(state, action);
      break;
    case "BEFRIEND_VILLAGE":
      applyBefriendVillage(state, action);
      break;
    case "DEMAND_TRIBUTE_VILLAGE":
      applyDemandTributeVillage(state, action);
      break;
    case "CONQUER_VILLAGE":
      applyConquerVillage(state, action);
      break;
    case "ABSORB_VILLAGE":
      applyAbsorbVillage(state, action);
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
  RESOURCES,
  BUILD_RESOURCE,
  EVENTS,
  getEvent
};
