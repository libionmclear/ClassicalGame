// Type surface for units-v2-addendum.js (wave-2 unique units, 2 per civ = 24).
export interface Wave2Unit {
  id: string; civ: string; cat: string; basedOn: string; unlockedBy: string; age: number;
  mods: Record<string, number | boolean | string>;
  role: string; note: string;
}
export const UNIQUE_UNITS_WAVE2: Wave2Unit[];
export const UNIT_SILHOUETTES_WAVE2: Record<string, string>;
