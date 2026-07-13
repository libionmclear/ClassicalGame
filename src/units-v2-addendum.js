// HEGEMON — units-v2-addendum.js : wave-2 unique units (+2 per civ → 5 each, 60 total)
// Merge into units-v2.js UNIQUE_UNITS / UNIT_SILHOUETTES (same schema).

export const UNIQUE_UNITS_WAVE2 = [
  // ROME
  { id:"equites", civ:"rome", cat:"mounted", basedOn:"horseman", unlockedBy:"res-publica", age:2,
    mods:{ atk:+1, def:+1, special:"+1move-on-roads" },
    role:"Citizen cavalry",
    note:"The knightly class — census-ranked citizens rich enough to bring a horse." },
  { id:"scorpio-battery", civ:"rome", cat:"siege", basedOn:"siege-ballista", unlockedBy:"marian-reforms", age:3,
    mods:{ atkVsUnits:+25, atkVsCities:-25, move:+1, cheap:true },
    role:"Anti-personnel artillery",
    note:"Bolt-throwers issued per centuria — field artillery, not just siege." },

  // CARTHAGE
  { id:"balearic-slingers", civ:"carthage", cat:"ranged", basedOn:"archer", unlockedBy:"mercenary-system", age:2,
    mods:{ atk:+1, cheap:true, special:"ignores-25pct-armor" },
    role:"Mercenary slingers",
    note:"Paid in women and wine, said the ancients; their lead shot cracked helmets." },
  { id:"iberian-scutarii", civ:"carthage", cat:"infantry", basedOn:"swordsman", unlockedBy:"mercenary-system", age:2,
    mods:{ atk:+1, move:+1 },
    role:"Mercenary swordsmen",
    note:"The falcata blade so good Rome copied it into the gladius hispaniensis." },

  // ATHENS
  { id:"epibatai", civ:"greece", cat:"infantry", basedOn:"spearman", unlockedBy:"neorion", age:2,
    mods:{ def:+1, special:"no-embark-penalty, +25-in-naval-boarding" },
    role:"Marines",
    note:"Ten hoplites per trireme — the deck was their phalanx." },
  { id:"toxotai", civ:"greece", cat:"ranged", basedOn:"archer", unlockedBy:"ekklesia", age:2,
    mods:{ cheap:true, special:"+1-city-defense-when-garrisoned" },
    role:"City archers",
    note:"Athens' public archer corps — famously including Scythians bought by the state." },

  // EGYPT
  { id:"nile-galley", civ:"egypt", cat:"naval", basedOn:"war-galley", unlockedBy:"red-sea-canal", age:2,
    mods:{ special:"may-enter-major-rivers", atk:+1, riverBonus:+25 },
    role:"River warship",
    note:"Egypt's navy was the Nile first — the river was the kingdom's one great road." },
  { id:"kalasiris", civ:"egypt", cat:"spear", basedOn:"spearman", unlockedBy:"machimoi-greeks", age:2,
    mods:{ atk:+1, def:+1, special:"upkeep-paid-in-food" },
    role:"Warrior-caste elite",
    note:"Herodotus names them: the Kalasiries, hereditary soldiers a quarter-million strong." },

  // GAUL
  { id:"carnyx-bearer", civ:"gaul", cat:"support", basedOn:"merchant", unlockedBy:"carnyx-terror", age:2,
    mods:{ noAttack:true, special:"adjacent-friendlies+10atk-first-round" },
    role:"War-horn aura",
    note:"One boar-headed horn per warband; Polybius said the noise alone unnerved armies." },
  { id:"trimarkisia", civ:"gaul", cat:"mounted", basedOn:"horseman", unlockedBy:"noble-cavalry", age:3,
    mods:{ special:"self-heal-2-per-turn-even-after-acting", atk:+1 },
    role:"Relay cavalry",
    note:"Three riders per horse-team: one fights, two remount him — attested at Delphi, 279 BC." },

  // PARTHIA
  { id:"saka-lancers", civ:"parthia", cat:"mounted", basedOn:"horseman", unlockedBy:"feudal-levies", age:3,
    mods:{ atk:+2, cheap:true, special:"+15-vs-ranged" },
    role:"Allied steppe lancers",
    note:"Saka horse-tribes rode for Parthian silver — cousins from the deeper steppe." },
  { id:"mardian-archers", civ:"parthia", cat:"ranged", basedOn:"archer", unlockedBy:"composite-bows", age:2,
    mods:{ atk:+1, special:"ignores-hill-move-penalty" },
    role:"Mountain foot archers",
    note:"Hillmen archers of the Iranian ranges — the foot component Carrhae never needed." },

  // SPARTA
  { id:"hippeis", civ:"sparta", cat:"spear", basedOn:"hoplite", unlockedBy:"with-your-shield", age:3,
    mods:{ atk:+2, def:+2, cap:"max-1", cost:+60, special:"adjacent-friendlies-never-rout" },
    role:"The royal 300",
    note:"Called 'the horsemen' — who fought on foot around the king. Thermopylae's core." },
  { id:"helot-skirmishers", civ:"sparta", cat:"ranged", basedOn:"archer", unlockedBy:"helot-agriculture", age:2,
    mods:{ cheap:true, atk:-1, special:"training-costs-no-pop-but--1-city-stability" },
    role:"Pressed levies",
    note:"Serfs armed reluctantly and watched constantly — cheap in gold, costly in trust." },

  // MACEDON
  { id:"agrianians", civ:"macedon", cat:"ranged", basedOn:"archer", unlockedBy:"royal-pages", age:2,
    mods:{ move:+1, atk:+1, special:"ignores-hill-forest-penalty" },
    role:"Elite javelinmen",
    note:"Alexander's favourite light troops — first up every cliff, first across every river." },
  { id:"thessalian-cavalry", civ:"macedon", cat:"mounted", basedOn:"horseman", unlockedBy:"league-of-corinth", age:2,
    mods:{ def:+2, atk:+1, special:"+20-when-defending" },
    role:"The left-wing anvil",
    note:"The one cavalry rated the Companions' equal — Parmenion's wing at Gaugamela." },

  // PERSIA
  { id:"takabara", civ:"persia", cat:"ranged", basedOn:"archer", unlockedBy:"satrapy-system", age:2,
    mods:{ move:+1, cheap:true, special:"may-retreat-after-attack-vs-melee" },
    role:"Crescent-shield skirmishers",
    note:"Anatolian levies with wicker crescents — Persia's own peltast answer." },
  { id:"kardakes", civ:"persia", cat:"spear", basedOn:"spearman", unlockedBy:"royal-judges", age:3,
    mods:{ def:+1, atk:+1 },
    role:"Drilled heavy infantry",
    note:"Persia's attempt to build its own hoplites — they held the line at Issus, briefly." },

  // HAN
  { id:"beacon-garrison", civ:"han", cat:"support", basedOn:"merchant", unlockedBy:"border-walls", age:3,
    mods:{ noAttack:true, special:"vision+2, adjacent-city-def+15, reveals-adjacent-fog" },
    role:"Signal corps",
    note:"Smoke by day, fire by night — the frontier spoke in beacons faster than riders." },
  { id:"xiongnu-auxiliaries", civ:"han", cat:"ranged", basedOn:"archer", unlockedBy:"heavenly-horses", age:3,
    mods:{ mounted:true, move:+2, cheap:true, special:"may-move-after-attack, gold-purchase-only" },
    role:"Surrendered nomad horse",
    note:"Defeated Xiongnu bands rode for Han pay — set a nomad to catch a nomad." },

  // MAURYA
  { id:"atavika-levies", civ:"maurya", cat:"infantry", basedOn:"warrior", unlockedBy:"spy-bureaus", age:2,
    mods:{ cheap:true, move:+1, special:"invisible-in-forest-until-adjacent, +25-in-forest" },
    role:"Forest-tribe fighters",
    note:"The Arthashastra budgets for them by name: wild-country troops for wild country." },
  { id:"maiden-guard", civ:"maurya", cat:"infantry", basedOn:"swordsman", unlockedBy:"arthashastra", age:2,
    mods:{ atk:+1, def:+2, cap:"max-2", special:"must-garrison-or-stack-with-capital-forces, garrison-city-stability+1" },
    role:"Royal bodyguard",
    note:"Megasthenes saw them: armed women guarding Chandragupta's person — trusted where men were not." },

  // SCYTHIA
  { id:"wagon-fort", civ:"scythia", cat:"support", basedOn:"merchant", unlockedBy:"wagon-camps", age:2,
    mods:{ noAttack:true, def:+3, special:"adjacent-friendlies+20def, blocks-mounted-charge-bonus" },
    role:"Mobile laager",
    note:"Circle the wagons: the steppe's instant fortress, wherever the herd stopped." },
  { id:"sarmatian-lancers", civ:"scythia", cat:"heavy", basedOn:"horseman", unlockedBy:"steppe-tribute", age:3,
    mods:{ atk:+2, def:+2, cost:+40, special:"+25-on-first-charge" },
    role:"Armoured lance kin",
    note:"The eastern cousins in scale and contus lance — the steppe's own heavy answer." },
];

export const UNIT_SILHOUETTES_WAVE2 = {
  equites:"rider + small round shield + no armor skirt", "scorpio-battery":"tripod bolt-thrower + 2 crew",
  "balearic-slingers":"whirling sling overhead", "iberian-scutarii":"oval scutum + curved falcata",
  epibatai:"hoplite on deck plank base", toxotai:"archer + pointed cap",
  "nile-galley":"low hull + single square sail + oar bank", kalasiris:"spearman + striped headcloth",
  "carnyx-bearer":"vertical boar-head horn above figure", trimarkisia:"one rider + led spare horse",
  "saka-lancers":"long lance + tall pointed cap", "mardian-archers":"archer crouched on rock base",
  hippeis:"hoplite + transverse crest + gold trim", "helot-skirmishers":"unarmored, half-crouch, sling",
  agrianians:"javelin raised + small pelte + running pose", "thessalian-cavalry":"rider + rhomboid pennant",
  takabara:"crescent wicker shield", kardakes:"spearman + persian tiara",
  "beacon-garrison":"small tower + smoke column", "xiongnu-auxiliaries":"fur-capped rider twisted backward",
  "atavika-levies":"crouched figure + leaf cover hint", "maiden-guard":"swordswoman + long braid + tall shield",
  "wagon-fort":"3 wagons in tight triangle", "sarmatian-lancers":"fully scaled rider + very long contus",
};
