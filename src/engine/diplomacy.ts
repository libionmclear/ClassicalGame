// HEGEMON — diplomacy.ts (Diplomacy v1). Phase 1 slice D1: the RELATIONS core.
// Per-pair relation score (−100..+100) in five bands, a canonical pair key, a
// gift-of-gold driver, and the slow "long peace" warming applied each turn.
// Pure helpers + small mutators (applyAction deep-clones then mutates, so it is
// safe for these to write into state).
import type { GameState, DiploPair } from "./types";

export const RELATION_MIN = -100;
export const RELATION_MAX = 100;

export type RelationBand = "hostile" | "wary" | "neutral" | "cordial" | "friendly";

// Band thresholds per §1: Hostile ≤−50 · Wary −49..−10 · Neutral · Cordial
// +10..+49 · Friendly ≥+50.
export function relationBand(rel: number): RelationBand {
  if (rel <= -50) return "hostile";
  if (rel <= -10) return "wary";
  if (rel < 10) return "neutral";
  if (rel < 50) return "cordial";
  return "friendly";
}

export const RELATION_BAND_LABELS: Record<RelationBand, string> = {
  hostile: "Hostile", wary: "Wary", neutral: "Neutral", cordial: "Cordial", friendly: "Friendly"
};

// Order-independent key so a pair has ONE entry no matter who is asked first.
export function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

export function clampRelation(r: number): number {
  return Math.max(RELATION_MIN, Math.min(RELATION_MAX, r));
}

// Read the pair record (may be undefined before a game inits diplomacy).
export function getPair(state: GameState, a: string, b: string): DiploPair | undefined {
  return state.diplomacy?.[pairKey(a, b)];
}

// A civ is always fully "friendly" with itself; unknown pairs read Neutral (0).
export function getRelation(state: GameState, a: string, b: string): number {
  if (a === b) return RELATION_MAX;
  return getPair(state, a, b)?.relation ?? 0;
}

// Get-or-create the pair record so a mutator always has somewhere to write.
export function ensurePair(state: GameState, a: string, b: string): DiploPair {
  if (!state.diplomacy) state.diplomacy = {};
  const k = pairKey(a, b);
  let p = state.diplomacy[k];
  if (!p) { p = { relation: 0, agreements: [] }; state.diplomacy[k] = p; }
  return p;
}

// Shift a pair's relation by delta (clamped). Self-pairs are ignored.
export function adjustRelation(state: GameState, a: string, b: string, delta: number): void {
  if (a === b) return;
  const p = ensurePair(state, a, b);
  p.relation = clampRelation(p.relation + delta);
}

// Seed a Neutral (0) record for every unordered pair of players. Deterministic.
export function initDiplomacy(state: GameState): void {
  state.diplomacy = state.diplomacy ?? {};
  const ids = state.players.map((p) => p.id);
  for (let i = 0; i < ids.length; i += 1)
    for (let j = i + 1; j < ids.length; j += 1) ensurePair(state, ids[i], ids[j]);
}

// ---- drivers -------------------------------------------------------------

export const GIFT_RELATION_PER_25 = 1;

// Relation warmth a gift of `amount` gold buys, DIMINISHING as relations improve
// (a gift moves a wary rival far more than an already-cordial friend) per §1.
// < 25g buys goodwill but no measurable relation shift.
export function giftRelationGain(amount: number, currentRelation: number): number {
  const chunks = Math.floor(amount / 25);
  if (chunks <= 0) return 0;
  const diminish = clamp(1 - Math.max(0, currentRelation) / 100, 0.25, 1);
  return Math.max(1, Math.round(chunks * GIFT_RELATION_PER_25 * diminish));
}

export const LONG_PEACE_DRIFT = 0.5;
// Passive peace warms relations, but only up to Cordial — Friendly must be
// EARNED with active agreements (arrives in slice D3). War / betrayal drivers
// that pull relations down arrive in D2. So today this is the one drift term.
export const PEACE_WARM_CAP = 40;

// Apply the once-per-turn "long peace" warming to every pair below the cap.
export function applyRelationDrift(state: GameState): void {
  if (!state.diplomacy) return;
  for (const key of Object.keys(state.diplomacy)) {
    const p = state.diplomacy[key];
    if (p.relation < PEACE_WARM_CAP) p.relation = Math.min(PEACE_WARM_CAP, p.relation + LONG_PEACE_DRIFT);
  }
}

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
