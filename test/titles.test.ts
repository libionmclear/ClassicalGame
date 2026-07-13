import test from "node:test";
import assert from "node:assert/strict";

import { TITLE_LADDERS, LAUREL_THRESHOLDS, titleForLaurels, titleIndexForLaurels, nextTitleInfo, laurelsForGame } from "../src/engine/titles";
import { CIV_ROSTER } from "../src/engine/mapgen";

test("every civ in the roster has a title ladder", () => {
  for (const c of CIV_ROSTER) {
    const ladder = TITLE_LADDERS[c.id];
    assert.ok(ladder && ladder.length >= 5, `${c.id} needs a ladder`);
    for (const rung of ladder) { assert.ok(rung.name, "rung has a name"); assert.ok(rung.note.length > 10, "rung has a Codex note"); }
  }
});

test("Rome's cursus honorum climbs from Servus to Princeps by laurels", () => {
  assert.equal(titleForLaurels("rome", 0)!.name, "Servus");
  assert.equal(titleForLaurels("rome", 2)!.name, "Servus", "just under the first threshold");
  assert.equal(titleForLaurels("rome", LAUREL_THRESHOLDS[1])!.name, "Libertus");
  assert.equal(titleForLaurels("rome", 1000)!.name, "Princeps", "the top of the ladder");
});

test("titleIndexForLaurels never runs past the ladder for a short civ", () => {
  const kush = TITLE_LADDERS["kush"];
  assert.equal(titleForLaurels("kush", 100000)!.name, kush[kush.length - 1].name, "tops out at Qore / Kandake");
  assert.ok(titleIndexForLaurels("kush", 100000) < kush.length);
});

test("nextTitleInfo reports the next rung and laurels needed (null at the top)", () => {
  const nx = nextTitleInfo("rome", 0);
  assert.equal(nx!.name, "Libertus");
  assert.equal(nx!.need, LAUREL_THRESHOLDS[1]);
  assert.equal(nextTitleInfo("rome", 1000), null, "no next title once maxed");
});

test("aliases map Greeks/Gauls to their ladders", () => {
  assert.ok(titleForLaurels("greeks", 0));
  assert.equal(titleForLaurels("greeks", 0)!.name, titleForLaurels("greece", 0)!.name);
});

test("a win is worth more laurels than a loss; domination most", () => {
  assert.equal(laurelsForGame(false), 1);
  assert.equal(laurelsForGame(true, "score"), 3);
  assert.equal(laurelsForGame(true, "domination"), 4);
  assert.ok(laurelsForGame(true) > laurelsForGame(false));
});
