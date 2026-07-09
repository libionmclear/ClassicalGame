// Type surface for the declarative district / Great Works data (implementation in
// districts-data-v2.js). Design of record: HEGEMON-CITY-DISTRICTS-v2.md.
export interface RecruitmentConst {
  militaryPopCost: number; minCityPopToTrain: number; settlerPopCost: number;
  civilianPopCost: number; mercenaryPopCost: number;
  mercenaryDisbandReturns: boolean; disbandProratedByHP: boolean; deathReturns: number;
}
export const RECRUITMENT: RecruitmentConst;
export const DISTRICT_SLOTS_BY_TIER: Record<number, number>;

export interface DistrictType {
  id: string;
  effect: {
    cityYield?: Record<string, number>;
    popCapPlus?: number; growthPct?: number; trainFasterPct?: number; cityDefPlus?: number;
    special?: string;
  };
  requires?: string; // e.g. "coast"
  limit?: string;    // e.g. "one-per-city"
}
export const DISTRICT_TYPES: DistrictType[];

export interface DistrictName { n: string; bonus?: Record<string, number | string>; forbidden?: boolean; }
export const DISTRICT_NAMES: Record<string, Record<string, DistrictName>>;

export interface GreatWork {
  id: string; civ: string | null; name: string; rarity: string;
  kind: "built" | "heritage"; sevenWonders?: boolean; note?: string;
  effect: {
    cityYield?: Record<string, number>; empire?: Record<string, number | string>;
    capitalYield?: Record<string, number>; special?: string;
  };
}
export const GREAT_WORKS: GreatWork[];
