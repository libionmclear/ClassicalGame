# HEGEMON — Visuals & Systems v2 (cities, units, stability, card art)

> Companion files: `cityModels.js` (tested: all 120 style×tier combos build
> clean headlessly), `units-v2.js` (36 unique units, 3 per civ).

## 1. Cities: 10 tiers, 12 architectural styles

### Engine side
Current city tiers expand to 10. Suggested population thresholds (banked-food
growth unchanged): 1, 3, 6, 10, 15, 21, 28, 36, 45, 55 pop.

| Tier | Name | Visual milestone |
|---|---|---|
| 1 | Hamlet | 3 houses on a dirt plaza |
| 2 | Village | 5 houses |
| 3 | Town | shrine appears |
| 4 | Walled town | **walls + gate + towers** (Scythia: wagon ring; Sparta: no walls) |
| 5 | Market town | banner in player color at the gate |
| 6 | City | **monumental centre** (temple / cothon / apadana / stupa / watchtower…) |
| 7 | Great city | taller walls, more towers, denser quarters |
| 8 | Metropolis | **civ landmark** (amphitheatre, Persepolis gate, kurgan field…) — Sparta finally walls itself, historically late, historically true |
| 9 | Imperial city | full skyline, max density |
| 10 | Wonder of the age | gilded accents on monument + landmark |

### Why the old cities looked ugly, and what the new generator does
1. **Flat shading everywhere** — smooth normals on tiny low-poly boxes smear
   into mush; hard facets read crisply at board distance.
2. **Roof ≠ wall material** — the single biggest readability win. Warm roofs
   over pale walls make a 20px building look like a building.
3. **Jitter** — every house gets hue/size/rotation variation from the seeded
   RNG. Identical clones scream "programmer art."
4. **Clustered layout with lanes** — houses group radially around a plaza with
   visible street gaps, instead of a uniform scatter.
5. **Silhouette anchor** — from tier 6 there is always one tall thing (the
   monument) so the city has a skyline, not a rash.
6. **Walls that mean something** — a real ring with a gate gap and capped
   towers, plus two civ exceptions that double as history lessons: Sparta
   builds no walls until tier 8, Scythia circles its wagons instead.

### Per-civ architectural identity (all procedural, zero assets)
Rome red-tile gables, amphitheatre ring · Carthage flat white roofs, the round
Cothon war-harbour with island HQ · Athens marble temple + stepped theatre ·
Egypt obelisks, pylon gates, golden pyramidions · Gaul thatch cones, great
roundhouse, hilltop oppidum keep · Parthia mudbrick, iwan arch, dome ·
Sparta austere stoa, warrior column with red crest · Macedon palace + the
Vergina tumulus · Persia apadana column grid, Gate-of-Nations landmark ·
Han lifted double eaves, tiered watchtower, palace on terrace · Maurya Ashokan
pillar, stupa with chattra spire, Pataliputra pillared hall · Scythia yurts,
stag standard, royal kurgan field.

### Integration notes (board3d.ts)
- Replace the existing city builder with `buildCity(THREE,{tier,style,seed,accent})`;
  scale the returned group to hex size exactly as before; seed from hex coords
  so a city keeps its look across sessions.
- Mesh counts run ~7 (t1) to ~170 (t10, Scythia worst case). Fine for six civs'
  worth of cities; if huge maps strain, merge each city's static meshes with
  `BufferGeometryUtils.mergeGeometries` per material — the generator groups
  cleanly for it.
- `gallery.html` should add a city row: 12 styles × tier slider 1–10. That is
  also the fastest way to art-direct tweaks.

## 2. Units: silhouette-first rendering rules

The 36 unique units (units-v2.js) each carry a one-line silhouette spec in
`UNIT_SILHOUETTES`. Rendering principles for board3d unit models:

1. **Silhouette over detail.** At board zoom a unit is ~40px. Identity must
   survive as a dark outline: the phalangite's 45° pike, the sparabara's huge
   pavise, the crossbow held horizontal, the elephant's howdah box.
2. **One exaggerated prop per unit** — 1.5× real proportions. A readable lie
   beats an invisible truth.
3. **Shared body rigs, three sizes:** infantry rig, mounted rig (horse +
   rider), large rig (elephant/chariot). Unique units are prop + palette
   variations on rigs — cheap to add, consistent to read.
4. **Civ accent placement is fixed:** shield face for infantry, saddle blanket
   for mounted, howdah/hull banner for large/naval. The eye learns one place
   to look for ownership.
5. **Elite tell:** vet units already have marks; elites (praetorian, spartiate,
   sacred band, immortal) also get a crest/plume in a fixed slot.
6. **Pose beats polycount:** slight forward lean for attackers, square stance
   for spears, twisted torso for the steppe archer's backward shot. Rotate the
   existing procedural limbs; add no geometry.

## 3. Stability — minimal spec (the stat cards & techs assume)

Per-city integer, default 0, clamped −5..+5.
- **Sources:** techs/cards/edicts (declared), buildings (temple +1,
  amphitheater +1), garrison unit in city +1, war weariness −1 per 15 turns at
  war, recently captured −2 (decays 1/turn), starving −2.
- **Effects:** each point = +/−2% to all city yields; at −3 unrest event risk
  each turn (production halts 1 turn); at −5 city may revolt (spawns rebels) —
  reuse the Crossroads event plumbing; at +3 city gains +1 labour (civic pride).
- **UI:** small laurel icon on the city panel, green/grey/red.
- Phase 1 can ship sources+yield effect only; unrest/revolt in phase 2.

## 4. Card art — style bible + prompt template

Consistent look across 68 Legends + civ/edict/event cards, generated in any
image model, dropped into the existing art slot:

**Style bible:** painted classical realism with a fresco undertone; muted
mineral palette (ochre, terracotta, verdigris, lapis) + one civ accent; bust-
to-waist portrait, 3/4 view, eyes off-camera; single warm key light, dark
neutral background with faint civ motif (Rome: column fragment; Han: cloud
scroll; Scythia: stag gold); no text, no borders (the card frame supplies
those); square 1:1, consistent head scale across all cards.

**Prompt template:**
"Painted portrait, classical fresco realism, [PERSON: one-line visual identity
— age, dress, one signature object], [CIV PALETTE + motif], bust to waist,
three-quarter view, warm single-source light, dark muted background, museum
quality, no text, no border, square"

Example — Surena: "…a proud Parthian noble in his 30s, scale cuirass over
silk, composite bow in hand, long groomed hair, [palette: burnt orange +
steppe gold, faint horse-and-arrow motif]…"

Rarity treatment lives in the FRAME (game.js card renderer), not the art:
common = stone frame, rare = bronze, epic = silver + laurel corners,
legendary = gold + inner glow. One art commission works for all rarities.

## 5. Reminder — files pending repo drop (this session)

1. HEGEMON-CIVS-CARDS-v2.md → docs/
2. cards-data-v2.js (or the .txt copy, rename on move) → src/
3. HEGEMON-TECHTREE-v2.md → docs/
4. techs-v2.js → src/
5. HEGEMON-VISUALS-v2.md (this file) → docs/
6. units-v2.js → src/
7. cityModels.js → src/render3d/ (integrate per §1)

Suggested Claude Code order: cards migration → tech tree data → units →
cityModels swap → stability phase 1. Update PROJECT-MEMORY.md §5/§8 after each.
