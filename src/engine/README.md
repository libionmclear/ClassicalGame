# HEGEMON Engine (Phase 0 Scaffold)

This folder contains a deterministic, headless simulation core designed to stay independent from any renderer.

## Current capabilities

- Pure state transitions via `applyAction(state, action)`
- Seeded weather generation and deterministic replay
- Axial hex utilities and pathfinding
- Movement costs with terrain and river-edge modifiers
- Deterministic combat preview and resolution
- Tech research with mutually exclusive fork enforcement
- Turn economy (city yields, upkeep, weather progression)
- JSON serialize/deserialize helpers

## Run tests

```bash
npm run test:engine
```

## Main API

- `createInitialGameState(config)`
- `applyAction(state, action)`
- `computeCombatPreview(state, attackerId, defenderId)`
- `replayActions(initialState, actions)`
- `serializeState(state)` / `deserializeState(json)`

This is the Phase 0 base for adding richer data-driven content and scenario packs.
