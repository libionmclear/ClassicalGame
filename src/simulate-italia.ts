import { applyAction, createInitialGameState } from "./engine/index";
import { loadScenario } from "./engine/scenarios";
import type { GameAction } from "./engine/types";

function summarize(state: ReturnType<typeof createInitialGameState>): string {
  const current = state.players[state.currentPlayerIndex];
  const players = state.players
    .map((p) => `${p.id}: cities=${p.cityIds.length}, units=${p.unitIds.length}, prod=${p.production}, gold=${p.gold}`)
    .join(" | ");
  return `Turn ${state.turn} | Active ${current.id} | ${players}`;
}

function run(): void {
  const scenario = loadScenario("italia");
  let state = createInitialGameState(scenario.config);

  const script: GameAction[] = [
    { type: "FOUND_CITY", playerId: "rome", settlerId: "r_settler", cityId: "neapolis" },
    { type: "BUILD_UNIT", playerId: "rome", cityId: "roma", unitType: "archer", unitId: "r_archer_1" },
    { type: "END_TURN", playerId: "rome" },
    { type: "FOUND_CITY", playerId: "carthage", settlerId: "c_settler", cityId: "motya" },
    { type: "BUILD_UNIT", playerId: "carthage", cityId: "karthago", unitType: "archer", unitId: "c_archer_1" },
    { type: "END_TURN", playerId: "carthage" },
    { type: "END_TURN", playerId: "rome" },
    { type: "END_TURN", playerId: "carthage" }
  ];

  console.log(`Scenario: ${scenario.name}`);
  console.log(scenario.historicalBrief);
  console.log(summarize(state));

  for (const action of script) {
    state = applyAction(state, action);
    console.log(`${action.playerId} -> ${action.type}`);
    console.log(summarize(state));
  }

  console.log("Simulation complete.");
}

run();
