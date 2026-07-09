import test from "node:test";
import assert from "node:assert/strict";
import { canResearch, researchCost, createInitialGameState, TECHS } from "../src/engine/index";
import { generateMap } from "../src/engine/mapgen";
import type { Player } from "../src/engine/types";

function mkPlayer(techs: string[]): Player {
  return { id: "rome", civ: "rome", techs: [...techs], forkChoices: {} } as unknown as Player;
}

// §2 — hard AND-prereqs
test("§2 AND-prereq: iron-working needs BOTH bronze-working and masonry", () => {
  const p = mkPlayer(["bronze-working", "sailing", "writing", "pottery", "archery"]); // 5 Age-I, gate ok, no masonry
  assert.equal(canResearch(p, "iron-working"), false, "blocked without masonry");
  p.techs.push("masonry");
  assert.equal(canResearch(p, "iron-working"), true, "allowed with both prereqs");
});

// §3 — era gates
test("§3 era gate: an Age II tech is locked until 5 Age I techs are researched", () => {
  const p = mkPlayer(["bronze-working", "masonry", "sailing", "writing"]); // 4 Age-I, iron-working prereqs met
  assert.equal(canResearch(p, "iron-working"), false, "gated at 4 Age-I techs");
  p.techs.push("pottery"); // 5th Age-I
  assert.equal(canResearch(p, "iron-working"), true, "opens at 5 Age-I techs");
});

// §3b — depth-tiered costs
test("§3b cost = AGE_BASE × TIER_MULT (capstones steeper)", () => {
  assert.equal(researchCost("bronze-working"), 13, "Age I tier 1 = 16×0.8");
  assert.equal(researchCost("iron-working"), 32, "Age II tier 1 = 40×0.8");
  assert.equal(researchCost("phalanx-doctrine"), 16, "Age I tier 2 = 16×1.0");
  assert.equal(researchCost("siegecraft"), 62, "Age III tier 1 = 78×0.8");
  assert.equal(researchCost("testudo"), 125, "capstone = 78×1.6");
});

// §3c — limited frontier across a scripted 30-tech run. The linearised trunk holds
// the researchable *trunk* to a small set (one live head per track, briefly doubling
// at the one Age II→III overlap). A hard ≤7 is not reachable with 5 tracks + the civ
// branch band (see docs); trunk-only ≤10 is the shipped target.
test("§3c trunk frontier stays in 1..10 across a 30-tech run", () => {
  const state = createInitialGameState(generateMap({ size: "medium", seed: "frontier-sim", playerCount: 3, humanCiv: "rome" }));
  const p = state.players.find((pl) => pl.id === "rome") || state.players[0];
  const allTechs = Object.keys(TECHS);
  const trunkSizes: number[] = [];
  for (let step = 0; step < 30; step += 1) {
    const frontier = allTechs.filter((id) => canResearch(p, id));
    trunkSizes.push(frontier.filter((id) => !TECHS[id].civ).length);
    if (!frontier.length) break;
    frontier.sort((a, b) => researchCost(a) - researchCost(b)); // cost-efficiency proxy
    const pick = TECHS[frontier[0]];
    p.techs.push(frontier[0]);
    if (pick.forkGroup && pick.forkBranch) p.forkChoices[pick.forkGroup] = pick.forkBranch;
  }
  const max = Math.max(...trunkSizes), min = Math.min(...trunkSizes);
  console.log(`[frontier trunk] ${trunkSizes.join(",")}  (min ${min}, max ${max}, ${trunkSizes.length} steps)`);
  assert.ok(min >= 1, "frontier never empties before 30 techs");
  assert.ok(max <= 10, `trunk frontier never exceeds 10 (was ${max})`);
});
