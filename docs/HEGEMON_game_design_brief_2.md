# HEGEMON (working title) — Game Design Brief v1.0
### A historically accurate, hex-based light civilization game for Web, iOS, and Android
*Prepared for implementation by Claude Code. This document is the single source of truth for the framework build. Working title alternatives: Aetas, Imperivm Ludus, Crossroads of Empires — verify trademark availability before launch.*

---

## 1. Vision & Design Pillars

A turn-based strategy game with **more depth than The Battle of Polytopia, far less complexity than Civilization**. Every mechanic must pass three tests:

1. **Historically accurate.** Units, techs, buildings, events, and titles are grounded in real antiquity (~800 BC – 117 AD, the classical Mediterranean and Near East). The game teaches while it entertains.
2. **Decision-tree depth, not menu sprawl.** Depth comes from branching choices ("go this way OR that way") — mutually exclusive tech branches, civic dilemmas, and doctrine picks — not from managing dozens of systems.
3. **A quick game is a complete game.** Quick mode: 20–40 minutes, regional scenario, turn limit. Epic mode: full Old World map, multi-session.

**Educational mandate:** Every tech, unit, building, and event carries a 1–2 line historically sourced note delivered inside gameplay (tooltips, unlock cards), never as interrupting popups. A player who finishes one match should have learned real history without noticing they were studying.

---

## 2. Platforms & Architecture Requirements

Target platforms: **Web (desktop + mobile browser), iOS, Android** — one codebase.

**Claude Code: recommend the stack**, but it must satisfy these hard constraints:

- **The simulation engine is a pure, deterministic, headless state machine.** `(gameState, action, seed) → newGameState`. Zero rendering dependencies, fully serializable state (JSON), seeded RNG only. This is non-negotiable — it is what makes solo, pass-and-play, async, and live multiplayer *the same engine with different transports*.
- Renderer is a separate layer consuming engine state (candidates: TypeScript + PixiJS wrapped in Capacitor; or Godot 4 with GDScript/C# exporting to all three platforms). Evaluate both; weigh web-first iteration speed vs. Godot's built-in tooling.
- Server-authoritative validation for online play (Phase 3+): server runs the same engine, replays submitted actions, rejects illegal ones. Deterministic engine makes anti-cheat nearly free.
- Save format: ordered action log + initial seed (full replay capability), plus periodic state snapshots for fast load.
- Offline-first for solo and pass-and-play; no account required until online play.

**Multiplayer phasing (all three modes ship eventually, one engine):**
- Phase 1: Solo vs. AI + local pass-and-play
- Phase 3: Async online (chess-app style: take your turn anytime, push notifications)
- Phase 4: Live matches (simultaneous or sequential fast turns)

---

## 3. The Map

### 3.1 Grid & world
- **Hexagonal tiles** (pointy-top or flat-top — renderer's choice, engine is agnostic).
- **Default epic map: the real Old World** — Mediterranean basin, Europe to Britain, North Africa to Nubia, Near East to Persia/Parthia. Hand-authored from real geography (real placement of the Alps, Nile, Italian peninsula, Aegean islands, Sahara edge, Euphrates, etc.). Target ~60×40 usable hexes for epic; scenarios carve 16×16 to 24×24 regions from it.
- **Quick-mode scenarios** (launch set): Italia (Rome vs. Etruria/Carthage), The Nile (Egypt vs. Kush/Sea Peoples), The Aegean (Greek poleis rivalry), Gallia (Gauls vs. Rome), Mare Internum (naval-heavy, Carthage vs. Greeks). Each scenario has a 1-paragraph historical briefing.

### 3.2 Terrain types & movement
Standard land unit movement budget: 2–3 points/turn.

| Terrain | Move cost | Yields (worked) | Notes |
|---|---|---|---|
| Plains | 1 | 2 food | Ideal for cavalry (+combat bonus for mounted) |
| Valley (river valley) | 1 | 3 food | Best farmland; the Nile/Po/Nile-delta tiles |
| Forest | 2 | 2 production | Defense +25%; ambush bonus for tribal civs |
| Hills | 2 | 1 food 1 production | Defense +25%; vision +1 |
| Mountains | 3 | 1 production | Impassable until "Mountain Paths" tech; defense +50%; blocks vision |
| Desert | 2 | 0 (oasis: 2 food) | Attrition: units end-turn here lose 1 HP without "Caravan Logistics" |
| Sea (deep) | ship only | — | Requires Open-Sea Sailing tech to enter |
| Coast (shallow) | ship only | 1 food 1 gold (fishing) | Embark/disembark point |
| River (edge feature) | +1 to cross | +1 food to adjacent tiles | Crossing penalty removed by ford/bridge; attacking across a river: −25% |

Rivers are **hex-edge features**, not tiles — they modify adjacency, movement, and combat, and they define fertile valleys.

### 3.3 Weather — the only luck in the game
Each turn, each map region gets a visible weather state with a 1-turn forecast. Weather is the sanctioned randomness (seeded): players see it and plan around it — luck you can outsmart.

- **Clear** — no effect
- **Rain** — mounted units −1 movement; rivers cost +1 extra to cross
- **Fog** — all vision −1; ambush bonuses doubled
- **Storm (sea)** — ships in deep sea take 2 HP damage; can't enter deep sea (historical anchor: the storms that destroyed Roman fleets in the First Punic War, 255 & 253 BC)
- **Heat (desert regions)** — desert attrition doubled

---

## 4. Civilizations

### 4.1 Launch roster (8)
Each civ has: 1 unique unit, 1 unique building/improvement, 1 passive trait, 1 unique branch in the decision tree, and a title ladder (§11). All grounded in the historical record.

| Civ | Unique unit | Unique building | Trait |
|---|---|---|---|
| **Rome** | Legionary (replaces Swordsman; can build roads/forts) | Forum (extra gold + culture per pop) | *Cursus Publicus*: +1 movement on friendly road tiles |
| **Egypt** | War Chariot (fast, powerful on plains/valley, weak in hills) | Obelisk (faith/culture, floodplain food bonus) | *Gift of the Nile*: valley tiles +1 food |
| **Greeks** | Hoplite (bonus when adjacent to another Hoplite — phalanx) | Akademia (research bonus) | *Agon*: +science per coastal city |
| **Gauls** | Gaesata (shock warrior, first-strike from forest) | Oppidum (fortified hill town, free walls) | *Furor Gallicus*: +25% attack for 3 turns after enemy declares war |
| **Britons (Celts)** | War Chariot of the Isles (hit-and-run: move after attack) | Nemeton (sacred grove: forest tiles yield faith) | *Island Fastness*: defense bonus on home-island tiles |
| **Parthia** | Horse Archer (shoot then retreat — the "Parthian shot") | Caravanserai (trade route gold +50%) | *King's Road heirs*: merchants move +2 |
| **Carthage** | Sacred Band + War Elephant (elephant terrifies: adjacent enemy −1 attack) | Cothon (circular military harbor: free harbor, ships heal) | *Thalassocracy*: sea trade routes +50% gold |
| **Kush (Nubia)** | Archer of Meroë (best ranged unit of Age I–II) | Iron Furnaces of Meroë (production from desert hills) | *Bowmen of Ta-Seti*: ranged units cheaper and +XP |

Kush is deliberately included over a 9th Mediterranean power: it is under-taught history (a Nubian dynasty ruled Egypt — the 25th Dynasty — and Meroë was an iron-working power), which serves the educational mandate.

### 4.2 Expansion civs (post-launch, purchasable)
Achaemenid Persia (Immortals, Royal Road), Phoenicia (Tyrian traders, purple dye monopoly economy), Germania (Cherusci ambushers — Teutoburg), Iberia (falcata warriors, guerrilla trait), Scythia (nomadic — mobile capital, no fixed early cities: a genuinely different playstyle), Macedon (Companion Cavalry, sarissa phalanx), Han China + Maurya India (if/when the map extends east), Etruria, Sparta-vs-Athens split of Greeks.

**Historical note on the roster:** "Gauls" and "Celts" overlap heavily; we resolve this as **Gauls** (continental, La Tène culture) and **Britons** (insular Celts) so they are mechanically and geographically distinct.

---

## 5. Economy — Three Resources + Trade

- **Food** (grain icon): grows city population. Each pop works one tile in city radius.
- **Production** (hammer/anvil): builds units and buildings.
- **Gold** (coin): unit upkeep, instant-buy (rush), diplomacy, and the trade economy.

### Merchants & commerce (a core pillar, not a side system)
- **Merchant** is a civilian unit. Move it to any city (yours or foreign) ≥ 4 hexes from origin city and activate: creates a **trade route** yielding gold per turn = base + distance bonus + (origin city size + destination size)/2.
- Land routes can be pillaged by hostile units on the path; sea routes by enemy warships — commerce raiding is a real strategy (and a real historical one).
- Foreign routes yield ~50% more than domestic and generate slow **reputation** with that civ (diplomacy currency) — but die instantly on declaration of war. Guns-vs-butter tension.
- Historical teaching hooks: amphorae, the grain fleets of Alexandria, Tyrian purple, the amber road, Meroë's iron.

---

## 6. Cities

- Founded by a **Settler**. City works tiles within radius 2 (later 3 with tech).
- **City levels 1–5** driven by population; each level adds building slots and border growth. Level names are civ-flavored (Rome: Vicus → Oppidum → Municipium → Urbs → Caput Mundi).
- **Building set (small, meaningful):** Granary (food), Workshop (production), Market (gold), Harbor (coastal: sea trade + fishing), Walls (city HP + garrison bonus), Temple (culture/loyalty + civ-specific flavor: Temple of Jupiter, Temple of Amun, Nemeton…), Academy (science), plus each civ's unique building.
- Cities have HP and a garrison; they can be **captured** (not razed in v1 — keeps quick games decisive and avoids scorched-earth stalemates).

---

## 7. Research: The Tree of Decisions

Three **Ages**, ~24 shared techs plus civ-unique branches. The signature mechanic: **mutually exclusive forks**. At key nodes you pick ONE branch; the other locks for the rest of the game. This is the "more depth than Polytopia, simpler than Civ" engine — replayability through paths, not through volume.

### Age I — Age of Villages (~800–500 BC)
Core: Bronze Working, Sailing, Animal Husbandry, Writing, Masonry, Archery, Pottery/Irrigation.
**Fork 1 — Warfare doctrine:** *Phalanx Doctrine* (heavy infantry, defense) **OR** *Skirmish Doctrine* (ranged/mobility, ambush).
**Fork 2 — Economy:** *Temple Economy* (faith/culture path, loyalty bonuses — Egypt's model) **OR** *Coinage* (gold path, cheaper rush-buy — Lydia/Greek model; teaching hook: the first coins, Lydia ~600 BC).

### Age II — Age of Kingdoms (~500–200 BC)
Core: Iron Working, Open-Sea Sailing, Mathematics, Engineering (bridges/fords), Horseback Riding, Mountain Paths, Caravan Logistics.
**Fork 3 — Statecraft:** *Republic* (more production & unit XP, but "Senate" events can constrain war declarations) **OR** *Monarchy* (faster expansion, loyalty from capital, risk of succession events). Historically framed: Rome's expulsion of the kings (509 BC) vs. the Hellenistic monarchies.
**Fork 4 — Naval doctrine:** *Ramming Fleets* (trireme combat power — Salamis) **OR** *Merchant Marine* (cargo capacity, sea trade gold — Carthage/Phoenicia).

### Age III — Age of Empires (~200 BC–117 AD)
Core: Roads & Logistics, Siegecraft (ballista, siege tower), Medicine, Law/Administration, Currency Reform, Cartography.
**Fork 5 — Imperial method:** *Assimilation* (captured cities lose no population, gain your culture — Rome's citizenship model) **OR** *Tribute Empire* (captured cities pay heavy gold, stay restless — Persian satrapy model).

Every tech unlock displays a **card**: illustration + 2-line real history ("**Roads.** The Via Appia (312 BC) let legions march 25 Roman miles a day. Effect: +1 movement on roads; connect cities for trade bonus.").

---

## 8. Units, Combat & Leveling

### 8.1 Unit roster (shared spine + civ replacements)
- **Age I:** Warrior, Slinger/Archer, Scout, Explorer (see §10.1), Settler, Merchant, Fishing/Trade ship, Galley (coastal warship)
- **Age II:** Swordsman, Spearman (anti-cavalry), Horseman, Trireme, Siege Ram
- **Age III:** Heavy Infantry (Legionary-class), Cataphract/Heavy Cavalry, Quinquereme, Ballista, Siege Tower
- Unique units replace their slot (Legionary replaces Heavy Infantry, Parthian Horse Archer replaces Horseman, etc.)

### 8.2 Combat resolution — deterministic + visible modifiers
No hidden dice. Damage = f(attack stat, defense stat, HP%) modified by:
- **Terrain** (defender in forest/hills +25%, mountains +50%, attacking across river −25%)
- **Positioning:** flanking (+10% per allied unit adjacent to the defender) — makes tactics matter on a hex grid
- **Tech & veterancy** multipliers
- **Weather** (§3.3) — the only stochastic input, and it's visible in advance
- Special abilities: phalanx adjacency, Parthian shot (attack then retreat 1 hex), elephant terror aura, chariot hit-and-run

The pre-combat UI always shows the exact predicted outcome (both units' resulting HP). Tactics game, not slots.

### 8.3 Leveling — two axes
1. **Veterancy (within a match):** Recruit → Veteran (+10%) → Elite (+20%, unlock 1 ability, e.g., Elite Legionary gets *Testudo*: ranged damage taken −50%). Earned by surviving combat.
2. **Age upgrades (via research):** pay gold to upgrade a unit in a city to its next-age equivalent — veterancy carries over. Your named, storied elite warrior marching through three ages is the emotional through-line.

### 8.4 Armies, Stacking & Multi-Angle Attacks
The hex grid is a tactical feature, not just a visual one: every tile has six approach angles, and the combat design exploits this fully.

**Limited stacking — Armies:**
- A tile may hold multiple units grouped as an **Army**, up to a hard **stack cap** (default: 3 units per tile in Age I, 4 in Age II, 5 in Age III — cap as a tunable data value, never hardcoded). No infinite "doomstacks": the cap forces armies to spread across multiple hexes, which keeps flanking, terrain, and positioning decisive.
- An Army is a **combined-arms formation**: mixing unit types in one stack is the intent, not an exploit (e.g., Spearman + Archer + Horseman = anti-cavalry screen, ranged support, pursuit arm). Historically framed: this is how real ancient armies fought — Rome's legion combined heavy infantry, velites, and cavalry alae; Hannibal's genius at Cannae was combined-arms coordination, not raw numbers.
- **Stack combat resolution (deterministic, per §8.2):** when an Army attacks or defends, units engage in role order — melee line absorbs and deals frontline damage, ranged units in the stack contribute support fire without taking melee damage (unless the melee line is destroyed), cavalry contributes a pursuit bonus against retreating/broken enemies. The pre-combat preview shows the full predicted outcome for every unit in both stacks.
- **Composition bonuses (small, readable):** a stack containing melee + ranged gets *Supported* (+10%); melee + ranged + mounted gets *Combined Arms* (+15% and the flanking bonus it generates on adjacent tiles counts double). Depth through composition choices, not micromanagement.

**Attacking from multiple tiles:**
- The existing flanking rule (§8.2) scales with the hex geometry: each additional friendly-occupied tile adjacent to the defender adds its bonus, so a coordinated three-hex assault on one position is dramatically stronger than three sequential one-hex attacks. Encircle before you strike — the Cannae lesson, playable in 30 seconds.
- Ranged units may support an attack from their own tile without moving, letting a player stage genuine multi-angle operations: pin from the front, shoot from the hills, charge the flank.

**Visual scale philosophy:**
- Unlike Civilization or Europa Universalis, where a single giant soldier looms absurdly over a city, units here render as **small clusters of little soldiers** — a Warrior is a handful of figures, a full 5-unit Army reads as a massed formation of many small figures on the tile. Aggregation communicates strength at a glance and keeps the map feeling like a living fresco battlefield rather than a board of chess pieces.
- Figure count per unit scales subtly with HP and veterancy (a wounded unit visibly thins; an Elite unit gains a standard-bearer/officer figure), giving battlefield state readability with zero extra UI.
- Perfect scale is impossible and not the goal; **believable scale** is: soldiers small relative to cities and terrain, armies that look like armies. Engine note: render figures as instanced sprites within the tile so figure count is pure presentation, never simulation.

---

## 9. Victory, Modes & Match Setup

Player picks at match creation:
- **Turn-limit victory:** highest score at turn N (quick: 30–40 turns; epic: 100+). Score = cities + population + techs + gold + wonders-lite + titles earned.
- **Domination:** capture all enemy capitals — ends the match immediately at any turn count.
- **Quick mode** = scenario map + turn limit (domination still possible early). **Epic mode** = full Old World map.

**Crossroads events** (both modes): 2–4 times per match, a historical dilemma card with exactly two choices, each with real precedent and real trade-offs. Example (Rome): *"The Gracchi propose land reform. GRANT land to veterans (+loyalty, −gold, nobles' event risk) or REFUSE (+gold, city loyalty −1)."* Example (Egypt): *"The Nile flood fails. Open the temple granaries (−faith, +food) or preserve the offerings (+faith, famine risk)."* These are the game's soul: history as decisions, not dates.

---

## 10. Discovery & Exploration — Ruins, Minor Peoples & the Explorer

Exploration must generate excitement, not just clear fog. Two discovery systems populate the map from **regional pools, randomly drawn and rotated per match** (seeded): **Ruins** (extinct ancient cultures — pure discovery sites) and **Minor Peoples** (living villages you can befriend, absorb, or conquer). Both are the educational layer's front line: every discovery unlocks a Codex entry.

### 10.1 The Explorer (new unit)
- **Age I unit, recon/discovery class.** Movement 4 (fastest land unit in the game); forest and hills cost only 1 for it; vision 2 (3 from hills); can embark early.
- **Militarily weak:** cannot attack; low defense. Losing one costs you the discovery race, not your army.
- **Discovery specialist:** the only unit that can **fully excavate a Ruin** (any other unit gets 50% of the reward and no Codex entry). When an Explorer makes first contact with a Minor People, their disposition improves one step — a lone traveler is welcomed where an army is feared.
- Upgrade at Cartography (Age III): *Pathfinder* — may cross mountains.
- Distinct from the Scout (military recon/vision): the Explorer is the archaeologist-envoy. Historical framing: Hanno the Navigator, Pytheas of Massalia, Herodotus himself.

### 10.2 Ruins — voices of the deeper past
Ruins are sites of civilizations that flourished **before** the game window (~800 BC) or fell during it. Placement is region-authentic (Nuraghe only in Sardinia, pyramids only on the Nile). Excavation: an Explorer ends its turn on the tile. Rewards are fixed per ruin — deterministic; the randomness is *which* ruins spawned, per the map seed. Quick maps carry 3–5 ruins; the epic map 12–18.

| Ruin | Region | In-game discovery text | Reward |
|---|---|---|---|
| **Stele of Hammurabi** | Mesopotamia | "A basalt pillar of 282 laws — 'an eye for an eye' — carved a thousand years before your grandfathers." | Large progress toward Law/Administration |
| **Ziggurat of Ur** | Mesopotamia | "A mountain built by hands, stair upon stair toward the moon-god Nanna." | Faith + science |
| **Library of Ashurbanipal** | Assyria (Nineveh) | "Thirty thousand clay tablets — the fire that destroyed the palace baked its words immortal." | Major science boost |
| **Walls of Hattusa** | Anatolia | "The Hittite kings forged black iron here while the world still fought with bronze." | Progress toward Iron Working |
| **Göbekli Tepe** | Anatolia | "Carved pillars raised by hunters seven thousand years before the pyramids. No one remembers why." | Faith + Codex mystery entry |
| **Palace of Knossos** | Crete | "A labyrinth of a thousand rooms; its sea-kings ruled the waves before Greece had a name." | Sailing/trade knowledge |
| **Frescoes of Akrotiri** | Thera | "A town sealed in ash, its painted walls still bright — saffron gatherers, blue monkeys, ships in harbor." | Culture + unlocks a free fresco cosmetic |
| **Lion Gate of Mycenae** | Greece | "Cyclopean stones no mortal should lift; the fortress of Agamemnon's line." | Military XP to all current units |
| **Mound of Troy** | Hellespont | "Nine cities stacked in one hill of ash and legend." | Gold treasure + culture |
| **Pyramids of Giza** | Nile | "Already ancient beyond reckoning; tombs of god-kings whose names outlived their gods." | Production boost in nearest city |
| **Necropolis of Kerma** | Nubia | "Burial mounds of Kush's first kingdom, older than most of Egypt's glories." | Gold + archery knowledge |
| **Nuraghe Towers** | Sardinia | "Seven thousand stone towers raised by a people who left no words, only walls." | Free Walls in nearest city |
| **Pile-Dwellings of the Garda Moraine** | N. Italy | "Villages on stilts above the marsh — the Polada folk farmed these shores four thousand years ago." | Food boost + irrigation knowledge |
| **Terramare Embankments** | Po Valley | "Banked and ditched farm-towns, abandoned in a single generation none can explain." | Progress toward Engineering |
| **Nebra Sky Hoard** | Germania | "A bronze disc inlaid with sun, moon, and the Pleiades — the heavens, cast in metal." | Science + reveals surrounding map |
| **Hallstatt Salt Galleries** | Alps | "Miners' picks and fur caps preserved in salt; the white gold that made the first Celtic princes rich." | Salt trade good: +gold per turn |
| **Stonehenge** | Britain | "Rings of standing stones aligned to midsummer's first light." | Faith + calendar: +1 vision to all cities |
| **Alignments of Carnac** | Armorica | "Three thousand stones in marching rows, older than memory itself." | Faith |
| **Silver Hoards of Tartessos** | Iberia | "A kingdom the Greeks called rich beyond measure — vanished, its river-mouth city never found." | Large gold treasure |

### 10.3 Minor Peoples — the living villages
Small settlements of real historical peoples. They **never expand and never found empires** — but they act. Each map draws a region-appropriate subset (quick: 4–6; epic: 15–20), rotated between matches for variety.

**Disposition & interaction model:**
- Each village spawns **Open, Wary, or Hostile** (seeded; modified by your reputation, and improved if first contact is made by an Explorer).
- Player options: **Befriend** (gift gold over several turns → they grant their benefit; then a choice: *"Join us"* — the village becomes yours as a small town, capped at level 2 — or *"Migrate"* — +2 population to your nearest city plus a parting gift), **Demand tribute** (gold now, disposition drops), **Conquer** (defeat a garrison of 1–3 era-appropriate units with terrain bonus; gain the village but take a reputation hit — and *knowledge-type benefits are lost by force*: archives burn, elders flee), or **Ignore** (Hostile villages may raid nearby tiles; Open ones occasionally send gifts).
- **Design intent:** conquest is faster, friendship is richer. The assimilation-vs-subjugation tension mirrors tech Fork 5 and is itself the history lesson — it is, literally, how Rome absorbed the Latins and spent lifetimes fighting the Samnites.

**The pool** (in-game meet text + benefit):

*Italy & the islands*
| People | Meet text | Benefit |
|---|---|---|
| **Latins** | "Kin-cities of Alba Longa, bound by league, festival, and shared blood." | Assimilation: +2 pop and +culture; Rome gains bonus loyalty |
| **Sabines** | "Austere hill folk famed for piety and stubborn courage." | +Population to capital (intermarriage) |
| **Samnites** | "A warrior confederation of the mountains; their Linen Legion swears death before retreat." | Recruit Samnite Warriors (elite infantry); Hostile-leaning |
| **Lucanians** | "Oscan herdsmen and raiders of the southern uplands." | Mercenary contracts: buy units at −25% here |
| **Ligurians** | "Wiry, tireless hillmen — even their conquerors called them the hardest of foes." | Hill-fighting knowledge: units ignore hill penalty for 10 turns |
| **Veneti** | "Horse-breeders at the amber road's end, open-handed to traders." | Cavalry −25% cost; amber trade good |
| **Camuni** | "Carvers of a hundred thousand images on the living rock of their sacred valley." | Culture + free rock-art cosmetic frame |
| **Umbrians** | "Keepers of bronze tablets prescribing rite and augury in their own tongue." | Faith |
| **Etruscans** | "The Rasenna: engineers, augurs, lords of twelve cities who taught Rome to build." | Engineering progress + *Augury*: preview your next Crossroads event |
| **Sicani** | "The island's oldest people, tending vines under the volcano's gaze." | Food |
| **Siculi** | "Italic newcomers who gave Sicily its name." | +Population |
| **Elymians** | "Builders of one lonely, perfect temple on a hill at Segesta." | Culture |

*Iberia & Gaul*
| People | Meet text | Benefit |
|---|---|---|
| **Celtiberians** | "Smiths whose cold-forged blades the legions would one day copy." | Weapon knowledge: +attack to the swordsman line |
| **Lusitanians** | "Shepherd-warriors of the ambush and the vanishing raid." | Ambush knowledge: +forest attack |
| **Turdetani** | "Heirs of silver Tartessos, boasting written laws six thousand years old." | Gold + Law progress |
| **Vascones** | "Mountain people whose tongue is older than any neighbor's memory." | Progress toward Mountain Paths |
| **Belgae** | "'Of all the Gauls, the bravest' — so wrote the man who conquered them." | Recruit fierce warrior units; Hostile-leaning |

*Britain & the North*
| People | Meet text | Benefit |
|---|---|---|
| **Caledonii** | "Painted warriors of the far highlands who bow to no one." | Military XP; Hostile-leaning |
| **Hibernians** | "Gold-working clans of the green island beyond the western sea." | Gold + culture |
| **Batavi** | "Riverfolk who swim in armor beside their horses." | River mastery: your armies ignore river-crossing penalty |
| **Frisii** | "Cattle-lords of the terp mounds raised above the tides." | Food |

*Balkans & the Greek fringe*
| People | Meet text | Benefit |
|---|---|---|
| **Illyrians** | "Coast-dwellers in swift light ships — half traders, half pirates." | Recruit Lembus light warships |
| **Thracians** | "Wild horsemen and peltasts who drink from golden rhyta." | Recruit Peltasts |
| **Getae (Dacians)** | "A mountain kingdom rich in gold, whose men believe they do not die." | Gold mines: +gold per turn |
| **Molossians** | "Breeders of the great guard-hounds that kings pay fortunes for." | *War Hounds*: melee units gain first-strike vs. adjacent attackers |

*Anatolia & the Caucasus*
| People | Meet text | Benefit |
|---|---|---|
| **Lydians** | "Inventors of struck coin, wealthy beyond proverb." | Large gold + Coinage progress |
| **Phrygians** | "Keepers of Gordium, where an uncuttable knot awaits one destined to rule Asia." | Mini-Crossroads: *untie it* (patience: +science) or *cut it* (audacity: +military XP) |
| **Carians** | "Sea-mercenaries whose bronze crests once terrified the Nile." | Naval XP |
| **Galatians** | "Gauls who marched east and carved a home from the Anatolian plateau." | Recruit Celtic mercenaries |
| **Colchians** | "At the world's edge they wash river-gold from mountain fleeces." | Gold + Golden Fleece Codex entry |
| **Armenians** | "Highlanders among fortress crags, heirs of Urartu's citadels." | Walls cost −50% (fortress knowledge) |

*Levant, Arabia & Africa*
| People | Meet text | Benefit |
|---|---|---|
| **Nabataeans** | "Caravan-masters of a rose-red city, wizards of hidden water." | Desert attrition immunity + Caravan Logistics progress |
| **Chaldeans** | "Star-readers of Babylon who mapped the heavens onto clay." | Science |
| **Judeans** | "A hill people bound by covenant to one God alone." | Faith |
| **Numidians** | "Riders without bridle or bit — the finest light horse alive." | Recruit Numidian Cavalry |
| **Garamantes** | "Lords of Saharan oases whose tunnels draw water from beneath the sands." | Trans-desert trade route + oasis improvement |
| **Blemmyes** | "Nomad archers of the eastern desert." | Ranged XP |
| **Sarmatians** | "Iron-clad riders of the steppe, whose women fight beside the men." | Heavy cavalry (cataphract) progress |

### 10.4 Spawning & rotation rules
- **Regional pools only** — no Nuraghe in Gaul, no Numidians in Britain. Immersion and accuracy depend on it.
- Seeded random draw per match; the engine guarantees no exact repeat of the same set two matches running (rotation memory in the profile).
- Villages occupy a single tile plus a one-ring resource halo; they garrison and defend but never move, expand, or found cities.
- Ruin/village density is a tunable data value (config, not code — same rule as the stack cap).

---

## 11. Player Profile, Titles & Meta-Progression

Persistent player profile (local first; cloud with account in Phase 3): win/loss record per civ, per mode, achievements, and the **title ladder** — the flagship meta feature.

Each civ has a historically authentic career ladder. You climb by earning **Laurels** (wins, achievements, crossroads outcomes) *with that civ*. Your current title displays on your profile and in multiplayer lobbies.

- **Rome (the cursus honorum):** Servus → Libertus → Plebeius → Civis → Eques → Quaestor → Aedilis → Praetor → Consul → Censor → Princeps
- **Egypt:** Peasant of the Black Land → Scribe → Priest of Amun → Overseer → Nomarch → Vizier → Regent of the Two Lands
- **Greeks:** Metic → Citizen → Hoplite → Choregos → Strategos → Archon → Hegemon
- **Carthage:** Deckhand → Merchant → Shipmaster → Rab → Member of the Hundred-and-Four → Shophet
- **Gauls:** Farmhand → Warrior → Chieftain's Companion → Noble → Druid's Counsel → Vergobret
- **Britons:** Herdsman → Charioteer → Clan Champion → Chieftain → High King/Queen
- **Parthia:** Herdsman → Horse Archer → Azat → Satrap → Spahbed → King of Kings (Šāhān Šāh)
- **Kush:** Farmer of the Cataracts → Bowman → Master of Meroë's Furnaces → Priest of Apedemak → Qore/Kandake

Each promotion unlocks a Codex entry explaining the real office ("The Consuls: two elected annually, each able to veto the other — Rome's check on one-man rule").

---

## 12. Monetization — Free, Fair, Content-Driven

- **Free tier:** 3 civs (Rome, Egypt, Gauls), all quick scenarios, solo + pass-and-play, full tech tree.
- **Purchases:** individual civs or the launch bundle; expansion civs; epic map + future map packs; **coins** (soft currency, earnable slowly + purchasable) for cosmetics — mosaic/fresco unit skin variants, city styles, profile frames, title cosmetics.
- **Hard rule for v1: no gameplay advantage purchasable in online multiplayer.** XP boosts / laurel accelerators are permitted in **solo only**. This protects competitive integrity, ratings, and reviews. Revisit only with a separated casual/ranked economy.
- No ads in v1. No energy timers ever.

---

## 13. Historical Accuracy & the Educational Layer

- **Accuracy standard:** every named unit, building, office, and event must be attestable in the historical/archaeological record for the ~800 BC–117 AD window. Flavor quotes only from public-domain primary sources (Polybius, Livy, Herodotus, Caesar, Tacitus, Strabo).
- **In-game Codex:** every unlocked tech/unit/building/title adds an entry (150–300 words, readable in 60 seconds). Codex completion is itself an achievement path ("Historian" title track, civ-agnostic).
- **Scenario briefings:** each quick-mode scenario opens with the real historical situation in one paragraph.
- **Loading screens:** rotating verified "did you know" facts.
- Where gameplay must simplify (it will), the Codex says so honestly ("In reality, the phalanx…"). Simplification is fine; misinformation is not.

---

## 14. Art Direction

**Painted historical — mosaic & fresco inspired.** Reference vocabulary: Roman floor mosaics (Alexander Mosaic of Pompeii), Etruscan tomb frescoes, Egyptian tomb painting, Greek red-figure pottery, Minoan frescoes.
- Terrain: painterly texture with subtle tessera (mosaic-tile) grain; hex edges read like mosaic borders.
- Units: fresco-styled figures with civ-authentic equipment (correct scutum vs. hoplon shields, correct helmet types — this is where accuracy is most visible).
- UI: aged-plaster panels, laurel/meander (Greek key) borders, one display serif for headers (Trajan-adjacent) + a clean readable body face.
- Palette: warm terracotta, ochre, Tyrian purple, Egyptian blue, verdigris, gold leaf accents on dark umber.
- Cosmetic skins = alternate mosaic styles (e.g., "Ravenna" gold-glass variant) — monetization and art system align.

---

## 15. Build Phases (for Claude Code)

**Phase 0 — Engine core (headless, tested):** hex-grid math, map/terrain model with river edges, movement/pathfinding with terrain costs, deterministic combat resolver, three-resource economy, city model, tech tree with fork logic, weather system, seeded RNG, action log + serialization, full unit-test suite. *No UI. This phase is done when a scripted match runs headless start-to-finish.*

**Phase 1 — Playable solo (vertical slice):** renderer + touch/mouse input, Italia scenario, Rome vs. Carthage, basic AI (heuristic: expand → tech → army → strike), Explorer unit + a starter subset of Ruins (exploration excitement must be in the slice), core UI (combat preview, tech tree, city panel), win/lose flow, save/load. *Done when a stranger can finish a fun 30-minute match.*

**Phase 2 — Full content:** all 8 civs + uniques, full Old World epic map, all scenarios, crossroads events, full Ruins & Minor Peoples system (§10), Codex, title ladders (local profile), pass-and-play, art pass to the mosaic style, mobile builds (Capacitor or Godot export).

**Phase 3 — Online async:** accounts, server-authoritative engine, async matches with push notifications, cloud profiles, store (civs/coins/cosmetics).

**Phase 4 — Live multiplayer & seasons:** live matches, spectating, leaderboards, seasonal title events, expansion civs.

**Engineering priorities:** engine/renderer separation above all; every rule as data (JSON/config) not code, so balancing never requires a rebuild; replay-from-action-log as the standard debugging tool; AI must play by the identical action API as humans.

---

## 16. Open Questions (decide during Phase 1, don't block Phase 0)
1. Diplomacy depth in v1: reputation + war/peace/trade-pact only, or add alliances?
2. Fog of war: full FoW (recommended for tactics/fog weather synergy) vs. revealed map?
3. Barbarians/minor tribes as neutral spice on epic map?
4. Wonders-lite: 3–5 buildable landmarks (Pharos, Colosseum, Great Library) or defer?
5. Final name + trademark search.

*— End of brief. Engine determinism, historical accuracy, and the fork-based decision tree are the three things this game cannot compromise on.*
