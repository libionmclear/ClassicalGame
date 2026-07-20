// Engine hardening (Direction §3.1.2): the golden replay-hash. Seeded full games,
// mixed civs and player counts, are played deterministically; the serialized state is
// hashed every seat-turn and compared to committed golden hashes. Any nondeterminism
// OR unintended rules change shifts a hash and fails CI. When a change to the rules is
// INTENTIONAL, regenerate with `UPDATE_GOLDEN=1 npx tsx --test test/golden-replay.test.ts`
// and commit the new test/golden-replay.json.
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

import { createInitialGameState, getVictoryStatus, serializeState } from "../src/engine";
import { generateMap } from "../src/engine/mapgen";
import { runAiTurn } from "../src/engine/ai";
import type { GameState } from "../src/engine/types";

const GOLDEN = "test/golden-replay.json";
const MAX_TURN = 16;

const SCENARIOS = [
  { seed: "golden-A", size: "small" as const, civOrder: ["rome", "greece", "egypt"] },
  { seed: "golden-B", size: "small" as const, civOrder: ["carthage", "gaul"] },
  { seed: "golden-C", size: "medium" as const, civOrder: ["parthia", "kush", "britons"] }
];

const shortHash = (s: string): string => createHash("sha256").update(s).digest("hex").slice(0, 16);

// Play a headless AI-vs-AI game and hash the state after every seat-turn.
function replayHashes(sc: (typeof SCENARIOS)[number]): string[] {
  const shared = generateMap({ size: sc.size, seed: sc.seed, playerCount: sc.civOrder.length, civOrder: sc.civOrder });
  let state: GameState = createInitialGameState({ ...shared, difficulty: "normal", humanPlayerId: null, allianceVictory: true });
  const hashes: string[] = [shortHash(serializeState(state))];
  for (let guard = 0; state.turn <= MAX_TURN && guard < 600; guard += 1) {
    if (getVictoryStatus(state).winnerId) break;
    const pid = state.players[state.currentPlayerIndex].id;
    state = runAiTurn(state, pid, 12).state;
    hashes.push(shortHash(serializeState(state)));
  }
  return hashes;
}

test("seeded games replay to identical state hashes (golden — determinism + no rules drift)", () => {
  const computed: Record<string, string[]> = {};
  for (const sc of SCENARIOS) computed[sc.seed] = replayHashes(sc);

  // Same seed twice in-process must already match — proves determinism regardless of goldens.
  for (const sc of SCENARIOS) {
    assert.deepEqual(replayHashes(sc), computed[sc.seed], `${sc.seed} is not self-consistent — nondeterminism in the engine`);
  }

  if (process.env.UPDATE_GOLDEN || !existsSync(GOLDEN)) {
    writeFileSync(GOLDEN, JSON.stringify(computed, null, 2) + "\n");
    console.log(`Recorded golden replay hashes → ${GOLDEN}`);
    return;
  }
  const golden = JSON.parse(readFileSync(GOLDEN, "utf8")) as Record<string, string[]>;
  assert.deepEqual(
    computed,
    golden,
    "\nReplay hashes diverged from the committed golden. Either nondeterminism crept in, or a rules change shifted replay.\n" +
      "If the change is intended: UPDATE_GOLDEN=1 npx tsx --test test/golden-replay.test.ts, then commit test/golden-replay.json.\n"
  );
});
