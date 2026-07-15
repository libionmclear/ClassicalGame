// Turn-order initiative: rotation (fairness) vs the human-first opt-out.
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction } from "../src/engine";
import { generateMap } from "../src/engine/mapgen";
import type { GameState, GameAction } from "../src/engine/types";

// The seat index that OPENS each new game-turn, for the first `rounds` turns.
function roundOpeners(start: GameState, rounds: number): number[] {
  let s = start;
  const openers: number[] = [];
  let lastTurn = -1;
  let guard = 0;
  while (openers.length < rounds && guard++ < 1000) {
    if (s.turn !== lastTurn) { openers.push(s.currentPlayerIndex); lastTurn = s.turn; }
    const pid = s.players[s.currentPlayerIndex]!.id;
    s = applyAction(s, { type: "END_TURN", playerId: pid } as GameAction);
  }
  return openers;
}

const cfg = () => generateMap({ size: "small", seed: "init-seed", playerCount: 3, civOrder: ["rome", "greece", "egypt"] });

test("rotateInitiative on (default): the opening seat rotates each round (3+ players)", () => {
  const s = createInitialGameState({ ...cfg(), rotateInitiative: true });
  assert.deepEqual(roundOpeners(s, 4), [0, 1, 2, 0]);
});

test("rotateInitiative defaults to on when unspecified", () => {
  const s = createInitialGameState({ ...cfg() });
  assert.equal(s.rotateInitiative, true);
  assert.deepEqual(roundOpeners(s, 3), [0, 1, 2]);
});

test("rotateInitiative off: the first seat (the human) always opens the round", () => {
  const s = createInitialGameState({ ...cfg(), rotateInitiative: false });
  assert.deepEqual(roundOpeners(s, 4), [0, 0, 0, 0]);
});
