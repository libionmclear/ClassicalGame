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
