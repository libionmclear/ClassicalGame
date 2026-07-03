import { TECHS, UNIT_BUILD_COSTS, UNITS, BUILDINGS } from "./data";
import { applyAction, computeCombatPreview, researchCost } from "./index";
import { getEvent } from "./events";
import { distance, DIRECTIONS } from "./hex";
import { findPath, movementCost } from "./pathfinding";
import type { City, Coord, GameAction, GameState, Player, Unit } from "./types";

// Tech order: unlock the army (spears -> swords -> cavalry -> siege), grab a few
// economy/statecraft nodes, and commit to one side of each fork.
const RESEARCH_PRIORITY = [
  "bronze-working",
  "archery",
  "iron-working",
  "combined-arms",
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
  return player.unitIds.map((id) => state.map.units[id]).filter(Boolean) as Unit[];
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

function firstBuildableTech(player: Player): string | null {
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

  const spearFirst = enemyCavalryNear(state, player);
  const militaryPref = spearFirst
    ? ["spearman", "swordsman", "horseman", "archer", "warrior"]
    : ["swordsman", "horseman", "spearman", "archer", "warrior"];

  const canBuild = (type: string): boolean => {
    const rule = UNITS[type];
    if (!rule) return false;
    return !rule.requiresTech || player.techs.includes(rule.requiresTech);
  };

  for (const city of cities) {
    // Don't over-queue; production banks and builds these over turns.
    if ((city.queue?.length ?? 0) >= 2) continue;
    let chosen: string | null = null;
    if (wantSettler && canBuild("settler") && !(city.queue ?? []).includes("settler")) chosen = "settler";
    if (!chosen) chosen = militaryPref.find(canBuild) ?? null;
    if (!chosen) continue;
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
      if (b.requiresTech && !player.techs.includes(b.requiresTech)) continue;
      return { type: "BUILD_BUILDING", playerId: player.id, cityId, buildingId: id };
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
  for (const unit of unitsOf(state, player)) {
    if (!isMilitary(unit) || unit.movementRemaining <= 0) continue;

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

export function chooseAiAction(state: GameState, playerId: string): GameAction {
  const player = state.playersById[playerId];
  if (!player) throw new Error(`Unknown player ${playerId}`);

  const steps: Array<() => GameAction | null> = [
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
    () => buildAction(state, player),
    () => buildingAction(state, player),
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
