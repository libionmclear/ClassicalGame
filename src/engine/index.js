const { TERRAIN, TECHS, UNITS, WEATHER_STATES } = require("./data");
const { seededRandom } = require("./rng");
const { keyOf, parseKey, distance, neighborsOf, edgeKey } = require("./hex");
const { movementCost, findPath } = require("./pathfinding");

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

function normalizeMap(configMap, players) {
  const width = configMap.width || 10;
  const height = configMap.height || 10;
  const tiles = {};

  if (configMap.tiles) {
    for (const [key, tile] of Object.entries(configMap.tiles)) {
      tiles[key] = {
        terrain: tile.terrain || "plains",
        region: tile.region || "core"
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

  return {
    width,
    height,
    tiles,
    rivers: configMap.rivers || {},
    regions: configMap.regions || Array.from(new Set(Object.values(tiles).map((t) => t.region))),
    cities: configMap.cities || {},
    units: configMap.units || {},
    playersById: makePlayersById(players)
  };
}

function createInitialGameState(config = {}) {
  const players = (config.players || [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }]).map((player) => ({
    id: player.id,
    civ: player.civ,
    food: player.food || 0,
    production: player.production || 0,
    gold: player.gold || 25,
    techs: player.techs || [],
    forkChoices: player.forkChoices || {},
    cityIds: player.cityIds || [],
    unitIds: player.unitIds || []
  }));

  const state = {
    version: 1,
    seed: String(config.seed || "hegemon-seed"),
    turn: 1,
    currentPlayerIndex: 0,
    players,
    playersById: {},
    map: normalizeMap(config.map || {}, players),
    weather: {
      current: {},
      forecast: {}
    },
    actionLog: []
  };

  state.playersById = makePlayersById(state.players);
  state.weather.current = generateWeatherByRegion(state, state.turn);
  state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);

  for (const unit of Object.values(state.map.units)) {
    const def = UNITS[unit.type];
    unit.maxHp = unit.maxHp || def.maxHp;
    unit.hp = unit.hp || def.maxHp;
    unit.movementRemaining = unit.movementRemaining ?? def.movement;
    unit.veterancy = unit.veterancy || "recruit";
  }

  return state;
}

function generateWeatherByRegion(state, turn) {
  const result = {};
  const regions = state.map.regions && state.map.regions.length > 0 ? state.map.regions : ["core"];
  for (const region of regions) {
    const rand = seededRandom(state.seed, `weather:${turn}:${region}`);
    const roll = rand();
    if (roll < 0.5) result[region] = "clear";
    else if (roll < 0.7) result[region] = "rain";
    else if (roll < 0.85) result[region] = "fog";
    else if (roll < 0.93) result[region] = "storm";
    else result[region] = "heat";
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
  return state.map.tiles[keyOf(coord)];
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
  const path = action.path || findPath(state, { ...UNITS[unit.type], ownerId: unit.ownerId, mounted: UNITS[unit.type].mounted }, start, destination);
  if (!path || path.length < 2) throw new Error("No valid path to destination");

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    const step = movementCost(state, { ...UNITS[unit.type], ownerId: unit.ownerId, mounted: UNITS[unit.type].mounted, domain: UNITS[unit.type].domain }, path[i], path[i + 1]);
    if (!Number.isFinite(step)) throw new Error("Path uses impassable terrain");
    totalCost += step;
  }

  if (totalCost > unit.movementRemaining) {
    throw new Error(`Insufficient movement: needs ${totalCost}, has ${unit.movementRemaining}`);
  }

  unit.position = destination;
  unit.movementRemaining -= totalCost;

  const destinationTile = tileAt(state, destination);
  if (!destinationTile) throw new Error("Destination tile missing");

  if (destinationTile.terrain === "desert" && !state.playersById[unit.ownerId].techs.includes("caravan-logistics")) {
    const heat = state.weather.current[destinationTile.region] === "heat" ? 2 : 1;
    unit.hp = Math.max(1, unit.hp - heat);
  }
}

function veterancyMultiplier(veterancy) {
  if (veterancy === "veteran") return 1.1;
  if (veterancy === "elite") return 1.2;
  return 1;
}

function defenderTerrainBonus(state, defender) {
  const tile = tileAt(state, defender.position);
  if (!tile) return 0;
  return TERRAIN[tile.terrain].defense || 0;
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

  const attackMult = veterancyMultiplier(attacker.veterancy) + flankingBonus(state, attacker, defender) - riverAttackPenalty(state, attacker, defender);
  const defenseMult = 1 + defenderTerrainBonus(state, defender) + veterancyMultiplier(defender.veterancy) - 1;

  const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
  const defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);

  let damageToDefender = Math.max(1, Math.round((20 * atkPower) / (atkPower + defPower)));
  let damageToAttacker = Math.max(0, Math.round((14 * defPower) / (atkPower + defPower)));

  if (weather === "fog") {
    damageToDefender = Math.max(1, Math.round(damageToDefender * 0.95));
  }

  const rangedNoRetaliation = attackerDef.range > 1 && distance(attacker.position, defender.position) > 1;
  if (rangedNoRetaliation) {
    damageToAttacker = 0;
  }

  return {
    damageToDefender,
    damageToAttacker,
    attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
    defenderRemainingHp: Math.max(0, defender.hp - damageToDefender)
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

function canResearch(player, techId) {
  const tech = TECHS[techId];
  if (!tech) throw new Error(`Unknown tech ${techId}`);
  if (player.techs.includes(techId)) return false;

  for (const prereq of tech.prerequisites) {
    if (!player.techs.includes(prereq)) {
      return false;
    }
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

  player.techs.push(action.techId);
  const tech = TECHS[action.techId];
  if (tech.forkGroup && !player.forkChoices[tech.forkGroup]) {
    player.forkChoices[tech.forkGroup] = tech.forkBranch;
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

function computeCityYield(state, cityId) {
  const city = cityAt(state, cityId);
  const centerTile = tileAt(state, city.position);
  const terrainYield = centerTile ? TERRAIN[centerTile.terrain].yields : { food: 0, production: 0, gold: 0 };
  return {
    food: terrainYield.food + 1,
    production: terrainYield.production + 1,
    gold: terrainYield.gold + Math.max(1, Math.floor(city.population / 2))
  };
}

function applyEndTurn(state, action) {
  assertPlayerTurn(state, action.playerId);
  const endingPlayer = getCurrentPlayer(state);

  for (const cityId of endingPlayer.cityIds) {
    const yieldValue = computeCityYield(state, cityId);
    endingPlayer.food += yieldValue.food;
    endingPlayer.production += yieldValue.production;
    endingPlayer.gold += yieldValue.gold;
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
    if (!unitTile) continue;
    if (unit.type === "trireme" && unitTile.terrain === "sea" && state.weather.current[unitTile.region] === "storm") {
      unit.hp = Math.max(1, unit.hp - 2);
    }
  }
}

function applyAction(inputState, action) {
  const state = deepClone(inputState);
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
    default:
      throw new Error(`Unsupported action ${action.type}`);
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

module.exports = {
  createInitialGameState,
  applyAction,
  computeCombatPreview,
  canResearch,
  serializeState,
  deserializeState,
  replayActions,
  movementCost,
  findPath,
  keyOf,
  parseKey,
  distance,
  WEATHER_STATES,
  TERRAIN,
  TECHS,
  UNITS
};
