import {
  applyAction,
  computeVisibility,
  computeCombatPreview,
  createInitialGameState,
  getVictoryStatus,
  canResearch,
  researchCost,
  serializeState,
  deserializeState,
  replayActions,
  keyOf,
  parseKey,
  distance,
  findPath,
  movementCost,
  TERRAIN,
  TECHS,
  UNITS,
  UNIT_BUILD_COSTS,
  BUILDINGS,
  WEATHER_STATES
} from "./index";
import { chooseAiAction, runAiTurn } from "./ai";
import { loadScenario, listScenarios } from "./scenarios";
import { generateMap, MAP_SIZES, CIV_ROSTER, DEFAULT_PLAYERS, MAX_PLAYERS } from "./mapgen";
import { EVENTS, getEvent } from "./events";

// Every symbol the browser demo (game.js) reads off window.HegemonEngine must be
// re-exported here — esbuild only surfaces what this entry module exports.
export {
  applyAction,
  createInitialGameState,
  computeVisibility,
  computeCombatPreview,
  getVictoryStatus,
  canResearch,
  researchCost,
  serializeState,
  deserializeState,
  replayActions,
  keyOf,
  parseKey,
  distance,
  findPath,
  movementCost,
  TERRAIN,
  TECHS,
  UNITS,
  UNIT_BUILD_COSTS,
  BUILDINGS,
  WEATHER_STATES,
  chooseAiAction,
  runAiTurn,
  loadScenario,
  listScenarios,
  generateMap,
  MAP_SIZES,
  CIV_ROSTER,
  DEFAULT_PLAYERS,
  MAX_PLAYERS,
  EVENTS,
  getEvent
};
