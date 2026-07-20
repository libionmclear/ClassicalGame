// HEGEMON — historical figures (docs/HEGEMON-RAIDERS-v1.md, "The Minds of the Age").
//
// Unlike a random Crossroads dilemma, a figure arrives BECAUSE OF HOW YOU PLAY — a
// coastal power under naval threat draws Archimedes; a captain who braved the open
// sea draws Pytheas; a founder of many cities draws Solon. Each offers a branching,
// historically-grounded boon, and interlocks with the other frontiers (Archimedes'
// burning mirrors answer the off-grid corsairs; Pytheas extends how far you dare
// sail toward their haven). Pure data + predicates so the engine stays deterministic.

import type { Player } from "./types";

/** The boon vocabulary — a superset of the Crossroads and ruin effects plus a few
 *  figure-specific powers. Applied deterministically by applyFigureEffects. */
export interface FigureEffects {
  gold?: number;               // to the player's treasury
  science?: number;            // to the research pool
  production?: number;         // banked at the capital
  food?: number;               // banked at every city
  spawnUnit?: string;          // a unit type mustered at the capital
  xp?: boolean;                // every unit gains a veterancy step (drilled army)
  heal?: boolean;              // every unit fully recovers
  reveal?: boolean;            // reveal the lands around the capital
  techUnlock?: string;         // grant a tech outright
  cancelRaids?: boolean;       // the Burning Mirrors — destroy raids bearing down on you
  seaReach?: number;           // sail this many rings farther before you are lost at sea
  /** A lasting per-turn / combat bonus merged into player.perks. */
  perks?: NonNullable<Player["perks"]>;
}

export interface FigureOption {
  label: string;
  outcome: string;
  effects: FigureEffects;
}

/** What the engine has already worked out about the player's situation — the
 *  predicate reads only this, so figures.ts needs no engine internals. */
export interface FigureCtx {
  coastal: boolean;      // holds at least one coastal city
  navalThreat: boolean;  // a raid is bearing down on one of the player's cities
  atSea: boolean;        // has a unit out in the open-sea belt
  atWar: boolean;        // at war with someone
  cityCount: number;
  age: number;           // 1..3
  foundRuins: boolean;   // has excavated at least one ruin (Codex not empty)
}

export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  note: string;                       // one line of history for the card
  when: (ctx: FigureCtx) => boolean;  // the condition that summons them
  options: FigureOption[];
}

export const FIGURES: HistoricalFigure[] = [
  {
    id: "archimedes",
    name: "Archimedes of Syracuse",
    title: "Geometer & War-Engineer",
    note: "At Syracuse his cranes and catapults held Rome's fleet at bay for two years (214–212 BC).",
    when: (c) => c.coastal && (c.navalThreat || c.age >= 2),
    options: [
      {
        label: "🔥 The Burning Mirrors",
        outcome: "Polished bronze focuses the sun on the raiders' sails — the fleet burns on the water, and your coast is warded.",
        effects: { cancelRaids: true, perks: { defPct: 8 } }
      },
      {
        label: "⚙️ The War Engines (the Claw)",
        outcome: "Cranes, catapults and the ship-lifting Claw rise on your walls — your armies strike harder and your works surge.",
        effects: { production: 22, perks: { atkPct: 6 } }
      },
      {
        label: "🌊 On Floating Bodies",
        outcome: "The law of buoyancy reshapes your hulls — swifter ships, and a leap of mathematical insight.",
        effects: { science: 38, perks: { navalMovePlus: 1 } }
      }
    ]
  },
  {
    id: "pytheas",
    name: "Pytheas of Massalia",
    title: "Navigator of the Ocean",
    note: "Around 325 BC he sailed past the Pillars of Heracles to Britain and the frozen north, and lived to write of it.",
    when: (c) => c.atSea,
    options: [
      {
        label: "🧭 Chart the Northern Ocean",
        outcome: "His star-tables and sea-lore let your captains venture far beyond sight of land before the deep can claim them.",
        effects: { seaReach: 2, science: 24 }
      },
      {
        label: "⚓ Open the Tin Route",
        outcome: "The long sea-road to the tin isles enriches your merchants for good.",
        effects: { gold: 55, perks: { gold: 2 } }
      }
    ]
  },
  {
    id: "hippocrates",
    name: "Hippocrates of Kos",
    title: "Father of Medicine",
    note: "He taught that disease comes from nature, not the gods — and swore physicians to do no harm.",
    when: (c) => c.age >= 2 && c.cityCount >= 1,
    options: [
      {
        label: "🩺 Found a School of Medicine",
        outcome: "Field surgeons follow your armies — the wounded return to the ranks far sooner.",
        effects: { science: 18, heal: true, perks: { healPlus: 2 } }
      },
      {
        label: "🚰 Public Sanitation",
        outcome: "Clean water and drained marshes — your cities grow healthier and fuller.",
        effects: { food: 6, perks: { food: 1 } }
      }
    ]
  },
  {
    id: "herodotus",
    name: "Herodotus of Halicarnassus",
    title: "The Father of History",
    note: "He wandered the known world gathering the tales of Greeks and Persians so they 'not be forgotten by time.'",
    when: (c) => c.foundRuins,
    options: [
      {
        label: "📜 Endow the Histories",
        outcome: "Your scholars set down all that has been learned — a lasting fount of knowledge.",
        effects: { science: 48 }
      },
      {
        label: "🗺️ Map the Known World",
        outcome: "His inquiries chart the lands about your heartland, and open new avenues of trade.",
        effects: { reveal: true, gold: 24 }
      }
    ]
  },
  {
    id: "solon",
    name: "Solon of Athens",
    title: "The Lawgiver",
    note: "In 594 BC he cancelled crushing debts and gave Athens the laws that seeded her democracy.",
    when: (c) => c.cityCount >= 3,
    options: [
      {
        label: "⚖️ Enact the Reforms",
        outcome: "A just constitution steadies your cities and quickens their commerce for good.",
        effects: { perks: { stability: 1, gold: 2 } }
      },
      {
        label: "🕊️ Cancel the Debts (Seisachtheia)",
        outcome: "The debt-slaves are freed and the people, unburdened, throw themselves into the work.",
        effects: { food: 5, production: 14 }
      }
    ]
  },
  {
    id: "xenophon",
    name: "Xenophon of Athens",
    title: "Soldier & Strategist",
    note: "He led the Ten Thousand — a stranded Greek army — on a fighting march home across hostile Persia (401 BC).",
    when: (c) => c.atWar,
    options: [
      {
        label: "🎖️ Drill the Army",
        outcome: "Hard-won discipline hardens every company — your whole army gains in veterancy.",
        effects: { xp: true }
      },
      {
        label: "🥾 The Long March (Logistics)",
        outcome: "Baggage trains and forced-march drill put your soldiers where they are needed.",
        effects: { gold: 20, perks: { movePlus: 1 } }
      }
    ]
  }
];

export function getFigure(id: string): HistoricalFigure | undefined {
  return FIGURES.find((f) => f.id === id);
}
