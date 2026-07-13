# HEGEMON — Cities v3: Population, Districts & Great Works (Design of Record)

> Companion data: `districts-data-v2.js`, `units-v2-addendum.js`.
> Extends cities from one hex to a living urban area across the 6 adjacent
> hexes, and ties the military to population — the classical reality that
> armies were citizens.

## 1. Population-based recruitment

- **Training any military unit costs 1 population** from the producing city.
  A city cannot train below pop 2 (a city of 1 defends, it doesn't recruit).
- **Mercenaries** (instant gold purchase — existing mechanic, Carthage's
  Mercenary levies discount applies): **no pop cost**. But mercenaries return
  nothing on disband — hired men go home, not to your city.
- **Settlers cost 1 pop** (they ARE people leaving).
- **Civilian units (engineer, merchant): no pop cost.** They are drawn from
  and belong to the city; when idle in their home city they "reside" (small
  icon on city panel), and disbanding simply reabsorbs them (no yield).
- **Disband (citizen military):** the unit returns to its HOME city's
  population, **prorated by health**: `returned = HP/maxHP` — full point of
  pop at 100%, otherwise the fraction credits the city's banked food
  (`fraction × foodPerPop`). Units store `homeCityId` at training; if the home
  city is lost, reassign to the nearest own city (the survivors resettle).
- **Death returns nothing.** War now visibly empties cities — historically
  honest, and it makes Persia's Immortal refund and Rome's Marian professional
  army read as the innovations they were.
- Balance note: this is a real economy nerf to warmongering; pairs with
  stability. AI must weight pop cost in its build planner.

## 2. Districts — the city grows across its 6 adjacent hexes

**Province vs city:** territory/borders keep growing as before (farms,
vineyards, mines = the province). The 6 hexes ADJACENT to the city centre are
the potential **urban ring**: each can be developed into one district.

- **Slots by city tier:** T2→1, T4→2, T5→3, T6→4, T8→5, T10→6.
- A district replaces the tile's improvement and yields; it can be pillaged
  (burnt state, repair with labour) but not destroyed.
- Placement rules: hex must be owned land (Harbour: coast hex; Aqueduct: hills
  or river-adjacent preferred — +1 bonus there).
- **District types (10) vs 6 slots = permanent choice pressure.** No city has
  everything; cities specialise, which is the differentiation engine.

| Type | Base effect | Notes |
|---|---|---|
| CIVIC | +1 stability, +1 gold; unlocks 1 extra edict-like city policy later | the Senate/Agora slot |
| MARKET | +2 gold, +1 trade-route capacity | |
| AFFLUENT HOUSING | +2 gold, +1 stability, −0 pop | villas of the rich |
| CRAMMED HOUSING | +2 pop cap, +25% growth, −1 stability | Rome's insulae, exactly |
| AQUEDUCT | +2 food, +1 pop cap; +1 food if hills/river | |
| BARRACKS | units train 25% faster, spawn vet1; +1 city defense | |
| HARBOUR | +2 gold, +1 food, naval units buildable/repair 2× | coast only |
| LEISURE (baths/games) | +2 stability | the crowd stays happy |
| TEMPLE PRECINCT | +1 science, +1 stability; boosted by faith techs | absorbs temple-line growth |
| GREAT WORK | slot for a card-unlocked wonder (§4) | one per city |

## 3. Per-civ district flavour (same output, their own names)

Names change, numbers don't — except UNIQUE entries (bold), which add a small
extra effect and are that civ's postcard district.

- **CIVIC** — Rome **Forum & Curia** (unique: +1 extra gold — the Senate card
  synergy) · Athens **Agora & Pnyx** (unique: +1 science) · Egypt Vizier's
  Hall · Carthage Hall of the Hundred · Gaul Assembly Grove · Parthia Court of
  the King's Kin · Sparta Gerousia · Macedon Royal Court · Persia Satrap's
  Palace · Han **Yamen** (unique: +1 stability — the bureaucracy) · Maurya
  Sabha Hall · Scythia Chieftain's Circle
- **MARKET** — Rome Macellum · Athens Emporion · Carthage **Great Emporium**
  (unique: +1 trade route) · Egypt River Bazaar · Han Market Ward (shi) ·
  Persia Bazaar · Maurya Pana Market · Scythia Trading Camp · others: Market
- **CRAMMED HOUSING** — Rome **Insulae** (unique: +1 extra pop cap) · Athens
  Synoikiai · Egypt Mudbrick Quarter · Han Courtyard Tenements · default:
  Tenement Quarter
- **AFFLUENT HOUSING** — Rome Domus Quarter · Athens Villa District · Persia
  **Paradeisos Estates** (unique: +1 stability) · Han Noble Compounds ·
  default: Villa Quarter
- **AQUEDUCT** — Rome **Aqueduct** (unique: +1 extra food; pairs with Imperial
  aqueducts tech) · Persia **Qanat Works** (works on desert) · Maurya
  Stepwell Tanks · Egypt Canal Basin · Gaul Sacred Spring · Han Well & Sluice
  Works · default: Waterworks
- **BARRACKS** — Rome Castra · Sparta **Agoge Grounds** (unique: melee vet2) ·
  Macedon Drill Field · Han Garrison · Scythia Remount Corral (mounted only,
  −15% mounted cost) · default: Barracks
- **HARBOUR** — Carthage **The Cothon** (unique: naval −20% cost) · Athens
  Piraeus Docks · Rome Portus · Egypt Nile Quays (works on major river) ·
  Han Canal Port · default: Harbour
- **LEISURE** — Rome **Thermae** (baths; unique: +1 gold) · Athens Gymnasion ·
  Greek civs Theatre · Han Bathhouse & Teahouse · Scythia Feast Grounds ·
  default: Bathhouse
- **TEMPLE PRECINCT** — Egypt **Temple Estate** (unique: +1 gold — the god as
  landlord) · Rome Capitoline Precinct · Athens Acropolis Sanctuary · Maurya
  Stupa Precinct · Gaul Nemeton · Persia Fire Temple · default: Sanctuary

## 4. Great Works (card-unlocked wonders in the GREAT WORK district)

Drawn from packs like Legends (epic/legendary), one Great Work per city, must
match your civ. Two kinds:
- **BUILT** — you construct it (labour cost, several turns): the city visibly
  gains the monument.
- **HERITAGE** — monuments older than the era (Pyramids, Stonehenge): the card
  lets you RESTORE/claim one in your territory instantly; historically honest
  and a nice fast-play alternative.

| Civ | Great Works (effect sketch) |
|---|---|
| Rome | **Colosseum** (L, built: +3 stability city, +1 all cities), **Trajan's Column** (E: +25% unit veterancy rate empire), Circus Maximus (E: +2 gold +1 stability) |
| Athens | **Parthenon** (L: +2 science +2 stability; wonders visible to all — prestige), Theatre of Dionysus (E: +2 stability, events give +1 reward) |
| Egypt | **Pyramids & Sphinx** (L, HERITAGE: capital +2 all yields), Karnak Complex (E: temples +1 sci +1 gold empire) |
| Carthage | **Great Cothon** (L: harbour city naval −25%, repair 3×), Temple of Eshmun (E: +2 stability, heal +1 city garrison) |
| Gaul | **Sanctuary of the Carnutes** (L: +1 science all cities — the druid synod), Great Oppidum Walls (E: +50% wall HP empire) |
| Parthia | **Palace of Nisa** (L: +2 gold +1 stability, mounted −10% empire), Fire Sanctuary of Adur (E: +2 stability) |
| Sparta | **Sanctuary of Artemis Orthia** (E: melee spawn vet1 this city — stacks Agoge), Menelaion (E: +2 stability) |
| Macedon | **Palace of Aigai** (L: +1 gold/city empire, Companions +10%), Tomb of the Kings (E: +2 stability, veterancy +25%) |
| Persia | **Apadana of Persepolis** (L: +1 gold per foreign civ known), Behistun Relief (E: +2 stability, see rival capitals) |
| Han | **Weiyang Palace** (L: +1 science +1 gold all cities), Great Wall Segment (E: +50% defense on your border hexes this city) |
| Maurya | **Sanchi Great Stupa** (L: +2 stability all cities), Pillar of Ashoka (E, semi-heritage: instant, +2 stability city, +1 sci) |
| Scythia | **Royal Kurgan** (L, built: on unit death near it, refund 25% cost — the ancestors watch), Golden Pectoral Hoard (E: +3 gold capital) |
| Britannia (wave 3) | **Stonehenge** (L, HERITAGE: +2 science, events favourable) |

## 5. Visuals — the payoff

The city finally LOOKS like it grows: centre hex (cityModels.js, tiers 1–10)
plus district mini-scenes filling adjacent hexes as built. Spec for
`districtModels.js` (next code deliverable — reuses cityModels helpers:
prism roofs, colonnade, style palettes):
- Each district = 1 anchor structure + 3–5 filler buildings in the civ's
  architectural style + a ground treatment (paving for CIVIC/MARKET, pool for
  AQUEDUCT, quays for HARBOUR, drill square for BARRACKS).
- Anchors: CIVIC colonnaded hall · MARKET stall rows + awning planes ·
  INSULAE tall thin 3-storey blocks (Rome's actually TALLER than the domus —
  render it) · AQUEDUCT arch row marching toward the centre hex (2–3 arches,
  the signature) · HARBOUR breakwater + shipsheds · BATHS dome/halls ·
  TEMPLE precinct wall + shrine · GREAT WORKS each get a bespoke procedural
  model (Colosseum ring = cityModels amphitheatre scaled up; Pyramids =
  4-sided cones; Stonehenge = box trilithon ring; Great Wall = wall segment
  with towers).
- Pillaged state: blackened material swap + 2 smoke sprite columns.
- Perf: same merged-geometry advice; districts are static.

## 6. Engine migration notes

1. New city fields: `districts:[{hex,type,pillaged}]`, `popCap` (base by tier
   + housing districts), `homeCityId` on units, banked-food credit on disband.
2. Training flow: pop check + decrement; mercenary path skips it; settler
   included; engineer/merchant excluded + "resident" state when garrisoned home.
3. District build UI: city panel Build tab gains a DISTRICTS section — pick
   type, then pick one of the 6 hexes (highlight valid); board3d renders via
   districtModels (stub with coloured flat marker until models land).
4. Tile yield override + pillage/repair; enemy units pillage on entering.
5. Great Works: new card type `greatwork` in cards-data (loadout-independent —
   they sit in Collection and are built from the city panel when owned).
6. Tests: pop math (train/disband/mercenary/settler), slot unlock by tier,
   harbour coast rule, one-great-work-per-city, pillage/repair round-trip.
7. AI: build districts by need (low stability → LEISURE/CIVIC; low food →
   AQUEDUCT; war → BARRACKS); train mercs when pop-tight and gold-rich.
