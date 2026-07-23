import type { CreateGameConfig } from "./types";
import { sprinkleResources } from "./mapgen";
import { italiaScenario } from "./scenarios/italia";
import { hellasScenario } from "./scenarios/hellas";
import { oldWorldScenario } from "./scenarios/oldworld";
import { oikoumeneScenario } from "./scenarios/oikoumene";
import { oldWorldEpic } from "./scenarios/oldworld-epic";

export type ScenarioId = "italia" | "hellas" | "oldworld" | "oikoumene" | "oldworld-epic";

export interface ScenarioBriefing {
  /** Short dateline, e.g. "264 BC — The eve of the First Punic War". */
  era: string;
  /** Two or three sentences setting the historical stage. */
  situation: string;
  /** What the player is trying to achieve, in plain terms. */
  objectives: string[];
  /** A sourced "did you know" nugget — the educational hook. */
  didYouKnow: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  name: string;
  historicalBrief: string;
  briefing: ScenarioBriefing;
  config: CreateGameConfig;
}

const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  italia: {
    id: "italia",
    name: "Italia: Rome vs Carthage",
    historicalBrief:
      "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
    briefing: {
      era: "264 BC — the eve of the First Punic War",
      situation:
        "Rome has mastered the Italian peninsula through her legions and her web of Latin alliances. Across the sea, Carthage — heir to Phoenician Tyre — commands the richest trade network in the western Mediterranean and a navy without equal. Sicily lies between them like a stepping-stone, and neither power can let the other hold it.",
      objectives: [
        "Grow your cities and out-expand your rival up and down the boot",
        "Build harbours and a fleet — this is a war fought across water",
        "Win by holding every capital (Domination), or by leading on score when the age ends (Quick)"
      ],
      didYouKnow:
        "The Romans called this war 'Punic' from Poeni, their word for the Phoenician settlers who founded Carthage around 814 BC. Rome had almost no fleet in 264 BC — she reputedly reverse-engineered her first warships from a shipwrecked Carthaginian vessel."
    },
    config: italiaScenario
  },
  hellas: {
    id: "hellas",
    name: "Hellas: Greeks and Persians",
    historicalBrief:
      "Fifth century BC: the Greek city-states and the Persian empire contend for the Aegean, while Egypt watches from the south.",
    briefing: {
      era: "431 BC — the Aegean in the age of Pericles",
      situation:
        "The mountainous Greek homeland and the Peloponnese look east across an island-strewn sea to the Ionian coast, where the Great King's satraps hold the cities of Asia. Egypt, ancient and grain-rich, guards the southern shore beyond Crete. Triremes, not walls, will decide who commands the Aegean.",
      objectives: [
        "Command the sea lanes with harbours and triremes",
        "Seize the islands and coasts that link the three shores",
        "Prevail by domination or by leading on score at the age's end"
      ],
      didYouKnow:
        "At Salamis in 480 BC an outnumbered Greek fleet destroyed the Persian navy in the narrows — perhaps 300 triremes against 600 or more. A single trireme carried around 170 rowers, and Athens' power rested on her ability to man scores of them."
    },
    config: hellasScenario
  },
  oldworld: {
    id: "oldworld",
    name: "The Old World",
    historicalBrief:
      "The whole classical Mediterranean and Near East: six great powers from Gaul to Persia contend for the age.",
    briefing: {
      era: "The Classical Age — from the Pillars of Hercules to the Iranian plateau",
      situation:
        "The full sweep of the ancient world lies open: Gaul and Iberia in the west, Rome astride her boot, Carthage on the African shore, the Greek Aegean, the Nile of Egypt, and the empire of Parthia beyond the Euphrates. Six powers, one sea to bind them, and an entire age in which to build a hegemony — or be swallowed by one.",
      objectives: [
        "Expand from your homeland across the Mare Nostrum",
        "Master land and sea — legions, cavalry, siege and fleets",
        "Outlast five rivals: hold every capital, or lead on score when the age closes"
      ],
      didYouKnow:
        "At its height under Trajan (AD 117) the Roman Empire ran some 5 million square kilometres and perhaps 60–70 million people — around a fifth of humanity. No western state would match its span again for a thousand years."
    },
    config: oldWorldScenario
  },
  oikoumene: {
    id: "oikoumene",
    name: "The Known World (huge)",
    historicalBrief:
      "The whole classical oikoumene at grand scale — from Iberia and Britain to the Indus, the world as the ancients mapped it.",
    briefing: {
      era: "The Known World — the oikoumene, Pillars of Hercules to the Indus",
      situation:
        "This is the world as Herodotus, Eratosthenes and Ptolemy knew it: the Mediterranean at its heart, Europe to the north, Africa and the great desert to the south, and the roads of Asia running east past the Euphrates to Persia and the edge of India. Six powers begin in their true homelands — Rome in Italy, Carthage on the African shore, Greece on the Aegean, Egypt on the Nile, the Gauls in the west, and Parthia in Mesopotamia. The stage is vast; an age will pass before it is decided.",
      objectives: [
        "Build an empire across a continent-spanning map — expect a long campaign",
        "Command land and sea across the whole Mediterranean world",
        "Win by holding every capital, or by leading on score when the age closes"
      ],
      didYouKnow:
        "Around 240 BC Eratosthenes, chief librarian at Alexandria, measured the Earth's circumference from the angle of shadows at Syene and Alexandria — landing within a few percent of the true 40,000 km, using nothing but geometry and a well."
    },
    config: oikoumeneScenario
  },
  "oldworld-epic": {
    id: "oldworld-epic",
    name: "The Old World (epic)",
    historicalBrief:
      "The hand-authored classical world, ~96×64: the Mediterranean at its heart, Italy's boot, Britain, the Nile and four other great rivers, eight powers in their true homelands.",
    briefing: {
      era: "The Classical Age — the whole Old World, Pillars of Hercules to the Iranian plateau",
      situation:
        "This is the world drawn as it was: the Mare Nostrum narrowing at Sicily, Italy's boot reaching for Africa, Britain beyond the Channel, the Alps sealing the north, and the Nile threading the desert from the cataracts of Kush to its delta. Eight peoples begin at home — Rome, Carthage, Athens, Egypt, Kush, Gaul, the Britons and Parthia — and the great rivers are highways and walls both.",
      objectives: [
        "Rise from your homeland to a hegemony over the whole Old World",
        "Hold the straits and the great rivers — they decide who moves and who is walled out",
        "Win by holding every capital, or by leading on score when the age closes"
      ],
      didYouKnow:
        "The Nile flows NORTH: fed by the Ethiopian highlands and the great lakes, it runs 6,600 km downhill to the Mediterranean, so 'Upper Egypt' is in the south and 'Lower Egypt' — the delta — is in the north."
    },
    config: oldWorldEpic()
  }
};

export function listScenarios(): ScenarioDefinition[] {
  return Object.values(SCENARIOS);
}

export function loadScenario(id: ScenarioId): ScenarioDefinition {
  const scenario = SCENARIOS[id];
  if (!scenario) {
    throw new Error(`Unknown scenario ${id}`);
  }
  const clone = JSON.parse(JSON.stringify(scenario)) as ScenarioDefinition;
  if (clone.config.map?.tiles) sprinkleResources(clone.config.map.tiles, "scenario:" + id);
  return clone;
}
