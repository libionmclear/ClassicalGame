# HEGEMON — Civilizations & Cards v2 (Design of Record)

> Scope confirmed: full classical Old World (~800 BC – AD 117), including India
> and China. Legends: 5–6 per playable civ. Tech tree: shared trunk + civ-unique
> branch (~60/40). Cards remain strictly NOT pay-to-win — money only skips grind.
>
> This replaces the "generals" concept in `game.js CARDS`. Companion data file:
> `cards-data-v2.js`.

---

## 1. Civilization roster & rarity

Civ cards unlock **who you can play**. Rarity reflects collectibility, never
power — every civ is balanced for play. Three starter civs are owned by default.

### Wave 1 — Playable now (current six)
| Civ | Card rarity | Notes |
|---|---|---|
| Rome | Starter (free) | |
| Athens | Starter (free) | Rename from generic "Greece" — Sparta becomes its own civ |
| Egypt | Starter (free) | Native/Late Period Egypt (Saite–Nectanebo). Ptolemies are a separate card civ |
| Carthage | Rare | |
| Gaul | Rare | |
| Parthia | Rare | |

### Wave 2 — Next playable (build order suggestion)
| Civ | Card rarity | Signature identity |
|---|---|---|
| Sparta | Rare | Elite infantry, agoge, low economy |
| Macedon | Epic | Combined arms, companion cavalry, conquest tempo |
| Achaemenid Persia | Epic | Royal Road (logistics), satrapy gold, immortals |
| Han China | Epic | Crossbows, Silk Road trade, bureaucracy science |
| Maurya India | Epic | War elephants at scale, Arthashastra statecraft |
| Scythia | Epic | All-mounted, no fixed cities penalty reduction, steppe mobility |

### Wave 3 — Card-collectible now, playable later (scenario powers)
Legendary/Epic civ cards. Owning one before the civ ships = founding badge on it.

Phoenicia (Tyre & Sidon) · Ptolemaic Egypt · Seleucid Empire · Numidia · Kush
(Nubia) · Etruria · Epirus · Pontus · Armenia · Judea (Hasmonean) · Thrace ·
Dacia · Illyria · Celtiberia · Germania · Britannia · Pergamon · Greco-Bactria

**Rarity mapping for Wave 3:** Rare (Phoenicia, Etruria, Thrace), Epic
(Ptolemies, Seleucids, Numidia, Epirus, Pontus, Judea, Celtiberia, Germania,
Britannia, Armenia), Legendary (Kush, Dacia, Illyria, Pergamon, Greco-Bactria).

---

## 2. "Generals" → **LEGENDS**

New name for people cards: **Legends**. (Alternates considered: Luminaries,
*Viri Illustres*. "Legends" is the recommendation — short, localizes well,
covers women and non-military figures.)

Every Legend is a real, attested historical person inside the game window.
Where historicity is soft (Lycurgus), the card text says so — accuracy is a
feature, and card blurbs double as micro-history lessons.

### Roles (drive the effect template)
| Role | Icon idea | Effect domain |
|---|---|---|
| **Commander** | crossed swords | combat modifiers |
| **Statesman** | laurel | gold, city stability, expansion |
| **Sage** | scroll | science, research discounts |
| **Builder** | column | production, improvement speed |
| **Navigator** | astrolabe | naval, trade routes, embark |

### Loadout change (replaces "equip ≤3 generals")
Per game you slot exactly **three cards, one per type**:
1. **LEGEND** — persistent person perk (must match your civ)
2. **EDICT** — persistent policy/economic card (civ-specific or universal)
3. **EVENT** — one-use, you choose the turn to play it (civ-matched or universal)

This kills the "stack three commanders" degenerate loadout and makes collection
breadth matter. Legendary Legends are *interesting*, not strictly stronger —
e.g., Caesar's perk has a drawback (see below) to stay off the pay-to-win path.

---

## 3. LEGENDS — full first-wave roster (12 playable civs, 68 cards)

Effects are stated in engine terms (flat/% modifiers the current engine already
supports: combat %, per-city yields, movement, heal, gold, research %).
Rarity: C common · R rare · E epic · L legendary. One L per civ (the flagship).

### ROME
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Scipio Africanus | Commander | E | +15% attack vs. Carthaginian-category units; +10% attack otherwise | Zama, 202 BC |
| Julius Caesar | Commander | L | +15% attack; conquered cities keep +1 stability; **−1 gold/city** (largesse & debts) | Gaul, the Rubicon |
| Augustus | Statesman | E | +1 gold and +1 stability per city | Pax Romana |
| Cato the Elder | Statesman | R | +2 gold/turn per trade route; farms +1 food | *De Agri Cultura*; "Carthago delenda est" |
| Cicero | Sage | R | −10% research cost on civic/economy techs | The orator-consul |
| Marcus Agrippa | Builder | R | Aqueducts & harbours build 30% faster; +1 naval combat | Rome's master engineer, Actium |

### CARTHAGE
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Hannibal Barca | Commander | L | War elephants +25%; may cross mountains without Mountain Paths (his army only pays +1) | The Alps, Cannae |
| Hamilcar Barca | Commander | E | +15% attack in enemy territory | Sicily & Iberia campaigns |
| Hasdrubal the Fair | Statesman | R | New cities found with +1 population | Founder of New Carthage |
| Hanno the Navigator | Navigator | E | Ships +2 movement; storms never damage your fleet | Periplus down the African coast |
| Mago the Agronomist | Sage | R | Farms & vineyards +1 food/gold | His 28-book farming treatise — the one work Rome saved from the ruins |
| Himilco | Navigator | R | Deep-sea tiles cost 1 move; +1 vision at sea | Voyage into the Atlantic north |

### ATHENS
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Pericles | Statesman | L | +1 science & +1 gold per city with a temple/academy; wonders 20% cheaper | The building program, the Funeral Oration |
| Themistocles | Navigator | E | Triremes +20% combat and cost 20% less | Salamis, 480 BC |
| Solon | Statesman | R | +1 stability all cities; unrest events halved | The lawgiver |
| Plato | Sage | E | Academies give +2 extra science | The Academy itself |
| Phidias | Builder | R | Temples & wonders build 25% faster | Parthenon sculptor |
| Demosthenes | Sage | R | −15% research cost on military doctrines | *Philippics* |

### EGYPT (native, Saite → Nectanebo)
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Psamtik I | Statesman | L | +1 all yields in your capital; mercenary (gold-purchased) units −20% cost | Reunified Egypt, 664 BC |
| Necho II | Navigator | E | Harbours +2 gold; may embark without Sailing on river-adjacent tiles | Canal works; sent Phoenicians around Africa |
| Amasis II | Statesman | R | +2 gold/turn per foreign trade route | The pragmatist pharaoh, Greek trade at Naucratis |
| Nectanebo II | Commander | R | +25% defense inside own territory | Last native pharaoh, master of the defensive Nile |
| Manetho | Sage | R | +1 science per temple | Wrote Egypt's history for the Greek world |
| Wahibre (Apries) | Commander | R | Spearmen +15%; navy +10% | Campaigns in the Levant |

### GAUL
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Vercingetorix | Commander | L | +20% attack; when a city is besieged, all your units in its territory +25% | Gergovia, Alesia |
| Brennus | Commander | E | +30% gold plundered from cities and improvements | Sacked Rome, 390 BC — "vae victis" |
| Ambiorix | Commander | R | +25% attack when ambushing from forest/fog | Destroyed a legion and a half |
| Diviciacus | Sage | R | +1 science per city; +1 diplomacy weight | The druid Cicero knew personally |
| Dumnorix | Statesman | R | Trade posts +2 gold | Aeduan strongman who ran the river tolls |
| Commius | Statesman | R | +1 stability; conquered cities convert 1 turn faster | Kingmaker on both sides of the Channel |

### PARTHIA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Surena | Commander | L | Horse archers +25%; your mounted units heal 2 HP/turn in the field (camel resupply) | Carrhae, 53 BC |
| Arsaces I | Statesman | E | New cities +1 pop; mounted units −15% cost | Founder of the dynasty |
| Mithridates I | Statesman | E | +1 gold & +1 science per city (Hellenic + Iranian synthesis) | Took Mesopotamia, "Philhellene" |
| Orodes II | Commander | R | +15% defense; enemy siege −20% | The king who beat Crassus |
| Vologases I | Statesman | R | Trade routes +3 gold (Silk Road tolls) | Standardized the realm |

### SPARTA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Leonidas I | Commander | L | Spearmen +30% defense; +60% when defending hills/passes | Thermopylae |
| Brasidas | Commander | E | Infantry +1 movement; +15% attack | The un-Spartan Spartan — fast, bold, liberating cities |
| Lysander | Navigator | R | Triremes +15%; +2 gold per naval trade route | Aegospotami |
| Agesilaus II | Commander | R | +15% attack in enemy territory | Campaigns in Asia |
| Lycurgus | Statesman | R | Military units −15% cost; **−1 gold/city** (iron currency) | The (semi-legendary) lawgiver — card says so |
| Chilon | Sage | R | +1 stability all cities | One of the Seven Sages |

### MACEDON
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Alexander III | Commander | L | +20% attack; your units heal fully when you capture a city | The obvious flagship |
| Philip II | Commander | E | Combined Arms bonus doubled; siege units +20% | He built the machine Alexander drove |
| Parmenion | Commander | R | Your armies +10% when stacked (2+ units) | The steady left wing |
| Antipater | Statesman | R | +1 stability; home cities +1 gold while you fight abroad | Held Macedon together |
| Aristotle | Sage | E | −15% research cost; academies +1 science | Tutor at Mieza |
| Craterus | Commander | R | Veterancy gained 50% faster | The soldiers' general |

### ACHAEMENID PERSIA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Cyrus II the Great | Statesman | L | Conquered cities keep all buildings and convert instantly | The tolerant conqueror; the Cylinder |
| Darius I | Builder | E | Roads cost nothing to build; +1 gold per city (satrapy tax) | Royal Road, the daric |
| Xerxes I | Commander | R | +15% attack when your army outnumbers the defender | The great invasion |
| Artemisia I | Navigator | E | Ships +15%; may retreat after one round of naval combat | Salamis — "my men have become women…" |
| Mardonius | Commander | R | +10% attack; fallen units refund 25% cost | Plataea's persistent commander |

### HAN CHINA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Emperor Wu (Wudi) | Statesman | L | +1 science per city; mounted units +15% (his great horse program) | The expansionist Han |
| Liu Bang (Gaozu) | Statesman | E | +1 stability; cities recover from siege 2× faster | Peasant to emperor |
| Wei Qing | Commander | R | Mounted units +20% vs. mounted (steppe war) | Broke the Xiongnu |
| Zhang Qian | Navigator | E | Trade routes +3 gold and +1 science (Silk Road embassies) | The great journey west |
| Sima Qian | Sage | R | −10% research cost; events give +1 extra reward | The *Records of the Grand Historian* |
| Cai Lun | Builder | R | Libraries/academies +1 science, build 30% faster | Paper, AD 105 — just inside the window |

### MAURYA INDIA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Ashoka | Statesman | L | +2 stability all cities; +1 science per temple; **your first war costs −2 stability** (remorse mechanic inverted: he had it, you get it) | Kalinga and the edicts |
| Chandragupta | Commander | E | +15% attack; war elephants −20% cost | Founder; faced Seleucus and won 500 elephants in the deal |
| Chanakya | Sage | E | +1 gold per city; enemy AI reveals its target city to you (espionage) | The *Arthashastra* |
| Bindusara | Statesman | R | +2 gold/turn per trade route | "Slayer of enemies," consolidator |
| Panini | Sage | R | −10% research cost on civic techs | The grammarian (Gandhara, ~4th c. BC) |

### SCYTHIA
| Legend | Role | Rarity | Effect | Historical hook |
|---|---|---|---|---|
| Idanthyrsus | Commander | L | Your mounted units may retreat 1 hex after being attacked (scorched-steppe doctrine) | Out-rode Darius himself |
| Tomyris | Commander | E | +25% attack when defending home territory | Massagetae queen who ended Cyrus (card notes the Massagetae kinship) |
| Ateas | Statesman | R | Pastures +1 food +1 gold | United the tribes, fell at 90 fighting Philip II |
| Anacharsis | Sage | R | +1 science per city; +1 diplomacy weight | The Scythian counted among the Seven Sages |
| Madyes | Commander | R | +15% attack; plunder +20% | Led the great raid into the Near East |

---

## 4. EDICTS (persistent policy cards — slot 2)

Universal (any civ) + civ-specific. First-wave list:

**Universal (C/R):**
- *Grain Dole* — capital +2 food (C)
- *Corvée Labour* — improvements build 25% faster, −1 stability capital (C)
- *Standing Levy* — military units −10% cost (R)
- *Coastal Patrols* — your coast tiles +1 vision, ships +1 defense (C)
- *Census & Registry* — +1 gold per city (R)
- *Sacred Truce* — +2 stability, cannot declare war first 20 turns (R)

**Civ-specific (E):**
- Rome *Cursus Publicus* — roads give an extra ½-move discount to your units
- Carthage *Mercenary Contracts* — may buy units instantly with gold at +25% price
- Athens *Delian Tribute* — +1 gold per allied/vassal city
- Egypt *Nile Inundation* — river-adjacent farms +2 food
- Gaul *Oppida Network* — hill cities +2 production, +25% defense
- Parthia *Silk Road Tolls* — +2 gold per foreign trade route crossing your land
- Sparta *The Agoge* — new melee units spawn with 1 veterancy
- Macedon *Companion Cavalry* — mounted units +1 movement
- Persia *Royal Road* — your roads also grant +1 vision
- Han *Imperial Examination* — +1 science per city with a library
- Maurya *Arthashastra Statecraft* — see enemy gold & science totals
- Scythia *Wagon Camps* — your units heal in neutral territory

## 5. EVENTS (one-use cards — slot 3)

Play on any turn; consumed. Universal examples (C→E by strength):
*Bumper Harvest* (+10 food capital), *Favourable Omens* (+20% attack, one
battle), *Defection* (an adjacent enemy unit joins you if damaged ≤50%),
*Storm Averted* (negate weather effects 3 turns), *Forced March* (+2 move all
units, 1 turn), *Philosopher's Visit* (+15 science instantly).

Civ-matched Events (E/L) tie to real moments: Rome *Crossing the Rubicon*
(+25% attack 3 turns, −2 stability), Carthage *Oath of Hamilcar* (all units
+15% vs. one chosen enemy civ, rest of game — pick at play), Han *Heavenly
Horses* (spawn 2 horsemen at capital), etc. Full list in wave 2.

---

## 6. Pack & rarity economy (unchanged pillar: never pay-to-win)

- **Rarities:** Common / Rare / Epic / Legendary — drop rates 70/20/8/2.
- **Sources:** coins (earned per game, win bonus), daily reward, achievements,
  and purchased packs (money = skip grind only; nothing exclusive to money).
- **Duplicates** convert to shards; shards craft any card (Legendary ≈ 3–4
  duplicate legendaries' worth — standard pity economy).
- **Pity timer:** guaranteed Epic+ every 10 packs.
- **Every card is earnable free.** Legendary Legends are *distinct*, not
  strictly stronger — several carry drawbacks (Caesar, Lycurgus, Ashoka).

## 7. Migration notes for Claude Code

1. `CARDS` in `game.js`: split `generals` → `legends`; add `edicts`, keep
   `events`; civs list extends per §1 (Wave 3 civs are cards with
   `playable:false`).
2. Loadout validation: exactly one of each type; `legend.civ` must equal the
   played civ; edict/event civ-specific cards likewise.
3. Effects map to existing engine hooks (combat modifiers, TECH_CITY_YIELD-style
   flat yields, movement, heal, cost multipliers). New hooks needed: plunder %,
   post-capture heal (Alexander), retreat-after-attack (Idanthyrsus/Artemisia),
   stability (if stability isn't yet a stat — flag: several cards assume a city
   stability/unrest value; if absent, substitute +gold or +food until stability
   ships).
4. Rename "Greece" → Athens in `CIV_ROSTER` copy (id `greece` can stay for
   save compatibility; display name changes).
5. Card art slots unchanged — these 68 Legends define the art commission list.
