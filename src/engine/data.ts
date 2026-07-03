import type { TechRule, TerrainRule, UnitRule } from "./types";

export const TERRAIN: Record<string, TerrainRule> = {
  plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
  valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
  forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
  hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
  mountains: { moveCost: 3, yields: { food: 0, production: 1, gold: 0 }, defense: 0.5, vision: 0, impassableWithoutTech: "mountain-paths" },
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
  }
};

export const UNITS: Record<string, UnitRule> = {
  warrior: { domain: "land", movement: 2, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1 },
  archer: { domain: "land", movement: 2, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1 },
  spearman: { domain: "land", movement: 2, attack: 15, defense: 22, maxHp: 20, range: 1, upkeep: 1, requiresTech: "bronze-working", bonusVsMounted: 0.5 },
  swordsman: { domain: "land", movement: 2, attack: 27, defense: 20, maxHp: 22, range: 1, upkeep: 2, requiresTech: "iron-working" },
  horseman: { domain: "land", movement: 3, attack: 22, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "horseback-riding" },
  siege: { domain: "land", movement: 1, attack: 12, defense: 8, maxHp: 16, range: 2, upkeep: 2, requiresTech: "siegecraft", siegeBonus: 1.2 },
  trireme: { domain: "naval", movement: 3, attack: 24, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "open-sea-sailing" },
  merchant: { domain: "civilian", movement: 2, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1 },
  settler: { domain: "civilian", movement: 2, attack: 0, defense: 6, maxHp: 12, range: 0, upkeep: 1 }
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
  settler: 18
};
