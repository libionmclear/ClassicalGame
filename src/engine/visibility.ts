import { TERRAIN, UNITS } from "./data";
import { distance, parseKey } from "./hex";
import type { Coord, GameState, VisibilityResult } from "./types";

function clampMin(value: number, minValue: number): number {
  return value < minValue ? minValue : value;
}

function tileVisionBonus(state: GameState, coord: Coord): number {
  const key = `${coord.q},${coord.r}`;
  const tile = state.map.tiles[key];
  if (!tile) return 0;
  // High ground sees further — hills +1, mountains +2 (from the terrain table).
  return TERRAIN[tile.terrain]?.vision ?? 0;
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
    // Ranged units and the Explorer-scout see one hex further than the rest.
    const baseRange = unitDef.range > 1 || unit.type === "explorer" ? 3 : 2;
    addVisibilityFromSource(state, unit.position, baseRange, visible);
  }

  // Discovered tiles are stored ON the game state so fog-of-war survives a reload
  // and never leaks between games.
  if (!state.discovered) state.discovered = {};
  const discovered = new Set<string>(state.discovered[playerId] ?? []);
  for (const key of visible) {
    discovered.add(key);
  }
  state.discovered[playerId] = [...discovered];

  // The OPEN OCEAN ringing the board is always in view: there is nothing out there to
  // hide, a fleet has to be able to steer into it, and fogging it would ring the map
  // with blank tiles. Added to `visible` only — writing thousands of empty ocean keys
  // into `discovered` would bloat every save for nothing.
  for (const [key, tile] of Object.entries(state.map.tiles)) {
    if (tile.open) visible.add(key);
  }

  return {
    visibleTiles: [...visible],
    discoveredTiles: [...discovered]
  };
}
