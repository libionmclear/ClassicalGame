// Generates src/engine/branch-data.ts (typed) from the design-of-record
// src/techs-v2.js, so the pure-TS engine can import the branch tree without
// depending on a loose .js module. Re-run this whenever techs-v2.js changes:
//   node scripts/gen-branch-data.mjs
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = await import(pathToFileURL(path.join(root, "src", "techs-v2.js")).href);

const j = (v) => JSON.stringify(v, null, 2);
const out = `// AUTO-GENERATED from src/techs-v2.js by scripts/gen-branch-data.mjs — DO NOT EDIT BY HAND.
// The declarative civ-unique tech branches (design of record: docs/HEGEMON-TECHTREE-v2.md).
export interface BranchInfo { name: string; color: string; }
export interface BranchTech {
  id: string; civ: string; age: 1 | 2 | 3; prereq: string[]; name: string;
  effect: Record<string, unknown>; note: string; capstone?: boolean;
}
export interface NewUnitSketch { id: string; civ: string; cat: string; basedOn: string; tweak: string; }
export interface NewBuildingSketch { id: string; civ: string; cost: string; yields: Record<string, number>; }

export const BRANCHES: Record<string, BranchInfo> = ${j(src.BRANCHES)};

export const UNIQUE_TECHS: BranchTech[] = ${j(src.UNIQUE_TECHS)};

export const NEW_UNITS: NewUnitSketch[] = ${j(src.NEW_UNITS)};

export const NEW_BUILDINGS: NewBuildingSketch[] = ${j(src.NEW_BUILDINGS)};
`;
await writeFile(path.join(root, "src", "engine", "branch-data.ts"), out);
console.log(`Generated src/engine/branch-data.ts — ${src.UNIQUE_TECHS.length} techs, ${src.NEW_UNITS.length} units, ${Object.keys(src.BRANCHES).length} branches.`);
