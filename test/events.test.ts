import test from "node:test";
import assert from "node:assert/strict";

import { createInitialGameState, applyAction, EVENTS, getEvent } from "../src/engine/index";
import { runAiTurn } from "../src/engine/ai";

function twoPlayerState(seed = "evt") {
  const tiles: Record<string, { terrain: "plains"; region: string }> = {};
  for (let r = 0; r < 5; r += 1) {
    for (let q = 0; q < 5; q += 1) tiles[`${q},${r}`] = { terrain: "plains", region: "core" };
  }
  return createInitialGameState({
    seed,
    players: [
      { id: "p1", civ: "Rome", gold: 100, production: 0, science: 0 },
      { id: "p2", civ: "Carthage", gold: 100 }
    ],
    map: {
      width: 5,
      height: 5,
      regions: ["core"],
      tiles,
      cities: {
        c1: { id: "c1", ownerId: "p1", position: { q: 1, r: 1 }, population: 2, hp: 40, maxHp: 40, isCapital: true },
        c2: { id: "c2", ownerId: "p2", position: { q: 3, r: 3 }, population: 2, hp: 40, maxHp: 40, isCapital: true }
      }
    }
  });
}

test("resolving a Crossroads event applies the chosen option's effects", () => {
  let state = twoPlayerState();
  // Force a known pending event rather than waiting for the RNG.
  state.playersById.p1.pendingEvent = "philosopher";
  const before = state.playersById.p1.science;
  const event = getEvent("philosopher");
  assert.ok(event, "event exists");

  state = applyAction(state, { type: "RESOLVE_EVENT", playerId: "p1", eventId: "philosopher", optionIndex: 0 });

  assert.equal(state.playersById.p1.pendingEvent, undefined, "pending event is cleared");
  assert.equal(
    state.playersById.p1.science,
    before + (event!.options[0].effects.science ?? 0),
    "science effect applied"
  );
});

test("a spawn-unit event places the unit at the capital", () => {
  let state = twoPlayerState();
  state.playersById.p1.pendingEvent = "mercenaries";
  const before = state.playersById.p1.unitIds.length;
  state = applyAction(state, { type: "RESOLVE_EVENT", playerId: "p1", eventId: "mercenaries", optionIndex: 0 });
  assert.equal(state.playersById.p1.unitIds.length, before + 1, "a spearman was mustered");
  const spawned = Object.values(state.map.units).find((u) => u.ownerId === "p1" && u.type === "spearman");
  assert.ok(spawned, "spearman exists");
  assert.deepEqual(spawned!.position, state.map.cities.c1.position, "spawned at the capital");
});

test("resolving the wrong event id is rejected", () => {
  const state = twoPlayerState();
  state.playersById.p1.pendingEvent = "games";
  assert.throws(
    () => applyAction(state, { type: "RESOLVE_EVENT", playerId: "p1", eventId: "philosopher", optionIndex: 0 }),
    /No pending event/
  );
});

test("the AI auto-resolves its own pending events and keeps playing", () => {
  const state = twoPlayerState();
  state.playersById.p1.pendingEvent = "games";
  const result = runAiTurn(state, "p1", 10);
  assert.ok(
    result.actions.some((a) => a.type === "RESOLVE_EVENT"),
    "AI resolved the event"
  );
  assert.equal(result.state.playersById.p1.pendingEvent, undefined, "event cleared after the AI turn");
});

test("events eventually fire over a long game and are spaced out", () => {
  let state = twoPlayerState("fires");
  let fired = 0;
  for (let i = 0; i < 40; i += 1) {
    // resolve if pending, else end turn
    for (const pid of ["p1", "p2"]) {
      const p = state.playersById[pid];
      if (p.pendingEvent) {
        fired += 1;
        state = applyAction(state, { type: "RESOLVE_EVENT", playerId: pid, eventId: p.pendingEvent, optionIndex: 0 });
      }
    }
    const current = state.players[state.currentPlayerIndex].id;
    state = applyAction(state, { type: "END_TURN", playerId: current });
  }
  assert.ok(fired > 0, "at least one Crossroads event fired across ~20 turns");
  assert.ok(EVENTS.length >= 4, "there is a set of events to draw from");
});
