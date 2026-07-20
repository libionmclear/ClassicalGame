// HEGEMON — historical figures (docs/HEGEMON-RAIDERS-v1.md, "The Minds of the Age").
//
// These are DELIBERATELY NOT the kings, generals and statesmen of the Legend cards
// (the collectible meta-game). The people you MEET mid-match are the thinkers and
// makers of the ancient world — mathematicians, astronomers, physicians, inventors,
// architects, naturalists, a poet, and the anonymous master-craftsmen of a people.
// Some are household names; many are gloriously obscure. None is a ruler or a
// commander, and none shares a name with a Legend card — the two casts are disjoint.
//
// A figure arrives BECAUSE OF HOW YOU PLAY (a coastal power under naval threat draws
// Archimedes; a captain out on the deep draws Pytheas; a settled realm draws its
// architects), and offers a branching, historically-grounded boon. The roster is far
// larger than any one game surfaces, so no two campaigns meet the same faces. Some
// figures are unique to one people. Pure data + predicates so the engine stays
// deterministic.

import type { Player } from "./types";

/** The boon vocabulary — a superset of the Crossroads and ruin effects plus a few
 *  figure-specific powers. Applied deterministically by applyFigureEffects. Sign
 *  convention: buildFasterPct is POSITIVE-is-faster; unit/upkeep/researchCostPct are
 *  NEGATIVE-is-cheaper. */
export interface FigureEffects {
  gold?: number;               // to the player's treasury
  science?: number;            // to the research pool
  production?: number;         // banked at the capital
  food?: number;               // banked at every city
  spawnUnit?: string;          // a unit type mustered at the capital
  xp?: boolean;                // every unit gains a veterancy step
  heal?: boolean;              // every unit fully recovers
  reveal?: boolean;            // reveal the lands around the capital
  techUnlock?: string;         // grant a tech outright
  cancelRaids?: boolean;       // the Burning Mirrors — destroy raids bearing down on you
  seaReach?: number;           // sail this many rings farther before you are lost at sea
  perks?: NonNullable<Player["perks"]>; // a lasting per-turn / combat / cost bonus
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
  // ---- Universal: the thinkers and makers of the ancient world -------------------
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
    id: "thales",
    name: "Thales of Miletus",
    title: "The First Natural Philosopher",
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
    id: "anaximander",
    name: "Anaximander of Miletus",
    title: "Cartographer of the Cosmos",
    note: "Thales's pupil drew the first map of the whole world, guessed that life rose from the sea, and set Earth unsupported in space.",
    when: (c) => c.age <= 1 || c.cityCount >= 2,
    options: [
      {
        label: "🗺️ The First Map of the World",
        outcome: "A drawn map of land and sea lays your surroundings bare and spurs your geographers.",
        effects: { reveal: true, science: 18 }
      },
      {
        label: "♾️ The Boundless (Apeiron)",
        outcome: "A bold first principle behind all things sharpens how your philosophers reason.",
        effects: { science: 22, perks: { researchCostPct: -6 } }
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
    title: "Geographer of Alexandria",
    note: "From two shadows and a walked distance he measured the round Earth's circumference — and very nearly got it right.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "🌍 Measure the Earth",
        outcome: "His geography and gnomons chart the world about you.",
        effects: { reveal: true, science: 26 }
      },
      {
        label: "📚 The Sieve of Knowledge",
        outcome: "A polymath's method of sifting truth from scrolls compounds your learning for good.",
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
    id: "aristarchus",
    name: "Aristarchus of Samos",
    title: "The Ancient Copernican",
    note: "Eighteen centuries before Copernicus he set the Sun at the centre and the Earth in orbit around it.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "☀️ The Sun-Centred Cosmos",
        outcome: "A heliocentric heresy, centuries ahead of its time, sets your astronomers ablaze with new questions.",
        effects: { science: 42 }
      },
      {
        label: "🌒 Gauge the Sun and Moon",
        outcome: "By geometry he weighs the distances of Sun and Moon — and maps the sky above your realm.",
        effects: { science: 18, reveal: true }
      }
    ]
  },
  {
    id: "hipparchus",
    name: "Hipparchus of Nicaea",
    title: "Greatest of Astronomers",
    note: "He catalogued a thousand stars, discovered the precession of the equinoxes, and founded trigonometry.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "✨ The Star Catalogue",
        outcome: "A thousand stars fixed by magnitude and place — an enduring foundation for all who study the sky.",
        effects: { science: 24, perks: { science: 2 } }
      },
      {
        label: "📐 The First Trigonometry",
        outcome: "Chords and tables of angles give your engineers and navigators a powerful new art.",
        effects: { science: 30, perks: { navalMovePlus: 1 } }
      }
    ]
  },
  {
    id: "herophilus",
    name: "Herophilus of Chalcedon",
    title: "Father of Anatomy",
    note: "In Alexandria he was the first to dissect the human body, naming the nerves, the brain's ventricles and the pulse.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "🫀 The First Anatomy",
        outcome: "True knowledge of the body transforms your physicians — the sick and wounded are made whole.",
        effects: { science: 24, heal: true }
      },
      {
        label: "💓 The Art of the Pulse",
        outcome: "He teaches your healers to read the pulse and tend the ranks; the army recovers faster ever after.",
        effects: { science: 14, perks: { healPlus: 2 } }
      }
    ]
  },
  {
    id: "theophrastus",
    name: "Theophrastus of Eresos",
    title: "Father of Botany",
    note: "Aristotle's successor, he classed every plant of the known world and wrote 'On Stones,' the first mineralogy.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "🪨 On Stones",
        outcome: "His survey of ores, gems and earths teaches your prospectors where the land's wealth lies.",
        effects: { production: 18, reveal: true }
      },
      {
        label: "🌿 Enquiry into Plants",
        outcome: "Careful husbandry of crop and orchard makes your fields yield more, now and for good.",
        effects: { food: 5, perks: { food: 1 } }
      }
    ]
  },
  {
    id: "ctesibius",
    name: "Ctesibius of Alexandria",
    title: "Father of Pneumatics",
    note: "A barber's son who invented the force-pump, the water organ and the repeating catapult.",
    when: (c) => c.age >= 2 || c.atWar,
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
  {
    id: "hero",
    name: "Hero of Alexandria",
    title: "Master of Machines",
    note: "He built the first steam engine (the aeolipile), coin-operated automata and self-opening temple doors — toys, to his age.",
    when: (c) => c.age >= 2,
    options: [
      {
        label: "♨️ The Aeolipile",
        outcome: "Steam and gear-work astonish the court and quicken every workshop and worksite.",
        effects: { production: 20, perks: { buildFasterPct: 8 } }
      },
      {
        label: "🎭 Automata & the Odometer",
        outcome: "Self-moving marvels and measuring engines win renown and coin from far and wide.",
        effects: { science: 22, gold: 22 }
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
    id: "herodotus",
    name: "Herodotus of Halicarnassus",
    title: "The Father of History",
    note: "He wandered the known world gathering the tales of Greeks and Persians so they 'not be forgotten by time.'",
    when: (c) => c.foundRuins,
    options: [
      {
        label: "📜 Endow the Histories",
        outcome: "Your scholars set down all that has been learned — a lasting fount of knowledge.",
        effects: { science: 44 }
      },
      {
        label: "🗺️ Map the Known World",
        outcome: "His inquiries chart the lands about your heartland, and open new avenues of trade.",
        effects: { reveal: true, gold: 24 }
      }
    ]
  },
  {
    id: "sappho",
    name: "Sappho of Lesbos",
    title: "The Tenth Muse",
    note: "Plato called her the Tenth Muse; her lyric poetry of love and longing was sung across the Greek world.",
    when: (c) => !c.atWar,
    options: [
      {
        label: "🎶 The Tenth Muse",
        outcome: "Her verses give your people a shared song and refinement — a quiet, lasting civic pride.",
        effects: { science: 16, perks: { stability: 1 } }
      },
      {
        label: "🏛️ Songs for the Festival",
        outcome: "Choral festivals draw visitors and their coin, and gladden the whole city.",
        effects: { gold: 24, perks: { stability: 1 } }
      }
    ]
  },
  // ---- Unique to one people: their master builders and craftsmen -----------------
  {
    id: "vitruvius",
    name: "Vitruvius",
    title: "Architect & Engineer",
    civ: "rome",
    note: "The military engineer whose 'Ten Books on Architecture' laid down firmness, commodity and delight for all builders after him.",
    when: (c) => c.cityCount >= 2,
    options: [
      {
        label: "📐 The Ten Books on Architecture",
        outcome: "A canon of sound building spreads to every site — your works rise faster and stronger.",
        effects: { production: 14, perks: { buildFasterPct: 8 } }
      },
      {
        label: "🏛️ Firmness, Commodity, Delight",
        outcome: "Dressed stone, true arches and good walls make your cities both handsome and hard to storm.",
        effects: { production: 18, perks: { defPct: 4 } }
      }
    ]
  },
  {
    id: "ictinus",
    name: "Ictinus",
    title: "Architect of the Parthenon",
    civ: "greece",
    note: "With Callicrates he raised the Parthenon, correcting its every line by eye so the marble would look perfectly true.",
    when: (c) => c.cityCount >= 2 || !c.atWar,
    options: [
      {
        label: "🏛️ Raise the Parthenon",
        outcome: "A temple of flawless marble crowns your city and draws pilgrims and their coin for good.",
        effects: { production: 22, perks: { gold: 2 } }
      },
      {
        label: "📏 The Refinements of the Eye",
        outcome: "Subtle curves that read as perfectly straight teach your builders a mastery that steadies the whole realm.",
        effects: { science: 16, perks: { stability: 1 } }
      }
    ]
  },
  {
    id: "cothon-shipwrights",
    name: "The Shipwrights of the Cothon",
    title: "Masters of the Naval Dockyard",
    civ: "carthage",
    note: "In Carthage's ringed war-harbour, shipwrights built quinqueremes from numbered, prefabricated parts — a fleet from a production line.",
    when: (c) => c.coastal || c.atSea,
    options: [
      {
        label: "🔧 The Prefabricated Fleet",
        outcome: "Numbered, mass-cut timbers turn out warships at astonishing speed — your yards hum and your ships range farther.",
        effects: { production: 18, perks: { navalMovePlus: 1 } }
      },
      {
        label: "🧭 Chart the Deep Lanes",
        outcome: "Seasoned crews and sturdy hulls push the sea-roads out past the reach of lesser fleets.",
        effects: { seaReach: 2, gold: 22 }
      }
    ]
  },
  {
    id: "imhotep",
    name: "Imhotep",
    title: "Architect & Physician",
    civ: "egypt",
    note: "He raised the first pyramid in dressed stone and was worshipped a thousand years later as a god of healing — never as a king.",
    when: (c) => c.cityCount >= 2 || c.age >= 2,
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
    id: "latene-smiths",
    name: "The Smiths of La Tène",
    title: "Ironmasters of the Celts",
    civ: "gaul",
    note: "The Celtic smiths forged pattern-welded blades and are credited with inventing mail armour — the finest ironwork of their age.",
    when: (c) => c.atWar || c.cityCount >= 2,
    options: [
      {
        label: "🔗 The Iron Mail",
        outcome: "Ringed iron shirts clothe your warriors — they hold the line where others would fall.",
        effects: { production: 14, perks: { defPct: 6 } }
      },
      {
        label: "⚔️ The Long Blades of La Tène",
        outcome: "Superb long swords arm your host and command a rich trade in fine iron.",
        effects: { gold: 20, perks: { atkPct: 5 } }
      }
    ]
  },
  {
    id: "meroe-ironmasters",
    name: "The Ironmasters of Meroë",
    title: "Smelters of the Nubian South",
    civ: "kush",
    note: "Meroë's furnaces poured out so much iron that its slag-heaps still ring the city — the 'Birmingham of ancient Africa.'",
    when: (c) => c.cityCount >= 2 || c.age >= 2,
    options: [
      {
        label: "🔥 The Furnaces of Meroë",
        outcome: "A roaring iron industry arms your soldiers and drives your workshops.",
        effects: { production: 20, perks: { atkPct: 4 } }
      },
      {
        label: "🪙 The Iron Trade",
        outcome: "Nubian iron and gold flow up the Nile and across the desert, enriching you now and for good.",
        effects: { gold: 24, perks: { gold: 2 } }
      }
    ]
  },
  {
    id: "mona-druids",
    name: "The Druids of Ynys Môn",
    title: "Keepers of Lore & the Heavens",
    civ: "britons",
    note: "On Anglesey the druids kept twenty years of memorised law, verse and star-lore — the learning of the Britons, held in no book.",
    when: (c) => c.cityCount >= 2 || c.foundRuins,
    options: [
      {
        label: "🌲 The Sacred Grove",
        outcome: "Keepers of law and memory lend your people learning and a deep, settled calm.",
        effects: { science: 18, perks: { stability: 1 } }
      },
      {
        label: "🌙 Readers of the Heavens",
        outcome: "Their reckoning of the seasons by moon and star tells your farmers just when to sow and reap.",
        effects: { food: 5, science: 14 }
      }
    ]
  },
  {
    id: "qanat-masters",
    name: "The Qanat Masters",
    title: "Engineers of the Underground Rivers",
    civ: "parthia",
    note: "Persian engineers cut gently-sloping tunnels for miles to carry mountain water beneath the desert — an art that made the drylands bloom.",
    when: (c) => c.cityCount >= 2 || c.age >= 2,
    options: [
      {
        label: "💧 The Underground Rivers",
        outcome: "Hidden channels bring cool water to your cities — they grow greener and fuller for good.",
        effects: { food: 6, perks: { food: 1 } }
      },
      {
        label: "🏜️ Green the Desert",
        outcome: "Irrigated fields and gardens spread where there was only sand, feeding your works and coffers.",
        effects: { production: 16, gold: 18 }
      }
    ]
  }
];

export function getFigure(id: string): HistoricalFigure | undefined {
  return FIGURES.find((f) => f.id === id);
}
