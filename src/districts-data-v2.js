// HEGEMON — districts-data-v2.js (REV 2: complete 10×12 name matrix + scrubbed Great Works)
// Companion to HEGEMON-CITY-DISTRICTS-v2.md. Declarative only.
// REV 2 changes: every district type named for all 12 civs (bonus = that civ's
// unique twist; forbidden = civ cannot build it); GREAT_WORKS expanded to 57
// with the SEVEN WONDERS as a cross-civ collectible set (own all 7 = badge).

export const RECRUITMENT = {
  militaryPopCost: 1,
  minCityPopToTrain: 2,
  settlerPopCost: 1,
  civilianPopCost: 0,
  mercenaryPopCost: 0,
  mercenaryDisbandReturns: false,
  disbandProratedByHP: true,
  deathReturns: 0,
};

export const DISTRICT_SLOTS_BY_TIER = { 2:1, 4:2, 5:3, 6:4, 8:5, 10:6 };

export const DISTRICT_TYPES = [
  { id:"civic",    effect:{ cityYield:{ stability:1, gold:1 } } },
  { id:"market",   effect:{ cityYield:{ gold:2 }, special:"trade-route-capacity+1" } },
  { id:"affluent", effect:{ cityYield:{ gold:2, stability:1 } } },
  { id:"crammed",  effect:{ popCapPlus:2, growthPct:25, cityYield:{ stability:-1 } } },
  { id:"aqueduct", effect:{ cityYield:{ food:2 }, popCapPlus:1, special:"+1food-if-hills-or-river" } },
  { id:"barracks", effect:{ trainFasterPct:25, special:"units-spawn-vet1", cityDefPlus:1 } },
  { id:"harbour",  effect:{ cityYield:{ gold:2, food:1 }, special:"naval-buildable, naval-repair-2x" }, requires:"coast" },
  { id:"leisure",  effect:{ cityYield:{ stability:2 } } },
  { id:"temple",   effect:{ cityYield:{ science:1, stability:1 } } },
  { id:"greatwork",effect:{ special:"slot-for-owned-greatwork-card" }, limit:"one-per-city" },
];

// n = display name · bonus = unique extra on top of base · forbidden = cannot build
// Historical receipts in trailing comments.
export const DISTRICT_NAMES = {
  civic: {
    rome:{n:"Forum & Curia",bonus:{gold:1}}, greece:{n:"Agora & Pnyx",bonus:{science:1}},
    egypt:{n:"Vizier's Hall"}, carthage:{n:"Hall of the Hundred"}, gaul:{n:"Assembly Grove"},
    parthia:{n:"Court of the King's Kin"}, sparta:{n:"Gerousia"}, macedon:{n:"Hall of the Argeads"},
    persia:{n:"Satrap's Palace"}, han:{n:"Yamen",bonus:{stability:1}}, maurya:{n:"Sabha Hall"},
    scythia:{n:"Chieftain's Circle"},
  },
  market: {
    rome:{n:"Macellum"}, greece:{n:"Emporion"}, egypt:{n:"River Bazaar"},
    carthage:{n:"Great Emporium",bonus:{special:"trade-route+1"}},
    gaul:{n:"Riverside Fair"}, parthia:{n:"Caravanserai",bonus:{special:"trade-route-gold+1"}}, // Silk Road middlemen
    sparta:{n:"Perioikic Market"}, macedon:{n:"Royal Agora"}, persia:{n:"Bazaar"},
    han:{n:"Market Ward",bonus:{gold:1}}, // the shi: state-regulated monopoly markets
    maurya:{n:"Pana Market"}, scythia:{n:"Trading Camp"},
  },
  crammed: {
    rome:{n:"Insulae",bonus:{popCapPlus:1}}, // Rome's tenements rose 5+ storeys
    greece:{n:"Synoikiai"}, egypt:{n:"Mudbrick Quarter"},
    carthage:{n:"Terraced Quarter"}, // multi-storey Byrsa housing, excavated
    gaul:{n:"Clan Rows"}, parthia:{n:"Mudbrick Warrens"}, sparta:{n:"Village Quarters"}, // Sparta never urbanised
    macedon:{n:"Workers' Rows"}, persia:{n:"Lower Town"},
    han:{n:"Courtyard Tenements"},
    maurya:{n:"Timber Tenements",bonus:{popCapPlus:1}}, // Megasthenes: Pataliputra built in timber, vast
    scythia:{n:"Wagon Rows"}, // a nomad's dense quarter is parked wagons
  },
  affluent: {
    rome:{n:"Domus Quarter"},
    greece:{n:"Hippodamian Quarter",bonus:{stability:1}}, // Hippodamus of Miletus planned Piraeus
    egypt:{n:"Estate Villas"},
    carthage:{n:"Megara Gardens"}, // Carthage's famed garden suburb (Appian)
    gaul:{n:"Chieftains' Halls"}, parthia:{n:"Noble Compounds"},
    sparta:{forbidden:true,note:"Lycurgan law forbade luxury — Sparta cannot build affluent housing."},
    macedon:{n:"Companion Estates"},
    persia:{n:"Paradeisos Estates",bonus:{stability:1}},
    han:{n:"Marquis Compounds"}, maurya:{n:"Setthi Mansions"}, // merchant-guildmaster houses
    scythia:{n:"Royal Tents"},
  },
  aqueduct: {
    rome:{n:"Aqueduct",bonus:{food:1}},
    greece:{n:"Fountain Houses"}, // the Enneakrounos of Athens
    egypt:{n:"Canal Basin"},
    carthage:{n:"Cisterns of Byrsa"}, // the giant cistern fields, still visible
    gaul:{n:"Sacred Spring"}, parthia:{n:"Kariz Channels"}, // eastern qanat
    sparta:{n:"Eurotas Channels"}, macedon:{n:"Spring Conduits"},
    persia:{n:"Qanat Works",bonus:{special:"works-on-desert"}},
    han:{n:"Well & Sluice Works"}, maurya:{n:"Stepwell Tanks"}, scythia:{n:"Watering Grounds"},
  },
  barracks: {
    rome:{n:"Castra"}, greece:{n:"Hoplite Grounds"}, egypt:{n:"Machimoi Camp"},
    carthage:{n:"Mercenary Quarters",bonus:{special:"mercenary-cost-10"}},
    gaul:{n:"Warband Hall"}, parthia:{n:"Stables of the Clans"},
    sparta:{n:"Agoge Grounds",bonus:{special:"melee-vet2"}},
    macedon:{n:"Sarissa Drill Field"}, persia:{n:"Quarter of the Immortals"},
    han:{n:"Garrison"},
    maurya:{n:"Elephant Pens",bonus:{special:"elephant-cost-15"}},
    scythia:{n:"Remount Corral",bonus:{special:"mounted-only, mounted-cost-15"}},
  },
  harbour: {
    rome:{n:"Portus"}, greece:{n:"Deigma Docks"}, // the Piraeus exchange quay
    egypt:{n:"Nile Quays",bonus:{special:"works-on-major-river"}},
    carthage:{n:"The Cothon",bonus:{special:"naval-cost-20"}},
    gaul:{n:"River Wharves"}, parthia:{n:"River Landing"},
    sparta:{n:"Gytheion Docks"}, // Sparta's actual port
    macedon:{n:"Royal Shipsheds",bonus:{special:"naval-cost-10"}},
    persia:{n:"Tribute Docks"}, han:{n:"Canal Port"},
    maurya:{n:"Ganga Ghats",bonus:{special:"works-on-major-river"}},
    scythia:{n:"Leased Emporion"}, // Greek trading factories on the Pontic coast (Olbia)
  },
  leisure: {
    rome:{n:"Thermae",bonus:{gold:1}}, greece:{n:"Gymnasion"},
    egypt:{n:"Festival Grounds"}, // Opet and the great processions
    carthage:{n:"Punic Gardens"}, gaul:{n:"Feast Hall"},
    parthia:{n:"Hunting Park"}, // the royal paradeisos hunt
    sparta:{n:"Choral Grounds"}, // Gymnopaedia: even Spartan leisure was drill
    macedon:{n:"Theatre"}, persia:{n:"Royal Gardens"},
    han:{n:"Bathhouse & Teahouse"}, maurya:{n:"Pleasure Gardens"}, // the Arthashastra budgets them
    scythia:{n:"Feast Grounds"},
  },
  temple: {
    rome:{n:"Capitoline Precinct"}, greece:{n:"Acropolis Sanctuary"},
    egypt:{n:"Temple Estate",bonus:{gold:1}}, // the god as landlord
    carthage:{n:"Sanctuary of Baal Hammon"},
    gaul:{n:"Nemeton",bonus:{science:1}}, // the druid grove-school
    parthia:{n:"Fire Precinct"}, sparta:{n:"Temple of the Twins"}, // the Dioscuri, Sparta's patrons
    macedon:{n:"Sanctuary of Zeus"}, persia:{n:"Fire Temple"},
    han:{n:"Ancestral Temple"}, maurya:{n:"Stupa Precinct"},
    scythia:{n:"Sword Sanctuary",bonus:{stability:1}}, // Herodotus: the iron sword altar of "Ares"
  },
};

// kind: built | heritage (instant restore/claim of a pre-existing monument)
// sevenWonders: the canonical Seven — own all seven cards = collection badge.
export const GREAT_WORKS = [
  // ROME
  { id:"gw-colosseum",  civ:"rome", name:"Colosseum", rarity:"legendary", kind:"built",
    effect:{ cityYield:{ stability:3 }, empire:{ stability:1 } }, note:"Inaugurated AD 80." },
  { id:"gw-circus",     civ:"rome", name:"Circus Maximus", rarity:"epic", kind:"built",
    effect:{ cityYield:{ gold:2, stability:1 } } },
  { id:"gw-trajan",     civ:"rome", name:"Trajan's Column", rarity:"epic", kind:"built",
    effect:{ empire:{ veterancyRatePct:25 } }, note:"AD 113 — the Dacian wars in a stone spiral." },
  { id:"gw-pantheon",   civ:"rome", name:"Pantheon of Agrippa", rarity:"epic", kind:"built",
    effect:{ cityYield:{ science:1, stability:2 } }, note:"Agrippa's original, 27 BC (Hadrian's dome came later)." },
  // ATHENS
  { id:"gw-parthenon",  civ:"greece", name:"Parthenon", rarity:"legendary", kind:"built",
    effect:{ cityYield:{ science:2, stability:2 }, special:"prestige-visible-to-all" } },
  { id:"gw-dionysus",   civ:"greece", name:"Theatre of Dionysus", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 }, special:"event-reward+1" } },
  { id:"gw-zeus-olympia", civ:"greece", name:"Statue of Zeus at Olympia", rarity:"legendary", kind:"built", sevenWonders:true,
    effect:{ empire:{ stability:1 }, cityYield:{ gold:2 } }, note:"Phidias' gold-and-ivory colossus — Athenian hands, Panhellenic glory." },
  // EGYPT
  { id:"gw-pyramids",   civ:"egypt", name:"Great Pyramid & Sphinx", rarity:"legendary", kind:"heritage", sevenWonders:true,
    effect:{ capitalYield:{ food:2, gold:2, science:2, labour:2 } }, note:"Already two thousand years old in our era — you restore, not build." },
  { id:"gw-karnak",     civ:"egypt", name:"Karnak Complex", rarity:"epic", kind:"built",
    effect:{ empire:{ special:"temples+1sci+1gold" } } },
  { id:"gw-philae",     civ:"egypt", name:"Temple of Isis at Philae", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2, science:1 } }, note:"Begun under Nectanebo I — the last native flowering." },
  // CARTHAGE
  { id:"gw-cothon",     civ:"carthage", name:"Great Cothon", rarity:"legendary", kind:"built",
    effect:{ special:"city-naval-cost-25, naval-repair-3x" } },
  { id:"gw-eshmun",     civ:"carthage", name:"Temple of Eshmun", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 }, special:"garrison-heal+1" } },
  { id:"gw-byrsa",      civ:"carthage", name:"Byrsa Citadel", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:1 }, special:"city-def+25" } },
  // GAUL
  { id:"gw-carnutes",   civ:"gaul", name:"Sanctuary of the Carnutes", rarity:"legendary", kind:"built",
    effect:{ empire:{ science:1 } }, note:"Caesar: the druids' annual synod, the navel of Gaul." },
  { id:"gw-oppidum",    civ:"gaul", name:"Great Oppidum Walls", rarity:"epic", kind:"built",
    effect:{ empire:{ special:"walls+50hp" } } },
  { id:"gw-gournay",    civ:"gaul", name:"Sanctuary of Gournay", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 }, special:"plunder+10" }, note:"The trophy-sanctuary of captured arms, excavated in Picardy." },
  // PARTHIA
  { id:"gw-nisa",       civ:"parthia", name:"Palace of Nisa", rarity:"legendary", kind:"built",
    effect:{ cityYield:{ gold:2, stability:1 }, empire:{ special:"mounted-cost-10" } } },
  { id:"gw-adur",       civ:"parthia", name:"Fire Sanctuary of Adur", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 } } },
  { id:"gw-hatra",      civ:"parthia", name:"Walls of Hatra", rarity:"epic", kind:"built",
    effect:{ special:"city-def+50, enemy-siege-25" }, note:"Repelled Trajan himself, AD 117." },
  // SPARTA
  { id:"gw-orthia",     civ:"sparta", name:"Sanctuary of Artemis Orthia", rarity:"epic", kind:"built",
    effect:{ special:"city-melee-spawn-vet1-stacks" } },
  { id:"gw-menelaion",  civ:"sparta", name:"Menelaion", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 } } },
  { id:"gw-amyklai",    civ:"sparta", name:"Throne of Apollo at Amyklai", rarity:"legendary", kind:"built",
    effect:{ cityYield:{ stability:2, gold:1 }, empire:{ stability:1 } }, note:"The colossal throne-statue, Laconia's one extravagance." },
  // MACEDON
  { id:"gw-aigai",      civ:"macedon", name:"Palace of Aigai", rarity:"legendary", kind:"built",
    effect:{ empire:{ gold:1 }, special:"companions+10" } },
  { id:"gw-kings-tomb", civ:"macedon", name:"Tomb of the Kings", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 }, empire:{ veterancyRatePct:25 } } },
  { id:"gw-dion",       civ:"macedon", name:"Sanctuary of Dion", rarity:"epic", kind:"built",
    effect:{ cityYield:{ stability:2 }, special:"pre-war-blessing:+10atk-first-5-turns-of-war" }, note:"Where Alexander sacrificed before crossing to Asia." },
  // PERSIA
  { id:"gw-apadana",    civ:"persia", name:"Apadana of Persepolis", rarity:"legendary", kind:"built",
    effect:{ special:"gold-per-known-civ" } },
  { id:"gw-behistun",   civ:"persia", name:"Behistun Relief", rarity:"epic", kind:"heritage",
    effect:{ cityYield:{ stability:2 }, special:"see-rival-capitals" } },
  { id:"gw-pasargadae", civ:"persia", name:"Tomb of Cyrus", rarity:"epic", kind:"heritage",
    effect:{ empire:{ stability:1 }, special:"captured-cities-convert-1-turn-faster" }, note:"Alexander wept here and ordered it restored." },
  // HAN
  { id:"gw-weiyang",    civ:"han", name:"Weiyang Palace", rarity:"legendary", kind:"built",
    effect:{ empire:{ science:1, gold:1 } }, note:"The largest palace complex ever built, by footprint." },
  { id:"gw-greatwall",  civ:"han", name:"Great Wall Segment", rarity:"epic", kind:"built",
    effect:{ special:"border-hex-def+50-this-city" } },
  { id:"gw-terracotta", civ:"han", name:"Terracotta Army", rarity:"legendary", kind:"heritage",
    effect:{ empire:{ veterancyRatePct:25 }, cityYield:{ stability:1 } }, note:"The First Emperor's buried host — Qin's legacy in Han hands." },
  { id:"gw-dujiangyan", civ:"han", name:"Dujiangyan Waterworks", rarity:"epic", kind:"heritage",
    effect:{ special:"river-farms+1food-this-city" }, note:"256 BC and still irrigating today." },
  // MAURYA
  { id:"gw-sanchi",     civ:"maurya", name:"Sanchi Great Stupa", rarity:"legendary", kind:"built",
    effect:{ empire:{ stability:2 } } },
  { id:"gw-ashoka-pillar", civ:"maurya", name:"Pillar of Ashoka", rarity:"epic", kind:"heritage",
    effect:{ cityYield:{ stability:2, science:1 } } },
  { id:"gw-barabar",    civ:"maurya", name:"Barabar Caves", rarity:"epic", kind:"built",
    effect:{ cityYield:{ science:1, stability:1 }, special:"mirror-polish:+1sci-if-temple-district" }, note:"Rock-cut halls polished like glass, Ashokan grants to the Ajivikas." },
  // SCYTHIA
  { id:"gw-kurgan",     civ:"scythia", name:"Royal Kurgan", rarity:"legendary", kind:"built",
    effect:{ special:"unit-death-near-refund-25" } },
  { id:"gw-pectoral",   civ:"scythia", name:"Golden Pectoral Hoard", rarity:"epic", kind:"heritage",
    effect:{ capitalYield:{ gold:3 } } },
  { id:"gw-gelonus",    civ:"scythia", name:"Gelonus, the Wooden City", rarity:"epic", kind:"built",
    effect:{ cityYield:{ gold:1, science:1 }, popCapPlus:2 }, note:"Herodotus' vast timber town of the Geloni — the steppe's one metropolis." },
  // UNIVERSAL — the wandering wonders (any civ; heritage sits where history put it)
  { id:"gw-hanging-gardens", civ:null, name:"Hanging Gardens of Babylon", rarity:"legendary", kind:"heritage", sevenWonders:true,
    effect:{ cityYield:{ food:2, stability:2 } }, note:"Nebuchadnezzar's — if they stood at all; some sources point to Nineveh. The card says so." },
  { id:"gw-artemis-ephesus", civ:null, name:"Temple of Artemis at Ephesus", rarity:"legendary", kind:"heritage", sevenWonders:true,
    effect:{ cityYield:{ gold:2, stability:1 }, special:"trade-route-gold+1" }, note:"Burnt by Herostratus the night Alexander was born; rebuilt greater." },
  { id:"gw-mausoleum",  civ:null, name:"Mausoleum at Halicarnassus", rarity:"epic", kind:"heritage", sevenWonders:true,
    effect:{ cityYield:{ stability:2 }, empire:{ veterancyRatePct:10 } }, note:"Artemisia II built her husband a tomb that named all tombs after." },
  { id:"gw-colossus",   civ:null, name:"Colossus of Rhodes", rarity:"legendary", kind:"heritage", sevenWonders:true,
    effect:{ special:"harbour-city:+2gold, naval-def+15" }, note:"Stood 54 years, felled by earthquake 226 BC — even fallen, a wonder." },
  // WAVE 3 CIVS
  { id:"gw-second-temple", civ:"judea", name:"The Second Temple", rarity:"legendary", kind:"built", wave:3,
    effect:{ cityYield:{ stability:3, science:1 }, empire:{ stability:1 } },
    note:"Solomon's fell in 586 BC, before our age; Zerubbabel rebuilt, Herod made it wonder-class." },
  { id:"gw-pharos",     civ:"ptolemies", name:"Pharos Lighthouse", rarity:"legendary", kind:"built", sevenWonders:true, wave:3,
    effect:{ special:"harbour-city:+3gold, friendly-ships-vision+2" }, note:"Alexandria's flame, seen fifty kilometres out." },
  { id:"gw-library",    civ:"ptolemies", name:"Great Library of Alexandria", rarity:"legendary", kind:"built", wave:3,
    effect:{ empire:{ science:2 }, special:"researchCostPct-10" } },
  { id:"gw-daphne",     civ:"seleucids", name:"Grove of Daphne", rarity:"epic", kind:"built", wave:3,
    effect:{ cityYield:{ stability:2, gold:1 } } },
  { id:"gw-pergamon-altar", civ:"pergamon", name:"Great Altar of Pergamon", rarity:"legendary", kind:"built", wave:3,
    effect:{ cityYield:{ stability:2, science:1 }, special:"prestige-visible-to-all" }, note:"The Gigantomachy frieze — marble as war memorial." },
  { id:"gw-meroe",      civ:"kush", name:"Pyramids of Meroë", rarity:"legendary", kind:"built", wave:3,
    effect:{ capitalYield:{ gold:2, stability:2 } }, note:"Kush built MORE pyramids than Egypt — steeper, younger, in-era." },
  { id:"gw-medracen",   civ:"numidia", name:"Mausoleum of Medracen", rarity:"epic", kind:"heritage", wave:3,
    effect:{ cityYield:{ stability:2 } } },
  { id:"gw-melqart",    civ:"phoenicia", name:"Temple of Melqart at Tyre", rarity:"legendary", kind:"heritage", wave:3,
    effect:{ cityYield:{ gold:2 }, special:"trade-route-gold+1" }, note:"Herodotus went to see its twin pillars himself." },
  { id:"gw-kazanlak",   civ:"thrace", name:"Tomb of Kazanlak", rarity:"epic", kind:"built", wave:3,
    effect:{ cityYield:{ stability:2 } } },
  { id:"gw-sarmizegetusa", civ:"dacia", name:"Sarmizegetusa Regia", rarity:"legendary", kind:"built", wave:3,
    effect:{ cityYield:{ science:1, stability:1 }, special:"city-def+25" }, note:"The sacred mountain capital with its stone calendar sanctuary." },
  { id:"gw-garni",      civ:"armenia", name:"Temple of Garni", rarity:"epic", kind:"built", wave:3,
    effect:{ cityYield:{ stability:2 } }, note:"AD 77, and still standing." },
  { id:"gw-ai-khanoum", civ:"bactria", name:"Ai-Khanoum", rarity:"epic", kind:"built", wave:3,
    effect:{ cityYield:{ science:2 } }, note:"A Greek city on the Oxus, Delphic maxims carved at the world's edge." },
  { id:"gw-tarquinia",  civ:"etruria", name:"Painted Tombs of Tarquinia", rarity:"epic", kind:"heritage", wave:3,
    effect:{ cityYield:{ stability:1, gold:1 } } },
  { id:"gw-numantia",   civ:"celtiberia", name:"Walls of Numantia", rarity:"epic", kind:"built", wave:3,
    effect:{ special:"city-def+50-when-besieged" }, note:"Twenty years defying Rome; chose fire over surrender." },
  { id:"gw-stonehenge", civ:"britannia", name:"Stonehenge", rarity:"legendary", kind:"heritage", sevenWonders:false, wave:3,
    effect:{ cityYield:{ science:2 }, special:"events-favourable" }, note:"Millennia old already — the Britons inherited it as you do." },
];
