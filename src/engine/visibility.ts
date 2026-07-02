import { UNITS } from "./data";
import { distance, parseKey } from "./hex";
import type { Coord, GameState, VisibilityResult } from "./types";

const discoveredByPlayer = new Map<string, Set<string>>();

function clampMin(value: number, minValue: number): number {
  return value < minValue ? minValue : value;
}

function tileVisionBonus(state: GameState, coord: Coord): number {
  const key = `${coord.q},${coord.r}`;
  const tile = state.map.tiles[key];
  if (!tile) return 0;

  if (tile.terrain === "hills") return 1;
  return 0;
}

function weatherVisionPenalty(state: GameState, coord: Coord): number {
  const key = `${coord.q},${coord.r}`;
  const tile = state.map.tiles[key];
  if (!tile) return 0;
  return state.weather.current[tile.region] === "fog" ? 1 : 0;
}

function addVisibilityFromSource(state: GameState, source: Coord, baseRange: number, visible: Set<string>): void {
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

export function computeVisibility(state: GameState, playerId: string): VisibilityResult {
  const visible = new Set<string>();

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

  const discovered = discoveredByPlayer.get(playerId) ?? new Set<string>();
  for (const key of visible) {
    discovered.add(key);
  }
  discoveredByPlayer.set(playerId, discovered);

  return {
    visibleTiles: [...visible],
    discoveredTiles: [...discovered]
  };
}
