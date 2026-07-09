// Cities v3 §2 — district system helpers. Bridges the declarative data
// (districts-data-v2.js) into the engine.
import { DISTRICT_TYPES, DISTRICT_SLOTS_BY_TIER, DISTRICT_NAMES } from "../districts-data-v2.js";
import type { DistrictType, DistrictName } from "../districts-data-v2.js";
import type { City } from "./types";

// City tier 1..10 from population (Phase 4 thresholds), then district slots by tier.
const CITY_TIER_POP = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
export function cityTier(pop: number): number {
  let t = 1;
  for (let i = 0; i < CITY_TIER_POP.length; i += 1) if (pop >= CITY_TIER_POP[i]) t = i + 1;
  return t;
}
export function districtSlots(city: City): number {
  const tier = cityTier(city.population);
  let slots = 0;
  for (const k of Object.keys(DISTRICT_SLOTS_BY_TIER)) if (tier >= Number(k)) slots = Math.max(slots, DISTRICT_SLOTS_BY_TIER[Number(k)]);
  return slots;
}

const DTYPE: Record<string, DistrictType> = {};
for (const d of DISTRICT_TYPES) DTYPE[d.id] = d;
export function districtType(id: string): DistrictType | undefined { return DTYPE[id]; }
export function districtName(typeId: string, civ: string): DistrictName | undefined {
  const row = DISTRICT_NAMES[typeId];
  return row ? row[String(civ || "").toLowerCase()] : undefined;
}
export function districtForbidden(typeId: string, civ: string): boolean {
  const n = districtName(typeId, civ);
  return !!(n && n.forbidden);
}
export { DISTRICT_TYPES, DISTRICT_SLOTS_BY_TIER };
