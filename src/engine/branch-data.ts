// AUTO-GENERATED from src/techs-v2.js by scripts/gen-branch-data.mjs — DO NOT EDIT BY HAND.
// The declarative civ-unique tech branches (design of record: docs/HEGEMON-TECHTREE-v2.md).
export interface BranchInfo { name: string; color: string; }
export interface BranchTech {
  id: string; civ: string; age: 1 | 2 | 3; prereq: string[]; name: string;
  effect: Record<string, unknown>; note: string; capstone?: boolean;
}
export interface NewUnitSketch { id: string; civ: string; cat: string; basedOn: string; tweak: string; }
export interface NewBuildingSketch { id: string; civ: string; cost: string; yields: Record<string, number>; }

export const BRANCHES: Record<string, BranchInfo> = {
  "rome": {
    "name": "Via Romana",
    "color": "#c0392b"
  },
  "carthage": {
    "name": "The Sea Charter",
    "color": "#8e44ad"
  },
  "greece": {
    "name": "The School of Hellas",
    "color": "#2e86de"
  },
  "egypt": {
    "name": "Gift of the Nile",
    "color": "#d4ac0d"
  },
  "gaul": {
    "name": "The Oppida",
    "color": "#27ae60"
  },
  "parthia": {
    "name": "The Horse and the Road",
    "color": "#e67e22"
  },
  "sparta": {
    "name": "The Agoge",
    "color": "#7f1d1d"
  },
  "macedon": {
    "name": "The Companions",
    "color": "#1e3a8a"
  },
  "persia": {
    "name": "The King's Peace",
    "color": "#0e7490"
  },
  "han": {
    "name": "The Mandate",
    "color": "#b91c1c"
  },
  "maurya": {
    "name": "The Wheel of Law",
    "color": "#a16207"
  },
  "scythia": {
    "name": "The Endless Steppe",
    "color": "#4d7c0f"
  },
  "britons": {
    "name": "The Painted Isle",
    "color": "#16a085"
  },
  "kush": {
    "name": "Lords of the Bow",
    "color": "#935116"
  }
};

export const UNIQUE_TECHS: BranchTech[] = [
  {
    "id": "res-publica",
    "civ": "rome",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "The Senate",
    "effect": {
      "cityYield": {
        "stability": 1
      },
      "unlocks": [
        "forum"
      ]
    },
    "note": "Res publica: consuls, senate, assemblies. Unlocks the Forum building."
  },
  {
    "id": "twelve-tables",
    "civ": "rome",
    "age": 1,
    "prereq": [
      "res-publica"
    ],
    "name": "Twelve Tables",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "451 BC: law posted in public, the same for all citizens."
  },
  {
    "id": "castra",
    "civ": "rome",
    "age": 2,
    "prereq": [
      "bronze-working"
    ],
    "name": "Marching camps",
    "effect": {
      "special": "units-heal-in-enemy-territory-when-fortified",
      "defPct": 15,
      "condition": "fortified"
    },
    "note": "Every night on campaign, a legion built itself a fortress."
  },
  {
    "id": "legionary-system",
    "civ": "rome",
    "age": 2,
    "prereq": [
      "iron-working",
      "castra"
    ],
    "name": "Legionary system",
    "effect": {
      "unlocks": [
        "legionary"
      ]
    },
    "note": "Manipular flexibility over the rigid phalanx. (existing tech, absorbed)"
  },
  {
    "id": "viae-romanae",
    "civ": "rome",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "Viae Romanae",
    "effect": {
      "special": "roads-half-labour-cost",
      "roadMoveBonus": true
    },
    "note": "All roads led to Rome because Rome built all the roads."
  },
  {
    "id": "forum-romanum",
    "civ": "rome",
    "age": 2,
    "prereq": [
      "res-publica"
    ],
    "name": "Forums",
    "effect": {
      "buildingBoost": {
        "forum": {
          "gold": 2,
          "stability": 1
        }
      }
    },
    "note": "Market, court, and rostra in one square — the civic engine."
  },
  {
    "id": "opus-caementicium",
    "civ": "rome",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "Roman concrete",
    "effect": {
      "buildFasterPct": 25,
      "special": "walls+50hp"
    },
    "note": "Concrete that set underwater. The Pantheon's dome still stands on it."
  },
  {
    "id": "imperial-aqueducts",
    "civ": "rome",
    "age": 3,
    "prereq": [
      "aqueducts",
      "opus-caementicium"
    ],
    "name": "Imperial aqueducts",
    "effect": {
      "buildingBoost": {
        "aqueduct": {
          "food": 2
        }
      }
    },
    "note": "Eleven aqueducts fed Rome a million people. Stacks on the shared tech."
  },
  {
    "id": "marian-reforms",
    "civ": "rome",
    "age": 3,
    "prereq": [
      "legionary-system"
    ],
    "name": "Marian reforms",
    "effect": {
      "upkeepPct": -25,
      "special": "melee-spawn-vet1"
    },
    "note": "107 BC: a professional standing army — Marius' mules, loyal to their general."
  },
  {
    "id": "cursus-honorum",
    "civ": "rome",
    "age": 3,
    "prereq": [
      "twelve-tables"
    ],
    "name": "Cursus honorum",
    "effect": {
      "cityYield": {
        "gold": 1,
        "science": 1
      }
    },
    "note": "The ladder of offices: quaestor to consul, administration as a career."
  },
  {
    "id": "testudo",
    "civ": "rome",
    "age": 3,
    "prereq": [
      "marian-reforms"
    ],
    "name": "Testudo",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "infantry",
        "defPct": 50,
        "vsCat": [
          "ranged",
          "siege"
        ]
      },
      "atkPct": 20,
      "infantryOnly": true
    },
    "note": "The tortoise. (existing doctrine, now the branch capstone)"
  },
  {
    "id": "suffete-council",
    "civ": "carthage",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Council of the Hundred",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Suffetes and senate — Aristotle rated Carthage's constitution above most Greek ones."
  },
  {
    "id": "tyrian-purple",
    "civ": "carthage",
    "age": 1,
    "prereq": [
      "sailing"
    ],
    "name": "Tyrian purple",
    "effect": {
      "tradeRouteGold": 2
    },
    "note": "The murex dye worth its weight in silver — the Phoenician inheritance."
  },
  {
    "id": "quinquereme-yards",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "open-sea-sailing"
    ],
    "name": "Quinquereme yards",
    "effect": {
      "unitCatCostPct": {
        "cat": "naval",
        "costPct": -25
      }
    },
    "note": "Mass-produced hulls with numbered timbers — flat-pack warships."
  },
  {
    "id": "the-cothon",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "quinquereme-yards"
    ],
    "name": "The Cothon",
    "effect": {
      "special": "harbours-repair-ships-2x, harbour+1labour"
    },
    "note": "The circular military harbour: 170 ship-sheds hidden behind the merchant port."
  },
  {
    "id": "mercenary-system",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "suffete-council"
    ],
    "name": "Mercenary levies",
    "effect": {
      "special": "buy-units-instantly-gold+25pct"
    },
    "note": "Libyans, Iberians, Balearics, Gauls — Carthage paid; others bled."
  },
  {
    "id": "magos-agronomy",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "irrigation"
    ],
    "name": "Mago's agronomy",
    "effect": {
      "special": "farm+1food, vineyard+1gold"
    },
    "note": "The 28-book treatise Rome translated even as it razed the city."
  },
  {
    "id": "periplus-voyages",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "open-sea-sailing"
    ],
    "name": "Periplus voyages",
    "effect": {
      "navalVisionPlus": 1,
      "special": "storm-damage-halved"
    },
    "note": "Hanno south, Himilco north — charted seas no rival dared."
  },
  {
    "id": "war-elephants",
    "civ": "carthage",
    "age": 2,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "War elephants",
    "effect": {
      "unlocks": [
        "war-elephant"
      ]
    },
    "note": "African forest elephants of the Atlas. (existing tech, absorbed)"
  },
  {
    "id": "numidian-alliance",
    "civ": "carthage",
    "age": 3,
    "prereq": [
      "mercenary-system"
    ],
    "name": "Numidian alliance",
    "effect": {
      "unitCatCostPct": {
        "cat": "mounted",
        "costPct": -25
      },
      "unitCatPct": {
        "cat": "mounted",
        "movePlus": 1
      }
    },
    "note": "The finest light cavalry in the west, bridled by treaty not by bit."
  },
  {
    "id": "thalassocracy",
    "civ": "carthage",
    "age": 3,
    "prereq": [
      "the-cothon"
    ],
    "name": "Thalassocracy",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "naval",
        "atkPct": 30,
        "costPct": -25
      }
    },
    "note": "Rule of the sea. (existing doctrine, now the branch capstone)"
  },
  {
    "id": "ekklesia",
    "civ": "greece",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "The Ekklesia",
    "effect": {
      "cityYield": {
        "stability": 1
      },
      "capitalYield": {
        "science": 1
      }
    },
    "note": "Every citizen a voice on the Pnyx — demokratia."
  },
  {
    "id": "laurium-silver",
    "civ": "greece",
    "age": 1,
    "prereq": [
      "bronze-working"
    ],
    "name": "Owls of Laurium",
    "effect": {
      "special": "mine+2gold"
    },
    "note": "Slave-dug silver struck into owls — the ancient world's reserve currency."
  },
  {
    "id": "neorion",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "open-sea-sailing"
    ],
    "name": "Shipsheds of Piraeus",
    "effect": {
      "unitPct": {
        "unit": "trireme",
        "costPct": -20
      }
    },
    "note": "Hundreds of covered slipways; a navy stored like a library."
  },
  {
    "id": "long-walls",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "The Long Walls",
    "effect": {
      "special": "capital-and-coastal-walls+50hp"
    },
    "note": "City and harbour joined in one fortress — starve-proof while the fleet lived."
  },
  {
    "id": "the-academy",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "philosophy"
    ],
    "name": "The Academy",
    "effect": {
      "buildingBoost": {
        "academy": {
          "science": 2
        }
      }
    },
    "note": "Plato's olive grove. It ran for three centuries."
  },
  {
    "id": "drama-festivals",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "pottery"
    ],
    "name": "Dionysia festivals",
    "effect": {
      "buildingBoost": {
        "amphitheater": {
          "gold": 1,
          "stability": 1
        }
      }
    },
    "note": "Tragedy and comedy as civic institutions, funded by the rich as taxation."
  },
  {
    "id": "hippocratic-medicine",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "philosophy"
    ],
    "name": "Hippocratic medicine",
    "effect": {
      "healPlus": 2
    },
    "note": "Disease as nature, not curse. First, do no harm."
  },
  {
    "id": "hoplite-phalanx",
    "civ": "greece",
    "age": 2,
    "prereq": [
      "bronze-working"
    ],
    "name": "Hoplite levy",
    "effect": {
      "unlocks": [
        "hoplite"
      ]
    },
    "note": "Citizen-soldiers who bought their own bronze. (existing tech, absorbed)"
  },
  {
    "id": "delian-league",
    "civ": "greece",
    "age": 3,
    "prereq": [
      "neorion"
    ],
    "name": "Delian League",
    "effect": {
      "special": "gold-per-allied-or-coastal-city"
    },
    "note": "An alliance that became an empire; the treasury moved from Delos to Athens."
  },
  {
    "id": "wooden-walls",
    "civ": "greece",
    "age": 3,
    "prereq": [
      "neorion",
      "long-walls"
    ],
    "name": "Wooden walls",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "naval",
        "atkPct": 25,
        "defPct": 25
      },
      "special": "coastal-city-def+25"
    },
    "note": "NEW capstone (Phalanx Wall moves to Sparta). The oracle's riddle, Themistocles' answer."
  },
  {
    "id": "nilometer",
    "civ": "egypt",
    "age": 1,
    "prereq": [
      "irrigation"
    ],
    "name": "Nilometers",
    "effect": {
      "special": "river-farm+1food"
    },
    "note": "Measure the flood, predict the harvest, set the tax."
  },
  {
    "id": "basin-irrigation",
    "civ": "egypt",
    "age": 1,
    "prereq": [
      "irrigation"
    ],
    "name": "Basin irrigation",
    "effect": {
      "special": "farm-buildable-on-desert-river-tiles"
    },
    "note": "Trap the inundation in basins; the desert edge turns green."
  },
  {
    "id": "temple-estates",
    "civ": "egypt",
    "age": 2,
    "prereq": [
      "pottery"
    ],
    "name": "Temple estates",
    "effect": {
      "buildingBoost": {
        "temple": {
          "gold": 1,
          "food": 1
        }
      }
    },
    "note": "The gods were Egypt's biggest landowners — and its granaries."
  },
  {
    "id": "priestly-schools",
    "civ": "egypt",
    "age": 2,
    "prereq": [
      "writing"
    ],
    "name": "Houses of Life",
    "effect": {
      "buildingBoost": {
        "temple": {
          "science": 1
        }
      }
    },
    "note": "Per-ankh: scriptoria where medicine, astronomy, and ritual were copied for centuries."
  },
  {
    "id": "machimoi-greeks",
    "civ": "egypt",
    "age": 2,
    "prereq": [
      "temple-estates"
    ],
    "name": "Greek mercenaries",
    "effect": {
      "special": "buy-units-instantly-gold+25pct"
    },
    "note": "Psamtik's 'bronze men from the sea' — Ionian spears on Saite silver."
  },
  {
    "id": "chariotry",
    "civ": "egypt",
    "age": 2,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Chariotry",
    "effect": {
      "unlocks": [
        "war-chariot"
      ]
    },
    "note": "(existing tech, absorbed)"
  },
  {
    "id": "nubian-archers",
    "civ": "egypt",
    "age": 2,
    "prereq": [
      "archery"
    ],
    "name": "Nubian archer corps",
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 15
      }
    },
    "note": "Ta-Seti — 'Land of the Bow.' Egypt recruited the best archers on earth next door."
  },
  {
    "id": "red-sea-canal",
    "civ": "egypt",
    "age": 3,
    "prereq": [
      "sailing",
      "basin-irrigation"
    ],
    "name": "Necho's canal",
    "effect": {
      "special": "harbour+2gold, embark-from-river-tiles"
    },
    "note": "Nile to Red Sea; his Phoenician crews then rounded all of Africa."
  },
  {
    "id": "monumental-works",
    "civ": "egypt",
    "age": 3,
    "prereq": [
      "masonry"
    ],
    "name": "Monumental works",
    "effect": {
      "wonderCostPct": -25
    },
    "note": "Two millennia of practice moving very large stones very precisely."
  },
  {
    "id": "nile-bureaucracy",
    "civ": "egypt",
    "age": 3,
    "prereq": [
      "nilometer",
      "priestly-schools"
    ],
    "name": "Nile bureaucracy",
    "capstone": true,
    "effect": {
      "cityYield": {
        "food": 1,
        "science": 1
      }
    },
    "note": "(existing doctrine, now the branch capstone)"
  },
  {
    "id": "druidic-councils",
    "civ": "gaul",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Druidic councils",
    "effect": {
      "cityYield": {
        "science": 1
      }
    },
    "note": "Twenty years of oral training; judges, astronomers, and diplomats between tribes."
  },
  {
    "id": "celtic-coinage",
    "civ": "gaul",
    "age": 1,
    "prereq": [
      "bronze-working"
    ],
    "name": "Celtic coinage",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Gold staters copied from Macedon, then made wildly, beautifully Gallic."
  },
  {
    "id": "murus-gallicus",
    "civ": "gaul",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "Murus gallicus",
    "effect": {
      "special": "walls+50hp, hill-city-def+25"
    },
    "note": "Timber-laced stone ramparts — fireproof, ram-proof. Caesar admired them in writing."
  },
  {
    "id": "iron-mastery",
    "civ": "gaul",
    "age": 2,
    "prereq": [
      "iron-working"
    ],
    "name": "Iron mastery",
    "effect": {
      "unlocks": [
        "gaesatae"
      ]
    },
    "note": "(existing tech, absorbed) Gallic smiths gave Rome the mail shirt and the better sword."
  },
  {
    "id": "carnyx-terror",
    "civ": "gaul",
    "age": 2,
    "prereq": [
      "iron-mastery"
    ],
    "name": "The carnyx",
    "effect": {
      "atkPct": 10,
      "condition": "first-round"
    },
    "note": "A boar-headed war horn taller than a man, built to unman the enemy line."
  },
  {
    "id": "client-warbands",
    "civ": "gaul",
    "age": 2,
    "prereq": [
      "celtic-coinage"
    ],
    "name": "Client warbands",
    "effect": {
      "unitCostPct": -15
    },
    "note": "A noble's worth was counted in sworn men at his table."
  },
  {
    "id": "river-tolls",
    "civ": "gaul",
    "age": 2,
    "prereq": [
      "celtic-coinage"
    ],
    "name": "River tolls",
    "effect": {
      "special": "trade-post+2gold"
    },
    "note": "Rhone, Saone, Loire — whoever held the fords taxed a continent's tin and wine."
  },
  {
    "id": "noble-cavalry",
    "civ": "gaul",
    "age": 3,
    "prereq": [
      "horseback-riding"
    ],
    "name": "Noble cavalry",
    "effect": {
      "unitCatPct": {
        "cat": "mounted",
        "atkPct": 15
      }
    },
    "note": "So good that Rome's later cavalry was, to a large degree, simply Gauls."
  },
  {
    "id": "bardic-tradition",
    "civ": "gaul",
    "age": 3,
    "prereq": [
      "druidic-councils"
    ],
    "name": "Bardic tradition",
    "effect": {
      "cityYield": {
        "stability": 1
      },
      "veterancyRatePct": 25
    },
    "note": "Praise and satire — the bard's verse could make or unmake a warrior's name."
  },
  {
    "id": "furor",
    "civ": "gaul",
    "age": 3,
    "prereq": [
      "carnyx-terror"
    ],
    "name": "Furor",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "infantry",
        "atkPct": 35
      }
    },
    "note": "(existing doctrine, now the branch capstone)"
  },
  {
    "id": "arsacid-kingship",
    "civ": "parthia",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Arsacid kingship",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "King of kings over sub-kings — a federation wearing one crown."
  },
  {
    "id": "nisean-studs",
    "civ": "parthia",
    "age": 1,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Nisean studs",
    "effect": {
      "unitCatCostPct": {
        "cat": "mounted",
        "costPct": -20
      }
    },
    "note": "The great horses of the Nisaean plain — big enough to carry an armoured man."
  },
  {
    "id": "horse-archery",
    "civ": "parthia",
    "age": 2,
    "prereq": [
      "archery",
      "nisean-studs"
    ],
    "name": "Horse archery",
    "effect": {
      "unlocks": [
        "horse-archer"
      ]
    },
    "note": "(existing tech, absorbed)"
  },
  {
    "id": "composite-bows",
    "civ": "parthia",
    "age": 2,
    "prereq": [
      "horse-archery"
    ],
    "name": "Composite recurves",
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 15
      }
    },
    "note": "Horn, wood, sinew: a bow with a longer reach than Rome's answer to it."
  },
  {
    "id": "cataphract-armouries",
    "civ": "parthia",
    "age": 2,
    "prereq": [
      "iron-working",
      "nisean-studs"
    ],
    "name": "Cataphract armouries",
    "effect": {
      "unlocks": [
        "cataphract"
      ]
    },
    "note": "NEW UNIT: man and horse in scale mail — the anvil to the horse archer's hammer."
  },
  {
    "id": "caravan-cities",
    "civ": "parthia",
    "age": 2,
    "prereq": [
      "arsacid-kingship"
    ],
    "name": "Caravan cities",
    "effect": {
      "tradeRouteGold": 2
    },
    "note": "Merv, Hecatompylos, Ctesiphon — the Silk Road's middlemen, growing rich on through-traffic."
  },
  {
    "id": "desert-waystations",
    "civ": "parthia",
    "age": 2,
    "prereq": [
      "caravan-logistics"
    ],
    "name": "Desert waystations",
    "effect": {
      "special": "no-desert-attrition, +1move-in-desert"
    },
    "note": "Water, fodder, and fresh mounts a day's ride apart."
  },
  {
    "id": "hellenic-synthesis",
    "civ": "parthia",
    "age": 3,
    "prereq": [
      "arsacid-kingship"
    ],
    "name": "Hellenic synthesis",
    "effect": {
      "cityYield": {
        "science": 1
      }
    },
    "note": "Greek theatre in Ctesiphon, Iranian fire temples beside it — both, not either."
  },
  {
    "id": "feudal-levies",
    "civ": "parthia",
    "age": 3,
    "prereq": [
      "cataphract-armouries"
    ],
    "name": "Feudal levies",
    "effect": {
      "upkeepPct": -25
    },
    "note": "The great houses — Suren, Karin — brought their own armies to the king's war."
  },
  {
    "id": "parthian-shot",
    "civ": "parthia",
    "age": 3,
    "prereq": [
      "composite-bows"
    ],
    "name": "Parthian shot",
    "capstone": true,
    "effect": {
      "special": "mounted-ranged-no-retaliation-keep-half-move",
      "atkPct": 20
    },
    "note": "(existing doctrine, now the branch capstone) Retreat as attack."
  },
  {
    "id": "lycurgan-reforms",
    "civ": "sparta",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Lycurgan reforms",
    "effect": {
      "unitCostPct": -15,
      "cityYield": {
        "gold": -1
      }
    },
    "note": "Iron money, equal lots, forbidden luxury. The whole state a barracks."
  },
  {
    "id": "the-agoge",
    "civ": "sparta",
    "age": 1,
    "prereq": [
      "lycurgan-reforms"
    ],
    "name": "The agoge",
    "effect": {
      "special": "melee-spawn-vet1"
    },
    "note": "Taken at seven, soldier at twenty. There was no other childhood."
  },
  {
    "id": "helot-agriculture",
    "civ": "sparta",
    "age": 2,
    "prereq": [
      "irrigation"
    ],
    "name": "Helot agriculture",
    "effect": {
      "special": "farm+1food",
      "cityYield": {
        "stability": -1
      }
    },
    "note": "Serfs fed the army that watched them. The fear ran both ways — hence the penalty."
  },
  {
    "id": "syssitia",
    "civ": "sparta",
    "age": 2,
    "prereq": [
      "the-agoge"
    ],
    "name": "Syssitia",
    "effect": {
      "healPlus": 2,
      "condition": "own-territory"
    },
    "note": "The common mess: every Spartiate ate the same black broth at the same table."
  },
  {
    "id": "perioikoi-crafts",
    "civ": "sparta",
    "age": 2,
    "prereq": [
      "bronze-working"
    ],
    "name": "Perioikoi crafts",
    "effect": {
      "cityYield": {
        "labour": 1
      }
    },
    "note": "The 'dwellers-around' forged, traded, and built — Spartiates were forbidden to."
  },
  {
    "id": "spartiate-corps",
    "civ": "sparta",
    "age": 2,
    "prereq": [
      "the-agoge",
      "iron-working"
    ],
    "name": "Spartiate corps",
    "effect": {
      "unlocks": [
        "spartiate"
      ]
    },
    "note": "NEW UNIT: the elite hoplite. Lambda on the shield, silence in the advance."
  },
  {
    "id": "krypteia",
    "civ": "sparta",
    "age": 2,
    "prereq": [
      "the-agoge"
    ],
    "name": "Krypteia",
    "effect": {
      "special": "vision+1-own-borders, see-adjacent-enemy-territory"
    },
    "note": "The secret service of young Spartiates — surveillance as rite of passage."
  },
  {
    "id": "with-your-shield",
    "civ": "sparta",
    "age": 3,
    "prereq": [
      "syssitia"
    ],
    "name": "With your shield or on it",
    "effect": {
      "defPct": 20,
      "inOwnTerritory": true
    },
    "note": "What the mothers said. Retreat was the one unforgivable wound."
  },
  {
    "id": "peloponnesian-league",
    "civ": "sparta",
    "age": 3,
    "prereq": [
      "lycurgan-reforms"
    ],
    "name": "Peloponnesian League",
    "effect": {
      "special": "gold-per-allied-city"
    },
    "note": "Sparta led; the allies followed — and paid in men, not tribute."
  },
  {
    "id": "phalanx-wall",
    "civ": "sparta",
    "age": 3,
    "prereq": [
      "spartiate-corps"
    ],
    "name": "Phalanx wall",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "spear",
        "defPct": 35,
        "vsCavDefPct": 60
      }
    },
    "note": "(doctrine MOVED here from Greece — Athens gets Wooden Walls instead)"
  },
  {
    "id": "argead-crown",
    "civ": "macedon",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Argead crown",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "A frontier monarchy the southern Greeks called half-barbarian — until it owned them."
  },
  {
    "id": "pangaeum-mines",
    "civ": "macedon",
    "age": 1,
    "prereq": [
      "bronze-working"
    ],
    "name": "Mines of Pangaeum",
    "effect": {
      "special": "mine+2gold"
    },
    "note": "A thousand talents a year in gold — Philip's real siege weapon."
  },
  {
    "id": "sarissa-phalanx",
    "civ": "macedon",
    "age": 2,
    "prereq": [
      "iron-working"
    ],
    "name": "Sarissa phalanx",
    "effect": {
      "unlocks": [
        "phalangite"
      ]
    },
    "note": "NEW UNIT: the six-metre pike. Five rows of points before the enemy reaches the first man."
  },
  {
    "id": "hetairoi",
    "civ": "macedon",
    "age": 2,
    "prereq": [
      "horseback-riding"
    ],
    "name": "Hetairoi cavalry",
    "effect": {
      "unitCatPct": {
        "cat": "mounted",
        "atkPct": 20
      }
    },
    "note": "The Companions — nobles who charged home with the king himself at the wedge's point."
  },
  {
    "id": "siege-train",
    "civ": "macedon",
    "age": 2,
    "prereq": [
      "engineering"
    ],
    "name": "The siege train",
    "effect": {
      "unitCatPct": {
        "cat": "siege",
        "atkPct": 25,
        "movePlus": 1
      }
    },
    "note": "Torsion catapults and towers that travelled with the army. Tyre learned what that meant."
  },
  {
    "id": "royal-pages",
    "civ": "macedon",
    "age": 2,
    "prereq": [
      "argead-crown"
    ],
    "name": "Royal pages",
    "effect": {
      "veterancyRatePct": 50
    },
    "note": "Noble sons raised at court: officer school and hostage system in one."
  },
  {
    "id": "mieza-school",
    "civ": "macedon",
    "age": 2,
    "prereq": [
      "philosophy"
    ],
    "name": "The school at Mieza",
    "effect": {
      "cityYield": {
        "science": 1
      }
    },
    "note": "Aristotle taught the prince and his companions in the Gardens of Midas."
  },
  {
    "id": "league-of-corinth",
    "civ": "macedon",
    "age": 3,
    "prereq": [
      "argead-crown"
    ],
    "name": "League of Corinth",
    "effect": {
      "special": "gold-per-allied-city"
    },
    "note": "All of Greece sworn to one hegemon's war."
  },
  {
    "id": "conquest-logistics",
    "civ": "macedon",
    "age": 3,
    "prereq": [
      "siege-train"
    ],
    "name": "Conquest logistics",
    "effect": {
      "special": "units-heal-on-city-capture-50"
    },
    "note": "An army that marched from the Danube to the Indus and rarely starved."
  },
  {
    "id": "hammer-and-anvil",
    "civ": "macedon",
    "age": 3,
    "prereq": [
      "sarissa-phalanx",
      "hetairoi"
    ],
    "name": "Hammer and anvil",
    "capstone": true,
    "effect": {
      "special": "combined-arms-bonus-doubled",
      "atkPct": 10
    },
    "note": "Pin with the pikes, kill with the Companions. Gaugamela in one sentence."
  },
  {
    "id": "satrapy-system",
    "civ": "persia",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Satrapy system",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Twenty provinces, each with a governor, a treasurer, and the King's Eye watching both."
  },
  {
    "id": "royal-road",
    "civ": "persia",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "The Royal Road",
    "effect": {
      "special": "roads-grant-vision+1, road-move-bonus"
    },
    "note": "Sardis to Susa in seven days by relay — ninety for anyone else."
  },
  {
    "id": "daric-coinage",
    "civ": "persia",
    "age": 2,
    "prereq": [
      "satrapy-system"
    ],
    "name": "Daric coinage",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "The archer-king stamped in pure gold, good from the Aegean to the Indus."
  },
  {
    "id": "immortals",
    "civ": "persia",
    "age": 2,
    "prereq": [
      "iron-working"
    ],
    "name": "The Immortals",
    "effect": {
      "unlocks": [
        "immortal"
      ]
    },
    "note": "NEW UNIT: the Ten Thousand, always ten thousand — every loss replaced by dawn."
  },
  {
    "id": "qanat-irrigation",
    "civ": "persia",
    "age": 2,
    "prereq": [
      "irrigation"
    ],
    "name": "Qanat irrigation",
    "effect": {
      "special": "farm-buildable-on-desert, desert-farm+1food"
    },
    "note": "Underground channels carrying mountain water miles beneath the desert."
  },
  {
    "id": "archer-corps",
    "civ": "persia",
    "age": 2,
    "prereq": [
      "archery"
    ],
    "name": "Sparabara corps",
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 15
      }
    },
    "note": "Shield-bearers in front, massed bows behind — arrows enough to hide the sun."
  },
  {
    "id": "paradeisos",
    "civ": "persia",
    "age": 3,
    "prereq": [
      "qanat-irrigation"
    ],
    "name": "Paradeisos",
    "effect": {
      "capitalYield": {
        "food": 1,
        "stability": 1
      }
    },
    "note": "The walled royal gardens. The Greeks borrowed the word: paradise."
  },
  {
    "id": "tribute-fleets",
    "civ": "persia",
    "age": 3,
    "prereq": [
      "satrapy-system",
      "sailing"
    ],
    "name": "Tribute fleets",
    "effect": {
      "unitCatCostPct": {
        "cat": "naval",
        "costPct": -25
      }
    },
    "note": "Persia never built a navy; it requisitioned Phoenicia's and Egypt's."
  },
  {
    "id": "royal-judges",
    "civ": "persia",
    "age": 3,
    "prereq": [
      "daric-coinage"
    ],
    "name": "Royal judges",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "The king's law rode circuit; one famously flayed a corrupt judge for his chair."
  },
  {
    "id": "king-of-kings",
    "civ": "persia",
    "age": 3,
    "prereq": [
      "royal-road",
      "royal-judges"
    ],
    "name": "King of kings",
    "capstone": true,
    "effect": {
      "special": "captured-city-keeps-buildings, +1stability-all"
    },
    "note": "Rule by tolerance: keep your gods, your laws, your language — pay the tribute."
  },
  {
    "id": "mandate-of-heaven",
    "civ": "han",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Mandate of Heaven",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "Rule is conditional on ruling well — the world's first performance clause."
  },
  {
    "id": "confucian-academies",
    "civ": "han",
    "age": 2,
    "prereq": [
      "philosophy"
    ],
    "name": "Confucian academies",
    "effect": {
      "special": "library-city+1sci"
    },
    "note": "The Imperial University: 30,000 students studying to govern by examination."
  },
  {
    "id": "crossbow-production",
    "civ": "han",
    "age": 2,
    "prereq": [
      "iron-working"
    ],
    "name": "Crossbow production",
    "effect": {
      "unlocks": [
        "crossbowman"
      ]
    },
    "note": "NEW UNIT: bronze trigger locks precise enough to mass-produce. A peasant outshoots a lifetime archer."
  },
  {
    "id": "ever-normal-granary",
    "civ": "han",
    "age": 2,
    "prereq": [
      "irrigation"
    ],
    "name": "Ever-normal granary",
    "effect": {
      "buildingBoost": {
        "granary": {
          "food": 2
        }
      }
    },
    "note": "Buy grain cheap, sell dear, keep the price — and the peace — level."
  },
  {
    "id": "iron-salt-monopoly",
    "civ": "han",
    "age": 2,
    "prereq": [
      "mandate-of-heaven"
    ],
    "name": "Iron and salt monopoly",
    "effect": {
      "special": "mine+1labour",
      "cityYield": {
        "gold": 1
      }
    },
    "note": "81 BC: the state debates nationalizing industry — and does it. The transcript survives."
  },
  {
    "id": "heavenly-horses",
    "civ": "han",
    "age": 2,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Heavenly horses",
    "effect": {
      "unitCatPct": {
        "cat": "mounted",
        "atkPct": 15
      }
    },
    "note": "Wudi fought a war 3,000 km away in Ferghana for a better breed of horse."
  },
  {
    "id": "border-walls",
    "civ": "han",
    "age": 3,
    "prereq": [
      "masonry"
    ],
    "name": "Border walls",
    "effect": {
      "defPct": 25,
      "inOwnTerritory": true
    },
    "note": "Rammed-earth ramparts and beacon towers stitching the old Qin walls together."
  },
  {
    "id": "silk-monopoly",
    "civ": "han",
    "age": 3,
    "prereq": [
      "ever-normal-granary"
    ],
    "name": "Silk monopoly",
    "effect": {
      "tradeRouteGold": 3
    },
    "note": "The one export nobody else could make, worth gold at the far end of the world."
  },
  {
    "id": "paper-records",
    "civ": "han",
    "age": 3,
    "prereq": [
      "confucian-academies"
    ],
    "name": "Paper records",
    "effect": {
      "researchCostPct": -10
    },
    "note": "Cai Lun, AD 105: bark, hemp, and rags — the cheapest writing surface ever made."
  },
  {
    "id": "tributary-system",
    "civ": "han",
    "age": 3,
    "prereq": [
      "silk-monopoly"
    ],
    "name": "Tributary system",
    "capstone": true,
    "effect": {
      "special": "gold-per-known-civ-at-peace"
    },
    "note": "Neighbours kowtow and 'give gifts'; the emperor 'graciously' trades. Everyone profits; one saves face."
  },
  {
    "id": "arthashastra",
    "civ": "maurya",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "The Arthashastra",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Kautilya's manual: taxation, espionage, war, and when poison is cheaper than either."
  },
  {
    "id": "taxila-learning",
    "civ": "maurya",
    "age": 1,
    "prereq": [
      "writing"
    ],
    "name": "Taxila learning",
    "effect": {
      "cityYield": {
        "science": 1
      }
    },
    "note": "A university city older than the empire — medicine, grammar, statecraft."
  },
  {
    "id": "elephant-corps",
    "civ": "maurya",
    "age": 2,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Elephant corps",
    "effect": {
      "unlocks": [
        "war-elephant"
      ],
      "unitPct": {
        "unit": "war-elephant",
        "costPct": -25
      }
    },
    "note": "Nine thousand at the empire's height. Seleucus traded provinces for five hundred."
  },
  {
    "id": "grand-trunk-road",
    "civ": "maurya",
    "age": 2,
    "prereq": [
      "masonry"
    ],
    "name": "Uttarapatha road",
    "effect": {
      "special": "roads-half-labour-cost",
      "tradeRouteGold": 1
    },
    "note": "The royal highway with wells, shade trees, and rest houses by decree — still a road today."
  },
  {
    "id": "irrigation-tanks",
    "civ": "maurya",
    "age": 2,
    "prereq": [
      "irrigation"
    ],
    "name": "Irrigation tanks",
    "effect": {
      "special": "farm+1food"
    },
    "note": "Reservoirs like Sudarshana lake — monsoon banked against the dry months."
  },
  {
    "id": "punch-marked-coins",
    "civ": "maurya",
    "age": 2,
    "prereq": [
      "arthashastra"
    ],
    "name": "Punch-marked coins",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Silver karshapanas, tested and counterstamped — imperial money for a subcontinent."
  },
  {
    "id": "spy-bureaus",
    "civ": "maurya",
    "age": 2,
    "prereq": [
      "arthashastra"
    ],
    "name": "Spy bureaus",
    "effect": {
      "special": "reveal-enemy-capital-area, see-enemy-gold"
    },
    "note": "Kautilya's institutes of espionage: monks, merchants, and courtesans on the payroll."
  },
  {
    "id": "imperial-army-scale",
    "civ": "maurya",
    "age": 3,
    "prereq": [
      "elephant-corps"
    ],
    "name": "Imperial army scale",
    "effect": {
      "upkeepPct": -20
    },
    "note": "600,000 infantry by Greek report — a war department with six boards ran it."
  },
  {
    "id": "dhamma-edicts",
    "civ": "maurya",
    "age": 3,
    "prereq": [
      "taxila-learning"
    ],
    "name": "Dhamma edicts",
    "effect": {
      "cityYield": {
        "stability": 2
      },
      "special": "temple+1sci"
    },
    "note": "Ashoka's rock inscriptions: tolerance, hospitals, tree-lined roads — empire as ethics."
  },
  {
    "id": "chakravartin",
    "civ": "maurya",
    "age": 3,
    "prereq": [
      "dhamma-edicts",
      "imperial-army-scale"
    ],
    "name": "Chakravartin",
    "capstone": true,
    "effect": {
      "cityYield": {
        "food": 1,
        "gold": 1
      }
    },
    "note": "The wheel-turning universal ruler — conquest by righteousness after conquest by war."
  },
  {
    "id": "horse-lords",
    "civ": "scythia",
    "age": 1,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Horse lords",
    "effect": {
      "unitCatCostPct": {
        "cat": "mounted",
        "costPct": -20
      }
    },
    "note": "Riding before walking, milk and meat from the same herd you fought from."
  },
  {
    "id": "kurgan-rites",
    "civ": "scythia",
    "age": 1,
    "prereq": [
      "pottery"
    ],
    "name": "Kurgan rites",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "Burial mounds visible for miles — ancestors as landmarks and law."
  },
  {
    "id": "recurve-mastery",
    "civ": "scythia",
    "age": 2,
    "prereq": [
      "archery",
      "horse-lords"
    ],
    "name": "Recurve mastery",
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 15
      }
    },
    "note": "The short composite bow, shot at full gallop with either hand."
  },
  {
    "id": "animal-style-gold",
    "civ": "scythia",
    "age": 2,
    "prereq": [
      "bronze-working"
    ],
    "name": "Animal-style gold",
    "effect": {
      "cityYield": {
        "gold": 1
      },
      "tradeRouteGold": 1
    },
    "note": "Stags and griffins in solid gold — steppe art the Greeks paid fortunes to commission."
  },
  {
    "id": "wagon-camps",
    "civ": "scythia",
    "age": 2,
    "prereq": [
      "horse-lords"
    ],
    "name": "Wagon homes",
    "effect": {
      "special": "units-heal-anywhere"
    },
    "note": "'Their houses follow them' — Herodotus. How do you sack a city that moves?"
  },
  {
    "id": "warrior-women",
    "civ": "scythia",
    "age": 2,
    "prereq": [
      "recurve-mastery"
    ],
    "name": "Warrior women",
    "effect": {
      "unitCostPct": -10
    },
    "note": "One steppe grave in three with weapons holds a woman. The Amazons had an address."
  },
  {
    "id": "poisoned-arrows",
    "civ": "scythia",
    "age": 2,
    "prereq": [
      "recurve-mastery"
    ],
    "name": "Scythicon",
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 10
      }
    },
    "note": "The arrow poison so notorious the Greeks named it — even a graze festered."
  },
  {
    "id": "steppe-tribute",
    "civ": "scythia",
    "age": 3,
    "prereq": [
      "kurgan-rites"
    ],
    "name": "Steppe tribute",
    "effect": {
      "special": "gold-per-known-civ-at-peace"
    },
    "note": "Settled neighbours paid the horsemen not to come. Cheaper than walls."
  },
  {
    "id": "scorched-steppe",
    "civ": "scythia",
    "age": 3,
    "prereq": [
      "wagon-camps"
    ],
    "name": "Scorched steppe",
    "effect": {
      "special": "enemy-attrition-in-your-territory"
    },
    "note": "Burn the grass, foul the wells, ride ahead of the invader until he starves."
  },
  {
    "id": "feigned-retreat",
    "civ": "scythia",
    "age": 3,
    "prereq": [
      "scorched-steppe"
    ],
    "name": "Feigned retreat",
    "capstone": true,
    "effect": {
      "special": "mounted-retreat-1hex-when-attacked, counterattack+15"
    },
    "note": "Run away, really. Then turn. Darius chased this for weeks and caught only wind."
  },
  {
    "id": "hillforts",
    "civ": "britons",
    "age": 1,
    "prereq": [
      "masonry"
    ],
    "name": "Hillforts",
    "effect": {
      "defPct": 20,
      "condition": "inOwnTerritory"
    },
    "note": "Maiden Castle and a thousand ramparted hills — the Britons fought from the high ground."
  },
  {
    "id": "woad",
    "civ": "britons",
    "age": 1,
    "prereq": [
      "archery"
    ],
    "name": "Woad and war-paint",
    "effect": {
      "atkPct": 10,
      "condition": "ambush"
    },
    "note": "Naked and painted blue with woad, they were a terror the legions never quite forgot."
  },
  {
    "id": "chariot-craft",
    "civ": "britons",
    "age": 1,
    "prereq": [
      "bronze-working"
    ],
    "name": "The war-chariot",
    "effect": {
      "unlocks": [
        "chariot-isles"
      ]
    },
    "note": "Long after the Continent gave them up, British nobles still went to war from the chariot's platform."
  },
  {
    "id": "druidic-lore",
    "civ": "britons",
    "age": 2,
    "prereq": [
      "writing"
    ],
    "name": "Druidic lore",
    "effect": {
      "cityYield": {
        "science": 1
      },
      "unlocks": [
        "nemeton"
      ]
    },
    "note": "Twenty years of memorised verse; the druids forbade their wisdom ever be written down."
  },
  {
    "id": "tin-of-belerion",
    "civ": "britons",
    "age": 2,
    "prereq": [
      "sailing"
    ],
    "name": "The tin of Belerion",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Cornish tin, shipped to Massalia and beyond — the metal that made bronze, from the edge of the world."
  },
  {
    "id": "island-oppida",
    "civ": "britons",
    "age": 2,
    "prereq": [
      "hillforts"
    ],
    "name": "Island oppida",
    "effect": {
      "special": "walls+40hp"
    },
    "note": "Camulodunon and Verlamion — the sprawling, dyke-ringed capitals of the southern kings."
  },
  {
    "id": "sacred-groves",
    "civ": "britons",
    "age": 2,
    "prereq": [
      "druidic-lore"
    ],
    "name": "Sacred groves",
    "effect": {
      "cityYield": {
        "science": 1,
        "stability": 1
      }
    },
    "note": "The nemeton: a clearing of old oaks where the tribe met its gods and heard its judges."
  },
  {
    "id": "warband-fury",
    "civ": "britons",
    "age": 3,
    "prereq": [
      "woad"
    ],
    "name": "Warband fury",
    "effect": {
      "atkPct": 15,
      "unitCat": "infantry"
    },
    "note": "The headlong, screaming charge that won the first shock — or lost everything at once."
  },
  {
    "id": "client-kings",
    "civ": "britons",
    "age": 3,
    "prereq": [
      "island-oppida"
    ],
    "name": "Client kings",
    "effect": {
      "cityYield": {
        "gold": 1,
        "stability": 1
      }
    },
    "note": "Tribes bound by tribute and marriage under an over-king — Cunobelinus ruled a dozen of them."
  },
  {
    "id": "island-fastness",
    "civ": "britons",
    "age": 3,
    "prereq": [
      "warband-fury",
      "island-oppida"
    ],
    "name": "Island Fastness",
    "capstone": true,
    "effect": {
      "defPct": 25,
      "condition": "inOwnTerritory"
    },
    "note": "Walled by the grey Channel and the tribes' own hills, Britain stayed the empire's last, hardest edge."
  },
  {
    "id": "ta-seti-archery",
    "civ": "kush",
    "age": 1,
    "prereq": [
      "archery"
    ],
    "name": "Bowmen of Ta-Seti",
    "effect": {
      "unlocks": [
        "meroe-archer"
      ]
    },
    "note": "Ta-Seti, 'the Land of the Bow' — Nubian archers were prized from Pharaoh's army to the Great King's guard."
  },
  {
    "id": "nile-cataracts",
    "civ": "kush",
    "age": 1,
    "prereq": [
      "irrigation"
    ],
    "name": "Farming the cataracts",
    "effect": {
      "cityYield": {
        "food": 1
      }
    },
    "note": "Between the granite cataracts, Kush wrung green fields from a narrow, generous Nile."
  },
  {
    "id": "nubian-gold",
    "civ": "kush",
    "age": 1,
    "prereq": [
      "bronze-working"
    ],
    "name": "The gold of Nubia",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "Nub meant gold; the mines of Wawat and Kush gilded the thrones of two kingdoms."
  },
  {
    "id": "meroitic-iron",
    "civ": "kush",
    "age": 2,
    "prereq": [
      "iron-working"
    ],
    "name": "The furnaces of Meroë",
    "effect": {
      "cityYield": {
        "production": 1
      },
      "unlocks": [
        "iron-furnaces"
      ]
    },
    "note": "Slag heaps still ring Meroë — an iron industry that earned it the name 'the Birmingham of Africa'."
  },
  {
    "id": "apedemak-cult",
    "civ": "kush",
    "age": 2,
    "prereq": [
      "pottery"
    ],
    "name": "The lion of Apedemak",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "Apedemak, the lion-headed war-god of Kush — a deity all their own, not borrowed from the north."
  },
  {
    "id": "desert-caravans",
    "civ": "kush",
    "age": 2,
    "prereq": [
      "animal-husbandry"
    ],
    "name": "Desert caravans",
    "effect": {
      "cityYield": {
        "gold": 1
      }
    },
    "note": "The Meroë road and the routes to the Red Sea moved ivory, ebony, and gold across the sand."
  },
  {
    "id": "meroitic-script",
    "civ": "kush",
    "age": 2,
    "prereq": [
      "writing"
    ],
    "name": "The Meroitic script",
    "effect": {
      "cityYield": {
        "science": 1
      }
    },
    "note": "Kush wrote its own tongue in its own alphabet — a script still only half-deciphered."
  },
  {
    "id": "pyramids-of-meroe",
    "civ": "kush",
    "age": 3,
    "prereq": [
      "meroitic-iron"
    ],
    "name": "The pyramids of Meroë",
    "effect": {
      "cityYield": {
        "production": 1,
        "stability": 1
      }
    },
    "note": "Steeper and smaller than Giza's, and far more numerous — the crowded royal dead of a lasting kingdom."
  },
  {
    "id": "kandake-queens",
    "civ": "kush",
    "age": 3,
    "prereq": [
      "apedemak-cult"
    ],
    "name": "The Kandakes",
    "effect": {
      "cityYield": {
        "stability": 1
      }
    },
    "note": "The warrior queen-mothers who ruled Kush and once fought Augustus' Rome to a standstill."
  },
  {
    "id": "archers-of-kush",
    "civ": "kush",
    "age": 3,
    "prereq": [
      "ta-seti-archery"
    ],
    "name": "Archers of Kush",
    "capstone": true,
    "effect": {
      "unitCatPct": {
        "cat": "ranged",
        "atkPct": 20
      }
    },
    "note": "The massed bow was Kush's masterpiece of war — a hail of arrows no line of shields could weather."
  }
];

export const NEW_UNITS: NewUnitSketch[] = [
  {
    "id": "cataphract",
    "civ": "parthia",
    "cat": "mounted",
    "basedOn": "horseman",
    "tweak": "+def, -move, heavy"
  },
  {
    "id": "spartiate",
    "civ": "sparta",
    "cat": "spear",
    "basedOn": "hoplite",
    "tweak": "+atk +def, +cost, spawns vet1"
  },
  {
    "id": "phalangite",
    "civ": "macedon",
    "cat": "spear",
    "basedOn": "spearman",
    "tweak": "+atk vs infantry, -flank def"
  },
  {
    "id": "immortal",
    "civ": "persia",
    "cat": "spear",
    "basedOn": "spearman",
    "tweak": "cheap replacement: 50% cost refund on death"
  },
  {
    "id": "crossbowman",
    "civ": "han",
    "cat": "ranged",
    "basedOn": "archer",
    "tweak": "+atk, ignores 50% terrain def, slow"
  }
];

export const NEW_BUILDINGS: NewBuildingSketch[] = [
  {
    "id": "forum",
    "civ": "rome",
    "cost": "market-tier",
    "yields": {
      "gold": 2,
      "stability": 1
    }
  }
];
