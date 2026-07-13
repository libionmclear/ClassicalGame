import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { buildDistrict } from "../src/render3d/districtModels.js";

// Geometry-only smoke: buildDistrict allocates THREE meshes (no WebGL needed),
// so we can assert every district type/style/Great-Work/pillaged combo builds a
// non-empty group without throwing. Guards the procedural model code (§5).

const TYPES = ["civic", "market", "affluent", "crammed", "aqueduct", "barracks", "harbour", "leisure", "temple", "greatwork"];
const STYLES = ["rome", "carthage", "greece", "egypt", "gaul", "parthia", "sparta", "macedon", "persia", "han", "maurya", "scythia"];

function meshCount(obj: unknown): number {
  let n = 0;
  (obj as THREE.Object3D).traverse((o) => { if ((o as THREE.Mesh).isMesh) n += 1; });
  return n;
}

test("every district type builds a non-empty group in every civ style", () => {
  for (const type of TYPES) for (const style of STYLES) {
    const g = buildDistrict(THREE, { type, style, seed: 42, accent: "#c0392b", work: "gw-parthenon" }) as THREE.Group;
    assert.ok(g && g.isGroup, `${type}/${style} should be a Group`);
    assert.ok(meshCount(g) >= 2, `${type}/${style} should have meshes, got ${meshCount(g)}`);
  }
});

test("pillaged districts add smoke on top of the built structure", () => {
  const clean = buildDistrict(THREE, { type: "market", style: "rome", seed: 7 });
  const burnt = buildDistrict(THREE, { type: "market", style: "rome", seed: 7, pillaged: true });
  assert.ok(meshCount(burnt) > meshCount(clean), "pillaged adds smoke puffs");
});

test("great works select a bespoke model by work id (known + unknown)", () => {
  for (const work of ["gw-colosseum", "gw-pyramids", "gw-stonehenge", "gw-great-wall", "gw-parthenon", "gw-pharos", "gw-stupa", "gw-unknown-xyz"]) {
    const g = buildDistrict(THREE, { type: "greatwork", style: "rome", seed: 3, work });
    assert.ok(meshCount(g) >= 2, `${work} should render meshes`);
  }
});

test("an unknown style falls back to rome instead of throwing", () => {
  const g = buildDistrict(THREE, { type: "civic", style: "atlantis", seed: 1 });
  assert.ok(meshCount(g) >= 2);
});

test("harbour is coast-appropriate and still builds without filler crowding", () => {
  const g = buildDistrict(THREE, { type: "harbour", style: "carthage", seed: 9 });
  assert.ok(meshCount(g) >= 5, "harbour has a breakwater + shipsheds");
});
