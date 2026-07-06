import { TERRAIN } from "./data";
import { edgeKey, keyOf, neighborsOf, parseKey } from "./hex";
import type { Coord, DomainType, GameState } from "./types";

interface UnitMovementContext {
  ownerId: string;
  domain: DomainType;
  mounted?: boolean;
}

// A tile "touches" a river if any of its six edges carries one.
function touchesRiver(state: GameState, c: Coord): boolean {
  for (const n of neighborsOf(c)) {
    if (state.map.rivers[edgeKey(c, n)]) return true;
  }
  return false;
}

export function movementCost(state: GameState, unit: UnitMovementContext, from: Coord, to: Coord): number {
  const toTile = state.map.tiles[keyOf(to)];
  if (!toTile) return Number.POSITIVE_INFINITY;

  const terrain = TERRAIN[toTile.terrain];
  if (!terrain) return Number.POSITIVE_INFINITY;

  // Land units may embark onto water (coast, then open sea with the deeper tech)
  // once their people know how to sail; naval units never come ashore.
  if (terrain.navalOnly && unit.domain !== "naval") {
    const owner = state.playersById[unit.ownerId];
    if (!owner || !owner.techs.includes("sailing")) return Number.POSITIVE_INFINITY;
  }
  if (!terrain.navalOnly && unit.domain === "naval") return Number.POSITIVE_INFINITY;

  if (terrain.requiresTech && !state.playersById[unit.ownerId].techs.includes(terrain.requiresTech)) {
    return Number.POSITIVE_INFINITY;
  }

  if (terrain.impassableWithoutTech && !state.playersById[unit.ownerId].techs.includes(terrain.impassableWithoutTech)) {
    return Number.POSITIVE_INFINITY;
  }

  const crossingKey = edgeKey(from, to);
  const crossingRiver = !!state.map.rivers[crossingKey];

  // A road makes any land tile quick to cross. It also BRIDGES a river — but only
  // once your people know engineering (how to build a bridge). Without it, a road
  // still can't spare you the ford, so you slow down to cross.
  const owner = state.playersById[unit.ownerId];
  const canBridge = !!owner && owner.techs.includes("engineering");
  if (toTile.road && (!crossingRiver || canBridge)) return 1;

  // Rivers double as roads FOR NOW: moving ALONG a river (both tiles on the same
  // bank, not fording it) travels at road speed. Land units only.
  if (!crossingRiver && unit.domain === "land" && !terrain.navalOnly && touchesRiver(state, from) && touchesRiver(state, to)) {
    return 1;
  }

  let cost = terrain.moveCost;
  if (unit.mounted && state.weather.current[toTile.region] === "rain") {
    cost += 1;
  }

  if (crossingRiver) {
    cost += 1;
    if (state.weather.current[toTile.region] === "rain") {
      cost += 1;
    }
  }

  return cost;
}

export function findPath(state: GameState, unit: UnitMovementContext, start: Coord, goal: Coord): Coord[] | null {
  const startKey = keyOf(start);
  const goalKey = keyOf(goal);
  if (startKey === goalKey) return [start];

  const frontier: Array<{ key: string; cost: number }> = [{ key: startKey, cost: 0 }];
  const cameFrom = new Map<string, string | null>([[startKey, null]]);
  const costSoFar = new Map<string, number>([[startKey, 0]]);

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
      if (known === undefined || nextCost < known) {
        costSoFar.set(nextKey, nextCost);
        frontier.push({ key: nextKey, cost: nextCost });
        cameFrom.set(nextKey, currentKey);
      }
    }
  }

  if (!cameFrom.has(goalKey)) return null;

  const path: Coord[] = [];
  let cursor: string | null = goalKey;
  while (cursor) {
    path.push(parseKey(cursor));
    cursor = cameFrom.get(cursor) ?? null;
  }
  path.reverse();
  return path;
}
