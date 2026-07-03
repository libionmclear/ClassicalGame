import type { CreateGameConfig } from "../types";
import { fromAscii } from "./atlas";

// The whole classical world at a glance: Iberia and Gaul (5) in the west, the
// Italian boot (Rome, 1) reaching into a central sea, the North African coast
// (Carthage, 2) below it, the Aegean and Balkans (Greece, 3), Anatolia and the
// Levant, the Nile (Egypt, 4) in the south-east, and Mesopotamia and the Iranian
// plateau (Parthia, 6) in the far east. The Mare Nostrum ties it all together.
const MAP = [
  "    ..h.      ^^^^^^^         ^^^^^",
  "   .hhh.   ff.....^^^^      .hh.h^^^",
  "  .h.5h.  ff...h.....^^   .h...hh^^^",
  "  .h...ffff..hh....^^^^  .h..h..hh^^",
  " .h..h..ff..h....^..1.h..h...hh.h^^^",
  " ^h.h...f..hh...^^h..hh.h.3...h.hh.^^",
  "  ^h..    ..hh..h...h..h..h.hhh.h.^^^",
  "   ..      ..h. .h....h.h..h.h..hh.6h",
  "            ..   ..    .h..h..hh.hh.hh",
  "                        ..h..h.h..h.hh",
  "         .        .      .h.h.h.h..hh.",
  "       .:        .:       .h..h..hh.h",
  "      ..:.     ..:.      :..h.d.dd.dd",
  "     ..:..    ..:..     :..dd.ddd.dd",
  "    ...:..   ..:.. ...:.4..dddddd.dd",
  "  ...2....d.....dd...d..ddddddd.dddd",
  " ...d...d...dd..dd..dddd.dddddd.dddd",
  "  .d...dd..dd..dd..ddd.ddddd.dddd.d",
  "   d...dd..dd..dd..dd.dddd.dddd.dd",
  "    ...dd..dd..dd..dd.ddd.ddd.dd",
  "     .dd...dd..dd..dd.dd.ddd.d",
  "      d....dd..dd..dd.dd.dd.d"
];

export const oldWorldScenario: CreateGameConfig = fromAscii({
  seed: "old-world",
  turnLimit: 90,
  rows: MAP,
  regions: ["Hispania", "Italia", "Graecia", "Asia"],
  players: [
    { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
    { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
    { id: "greece", civ: "Greece", food: 8, production: 30, gold: 22, techs: ["sailing"] },
    { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
    { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
    { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
  ]
});
