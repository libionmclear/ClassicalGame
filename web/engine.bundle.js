"use strict";
var HegemonEngine = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/engine/browser-entry.ts
  var browser_entry_exports = {};
  __export(browser_entry_exports, {
    AGE_GATES: () => AGE_GATES,
    BEFRIEND_COST: () => BEFRIEND_COST,
    BRANCHES: () => BRANCHES,
    BUILDINGS: () => BUILDINGS,
    BUILD_RESOURCE: () => BUILD_RESOURCE,
    CIV_ROSTER: () => CIV_ROSTER,
    DEFAULT_PLAYERS: () => DEFAULT_PLAYERS,
    DISTRICT_TYPES: () => DISTRICT_TYPES,
    EVENTS: () => EVENTS,
    FIGURES: () => FIGURES,
    GREAT_WORKS: () => GREAT_WORKS,
    IMPROVEMENTS: () => IMPROVEMENTS,
    LAUREL_THRESHOLDS: () => LAUREL_THRESHOLDS,
    MAP_SIZES: () => MAP_SIZES,
    MAX_PLAYERS: () => MAX_PLAYERS,
    MINOR_PEOPLES: () => MINOR_PEOPLES,
    PEOPLE_BY_ID: () => PEOPLE_BY_ID,
    RECRUITMENT: () => RECRUITMENT,
    RELATION_BAND_LABELS: () => RELATION_BAND_LABELS,
    RESOURCES: () => RESOURCES,
    ROAD_COST: () => ROAD_COST,
    RUINS: () => RUINS,
    RUIN_BY_ID: () => RUIN_BY_ID,
    RUSH_GOLD_PER_PRODUCTION: () => RUSH_GOLD_PER_PRODUCTION,
    TECHS: () => TECHS,
    TERRAIN: () => TERRAIN,
    TITLE_LADDERS: () => TITLE_LADDERS,
    TRIBUTE_GAIN: () => TRIBUTE_GAIN,
    TURN_LIMITS: () => TURN_LIMITS,
    UNITS: () => UNITS,
    UNIT_BUILD_COSTS: () => UNIT_BUILD_COSTS,
    WEATHER_STATES: () => WEATHER_STATES,
    agreementBand: () => agreementBand,
    agreementHeldTurns: () => agreementHeldTurns,
    alliesOf: () => alliesOf,
    applyAction: () => applyAction,
    bandAtLeast: () => bandAtLeast,
    befriendCostFor: () => befriendCostFor,
    canDemandVassalage: () => canDemandVassalage,
    canProposeAgreement: () => canProposeAgreement,
    canResearch: () => canResearch,
    chooseAiAction: () => chooseAiAction,
    cityTier: () => cityTier,
    claimingCity: () => claimingCity,
    computeCityStability: () => computeCityStability,
    computeCityYield: () => computeCityYield,
    computeCombatPreview: () => computeCombatPreview,
    computePlayerIncome: () => computePlayerIncome,
    computeScores: () => computeScores,
    computeTerritory: () => computeTerritory,
    computeVisibility: () => computeVisibility,
    controlledResources: () => controlledResources,
    createInitialGameState: () => createInitialGameState,
    deserializeState: () => deserializeState,
    distance: () => distance,
    districtName: () => districtName,
    districtSlots: () => districtSlots,
    districtType: () => districtType,
    effectiveItemCost: () => effectiveItemCost,
    explorerNear: () => explorerNear,
    findPath: () => findPath,
    generateMap: () => generateMap,
    getEvent: () => getEvent,
    getFigure: () => getFigure,
    getPair: () => getPair,
    getRelation: () => getRelation,
    getVictoryStatus: () => getVictoryStatus,
    greatWork: () => greatWork,
    hasAgreement: () => hasAgreement,
    haveMet: () => haveMet,
    isAtWar: () => isAtWar,
    isCoastalCity: () => isCoastalCity,
    isEmbarked: () => isEmbarked,
    isFullAlly: () => isFullAlly,
    isOathbreaker: () => isOathbreaker,
    isVassal: () => isVassal,
    keyOf: () => keyOf,
    laurelsForGame: () => laurelsForGame,
    leaderReactionBonus: () => leaderReactionBonus,
    listScenarios: () => listScenarios,
    loadScenario: () => loadScenario,
    mapCostScale: () => mapCostScale,
    movementCost: () => movementCost,
    napBlocksDeclaration: () => napBlocksDeclaration,
    nextTitleInfo: () => nextTitleInfo,
    pairKey: () => pairKey,
    parseKey: () => parseKey,
    personalityOf: () => personalityOf,
    playerControlsCiv: () => playerControlsCiv,
    playerFoodUpkeep: () => playerFoodUpkeep,
    playerWarWeariness: () => playerWarWeariness,
    productionItemCost: () => productionItemCost,
    raidTributeCost: () => raidTributeCost,
    relationBand: () => relationBand,
    replayActions: () => replayActions,
    researchCost: () => researchCost,
    restHealAmount: () => restHealAmount,
    runAiTurn: () => runAiTurn,
    rushProductionCost: () => rushProductionCost,
    scaledResearchCost: () => scaledResearchCost,
    serializeState: () => serializeState,
    techTier: () => techTier,
    titleForLaurels: () => titleForLaurels,
    topOverlord: () => topOverlord,
    tradeRouteIncome: () => tradeRouteIncome,
    tradeRouteValue: () => tradeRouteValue,
    unitPopCost: () => unitPopCost,
    upgradeCost: () => upgradeCost,
    upgradeTargetFor: () => upgradeTargetFor,
    vassalsOf: () => vassalsOf,
    villageReactionBonus: () => villageReactionBonus,
    villageReactionChance: () => villageReactionChance
  });

  // src/engine/branch-data.ts
  var BRANCHES = {
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
  var UNIQUE_TECHS = [
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
      "note": "Market, court, and rostra in one square \u2014 the civic engine."
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
      "note": "107 BC: a professional standing army \u2014 Marius' mules, loyal to their general."
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
      "note": "Suffetes and senate \u2014 Aristotle rated Carthage's constitution above most Greek ones."
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
      "note": "The murex dye worth its weight in silver \u2014 the Phoenician inheritance."
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
      "note": "Mass-produced hulls with numbered timbers \u2014 flat-pack warships."
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
      "note": "Libyans, Iberians, Balearics, Gauls \u2014 Carthage paid; others bled."
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
      "note": "Hanno south, Himilco north \u2014 charted seas no rival dared."
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
      "note": "Every citizen a voice on the Pnyx \u2014 demokratia."
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
      "note": "Slave-dug silver struck into owls \u2014 the ancient world's reserve currency."
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
      "note": "City and harbour joined in one fortress \u2014 starve-proof while the fleet lived."
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
      "note": "The gods were Egypt's biggest landowners \u2014 and its granaries."
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
      "note": "Psamtik's 'bronze men from the sea' \u2014 Ionian spears on Saite silver."
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
      "note": "Ta-Seti \u2014 'Land of the Bow.' Egypt recruited the best archers on earth next door."
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
      "note": "Timber-laced stone ramparts \u2014 fireproof, ram-proof. Caesar admired them in writing."
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
      "note": "Rhone, Saone, Loire \u2014 whoever held the fords taxed a continent's tin and wine."
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
      "note": "Praise and satire \u2014 the bard's verse could make or unmake a warrior's name."
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
      "note": "King of kings over sub-kings \u2014 a federation wearing one crown."
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
      "note": "The great horses of the Nisaean plain \u2014 big enough to carry an armoured man."
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
      "note": "NEW UNIT: man and horse in scale mail \u2014 the anvil to the horse archer's hammer."
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
      "note": "Merv, Hecatompylos, Ctesiphon \u2014 the Silk Road's middlemen, growing rich on through-traffic."
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
      "note": "Greek theatre in Ctesiphon, Iranian fire temples beside it \u2014 both, not either."
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
      "note": "The great houses \u2014 Suren, Karin \u2014 brought their own armies to the king's war."
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
      "note": "Serfs fed the army that watched them. The fear ran both ways \u2014 hence the penalty."
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
      "note": "The 'dwellers-around' forged, traded, and built \u2014 Spartiates were forbidden to."
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
      "note": "The secret service of young Spartiates \u2014 surveillance as rite of passage."
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
      "note": "Sparta led; the allies followed \u2014 and paid in men, not tribute."
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
      "note": "(doctrine MOVED here from Greece \u2014 Athens gets Wooden Walls instead)"
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
      "note": "A frontier monarchy the southern Greeks called half-barbarian \u2014 until it owned them."
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
      "note": "A thousand talents a year in gold \u2014 Philip's real siege weapon."
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
      "note": "The Companions \u2014 nobles who charged home with the king himself at the wedge's point."
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
      "note": "Sardis to Susa in seven days by relay \u2014 ninety for anyone else."
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
      "note": "NEW UNIT: the Ten Thousand, always ten thousand \u2014 every loss replaced by dawn."
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
      "note": "Shield-bearers in front, massed bows behind \u2014 arrows enough to hide the sun."
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
      "note": "Rule by tolerance: keep your gods, your laws, your language \u2014 pay the tribute."
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
      "note": "Rule is conditional on ruling well \u2014 the world's first performance clause."
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
      "note": "Buy grain cheap, sell dear, keep the price \u2014 and the peace \u2014 level."
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
      "note": "81 BC: the state debates nationalizing industry \u2014 and does it. The transcript survives."
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
      "note": "Cai Lun, AD 105: bark, hemp, and rags \u2014 the cheapest writing surface ever made."
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
      "note": "A university city older than the empire \u2014 medicine, grammar, statecraft."
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
      "note": "The royal highway with wells, shade trees, and rest houses by decree \u2014 still a road today."
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
      "note": "Reservoirs like Sudarshana lake \u2014 monsoon banked against the dry months."
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
      "note": "Silver karshapanas, tested and counterstamped \u2014 imperial money for a subcontinent."
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
      "note": "600,000 infantry by Greek report \u2014 a war department with six boards ran it."
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
      "note": "Ashoka's rock inscriptions: tolerance, hospitals, tree-lined roads \u2014 empire as ethics."
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
      "note": "The wheel-turning universal ruler \u2014 conquest by righteousness after conquest by war."
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
      "note": "Burial mounds visible for miles \u2014 ancestors as landmarks and law."
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
      "note": "Stags and griffins in solid gold \u2014 steppe art the Greeks paid fortunes to commission."
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
      "note": "'Their houses follow them' \u2014 Herodotus. How do you sack a city that moves?"
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
      "note": "The arrow poison so notorious the Greeks named it \u2014 even a graze festered."
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
      "note": "Maiden Castle and a thousand ramparted hills \u2014 the Britons fought from the high ground."
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
      "note": "Cornish tin, shipped to Massalia and beyond \u2014 the metal that made bronze, from the edge of the world."
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
      "note": "Camulodunon and Verlamion \u2014 the sprawling, dyke-ringed capitals of the southern kings."
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
      "note": "The headlong, screaming charge that won the first shock \u2014 or lost everything at once."
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
      "note": "Tribes bound by tribute and marriage under an over-king \u2014 Cunobelinus ruled a dozen of them."
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
      "note": "Ta-Seti, 'the Land of the Bow' \u2014 Nubian archers were prized from Pharaoh's army to the Great King's guard."
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
      "name": "The furnaces of Mero\xEB",
      "effect": {
        "cityYield": {
          "production": 1
        },
        "unlocks": [
          "iron-furnaces"
        ]
      },
      "note": "Slag heaps still ring Mero\xEB \u2014 an iron industry that earned it the name 'the Birmingham of Africa'."
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
      "note": "Apedemak, the lion-headed war-god of Kush \u2014 a deity all their own, not borrowed from the north."
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
      "note": "The Mero\xEB road and the routes to the Red Sea moved ivory, ebony, and gold across the sand."
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
      "note": "Kush wrote its own tongue in its own alphabet \u2014 a script still only half-deciphered."
    },
    {
      "id": "pyramids-of-meroe",
      "civ": "kush",
      "age": 3,
      "prereq": [
        "meroitic-iron"
      ],
      "name": "The pyramids of Mero\xEB",
      "effect": {
        "cityYield": {
          "production": 1,
          "stability": 1
        }
      },
      "note": "Steeper and smaller than Giza's, and far more numerous \u2014 the crowded royal dead of a lasting kingdom."
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
      "note": "The massed bow was Kush's masterpiece of war \u2014 a hail of arrows no line of shields could weather."
    }
  ];

  // src/units-v2-addendum.js
  var UNIQUE_UNITS_WAVE2 = [
    // ROME
    {
      id: "equites",
      civ: "rome",
      cat: "mounted",
      basedOn: "horseman",
      unlockedBy: "res-publica",
      age: 2,
      mods: { atk: 1, def: 1, special: "+1move-on-roads" },
      role: "Citizen cavalry",
      note: "The knightly class \u2014 census-ranked citizens rich enough to bring a horse."
    },
    {
      id: "scorpio-battery",
      civ: "rome",
      cat: "siege",
      basedOn: "siege-ballista",
      unlockedBy: "marian-reforms",
      age: 3,
      mods: { atkVsUnits: 25, atkVsCities: -25, move: 1, cheap: true },
      role: "Anti-personnel artillery",
      note: "Bolt-throwers issued per centuria \u2014 field artillery, not just siege."
    },
    // CARTHAGE
    {
      id: "balearic-slingers",
      civ: "carthage",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "mercenary-system",
      age: 2,
      mods: { atk: 1, cheap: true, special: "ignores-25pct-armor" },
      role: "Mercenary slingers",
      note: "Paid in women and wine, said the ancients; their lead shot cracked helmets."
    },
    {
      id: "iberian-scutarii",
      civ: "carthage",
      cat: "infantry",
      basedOn: "swordsman",
      unlockedBy: "mercenary-system",
      age: 2,
      mods: { atk: 1, move: 1 },
      role: "Mercenary swordsmen",
      note: "The falcata blade so good Rome copied it into the gladius hispaniensis."
    },
    // ATHENS
    {
      id: "epibatai",
      civ: "greece",
      cat: "infantry",
      basedOn: "spearman",
      unlockedBy: "neorion",
      age: 2,
      mods: { def: 1, special: "no-embark-penalty, +25-in-naval-boarding" },
      role: "Marines",
      note: "Ten hoplites per trireme \u2014 the deck was their phalanx."
    },
    {
      id: "toxotai",
      civ: "greece",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "ekklesia",
      age: 2,
      mods: { cheap: true, special: "+1-city-defense-when-garrisoned" },
      role: "City archers",
      note: "Athens' public archer corps \u2014 famously including Scythians bought by the state."
    },
    // EGYPT
    {
      id: "nile-galley",
      civ: "egypt",
      cat: "naval",
      basedOn: "war-galley",
      unlockedBy: "red-sea-canal",
      age: 2,
      mods: { special: "may-enter-major-rivers", atk: 1, riverBonus: 25 },
      role: "River warship",
      note: "Egypt's navy was the Nile first \u2014 the river was the kingdom's one great road."
    },
    {
      id: "kalasiris",
      civ: "egypt",
      cat: "spear",
      basedOn: "spearman",
      unlockedBy: "machimoi-greeks",
      age: 2,
      mods: { atk: 1, def: 1, special: "upkeep-paid-in-food" },
      role: "Warrior-caste elite",
      note: "Herodotus names them: the Kalasiries, hereditary soldiers a quarter-million strong."
    },
    // GAUL
    {
      id: "carnyx-bearer",
      civ: "gaul",
      cat: "support",
      basedOn: "merchant",
      unlockedBy: "carnyx-terror",
      age: 2,
      mods: { noAttack: true, special: "adjacent-friendlies+10atk-first-round" },
      role: "War-horn aura",
      note: "One boar-headed horn per warband; Polybius said the noise alone unnerved armies."
    },
    {
      id: "trimarkisia",
      civ: "gaul",
      cat: "mounted",
      basedOn: "horseman",
      unlockedBy: "noble-cavalry",
      age: 3,
      mods: { special: "self-heal-2-per-turn-even-after-acting", atk: 1 },
      role: "Relay cavalry",
      note: "Three riders per horse-team: one fights, two remount him \u2014 attested at Delphi, 279 BC."
    },
    // PARTHIA
    {
      id: "saka-lancers",
      civ: "parthia",
      cat: "mounted",
      basedOn: "horseman",
      unlockedBy: "feudal-levies",
      age: 3,
      mods: { atk: 2, cheap: true, special: "+15-vs-ranged" },
      role: "Allied steppe lancers",
      note: "Saka horse-tribes rode for Parthian silver \u2014 cousins from the deeper steppe."
    },
    {
      id: "mardian-archers",
      civ: "parthia",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "composite-bows",
      age: 2,
      mods: { atk: 1, special: "ignores-hill-move-penalty" },
      role: "Mountain foot archers",
      note: "Hillmen archers of the Iranian ranges \u2014 the foot component Carrhae never needed."
    },
    // SPARTA
    {
      id: "hippeis",
      civ: "sparta",
      cat: "spear",
      basedOn: "hoplite",
      unlockedBy: "with-your-shield",
      age: 3,
      mods: { atk: 2, def: 2, cap: "max-1", cost: 60, special: "adjacent-friendlies-never-rout" },
      role: "The royal 300",
      note: "Called 'the horsemen' \u2014 who fought on foot around the king. Thermopylae's core."
    },
    {
      id: "helot-skirmishers",
      civ: "sparta",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "helot-agriculture",
      age: 2,
      mods: { cheap: true, atk: -1, special: "training-costs-no-pop-but--1-city-stability" },
      role: "Pressed levies",
      note: "Serfs armed reluctantly and watched constantly \u2014 cheap in gold, costly in trust."
    },
    // MACEDON
    {
      id: "agrianians",
      civ: "macedon",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "royal-pages",
      age: 2,
      mods: { move: 1, atk: 1, special: "ignores-hill-forest-penalty" },
      role: "Elite javelinmen",
      note: "Alexander's favourite light troops \u2014 first up every cliff, first across every river."
    },
    {
      id: "thessalian-cavalry",
      civ: "macedon",
      cat: "mounted",
      basedOn: "horseman",
      unlockedBy: "league-of-corinth",
      age: 2,
      mods: { def: 2, atk: 1, special: "+20-when-defending" },
      role: "The left-wing anvil",
      note: "The one cavalry rated the Companions' equal \u2014 Parmenion's wing at Gaugamela."
    },
    // PERSIA
    {
      id: "takabara",
      civ: "persia",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "satrapy-system",
      age: 2,
      mods: { move: 1, cheap: true, special: "may-retreat-after-attack-vs-melee" },
      role: "Crescent-shield skirmishers",
      note: "Anatolian levies with wicker crescents \u2014 Persia's own peltast answer."
    },
    {
      id: "kardakes",
      civ: "persia",
      cat: "spear",
      basedOn: "spearman",
      unlockedBy: "royal-judges",
      age: 3,
      mods: { def: 1, atk: 1 },
      role: "Drilled heavy infantry",
      note: "Persia's attempt to build its own hoplites \u2014 they held the line at Issus, briefly."
    },
    // HAN
    {
      id: "beacon-garrison",
      civ: "han",
      cat: "support",
      basedOn: "merchant",
      unlockedBy: "border-walls",
      age: 3,
      mods: { noAttack: true, special: "vision+2, adjacent-city-def+15, reveals-adjacent-fog" },
      role: "Signal corps",
      note: "Smoke by day, fire by night \u2014 the frontier spoke in beacons faster than riders."
    },
    {
      id: "xiongnu-auxiliaries",
      civ: "han",
      cat: "ranged",
      basedOn: "archer",
      unlockedBy: "heavenly-horses",
      age: 3,
      mods: { mounted: true, move: 2, cheap: true, special: "may-move-after-attack, gold-purchase-only" },
      role: "Surrendered nomad horse",
      note: "Defeated Xiongnu bands rode for Han pay \u2014 set a nomad to catch a nomad."
    },
    // MAURYA
    {
      id: "atavika-levies",
      civ: "maurya",
      cat: "infantry",
      basedOn: "warrior",
      unlockedBy: "spy-bureaus",
      age: 2,
      mods: { cheap: true, move: 1, special: "invisible-in-forest-until-adjacent, +25-in-forest" },
      role: "Forest-tribe fighters",
      note: "The Arthashastra budgets for them by name: wild-country troops for wild country."
    },
    {
      id: "maiden-guard",
      civ: "maurya",
      cat: "infantry",
      basedOn: "swordsman",
      unlockedBy: "arthashastra",
      age: 2,
      mods: { atk: 1, def: 2, cap: "max-2", special: "must-garrison-or-stack-with-capital-forces, garrison-city-stability+1" },
      role: "Royal bodyguard",
      note: "Megasthenes saw them: armed women guarding Chandragupta's person \u2014 trusted where men were not."
    },
    // SCYTHIA
    {
      id: "wagon-fort",
      civ: "scythia",
      cat: "support",
      basedOn: "merchant",
      unlockedBy: "wagon-camps",
      age: 2,
      mods: { noAttack: true, def: 3, special: "adjacent-friendlies+20def, blocks-mounted-charge-bonus" },
      role: "Mobile laager",
      note: "Circle the wagons: the steppe's instant fortress, wherever the herd stopped."
    },
    {
      id: "sarmatian-lancers",
      civ: "scythia",
      cat: "heavy",
      basedOn: "horseman",
      unlockedBy: "steppe-tribute",
      age: 3,
      mods: { atk: 2, def: 2, cost: 40, special: "+25-on-first-charge" },
      role: "Armoured lance kin",
      note: "The eastern cousins in scale and contus lance \u2014 the steppe's own heavy answer."
    }
  ];

  // src/engine/data.ts
  var TERRAIN = {
    plains: { moveCost: 1, yields: { food: 2, production: 0, gold: 0 }, defense: 0, vision: 0 },
    valley: { moveCost: 1, yields: { food: 3, production: 0, gold: 0 }, defense: 0, vision: 0 },
    forest: { moveCost: 2, yields: { food: 0, production: 2, gold: 0 }, defense: 0.25, vision: 0 },
    hills: { moveCost: 2, yields: { food: 1, production: 1, gold: 0 }, defense: 0.25, vision: 1 },
    // Highlands (elevation level 4): the rocky approach below the peaks — slow and
    // defensible, one step short of the impassable mountains.
    highlands: { moveCost: 3, yields: { food: 0, production: 2, gold: 0 }, defense: 0.4, vision: 1 },
    mountains: { moveCost: 3, yields: { food: 0, production: 1, gold: 0 }, defense: 0.5, vision: 2, impassableWithoutTech: "mountain-paths" },
    desert: { moveCost: 2, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0 },
    coast: { moveCost: 1, yields: { food: 1, production: 0, gold: 1 }, defense: 0, vision: 0, navalOnly: true },
    sea: { moveCost: 1, yields: { food: 0, production: 0, gold: 0 }, defense: 0, vision: 0, navalOnly: true, requiresTech: "open-sea-sailing" },
    // A navigable great river (Nile/Danube/Rhine/Tigris/Euphrates). A water TILE: ships move
    // on it like coast; land units may not enter except at a bridge improvement or by
    // embarking. Fertile — it lifts adjacent land food (see computeCityYield) and its own
    // tile yields a little food + trade gold. No open-sea-sailing gate (it's inland water).
    "great-river": { moveCost: 1, yields: { food: 1, production: 0, gold: 1 }, defense: 0, vision: 0, navalOnly: true }
  };
  var WEATHER_STATES = {
    clear: {},
    rain: { mountedMovePenalty: 1, riverCrossingExtra: 1 },
    fog: { visionPenalty: 1, ambushMultiplier: 2 },
    storm: { deepSeaDamage: 2, deepSeaEntryBlocked: true },
    heat: { desertAttritionMultiplier: 2 }
  };
  var TECHS = {
    "bronze-working": { age: 1, prerequisites: [] },
    sailing: { age: 1, prerequisites: [] },
    writing: { age: 1, prerequisites: [] },
    masonry: { age: 1, prerequisites: [] },
    archery: { age: 1, prerequisites: [] },
    irrigation: { age: 1, prerequisites: [] },
    "animal-husbandry": { age: 1, prerequisites: [] },
    "phalanx-doctrine": {
      age: 1,
      prerequisites: ["bronze-working"],
      forkGroup: "warfare-doctrine",
      forkBranch: "phalanx"
    },
    "skirmish-doctrine": {
      age: 1,
      prerequisites: ["archery"],
      forkGroup: "warfare-doctrine",
      forkBranch: "skirmish"
    },
    "temple-economy": {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "temple"
    },
    coinage: {
      age: 1,
      prerequisites: ["writing"],
      forkGroup: "economy-doctrine",
      forkBranch: "coinage"
    },
    // v2.1 §2: hard AND-prereqs, tightened so the ages interlock.
    "iron-working": { age: 2, prerequisites: ["bronze-working", "masonry"] },
    "combined-arms": { age: 2, prerequisites: ["iron-working"] },
    "open-sea-sailing": { age: 2, prerequisites: ["sailing", "writing"] },
    engineering: { age: 2, prerequisites: ["masonry"] },
    "horseback-riding": { age: 2, prerequisites: ["animal-husbandry"] },
    "mountain-paths": { age: 2, prerequisites: ["engineering"] },
    "caravan-logistics": { age: 2, prerequisites: ["coinage"] },
    republic: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "republic"
    },
    monarchy: {
      age: 2,
      prerequisites: ["writing"],
      forkGroup: "statecraft",
      forkBranch: "monarchy"
    },
    "ramming-fleets": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "ramming"
    },
    "merchant-marine": {
      age: 2,
      prerequisites: ["open-sea-sailing"],
      forkGroup: "naval-doctrine",
      forkBranch: "merchant"
    },
    "roads-logistics": { age: 3, prerequisites: ["engineering"] },
    siegecraft: { age: 3, prerequisites: ["iron-working", "engineering"] },
    medicine: { age: 3, prerequisites: ["philosophy"] },
    "law-administration": { age: 3, prerequisites: ["writing", "republic"] },
    "currency-reform": { age: 3, prerequisites: ["masonry", "writing"] },
    cartography: { age: 3, prerequisites: ["open-sea-sailing"] },
    assimilation: {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "assimilation"
    },
    "tribute-empire": {
      age: 3,
      prerequisites: ["law-administration"],
      forkGroup: "imperial-method",
      forkBranch: "tribute"
    },
    // --- Additional shared historical techs (deeper research so science lasts) ---
    pottery: { age: 1, prerequisites: [] },
    mathematics: { age: 1, prerequisites: ["writing"] },
    philosophy: { age: 2, prerequisites: ["writing"] },
    metallurgy: { age: 2, prerequisites: ["iron-working"] },
    aqueducts: { age: 2, prerequisites: ["engineering"] },
    astronomy: { age: 2, prerequisites: ["mathematics"] },
    rhetoric: { age: 3, prerequisites: ["philosophy"] },
    // Deeper economy so research keeps paying off.
    "crop-rotation": { age: 2, prerequisites: ["irrigation"], cost: 30 },
    // --- Civilization-unique techs (each fields that people's signature unit) ---
    "hoplite-phalanx": { age: 1, prerequisites: ["bronze-working"], civ: "greece", cost: 24 },
    chariotry: { age: 1, prerequisites: ["bronze-working"], civ: "egypt", cost: 24 },
    "legionary-system": { age: 2, prerequisites: ["iron-working"], civ: "rome", cost: 44 },
    "war-elephants": { age: 2, prerequisites: ["iron-working"], civ: "carthage", cost: 36 },
    "iron-mastery": { age: 2, prerequisites: ["iron-working"], civ: "gaul", cost: 40 },
    "horse-archery": { age: 2, prerequisites: ["horseback-riding"], civ: "parthia", cost: 44 },
    // --- Civilization signature DOCTRINES (a second unique, a distinct effect) ---
    // Rome's testudo shell — legionaries lock shields and shrug off arrows.
    testudo: { age: 3, prerequisites: ["legionary-system"], civ: "rome", cost: 48 },
    // Greece's phalanx wall — spearmen hold an unbreakable line, murderous to cavalry.
    "phalanx-wall": { age: 2, prerequisites: ["hoplite-phalanx"], civ: "greece", cost: 40 },
    // Egypt's Nile bureaucracy — scribes and granaries: extra food & science per city.
    "nile-bureaucracy": { age: 2, prerequisites: ["writing"], civ: "egypt", cost: 40 },
    // Carthage's thalassocracy — mastery of the sea: warships hit harder and cost less.
    thalassocracy: { age: 2, prerequisites: ["open-sea-sailing"], civ: "carthage", cost: 44 },
    // Gaul's furor — the headlong charge: warbands strike with terrible force.
    furor: { age: 2, prerequisites: ["iron-mastery"], civ: "gaul", cost: 40 },
    // Parthia's Parthian shot — horse archers loose and wheel away untouched.
    "parthian-shot": { age: 3, prerequisites: ["horse-archery"], civ: "parthia", cost: 48 }
  };
  var TECH_CITY_YIELD = {
    philosophy: { science: 1 },
    mathematics: { production: 1 },
    astronomy: { science: 1 },
    aqueducts: { food: 1 },
    "law-administration": { gold: 1 },
    "currency-reform": { gold: 1 },
    "crop-rotation": { food: 1 },
    "nile-bureaucracy": { food: 1, science: 1 }
    // Egypt's civ bonus
  };
  var TECH_STABILITY = {};
  for (const t of UNIQUE_TECHS) {
    const prior = TECHS[t.id];
    TECHS[t.id] = {
      age: t.age,
      prerequisites: t.prereq.slice(),
      civ: t.civ,
      name: t.name,
      note: t.note,
      capstone: t.capstone,
      effect: t.effect,
      ...prior && prior.forkGroup ? { forkGroup: prior.forkGroup, forkBranch: prior.forkBranch } : {}
    };
    const cy = t.effect.cityYield;
    if (cy) {
      const y = {};
      for (const k of Object.keys(cy)) {
        const v = cy[k];
        if (k === "food") y.food = (y.food ?? 0) + v;
        else if (k === "science") y.science = (y.science ?? 0) + v;
        else if (k === "gold") y.gold = (y.gold ?? 0) + v;
        else if (k === "labour" || k === "production") y.production = (y.production ?? 0) + v;
        else if (k === "stability") TECH_STABILITY[t.id] = (TECH_STABILITY[t.id] ?? 0) + v;
      }
      if (y.food || y.production || y.gold || y.science) TECH_CITY_YIELD[t.id] = y;
    }
  }
  var TRUNK_CHAINS = {
    // AGE I — entries: bronze-working, masonry, pottery, writing, sailing
    archery: ["bronze-working"],
    "animal-husbandry": ["pottery"],
    irrigation: ["animal-husbandry"],
    mathematics: ["writing"],
    "phalanx-doctrine": ["bronze-working"],
    "skirmish-doctrine": ["archery"],
    "temple-economy": ["irrigation"],
    coinage: ["irrigation"],
    // AGE II — entries: iron-working, engineering, open-sea-sailing, philosophy, caravan-logistics
    "iron-working": ["bronze-working", "masonry"],
    engineering: ["masonry"],
    "open-sea-sailing": ["sailing", "writing"],
    philosophy: ["writing"],
    "caravan-logistics": ["irrigation"],
    "combined-arms": ["iron-working"],
    metallurgy: ["combined-arms"],
    "horseback-riding": ["animal-husbandry", "metallurgy"],
    "mountain-paths": ["engineering"],
    aqueducts: ["mountain-paths"],
    astronomy: ["mathematics", "philosophy"],
    republic: ["astronomy"],
    monarchy: ["astronomy"],
    "ramming-fleets": ["open-sea-sailing"],
    "merchant-marine": ["open-sea-sailing"],
    "crop-rotation": ["caravan-logistics", "irrigation"],
    // AGE III — entries: siegecraft, roads-logistics, cartography, currency-reform, law-administration
    siegecraft: ["iron-working", "engineering"],
    "roads-logistics": ["engineering"],
    cartography: ["open-sea-sailing"],
    "currency-reform": ["masonry", "writing"],
    "law-administration": ["writing", "republic"],
    rhetoric: ["philosophy", "law-administration"],
    medicine: ["philosophy", "rhetoric"],
    assimilation: ["medicine"],
    "tribute-empire": ["medicine"]
  };
  for (const [id, prereqs] of Object.entries(TRUNK_CHAINS)) {
    if (TECHS[id]) TECHS[id].prerequisites = prereqs;
  }
  var UNITS = {
    warrior: { domain: "land", movement: 2, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1, category: "infantry" },
    archer: { domain: "land", movement: 2, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1, category: "ranged" },
    spearman: {
      domain: "land",
      movement: 2,
      attack: 15,
      defense: 22,
      maxHp: 20,
      range: 1,
      upkeep: 1,
      requiresTech: "bronze-working",
      category: "spear",
      counters: { mounted: 0.6 }
    },
    swordsman: {
      domain: "land",
      movement: 2,
      attack: 27,
      defense: 20,
      maxHp: 22,
      range: 1,
      upkeep: 2,
      requiresTech: "iron-working",
      category: "heavy",
      counters: { ranged: 0.35, spear: 0.2 }
    },
    horseman: {
      domain: "land",
      movement: 3,
      attack: 22,
      defense: 14,
      maxHp: 20,
      range: 1,
      upkeep: 2,
      mounted: true,
      requiresTech: "horseback-riding",
      category: "mounted",
      counters: { ranged: 0.5, infantry: 0.15 }
    },
    siege: {
      domain: "land",
      movement: 1,
      attack: 12,
      defense: 8,
      maxHp: 16,
      range: 2,
      upkeep: 2,
      requiresTech: "siegecraft",
      category: "siege",
      siegeBonus: 1.2
    },
    trireme: { domain: "naval", movement: 3, attack: 24, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "open-sea-sailing", category: "ranged" },
    merchant: { domain: "civilian", movement: 2, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1, category: "infantry" },
    settler: { domain: "civilian", movement: 2, attack: 0, defense: 6, maxHp: 12, range: 0, upkeep: 1, category: "infantry" },
    // §10.1 — the recon/discovery specialist: fastest land unit, cannot attack,
    // and the only unit that fully excavates a Ruin (others get half, no Codex).
    explorer: { domain: "civilian", movement: 4, attack: 0, defense: 4, maxHp: 12, range: 0, upkeep: 1, category: "support" },
    // --- Civilization-unique units (each gated by that people's unique tech) ---
    // Rome — the legion: drilled heavy foot, a clear step beyond the swordsman.
    legionary: {
      domain: "land",
      movement: 2,
      attack: 30,
      defense: 26,
      maxHp: 26,
      range: 1,
      upkeep: 2,
      requiresTech: "legionary-system",
      civ: "rome",
      category: "heavy",
      counters: { ranged: 0.35, spear: 0.25 },
      upgradesFrom: "swordsman"
    },
    // Greece — the hoplite phalanx: an immovable shield-wall that shatters cavalry.
    hoplite: {
      domain: "land",
      movement: 2,
      attack: 22,
      defense: 30,
      maxHp: 24,
      range: 1,
      upkeep: 2,
      requiresTech: "hoplite-phalanx",
      civ: "greece",
      category: "spear",
      counters: { mounted: 0.7 },
      upgradesFrom: "spearman"
    },
    // Carthage — the war elephant: shock beast that tramples massed infantry.
    "war-elephant": {
      domain: "land",
      movement: 2,
      attack: 34,
      defense: 22,
      maxHp: 32,
      range: 1,
      upkeep: 2,
      requiresTech: "war-elephants",
      civ: "carthage",
      category: "heavy",
      counters: { infantry: 0.4, ranged: 0.3 },
      upgradesFrom: "swordsman"
    },
    // Egypt — the war chariot: fast archer-platform that rides down light troops.
    "war-chariot": {
      domain: "land",
      movement: 4,
      attack: 24,
      defense: 16,
      maxHp: 22,
      range: 1,
      upkeep: 2,
      mounted: true,
      requiresTech: "chariotry",
      civ: "egypt",
      category: "mounted",
      counters: { ranged: 0.5, infantry: 0.2 },
      upgradesFrom: "horseman"
    },
    // Britons — the chariot of the isles: hit-and-run — keeps moving after it strikes.
    "chariot-isles": {
      domain: "land",
      movement: 4,
      attack: 22,
      defense: 14,
      maxHp: 20,
      range: 1,
      upkeep: 2,
      mounted: true,
      requiresTech: "chariot-craft",
      civ: "britons",
      category: "mounted",
      counters: { ranged: 0.4, infantry: 0.15 },
      upgradesFrom: "horseman",
      special: "hit-and-run"
    },
    // Kush — the archer of Meroë: the finest bowmen of the early ages (Ta-Seti, "land of the bow").
    "meroe-archer": {
      domain: "land",
      movement: 2,
      attack: 24,
      defense: 13,
      maxHp: 20,
      range: 2,
      upkeep: 1,
      requiresTech: "ta-seti-archery",
      civ: "kush",
      category: "ranged",
      counters: { infantry: 0.2 },
      upgradesFrom: "archer"
    },
    // Gaul — the gaesatae: ferocious naked charge, murderous but poorly guarded.
    gaesatae: {
      domain: "land",
      movement: 2,
      attack: 32,
      defense: 15,
      maxHp: 22,
      range: 1,
      upkeep: 2,
      requiresTech: "iron-mastery",
      civ: "gaul",
      category: "heavy",
      counters: { ranged: 0.3 },
      upgradesFrom: "swordsman"
    },
    // Parthia — the horse archer: the Parthian shot, striking from range then fleeing.
    "horse-archer": {
      domain: "land",
      movement: 4,
      attack: 20,
      defense: 14,
      maxHp: 18,
      range: 2,
      upkeep: 2,
      mounted: true,
      requiresTech: "horse-archery",
      civ: "parthia",
      category: "mounted",
      counters: { infantry: 0.25, spear: 0.3 },
      upgradesFrom: "horseman"
    },
    // --- v2 branch units (stats derived from NEW_UNITS basedOn+tweak; 3D models &
    //     the wider roster are Phase 3). Cataphract is the only WAVE-1 addition;
    //     the other four are gated to wave-2 civs (not yet playable) and exist so
    //     their branch `unlocks` resolve. Two carry a `special` this note flags:
    //     immortal's 50%-cost-refund-on-death and crossbowman's terrain-def bypass
    //     are STUBBED (base stats only) until the hooks ship.
    cataphract: {
      domain: "land",
      movement: 2,
      attack: 26,
      defense: 26,
      maxHp: 28,
      range: 1,
      upkeep: 2,
      mounted: true,
      requiresTech: "cataphract-armouries",
      civ: "parthia",
      category: "mounted",
      counters: { ranged: 0.5, infantry: 0.2 },
      upgradesFrom: "horseman"
    },
    spartiate: {
      domain: "land",
      movement: 2,
      attack: 26,
      defense: 34,
      maxHp: 26,
      range: 1,
      upkeep: 2,
      requiresTech: "spartiate-corps",
      civ: "sparta",
      category: "spear",
      counters: { mounted: 0.7 },
      upgradesFrom: "hoplite"
    },
    phalangite: {
      domain: "land",
      movement: 2,
      attack: 20,
      defense: 24,
      maxHp: 20,
      range: 1,
      upkeep: 2,
      requiresTech: "sarissa-phalanx",
      civ: "macedon",
      category: "spear",
      counters: { mounted: 0.6, infantry: 0.2 },
      upgradesFrom: "spearman"
    },
    immortal: {
      domain: "land",
      movement: 2,
      attack: 20,
      defense: 24,
      maxHp: 22,
      range: 1,
      upkeep: 1,
      requiresTech: "immortals",
      civ: "persia",
      category: "spear",
      counters: { mounted: 0.5 },
      upgradesFrom: "spearman"
    },
    crossbowman: {
      domain: "land",
      movement: 1,
      attack: 22,
      defense: 12,
      maxHp: 18,
      range: 2,
      upkeep: 1,
      requiresTech: "crossbow-production",
      civ: "han",
      category: "ranged",
      upgradesFrom: "archer"
    },
    // --- v2 unique-unit roster (units-v2.js): 3 per civ. Stats derived from
    //     basedOn + numeric mods; the `special` behaviours (retreat-after-attack,
    //     elite auras, terrain conditionality, resupply, upkeep-in-food, etc.) are
    //     STUBBED — base stats only — and listed in the Phase-3 summary. Wave-2 civ
    //     units are civ-gated and inert until those civs are playable. Distinct 3D
    //     silhouettes (UNIT_SILHOUETTES) are a visual follow-up; today each renders
    //     on its category rig.
    velites: { domain: "land", movement: 3, attack: 15, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "castra", civ: "rome", category: "ranged", upgradesFrom: "archer" },
    praetorian: { domain: "land", movement: 2, attack: 32, defense: 28, maxHp: 28, range: 1, upkeep: 2, requiresTech: "marian-reforms", civ: "rome", category: "heavy", counters: { ranged: 0.35, spear: 0.25 }, upgradesFrom: "legionary", buildCap: 2 },
    "sacred-band": { domain: "land", movement: 2, attack: 16, defense: 24, maxHp: 22, range: 1, upkeep: 1, requiresTech: "suffete-council", civ: "carthage", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
    "numidian-cavalry": { domain: "land", movement: 4, attack: 22, defense: 13, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "numidian-alliance", civ: "carthage", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
    peltast: { domain: "land", movement: 3, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "hoplite-phalanx", civ: "greece", category: "ranged", counters: { spear: 0.25 }, upgradesFrom: "archer" },
    "athenian-trireme": { domain: "naval", movement: 4, attack: 26, defense: 16, maxHp: 24, range: 1, upkeep: 2, requiresTech: "neorion", civ: "greece", category: "ranged", upgradesFrom: "trireme" },
    "nubian-archer": { domain: "land", movement: 2, attack: 18, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "nubian-archers", civ: "egypt", category: "ranged", upgradesFrom: "archer" },
    machimoi: { domain: "land", movement: 2, attack: 15, defense: 23, maxHp: 20, range: 1, upkeep: 1, requiresTech: "temple-estates", civ: "egypt", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
    "noble-horse": { domain: "land", movement: 3, attack: 24, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "noble-cavalry", civ: "gaul", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
    soldurii: { domain: "land", movement: 2, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "client-warbands", civ: "gaul", category: "infantry", counters: { ranged: 0.3 }, upgradesFrom: "swordsman" },
    "camel-train": { domain: "civilian", movement: 2, attack: 0, defense: 8, maxHp: 16, range: 0, upkeep: 1, requiresTech: "desert-waystations", civ: "parthia", category: "support" },
    "perioikoi-hoplite": { domain: "land", movement: 2, attack: 15, defense: 22, maxHp: 20, range: 1, upkeep: 1, requiresTech: "perioikoi-crafts", civ: "sparta", category: "spear", counters: { mounted: 0.6 }, upgradesFrom: "spearman" },
    skiritai: { domain: "land", movement: 3, attack: 20, defense: 18, maxHp: 20, range: 1, upkeep: 1, requiresTech: "krypteia", civ: "sparta", category: "infantry", upgradesFrom: "warrior" },
    "companion-cavalry": { domain: "land", movement: 3, attack: 25, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "hetairoi", civ: "macedon", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" },
    hypaspist: { domain: "land", movement: 3, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "royal-pages", civ: "macedon", category: "infantry", counters: { ranged: 0.3 }, upgradesFrom: "swordsman" },
    sparabara: { domain: "land", movement: 2, attack: 16, defense: 14, maxHp: 18, range: 2, upkeep: 1, requiresTech: "archer-corps", civ: "persia", category: "ranged", upgradesFrom: "archer" },
    "scythed-chariot": { domain: "land", movement: 3, attack: 25, defense: 12, maxHp: 22, range: 1, upkeep: 2, mounted: true, requiresTech: "engineering", civ: "persia", category: "mounted", counters: { ranged: 0.5 }, upgradesFrom: "horseman" },
    "han-cavalry": { domain: "land", movement: 3, attack: 23, defense: 15, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "heavenly-horses", civ: "han", category: "mounted", counters: { mounted: 0.3 }, upgradesFrom: "horseman" },
    "ji-halberdier": { domain: "land", movement: 2, attack: 28, defense: 21, maxHp: 22, range: 1, upkeep: 2, requiresTech: "iron-salt-monopoly", civ: "han", category: "infantry", counters: { mounted: 0.3 }, upgradesFrom: "swordsman" },
    "armoured-elephant": { domain: "land", movement: 2, attack: 35, defense: 24, maxHp: 34, range: 1, upkeep: 2, requiresTech: "elephant-corps", civ: "maurya", category: "heavy", counters: { infantry: 0.4, ranged: 0.3 }, upgradesFrom: "war-elephant" },
    "indian-longbow": { domain: "land", movement: 2, attack: 18, defense: 12, maxHp: 18, range: 2, upkeep: 1, requiresTech: "archery", civ: "maurya", category: "ranged", upgradesFrom: "archer" },
    "kshatriya-chariot": { domain: "land", movement: 3, attack: 24, defense: 16, maxHp: 22, range: 1, upkeep: 2, mounted: true, requiresTech: "imperial-army-scale", civ: "maurya", category: "mounted", counters: { ranged: 0.5, infantry: 0.2 }, upgradesFrom: "horseman" },
    "steppe-archer": { domain: "land", movement: 4, attack: 16, defense: 12, maxHp: 18, range: 2, upkeep: 2, mounted: true, requiresTech: "recurve-mastery", civ: "scythia", category: "ranged", upgradesFrom: "archer" },
    "royal-scythian": { domain: "land", movement: 3, attack: 23, defense: 16, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "kurgan-rites", civ: "scythia", category: "heavy", counters: { ranged: 0.4 }, upgradesFrom: "horseman" },
    "amazon-rider": { domain: "land", movement: 4, attack: 23, defense: 14, maxHp: 20, range: 1, upkeep: 2, mounted: true, requiresTech: "warrior-women", civ: "scythia", category: "mounted", counters: { ranged: 0.5, infantry: 0.15 }, upgradesFrom: "horseman" }
  };
  var BUILDINGS = {
    granary: {
      name: "Granary",
      cost: 12,
      requiresTech: "pottery",
      yields: { food: 2 },
      note: "Storehouses of grain smoothed the lean years \u2014 the horrea that fed Rome and the silos of Egypt. Needs Pottery (storage jars & silos). Effect: +2 food (faster growth)."
    },
    workshop: {
      name: "Workshop",
      cost: 18,
      requiresTech: "bronze-working",
      yields: { production: 2 },
      note: "Fabricae and artisan quarters turned raw metal and timber into arms and tools. Needs Bronze Working (the smith's craft). Effect: +2 production."
    },
    market: {
      name: "Market",
      cost: 14,
      requiresTech: "writing",
      yields: { gold: 2 },
      note: "The macellum and agora \u2014 the beating commercial heart of every ancient city. Needs Writing (accounts & contracts). Effect: +2 gold."
    },
    library: {
      name: "Library",
      cost: 20,
      requiresTech: "writing",
      yields: { science: 2 },
      note: "From the Great Library of Alexandria to temple archives, collected knowledge accelerated discovery. Effect: +2 science."
    },
    walls: {
      name: "Walls",
      cost: 22,
      requiresTech: "masonry",
      cityHp: 20,
      note: "Servian and Aurelian walls, Hellenistic circuits \u2014 dressed stone that turned a town into a fortress. Effect: +20 city HP."
    },
    harbor: {
      name: "Harbor",
      cost: 18,
      requiresTech: "sailing",
      coastalOnly: true,
      yields: { food: 1, gold: 2 },
      networkGold: 1,
      note: "Moles, quays and warehouses \u2014 Ostia, Carthage's circular cothon, Piraeus. Sea lanes carried grain, wine, tin and silver across the classical world. Effect: +1 food, +2 gold, and +1 more gold for every other Harbor you hold (a trade network)."
    },
    temple: {
      name: "Temple",
      cost: 18,
      requiresTech: "pottery",
      yields: { science: 1, gold: 1 },
      note: "The house of the city's god \u2014 the Parthenon, the Capitoline temple, Karnak. Cult, festival and civic pride in stone. Effect: +1 science, +1 gold."
    },
    academy: {
      name: "Academy",
      cost: 24,
      requiresTech: "mathematics",
      yields: { science: 3 },
      note: "Where number and proof were taught \u2014 Euclid's Alexandria, Pythagoras' school. Effect: +3 science."
    },
    lyceum: {
      name: "Lyceum",
      cost: 26,
      requiresTech: "philosophy",
      yields: { science: 2, gold: 1 },
      note: "Aristotle's Lyceum and Plato's Academy \u2014 reasoned inquiry into nature, ethics and the state. Effect: +2 science, +1 gold."
    },
    aqueduct: {
      name: "Aqueduct",
      cost: 26,
      requiresTech: "aqueducts",
      yields: { food: 3 },
      note: "Arched channels carrying clean water for miles \u2014 the Aqua Appia, the Pont du Gard. Bigger, healthier cities. Effect: +3 food."
    },
    barracks: {
      name: "Barracks",
      cost: 20,
      requiresTech: "metallurgy",
      cityHp: 10,
      yields: { production: 1 },
      note: "Drill yards, armouries and the forge \u2014 where raw levies were made into soldiers. Effect: +1 labour, +10 city HP."
    },
    amphitheater: {
      name: "Amphitheater",
      cost: 26,
      requiresTech: "rhetoric",
      yields: { gold: 2, science: 1 },
      note: "Theatre and arena \u2014 the games and rhetoric that bound a populace to the state, from the Theatre of Dionysus to the Colosseum. Effect: +2 gold, +1 science."
    },
    // Rome-only (v2 Via Romana branch): unlocked by The Senate (res-publica), the
    // civic square. Its stability yield is STUBBED as gold until the stat ships.
    forum: {
      name: "Forum",
      cost: 16,
      requiresTech: "res-publica",
      yields: { gold: 2 },
      note: "Market, court and rostra in one square \u2014 the civic engine of a Roman town. Effect: +2 gold (Forums research adds more)."
    },
    // Britons — the Nemeton: a sacred grove of the druids (§4.1 unique building).
    nemeton: {
      name: "Nemeton",
      cost: 16,
      civ: "britons",
      requiresTech: "druidic-lore",
      yields: { science: 2 },
      note: "A sacred grove where the druids kept the lore of the tribe \u2014 no roof but the oak canopy. Effect: +2 science."
    },
    // Kush — the Iron Furnaces of Meroë (§4.1 unique building).
    "iron-furnaces": {
      name: "Iron Furnaces of Mero\xEB",
      cost: 18,
      civ: "kush",
      requiresTech: "meroitic-iron",
      yields: { production: 2 },
      note: "Mero\xEB smelted iron on a scale that earned it the name 'the Birmingham of Africa'. Effect: +2 production."
    }
  };
  var IMPROVEMENTS = {
    farm: {
      name: "Farm",
      terrains: ["plains", "valley"],
      cost: 10,
      yields: { food: 2 },
      requiresTech: "irrigation",
      note: "Ditched fields and irrigation \u2014 the centuriated farmland of Italy, the flood-fed plots of the Nile. Effect: +2 food. (Needs Irrigation.)"
    },
    pasture: {
      name: "Pasture",
      terrains: ["plains", "valley", "hills"],
      cost: 10,
      yields: { food: 1, production: 1 },
      requiresTech: "animal-husbandry",
      note: "Herds of cattle, sheep and horses on open range \u2014 hides, wool and remounts. Effect: +1 food, +1 labour. (Needs Animal Husbandry.)"
    },
    mine: {
      name: "Mine",
      terrains: ["hills", "mountains"],
      cost: 12,
      yields: { production: 2 },
      requiresResource: ["iron", "silver"],
      note: "Shafts and galleries after silver, iron and copper \u2014 Laurion, Rio Tinto, the Noric iron. Effect: +2 labour. (Needs an iron or silver deposit.)"
    },
    "lumber-camp": {
      name: "Lumber Camp",
      terrains: ["forest"],
      cost: 10,
      yields: { production: 1, gold: 1 },
      requiresTech: "bronze-working",
      note: "Timber for ships, siege engines and building \u2014 the forests of Gaul and Germania. Effect: +1 labour, +1 gold. (Needs Bronze Working for the tools.)"
    },
    "trade-post": {
      name: "Trade Post",
      terrains: ["desert"],
      cost: 10,
      yields: { gold: 2 },
      note: "A caravanserai on the desert road \u2014 incense, silk and salt passing hand to hand. Effect: +2 gold."
    },
    quarry: {
      name: "Quarry",
      terrains: ["hills", "mountains"],
      cost: 12,
      yields: { production: 2, gold: 1 },
      requiresTech: "metallurgy",
      requiresResource: ["stone"],
      note: "Cut stone and marble for walls, roads and monuments \u2014 the travertine of Tibur, the marble of Paros. Effect: +2 labour, +1 gold. (Needs a stone deposit and Metallurgy.)"
    },
    vineyard: {
      name: "Vineyard",
      terrains: ["plains", "hills"],
      cost: 10,
      yields: { food: 1, gold: 2 },
      requiresTech: "pottery",
      note: "Terraced vines and olive groves \u2014 the wine and oil that were the classical world's cash crops. Effect: +1 food, +2 gold. (Needs Pottery for the amphorae.)"
    },
    fishery: {
      name: "Fishery",
      terrains: ["coast"],
      cost: 10,
      yields: { food: 2 },
      requiresTech: "sailing",
      requiresResource: ["fish"],
      note: "Nets, weirs and tunny-traps worked over a shoal. Effect: +2 food. (Needs a fish deposit and Sailing.)"
    },
    harbour: {
      name: "Harbour",
      terrains: ["coast"],
      cost: 14,
      yields: { food: 1, gold: 2 },
      requiresTech: "sailing",
      note: "A quay and moorings on a coastal hex beside a city \u2014 its troops can put to sea from here. Effect: +1 food, +2 gold, and lets armies embark. (Needs Sailing.)"
    },
    bridge: {
      name: "Bridge",
      terrains: ["great-river"],
      cost: 16,
      yields: { gold: 1 },
      requiresTech: "engineering",
      note: "A piled or arched bridge across a great river \u2014 land units cross the tile freely and armies no longer assault its cities by boat. Effect: +1 gold and a permanent land crossing. (Needs Engineering.)"
    }
  };
  var RESOURCES = {
    grain: {
      name: "Grain",
      glyph: "\u{1F33E}",
      terrains: ["plains", "valley"],
      yields: { food: 2 },
      note: "The wheat of Egypt, Sicily and the Black Sea that fed whole cities. Effect: +2 food."
    },
    fish: {
      name: "Fish",
      glyph: "\u{1F41F}",
      terrains: ["coast"],
      yields: { food: 1, gold: 1 },
      note: "Tunny runs and salt-fish (garum) traded the length of the Mediterranean. Effect: +1 food, +1 gold."
    },
    coral: {
      name: "Coral",
      glyph: "\u{1FAB8}",
      terrains: ["coast"],
      yields: { gold: 2 },
      note: "Red coral and murex purple gathered off the shore \u2014 a luxury of the ancient sea trade. Effect: +2 gold."
    },
    timber: {
      name: "Timber",
      glyph: "\u{1FAB5}",
      terrains: ["forest"],
      yields: { production: 2 },
      note: "Ship-timber and building wood from the forests of Gaul, Macedon and Latium. Effect: +2 labour."
    },
    iron: {
      name: "Iron",
      glyph: "\u26CF\uFE0F",
      terrains: ["hills", "mountains"],
      yields: { production: 2 },
      note: "The Noric iron and Spanish mines that armed the legions. Effect: +2 labour."
    },
    stone: {
      name: "Stone",
      glyph: "\u{1FAA8}",
      terrains: ["hills", "mountains"],
      yields: { production: 1, gold: 1 },
      note: "Marble and travertine for temples, walls and roads. Effect: +1 labour, +1 gold."
    },
    horses: {
      name: "Horses",
      glyph: "\u{1F40E}",
      terrains: ["plains", "valley"],
      yields: { production: 1, gold: 1 },
      note: "The horse-runs of Thessaly, Numidia and the steppe \u2014 remounts for cavalry. Effect: +1 labour, +1 gold."
    },
    wine: {
      name: "Wine",
      glyph: "\u{1F347}",
      terrains: ["hills", "plains"],
      yields: { gold: 2 },
      note: "Vines and olive groves \u2014 the amphorae of Chios, Falernum and Baetica. Effect: +2 gold."
    },
    silver: {
      name: "Silver",
      glyph: "\u{1FA99}",
      terrains: ["hills", "mountains", "desert"],
      yields: { gold: 2 },
      note: "The silver of Laurion and the Spanish sierras that struck the coin of empires. Effect: +2 gold."
    }
  };
  var BUILD_DISCOUNT = 0.7;
  var BUILD_RESOURCE = {
    trireme: "timber",
    siege: "timber",
    swordsman: "iron",
    spearman: "iron",
    hoplite: "iron",
    legionary: "iron",
    gaesatae: "iron",
    barracks: "iron",
    horseman: "horses",
    "war-chariot": "horses",
    "horse-archer": "horses",
    // War elephants ate enormous fodder — a grain surplus sustains the beasts, and
    // it gives Carthage's signature unit the same discount parity as other elites.
    "war-elephant": "grain",
    walls: "stone"
  };
  var MELEE_CATEGORIES = /* @__PURE__ */ new Set(["infantry", "spear", "heavy"]);
  var RANGED_CATEGORIES = /* @__PURE__ */ new Set(["ranged", "siege"]);
  var CATEGORY_LABELS = {
    infantry: "infantry",
    spear: "spearmen",
    heavy: "heavy infantry",
    ranged: "ranged",
    mounted: "cavalry",
    siege: "siege",
    support: "support"
  };
  var UNIT_BUILD_COSTS = {
    warrior: 12,
    archer: 14,
    spearman: 14,
    swordsman: 20,
    horseman: 20,
    siege: 24,
    trireme: 22,
    merchant: 16,
    settler: 18,
    explorer: 14,
    // Civ-unique units — costlier than their generic cousins, worth every labourer.
    legionary: 26,
    hoplite: 22,
    "war-elephant": 24,
    "war-chariot": 24,
    "chariot-isles": 22,
    "meroe-archer": 20,
    gaesatae: 20,
    "horse-archer": 24,
    // v2 branch units
    cataphract: 28,
    spartiate: 26,
    phalangite: 24,
    immortal: 22,
    crossbowman: 22,
    // v2 unique-unit roster
    velites: 12,
    praetorian: 34,
    "sacred-band": 22,
    "numidian-cavalry": 20,
    peltast: 16,
    "athenian-trireme": 26,
    "nubian-archer": 18,
    machimoi: 14,
    "noble-horse": 24,
    soldurii: 24,
    "camel-train": 16,
    "perioikoi-hoplite": 16,
    skiritai: 16,
    "companion-cavalry": 26,
    hypaspist: 24,
    sparabara: 18,
    "scythed-chariot": 26,
    "han-cavalry": 22,
    "ji-halberdier": 24,
    "armoured-elephant": 30,
    "indian-longbow": 18,
    "kshatriya-chariot": 24,
    "steppe-archer": 20,
    "royal-scythian": 24,
    "amazon-rider": 20
  };
  var BASE_ALIAS = { "war-galley": "trireme", "siege-ballista": "siege" };
  for (const u of UNIQUE_UNITS_WAVE2) {
    const base = UNITS[BASE_ALIAS[u.basedOn] ?? u.basedOn] ?? UNITS.warrior;
    const m = u.mods;
    const n = (k) => typeof m[k] === "number" ? m[k] : 0;
    const rule = {
      domain: base.domain,
      movement: Math.max(1, base.movement + n("move")),
      attack: m.noAttack ? 0 : Math.max(0, base.attack + n("atk")),
      defense: base.defense + n("def"),
      maxHp: base.maxHp + n("maxHp"),
      range: base.range,
      upkeep: base.upkeep,
      category: u.cat,
      requiresTech: u.unlockedBy,
      civ: u.civ
    };
    if (m.mounted === true || base.mounted) rule.mounted = true;
    if (base.counters) rule.counters = base.counters;
    if (m.cap === "max-1") rule.buildCap = 1;
    else if (m.cap === "max-2") rule.buildCap = 2;
    UNITS[u.id] = rule;
    const baseCost = UNIT_BUILD_COSTS[BASE_ALIAS[u.basedOn] ?? u.basedOn] ?? 24;
    UNIT_BUILD_COSTS[u.id] = Math.max(8, Math.round((baseCost + n("cost")) * (m.cheap ? 0.75 : 1)));
  }

  // src/engine/hex.ts
  var DIRECTIONS = [
    [1, 0],
    [1, -1],
    [0, -1],
    [-1, 0],
    [-1, 1],
    [0, 1]
  ];
  function keyOf(coord) {
    return `${coord.q},${coord.r}`;
  }
  function parseKey(key) {
    const [q, r] = key.split(",").map(Number);
    return { q, r };
  }
  function neighborsOf(coord) {
    return DIRECTIONS.map(([dq, dr]) => ({ q: coord.q + dq, r: coord.r + dr }));
  }
  function distance(a, b) {
    return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
  }
  function edgeKey(a, b) {
    const ak = keyOf(a);
    const bk = keyOf(b);
    return ak < bk ? `${ak}|${bk}` : `${bk}|${ak}`;
  }

  // src/engine/pathfinding.ts
  function hasHarbourAt(state, c, ownerId) {
    for (const city of Object.values(state.map.cities)) {
      if (city.ownerId === ownerId && city.position.q === c.q && city.position.r === c.r && (city.buildings ?? []).includes("harbor")) return true;
    }
    for (const n of neighborsOf(c)) {
      const t = state.map.tiles[keyOf(n)];
      if (!t || t.improvement !== "harbour") continue;
      for (const city of Object.values(state.map.cities)) {
        if (city.ownerId !== ownerId) continue;
        for (const cn of neighborsOf(n)) {
          if (cn.q === city.position.q && cn.r === city.position.r) return true;
        }
      }
    }
    return false;
  }
  function touchesRiver(state, c) {
    for (const n of neighborsOf(c)) {
      if (state.map.rivers[edgeKey(c, n)]) return true;
    }
    return false;
  }
  function movementCost(state, unit, from, to) {
    const toTile = state.map.tiles[keyOf(to)];
    if (!toTile) return Number.POSITIVE_INFINITY;
    const terrain = TERRAIN[toTile.terrain];
    if (!terrain) return Number.POSITIVE_INFINITY;
    if (terrain.navalOnly && toTile.improvement === "bridge" && unit.domain !== "naval") {
      return 1;
    }
    if (terrain.navalOnly && unit.domain !== "naval") {
      const owner2 = state.playersById[unit.ownerId];
      if (!owner2 || !owner2.techs.includes("sailing")) return Number.POSITIVE_INFINITY;
      const fromTile = state.map.tiles[keyOf(from)];
      const leavingLand = fromTile && !(TERRAIN[fromTile.terrain] && TERRAIN[fromTile.terrain].navalOnly);
      if (leavingLand && !hasHarbourAt(state, from, unit.ownerId)) return Number.POSITIVE_INFINITY;
    }
    if (!terrain.navalOnly && unit.domain === "naval") return Number.POSITIVE_INFINITY;
    if (terrain.requiresTech && !state.playersById[unit.ownerId].techs.includes(terrain.requiresTech)) {
      return Number.POSITIVE_INFINITY;
    }
    const mountainPass = terrain.impassableWithoutTech === "mountain-paths" && (state.activeEffects ?? []).some((e) => e.kind === "mountain-pass" && e.ownerId === unit.ownerId && state.turn <= e.expiresTurn);
    if (terrain.impassableWithoutTech && !state.playersById[unit.ownerId].techs.includes(terrain.impassableWithoutTech) && !mountainPass) {
      return Number.POSITIVE_INFINITY;
    }
    const crossingKey = edgeKey(from, to);
    const crossingRiver = !!state.map.rivers[crossingKey];
    const ROAD_MOVE = 0.5;
    const owner = state.playersById[unit.ownerId];
    const canBridge = !!owner && owner.techs.includes("engineering");
    if (toTile.road && (!crossingRiver || canBridge)) return ROAD_MOVE;
    if (!crossingRiver && unit.domain === "land" && !terrain.navalOnly && touchesRiver(state, from) && touchesRiver(state, to)) {
      return ROAD_MOVE;
    }
    let cost = terrain.moveCost;
    if (unit.mounted && state.weather.current[toTile.region] === "rain") {
      cost += 1;
    }
    if (crossingRiver) {
      cost += 1;
      if (state.weather.current[toTile.region] === "rain") {
        cost += 1;
      }
    }
    return cost;
  }
  function findPath(state, unit, start, goal) {
    const startKey = keyOf(start);
    const goalKey = keyOf(goal);
    if (startKey === goalKey) return [start];
    const frontier = [{ key: startKey, cost: 0 }];
    const cameFrom = /* @__PURE__ */ new Map([[startKey, null]]);
    const costSoFar = /* @__PURE__ */ new Map([[startKey, 0]]);
    while (frontier.length > 0) {
      frontier.sort((a, b) => a.cost - b.cost);
      const current = frontier.shift();
      if (!current) break;
      const currentKey = current.key;
      if (currentKey === goalKey) break;
      const currentCoord = parseKey(currentKey);
      for (const next of neighborsOf(currentCoord)) {
        const nextKey = keyOf(next);
        const step = movementCost(state, unit, currentCoord, next);
        if (!Number.isFinite(step)) continue;
        const nextCost = (costSoFar.get(currentKey) ?? 0) + step;
        const known = costSoFar.get(nextKey);
        if (known === void 0 || nextCost < known) {
          costSoFar.set(nextKey, nextCost);
          frontier.push({ key: nextKey, cost: nextCost });
          cameFrom.set(nextKey, currentKey);
        }
      }
    }
    if (!cameFrom.has(goalKey)) return null;
    const path = [];
    let cursor = goalKey;
    while (cursor) {
      path.push(parseKey(cursor));
      cursor = cameFrom.get(cursor) ?? null;
    }
    path.reverse();
    return path;
  }

  // src/engine/rng.ts
  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i += 1) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = h << 13 | h >>> 19;
    }
    return function hash() {
      h = Math.imul(h ^ h >>> 16, 2246822507);
      h = Math.imul(h ^ h >>> 13, 3266489909);
      h ^= h >>> 16;
      return h >>> 0;
    };
  }
  function mulberry32(seed) {
    let t = seed >>> 0;
    return function rand() {
      t += 1831565813;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }
  function seededRandom(seed, salt) {
    const seedFn = xmur3(`${seed}:${salt}`);
    return mulberry32(seedFn());
  }

  // src/engine/visibility.ts
  function clampMin(value, minValue) {
    return value < minValue ? minValue : value;
  }
  function tileVisionBonus(state, coord) {
    const key = `${coord.q},${coord.r}`;
    const tile = state.map.tiles[key];
    if (!tile) return 0;
    return TERRAIN[tile.terrain]?.vision ?? 0;
  }
  function weatherVisionPenalty(state, coord) {
    const key = `${coord.q},${coord.r}`;
    const tile = state.map.tiles[key];
    if (!tile) return 0;
    return state.weather.current[tile.region] === "fog" ? 1 : 0;
  }
  function addVisibilityFromSource(state, source, baseRange, visible) {
    const sourceBonus = tileVisionBonus(state, source);
    const weatherPenalty = weatherVisionPenalty(state, source);
    const radius = clampMin(baseRange + sourceBonus - weatherPenalty, 1);
    for (const key of Object.keys(state.map.tiles)) {
      const target = parseKey(key);
      if (distance(source, target) <= radius) {
        visible.add(key);
      }
    }
  }
  function computeVisibility(state, playerId) {
    const visible = /* @__PURE__ */ new Set();
    for (const city of Object.values(state.map.cities)) {
      if (city.ownerId !== playerId) continue;
      addVisibilityFromSource(state, city.position, 2, visible);
    }
    for (const unit of Object.values(state.map.units)) {
      if (unit.ownerId !== playerId) continue;
      const unitDef = UNITS[unit.type];
      const baseRange = unitDef.range > 1 || unit.type === "explorer" ? 3 : 2;
      addVisibilityFromSource(state, unit.position, baseRange, visible);
    }
    if (!state.discovered) state.discovered = {};
    const discovered = new Set(state.discovered[playerId] ?? []);
    for (const key of visible) {
      discovered.add(key);
    }
    state.discovered[playerId] = [...discovered];
    for (const [key, tile] of Object.entries(state.map.tiles)) {
      if (tile.open) visible.add(key);
    }
    return {
      visibleTiles: [...visible],
      discoveredTiles: [...discovered]
    };
  }

  // src/engine/events.ts
  var EVENTS = [
    {
      id: "gracchi",
      title: "The Gracchi and the Land",
      situation: "Tribunes demand farmland for landless veterans, defying the Senate. (Rome, 133 BC \u2014 the reform that lit a century of strife.)",
      options: [
        {
          label: "Grant the land reform",
          outcome: "Veterans settle new farms. The people cheer; the nobles seethe.",
          effects: { production: 18, gold: -25 }
        },
        {
          label: "Side with the Senate",
          outcome: "Order holds and the treasury swells, but resentment festers.",
          effects: { gold: 32, science: -15 }
        }
      ]
    },
    {
      id: "grain-fleet",
      title: "The Grain Fleet Falters",
      situation: "Storms delay the grain ships from Alexandria and the city grows hungry. Bread or coin?",
      options: [
        {
          label: "Open the public granaries",
          outcome: "Bread for the people \u2014 the stores empty but the city thrives.",
          effects: { food: 8, gold: -15 }
        },
        {
          label: "Ration and sell the surplus",
          outcome: "Coin fills the coffers; the mob grumbles at the queues.",
          effects: { gold: 28, production: -8 }
        }
      ]
    },
    {
      id: "philosopher",
      title: "A Philosopher at the Gates",
      situation: "A renowned teacher offers to found a school of rhetoric and natural philosophy in your city.",
      options: [
        {
          label: "Endow the academy",
          outcome: "Minds are sharpened; discoveries follow.",
          effects: { science: 32, gold: -22 }
        },
        {
          label: "Send him on his way",
          outcome: "Tradition preserved, purse intact.",
          effects: { gold: 16 }
        }
      ]
    },
    {
      id: "mercenaries",
      title: "Mercenaries for Hire",
      situation: "A hardened band of spearmen offers their service \u2014 for a price. Sacred bands and hired spears fought in every ancient war.",
      options: [
        {
          label: "Hire the spearmen",
          outcome: "Fresh spears muster at your capital.",
          effects: { spawnUnit: "spearman", gold: -28 }
        },
        {
          label: "Refuse and keep the coin",
          outcome: "You keep your gold and your independence.",
          effects: { gold: 14 }
        }
      ]
    },
    {
      id: "games",
      title: "Games for the People",
      situation: "The crowd clamors for festival games in the forum. Bread and circuses buy loyalty \u2014 at a cost.",
      options: [
        {
          label: "Fund lavish games",
          outcome: "The crowd roars your name; workshops hum with new energy.",
          effects: { gold: -20, production: 12 }
        },
        {
          label: "Hold a modest festival",
          outcome: "A quiet celebration; savings kept.",
          effects: { gold: 8 }
        }
      ]
    },
    {
      id: "oracle",
      title: "The Oracle Speaks",
      situation: "Envoys return from Delphi with a riddling prophecy. The priests demand rich offerings to interpret it.",
      options: [
        {
          label: "Pay for the reading",
          outcome: "The omens are studied; scholars glean real insight from the ritual.",
          effects: { science: 26, gold: -20 }
        },
        {
          label: "Trust your own counsel",
          outcome: "You keep the offering and act on reason alone.",
          effects: { gold: 12 }
        }
      ]
    },
    {
      id: "plague",
      title: "Plague in the City",
      situation: "A sickness spreads through the crowded quarters \u2014 as it did in Athens in 430 BC, felling even Pericles.",
      options: [
        {
          label: "Quarantine and tend the sick",
          outcome: "The physicians contain it, though trade slows for a season.",
          effects: { gold: -18, food: 4 }
        },
        {
          label: "Let it run its course",
          outcome: "You spend nothing, but the workshops fall quiet as workers sicken.",
          effects: { production: -14 }
        }
      ]
    },
    {
      id: "elephants",
      title: "A Gift of War Elephants",
      situation: "An allied prince offers a handful of trained war elephants \u2014 terrifying, costly, and hungry.",
      options: [
        {
          label: "Accept the beasts",
          outcome: "A pair of tuskers lumbers into your capital (rendered here as heavy horse).",
          effects: { spawnUnit: "horseman", gold: -24 }
        },
        {
          label: "Politely decline",
          outcome: "You spare the fodder and the risk of a rout turning on you.",
          effects: { gold: 12 }
        }
      ]
    },
    {
      id: "publicani",
      title: "The Tax Farmers",
      situation: "The publicani offer to buy the right to collect your taxes \u2014 quick coin now, resentment later.",
      options: [
        {
          label: "Sell the tax contracts",
          outcome: "The treasury fills at once; the provinces grumble under the collectors.",
          effects: { gold: 34, production: -6 }
        },
        {
          label: "Keep collection in state hands",
          outcome: "Fairer, slower \u2014 and the workshops stay content.",
          effects: { production: 8 }
        }
      ]
    },
    {
      id: "engineer",
      title: "A Wandering Engineer",
      situation: "A Syracusan engineer in the spirit of Archimedes offers to build cranes, mills and machines of war.",
      options: [
        {
          label: "Commission his machines",
          outcome: "Mills turn and cranes rise \u2014 the city's output leaps.",
          effects: { production: 20, gold: -22 }
        },
        {
          label: "Send him to a rival",
          outcome: "You keep the coin; his genius serves another.",
          effects: { gold: 14 }
        }
      ]
    }
  ];
  function getEvent(id) {
    return EVENTS.find((e) => e.id === id);
  }

  // src/engine/figures.ts
  var FIGURES = [
    // ---- Universal: the thinkers and makers of the ancient world -------------------
    {
      id: "archimedes",
      name: "Archimedes of Syracuse",
      title: "Geometer & War-Engineer",
      note: "At Syracuse his cranes and catapults held Rome's fleet at bay for two years (214\u2013212 BC).",
      when: (c) => c.coastal && (c.navalThreat || c.age >= 2),
      options: [
        {
          label: "\u{1F525} The Burning Mirrors",
          outcome: "Polished bronze focuses the sun on the raiders' sails \u2014 the fleet burns on the water, and your coast is warded.",
          effects: { cancelRaids: true, perks: { defPct: 8 } }
        },
        {
          label: "\u2699\uFE0F The War Engines (the Claw)",
          outcome: "Cranes, catapults and the ship-lifting Claw rise on your walls \u2014 your armies strike harder and your works surge.",
          effects: { production: 22, perks: { atkPct: 6 } }
        },
        {
          label: "\u{1F30A} On Floating Bodies",
          outcome: "The law of buoyancy reshapes your hulls \u2014 swifter ships, and a leap of mathematical insight.",
          effects: { science: 38, perks: { navalMovePlus: 1 } }
        }
      ]
    },
    {
      id: "pytheas",
      name: "Pytheas of Massalia",
      title: "Navigator of the Ocean",
      note: "Around 325 BC he sailed past the Pillars of Heracles to Britain and the frozen north, and lived to write of it.",
      when: (c) => c.atSea,
      options: [
        {
          label: "\u{1F9ED} Chart the Northern Ocean",
          outcome: "His star-tables and sea-lore let your captains venture far beyond sight of land before the deep can claim them.",
          effects: { seaReach: 2, science: 24 }
        },
        {
          label: "\u2693 Open the Tin Route",
          outcome: "The long sea-road to the tin isles enriches your merchants for good.",
          effects: { gold: 55, perks: { gold: 2 } }
        }
      ]
    },
    {
      id: "hippocrates",
      name: "Hippocrates of Kos",
      title: "Father of Medicine",
      note: "He taught that disease comes from nature, not the gods \u2014 and swore physicians to do no harm.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1FA7A} Found a School of Medicine",
          outcome: "Field surgeons follow your armies \u2014 the wounded return to the ranks far sooner.",
          effects: { science: 18, heal: true, perks: { healPlus: 2 } }
        },
        {
          label: "\u{1F6B0} Public Sanitation",
          outcome: "Clean water and drained marshes \u2014 your cities grow healthier and fuller.",
          effects: { food: 6, perks: { food: 1 } }
        }
      ]
    },
    {
      id: "thales",
      name: "Thales of Miletus",
      title: "The First Natural Philosopher",
      note: "He sought nature's causes without the gods and, they say, foretold the eclipse of 585 BC.",
      when: (c) => c.age <= 1,
      options: [
        {
          label: "\u{1F313} Reason over Myth",
          outcome: "Inquiry replaces omen \u2014 your thinkers learn to ask how, not merely to whom to pray.",
          effects: { science: 22, perks: { researchCostPct: -8 } }
        },
        {
          label: "\u{1F4D0} Measure by the Shadow",
          outcome: "With gnomon and geometry your surveyors chart the land and gauge the pyramids' height.",
          effects: { science: 14, reveal: true }
        }
      ]
    },
    {
      id: "anaximander",
      name: "Anaximander of Miletus",
      title: "Cartographer of the Cosmos",
      note: "Thales's pupil drew the first map of the whole world, guessed that life rose from the sea, and set Earth unsupported in space.",
      when: (c) => c.age <= 1 || c.cityCount >= 2,
      options: [
        {
          label: "\u{1F5FA}\uFE0F The First Map of the World",
          outcome: "A drawn map of land and sea lays your surroundings bare and spurs your geographers.",
          effects: { reveal: true, science: 18 }
        },
        {
          label: "\u267E\uFE0F The Boundless (Apeiron)",
          outcome: "A bold first principle behind all things sharpens how your philosophers reason.",
          effects: { science: 22, perks: { researchCostPct: -6 } }
        }
      ]
    },
    {
      id: "pythagoras",
      name: "Pythagoras of Samos",
      title: "Mathematician & Mystic",
      note: "His brotherhood held that number is the substance of all things \u2014 and kept the theorem that bears his name.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1F522} The Harmony of Numbers",
          outcome: "Ratio and proportion order music, architecture and the heavens alike \u2014 a lasting spring of learning.",
          effects: { science: 20, perks: { science: 1 } }
        },
        {
          label: "\u{1F53A} The Brotherhood",
          outcome: "A disciplined order of initiates lends your cities a serene, ordered civic life.",
          effects: { science: 16, perks: { stability: 1 } }
        }
      ]
    },
    {
      id: "democritus",
      name: "Democritus of Abdera",
      title: "The Laughing Philosopher",
      note: "He held the world to be atoms and void \u2014 and that cheerfulness, not wealth, is the good life.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u269B\uFE0F The Theory of Atoms",
          outcome: "A daring guess two thousand years ahead of its proof electrifies your natural philosophers.",
          effects: { science: 44 }
        },
        {
          label: "\u{1F604} Cheerfulness (Euthymia)",
          outcome: "A doctrine of contentment settles the people; the fields and homes prosper.",
          effects: { food: 5, perks: { stability: 1 } }
        }
      ]
    },
    {
      id: "eratosthenes",
      name: "Eratosthenes of Cyrene",
      title: "Geographer of Alexandria",
      note: "From two shadows and a walked distance he measured the round Earth's circumference \u2014 and very nearly got it right.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1F30D} Measure the Earth",
          outcome: "His geography and gnomons chart the world about you.",
          effects: { reveal: true, science: 26 }
        },
        {
          label: "\u{1F4DA} The Sieve of Knowledge",
          outcome: "A polymath's method of sifting truth from scrolls compounds your learning for good.",
          effects: { science: 20, perks: { science: 2 } }
        }
      ]
    },
    {
      id: "euclid",
      name: "Euclid of Alexandria",
      title: "Father of Geometry",
      note: "His Elements taught proof from first principles for two thousand years; there is 'no royal road' to it.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1F4D6} The Elements",
          outcome: "A rigorous method of proof streamlines every study your scholars undertake.",
          effects: { science: 20, perks: { researchCostPct: -10 } }
        },
        {
          label: "\u{1F4CF} Tutor the Court",
          outcome: "Your finest minds are schooled in demonstration and measure.",
          effects: { science: 32 }
        }
      ]
    },
    {
      id: "aristarchus",
      name: "Aristarchus of Samos",
      title: "The Ancient Copernican",
      note: "Eighteen centuries before Copernicus he set the Sun at the centre and the Earth in orbit around it.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u2600\uFE0F The Sun-Centred Cosmos",
          outcome: "A heliocentric heresy, centuries ahead of its time, sets your astronomers ablaze with new questions.",
          effects: { science: 42 }
        },
        {
          label: "\u{1F312} Gauge the Sun and Moon",
          outcome: "By geometry he weighs the distances of Sun and Moon \u2014 and maps the sky above your realm.",
          effects: { science: 18, reveal: true }
        }
      ]
    },
    {
      id: "hipparchus",
      name: "Hipparchus of Nicaea",
      title: "Greatest of Astronomers",
      note: "He catalogued a thousand stars, discovered the precession of the equinoxes, and founded trigonometry.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u2728 The Star Catalogue",
          outcome: "A thousand stars fixed by magnitude and place \u2014 an enduring foundation for all who study the sky.",
          effects: { science: 24, perks: { science: 2 } }
        },
        {
          label: "\u{1F4D0} The First Trigonometry",
          outcome: "Chords and tables of angles give your engineers and navigators a powerful new art.",
          effects: { science: 30, perks: { navalMovePlus: 1 } }
        }
      ]
    },
    {
      id: "herophilus",
      name: "Herophilus of Chalcedon",
      title: "Father of Anatomy",
      note: "In Alexandria he was the first to dissect the human body, naming the nerves, the brain's ventricles and the pulse.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1FAC0} The First Anatomy",
          outcome: "True knowledge of the body transforms your physicians \u2014 the sick and wounded are made whole.",
          effects: { science: 24, heal: true }
        },
        {
          label: "\u{1F493} The Art of the Pulse",
          outcome: "He teaches your healers to read the pulse and tend the ranks; the army recovers faster ever after.",
          effects: { science: 14, perks: { healPlus: 2 } }
        }
      ]
    },
    {
      id: "theophrastus",
      name: "Theophrastus of Eresos",
      title: "Father of Botany",
      note: "Aristotle's successor, he classed every plant of the known world and wrote 'On Stones,' the first mineralogy.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u{1FAA8} On Stones",
          outcome: "His survey of ores, gems and earths teaches your prospectors where the land's wealth lies.",
          effects: { production: 18, reveal: true }
        },
        {
          label: "\u{1F33F} Enquiry into Plants",
          outcome: "Careful husbandry of crop and orchard makes your fields yield more, now and for good.",
          effects: { food: 5, perks: { food: 1 } }
        }
      ]
    },
    {
      id: "ctesibius",
      name: "Ctesibius of Alexandria",
      title: "Father of Pneumatics",
      note: "A barber's son who invented the force-pump, the water organ and the repeating catapult.",
      when: (c) => c.age >= 2 || c.atWar,
      options: [
        {
          label: "\u{1F4A5} The Bronze-Spring Catapult",
          outcome: "New engines of war roll out of your workshops \u2014 and your armies hit harder.",
          effects: { production: 18, perks: { atkPct: 5 } }
        },
        {
          label: "\u23F3 The Water Clock",
          outcome: "Precision machines and pumps speed every public work you raise.",
          effects: { science: 16, perks: { buildFasterPct: 8 } }
        }
      ]
    },
    {
      id: "hero",
      name: "Hero of Alexandria",
      title: "Master of Machines",
      note: "He built the first steam engine (the aeolipile), coin-operated automata and self-opening temple doors \u2014 toys, to his age.",
      when: (c) => c.age >= 2,
      options: [
        {
          label: "\u2668\uFE0F The Aeolipile",
          outcome: "Steam and gear-work astonish the court and quicken every workshop and worksite.",
          effects: { production: 20, perks: { buildFasterPct: 8 } }
        },
        {
          label: "\u{1F3AD} Automata & the Odometer",
          outcome: "Self-moving marvels and measuring engines win renown and coin from far and wide.",
          effects: { science: 22, gold: 22 }
        }
      ]
    },
    {
      id: "sostratus",
      name: "Sostratus of Cnidus",
      title: "Architect of the Pharos",
      note: "He raised the Lighthouse of Alexandria, 100 metres of stone whose mirror-flame guided ships for a thousand years.",
      when: (c) => c.coastal,
      options: [
        {
          label: "\u{1F5FC} Raise the Great Lighthouse",
          outcome: "A beacon over the harbour speeds every hull home and marks your coast a haven of trade.",
          effects: { perks: { navalMovePlus: 1, gold: 2 } }
        },
        {
          label: "\u{1F33E} Guide the Grain Fleet",
          outcome: "Safe passage for the grain ships feeds your cities and fattens the customs house.",
          effects: { food: 5, gold: 22 }
        }
      ]
    },
    {
      id: "herodotus",
      name: "Herodotus of Halicarnassus",
      title: "The Father of History",
      note: "He wandered the known world gathering the tales of Greeks and Persians so they 'not be forgotten by time.'",
      when: (c) => c.foundRuins,
      options: [
        {
          label: "\u{1F4DC} Endow the Histories",
          outcome: "Your scholars set down all that has been learned \u2014 a lasting fount of knowledge.",
          effects: { science: 44 }
        },
        {
          label: "\u{1F5FA}\uFE0F Map the Known World",
          outcome: "His inquiries chart the lands about your heartland, and open new avenues of trade.",
          effects: { reveal: true, gold: 24 }
        }
      ]
    },
    {
      id: "sappho",
      name: "Sappho of Lesbos",
      title: "The Tenth Muse",
      note: "Plato called her the Tenth Muse; her lyric poetry of love and longing was sung across the Greek world.",
      when: (c) => !c.atWar,
      options: [
        {
          label: "\u{1F3B6} The Tenth Muse",
          outcome: "Her verses give your people a shared song and refinement \u2014 a quiet, lasting civic pride.",
          effects: { science: 16, perks: { stability: 1 } }
        },
        {
          label: "\u{1F3DB}\uFE0F Songs for the Festival",
          outcome: "Choral festivals draw visitors and their coin, and gladden the whole city.",
          effects: { gold: 24, perks: { stability: 1 } }
        }
      ]
    },
    // ---- Unique to one people: their master builders and craftsmen -----------------
    {
      id: "vitruvius",
      name: "Vitruvius",
      title: "Architect & Engineer",
      civ: "rome",
      note: "The military engineer whose 'Ten Books on Architecture' laid down firmness, commodity and delight for all builders after him.",
      when: (c) => c.cityCount >= 2,
      options: [
        {
          label: "\u{1F4D0} The Ten Books on Architecture",
          outcome: "A canon of sound building spreads to every site \u2014 your works rise faster and stronger.",
          effects: { production: 14, perks: { buildFasterPct: 8 } }
        },
        {
          label: "\u{1F3DB}\uFE0F Firmness, Commodity, Delight",
          outcome: "Dressed stone, true arches and good walls make your cities both handsome and hard to storm.",
          effects: { production: 18, perks: { defPct: 4 } }
        }
      ]
    },
    {
      id: "ictinus",
      name: "Ictinus",
      title: "Architect of the Parthenon",
      civ: "greece",
      note: "With Callicrates he raised the Parthenon, correcting its every line by eye so the marble would look perfectly true.",
      when: (c) => c.cityCount >= 2 || !c.atWar,
      options: [
        {
          label: "\u{1F3DB}\uFE0F Raise the Parthenon",
          outcome: "A temple of flawless marble crowns your city and draws pilgrims and their coin for good.",
          effects: { production: 22, perks: { gold: 2 } }
        },
        {
          label: "\u{1F4CF} The Refinements of the Eye",
          outcome: "Subtle curves that read as perfectly straight teach your builders a mastery that steadies the whole realm.",
          effects: { science: 16, perks: { stability: 1 } }
        }
      ]
    },
    {
      id: "cothon-shipwrights",
      name: "The Shipwrights of the Cothon",
      title: "Masters of the Naval Dockyard",
      civ: "carthage",
      note: "In Carthage's ringed war-harbour, shipwrights built quinqueremes from numbered, prefabricated parts \u2014 a fleet from a production line.",
      when: (c) => c.coastal || c.atSea,
      options: [
        {
          label: "\u{1F527} The Prefabricated Fleet",
          outcome: "Numbered, mass-cut timbers turn out warships at astonishing speed \u2014 your yards hum and your ships range farther.",
          effects: { production: 18, perks: { navalMovePlus: 1 } }
        },
        {
          label: "\u{1F9ED} Chart the Deep Lanes",
          outcome: "Seasoned crews and sturdy hulls push the sea-roads out past the reach of lesser fleets.",
          effects: { seaReach: 2, gold: 22 }
        }
      ]
    },
    {
      id: "imhotep",
      name: "Imhotep",
      title: "Architect & Physician",
      civ: "egypt",
      note: "He raised the first pyramid in dressed stone and was worshipped a thousand years later as a god of healing \u2014 never as a king.",
      when: (c) => c.cityCount >= 2 || c.age >= 2,
      options: [
        {
          label: "\u{1F53A} The Step Pyramid",
          outcome: "The first mountain of dressed stone rises \u2014 a feat of engineering that galvanises your builders.",
          effects: { production: 25 }
        },
        {
          label: "\u2625 Physician of the Two Lands",
          outcome: "His medical papyri tend your soldiers and teach your scholars the body's workings.",
          effects: { science: 18, heal: true }
        }
      ]
    },
    {
      id: "latene-smiths",
      name: "The Smiths of La T\xE8ne",
      title: "Ironmasters of the Celts",
      civ: "gaul",
      note: "The Celtic smiths forged pattern-welded blades and are credited with inventing mail armour \u2014 the finest ironwork of their age.",
      when: (c) => c.atWar || c.cityCount >= 2,
      options: [
        {
          label: "\u{1F517} The Iron Mail",
          outcome: "Ringed iron shirts clothe your warriors \u2014 they hold the line where others would fall.",
          effects: { production: 14, perks: { defPct: 6 } }
        },
        {
          label: "\u2694\uFE0F The Long Blades of La T\xE8ne",
          outcome: "Superb long swords arm your host and command a rich trade in fine iron.",
          effects: { gold: 20, perks: { atkPct: 5 } }
        }
      ]
    },
    {
      id: "meroe-ironmasters",
      name: "The Ironmasters of Mero\xEB",
      title: "Smelters of the Nubian South",
      civ: "kush",
      note: "Mero\xEB's furnaces poured out so much iron that its slag-heaps still ring the city \u2014 the 'Birmingham of ancient Africa.'",
      when: (c) => c.cityCount >= 2 || c.age >= 2,
      options: [
        {
          label: "\u{1F525} The Furnaces of Mero\xEB",
          outcome: "A roaring iron industry arms your soldiers and drives your workshops.",
          effects: { production: 20, perks: { atkPct: 4 } }
        },
        {
          label: "\u{1FA99} The Iron Trade",
          outcome: "Nubian iron and gold flow up the Nile and across the desert, enriching you now and for good.",
          effects: { gold: 24, perks: { gold: 2 } }
        }
      ]
    },
    {
      id: "mona-druids",
      name: "The Druids of Ynys M\xF4n",
      title: "Keepers of Lore & the Heavens",
      civ: "britons",
      note: "On Anglesey the druids kept twenty years of memorised law, verse and star-lore \u2014 the learning of the Britons, held in no book.",
      when: (c) => c.cityCount >= 2 || c.foundRuins,
      options: [
        {
          label: "\u{1F332} The Sacred Grove",
          outcome: "Keepers of law and memory lend your people learning and a deep, settled calm.",
          effects: { science: 18, perks: { stability: 1 } }
        },
        {
          label: "\u{1F319} Readers of the Heavens",
          outcome: "Their reckoning of the seasons by moon and star tells your farmers just when to sow and reap.",
          effects: { food: 5, science: 14 }
        }
      ]
    },
    {
      id: "qanat-masters",
      name: "The Qanat Masters",
      title: "Engineers of the Underground Rivers",
      civ: "parthia",
      note: "Persian engineers cut gently-sloping tunnels for miles to carry mountain water beneath the desert \u2014 an art that made the drylands bloom.",
      when: (c) => c.cityCount >= 2 || c.age >= 2,
      options: [
        {
          label: "\u{1F4A7} The Underground Rivers",
          outcome: "Hidden channels bring cool water to your cities \u2014 they grow greener and fuller for good.",
          effects: { food: 6, perks: { food: 1 } }
        },
        {
          label: "\u{1F3DC}\uFE0F Green the Desert",
          outcome: "Irrigated fields and gardens spread where there was only sand, feeding your works and coffers.",
          effects: { production: 16, gold: 18 }
        }
      ]
    }
  ];
  function getFigure(id) {
    return FIGURES.find((f) => f.id === id);
  }

  // src/districts-data-v2.js
  var DISTRICT_SLOTS_BY_TIER = { 2: 1, 4: 2, 5: 3, 6: 4, 8: 5, 10: 6 };
  var DISTRICT_TYPES = [
    { id: "civic", effect: { cityYield: { stability: 1, gold: 1 } } },
    { id: "market", effect: { cityYield: { gold: 2 }, special: "trade-route-capacity+1" } },
    { id: "affluent", effect: { cityYield: { gold: 2, stability: 1 } } },
    { id: "crammed", effect: { popCapPlus: 2, growthPct: 25, cityYield: { stability: -1 } } },
    { id: "aqueduct", effect: { cityYield: { food: 2 }, popCapPlus: 1, special: "+1food-if-hills-or-river" } },
    { id: "barracks", effect: { trainFasterPct: 25, special: "units-spawn-vet1", cityDefPlus: 1 } },
    { id: "harbour", effect: { cityYield: { gold: 2, food: 1 }, special: "naval-buildable, naval-repair-2x" }, requires: "coast" },
    { id: "leisure", effect: { cityYield: { stability: 2 } } },
    { id: "temple", effect: { cityYield: { science: 1, stability: 1 } } },
    { id: "greatwork", effect: { special: "slot-for-owned-greatwork-card" }, limit: "one-per-city" }
  ];
  var DISTRICT_NAMES = {
    civic: {
      rome: { n: "Forum & Curia", bonus: { gold: 1 } },
      greece: { n: "Agora & Pnyx", bonus: { science: 1 } },
      egypt: { n: "Vizier's Hall" },
      carthage: { n: "Hall of the Hundred" },
      gaul: { n: "Assembly Grove" },
      parthia: { n: "Court of the King's Kin" },
      sparta: { n: "Gerousia" },
      macedon: { n: "Hall of the Argeads" },
      persia: { n: "Satrap's Palace" },
      han: { n: "Yamen", bonus: { stability: 1 } },
      maurya: { n: "Sabha Hall" },
      scythia: { n: "Chieftain's Circle" }
    },
    market: {
      rome: { n: "Macellum" },
      greece: { n: "Emporion" },
      egypt: { n: "River Bazaar" },
      carthage: { n: "Great Emporium", bonus: { special: "trade-route+1" } },
      gaul: { n: "Riverside Fair" },
      parthia: { n: "Caravanserai", bonus: { special: "trade-route-gold+1" } },
      // Silk Road middlemen
      sparta: { n: "Perioikic Market" },
      macedon: { n: "Royal Agora" },
      persia: { n: "Bazaar" },
      han: { n: "Market Ward", bonus: { gold: 1 } },
      // the shi: state-regulated monopoly markets
      maurya: { n: "Pana Market" },
      scythia: { n: "Trading Camp" }
    },
    crammed: {
      rome: { n: "Insulae", bonus: { popCapPlus: 1 } },
      // Rome's tenements rose 5+ storeys
      greece: { n: "Synoikiai" },
      egypt: { n: "Mudbrick Quarter" },
      carthage: { n: "Terraced Quarter" },
      // multi-storey Byrsa housing, excavated
      gaul: { n: "Clan Rows" },
      parthia: { n: "Mudbrick Warrens" },
      sparta: { n: "Village Quarters" },
      // Sparta never urbanised
      macedon: { n: "Workers' Rows" },
      persia: { n: "Lower Town" },
      han: { n: "Courtyard Tenements" },
      maurya: { n: "Timber Tenements", bonus: { popCapPlus: 1 } },
      // Megasthenes: Pataliputra built in timber, vast
      scythia: { n: "Wagon Rows" }
      // a nomad's dense quarter is parked wagons
    },
    affluent: {
      rome: { n: "Domus Quarter" },
      greece: { n: "Hippodamian Quarter", bonus: { stability: 1 } },
      // Hippodamus of Miletus planned Piraeus
      egypt: { n: "Estate Villas" },
      carthage: { n: "Megara Gardens" },
      // Carthage's famed garden suburb (Appian)
      gaul: { n: "Chieftains' Halls" },
      parthia: { n: "Noble Compounds" },
      sparta: { forbidden: true, note: "Lycurgan law forbade luxury \u2014 Sparta cannot build affluent housing." },
      macedon: { n: "Companion Estates" },
      persia: { n: "Paradeisos Estates", bonus: { stability: 1 } },
      han: { n: "Marquis Compounds" },
      maurya: { n: "Setthi Mansions" },
      // merchant-guildmaster houses
      scythia: { n: "Royal Tents" }
    },
    aqueduct: {
      rome: { n: "Aqueduct", bonus: { food: 1 } },
      greece: { n: "Fountain Houses" },
      // the Enneakrounos of Athens
      egypt: { n: "Canal Basin" },
      carthage: { n: "Cisterns of Byrsa" },
      // the giant cistern fields, still visible
      gaul: { n: "Sacred Spring" },
      parthia: { n: "Kariz Channels" },
      // eastern qanat
      sparta: { n: "Eurotas Channels" },
      macedon: { n: "Spring Conduits" },
      persia: { n: "Qanat Works", bonus: { special: "works-on-desert" } },
      han: { n: "Well & Sluice Works" },
      maurya: { n: "Stepwell Tanks" },
      scythia: { n: "Watering Grounds" }
    },
    barracks: {
      rome: { n: "Castra" },
      greece: { n: "Hoplite Grounds" },
      egypt: { n: "Machimoi Camp" },
      carthage: { n: "Mercenary Quarters", bonus: { special: "mercenary-cost-10" } },
      gaul: { n: "Warband Hall" },
      parthia: { n: "Stables of the Clans" },
      sparta: { n: "Agoge Grounds", bonus: { special: "melee-vet2" } },
      macedon: { n: "Sarissa Drill Field" },
      persia: { n: "Quarter of the Immortals" },
      han: { n: "Garrison" },
      maurya: { n: "Elephant Pens", bonus: { special: "elephant-cost-15" } },
      scythia: { n: "Remount Corral", bonus: { special: "mounted-only, mounted-cost-15" } }
    },
    harbour: {
      rome: { n: "Portus" },
      greece: { n: "Deigma Docks" },
      // the Piraeus exchange quay
      egypt: { n: "Nile Quays", bonus: { special: "works-on-major-river" } },
      carthage: { n: "The Cothon", bonus: { special: "naval-cost-20" } },
      gaul: { n: "River Wharves" },
      parthia: { n: "River Landing" },
      sparta: { n: "Gytheion Docks" },
      // Sparta's actual port
      macedon: { n: "Royal Shipsheds", bonus: { special: "naval-cost-10" } },
      persia: { n: "Tribute Docks" },
      han: { n: "Canal Port" },
      maurya: { n: "Ganga Ghats", bonus: { special: "works-on-major-river" } },
      scythia: { n: "Leased Emporion" }
      // Greek trading factories on the Pontic coast (Olbia)
    },
    leisure: {
      rome: { n: "Thermae", bonus: { gold: 1 } },
      greece: { n: "Gymnasion" },
      egypt: { n: "Festival Grounds" },
      // Opet and the great processions
      carthage: { n: "Punic Gardens" },
      gaul: { n: "Feast Hall" },
      parthia: { n: "Hunting Park" },
      // the royal paradeisos hunt
      sparta: { n: "Choral Grounds" },
      // Gymnopaedia: even Spartan leisure was drill
      macedon: { n: "Theatre" },
      persia: { n: "Royal Gardens" },
      han: { n: "Bathhouse & Teahouse" },
      maurya: { n: "Pleasure Gardens" },
      // the Arthashastra budgets them
      scythia: { n: "Feast Grounds" }
    },
    temple: {
      rome: { n: "Capitoline Precinct" },
      greece: { n: "Acropolis Sanctuary" },
      egypt: { n: "Temple Estate", bonus: { gold: 1 } },
      // the god as landlord
      carthage: { n: "Sanctuary of Baal Hammon" },
      gaul: { n: "Nemeton", bonus: { science: 1 } },
      // the druid grove-school
      parthia: { n: "Fire Precinct" },
      sparta: { n: "Temple of the Twins" },
      // the Dioscuri, Sparta's patrons
      macedon: { n: "Sanctuary of Zeus" },
      persia: { n: "Fire Temple" },
      han: { n: "Ancestral Temple" },
      maurya: { n: "Stupa Precinct" },
      scythia: { n: "Sword Sanctuary", bonus: { stability: 1 } }
      // Herodotus: the iron sword altar of "Ares"
    }
  };
  var GREAT_WORKS = [
    // ROME
    {
      id: "gw-colosseum",
      civ: "rome",
      name: "Colosseum",
      rarity: "legendary",
      kind: "built",
      effect: { cityYield: { stability: 3 }, empire: { stability: 1 } },
      note: "Inaugurated AD 80."
    },
    {
      id: "gw-circus",
      civ: "rome",
      name: "Circus Maximus",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { gold: 2, stability: 1 } }
    },
    {
      id: "gw-trajan",
      civ: "rome",
      name: "Trajan's Column",
      rarity: "epic",
      kind: "built",
      effect: { empire: { veterancyRatePct: 25 } },
      note: "AD 113 \u2014 the Dacian wars in a stone spiral."
    },
    {
      id: "gw-pantheon",
      civ: "rome",
      name: "Pantheon of Agrippa",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { science: 1, stability: 2 } },
      note: "Agrippa's original, 27 BC (Hadrian's dome came later)."
    },
    // ATHENS
    {
      id: "gw-parthenon",
      civ: "greece",
      name: "Parthenon",
      rarity: "legendary",
      kind: "built",
      effect: { cityYield: { science: 2, stability: 2 }, special: "prestige-visible-to-all" }
    },
    {
      id: "gw-dionysus",
      civ: "greece",
      name: "Theatre of Dionysus",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 }, special: "event-reward+1" }
    },
    {
      id: "gw-zeus-olympia",
      civ: "greece",
      name: "Statue of Zeus at Olympia",
      rarity: "legendary",
      kind: "built",
      sevenWonders: true,
      effect: { empire: { stability: 1 }, cityYield: { gold: 2 } },
      note: "Phidias' gold-and-ivory colossus \u2014 Athenian hands, Panhellenic glory."
    },
    // EGYPT
    {
      id: "gw-pyramids",
      civ: "egypt",
      name: "Great Pyramid & Sphinx",
      rarity: "legendary",
      kind: "heritage",
      sevenWonders: true,
      effect: { capitalYield: { food: 2, gold: 2, science: 2, labour: 2 } },
      note: "Already two thousand years old in our era \u2014 you restore, not build."
    },
    {
      id: "gw-karnak",
      civ: "egypt",
      name: "Karnak Complex",
      rarity: "epic",
      kind: "built",
      effect: { empire: { special: "temples+1sci+1gold" } }
    },
    {
      id: "gw-philae",
      civ: "egypt",
      name: "Temple of Isis at Philae",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2, science: 1 } },
      note: "Begun under Nectanebo I \u2014 the last native flowering."
    },
    // CARTHAGE
    {
      id: "gw-cothon",
      civ: "carthage",
      name: "Great Cothon",
      rarity: "legendary",
      kind: "built",
      effect: { special: "city-naval-cost-25, naval-repair-3x" }
    },
    {
      id: "gw-eshmun",
      civ: "carthage",
      name: "Temple of Eshmun",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 }, special: "garrison-heal+1" }
    },
    {
      id: "gw-byrsa",
      civ: "carthage",
      name: "Byrsa Citadel",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 1 }, special: "city-def+25" }
    },
    // GAUL
    {
      id: "gw-carnutes",
      civ: "gaul",
      name: "Sanctuary of the Carnutes",
      rarity: "legendary",
      kind: "built",
      effect: { empire: { science: 1 } },
      note: "Caesar: the druids' annual synod, the navel of Gaul."
    },
    {
      id: "gw-oppidum",
      civ: "gaul",
      name: "Great Oppidum Walls",
      rarity: "epic",
      kind: "built",
      effect: { empire: { special: "walls+50hp" } }
    },
    {
      id: "gw-gournay",
      civ: "gaul",
      name: "Sanctuary of Gournay",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 }, special: "plunder+10" },
      note: "The trophy-sanctuary of captured arms, excavated in Picardy."
    },
    // PARTHIA
    {
      id: "gw-nisa",
      civ: "parthia",
      name: "Palace of Nisa",
      rarity: "legendary",
      kind: "built",
      effect: { cityYield: { gold: 2, stability: 1 }, empire: { special: "mounted-cost-10" } }
    },
    {
      id: "gw-adur",
      civ: "parthia",
      name: "Fire Sanctuary of Adur",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 } }
    },
    {
      id: "gw-hatra",
      civ: "parthia",
      name: "Walls of Hatra",
      rarity: "epic",
      kind: "built",
      effect: { special: "city-def+50, enemy-siege-25" },
      note: "Repelled Trajan himself, AD 117."
    },
    // SPARTA
    {
      id: "gw-orthia",
      civ: "sparta",
      name: "Sanctuary of Artemis Orthia",
      rarity: "epic",
      kind: "built",
      effect: { special: "city-melee-spawn-vet1-stacks" }
    },
    {
      id: "gw-menelaion",
      civ: "sparta",
      name: "Menelaion",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 } }
    },
    {
      id: "gw-amyklai",
      civ: "sparta",
      name: "Throne of Apollo at Amyklai",
      rarity: "legendary",
      kind: "built",
      effect: { cityYield: { stability: 2, gold: 1 }, empire: { stability: 1 } },
      note: "The colossal throne-statue, Laconia's one extravagance."
    },
    // MACEDON
    {
      id: "gw-aigai",
      civ: "macedon",
      name: "Palace of Aigai",
      rarity: "legendary",
      kind: "built",
      effect: { empire: { gold: 1 }, special: "companions+10" }
    },
    {
      id: "gw-kings-tomb",
      civ: "macedon",
      name: "Tomb of the Kings",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 }, empire: { veterancyRatePct: 25 } }
    },
    {
      id: "gw-dion",
      civ: "macedon",
      name: "Sanctuary of Dion",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { stability: 2 }, special: "pre-war-blessing:+10atk-first-5-turns-of-war" },
      note: "Where Alexander sacrificed before crossing to Asia."
    },
    // PERSIA
    {
      id: "gw-apadana",
      civ: "persia",
      name: "Apadana of Persepolis",
      rarity: "legendary",
      kind: "built",
      effect: { special: "gold-per-known-civ" }
    },
    {
      id: "gw-behistun",
      civ: "persia",
      name: "Behistun Relief",
      rarity: "epic",
      kind: "heritage",
      effect: { cityYield: { stability: 2 }, special: "see-rival-capitals" }
    },
    {
      id: "gw-pasargadae",
      civ: "persia",
      name: "Tomb of Cyrus",
      rarity: "epic",
      kind: "heritage",
      effect: { empire: { stability: 1 }, special: "captured-cities-convert-1-turn-faster" },
      note: "Alexander wept here and ordered it restored."
    },
    // HAN
    {
      id: "gw-weiyang",
      civ: "han",
      name: "Weiyang Palace",
      rarity: "legendary",
      kind: "built",
      effect: { empire: { science: 1, gold: 1 } },
      note: "The largest palace complex ever built, by footprint."
    },
    {
      id: "gw-greatwall",
      civ: "han",
      name: "Great Wall Segment",
      rarity: "epic",
      kind: "built",
      effect: { special: "border-hex-def+50-this-city" }
    },
    {
      id: "gw-terracotta",
      civ: "han",
      name: "Terracotta Army",
      rarity: "legendary",
      kind: "heritage",
      effect: { empire: { veterancyRatePct: 25 }, cityYield: { stability: 1 } },
      note: "The First Emperor's buried host \u2014 Qin's legacy in Han hands."
    },
    {
      id: "gw-dujiangyan",
      civ: "han",
      name: "Dujiangyan Waterworks",
      rarity: "epic",
      kind: "heritage",
      effect: { special: "river-farms+1food-this-city" },
      note: "256 BC and still irrigating today."
    },
    // MAURYA
    {
      id: "gw-sanchi",
      civ: "maurya",
      name: "Sanchi Great Stupa",
      rarity: "legendary",
      kind: "built",
      effect: { empire: { stability: 2 } }
    },
    {
      id: "gw-ashoka-pillar",
      civ: "maurya",
      name: "Pillar of Ashoka",
      rarity: "epic",
      kind: "heritage",
      effect: { cityYield: { stability: 2, science: 1 } }
    },
    {
      id: "gw-barabar",
      civ: "maurya",
      name: "Barabar Caves",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { science: 1, stability: 1 }, special: "mirror-polish:+1sci-if-temple-district" },
      note: "Rock-cut halls polished like glass, Ashokan grants to the Ajivikas."
    },
    // SCYTHIA
    {
      id: "gw-kurgan",
      civ: "scythia",
      name: "Royal Kurgan",
      rarity: "legendary",
      kind: "built",
      effect: { special: "unit-death-near-refund-25" }
    },
    {
      id: "gw-pectoral",
      civ: "scythia",
      name: "Golden Pectoral Hoard",
      rarity: "epic",
      kind: "heritage",
      effect: { capitalYield: { gold: 3 } }
    },
    {
      id: "gw-gelonus",
      civ: "scythia",
      name: "Gelonus, the Wooden City",
      rarity: "epic",
      kind: "built",
      effect: { cityYield: { gold: 1, science: 1 }, popCapPlus: 2 },
      note: "Herodotus' vast timber town of the Geloni \u2014 the steppe's one metropolis."
    },
    // UNIVERSAL — the wandering wonders (any civ; heritage sits where history put it)
    {
      id: "gw-hanging-gardens",
      civ: null,
      name: "Hanging Gardens of Babylon",
      rarity: "legendary",
      kind: "heritage",
      sevenWonders: true,
      effect: { cityYield: { food: 2, stability: 2 } },
      note: "Nebuchadnezzar's \u2014 if they stood at all; some sources point to Nineveh. The card says so."
    },
    {
      id: "gw-artemis-ephesus",
      civ: null,
      name: "Temple of Artemis at Ephesus",
      rarity: "legendary",
      kind: "heritage",
      sevenWonders: true,
      effect: { cityYield: { gold: 2, stability: 1 }, special: "trade-route-gold+1" },
      note: "Burnt by Herostratus the night Alexander was born; rebuilt greater."
    },
    {
      id: "gw-mausoleum",
      civ: null,
      name: "Mausoleum at Halicarnassus",
      rarity: "epic",
      kind: "heritage",
      sevenWonders: true,
      effect: { cityYield: { stability: 2 }, empire: { veterancyRatePct: 10 } },
      note: "Artemisia II built her husband a tomb that named all tombs after."
    },
    {
      id: "gw-colossus",
      civ: null,
      name: "Colossus of Rhodes",
      rarity: "legendary",
      kind: "heritage",
      sevenWonders: true,
      effect: { special: "harbour-city:+2gold, naval-def+15" },
      note: "Stood 54 years, felled by earthquake 226 BC \u2014 even fallen, a wonder."
    },
    // WAVE 3 CIVS
    {
      id: "gw-second-temple",
      civ: "judea",
      name: "The Second Temple",
      rarity: "legendary",
      kind: "built",
      wave: 3,
      effect: { cityYield: { stability: 3, science: 1 }, empire: { stability: 1 } },
      note: "Solomon's fell in 586 BC, before our age; Zerubbabel rebuilt, Herod made it wonder-class."
    },
    {
      id: "gw-pharos",
      civ: "ptolemies",
      name: "Pharos Lighthouse",
      rarity: "legendary",
      kind: "built",
      sevenWonders: true,
      wave: 3,
      effect: { special: "harbour-city:+3gold, friendly-ships-vision+2" },
      note: "Alexandria's flame, seen fifty kilometres out."
    },
    {
      id: "gw-library",
      civ: "ptolemies",
      name: "Great Library of Alexandria",
      rarity: "legendary",
      kind: "built",
      wave: 3,
      effect: { empire: { science: 2 }, special: "researchCostPct-10" }
    },
    {
      id: "gw-daphne",
      civ: "seleucids",
      name: "Grove of Daphne",
      rarity: "epic",
      kind: "built",
      wave: 3,
      effect: { cityYield: { stability: 2, gold: 1 } }
    },
    {
      id: "gw-pergamon-altar",
      civ: "pergamon",
      name: "Great Altar of Pergamon",
      rarity: "legendary",
      kind: "built",
      wave: 3,
      effect: { cityYield: { stability: 2, science: 1 }, special: "prestige-visible-to-all" },
      note: "The Gigantomachy frieze \u2014 marble as war memorial."
    },
    {
      id: "gw-meroe",
      civ: "kush",
      name: "Pyramids of Mero\xEB",
      rarity: "legendary",
      kind: "built",
      wave: 3,
      effect: { capitalYield: { gold: 2, stability: 2 } },
      note: "Kush built MORE pyramids than Egypt \u2014 steeper, younger, in-era."
    },
    {
      id: "gw-medracen",
      civ: "numidia",
      name: "Mausoleum of Medracen",
      rarity: "epic",
      kind: "heritage",
      wave: 3,
      effect: { cityYield: { stability: 2 } }
    },
    {
      id: "gw-melqart",
      civ: "phoenicia",
      name: "Temple of Melqart at Tyre",
      rarity: "legendary",
      kind: "heritage",
      wave: 3,
      effect: { cityYield: { gold: 2 }, special: "trade-route-gold+1" },
      note: "Herodotus went to see its twin pillars himself."
    },
    {
      id: "gw-kazanlak",
      civ: "thrace",
      name: "Tomb of Kazanlak",
      rarity: "epic",
      kind: "built",
      wave: 3,
      effect: { cityYield: { stability: 2 } }
    },
    {
      id: "gw-sarmizegetusa",
      civ: "dacia",
      name: "Sarmizegetusa Regia",
      rarity: "legendary",
      kind: "built",
      wave: 3,
      effect: { cityYield: { science: 1, stability: 1 }, special: "city-def+25" },
      note: "The sacred mountain capital with its stone calendar sanctuary."
    },
    {
      id: "gw-garni",
      civ: "armenia",
      name: "Temple of Garni",
      rarity: "epic",
      kind: "built",
      wave: 3,
      effect: { cityYield: { stability: 2 } },
      note: "AD 77, and still standing."
    },
    {
      id: "gw-ai-khanoum",
      civ: "bactria",
      name: "Ai-Khanoum",
      rarity: "epic",
      kind: "built",
      wave: 3,
      effect: { cityYield: { science: 2 } },
      note: "A Greek city on the Oxus, Delphic maxims carved at the world's edge."
    },
    {
      id: "gw-tarquinia",
      civ: "etruria",
      name: "Painted Tombs of Tarquinia",
      rarity: "epic",
      kind: "heritage",
      wave: 3,
      effect: { cityYield: { stability: 1, gold: 1 } }
    },
    {
      id: "gw-numantia",
      civ: "celtiberia",
      name: "Walls of Numantia",
      rarity: "epic",
      kind: "built",
      wave: 3,
      effect: { special: "city-def+50-when-besieged" },
      note: "Twenty years defying Rome; chose fire over surrender."
    },
    {
      id: "gw-stonehenge",
      civ: "britannia",
      name: "Stonehenge",
      rarity: "legendary",
      kind: "heritage",
      sevenWonders: false,
      wave: 3,
      effect: { cityYield: { science: 2 }, special: "events-favourable" },
      note: "Millennia old already \u2014 the Britons inherited it as you do."
    }
  ];

  // src/engine/districts.ts
  var CITY_TIER_POP = [1, 3, 6, 10, 15, 21, 28, 36, 45, 55];
  function cityTier(pop) {
    let t = 1;
    for (let i = 0; i < CITY_TIER_POP.length; i += 1) if (pop >= CITY_TIER_POP[i]) t = i + 1;
    return t;
  }
  function districtSlots(city) {
    const tier = cityTier(city.population);
    let slots = 0;
    for (const k of Object.keys(DISTRICT_SLOTS_BY_TIER)) if (tier >= Number(k)) slots = Math.max(slots, DISTRICT_SLOTS_BY_TIER[Number(k)]);
    return slots;
  }
  var DTYPE = {};
  for (const d of DISTRICT_TYPES) DTYPE[d.id] = d;
  function districtType(id) {
    return DTYPE[id];
  }
  function districtName(typeId, civ) {
    const row = DISTRICT_NAMES[typeId];
    return row ? row[String(civ || "").toLowerCase()] : void 0;
  }
  function districtForbidden(typeId, civ) {
    const n = districtName(typeId, civ);
    return !!(n && n.forbidden);
  }
  var GWORK = {};
  for (const g of GREAT_WORKS) GWORK[g.id] = g;
  function greatWork(id) {
    return GWORK[id];
  }
  function greatWorkAllowed(work, civ) {
    return work.civ == null || work.civ === String(civ || "").toLowerCase();
  }

  // src/engine/diplomacy.ts
  var RELATION_MIN = -100;
  var RELATION_MAX = 100;
  function relationBand(rel) {
    if (rel <= -50) return "hostile";
    if (rel <= -10) return "wary";
    if (rel < 10) return "neutral";
    if (rel < 50) return "cordial";
    return "friendly";
  }
  var RELATION_BAND_LABELS = {
    hostile: "Hostile",
    wary: "Wary",
    neutral: "Neutral",
    cordial: "Cordial",
    friendly: "Friendly"
  };
  function pairKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }
  function clampRelation(r) {
    return Math.max(RELATION_MIN, Math.min(RELATION_MAX, r));
  }
  function getPair(state, a, b) {
    return state.diplomacy?.[pairKey(a, b)];
  }
  function getRelation(state, a, b) {
    if (a === b) return RELATION_MAX;
    return getPair(state, a, b)?.relation ?? 0;
  }
  function ensurePair(state, a, b) {
    if (!state.diplomacy) state.diplomacy = {};
    const k = pairKey(a, b);
    let p = state.diplomacy[k];
    if (!p) {
      p = { relation: 0, agreements: [] };
      state.diplomacy[k] = p;
    }
    return p;
  }
  function adjustRelation(state, a, b, delta) {
    if (a === b) return;
    const p = ensurePair(state, a, b);
    p.relation = clampRelation(p.relation + delta);
  }
  function initDiplomacy(state) {
    state.diplomacy = state.diplomacy ?? {};
    const ids = state.players.map((p) => p.id);
    for (let i = 0; i < ids.length; i += 1)
      for (let j = i + 1; j < ids.length; j += 1) ensurePair(state, ids[i], ids[j]);
  }
  var GIFT_RELATION_PER_25 = 1;
  function giftRelationGain(amount, currentRelation) {
    const chunks = Math.floor(amount / 25);
    if (chunks <= 0) return 0;
    const diminish = clamp(1 - Math.max(0, currentRelation) / 100, 0.25, 1);
    return Math.max(1, Math.round(chunks * GIFT_RELATION_PER_25 * diminish));
  }
  var LONG_PEACE_DRIFT = 0.5;
  var PEACE_WARM_CAP = 40;
  var WAR_COOL_DRIFT = 1;
  function applyRelationDrift(state) {
    if (!state.diplomacy) return;
    for (const key of Object.keys(state.diplomacy)) {
      const p = state.diplomacy[key];
      if (p.warSince != null) p.relation = clampRelation(p.relation - WAR_COOL_DRIFT);
      else if (p.relation < PEACE_WARM_CAP) p.relation = Math.min(PEACE_WARM_CAP, p.relation + LONG_PEACE_DRIFT);
    }
  }
  var WAR_DECLARE_RELATION = -30;
  var OATHBREAKER_TURNS = 25;
  var OATHBREAKER_VICTIM_HIT = -40;
  var OATHBREAKER_WORLD_HIT = -15;
  var WAR_WEARINESS_PERIOD = 15;
  var BINDING_PACTS = /* @__PURE__ */ new Set(["nap", "defensive-alliance", "full-alliance"]);
  function isAtWar(state, a, b) {
    if (a === b) return false;
    return getPair(state, a, b)?.warSince != null;
  }
  function hasAgreement(state, a, b, type) {
    const p = getPair(state, a, b);
    if (!p) return false;
    return p.agreements.some((ag) => ag.type === type && (ag.expires === 0 || ag.expires > state.turn));
  }
  function hasNap(state, a, b) {
    const p = getPair(state, a, b);
    return !!p && p.agreements.some((ag) => BINDING_PACTS.has(ag.type) && (ag.expires === 0 || ag.expires > state.turn));
  }
  function isOathbreaker(state, playerId) {
    const p = state.playersById[playerId];
    return !!p && p.oathbreakerUntil != null && p.oathbreakerUntil > state.turn;
  }
  function brandOathbreaker(state, playerId, victimId) {
    const p = state.playersById[playerId];
    if (!p) return;
    p.oathbreakerUntil = state.turn + OATHBREAKER_TURNS;
    for (const other of state.players) {
      if (other.id === playerId) continue;
      adjustRelation(state, playerId, other.id, other.id === victimId ? OATHBREAKER_VICTIM_HIT : OATHBREAKER_WORLD_HIT);
    }
  }
  function enterWar(state, aggressorId, targetId, opts) {
    if (aggressorId === targetId) return false;
    const pair = ensurePair(state, aggressorId, targetId);
    if (pair.warSince != null) return false;
    const pactBreak = !opts?.autoJoin && hasNap(state, aggressorId, targetId) && !isPactRenounced(state, aggressorId, targetId);
    pair.warSince = state.turn;
    pair.agreements = [];
    pair.tribute = null;
    pair.relation = clampRelation(pair.relation + WAR_DECLARE_RELATION);
    if (pactBreak) brandOathbreaker(state, aggressorId, targetId);
    if (!opts?.autoJoin) {
      for (const ally of defensivePartnersOf(state, targetId)) {
        if (ally !== aggressorId) enterWar(state, ally, aggressorId, { autoJoin: true });
      }
    }
    return true;
  }
  function playerWarWeariness(state, playerId) {
    if (!state.diplomacy) return 0;
    let worst = 0;
    for (const key of Object.keys(state.diplomacy)) {
      const [a, b] = key.split("|");
      if (a !== playerId && b !== playerId) continue;
      const p = state.diplomacy[key];
      if (p.warSince == null) continue;
      worst = Math.max(worst, Math.floor((state.turn - p.warSince) / WAR_WEARINESS_PERIOD));
    }
    return worst;
  }
  var NAP_TURNS = 30;
  var TRADE_PACT_GOLD = 1;
  var ACCEPT_RELATION = 5;
  var DECLINE_RELATION = -2;
  var DENOUNCE_RELATION = -10;
  var DENOUNCE_COOLDOWN = 5;
  var TRIBUTE_MIN_TURNS = 10;
  var TRIBUTE_MAX_TURNS = 25;
  var BAND_ORDER = ["hostile", "wary", "neutral", "cordial", "friendly"];
  function bandAtLeast(rel, min) {
    return BAND_ORDER.indexOf(relationBand(rel)) >= BAND_ORDER.indexOf(min);
  }
  var ALLIANCE_HOLD = 15;
  var ALLIANCE_TYPES = /* @__PURE__ */ new Set(["defensive-alliance", "full-alliance"]);
  function agreementBand(type) {
    switch (type) {
      case "nap":
        return "cordial";
      case "passage":
        return "cordial";
      case "defensive-alliance":
        return "friendly";
      case "full-alliance":
        return "friendly";
      default:
        return "neutral";
    }
  }
  function agreementHeldTurns(state, a, b, type) {
    const p = getPair(state, a, b);
    const ag = p?.agreements.find((x) => x.type === type && (x.expires === 0 || x.expires > state.turn));
    return ag ? state.turn - (ag.since ?? state.turn) : -1;
  }
  function agreementPrereqMet(state, a, b, type) {
    if (type === "defensive-alliance") return agreementHeldTurns(state, a, b, "nap") >= ALLIANCE_HOLD;
    if (type === "full-alliance") return agreementHeldTurns(state, a, b, "defensive-alliance") >= ALLIANCE_HOLD;
    return true;
  }
  function alliesOf(state, playerId) {
    const out = [];
    if (!state.diplomacy) return out;
    for (const key of Object.keys(state.diplomacy)) {
      const [a, b] = key.split("|");
      if (a !== playerId && b !== playerId) continue;
      const p = state.diplomacy[key];
      if (p.agreements.some((ag) => ALLIANCE_TYPES.has(ag.type) && (ag.expires === 0 || ag.expires > state.turn))) out.push(a === playerId ? b : a);
    }
    return out;
  }
  function isFullAlly(state, a, b) {
    return hasAgreement(state, a, b, "full-alliance");
  }
  var ALLIANCE_VICTORY_HOLD = 30;
  function fullAlliancesHeld(state, minTurns) {
    const out = [];
    if (!state.diplomacy) return out;
    for (const key of Object.keys(state.diplomacy)) {
      const ag = state.diplomacy[key].agreements.find((x) => x.type === "full-alliance" && (x.expires === 0 || x.expires > state.turn));
      if (ag && state.turn - (ag.since ?? state.turn) >= minTurns) {
        const [a, b] = key.split("|");
        out.push([a, b]);
      }
    }
    return out;
  }
  function isPactRenounced(state, a, b) {
    const p = getPair(state, a, b);
    return !!p && p.denouncedAt != null && state.turn - p.denouncedAt >= DENOUNCE_COOLDOWN;
  }
  function napBlocksDeclaration(state, a, b) {
    return hasNap(state, a, b) && !isPactRenounced(state, a, b);
  }
  function haveMet(state, a, b) {
    if (a === b) return true;
    const c = state.contact;
    if (!c) return false;
    return (c[a] ?? []).includes(b) || (c[b] ?? []).includes(a);
  }
  function canProposeAgreement(state, from, to, type) {
    if (from === to) return "You cannot make a pact with yourself";
    if (!state.playersById[to]) return "Unknown civ";
    if (!haveMet(state, from, to)) return "You have not made contact with them yet \u2014 send a scout to their lands";
    if (isAtWar(state, from, to)) return "Make peace before proposing a pact";
    if (state.playersById[to].pendingProposal) return "They are still weighing another offer";
    if (hasAgreement(state, from, to, type)) return "That pact already stands";
    if ((type === "defensive-alliance" || type === "full-alliance") && (isVassal(state, from) || isVassal(state, to))) return "A vassal follows its overlord's foreign policy";
    if (!bandAtLeast(getRelation(state, from, to), agreementBand(type))) return `Relations are too cold for that (need ${agreementBand(type)})`;
    if (!agreementPrereqMet(state, from, to, type)) {
      return type === "defensive-alliance" ? "A non-aggression pact must stand 15 turns first" : "A defensive alliance must stand 15 turns first";
    }
    return true;
  }
  function addAgreement(state, a, b, type, expires) {
    const p = ensurePair(state, a, b);
    p.agreements = p.agreements.filter((ag) => ag.type !== type);
    p.agreements.push({ type, expires, since: state.turn });
    p.denouncedAt = void 0;
  }
  function denounce(state, from, to) {
    const p = ensurePair(state, from, to);
    p.denouncedAt = state.turn;
    p.relation = clampRelation(p.relation + DENOUNCE_RELATION);
  }
  function expireDiplomacy(state) {
    if (!state.diplomacy) return;
    for (const key of Object.keys(state.diplomacy)) {
      const p = state.diplomacy[key];
      p.agreements = p.agreements.filter((ag) => ag.expires === 0 || ag.expires > state.turn);
      if (p.tribute && p.tribute.expires <= state.turn) p.tribute = null;
    }
  }
  function militaryStrength(state, playerId) {
    let n = 0;
    for (const u of Object.values(state.map.units)) if (u.ownerId === playerId) n += 1;
    for (const c of Object.values(state.map.cities)) if (c.ownerId === playerId) n += 2;
    return n;
  }
  var DEFAULT_PERSONALITY = { eagerTrade: false, coldTrade: false, seeksAlliances: false, demandsVassals: false, submitsWhenLosing: false, buysPeace: false, rejectsPassage: false };
  var PERSONALITIES = {
    rome: { demandsVassals: true },
    // lawful expansionist
    carthage: { eagerTrade: true, buysPeace: true },
    // mercantile, buys peace
    greece: { seeksAlliances: true },
    // Athens the league-builder
    egypt: { submitsWhenLosing: true, buysPeace: true },
    // defensive
    gaul: { buysPeace: true },
    // feud-prone, accepts white peace
    parthia: {},
    // opportunist (attack-side)
    sparta: { coldTrade: true, rejectsPassage: true },
    // isolationist
    macedon: { seeksAlliances: true, demandsVassals: true },
    // hegemonic
    persia: { demandsVassals: true, submitsWhenLosing: true },
    // tributary empire
    han: { buysPeace: true },
    // tributary system
    maurya: { buysPeace: true },
    // dhamma diplomat
    scythia: { buysPeace: true }
    // raider; honours paid peace
  };
  function personalityOf(civ) {
    return { ...DEFAULT_PERSONALITY, ...PERSONALITIES[String(civ || "").toLowerCase()] || {} };
  }
  function aiAcceptsProposal(state, me, from, kind, amount = 0, vassalId) {
    if (me === from) return false;
    if (isOathbreaker(state, from)) return false;
    const rel = getRelation(state, me, from);
    const mine = militaryStrength(state, me), theirs = militaryStrength(state, from) || 1;
    const per = personalityOf(state.playersById[me]?.civ ?? "");
    if (kind === "trade-pact") {
      const floor = per.coldTrade ? "cordial" : per.eagerTrade ? "wary" : "neutral";
      return !isAtWar(state, me, from) && bandAtLeast(rel, floor);
    }
    if (kind === "nap") return !isAtWar(state, me, from) && bandAtLeast(rel, "cordial") && mine <= theirs * 1.8;
    if (kind === "passage") return !per.rejectsPassage && !isAtWar(state, me, from) && bandAtLeast(rel, "cordial");
    if (kind === "defensive-alliance" || kind === "full-alliance") return !isAtWar(state, me, from) && bandAtLeast(rel, per.seeksAlliances ? "cordial" : "friendly");
    if (kind === "vassalage") {
      if (vassalId === me) return theirs >= mine * (per.submitsWhenLosing ? 1.5 : VASSAL_DEMAND_RATIO);
      return true;
    }
    return amount >= 4 && rel >= -40 && mine <= theirs * 1.8;
  }
  var VASSAL_GOLD_SHARE = 0.25;
  var VASSAL_DEMAND_RATIO = 2;
  var REBEL_MIL_FRACTION = 0.5;
  var REBEL_STABILITY = 3;
  function isVassal(state, playerId) {
    return !!state.playersById[playerId]?.vassalOf;
  }
  function vassalsOf(state, overlordId) {
    return state.players.filter((p) => p.vassalOf === overlordId).map((p) => p.id);
  }
  function topOverlord(state, playerId) {
    let cur = playerId, guard = 0;
    while (state.playersById[cur]?.vassalOf && guard++ < 32) cur = state.playersById[cur].vassalOf;
    return cur;
  }
  function defensivePartnersOf(state, playerId) {
    const set3 = new Set(alliesOf(state, playerId));
    const of = state.playersById[playerId]?.vassalOf;
    if (of) set3.add(of);
    for (const v of vassalsOf(state, playerId)) set3.add(v);
    set3.delete(playerId);
    return [...set3];
  }
  function canDemandVassalage(state, overlord, vassal) {
    if (overlord === vassal) return "You cannot vassalise yourself";
    if (!state.playersById[vassal] || !state.playersById[overlord]) return "Unknown civ";
    if (isVassal(state, vassal)) return "They already serve an overlord";
    if (state.playersById[vassal].pendingProposal) return "They are weighing another offer";
    if (militaryStrength(state, overlord) < VASSAL_DEMAND_RATIO * (militaryStrength(state, vassal) || 1)) return "You need a 2:1 military edge to demand submission";
    return true;
  }
  function establishVassalage(state, overlordId, vassalId) {
    const vassal = state.playersById[vassalId];
    if (!vassal || overlordId === vassalId) return;
    vassal.vassalOf = overlordId;
    vassal.overlordMilBaseline = militaryStrength(state, overlordId);
    const pair = ensurePair(state, overlordId, vassalId);
    pair.warSince = void 0;
    pair.tribute = null;
    pair.relation = clampRelation(Math.max(pair.relation, 15));
  }
  function releaseVassal(state, overlordId, vassalId) {
    const vassal = state.playersById[vassalId];
    if (!vassal || vassal.vassalOf !== overlordId) return;
    vassal.vassalOf = void 0;
    vassal.overlordMilBaseline = void 0;
    adjustRelation(state, overlordId, vassalId, ACCEPT_RELATION);
  }
  function shouldRebel(state, vassalId, cityStability) {
    const vassal = state.playersById[vassalId];
    if (!vassal?.vassalOf) return false;
    const overlord = vassal.vassalOf;
    if (vassal.overlordMilBaseline != null && militaryStrength(state, overlord) <= vassal.overlordMilBaseline * REBEL_MIL_FRACTION) return true;
    if (relationBand(getRelation(state, vassalId, overlord)) === "hostile") {
      for (const cid of vassal.cityIds) if (cityStability(cid) >= REBEL_STABILITY) return true;
    }
    return false;
  }
  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  // src/engine/discovery.ts
  var RUINS = [
    { id: "hammurabi", name: "Stele of Hammurabi", region: "Mesopotamia", terrain: "desert", text: "A basalt pillar of 282 laws \u2014 'an eye for an eye' \u2014 carved a thousand years before your grandfathers.", reward: { science: 45 } },
    { id: "ur", name: "Ziggurat of Ur", region: "Mesopotamia", terrain: "plains", text: "A mountain built by hands, stair upon stair toward the moon-god Nanna.", reward: { science: 25, cityProduction: 10 } },
    { id: "ashurbanipal", name: "Library of Ashurbanipal", region: "Nineveh", terrain: "hills", text: "Thirty thousand clay tablets \u2014 the fire that destroyed the palace baked its words immortal.", reward: { science: 60 } },
    { id: "hattusa", name: "Walls of Hattusa", region: "Anatolia", terrain: "hills", text: "The Hittite kings forged black iron here while the world still fought with bronze.", reward: { science: 30, walls: true } },
    { id: "gobekli", name: "G\xF6bekli Tepe", region: "Anatolia", terrain: "highlands", text: "Carved pillars raised by hunters seven thousand years before the pyramids. No one remembers why.", reward: { science: 20 } },
    { id: "knossos", name: "Palace of Knossos", region: "Crete", terrain: "coast", text: "A labyrinth of a thousand rooms; its sea-kings ruled the waves before Greece had a name.", reward: { science: 25, gold: 20 } },
    { id: "mycenae", name: "Lion Gate of Mycenae", region: "Greece", terrain: "hills", text: "Cyclopean stones no mortal should lift; the fortress of Agamemnon's line.", reward: { xp: true } },
    { id: "troy", name: "Mound of Troy", region: "Hellespont", terrain: "plains", text: "Nine cities stacked in one hill of ash and legend.", reward: { gold: 70 } },
    { id: "giza", name: "Pyramids of Giza", region: "Nile", terrain: "desert", text: "Already ancient beyond reckoning; tombs of god-kings whose names outlived their gods.", reward: { cityProduction: 25 } },
    { id: "kerma", name: "Necropolis of Kerma", region: "Nubia", terrain: "desert", text: "Burial mounds of Kush's first kingdom, older than most of Egypt's glories.", reward: { gold: 40 } },
    { id: "nuraghe", name: "Nuraghe Towers", region: "Sardinia", terrain: "hills", text: "Seven thousand stone towers raised by a people who left no words, only walls.", reward: { walls: true } },
    { id: "terramare", name: "Terramare Embankments", region: "Po Valley", terrain: "valley", text: "Banked and ditched farm-towns, abandoned in a single generation none can explain.", reward: { science: 30, cityFood: 10 } },
    { id: "nebra", name: "Nebra Sky Hoard", region: "Germania", terrain: "forest", text: "A bronze disc inlaid with sun, moon, and the Pleiades \u2014 the heavens, cast in metal.", reward: { science: 25, reveal: true } },
    { id: "hallstatt", name: "Hallstatt Salt Galleries", region: "Alps", terrain: "mountains", text: "Miners' picks and fur caps preserved in salt; the white gold that made the first Celtic princes rich.", reward: { goldPerTurn: 2 } },
    { id: "stonehenge", name: "Stonehenge", region: "Britain", terrain: "plains", text: "Rings of standing stones aligned to midsummer's first light.", reward: { science: 20, reveal: true } },
    { id: "tartessos", name: "Silver Hoards of Tartessos", region: "Iberia", terrain: "hills", text: "A kingdom the Greeks called rich beyond measure \u2014 vanished, its river-mouth city never found.", reward: { gold: 90 } }
  ];
  var RUIN_BY_ID = {};
  for (const r of RUINS) RUIN_BY_ID[r.id] = r;
  var VET_NEXT = { recruit: "veteran", veteran: "elite", elite: "elite" };
  function excavateRuins(state, playerId) {
    if (!state.map.ruins) return;
    const player = state.playersById[playerId];
    if (!player) return;
    for (const unitId of player.unitIds) {
      const unit = state.map.units[unitId];
      if (!unit) continue;
      const key = `${unit.position.q},${unit.position.r}`;
      const site = state.map.ruins[key];
      if (!site || site.excavated) continue;
      const ruin = RUIN_BY_ID[site.ruinId];
      if (!ruin) continue;
      const explorer = unit.type === "explorer";
      applyRuinReward(state, playerId, ruin.reward, explorer ? 1 : 0.5, parseKey(key));
      site.excavated = true;
      site.by = playerId;
      site.full = explorer;
      if (explorer) {
        player.codex = player.codex ?? [];
        if (!player.codex.includes(ruin.id)) player.codex.push(ruin.id);
      }
    }
  }
  function applyRuinReward(state, playerId, reward, factor, at) {
    const player = state.playersById[playerId];
    const scale = (n) => Math.round(n * factor);
    if (reward.gold) player.gold += scale(reward.gold);
    if (reward.science) player.science += scale(reward.science);
    if (reward.goldPerTurn) {
      player.perks = player.perks ?? {};
      player.perks.gold = (player.perks.gold ?? 0) + scale(reward.goldPerTurn);
    }
    if (reward.xp) {
      for (const uid of player.unitIds) {
        const u = state.map.units[uid];
        if (u) u.veterancy = VET_NEXT[u.veterancy ?? "recruit"] ?? "veteran";
      }
    }
    if (reward.reveal) {
      state.discovered = state.discovered ?? {};
      const seen = new Set(state.discovered[playerId] ?? []);
      seen.add(`${at.q},${at.r}`);
      for (const n of neighborsOf(at)) for (const nn of neighborsOf(n)) if (state.map.tiles[`${nn.q},${nn.r}`]) seen.add(`${nn.q},${nn.r}`);
      state.discovered[playerId] = [...seen];
    }
    const city = reward.cityProduction || reward.cityFood || reward.walls ? nearestCity(state, playerId, at) : null;
    if (city) {
      if (reward.cityProduction) city.production = (city.production ?? 0) + scale(reward.cityProduction);
      if (reward.cityFood) city.food = (city.food ?? 0) + scale(reward.cityFood);
      if (reward.walls && !(city.buildings ?? []).includes("walls")) {
        city.buildings = city.buildings ?? [];
        city.buildings.push("walls");
      }
    }
  }
  function nearestCity(state, playerId, at) {
    let best = null, bestD = Infinity;
    for (const cid of state.playersById[playerId]?.cityIds ?? []) {
      const c = state.map.cities[cid];
      if (!c) continue;
      const d = Math.abs(c.position.q - at.q) + Math.abs(c.position.r - at.r);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }

  // src/engine/mapgen.ts
  function hash01(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) / 4294967296;
  }
  function sprinkleResources(tiles, seed) {
    const byTerrain = {};
    for (const [id, rule] of Object.entries(RESOURCES)) {
      for (const t of rule.terrains) (byTerrain[t] ||= []).push(id);
    }
    for (const key of Object.keys(tiles)) {
      const tile = tiles[key];
      if (tile.resource || !tile.terrain) continue;
      const opts = byTerrain[tile.terrain];
      if (!opts || !opts.length) continue;
      if (hash01(seed + ":res:" + key) > 0.13) continue;
      const pick = hash01(seed + ":pick:" + key);
      tile.resource = opts[Math.min(opts.length - 1, Math.floor(pick * opts.length))];
    }
  }
  function scatterRuins(map, seed) {
    const out = {};
    const land = Object.keys(map.tiles).filter((k) => {
      const t = map.tiles[k].terrain;
      return t && t !== "sea" && t !== "coast";
    });
    if (!land.length) return out;
    const used = new Set(Object.values(map.cities).map((c) => `${c.position.q},${c.position.r}`));
    const cap2 = Math.max(3, Math.ceil(RUINS.length * 0.6));
    const nRuins = Math.max(3, Math.min(cap2, Math.round(land.length / 55)));
    const pool = [...RUINS].sort((a, b) => hash01(seed + ":ruinord:" + a.id) - hash01(seed + ":ruinord:" + b.id));
    let placed = 0;
    for (const ruin of pool) {
      if (placed >= nRuins) break;
      const fit = land.filter((k) => !used.has(k) && (ruin.terrain === "any" || map.tiles[k].terrain === ruin.terrain));
      const list = fit.length ? fit : land.filter((k) => !used.has(k));
      if (!list.length) continue;
      const key = list.sort((a, b) => hash01(seed + ":ruinpos:" + ruin.id + ":" + a) - hash01(seed + ":ruinpos:" + ruin.id + ":" + b))[0];
      out[key] = { ruinId: ruin.id };
      used.add(key);
      placed += 1;
    }
    return out;
  }
  var MAP_SIZES = {
    small: { width: 20, height: 17, bands: 2, rivers: 3, label: "Small" },
    medium: { width: 28, height: 24, bands: 3, rivers: 4, label: "Medium" },
    large: { width: 36, height: 32, bands: 3, rivers: 7, label: "Large" },
    xl: { width: 45, height: 40, bands: 4, rivers: 8, label: "XL" },
    huge: { width: 64, height: 51, bands: 5, rivers: 12, label: "Huge" },
    xxl: { width: 85, height: 68, bands: 6, rivers: 16, label: "XXL (ludicrous)" },
    xxxl: { width: 113, height: 90, bands: 7, rivers: 21, label: "XXXL (colossal)" }
  };
  function offsetToAxial(col, row) {
    return { q: col - (row - (row & 1) >> 1), r: row };
  }
  var CIV_ROSTER = [
    { id: "rome", civ: "Rome", color: "#c0392b", adjective: "Roman", capital: "Roma" },
    { id: "carthage", civ: "Carthage", color: "#8e44ad", adjective: "Carthaginian", capital: "Carthago" },
    { id: "greece", civ: "Athens", color: "#2e86de", adjective: "Athenian", capital: "Athenai" },
    { id: "egypt", civ: "Egypt", color: "#d4ac0d", adjective: "Egyptian", capital: "Memphis" },
    { id: "gaul", civ: "Gaul", color: "#27ae60", adjective: "Gallic", capital: "Bibracte" },
    { id: "parthia", civ: "Parthia", color: "#e67e22", adjective: "Parthian", capital: "Ktesiphon" },
    { id: "britons", civ: "Britons", color: "#16a085", adjective: "British", capital: "Camulodunon" },
    { id: "kush", civ: "Kush", color: "#935116", adjective: "Kushite", capital: "Mero\xEB" }
  ];
  var MAX_PLAYERS = CIV_ROSTER.length;
  var DEFAULT_PLAYERS = {
    small: 2,
    medium: 3,
    large: 4,
    xl: 5,
    huge: 6,
    xxl: 7,
    xxxl: 8
  };
  var WALKABLE = /* @__PURE__ */ new Set([
    "plains",
    "valley",
    "forest",
    "hills",
    "desert"
  ]);
  var CAPITAL_TERRAIN = /* @__PURE__ */ new Set(["plains", "valley", "hills"]);
  function smooth(t) {
    return t * t * (3 - 2 * t);
  }
  function lattice(seed, salt, x, y) {
    return seededRandom(seed, `${salt}:${x}:${y}`)();
  }
  function valueNoise(seed, salt, x, y, cell) {
    const gx = x / cell;
    const gy = y / cell;
    const x0 = Math.floor(gx);
    const y0 = Math.floor(gy);
    const fx = gx - x0;
    const fy = gy - y0;
    const v00 = lattice(seed, salt, x0, y0);
    const v10 = lattice(seed, salt, x0 + 1, y0);
    const v01 = lattice(seed, salt, x0, y0 + 1);
    const v11 = lattice(seed, salt, x0 + 1, y0 + 1);
    const sx = smooth(fx);
    const sy = smooth(fy);
    const top = v00 + (v10 - v00) * sx;
    const bottom = v01 + (v11 - v01) * sx;
    return top + (bottom - top) * sy;
  }
  function fbm(seed, salt, x, y) {
    return 0.55 * valueNoise(seed, salt, x, y, 5.5) + 0.3 * valueNoise(seed, salt, x, y, 2.7) + 0.15 * valueNoise(seed, salt, x, y, 1.4);
  }
  function terrainFor(elev, moist) {
    if (elev < 0.3) return "sea";
    if (elev < 0.38) return "coast";
    if (elev > 0.86) return "mountains";
    if (elev > 0.77) return "highlands";
    if (elev > 0.62) return "hills";
    if (moist < 0.3) return "desert";
    if (moist > 0.68 && elev < 0.52) return "valley";
    if (moist > 0.52) return "forest";
    return "plains";
  }
  function bandName(r, height, bands) {
    const idx = Math.min(bands - 1, Math.floor(r / height * bands));
    if (bands <= 2) return idx === 0 ? "north" : "south";
    return ["north", "central", "south"][idx];
  }
  function buildTerrain(seed, spec) {
    const cols = spec.width;
    const rows2 = spec.height;
    const bands = spec.bands;
    const tiles = {};
    const elevation = {};
    const regionSet = /* @__PURE__ */ new Set();
    for (let row = 0; row < rows2; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        let elev = fbm(seed, "elev", col, row) + 0.06;
        elev = 0.5 + (elev - 0.5) * 1.35;
        const nx = cols <= 1 ? 0 : col / (cols - 1) * 2 - 1;
        const ny = rows2 <= 1 ? 0 : row / (rows2 - 1) * 2 - 1;
        const edge = Math.max(Math.abs(nx), Math.abs(ny));
        elev -= 0.55 * Math.pow(edge, 3);
        const moist = fbm(seed, "moist", col, row) - 0.22 * (rows2 <= 1 ? 0 : row / (rows2 - 1));
        const region = bandName(row, rows2, bands);
        regionSet.add(region);
        const key = keyOf(offsetToAxial(col, row));
        tiles[key] = { terrain: terrainFor(elev, moist), region };
        elevation[key] = elev;
      }
    }
    const order = ["north", "central", "south"];
    const regions = order.filter((name) => regionSet.has(name));
    return { tiles, regions, elevation };
  }
  var GREAT_RIVER_FLOW = 7;
  function carveRivers(tiles, elevation, spec, count, greatRivers = false) {
    const rivers = {};
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const committedPaths = [];
    const sources = Object.keys(tiles).filter((k) => WALKABLE.has(tiles[k].terrain)).sort((a, b) => elevation[b] - elevation[a]);
    const chosen = [];
    for (const key of sources) {
      if (chosen.length >= count) break;
      const c = parseKey(key);
      if (chosen.every((ck) => distance(parseKey(ck), c) >= 3)) chosen.push(key);
    }
    for (const source of chosen) {
      let currentKey = source;
      const visited = /* @__PURE__ */ new Set([currentKey]);
      const maxSteps = spec.width + spec.height;
      const segments = [];
      const pathTiles = [currentKey];
      let reachedSea = false;
      for (let step = 0; step < maxSteps; step += 1) {
        const current = parseKey(currentKey);
        let bestKey = null;
        let bestElev = Infinity;
        for (const n of neighborsOf(current)) {
          if (!inBounds(n)) continue;
          const nk = keyOf(n);
          if (visited.has(nk)) continue;
          if (elevation[nk] < bestElev) {
            bestElev = elevation[nk];
            bestKey = nk;
          }
        }
        if (!bestKey) break;
        segments.push(edgeKey(current, parseKey(bestKey)));
        visited.add(bestKey);
        currentKey = bestKey;
        const t = tiles[bestKey].terrain;
        if (t === "sea" || t === "coast") {
          reachedSea = true;
          break;
        }
        pathTiles.push(bestKey);
      }
      if (reachedSea) {
        for (const e of segments) rivers[e] = true;
        committedPaths.push(pathTiles);
      }
    }
    if (greatRivers) {
      const flowAt = {};
      for (const path of committedPaths) {
        let flow = 0;
        for (const tk of path) {
          flow += 1 + (flowAt[tk] || 0);
          if (flow > (flowAt[tk] || 0)) flowAt[tk] = flow;
        }
      }
      for (const tk of Object.keys(flowAt)) {
        if (flowAt[tk] >= GREAT_RIVER_FLOW && WALKABLE.has(tiles[tk].terrain)) tiles[tk].terrain = "great-river";
      }
    }
    return rivers;
  }
  function largestWalkableComponent(tiles, spec) {
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const isWalkable = (key) => tiles[key] && WALKABLE.has(tiles[key].terrain);
    const seen = /* @__PURE__ */ new Set();
    let best = [];
    for (const startKey of Object.keys(tiles)) {
      if (seen.has(startKey) || !isWalkable(startKey)) continue;
      const component = [];
      const queue = [startKey];
      seen.add(startKey);
      while (queue.length > 0) {
        const key = queue.pop();
        component.push(key);
        for (const n of neighborsOf(parseKey(key))) {
          if (!inBounds(n)) continue;
          const nk = keyOf(n);
          if (!seen.has(nk) && isWalkable(nk)) {
            seen.add(nk);
            queue.push(nk);
          }
        }
      }
      if (component.length > best.length) best = component;
    }
    return best;
  }
  function farthestPair(keys) {
    if (keys.length < 2) return null;
    let best = null;
    let bestDist = -1;
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        const d = distance(parseKey(keys[i]), parseKey(keys[j]));
        if (d > bestDist) {
          bestDist = d;
          best = [keys[i], keys[j]];
        }
      }
    }
    return best;
  }
  function pickDispersed(pool, n) {
    const pair = farthestPair(pool);
    if (!pair) return pool.slice(0, n);
    const chosen = [pair[0], pair[1]];
    while (chosen.length < n) {
      let best = null;
      let bestMin = -1;
      for (const k of pool) {
        if (chosen.includes(k)) continue;
        let nearest = Infinity;
        for (const c of chosen) nearest = Math.min(nearest, distance(parseKey(k), parseKey(c)));
        if (nearest > bestMin) {
          bestMin = nearest;
          best = k;
        }
      }
      if (!best) break;
      chosen.push(best);
    }
    return chosen.slice(0, n);
  }
  function placeStarters(capitalKey, tiles, spec, taken) {
    const cap2 = parseKey(capitalKey);
    const inBounds = (c) => tiles[keyOf(c)] !== void 0;
    const free = neighborsOf(cap2).filter(
      (c) => inBounds(c) && tiles[keyOf(c)] && WALKABLE.has(tiles[keyOf(c)].terrain) && !taken.has(keyOf(c))
    );
    const warrior = free[0] ?? cap2;
    taken.add(keyOf(warrior));
    const explorer = free.find((c) => keyOf(c) !== keyOf(warrior)) ?? cap2;
    taken.add(keyOf(explorer));
    return { warrior, explorer };
  }
  function tryGenerate(seed, spec, playerCount, roster = CIV_ROSTER, greatRivers = false) {
    const { tiles, regions, elevation } = buildTerrain(seed, spec);
    const component = largestWalkableComponent(tiles, spec);
    const minComponent = Math.max(8, playerCount * 3, Math.floor(spec.width * spec.height * 0.15));
    if (component.length < minComponent) return null;
    const preferred = component.filter((k) => CAPITAL_TERRAIN.has(tiles[k].terrain));
    const pool = preferred.length >= playerCount ? preferred : component;
    if (pool.length < playerCount) return null;
    const capitalKeys = pickDispersed(pool, playerCount);
    if (capitalKeys.length < playerCount) return null;
    const minSeparation = Math.max(3, Math.floor((spec.width + spec.height) / (playerCount + 2)));
    let closest = Infinity;
    for (let i = 0; i < capitalKeys.length; i += 1) {
      for (let j = i + 1; j < capitalKeys.length; j += 1) {
        closest = Math.min(closest, distance(parseKey(capitalKeys[i]), parseKey(capitalKeys[j])));
      }
    }
    if (closest < minSeparation) return null;
    const taken = new Set(capitalKeys);
    const players = [];
    const cities = {};
    const units = {};
    for (let i = 0; i < playerCount; i += 1) {
      const { id, civ } = roster[i];
      const capitalKey = capitalKeys[i];
      const position = parseKey(capitalKey);
      players.push({ id, civ, food: 8, production: 30, gold: 20 });
      cities[`${id}_capital`] = {
        id: `${id}_capital`,
        ownerId: id,
        position,
        population: 2,
        hp: 40,
        maxHp: 40,
        isCapital: true
      };
      const start = placeStarters(capitalKey, tiles, spec, taken);
      units[`${id}_warrior`] = { id: `${id}_warrior`, type: "warrior", ownerId: id, position: start.warrior };
      units[`${id}_explorer`] = { id: `${id}_explorer`, type: "explorer", ownerId: id, position: start.explorer };
    }
    const rivers = carveRivers(tiles, elevation, spec, spec.rivers, greatRivers);
    sprinkleResources(tiles, seed);
    return {
      seed,
      players,
      map: { width: spec.width, height: spec.height, regions, rivers, tiles, cities, units }
    };
  }
  function generateMap(options = {}) {
    const size = options.size ?? "medium";
    const spec = MAP_SIZES[size];
    if (!spec) throw new Error(`Unknown map size ${size}`);
    const baseSeed = options.seed ?? "hegemon-map";
    const requested = Math.max(2, Math.min(MAX_PLAYERS, Math.floor(options.playerCount ?? 2)));
    const turnLimit = TURN_LIMITS[size] ?? 60;
    const greatRivers = options.greatRivers === true;
    const roster = options.civOrder ? options.civOrder.map((id) => CIV_ROSTER.find((c) => c.id === id)).filter((c) => Boolean(c)) : orderRoster(options.humanCiv);
    for (let playerCount = requested; playerCount >= 2; playerCount -= 1) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const seed = attempt === 0 ? baseSeed : `${baseSeed}#${attempt}`;
        const config = tryGenerate(seed, spec, playerCount, roster, greatRivers);
        if (config) {
          config.turnLimit = turnLimit;
          return config;
        }
      }
    }
    const fallback = tryGenerate(`${baseSeed}#fallback`, spec, 2, roster) ?? buildFlatFallback(spec, baseSeed);
    fallback.turnLimit = turnLimit;
    return fallback;
  }
  function orderRoster(humanCiv) {
    if (!humanCiv) return CIV_ROSTER;
    const chosen = CIV_ROSTER.find((c) => c.id === humanCiv);
    if (!chosen) return CIV_ROSTER;
    return [chosen, ...CIV_ROSTER.filter((c) => c.id !== humanCiv)];
  }
  var TURN_LIMITS = {
    small: 40,
    medium: 60,
    large: 80,
    xl: 100,
    huge: 140,
    xxl: 180,
    xxxl: 220
  };
  function buildFlatFallback(spec, seed) {
    const tiles = {};
    for (let row = 0; row < spec.height; row += 1) {
      for (let col = 0; col < spec.width; col += 1) {
        tiles[keyOf(offsetToAxial(col, row))] = { terrain: "plains", region: bandName(row, spec.height, spec.bands) };
      }
    }
    const midRow = Math.floor(spec.height / 2);
    const romePos = offsetToAxial(1, midRow);
    const carthagePos = offsetToAxial(spec.width - 2, midRow);
    const romeExplorer = offsetToAxial(1, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
    const carthageExplorer = offsetToAxial(spec.width - 2, midRow - 1 >= 0 ? midRow - 1 : midRow + 1);
    return {
      seed,
      players: [
        { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20 },
        { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20 }
      ],
      map: {
        width: spec.width,
        height: spec.height,
        regions: Array.from(new Set(Object.values(tiles).map((t) => t.region))),
        rivers: {},
        tiles,
        cities: {
          rome_capital: { id: "rome_capital", ownerId: "rome", position: romePos, population: 2, hp: 40, maxHp: 40, isCapital: true },
          carthage_capital: { id: "carthage_capital", ownerId: "carthage", position: carthagePos, population: 2, hp: 40, maxHp: 40, isCapital: true }
        },
        units: {
          r_warrior: { id: "r_warrior", type: "warrior", ownerId: "rome", position: offsetToAxial(2, midRow) },
          r_explorer: { id: "r_explorer", type: "explorer", ownerId: "rome", position: romeExplorer },
          c_warrior: { id: "c_warrior", type: "warrior", ownerId: "carthage", position: offsetToAxial(spec.width - 3, midRow) },
          c_explorer: { id: "c_explorer", type: "explorer", ownerId: "carthage", position: carthageExplorer }
        }
      }
    };
  }

  // src/engine/peoples.ts
  var DISPOSITIONS = ["hostile", "wary", "open"];
  var MINOR_PEOPLES = [
    { id: "latins", name: "Latins", text: "Kin-cities of Alba Longa, bound by league, festival, and shared blood.", terrain: "plains", benefit: { pop: 2, science: 10 } },
    { id: "samnites", name: "Samnites", text: "A warrior confederation of the mountains; their Linen Legion swears death before retreat.", terrain: "hills", hostile: true, benefit: { recruit: "swordsman" } },
    { id: "etruscans", name: "Etruscans", text: "The Rasenna: engineers, augurs, lords of twelve cities who taught Rome to build.", terrain: "hills", benefit: { science: 35, knowledge: true } },
    { id: "veneti", name: "Veneti", text: "Horse-breeders at the amber road's end, open-handed to traders.", terrain: "plains", benefit: { recruit: "horseman", gold: 15 } },
    { id: "lydians", name: "Lydians", text: "Inventors of struck coin, wealthy beyond proverb.", terrain: "hills", benefit: { gold: 50, science: 15, knowledge: true } },
    { id: "thracians", name: "Thracians", text: "Wild horsemen and peltasts who drink from golden rhyta.", terrain: "highlands", benefit: { recruit: "archer" } },
    { id: "getae", name: "Getae (Dacians)", text: "A mountain kingdom rich in gold, whose men believe they do not die.", terrain: "mountains", benefit: { goldPerTurn: 2 } },
    { id: "illyrians", name: "Illyrians", text: "Coast-dwellers in swift light ships \u2014 half traders, half pirates.", terrain: "coast", hostile: true, benefit: { recruit: "trireme" } },
    { id: "armenians", name: "Armenians", text: "Highlanders among fortress crags, heirs of Urartu's citadels.", terrain: "mountains", benefit: { walls: true, knowledge: true } },
    { id: "numidians", name: "Numidians", text: "Riders without bridle or bit \u2014 the finest light horse alive.", terrain: "desert", benefit: { recruit: "horseman" } },
    { id: "nabataeans", name: "Nabataeans", text: "Caravan-masters of a rose-red city, wizards of hidden water.", terrain: "desert", benefit: { science: 20, goldPerTurn: 1, knowledge: true } },
    { id: "judeans", name: "Judeans", text: "A hill people bound by covenant to one God alone.", terrain: "hills", benefit: { science: 25, knowledge: true } },
    { id: "chaldeans", name: "Chaldeans", text: "Star-readers of Babylon who mapped the heavens onto clay.", terrain: "desert", benefit: { science: 40, knowledge: true } },
    { id: "belgae", name: "Belgae", text: "'Of all the Gauls, the bravest' \u2014 so wrote the man who conquered them.", terrain: "forest", hostile: true, benefit: { recruit: "swordsman" } }
  ];
  var PEOPLE_BY_ID = {};
  for (const p of MINOR_PEOPLES) PEOPLE_BY_ID[p.id] = p;
  var BEFRIEND_COST = 30;
  var TRIBUTE_GAIN = 15;
  var CONQUEST_REPUTATION_HIT = -8;
  var THREATEN_RAID_GOLD = 12;
  var REACTION_BASE = { open: 0.85, wary: 0.6, hostile: 0.3 };
  var DEED_PUSH = {
    befriend: 0,
    // a friendly overture
    tribute: -0.18,
    // a demand — likelier to offend
    assimilate: 0.05
    // they already trust you (you befriended them first)
  };
  var RARITY_MAG = { common: 0.03, rare: 0.06, epic: 0.09, legendary: 0.12 };
  function leaderReactionBonus(leader, deed) {
    if (!leader) return 0;
    const mag = RARITY_MAG[leader.rarity] ?? 0.05;
    if (leader.role === "statesman") return deed === "tribute" ? mag * 0.3 : mag;
    if (leader.role === "commander") return deed === "tribute" ? mag : mag * 0.3;
    return mag * 0.6;
  }
  var EXPLORER_ENVOY_BONUS = 0.15;
  var BEFRIEND_COST_ENVOY = 10;
  function explorerNear(state, playerId, key) {
    const at = parseKey(key);
    const ring = /* @__PURE__ */ new Set([key, ...neighborsOf(at).map((n) => `${n.q},${n.r}`)]);
    for (const uid of state.playersById[playerId]?.unitIds ?? []) {
      const u = state.map.units[uid];
      if (u && u.type === "explorer" && ring.has(`${u.position.q},${u.position.r}`)) return true;
    }
    return false;
  }
  function befriendCostFor(state, playerId, key) {
    return explorerNear(state, playerId, key) ? BEFRIEND_COST_ENVOY : BEFRIEND_COST;
  }
  function villageReactionChance(people, disposition, deed, bonus) {
    let chance = (REACTION_BASE[disposition] ?? 0.5) + (DEED_PUSH[deed] ?? 0) + bonus;
    if (people.hostile) chance -= 0.05;
    return Math.max(0.05, Math.min(0.95, chance));
  }
  function rollReaction(people, disposition, deed, bonus, seed, key, attempt) {
    const chance = villageReactionChance(people, disposition, deed, bonus);
    const roll = hash01(seed + ":react:" + deed + ":" + key + ":" + attempt);
    return { comply: roll < chance, chance, roll };
  }
  function souredDisposition(d) {
    return DISPOSITIONS[Math.max(0, DISPOSITIONS.indexOf(d) - 1)];
  }
  function pillageOnThreaten(state, playerId, amount) {
    const player = state.playersById[playerId];
    if (!player) return 0;
    const loss = Math.min(amount, Math.max(0, Math.floor(player.gold)));
    if (loss > 0) player.gold -= loss;
    return loss;
  }
  function villageDisposition(people, seed, key) {
    const r = hash01(seed + ":disp:" + key);
    if (people.hostile) return r < 0.5 ? "hostile" : r < 0.85 ? "wary" : "open";
    return r < 0.2 ? "hostile" : r < 0.5 ? "wary" : "open";
  }
  function scatterVillages(map, seed, avoid) {
    const out = {};
    const land = Object.keys(map.tiles).filter((k) => WALKABLE.has(map.tiles[k].terrain));
    if (!land.length) return out;
    const used = /* @__PURE__ */ new Set([...avoid, ...Object.values(map.cities).map((c) => `${c.position.q},${c.position.r}`)]);
    const cap2 = Math.max(4, Math.ceil(MINOR_PEOPLES.length * 0.6));
    const n = Math.max(4, Math.min(cap2, Math.round(land.length / 45)));
    const pool = [...MINOR_PEOPLES].sort((a, b) => hash01(seed + ":vord:" + a.id) - hash01(seed + ":vord:" + b.id));
    let placed = 0;
    for (const people of pool) {
      if (placed >= n) break;
      const includeCoast = people.terrain === "coast";
      const scope = includeCoast ? Object.keys(map.tiles).filter((k) => map.tiles[k].terrain === "coast") : land;
      const fit = scope.filter((k) => !used.has(k) && (people.terrain === "any" || map.tiles[k].terrain === people.terrain));
      const list = fit.length ? fit : land.filter((k) => !used.has(k));
      if (!list.length) continue;
      const key = list.sort((a, b) => hash01(seed + ":vpos:" + people.id + ":" + a) - hash01(seed + ":vpos:" + people.id + ":" + b))[0];
      out[key] = { peopleId: people.id, disposition: villageDisposition(people, seed, key) };
      used.add(key);
      placed += 1;
    }
    return out;
  }
  function unitNear(state, playerId, key, militaryOnly = false) {
    const at = parseKey(key);
    const ring = /* @__PURE__ */ new Set([key, ...neighborsOf(at).map((n) => `${n.q},${n.r}`)]);
    for (const uid of state.playersById[playerId]?.unitIds ?? []) {
      const u = state.map.units[uid];
      if (!u) continue;
      if (militaryOnly && (UNITS[u.type]?.attack ?? 0) <= 0) continue;
      if (ring.has(`${u.position.q},${u.position.r}`)) return true;
    }
    return false;
  }
  function applyVillageBenefit(state, playerId, benefit, at, byForce) {
    const player = state.playersById[playerId];
    if (!player) return;
    if (benefit.science && !byForce) player.science += benefit.science;
    if (benefit.gold) player.gold += benefit.gold;
    if (benefit.goldPerTurn) {
      player.perks = player.perks ?? {};
      player.perks.gold = (player.perks.gold ?? 0) + benefit.goldPerTurn;
    }
    if (benefit.recruit) {
      const id = `${playerId}_levy_${at.q}_${at.r}`;
      const hp = UNITS[benefit.recruit]?.maxHp ?? 20;
      if (!state.map.units[id]) {
        state.map.units[id] = { id, type: benefit.recruit, ownerId: playerId, position: { q: at.q, r: at.r }, hp, maxHp: hp, movementRemaining: 0, veterancy: "recruit", mercenary: true };
        player.unitIds = player.unitIds.includes(id) ? player.unitIds : [...player.unitIds, id];
      }
    }
    const needCity = benefit.pop || benefit.walls;
    if (needCity) {
      let best = null, bestD = Infinity;
      for (const cid of player.cityIds) {
        const c = state.map.cities[cid];
        if (!c) continue;
        const d = Math.abs(c.position.q - at.q) + Math.abs(c.position.r - at.r);
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      if (best) {
        if (benefit.pop) best.population += benefit.pop;
        if (benefit.walls && !(best.buildings ?? []).includes("walls")) {
          best.buildings = best.buildings ?? [];
          best.buildings.push("walls");
        }
      }
    }
  }

  // src/engine/index.ts
  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function makePlayersById(players) {
    const result = {};
    for (const player of players) {
      result[player.id] = player;
    }
    return result;
  }
  function normalizePlayers(configPlayers) {
    const fallback = [{ id: "p1", civ: "Rome" }, { id: "p2", civ: "Carthage" }];
    return (configPlayers ?? fallback).map((player, idx) => ({
      id: player.id ?? `p${idx + 1}`,
      civ: player.civ ?? "Rome",
      food: player.food ?? 0,
      production: player.production ?? 0,
      gold: player.gold ?? 25,
      science: player.science ?? 0,
      techs: player.techs ?? [],
      forkChoices: player.forkChoices ?? {},
      cityIds: player.cityIds ?? [],
      unitIds: player.unitIds ?? [],
      ...player.perks ? { perks: player.perks } : {}
    }));
  }
  function normalizeMap(configMap) {
    const width = configMap?.width ?? 10;
    const height = configMap?.height ?? 10;
    const tiles = {};
    if (configMap?.tiles) {
      for (const [key, tile] of Object.entries(configMap.tiles)) {
        tiles[key] = {
          terrain: tile.terrain ?? "plains",
          region: tile.region ?? "core"
        };
        if (tile.improvement) tiles[key].improvement = tile.improvement;
        if (tile.road) tiles[key].road = tile.road;
        if (tile.resource) tiles[key].resource = tile.resource;
      }
    } else {
      for (let q = 0; q < width; q += 1) {
        for (let r = 0; r < height; r += 1) {
          const region = r < Math.ceil(height / 2) ? "north" : "south";
          tiles[`${q},${r}`] = { terrain: "plains", region };
        }
      }
    }
    const units = {};
    for (const [id, unit] of Object.entries(configMap?.units ?? {})) {
      const def = UNITS[unit.type];
      units[id] = {
        id,
        type: unit.type,
        ownerId: unit.ownerId,
        position: unit.position,
        maxHp: unit.maxHp ?? def.maxHp,
        hp: unit.hp ?? def.maxHp,
        movementRemaining: unit.movementRemaining ?? def.movement,
        veterancy: unit.veterancy ?? "recruit"
      };
    }
    return {
      width,
      height,
      tiles,
      rivers: configMap?.rivers ?? {},
      regions: configMap?.regions ?? Array.from(new Set(Object.values(tiles).map((t) => t.region))),
      cities: Object.fromEntries(
        Object.entries(configMap?.cities ?? {}).map(([id, city]) => [
          id,
          {
            id: city.id,
            ownerId: city.ownerId,
            position: city.position,
            population: city.population,
            hp: city.hp ?? 40,
            maxHp: city.maxHp ?? 40,
            isCapital: city.isCapital ?? false,
            food: city.food ?? 0,
            buildings: city.buildings ?? [],
            production: city.production ?? 0,
            queue: city.queue ?? []
          }
        ])
      ),
      units,
      // Authored discovery sites pass straight through (scenario maps); createInitialGameState
      // only scatters when these are absent.
      ...configMap?.ruins ? { ruins: configMap.ruins } : {},
      ...configMap?.villages ? { villages: configMap.villages } : {}
    };
  }
  function syncOwnershipIndexes(state) {
    for (const player of state.players) {
      player.cityIds = [];
      player.unitIds = [];
    }
    for (const city of Object.values(state.map.cities)) {
      const owner = state.playersById[city.ownerId];
      if (owner) owner.cityIds.push(city.id);
    }
    for (const unit of Object.values(state.map.units)) {
      const owner = state.playersById[unit.ownerId];
      if (owner) owner.unitIds.push(unit.id);
    }
  }
  function randomWeather(roll) {
    if (roll < 0.7) return "clear";
    if (roll < 0.86) return "heat";
    if (roll < 0.93) return "rain";
    if (roll < 0.97) return "fog";
    return "storm";
  }
  var WEATHER_FRONT = 6;
  function generateWeatherByRegion(state, turn) {
    const result = {};
    const regions = state.map.regions.length > 0 ? state.map.regions : ["core"];
    for (const region of regions) {
      const phase = Math.floor(seededRandom(state.seed, `wphase:${region}`)() * WEATHER_FRONT);
      const epoch = Math.floor((turn + phase) / WEATHER_FRONT);
      const rand = seededRandom(state.seed, `weather:${epoch}:${region}`);
      result[region] = randomWeather(rand());
    }
    return result;
  }
  function getCurrentPlayer(state) {
    return state.players[state.currentPlayerIndex];
  }
  function assertPlayerTurn(state, playerId) {
    const current = getCurrentPlayer(state);
    if (current.id !== playerId) {
      throw new Error(`Not this player's turn. Expected ${current.id}, got ${playerId}`);
    }
  }
  function tileAt(state, coord) {
    const tile = state.map.tiles[keyOf(coord)];
    if (!tile) throw new Error(`Unknown tile ${keyOf(coord)}`);
    return tile;
  }
  function unitAt(state, unitId) {
    const unit = state.map.units[unitId];
    if (!unit) throw new Error(`Unknown unit ${unitId}`);
    return unit;
  }
  function cityAt(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) throw new Error(`Unknown city ${cityId}`);
    return city;
  }
  function movementBudgetFor(state, unit) {
    const def = UNITS[unit.type];
    const owner = state.playersById[unit.ownerId];
    const logistics = def.domain === "land" && (owner?.techs.includes("roads-logistics") ?? false) ? 1 : 0;
    let bonus = playerPctMod(owner, "movePlus", def.category);
    if (def.domain === "naval") bonus += playerPctMod(owner, "navalMovePlus");
    if (def.domain === "land" && def.category === "infantry" && playerHasEffect(state, unit.ownerId, "forced-march")) bonus += 1;
    return def.movement + logistics + bonus;
  }
  function applyMovement(state, action) {
    const unit = unitAt(state, action.unitId);
    assertPlayerTurn(state, action.playerId);
    if (unit.ownerId !== action.playerId) throw new Error("Cannot move enemy unit");
    if (unit.garrison) throw new Error("A city garrison holds its post");
    const start = unit.position;
    const destination = action.destination;
    const unitDef = UNITS[unit.type];
    const path = action.path ?? findPath(
      state,
      {
        ownerId: unit.ownerId,
        domain: unitDef.domain,
        mounted: unitDef.mounted
      },
      start,
      destination
    );
    if (!path || path.length < 2) throw new Error("No valid path to destination");
    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const step = movementCost(
        state,
        { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
        path[i],
        path[i + 1]
      );
      if (!Number.isFinite(step)) throw new Error("Path uses impassable terrain");
      totalCost += step;
    }
    const oneStep = path.length === 2;
    const fresh = unit.movementRemaining >= unitDef.movement;
    if (totalCost > unit.movementRemaining && !(oneStep && fresh)) {
      throw new Error(`Insufficient movement: needs ${totalCost}, has ${unit.movementRemaining}`);
    }
    unit.position = destination;
    unit.movementRemaining = Math.max(0, unit.movementRemaining - totalCost);
    const destKey = keyOf(destination);
    const unitDefCat = UNITS[unit.type];
    if (unitDefCat && unitDefCat.domain !== "civilian") {
      for (const c of Object.values(state.map.cities)) {
        if (c.ownerId === unit.ownerId) continue;
        const d = (c.districts ?? []).find((x) => x.hex === destKey && !x.pillaged);
        if (d) d.pillaged = true;
      }
    }
    const destinationTile = tileAt(state, destination);
    if (destinationTile.terrain === "desert" && !state.playersById[unit.ownerId].techs.includes("caravan-logistics")) {
      const heatPenalty = state.weather.current[destinationTile.region] === "heat" ? 2 : 1;
      unit.hp = Math.max(1, unit.hp - heatPenalty);
    }
  }
  function veterancyMultiplier(veterancy) {
    if (veterancy === "veteran") return 1.1;
    if (veterancy === "elite") return 1.2;
    return 1;
  }
  function defenderTerrainBonus(state, defender) {
    return TERRAIN[tileAt(state, defender.position).terrain].defense || 0;
  }
  function flankingBonus(state, attacker, defender) {
    let adjacentAllies = 0;
    for (const n of neighborsOf(defender.position)) {
      for (const maybeAlly of Object.values(state.map.units)) {
        if (maybeAlly.id === attacker.id) continue;
        if (maybeAlly.ownerId !== attacker.ownerId) continue;
        if (maybeAlly.hp <= 0) continue;
        if (maybeAlly.position.q === n.q && maybeAlly.position.r === n.r) {
          adjacentAllies += 1;
        }
      }
    }
    return adjacentAllies * 0.1;
  }
  function riverAttackPenalty(state, attacker, defender) {
    const k = edgeKey(attacker.position, defender.position);
    return state.map.rivers[k] ? 0.25 : 0;
  }
  function greatRiverAssaultPenalty(state, attacker) {
    const def = UNITS[attacker.type];
    if (def && def.domain === "naval") return 0;
    const at = state.map.tiles[keyOf(attacker.position)];
    return at && at.terrain === "great-river" && at.improvement !== "bridge" ? 0.25 : 0;
  }
  var pct = (n) => `${n >= 0 ? "+" : "\u2212"}${Math.round(Math.abs(n) * 100)}%`;
  var cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  function categoryOf(unit) {
    return UNITS[unit.type].category || "infantry";
  }
  var HARDCODED_COMBAT_TECHS = /* @__PURE__ */ new Set(["furor", "thalassocracy", "parthian-shot", "testudo", "phalanx-wall"]);
  function techCardCombat(owner, selfCat, foeCat, role) {
    const out = { bonus: 0, labels: [] };
    if (!owner) return out;
    const key = role === "atk" ? "atkPct" : "defPct";
    const add = (v, name) => {
      out.bonus += v / 100;
      out.labels.push(`${name} ${v >= 0 ? "+" : "\u2212"}${Math.abs(v)}%`);
    };
    for (const techId of owner.techs) {
      if (HARDCODED_COMBAT_TECHS.has(techId)) continue;
      const rule = TECHS[techId];
      const eff = rule && rule.effect;
      if (!eff || eff.condition) continue;
      const name = rule && rule.name || techId;
      const flat = eff[key];
      if (typeof flat === "number" && flat !== 0 && (!eff.infantryOnly || selfCat === "infantry")) add(flat, name);
      const uc = eff.unitCatPct;
      if (uc && uc.cat === selfCat && typeof uc[key] === "number" && uc[key] !== 0 && (!uc.vsCat || uc.vsCat.includes(foeCat))) add(uc[key], name);
    }
    const cardPct = owner.perks && owner.perks[key];
    if (typeof cardPct === "number" && cardPct !== 0) add(cardPct, "Cards");
    return out;
  }
  function playerPctMod(owner, key, catId) {
    if (!owner) return 0;
    let total = 0;
    for (const techId of owner.techs) {
      if (HARDCODED_COMBAT_TECHS.has(techId)) continue;
      const eff = TECHS[techId]?.effect;
      if (!eff) continue;
      if (typeof eff[key] === "number") total += eff[key];
      const uc = eff.unitCatPct;
      if (catId && uc && uc.cat === catId && typeof uc[key] === "number") total += uc[key];
    }
    const perkVal = owner.perks && owner.perks[key];
    if (typeof perkVal === "number") total += perkVal;
    return total;
  }
  var YIELD_ALIAS = { food: "food", gold: "gold", labour: "production", production: "production", sci: "science", science: "science" };
  function parseYieldSpecial(special) {
    const out = [];
    for (const part of special.split(",")) {
      const m = /^\s*([a-z-]+)\+(\d+)(food|gold|labour|production|sci|science)\s*$/.exec(part);
      if (m && YIELD_ALIAS[m[3]]) out.push({ target: m[1], y: YIELD_ALIAS[m[3]], n: parseInt(m[2], 10) });
    }
    return out;
  }
  function combinedArmsBonus(state, attacker) {
    const owner = state.playersById[attacker.ownerId];
    if (!owner || !owner.techs.includes("combined-arms")) return { bonus: 0, label: null };
    const zone = [attacker.position, ...neighborsOf(attacker.position)];
    const categories = /* @__PURE__ */ new Set();
    for (const unit of Object.values(state.map.units)) {
      if (unit.ownerId !== attacker.ownerId || unit.hp <= 0) continue;
      if (zone.some((c) => c.q === unit.position.q && c.r === unit.position.r)) {
        categories.add(categoryOf(unit));
      }
    }
    const hasMelee = [...categories].some((c) => MELEE_CATEGORIES.has(c));
    const hasRanged = [...categories].some((c) => RANGED_CATEGORIES.has(c));
    const hasMounted = categories.has("mounted");
    if (hasMelee && hasRanged && hasMounted) return { bonus: 0.15, label: "Combined arms +15%" };
    if (hasMelee && hasRanged) return { bonus: 0.1, label: "Supported +10%" };
    return { bonus: 0, label: null };
  }
  function isEmbarked(state, unit) {
    const def = UNITS[unit.type];
    if (!def || def.domain !== "land") return false;
    const tile = state.map.tiles[keyOf(unit.position)];
    if (!tile) return false;
    if (tile.terrain === "great-river") return tile.improvement !== "bridge";
    return tile.terrain === "coast" || tile.terrain === "sea";
  }
  function computeCombatPreview(state, attackerId, defenderId) {
    const attacker = unitAt(state, attackerId);
    const defender = unitAt(state, defenderId);
    const attackerDef = UNITS[attacker.type];
    const defenderDef = UNITS[defender.type];
    if (distance(attacker.position, defender.position) > attackerDef.range) {
      throw new Error("Defender is out of range");
    }
    const defenderTile = tileAt(state, defender.position);
    const weather = state.weather.current[defenderTile.region] || "clear";
    const atkCat = categoryOf(attacker);
    const defCat = categoryOf(defender);
    const modifiers = [];
    const atkG = techCardCombat(state.playersById[attacker.ownerId], atkCat, defCat, "atk");
    const defG = techCardCombat(state.playersById[defender.ownerId], defCat, atkCat, "def");
    let attackMult = veterancyMultiplier(attacker.veterancy);
    const defenderBulwark = unitHasEffect(state, defender.id, "bulwark");
    const flank = defenderBulwark ? 0 : flankingBonus(state, attacker, defender);
    if (flank > 0) {
      attackMult += flank;
      modifiers.push(`Flanking ${pct(flank)}`);
    } else if (defenderBulwark) {
      modifiers.push("Bulwark \u2014 no flanking");
    }
    const river = riverAttackPenalty(state, attacker, defender);
    if (river > 0) {
      attackMult -= river;
      modifiers.push(`River crossing ${pct(-river)}`);
    }
    const boatAssault = greatRiverAssaultPenalty(state, attacker);
    if (boatAssault > 0) {
      attackMult -= boatAssault;
      modifiers.push(`Assault by boat ${pct(-boatAssault)}`);
    }
    const counterAtk = attackerDef.counters && attackerDef.counters[defCat] || 0;
    if (counterAtk > 0) {
      attackMult += counterAtk;
      modifiers.push(`${cap(CATEGORY_LABELS[atkCat] || atkCat)} vs ${CATEGORY_LABELS[defCat] || defCat} ${pct(counterAtk)}`);
    }
    const combined = combinedArmsBonus(state, attacker);
    if (combined.bonus > 0) {
      attackMult += combined.bonus;
      modifiers.push(combined.label);
    }
    const atkOwner = state.playersById[attacker.ownerId];
    if (atkOwner) {
      if (atkOwner.techs.includes("furor") && (atkCat === "heavy" || atkCat === "infantry")) {
        attackMult += 0.35;
        modifiers.push("Furor charge +35%");
      }
      if (atkOwner.techs.includes("thalassocracy") && attackerDef.domain === "naval") {
        attackMult += 0.3;
        modifiers.push("Thalassocracy +30%");
      }
      if (atkOwner.techs.includes("parthian-shot") && attackerDef.mounted && attackerDef.range > 1) {
        attackMult += 0.2;
        modifiers.push("Parthian shot +20%");
      }
    }
    if (atkG.bonus) {
      attackMult += atkG.bonus;
      modifiers.push(...atkG.labels);
    }
    const terrainBonus = defenderTerrainBonus(state, defender);
    let defenseMult = terrainBonus + veterancyMultiplier(defender.veterancy);
    if (terrainBonus > 0) modifiers.push(`Enemy terrain ${pct(terrainBonus)}`);
    const counterDef = defenderDef.counters && defenderDef.counters[atkCat] || 0;
    if (counterDef > 0) {
      defenseMult += counterDef;
      modifiers.push(`Enemy ${CATEGORY_LABELS[defCat] || defCat} vs ${CATEGORY_LABELS[atkCat] || atkCat} ${pct(counterDef)}`);
    }
    const defOwner = state.playersById[defender.ownerId];
    if (defOwner && defOwner.techs.includes("testudo") && defCat === "infantry") {
      const shell = atkCat === "ranged" || atkCat === "siege" ? 0.5 : 0.2;
      defenseMult += shell;
      modifiers.push(`Testudo ${pct(shell)}`);
    }
    if (defOwner && defOwner.techs.includes("phalanx-wall") && defCat === "spear") {
      const wall = atkCat === "mounted" ? 0.6 : 0.35;
      defenseMult += wall;
      modifiers.push(`Phalanx wall ${pct(wall)}`);
    }
    if (defOwner && defOwner.techs.includes("thalassocracy") && defenderDef.domain === "naval") {
      defenseMult += 0.3;
      modifiers.push("Thalassocracy +30%");
    }
    if (defG.bonus) {
      defenseMult += defG.bonus;
      modifiers.push(...defG.labels);
    }
    if (defenderBulwark) {
      defenseMult += 1;
      modifiers.push("Bulwark +100%");
    }
    const atkPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * Math.max(0.1, attackMult);
    let defPower = defenderDef.defense * (defender.hp / defender.maxHp) * Math.max(0.1, defenseMult);
    if (isEmbarked(state, defender)) {
      defPower *= 0.4;
      modifiers.push("Embarked at sea \u221260%");
    }
    let damageToDefender = Math.max(1, Math.round(20 * atkPower / (atkPower + defPower)));
    let damageToAttacker = Math.max(0, Math.round(14 * defPower / (atkPower + defPower)));
    if (weather === "fog") {
      damageToDefender = Math.max(1, Math.round(damageToDefender * 0.95));
      modifiers.push("Fog \u22125%");
    }
    if (attacker.ownerId !== defender.ownerId && playerHasEffect(state, defender.ownerId, "fabian")) {
      damageToDefender = Math.max(1, Math.round(damageToDefender * 0.5));
      modifiers.push("Fabian withdrawal \u221250%");
    }
    const rangedNoRetaliation = attackerDef.range > 1 && distance(attacker.position, defender.position) > 1;
    if (rangedNoRetaliation) {
      damageToAttacker = 0;
      modifiers.push("Ranged \u2014 no retaliation");
    } else if (atkOwner && atkOwner.techs.includes("parthian-shot") && attackerDef.mounted && attackerDef.range > 1 && damageToAttacker > 0) {
      damageToAttacker = 0;
      modifiers.push("Parthian shot \u2014 no retaliation");
    }
    return {
      damageToDefender,
      damageToAttacker,
      attackerRemainingHp: Math.max(0, attacker.hp - damageToAttacker),
      defenderRemainingHp: Math.max(0, defender.hp - damageToDefender),
      modifiers
    };
  }
  function tryAdvanceInto(state, attacker, target) {
    if (!attacker || attacker.hp <= 0) return;
    const def = UNITS[attacker.type];
    if ((def.range ?? 1) > 1) return;
    if (distance(attacker.position, target) !== 1) return;
    const blocked = Object.values(state.map.units).some(
      (u) => u.id !== attacker.id && u.position.q === target.q && u.position.r === target.r
    );
    if (blocked) return;
    const cityHere = Object.values(state.map.cities).find(
      (c) => c.position.q === target.q && c.position.r === target.r
    );
    if (cityHere && cityHere.ownerId !== attacker.ownerId) return;
    const step = movementCost(
      state,
      { ownerId: attacker.ownerId, domain: def.domain, mounted: def.mounted },
      attacker.position,
      target
    );
    if (!Number.isFinite(step)) return;
    attacker.position = { q: target.q, r: target.r };
  }
  function applyCombat(state, action) {
    assertPlayerTurn(state, action.playerId);
    const attacker = unitAt(state, action.attackerId);
    const defender = unitAt(state, action.defenderId);
    if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack with enemy unit");
    if (defender.ownerId === action.playerId) throw new Error("Cannot attack friendly unit");
    if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can fight");
    enterWar(state, action.playerId, defender.ownerId);
    const preview = computeCombatPreview(state, attacker.id, defender.id);
    attacker.hp = preview.attackerRemainingHp;
    defender.hp = preview.defenderRemainingHp;
    const atkDefC = UNITS[attacker.type];
    const parthian = !!atkDefC.mounted && atkDefC.range > 1 && (state.playersById[attacker.ownerId]?.techs.includes("parthian-shot") ?? false);
    const hitRun = atkDefC.special === "hit-and-run";
    attacker.movementRemaining = parthian || hitRun ? Math.max(1, Math.floor(atkDefC.movement / 2)) : 0;
    const defenderPos = { q: defender.position.q, r: defender.position.r };
    if (defender.hp <= 0) {
      if (defender.garrison) {
        const c = cityAtPos(state, defenderPos);
        if (c) c.garrisonReadyTurn = state.turn + GARRISON_RESPAWN;
      }
      delete state.map.units[defender.id];
      const defenderOwner = state.playersById[defender.ownerId];
      defenderOwner.unitIds = defenderOwner.unitIds.filter((id) => id !== defender.id);
      if (attacker.veterancy === "recruit") attacker.veterancy = "veteran";
      else if (attacker.veterancy === "veteran") attacker.veterancy = "elite";
      if (attacker.hp > 0) tryAdvanceInto(state, attacker, defenderPos);
    }
    if (attacker.hp <= 0) {
      delete state.map.units[attacker.id];
      const attackerOwner = state.playersById[attacker.ownerId];
      attackerOwner.unitIds = attackerOwner.unitIds.filter((id) => id !== attacker.id);
    }
  }
  function applyRenameCity(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot rename an enemy city");
    const name = action.name.trim().slice(0, 24);
    if (!name) throw new Error("City name cannot be empty");
    city.name = name;
  }
  function computeCityAttackDamage(state, attacker, city) {
    const attackerDef = UNITS[attacker.type];
    const cityTile = tileAt(state, city.position);
    const weather = state.weather.current[cityTile.region] || "clear";
    const weatherMult = weather === "fog" ? 0.95 : 1;
    const siegeMult = 1 + (attackerDef.siegeBonus ?? 0);
    const boatMult = 1 - greatRiverAssaultPenalty(state, attacker);
    const attackPower = attackerDef.attack * (attacker.hp / attacker.maxHp) * veterancyMultiplier(attacker.veterancy) * weatherMult * siegeMult * boatMult;
    const owner = state.playersById[city.ownerId];
    let cityDefense = 22 + city.population * 3 + (playerAge(owner) - 1) * 10;
    if (cityEffect(state, city.id, "evocatio")) cityDefense *= 0.6;
    return Math.max(1, Math.round(18 * attackPower / (attackPower + cityDefense)));
  }
  function playerAge(player) {
    let age = 1;
    if (!player) return age;
    for (const id of player.techs) {
      const t = TECHS[id];
      if (t && t.age > age) age = t.age;
    }
    return age;
  }
  var GARRISON_RESPAWN = 4;
  function isLandMilitary(u) {
    const d = u && UNITS[u.type];
    return !!d && d.domain === "land" && (d.attack ?? 0) > 0;
  }
  function bestGarrisonType(player) {
    let best = "warrior", bestDef = -1;
    for (const [type, def] of Object.entries(UNITS)) {
      if (def.domain !== "land" || (def.attack ?? 0) <= 0) continue;
      if (def.buildCap) continue;
      if (def.civ && !playerControlsCiv(player, def.civ)) continue;
      if (def.requiresTech && !player.techs.includes(def.requiresTech)) continue;
      const d = def.defense ?? 0;
      if (d > bestDef) {
        bestDef = d;
        best = type;
      }
    }
    return best;
  }
  function cityAtPos(state, at) {
    return Object.values(state.map.cities).find((c) => c.position.q === at.q && c.position.r === at.r);
  }
  function refreshGarrisons(state, player) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city) continue;
      const at = city.position;
      const defended = player.unitIds.some((id2) => {
        const u = state.map.units[id2];
        return isLandMilitary(u) && u.position.q === at.q && u.position.r === at.r;
      });
      if (defended) continue;
      if (state.turn < (city.garrisonReadyTurn ?? 0)) continue;
      const type = bestGarrisonType(player);
      const def = UNITS[type];
      const id = `${player.id}_gar_${at.q}_${at.r}_${state.turn}`;
      if (state.map.units[id]) continue;
      state.map.units[id] = {
        id,
        type,
        ownerId: player.id,
        position: { q: at.q, r: at.r },
        hp: def.maxHp,
        maxHp: def.maxHp,
        movementRemaining: 0,
        veterancy: playerAge(player) >= 3 ? "veteran" : "recruit",
        garrison: true
      };
      player.unitIds = player.unitIds.includes(id) ? player.unitIds : [...player.unitIds, id];
      city.garrisonReadyTurn = state.turn;
    }
  }
  function applyAttackCity(state, action) {
    assertPlayerTurn(state, action.playerId);
    const attacker = unitAt(state, action.attackerId);
    const city = cityAt(state, action.cityId);
    if (attacker.ownerId !== action.playerId) throw new Error("Cannot attack city with enemy unit");
    if (city.ownerId === action.playerId) throw new Error("Cannot attack friendly city");
    if (isEmbarked(state, attacker)) throw new Error("Embarked units must land before they can assault a city");
    enterWar(state, action.playerId, city.ownerId);
    const attackerDef = UNITS[attacker.type];
    if (distance(attacker.position, city.position) > attackerDef.range) {
      throw new Error("City is out of range");
    }
    const damage = computeCityAttackDamage(state, attacker, city);
    city.hp = Math.max(0, city.hp - damage);
    city.lastAttackedTurn = state.turn;
    attacker.movementRemaining = 0;
    if (city.hp <= 0) {
      city.ownerId = attacker.ownerId;
      city.population = Math.max(1, city.population - 1);
      city.hp = Math.ceil(city.maxHp * 0.6);
      city.capturedTurn = state.turn;
      syncOwnershipIndexes(state);
      tryAdvanceInto(state, attacker, { q: city.position.q, r: city.position.r });
    }
  }
  function playerControlsCiv(player, civId) {
    if (!civId) return true;
    const want = civId.toLowerCase();
    return player.id.toLowerCase() === want || (player.civ || "").toLowerCase() === want;
  }
  function canResearch(player, techId) {
    const tech = TECHS[techId];
    if (!tech) throw new Error(`Unknown tech ${techId}`);
    if (player.techs.includes(techId)) return false;
    if (tech.civ && !playerControlsCiv(player, tech.civ)) return false;
    for (const prereq of tech.prerequisites) {
      if (!player.techs.includes(prereq)) return false;
    }
    const gate = AGE_GATES[tech.age];
    if (gate) {
      const prevAgeDone = player.techs.filter((id) => TECHS[id] && TECHS[id].age === tech.age - 1).length;
      if (prevAgeDone < gate.requiredPrevAgeTechs) return false;
    }
    if (tech.forkGroup) {
      const chosenBranch = player.forkChoices[tech.forkGroup];
      if (chosenBranch && chosenBranch !== tech.forkBranch) return false;
    }
    return true;
  }
  function applyResearch(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    if (!canResearch(player, action.techId)) {
      throw new Error(`Cannot research tech ${action.techId}`);
    }
    const cost = scaledResearchCost(state, action.techId, action.playerId);
    if (player.science < cost) {
      throw new Error(`Insufficient science for ${action.techId}: needs ${cost}, has ${player.science}`);
    }
    player.science -= cost;
    player.techs.push(action.techId);
    const tech = TECHS[action.techId];
    if (tech.forkGroup && !player.forkChoices[tech.forkGroup]) {
      player.forkChoices[tech.forkGroup] = tech.forkBranch || "";
    }
  }
  function applyChooseFork(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    if (player.forkChoices[action.forkGroup] && player.forkChoices[action.forkGroup] !== action.branch) {
      throw new Error(`Fork already chosen for ${action.forkGroup}`);
    }
    player.forkChoices[action.forkGroup] = action.branch;
  }
  var MAX_POPULATION = 8;
  function growthCost(population) {
    return 8 + population * 6;
  }
  var RECRUITMENT = {
    militaryPopCost: 1,
    minCityPopToTrain: 2,
    settlerPopCost: 1,
    civilianPopCost: 0,
    mercenaryPopCost: 0
  };
  function unitPopCost(id) {
    const def = UNITS[id];
    if (!def) return 0;
    if (id === "settler") return RECRUITMENT.settlerPopCost;
    if (def.domain === "civilian") return RECRUITMENT.civilianPopCost;
    return RECRUITMENT.militaryPopCost;
  }
  var AGE_BASE = { 1: 16, 2: 40, 3: 78 };
  var TIER_MULT = { "1": 0.8, "2": 1, "3": 1.3, capstone: 1.6 };
  var AGE_GATES = {
    2: { requiredPrevAgeTechs: 5 },
    3: { requiredPrevAgeTechs: 6 }
  };
  var _sameAgeDepth = {};
  function sameAgeDepth(techId) {
    if (_sameAgeDepth[techId] != null) return _sameAgeDepth[techId];
    _sameAgeDepth[techId] = 0;
    const tech = TECHS[techId];
    if (!tech) return 0;
    const same = tech.prerequisites.filter((p) => TECHS[p] && TECHS[p].age === tech.age);
    const d = same.length ? 1 + Math.max(...same.map(sameAgeDepth)) : 0;
    _sameAgeDepth[techId] = d;
    return d;
  }
  function techTier(techId) {
    return Math.min(3, 1 + sameAgeDepth(techId));
  }
  function researchCost(techId) {
    const tech = TECHS[techId];
    if (!tech) return AGE_BASE[1];
    const mult = tech.capstone ? TIER_MULT.capstone : TIER_MULT[String(techTier(techId))];
    const costMod = typeof tech.costMod === "number" ? tech.costMod : 1;
    return Math.max(1, Math.round(AGE_BASE[tech.age] * mult * costMod));
  }
  var REFERENCE_AREA = 21 * 18;
  function mapCostScale(width, height) {
    const area = Math.max(1, (width || 0) * (height || 0));
    return Math.min(3, Math.max(1, Math.round(Math.sqrt(area / REFERENCE_AREA) * 100) / 100));
  }
  function scaledResearchCost(state, techId, playerId) {
    let cost = researchCost(techId) * (state.costScale || 1);
    if (playerId && state.playersById[playerId]?.techs.includes("rhetoric")) cost *= 0.85;
    const rc = playerPctMod(playerId ? state.playersById[playerId] : void 0, "researchCostPct");
    if (rc) cost *= Math.max(0.3, 1 + rc / 100);
    return Math.max(1, Math.round(cost));
  }
  var STABILITY_BUILDINGS = { temple: 1, amphitheater: 1, forum: 1 };
  function computeCityStability(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) return 0;
    const owner = state.playersById[city.ownerId];
    let s = 0;
    for (const b of city.buildings ?? []) s += STABILITY_BUILDINGS[b] ?? 0;
    const civId = owner ? String(owner.civ || "").toLowerCase() : "";
    for (const d of city.districts ?? []) {
      if (d.pillaged) continue;
      if (d.type === "greatwork" && d.work) {
        const gwc = greatWork(d.work)?.effect.cityYield;
        if (gwc && typeof gwc.stability === "number") s += gwc.stability;
        continue;
      }
      const cy = districtType(d.type)?.effect.cityYield;
      if (cy && typeof cy.stability === "number") s += cy.stability;
      const bonus = districtName(d.type, civId)?.bonus;
      if (bonus && typeof bonus.stability === "number") s += bonus.stability;
    }
    if (owner) {
      for (const cid of owner.cityIds) {
        for (const d of state.map.cities[cid]?.districts ?? []) {
          if (d.pillaged || d.type !== "greatwork" || !d.work) continue;
          const emp = greatWork(d.work)?.effect.empire;
          if (emp && typeof emp.stability === "number") s += emp.stability;
        }
      }
    }
    if (owner) {
      for (const techId of Object.keys(TECH_STABILITY)) if (owner.techs.includes(techId)) s += TECH_STABILITY[techId];
      s += owner.perks?.stability ?? 0;
      if (isOathbreaker(state, owner.id)) s -= 1;
      s -= playerWarWeariness(state, owner.id);
    }
    if (Object.values(state.map.units).some((u) => u.ownerId === city.ownerId && u.position.q === city.position.q && u.position.r === city.position.r)) s += 1;
    if (city.capturedTurn != null) s -= Math.max(0, 2 - (state.turn - city.capturedTurn));
    return Math.max(-5, Math.min(5, s));
  }
  function computeCityYield(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) throw new Error(`Unknown city ${cityId}`);
    const centerTile = tileAt(state, city.position);
    const terrainYield = TERRAIN[centerTile.terrain].yields;
    const owner = state.playersById[city.ownerId];
    const pop = city.population;
    const writingBonus = owner && owner.techs.includes("writing") ? 1 : 0;
    const yields = {
      food: terrainYield.food + pop,
      production: terrainYield.production + Math.ceil(pop / 2) + 1,
      gold: terrainYield.gold + Math.floor(pop / 2) + 1,
      science: 2 + pop + writingBonus
    };
    if (owner) {
      for (const techId of Object.keys(TECH_CITY_YIELD)) {
        if (!owner.techs.includes(techId)) continue;
        const y = TECH_CITY_YIELD[techId];
        yields.food += y.food ?? 0;
        yields.production += y.production ?? 0;
        yields.gold += y.gold ?? 0;
        yields.science += y.science ?? 0;
      }
    }
    const impBonus = {};
    const bldExtra = {};
    const YK = ["food", "production", "gold", "science"];
    if (owner) {
      const addTo = (map, k, y, n) => {
        (map[k] ??= {})[y] = (map[k][y] ?? 0) + n;
      };
      for (const techId of owner.techs) {
        const eff = TECHS[techId]?.effect;
        if (!eff) continue;
        const cap2 = eff.capitalYield;
        if (cap2 && city.isCapital) {
          for (const k of YK) if (typeof cap2[k] === "number") yields[k] += cap2[k];
        }
        const boost = eff.buildingBoost;
        if (boost) {
          for (const bid in boost) for (const k of YK) if (typeof boost[bid][k] === "number") addTo(bldExtra, bid, k, boost[bid][k]);
        }
        if (typeof eff.special === "string") for (const b of parseYieldSpecial(eff.special)) {
          const bid = b.target.replace(/-city$/, "");
          if (IMPROVEMENTS[b.target]) addTo(impBonus, b.target, b.y, b.n);
          else if (BUILDINGS[bid]) addTo(bldExtra, bid, b.y, b.n);
        }
      }
    }
    for (const buildingId of city.buildings ?? []) {
      const b = BUILDINGS[buildingId];
      if (!b) continue;
      if (b.yields) {
        yields.food += b.yields.food ?? 0;
        yields.production += b.yields.production ?? 0;
        yields.gold += b.yields.gold ?? 0;
        yields.science += b.yields.science ?? 0;
      }
      const be = bldExtra[buildingId];
      if (be) {
        yields.food += be.food ?? 0;
        yields.production += be.production ?? 0;
        yields.gold += be.gold ?? 0;
        yields.science += be.science ?? 0;
      }
      if (b.networkGold && owner) {
        const network = owner.cityIds.reduce((n, id) => {
          const c = state.map.cities[id];
          return n + (c && (c.buildings ?? []).includes(buildingId) ? 1 : 0);
        }, 0);
        yields.gold += b.networkGold * Math.max(0, network - 1);
      }
    }
    for (const key of tileKeysWithin(city.position, cityTerritoryRadius(city))) {
      const tile = state.map.tiles[key];
      if (!tile || !tile.improvement && !tile.resource) continue;
      const claim = claimingCity(state, parseKey(key));
      if (!claim || claim.id !== cityId) continue;
      const imp = tile.improvement ? IMPROVEMENTS[tile.improvement] : null;
      if (imp) {
        yields.food += imp.yields.food ?? 0;
        yields.production += imp.yields.production ?? 0;
        yields.gold += imp.yields.gold ?? 0;
        yields.science += imp.yields.science ?? 0;
        const ib = impBonus[tile.improvement];
        if (ib) {
          yields.food += ib.food ?? 0;
          yields.production += ib.production ?? 0;
          yields.gold += ib.gold ?? 0;
          yields.science += ib.science ?? 0;
        }
      }
      const res = tile.resource ? RESOURCES[tile.resource] : null;
      if (res) {
        yields.food += res.yields.food ?? 0;
        yields.production += res.yields.production ?? 0;
        yields.gold += res.yields.gold ?? 0;
        yields.science += res.yields.science ?? 0;
      }
    }
    for (const key of tileKeysWithin(city.position, cityTerritoryRadius(city))) {
      const tile = state.map.tiles[key];
      const trule = tile ? TERRAIN[tile.terrain] : null;
      if (!trule || trule.navalOnly) continue;
      const claim = claimingCity(state, parseKey(key));
      if (!claim || claim.id !== cityId) continue;
      for (const n of neighborsOf(parseKey(key))) {
        const nt = state.map.tiles[keyOf(n)];
        if (nt && nt.terrain === "great-river") {
          yields.food += 2;
          break;
        }
      }
    }
    const civId = owner ? String(owner.civ || "").toLowerCase() : "";
    const addY = (src) => {
      if (!src) return;
      for (const k of YK) if (typeof src[k] === "number") yields[k] += src[k];
      if (typeof src.labour === "number") yields.production += src.labour;
    };
    for (const d of city.districts ?? []) {
      if (d.pillaged) continue;
      if (d.type === "greatwork" && d.work) {
        const gw = greatWork(d.work);
        if (gw) {
          addY(gw.effect.cityYield);
          if (city.isCapital) addY(gw.effect.capitalYield);
        }
        continue;
      }
      addY(districtType(d.type)?.effect.cityYield);
      addY(districtName(d.type, civId)?.bonus);
    }
    if (owner) {
      for (const cid of owner.cityIds) {
        for (const d of state.map.cities[cid]?.districts ?? []) {
          if (d.pillaged || d.type !== "greatwork" || !d.work) continue;
          addY(greatWork(d.work)?.effect.empire);
        }
      }
    }
    const stability = computeCityStability(state, cityId);
    if (stability !== 0) {
      const sf = 1 + 0.02 * stability;
      yields.food = Math.max(0, Math.round(yields.food * sf));
      yields.production = Math.max(0, Math.round(yields.production * sf));
      yields.gold = Math.max(0, Math.round(yields.gold * sf));
      yields.science = Math.max(0, Math.round(yields.science * sf));
    }
    if (stability >= 3) yields.production += 1;
    return yields;
  }
  function tileKeysWithin(center, radius) {
    const keys = [];
    for (let dq = -radius; dq <= radius; dq += 1) {
      for (let dr = -radius; dr <= radius; dr += 1) {
        if (distance({ q: 0, r: 0 }, { q: dq, r: dr }) > radius) continue;
        keys.push(`${center.q + dq},${center.r + dr}`);
      }
    }
    return keys;
  }
  function isCoastalCity(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city) return false;
    return neighborsOf(city.position).some((n) => {
      const tile = state.map.tiles[keyOf(n)];
      if (!tile || tile.open) return false;
      return tile.terrain === "coast" || tile.terrain === "sea";
    });
  }
  var ROAD_COST = 8;
  function productionItemCost(id) {
    if (UNITS[id]) return UNIT_BUILD_COSTS[id] ?? Infinity;
    if (BUILDINGS[id]) return BUILDINGS[id].cost;
    if (id.startsWith("imp:")) {
      const type = id.split(":")[1];
      return IMPROVEMENTS[type]?.cost ?? Infinity;
    }
    if (id.startsWith("road:")) return ROAD_COST;
    return Infinity;
  }
  function controlledResources(state, ownerId) {
    const owned = /* @__PURE__ */ new Set();
    for (const [key, tile] of Object.entries(state.map.tiles)) {
      if (!tile.resource) continue;
      const claim = claimingCity(state, parseKey(key));
      if (claim && claim.ownerId === ownerId) owned.add(tile.resource);
    }
    return owned;
  }
  function buildDiscount(state, ownerId, id) {
    const need = BUILD_RESOURCE[id];
    if (!need) return 1;
    return controlledResources(state, ownerId).has(need) ? BUILD_DISCOUNT : 1;
  }
  function effectiveItemCost(state, ownerId, id) {
    const base = productionItemCost(id);
    if (!Number.isFinite(base)) return base;
    let mult = buildDiscount(state, ownerId, id) * (state.costScale || 1);
    if (UNITS[id]?.domain === "naval" && (state.playersById[ownerId]?.techs.includes("thalassocracy") ?? false)) mult *= 0.75;
    if (UNITS[id]?.category === "ranged" && String(state.playersById[ownerId]?.civ || "").toLowerCase() === "kush") mult *= 0.75;
    const owner = state.playersById[ownerId];
    const faster = playerPctMod(owner, "buildFasterPct");
    if (faster) mult *= Math.max(0.4, 1 - faster / 100);
    if (UNITS[id]) {
      const uc = playerPctMod(owner, "unitCostPct", UNITS[id].category);
      if (uc) mult *= Math.max(0.4, 1 + uc / 100);
    }
    return Math.max(1, Math.round(base * mult));
  }
  var FOOD_UPKEEP_FREE_PER_CITY = 1;
  function playerFoodUpkeep(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) return 0;
    const military = player.unitIds.reduce((n, id) => {
      const u = state.map.units[id];
      return n + (u && UNITS[u.type].domain !== "civilian" ? 1 : 0);
    }, 0);
    const free = player.cityIds.length * FOOD_UPKEEP_FREE_PER_CITY;
    const net = Math.max(0, military - free);
    const up = playerPctMod(player, "upkeepPct");
    return up ? Math.max(0, Math.round(net * (1 + up / 100))) : net;
  }
  function navalLaunchTile(state, city) {
    const occupied = new Set(Object.values(state.map.units).map((u) => keyOf(u.position)));
    let firstWater = null;
    for (const n of neighborsOf(city.position)) {
      const tile = state.map.tiles[keyOf(n)];
      if (!tile || tile.terrain !== "coast" && tile.terrain !== "sea") continue;
      if (!firstWater) firstWater = n;
      if (!occupied.has(keyOf(n))) return n;
    }
    return firstWater ?? { ...city.position };
  }
  function completeQueueItem(state, city, id) {
    if (UNITS[id]) {
      const def = UNITS[id];
      let counter = 1;
      let unitId = `${city.ownerId}_${id}_${state.turn}_${city.id}_${counter}`;
      while (state.map.units[unitId]) {
        counter += 1;
        unitId = `${city.ownerId}_${id}_${state.turn}_${city.id}_${counter}`;
      }
      const spawn = def.domain === "naval" ? navalLaunchTile(state, city) : { ...city.position };
      state.map.units[unitId] = {
        id: unitId,
        type: id,
        ownerId: city.ownerId,
        position: spawn,
        hp: def.maxHp,
        maxHp: def.maxHp,
        movementRemaining: 0,
        // Kush — Bowmen of Ta-Seti: her ranged units are born veterans (§4.1 trait).
        veterancy: def.category === "ranged" && String(state.playersById[city.ownerId]?.civ || "").toLowerCase() === "kush" ? "veteran" : "recruit",
        homeCityId: city.id
        // Cities v3 §1 — where a disbanded citizen returns
      };
      syncOwnershipIndexes(state);
    } else if (BUILDINGS[id] && !(city.buildings ?? []).includes(id)) {
      city.buildings = [...city.buildings ?? [], id];
      const cityHp = BUILDINGS[id].cityHp;
      if (cityHp) {
        city.maxHp += cityHp;
        city.hp += cityHp;
      }
    } else if (id.startsWith("imp:")) {
      const [, type, coordKey] = id.split(":");
      const tile = coordKey ? state.map.tiles[coordKey] : void 0;
      if (tile && IMPROVEMENTS[type] && !tile.improvement) tile.improvement = type;
    } else if (id.startsWith("road:")) {
      const coordKey = id.slice("road:".length);
      const tile = state.map.tiles[coordKey];
      if (tile) tile.road = true;
    }
  }
  function processCityQueue(state, city) {
    city.queue = city.queue ?? [];
    let guard = 0;
    while (city.queue.length > 0 && guard < 32) {
      guard += 1;
      const id = city.queue[0];
      if (BUILDINGS[id] && (city.buildings ?? []).includes(id)) {
        city.queue.shift();
        continue;
      }
      if (id.startsWith("imp:")) {
        const coordKey = id.split(":")[2];
        const t = coordKey ? state.map.tiles[coordKey] : void 0;
        if (!t || t.improvement) {
          city.queue.shift();
          continue;
        }
      }
      if (id.startsWith("road:")) {
        const t = state.map.tiles[id.slice("road:".length)];
        if (!t || t.road) {
          city.queue.shift();
          continue;
        }
      }
      const cost = effectiveItemCost(state, city.ownerId, id);
      if (!Number.isFinite(cost) || (city.production ?? 0) < cost) break;
      const popCost = unitPopCost(id);
      if (popCost > 0 && city.population < RECRUITMENT.minCityPopToTrain) break;
      city.production = (city.production ?? 0) - cost;
      completeQueueItem(state, city, id);
      if (popCost > 0) city.population = Math.max(1, city.population - popCost);
      city.queue.shift();
    }
  }
  function enqueueProduction(city, id) {
    city.queue = [...city.queue ?? [], id];
  }
  function applyBuildBuilding(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot build in an enemy city");
    const building = BUILDINGS[action.buildingId];
    if (!building) throw new Error(`Unknown building ${action.buildingId}`);
    if ((city.buildings ?? []).includes(action.buildingId)) throw new Error(`${action.buildingId} already built`);
    if ((city.queue ?? []).includes(action.buildingId)) throw new Error(`${action.buildingId} already queued`);
    const player = state.playersById[action.playerId];
    if (building.civ && String(player.civ || "").toLowerCase() !== building.civ) {
      throw new Error(`${building.name} is unique to the ${building.civ}`);
    }
    if (building.requiresTech && !player.techs.includes(building.requiresTech)) {
      throw new Error(`Building ${action.buildingId} requires tech ${building.requiresTech}`);
    }
    if (building.coastalOnly && !isCoastalCity(state, action.cityId)) {
      throw new Error(`Building ${action.buildingId} can only be raised in a coastal city`);
    }
    enqueueProduction(city, action.buildingId);
  }
  function applyUnqueueProduction(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot edit an enemy city's queue");
    if (!city.queue || action.index < 0 || action.index >= city.queue.length) return;
    city.queue = city.queue.filter((_, i) => i !== action.index);
  }
  var RUSH_GOLD_PER_PRODUCTION = 4;
  function rushProductionCost(state, cityId) {
    const city = state.map.cities[cityId];
    if (!city || !city.queue || city.queue.length === 0) return null;
    const itemId = city.queue[0];
    const cost = effectiveItemCost(state, city.ownerId, itemId);
    if (!Number.isFinite(cost)) return null;
    const missing = Math.max(0, cost - (city.production ?? 0));
    return { itemId, missingProduction: missing, goldCost: Math.ceil(missing * RUSH_GOLD_PER_PRODUCTION) };
  }
  function applyRushProduction(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot rush an enemy city's queue");
    const rush = rushProductionCost(state, action.cityId);
    if (!rush) throw new Error("Nothing to rush");
    const player = state.playersById[action.playerId];
    if (player.gold < rush.goldCost) throw new Error("Not enough denarii to rush");
    player.gold -= rush.goldCost;
    const cost = effectiveItemCost(state, city.ownerId, rush.itemId);
    city.production = Math.max(city.production ?? 0, cost);
    processCityQueue(state, city);
  }
  function tradeRouteIsLive(state, route) {
    const from = state.map.cities[route.fromCityId];
    const to = state.map.cities[route.toCityId];
    return !!from && from.ownerId === route.ownerId && !!to;
  }
  function pruneTradeRoutes(state) {
    state.tradeRoutes = (state.tradeRoutes ?? []).filter((r) => tradeRouteIsLive(state, r));
  }
  function tradeRouteIncome(state, playerId) {
    let gold = 0;
    for (const route of state.tradeRoutes ?? []) {
      if (route.ownerId !== playerId) continue;
      if (tradeRouteIsLive(state, route)) gold += route.gold;
    }
    return gold;
  }
  function tradeRouteValue(distanceBetween, foreign) {
    return Math.max(2, Math.min(15, 2 + Math.floor(distanceBetween / 2) + (foreign ? 3 : 0)));
  }
  function applyEstablishTradeRoute(state, action) {
    assertPlayerTurn(state, action.playerId);
    if (!state.tradeRoutes) state.tradeRoutes = [];
    const merchant = unitAt(state, action.merchantId);
    if (merchant.ownerId !== action.playerId) throw new Error("Cannot use an enemy merchant");
    if (merchant.type !== "merchant") throw new Error("Only a merchant can open a trade route");
    const dest = state.map.cities[action.cityId];
    if (!dest) throw new Error(`Unknown destination city ${action.cityId}`);
    if (distance(merchant.position, dest.position) > 1) {
      throw new Error("The merchant must stand at or beside the destination city");
    }
    const player = state.playersById[action.playerId];
    let home = null;
    let bestDist = Infinity;
    for (const cityId of player.cityIds) {
      if (cityId === dest.id) continue;
      const city = state.map.cities[cityId];
      if (!city) continue;
      const d = distance(city.position, dest.position);
      if (d < bestDist) {
        bestDist = d;
        home = city;
      }
    }
    if (!home) throw new Error("You need another city to anchor the trade route");
    const duplicate = state.tradeRoutes.some(
      (r) => r.ownerId === action.playerId && (r.fromCityId === home.id && r.toCityId === dest.id || r.fromCityId === dest.id && r.toCityId === home.id)
    );
    if (duplicate) throw new Error("That trade route already exists");
    const foreign = dest.ownerId !== action.playerId;
    const gold = tradeRouteValue(distance(home.position, dest.position), foreign);
    state.tradeRoutes.push({ ownerId: action.playerId, fromCityId: home.id, toCityId: dest.id, gold });
    delete state.map.units[merchant.id];
    syncOwnershipIndexes(state);
  }
  function applyImproveTile(state, action) {
    assertPlayerTurn(state, action.playerId);
    const tile = state.map.tiles[action.tileKey];
    if (!tile) throw new Error(`Unknown tile ${action.tileKey}`);
    const isWater = tile.terrain === "sea" || tile.terrain === "coast";
    const claim = claimingCity(state, parseKey(action.tileKey));
    if (!claim || claim.ownerId !== action.playerId) throw new Error("That tile is not in your territory");
    if (claim.id !== action.cityId) throw new Error("That city does not work this tile");
    if (action.improvement === "road") {
      if (isWater) throw new Error("Roads can't cross open water");
      if (!state.playersById[action.playerId].techs.includes("masonry")) throw new Error("Roads need the Masonry tech");
      if (tile.road) throw new Error("That tile already has a road");
      const item2 = `road:${action.tileKey}`;
      if ((claim.queue ?? []).includes(item2)) throw new Error("A road is already queued for that tile");
      enqueueProduction(claim, item2);
      return;
    }
    const rule = IMPROVEMENTS[action.improvement];
    if (!rule) throw new Error(`Unknown improvement ${action.improvement}`);
    if (tile.improvement) throw new Error("That tile is already improved");
    if (!rule.terrains.includes(tile.terrain)) {
      throw new Error(`${action.improvement} cannot be built on ${tile.terrain}`);
    }
    const owner = state.playersById[action.playerId];
    if (rule.requiresTech && !owner.techs.includes(rule.requiresTech)) {
      throw new Error(`${action.improvement} requires tech ${rule.requiresTech}`);
    }
    if (rule.requiresResource && !(tile.resource && rule.requiresResource.includes(tile.resource))) {
      throw new Error(`${action.improvement} needs a ${rule.requiresResource.join(" or ")} deposit`);
    }
    const item = `imp:${action.improvement}:${action.tileKey}`;
    const queued = (claim.queue ?? []).some((q) => q.startsWith("imp:") && q.endsWith(`:${action.tileKey}`));
    if (queued) throw new Error("An improvement is already queued for that tile");
    enqueueProduction(claim, item);
  }
  var HEAL_IN_CITY = 8;
  var HEAL_IN_TERRITORY = 4;
  var HEAL_IN_FIELD = 1;
  var CITY_REGEN = 3;
  var IDLE_PROD_RESERVE = 20;
  function restHealAmount(state, unit) {
    if (unit.hp >= unit.maxHp) return 0;
    if (unit.movementRemaining < movementBudgetFor(state, unit)) return 0;
    const cityHere = Object.values(state.map.cities).find(
      (c) => c.position.q === unit.position.q && c.position.r === unit.position.r
    );
    const owner = state.playersById[unit.ownerId];
    const medic = (owner?.techs.includes("medicine") ? 3 : 0) + playerPctMod(owner, "healPlus", categoryOf(unit));
    if (cityHere && cityHere.ownerId === unit.ownerId) return HEAL_IN_CITY + medic;
    const claim = claimingCity(state, unit.position);
    return (claim && claim.ownerId === unit.ownerId ? HEAL_IN_TERRITORY : HEAL_IN_FIELD) + medic;
  }
  var MOUNTAIN_PASS_ATTRITION = 3;
  var SCORCHED_ATTRITION = 3;
  var FABIAN_ATTRITION = 2;
  var SIEGE_LINES_BLEED = 4;
  var LEVY_TURNS = 4;
  var MOUNTAIN_PASS_TURNS = 2;
  var BULWARK_TURNS = 2;
  var FORCED_MARCH_TURNS = 3;
  var FABIAN_TURNS = 3;
  var SIEGE_TURNS = 3;
  var BRIDGE_TURNS = 2;
  function effectsList(state) {
    if (!state.activeEffects) state.activeEffects = [];
    return state.activeEffects;
  }
  function playerHasEffect(state, ownerId, kind) {
    return (state.activeEffects ?? []).some((e) => e.kind === kind && e.ownerId === ownerId && state.turn <= e.expiresTurn);
  }
  function unitHasEffect(state, unitId, kind) {
    return (state.activeEffects ?? []).some((e) => e.kind === kind && e.unitId === unitId && state.turn <= e.expiresTurn);
  }
  function cityEffect(state, cityId, kind) {
    return (state.activeEffects ?? []).find((e) => e.kind === kind && e.cityId === cityId && state.turn <= e.expiresTurn);
  }
  function addEffect(state, e) {
    const list = effectsList(state);
    let counter = 1;
    let id = `fx_${e.kind}_${state.turn}_${counter}`;
    while (list.some((x) => x.id === id)) {
      counter += 1;
      id = `fx_${e.kind}_${state.turn}_${counter}`;
    }
    const full = { id, ...e };
    list.push(full);
    return full;
  }
  function designatedUnit(state, playerId, unitId) {
    if (unitId) {
      const u = state.map.units[unitId];
      if (u && u.ownerId === playerId) return u;
    }
    const owned = Object.values(state.map.units).filter((u) => u.ownerId === playerId && !u.garrison && isLandMilitary(u)).sort((a, b) => a.id < b.id ? -1 : 1);
    return owned[0];
  }
  function playerCapital(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) return void 0;
    return player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) || state.map.cities[player.cityIds[0]];
  }
  function ringsFrom(state, center, maxRadius) {
    const seen = /* @__PURE__ */ new Set([keyOf(center)]);
    const out = [];
    let frontier = [center];
    for (let r = 0; r < maxRadius; r += 1) {
      const next = [];
      for (const c of frontier) {
        for (const n of neighborsOf(c)) {
          const k = keyOf(n);
          if (seen.has(k)) continue;
          seen.add(k);
          if (state.map.tiles[k]) {
            out.push(n);
            next.push(n);
          }
        }
      }
      frontier = next;
    }
    return out;
  }
  function tileOccupied(state, c) {
    for (const u of Object.values(state.map.units)) if (u.position.q === c.q && u.position.r === c.r) return true;
    return false;
  }
  function isOpenLandTile(state, c) {
    const t = state.map.tiles[keyOf(c)];
    if (!t) return false;
    const terr = TERRAIN[t.terrain];
    if (!terr || terr.navalOnly || terr.impassableWithoutTech) return false;
    return true;
  }
  function firstFreeLandNear(state, center, occupied) {
    const candidates = [center, ...ringsFrom(state, center, 6)];
    for (const c of candidates) {
      const k = keyOf(c);
      if (occupied.has(k)) continue;
      if (!isOpenLandTile(state, c)) continue;
      if (tileOccupied(state, c)) continue;
      if (cityAtPos(state, c)) continue;
      return c;
    }
    return void 0;
  }
  function spawnCardUnit(state, ownerId, type, pos, veterancy) {
    const def = UNITS[type];
    let counter = 1;
    let unitId = `${ownerId}_${type}_card_${state.turn}_${counter}`;
    while (state.map.units[unitId]) {
      counter += 1;
      unitId = `${ownerId}_${type}_card_${state.turn}_${counter}`;
    }
    const unit = {
      id: unitId,
      type,
      ownerId,
      position: { q: pos.q, r: pos.r },
      hp: def.maxHp,
      maxHp: def.maxHp,
      movementRemaining: 0,
      veterancy
    };
    state.map.units[unitId] = unit;
    syncOwnershipIndexes(state);
    return unit;
  }
  function straitBeside(state, from) {
    for (const w of neighborsOf(from)) {
      const wt = state.map.tiles[keyOf(w)];
      if (!wt) continue;
      const terr = TERRAIN[wt.terrain];
      if (!terr || !terr.navalOnly || wt.improvement === "bridge") continue;
      for (const l of neighborsOf(w)) {
        if (l.q === from.q && l.r === from.r) continue;
        const lt = state.map.tiles[keyOf(l)];
        if (lt && TERRAIN[lt.terrain] && !TERRAIN[lt.terrain].navalOnly) return w;
      }
    }
    return void 0;
  }
  function applyPlayEventCard(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    if (!player) throw new Error(`Unknown player ${action.playerId}`);
    const turn = state.turn;
    switch (action.instant) {
      // --- Simple instants (kept here so every card routes through one action) ---
      case "capital+10food": {
        const cap2 = playerCapital(state, player.id);
        if (!cap2) throw new Error("You have no city to feed.");
        cap2.food = (cap2.food ?? 0) + 10;
        break;
      }
      case "+15science": {
        player.science += 15;
        break;
      }
      // --- Caesar's Bridge / Xerxes' Pontoon — a temporary span ---
      case "bridge-adjacent-river-2-turns": {
        let placed;
        for (const u of Object.values(state.map.units).filter((x) => x.ownerId === player.id).sort((a, b) => a.id < b.id ? -1 : 1)) {
          for (const n of neighborsOf(u.position)) {
            const t = state.map.tiles[keyOf(n)];
            if (t && t.terrain === "great-river" && t.improvement !== "bridge") {
              t.improvement = "bridge";
              placed = keyOf(n);
              break;
            }
          }
          if (placed) break;
        }
        if (!placed) throw new Error("needs one of your armies beside a great river.");
        addEffect(state, { kind: "temp-bridge", ownerId: player.id, expiresTurn: turn + BRIDGE_TURNS, tileKey: placed, cardId: action.cardId });
        break;
      }
      case "bridge-sea-strait-2-turns": {
        let placed;
        for (const u of Object.values(state.map.units).filter((x) => x.ownerId === player.id).sort((a, b) => a.id < b.id ? -1 : 1)) {
          placed = straitBeside(state, u.position);
          if (placed) break;
        }
        if (!placed) throw new Error("needs one of your armies beside a one-hex sea strait.");
        const t = state.map.tiles[keyOf(placed)];
        t.improvement = "bridge";
        addEffect(state, { kind: "temp-bridge", ownerId: player.id, expiresTurn: turn + BRIDGE_TURNS, tileKey: keyOf(placed), cardId: action.cardId });
        break;
      }
      // --- Cincinnatus — an emergency levy as strong as the capital ---
      case "spawn-militia-capital-level": {
        const cap2 = playerCapital(state, player.id);
        if (!cap2) throw new Error("you have no capital to raise a levy from.");
        const spot = firstFreeLandNear(state, cap2.position, /* @__PURE__ */ new Set());
        if (!spot) throw new Error("there is no open ground by your capital for the levy.");
        const vet = cap2.population >= 12 ? "elite" : cap2.population >= 6 ? "veteran" : "recruit";
        const unit = spawnCardUnit(state, player.id, "warrior", spot, vet);
        addEffect(state, { kind: "levy", ownerId: player.id, expiresTurn: turn + LEVY_TURNS, unitId: unit.id, cardId: action.cardId });
        break;
      }
      // --- March of the Ten Thousand — a stranded army marches home intact ---
      case "retreat-army-to-nearest-city": {
        const candidates = (action.unitId ? [state.map.units[action.unitId]].filter((u) => !!u && u.ownerId === player.id) : Object.values(state.map.units).filter((u) => u.ownerId === player.id && !u.garrison && UNITS[u.type].domain === "land")).sort((a, b) => a.id < b.id ? -1 : 1);
        const stranded = action.unitId ? candidates : candidates.filter((u) => {
          const c = claimingCity(state, u.position);
          return !c || c.ownerId !== player.id;
        });
        if (!stranded.length) throw new Error("no stranded army to bring home.");
        const occupied = /* @__PURE__ */ new Set();
        let moved = 0;
        for (const u of stranded) {
          const home = nearestOwnCity(state, player.id, u.position);
          if (!home) throw new Error("you hold no city to retreat to.");
          const spot = firstFreeLandNear(state, home.position, occupied);
          if (!spot) continue;
          u.position = { q: spot.q, r: spot.r };
          u.movementRemaining = 0;
          occupied.add(keyOf(spot));
          moved += 1;
        }
        if (!moved) throw new Error("no clear ground by your cities to receive the army.");
        break;
      }
      // --- Ver Sacrum — the sacred spring sends youth to a distant new colony ---
      case "free-settler-4hex": {
        const cap2 = playerCapital(state, player.id);
        if (!cap2) throw new Error("you have no city to send out a colony from.");
        const cities = player.cityIds.map((id) => state.map.cities[id]).filter((c) => !!c);
        const farEnough = (c) => cities.every((ci) => distance(ci.position, c) >= 4);
        let spot;
        for (const c of ringsFrom(state, cap2.position, 12)) {
          if (!isOpenLandTile(state, c) || tileOccupied(state, c) || cityAtPos(state, c)) continue;
          if (farEnough(c)) {
            spot = c;
            break;
          }
        }
        if (!spot) throw new Error("no open land far enough for a new colony.");
        spawnCardUnit(state, player.id, "settler", spot, "recruit");
        break;
      }
      // --- Marius' Mules — the professional army out-marches everyone ---
      case "infantry+1move-3-turns": {
        addEffect(state, { kind: "forced-march", ownerId: player.id, expiresTurn: turn + FORCED_MARCH_TURNS, cardId: action.cardId });
        break;
      }
      // --- Hannibal Crosses the Alps — cross the "impassable" range (with attrition) ---
      case "cross-mountains-attrition": {
        addEffect(state, { kind: "mountain-pass", ownerId: player.id, expiresTurn: turn + MOUNTAIN_PASS_TURNS, cardId: action.cardId });
        break;
      }
      // --- Thermopylae's Stand — a unit holds a choke, unflankable ---
      case "pass-defense-immunity-2-turns": {
        const unit = designatedUnit(state, player.id, action.unitId);
        if (!unit) throw new Error("needs one of your units to hold the line.");
        addEffect(state, { kind: "bulwark", ownerId: player.id, expiresTurn: turn + BULWARK_TURNS, unitId: unit.id, cardId: action.cardId });
        break;
      }
      // --- Fabian Strategy — refuse decisive battle; the enemy bleeds giving chase ---
      case "withdraw-before-combat-3-turns": {
        addEffect(state, { kind: "fabian", ownerId: player.id, expiresTurn: turn + FABIAN_TURNS, cardId: action.cardId });
        break;
      }
      // --- Sacred Geese — the alarm is raised; the approaches are watched ---
      case "cancel-ambush-reveal-adjacent": {
        state.discovered = state.discovered ?? {};
        const seen = new Set(state.discovered[player.id] ?? []);
        const centres = [
          ...Object.values(state.map.units).filter((u) => u.ownerId === player.id).map((u) => u.position),
          ...player.cityIds.map((id) => state.map.cities[id]).filter((c) => !!c).map((c) => c.position)
        ];
        if (!centres.length) throw new Error("you have nothing left to keep watch.");
        for (const at of centres) {
          seen.add(keyOf(at));
          for (const c of ringsFrom(state, at, 2)) seen.add(keyOf(c));
        }
        state.discovered[player.id] = [...seen];
        break;
      }
      // --- Circumvallation — wall the city in: no relief, no healing, it bleeds ---
      case "siege-lines": {
        const city = besiegeableCity(state, player.id, action.cityId);
        if (!city) throw new Error("needs one of your armies beside an enemy city to invest it.");
        addEffect(state, { kind: "siege-lines", ownerId: player.id, expiresTurn: turn + SIEGE_TURNS, cityId: city.id, cardId: action.cardId });
        break;
      }
      // --- Evocatio — call out the city's gods; its defence and loyalty collapse ---
      case "besieged-city-loyalty-defense-down": {
        const city = besiegeableCity(state, player.id, action.cityId);
        if (!city) throw new Error("needs one of your armies beside the enemy city.");
        addEffect(state, { kind: "evocatio", ownerId: player.id, expiresTurn: turn + SIEGE_TURNS, cityId: city.id, cardId: action.cardId });
        break;
      }
      // --- Scorched Earth — burn your own province so the invader starves ---
      case "self-pillage-region-attrition": {
        const region = action.target ? state.map.tiles[keyOf(action.target)]?.region : playerCapital(state, player.id)?.position && state.map.tiles[keyOf(playerCapital(state, player.id).position)]?.region;
        if (!region) throw new Error("no home province to put to the torch.");
        for (const [k, t] of Object.entries(state.map.tiles)) {
          if (t.region !== region) continue;
          const owner = claimingCity(state, parseKey(k));
          if (!owner || owner.ownerId !== player.id) continue;
          if (t.improvement && t.improvement !== "bridge") t.improvement = void 0;
        }
        for (const c of Object.values(state.map.cities)) {
          if (c.ownerId !== player.id) continue;
          if (state.map.tiles[keyOf(c.position)]?.region !== region) continue;
          for (const d of c.districts ?? []) d.pillaged = true;
        }
        addEffect(state, { kind: "scorched-earth", ownerId: player.id, expiresTurn: turn + FABIAN_TURNS, region, cardId: action.cardId });
        break;
      }
      default:
        throw new Error(`isn't wired to the engine (${action.instant}).`);
    }
  }
  function besiegeableCity(state, playerId, cityId) {
    const beside = (city) => Object.values(state.map.units).some(
      (u) => u.ownerId === playerId && !u.garrison && distance(u.position, city.position) <= 1
    );
    if (cityId) {
      const c = state.map.cities[cityId];
      if (c && c.ownerId !== playerId && beside(c)) return c;
      return void 0;
    }
    return Object.values(state.map.cities).filter((c) => c.ownerId !== playerId && beside(c)).sort((a, b) => a.id < b.id ? -1 : 1)[0];
  }
  function tickHistoryEffects(state) {
    const list = state.activeEffects ?? [];
    if (!list.length) return;
    for (const e of list) {
      if (state.turn > e.expiresTurn) continue;
      if (e.kind === "mountain-pass") {
        for (const u of Object.values(state.map.units)) {
          if (u.ownerId !== e.ownerId) continue;
          const t = state.map.tiles[keyOf(u.position)];
          if (t && t.terrain === "mountains") u.hp = Math.max(1, u.hp - MOUNTAIN_PASS_ATTRITION);
        }
      } else if (e.kind === "scorched-earth") {
        for (const u of Object.values(state.map.units)) {
          if (u.ownerId === e.ownerId || !isAtWar(state, u.ownerId, e.ownerId)) continue;
          const t = state.map.tiles[keyOf(u.position)];
          if (t && t.region === e.region) u.hp = Math.max(1, u.hp - SCORCHED_ATTRITION);
        }
      } else if (e.kind === "fabian") {
        for (const u of Object.values(state.map.units)) {
          if (u.ownerId === e.ownerId || !isAtWar(state, u.ownerId, e.ownerId)) continue;
          const claim = claimingCity(state, u.position);
          if (claim && claim.ownerId === e.ownerId) u.hp = Math.max(1, u.hp - FABIAN_ATTRITION);
        }
      } else if (e.kind === "siege-lines") {
        const city = e.cityId ? state.map.cities[e.cityId] : void 0;
        if (city) city.hp = Math.max(1, city.hp - SIEGE_LINES_BLEED);
      }
    }
    const kept = [];
    for (const e of list) {
      if (state.turn <= e.expiresTurn) {
        kept.push(e);
        continue;
      }
      if (e.kind === "temp-bridge" && e.tileKey) {
        const t = state.map.tiles[e.tileKey];
        if (t && t.improvement === "bridge") t.improvement = void 0;
      } else if (e.kind === "levy" && e.unitId) {
        const u = state.map.units[e.unitId];
        if (u) {
          delete state.map.units[e.unitId];
          const owner = state.playersById[u.ownerId];
          if (owner) owner.unitIds = owner.unitIds.filter((id) => id !== e.unitId);
        }
      }
    }
    state.activeEffects = kept;
  }
  function applyEndTurn(state, action) {
    assertPlayerTurn(state, action.playerId);
    const endingPlayer = getCurrentPlayer(state);
    const mult = aiEconomyMultiplier(state, endingPlayer.id);
    const foodByCity = {};
    let foodProd = 0;
    for (const cityId of endingPlayer.cityIds) {
      const gained = Math.round(computeCityYield(state, cityId).food * mult);
      foodByCity[cityId] = gained;
      foodProd += gained;
    }
    const foodUpkeep = playerFoodUpkeep(state, endingPlayer.id);
    const net = foodProd - foodUpkeep;
    const foodMult = foodProd > 0 ? Math.max(0, net / foodProd) : 0;
    for (const cityId of endingPlayer.cityIds) {
      const yields = computeCityYield(state, cityId);
      endingPlayer.gold += Math.round(yields.gold * mult);
      endingPlayer.science += Math.round(yields.science * mult);
      const city = state.map.cities[cityId];
      if (city) {
        city.food = (city.food ?? 0) + Math.round((foodByCity[cityId] ?? 0) * foodMult);
        let need = growthCost(city.population);
        while (city.population < MAX_POPULATION && city.food >= need) {
          city.food -= need;
          city.population += 1;
          need = growthCost(city.population);
        }
        city.production = (city.production ?? 0) + Math.round(yields.production * mult);
        processCityQueue(state, city);
        if ((city.queue ?? []).length === 0 && (city.production ?? 0) > IDLE_PROD_RESERVE) {
          const surplus = (city.production ?? 0) - IDLE_PROD_RESERVE;
          endingPlayer.gold += Math.floor(surplus / 3);
          city.production = IDLE_PROD_RESERVE;
        }
        if (city.hp < city.maxHp && (city.lastAttackedTurn ?? -1) < state.turn && !cityEffect(state, city.id, "siege-lines")) {
          city.hp = Math.min(city.maxHp, city.hp + CITY_REGEN);
        }
      }
    }
    if (net < 0) {
      let deficit = -net;
      for (const cityId of endingPlayer.cityIds) {
        if (deficit <= 0) break;
        const city = state.map.cities[cityId];
        if (!city) continue;
        const take = Math.min(city.food ?? 0, deficit);
        city.food = (city.food ?? 0) - take;
        deficit -= take;
      }
    }
    const perks = endingPlayer.perks;
    if (perks) {
      endingPlayer.gold += perks.gold ?? 0;
      endingPlayer.science += perks.science ?? 0;
      if (perks.food || perks.production) {
        const cap2 = endingPlayer.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) || state.map.cities[endingPlayer.cityIds[0]];
        if (cap2) {
          cap2.food = (cap2.food ?? 0) + (perks.food ?? 0);
          cap2.production = (cap2.production ?? 0) + (perks.production ?? 0);
        }
      }
    }
    const upkeep = endingPlayer.unitIds.reduce((sum, unitId) => {
      const unit = state.map.units[unitId];
      if (!unit || unit.garrison) return sum;
      return sum + (UNITS[unit.type].upkeep || 0);
    }, 0);
    endingPlayer.gold -= upkeep;
    pruneTradeRoutes(state);
    endingPlayer.gold += tradeRouteIncome(state, endingPlayer.id);
    for (const unitId of endingPlayer.unitIds) {
      const unit = state.map.units[unitId];
      if (!unit) continue;
      const amount = restHealAmount(state, unit);
      if (amount > 0) unit.hp = Math.min(unit.maxHp, unit.hp + amount);
    }
    applyDiplomacyIncome(state, endingPlayer);
    loseShipsAtSea(state, endingPlayer);
    excavateRuins(state, endingPlayer.id);
    contactVillages(state, endingPlayer.id);
    contactCivs(state, endingPlayer.id);
    refreshGarrisons(state, endingPlayer);
    const n = state.players.length;
    const prevTurn = state.turn;
    if (n >= 3 && state.rotateInitiative !== false) {
      const roundStart = (state.turn - 1) % n;
      if ((state.currentPlayerIndex + 1) % n === roundStart) {
        state.turn += 1;
        state.currentPlayerIndex = (state.turn - 1) % n;
      } else {
        state.currentPlayerIndex = (state.currentPlayerIndex + 1) % n;
      }
    } else {
      state.currentPlayerIndex += 1;
      if (state.currentPlayerIndex >= n) {
        state.currentPlayerIndex = 0;
        state.turn += 1;
      }
    }
    if (state.turn !== prevTurn) {
      state.weather.current = generateWeatherByRegion(state, state.turn);
      state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
      applyRelationDrift(state);
      expireDiplomacy(state);
      for (const p of state.players) {
        if (p.vassalOf && shouldRebel(state, p.id, (cid) => computeCityStability(state, cid))) {
          const overlord = p.vassalOf;
          p.vassalOf = void 0;
          p.overlordMilBaseline = void 0;
          adjustRelation(state, p.id, overlord, -60);
          enterWar(state, p.id, overlord);
        }
      }
      resolveRaids(state);
      scheduleRaid(state);
      tickHistoryEffects(state);
    }
    const nextPlayer = getCurrentPlayer(state);
    for (const unitId of nextPlayer.unitIds) {
      const unit = state.map.units[unitId];
      if (!unit) continue;
      unit.movementRemaining = movementBudgetFor(state, unit);
      const unitTile = tileAt(state, unit.position);
      if (unit.type === "trireme" && unitTile.terrain === "sea" && state.weather.current[unitTile.region] === "storm") {
        unit.hp = Math.max(1, unit.hp - 2);
      }
    }
    maybeFireFigure(state, nextPlayer);
    maybeFireEvent(state, nextPlayer);
  }
  function maybeFireEvent(state, player) {
    if (player.pendingEvent || player.pendingFigure || player.pendingRaid) return;
    if (player.cityIds.length === 0) return;
    const since = state.turn - (player.lastEventTurn ?? 0);
    if (state.turn < 3 || since < 5) return;
    const roll = seededRandom(state.seed, `event:${state.turn}:${player.id}`)();
    if (roll >= 0.3) return;
    const pick = Math.floor(seededRandom(state.seed, `eventpick:${state.turn}:${player.id}`)() * EVENTS.length);
    player.pendingEvent = EVENTS[Math.min(pick, EVENTS.length - 1)].id;
    player.lastEventTurn = state.turn;
  }
  function applyResolveEvent(state, action) {
    const player = state.playersById[action.playerId];
    if (!player) throw new Error(`Unknown player ${action.playerId}`);
    if (player.pendingEvent !== action.eventId) {
      throw new Error(`No pending event ${action.eventId} for ${action.playerId}`);
    }
    const event = getEvent(action.eventId);
    const option = event && event.options[action.optionIndex];
    if (!event || !option) throw new Error(`Invalid event option`);
    const capitalCity = player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) || state.map.cities[player.cityIds[0]];
    const fx = option.effects;
    if (fx.gold) player.gold += fx.gold;
    if (fx.production && capitalCity) capitalCity.production = (capitalCity.production ?? 0) + fx.production;
    if (fx.science) player.science += fx.science;
    if (fx.food) {
      for (const cityId of player.cityIds) {
        const city = state.map.cities[cityId];
        if (city) city.food = (city.food ?? 0) + fx.food;
      }
    }
    if (fx.spawnUnit && UNITS[fx.spawnUnit]) {
      const capital = player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) || state.map.cities[player.cityIds[0]];
      if (capital) {
        const def = UNITS[fx.spawnUnit];
        let counter = 1;
        let unitId = `${player.id}_${fx.spawnUnit}_event_${state.turn}_${counter}`;
        while (state.map.units[unitId]) {
          counter += 1;
          unitId = `${player.id}_${fx.spawnUnit}_event_${state.turn}_${counter}`;
        }
        state.map.units[unitId] = {
          id: unitId,
          type: fx.spawnUnit,
          ownerId: player.id,
          position: { ...capital.position },
          hp: def.maxHp,
          maxHp: def.maxHp,
          movementRemaining: 0,
          veterancy: "recruit"
        };
        syncOwnershipIndexes(state);
      }
    }
    player.pendingEvent = void 0;
  }
  var FIGURE_START_TURN = 5;
  var FIGURE_CHANCE = 0.22;
  var FIGURE_SPACING = 6;
  function figureContext(state, player) {
    const coastal = player.cityIds.some((id) => isCoastalCity(state, id));
    const navalThreat = (state.raids ?? []).some((r) => {
      const c = state.map.cities[r.targetCityId];
      return !!c && c.ownerId === player.id;
    });
    const atSea = player.unitIds.some((id) => {
      const u = state.map.units[id];
      return !!u && openSeaDistance(state, u.position) > 0;
    });
    const atWar = state.players.some((o) => o.id !== player.id && isAtWar(state, player.id, o.id));
    const population = player.cityIds.reduce((n, id) => n + (state.map.cities[id]?.population ?? 0), 0);
    return {
      coastal,
      navalThreat,
      atSea,
      atWar,
      cityCount: player.cityIds.length,
      age: playerAge(player),
      foundRuins: (player.codex ?? []).length > 0,
      gold: player.gold,
      unitCount: player.unitIds.length,
      population
    };
  }
  function maybeFireFigure(state, player) {
    if (player.pendingEvent || player.pendingFigure || player.pendingRaid) return;
    if (player.cityIds.length === 0) return;
    if (state.turn < FIGURE_START_TURN) return;
    if (state.turn - (player.lastFigureTurn ?? 0) < FIGURE_SPACING) return;
    if (seededRandom(state.seed, `figure:${state.turn}:${player.id}`)() >= FIGURE_CHANCE) return;
    const ctx = figureContext(state, player);
    const met = new Set(player.metFigures ?? []);
    const eligible = FIGURES.filter(
      (f) => !met.has(f.id) && (!f.civ || playerControlsCiv(player, f.civ)) && f.when(ctx)
    );
    if (eligible.length === 0) return;
    const pick = Math.floor(seededRandom(state.seed, `figurepick:${state.turn}:${player.id}`)() * eligible.length);
    const figure = eligible[Math.min(pick, eligible.length - 1)];
    player.pendingFigure = figure.id;
    player.metFigures = [...player.metFigures ?? [], figure.id];
    player.lastFigureTurn = state.turn;
  }
  function applyResolveFigure(state, action) {
    const player = state.playersById[action.playerId];
    if (!player) throw new Error(`Unknown player ${action.playerId}`);
    if (player.pendingFigure !== action.figureId) {
      throw new Error(`No pending figure ${action.figureId} for ${action.playerId}`);
    }
    const figure = getFigure(action.figureId);
    const option = figure && figure.options[action.optionIndex];
    if (!figure || !option) throw new Error(`Invalid figure option`);
    applyFigureEffects(state, player, option.effects);
    player.pendingFigure = void 0;
  }
  var VET_STEP = { recruit: "veteran", veteran: "elite", elite: "elite" };
  function capitalOf(state, player) {
    return player.cityIds.map((id) => state.map.cities[id]).find((c) => c && c.isCapital) || state.map.cities[player.cityIds[0]];
  }
  function applyFigureEffects(state, player, fx) {
    if (fx.gold) player.gold += fx.gold;
    if (fx.science) player.science += fx.science;
    const capital = capitalOf(state, player);
    if (fx.production && capital) capital.production = (capital.production ?? 0) + fx.production;
    if (fx.food) {
      for (const cityId of player.cityIds) {
        const city = state.map.cities[cityId];
        if (city) city.food = (city.food ?? 0) + fx.food;
      }
    }
    if (fx.spawnUnit && UNITS[fx.spawnUnit] && capital) {
      const def = UNITS[fx.spawnUnit];
      let counter = 1;
      let unitId = `${player.id}_${fx.spawnUnit}_figure_${state.turn}_${counter}`;
      while (state.map.units[unitId]) {
        counter += 1;
        unitId = `${player.id}_${fx.spawnUnit}_figure_${state.turn}_${counter}`;
      }
      state.map.units[unitId] = {
        id: unitId,
        type: fx.spawnUnit,
        ownerId: player.id,
        position: { ...capital.position },
        hp: def.maxHp,
        maxHp: def.maxHp,
        movementRemaining: 0,
        veterancy: "recruit"
      };
      syncOwnershipIndexes(state);
    }
    if (fx.xp) {
      for (const uid of player.unitIds) {
        const u = state.map.units[uid];
        if (u) u.veterancy = VET_STEP[u.veterancy ?? "recruit"] ?? "veteran";
      }
    }
    if (fx.heal) {
      for (const uid of player.unitIds) {
        const u = state.map.units[uid];
        if (u) u.hp = u.maxHp;
      }
    }
    if (fx.techUnlock && TECHS[fx.techUnlock] && !player.techs.includes(fx.techUnlock)) {
      player.techs.push(fx.techUnlock);
    }
    if (fx.reveal && capital) {
      state.discovered = state.discovered ?? {};
      const seen = new Set(state.discovered[player.id] ?? []);
      const at = capital.position;
      seen.add(keyOf(at));
      for (const n of neighborsOf(at)) {
        seen.add(keyOf(n));
        for (const nn of neighborsOf(n)) if (state.map.tiles[keyOf(nn)]) seen.add(keyOf(nn));
      }
      state.discovered[player.id] = [...seen];
    }
    if (fx.seaReach) {
      player.perks = player.perks ?? {};
      player.perks.seaReach = (player.perks.seaReach ?? 0) + fx.seaReach;
    }
    if (fx.perks) {
      player.perks = player.perks ?? {};
      for (const [key, value] of Object.entries(fx.perks)) {
        if (typeof value === "number") {
          const k = key;
          player.perks[k] = (player.perks[k] ?? 0) + value;
        }
      }
    }
    if (fx.cancelRaids) {
      const before = state.raids ?? [];
      const doomed = before.filter((r) => {
        const c = state.map.cities[r.targetCityId];
        return !!c && c.ownerId === player.id;
      });
      if (doomed.length) {
        state.raids = before.filter((r) => !doomed.includes(r));
        player.pendingRaid = void 0;
        state.raidReports = [
          ...state.raidReports ?? [],
          ...doomed.map((r) => {
            const c = state.map.cities[r.targetCityId];
            return { kind: "burned", cityId: r.targetCityId, cityName: c ? cityDisplayName(c) : r.targetCityId, playerId: player.id, strength: r.strength };
          })
        ];
      }
    }
  }
  function applyFoundCity(state, action) {
    assertPlayerTurn(state, action.playerId);
    assertPlayerTurn(state, action.playerId);
    const settler = unitAt(state, action.settlerId);
    if (settler.ownerId !== action.playerId) throw new Error("Cannot use enemy settler");
    if (settler.type !== "settler") throw new Error("Only settler can found a city");
    if (state.map.cities[action.cityId]) throw new Error(`City id ${action.cityId} already exists`);
    const here = tileAt(state, settler.position);
    if (here.terrain === "sea" || here.terrain === "coast") throw new Error("Cannot found a city on open water");
    for (const city of Object.values(state.map.cities)) {
      if (city.position.q === settler.position.q && city.position.r === settler.position.r) {
        throw new Error("A city already exists on this tile");
      }
    }
    state.map.cities[action.cityId] = {
      id: action.cityId,
      ownerId: action.playerId,
      position: { ...settler.position },
      population: 1,
      hp: 40,
      maxHp: 40
    };
    delete state.map.units[settler.id];
    syncOwnershipIndexes(state);
  }
  function upgradeTargetFor(player, unit) {
    for (const [type, rule] of Object.entries(UNITS)) {
      if (rule.upgradesFrom !== unit.type) continue;
      if (rule.civ && !playerControlsCiv(player, rule.civ)) continue;
      if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) continue;
      return type;
    }
    return null;
  }
  function upgradeCost(fromType, toType) {
    const base = UNIT_BUILD_COSTS[toType] ?? 24;
    const had = UNIT_BUILD_COSTS[fromType] ?? 0;
    return Math.max(12, Math.round((base - had) * 1.5) + 12);
  }
  function applyUpgradeUnit(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    const unit = state.map.units[action.unitId];
    if (!unit) throw new Error(`Unknown unit ${action.unitId}`);
    if (unit.ownerId !== action.playerId) throw new Error("Cannot upgrade another player's unit");
    const target = upgradeTargetFor(player, unit);
    if (!target) throw new Error(`No upgrade available for ${unit.type}`);
    const cost = upgradeCost(unit.type, target);
    if (player.gold < cost) throw new Error(`Insufficient gold to upgrade: needs ${cost}, has ${player.gold}`);
    player.gold -= cost;
    const rule = UNITS[target];
    const frac = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
    unit.type = target;
    unit.maxHp = rule.maxHp;
    unit.hp = Math.max(1, Math.round(rule.maxHp * frac));
  }
  function nearestOwnCity(state, ownerId, from) {
    let best;
    let bestD = Infinity;
    for (const c of Object.values(state.map.cities)) {
      if (c.ownerId !== ownerId) continue;
      const d = distance(c.position, from);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best;
  }
  function applyDisbandUnit(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    const unit = state.map.units[action.unitId];
    if (!unit) throw new Error(`Unknown unit ${action.unitId}`);
    if (unit.ownerId !== action.playerId) throw new Error("Cannot disband another player's unit");
    if (unit.garrison) throw new Error("A city garrison cannot be disbanded");
    const def = UNITS[unit.type];
    const isCitizenMilitary = def && def.domain !== "civilian" && !unit.mercenary;
    if (isCitizenMilitary) {
      let home = unit.homeCityId ? state.map.cities[unit.homeCityId] : void 0;
      if (!home || home.ownerId !== player.id) home = nearestOwnCity(state, player.id, unit.position);
      if (home) {
        const frac = unit.maxHp > 0 ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 0;
        if (frac >= 1) home.population += 1;
        else home.food = (home.food ?? 0) + frac * growthCost(home.population);
      }
    }
    delete state.map.units[action.unitId];
    syncOwnershipIndexes(state);
  }
  function applyBuildUnit(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = cityAt(state, action.cityId);
    if (city.ownerId !== action.playerId) throw new Error("Cannot build from enemy city");
    if (!UNITS[action.unitType]) throw new Error(`Unknown unit type ${action.unitType}`);
    const player = state.playersById[action.playerId];
    const unitRule = UNITS[action.unitType];
    if (unitRule.requiresTech && !player.techs.includes(unitRule.requiresTech)) {
      throw new Error(`Unit ${action.unitType} requires tech ${unitRule.requiresTech}`);
    }
    if (unitRule.civ && !playerControlsCiv(player, unitRule.civ)) {
      throw new Error(`Unit ${action.unitType} is unique to ${unitRule.civ}`);
    }
    if (unitRule.domain === "naval" && !isCoastalCity(state, action.cityId)) {
      throw new Error(`Ships can only be built in a coastal city`);
    }
    if (unitRule.buildCap) {
      let count = 0;
      for (const id of player.unitIds) {
        const u = state.map.units[id];
        if (u && u.type === action.unitType) count += 1;
      }
      for (const cid of player.cityIds) {
        const c = state.map.cities[cid];
        if (c) {
          for (const q of c.queue ?? []) if (q === action.unitType) count += 1;
        }
      }
      if (count >= unitRule.buildCap) throw new Error(`You may field at most ${unitRule.buildCap} ${action.unitType}`);
    }
    enqueueProduction(city, action.unitType);
  }
  var OPEN_SEA_MARGIN = 8;
  var LOST_AT_SEA_DIST = 7;
  function openSeaDistance(state, pos) {
    return state.map.tiles[keyOf(pos)]?.open ?? 0;
  }
  function loseShipsAtSea(state, player) {
    state.lostAtSea = [];
    const reach = LOST_AT_SEA_DIST + (player.perks?.seaReach ?? 0);
    for (const unitId of [...player.unitIds]) {
      const unit = state.map.units[unitId];
      if (!unit) continue;
      if (openSeaDistance(state, unit.position) < reach) continue;
      delete state.map.units[unitId];
      player.unitIds = player.unitIds.filter((id) => id !== unitId);
      state.lostAtSea.push({ playerId: player.id, unitId, type: unit.type });
    }
    if (state.lostAtSea.length) syncOwnershipIndexes(state);
  }
  function addOpenSeaMargin(map) {
    const region = map.regions?.[0] ?? "core";
    const seen = new Set(Object.keys(map.tiles));
    let frontier = Object.keys(map.tiles).map(parseKey);
    for (let ring = 1; ring <= OPEN_SEA_MARGIN; ring += 1) {
      const next = [];
      for (const c of frontier) {
        for (const n of neighborsOf(c)) {
          const k = keyOf(n);
          if (seen.has(k)) continue;
          seen.add(k);
          map.tiles[k] = { terrain: "sea", region, open: ring };
          next.push(n);
        }
      }
      frontier = next;
    }
  }
  var RAID_START_TURN = 6;
  var RAID_WARN_LEAD = 1;
  var RAID_MAX_ACTIVE = 2;
  var RAID_CHANCE = 0.28;
  var cityDisplayName = (city) => city.name || city.id;
  function raidTributeCost(raid) {
    return Math.round(raid.strength * 1.5 + 8);
  }
  function raidableCities(state) {
    return Object.values(state.map.cities).filter((c) => isCoastalCity(state, c.id)).sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  }
  function beltTileNear(state, city) {
    let best;
    let bestKey = "";
    let bestDist = Infinity;
    for (const [key, tile] of Object.entries(state.map.tiles)) {
      if (!tile.open) continue;
      const pos = parseKey(key);
      const d = distance(pos, city.position);
      if (d < bestDist || d === bestDist && key < bestKey) {
        bestDist = d;
        bestKey = key;
        best = pos;
      }
    }
    return best;
  }
  function raidDefense(state, city) {
    const owner = state.playersById[city.ownerId];
    const age = playerAge(owner);
    let defense = 8 + age * 4 + city.hp / Math.max(1, city.maxHp) * 6;
    if ((city.buildings ?? []).includes("harbor")) defense += 5;
    let naval = false;
    for (const unit of Object.values(state.map.units)) {
      if (unit.ownerId !== city.ownerId) continue;
      const def = UNITS[unit.type];
      if (!def) continue;
      const dist = distance(unit.position, city.position);
      if (dist > 1) continue;
      const value = (def.defense ?? 0) * (unit.hp / Math.max(1, unit.maxHp)) * veterancyMultiplier(unit.veterancy);
      if (def.domain === "naval") {
        defense += value * 1.3;
        naval = true;
      } else if (def.domain === "land") {
        defense += dist === 0 ? value : value * 0.6;
      }
    }
    return { defense, naval };
  }
  function resolveRaids(state) {
    state.raidReports = [];
    const raids = state.raids ?? [];
    const survivors = [];
    for (const raid of raids) {
      const city = state.map.cities[raid.targetCityId];
      if (!city) continue;
      if (raid.strikeTurn > state.turn) {
        survivors.push(raid);
        continue;
      }
      const owner = state.playersById[city.ownerId];
      const { defense, naval } = raidDefense(state, city);
      const report = {
        kind: "repelled",
        cityId: city.id,
        cityName: cityDisplayName(city),
        playerId: city.ownerId,
        strength: raid.strength
      };
      if (defense >= raid.strength) {
        if (naval) {
          report.kind = "sunk";
          report.goldGained = Math.round(raid.strength * 0.5);
          if (owner) owner.gold += report.goldGained;
        }
      } else {
        report.kind = "pillaged";
        const overrun = raid.strength - defense;
        report.goldLost = Math.min(owner?.gold ?? 0, Math.round(overrun * 2 + 6));
        report.hpLost = Math.min(Math.max(0, city.hp - 1), Math.round(overrun * 1.5));
        report.popLost = raid.strength >= defense * 2 && city.population > 1 ? 1 : 0;
        if (owner) owner.gold -= report.goldLost;
        city.hp = Math.max(1, city.hp - (report.hpLost ?? 0));
        city.population = Math.max(1, city.population - (report.popLost ?? 0));
        city.lastAttackedTurn = state.turn;
      }
      state.raidReports.push(report);
    }
    state.raids = survivors;
    const liveIds = new Set(survivors.map((r) => r.id));
    for (const p of state.players) {
      if (p.pendingRaid && !liveIds.has(p.pendingRaid)) p.pendingRaid = void 0;
    }
  }
  function scheduleRaid(state) {
    if (state.turn < RAID_START_TURN) return;
    const active = state.raids ?? [];
    if (active.length >= RAID_MAX_ACTIVE) return;
    const targets = raidableCities(state).filter(
      (c) => !active.some((r) => r.targetCityId === c.id)
    );
    if (targets.length === 0) return;
    const roll = seededRandom(state.seed, `raid:${state.turn}`)();
    if (roll >= RAID_CHANCE) return;
    const pickRand = seededRandom(state.seed, `raidtarget:${state.turn}`)();
    const city = targets[Math.min(targets.length - 1, Math.floor(pickRand * targets.length))];
    const owner = state.playersById[city.ownerId];
    const era = playerAge(owner);
    const wealth = Math.min(16, (city.population ?? 1) * 1.5 + Math.floor((owner?.gold ?? 0) / 40));
    const powerRand = seededRandom(state.seed, `raidpower:${state.turn}`)();
    const strength = Math.round((12 + (era - 1) * 14 + wealth) * (0.85 + 0.4 * powerRand));
    const raid = {
      id: `raid_${state.turn}_${city.id}`,
      targetCityId: city.id,
      approach: beltTileNear(state, city),
      warnTurn: state.turn,
      strikeTurn: state.turn + RAID_WARN_LEAD,
      strength,
      era
    };
    state.raids = [...active, raid];
    state.raidReports = [
      ...state.raidReports ?? [],
      {
        kind: "warning",
        cityId: city.id,
        cityName: cityDisplayName(city),
        playerId: city.ownerId,
        strength,
        approach: raid.approach,
        strikeTurn: raid.strikeTurn
      }
    ];
    if (owner && !owner.pendingRaid) owner.pendingRaid = raid.id;
  }
  function applyResolveRaid(state, action) {
    const player = state.playersById[action.playerId];
    if (!player) throw new Error(`Unknown player ${action.playerId}`);
    const raid = (state.raids ?? []).find((r) => r.id === action.raidId);
    if (!raid) {
      player.pendingRaid = void 0;
      return;
    }
    if (action.choice === "tribute") {
      const cost = raidTributeCost(raid);
      if (player.gold >= cost) {
        player.gold -= cost;
        state.raids = (state.raids ?? []).filter((r) => r.id !== raid.id);
        const city = state.map.cities[raid.targetCityId];
        state.raidReports = [
          ...state.raidReports ?? [],
          {
            kind: "bought-off",
            cityId: raid.targetCityId,
            cityName: city ? cityDisplayName(city) : raid.targetCityId,
            playerId: player.id,
            strength: raid.strength,
            goldPaid: cost
          }
        ];
      }
    }
    player.pendingRaid = void 0;
  }
  function createInitialGameState(config = {}) {
    const players = normalizePlayers(config.players);
    const map = normalizeMap(config.map);
    addOpenSeaMargin(map);
    const state = {
      version: 1,
      seed: String(config.seed || "hegemon-seed"),
      turn: 1,
      turnLimit: config.turnLimit ?? 60,
      difficulty: config.difficulty ?? "normal",
      humanPlayerId: config.humanPlayerId ?? null,
      currentPlayerIndex: 0,
      players,
      playersById: makePlayersById(players),
      map,
      weather: { current: {}, forecast: {} },
      tradeRoutes: [],
      actionLog: [],
      costScale: mapCostScale(map.width, map.height),
      allianceVictory: config.allianceVictory ?? true,
      rotateInitiative: config.rotateInitiative ?? true
    };
    syncOwnershipIndexes(state);
    initDiplomacy(state);
    if (!state.map.ruins) state.map.ruins = scatterRuins(state.map, state.seed);
    if (!state.map.villages) state.map.villages = scatterVillages(state.map, state.seed, new Set(Object.keys(state.map.ruins)));
    state.weather.current = generateWeatherByRegion(state, state.turn);
    state.weather.forecast = generateWeatherByRegion(state, state.turn + 1);
    return state;
  }
  function cityTerritoryRadius(city) {
    const pop = city.population || 1;
    if (pop <= 2) return 1;
    if (pop <= 5) return 2;
    return 3;
  }
  function computeTerritory(state) {
    const claim = {};
    for (const city of Object.values(state.map.cities)) {
      const rad = cityTerritoryRadius(city);
      for (let dq = -rad; dq <= rad; dq += 1) {
        for (let dr = -rad; dr <= rad; dr += 1) {
          const d = distance({ q: 0, r: 0 }, { q: dq, r: dr });
          if (d > rad) continue;
          const key = `${city.position.q + dq},${city.position.r + dr}`;
          const tile = state.map.tiles[key];
          if (!tile || tile.terrain === "sea") continue;
          const existing = claim[key];
          if (!existing || d < existing.dist) claim[key] = { owner: city.ownerId, dist: d };
        }
      }
    }
    const result = {};
    for (const [key, v] of Object.entries(claim)) result[key] = v.owner;
    return result;
  }
  function claimingCity(state, coord) {
    let best = null;
    let bestDist = Infinity;
    for (const city of Object.values(state.map.cities)) {
      const d = distance(city.position, coord);
      if (d > cityTerritoryRadius(city)) continue;
      if (d < bestDist) {
        bestDist = d;
        best = city;
      }
    }
    return best;
  }
  var DIFFICULTY_AI_MULTIPLIER = {
    easy: 0.7,
    normal: 1,
    hard: 1.4
  };
  function aiEconomyMultiplier(state, playerId) {
    if (!state.humanPlayerId || playerId === state.humanPlayerId) return 1;
    return DIFFICULTY_AI_MULTIPLIER[state.difficulty] ?? 1;
  }
  function computePlayerIncome(state, playerId) {
    const player = state.playersById[playerId];
    const income = { food: 0, production: 0, gold: 0, science: 0 };
    if (!player) return income;
    const mult = aiEconomyMultiplier(state, playerId);
    for (const cityId of player.cityIds) {
      if (!state.map.cities[cityId]) continue;
      const y = computeCityYield(state, cityId);
      income.food += Math.round(y.food * mult);
      income.production += Math.round(y.production * mult);
      income.gold += Math.round(y.gold * mult);
      income.science += Math.round(y.science * mult);
    }
    const upkeep = player.unitIds.reduce((sum, id) => {
      const u = state.map.units[id];
      return sum + (u && !u.garrison ? UNITS[u.type].upkeep || 0 : 0);
    }, 0);
    income.gold -= upkeep;
    income.gold += tradeRouteIncome(state, playerId);
    income.food -= playerFoodUpkeep(state, playerId);
    const perks = player.perks;
    if (perks) {
      income.food += perks.food ?? 0;
      income.production += perks.production ?? 0;
      income.gold += perks.gold ?? 0;
      income.science += perks.science ?? 0;
    }
    return income;
  }
  function computeScores(state) {
    const territory = computeTerritory(state);
    const land = {};
    for (const owner of Object.values(territory)) land[owner] = (land[owner] ?? 0) + 1;
    const scores = {};
    for (const player of state.players) {
      const population = player.cityIds.reduce((s, id) => s + (state.map.cities[id]?.population ?? 0), 0);
      scores[player.id] = player.cityIds.length * 10 + population * 3 + player.techs.length * 6 + player.unitIds.length * 2 + (land[player.id] ?? 0) * 1 + Math.floor(player.gold / 10);
    }
    return scores;
  }
  function getVictoryStatus(state) {
    const capitals = Object.values(state.map.cities).filter((city) => city.isCapital);
    if (capitals.length > 0) {
      const owner = topOverlord(state, capitals[0].ownerId);
      if (capitals.every((city) => topOverlord(state, city.ownerId) === owner)) {
        return { winnerId: owner, type: "domination", reason: `${owner} controls all capitals (directly or through vassals)` };
      }
    }
    if (state.allianceVictory !== false && capitals.length > 0) {
      for (const [a, b] of fullAlliancesHeld(state, ALLIANCE_VICTORY_HOLD)) {
        if (capitals.every((city) => {
          const t = topOverlord(state, city.ownerId);
          return t === a || t === b;
        })) {
          const scores = computeScores(state);
          const lead = (scores[a] ?? 0) >= (scores[b] ?? 0) ? a : b;
          return { winnerId: lead, type: "alliance", allies: [a, b], reason: `${a} & ${b} share the world through their Full Alliance` };
        }
      }
    }
    if (state.turnLimit && state.turn > state.turnLimit) {
      const scores = computeScores(state);
      let bestId = null;
      let best = -Infinity;
      for (const player of state.players) {
        const s = scores[player.id] ?? 0;
        if (s > best) {
          best = s;
          bestId = player.id;
        }
      }
      if (bestId) {
        return { winnerId: bestId, type: "score", reason: `${bestId} led on score at the turn limit (${state.turnLimit})` };
      }
    }
    return { winnerId: null, type: null, reason: null };
  }
  var DISTRICT_GOLD_COST = 40;
  var DISTRICT_REPAIR_LABOUR = 15;
  function applyBuildDistrict(state, action) {
    assertPlayerTurn(state, action.playerId);
    const player = state.playersById[action.playerId];
    const city = state.map.cities[action.cityId];
    if (!city || city.ownerId !== action.playerId) throw new Error("You can only build districts in your own city");
    const gw = greatWork(action.districtType);
    const dt = gw ? districtType("greatwork") : districtType(action.districtType);
    if (!dt) throw new Error(`Unknown district type ${action.districtType}`);
    city.districts = city.districts ?? [];
    if (city.districts.length >= districtSlots(city)) throw new Error("No free district slot at this city's tier");
    const adj = neighborsOf(city.position).map((n) => keyOf(n));
    if (!adj.includes(action.hex)) throw new Error("A district must sit on a hex adjacent to the city");
    if (city.districts.some((d) => d.hex === action.hex)) throw new Error("That hex already holds a district");
    const tile = state.map.tiles[action.hex];
    if (!tile) throw new Error("No such tile");
    const water = tile.terrain === "coast" || tile.terrain === "sea";
    if (dt.requires === "coast") {
      if (tile.terrain !== "coast") throw new Error("A harbour needs a coast hex");
    } else if (water) throw new Error("A district needs a land hex");
    const claim = claimingCity(state, parseKey(action.hex));
    if (!claim || claim.id !== city.id) throw new Error("That hex is not worked by this city");
    if (gw) {
      if (!greatWorkAllowed(gw, String(player.civ))) throw new Error(`${gw.name} is not your civilisation's Great Work`);
      if (city.districts.some((d) => d.type === "greatwork")) throw new Error("A city may hold only one Great Work");
      const cost2 = Math.round((gw.kind === "heritage" ? 40 : 100) * (state.costScale || 1));
      if (player.gold < cost2) throw new Error("Not enough gold for the Great Work");
      player.gold -= cost2;
      city.districts.push({ hex: action.hex, type: "greatwork", work: gw.id });
      return;
    }
    if (districtForbidden(action.districtType, String(player.civ))) throw new Error(`${player.civ} cannot build a ${action.districtType}`);
    if (dt.limit === "one-per-city" && city.districts.some((d) => districtType(d.type)?.limit === "one-per-city")) throw new Error("Only one such district per city");
    const cost = Math.round(DISTRICT_GOLD_COST * (state.costScale || 1));
    if (player.gold < cost) throw new Error("Not enough gold to found the district");
    player.gold -= cost;
    city.districts.push({ hex: action.hex, type: action.districtType });
  }
  function applyGiftGold(state, action) {
    assertPlayerTurn(state, action.playerId);
    const giver = state.playersById[action.playerId];
    const target = state.playersById[action.targetId];
    if (!giver || !target) throw new Error("Unknown player in gift");
    if (action.targetId === action.playerId) throw new Error("You cannot gift yourself");
    const amount = Math.floor(action.amount);
    if (!(amount > 0)) throw new Error("A gift must be a positive amount of gold");
    if (giver.gold < amount) throw new Error("Not enough gold for that gift");
    giver.gold -= amount;
    target.gold += amount;
    adjustRelation(state, action.playerId, action.targetId, giftRelationGain(amount, getRelation(state, action.playerId, action.targetId)));
  }
  function applyDeclareWar(state, action) {
    assertPlayerTurn(state, action.playerId);
    if (action.targetId === action.playerId) throw new Error("You cannot declare war on yourself");
    if (!state.playersById[action.targetId]) throw new Error("Unknown target for the declaration");
    if (isAtWar(state, action.playerId, action.targetId)) throw new Error("You are already at war");
    if (napBlocksDeclaration(state, action.playerId, action.targetId)) throw new Error("A non-aggression pact forbids declaring war \u2014 denounce it first");
    enterWar(state, action.playerId, action.targetId);
  }
  function applyProposeAgreement(state, action) {
    assertPlayerTurn(state, action.playerId);
    const ok = canProposeAgreement(state, action.playerId, action.targetId, action.agreementType);
    if (ok !== true) throw new Error(ok);
    state.playersById[action.targetId].pendingProposal = { from: action.playerId, kind: action.agreementType };
  }
  function applyOfferTribute(state, action) {
    assertPlayerTurn(state, action.playerId);
    if (action.targetId === action.playerId) throw new Error("You cannot pay tribute to yourself");
    const target = state.playersById[action.targetId];
    if (!target) throw new Error("Unknown civ");
    if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
    if (target.pendingProposal) throw new Error("They are still weighing another offer");
    const amount = Math.floor(action.amount);
    if (!(amount > 0)) throw new Error("Tribute must be a positive amount");
    const turns = Math.max(TRIBUTE_MIN_TURNS, Math.min(TRIBUTE_MAX_TURNS, Math.floor(action.turns) || TRIBUTE_MIN_TURNS));
    target.pendingProposal = { from: action.playerId, kind: "tribute", amount, turns };
  }
  function applyResolveProposal(state, action) {
    assertPlayerTurn(state, action.playerId);
    const me = state.playersById[action.playerId];
    if (!me || !me.pendingProposal) throw new Error("You have no proposal to answer");
    const prop = me.pendingProposal;
    me.pendingProposal = void 0;
    const from = prop.from;
    if (!action.accept) {
      adjustRelation(state, action.playerId, from, DECLINE_RELATION);
      return;
    }
    if (prop.kind === "trade-pact" || prop.kind === "passage" || prop.kind === "defensive-alliance" || prop.kind === "full-alliance") {
      addAgreement(state, action.playerId, from, prop.kind, 0);
    } else if (prop.kind === "nap") addAgreement(state, action.playerId, from, "nap", state.turn + NAP_TURNS);
    else if (prop.kind === "vassalage") {
      const vassalId = prop.vassalId;
      const overlordId = vassalId === from ? action.playerId : from;
      establishVassalage(state, overlordId, vassalId);
    } else if (prop.kind === "tribute") {
      const pair = ensurePair(state, action.playerId, from);
      pair.warSince = void 0;
      pair.tribute = { to: action.playerId, amount: prop.amount ?? 0, expires: state.turn + (prop.turns ?? TRIBUTE_MIN_TURNS) };
      addAgreement(state, action.playerId, from, "nap", state.turn + (prop.turns ?? TRIBUTE_MIN_TURNS));
    }
    adjustRelation(state, action.playerId, from, ACCEPT_RELATION);
  }
  function applyDenounce(state, action) {
    assertPlayerTurn(state, action.playerId);
    if (action.targetId === action.playerId) throw new Error("You cannot denounce yourself");
    if (!state.playersById[action.targetId]) throw new Error("Unknown civ");
    if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
    denounce(state, action.playerId, action.targetId);
  }
  function applyProposeVassalage(state, action) {
    assertPlayerTurn(state, action.playerId);
    const target = state.playersById[action.targetId];
    if (!target) throw new Error("Unknown civ");
    if (action.targetId === action.playerId) throw new Error("You cannot vassalise yourself");
    if (!haveMet(state, action.playerId, action.targetId)) throw new Error("You have not made contact with them yet");
    if (target.pendingProposal) throw new Error("They are still weighing another offer");
    if (action.vassalId !== action.playerId && action.vassalId !== action.targetId) throw new Error("The vassal must be one of the two parties");
    if (isVassal(state, action.vassalId)) throw new Error("That civ already serves an overlord");
    const overlordId = action.vassalId === action.playerId ? action.targetId : action.playerId;
    if (action.vassalId === action.targetId) {
      const ok = canDemandVassalage(state, overlordId, action.vassalId);
      if (ok !== true) throw new Error(ok);
    }
    target.pendingProposal = { from: action.playerId, kind: "vassalage", vassalId: action.vassalId };
  }
  function applyReleaseVassal(state, action) {
    assertPlayerTurn(state, action.playerId);
    const vassal = state.playersById[action.targetId];
    if (!vassal || vassal.vassalOf !== action.playerId) throw new Error("That civ is not your vassal");
    releaseVassal(state, action.playerId, action.targetId);
  }
  function villageAt(state, hex) {
    const v = state.map.villages?.[hex];
    if (!v) throw new Error("There is no village there");
    return v;
  }
  function makeTown(state, playerId, hex, pop) {
    const at = parseKey(hex);
    if (Object.values(state.map.cities).some((c) => c.position.q === at.q && c.position.r === at.r)) return;
    const id = `${playerId}_town_${at.q}_${at.r}`;
    state.map.cities[id] = { id, ownerId: playerId, position: { q: at.q, r: at.r }, population: pop, hp: 24, maxHp: 24 };
  }
  function villageReactionBonus(state, playerId, hex, deed) {
    let bonus = leaderReactionBonus(state.leaders?.[playerId], deed);
    if (explorerNear(state, playerId, hex)) bonus += EXPLORER_ENVOY_BONUS;
    return bonus;
  }
  function setReaction(state, playerId, hex, peopleId, deed, comply, chance, message) {
    state.lastReaction = { hex, peopleId, action: deed, comply, chance, playerId, message };
  }
  function applyBefriendVillage(state, action) {
    assertPlayerTurn(state, action.playerId);
    const v = villageAt(state, action.hex);
    const hasEnvoy = explorerNear(state, action.playerId, action.hex);
    if (v.disposition === "hostile" && !hasEnvoy) throw new Error("They are hostile \u2014 bring an Explorer to court them, or take them by force");
    if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
    const player = state.playersById[action.playerId];
    const cost = befriendCostFor(state, action.playerId, action.hex);
    if (player.gold < cost) throw new Error("Not enough gold to court them");
    const people = PEOPLE_BY_ID[v.peopleId];
    v.attempts = (v.attempts ?? 0) + 1;
    const react = rollReaction(people, v.disposition, "befriend", villageReactionBonus(state, action.playerId, action.hex, "befriend"), state.seed, action.hex, v.attempts);
    if (react.comply) {
      player.gold -= cost;
      applyVillageBenefit(state, action.playerId, people.benefit, parseKey(action.hex), false);
      v.befriendedBy = action.playerId;
      v.disposition = "open";
      setReaction(state, action.playerId, action.hex, v.peopleId, "befriend", true, react.chance, `\u{1F91D} ${people.name} accept your friendship.`);
      syncOwnershipIndexes(state);
    } else {
      v.disposition = souredDisposition(v.disposition);
      let msg = `\u{1F6AB} ${people.name} rebuff your overture`;
      if (v.disposition === "hostile") {
        const loss = pillageOnThreaten(state, action.playerId, THREATEN_RAID_GOLD);
        msg += loss > 0 ? ` and raid you for ${loss}g` : " and turn hostile";
      }
      setReaction(state, action.playerId, action.hex, v.peopleId, "befriend", false, react.chance, msg + ".");
    }
  }
  function applyDemandTributeVillage(state, action) {
    assertPlayerTurn(state, action.playerId);
    const v = villageAt(state, action.hex);
    if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
    const people = PEOPLE_BY_ID[v.peopleId];
    v.attempts = (v.attempts ?? 0) + 1;
    v.befriendedBy = void 0;
    const react = rollReaction(people, v.disposition, "tribute", villageReactionBonus(state, action.playerId, action.hex, "tribute"), state.seed, action.hex, v.attempts);
    if (react.comply) {
      state.playersById[action.playerId].gold += TRIBUTE_GAIN;
      v.disposition = souredDisposition(v.disposition);
      setReaction(state, action.playerId, action.hex, v.peopleId, "tribute", true, react.chance, `\u{1F4B0} ${people.name} hand over ${TRIBUTE_GAIN}g, grumbling.`);
    } else {
      v.disposition = souredDisposition(v.disposition);
      let msg = `\u{1F6AB} ${people.name} refuse to be shaken down`;
      if (v.disposition === "hostile") {
        const loss = pillageOnThreaten(state, action.playerId, THREATEN_RAID_GOLD);
        msg += loss > 0 ? ` and raid you for ${loss}g` : " and turn hostile";
      }
      setReaction(state, action.playerId, action.hex, v.peopleId, "tribute", false, react.chance, msg + ".");
    }
  }
  function applyConquerVillage(state, action) {
    assertPlayerTurn(state, action.playerId);
    const v = villageAt(state, action.hex);
    if (!unitNear(state, action.playerId, action.hex, true)) throw new Error("Bring a soldier to take the village");
    applyVillageBenefit(state, action.playerId, PEOPLE_BY_ID[v.peopleId].benefit, parseKey(action.hex), true);
    makeTown(state, action.playerId, action.hex, 1);
    for (const other of state.players) if (other.id !== action.playerId) adjustRelation(state, action.playerId, other.id, CONQUEST_REPUTATION_HIT);
    delete state.map.villages[action.hex];
    syncOwnershipIndexes(state);
  }
  function applyAbsorbVillage(state, action) {
    assertPlayerTurn(state, action.playerId);
    const v = villageAt(state, action.hex);
    if (v.befriendedBy !== action.playerId) throw new Error("Befriend them before you absorb them");
    if (!unitNear(state, action.playerId, action.hex)) throw new Error("Move a unit beside the village first");
    const people = PEOPLE_BY_ID[v.peopleId];
    v.attempts = (v.attempts ?? 0) + 1;
    const react = rollReaction(people, v.disposition, "assimilate", villageReactionBonus(state, action.playerId, action.hex, "assimilate"), state.seed, action.hex, v.attempts);
    if (react.comply) {
      if (action.mode === "join") makeTown(state, action.playerId, action.hex, 2);
      else applyVillageBenefit(state, action.playerId, { pop: 2 }, parseKey(action.hex), false);
      delete state.map.villages[action.hex];
      setReaction(state, action.playerId, action.hex, v.peopleId, "assimilate", true, react.chance, `\u{1F3D8}\uFE0F ${people.name} join your realm.`);
      syncOwnershipIndexes(state);
    } else {
      v.disposition = souredDisposition(v.disposition);
      if (v.disposition === "hostile") v.befriendedBy = void 0;
      setReaction(state, action.playerId, action.hex, v.peopleId, "assimilate", false, react.chance, `\u{1F6AB} ${people.name} are not ready to surrender their independence.`);
    }
  }
  function contactVillages(state, playerId) {
    if (!state.map.villages) return;
    const units = (state.playersById[playerId]?.unitIds ?? []).map((id) => state.map.units[id]).filter((u) => u && u.type === "explorer");
    if (!units.length) return;
    for (const key of Object.keys(state.map.villages)) {
      const v = state.map.villages[key];
      if (v.contacted) continue;
      const at = parseKey(key);
      const ring = /* @__PURE__ */ new Set([key, ...neighborsOf(at).map((n) => `${n.q},${n.r}`)]);
      if (units.some((u) => ring.has(`${u.position.q},${u.position.r}`))) {
        v.contacted = true;
        v.disposition = DISPOSITIONS[Math.min(DISPOSITIONS.length - 1, DISPOSITIONS.indexOf(v.disposition) + 1)];
      }
    }
  }
  var ENVOY_GOODWILL = 4;
  function contactCivs(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) return;
    state.contact = state.contact ?? {};
    const met = new Set(state.contact[playerId] ?? []);
    const before = new Set(met);
    const vis = new Set(computeVisibility(state, playerId).visibleTiles);
    const territory = computeTerritory(state);
    for (const u of Object.values(state.map.units)) {
      if (u.ownerId !== playerId && vis.has(`${u.position.q},${u.position.r}`)) met.add(u.ownerId);
    }
    for (const c of Object.values(state.map.cities)) {
      if (c.ownerId !== playerId && vis.has(`${c.position.q},${c.position.r}`)) met.add(c.ownerId);
    }
    for (const [k, owner] of Object.entries(territory)) {
      if (owner !== playerId && vis.has(k)) met.add(owner);
    }
    for (const id of [...met]) if (!state.playersById[id]) met.delete(id);
    if (met.size === before.size) return;
    state.contact[playerId] = [...met];
    const explorers = (player.unitIds ?? []).map((id) => state.map.units[id]).filter((u) => u && u.type === "explorer");
    for (const other of met) {
      if (before.has(other)) continue;
      if ((state.contact[other] ?? []).includes(playerId)) continue;
      const envoyReached = explorers.some(
        (ex) => Object.values(state.map.units).some((u) => u.ownerId === other && distance(ex.position, u.position) <= 2) || [`${ex.position.q},${ex.position.r}`, ...neighborsOf(ex.position).map((n) => `${n.q},${n.r}`)].some((k) => territory[k] === other)
      );
      if (envoyReached) adjustRelation(state, playerId, other, ENVOY_GOODWILL);
    }
  }
  function applyDiplomacyIncome(state, player) {
    if (!state.diplomacy) return;
    for (const key of Object.keys(state.diplomacy)) {
      const [a, b] = key.split("|");
      if (a !== player.id && b !== player.id) continue;
      const other = a === player.id ? b : a;
      const pair = state.diplomacy[key];
      if (hasAgreement(state, player.id, other, "trade-pact")) player.gold += TRADE_PACT_GOLD;
      const trib = pair.tribute;
      if (trib && trib.expires > state.turn && trib.to !== player.id) {
        const receiver = state.playersById[trib.to];
        const pay = Math.min(trib.amount, player.gold);
        player.gold -= pay;
        if (receiver) receiver.gold += pay;
        if (pay < trib.amount) {
          pair.tribute = null;
          adjustRelation(state, player.id, other, -10);
        }
      }
    }
    if (player.vassalOf) {
      const overlord = state.playersById[player.vassalOf];
      if (overlord) {
        const share = Math.floor(VASSAL_GOLD_SHARE * Math.max(0, computePlayerIncome(state, player.id).gold));
        const pay = Math.min(share, player.gold);
        player.gold -= pay;
        overlord.gold += pay;
      }
    }
  }
  function applyRepairDistrict(state, action) {
    assertPlayerTurn(state, action.playerId);
    const city = state.map.cities[action.cityId];
    if (!city || city.ownerId !== action.playerId) throw new Error("Not your city");
    const d = (city.districts ?? []).find((x) => x.hex === action.hex);
    if (!d || !d.pillaged) throw new Error("No pillaged district on that hex");
    const cost = Math.round(DISTRICT_REPAIR_LABOUR * (state.costScale || 1));
    if ((city.production ?? 0) < cost) throw new Error("Not enough banked labour to repair");
    city.production = (city.production ?? 0) - cost;
    d.pillaged = false;
  }
  function applyAction(inputState, action) {
    const state = deepClone(inputState);
    state.playersById = makePlayersById(state.players);
    state.lastReaction = void 0;
    switch (action.type) {
      case "MOVE_UNIT":
        applyMovement(state, action);
        break;
      case "ATTACK":
        applyCombat(state, action);
        break;
      case "RESEARCH_TECH":
        applyResearch(state, action);
        break;
      case "CHOOSE_FORK":
        applyChooseFork(state, action);
        break;
      case "PLAY_EVENT_CARD":
        applyPlayEventCard(state, action);
        break;
      case "END_TURN":
        applyEndTurn(state, action);
        break;
      case "FOUND_CITY":
        applyFoundCity(state, action);
        break;
      case "BUILD_UNIT":
        applyBuildUnit(state, action);
        break;
      case "ATTACK_CITY":
        applyAttackCity(state, action);
        break;
      case "RESOLVE_EVENT":
        applyResolveEvent(state, action);
        break;
      case "RESOLVE_RAID":
        applyResolveRaid(state, action);
        break;
      case "RESOLVE_FIGURE":
        applyResolveFigure(state, action);
        break;
      case "BUILD_BUILDING":
        applyBuildBuilding(state, action);
        break;
      case "UNQUEUE_PRODUCTION":
        applyUnqueueProduction(state, action);
        break;
      case "RUSH_PRODUCTION":
        applyRushProduction(state, action);
        break;
      case "ESTABLISH_TRADE_ROUTE":
        applyEstablishTradeRoute(state, action);
        break;
      case "IMPROVE_TILE":
        applyImproveTile(state, action);
        break;
      case "UPGRADE_UNIT":
        applyUpgradeUnit(state, action);
        break;
      case "DISBAND_UNIT":
        applyDisbandUnit(state, action);
        break;
      case "RENAME_CITY":
        applyRenameCity(state, action);
        break;
      case "BUILD_DISTRICT":
        applyBuildDistrict(state, action);
        break;
      case "REPAIR_DISTRICT":
        applyRepairDistrict(state, action);
        break;
      case "GIFT_GOLD":
        applyGiftGold(state, action);
        break;
      case "DECLARE_WAR":
        applyDeclareWar(state, action);
        break;
      case "PROPOSE_AGREEMENT":
        applyProposeAgreement(state, action);
        break;
      case "RESOLVE_PROPOSAL":
        applyResolveProposal(state, action);
        break;
      case "OFFER_TRIBUTE":
        applyOfferTribute(state, action);
        break;
      case "DENOUNCE":
        applyDenounce(state, action);
        break;
      case "PROPOSE_VASSALAGE":
        applyProposeVassalage(state, action);
        break;
      case "RELEASE_VASSAL":
        applyReleaseVassal(state, action);
        break;
      case "BEFRIEND_VILLAGE":
        applyBefriendVillage(state, action);
        break;
      case "DEMAND_TRIBUTE_VILLAGE":
        applyDemandTributeVillage(state, action);
        break;
      case "CONQUER_VILLAGE":
        applyConquerVillage(state, action);
        break;
      case "ABSORB_VILLAGE":
        applyAbsorbVillage(state, action);
        break;
      default: {
        const unknownAction = action;
        throw new Error(`Unsupported action ${unknownAction.type}`);
      }
    }
    state.actionLog.push({
      turn: inputState.turn,
      playerId: action.playerId,
      action
    });
    return state;
  }
  function serializeState(state) {
    return JSON.stringify(state);
  }
  function deserializeState(serialized) {
    return JSON.parse(serialized);
  }
  function replayActions(initialState, actions) {
    return actions.reduce((state, action) => applyAction(state, action), deepClone(initialState));
  }

  // src/engine/ai.ts
  var RESEARCH_PRIORITY = [
    "bronze-working",
    "archery",
    "iron-working",
    // A people beelines its own signature tech once the prerequisite is in hand
    // (civ gate skips the ones that aren't yours).
    "hoplite-phalanx",
    "chariotry",
    "legionary-system",
    "war-elephants",
    "iron-mastery",
    "combined-arms",
    "horseback-riding",
    "horse-archery",
    "writing",
    "mathematics",
    "sailing",
    "masonry",
    "engineering",
    "metallurgy",
    "siegecraft",
    "phalanx-doctrine",
    "coinage",
    "philosophy",
    "aqueducts",
    "republic",
    "open-sea-sailing",
    "roads-logistics",
    "astronomy",
    "rhetoric",
    "pottery",
    "law-administration",
    "assimilation"
  ];
  var EXPANSION_TARGET = 3;
  function aggression(state) {
    switch (state.difficulty) {
      case "easy":
        return { wounded: 0.55, cityBias: -150, minHpFrac: 0.35, requireBetter: true, acceptLoss: false };
      case "hard":
        return { wounded: 0.25, cityBias: 220, minHpFrac: 0, requireBetter: false, acceptLoss: true };
      default:
        return { wounded: 0.4, cityBias: 0, minHpFrac: 0, requireBetter: false, acceptLoss: false };
    }
  }
  function moveCtx(unit) {
    const def = UNITS[unit.type];
    return { ownerId: unit.ownerId, domain: def.domain, mounted: def.mounted };
  }
  function unitsOf(state, player) {
    return player.unitIds.map((id) => state.map.units[id]).filter((u) => u && !u.garrison);
  }
  function unitAt2(state, c) {
    return Object.values(state.map.units).find((u) => u.position.q === c.q && u.position.r === c.r);
  }
  function cityAtCoord(state, c) {
    return Object.values(state.map.cities).find((ci) => ci.position.q === c.q && ci.position.r === c.r);
  }
  function nearestCity2(cities, from) {
    let best = null;
    let bestDist = Infinity;
    for (const c of cities) {
      const d = distance(from, c.position);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    return best;
  }
  function enemyCities(state, playerId) {
    return Object.values(state.map.cities).filter((c) => c.ownerId !== playerId);
  }
  function ownCities(state, playerId) {
    return Object.values(state.map.cities).filter((c) => c.ownerId === playerId);
  }
  function isMilitary(unit) {
    const def = UNITS[unit.type];
    return def.attack > 0 && def.domain === "land";
  }
  function enemyCavalryNear(state, player) {
    const mine = unitsOf(state, player);
    for (const enemy of Object.values(state.map.units)) {
      if (enemy.ownerId === player.id) continue;
      if (!UNITS[enemy.type].mounted) continue;
      if (mine.some((m) => distance(m.position, enemy.position) <= 4)) return true;
    }
    return false;
  }
  var RESEARCH_BASE = {};
  RESEARCH_PRIORITY.forEach((id, i) => {
    RESEARCH_BASE[id] = RESEARCH_PRIORITY.length - i;
  });
  var ECON_TRUNK = /* @__PURE__ */ new Set(["irrigation", "animal-husbandry", "pottery", "writing", "masonry", "coinage", "currency-reform", "mathematics", "aqueducts"]);
  function bestBuildableTech(state, player) {
    const military = unitsOf(state, player).filter((u) => (UNITS[u.type]?.attack ?? 0) > 0).length;
    let best = null;
    let bestScore = -Infinity;
    for (const techId of Object.keys(TECHS)) {
      if (player.techs.includes(techId)) continue;
      const tech = TECHS[techId];
      if (!tech) continue;
      let ok = false;
      try {
        ok = canResearch(player, techId);
      } catch {
        ok = false;
      }
      if (!ok) continue;
      let score = RESEARCH_BASE[techId] ?? 8;
      if (tech.civ) score *= 1.5;
      if (ECON_TRUNK.has(techId)) score += 6;
      if (tech.capstone && military < 4) continue;
      score = score * 36 / (24 + researchCost(techId));
      if (tech.capstone) score += 3;
      if (score > bestScore) {
        bestScore = score;
        best = techId;
      }
    }
    return best;
  }
  function foundCityAction(state, player) {
    const cities = ownCities(state, player.id);
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "settler") continue;
      if (cityAtCoord(state, unit.position)) continue;
      const tooClose = cities.some((c) => distance(c.position, unit.position) < 2);
      if (tooClose) continue;
      return {
        type: "FOUND_CITY",
        playerId: player.id,
        settlerId: unit.id,
        cityId: `${player.id}_city_${state.turn}_${unit.id}`
      };
    }
    return null;
  }
  function attackAction(state, player) {
    let best = null;
    const agg = aggression(state);
    for (const attacker of unitsOf(state, player)) {
      const def = UNITS[attacker.type];
      if (def.attack <= 0 || attacker.movementRemaining <= 0) continue;
      if (isEmbarked(state, attacker)) continue;
      for (const target of Object.values(state.map.units)) {
        if (target.ownerId === player.id) continue;
        if (distance(attacker.position, target.position) > def.range) continue;
        const preview = computeCombatPreview(state, attacker.id, target.id);
        const kills = preview.defenderRemainingHp <= 0;
        const survives = preview.attackerRemainingHp > 0;
        const evenOrBetter = preview.damageToDefender >= preview.damageToAttacker;
        let favorable;
        if (agg.acceptLoss) {
          favorable = kills || survives || evenOrBetter;
        } else if (agg.requireBetter) {
          const healthy = preview.attackerRemainingHp >= UNITS[attacker.type].maxHp * agg.minHpFrac;
          favorable = survives && healthy && (kills || preview.damageToDefender > preview.damageToAttacker);
        } else {
          favorable = survives && (kills || evenOrBetter);
        }
        if (!favorable) continue;
        const score = (kills ? 1e3 : 0) + preview.damageToDefender - preview.damageToAttacker;
        if (!best || score > best.score) {
          best = { action: { type: "ATTACK", playerId: player.id, attackerId: attacker.id, defenderId: target.id }, score };
        }
      }
      for (const city of enemyCities(state, player.id)) {
        if (distance(attacker.position, city.position) > def.range) continue;
        const score = 450 + (def.siegeBonus ? 300 : 0) - city.hp * 0.5 + agg.cityBias;
        if (!best || score > best.score) {
          best = { action: { type: "ATTACK_CITY", playerId: player.id, attackerId: attacker.id, cityId: city.id }, score };
        }
      }
    }
    return best ? best.action : null;
  }
  function buildAction(state, player) {
    const cities = player.cityIds.map((id) => state.map.cities[id]).filter(Boolean);
    if (cities.length === 0) return null;
    const settlersInFlight = unitsOf(state, player).filter((u) => u.type === "settler").length;
    const wantSettler = cities.length < EXPANSION_TARGET && settlersInFlight === 0;
    const merchantsInFlight = unitsOf(state, player).filter((u) => u.type === "merchant").length;
    const routesOwned = (state.tradeRoutes ?? []).filter((r) => r.ownerId === player.id).length;
    const hasArmy = unitsOf(state, player).some(isMilitary);
    const wantMerchant = cities.length >= 2 && hasArmy && merchantsInFlight === 0 && routesOwned < cities.length - 1;
    const canBuild = (type) => {
      const rule = UNITS[type];
      if (!rule) return false;
      if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) return false;
      if (rule.civ && !playerControlsCiv(player, rule.civ)) return false;
      return true;
    };
    const civElite = Object.keys(UNITS).filter(
      (t) => UNITS[t].civ && (UNITS[t].attack ?? 0) > 0 && canBuild(t)
    );
    const spearFirst = enemyCavalryNear(state, player);
    const militaryPref = [
      ...civElite,
      ...spearFirst ? ["spearman", "swordsman", "horseman", "archer", "warrior"] : ["swordsman", "horseman", "spearman", "archer", "warrior"]
    ];
    const triremeCount = unitsOf(state, player).filter((u) => u.type === "trireme").length;
    const enemyCoastalCities = enemyCities(state, player.id).filter((c) => isCoastalCity(state, c.id)).length;
    const desiredShips = Math.min(4, enemyCoastalCities);
    for (const city of cities) {
      if ((city.queue?.length ?? 0) >= 2) continue;
      const coastal = isCoastalCity(state, city.id);
      let chosen = null;
      if (wantSettler && canBuild("settler") && !(city.queue ?? []).includes("settler")) chosen = "settler";
      if (!chosen && wantMerchant && canBuild("merchant") && !(city.queue ?? []).includes("merchant")) chosen = "merchant";
      if (!chosen && coastal && canBuild("trireme") && triremeCount < desiredShips && !(city.queue ?? []).includes("trireme")) {
        chosen = "trireme";
      }
      if (!chosen) chosen = militaryPref.find(canBuild) ?? null;
      if (!chosen) continue;
      return {
        type: "BUILD_UNIT",
        playerId: player.id,
        cityId: city.id,
        unitType: chosen,
        unitId: `${player.id}_${chosen}_${state.turn}_${city.id}`
      };
    }
    return null;
  }
  function buildingAction(state, player) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city) continue;
      if ((city.queue?.length ?? 0) >= 3) continue;
      const built = /* @__PURE__ */ new Set([...city.buildings ?? [], ...city.queue ?? []]);
      for (const [id, b] of Object.entries(BUILDINGS)) {
        if (built.has(id)) continue;
        if (b.civ && String(player.civ || "").toLowerCase() !== b.civ) continue;
        if (b.requiresTech && !player.techs.includes(b.requiresTech)) continue;
        if (b.coastalOnly && !isCoastalCity(state, cityId)) continue;
        return { type: "BUILD_BUILDING", playerId: player.id, cityId, buildingId: id };
      }
    }
    return null;
  }
  function districtAction(state, player) {
    if (player.gold < 55) return null;
    const foodTight = computePlayerIncome(state, player.id).food <= 1;
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city) continue;
      const built = city.districts ?? [];
      if (built.length >= districtSlots(city)) continue;
      const takenHexes = new Set(built.map((d) => d.hex));
      const freeHex = neighborsOf(city.position).map((n) => keyOf(n)).find((k) => {
        const tile = state.map.tiles[k];
        if (!tile || tile.terrain === "coast" || tile.terrain === "sea") return false;
        if (takenHexes.has(k)) return false;
        const claim = claimingCity(state, parseKey(k));
        return !!claim && claim.id === city.id;
      });
      if (!freeHex) continue;
      const threatened = Object.values(state.map.units).some(
        (u) => u.ownerId !== player.id && isMilitary(u) && distance(u.position, city.position) <= 4
      );
      const stability = computeCityStability(state, cityId);
      const alreadyType = new Set(built.map((d) => d.type));
      const prefs = [];
      if (threatened) prefs.push("barracks");
      if (stability <= 3) prefs.push("leisure", "civic");
      if (foodTight) prefs.push("aqueduct");
      prefs.push("market", "civic", "temple", "leisure", "affluent");
      for (const type of prefs) {
        if (alreadyType.has(type)) continue;
        if (districtForbidden(type, String(player.civ))) continue;
        return { type: "BUILD_DISTRICT", playerId: player.id, cityId, districtType: type, hex: freeHex };
      }
    }
    return null;
  }
  function reachableAlong(state, unit, path) {
    const ctx = moveCtx(unit);
    let cost = 0;
    let lastIndex = 0;
    for (let i = 1; i < path.length; i += 1) {
      const step = movementCost(state, ctx, path[i - 1], path[i]);
      if (!Number.isFinite(step) || cost + step > unit.movementRemaining) break;
      if (unitAt2(state, path[i])) break;
      const cityHere = cityAtCoord(state, path[i]);
      if (cityHere && cityHere.ownerId !== unit.ownerId) break;
      cost += step;
      lastIndex = i;
    }
    return lastIndex > 0 ? path[lastIndex] : null;
  }
  function maneuverAction(state, player) {
    const woundedFraction = aggression(state).wounded;
    const myCities = ownCities(state, player.id);
    const myMilitary = unitsOf(state, player).filter(isMilitary);
    for (const unit of unitsOf(state, player)) {
      if (!isMilitary(unit) || unit.movementRemaining <= 0) continue;
      const guarding = myCities.find((c) => distance(unit.position, c.position) <= 1);
      if (guarding) {
        const otherDefender = myMilitary.some(
          (u) => u.id !== unit.id && distance(u.position, guarding.position) <= 1
        );
        if (!otherDefender) continue;
      }
      const wounded = unit.hp < UNITS[unit.type].maxHp * woundedFraction;
      const target = wounded ? nearestCity2(ownCities(state, player.id), unit.position) : nearestCity2(enemyCities(state, player.id), unit.position);
      if (!target) continue;
      const path = findPath(state, moveCtx(unit), unit.position, target.position);
      if (!path || path.length < 2) continue;
      const dest = reachableAlong(state, unit, path);
      if (!dest) continue;
      return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: dest };
    }
    return null;
  }
  var IMPROVE_PREFERENCE = ["mine", "quarry", "lumber-camp", "farm", "pasture", "vineyard", "trade-post"];
  function pickImprovement(tile, player) {
    for (const id of IMPROVE_PREFERENCE) {
      const rule = IMPROVEMENTS[id];
      if (!rule || !rule.terrains.includes(tile.terrain)) continue;
      if (rule.requiresTech && !player.techs.includes(rule.requiresTech)) continue;
      if (rule.requiresResource && !(tile.resource && rule.requiresResource.includes(tile.resource))) continue;
      return id;
    }
    return null;
  }
  function improveAction(state, player) {
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city) continue;
      if ((city.queue?.length ?? 0) >= 3) continue;
      for (let dq = -2; dq <= 2; dq += 1) {
        for (let dr = -2; dr <= 2; dr += 1) {
          if (distance({ q: 0, r: 0 }, { q: dq, r: dr }) > 2) continue;
          const key = `${city.position.q + dq},${city.position.r + dr}`;
          const tile = state.map.tiles[key];
          if (!tile || tile.improvement) continue;
          const claim = claimingCity(state, parseKey(key));
          if (!claim || claim.id !== city.id) continue;
          if ((city.queue ?? []).some((q) => q.startsWith("imp:") && q.endsWith(`:${key}`))) continue;
          const imp = pickImprovement(tile, player);
          if (!imp) continue;
          return { type: "IMPROVE_TILE", playerId: player.id, cityId: city.id, tileKey: key, improvement: imp };
        }
      }
    }
    return null;
  }
  function tradeAction(state, player) {
    const owned = ownCities(state, player.id);
    if (owned.length < 2) return null;
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "merchant") continue;
      const dest = cityAtCoord(state, unit.position);
      if (!dest) continue;
      let home = null;
      let bestDist = Infinity;
      for (const c of owned) {
        if (c.id === dest.id) continue;
        const d = distance(c.position, dest.position);
        if (d < bestDist) {
          bestDist = d;
          home = c;
        }
      }
      if (!home) continue;
      const dup = (state.tradeRoutes ?? []).some(
        (r) => r.ownerId === player.id && (r.fromCityId === home.id && r.toCityId === dest.id || r.fromCityId === dest.id && r.toCityId === home.id)
      );
      if (dup) continue;
      return { type: "ESTABLISH_TRADE_ROUTE", playerId: player.id, merchantId: unit.id, cityId: dest.id };
    }
    return null;
  }
  function navalManeuverAction(state, player) {
    for (const unit of unitsOf(state, player)) {
      if (UNITS[unit.type].domain !== "naval" || unit.movementRemaining <= 0) continue;
      const coastalTargets = enemyCities(state, player.id).filter((c) => isCoastalCity(state, c.id));
      let targetPos = nearestCity2(coastalTargets, unit.position)?.position ?? null;
      if (!targetPos) {
        let bestDist = Infinity;
        for (const enemy of Object.values(state.map.units)) {
          if (enemy.ownerId === player.id) continue;
          if (UNITS[enemy.type].domain !== "naval") continue;
          const d = distance(unit.position, enemy.position);
          if (d < bestDist) {
            bestDist = d;
            targetPos = enemy.position;
          }
        }
      }
      if (!targetPos) continue;
      const ctx = moveCtx(unit);
      let bestStep = null;
      let bestScore = distance(unit.position, targetPos);
      for (const dir of DIRECTIONS) {
        const next = { q: unit.position.q + dir[0], r: unit.position.r + dir[1] };
        if (!state.map.tiles[keyOf(next)]) continue;
        const step = movementCost(state, ctx, unit.position, next);
        if (!Number.isFinite(step) || step > unit.movementRemaining) continue;
        if (unitAt2(state, next) || cityAtCoord(state, next)) continue;
        const d = distance(next, targetPos);
        if (d < bestScore) {
          bestScore = d;
          bestStep = next;
        }
      }
      if (bestStep) {
        return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: bestStep };
      }
    }
    return null;
  }
  function settlerMoveAction(state, player) {
    const cities = ownCities(state, player.id);
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "settler" || unit.movementRemaining <= 0) continue;
      const currentNearest = nearestCity2(cities, unit.position);
      const currentDist = currentNearest ? distance(unit.position, currentNearest.position) : 0;
      let bestStep = null;
      let bestScore = currentDist;
      const ctx = moveCtx(unit);
      for (const dir of DIRECTIONS) {
        const next = { q: unit.position.q + dir[0], r: unit.position.r + dir[1] };
        if (!state.map.tiles[`${next.q},${next.r}`]) continue;
        const step = movementCost(state, ctx, unit.position, next);
        if (!Number.isFinite(step) || step > unit.movementRemaining) continue;
        if (unitAt2(state, next) || cityAtCoord(state, next)) continue;
        const near = nearestCity2(cities, next);
        const score = near ? distance(next, near.position) : 99;
        if (score > bestScore) {
          bestScore = score;
          bestStep = next;
        }
      }
      if (bestStep) {
        return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: bestStep };
      }
    }
    return null;
  }
  function diplomacyAction(state, player) {
    const per = personalityOf(player.civ);
    const others = state.players.filter((o) => o.id !== player.id);
    if (per.demandsVassals) {
      for (const o of others) {
        if (o.pendingProposal || isVassal(state, o.id)) continue;
        if (relationBand(getRelation(state, player.id, o.id)) === "hostile") continue;
        if (canDemandVassalage(state, player.id, o.id) === true) {
          return { type: "PROPOSE_VASSALAGE", playerId: player.id, targetId: o.id, vassalId: o.id };
        }
      }
    }
    if (per.submitsWhenLosing || per.buysPeace) {
      for (const o of others) {
        if (!isAtWar(state, player.id, o.id) || o.pendingProposal) continue;
        const strong = militaryStrength(state, o.id), me = militaryStrength(state, player.id);
        if (per.submitsWhenLosing && !isVassal(state, player.id) && strong >= me * 2) {
          return { type: "PROPOSE_VASSALAGE", playerId: player.id, targetId: o.id, vassalId: player.id };
        }
        if (per.buysPeace && player.gold >= 10 && strong >= me * 1.6) {
          return { type: "OFFER_TRIBUTE", playerId: player.id, targetId: o.id, amount: 5, turns: 12 };
        }
      }
    }
    if (per.seeksAlliances) {
      for (const o of others) {
        for (const t of ["full-alliance", "defensive-alliance", "nap"]) {
          if (canProposeAgreement(state, player.id, o.id, t) === true) {
            return { type: "PROPOSE_AGREEMENT", playerId: player.id, targetId: o.id, agreementType: t };
          }
        }
      }
    }
    for (const o of others) {
      if (canProposeAgreement(state, player.id, o.id, "trade-pact") === true) {
        return { type: "PROPOSE_AGREEMENT", playerId: player.id, targetId: o.id, agreementType: "trade-pact" };
      }
    }
    return null;
  }
  function rushAction(state, player) {
    if (player.gold < 40) return null;
    for (const cityId of player.cityIds) {
      const city = state.map.cities[cityId];
      if (!city || !city.queue || city.queue.length === 0) continue;
      const front = city.queue[0];
      const def = UNITS[front];
      if (!def || (def.attack ?? 0) <= 0 || def.domain !== "land") continue;
      const threatened = Object.values(state.map.units).some(
        (u) => u.ownerId !== player.id && isMilitary(u) && distance(u.position, city.position) <= 3
      );
      if (!threatened) continue;
      const hasDefender = unitsOf(state, player).some((u) => isMilitary(u) && distance(u.position, city.position) <= 1);
      if (hasDefender) continue;
      const rush = rushProductionCost(state, cityId);
      if (!rush || rush.goldCost <= 0) continue;
      if (player.gold < rush.goldCost + 20) continue;
      return { type: "RUSH_PRODUCTION", playerId: player.id, cityId };
    }
    return null;
  }
  function upgradeAction(state, player) {
    if (player.gold < 22) return null;
    for (const unit of unitsOf(state, player)) {
      const target = upgradeTargetFor(player, unit);
      if (!target) continue;
      if (player.gold < upgradeCost(unit.type, target) + 10) continue;
      return { type: "UPGRADE_UNIT", playerId: player.id, unitId: unit.id };
    }
    return null;
  }
  function nearestRuinKey(state, from) {
    const ruins = state.map.ruins;
    if (!ruins) return null;
    let best = null, bestD = Infinity;
    for (const [key, site] of Object.entries(ruins)) {
      if (site.excavated) continue;
      const d = distance(from, parseKey(key));
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }
  function nearestOpenVillageKey(state, from, playerId) {
    const vs = state.map.villages;
    if (!vs) return null;
    let best = null, bestD = Infinity;
    for (const [key, v] of Object.entries(vs)) {
      if (v.befriendedBy === playerId) continue;
      const d = distance(from, parseKey(key));
      if (d < bestD) {
        bestD = d;
        best = key;
      }
    }
    return best;
  }
  function villageAction(state, player) {
    const vs = state.map.villages;
    if (!vs) return null;
    const agg = aggression(state);
    for (const [hex, v] of Object.entries(vs)) {
      if (!unitNear(state, player.id, hex)) continue;
      if (v.befriendedBy === player.id && v.disposition !== "hostile") {
        return { type: "ABSORB_VILLAGE", playerId: player.id, hex, mode: "join" };
      }
      const cost = befriendCostFor(state, player.id, hex);
      const canCourt = v.disposition !== "hostile" || explorerNear(state, player.id, hex);
      if (v.befriendedBy !== player.id && canCourt && (v.attempts ?? 0) < 2 && player.gold >= cost + 15) {
        return { type: "BEFRIEND_VILLAGE", playerId: player.id, hex };
      }
      if (v.befriendedBy !== player.id && unitNear(state, player.id, hex, true) && (v.disposition === "hostile" || agg.acceptLoss)) {
        return { type: "CONQUER_VILLAGE", playerId: player.id, hex };
      }
    }
    return null;
  }
  function exploreAction(state, player) {
    for (const unit of unitsOf(state, player)) {
      if (unit.type !== "explorer" || unit.movementRemaining <= 0) continue;
      const ruinKey = nearestRuinKey(state, unit.position);
      const villageKey = nearestOpenVillageKey(state, unit.position, player.id);
      let targetPos = null;
      if (ruinKey) targetPos = parseKey(ruinKey);
      else if (villageKey) targetPos = parseKey(villageKey);
      else {
        const foe = nearestCity2(enemyCities(state, player.id), unit.position);
        targetPos = foe ? foe.position : null;
      }
      if (!targetPos || distance(unit.position, targetPos) === 0) continue;
      const path = findPath(state, moveCtx(unit), unit.position, targetPos);
      if (!path || path.length < 2) continue;
      const dest = reachableAlong(state, unit, path);
      if (!dest) continue;
      return { type: "MOVE_UNIT", playerId: player.id, unitId: unit.id, destination: dest };
    }
    return null;
  }
  function chooseAiAction(state, playerId) {
    const player = state.playersById[playerId];
    if (!player) throw new Error(`Unknown player ${playerId}`);
    const steps = [
      () => {
        if (!player.pendingProposal) return null;
        const p = player.pendingProposal;
        return { type: "RESOLVE_PROPOSAL", playerId, accept: aiAcceptsProposal(state, playerId, p.from, p.kind, p.amount ?? 0, p.vassalId) };
      },
      () => {
        if (!player.pendingEvent) return null;
        const event = getEvent(player.pendingEvent);
        if (!event) return null;
        const score = (o) => (o.effects.gold ?? 0) * 0.5 + (o.effects.production ?? 0) + (o.effects.science ?? 0) * 0.8 + (o.effects.food ?? 0) * 3 + (o.effects.spawnUnit ? 25 : 0);
        const optionIndex = score(event.options[0]) >= score(event.options[1]) ? 0 : 1;
        return { type: "RESOLVE_EVENT", playerId, eventId: player.pendingEvent, optionIndex };
      },
      () => {
        if (!player.pendingFigure) return null;
        const figure = getFigure(player.pendingFigure);
        if (!figure) return null;
        const score = (o) => {
          const e = o.effects;
          return (e.gold ?? 0) * 0.5 + (e.production ?? 0) + (e.science ?? 0) * 0.8 + (e.food ?? 0) * 3 + (e.spawnUnit ? 25 : 0) + (e.xp ? 30 : 0) + (e.heal ? 15 : 0) + (e.cancelRaids ? 40 : 0) + (e.seaReach ?? 0) * 5 + (e.reveal ? 8 : 0) + Object.values(e.perks ?? {}).reduce((s, v) => s + (typeof v === "number" ? v * 8 : 0), 0);
        };
        let best = 0;
        for (let i = 1; i < figure.options.length; i += 1) if (score(figure.options[i]) > score(figure.options[best])) best = i;
        return { type: "RESOLVE_FIGURE", playerId, figureId: player.pendingFigure, optionIndex: best };
      },
      () => attackAction(state, player),
      () => foundCityAction(state, player),
      () => villageAction(state, player),
      // §10: absorb/court/seize a village beside a unit
      () => rushAction(state, player),
      // rush a defender in a threatened, undefended city
      () => buildAction(state, player),
      () => buildingAction(state, player),
      () => upgradeAction(state, player),
      // turn veterans into the civ elite with spare gold
      () => districtAction(state, player),
      () => tradeAction(state, player),
      () => improveAction(state, player),
      () => maneuverAction(state, player),
      () => navalManeuverAction(state, player),
      () => settlerMoveAction(state, player),
      () => exploreAction(state, player),
      // §10: send the Explorer to ruins/villages
      () => diplomacyAction(state, player),
      () => {
        const techId = bestBuildableTech(state, player);
        if (!techId || player.science < researchCost(techId)) return null;
        return { type: "RESEARCH_TECH", playerId, techId };
      }
    ];
    for (const step of steps) {
      const action = step();
      if (action) return action;
    }
    return { type: "END_TURN", playerId };
  }
  function runAiTurn(inputState, playerId, maxActions = 10) {
    let state = inputState;
    const actions = [];
    for (let i = 0; i < maxActions; i += 1) {
      const action = chooseAiAction(state, playerId);
      if (action.type === "END_TURN") {
        actions.push(action);
        state = applyAction(state, action);
        break;
      }
      try {
        const next = applyAction(state, action);
        state = next;
        actions.push(action);
      } catch {
        const forcedEnd = { type: "END_TURN", playerId };
        actions.push(forcedEnd);
        state = applyAction(state, forcedEnd);
        return { state, actions };
      }
    }
    if (actions.length === maxActions && actions[actions.length - 1].type !== "END_TURN") {
      const forcedEnd = { type: "END_TURN", playerId };
      actions.push(forcedEnd);
      state = applyAction(state, forcedEnd);
    }
    return { state, actions };
  }

  // src/engine/scenarios/atlas.ts
  function offsetToAxial2(col, row) {
    return { q: col - (row - (row & 1) >> 1), r: row };
  }
  var LEGEND = {
    " ": "sea",
    "~": "sea",
    ":": "coast",
    ".": "plains",
    ",": "valley",
    f: "forest",
    h: "hills",
    "^": "mountains",
    M: "mountains",
    d: "desert"
  };
  var isLand = (terrain) => !!terrain && terrain !== "sea" && terrain !== "coast";
  function fromAscii(opts) {
    const rows2 = opts.rows;
    const height = rows2.length;
    const width = rows2.reduce((m, r) => Math.max(m, r.length), 0);
    const regionNames = opts.regions && opts.regions.length ? opts.regions : ["world"];
    const bandW = Math.max(1, Math.ceil(width / regionNames.length));
    const regionOf = (col) => regionNames[Math.min(regionNames.length - 1, Math.floor(col / bandW))];
    const tiles = {};
    const capitalAt = {};
    const usedRegions = /* @__PURE__ */ new Set();
    for (let row = 0; row < height; row += 1) {
      const line = rows2[row];
      for (let col = 0; col < width; col += 1) {
        const ch = col < line.length ? line[col] : " ";
        let terrain;
        if (ch >= "1" && ch <= "9") {
          terrain = "plains";
          capitalAt[Number(ch) - 1] = offsetToAxial2(col, row);
        } else {
          terrain = LEGEND[ch] ?? "sea";
        }
        const region = regionOf(col);
        usedRegions.add(region);
        tiles[keyOf(offsetToAxial2(col, row))] = { terrain, region };
      }
    }
    const cities = {};
    const units = {};
    const occupied = /* @__PURE__ */ new Set();
    opts.players.forEach((p, i) => {
      const cap2 = capitalAt[i];
      if (!cap2) return;
      cities[`${p.id}_capital`] = {
        id: `${p.id}_capital`,
        ownerId: p.id,
        position: cap2,
        population: 2,
        hp: 40,
        maxHp: 40,
        isCapital: true
      };
      occupied.add(keyOf(cap2));
      const spots = [];
      for (const n of neighborsOf(cap2)) {
        const k = keyOf(n);
        if (isLand(tiles[k]?.terrain) && !occupied.has(k)) spots.push(n);
        if (spots.length >= 2) break;
      }
      const warriorPos = spots[0] ?? cap2;
      occupied.add(keyOf(warriorPos));
      const explorerPos = spots[1] ?? cap2;
      occupied.add(keyOf(explorerPos));
      units[`${p.id}_warrior`] = { id: `${p.id}_warrior`, type: "warrior", ownerId: p.id, position: warriorPos };
      units[`${p.id}_explorer`] = { id: `${p.id}_explorer`, type: "explorer", ownerId: p.id, position: explorerPos };
    });
    const players = opts.players.map((p) => ({
      id: p.id,
      civ: p.civ,
      food: p.food ?? 8,
      production: p.production ?? 30,
      gold: p.gold ?? 20,
      techs: p.techs ?? []
    }));
    return {
      seed: opts.seed,
      turnLimit: opts.turnLimit,
      players,
      map: {
        width,
        height,
        regions: Array.from(usedRegions),
        rivers: {},
        tiles,
        cities,
        units
      }
    };
  }

  // src/engine/scenarios/italia.ts
  var MAP = [
    "     ^^^^^^^^",
    "   .hh..hh..^",
    "    .h..h.hh",
    "     .h1.h",
    "     .h..h",
    "  f  .^.hh",
    "  ff .^h.h",
    "  f  .^^h.",
    "     .^^h.",
    "     .^hh.",
    "     .^h.h",
    "     ..^h.",
    "     ..hh.",
    "    ..hh.",
    "   ..h.",
    "  ..h.",
    "  :.",
    " ..h.",
    " ...h",
    "  ..",
    "",
    "...2......d....d..",
    "....d.......d...."
  ];
  var italiaScenario = fromAscii({
    seed: "italia-264bc",
    turnLimit: 50,
    rows: MAP,
    regions: ["Tyrrhenian", "Italia", "Adriatic"],
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: ["sailing"] },
      { id: "carthage", civ: "Carthage", food: 8, production: 30, gold: 20, techs: ["sailing"] }
    ]
  });

  // src/engine/scenarios/hellas.ts
  var MAP2 = [
    "  ^h^        ^h^",
    " .h.hh      .h^.",
    "  ^.h.      .hh.",
    "  .h1.  .   .^2.",
    "   ^hh.    .hh.h",
    "   .h^.  .  .h..",
    "    ^h.  .  .hh",
    "    .h..    ..h",
    "   .^h.  .   ..",
    "   .hh.      .",
    "    ..    .   ",
    "        .     ",
    "     .      . ",
    "              ",
    "   ...hh.....  ",
    "    ...h...   ",
    "              ",
    "       ...3......",
    "      ..d....d..d",
    "     ..d......d.."
  ];
  var hellasScenario = fromAscii({
    seed: "hellas-431bc",
    turnLimit: 55,
    rows: MAP2,
    regions: ["Hellas", "Aegean", "Ionia"],
    players: [
      { id: "greece", civ: "Athens", food: 8, production: 30, gold: 20, techs: ["sailing"] },
      { id: "parthia", civ: "Persia", food: 8, production: 34, gold: 26, techs: ["sailing"] },
      { id: "egypt", civ: "Egypt", food: 10, production: 28, gold: 24, techs: ["sailing"] }
    ]
  });

  // src/engine/scenarios/oldworld.ts
  var MAP3 = [
    "    ..h.      ^^^^^^^         ^^^^^",
    "   .hhh.   ff.....^^^^      .hh.h^^^",
    "  .h.5h.  ff...h.....^^   .h...hh^^^",
    "  .h...ffff..hh....^^^^  .h..h..hh^^",
    " .h..h..ff..h....^..1.h..h...hh.h^^^",
    " ^h.h...f..hh...^^h..hh.h.3...h.hh.^^",
    "  ^h..    ..hh..h...h..h..h.hhh.h.^^^",
    "   ..      ..h. .h....h.h..h.h..hh.6h",
    "            ..   ..    .h..h..hh.hh.hh",
    "                        ..h..h.h..h.hh",
    "         .        .      .h.h.h.h..hh.",
    "       .:        .:       .h..h..hh.h",
    "      ..:.     ..:.      :..h.d.dd.dd",
    "     ..:..    ..:..     :..dd.ddd.dd",
    "    ...:..   ..:.. ...:.4..dddddd.dd",
    "  ...2....d.....dd...d..ddddddd.dddd",
    " ...d...d...dd..dd..dddd.dddddd.dddd",
    "  .d...dd..dd..dd..ddd.ddddd.dddd.d",
    "   d...dd..dd..dd..dd.dddd.dddd.dd",
    "    ...dd..dd..dd..dd.ddd.ddd.dd",
    "     .dd...dd..dd..dd.dd.ddd.d",
    "      d....dd..dd..dd.dd.dd.d"
  ];
  var oldWorldScenario = fromAscii({
    seed: "old-world",
    turnLimit: 90,
    rows: MAP3,
    regions: ["Hispania", "Italia", "Graecia", "Asia"],
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
      { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
      { id: "greece", civ: "Athens", food: 8, production: 30, gold: 22, techs: ["sailing"] },
      { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
      { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
      { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
    ]
  });

  // src/engine/scenarios/oikoumene.ts
  var W = 90;
  var H = 56;
  var grid = Array.from({ length: H }, () => Array(W).fill("~"));
  function inB(c, r) {
    return c >= 0 && r >= 0 && c < W && r < H;
  }
  function blob(cx, cy, rx, ry, ch) {
    for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid[r][c] = ch;
    }
  }
  function rect(c0, r0, c1, r1, ch) {
    for (let r = Math.max(0, r0); r <= Math.min(H - 1, r1); r += 1)
      for (let c = Math.max(0, c0); c <= Math.min(W - 1, c1); c += 1) grid[r][c] = ch;
  }
  function stroke(c0, r0, c1, r1, w, ch, landOnly = false) {
    const steps = Math.max(1, Math.round(Math.hypot(c1 - c0, r1 - r0)));
    for (let i = 0; i <= steps; i += 1) {
      const cx = c0 + (c1 - c0) * i / steps, cy = r0 + (r1 - r0) * i / steps;
      for (let r = Math.round(cy - w); r <= Math.round(cy + w); r += 1)
        for (let c = Math.round(cx - w); c <= Math.round(cx + w); c += 1) {
          if (!inB(c, r) || (cx - c) * (cx - c) + (cy - r) * (cy - r) > w * w + 0.5) continue;
          if (landOnly && grid[r][c] === "~") continue;
          grid[r][c] = ch;
        }
    }
  }
  function onLand(cx, cy, rx, ry, ch) {
    for (let r = 0; r < H; r += 1) for (let c = 0; c < W; c += 1) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1 && grid[r][c] !== "~") grid[r][c] = ch;
    }
  }
  function set(c, r, ch) {
    if (inB(c, r)) grid[r][c] = ch;
  }
  rect(8, 8, 56, 24, ".");
  blob(13, 29, 9, 7, ".");
  rect(12, 22, 22, 27, ".");
  rect(50, 4, 88, 14, ".");
  rect(28, 18, 38, 26, ".");
  stroke(35, 24, 38, 34, 1.5, ".");
  blob(38, 35, 2, 1.3, ".");
  blob(28, 26, 1.4, 1.7, ".");
  blob(28, 30, 1.5, 1.9, ".");
  blob(49, 28, 5, 5, ".");
  set(47, 33, ".");
  set(50, 34, ".");
  blob(53, 35, 1.3, 0.9, ".");
  blob(64, 28, 11, 5, ".");
  rect(64, 20, 82, 32, ".");
  rect(63, 28, 67, 46, ".");
  blob(76, 38, 7, 4, ".");
  blob(84, 34, 9, 9, ".");
  rect(4, 42, 60, 55, ".");
  rect(52, 40, 66, 47, ".");
  blob(72, 48, 11, 8, ".");
  rect(0, 0, 5, 55, "~");
  blob(3, 30, 4, 9, "~");
  rect(10, 0, 40, 6, "~");
  rect(50, 0, 90, 4, "~");
  blob(26, 38, 11, 4.5, "~");
  blob(32, 33, 3, 4, "~");
  blob(43, 37, 6, 4, "~");
  blob(59, 40, 10, 4.5, "~");
  blob(41, 28, 2, 5, "~");
  blob(53, 30, 2.6, 4, "~");
  blob(58, 20, 9, 4.5, "~");
  blob(86, 21, 5, 6, "~");
  rect(55, 47, 58, 55, "~");
  blob(56, 51, 2.4, 5, "~");
  blob(80, 44, 4, 3, "~");
  rect(10, 3, 30, 12, "~");
  blob(18, 6, 3, 3.4, ".");
  blob(18, 10, 2.2, 1.6, ".");
  blob(10, 9, 2.4, 2, ".");
  blob(28, 41, 5, 3, ".");
  blob(40, 10, 14, 4.5, "f");
  rect(30, 6, 60, 9, "f");
  onLand(17, 24, 6, 1.3, "^");
  onLand(31, 20, 8, 1.6, "^");
  onLand(36, 27, 0.7, 5, "^");
  onLand(13, 41, 8, 1.5, "^");
  onLand(48, 13, 6, 1.4, "^");
  onLand(72, 22, 7, 1.8, "^");
  onLand(64, 31, 9, 1, "^");
  stroke(74, 30, 86, 43, 1.8, "^", true);
  onLand(64, 30, 8, 2.5, "h");
  onLand(50, 30, 3, 3, "h");
  rect(6, 48, 58, 55, "d");
  onLand(66, 41, 9, 4, "d");
  onLand(72, 48, 11, 8, "d");
  onLand(54, 42, 4, 3, "d");
  onLand(53, 45, 3, 6, "d");
  stroke(52, 42, 52, 53, 0.6, ".");
  set(36, 27, "1");
  set(28, 41, "2");
  set(49, 30, "3");
  set(53, 43, "4");
  set(20, 15, "5");
  set(74, 38, "6");
  var rows = grid.map((row) => row.join(""));
  var oikoumeneScenario = fromAscii({
    seed: "oikoumene",
    turnLimit: 160,
    rows,
    regions: ["Occidens", "Europa", "Italia", "Graecia", "Mediterraneum", "Africa", "Asia", "Oriens"],
    players: [
      { id: "rome", civ: "Rome", food: 8, production: 30, gold: 20, techs: [] },
      { id: "carthage", civ: "Carthage", food: 8, production: 32, gold: 26, techs: ["sailing"] },
      { id: "greece", civ: "Athens", food: 8, production: 30, gold: 22, techs: ["sailing"] },
      { id: "egypt", civ: "Egypt", food: 10, production: 30, gold: 24, techs: ["sailing"] },
      { id: "gaul", civ: "Gaul", food: 9, production: 30, gold: 16, techs: [] },
      { id: "parthia", civ: "Parthia", food: 8, production: 32, gold: 20, techs: [] }
    ]
  });

  // src/engine/scenarios/oldworld-epic.ts
  var W2 = 96;
  var H2 = 64;
  var grid2 = Array.from({ length: H2 }, () => Array(W2).fill("~"));
  function inB2(c, r) {
    return c >= 0 && r >= 0 && c < W2 && r < H2;
  }
  function blob2(cx, cy, rx, ry, ch) {
    for (let r = 0; r < H2; r += 1) for (let c = 0; c < W2; c += 1) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1) grid2[r][c] = ch;
    }
  }
  function rect2(c0, r0, c1, r1, ch) {
    for (let r = Math.max(0, r0); r <= Math.min(H2 - 1, r1); r += 1)
      for (let c = Math.max(0, c0); c <= Math.min(W2 - 1, c1); c += 1) grid2[r][c] = ch;
  }
  function stroke2(c0, r0, c1, r1, w, ch, landOnly = false) {
    const steps = Math.max(1, Math.round(Math.hypot(c1 - c0, r1 - r0)));
    for (let i = 0; i <= steps; i += 1) {
      const cx = c0 + (c1 - c0) * i / steps, cy = r0 + (r1 - r0) * i / steps;
      for (let r = Math.round(cy - w); r <= Math.round(cy + w); r += 1)
        for (let c = Math.round(cx - w); c <= Math.round(cx + w); c += 1) {
          if (!inB2(c, r) || (cx - c) * (cx - c) + (cy - r) * (cy - r) > w * w + 0.5) continue;
          if (landOnly && grid2[r][c] === "~") continue;
          grid2[r][c] = ch;
        }
    }
  }
  function onLand2(cx, cy, rx, ry, ch) {
    for (let r = 0; r < H2; r += 1) for (let c = 0; c < W2; c += 1) {
      const dx = (c - cx) / rx, dy = (r - cy) / ry;
      if (dx * dx + dy * dy <= 1 && grid2[r][c] !== "~") grid2[r][c] = ch;
    }
  }
  function set2(c, r, ch) {
    if (inB2(c, r)) grid2[r][c] = ch;
  }
  rect2(9, 9, 60, 27, ".");
  blob2(14, 33, 10, 8, ".");
  rect2(13, 25, 24, 31, ".");
  rect2(54, 4, 94, 16, ".");
  rect2(30, 20, 41, 30, ".");
  stroke2(38, 28, 42, 44, 1.5, ".");
  blob2(43, 45, 2.2, 1.4, ".");
  blob2(30, 29, 1.5, 1.9, ".");
  blob2(30, 34, 1.6, 2.1, ".");
  blob2(54, 32, 5.5, 5.5, ".");
  set2(52, 38, ".");
  set2(55, 39, ".");
  blob2(58, 40, 1.4, 1, ".");
  blob2(69, 32, 12, 5.5, ".");
  rect2(69, 22, 88, 36, ".");
  rect2(68, 32, 72, 52, ".");
  blob2(82, 43, 7.5, 4.5, ".");
  blob2(90, 38, 9.5, 10, ".");
  rect2(4, 47, 64, 62, ".");
  rect2(56, 45, 71, 54, ".");
  rect2(58, 54, 70, 63, ".");
  blob2(78, 55, 11, 9, ".");
  rect2(0, 0, 5, 63, "~");
  blob2(3, 34, 4, 10, "~");
  rect2(11, 0, 44, 6, "~");
  rect2(54, 0, 96, 4, "~");
  blob2(29, 45, 13, 5, "~");
  blob2(35, 38, 3, 4.5, "~");
  blob2(47, 44, 7, 4.5, "~");
  blob2(64, 47, 12, 5, "~");
  blob2(45, 32, 2.2, 5.5, "~");
  blob2(58, 35, 2.8, 4.5, "~");
  blob2(63, 23, 10, 5, "~");
  blob2(93, 24, 5, 6.5, "~");
  rect2(60, 54, 63, 63, "~");
  blob2(61, 58, 2.6, 6, "~");
  blob2(86, 50, 4.5, 3.5, "~");
  rect2(11, 3, 32, 13, "~");
  blob2(19, 7, 3.2, 3.8, ".");
  blob2(19, 11, 2.4, 1.7, ".");
  blob2(11, 10, 2.6, 2.2, ".");
  blob2(30, 46, 5, 3.2, ".");
  blob2(43, 11, 15, 5, "f");
  rect2(32, 7, 64, 10, "f");
  onLand2(18, 27, 6.5, 1.4, "^");
  onLand2(33, 22, 9, 1.6, "^");
  onLand2(39, 30, 0.8, 5.5, "^");
  onLand2(14, 46, 8.5, 1.6, "^");
  onLand2(51, 14, 6.5, 1.5, "^");
  onLand2(77, 24, 7.5, 1.9, "^");
  onLand2(68, 34, 9.5, 1.1, "^");
  stroke2(79, 33, 92, 47, 1.9, "^", true);
  onLand2(68, 33, 8.5, 2.7, "h");
  onLand2(54, 33, 3, 3, "h");
  onLand2(14, 33, 5, 4, "h");
  rect2(7, 53, 62, 62, "d");
  onLand2(70, 45, 9.5, 4.3, "d");
  onLand2(78, 55, 11, 9, "d");
  onLand2(58, 47, 4.3, 3.2, "d");
  onLand2(59, 51, 3.2, 8, "d");
  stroke2(60, 62, 60, 55, 0.7, "=", true);
  stroke2(60, 55, 59, 47, 0.7, "=", true);
  rect2(57, 46, 61, 47, "=");
  set2(60, 58, ":");
  stroke2(46, 20, 62, 24, 0.7, "=", true);
  stroke2(34, 26, 31, 12, 0.7, "=", true);
  stroke2(84, 36, 86, 49, 0.7, "=", true);
  stroke2(80, 36, 84, 49, 0.7, "=", true);
  set2(39, 36, "1");
  set2(30, 46, "2");
  set2(54, 37, "3");
  set2(58, 51, "4");
  set2(60, 61, "5");
  set2(25, 17, "6");
  set2(19, 8, "7");
  set2(84, 40, "8");
  var LEGEND2 = {
    "~": "sea",
    " ": "sea",
    ":": "coast",
    ".": "plains",
    ",": "valley",
    f: "forest",
    h: "hills",
    H: "highlands",
    "^": "mountains",
    M: "mountains",
    d: "desert",
    "=": "great-river"
  };
  function offsetToAxial3(col, row) {
    return { q: col - (row - (row & 1) >> 1), r: row };
  }
  function climateBand(row) {
    const y = row / (H2 - 1) * 100;
    if (y < 30) return "north";
    if (y < 55) return "temperate";
    if (y < 75) return "mediterranean";
    return "arid";
  }
  function oldWorldEpic(seed = "old-world") {
    const tiles = {};
    const capitalAt = {};
    const usedRegions = /* @__PURE__ */ new Set();
    for (let row = 0; row < H2; row += 1) {
      for (let col = 0; col < W2; col += 1) {
        const ch = grid2[row][col];
        let terrain;
        if (ch >= "1" && ch <= "9") {
          terrain = "plains";
          capitalAt[Number(ch) - 1] = offsetToAxial3(col, row);
        } else terrain = LEGEND2[ch] ?? "sea";
        const region = climateBand(row);
        usedRegions.add(region);
        tiles[keyOf(offsetToAxial3(col, row))] = { terrain, region };
      }
    }
    const cities = {};
    const units = {};
    const occupied = /* @__PURE__ */ new Set();
    const STARTS = [
      { id: "rome", civ: "rome" },
      { id: "carthage", civ: "carthage" },
      { id: "greece", civ: "greece" },
      { id: "egypt", civ: "egypt" },
      { id: "kush", civ: "kush" },
      { id: "gaul", civ: "gaul" },
      { id: "britons", civ: "britons" },
      { id: "parthia", civ: "parthia" }
    ];
    const players = STARTS.map((s) => ({ id: s.id, civ: s.civ, food: 8, production: 30, gold: 20, techs: [] }));
    STARTS.forEach((s, i) => {
      const cap2 = capitalAt[i];
      if (!cap2) return;
      tiles[keyOf(cap2)] = { terrain: "plains", region: climateBand(cap2.r) };
      cities[`${s.id}_capital`] = { id: `${s.id}_capital`, ownerId: s.id, position: cap2, population: 2, hp: 40, maxHp: 40, isCapital: true };
      occupied.add(keyOf(cap2));
      const spots = [];
      for (const n of neighborsOf(cap2)) {
        const k = keyOf(n);
        const tt = tiles[k]?.terrain;
        if (tt && tt !== "sea" && tt !== "coast" && tt !== "great-river" && tt !== "mountains" && !occupied.has(k)) spots.push(n);
        if (spots.length >= 2) break;
      }
      const wp = spots[0] ?? cap2;
      occupied.add(keyOf(wp));
      const ep = spots[1] ?? cap2;
      occupied.add(keyOf(ep));
      units[`${s.id}_warrior`] = { id: `${s.id}_warrior`, type: "warrior", ownerId: s.id, position: wp };
      units[`${s.id}_explorer`] = { id: `${s.id}_explorer`, type: "explorer", ownerId: s.id, position: ep };
    });
    const RUIN_SITES = [
      [58, 47, "giza"],
      [86, 45, "ur"],
      [88, 42, "ashurbanipal"],
      [72, 30, "hattusa"],
      [74, 34, "gobekli"],
      [58, 40, "knossos"],
      [56, 38, "mycenae"],
      [63, 33, "troy"],
      [60, 60, "kerma"],
      [30, 34, "nuraghe"],
      [40, 30, "terramare"],
      [45, 12, "nebra"],
      [35, 24, "hallstatt"],
      [19, 12, "stonehenge"],
      [14, 34, "tartessos"]
    ];
    const isLand2 = (c, r) => {
      const t = tiles[keyOf(offsetToAxial3(c, r))];
      return !!t && t.terrain !== "sea" && t.terrain !== "coast" && t.terrain !== "great-river";
    };
    const snap = (c0, r0) => {
      for (let rad = 0; rad < 6; rad += 1) for (let dr = -rad; dr <= rad; dr += 1) for (let dc = -rad; dc <= rad; dc += 1) {
        if (isLand2(c0 + dc, r0 + dr)) {
          const p = offsetToAxial3(c0 + dc, r0 + dr);
          if (!occupied.has(keyOf(p))) return p;
        }
      }
      return null;
    };
    const ruins = {};
    for (const [c, r, id] of RUIN_SITES) {
      const p = snap(c, r);
      if (!p) continue;
      const k = keyOf(p);
      if (ruins[k]) continue;
      ruins[k] = { ruinId: id, excavated: false };
      occupied.add(k);
    }
    const VILLAGE_SITES = [
      [42, 38, "latins", "open"],
      [43, 40, "samnites", "hostile"],
      [37, 33, "etruscans", "wary"],
      [41, 30, "veneti", "open"],
      [49, 33, "illyrians", "wary"],
      [58, 31, "thracians", "wary"],
      [55, 27, "getae", "hostile"],
      [66, 37, "lydians", "open"],
      [80, 35, "armenians", "wary"],
      [68, 45, "judeans", "wary"],
      [72, 50, "nabataeans", "hostile"],
      [86, 48, "chaldeans", "wary"],
      [28, 50, "numidians", "hostile"],
      [28, 15, "belgae", "wary"]
    ];
    const villages = {};
    for (const [c, r, id, disp] of VILLAGE_SITES) {
      const p = snap(c, r);
      if (!p) continue;
      const k = keyOf(p);
      if (villages[k] || ruins[k]) continue;
      villages[k] = { peopleId: id, disposition: disp };
      occupied.add(k);
    }
    return {
      seed,
      turnLimit: 160,
      players,
      map: { width: W2, height: H2, regions: Array.from(usedRegions), rivers: {}, tiles, cities, units, ruins, villages }
    };
  }

  // src/engine/scenarios.ts
  var SCENARIOS = {
    italia: {
      id: "italia",
      name: "Italia: Rome vs Carthage",
      historicalBrief: "Third century BC: Rome and Carthage contest control of Italy and western Mediterranean trade, balancing expansion with logistics.",
      briefing: {
        era: "264 BC \u2014 the eve of the First Punic War",
        situation: "Rome has mastered the Italian peninsula through her legions and her web of Latin alliances. Across the sea, Carthage \u2014 heir to Phoenician Tyre \u2014 commands the richest trade network in the western Mediterranean and a navy without equal. Sicily lies between them like a stepping-stone, and neither power can let the other hold it.",
        objectives: [
          "Grow your cities and out-expand your rival up and down the boot",
          "Build harbours and a fleet \u2014 this is a war fought across water",
          "Win by holding every capital (Domination), or by leading on score when the age ends (Quick)"
        ],
        didYouKnow: "The Romans called this war 'Punic' from Poeni, their word for the Phoenician settlers who founded Carthage around 814 BC. Rome had almost no fleet in 264 BC \u2014 she reputedly reverse-engineered her first warships from a shipwrecked Carthaginian vessel."
      },
      config: italiaScenario
    },
    hellas: {
      id: "hellas",
      name: "Hellas: Greeks and Persians",
      historicalBrief: "Fifth century BC: the Greek city-states and the Persian empire contend for the Aegean, while Egypt watches from the south.",
      briefing: {
        era: "431 BC \u2014 the Aegean in the age of Pericles",
        situation: "The mountainous Greek homeland and the Peloponnese look east across an island-strewn sea to the Ionian coast, where the Great King's satraps hold the cities of Asia. Egypt, ancient and grain-rich, guards the southern shore beyond Crete. Triremes, not walls, will decide who commands the Aegean.",
        objectives: [
          "Command the sea lanes with harbours and triremes",
          "Seize the islands and coasts that link the three shores",
          "Prevail by domination or by leading on score at the age's end"
        ],
        didYouKnow: "At Salamis in 480 BC an outnumbered Greek fleet destroyed the Persian navy in the narrows \u2014 perhaps 300 triremes against 600 or more. A single trireme carried around 170 rowers, and Athens' power rested on her ability to man scores of them."
      },
      config: hellasScenario
    },
    oldworld: {
      id: "oldworld",
      name: "The Old World",
      historicalBrief: "The whole classical Mediterranean and Near East: six great powers from Gaul to Persia contend for the age.",
      briefing: {
        era: "The Classical Age \u2014 from the Pillars of Hercules to the Iranian plateau",
        situation: "The full sweep of the ancient world lies open: Gaul and Iberia in the west, Rome astride her boot, Carthage on the African shore, the Greek Aegean, the Nile of Egypt, and the empire of Parthia beyond the Euphrates. Six powers, one sea to bind them, and an entire age in which to build a hegemony \u2014 or be swallowed by one.",
        objectives: [
          "Expand from your homeland across the Mare Nostrum",
          "Master land and sea \u2014 legions, cavalry, siege and fleets",
          "Outlast five rivals: hold every capital, or lead on score when the age closes"
        ],
        didYouKnow: "At its height under Trajan (AD 117) the Roman Empire ran some 5 million square kilometres and perhaps 60\u201370 million people \u2014 around a fifth of humanity. No western state would match its span again for a thousand years."
      },
      config: oldWorldScenario
    },
    oikoumene: {
      id: "oikoumene",
      name: "The Known World (huge)",
      historicalBrief: "The whole classical oikoumene at grand scale \u2014 from Iberia and Britain to the Indus, the world as the ancients mapped it.",
      briefing: {
        era: "The Known World \u2014 the oikoumene, Pillars of Hercules to the Indus",
        situation: "This is the world as Herodotus, Eratosthenes and Ptolemy knew it: the Mediterranean at its heart, Europe to the north, Africa and the great desert to the south, and the roads of Asia running east past the Euphrates to Persia and the edge of India. Six powers begin in their true homelands \u2014 Rome in Italy, Carthage on the African shore, Greece on the Aegean, Egypt on the Nile, the Gauls in the west, and Parthia in Mesopotamia. The stage is vast; an age will pass before it is decided.",
        objectives: [
          "Build an empire across a continent-spanning map \u2014 expect a long campaign",
          "Command land and sea across the whole Mediterranean world",
          "Win by holding every capital, or by leading on score when the age closes"
        ],
        didYouKnow: "Around 240 BC Eratosthenes, chief librarian at Alexandria, measured the Earth's circumference from the angle of shadows at Syene and Alexandria \u2014 landing within a few percent of the true 40,000 km, using nothing but geometry and a well."
      },
      config: oikoumeneScenario
    },
    "oldworld-epic": {
      id: "oldworld-epic",
      name: "The Old World (epic)",
      historicalBrief: "The hand-authored classical world, ~96\xD764: the Mediterranean at its heart, Italy's boot, Britain, the Nile and four other great rivers, eight powers in their true homelands.",
      briefing: {
        era: "The Classical Age \u2014 the whole Old World, Pillars of Hercules to the Iranian plateau",
        situation: "This is the world drawn as it was: the Mare Nostrum narrowing at Sicily, Italy's boot reaching for Africa, Britain beyond the Channel, the Alps sealing the north, and the Nile threading the desert from the cataracts of Kush to its delta. Eight peoples begin at home \u2014 Rome, Carthage, Athens, Egypt, Kush, Gaul, the Britons and Parthia \u2014 and the great rivers are highways and walls both.",
        objectives: [
          "Rise from your homeland to a hegemony over the whole Old World",
          "Hold the straits and the great rivers \u2014 they decide who moves and who is walled out",
          "Win by holding every capital, or by leading on score when the age closes"
        ],
        didYouKnow: "The Nile flows NORTH: fed by the Ethiopian highlands and the great lakes, it runs 6,600 km downhill to the Mediterranean, so 'Upper Egypt' is in the south and 'Lower Egypt' \u2014 the delta \u2014 is in the north."
      },
      config: oldWorldEpic()
    }
  };
  function listScenarios() {
    return Object.values(SCENARIOS);
  }
  function loadScenario(id) {
    const scenario = SCENARIOS[id];
    if (!scenario) {
      throw new Error(`Unknown scenario ${id}`);
    }
    const clone = JSON.parse(JSON.stringify(scenario));
    if (clone.config.map?.tiles) sprinkleResources(clone.config.map.tiles, "scenario:" + id);
    return clone;
  }

  // src/engine/titles.ts
  var LAUREL_THRESHOLDS = [0, 3, 7, 12, 18, 25, 34, 45, 58, 73, 90];
  var TITLE_LADDERS = {
    rome: [
      { name: "Servus", note: "A slave \u2014 the bottom of Rome's steep ladder, yet a freedman's son could rise." },
      { name: "Libertus", note: "A freedman, manumitted but still bound by duty to his former master's house." },
      { name: "Plebeius", note: "A commoner of the plebs, who won tribunes to guard the people's rights." },
      { name: "Civis", note: "A Roman citizen \u2014 the proud claim 'Civis Romanus sum' that shielded a man across the world." },
      { name: "Eques", note: "A knight of the equestrian order, wealthy enough to keep a horse and finance the state." },
      { name: "Quaestor", note: "The first rung of the cursus honorum: a magistrate of the treasury and the army's pay." },
      { name: "Aedilis", note: "Overseer of streets, markets, and the games \u2014 a costly office that bought a career." },
      { name: "Praetor", note: "A judge and, in war, a commander with imperium second only to the consuls." },
      { name: "Consul", note: "One of two chief magistrates elected yearly, each able to veto the other \u2014 Rome's check on one-man rule." },
      { name: "Censor", note: "Guardian of the census and public morals; even ex-consuls sought this crowning honour." },
      { name: "Princeps", note: "'First citizen' \u2014 the title Augustus took to rule as emperor while pretending the Republic lived." }
    ],
    egypt: [
      { name: "Peasant of the Black Land", note: "A farmer of the dark Nile silt (kemet) whose flood fed all Egypt." },
      { name: "Scribe", note: "A literate servant of the state \u2014 in Egypt, the pen opened every door." },
      { name: "Priest of Amun", note: "A servant of the hidden god of Thebes, whose temples rivalled the throne." },
      { name: "Overseer", note: "A manager of granaries, works, or labour gangs for the crown." },
      { name: "Nomarch", note: "Governor of a nome (province) \u2014 in weak times, a king in miniature." },
      { name: "Vizier", note: "The chief minister (tjaty), who ran the kingdom in Pharaoh's name." },
      { name: "Regent of the Two Lands", note: "Ruler of Upper and Lower Egypt, the reed and the bee joined under one crown." }
    ],
    greece: [
      { name: "Metic", note: "A resident foreigner of the polis \u2014 free and useful, but never a citizen." },
      { name: "Citizen", note: "A polites, sharing in the assembly and the duties of the city-state." },
      { name: "Hoplite", note: "A citizen-soldier who bought his own shield and stood in the phalanx line." },
      { name: "Choregos", note: "A wealthy patron who funded a tragic chorus \u2014 civic glory through generosity." },
      { name: "Strategos", note: "An elected general; at Athens, Pericles held the office year after year." },
      { name: "Archon", note: "A chief magistrate of the city; the archon eponymos gave his name to the year." },
      { name: "Hegemon", note: "Leader of a league of cities \u2014 the hegemony Athens and Sparta each fought to hold." }
    ],
    carthage: [
      { name: "Deckhand", note: "A hand aboard the ships that made Carthage mistress of the western sea." },
      { name: "Merchant", note: "A trader in Tyrian purple, silver, and grain across the Mediterranean." },
      { name: "Shipmaster", note: "Captain of a merchantman or a war-galley of the great harbour." },
      { name: "Rab", note: "A commander or chief \u2014 the Punic title of those who led men and fleets." },
      { name: "Member of the Hundred-and-Four", note: "One of the tribunal of judges who kept even generals in fear of the state." },
      { name: "Shophet", note: "One of two chief magistrates ('judges') elected yearly to head the republic." }
    ],
    gaul: [
      { name: "Farmhand", note: "A worker of the fields of Gaul, rich in grain, cattle, and iron." },
      { name: "Warrior", note: "A sworn fighter of the tribe, glory-hungry and fearsome in the charge." },
      { name: "Chieftain's Companion", note: "One of the ambacti, the retainers who ate at a chief's hall and died at his side." },
      { name: "Noble", note: "An equites of Gaul \u2014 a horse-owning aristocrat with clients of his own." },
      { name: "Druid's Counsel", note: "Trusted of the druids, who judged disputes and kept the tribe's law and lore." },
      { name: "Vergobret", note: "The supreme elected magistrate of a Gallic people, holding power for one year." }
    ],
    britons: [
      { name: "Herdsman", note: "A keeper of cattle and sheep on the green, misty isle." },
      { name: "Charioteer", note: "A driver of the war-chariots that so unnerved the legions on the beaches." },
      { name: "Clan Champion", note: "The chosen fighter of a clan, first into the fray and first in honour." },
      { name: "Chieftain", note: "Lord of a British tribe \u2014 the Trinovantes, Iceni, or Catuvellauni." },
      { name: "High King/Queen", note: "Over-ruler of many tribes \u2014 as Cunobelinus reigned, and Boudica led in revolt." }
    ],
    parthia: [
      { name: "Herdsman", note: "A breeder of the great Nisaean horses of the Iranian plateau." },
      { name: "Horse Archer", note: "A rider of the 'Parthian shot', loosing arrows in feigned retreat." },
      { name: "Azat", note: "A free noble of the warrior aristocracy who owed the king cavalry, not coin." },
      { name: "Satrap", note: "Governor of a province, ruling in the King of Kings' name over vast distances." },
      { name: "Spahbed", note: "A supreme army commander \u2014 one broke Crassus and Rome at Carrhae in 53 BC." },
      { name: "King of Kings", note: "The \u0160\u0101h\u0101n \u0160\u0101h, overlord of the many kings and satraps of the Parthian realm." }
    ],
    kush: [
      { name: "Farmer of the Cataracts", note: "A tiller of the narrow green banks between the Nile's rocky cataracts." },
      { name: "Bowman", note: "An archer of Ta-Seti, 'the Land of the Bow' \u2014 Kush's most famous export was skill with it." },
      { name: "Master of Mero\xEB's Furnaces", note: "An ironmaster of Mero\xEB, whose smelters earned it a name among the world's metalworkers." },
      { name: "Priest of Apedemak", note: "A servant of the lion-headed war god of Kush, distinct from Egypt's own gods." },
      { name: "Qore / Kandake", note: "The king (qore) or the powerful queen mother (kandake) who ruled from Mero\xEB." }
    ]
  };
  var LADDER_ALIAS = { greeks: "greece", athens: "greece", gauls: "gaul", nubia: "kush" };
  function ladderKey(civ) {
    const k = String(civ || "").toLowerCase();
    return TITLE_LADDERS[k] ? k : LADDER_ALIAS[k] || k;
  }
  function titleIndexForLaurels(civ, laurels) {
    const ladder = TITLE_LADDERS[ladderKey(civ)];
    if (!ladder || !ladder.length) return 0;
    let idx = 0;
    for (let i = 0; i < ladder.length; i += 1) if (laurels >= (LAUREL_THRESHOLDS[i] ?? Infinity)) idx = i;
    return idx;
  }
  function titleForLaurels(civ, laurels) {
    const ladder = TITLE_LADDERS[ladderKey(civ)];
    if (!ladder || !ladder.length) return null;
    return ladder[titleIndexForLaurels(civ, laurels)];
  }
  function nextTitleInfo(civ, laurels) {
    const ladder = TITLE_LADDERS[ladderKey(civ)];
    if (!ladder || !ladder.length) return null;
    const i = titleIndexForLaurels(civ, laurels);
    if (i >= ladder.length - 1) return null;
    return { name: ladder[i + 1].name, need: Math.max(0, (LAUREL_THRESHOLDS[i + 1] ?? Infinity) - laurels) };
  }
  function laurelsForGame(won, victoryType) {
    if (!won) return 1;
    return victoryType === "domination" ? 4 : 3;
  }
  return __toCommonJS(browser_entry_exports);
})();
