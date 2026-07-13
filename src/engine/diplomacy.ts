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
// EARNED with active agreements (slice D3). Pairs AT WAR cool instead of warming.
export const PEACE_WARM_CAP = 40;
export const WAR_COOL_DRIFT = 1;

// Apply the once-per-turn relation drift: at-war pairs cool, peaceful pairs warm
// (up to the cap). Called from applyEndTurn when the game turn advances.
export function applyRelationDrift(state: GameState): void {
  if (!state.diplomacy) return;
  for (const key of Object.keys(state.diplomacy)) {
    const p = state.diplomacy[key];
    if (p.warSince != null) p.relation = clampRelation(p.relation - WAR_COOL_DRIFT);
    else if (p.relation < PEACE_WARM_CAP) p.relation = Math.min(PEACE_WARM_CAP, p.relation + LONG_PEACE_DRIFT);
  }
}

// ---- war & reputation (§3) ----------------------------------------------

export const WAR_DECLARE_RELATION = -30;   // opening hostilities cools the pair
export const OATHBREAKER_TURNS = 25;
export const OATHBREAKER_VICTIM_HIT = -40;
export const OATHBREAKER_WORLD_HIT = -15;
export const WAR_WEARINESS_PERIOD = 15;    // −1 stability per this many war turns

// A binding pact whose breach makes you an Oathbreaker.
const BINDING_PACTS = new Set(["nap", "defensive-alliance", "full-alliance"]);

export function isAtWar(state: GameState, a: string, b: string): boolean {
  if (a === b) return false;
  return getPair(state, a, b)?.warSince != null;
}

// Does a non-expired agreement of `type` stand between the pair?
export function hasAgreement(state: GameState, a: string, b: string, type: string): boolean {
  const p = getPair(state, a, b);
  if (!p) return false;
  return p.agreements.some((ag) => ag.type === type && (ag.expires === 0 || ag.expires > state.turn));
}
export function hasNap(state: GameState, a: string, b: string): boolean {
  const p = getPair(state, a, b);
  return !!p && p.agreements.some((ag) => BINDING_PACTS.has(ag.type) && (ag.expires === 0 || ag.expires > state.turn));
}

export function isOathbreaker(state: GameState, playerId: string): boolean {
  const p = state.playersById[playerId];
  return !!p && p.oathbreakerUntil != null && p.oathbreakerUntil > state.turn;
}

// Brand a player an Oathbreaker: the 25-turn mark, −40 with the victim, −15 with
// everyone else (§3). The stability / merc-price bite is read where those are
// computed (computeCityStability; merc price when a hire path exists).
export function brandOathbreaker(state: GameState, playerId: string, victimId: string): void {
  const p = state.playersById[playerId];
  if (!p) return;
  p.oathbreakerUntil = state.turn + OATHBREAKER_TURNS;
  for (const other of state.players) {
    if (other.id === playerId) continue;
    adjustRelation(state, playerId, other.id, other.id === victimId ? OATHBREAKER_VICTIM_HIT : OATHBREAKER_WORLD_HIT);
  }
}

// Enter a state of war (idempotent — only the peace→war transition has effects).
// Breaking a binding pact (NAP/alliance) — by a formal declaration OR a surprise
// blow — brands the aggressor an Oathbreaker. Plain undeclared war between civs
// with no pact is just war (design call: otherwise every AI war brands everyone).
// Returns true if this call started the war.
export function enterWar(state: GameState, aggressorId: string, targetId: string): boolean {
  if (aggressorId === targetId) return false;
  const pair = ensurePair(state, aggressorId, targetId);
  if (pair.warSince != null) return false; // already at war
  const pactBreak = hasNap(state, aggressorId, targetId);
  pair.warSince = state.turn;
  pair.agreements = []; // war voids every agreement on the pair
  pair.tribute = null;
  pair.relation = clampRelation(pair.relation + WAR_DECLARE_RELATION);
  if (pactBreak) brandOathbreaker(state, aggressorId, targetId);
  return true;
}

// −1 city stability per WAR_WEARINESS_PERIOD turns in the player's longest war (§3).
export function playerWarWeariness(state: GameState, playerId: string): number {
  if (!state.diplomacy) return 0;
  let worst = 0;
  for (const key of Object.keys(state.diplomacy)) {
    const [a, b] = key.split("|");
    if (a !== playerId && b !== playerId) continue;
    const p = state.diplomacy[key];
    if (p.warSince == null) continue;
    worst = Math.max(worst, Math.floor((state.turn - p.warSince) / WAR_WEARINESS_PERIOD));
  }
  return worst;
}

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
