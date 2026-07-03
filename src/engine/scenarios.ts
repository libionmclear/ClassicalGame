import type { CreateGameConfig } from "./types";
import { italiaScenario } from "./scenarios/italia";

export type ScenarioId = "italia";

export interface ScenarioBriefing {
  /** Short dateline, e.g. "264 BC — The eve of the First Punic War". */
  era: string;
  /** Two or three sentences setting the historical stage. */
  situation: string;
  /** What the player is trying to achieve, in plain terms. */
  objectives: string[];
  /** A sourced "did you know" nugget — the educational hook. */
  didYouKnow: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  historicalBrief: string;
  briefing: ScenarioBriefing;
  config: CreateGameConfig;
}

const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  italia: {
    id: "italia",
    name: "Italia: Rome vs Carthage",
    historicalBrief:
      "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
    briefing: {
      era: "264 BC — the eve of the First Punic War",
      situation:
        "Rome has mastered the Italian peninsula through her legions and her web of Latin alliances. Across the Tyrrhenian Sea, Carthage — heir to Phoenician Tyre — commands the richest trade network in the western Mediterranean and a navy without equal. Sicily lies between them like a stepping-stone, and neither power can let the other hold it.",
      objectives: [
        "Grow your cities and out-expand your rival across Italia",
        "Master the classical arms — spears, horse, sword and siege — for the wars to come",
        "Win by holding every capital (Domination), or by leading on score when the age ends (Quick)"
      ],
      didYouKnow:
        "The Romans called this war 'Punic' from Poeni, their word for the Phoenician settlers who founded Carthage around 814 BC. Rome had almost no fleet in 264 BC — she reputedly reverse-engineered her first warships from a shipwrecked Carthaginian vessel."
    },
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
