import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// The Italian peninsula — the boot — with the Alps at the north, the Apennine
// spine down its length, Sicily at the toe, Corsica/Sardinia to the west, and
// the North African coast where Carthage sits. Rome (1) holds Latium; Carthage
// (2) sits across the sea, so the contest is amphibious from the first turn.
const MAP = [
  "     ^^^^^^^^",
  "   .hh..hh..^",
  "    .h..h.hh",
  "     .h1.h",
  "     .h..h",
  "  f  .^.hh",
  "  ff .^h.h",
  "  f  .^^h.",
  "     .^^h.",
  "     .^hh.",
  "     .^h.h",
  "     ..^h.",
  "     ..hh.",
  "    ..hh.",
  "   ..h.",
  "  ..h.",
  "  :.",
  " ..h.",
  " ...h",
  "  ..",
  "",
  "...2......d....d..",
  "....d.......d...."
];

export const italiaScenario: CreateGameConfig = fromAscii({
  seed: "italia-264bc",
  turnLimit: 50,
  rows: MAP,
  regions: ["Tyrrhenian", "Italia", "Adriatic"],
  players: [
    { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: ["sailing"] },
    { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20, techs: ["sailing"] }
  ]
});
