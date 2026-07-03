"use strict";
var HegemonEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/engine/browser-entry.ts
  var browser_entry_exports = {};
  __export(browser_entry_exports, {
    CIV_ROSTER: () => CIV_ROSTER,
    DEFAULT_PLAYERS: () => DEFAULT_PLAYERS,
    MAP_SIZES: () => MAP_SIZES,
    MAX_PLAYERS: () => MAX_PLAYERS,
    TECHS: () => TECHS,
    TERRAIN: () => TERRAIN,
    UNITS: () => UNITS,
    UNIT_BUILD_COSTS: () => UNIT_BUILD_COSTS,
    WEATHER_STATES: () => WEATHER_STATES,
    applyAction: () => applyAction,
    canResearch: () => canResearch,
    chooseAiAction: () => chooseAiAction,
    computeCombatPreview: () => computeCombatPreview,
    computeVisibility: () => computeVisibility,
    createInitialGameState: () => createInitialGameState,
    deserializeState: () => deserializeState,
    distance: () => distance,
    findPath: () => findPath,
    generateMap: () => generateMap,
    getVictoryStatus: () => getVictoryStatus,
    keyOf: () => keyOf,
    listScenarios: () => listScenarios,
    loadScenario: () => loadScenario,
    movementCost: () => movementCost,
    parseKey: () => parseKey,
    replayActions: () => replayActions,
    researchCost: () => researchCost,
    runAiTurn: () => runAiTurn,
    serializeState: () => serializeState
  });

  // src/engine/data.ts
  var TERRAIN = {
    plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
    valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
    forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
    hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
    mountains: { moveCost: 3, yields: { food: 0, production: 1, gold: 0 }, defense: 0.5, vision: 0, impassableWithoutTech: "mountain-paths" },
    desert: { moveCost: 2, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0 },
    coast: { moveCost: 1, yields: { food: 1, production: 0, gold: 1 }, defense: 0, vision: 0, navalOnly: true },
    sea: { moveCost: 1, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0, navalOnly: true, requiresTech: "open-sea-sailing" }
  };
  var WEATHER_STATES = {
    clear: {},
    rain: { mountedMovePenalty: 1, riverCrossingExtra: 1 },
    fog: { visionPenalty: 1, ambushMultiplier: 2 },
    storm: { deepSeaDamage: 2, deepSeaEntryBlocked: true },
    heat: { desertAttritionMultiplier: 2 }
  };
  var TECHS = {
    "bronze-working": { age: 1, prerequisites: [] },
    sailing: { age: 1, prerequisites: [] },
    writing: { age: 1, prerequisites: [] },
    masonry: { age: 1, prerequisites: [] },
    archery: { age: 1, prerequisites: [] },
    irrigation: { age: 1, prerequisites: [] },
    "phalanx-doctrine": {
      age: 1,
      prerequisites: ["bronze-working"],
      forkGroup: "warfare-doctrine",
      forkBranch: "phalanx"
    },
    "skirmish-doctrine": {
      age: 1,
      prerequisites: ["archery"],
      forkGroup: "warfare-doctrine",
      forkBranch: "skirmish"
    },
    "temple-economy": {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "temple"
    },
    coinage: {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "coinage"
    },
    "iron-working": { age: 2, prerequisites: ["bronze-working"] },
    "open-sea-sailing": { age: 2, prerequisites: ["sailing"] },
    engineering: { age: 2, prerequisites: ["masonry"] },
    "horseback-riding": { age: 2, prerequisites: ["bronze-working"] },
    "mountain-paths": { age: 2, prerequisites: ["engineering"] },
    "caravan-logistics": { age: 2, prerequisites: ["coinage"] },
    republic: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "republic"
    },
    monarchy: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "monarchy"
    },
    "ramming-fleets": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "ramming"
    },
    "merchant-marine": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "merchant"
    },
    "roads-logistics": { age: 3, prerequisites: ["engineering"] },
    siegecraft: { age: 3, prerequisites: ["iron-working"] },
    medicine: { age: 3, prerequisites: ["writing"] },
    "law-administration": { age: 3, prerequisites: ["writing"] },
    "currency-reform": { age: 3, prerequisites: ["coinage"] },
    cartography: { age: 3, prerequisites: ["open-sea-sailing"] },
    assimilation: {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "assimilation"
    },
    "tribute-empire": {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "tribute"
    }
  };
  var UNITS = {
    warrior: { domain: "land", movement: 2, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1, category: "infantry" },
    archer: { domain: "land", movement: 2, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1, category: "ranged" },
    spearman: {
      domain: "land",
      movement: 2,
      attack: 15,
      defense: 22,
      maxHp: 20,
      range: 1,
      upkeep: 1,
      requiresTech: "bronze-working",
      category: "spear",
      counters: { mounted: 0.6 }
    },
    swordsman: {
      domain: "land",
      movement: 2,
      attack: 27,
      defense: 20,
      maxHp: 22,
      range: 1,
      upkeep: 2,
      requiresTech: "iron-working",
      category: "heavy",
      counters: { ranged: 0.35, spear: 0.2 }
    },
    horseman: {
      domain: "land",
      movement: 3,
      attack: 22,
      defense: 14,
      maxHp: 20,
      range: 1,
      upkeep: 2,
      mounted: true,
      requiresTech: "horseback-riding",
      category: "mounted",
      counters: { ranged: 0.5, infantry: 0.15 }
    },
    siege: {
      domain: "land",
      movement: 1,
      attack: 12,
      defense: 8,
      maxHp: 16,
      range: 2,
      upkeep: 2,
      requiresTech: "siegecraft",
      category: "siege",
      siegeBonus: 1.2
    },
    trireme: { domain: "naval", movement: 3, attack: 24, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "open-sea-sailing", category: "ranged" },
    merchant: { domain: "civilian", movement: 2, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1, category: "infantry" },
    settler: { domain: "civilian", movement: 2, attack: 0, defense: 6, maxHp: 12, range: 0, upkeep: 1, category: "infantry" }
  };
  var MELEE_CATEGORIES = /* @__PURE__ */ new Set(["infantry", "spear", "heavy"]);
  var RANGED_CATEGORIES = /* @__PURE__ */ new Set(["ranged", "siege"]);
  var CATEGORY_LABELS = {
    infantry: "infantry",
    spear: "spearmen",
    heavy: "heavy infantry",
    ranged: "ranged",
    mounted: "cavalry",
    siege: "siege"
  };
  var UNIT_BUILD_COSTS = {
    warrior: 12,
    archer: 14,
    spearman: 14,
    swordsman: 20,
    horseman: 20,
    siege: 24,
    trireme: 22,
    merchant: 16,
    settler: 18
  };

  // src/engine/hex.ts
  var DIRECTIONS = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1]
  ];
  function keyOf(coord) {
    return `${coord.q},${coord.r}`;
  }
  function parseKey(key) {
    const [q, r] = key.split(",").map(Number);
    return { q, r };
  }
  function neighborsOf(coord) {
    return DIRECTIONS.map(([dq, dr]) => ({ q: coord.q + dq, r: coord.r + dr }));
  }
  function distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
  function edgeKey(a, b) {
    const ak = keyOf(a);
    const bk = keyOf(b);
    return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
  }

  // src/engine/pathfinding.ts
  function movementCost(state, unit, from, to) {
    const toTile = state.map.tiles[keyOf(to)];
    if (!toTile) return Number.POSITIVE_INFINITY;
    const terrain = TERRAIN[toTile.terrain];
    if (!terrain) return Number.POSITIVE_INFINITY;
    if (terrain.navalOnly && unit.domain !== "naval") return Number.POSITIVE_INFINITY;
    if (!terrain.navalOnly && unit.domain === "naval") return Number.POSITIVE_INFINITY;
    if (terrain.requiresTech && !state.playersById[unit.ownerId].techs.includes(terrain.requiresTech)) {
      return Number.POSITIVE_INFINITY;
    }
    if (terrain.impassableWithoutTech && !state.playersById[unit.ownerId].techs.includes(terrain.impassableWithoutTech)) {
      return Number.POSITIVE_INFINITY;
    }
    let cost = terrain.moveCost;
    if (unit.mounted && state.weather.current[toTile.region] === "rain") {
      cost += 1;
    }
    const crossingKey = edgeKey(from, to);
    if (state.map.rivers[crossingKey]) {
      cost += 1;
      if (state.weather.current[toTile.region] === "rain") {
        cost += 1;
      }
    }
    return cost;
  }
  function findPath(state, unit, start, goal) {
    const startKey = keyOf(start);
    const goalKey = keyOf(goal);
    if (startKey === goalKey) return [start];
    const frontier = [{ key: startKey, cost: 0 }];
    const cameFrom = /* @__PURE__ */ new Map([[startKey, null]]);
    const costSoFar = /* @__PURE__ */ new Map([[startKey, 0]]);
    while (frontier.length > 0) {
      frontier.sort((a, b) => a.cost - b.cost);
      const current = frontier.shift();
      if (!current) break;
      const currentKey = current.key;
      if (currentKey === goalKey) break;
      const currentCoord = parseKey(currentKey);
      for (const next of neighborsOf(currentCoord)) {
        const nextKey = keyOf(next);
        const step = movementCost(state, unit, currentCoord, next);
        if (!Number.isFinite(step)) continue;
        const nextCost = (costSoFar.get(currentKey) ?? 0) + step;
        const known = costSoFar.get(nextKey);
        if (known === void 0 || nextCost < known) {
          costSoFar.set(nextKey, nextCost);
          frontier.push({ key: nextKey, cost: nextCost });
          cameFrom.set(nextKey, currentKey);
        }
      }
    }
    if (!cameFrom.has(goalKey)) return null;
    const path = [];
    let cursor = goalKey;
    while (cursor) {
      path.push(parseKey(cursor));
      cursor = cameFrom.get(cursor) ?? null;
    }
    path.reverse();
    return path;
  }

  // src/engine/rng.ts
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return function hash() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function rand() {
      t += 1831565813;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }
  function seededRandom(seed, salt) {
    const seedFn = xmur3(`${seed}:${salt}`);
    return mulberry32(seedFn());
  }

  // src/engine/visibility.ts
  var discoveredByPlayer = /* @__PURE__ */ new Map();
  function clampMin(value, minValue) {
    return value < minValue ? minValue : value;
  }
  function tileVisionBonus(state, coord) {
    const key = `${coord.q},${coord.r}`;
    const tile = state.map.tiles[key];
    if (!tile) return 0;
    if (tile.terrain === "hills") return 1;
    return 0;
  }
  function weatherVisionPenalty(state, coord) {
    const key = `${coord.q},${coord.r}`;
    const tile = state.map.tiles[key];
    if (!tile) return 0;
    return state.weather.current[tile.region] === "fog" ? 1 : 0;
  }
  function addVisibilityFromSource(state, source, baseRange, visible) {
    const sourceBonus = tileVisionBonus(state, source);
    const weatherPenalty = weatherVisionPenalty(state, source);
    const radius = clampMin(baseRange + sourceBonus - weatherPenalty, 1);
    for (const key of Object.keys(state.map.tiles)) {
      const target = parseKey(key);
      if (distance(source, target) <= radius) {
        visible.add(key);
      }
    }
  }
  function computeVisibility(state, playerId) {
    const visible = /* @__PURE__ */ new Set();
    for (const city of Object.values(state.map.cities)) {
      if (city.ownerId !== playerId) continue;
      addVisibilityFromSource(state, city.position, 2, visible);
    }
    for (const unit of Object.values(state.map.units)) {
      if (unit.ownerId !== playerId) continue;
      const unitDef = UNITS[unit.type];
      const baseRange = unitDef.range > 1 ? 3 : 2;
      addVisibilityFromSource(state, unit.position, baseRange, visible);
    }
    const discovered = discoveredByPlayer.get(playerId) ?? /* @__PURE__ */ new Set();
    for (const key of visible) {
      discovered.add(key);
    }
    discoveredByPlayer.set(playerId, discovered);
    return {
      visibleTiles: [...visible],
      discoveredTiles: [...discovered]
    };
  }

  // src/engine/index.ts
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function makePlayersById(players) {
    const result = {};
    for (const player of players) {
      result[player.id] = player;
    }
    return result;
  }
  function normalizePlayers(configPlayers) {
    const fallback = [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }];
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
  function normalizeMap(configMap) {
    const width = configMap?.width ?? 10;
    const height = configMap?.height ?? 10;
    const tiles = {};
    if (configMap?.tiles) {
      for (const [key, tile] of Object.entries(configMap.tiles)) {
        tiles[key] = {
          terrain: tile.terrain ?? "plains",
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
    const units = {};
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
            food: city.food ?? 0
          }
        ])
      ),
      units
    };
  }
  function syncOwnershipIndexes(state) {
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
  function randomWeather(roll) {
    if (roll < 0.5) return "clear";
    if (roll < 0.7) return "rain";
    if (roll < 0.85) return "fog";
    if (roll < 0.93) return "storm";
    return "heat";
  }
  function generateWeatherByRegion(state, turn) {
    const result = {};
    const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
    for (const region of regions) {
      const rand = seededRandom(state.seed, `weather:${turn}:${region}`);
      result[region] = randomWeather(rand());
    }
    return result;
  }
  function getCurrentPlayer(state) {
    return state.players[state.currentPlayerIndex];
  }
  function assertPlayerTurn(state, playerId) {
    const current = getCurrentPlayer(state);
    if (current.id !== playerId) {
      throw new Error(`Not this player's turn. Expected ${current.id}, got ${playerId}`);
    }
  }
  function tileAt(state, coord) {
    const tile = state.map.tiles[keyOf(coord)];
    if (!tile) throw new Error(`Unknown tile ${keyOf(coord)}`);
    return tile;
  }
  function unitAt(state, unitId) {
    const unit = state.map.units[unitId];
    if (!unit) throw new Error(`Unknown unit ${unitId}`);
    return unit;
  }
  function cityAt(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) throw new Error(`Unknown city ${cityId}`);
    return city;
  }
  function movementBudgetFor(unit) {
    return UNITS[unit.type].movement;
  }
  function applyMovement(state, action) {
    const unit = unitAt(state, action.unitId);
    assertPlayerTurn(state, action.playerId);
    if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");
    const start = unit.position;
    const destination = action.destination;
    const unitDef = UNITS[unit.type];
    const path = action.path ?? findPath(
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
  function veterancyMultiplier(veterancy) {
    if (veterancy === "veteran") return 1.1;
    if (veterancy === "elite") return 1.2;
    return 1;
  }
  function defenderTerrainBonus(state, defender) {
    return TERRAIN[tileAt(state, defender.position).terrain].defense || 0;
  }
  function flankingBonus(state, attacker, defender) {
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
  function riverAttackPenalty(state, attacker, defender) {
    const k = edgeKey(attacker.position, defender.position);
    return state.map.rivers[k] ? 0.25 : 0;
  }
  var pct = (n) => `${n >= 0 ? "+" : "\u2212"}${Math.round(Math.abs(n) * 100)}%`;
  var cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function categoryOf(unit) {
    return UNITS[unit.type].category || "infantry";
  }
  function combinedArmsBonus(state, attacker) {
    const zone = [attacker.position, ...neighborsOf(attacker.position)];
    const categories = /* @__PURE__ */ new Set();
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
  function computeCombatPreview(state, attackerId, defenderId) {
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
    const modifiers = [];
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
    const counterAtk = attackerDef.counters && attackerDef.counters[defCat] || 0;
    if (counterAtk > 0) {
      attackMult += counterAtk;
      modifiers.push(`${cap(CATEGORY_LABELS[atkCat] || atkCat)} vs ${CATEGORY_LABELS[defCat] || defCat} ${pct(counterAtk)}`);
    }
    const combined = combinedArmsBonus(state, attacker);
    if (combined.bonus > 0) {
      attackMult += combined.bonus;
      modifiers.push(combined.label);
    }
    const terrainBonus = defenderTerrainBonus(state, defender);
    let defenseMult = terrainBonus + veterancyMultiplier(defender.veterancy);
    if (terrainBonus > 0) modifiers.push(`Enemy terrain ${pct(terrainBonus)}`);
    const counterDef = defenderDef.counters && defenderDef.counters[atkCat] || 0;
    if (counterDef > 0) {
      defenseMult += counterDef;
      modifiers.push(`Enemy ${CATEGORY_LABELS[defCat] || defCat} vs ${CATEGORY_LABELS[atkCat] || atkCat} ${pct(counterDef)}`);
    }
    const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
    const defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);
    let damageToDefender = Math.max(1, Math.round(20 * atkPower / (atkPower + defPower)));
    let damageToAttacker = Math.max(0, Math.round(14 * defPower / (atkPower + defPower)));
    if (weather === "fog") {
      damageToDefender = Math.max(1, Math.round(damageToDefender * 0.95));
      modifiers.push("Fog \u22125%");
    }
    const rangedNoRetaliation = attackerDef.range > 1 && distance(attacker.position, defender.position) > 1;
    if (rangedNoRetaliation) {
      damageToAttacker = 0;
      modifiers.push("Ranged \u2014 no retaliation");
    }
    return {
      damageToDefender,
      damageToAttacker,
      attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
      defenderRemainingHp: Math.max(0, defender.hp - damageToDefender),
      modifiers
    };
  }
  function applyCombat(state, action) {
    assertPlayerTurn(state, action.playerId);
    const attacker = unitAt(state, action.attackerId);
    const defender = unitAt(state, action.defenderId);
    if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack with enemy unit");
    if (defender.ownerId === action.playerId) throw new Error("Cannot attack friendly unit");
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
  function computeCityAttackDamage(state, attacker, city) {
    const attackerDef = UNITS[attacker.type];
    const cityTile = tileAt(state, city.position);
    const weather = state.weather.current[cityTile.region] || "clear";
    const weatherMult = weather === "fog" ? 0.95 : 1;
    const siegeMult = 1 + (attackerDef.siegeBonus ?? 0);
    const attackPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult * siegeMult;
    const cityDefense = 22 + city.population * 3;
    return Math.max(1, Math.round(18 * attackPower / (attackPower + cityDefense)));
  }
  function applyAttackCity(state, action) {
    assertPlayerTurn(state, action.playerId);
    const attacker = unitAt(state, action.attackerId);
    const city = cityAt(state, action.cityId);
    if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack city with enemy unit");
    if (city.ownerId === action.playerId) throw new Error("Cannot attack friendly city");
    const attackerDef = UNITS[attacker.type];
    if (distance(attacker.position, city.position) > attackerDef.range) {
      throw new Error("City is out of range");
    }
    const damage = computeCityAttackDamage(state, attacker, city);
    city.hp = Math.max(0, city.hp - damage);
    attacker.movementRemaining = 0;
    if (city.hp <= 0) {
      city.ownerId = attacker.ownerId;
      city.population = Math.max(1, city.population - 1);
      city.hp = Math.ceil(city.maxHp * 0.6);
      syncOwnershipIndexes(state);
    }
  }
  function canResearch(player, techId) {
    const tech = TECHS[techId];
    if (!tech) throw new Error(`Unknown tech ${techId}`);
    if (player.techs.includes(techId)) return false;
    for (const prereq of tech.prerequisites) {
      if (!player.techs.includes(prereq)) return false;
    }
    if (tech.forkGroup) {
      const chosenBranch = player.forkChoices[tech.forkGroup];
      if (chosenBranch && chosenBranch !== tech.forkBranch) return false;
    }
    return true;
  }
  function applyResearch(state, action) {
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
  function applyChooseFork(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    if (player.forkChoices[action.forkGroup] && player.forkChoices[action.forkGroup] !== action.branch) {
      throw new Error(`Fork already chosen for ${action.forkGroup}`);
    }
    player.forkChoices[action.forkGroup] = action.branch;
  }
  var MAX_POPULATION = 8;
  function growthCost(population) {
    return 8 + population * 6;
  }
  function researchCost(techId) {
    const tech = TECHS[techId];
    const age = tech ? tech.age : 1;
    return age === 1 ? 18 : age === 2 ? 36 : 60;
  }
  function computeCityYield(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) throw new Error(`Unknown city ${cityId}`);
    const centerTile = tileAt(state, city.position);
    const terrainYield = TERRAIN[centerTile.terrain].yields;
    const owner = state.playersById[city.ownerId];
    const pop = city.population;
    const writingBonus = owner && owner.techs.includes("writing") ? 1 : 0;
    return {
      food: terrainYield.food + pop,
      production: terrainYield.production + Math.ceil(pop / 2) + 1,
      gold: terrainYield.gold + Math.floor(pop / 2) + 1,
      science: 2 + pop + writingBonus
    };
  }
  function applyEndTurn(state, action) {
    assertPlayerTurn(state, action.playerId);
    const endingPlayer = getCurrentPlayer(state);
    for (const cityId of endingPlayer.cityIds) {
      const yields = computeCityYield(state, cityId);
      endingPlayer.production += yields.production;
      endingPlayer.gold += yields.gold;
      endingPlayer.science += yields.science;
      const city = state.map.cities[cityId];
      if (city) {
        city.food = (city.food ?? 0) + yields.food;
        let need = growthCost(city.population);
        while (city.population < MAX_POPULATION && city.food >= need) {
          city.food -= need;
          city.population += 1;
          need = growthCost(city.population);
        }
      }
    }
    const upkeep = endingPlayer.unitIds.reduce((sum, unitId) => {
      const unit = state.map.units[unitId];
      if (!unit) return sum;
      return sum + (UNITS[unit.type].upkeep || 0);
    }, 0);
    endingPlayer.gold -= upkeep;
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
  }
  function applyFoundCity(state, action) {
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
  function applyBuildUnit(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot build from enemy city");
    if (state.map.units[action.unitId]) throw new Error(`Unit id ${action.unitId} already exists`);
    if (!UNITS[action.unitType]) throw new Error(`Unknown unit type ${action.unitType}`);
    const player = state.playersById[action.playerId];
    const unitRule = UNITS[action.unitType];
    if (unitRule.requiresTech && !player.techs.includes(unitRule.requiresTech)) {
      throw new Error(`Unit ${action.unitType} requires tech ${unitRule.requiresTech}`);
    }
    const cost = UNIT_BUILD_COSTS[action.unitType] ?? 9999;
    if (player.production < cost) {
      throw new Error(`Insufficient production: needs ${cost}, has ${player.production}`);
    }
    player.production -= cost;
    const unitDef = UNITS[action.unitType];
    state.map.units[action.unitId] = {
      id: action.unitId,
      type: action.unitType,
      ownerId: action.playerId,
      position: { ...city.position },
      hp: unitDef.maxHp,
      maxHp: unitDef.maxHp,
      movementRemaining: 0,
      veterancy: "recruit"
    };
    syncOwnershipIndexes(state);
  }
  function createInitialGameState(config = {}) {
    const players = normalizePlayers(config.players);
    const map = normalizeMap(config.map);
    const state = {
      version: 1,
      seed: String(config.seed || "hegemon-seed"),
      turn: 1,
      currentPlayerIndex: 0,
      players,
      playersById: makePlayersById(players),
      map,
      weather: { current: {}, forecast: {} },
      actionLog: []
    };
    syncOwnershipIndexes(state);
    state.weather.current = generateWeatherByRegion(state, state.turn);
    state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
    return state;
  }
  function getVictoryStatus(state) {
    const capitals = Object.values(state.map.cities).filter((city) => city.isCapital);
    if (capitals.length === 0) {
      return { winnerId: null, type: null, reason: null };
    }
    const owner = capitals[0].ownerId;
    const allOwnedBySamePlayer = capitals.every((city) => city.ownerId === owner);
    if (!allOwnedBySamePlayer) {
      return { winnerId: null, type: null, reason: null };
    }
    return {
      winnerId: owner,
      type: "domination",
      reason: `${owner} controls all capitals`
    };
  }
  function applyAction(inputState, action) {
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
      default: {
        const unknownAction = action;
        throw new Error(`Unsupported action ${unknownAction.type}`);
      }
    }
    state.actionLog.push({
      turn: inputState.turn,
      playerId: action.playerId,
      action
    });
    return state;
  }
  function serializeState(state) {
    return JSON.stringify(state);
  }
  function deserializeState(serialized) {
    return JSON.parse(serialized);
  }
  function replayActions(initialState, actions) {
    return actions.reduce((state, action) => applyAction(state, action), deepClone(initialState));
  }

  // src/engine/ai.ts
  var RESEARCH_PRIORITY = [
    "bronze-working",
    "archery",
    "iron-working",
    "horseback-riding",
    "writing",
    "masonry",
    "engineering",
    "siegecraft",
    "phalanx-doctrine",
    "coinage",
    "republic",
    "open-sea-sailing",
    "roads-logistics",
    "law-administration",
    "assimilation"
  ];
  var EXPANSION_TARGET = 3;
  var WOUNDED_FRACTION = 0.4;
  function moveCtx(unit) {
    const def = UNITS[unit.type];
    return { ownerId: unit.ownerId, domain: def.domain, mounted: def.mounted };
  }
  function unitsOf(state, player) {
    return player.unitIds.map((id) => state.map.units[id]).filter(Boolean);
  }
  function unitAt2(state, c) {
    return Object.values(state.map.units).find((u) => u.position.q === c.q && u.position.r === c.r);
  }
  function cityAtCoord(state, c) {
    return Object.values(state.map.cities).find((ci) => ci.position.q === c.q && ci.position.r === c.r);
  }
  function nearestCity(cities, from) {
    let best = null;
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
  function enemyCities(state, playerId) {
    return Object.values(state.map.cities).filter((c) => c.ownerId !== playerId);
  }
  function ownCities(state, playerId) {
    return Object.values(state.map.cities).filter((c) => c.ownerId === playerId);
  }
  function isMilitary(unit) {
    const def = UNITS[unit.type];
    return def.attack > 0 && def.domain === "land";
  }
  function enemyCavalryNear(state, player) {
    const mine = unitsOf(state, player);
    for (const enemy of Object.values(state.map.units)) {
      if (enemy.ownerId === player.id) continue;
      if (!UNITS[enemy.type].mounted) continue;
      if (mine.some((m) => distance(m.position, enemy.position) <= 4)) return true;
    }
    return false;
  }
  function firstBuildableTech(player) {
    for (const techId of RESEARCH_PRIORITY) {
      if (player.techs.includes(techId)) continue;
      const tech = TECHS[techId];
      if (!tech) continue;
      if (!tech.prerequisites.every((p) => player.techs.includes(p))) continue;
      if (tech.forkGroup) {
        const chosen = player.forkChoices[tech.forkGroup];
        if (chosen && chosen !== tech.forkBranch) continue;
      }
      return techId;
    }
    return null;
  }
  function foundCityAction(state, player) {
    const cities = ownCities(state, player.id);
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "settler") continue;
      if (cityAtCoord(state, unit.position)) continue;
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
  function attackAction(state, player) {
    let best = null;
    for (const attacker of unitsOf(state, player)) {
      const def = UNITS[attacker.type];
      if (def.attack <= 0 || attacker.movementRemaining <= 0) continue;
      for (const target of Object.values(state.map.units)) {
        if (target.ownerId === player.id) continue;
        if (distance(attacker.position, target.position) > def.range) continue;
        const preview = computeCombatPreview(state, attacker.id, target.id);
        const kills = preview.defenderRemainingHp <= 0;
        const survives = preview.attackerRemainingHp > 0;
        const favorable = survives && (kills || preview.damageToDefender >= preview.damageToAttacker);
        if (!favorable) continue;
        const score = (kills ? 1e3 : 0) + preview.damageToDefender - preview.damageToAttacker;
        if (!best || score > best.score) {
          best = { action: { type: "ATTACK", playerId: player.id, attackerId: attacker.id, defenderId: target.id }, score };
        }
      }
      for (const city of enemyCities(state, player.id)) {
        if (distance(attacker.position, city.position) > def.range) continue;
        const score = 450 + (def.siegeBonus ? 300 : 0) - city.hp * 0.5;
        if (!best || score > best.score) {
          best = { action: { type: "ATTACK_CITY", playerId: player.id, attackerId: attacker.id, cityId: city.id }, score };
        }
      }
    }
    return best ? best.action : null;
  }
  function buildAction(state, player) {
    const cities = player.cityIds.map((id) => state.map.cities[id]).filter(Boolean);
    if (cities.length === 0) return null;
    const settlersInFlight = unitsOf(state, player).filter((u) => u.type === "settler").length;
    const wantSettler = cities.length < EXPANSION_TARGET && settlersInFlight === 0;
    const spearFirst = enemyCavalryNear(state, player);
    const militaryPref = spearFirst ? ["spearman", "swordsman", "horseman", "archer", "warrior"] : ["swordsman", "horseman", "spearman", "archer", "warrior"];
    const canBuild = (type) => {
      const rule = UNITS[type];
      if (!rule) return false;
      if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) return false;
      return player.production >= (UNIT_BUILD_COSTS[type] ?? Infinity);
    };
    for (const city of cities) {
      let chosen = null;
      if (wantSettler && canBuild("settler")) chosen = "settler";
      if (!chosen) chosen = militaryPref.find(canBuild) ?? null;
      if (!chosen) continue;
      let counter = 1;
      let unitId = `${player.id}_${chosen}_${state.turn}_${city.id}_${counter}`;
      while (state.map.units[unitId]) {
        counter += 1;
        unitId = `${player.id}_${chosen}_${state.turn}_${city.id}_${counter}`;
      }
      return { type: "BUILD_UNIT", playerId: player.id, cityId: city.id, unitType: chosen, unitId };
    }
    return null;
  }
  function reachableAlong(state, unit, path) {
    const ctx = moveCtx(unit);
    let cost = 0;
    let lastIndex = 0;
    for (let i = 1; i < path.length; i += 1) {
      const step = movementCost(state, ctx, path[i - 1], path[i]);
      if (!Number.isFinite(step) || cost + step > unit.movementRemaining) break;
      if (unitAt2(state, path[i])) break;
      const cityHere = cityAtCoord(state, path[i]);
      if (cityHere && cityHere.ownerId !== unit.ownerId) break;
      cost += step;
      lastIndex = i;
    }
    return lastIndex > 0 ? path[lastIndex] : null;
  }
  function maneuverAction(state, player) {
    for (const unit of unitsOf(state, player)) {
      if (!isMilitary(unit) || unit.movementRemaining <= 0) continue;
      const wounded = unit.hp < UNITS[unit.type].maxHp * WOUNDED_FRACTION;
      const target = wounded ? nearestCity(ownCities(state, player.id), unit.position) : nearestCity(enemyCities(state, player.id), unit.position);
      if (!target) continue;
      const path = findPath(state, moveCtx(unit), unit.position, target.position);
      if (!path || path.length < 2) continue;
      const dest = reachableAlong(state, unit, path);
      if (!dest) continue;
      return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: dest };
    }
    return null;
  }
  function settlerMoveAction(state, player) {
    const cities = ownCities(state, player.id);
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "settler" || unit.movementRemaining <= 0) continue;
      const currentNearest = nearestCity(cities, unit.position);
      const currentDist = currentNearest ? distance(unit.position, currentNearest.position) : 0;
      let bestStep = null;
      let bestScore = currentDist;
      const ctx = moveCtx(unit);
      for (const dir of DIRECTIONS) {
        const next = { q: unit.position.q + dir[0], r: unit.position.r + dir[1] };
        if (!state.map.tiles[`${next.q},${next.r}`]) continue;
        if (!Number.isFinite(movementCost(state, ctx, unit.position, next))) continue;
        if (unitAt2(state, next) || cityAtCoord(state, next)) continue;
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
  function chooseAiAction(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) throw new Error(`Unknown player ${playerId}`);
    const steps = [
      () => attackAction(state, player),
      () => foundCityAction(state, player),
      () => buildAction(state, player),
      () => maneuverAction(state, player),
      () => settlerMoveAction(state, player),
      () => {
        const techId = firstBuildableTech(player);
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
  function runAiTurn(inputState, playerId, maxActions = 10) {
    let state = inputState;
    const actions = [];
    for (let i = 0; i < maxActions; i += 1) {
      const action = chooseAiAction(state, playerId);
      actions.push(action);
      state = applyAction(state, action);
      if (action.type === "END_TURN") break;
    }
    if (actions.length === maxActions && actions[actions.length - 1].type !== "END_TURN") {
      const forcedEnd = { type: "END_TURN", playerId };
      actions.push(forcedEnd);
      state = applyAction(state, forcedEnd);
    }
    return { state, actions };
  }

  // src/engine/scenarios/italia.ts
  var italiaScenario = {
    seed: "italia-264bc",
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
      { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
    ],
    map: {
      width: 8,
      height: 6,
      regions: ["north-italia", "south-italia", "tyrrhenian"],
      rivers: {
        "2,2|3,2": true,
        "3,2|4,2": true
      },
      tiles: {
        "0,0": { terrain: "hills", region: "north-italia" },
        "1,0": { terrain: "plains", region: "north-italia" },
        "2,0": { terrain: "plains", region: "north-italia" },
        "3,0": { terrain: "forest", region: "north-italia" },
        "4,0": { terrain: "hills", region: "north-italia" },
        "5,0": { terrain: "plains", region: "north-italia" },
        "6,0": { terrain: "coast", region: "tyrrhenian" },
        "7,0": { terrain: "sea", region: "tyrrhenian" },
        "0,1": { terrain: "plains", region: "north-italia" },
        "1,1": { terrain: "valley", region: "north-italia" },
        "2,1": { terrain: "plains", region: "north-italia" },
        "3,1": { terrain: "plains", region: "north-italia" },
        "4,1": { terrain: "hills", region: "north-italia" },
        "5,1": { terrain: "plains", region: "north-italia" },
        "6,1": { terrain: "coast", region: "tyrrhenian" },
        "7,1": { terrain: "sea", region: "tyrrhenian" },
        "0,2": { terrain: "plains", region: "south-italia" },
        "1,2": { terrain: "valley", region: "south-italia" },
        "2,2": { terrain: "plains", region: "south-italia" },
        "3,2": { terrain: "valley", region: "south-italia" },
        "4,2": { terrain: "plains", region: "south-italia" },
        "5,2": { terrain: "hills", region: "south-italia" },
        "6,2": { terrain: "coast", region: "tyrrhenian" },
        "7,2": { terrain: "sea", region: "tyrrhenian" },
        "0,3": { terrain: "forest", region: "south-italia" },
        "1,3": { terrain: "plains", region: "south-italia" },
        "2,3": { terrain: "plains", region: "south-italia" },
        "3,3": { terrain: "hills", region: "south-italia" },
        "4,3": { terrain: "plains", region: "south-italia" },
        "5,3": { terrain: "plains", region: "south-italia" },
        "6,3": { terrain: "coast", region: "tyrrhenian" },
        "7,3": { terrain: "sea", region: "tyrrhenian" },
        "0,4": { terrain: "hills", region: "south-italia" },
        "1,4": { terrain: "plains", region: "south-italia" },
        "2,4": { terrain: "desert", region: "south-italia" },
        "3,4": { terrain: "plains", region: "south-italia" },
        "4,4": { terrain: "plains", region: "south-italia" },
        "5,4": { terrain: "plains", region: "south-italia" },
        "6,4": { terrain: "coast", region: "tyrrhenian" },
        "7,4": { terrain: "sea", region: "tyrrhenian" },
        "0,5": { terrain: "hills", region: "south-italia" },
        "1,5": { terrain: "plains", region: "south-italia" },
        "2,5": { terrain: "plains", region: "south-italia" },
        "3,5": { terrain: "plains", region: "south-italia" },
        "4,5": { terrain: "hills", region: "south-italia" },
        "5,5": { terrain: "plains", region: "south-italia" },
        "6,5": { terrain: "coast", region: "tyrrhenian" },
        "7,5": { terrain: "sea", region: "tyrrhenian" }
      },
      cities: {
        roma: { id: "roma", ownerId: "rome", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40, isCapital: true },
        karthago: { id: "karthago", ownerId: "carthage", position: { q: 5, r: 4 }, population: 2, hp: 40, maxHp: 40, isCapital: true }
      },
      units: {
        r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: { q: 2, r: 1 } },
        r_settler: { id: "r_settler", type: "settler", ownerId: "rome", position: { q: 0, r: 2 } },
        c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: { q: 4, r: 4 } },
        c_settler: { id: "c_settler", type: "settler", ownerId: "carthage", position: { q: 6, r: 3 } }
      }
    }
  };

  // src/engine/scenarios.ts
  var SCENARIOS = {
    italia: {
      id: "italia",
      name: "Italia: Rome vs Carthage",
      historicalBrief: "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
      config: italiaScenario
    }
  };
  function listScenarios() {
    return Object.values(SCENARIOS);
  }
  function loadScenario(id) {
    const scenario = SCENARIOS[id];
    if (!scenario) {
      throw new Error(`Unknown scenario ${id}`);
    }
    return JSON.parse(JSON.stringify(scenario));
  }

  // src/engine/mapgen.ts
  var MAP_SIZES = {
    small: { width: 14, height: 9, bands: 2, rivers: 2, label: "Small" },
    medium: { width: 20, height: 13, bands: 3, rivers: 3, label: "Medium" },
    large: { width: 28, height: 18, bands: 3, rivers: 4, label: "Large" },
    xl: { width: 34, height: 22, bands: 3, rivers: 5, label: "XL" }
  };
  function offsetToAxial(col, row) {
    return { q: col - (row - (row & 1) >> 1), r: row };
  }
  var CIV_ROSTER = [
    { id: "rome", civ: "Rome" },
    { id: "carthage", civ: "Carthage" },
    { id: "greece", civ: "Greece" },
    { id: "egypt", civ: "Egypt" },
    { id: "gaul", civ: "Gaul" },
    { id: "parthia", civ: "Parthia" }
  ];
  var MAX_PLAYERS = CIV_ROSTER.length;
  var DEFAULT_PLAYERS = {
    small: 2,
    medium: 3,
    large: 4,
    xl: 5
  };
  var WALKABLE = /* @__PURE__ */ new Set([
    "plains",
    "valley",
    "forest",
    "hills",
    "desert"
  ]);
  var CAPITAL_TERRAIN = /* @__PURE__ */ new Set(["plains", "valley", "hills"]);
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function lattice(seed, salt, x, y) {
    return seededRandom(seed, `${salt}:${x}:${y}`)();
  }
  function valueNoise(seed, salt, x, y, cell) {
    const gx = x / cell;
    const gy = y / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const v00 = lattice(seed, salt, x0, y0);
    const v10 = lattice(seed, salt, x0 + 1, y0);
    const v01 = lattice(seed, salt, x0, y0 + 1);
    const v11 = lattice(seed, salt, x0 + 1, y0 + 1);
    const sx = smooth(fx);
    const sy = smooth(fy);
    const top = v00 + (v10 - v00) * sx;
    const bottom = v01 + (v11 - v01) * sx;
    return top + (bottom - top) * sy;
  }
  function fbm(seed, salt, x, y) {
    return 0.55 * valueNoise(seed, salt, x, y, 5.5) + 0.3 * valueNoise(seed, salt, x, y, 2.7) + 0.15 * valueNoise(seed, salt, x, y, 1.4);
  }
  function terrainFor(elev, moist) {
    if (elev < 0.3) return "sea";
    if (elev < 0.38) return "coast";
    if (elev > 0.83) return "mountains";
    if (elev > 0.7) return "hills";
    if (moist < 0.3) return "desert";
    if (moist > 0.68 && elev < 0.55) return "valley";
    if (moist > 0.52) return "forest";
    return "plains";
  }
  function bandName(r, height, bands) {
    const idx = Math.min(bands - 1, Math.floor(r / height * bands));
    if (bands <= 2) return idx === 0 ? "north" : "south";
    return ["north", "central", "south"][idx];
  }
  function buildTerrain(seed, spec) {
    const cols = spec.width;
    const rows = spec.height;
    const bands = spec.bands;
    const tiles = {};
    const elevation = {};
    const regionSet = /* @__PURE__ */ new Set();
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        let elev = fbm(seed, "elev", col, row) + 0.06;
        const nx = cols <= 1 ? 0 : col / (cols - 1) * 2 - 1;
        const ny = rows <= 1 ? 0 : row / (rows - 1) * 2 - 1;
        const edge = Math.max(Math.abs(nx), Math.abs(ny));
        elev -= 0.55 * Math.pow(edge, 3);
        const moist = fbm(seed, "moist", col, row) - 0.22 * (rows <= 1 ? 0 : row / (rows - 1));
        const region = bandName(row, rows, bands);
        regionSet.add(region);
        const key = keyOf(offsetToAxial(col, row));
        tiles[key] = { terrain: terrainFor(elev, moist), region };
        elevation[key] = elev;
      }
    }
    const order = ["north", "central", "south"];
    const regions = order.filter((name) => regionSet.has(name));
    return { tiles, regions, elevation };
  }
  function carveRivers(tiles, elevation, spec, count) {
    const rivers = {};
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const sources = Object.keys(tiles).filter((k) => WALKABLE.has(tiles[k].terrain)).sort((a, b) => elevation[b] - elevation[a]);
    const chosen = [];
    for (const key of sources) {
      if (chosen.length >= count) break;
      const c = parseKey(key);
      if (chosen.every((ck) => distance(parseKey(ck), c) >= 3)) chosen.push(key);
    }
    for (const source of chosen) {
      let currentKey = source;
      const visited = /* @__PURE__ */ new Set([currentKey]);
      for (let step = 0; step < spec.width + spec.height; step += 1) {
        const current = parseKey(currentKey);
        let bestKey = null;
        let bestElev = elevation[currentKey];
        for (const n of neighborsOf(current)) {
          if (!inBounds(n)) continue;
          const nk = keyOf(n);
          if (visited.has(nk)) continue;
          if (elevation[nk] < bestElev) {
            bestElev = elevation[nk];
            bestKey = nk;
          }
        }
        if (!bestKey) break;
        rivers[edgeKey(current, parseKey(bestKey))] = true;
        visited.add(bestKey);
        currentKey = bestKey;
        const t = tiles[bestKey].terrain;
        if (t === "sea" || t === "coast") break;
      }
    }
    return rivers;
  }
  function largestWalkableComponent(tiles, spec) {
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const isWalkable = (key) => tiles[key] && WALKABLE.has(tiles[key].terrain);
    const seen = /* @__PURE__ */ new Set();
    let best = [];
    for (const startKey of Object.keys(tiles)) {
      if (seen.has(startKey) || !isWalkable(startKey)) continue;
      const component = [];
      const queue = [startKey];
      seen.add(startKey);
      while (queue.length > 0) {
        const key = queue.pop();
        component.push(key);
        for (const n of neighborsOf(parseKey(key))) {
          if (!inBounds(n)) continue;
          const nk = keyOf(n);
          if (!seen.has(nk) && isWalkable(nk)) {
            seen.add(nk);
            queue.push(nk);
          }
        }
      }
      if (component.length > best.length) best = component;
    }
    return best;
  }
  function farthestPair(keys) {
    if (keys.length < 2) return null;
    let best = null;
    let bestDist = -1;
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const d = distance(parseKey(keys[i]), parseKey(keys[j]));
        if (d > bestDist) {
          bestDist = d;
          best = [keys[i], keys[j]];
        }
      }
    }
    return best;
  }
  function pickDispersed(pool, n) {
    const pair = farthestPair(pool);
    if (!pair) return pool.slice(0, n);
    const chosen = [pair[0], pair[1]];
    while (chosen.length < n) {
      let best = null;
      let bestMin = -1;
      for (const k of pool) {
        if (chosen.includes(k)) continue;
        let nearest = Infinity;
        for (const c of chosen) nearest = Math.min(nearest, distance(parseKey(k), parseKey(c)));
        if (nearest > bestMin) {
          bestMin = nearest;
          best = k;
        }
      }
      if (!best) break;
      chosen.push(best);
    }
    return chosen.slice(0, n);
  }
  function placeStarters(capitalKey, tiles, spec, taken) {
    const cap2 = parseKey(capitalKey);
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const free = neighborsOf(cap2).filter(
      (c) => inBounds(c) && tiles[keyOf(c)] && WALKABLE.has(tiles[keyOf(c)].terrain) && !taken.has(keyOf(c))
    );
    const warrior = free[0] ?? cap2;
    taken.add(keyOf(warrior));
    const settler = free.find((c) => keyOf(c) !== keyOf(warrior)) ?? cap2;
    taken.add(keyOf(settler));
    return { warrior, settler };
  }
  function tryGenerate(seed, spec, playerCount) {
    const { tiles, regions, elevation } = buildTerrain(seed, spec);
    const component = largestWalkableComponent(tiles, spec);
    const minComponent = Math.max(8, playerCount * 3, Math.floor(spec.width * spec.height * 0.15));
    if (component.length < minComponent) return null;
    const preferred = component.filter((k) => CAPITAL_TERRAIN.has(tiles[k].terrain));
    const pool = preferred.length >= playerCount ? preferred : component;
    if (pool.length < playerCount) return null;
    const capitalKeys = pickDispersed(pool, playerCount);
    if (capitalKeys.length < playerCount) return null;
    const minSeparation = Math.max(3, Math.floor((spec.width + spec.height) / (playerCount + 2)));
    let closest = Infinity;
    for (let i = 0; i < capitalKeys.length; i += 1) {
      for (let j = i + 1; j < capitalKeys.length; j += 1) {
        closest = Math.min(closest, distance(parseKey(capitalKeys[i]), parseKey(capitalKeys[j])));
      }
    }
    if (closest < minSeparation) return null;
    const taken = new Set(capitalKeys);
    const players = [];
    const cities = {};
    const units = {};
    for (let i = 0; i < playerCount; i += 1) {
      const { id, civ } = CIV_ROSTER[i];
      const capitalKey = capitalKeys[i];
      const position = parseKey(capitalKey);
      players.push({ id, civ, food: 8, production: 30, gold: 20 });
      cities[`${id}_capital`] = {
        id: `${id}_capital`,
        ownerId: id,
        position,
        population: 2,
        hp: 40,
        maxHp: 40,
        isCapital: true
      };
      const start = placeStarters(capitalKey, tiles, spec, taken);
      units[`${id}_warrior`] = { id: `${id}_warrior`, type: "warrior", ownerId: id, position: start.warrior };
      units[`${id}_settler`] = { id: `${id}_settler`, type: "settler", ownerId: id, position: start.settler };
    }
    const rivers = carveRivers(tiles, elevation, spec, spec.rivers);
    return {
      seed,
      players,
      map: { width: spec.width, height: spec.height, regions, rivers, tiles, cities, units }
    };
  }
  function generateMap(options = {}) {
    const size = options.size ?? "medium";
    const spec = MAP_SIZES[size];
    if (!spec) throw new Error(`Unknown map size ${size}`);
    const baseSeed = options.seed ?? "hegemon-map";
    const requested = Math.max(2, Math.min(MAX_PLAYERS, Math.floor(options.playerCount ?? 2)));
    for (let playerCount = requested; playerCount >= 2; playerCount -= 1) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const seed = attempt === 0 ? baseSeed : `${baseSeed}#${attempt}`;
        const config = tryGenerate(seed, spec, playerCount);
        if (config) return config;
      }
    }
    return tryGenerate(`${baseSeed}#fallback`, spec, 2) ?? buildFlatFallback(spec, baseSeed);
  }
  function buildFlatFallback(spec, seed) {
    const tiles = {};
    for (let row = 0; row < spec.height; row += 1) {
      for (let col = 0; col < spec.width; col += 1) {
        tiles[keyOf(offsetToAxial(col, row))] = { terrain: "plains", region: bandName(row, spec.height, spec.bands) };
      }
    }
    const midRow = Math.floor(spec.height / 2);
    const romePos = offsetToAxial(1, midRow);
    const carthagePos = offsetToAxial(spec.width - 2, midRow);
    const romeSettler = offsetToAxial(1, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
    const carthageSettler = offsetToAxial(spec.width - 2, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
    return {
      seed,
      players: [
        { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
        { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
      ],
      map: {
        width: spec.width,
        height: spec.height,
        regions: Array.from(new Set(Object.values(tiles).map((t) => t.region))),
        rivers: {},
        tiles,
        cities: {
          rome_capital: { id: "rome_capital", ownerId: "rome", position: romePos, population: 2, hp: 40, maxHp: 40, isCapital: true },
          carthage_capital: { id: "carthage_capital", ownerId: "carthage", position: carthagePos, population: 2, hp: 40, maxHp: 40, isCapital: true }
        },
        units: {
          r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: offsetToAxial(2, midRow) },
          r_settler: { id: "r_settler", type: "settler", ownerId: "rome", position: romeSettler },
          c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: offsetToAxial(spec.width - 3, midRow) },
          c_settler: { id: "c_settler", type: "settler", ownerId: "carthage", position: carthageSettler }
        }
      }
    };
  }
  return __toCommonJS(browser_entry_exports);
})();
