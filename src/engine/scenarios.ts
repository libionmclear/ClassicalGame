import type { CreateGameConfig } from "./types";
import { italiaScenario } from "./scenarios/italia";

export type ScenarioId = "italia";

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  historicalBrief: string;
  config: CreateGameConfig;
}

const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  italia: {
    id: "italia",
    name: "Italia: Rome vs Carthage",
    historicalBrief:
      "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
    config: italiaScenario
  }
};

export function listScenarios(): ScenarioDefinition[] {
  return Object.values(SCENARIOS);
}

export function loadScenario(id: ScenarioId): ScenarioDefinition {
  const scenario = SCENARIOS[id];
  if (!scenario) {
    throw new Error(`Unknown scenario ${id}`);
  }
  return JSON.parse(JSON.stringify(scenario)) as ScenarioDefinition;
}
