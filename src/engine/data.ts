import type { TechRule, TerrainRule, UnitRule } from "./types";

export const TERRAIN: Record<string, TerrainRule> = {
  plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
  valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
  forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
  hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
  mountains: { moveCost: 3, yields: { food: 0, production: 1, gold: 0 }, defense: 0.5, vision: 2, impassableWithoutTech: "mountain-paths" },
  desert: { moveCost: 2, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0 },
  coast: { moveCost: 1, yields: { food: 1, production: 0, gold: 1 }, defense: 0, vision: 0, navalOnly: true },
  sea: { moveCost: 1, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0, navalOnly: true, requiresTech: "open-sea-sailing" }
};

export const WEATHER_STATES = {
  clear: {},
  rain: { mountedMovePenalty: 1, riverCrossingExtra: 1 },
  fog: { visionPenalty: 1, ambushMultiplier: 2 },
  storm: { deepSeaDamage: 2, deepSeaEntryBlocked: true },
  heat: { desertAttritionMultiplier: 2 }
};

export const TECHS: Record<string, TechRule> = {
  "bronze-working": { age: 1, prerequisites: [] },
  sailing: { age: 1, prerequisites: [] },
  writing: { age: 1, prerequisites: [] },
  masonry: { age: 1, prerequisites: [] },
  archery: { age: 1, prerequisites: [] },
  irrigation: { age: 1, prerequisites: [] },

  "phalanx-doctrine": {
    age: 1,
    prerequisites: ["bronze-working"],
    forkGroup: "warfare-doctrine",
    forkBranch: "phalanx"
  },
  "skirmish-doctrine": {
    age: 1,
    prerequisites: ["archery"],
    forkGroup: "warfare-doctrine",
    forkBranch: "skirmish"
  },
  "temple-economy": {
    age: 1,
    prerequisites: ["writing"],
    forkGroup: "economy-doctrine",
    forkBranch: "temple"
  },
  coinage: {
    age: 1,
    prerequisites: ["writing"],
    forkGroup: "economy-doctrine",
    forkBranch: "coinage"
  },

  "iron-working": { age: 2, prerequisites: ["bronze-working"] },
  "combined-arms": { age: 2, prerequisites: ["iron-working"] },
  "open-sea-sailing": { age: 2, prerequisites: ["sailing"] },
  engineering: { age: 2, prerequisites: ["masonry"] },
  "horseback-riding": { age: 2, prerequisites: ["bronze-working"] },
  "mountain-paths": { age: 2, prerequisites: ["engineering"] },
  "caravan-logistics": { age: 2, prerequisites: ["coinage"] },
  republic: {
    age: 2,
    prerequisites: ["writing"],
    forkGroup: "statecraft",
    forkBranch: "republic"
  },
  monarchy: {
    age: 2,
    prerequisites: ["writing"],
    forkGroup: "statecraft",
    forkBranch: "monarchy"
  },
  "ramming-fleets": {
    age: 2,
    prerequisites: ["open-sea-sailing"],
    forkGroup: "naval-doctrine",
    forkBranch: "ramming"
  },
  "merchant-marine": {
    age: 2,
    prerequisites: ["open-sea-sailing"],
    forkGroup: "naval-doctrine",
    forkBranch: "merchant"
  },

  "roads-logistics": { age: 3, prerequisites: ["engineering"] },
  siegecraft: { age: 3, prerequisites: ["iron-working"] },
  medicine: { age: 3, prerequisites: ["writing"] },
  "law-administration": { age: 3, prerequisites: ["writing"] },
  "currency-reform": { age: 3, prerequisites: ["coinage"] },
  cartography: { age: 3, prerequisites: ["open-sea-sailing"] },
  assimilation: {
    age: 3,
    prerequisites: ["law-administration"],
    forkGroup: "imperial-method",
    forkBranch: "assimilation"
  },
  "tribute-empire": {
    age: 3,
    prerequisites: ["law-administration"],
    forkGroup: "imperial-method",
    forkBranch: "tribute"
  },

  // --- Additional shared historical techs (deeper research so science lasts) ---
  pottery: { age: 1, prerequisites: [] },
  mathematics: { age: 1, prerequisites: ["writing"] },
  philosophy: { age: 2, prerequisites: ["writing"] },
  metallurgy: { age: 2, prerequisites: ["iron-working"] },
  aqueducts: { age: 2, prerequisites: ["engineering"] },
  astronomy: { age: 2, prerequisites: ["mathematics"] },
  rhetoric: { age: 3, prerequisites: ["writing"] },

  // --- Civilization-unique techs (each fields that people's signature unit) ---
  "hoplite-phalanx": { age: 1, prerequisites: ["bronze-working"], civ: "greece", cost: 24 },
  chariotry: { age: 1, prerequisites: ["bronze-working"], civ: "egypt", cost: 24 },
  "legionary-system": { age: 2, prerequisites: ["iron-working"], civ: "rome", cost: 44 },
  "war-elephants": { age: 2, prerequisites: ["iron-working"], civ: "carthage", cost: 44 },
  "iron-mastery": { age: 2, prerequisites: ["iron-working"], civ: "gaul", cost: 40 },
  "horse-archery": { age: 2, prerequisites: ["horseback-riding"], civ: "parthia", cost: 44 }
};

// Classical rock-paper-scissors, both when attacking and defending:
//   spears beat cavalry; cavalry runs down skirmishers & light foot;
//   heavy infantry grinds spears and closes on skirmishers; archers strike
//   without retaliation at range but are fragile once caught in melee.
export const UNITS: Record<string, UnitRule> = {
  warrior: { domain: "land", movement: 2, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1, category: "infantry" },
  archer: { domain: "land", movement: 2, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1, category: "ranged" },
  spearman: {
    domain: "land", movement: 2, attack: 15, defense: 22, maxHp: 20, range: 1, upkeep: 1,
    requiresTech: "bronze-working", category: "spear", counters: { mounted: 0.6 }
  },
  swordsman: {
    domain: "land", movement: 2, attack: 27, defense: 20, maxHp: 22, range: 1, upkeep: 2,
    requiresTech: "iron-working", category: "heavy", counters: { ranged: 0.35, spear: 0.2 }
  },
  horseman: {
    domain: "land", movement: 3, attack: 22, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true,
    requiresTech: "horseback-riding", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }
  },
  siege: {
    domain: "land", movement: 1, attack: 12, defense: 8, maxHp: 16, range: 2, upkeep: 2,
    requiresTech: "siegecraft", category: "siege", siegeBonus: 1.2
  },
  trireme: { domain: "naval", movement: 3, attack: 24, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "open-sea-sailing", category: "ranged" },
  merchant: { domain: "civilian", movement: 2, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1, category: "infantry" },
  settler: { domain: "civilian", movement: 2, attack: 0, defense: 6, maxHp: 12, range: 0, upkeep: 1, category: "infantry" },

  // --- Civilization-unique units (each gated by that people's unique tech) ---
  // Rome — the legion: drilled heavy foot, a clear step beyond the swordsman.
  legionary: {
    domain: "land", movement: 2, attack: 30, defense: 26, maxHp: 26, range: 1, upkeep: 2,
    requiresTech: "legionary-system", civ: "rome", category: "heavy", counters: { ranged: 0.35, spear: 0.25 },
    upgradesFrom: "swordsman"
  },
  // Greece — the hoplite phalanx: an immovable shield-wall that shatters cavalry.
  hoplite: {
    domain: "land", movement: 2, attack: 22, defense: 30, maxHp: 24, range: 1, upkeep: 2,
    requiresTech: "hoplite-phalanx", civ: "greece", category: "spear", counters: { mounted: 0.7 },
    upgradesFrom: "spearman"
  },
  // Carthage — the war elephant: shock beast that tramples massed infantry.
  "war-elephant": {
    domain: "land", movement: 2, attack: 34, defense: 22, maxHp: 32, range: 1, upkeep: 3,
    requiresTech: "war-elephants", civ: "carthage", category: "heavy", counters: { infantry: 0.4, ranged: 0.3 },
    upgradesFrom: "swordsman"
  },
  // Egypt — the war chariot: fast archer-platform that rides down light troops.
  "war-chariot": {
    domain: "land", movement: 4, attack: 24, defense: 16, maxHp: 22, range: 1, upkeep: 2, mounted: true,
    requiresTech: "chariotry", civ: "egypt", category: "mounted", counters: { ranged: 0.5, infantry: 0.2 },
    upgradesFrom: "horseman"
  },
  // Gaul — the gaesatae: ferocious naked charge, murderous but poorly guarded.
  gaesatae: {
    domain: "land", movement: 2, attack: 32, defense: 15, maxHp: 22, range: 1, upkeep: 2,
    requiresTech: "iron-mastery", civ: "gaul", category: "heavy", counters: { ranged: 0.3 },
    upgradesFrom: "swordsman"
  },
  // Parthia — the horse archer: the Parthian shot, striking from range then fleeing.
  "horse-archer": {
    domain: "land", movement: 4, attack: 20, defense: 14, maxHp: 18, range: 2, upkeep: 2, mounted: true,
    requiresTech: "horse-archery", civ: "parthia", category: "mounted", counters: { infantry: 0.25, spear: 0.3 },
    upgradesFrom: "horseman"
  }
};

export interface BuildingRule {
  name: string;
  cost: number;
  requiresTech?: string;
  yields?: { food?: number; production?: number; gold?: number; science?: number };
  cityHp?: number;
  /** Only buildable in a city touching the sea (coast or open water). */
  coastalOnly?: boolean;
  /** Extra gold per OTHER building of this same id the owner holds (trade network). */
  networkGold?: number;
  note: string;
}

// City improvements — one of each per city. Yields add to that city each turn.
export const BUILDINGS: Record<string, BuildingRule> = {
  granary: {
    name: "Granary",
    cost: 16,
    yields: { food: 2 },
    note: "Storehouses of grain smoothed the lean years — the horrea that fed Rome and the silos of Egypt. Effect: +2 food (faster growth)."
  },
  workshop: {
    name: "Workshop",
    cost: 18,
    yields: { production: 2 },
    note: "Fabricae and artisan quarters turned raw metal and timber into arms and tools. Effect: +2 production."
  },
  market: {
    name: "Market",
    cost: 16,
    yields: { gold: 2 },
    note: "The macellum and agora — the beating commercial heart of every ancient city. Effect: +2 gold."
  },
  library: {
    name: "Library",
    cost: 20,
    requiresTech: "writing",
    yields: { science: 2 },
    note: "From the Great Library of Alexandria to temple archives, collected knowledge accelerated discovery. Effect: +2 science."
  },
  walls: {
    name: "Walls",
    cost: 22,
    requiresTech: "masonry",
    cityHp: 20,
    note: "Servian and Aurelian walls, Hellenistic circuits — dressed stone that turned a town into a fortress. Effect: +20 city HP."
  },
  harbor: {
    name: "Harbor",
    cost: 18,
    requiresTech: "sailing",
    coastalOnly: true,
    yields: { food: 1, gold: 2 },
    networkGold: 1,
    note: "Moles, quays and warehouses — Ostia, Carthage's circular cothon, Piraeus. Sea lanes carried grain, wine, tin and silver across the classical world. Effect: +1 food, +2 gold, and +1 more gold for every other Harbor you hold (a trade network)."
  },
  temple: {
    name: "Temple",
    cost: 18,
    requiresTech: "pottery",
    yields: { science: 1, gold: 1 },
    note: "The house of the city's god — the Parthenon, the Capitoline temple, Karnak. Cult, festival and civic pride in stone. Effect: +1 science, +1 gold."
  },
  academy: {
    name: "Academy",
    cost: 24,
    requiresTech: "mathematics",
    yields: { science: 3 },
    note: "Where number and proof were taught — Euclid's Alexandria, Pythagoras' school. Effect: +3 science."
  },
  lyceum: {
    name: "Lyceum",
    cost: 26,
    requiresTech: "philosophy",
    yields: { science: 2, gold: 1 },
    note: "Aristotle's Lyceum and Plato's Academy — reasoned inquiry into nature, ethics and the state. Effect: +2 science, +1 gold."
  },
  aqueduct: {
    name: "Aqueduct",
    cost: 26,
    requiresTech: "aqueducts",
    yields: { food: 3 },
    note: "Arched channels carrying clean water for miles — the Aqua Appia, the Pont du Gard. Bigger, healthier cities. Effect: +3 food."
  },
  barracks: {
    name: "Barracks",
    cost: 20,
    requiresTech: "metallurgy",
    cityHp: 10,
    yields: { production: 1 },
    note: "Drill yards, armouries and the forge — where raw levies were made into soldiers. Effect: +1 labour, +10 city HP."
  },
  amphitheater: {
    name: "Amphitheater",
    cost: 26,
    requiresTech: "rhetoric",
    yields: { gold: 2, science: 1 },
    note: "Theatre and arena — the games and rhetoric that bound a populace to the state, from the Theatre of Dionysus to the Colosseum. Effect: +2 gold, +1 science."
  }
};

// Tile improvements — a city works the improved tiles in its territory for the
// listed bonus yields each turn. Built through the city's labour queue.
export interface ImprovementRule {
  name: string;
  /** Terrains this improvement can be built on. */
  terrains: string[];
  /** Labour cost, paid from the owning city's production. */
  cost: number;
  yields: { food?: number; production?: number; gold?: number; science?: number };
  /** Tech that must be researched before this improvement can be built. */
  requiresTech?: string;
  note: string;
}

export const IMPROVEMENTS: Record<string, ImprovementRule> = {
  farm: {
    name: "Farm",
    terrains: ["plains", "valley"],
    cost: 10,
    yields: { food: 2 },
    note: "Ditched fields and irrigation — the centuriated farmland of Italy, the flood-fed plots of the Nile. Effect: +2 food."
  },
  pasture: {
    name: "Pasture",
    terrains: ["plains", "valley", "hills"],
    cost: 10,
    yields: { food: 1, production: 1 },
    note: "Herds of cattle, sheep and horses on open range — hides, wool and remounts. Effect: +1 food, +1 labour."
  },
  mine: {
    name: "Mine",
    terrains: ["hills", "mountains"],
    cost: 12,
    yields: { production: 2 },
    note: "Shafts and galleries after silver, iron and copper — Laurion, Rio Tinto, the Noric iron. Effect: +2 labour."
  },
  "lumber-camp": {
    name: "Lumber Camp",
    terrains: ["forest"],
    cost: 10,
    yields: { production: 1, gold: 1 },
    note: "Timber for ships, siege engines and building — the forests of Gaul and Germania. Effect: +1 labour, +1 gold."
  },
  "trade-post": {
    name: "Trade Post",
    terrains: ["desert"],
    cost: 10,
    yields: { gold: 2 },
    note: "A caravanserai on the desert road — incense, silk and salt passing hand to hand. Effect: +2 gold."
  },
  quarry: {
    name: "Quarry",
    terrains: ["hills", "mountains"],
    cost: 12,
    yields: { production: 2, gold: 1 },
    requiresTech: "metallurgy",
    note: "Cut stone and marble for walls, roads and monuments — the travertine of Tibur, the marble of Paros. Effect: +2 labour, +1 gold. (Needs Metallurgy.)"
  },
  vineyard: {
    name: "Vineyard",
    terrains: ["plains", "hills"],
    cost: 10,
    yields: { food: 1, gold: 2 },
    requiresTech: "pottery",
    note: "Terraced vines and olive groves — the wine and oil that were the classical world's cash crops. Effect: +1 food, +2 gold. (Needs Pottery for the amphorae.)"
  }
};

// Composition roles for combined-arms bonuses.
export const MELEE_CATEGORIES = new Set(["infantry", "spear", "heavy"]);
export const RANGED_CATEGORIES = new Set(["ranged", "siege"]);

export const CATEGORY_LABELS: Record<string, string> = {
  infantry: "infantry",
  spear: "spearmen",
  heavy: "heavy infantry",
  ranged: "ranged",
  mounted: "cavalry",
  siege: "siege"
};

export const UNIT_BUILD_COSTS: Record<string, number> = {
  warrior: 12,
  archer: 14,
  spearman: 14,
  swordsman: 20,
  horseman: 20,
  siege: 24,
  trireme: 22,
  merchant: 16,
  settler: 18,
  // Civ-unique units — costlier than their generic cousins, worth every labourer.
  legionary: 26,
  hoplite: 22,
  "war-elephant": 32,
  "war-chariot": 24,
  gaesatae: 20,
  "horse-archer": 24
};
