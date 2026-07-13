// HEGEMON — diplomacy.ts (Diplomacy v1). Phase 1 slice D1: the RELATIONS core.
// Per-pair relation score (−100..+100) in five bands, a canonical pair key, a
// gift-of-gold driver, and the slow "long peace" warming applied each turn.
// Pure helpers + small mutators (applyAction deep-clones then mutates, so it is
// safe for these to write into state).
import type { GameState, DiploPair, DiploAgreement } from "./types";

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
export function enterWar(state: GameState, aggressorId: string, targetId: string, opts?: { autoJoin?: boolean }): boolean {
  if (aggressorId === targetId) return false;
  const pair = ensurePair(state, aggressorId, targetId);
  if (pair.warSince != null) return false; // already at war
  // Breaking a pact brands you — unless you denounced it and waited out the cooldown.
  // An ally honouring a defensive pact (autoJoin) is never branded for it.
  const pactBreak = !opts?.autoJoin && hasNap(state, aggressorId, targetId) && !isPactRenounced(state, aggressorId, targetId);
  pair.warSince = state.turn;
  pair.agreements = []; // war voids every agreement on the pair
  pair.tribute = null;
  pair.relation = clampRelation(pair.relation + WAR_DECLARE_RELATION);
  if (pactBreak) brandOathbreaker(state, aggressorId, targetId);
  // Defensive auto-join (§2/§9): the DEFENDER's allies enter the war against the
  // aggressor — never on the aggressor's own aggression, and one level (no cascade).
  if (!opts?.autoJoin) {
    for (const ally of defensivePartnersOf(state, targetId)) {
      if (ally !== aggressorId) enterWar(state, ally, aggressorId, { autoJoin: true });
    }
  }
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

// ---- agreements, tribute, denounce (§2/§4, slice D3) --------------------

export const NAP_TURNS = 30;
export const TRADE_PACT_GOLD = 1;
export const ACCEPT_RELATION = 5;
export const DECLINE_RELATION = -2;
export const DENOUNCE_RELATION = -10;
export const DENOUNCE_COOLDOWN = 5;
export const TRIBUTE_MIN_TURNS = 10;
export const TRIBUTE_MAX_TURNS = 25;

const BAND_ORDER: RelationBand[] = ["hostile", "wary", "neutral", "cordial", "friendly"];
export function bandAtLeast(rel: number, min: RelationBand): boolean {
  return BAND_ORDER.indexOf(relationBand(rel)) >= BAND_ORDER.indexOf(min);
}

export type ProposableAgreement = "trade-pact" | "nap" | "passage" | "defensive-alliance" | "full-alliance";
export const ALLIANCE_HOLD = 15;             // a NAP/def-alliance must stand this long to climb
export const ALLIANCE_TYPES = new Set(["defensive-alliance", "full-alliance"]);

// The relation band each agreement requires (§2 ladder).
export function agreementBand(type: ProposableAgreement): RelationBand {
  switch (type) {
    case "nap": return "cordial";
    case "passage": return "cordial";
    case "defensive-alliance": return "friendly";
    case "full-alliance": return "friendly";
    default: return "neutral"; // trade-pact
  }
}

// How long a standing agreement of `type` has been held (−1 if not held).
export function agreementHeldTurns(state: GameState, a: string, b: string, type: string): number {
  const p = getPair(state, a, b);
  const ag = p?.agreements.find((x) => x.type === type && (x.expires === 0 || x.expires > state.turn));
  return ag ? state.turn - (ag.since ?? state.turn) : -1;
}
// The ladder prereq (§2): Defensive Alliance needs a NAP held 15 turns; Full
// Alliance needs a Defensive Alliance held 15 turns.
export function agreementPrereqMet(state: GameState, a: string, b: string, type: ProposableAgreement): boolean {
  if (type === "defensive-alliance") return agreementHeldTurns(state, a, b, "nap") >= ALLIANCE_HOLD;
  if (type === "full-alliance") return agreementHeldTurns(state, a, b, "defensive-alliance") >= ALLIANCE_HOLD;
  return true;
}

// The civs `playerId` is in a Defensive/Full Alliance with (for auto-join).
export function alliesOf(state: GameState, playerId: string): string[] {
  const out: string[] = [];
  if (!state.diplomacy) return out;
  for (const key of Object.keys(state.diplomacy)) {
    const [a, b] = key.split("|");
    if (a !== playerId && b !== playerId) continue;
    const p = state.diplomacy[key];
    if (p.agreements.some((ag) => ALLIANCE_TYPES.has(ag.type) && (ag.expires === 0 || ag.expires > state.turn))) out.push(a === playerId ? b : a);
  }
  return out;
}
export function isFullAlly(state: GameState, a: string, b: string): boolean {
  return hasAgreement(state, a, b, "full-alliance");
}

// A denounced pact is renounceable once the cooldown elapses — then leaving it
// (or declaring war) no longer brands you (§2).
export function isPactRenounced(state: GameState, a: string, b: string): boolean {
  const p = getPair(state, a, b);
  return !!p && p.denouncedAt != null && state.turn - p.denouncedAt >= DENOUNCE_COOLDOWN;
}
// A NAP still binding (not yet renounced) blocks a formal declaration.
export function napBlocksDeclaration(state: GameState, a: string, b: string): boolean {
  return hasNap(state, a, b) && !isPactRenounced(state, a, b);
}

// Can `from` put this pact proposal in front of `to` right now?
export function canProposeAgreement(state: GameState, from: string, to: string, type: ProposableAgreement): true | string {
  if (from === to) return "You cannot make a pact with yourself";
  if (!state.playersById[to]) return "Unknown civ";
  if (isAtWar(state, from, to)) return "Make peace before proposing a pact";
  if (state.playersById[to].pendingProposal) return "They are still weighing another offer";
  if (hasAgreement(state, from, to, type)) return "That pact already stands";
  if ((type === "defensive-alliance" || type === "full-alliance") && (isVassal(state, from) || isVassal(state, to))) return "A vassal follows its overlord's foreign policy";
  if (!bandAtLeast(getRelation(state, from, to), agreementBand(type))) return `Relations are too cold for that (need ${agreementBand(type)})`;
  if (!agreementPrereqMet(state, from, to, type)) {
    return type === "defensive-alliance" ? "A non-aggression pact must stand 15 turns first" : "A defensive alliance must stand 15 turns first";
  }
  return true;
}

// Add (or refresh) an agreement on the pair, de-duplicated by type; stamps `since`.
export function addAgreement(state: GameState, a: string, b: string, type: DiploAgreement["type"], expires: number): void {
  const p = ensurePair(state, a, b);
  p.agreements = p.agreements.filter((ag) => ag.type !== type);
  p.agreements.push({ type, expires, since: state.turn });
  p.denouncedAt = undefined; // a fresh pact clears any prior denouncement
}

export function denounce(state: GameState, from: string, to: string): void {
  const p = ensurePair(state, from, to);
  p.denouncedAt = state.turn;
  p.relation = clampRelation(p.relation + DENOUNCE_RELATION);
}

// Drop expired agreements and lapsed tribute from every pair (called each turn).
export function expireDiplomacy(state: GameState): void {
  if (!state.diplomacy) return;
  for (const key of Object.keys(state.diplomacy)) {
    const p = state.diplomacy[key];
    p.agreements = p.agreements.filter((ag) => ag.expires === 0 || ag.expires > state.turn);
    if (p.tribute && p.tribute.expires <= state.turn) p.tribute = null;
  }
}

// Rough military weight for AI proposal utility (unit + city count; avoids an
// import cycle with the combat scorer). Personalities come in Phase 2.
export function militaryStrength(state: GameState, playerId: string): number {
  let n = 0;
  for (const u of Object.values(state.map.units)) if (u.ownerId === playerId) n += 1;
  for (const c of Object.values(state.map.cities)) if (c.ownerId === playerId) n += 2;
  return n;
}

// Deterministic AI verdict on an offer put to `me` by `from`. Utility = relation
// band + military ratio (personality weights are Phase 2).
export function aiAcceptsProposal(
  state: GameState, me: string, from: string, kind: ProposableAgreement | "tribute" | "vassalage", amount = 0, vassalId?: string
): boolean {
  if (me === from) return false;
  if (isOathbreaker(state, from)) return false; // nobody signs with an oathbreaker
  const rel = getRelation(state, me, from);
  const mine = militaryStrength(state, me), theirs = militaryStrength(state, from) || 1;
  if (kind === "trade-pact") return !isAtWar(state, me, from) && bandAtLeast(rel, "neutral");
  if (kind === "nap") return !isAtWar(state, me, from) && bandAtLeast(rel, "cordial") && mine <= theirs * 1.8;
  if (kind === "passage") return !isAtWar(state, me, from) && bandAtLeast(rel, "cordial");
  // Alliances: only with a trusted friend (personality weighting is E4).
  if (kind === "defensive-alliance" || kind === "full-alliance") return !isAtWar(state, me, from) && bandAtLeast(rel, "friendly");
  if (kind === "vassalage") {
    // If I'd be the vassal, submit only when clearly outmatched (survival);
    // if I'd be the overlord, a free vassal is always welcome.
    if (vassalId === me) return theirs >= mine * VASSAL_DEMAND_RATIO;
    return true;
  }
  // tribute: `from` offers to pay `me`. Take the gold unless I dominate (then I'd
  // rather keep the war option) — a raider/strong power refuses to be bought off.
  return amount >= 4 && rel >= -40 && mine <= theirs * 1.8;
}

// ---- vassalage (§4, slice E2) -------------------------------------------

export const VASSAL_GOLD_SHARE = 0.25;   // of gold income, paid to the overlord
export const VASSAL_DEMAND_RATIO = 2;    // military edge to DEMAND submission
export const REBEL_MIL_FRACTION = 0.5;   // overlord's strength halves → revolt
export const REBEL_STABILITY = 3;        // a content vassal that hates you revolts

export function isVassal(state: GameState, playerId: string): boolean {
  return !!state.playersById[playerId]?.vassalOf;
}
export function vassalsOf(state: GameState, overlordId: string): string[] {
  return state.players.filter((p) => p.vassalOf === overlordId).map((p) => p.id);
}
// Follow the vassalage chain to the sovereign at the top (who counts for domination).
export function topOverlord(state: GameState, playerId: string): string {
  let cur = playerId, guard = 0;
  while (state.playersById[cur]?.vassalOf && guard++ < 32) cur = state.playersById[cur]!.vassalOf!;
  return cur;
}
// Who joins `playerId`'s DEFENSIVE wars: alliance partners + overlord + vassals.
export function defensivePartnersOf(state: GameState, playerId: string): string[] {
  const set = new Set(alliesOf(state, playerId));
  const of = state.playersById[playerId]?.vassalOf;
  if (of) set.add(of);
  for (const v of vassalsOf(state, playerId)) set.add(v);
  set.delete(playerId);
  return [...set];
}

// May `overlord` DEMAND `vassal` submit? Needs a 2:1 military edge and a free vassal.
export function canDemandVassalage(state: GameState, overlord: string, vassal: string): true | string {
  if (overlord === vassal) return "You cannot vassalise yourself";
  if (!state.playersById[vassal] || !state.playersById[overlord]) return "Unknown civ";
  if (isVassal(state, vassal)) return "They already serve an overlord";
  if (state.playersById[vassal].pendingProposal) return "They are weighing another offer";
  if (militaryStrength(state, overlord) < VASSAL_DEMAND_RATIO * (militaryStrength(state, vassal) || 1)) return "You need a 2:1 military edge to demand submission";
  return true;
}

// Establish overlord→vassal: record it, snapshot the overlord's strength, end any
// war between them, and warm relations (a protectorate is not an enmity).
export function establishVassalage(state: GameState, overlordId: string, vassalId: string): void {
  const vassal = state.playersById[vassalId];
  if (!vassal || overlordId === vassalId) return;
  vassal.vassalOf = overlordId;
  vassal.overlordMilBaseline = militaryStrength(state, overlordId);
  const pair = ensurePair(state, overlordId, vassalId);
  pair.warSince = undefined;
  pair.tribute = null;
  pair.relation = clampRelation(Math.max(pair.relation, 15)); // protectorate → at least cordial
}

// Free a vassal (by the overlord's choice).
export function releaseVassal(state: GameState, overlordId: string, vassalId: string): void {
  const vassal = state.playersById[vassalId];
  if (!vassal || vassal.vassalOf !== overlordId) return;
  vassal.vassalOf = undefined;
  vassal.overlordMilBaseline = undefined;
  adjustRelation(state, overlordId, vassalId, ACCEPT_RELATION); // gratitude
}

// Does this vassal revolt now? Overlord's army has halved since submission, OR the
// vassal is content (stability ≥ +3) while it Hates its overlord (§4).
export function shouldRebel(state: GameState, vassalId: string, cityStability: (cityId: string) => number): boolean {
  const vassal = state.playersById[vassalId];
  if (!vassal?.vassalOf) return false;
  const overlord = vassal.vassalOf;
  if (vassal.overlordMilBaseline != null && militaryStrength(state, overlord) <= vassal.overlordMilBaseline * REBEL_MIL_FRACTION) return true;
  if (relationBand(getRelation(state, vassalId, overlord)) === "hostile") {
    for (const cid of vassal.cityIds) if (cityStability(cid) >= REBEL_STABILITY) return true;
  }
  return false;
}

function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
