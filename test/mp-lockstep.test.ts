// Multiplayer Phase 2b — lockstep determinism.
//
// Live online play relays only the HUMAN seats' actions; every OTHER seat runs AI
// locally & identically on each client. That is only correct if the engine is
// deterministic and each client generates the exact same map. These tests prove
// both, by simulating two independent clients driven from different perspectives
// and asserting their game states stay byte-identical.

import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, getVictoryStatus } from "../src/engine";
import { generateMap } from "../src/engine/mapgen";
import { runAiTurn } from "../src/engine/ai";
import type { GameState, GameAction } from "../src/engine/types";

const BASE = { size: "small", seed: "mp-LOCK-1", playerCount: 3 } as const;

test("civOrder makes the map identical no matter which civ is the local human", () => {
  const civOrder = ["rome", "greece", "egypt"];
  const a = generateMap({ ...BASE, civOrder, humanCiv: "rome" });
  const b = generateMap({ ...BASE, civOrder, humanCiv: "greece" });
  // Same seed + same seat order → the exact same generated game, so every client
  // sees the same civ at the same capital. This is the fix that keeps MP in sync.
  assert.equal(JSON.stringify(a), JSON.stringify(b));
});

test("WITHOUT civOrder, humanCiv reorders the roster — the divergence civOrder fixes", () => {
  const a = generateMap({ ...BASE, humanCiv: "rome" });
  const b = generateMap({ ...BASE, humanCiv: "greece" });
  // orderRoster() puts the local human's civ first, so seat 0 (and its capital)
  // differs between clients — exactly why MP must pass civOrder instead.
  assert.notEqual((a.players ?? [])[0]?.id, (b.players ?? [])[0]?.id);
});

// Two real clients build SEPARATE configs, each stamping its OWN humanPlayerId (as
// newGame does online). At the forced "normal" difficulty the handicap multiplier
// is 1 for everyone, so humanPlayerId is gameplay-inert — the only differing field.
// Gameplay identity is therefore state-equality with that one marker normalized.
function gameplayKey(s: GameState): string {
  return JSON.stringify({ ...s, humanPlayerId: null });
}

test("two clients relaying END_TURN + running AI locally stay in lockstep", () => {
  const civOrder = ["rome", "greece", "egypt"];
  const shared = generateMap({ ...BASE, seed: "mp-LOCK-2", civOrder });
  const seated = (shared.players ?? []).map((p) => p.id);
  const humans: string[] = [seated[0]!, seated[1]!]; // first two seats are human
  const isHuman = (id: string) => humans.includes(id);
  // Mirror newGame's MP path: same map, but each client stamps its own identity
  // and the fixed online rules (normal difficulty, alliance victory on).
  const configFor = (myCiv: string) => ({ ...shared, difficulty: "normal" as const, humanPlayerId: myCiv, allianceVictory: true });

  // runAiUntilHuman(): advance the current seat through AI until a human is up.
  function advance(s: GameState): GameState {
    let cur = s;
    while (!isHuman(cur.players[cur.currentPlayerIndex].id)) {
      if (getVictoryStatus(cur).winnerId) break;
      cur = runAiTurn(cur, cur.players[cur.currentPlayerIndex].id, 12).state;
    }
    return cur;
  }

  // Two independent clients, one per human seat, each with its own humanPlayerId.
  const A = { state: advance(createInitialGameState(configFor(humans[0]))), civ: humans[0], applied: 0 };
  const B = { state: advance(createInitialGameState(configFor(humans[1]))), civ: humans[1], applied: 0 };
  assert.equal(gameplayKey(A.state), gameplayKey(B.state), "initial states match");

  // The shared server log of relayed human moves.
  const log: { civ: string; action: GameAction }[] = [];

  // mpApplyRemote(): apply everyone else's moves in order; after a remote END_TURN
  // run the intervening AI seats locally. My own echoed entries are skipped.
  function pump(c: { state: GameState; civ: string; applied: number }) {
    for (; c.applied < log.length; c.applied++) {
      const e = log[c.applied];
      if (e.civ === c.civ) continue; // already applied locally
      c.state = applyAction(c.state, e.action);
      if (e.action.type === "END_TURN") c.state = advance(c.state);
    }
  }

  let rounds = 0;
  for (let step = 0; step < 30 && !getVictoryStatus(A.state).winnerId; step++) {
    const active = A.state.players[A.state.currentPlayerIndex].id;
    assert.equal(B.state.players[B.state.currentPlayerIndex].id, active, "clients agree on the active seat");
    assert.ok(isHuman(active), "the active seat at a turn boundary is always a human");

    const action = { type: "END_TURN", playerId: active } as GameAction;
    // Relay it, then the OWNER applies it locally + advances (its own client).
    log.push({ civ: active, action });
    const owner = A.civ === active ? A : B;
    owner.state = advance(applyAction(owner.state, action));
    // Both clients reconcile against the log (pump skips the owner's own entry).
    pump(A);
    pump(B);
    assert.equal(gameplayKey(A.state), gameplayKey(B.state), "clients diverged at step " + step);
    rounds++;
  }

  assert.ok(rounds >= 10, "the simulation ran a meaningful number of turns");
  assert.ok(A.state.turn > seated.length, "turns actually advanced");
  // Sanity: the clients really do hold different local identities (yet play identically).
  assert.notEqual(A.state.humanPlayerId, B.state.humanPlayerId);
});

test("a mid-game drop (seat → AI) applied at the same log seq keeps clients in lockstep", () => {
  const civOrder = ["rome", "greece", "egypt"];
  const shared = generateMap({ ...BASE, seed: "mp-DROP", civOrder });
  const seated = (shared.players ?? []).map((p) => p.id);
  const humans = new Set([seated[0]!, seated[1]!]); // both clients converge on this membership
  const isHuman = (id: string) => humans.has(id);
  const cfg = (myCiv: string) => ({ ...shared, difficulty: "normal" as const, humanPlayerId: myCiv, allianceVictory: true });
  const key = (s: GameState) => JSON.stringify({ ...s, humanPlayerId: null });

  function advance(s: GameState): GameState {
    let cur = s;
    while (!isHuman(cur.players[cur.currentPlayerIndex].id)) {
      if (getVictoryStatus(cur).winnerId) break;
      cur = runAiTurn(cur, cur.players[cur.currentPlayerIndex].id, 12).state;
    }
    return cur;
  }

  const A = { state: advance(createInitialGameState(cfg(seated[0]!))), civ: seated[0]!, applied: 0 };
  const B = { state: advance(createInitialGameState(cfg(seated[1]!))), civ: seated[1]!, applied: 0 };
  const log: Array<{ civ: string; action?: GameAction; control?: string }> = [];

  function pump(c: { state: GameState; civ: string; applied: number }) {
    for (; c.applied < log.length; c.applied++) {
      const e = log[c.applied]!;
      if (e.control === "drop") { humans.delete(e.civ); c.state = advance(c.state); continue; }
      if (e.civ === c.civ) continue;
      c.state = applyAction(c.state, e.action!);
      if (e.action!.type === "END_TURN") c.state = advance(c.state);
    }
  }

  let dropped = false;
  for (let step = 0; step < 24 && !getVictoryStatus(A.state).winnerId; step++) {
    // Partway in, the server hands the SECOND human's seat to the AI (a control entry).
    if (step === 6 && !dropped) {
      dropped = true;
      log.push({ civ: seated[1]!, control: "drop" });
      pump(A); pump(B);
      assert.equal(key(A.state), key(B.state), "identical right after the drop");
    }
    const active = A.state.players[A.state.currentPlayerIndex].id;
    if (!isHuman(active)) break;
    const action = { type: "END_TURN", playerId: active } as GameAction;
    log.push({ civ: active, action });
    const owner = A.civ === active ? A : B;
    owner.state = advance(applyAction(owner.state, action));
    pump(A); pump(B);
    assert.equal(key(A.state), key(B.state), "clients diverged after the drop at step " + step);
  }

  assert.ok(dropped, "the drop path was exercised");
  assert.ok(!humans.has(seated[1]!), "the dropped seat is no longer a human on either client");
});

test("a client that rejoins mid-game rebuilds the exact state by replaying the log", () => {
  const civOrder = ["rome", "greece", "egypt"];
  const shared = generateMap({ ...BASE, seed: "mp-REJOIN", civOrder });
  const seated = (shared.players ?? []).map((p) => p.id);
  const origHumans = [seated[0]!, seated[1]!];
  const cfg = (myCiv: string) => ({ ...shared, difficulty: "normal" as const, humanPlayerId: myCiv, allianceVictory: true });
  const key = (s: GameState) => JSON.stringify({ ...s, humanPlayerId: null });
  const log: Array<{ civ: string; action?: GameAction; control?: string }> = [];

  // A reusable "run AI up to the next human" bound to a given human membership set.
  const advancer = (humans: Set<string>) => (s: GameState): GameState => {
    let cur = s;
    while (!humans.has(cur.players[cur.currentPlayerIndex].id)) {
      if (getVictoryStatus(cur).winnerId) break;
      cur = runAiTurn(cur, cur.players[cur.currentPlayerIndex].id, 12).state;
    }
    return cur;
  };

  // --- Play a live game (seat 0's perspective), dropping the 2nd human partway. ---
  const humansLive = new Set(origHumans);
  const advLive = advancer(humansLive);
  let live = advLive(createInitialGameState(cfg(seated[0]!)));
  for (let step = 0; step < 16 && !getVictoryStatus(live).winnerId; step++) {
    if (step === 5) { log.push({ civ: seated[1]!, control: "drop" }); humansLive.delete(seated[1]!); live = advLive(live); }
    const active = live.players[live.currentPlayerIndex].id;
    if (!humansLive.has(active)) break;
    const action = { type: "END_TURN", playerId: active } as GameAction;
    log.push({ civ: active, action });
    live = advLive(applyAction(live, action));
  }
  assert.ok(log.some((e) => e.control === "drop"), "the game included a drop");

  // --- A fresh client (seat 0) rejoins: rebuild from seed, then replay the WHOLE log,
  //     applying EVERY human action — including seat 0's OWN past moves (caughtUp=false)
  //     — and converting dropped seats to AI at the seq their drop entry appears. ---
  const humansRe = new Set(origHumans); // starts from the ORIGINAL humans
  const advRe = advancer(humansRe);
  let rejoin = advRe(createInitialGameState(cfg(seated[0]!)));
  for (const e of log) {
    if (e.control === "drop") { humansRe.delete(e.civ); rejoin = advRe(rejoin); continue; }
    rejoin = applyAction(rejoin, e.action!); // ALL civs, incl. my own — the rejoin fix
    if (e.action!.type === "END_TURN") rejoin = advRe(rejoin);
  }

  assert.equal(key(rejoin), key(live), "the rejoined client matches the live client exactly");
});
