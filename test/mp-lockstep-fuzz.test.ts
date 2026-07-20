// Engine hardening (Direction §3.1.3): lockstep fuzz. The single-seed lockstep proof
// in mp-lockstep.test.ts, run across a CORPUS of diverse seeds / sizes / player counts.
// Two clients seated as different humans each run the map + AI locally; relaying only
// human END_TURNs must keep them byte-identical every seat-turn for a full match. Any
// per-seat nondeterminism (object-key order, a humanPlayerId leak into engine state)
// surfaces here on at least one seed. Seeds are a fixed corpus — reproducible "fuzz."
import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, getVictoryStatus } from "../src/engine";
import { generateMap } from "../src/engine/mapgen";
import { runAiTurn } from "../src/engine/ai";
import type { GameState, GameAction } from "../src/engine/types";

// humanPlayerId is the only gameplay-inert field that differs between the two clients
// (normal difficulty → handicap 1 for all), so identity is state-equality with it nulled.
const key = (s: GameState): string => JSON.stringify({ ...s, humanPlayerId: null });

const CORPUS = [
  { seed: "fuzz-1", size: "small" as const, civOrder: ["rome", "greece"] },
  { seed: "fuzz-2", size: "small" as const, civOrder: ["carthage", "gaul", "egypt"] },
  { seed: "fuzz-3", size: "medium" as const, civOrder: ["parthia", "kush", "britons"] },
  { seed: "fuzz-4", size: "small" as const, civOrder: ["egypt", "rome", "greece", "carthage"] },
  { seed: "fuzz-5", size: "medium" as const, civOrder: ["britons", "gaul"] },
  { seed: "fuzz-6", size: "small" as const, civOrder: ["kush", "parthia", "rome"] }
];

function runLockstep(entry: (typeof CORPUS)[number]): number {
  const shared = generateMap({ size: entry.size, seed: entry.seed, playerCount: entry.civOrder.length, civOrder: entry.civOrder });
  const seated = (shared.players ?? []).map((p) => p.id);
  const humans = [seated[0]!, seated[1]!]; // first two seats are the two clients
  const isHuman = (id: string) => humans.includes(id);
  const cfg = (myCiv: string) => ({ ...shared, difficulty: "normal" as const, humanPlayerId: myCiv, allianceVictory: true });

  const advance = (s: GameState): GameState => {
    let cur = s;
    while (!isHuman(cur.players[cur.currentPlayerIndex].id)) {
      if (getVictoryStatus(cur).winnerId) break;
      cur = runAiTurn(cur, cur.players[cur.currentPlayerIndex].id, 12).state;
    }
    return cur;
  };

  const A = { state: advance(createInitialGameState(cfg(humans[0]))), civ: humans[0], applied: 0 };
  const B = { state: advance(createInitialGameState(cfg(humans[1]))), civ: humans[1], applied: 0 };
  assert.equal(key(A.state), key(B.state), `${entry.seed}: initial states differ`);

  const log: Array<{ civ: string; action: GameAction }> = [];
  const pump = (c: { state: GameState; civ: string; applied: number }) => {
    for (; c.applied < log.length; c.applied += 1) {
      const e = log[c.applied]!;
      if (e.civ === c.civ) continue; // already applied locally
      c.state = applyAction(c.state, e.action);
      if (e.action.type === "END_TURN") c.state = advance(c.state);
    }
  };

  let steps = 0;
  for (let i = 0; i < 20 && !getVictoryStatus(A.state).winnerId; i += 1) {
    const active = A.state.players[A.state.currentPlayerIndex].id;
    assert.equal(B.state.players[B.state.currentPlayerIndex].id, active, `${entry.seed}: clients disagree on the active seat`);
    const action = { type: "END_TURN", playerId: active } as GameAction;
    log.push({ civ: active, action });
    const owner = A.civ === active ? A : B;
    owner.state = advance(applyAction(owner.state, action));
    pump(A); pump(B);
    assert.equal(key(A.state), key(B.state), `${entry.seed}: diverged at step ${i}`);
    steps += 1;
  }
  return steps;
}

test("two clients stay in lockstep across a corpus of seeds / sizes / player counts", () => {
  let total = 0;
  for (const entry of CORPUS) total += runLockstep(entry);
  assert.ok(total >= CORPUS.length * 5, "the corpus ran a meaningful number of turns");
});
