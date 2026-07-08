# HEGEMON — Tech Tree v2 (Design of Record)

> Companion data file: `techs-v2.js` (121 unique techs, 12 branches, 5 new units,
> 1 new building). Approved approach: shared trunk (~60%) + civ-unique branch
> (~40%). Rule honoured: no shared tech loses yields — branches only ADD.

## 1. Structure

- **Shared trunk:** the existing tree in `data.ts` stays essentially as-is —
  all shared techs, forks, and TECH_CITY_YIELD entries unchanged. The trunk is
  what every civilization of the age genuinely shared: bronze, writing, sailing,
  irrigation, masonry, philosophy, and so on.
- **Unique branch:** each playable civ gets a named branch of 10–11 techs
  spanning all three ages, ending in a **capstone doctrine**. Branches are
  hidden from rival civs (existing behaviour, extended). Each branch covers four
  pillars: government, military, engineering/economy, knowledge — because that
  is where the real historical differences lived (Rome's Senate and concrete,
  Sparta's helot economy, Persia's satrapies, Han's state monopolies).
- **Branch anchoring:** branch techs take trunk prerequisites (e.g. Legionary
  system needs trunk `iron-working` + branch `castra`), so trunk and branch
  interleave in play rather than being separate games.
- **Costs:** unchanged 20/46/82 × costScale by age. Branch techs use the same
  age costs. Deeper tree = longer game, matching the intent of the research
  revamp.

## 2. Branch names (UI band titles, in civ color)

Rome **Via Romana** · Carthage **The Sea Charter** · Athens **The School of
Hellas** · Egypt **Gift of the Nile** · Gaul **The Oppida** · Parthia **The
Horse and the Road** · Sparta **The Agoge** · Macedon **The Companions** ·
Persia **The King's Peace** · Han **The Mandate** · Maurya **The Wheel of Law**
· Scythia **The Endless Steppe**

## 3. Migration & conflict notes (Claude Code checklist)

1. **Absorbed techs, ids unchanged:** `legionary-system`, `testudo`,
   `war-elephants`, `chariotry`, `iron-mastery`, `horse-archery`,
   `hoplite-phalanx`, `thalassocracy`, `furor`, `parthian-shot`,
   `nile-bureaucracy`, `phalanx-wall` now live inside branches with new
   prerequisites. Save compatibility: same ids, new prereq edges.
2. **Doctrine reassignment:** `phalanx-wall` moves from Greece to **Sparta**
   (capstone). Athens (civ id `greece`) gets a NEW capstone `wooden-walls`
   (naval doctrine). Until Sparta ships as playable, Athens keeps phalanx-wall
   functional behind a flag OR ships wooden-walls immediately — recommend the
   latter; it differentiates Athens now.
3. **Edict renames** (cards-data-v2.js) to avoid tech-name collisions:
   - Persia edict "Royal Road" → **"Angarium couriers"** (tech takes the name)
   - Maurya edict "Arthashastra Statecraft" → **"Spy network"**
   - Sparta edict "The Agoge" → **"Laconic discipline"**
   - Macedon edict "Companion Cavalry" → **"Hetairoi honours"**
   - Gaul edict "Oppida Network" stays (Gaul tech is "Murus gallicus")
4. **New units (5):** cataphract (Parthia), spartiate (Sparta), phalangite
   (Macedon), immortal (Persia), crossbowman (Han) — stat sketches in
   `NEW_UNITS`; wave-2 civs' units can ship with their civs. Cataphract is the
   only wave-1 addition. Needs 3D models: procedural variants of horseman/
   spearman/archer are fine initially (armour plates = scaled boxes).
5. **New building:** `forum` (Rome only, unlocked by `res-publica`, boosted by
   `forum-romanum`). Market-tier cost.
6. **Stability stat:** many branch effects use per-city stability. If stability
   isn't in the engine yet, phase 1 substitution: +stability → +gold,
   −stability → −gold, and log a TODO. (Same flag as cards v2 §7.)
7. **Effect vocabulary:** same keys as cards-data-v2.js (`atkPct`, `cityYield`,
   `buildingBoost`, `special:` named hooks). New named hooks introduced here:
   heal-in-enemy-territory-when-fortified (castra), units-heal-anywhere
   (wagon-camps), enemy-attrition-in-your-territory (scorched-steppe),
   gold-per-known-civ-at-peace (tributary/steppe-tribute),
   farm-buildable-on-desert (qanat/basin irrigation), 50%-cost-refund-on-death
   (immortal). Implement incrementally; a branch can ship with 8 of 10 hooks
   live and 2 stubbed as +gold equivalents.
8. **AI:** the list-order researcher must be branch-aware — weight: own branch
   techs ×1.5, economy trunk early, capstone when military score is high.
   (This also fixes the §9 known issue about economy under-prioritisation.)
9. **UI (per approved mockup):** three era columns; shared trunk rows on top;
   unique branch as a named band in civ color at the bottom; four states
   (researched / available / locked-dimmed / unique); hover = highlight full
   prereq chain; rival unique branches hidden. In-game skin: dark ground,
   stone-panel era bands, tablet-style nodes — matching the existing 3D-era
   aesthetic, not the flat wireframe.
10. **Tests:** extend the tech suite — every UNIQUE_TECHS prereq resolves;
    every civ has exactly one capstone; no unlock references a missing
    unit/building; absorbed-tech ids still load old saves.

## 4. Historical accuracy stance

Every tech is an attested institution, technology, or practice of that
civilization inside ~800 BC–AD 117, and the note field carries the receipt
(Cai Lun AD 105; the 81 BC Salt and Iron debate; Caesar on the murus gallicus;
Herodotus on the wagon homes). Two softer entries are flagged in their own
text: Lycurgus (historicity debated; the institutions were real) and the
warrior-women entry (grounded in steppe burial archaeology). Where a mechanic
is a game abstraction of something real (Immortal replacement refund = the
always-10,000 rule), the note says what it abstracts.
