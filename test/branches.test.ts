import test from "node:test";
import assert from "node:assert/strict";
import { TECHS, UNITS, BUILDINGS } from "../src/engine/data";
import { UNIQUE_TECHS, BRANCHES } from "../src/engine/branch-data";

// HEGEMON-TECHTREE-v2 §3.10 — validity of the merged civ-unique branches.

test("every unique branch tech is merged and its prerequisites resolve", () => {
  for (const t of UNIQUE_TECHS) {
    assert.ok(TECHS[t.id], `${t.id} merged into TECHS`);
    assert.equal(TECHS[t.id].civ, t.civ, `${t.id} keeps its civ`);
    for (const p of t.prereq) assert.ok(TECHS[p], `${t.id} prereq "${p}" exists`);
  }
});

test("every civ branch has exactly one capstone", () => {
  const caps: Record<string, number> = {};
  for (const t of UNIQUE_TECHS) if (t.capstone) caps[t.civ] = (caps[t.civ] ?? 0) + 1;
  for (const civ of Object.keys(BRANCHES)) assert.equal(caps[civ], 1, `${civ} has exactly one capstone`);
});

test("no tech unlock references a missing unit or building", () => {
  for (const t of UNIQUE_TECHS) {
    const unlocks = ((t.effect as { unlocks?: string[] }).unlocks) ?? [];
    for (const id of unlocks) assert.ok(UNITS[id] || BUILDINGS[id], `${t.id} unlocks "${id}" — must exist as a unit or building`);
  }
});

test("absorbed doctrine/unit ids still exist (old-save compatibility)", () => {
  const absorbed = [
    "legionary-system", "testudo", "war-elephants", "chariotry", "iron-mastery",
    "horse-archery", "hoplite-phalanx", "thalassocracy", "furor", "parthian-shot",
    "nile-bureaucracy", "phalanx-wall"
  ];
  for (const id of absorbed) assert.ok(TECHS[id], `absorbed tech ${id} still present`);
});

test("doctrine reassignment: phalanx-wall → Sparta, Athens gets wooden-walls", () => {
  assert.equal(TECHS["phalanx-wall"].civ, "sparta", "Phalanx Wall moved to Sparta");
  assert.ok(TECHS["wooden-walls"], "Athens' new capstone wooden-walls exists");
  assert.equal(TECHS["wooden-walls"].civ, "greece");
  assert.equal(TECHS["wooden-walls"].capstone, true);
});

test("the wave-1 civ-unique unit unlocks all exist", () => {
  for (const u of ["legionary", "hoplite", "war-elephant", "war-chariot", "gaesatae", "horse-archer", "cataphract"]) {
    assert.ok(UNITS[u], `${u} exists`);
  }
});
