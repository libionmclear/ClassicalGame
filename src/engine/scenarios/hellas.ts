import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// The Aegean world. The mountainous Greek mainland and the Peloponnese lie to
// the west (Athens, 1); the Ionian coast of Asia Minor to the east holds the
// Persian foothold (Parthia stands in for Achaemenid Persia, 2); Egypt (3)
// anchors the south beyond Crete. The sea, strewn with islands, is everywhere —
// whoever masters it masters the age.
const MAP = [
  "  ^h^        ^h^",
  " .h.hh      .h^.",
  "  ^.h.      .hh.",
  "  .h1.  .   .^2.",
  "   ^hh.    .hh.h",
  "   .h^.  .  .h..",
  "    ^h.  .  .hh",
  "    .h..    ..h",
  "   .^h.  .   ..",
  "   .hh.      .",
  "    ..    .   ",
  "        .     ",
  "     .      . ",
  "              ",
  "   ...hh.....  ",
  "    ...h...   ",
  "              ",
  "       ...3......",
  "      ..d....d..d",
  "     ..d......d.."
];

export const hellasScenario: CreateGameConfig = fromAscii({
  seed: "hellas-431bc",
  turnLimit: 55,
  rows: MAP,
  regions: ["Hellas", "Aegean", "Ionia"],
  players: [
    { id: "greece", civ: "Greece", food: 8, production: 30, gold: 20, techs: ["sailing"] },
    { id: "parthia", civ: "Persia", food: 8, production: 34, gold: 26, techs: ["sailing"] },
    { id: "egypt", civ: "Egypt", food: 10, production: 28, gold: 24, techs: ["sailing"] }
  ]
});
