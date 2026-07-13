// Type surface for the procedural district generator (implementation in
// districtModels.js — takes THREE by injection so it needs no import of its own).
// Design of record: HEGEMON-CITY-DISTRICTS-v2.md §5.
export interface BuildDistrictOpts {
  /** District type id: civic, market, affluent, crammed, aqueduct, barracks,
   *  harbour, leisure, temple, greatwork. */
  type?: string;
  /** Architectural style / civ id (same 12 as cityModels). */
  style?: string;
  /** Deterministic seed (from hex coords) so a district keeps its look. */
  seed?: number;
  /** Player accent colour for banners / wonder standards. */
  accent?: string | number;
  /** Burnt state — blackened materials + smoke columns. */
  pillaged?: boolean;
  /** Great Work card id when type === "greatwork" (selects a bespoke model). */
  work?: string;
}
// Returns a THREE.Group (typed loosely to avoid coupling to the THREE build).
export function buildDistrict(THREE: unknown, opts?: BuildDistrictOpts): unknown;
