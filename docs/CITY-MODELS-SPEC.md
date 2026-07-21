# HEGEMON — City & District Models Spec

Companion to TERRAIN-RELIEF-SPEC / WATER-SPEC. Covers the city/district model
integration and the standard that makes a city + its districts read as one place.

## 7b. City–district cohesion (the seven-hex organism)
Footprint standard change (supersedes earlier circular guidance): flat HEXAGONAL
bases with a thin mosaic-tile rim, for all city levels and all district models
alike — shared rim treatment mandatory, one family. Hex bases meet flush along
shared edges, letting a city and a built district fuse into continuous urban
mass. Cohesion mechanisms, all engine-side:
1. Connecting streets: when a district is built, draw a paved street ribbon
   (road decal system) from the city base edge to the district across the hex
   boundary; dress with sparse auto-props (wayside shrine, cart, arcade stub)
   from a small street-prop set.
2. Urban skirt: tiles hosting a district (and the street corridor) swap their
   scatter table to peri-urban props — market garden rows, a paddock, amphora
   stacks, olive/orchard rows — replacing wild grass and rocks.
3. Material & level inheritance: district models use the city's material tier
   (timber → stone → marble accents) and palette; districts visually upgrade
   when the city levels (per-tier variants or a material swap).
4. Orientation on placement: rotate each district to face the city (entrance/
   gate toward the city edge; harbors: quay to water, gate to town). City
   models with directional features (aqueduct edge) are oriented so that edge
   faces the road/district it feeds.
5. Walls scope (later): the wall ring embraces the city core; districts sit
   outside the gates (historically exact); wall gate aligns to the busiest
   street.
Import script update: hexagonal footprint normalization — flat-to-flat width
maps to ~92% of cell width; enforce a flat thin base (strip irregular or thick
generated bases below ground level and seat the model on the standard
procedural hex slab with mosaic rim); preserve building content untouched.
Acceptance: screenshot a city with two built districts + connecting streets at
gameplay zoom — it must read as "one city with quarters," not "three models
near each other"; hex bases flush at shared edges, no terrain sliver between.

## City model integration — ROME ONLY (for now)
The five Rome city levels (hexagonal-base versions) are approved and arrive as
GLBs on a rolling basis — some may already be in raw. These are exclusively for
civ Rome: every other civ keeps the procedural city rendering unchanged. The
mechanism may be capable of per-civ sets later, but only Rome is wired now.

- Canonical keys: `city/rome-l1` … `city/rome-l5`, mapped to Rome city levels
  1–5. Match raw files by name (`Meshy_AI_*Rome*` / `*City*Level*`); latest-
  version rule applies; these files participate in refresh-assets like all
  others.
- On import, per §7b: strip irregular/thick generated bases below ground level
  and seat buildings on the standard procedural hex slab with mosaic rim;
  normalize flat-to-flat to ~92% of cell width; height bands L1–L3 low, L4–L5
  tall; orient the L4/L5 aqueduct edge toward the strongest road/district
  connection (default: nearest road edge).
- Wiring: renderer consumes `city/rome-<level>` from the manifest for Rome's
  cities; all other civs procedural, untouched. Partial set is fine — promoted
  models where they exist, procedural for missing levels; do not block on the
  full set.
- Level-up moment (Rome only): swap models through a brief dust/scaffold fade
  transition, not an instant pop.
- Checkpoint: once L1, L3, and L5 are live, screenshot the same Rome city at
  those three levels on terrain at gameplay zoom. Acceptance: half-second
  readability (sparse thatch → temple town → marble-crowned) + §7b flush-edge
  check against one adjacent district placeholder.
