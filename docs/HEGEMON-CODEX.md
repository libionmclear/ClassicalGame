# HEGEMON — The Complete Codex

The exhaustive reference: **every** civ, unit, tech, building, improvement, resource,
card, figure, and discovery in the game, enumerated in full (no summaries). All read
from the source of record (`src/engine/`, `src/cards-data-v2.js`, `src/render3d/`).
Companion docs: [GAME-OVERVIEW.md](GAME-OVERVIEW.md) (shorter tour),
[REVIEW-HANDOFF.md](REVIEW-HANDOFF.md) (reviewer brief),
[HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md) (design of the newest systems).

- Classical age ~800 BC – AD 117 · web-first Three.js/TypeScript · deterministic
  engine · 286 unit tests.

---

## 1. Peoples (32 civ cards)

**Playable now (8):** Rome, Athens (Greece), Egypt, Carthage, Gaul, Parthia, Britons,
Kush.

**Locked — unlock by finding the card (24):** Sparta, Macedon, Achaemenid Persia,
Han China, Maurya India, Scythia, Phoenicia, Etruria, Thrace, Ptolemaic Egypt,
Seleucid Empire, Numidia, Epirus, Pontus, Armenia, Judea, Kush (legendary variant),
Celtiberia, Germania, Britannia, Dacia, Illyria, Pergamon, Greco-Bactria.

---

## 2. Units (48)

**Base military:** warrior, archer, spearman, swordsman, horseman, siege, trireme.
**Civilian:** settler, merchant, explorer.

**Civ-unique & elite lines (the remaining 38):** legionary, hoplite, war-elephant,
war-chariot, chariot-isles, meroe-archer, gaesatae, horse-archer, cataphract,
spartiate, phalangite, immortal, crossbowman, velites, praetorian, sacred-band,
numidian-cavalry, peltast, athenian-trireme, nubian-archer, machimoi, noble-horse,
soldurii, camel-train, perioikoi-hoplite, skiritai, companion-cavalry, hypaspist,
sparabara, scythed-chariot, han-cavalry, ji-halberdier, armoured-elephant,
indian-longbow, kshatriya-chariot, steppe-archer, royal-scythian, amazon-rider.

Units carry a domain (land / naval / civilian), a tactical category feeding a counter
matrix, veterancy (recruit → veteran → elite), and civ / tech gates.

---

## 3. Technologies (50) — three ages

bronze-working, sailing, writing, masonry, archery, irrigation, animal-husbandry,
phalanx-doctrine, skirmish-doctrine, temple-economy, coinage, iron-working,
combined-arms, open-sea-sailing, engineering, horseback-riding, mountain-paths,
caravan-logistics, republic, monarchy, ramming-fleets, merchant-marine,
roads-logistics, siegecraft, medicine, law-administration, currency-reform,
cartography, assimilation, tribute-empire, pottery, mathematics, philosophy,
metallurgy, aqueducts, astronomy, rhetoric, crop-rotation, hoplite-phalanx (Greece),
chariotry (Egypt), legionary-system (Rome), war-elephants (Carthage),
iron-mastery (Gaul), horse-archery (Parthia), testudo, phalanx-wall,
nile-bureaucracy, thalassocracy, furor, parthian-shot.

Costs scale by age × tier; some techs are civ-unique doctrines (noted above).

---

## 4. Buildings (14)

Granary, Workshop, Market, Library, Walls, Harbor, Temple, Academy, Lyceum, Aqueduct,
Barracks, Amphitheater, Forum, Nemeton.

## 5. Tile improvements (7 + roads)

Farm, Pasture, Mine, Quarry, Vineyard, Fishery, Harbour — plus **roads** (speed
movement, bridge rivers). Districts also occupy the six hexes around a city centre.

## 6. Resources (9)

Grain, Fish, Coral, Timber, Iron, Stone, Horses, Wine, Silver — worked for bonus
yields (food / labour / gold) and, when controlled, a build discount on the related
units/buildings.

## 7. Ages (3) & weather (5)

Ages: **Villages → Kingdoms → Empires** (cities, garrisons and defences toughen as
your age advances). Weather: **clear, heat, rain, fog, storm** — moving fronts that
shift combat, movement and vision.

---

## 8. The frontiers of the unknown

- **[Shipped] Off-grid corsairs** — raiders from the off-map open-sea belt strike
  coastal cities: warned, then repelled / sunk (warship in port) / pillaged; defend or
  pay tribute.
- **[Shipped] Historical figures** — thinkers & makers who visit because of how you
  play (see §12). Interlock: Archimedes' Burning Mirrors destroy an incoming raid.
- **[Next] Hunt the haven** — sail past the lost-at-sea line to the raiders' island.
- **[Planned] The Land Beneath** — hidden deposits uncovered by exploring/settling.

Design detail: [HEGEMON-RAIDERS-v1.md](HEGEMON-RAIDERS-v1.md).

---

## 9. Cards & the collection

Meta-game rule: **pay-to-enhance, never pay-to-win** — everything earnable by play,
money only skips the grind, no card grants outright power.

### 9.1 Categories
- **Civ cards — 32** (§1): unlock a people.
- **Legends — 68** (§10): equip a few for a small flat per-turn perk.
- **Edicts — 18** (§9.2): standing policies.
- **Event cards — 9** (§9.3): one-shot plays.
- **Cosmetics** (§9.4): profile vanity, zero power.

### 9.2 Edicts (18)
Grain Dole, Corvée Labour, Standing Levy, Coastal Patrols, Census & Registry,
Sacred Truce, Cursus Publicus, Mercenary Contracts, Delian Tribute, Nile Inundation,
Oppida Network, Silk Road Tolls, Laconic Discipline, Hetairoi Honours,
Angarium Couriers, Imperial Examination, Spy Network, Wagon Camps.

### 9.3 Event cards (9)
Bumper Harvest, Favourable Omens, Defection, Storm Averted, Forced March,
Philosopher's Visit, Crossing the Rubicon, Oath of Hamilcar, Heavenly Horses.

### 9.4 Cosmetics
**Crowns:** Laurel Wreath, Gold Diadem, Iron Crown. **Emblems:** the Eagle, the Wolf,
the Owl of Athena, the Trireme, the War Elephant, the Sun of Egypt. **Titles:** the
Bold, the Conqueror, the Wise, the Great.

### 9.5 Packs & odds
Coins earned by play (win +40 / loss +18); money buys packs only. Base drop tiers:
common 70% / rare 20% / epic 8% / legendary 2%. **Pity timer** guarantees epic+ every
10 packs; duplicates become **shards** to craft any card.

| Pack | Cost | Weights (common / rare / epic / legendary) |
|---|---|---|
| 📦 Standard | Free daily | 72 / 22 / 5 / 1 |
| 🥉 Bronze | 60 coins | 54 / 33 / 10 / 3 |
| 🥈 Silver | 160 coins | 36 / 40 / 19 / 5 |
| 🥇 Gold | 420 coins | 18 / 40 / 32 / 10 |

---

## 10. The 68 Legends (kings, generals & statesmen)

- **Rome (6):** Scipio Africanus, Julius Caesar, Augustus, Cato the Elder, Cicero, Marcus Agrippa
- **Greece (6):** Pericles, Themistocles, Solon, Plato, Phidias, Demosthenes
- **Carthage (6):** Hannibal Barca, Hamilcar Barca, Hasdrubal the Fair, Hanno the Navigator, Mago the Agronomist, Himilco
- **Egypt (6):** Psamtik I, Necho II, Amasis II, Nectanebo II, Manetho, Wahibre (Apries)
- **Gaul (6):** Vercingetorix, Brennus, Ambiorix, Diviciacus, Dumnorix, Commius
- **Parthia (5):** Surena, Arsaces I, Mithridates I, Orodes II, Vologases I
- **Sparta (6):** Leonidas I, Brasidas, Lysander, Agesilaus II, Lycurgus, Chilon
- **Macedon (6):** Alexander III, Philip II, Parmenion, Antipater, Aristotle, Craterus
- **Persia (5):** Cyrus II the Great, Darius I, Xerxes I, Artemisia I, Mardonius
- **Han China (6):** Emperor Wu, Liu Bang (Gaozu), Wei Qing, Zhang Qian, Sima Qian, Cai Lun
- **Maurya India (5):** Ashoka, Chandragupta, Chanakya, Bindusara, Panini
- **Scythia (5):** Idanthyrsus, Tomyris, Ateas, Anacharsis, Madyes

Roles: commander · statesman · sage · builder · navigator.

---

## 11. The in-game Codex — 16 ancient ruins

The 📖 **Codex** on the play screen is a browsable encyclopedia of ruins you discover.
End an **Explorer's** turn on a ruin to excavate it fully (full reward + a Codex entry);
any other unit gets half and no entry. Source: `src/engine/discovery.ts` (`RUINS`).

| Ruin | Region |
|---|---|
| Stele of Hammurabi | Mesopotamia |
| Ziggurat of Ur | Mesopotamia |
| Library of Ashurbanipal | Nineveh |
| Walls of Hattusa | Anatolia |
| Göbekli Tepe | Anatolia |
| Palace of Knossos | Crete |
| Lion Gate of Mycenae | Greece |
| Mound of Troy | Hellespont |
| Pyramids of Giza | Nile |
| Necropolis of Kerma | Nubia |
| Nuraghe Towers | Sardinia |
| Terramare Embankments | Po Valley |
| Nebra Sky Hoard | Germania |
| Hallstatt Salt Galleries | Alps |
| Stonehenge | Britain |
| Silver Hoards of Tartessos | Iberia |

Rewards range from science and gold to army veterancy, revealed terrain, free walls,
banked city production/food, and lasting trade income.

---

## 12. The figures you meet (26) — thinkers & makers

A **separate cast** from the Legend cards: no figure is a ruler or general, and none
shares a name with a card (verified disjoint). They arrive mid-match because of how
you play and offer a branching one-time boon.

**18 universal:** Archimedes, Pytheas, Hippocrates, Thales, Anaximander, Pythagoras,
Democritus, Eratosthenes, Euclid, Aristarchus, Hipparchus, Herophilus, Theophrastus,
Ctesibius, Hero of Alexandria, Sostratus, Herodotus, Sappho.

**8 unique to one people** (its master builders & guilds): Vitruvius (Rome),
Ictinus (Greece), the Shipwrights of the Cothon (Carthage), Imhotep (Egypt),
the Smiths of La Tène (Gaul), the Ironmasters of Meroë (Kush),
the Druids of Ynys Môn (Britons), the Qanat Masters (Parthia).

---

## 13. Graphics & texture (the render)

Fully procedural, post-processed 3D board (`src/render3d/board3d.ts`), no external art:
- **Post-FX:** EffectComposer — render → GTAO (ambient occlusion) → SMAA → Unreal Bloom → output.
- **Terrain:** procedural normal + roughness + colour-mottle maps from tileable Simplex noise; sky-derived reflections via a PMREM env map.
- **Water:** one reflective sea at a single level + translucent depth-tint hexes; open ocean is the deeper, darker tone; animated ripples; sun and its glitter share one bearing.
- **Lighting:** steady, bright **day-only** sky (night removed by request), directional sun + shadows, weather-driven dimming/warming.
- **Cities:** material progression wood → mudbrick → cut stone → marble; seated roofs, tier-1 huts, dirt town common, bigger houses.
- **Units/props:** ground-planted sprites with contact shadows, smaller/denser troops, real ruin/village models, InstancedMesh crowds.
- **Camera:** orbit / tilt / zoom, moderate default inclination, reset + persisted preset; fog-of-war dark tiles; growing realm borders.
- **Quality toggle** scales the post-FX; atmosphere on its own layer with a separate AO camera (no black quads on clouds).

**Next (art direction):** stylized low-poly animated glTF assets (unit idle/attack,
city bustle), roads/rivers as ribbons — dropped onto this procedural foundation.

---

## 14. How it's built

Web-first Three.js/TypeScript client (esbuild) + a pure deterministic engine under
`src/engine/` (286 tests), shared verbatim by single-player, AI and lockstep
multiplayer. Self-contained backend for accounts/friends/matchmaking. Goal: **both**
an online game and an installable app.
