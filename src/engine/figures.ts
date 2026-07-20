// HEGEMON — historical figures (docs/HEGEMON-RAIDERS-v1.md, "The Minds of the Age").
//
// Unlike a random Crossroads dilemma, a figure arrives BECAUSE OF HOW YOU PLAY — a
// coastal power under naval threat draws Archimedes; a captain who braved the open
// sea draws Pytheas; a warlike Parthia draws Surena. Each offers a branching,
// historically-grounded boon, and interlocks with the other frontiers (Archimedes'
// burning mirrors answer the off-grid corsairs; Pytheas and Hanno extend how far you
// dare sail toward their haven). The roster is far larger than any single game will
// surface — you meet a handful, so no two campaigns feel the same. Some figures are
// unique to one people. Pure data + predicates so the engine stays deterministic.

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
  /** A lasting per-turn / combat / cost bonus merged into player.perks. Note the sign
   *  convention: buildFasterPct is POSITIVE-is-faster, while unit/upkeep/researchCostPct
   *  are NEGATIVE-is-cheaper. */
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
  gold: number;          // treasury
  unitCount: number;     // living units
  population: number;    // total population across cities
}

export interface HistoricalFigure {
  id: string;
  name: string;
  title: string;
  note: string;                       // one line of history for the card
  /** If set, only this people ever receives the visit (civ id, e.g. "rome"). */
  civ?: string;
  when: (ctx: FigureCtx) => boolean;  // the condition that summons them
  options: FigureOption[];
}

export const FIGURES: HistoricalFigure[] = [
  // ---- Universal: the minds of the classical world, open to any people ----------
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
    when: (c) => c.age >= 2,
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
  },
  {
    id: "thales",
    name: "Thales of Miletus",
    title: "The First Philosopher",
    note: "He sought nature's causes without the gods and, they say, foretold the eclipse of 585 BC.",
    when: (c) => c.age <= 1,
    options: [
      {
        label: "🌓 Reason over Myth",
        outcome: "Inquiry replaces omen — your thinkers learn to ask how, not merely to whom to pray.",
        effects: { science: 22, perks: { researchCostPct: -8 } }
      },
      {
        label: "📐 Measure by the Shadow",
        outcome: "With gnomon and geometry your surveyors chart the land and gauge the pyramids' height.",
        effects: { science: 14, reveal: true }
      }
    ]
  },
  {
    id: "pythagoras",
    name: "Pythagoras of Samos",
    title: "Mathematician & Mystic",
    note: "His brotherhood held that number is the substance of all things — and kept the theorem that bears his name.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "🔢 The Harmony of Numbers",
        outcome: "Ratio and proportion order music, architecture and the heavens alike — a lasting spring of learning.",
        effects: { science: 20, perks: { science: 1 } }
      },
      {
        label: "🔺 The Brotherhood",
        outcome: "A disciplined order of initiates lends your cities a serene, ordered civic life.",
        effects: { science: 16, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "democritus",
    name: "Democritus of Abdera",
    title: "The Laughing Philosopher",
    note: "He held the world to be atoms and void — and that cheerfulness, not wealth, is the good life.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "⚛️ The Theory of Atoms",
        outcome: "A daring guess two thousand years ahead of its proof electrifies your natural philosophers.",
        effects: { science: 44 }
      },
      {
        label: "😄 Cheerfulness (Euthymia)",
        outcome: "A doctrine of contentment settles the people; the fields and homes prosper.",
        effects: { food: 5, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "eratosthenes",
    name: "Eratosthenes of Cyrene",
    title: "Chief Librarian of Alexandria",
    note: "From two shadows and a walked distance he measured the round Earth's circumference — and very nearly got it right.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "🌍 Measure the Earth",
        outcome: "His geography and gnomons chart the world about you.",
        effects: { reveal: true, science: 26 }
      },
      {
        label: "📚 The Great Library",
        outcome: "Scrolls from every shore are copied and shelved — knowledge compounds for good.",
        effects: { science: 20, perks: { science: 2 } }
      }
    ]
  },
  {
    id: "euclid",
    name: "Euclid of Alexandria",
    title: "Father of Geometry",
    note: "His Elements taught proof from first principles for two thousand years; there is 'no royal road' to it.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "📖 The Elements",
        outcome: "A rigorous method of proof streamlines every study your scholars undertake.",
        effects: { science: 20, perks: { researchCostPct: -10 } }
      },
      {
        label: "📏 Tutor the Court",
        outcome: "Your finest minds are schooled in demonstration and measure.",
        effects: { science: 32 }
      }
    ]
  },
  {
    id: "thucydides",
    name: "Thucydides of Athens",
    title: "The Historian of War",
    note: "Exiled general turned chronicler, he set down the war between Athens and Sparta as a 'possession for all time.'",
    when: (c) => c.atWar,
    options: [
      {
        label: "✒️ Set Down the True Causes",
        outcome: "A cold, exact record of the war teaches your court statecraft — and pays in captured intelligence.",
        effects: { science: 24, gold: 18 }
      },
      {
        label: "🔍 Know Thy Enemy",
        outcome: "Hard study of the foe's strength and fear sharpens your armies on attack and defence alike.",
        effects: { perks: { atkPct: 5, defPct: 5 } }
      }
    ]
  },
  {
    id: "phidias",
    name: "Phidias of Athens",
    title: "Master Sculptor",
    note: "He wrought the gold-and-ivory Athena of the Parthenon and the Zeus at Olympia, a wonder of the world.",
    when: (c) => c.cityCount >= 2 && !c.atWar,
    options: [
      {
        label: "🗿 Raise the Great Statue",
        outcome: "A colossus of gold and ivory draws pilgrims and their coin to your city for good.",
        effects: { production: 22, perks: { gold: 2 } }
      },
      {
        label: "🏛️ Adorn the Temple",
        outcome: "Beauty in stone lifts the people's spirit and the renown of your learning.",
        effects: { science: 18, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "demosthenes",
    name: "Demosthenes of Athens",
    title: "The Great Orator",
    note: "He mastered a stammer by declaiming over the surf and roused Athens against Philip with the Philippics.",
    when: (c) => c.atWar || c.navalThreat,
    options: [
      {
        label: "🗣️ The Philippics",
        outcome: "His speeches rouse the assembly to arm and to labour against the coming danger.",
        effects: { production: 16, perks: { stability: 1 } }
      },
      {
        label: "🛡️ Man the Walls",
        outcome: "The citizens are shamed into vigilance; your defences stiffen and your works quicken.",
        effects: { production: 12, perks: { defPct: 6 } }
      }
    ]
  },
  {
    id: "croesus",
    name: "Croesus of Lydia",
    title: "The Golden King",
    note: "Proverbially rich, his Lydians struck the first true coins — and he learned to 'call no man happy until he is dead.'",
    when: (c) => c.gold >= 120,
    options: [
      {
        label: "🪙 The First Coinage",
        outcome: "Standard-weight coin oils every market in your realm — trade swells now and forever after.",
        effects: { gold: 40, perks: { gold: 2 } }
      },
      {
        label: "🔥 Offerings to Delphi",
        outcome: "Lavish gifts to the oracle win prestige and priestly goodwill across your cities.",
        effects: { science: 20, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "sostratus",
    name: "Sostratus of Cnidus",
    title: "Architect of the Pharos",
    note: "He raised the Lighthouse of Alexandria, 100 metres of stone whose mirror-flame guided ships for a thousand years.",
    when: (c) => c.coastal,
    options: [
      {
        label: "🗼 Raise the Great Lighthouse",
        outcome: "A beacon over the harbour speeds every hull home and marks your coast a haven of trade.",
        effects: { perks: { navalMovePlus: 1, gold: 2 } }
      },
      {
        label: "🌾 Guide the Grain Fleet",
        outcome: "Safe passage for the grain ships feeds your cities and fattens the customs house.",
        effects: { food: 5, gold: 22 }
      }
    ]
  },
  {
    id: "leonidas",
    name: "Leonidas of Sparta",
    title: "King of the Three Hundred",
    note: "At Thermopylae in 480 BC he and his Spartans held the pass to the last against the Persian host.",
    when: (c) => c.atWar,
    options: [
      {
        label: "🛡️ The Last Stand",
        outcome: "Drilled to hold ground at any cost, your soldiers dig in and steel themselves; the wounded rally.",
        effects: { heal: true, perks: { defPct: 10 } }
      },
      {
        label: "⚔️ Molon Labe (Come and Take Them)",
        outcome: "Defiance runs through the ranks — your warriors fight with grim resolve, and the cities stand firm.",
        effects: { perks: { atkPct: 6, stability: 1 } }
      }
    ]
  },
  {
    id: "ctesibius",
    name: "Ctesibius of Alexandria",
    title: "Father of Pneumatics",
    note: "A barber's son who invented the force-pump, the water organ and the repeating catapult.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "💥 The Bronze-Spring Catapult",
        outcome: "New engines of war roll out of your workshops — and your armies hit harder.",
        effects: { production: 18, perks: { atkPct: 5 } }
      },
      {
        label: "⏳ The Water Clock",
        outcome: "Precision machines and pumps speed every public work you raise.",
        effects: { science: 16, perks: { buildFasterPct: 8 } }
      }
    ]
  },
  // ---- Unique to one people ------------------------------------------------------
  {
    id: "themistocles",
    name: "Themistocles of Athens",
    title: "Architect of the Wooden Walls",
    civ: "greece",
    note: "He read the oracle's 'wooden walls' as ships, built Athens a fleet from the Laurium silver, and broke Persia at Salamis (480 BC).",
    when: (c) => c.coastal || c.navalThreat || c.atSea,
    options: [
      {
        label: "🛶 The Wooden Walls",
        outcome: "Athens' future is staked on her fleet — swifter ships and a coast that holds against any landing.",
        effects: { perks: { navalMovePlus: 1, defPct: 5 } }
      },
      {
        label: "⛏️ The Silver of Laurium",
        outcome: "The state silver mines are poured into the navy and the treasury, enriching you now and for good.",
        effects: { gold: 40, perks: { gold: 1 } }
      }
    ]
  },
  {
    id: "cincinnatus",
    name: "Cincinnatus",
    title: "The Dictator of the Plough",
    civ: "rome",
    note: "Twice Rome made him dictator in her hour of need; twice he saved her and laid down absolute power to return to his farm.",
    when: (c) => c.atWar,
    options: [
      {
        label: "🏛️ Take Up the Fasces",
        outcome: "Granted emergency command, he rallies the legions — they mend their wounds and march to war with fury.",
        effects: { heal: true, perks: { atkPct: 6 } }
      },
      {
        label: "🌾 Return to the Plough",
        outcome: "He gives back his power and his example steadies the Republic; the fields and the people prosper.",
        effects: { food: 5, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "appius",
    name: "Appius Claudius Caecus",
    title: "Censor & Road-Builder",
    civ: "rome",
    note: "In 312 BC he drove the Via Appia south and raised the Aqua Appia, Rome's first great road and aqueduct.",
    when: (c) => c.cityCount >= 2,
    options: [
      {
        label: "🛣️ The Appian Way",
        outcome: "'The Queen of Roads' knits your realm together — armies march faster and every work is raised sooner.",
        effects: { perks: { buildFasterPct: 8, movePlus: 1 } }
      },
      {
        label: "💧 The Aqua Appia",
        outcome: "Clean water flows into the city by covered channel — the people multiply, now and for good.",
        effects: { food: 5, perks: { food: 1 } }
      }
    ]
  },
  {
    id: "hanno",
    name: "Hanno the Navigator",
    title: "Explorer of the African Coast",
    civ: "carthage",
    note: "Around 500 BC he led a great fleet down the west coast of Africa and recorded the Periplus of his voyage.",
    when: (c) => c.coastal || c.atSea,
    options: [
      {
        label: "🌍 The African Periplus",
        outcome: "His charts of the far coasts let your captains sail on where others would be lost.",
        effects: { seaReach: 2, gold: 24 }
      },
      {
        label: "🏺 Found the Trading Posts",
        outcome: "A chain of Carthaginian harbours along the coast pours foreign gold into your coffers for good.",
        effects: { gold: 18, perks: { gold: 2 } }
      }
    ]
  },
  {
    id: "imhotep",
    name: "Imhotep",
    title: "Architect & Physician",
    civ: "egypt",
    note: "Vizier to Djoser, he raised the first pyramid in stone and was worshipped a thousand years later as a healer.",
    when: (c) => c.cityCount >= 1,
    options: [
      {
        label: "🔺 The Step Pyramid",
        outcome: "The first mountain of dressed stone rises — a feat of engineering that galvanises your builders.",
        effects: { production: 25 }
      },
      {
        label: "☥ Physician of the Two Lands",
        outcome: "His medical papyri tend your soldiers and teach your scholars the body's workings.",
        effects: { science: 18, heal: true }
      }
    ]
  },
  {
    id: "diviciacus",
    name: "Diviciacus the Aeduan",
    title: "Druid & Statesman",
    civ: "gaul",
    note: "The one druid history names — envoy, astronomer and ally, who pleaded his people's cause before the Roman Senate.",
    when: (c) => c.cityCount >= 2 || c.age >= 2,
    options: [
      {
        label: "🌳 The Druids' Counsel",
        outcome: "Keepers of law and lore, the druids lend your tribes learning and a steady peace.",
        effects: { science: 20, perks: { stability: 1 } }
      },
      {
        label: "🔥 Rally the Tribes",
        outcome: "His oratory binds the warring clans into one host — fiercer in the charge, and richer for the union.",
        effects: { gold: 20, perks: { atkPct: 5 } }
      }
    ]
  },
  {
    id: "amanirenas",
    name: "Amanirenas",
    title: "Kandake of Kush",
    civ: "kush",
    note: "The one-eyed warrior queen who fought Augustus's Rome to a standstill (c. 24 BC) and buried a bronze head of Caesar beneath her temple steps.",
    when: (c) => c.atWar,
    options: [
      {
        label: "🏹 The Kandake's War",
        outcome: "The queen leads from the front; her archers harry the invader and the wounded take heart and recover.",
        effects: { heal: true, perks: { atkPct: 6 } }
      },
      {
        label: "👑 Bury the Bronze Head",
        outcome: "Rome's emperor trodden underfoot at your threshold — a defiance that steadies your realm and fills the treasury from the spoils.",
        effects: { gold: 26, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "druids-mona",
    name: "The Druids of Ynys Môn",
    title: "Keepers of the Sacred Isle",
    civ: "britons",
    note: "On Anglesey stood the druids' holy groves — the heart of British resistance that Rome burned in AD 60.",
    when: (c) => c.atWar || c.cityCount >= 2,
    options: [
      {
        label: "🌲 The Sacred Grove",
        outcome: "The isle's holy men lend your people law, memory and a fierce will to hold their ground.",
        effects: { perks: { stability: 1, defPct: 6 } }
      },
      {
        label: "🔥 The Rites of War",
        outcome: "Ancient rites and the reading of omens send your warriors into battle unafraid — and teach the wise their lore.",
        effects: { science: 16, perks: { atkPct: 5 } }
      }
    ]
  },
  {
    id: "surena",
    name: "Surena",
    title: "Victor of Carrhae",
    civ: "parthia",
    note: "The young general who destroyed Crassus's legions at Carrhae (53 BC) with horse-archers and the feigned 'Parthian shot.'",
    when: (c) => c.atWar,
    options: [
      {
        label: "🏹 The Parthian Shot",
        outcome: "His horse-archers wheel and loose in retreat — your armies strike harder, and Roman gold fills your saddlebags.",
        effects: { gold: 22, perks: { atkPct: 7 } }
      },
      {
        label: "🐫 The Silk Standards",
        outcome: "A camel-train of arrows and shimmering banners steadies your host on the field, and the caravan trade pays for good.",
        effects: { perks: { defPct: 5, gold: 2 } }
      }
    ]
  }
];

export function getFigure(id: string): HistoricalFigure | undefined {
  return FIGURES.find((f) => f.id === id);
}
