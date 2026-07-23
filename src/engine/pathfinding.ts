import { TERRAIN } from "./data";
import { edgeKey, keyOf, neighborsOf, parseKey } from "./hex";
import type { Coord, DomainType, GameState } from "./types";

interface UnitMovementContext {
  ownerId: string;
  domain: DomainType;
  mounted?: boolean;
}

// Can troops put to sea from this tile? Yes if it's a friendly city with the
// Harbour building, OR it sits next to a built Harbour improvement whose home
// port (an adjacent friendly city) is yours.
function hasHarbourAt(state: GameState, c: Coord, ownerId: string): boolean {
  for (const city of Object.values(state.map.cities)) {
    if (city.ownerId === ownerId && city.position.q === c.q && city.position.r === c.r && (city.buildings ?? []).includes("harbor")) return true;
  }
  for (const n of neighborsOf(c)) {
    const t = state.map.tiles[keyOf(n)];
    if (!t || t.improvement !== "harbour") continue;
    for (const city of Object.values(state.map.cities)) {
      if (city.ownerId !== ownerId) continue;
      for (const cn of neighborsOf(n)) {
        if (cn.q === city.position.q && cn.r === city.position.r) return true;
      }
    }
  }
  return false;
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

  // A bridge over a great river is a dry land crossing: land units cross the water
  // TILE freely (no sailing or harbour needed) — this is the ONLY way land units enter
  // a great-river tile short of embarking. Naval units fall through to the normal path.
  if (toTile.terrain === "great-river" && toTile.improvement === "bridge" && unit.domain !== "naval") {
    return 1;
  }

  // Land units may embark onto water (coast, then open sea with the deeper tech)
  // once their people know how to sail; naval units never come ashore.
  if (terrain.navalOnly && unit.domain !== "naval") {
    const owner = state.playersById[unit.ownerId];
    if (!owner || !owner.techs.includes("sailing")) return Number.POSITIVE_INFINITY;
    // No sea voyage without a port: a land unit can only EMBARK (step from land
    // onto water) from one of its own cities that has a Harbour.
    const fromTile = state.map.tiles[keyOf(from)];
    const leavingLand = fromTile && !(TERRAIN[fromTile.terrain] && TERRAIN[fromTile.terrain].navalOnly);
    if (leavingLand && !hasHarbourAt(state, from, unit.ownerId)) return Number.POSITIVE_INFINITY;
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

  // A road makes any land tile quick to cross — half a move, so a paved route is
  // clearly faster than open ground (a unit covers twice the distance on roads).
  // It also BRIDGES a river, but only once your people know engineering (how to
  // build a bridge). Without it, a road still can't spare you the ford.
  const ROAD_MOVE = 0.5;
  const owner = state.playersById[unit.ownerId];
  const canBridge = !!owner && owner.techs.includes("engineering");
  if (toTile.road && (!crossingRiver || canBridge)) return ROAD_MOVE;

  // Rivers double as roads FOR NOW: moving ALONG a river (both tiles on the same
  // bank, not fording it) travels at road speed. Land units only.
  if (!crossingRiver && unit.domain === "land" && !terrain.navalOnly && touchesRiver(state, from) && touchesRiver(state, to)) {
    return ROAD_MOVE;
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
