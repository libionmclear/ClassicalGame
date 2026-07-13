// Type surface for the procedural city generator (implementation in
// cityModels.js — takes THREE by injection so it needs no import of its own).
// Design of record: HEGEMON-VISUALS-v2.md §1.
export interface BuildCityOpts {
  /** 1..10 (Hamlet → Wonder of the age). */
  tier?: number;
  /** Architectural style / civ id: rome, carthage, greece, egypt, gaul, parthia,
   *  sparta, macedon, persia, han, maurya, scythia. */
  style?: string;
  /** Deterministic seed (from hex coords) so a city keeps its look. */
  seed?: number;
  /** Player accent colour for the tier-5+ banner. */
  accent?: string | number;
}
// Returns a THREE.Group (typed loosely to avoid coupling to the THREE build).
export function buildCity(THREE: unknown, opts?: BuildCityOpts): unknown;

// Shared low-poly primitives + the 12-style palette table, reused by
// districtModels.js. Typed loosely (they take THREE by injection).
export const STYLES: Record<string, any>;
export function mulberry32(seed: number): () => number;
export function jitterColor(THREE: unknown, hex: number, rng: () => number, amt: number): unknown;
export function prism(THREE: unknown, w: number, h: number, d: number): unknown;
export function colonnade(THREE: unknown, S: any, mat: (hex: number, j?: number) => unknown, w: number, d: number, colH: number, nx: number, nz: number): unknown;
export function classicalTemple(THREE: unknown, S: any, mat: (hex: number, j?: number) => unknown, scale?: number): unknown;
