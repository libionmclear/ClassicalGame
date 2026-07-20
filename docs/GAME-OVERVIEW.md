# HEGEMON — Game Compendium

A single reference for the whole game as it stands: the peoples, the systems, the
cards, the figures you meet, and everything done on graphics and texture. Every
count and list here is read from the source of record (`src/engine/`,
`src/cards-data-v2.js`, `src/render3d/`), not from memory.

> A browsable version of this document is published as an Artifact:
> https://claude.ai/code/artifact/2a6b7eca-60ba-42f1-ad54-1c1e040a7c88

---

## What HEGEMON is

A historically grounded, classical-age (~800 BC – AD 117) hex-strategy game on a
living 3D board. You lead one people from villages to empire, guided by real
technologies, real armies and real geography, over a **deterministic TypeScript
engine** (a pure `(state, action) → state` reducer, seeded RNG, **286 unit tests**)
so replays and lockstep multiplayer stay exact.

**Core loop:** found and grow cities → work the land and its resources → research a
three-age tech tree (Villages → Kingdoms → Empires) → raise armies and fleets → wage
war, forge diplomacy, and answer the events, raiders and figures history throws at
you → win by domination or score.

---

## The peoples (players)

**Playable now (8):**

| Civ | Character |
|---|---|
| 🦅 Rome | The Legion, concrete, roads |
| 🏛️ Athens (Greece) | Philosophy, the Phalanx, democracy |
| 🔺 Egypt | Monuments, Nile irrigation, chariots |
| 🐘 Carthage | Merchant fleets, war elephants |
| ⚔️ Gaul | Iron mastery, the warband, druids |
| 🏹 Parthia | Horse-archery, cataphracts |
| 🗿 Britons | Chariots, hillforts, druids |
| 🏹 Kush | Nubian archers, the iron of Meroë |

**Drawn & coming — unlock by finding the civ card (24 more):** Sparta, Macedon,
Achaemenid Persia, Han China, Maurya India, Scythia, Phoenicia, Etruria, Thrace,
Ptolemaic Egypt, Seleucid Empire, Numidia, Epirus, Pontus, Armenia, Judea,
Celtiberia, Germania, Britannia, Dacia, Illyria, Pergamon, Greco-Bactria.
(32 civ cards in all.)

---

## Systems at a glance

| System | Count | Notes |
|---|---:|---|
| Units | 48 | Base lines (warrior, archer, spearman, swordsman, horseman, siege, trireme, plus settler/merchant/explorer) + civ-unique elites (Legionary, Hoplite, War Elephant, Cataphract, Praetorian, Sacred Band, Gaesatae, Immortal, Companion Cavalry…) |
| Technologies | 50 | Three-age shared tree (agriculture → currency → engineering → siegecraft…) + civ-unique doctrines |
| Buildings | 15 | Granary, Workshop, Market, Library, Walls, Harbor, Temple, Academy, Lyceum, Aqueduct, Barracks, Amphitheater, Forum, Nemeton |
| Improvements | 9 | Farm, Pasture, Mine, Quarry, Vineyard, Fishery, Harbour, + roads |
| Resources | 9 | Grain, Fish, Coral, Timber, Iron, Stone, Horses, Wine, Silver |
| Ages | 3 | Villages → Kingdoms → Empires (cities and defences toughen with age) |
| Weathers | 5 | Clear, heat, rain, fog, storm — moving fronts |

**Cities & districts:** per-city labour queues, rush-buy, tile improvements, roads,
trade routes, harbours, districts on the six surrounding hexes, material that upgrades
as a city grows. **War & defence:** a counter matrix, veterancy, flanking,
combined-arms, terrain/weather modifiers, age-scaled self-mustering garrisons,
amphibious embarking, siege. **Diplomacy:** relations across five bands, trade pacts,
non-aggression, tribute, denouncements, defensive and full alliances, vassalage,
revolts, and an alliance victory. **The open sea:** a sailable belt rings the map;
push past the lost-at-sea line and you are lost.

---

## The frontiers of the unknown

Beyond fog-of-war's unknown *space*, three other unknowns revealed only through play.
Two are built; they interlock. (Full design: [HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md).)

- **[Shipped] The Sea Beyond — off-grid corsairs.** Raiders gather beyond the map's
  edge and fall on a coastal city: warned a turn ahead, then struck — repelled, sunk
  by a warship for plunder, or pillaged. You never see their home; you defend or pay
  tribute.
- **[Shipped] The Minds of the Age — historical figures.** A figure arrives *because
  of how you play* and offers a branching boon. The interlock: **Archimedes'** Burning
  Mirrors *destroy a raid on the water*; **Pytheas** and the Carthaginian shipwrights
  extend how far you can sail toward the raiders' haven.
- **[Next] Hunt the haven.** Sail past the lost-at-sea line to find the raiders'
  island and lost-island treasure.
- **[Planned] The Land Beneath — prospecting.** Hidden deposits uncovered by
  exploring/settling; rare finds (marble, silver, naphtha) and a prospector figure.

---

## Cards & the collection (meta-game)

The between-matches collection. Founding rule: **pay-to-enhance, never pay-to-win** —
every card is earnable by play; money only skips the grind, and no card grants
outright power.

| Category | Count | What it does |
|---|---:|---|
| Civ cards | 32 | Unlock a people to play (8 open, 24 to find) |
| Legends | 68 | Kings, generals & statesmen — equip a few for a small flat per-turn perk |
| Edicts | 18 | Standing policies (Grain Dole, Corvée Labour, Coastal Patrols, Silk Road Tolls…) |
| Event cards | 9 | One-shot plays (Bumper Harvest, Favourable Omens, Crossing the Rubicon…) |
| Cosmetics | — | Crowns, emblems, titles worn on the profile — pure vanity, zero power |

**Packs** (coins earned by play: win +40 / loss +18; money buys packs only):

| Pack | Cost | Weights (common / rare / epic / legendary) |
|---|---|---|
| 📦 Standard | Free daily | 72 / 22 / 5 / 1 |
| 🥉 Bronze | 60 coins | 54 / 33 / 10 / 3 |
| 🥈 Silver | 160 coins | 36 / 40 / 19 / 5 |
| 🥇 Gold | 420 coins | 18 / 40 / 32 / 10 |

Base drop tiers common 70% / rare 20% / epic 8% / legendary 2%; a **pity timer**
guarantees an epic+ every 10 packs; duplicates become **shards** to craft any card.

### The 68 Legends (by people)

- **Rome:** Scipio Africanus, Julius Caesar, Augustus, Cato the Elder, Cicero, Marcus Agrippa
- **Greece:** Pericles, Themistocles, Solon, Plato, Phidias, Demosthenes
- **Carthage:** Hannibal Barca, Hamilcar Barca, Hasdrubal the Fair, Hanno the Navigator, Mago the Agronomist, Himilco
- **Egypt:** Psamtik I, Necho II, Amasis II, Nectanebo II, Manetho, Wahibre (Apries)
- **Gaul:** Vercingetorix, Brennus, Ambiorix, Diviciacus, Dumnorix, Commius
- **Parthia:** Surena, Arsaces I, Mithridates I, Orodes II, Vologases I
- **Sparta:** Leonidas I, Brasidas, Lysander, Agesilaus II, Lycurgus, Chilon
- **Macedon:** Alexander III, Philip II, Parmenion, Antipater, Aristotle, Craterus
- **Persia:** Cyrus II the Great, Darius I, Xerxes I, Artemisia I, Mardonius
- **Han China:** Emperor Wu, Liu Bang (Gaozu), Wei Qing, Zhang Qian, Sima Qian, Cai Lun
- **Maurya India:** Ashoka, Chandragupta, Chanakya, Bindusara, Panini
- **Scythia:** Idanthyrsus, Tomyris, Ateas, Anacharsis, Madyes

---

## The figures you meet (distinct from cards)

A **separate cast** from the cards, by design. Legend cards are the rulers you
**collect and equip** before a match for a passive perk. Figures are the thinkers and
makers you **meet mid-match**: they arrive because of how you play, offer a branching
one-time boon, and leave a mark in your chronicle. **No figure is a ruler or general,
and none shares a name with a Legend card — the two casts are fully disjoint** (26
figures vs 68 cards, verified). Full design: [HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md).

- **18 universal** (any people): Archimedes, Pytheas, Hippocrates, Thales,
  Anaximander, Pythagoras, Democritus, Eratosthenes, Euclid, Aristarchus, Hipparchus,
  Herophilus, Theophrastus, Ctesibius, Hero of Alexandria, Sostratus, Herodotus, Sappho.
- **8 unique to one people** (its master builders & guilds): Vitruvius (Rome),
  Ictinus (Greece), the Shipwrights of the Cothon (Carthage), Imhotep (Egypt), the
  Smiths of La Tène (Gaul), the Ironmasters of Meroë (Kush), the Druids of Ynys Môn
  (Britons), the Qanat Masters (Parthia).

**Cards vs figures in one line:** cards you *own, keep and equip before a match* for a
perk all game; figures *come to you during a match*, unbidden, and you pick one of
their boons on the spot.

---

## Graphics & texture — what's been done

The board went from flat sprites to a fully **procedural, post-processed 3D render**
(`src/render3d/board3d.ts`) — every surface generated in-engine, no external art
required.

- **Post-processing:** a full `EffectComposer` pipeline — base render → **GTAO**
  ambient occlusion → **SMAA** anti-aliasing → **Unreal Bloom** → output.
- **Terrain texture:** procedural **normal + roughness + colour-mottle** maps from
  tileable Simplex noise (`CanvasTexture`); sky-derived reflections via a **PMREM**
  environment map.
- **Water:** one reflective sea at a single level with translucent depth-tint hexes;
  the open ocean is the deeper, darker tone; animated water-normal ripples; the sun
  and its glitter share one bearing so they agree.
- **Lighting:** a steady, bright **day-only** sky (the night half removed by request),
  directional sun + real shadows, weather that dims/warms the light.
- **Cities:** a **material progression** as a city grows — wood → mudbrick → cut stone
  → marble; seated roofs, tier-1 wooden huts, a dirt town common (spokes removed),
  bigger houses around the centre.
- **Units & props:** ground-planted sprites with contact shadows (no floating
  cut-outs), smaller/denser troops for scale, real ruin/village models, `InstancedMesh`
  crowds.
- **Camera & board:** orbit / tilt / zoom with a moderate default inclination + reset +
  persisted preset; fog-of-war dark tiles; realm borders that grow with population.
- **Quality:** a quality toggle scales the post-FX; atmosphere moved to its own render
  layer with a separate AO camera so ambient occlusion stops painting black quads over
  the clouds.

**Deferred art direction (next):** stay in Three.js, move to stylized low-poly
animated glTF assets (unit idle/attack, city bustle) + roads/rivers as ribbons on the
terrain. The procedural render is the foundation those assets drop onto.

---

## How it's built

- **Web-first:** a Three.js / TypeScript client bundled with esbuild; the goal is
  **both** an online game and an installable app, so the stack stays web-native.
- **Pure engine:** all rules in a deterministic reducer under `src/engine/`,
  unit-tested (286), shared verbatim by single-player, AI and multiplayer.
- **Self-contained multiplayer:** accounts, friends and matchmaking on a small
  backend; live play relays only human moves and runs the AI locally in lockstep,
  which the determinism guarantees.
