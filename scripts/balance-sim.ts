// Balance harness: play many AI-vs-AI games to conclusion and report the
// metrics that reveal imbalance — game length, how games end, score spread,
// expansion vs army, and whether any seat/civ runs away.
//
// Run: node --import tsx scripts/balance-sim.ts [games] [size]
import { createInitialGameState, getVictoryStatus, computeScores } from "../src/engine/index";
import { runAiTurn } from "../src/engine/ai";
import { generateMap, CIV_ROSTER } from "../src/engine/mapgen";
import type { GameState } from "../src/engine/types";

interface GameResult {
  turns: number;
  winnerCiv: string | null;
  winnerSeat: number | null;
  type: string | null;
  attacks: number;
  scores: number[];
  cities: number[];
  units: number[];
  improvements: number;
  seatCivs: string[];
}

function playGame(seed: string, size: "small" | "medium" | "large", players: number, civOrder?: string[]): GameResult {
  const config = generateMap({ size, seed, playerCount: players, civOrder });
  let state: GameState = createInitialGameState(config);
  const seatIds = state.players.map((p) => p.id);
  let attacks = 0;
  let guard = 0;

  while (guard < 6000) {
    guard += 1;
    const victory = getVictoryStatus(state);
    if (victory.winnerId) break;
    const cur = state.players[state.currentPlayerIndex].id;
    const res = runAiTurn(state, cur, 16);
    state = res.state;
    attacks += res.actions.filter((a) => a.type === "ATTACK" || a.type === "ATTACK_CITY").length;
  }

  const victory = getVictoryStatus(state);
  const scores = computeScores(state);
  const improvements = Object.values(state.map.tiles).filter((t) => t.improvement || t.road).length;
  return {
    turns: state.turn,
    winnerCiv: victory.winnerId,
    winnerSeat: victory.winnerId ? seatIds.indexOf(victory.winnerId) : null,
    type: victory.type,
    attacks,
    scores: seatIds.map((id) => scores[id] ?? 0),
    cities: seatIds.map((id) => state.playersById[id].cityIds.length),
    units: seatIds.map((id) => state.playersById[id].unitIds.length),
    improvements,
    seatCivs: seatIds
  };
}

const games = Number(process.argv[2]) || 24;
const size = (process.argv[3] as "small" | "medium" | "large") || "medium";
const players = Number(process.argv[4]) || 3;

// Deterministic Fisher-Yates so each run is reproducible.
function shuffled(ids: string[], seedNum: number): string[] {
  const a = [...ids];
  let s = (seedNum >>> 0) || 1;
  const rnd = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const civIds = CIV_ROSTER.map((c) => c.id);
const results: GameResult[] = [];
for (let i = 0; i < games; i += 1) {
  // Fully shuffle the seat->civ mapping each game so every civ plays every seat
  // roughly equally — this makes both the per-seat AND per-civ signals clean.
  const civOrder = shuffled(civIds, i + 1).slice(0, players);
  results.push(playGame(`bal-${size}-${i}`, size, players, civOrder));
}

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / (xs.length || 1);
const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const turns = results.map((r) => r.turns);
const attacks = results.map((r) => r.attacks);
const dom = results.filter((r) => r.type === "domination").length;
const score = results.filter((r) => r.type === "score").length;
const none = results.filter((r) => !r.type).length;

// Seat-win distribution (first-mover / position bias).
const seatWins = new Array(players).fill(0);
for (const r of results) if (r.winnerSeat != null) seatWins[r.winnerSeat] += 1;

// Winner's score margin over the runner-up (blowout check).
const margins = results.map((r) => {
  const s = [...r.scores].sort((a, b) => b - a);
  return s[0] - (s[1] ?? 0);
});

// Expansion vs army, across all seats.
const allCities = results.flatMap((r) => r.cities);
const allUnits = results.flatMap((r) => r.units);

console.log(`\n=== ${games} games · ${size} · ${players} civs ===`);
console.log(`turns:      avg ${avg(turns).toFixed(0)}  median ${med(turns)}  min ${Math.min(...turns)}  max ${Math.max(...turns)}`);
console.log(`endings:    domination ${dom}  score ${score}  unresolved ${none}`);
console.log(`attacks/gm: avg ${avg(attacks).toFixed(1)}  median ${med(attacks)}  (0-attack games: ${attacks.filter((a) => a === 0).length})`);
console.log(`seat wins:  ${seatWins.join(" / ")}  (of ${games})`);
console.log(`win margin: avg ${avg(margins).toFixed(0)}  median ${med(margins)}  (score-victory blowouts)`);
console.log(`cities/civ: avg ${avg(allCities).toFixed(1)}  max ${Math.max(...allCities)}`);
console.log(`units/civ:  avg ${avg(allUnits).toFixed(1)}  max ${Math.max(...allUnits)}`);
console.log(`worked tiles/game (improvements+roads): avg ${avg(results.map((r) => r.improvements)).toFixed(1)}`);

// Per-seat systematic advantage: average final score / cities by seat. With civs
// rotated across seats, this isolates the turn-order / position effect.
const seatScore = new Array(players).fill(0).map((_, s) => avg(results.map((r) => r.scores[s])));
const seatCities = new Array(players).fill(0).map((_, s) => avg(results.map((r) => r.cities[s])));
console.log(`seat avg score:  ${seatScore.map((x) => x.toFixed(0)).join(" / ")}  (civ-neutral: turn-order effect)`);
console.log(`seat avg cities: ${seatCities.map((x) => x.toFixed(1)).join(" / ")}`);

// Per-CIV signal: average score / cities / wins per civ, across whatever seat it
// drew. Isolates civ strength from seat.
const civScore: Record<string, number[]> = {};
const civCities: Record<string, number[]> = {};
const civWins: Record<string, number> = {};
for (const r of results) {
  r.seatCivs.forEach((civ, s) => {
    (civScore[civ] ??= []).push(r.scores[s]);
    (civCities[civ] ??= []).push(r.cities[s]);
  });
  if (r.winnerCiv) civWins[r.winnerCiv] = (civWins[r.winnerCiv] ?? 0) + 1;
}
console.log(`\nper-civ (across all seats):`);
for (const c of CIV_ROSTER) {
  if (!civScore[c.id]) continue;
  console.log(
    `  ${c.civ.padEnd(9)} games ${civScore[c.id].length}  wins ${civWins[c.id] ?? 0}` +
    `  avg score ${avg(civScore[c.id]).toFixed(0)}  avg cities ${avg(civCities[c.id]).toFixed(1)}`
  );
}
