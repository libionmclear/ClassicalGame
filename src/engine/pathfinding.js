const { neighborsOf, keyOf, parseKey, edgeKey } = require("./hex");
const { TERRAIN } = require("./data");

function movementCost(state, unit, from, to) {
  const toTile = state.map.tiles[keyOf(to)];
  if (!toTile) return Infinity;

  const terrain = TERRAIN[toTile.terrain];
  if (!terrain) return Infinity;

  if (terrain.navalOnly && unit.domain !== "naval") return Infinity;
  if (!terrain.navalOnly && unit.domain === "naval") return Infinity;

  if (terrain.requiresTech && !state.playersById[unit.ownerId].techs.includes(terrain.requiresTech)) {
    return Infinity;
  }

  if (terrain.impassableWithoutTech && !state.playersById[unit.ownerId].techs.includes(terrain.impassableWithoutTech)) {
    return Infinity;
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
  const cameFrom = new Map([[startKey, null]]);
  const costSoFar = new Map([[startKey, 0]]);

  while (frontier.length > 0) {
    frontier.sort((a, b) => a.cost - b.cost);
    const currentKey = frontier.shift().key;
    if (currentKey === goalKey) break;

    const current = parseKey(currentKey);
    for (const next of neighborsOf(current)) {
      const nextKey = keyOf(next);
      const step = movementCost(state, unit, current, next);
      if (!Number.isFinite(step)) continue;

      const nextCost = costSoFar.get(currentKey) + step;
      if (!costSoFar.has(nextKey) || nextCost < costSoFar.get(nextKey)) {
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
    cursor = cameFrom.get(cursor);
  }
  path.reverse();
  return path;
}

module.exports = {
  movementCost,
  findPath
};
