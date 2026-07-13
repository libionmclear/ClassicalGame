import type { TechRule, TerrainRule, UnitRule } from "./types";
import { UNIQUE_TECHS } from "./branch-data";
import { UNIQUE_UNITS_WAVE2 } from "../units-v2-addendum.js";

export const TERRAIN: Record<string, TerrainRule> = {
  plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
  valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
  forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
  hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
  // Highlands (elevation level 4): the rocky approach below the peaks — slow and
  // defensible, one step short of the impassable mountains.
  highlands: { moveCost: 3, yields: { food: 0, production: 2, gold: 0 }, defense: 0.4, vision: 1 },
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
  "animal-husbandry": { age: 1, prerequisites: [] },

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

  // v2.1 §2: hard AND-prereqs, tightened so the ages interlock.
  "iron-working": { age: 2, prerequisites: ["bronze-working", "masonry"] },
  "combined-arms": { age: 2, prerequisites: ["iron-working"] },
  "open-sea-sailing": { age: 2, prerequisites: ["sailing", "writing"] },
  engineering: { age: 2, prerequisites: ["masonry"] },
  "horseback-riding": { age: 2, prerequisites: ["animal-husbandry"] },
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
  siegecraft: { age: 3, prerequisites: ["iron-working", "engineering"] },
  medicine: { age: 3, prerequisites: ["philosophy"] },
  "law-administration": { age: 3, prerequisites: ["writing", "republic"] },
  "currency-reform": { age: 3, prerequisites: ["masonry", "writing"] },
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
  rhetoric: { age: 3, prerequisites: ["philosophy"] },

  // Deeper economy so research keeps paying off.
  "crop-rotation": { age: 2, prerequisites: ["irrigation"], cost: 30 },

  // --- Civilization-unique techs (each fields that people's signature unit) ---
  "hoplite-phalanx": { age: 1, prerequisites: ["bronze-working"], civ: "greece", cost: 24 },
  chariotry: { age: 1, prerequisites: ["bronze-working"], civ: "egypt", cost: 24 },
  "legionary-system": { age: 2, prerequisites: ["iron-working"], civ: "rome", cost: 44 },
  "war-elephants": { age: 2, prerequisites: ["iron-working"], civ: "carthage", cost: 36 },
  "iron-mastery": { age: 2, prerequisites: ["iron-working"], civ: "gaul", cost: 40 },
  "horse-archery": { age: 2, prerequisites: ["horseback-riding"], civ: "parthia", cost: 44 },

  // --- Civilization signature DOCTRINES (a second unique, a distinct effect) ---
  // Rome's testudo shell — legionaries lock shields and shrug off arrows.
  testudo: { age: 3, prerequisites: ["legionary-system"], civ: "rome", cost: 48 },
  // Greece's phalanx wall — spearmen hold an unbreakable line, murderous to cavalry.
  "phalanx-wall": { age: 2, prerequisites: ["hoplite-phalanx"], civ: "greece", cost: 40 },
  // Egypt's Nile bureaucracy — scribes and granaries: extra food & science per city.
  "nile-bureaucracy": { age: 2, prerequisites: ["writing"], civ: "egypt", cost: 40 },
  // Carthage's thalassocracy — mastery of the sea: warships hit harder and cost less.
  thalassocracy: { age: 2, prerequisites: ["open-sea-sailing"], civ: "carthage", cost: 44 },
  // Gaul's furor — the headlong charge: warbands strike with terrible force.
  furor: { age: 2, prerequisites: ["iron-mastery"], civ: "gaul", cost: 40 },
  // Parthia's Parthian shot — horse archers loose and wheel away untouched.
  "parthian-shot": { age: 3, prerequisites: ["horse-archery"], civ: "parthia", cost: 48 }
};

// Per-city yield each turn from certain researched techs — so every research has a
// concrete, lasting impact on your empire, not just a unit or building unlock.
export const TECH_CITY_YIELD: Record<string, { food?: number; production?: number; gold?: number; science?: number }> = {
  philosophy: { science: 1 },
  mathematics: { production: 1 },
  astronomy: { science: 1 },
  aqueducts: { food: 1 },
  "law-administration": { gold: 1 },
  "currency-reform": { gold: 1 },
  "crop-rotation": { food: 1 },
  "nile-bureaucracy": { food: 1, science: 1 } // Egypt's civ bonus
};

// ===== v2: merge the civ-unique BRANCH techs (docs/HEGEMON-TECHTREE-v2.md §3) =====
// Absorbed doctrine/unit techs (same ids) are OVERWRITTEN with their new branch
// prerequisites — save compatibility: ids unchanged, prereq edges new. Branch
// techs use the shared age-derived costs (no explicit cost). The doctrine
// reassignment (phalanx-wall→sparta, new wooden-walls→Athens) rides in via the
// data. Effects: cityYield maps to TECH_CITY_YIELD below (labour→production); its
// stability now feeds the real per-city STABILITY stat via TECH_STABILITY (no
// longer stubbed as gold). Combat %, capitalYield, buildingBoost, upkeepPct and
// every `special:` hook are still FLAGGED (not wired) except the six existing
// doctrines, whose combat effects are already hardcoded in index.ts.
// Per-tech per-city stability contribution (Phase 5 un-stub).
export const TECH_STABILITY: Record<string, number> = {};
for (const t of UNIQUE_TECHS) {
  const prior = TECHS[t.id];
  TECHS[t.id] = {
    age: t.age,
    prerequisites: t.prereq.slice(),
    civ: t.civ,
    name: t.name,
    note: t.note,
    capstone: t.capstone,
    effect: t.effect,
    ...(prior && prior.forkGroup ? { forkGroup: prior.forkGroup, forkBranch: prior.forkBranch } : {})
  };
  const cy = (t.effect as { cityYield?: Record<string, number> }).cityYield;
  if (cy) {
    // Build fresh from the branch data (the source of truth) — do NOT add on top
    // of an existing entry, or absorbed doctrines like nile-bureaucracy double.
    const y: { food?: number; production?: number; gold?: number; science?: number } = {};
    for (const k of Object.keys(cy)) {
      const v = cy[k];
      if (k === "food") y.food = (y.food ?? 0) + v;
      else if (k === "science") y.science = (y.science ?? 0) + v;
      else if (k === "gold") y.gold = (y.gold ?? 0) + v;
      else if (k === "labour" || k === "production") y.production = (y.production ?? 0) + v;
      else if (k === "stability") TECH_STABILITY[t.id] = (TECH_STABILITY[t.id] ?? 0) + v; // real stat now
    }
    if (y.food || y.production || y.gold || y.science) TECH_CITY_YIELD[t.id] = y;
  }
}

// ===== v2.1 §1/§3c — within-age TRACK CHAINS (the authoritative trunk prereqs) =====
// The trunk is organised into five tracks (military/construction/economy/civic/naval).
// Within each age a track is a near-LINEAR chain: an entry tech (only previous-age
// prereqs) then each successive tech behind the last. That keeps the researchable
// "frontier" small (one live head per track) and gives the depth-tiered costs real
// texture. Includes the approved §2 hard-prereqs. Applied after the branch merge so
// it is the single source of truth for trunk edges. (≤7 frontier is not reachable
// with 5 tracks + civ branches — see docs; this holds trunk-only to ~10.)
const TRUNK_CHAINS: Record<string, string[]> = {
  // AGE I — entries: bronze-working, masonry, pottery, writing, sailing
  archery: ["bronze-working"],
  "animal-husbandry": ["pottery"],
  irrigation: ["animal-husbandry"],
  mathematics: ["writing"],
  "phalanx-doctrine": ["bronze-working"],
  "skirmish-doctrine": ["archery"],
  "temple-economy": ["irrigation"],
  coinage: ["irrigation"],
  // AGE II — entries: iron-working, engineering, open-sea-sailing, philosophy, caravan-logistics
  "iron-working": ["bronze-working", "masonry"],
  engineering: ["masonry"],
  "open-sea-sailing": ["sailing", "writing"],
  philosophy: ["writing"],
  "caravan-logistics": ["irrigation"],
  "combined-arms": ["iron-working"],
  metallurgy: ["combined-arms"],
  "horseback-riding": ["animal-husbandry", "metallurgy"],
  "mountain-paths": ["engineering"],
  aqueducts: ["mountain-paths"],
  astronomy: ["mathematics", "philosophy"],
  republic: ["astronomy"],
  monarchy: ["astronomy"],
  "ramming-fleets": ["open-sea-sailing"],
  "merchant-marine": ["open-sea-sailing"],
  "crop-rotation": ["caravan-logistics", "irrigation"],
  // AGE III — entries: siegecraft, roads-logistics, cartography, currency-reform, law-administration
  siegecraft: ["iron-working", "engineering"],
  "roads-logistics": ["engineering"],
  cartography: ["open-sea-sailing"],
  "currency-reform": ["masonry", "writing"],
  "law-administration": ["writing", "republic"],
  rhetoric: ["philosophy", "law-administration"],
  medicine: ["philosophy", "rhetoric"],
  assimilation: ["medicine"],
  "tribute-empire": ["medicine"]
};
for (const [id, prereqs] of Object.entries(TRUNK_CHAINS)) {
  if (TECHS[id]) TECHS[id].prerequisites = prereqs;
}

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
  // §10.1 — the recon/discovery specialist: fastest land unit, cannot attack,
  // and the only unit that fully excavates a Ruin (others get half, no Codex).
  explorer: { domain: "civilian", movement: 4, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1, category: "support" },

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
    domain: "land", movement: 2, attack: 34, defense: 22, maxHp: 32, range: 1, upkeep: 2,
    requiresTech: "war-elephants", civ: "carthage", category: "heavy", counters: { infantry: 0.4, ranged: 0.3 },
    upgradesFrom: "swordsman"
  },
  // Egypt — the war chariot: fast archer-platform that rides down light troops.
  "war-chariot": {
    domain: "land", movement: 4, attack: 24, defense: 16, maxHp: 22, range: 1, upkeep: 2, mounted: true,
    requiresTech: "chariotry", civ: "egypt", category: "mounted", counters: { ranged: 0.5, infantry: 0.2 },
    upgradesFrom: "horseman"
  },
  // Britons — the chariot of the isles: hit-and-run — keeps moving after it strikes.
  "chariot-isles": {
    domain: "land", movement: 4, attack: 22, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true,
    requiresTech: "chariot-craft", civ: "britons", category: "mounted", counters: { ranged: 0.4, infantry: 0.15 },
    upgradesFrom: "horseman", special: "hit-and-run"
  },
  // Kush — the archer of Meroë: the finest bowmen of the early ages (Ta-Seti, "land of the bow").
  "meroe-archer": {
    domain: "land", movement: 2, attack: 24, defense: 13, maxHp: 20, range: 2, upkeep: 1,
    requiresTech: "ta-seti-archery", civ: "kush", category: "ranged", counters: { infantry: 0.2 },
    upgradesFrom: "archer"
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
  },

  // --- v2 branch units (stats derived from NEW_UNITS basedOn+tweak; 3D models &
  //     the wider roster are Phase 3). Cataphract is the only WAVE-1 addition;
  //     the other four are gated to wave-2 civs (not yet playable) and exist so
  //     their branch `unlocks` resolve. Two carry a `special` this note flags:
  //     immortal's 50%-cost-refund-on-death and crossbowman's terrain-def bypass
  //     are STUBBED (base stats only) until the hooks ship.
  cataphract: {
    domain: "land", movement: 2, attack: 26, defense: 26, maxHp: 28, range: 1, upkeep: 2, mounted: true,
    requiresTech: "cataphract-armouries", civ: "parthia", category: "mounted", counters: { ranged: 0.5, infantry: 0.2 },
    upgradesFrom: "horseman"
  },
  spartiate: {
    domain: "land", movement: 2, attack: 26, defense: 34, maxHp: 26, range: 1, upkeep: 2,
    requiresTech: "spartiate-corps", civ: "sparta", category: "spear", counters: { mounted: 0.7 },
    upgradesFrom: "hoplite"
  },
  phalangite: {
    domain: "land", movement: 2, attack: 20, defense: 24, maxHp: 20, range: 1, upkeep: 2,
    requiresTech: "sarissa-phalanx", civ: "macedon", category: "spear", counters: { mounted: 0.6, infantry: 0.2 },
    upgradesFrom: "spearman"
  },
  immortal: {
    domain: "land", movement: 2, attack: 20, defense: 24, maxHp: 22, range: 1, upkeep: 1,
    requiresTech: "immortals", civ: "persia", category: "spear", counters: { mounted: 0.5 },
    upgradesFrom: "spearman"
  },
  crossbowman: {
    domain: "land", movement: 1, attack: 22, defense: 12, maxHp: 18, range: 2, upkeep: 1,
    requiresTech: "crossbow-production", civ: "han", category: "ranged",
    upgradesFrom: "archer"
  },

  // --- v2 unique-unit roster (units-v2.js): 3 per civ. Stats derived from
  //     basedOn + numeric mods; the `special` behaviours (retreat-after-attack,
  //     elite auras, terrain conditionality, resupply, upkeep-in-food, etc.) are
  //     STUBBED — base stats only — and listed in the Phase-3 summary. Wave-2 civ
  //     units are civ-gated and inert until those civs are playable. Distinct 3D
  //     silhouettes (UNIT_SILHOUETTES) are a visual follow-up; today each renders
  //     on its category rig.
  velites: { domain: "land", movement: 3, attack: 15, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "castra", civ: "rome", category: "ranged", upgradesFrom: "archer" },
  praetorian: { domain: "land", movement: 2, attack: 32, defense: 28, maxHp: 28, range: 1, upkeep: 2, requiresTech: "marian-reforms", civ: "rome", category: "heavy", counters: { ranged: 0.35, spear: 0.25 }, upgradesFrom: "legionary", buildCap: 2 },
  "sacred-band": { domain: "land", movement: 2, attack: 16, defense: 24, maxHp: 22, range: 1, upkeep: 1, requiresTech: "suffete-council", civ: "carthage", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
  "numidian-cavalry": { domain: "land", movement: 4, attack: 22, defense: 13, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "numidian-alliance", civ: "carthage", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
  peltast: { domain: "land", movement: 3, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "hoplite-phalanx", civ: "greece", category: "ranged", counters: { spear: 0.25 }, upgradesFrom: "archer" },
  "athenian-trireme": { domain: "naval", movement: 4, attack: 26, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "neorion", civ: "greece", category: "ranged", upgradesFrom: "trireme" },
  "nubian-archer": { domain: "land", movement: 2, attack: 18, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "nubian-archers", civ: "egypt", category: "ranged", upgradesFrom: "archer" },
  machimoi: { domain: "land", movement: 2, attack: 15, defense: 23, maxHp: 20, range: 1, upkeep: 1, requiresTech: "temple-estates", civ: "egypt", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
  "noble-horse": { domain: "land", movement: 3, attack: 24, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "noble-cavalry", civ: "gaul", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
  soldurii: { domain: "land", movement: 2, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "client-warbands", civ: "gaul", category: "infantry", counters: { ranged: 0.3 }, upgradesFrom: "swordsman" },
  "camel-train": { domain: "civilian", movement: 2, attack: 0, defense: 8, maxHp: 16, range: 0, upkeep: 1, requiresTech: "desert-waystations", civ: "parthia", category: "support" },
  "perioikoi-hoplite": { domain: "land", movement: 2, attack: 15, defense: 22, maxHp: 20, range: 1, upkeep: 1, requiresTech: "perioikoi-crafts", civ: "sparta", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
  skiritai: { domain: "land", movement: 3, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1, requiresTech: "krypteia", civ: "sparta", category: "infantry", upgradesFrom: "warrior" },
  "companion-cavalry": { domain: "land", movement: 3, attack: 25, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "hetairoi", civ: "macedon", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
  hypaspist: { domain: "land", movement: 3, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "royal-pages", civ: "macedon", category: "infantry", counters: { ranged: 0.3 }, upgradesFrom: "swordsman" },
  sparabara: { domain: "land", movement: 2, attack: 16, defense: 14, maxHp: 18, range: 2, upkeep: 1, requiresTech: "archer-corps", civ: "persia", category: "ranged", upgradesFrom: "archer" },
  "scythed-chariot": { domain: "land", movement: 3, attack: 25, defense: 12, maxHp: 22, range: 1, upkeep: 2, mounted: true, requiresTech: "engineering", civ: "persia", category: "mounted", counters: { ranged: 0.5 }, upgradesFrom: "horseman" },
  "han-cavalry": { domain: "land", movement: 3, attack: 23, defense: 15, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "heavenly-horses", civ: "han", category: "mounted", counters: { mounted: 0.3 }, upgradesFrom: "horseman" },
  "ji-halberdier": { domain: "land", movement: 2, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "iron-salt-monopoly", civ: "han", category: "infantry", counters: { mounted: 0.3 }, upgradesFrom: "swordsman" },
  "armoured-elephant": { domain: "land", movement: 2, attack: 35, defense: 24, maxHp: 34, range: 1, upkeep: 2, requiresTech: "elephant-corps", civ: "maurya", category: "heavy", counters: { infantry: 0.4, ranged: 0.3 }, upgradesFrom: "war-elephant" },
  "indian-longbow": { domain: "land", movement: 2, attack: 18, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "archery", civ: "maurya", category: "ranged", upgradesFrom: "archer" },
  "kshatriya-chariot": { domain: "land", movement: 3, attack: 24, defense: 16, maxHp: 22, range: 1, upkeep: 2, mounted: true, requiresTech: "imperial-army-scale", civ: "maurya", category: "mounted", counters: { ranged: 0.5, infantry: 0.2 }, upgradesFrom: "horseman" },
  "steppe-archer": { domain: "land", movement: 4, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 2, mounted: true, requiresTech: "recurve-mastery", civ: "scythia", category: "ranged", upgradesFrom: "archer" },
  "royal-scythian": { domain: "land", movement: 3, attack: 23, defense: 16, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "kurgan-rites", civ: "scythia", category: "heavy", counters: { ranged: 0.4 }, upgradesFrom: "horseman" },
  "amazon-rider": { domain: "land", movement: 4, attack: 23, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "warrior-women", civ: "scythia", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" }
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
  /** Civ id this building is unique to — only that people may raise it. */
  civ?: string;
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
  },
  // Rome-only (v2 Via Romana branch): unlocked by The Senate (res-publica), the
  // civic square. Its stability yield is STUBBED as gold until the stat ships.
  forum: {
    name: "Forum",
    cost: 16,
    requiresTech: "res-publica",
    yields: { gold: 2 },
    note: "Market, court and rostra in one square — the civic engine of a Roman town. Effect: +2 gold (Forums research adds more)."
  },
  // Britons — the Nemeton: a sacred grove of the druids (§4.1 unique building).
  nemeton: {
    name: "Nemeton",
    cost: 16,
    civ: "britons",
    requiresTech: "druidic-lore",
    yields: { science: 2 },
    note: "A sacred grove where the druids kept the lore of the tribe — no roof but the oak canopy. Effect: +2 science."
  },
  // Kush — the Iron Furnaces of Meroë (§4.1 unique building).
  "iron-furnaces": {
    name: "Iron Furnaces of Meroë",
    cost: 18,
    civ: "kush",
    requiresTech: "meroitic-iron",
    yields: { production: 2 },
    note: "Meroë smelted iron on a scale that earned it the name 'the Birmingham of Africa'. Effect: +2 production."
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
  /** If set, the tile must hold one of these resource deposits to build it. */
  requiresResource?: string[];
  note: string;
}

export const IMPROVEMENTS: Record<string, ImprovementRule> = {
  farm: {
    name: "Farm",
    terrains: ["plains", "valley"],
    cost: 10,
    yields: { food: 2 },
    requiresTech: "irrigation",
    note: "Ditched fields and irrigation — the centuriated farmland of Italy, the flood-fed plots of the Nile. Effect: +2 food. (Needs Irrigation.)"
  },
  pasture: {
    name: "Pasture",
    terrains: ["plains", "valley", "hills"],
    cost: 10,
    yields: { food: 1, production: 1 },
    requiresTech: "animal-husbandry",
    note: "Herds of cattle, sheep and horses on open range — hides, wool and remounts. Effect: +1 food, +1 labour. (Needs Animal Husbandry.)"
  },
  mine: {
    name: "Mine",
    terrains: ["hills", "mountains"],
    cost: 12,
    yields: { production: 2 },
    requiresResource: ["iron", "silver"],
    note: "Shafts and galleries after silver, iron and copper — Laurion, Rio Tinto, the Noric iron. Effect: +2 labour. (Needs an iron or silver deposit.)"
  },
  "lumber-camp": {
    name: "Lumber Camp",
    terrains: ["forest"],
    cost: 10,
    yields: { production: 1, gold: 1 },
    requiresTech: "bronze-working",
    note: "Timber for ships, siege engines and building — the forests of Gaul and Germania. Effect: +1 labour, +1 gold. (Needs Bronze Working for the tools.)"
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
    requiresResource: ["stone"],
    note: "Cut stone and marble for walls, roads and monuments — the travertine of Tibur, the marble of Paros. Effect: +2 labour, +1 gold. (Needs a stone deposit and Metallurgy.)"
  },
  vineyard: {
    name: "Vineyard",
    terrains: ["plains", "hills"],
    cost: 10,
    yields: { food: 1, gold: 2 },
    requiresTech: "pottery",
    note: "Terraced vines and olive groves — the wine and oil that were the classical world's cash crops. Effect: +1 food, +2 gold. (Needs Pottery for the amphorae.)"
  },
  fishery: {
    name: "Fishery",
    terrains: ["coast"],
    cost: 10,
    yields: { food: 2 },
    requiresTech: "sailing",
    requiresResource: ["fish"],
    note: "Nets, weirs and tunny-traps worked over a shoal. Effect: +2 food. (Needs a fish deposit and Sailing.)"
  },
  harbour: {
    name: "Harbour",
    terrains: ["coast"],
    cost: 14,
    yields: { food: 1, gold: 2 },
    requiresTech: "sailing",
    note: "A quay and moorings on a coastal hex beside a city — its troops can put to sea from here. Effect: +1 food, +2 gold, and lets armies embark. (Needs Sailing.)"
  }
};

// Strategic resource deposits scattered on the map. A city works the deposits in
// its territory for the listed bonus yields each turn (on top of the terrain and
// any improvement). The classical trade goods — grain, timber, iron, stone, the
// silver of Laurion, the wine and horses that made and moved empires.
export interface ResourceRule {
  name: string;
  glyph: string;
  /** Terrains this deposit can appear on. */
  terrains: string[];
  yields: { food?: number; production?: number; gold?: number; science?: number };
  note: string;
}

export const RESOURCES: Record<string, ResourceRule> = {
  grain: {
    name: "Grain", glyph: "🌾", terrains: ["plains", "valley"], yields: { food: 2 },
    note: "The wheat of Egypt, Sicily and the Black Sea that fed whole cities. Effect: +2 food."
  },
  fish: {
    name: "Fish", glyph: "🐟", terrains: ["coast"], yields: { food: 1, gold: 1 },
    note: "Tunny runs and salt-fish (garum) traded the length of the Mediterranean. Effect: +1 food, +1 gold."
  },
  coral: {
    name: "Coral", glyph: "🪸", terrains: ["coast"], yields: { gold: 2 },
    note: "Red coral and murex purple gathered off the shore — a luxury of the ancient sea trade. Effect: +2 gold."
  },
  timber: {
    name: "Timber", glyph: "🪵", terrains: ["forest"], yields: { production: 2 },
    note: "Ship-timber and building wood from the forests of Gaul, Macedon and Latium. Effect: +2 labour."
  },
  iron: {
    name: "Iron", glyph: "⛏️", terrains: ["hills", "mountains"], yields: { production: 2 },
    note: "The Noric iron and Spanish mines that armed the legions. Effect: +2 labour."
  },
  stone: {
    name: "Stone", glyph: "🪨", terrains: ["hills", "mountains"], yields: { production: 1, gold: 1 },
    note: "Marble and travertine for temples, walls and roads. Effect: +1 labour, +1 gold."
  },
  horses: {
    name: "Horses", glyph: "🐎", terrains: ["plains", "valley"], yields: { production: 1, gold: 1 },
    note: "The horse-runs of Thessaly, Numidia and the steppe — remounts for cavalry. Effect: +1 labour, +1 gold."
  },
  wine: {
    name: "Wine", glyph: "🍇", terrains: ["hills", "plains"], yields: { gold: 2 },
    note: "Vines and olive groves — the amphorae of Chios, Falernum and Baetica. Effect: +2 gold."
  },
  silver: {
    name: "Silver", glyph: "🪙", terrains: ["hills", "mountains", "desert"], yields: { gold: 2 },
    note: "The silver of Laurion and the Spanish sierras that struck the coin of empires. Effect: +2 gold."
  }
};

// Controlling a deposit of the mapped resource in your territory makes the build
// cheaper (BUILD_DISCOUNT off its labour cost). Thematic: timber for hulls & siege
// engines, iron for metal-armed foot, horses for cavalry, stone for fortification.
export const BUILD_DISCOUNT = 0.7; // 30% off when you hold the resource
export const BUILD_RESOURCE: Record<string, string> = {
  trireme: "timber",
  siege: "timber",
  swordsman: "iron",
  spearman: "iron",
  hoplite: "iron",
  legionary: "iron",
  gaesatae: "iron",
  barracks: "iron",
  horseman: "horses",
  "war-chariot": "horses",
  "horse-archer": "horses",
  // War elephants ate enormous fodder — a grain surplus sustains the beasts, and
  // it gives Carthage's signature unit the same discount parity as other elites.
  "war-elephant": "grain",
  walls: "stone"
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
  siege: "siege",
  support: "support"
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
  explorer: 14,
  // Civ-unique units — costlier than their generic cousins, worth every labourer.
  legionary: 26,
  hoplite: 22,
  "war-elephant": 24,
  "war-chariot": 24,
  "chariot-isles": 22,
  "meroe-archer": 20,
  gaesatae: 20,
  "horse-archer": 24,
  // v2 branch units
  cataphract: 28,
  spartiate: 26,
  phalangite: 24,
  immortal: 22,
  crossbowman: 22,
  // v2 unique-unit roster
  velites: 12, praetorian: 34, "sacred-band": 22, "numidian-cavalry": 20,
  peltast: 16, "athenian-trireme": 26, "nubian-archer": 18, machimoi: 14,
  "noble-horse": 24, soldurii: 24, "camel-train": 16, "perioikoi-hoplite": 16,
  skiritai: 16, "companion-cavalry": 26, hypaspist: 24, sparabara: 18,
  "scythed-chariot": 26, "han-cavalry": 22, "ji-halberdier": 24, "armoured-elephant": 30,
  "indian-longbow": 18, "kshatriya-chariot": 24, "steppe-archer": 20, "royal-scythian": 24, "amazon-rider": 20
};

// ===== Cities v3 §6 — merge the wave-2 addendum (units-v2-addendum.js): 24 uniques
// (2 per civ → 5 each, 60 total). Stats are DERIVED from basedOn + numeric mods; the
// `special` behaviours are STUBBED (base stats + civ gate only) and the silhouette
// specs (UNIT_SILHOUETTES_WAVE2) are recorded there for the modelers. cap → buildCap.
const BASE_ALIAS: Record<string, string> = { "war-galley": "trireme", "siege-ballista": "siege" };
for (const u of UNIQUE_UNITS_WAVE2) {
  const base = UNITS[BASE_ALIAS[u.basedOn] ?? u.basedOn] ?? UNITS.warrior;
  const m = u.mods;
  const n = (k: string): number => (typeof m[k] === "number" ? (m[k] as number) : 0);
  const rule: UnitRule = {
    domain: base.domain,
    movement: Math.max(1, base.movement + n("move")),
    attack: m.noAttack ? 0 : Math.max(0, base.attack + n("atk")),
    defense: base.defense + n("def"),
    maxHp: base.maxHp + n("maxHp"),
    range: base.range,
    upkeep: base.upkeep,
    category: u.cat,
    requiresTech: u.unlockedBy,
    civ: u.civ
  };
  if (m.mounted === true || base.mounted) rule.mounted = true;
  if (base.counters) rule.counters = base.counters;
  if (m.cap === "max-1") rule.buildCap = 1;
  else if (m.cap === "max-2") rule.buildCap = 2;
  UNITS[u.id] = rule;
  const baseCost = UNIT_BUILD_COSTS[BASE_ALIAS[u.basedOn] ?? u.basedOn] ?? 24;
  UNIT_BUILD_COSTS[u.id] = Math.max(8, Math.round((baseCost + n("cost")) * (m.cheap ? 0.75 : 1)));
}
