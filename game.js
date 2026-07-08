(function () {
  const engine = window.HegemonEngine;
  if (!engine) {
    throw new Error("Engine bundle is not loaded. Run: npm run build:web");
  }

  const boardEl = document.getElementById("board");
  const statusEl = document.getElementById("status-line");
  const victoryEl = document.getElementById("victory-line");
  const newGameBtn = document.getElementById("new-game-btn");
  const endTurnBtn = document.getElementById("end-turn-btn");
  const mapSizeSelectEl = document.getElementById("map-size-select");
  const playerCountSelectEl = document.getElementById("player-count-select");
  const victoryModeSelectEl = document.getElementById("victory-mode-select");
  const turnsInputEl = document.getElementById("turns-input");
  const turnsPickerEl = document.getElementById("turns-picker");
  const difficultySelectEl = document.getElementById("difficulty-select");
  const civSelectEl = document.getElementById("civ-select");
  const selectionLineEl = document.getElementById("selection-line");
  const actionLogEl = document.getElementById("action-log");
  const clearSelectionBtn = document.getElementById("clear-selection-btn");
  const turnChecklistEl = document.getElementById("turn-checklist");
  const foundCityBtn = document.getElementById("found-city-btn");
  const tradeRouteBtn = document.getElementById("trade-route-btn");
  const upgradeBtn = document.getElementById("upgrade-btn");
  const disbandBtn = document.getElementById("disband-btn");
  const controlPanelEl = document.getElementById("control-panel");
  const cpCloseBtn = document.getElementById("cp-close");
  const cityTabsEl = document.getElementById("city-tabs");
  const unitDetailToggleEl = document.getElementById("unit-detail-toggle");
  let cityTab = "units"; // which city pane is showing: units | improvements
  const combatToastsEl = document.getElementById("combat-toasts");
  const unitActionsGroupEl = document.getElementById("unit-actions-group");
  const cityOutputGroupEl = document.getElementById("city-output-group");
  const cityOutputEl = document.getElementById("city-output");
  const queueGroupEl = document.getElementById("queue-group");
  const recruitGroupEl = document.getElementById("recruit-group");
  const buildingsGroupEl = document.getElementById("buildings-group");
  const researchGroupEl = document.getElementById("research-group");
  const buildMenuEl = document.getElementById("build-menu");
  const improveGroupEl = document.getElementById("improve-group");
  const improveMenuEl = document.getElementById("improve-menu");
  const buildingMenuEl = document.getElementById("building-menu");
  const buildQueueEl = document.getElementById("build-queue");
  const techTreeEl = document.getElementById("tech-tree");
  const hintLineEl = document.getElementById("hint-line");
  const resourceBarEl = document.getElementById("resource-bar");
  const weatherBarEl = document.getElementById("weather-bar");
  const legendEl = document.getElementById("legend");
  const rankingEl = document.getElementById("ranking");
  const resultModalEl = document.getElementById("result-modal");
  const resultTitleEl = document.getElementById("result-title");
  const resultBodyEl = document.getElementById("result-body");
  const resultNewGameBtn = document.getElementById("result-new-game-btn");
  const eventModalEl = document.getElementById("event-modal");
  const eventTitleEl = document.getElementById("event-title");
  const eventSituationEl = document.getElementById("event-situation");
  const eventOptionsEl = document.getElementById("event-options");
  const researchBtn = document.getElementById("research-btn");
  const researchModalEl = document.getElementById("research-modal");
  const researchCloseBtn = document.getElementById("research-close-btn");
  const menuBtn = document.getElementById("menu-btn");
  const menuOverlayEl = document.getElementById("menu-overlay");
  const menuCloseBtn = document.getElementById("menu-close");
  const authOverlayEl = document.getElementById("auth-overlay");
  const authLoginPane = document.getElementById("auth-login-pane");
  const authRegisterPane = document.getElementById("auth-register-pane");
  const authLoginUser = document.getElementById("auth-login-user");
  const authLoginPass = document.getElementById("auth-login-pass");
  const authLoginBtn = document.getElementById("auth-login-btn");
  const authLoginErr = document.getElementById("auth-login-err");
  const authRegName = document.getElementById("auth-reg-name");
  const authRegEmail = document.getElementById("auth-reg-email");
  const authRegPass = document.getElementById("auth-reg-pass");
  const authRegisterBtn = document.getElementById("auth-register-btn");
  const authRegErr = document.getElementById("auth-reg-err");
  const authShowRegister = document.getElementById("auth-show-register");
  const authShowLogin = document.getElementById("auth-show-login");
  const accountLineEl = document.getElementById("account-line");
  const changePwBtn = document.getElementById("change-pw-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const handBtn = document.getElementById("hand-btn");
  const handModalEl = document.getElementById("hand-modal");
  const handBodyEl = document.getElementById("hand-body");
  const handCloseBtn = document.getElementById("hand-close-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const turnIndicatorEl = document.getElementById("turn-indicator");
  const standingsBtn = document.getElementById("standings-btn");
  const standingsPanelEl = document.getElementById("standings-panel");
  const profileBtn = document.getElementById("profile-btn");
  const profileModalEl = document.getElementById("profile-modal");
  const profileCloseBtn = document.getElementById("profile-close-btn");
  const profileBodyEl = document.getElementById("profile-body");
  const cardsBtn = document.getElementById("cards-btn");
  const cardsModalEl = document.getElementById("cards-modal");
  const cardsCloseBtn = document.getElementById("cards-close-btn");
  const cardsBodyEl = document.getElementById("cards-body");
  const codexBtn = document.getElementById("codex-btn");
  const codexModalEl = document.getElementById("codex-modal");
  const codexBodyEl = document.getElementById("codex-body");
  const codexCloseBtn = document.getElementById("codex-close-btn");
  const colorsBtn = document.getElementById("colors-btn");
  const colorsModalEl = document.getElementById("colors-modal");
  const colorsListEl = document.getElementById("colors-list");
  const colorsCloseBtn = document.getElementById("colors-close-btn");
  const colorsResetBtn = document.getElementById("colors-reset-btn");
  const zoomInBtn = document.getElementById("zoom-in-btn");
  const zoomOutBtn = document.getElementById("zoom-out-btn");
  const briefingModalEl = document.getElementById("briefing-modal");
  const briefEraEl = document.getElementById("brief-era");
  const briefTitleEl = document.getElementById("brief-title");
  const briefSituationEl = document.getElementById("brief-situation");
  const briefObjectivesEl = document.getElementById("brief-objectives");
  const briefDidYouKnowEl = document.getElementById("brief-didyouknow");
  const briefBeginBtn = document.getElementById("brief-begin-btn");

  let state = null;
  let selectedUnitId = null;
  let selectedCityId = null;
  let selectedTileKey = null;
  let actionLog = [];
  // Set true once a finished game's result has been recorded to the profile, so
  // the win/loss is counted exactly once (render runs many times per game).
  let resultRecorded = false;
  // Civs already announced as destroyed, so we say it once each.
  let announcedDead = {};
  // Admin testing: reveal the whole map (set when an admin signs in; toggle in menu).
  let adminRevealMap = false;
  // Admin map editor: paint terrain onto the live map, then export it as an atlas.
  let mapEditMode = false;
  let editBrush = "plains";
  // Where the player last pressed on the board — the in-play menu opens there.
  let lastBoardPointer = null;
  // The selection the floating menu was last positioned for (so it only re-anchors
  // when the selection changes, not on every re-render).
  let ctxPositionedFor = null;
  // Selecting a unit shows a small symbol (not the full panel) so it doesn't
  // block the board; the player taps the symbol to expand the unit's actions.
  let unitDetailsOpen = false;
  let lastUnitKey = null;
  let hoveredPathKeys = new Set();
  let pendingRecenter = true;
  let combatFlashKeys = new Set();
  let zoomLevel = 1;
  let panMoved = false; // set true while dragging the map, so the drag doesn't select a tile
  // Incremental board rendering: tile elements are created once per layout and
  // then updated in place (content diffed) instead of rebuilding thousands of
  // DOM nodes every action — essential on the huge "Known World" map.
  const tileEls = {};
  const tileInnerCache = {};
  const tileTitleCache = {};
  const tileHover = {};
  let lastVisibility = { visible: new Set(), discovered: new Set() };
  let boardLayoutKey = "";
  let overlayEl = null;
  // 3D board (Three.js) — used when WebGL is available; the DOM board is the fallback.
  let board3d = null;
  let USE_3D = false;
  let last3DHoverKey = null;
  const defaultHintText = "Your turn — click your city (🏛️) to build, or a unit to move it. Then End Turn.";

  // Units offered in the city build menu (order = progression).
  const BUILDABLE = [
    "warrior", "archer", "spearman", "swordsman", "horseman", "siege", "trireme", "merchant", "settler",
    // Civ-unique units — the build menu shows only the one that matches your people.
    "legionary", "hoplite", "war-elephant", "war-chariot", "gaesatae", "horse-archer"
  ];
  const UNIT_META = {
    warrior: { name: "Warrior", role: "Basic melee infantry — cheap, no strong matchups" },
    archer: { name: "Archer", role: "Ranged (range 2): strikes with no reply at distance, but fragile in melee and easy prey for cavalry" },
    spearman: { name: "Spearman", role: "Anti-cavalry: +60% vs mounted (attack & defence). Weak to heavy infantry" },
    swordsman: { name: "Swordsman", role: "Heavy infantry: grinds spearmen and skirmishers" },
    horseman: { name: "Horseman", role: "Cavalry (3 move): runs down archers & light foot — but spears counter it" },
    siege: { name: "Siege Ballista", role: "Range 2, devastating vs cities, fragile in the open field" },
    trireme: { name: "Trireme", role: "Warship — rules the sea lanes, carries war to the coast. Built only in coastal cities; launches into the water" },
    merchant: { name: "Merchant", role: "Caravan — send it to another of your cities (or a foreign one) and 'Establish Trade Route' for gold every turn" },
    settler: { name: "Settler", role: "Founds a new city" },
    legionary: { name: "Legionary", role: "ROME — elite heavy infantry: stronger than the swordsman, grinds spears & skirmishers. Needs the Legionary System" },
    hoplite: { name: "Hoplite", role: "GREECE — the phalanx: a wall of spears with huge defence, crushes cavalry (+70%). Needs the Hoplite Phalanx" },
    "war-elephant": { name: "War Elephant", role: "CARTHAGE — shock beast: tramples massed infantry and archers, tough and terrifying. Needs War Elephants" },
    "war-chariot": { name: "War Chariot", role: "EGYPT — fast (4 move) chariotry: rides down archers & light foot. Needs Chariotry" },
    gaesatae: { name: "Gaesatae", role: "GAUL — ferocious charge: huge attack, little armour — win fast or die. Needs Iron Mastery" },
    "horse-archer": { name: "Horse Archer", role: "PARTHIA — the Parthian shot: fast (4 move) ranged cavalry that strikes and flees. Needs Horse Archery" }
  };
  // One-line historical grounding for each unit (the educational layer).
  const UNIT_HISTORY = {
    warrior: "Levied tribal spearmen and clubmen — the citizen-militia of the earliest city-states.",
    archer: "From Cretan bowmen to the archers of Kushite Ta-Seti, missile troops screened and harassed the line.",
    spearman: "The hoplite and phalangite — locked shields and a hedge of spears that broke any cavalry charge (Chaeronea, Gaugamela).",
    swordsman: "Sword-and-shield heavy infantry — the Roman legionary with gladius and scutum, drilled and armoured.",
    horseman: "Companion and Numidian cavalry — the shock and pursuit arm that rode down fleeing skirmishers.",
    siege: "The ballista and onager — torsion artillery that hurled bolts and stones over the highest walls.",
    trireme: "Three banks of oars and a bronze ram — the trireme decided Salamis (480 BC) and every contest for the Mediterranean thereafter.",
    merchant: "The caravans of the Silk and Incense roads and the grain fleets of the Mediterranean — commerce built the wealth that raised armies.",
    settler: "Colonists sent to found a new colonia or polis, carrying the sacred fire from the mother city.",
    legionary: "The legionary with pilum, gladius and scutum — the drilled, articulated heavy infantry that conquered the Mediterranean world.",
    hoplite: "The citizen-hoplite in the phalanx — the locked shield-wall of Marathon and Plataea that no charge could break head-on.",
    "war-elephant": "Carthaginian and Numidian war elephants — Hannibal drove them over the Alps; their charge broke lines and panicked horses.",
    "war-chariot": "The Egyptian two-horse chariot — a mobile archery platform, the shock arm at Kadesh and Megiddo.",
    gaesatae: "The gaesatae — Gallic and Celtic warriors who charged naked but for a torc, terrifying but unarmoured (Telamon, 225 BC).",
    "horse-archer": "The Parthian horse archer — feigned flight then the 'Parthian shot' over the crupper; it destroyed Crassus at Carrhae (53 BC)."
  };

  // ----- Presentation lookups -----
  const SQRT3 = Math.sqrt(3);
  const UNIT_GLYPHS = {
    warrior: "⚔️",
    archer: "🏹",
    spearman: "🔱",
    swordsman: "🗡️",
    horseman: "🐎",
    siege: "🎯",
    trireme: "⛵",
    merchant: "🪙",
    settler: "🛠️",
    legionary: "🦅",
    hoplite: "🛡️",
    "war-elephant": "🐘",
    "war-chariot": "🛞",
    gaesatae: "🪓",
    "horse-archer": "🏇"
  };
  const TERRAIN_LABELS = {
    plains: "Plains",
    valley: "Valley",
    forest: "Forest",
    hills: "Hills",
    mountains: "Mountains",
    desert: "Desert",
    coast: "Coast",
    sea: "Sea"
  };
  // Faint glyphs on empty tiles so the map reads like terrain at a glance.
  const TERRAIN_GLYPHS = {
    valley: "🌾",
    forest: "🌲",
    hills: "⛰️",
    mountains: "🏔️",
    desert: "🏜️",
    coast: "〰️",
    sea: "🌊"
  };
  const TERRAIN_SWATCH = {
    plains: "#6f7d47",
    valley: "#7d9749",
    forest: "#33553a",
    hills: "#7a6a4a",
    desert: "#b79860",
    coast: "#3f7387",
    sea: "#2f4f77"
  };
  const WEATHER_INFO = {
    clear: { icon: "☀️", label: "clear" },
    rain: { icon: "🌧️", label: "rain" },
    fog: { icon: "🌫️", label: "fog" },
    storm: { icon: "⛈️", label: "storm" },
    heat: { icon: "🔥", label: "heat" }
  };
  let HUMAN_ID = "rome";
  // Historic civ colours + names, driven by the engine roster.
  const CIV_COLORS = {};
  const HISTORIC_COLORS = {};
  const CIV_ADJ = {};
  const CIV_CAPITAL = {};
  for (const c of engine.CIV_ROSTER || []) {
    CIV_COLORS[c.id] = c.color;
    HISTORIC_COLORS[c.id] = c.color;
    CIV_ADJ[c.id] = c.adjective;
    CIV_CAPITAL[c.id] = c.capital;
  }

  // Short historical flavour per civ — used to brief random-map campaigns
  // (scenarios carry their own richer briefing from the engine).
  const CIV_BRIEF = {
    rome: "From a cluster of hills on the Tiber, Rome forged a republic of citizen-soldiers whose discipline and roads would knit an empire from Britain to Mesopotamia.",
    carthage: "Founded by Phoenician traders around 814 BC, Carthage ruled the western seas through commerce and mercenary armies — and gave Rome her most feared enemy, Hannibal.",
    greece: "A world of fiercely independent city-states, Greece gave the classical age its philosophy, its phalanx, and — under Alexander — an empire that carried Hellenism to the Indus.",
    egypt: "By the classical age the Nile kingdom was ancient beyond memory, its Ptolemaic rulers heirs to Alexander, its granaries feeding the Mediterranean and its capital at Alexandria the mind of the world.",
    gaul: "The Celtic peoples of Gaul were master ironworkers and ferocious warriors whose sack of Rome in 390 BC was never forgotten — and whose druids kept a learning written on no page.",
    parthia: "Mounted lords of Iran and Mesopotamia, the Parthians met Rome's legions with horse-archers and cataphracts, and at Carrhae in 53 BC handed Rome one of her worst defeats."
  };

  // Populate the "Play as" picker from the engine roster, locking peoples the
  // player hasn't unlocked (via a card). Reads localStorage directly so it is
  // safe to run this early, before the collection constants are defined.
  function refreshCivPicker() {
    const sel = document.getElementById("civ-select");
    if (!sel) return;
    const prev = sel.value;
    // TESTING: all civs open. Revert to the localStorage-gated version to re-lock.
    let unlocked = (engine.CIV_ROSTER || []).map(function (c) { return c.id; });
    try {
      const pp = JSON.parse(window.localStorage.getItem("hegemon_profile") || "null");
      if (pp && Array.isArray(pp.unlockedCivs)) unlocked = Array.from(new Set(unlocked.concat(pp.unlockedCivs)));
    } catch (e) {}
    sel.innerHTML = "";
    let firstEnabled = null;
    (engine.CIV_ROSTER || []).forEach(function (c) {
      const opt = document.createElement("option");
      opt.value = c.id;
      const locked = unlocked.indexOf(c.id) === -1;
      opt.textContent = (locked ? "🔒 " : "") + c.civ + " (" + c.capital + ")";
      if (locked) opt.disabled = true;
      else if (firstEnabled === null) firstEnabled = c.id;
      sel.appendChild(opt);
    });
    if (prev && unlocked.indexOf(prev) !== -1) sel.value = prev;
    else if (firstEnabled) sel.value = firstEnabled;
  }
  refreshCivPicker();

  // Authored scenarios (real-geography maps), keyed by id, populated into the
  // map picker's "Scenarios" group. isScenario(id) tells scenarios from sizes.
  const SCENARIOS = {};
  (function populateScenarios() {
    const list = engine.listScenarios ? engine.listScenarios() : [];
    const og = document.getElementById("scenario-optgroup");
    list.forEach(function (s) {
      SCENARIOS[s.id] = s;
      if (og) {
        const opt = document.createElement("option");
        opt.value = s.id;
        opt.textContent = s.name;
        og.appendChild(opt);
      }
    });
  })();
  function isScenario(id) {
    return Object.prototype.hasOwnProperty.call(SCENARIOS, id);
  }

  const COLOR_STORE_KEY = "hegemon_civ_colors";

  function applyCivColor(id, color) {
    CIV_COLORS[id] = color;
    try {
      document.documentElement.style.setProperty("--civ-" + id, color);
    } catch (e) {}
  }

  function saveCivColors() {
    try {
      window.localStorage.setItem(COLOR_STORE_KEY, JSON.stringify(CIV_COLORS));
    } catch (e) {}
  }

  function loadSavedColors() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(COLOR_STORE_KEY) || "{}");
      for (const id of Object.keys(saved)) applyCivColor(id, saved[id]);
    } catch (e) {}
  }

  // ===== Auto-save / resume (the whole state is serializable JSON) =====
  const SAVE_KEY = "hegemon_save_v1";

  function saveGame() {
    try {
      if (state) window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (e) {}
  }

  function loadGame() {
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (!s || !s.map || !s.map.tiles || !Array.isArray(s.players)) return null;
      // Re-link playersById to the SAME player objects (JSON breaks the sharing).
      s.playersById = {};
      for (const p of s.players) s.playersById[p.id] = p;
      if (!Array.isArray(s.tradeRoutes)) s.tradeRoutes = []; // older saves
      return s;
    } catch (e) {
      return null;
    }
  }

  function hexToRgba(hex, a) {
    const h = (hex || "#888888").replace("#", "");
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  function civName(id) {
    const p = state && state.playersById[id];
    return (p && p.civ) || id;
  }

  function human() {
    return state.playersById[HUMAN_ID];
  }

  const AGE_LABELS = {
    1: "Age I — Villages",
    2: "Age II — Kingdoms",
    3: "Age III — Empires"
  };
  // An icon per tech, so the tree reads at a glance.
  const TECH_ICONS = {
    "bronze-working": "🔨", sailing: "⛵", writing: "📜", masonry: "🧱", archery: "🏹", irrigation: "💧",
    "phalanx-doctrine": "🛡️", "skirmish-doctrine": "🏃", "temple-economy": "⛩️", coinage: "🪙",
    "iron-working": "⚔️", "combined-arms": "🎖️", "open-sea-sailing": "🌊", engineering: "🏗️",
    "horseback-riding": "🐎", "mountain-paths": "⛰️", "caravan-logistics": "🐪", republic: "🏛️",
    monarchy: "👑", "ramming-fleets": "🚢", "merchant-marine": "⚓", "roads-logistics": "🛣️",
    siegecraft: "🎯", medicine: "⚕️", "law-administration": "⚖️", "currency-reform": "💰",
    cartography: "🗺️", assimilation: "🤝", "tribute-empire": "🏰", pottery: "🏺", mathematics: "📐",
    philosophy: "💭", metallurgy: "🔩", aqueducts: "🌉", astronomy: "🔭", rhetoric: "🗣️",
    "hoplite-phalanx": "🛡️", chariotry: "🏇", "legionary-system": "🦅", "war-elephants": "🐘",
    "iron-mastery": "🗡️", "horse-archery": "🏇", "animal-husbandry": "🐄", "crop-rotation": "🌾",
    testudo: "🐢", "phalanx-wall": "🧱", "nile-bureaucracy": "📜", thalassocracy: "🌊", furor: "🔥", "parthian-shot": "🏹"
  };
  // Display name + one-line sourced history note (the educational layer).
  const TECH_INFO = {
    "bronze-working": { name: "Bronze Working", note: "Alloying copper and tin armed the first militias and shod the woodsman's axe. EFFECT: unlocks the Spearman and the Lumber Camp improvement." },
    sailing: { name: "Sailing", note: "Coast-hugging galleys opened Mediterranean trade and colonization. EFFECT: prerequisite for Open-Sea Sailing and the naval line." },
    writing: { name: "Writing", note: "Administration and law from cuneiform to the alphabet. EFFECT: +1 science per city, unlocks the Library, and opens the Economy fork (Temple vs Coinage)." },
    masonry: { name: "Masonry", note: "Dressed stone means lasting walls, monuments — and paved roads. EFFECT: unlocks City Walls (+20 city HP) and Roads, and leads to Engineering." },
    archery: { name: "Archery", note: "Massed bowmen — the skirmish and ambush school of war. EFFECT: opens the Skirmish Doctrine fork." },
    irrigation: { name: "Irrigation", note: "Canals and basins multiplied river-valley harvests. EFFECT: unlocks the Farm improvement (+2 food) and leads to Crop Rotation." },
    "animal-husbandry": { name: "Animal Husbandry", note: "Herding cattle, sheep and horses on open range. EFFECT: unlocks the Pasture improvement (+1 food, +1 labour)." },
    "crop-rotation": { name: "Crop Rotation", note: "Fallowing and legumes keep the soil rich year on year. EFFECT: +1 food in every city." },
    "phalanx-doctrine": { name: "Phalanx Doctrine", note: "FORK: heavy spear-line, shields locked — the Greek hoplite way." },
    "skirmish-doctrine": { name: "Skirmish Doctrine", note: "FORK: mobility, javelins and bows — hit and fade." },
    "temple-economy": { name: "Temple Economy", note: "FORK: faith and culture fund the state — Egypt's model." },
    coinage: { name: "Coinage", note: "FORK: struck coin (Lydia ~600 BC) makes rush-buying cheap." },
    "iron-working": { name: "Iron Working", note: "Cheaper, harder blades put swords in every soldier's hand. EFFECT: unlocks the Swordsman (heavy infantry) and leads to Siegecraft & Combined Arms." },
    "combined-arms": { name: "Combined Arms", note: "The manipular legion (~315 BC) fought in articulated lines — hastati, principes, triarii — mixing shock, missile and reserve. Hannibal's genius at Cannae was combined-arms coordination, not numbers. Effect: your forces gain Supported (+10%) and Combined-arms (+15%) bonuses when infantry, ranged and cavalry fight side by side." },
    "open-sea-sailing": { name: "Open-Sea Sailing", note: "Leaving sight of land — the deep sea becomes navigable. EFFECT: ships may enter deep sea; unlocks the Trireme and the Naval fork." },
    engineering: { name: "Engineering", note: "Bridges, fords and siege works — Roman practicality. EFFECT: leads to Mountain Paths and Age III construction." },
    "horseback-riding": { name: "Horseback Riding", note: "True cavalry replaces the chariot on open ground. EFFECT: unlocks the Horseman — runs down archers and light foot." },
    "mountain-paths": { name: "Mountain Paths", note: "Passes and switchbacks let armies cross the ranges. EFFECT: your land units can traverse mountain tiles." },
    "caravan-logistics": { name: "Caravan Logistics", note: "Water and supply discipline defeat the desert. EFFECT: your units no longer take desert attrition damage." },
    republic: { name: "Republic", note: "FORK: elected magistrates and a Senate — Rome after 509 BC." },
    monarchy: { name: "Monarchy", note: "FORK: one crowned ruler — the Hellenistic kingdoms." },
    "ramming-fleets": { name: "Ramming Fleets", note: "FORK: the bronze ram and the trireme — Salamis, 480 BC." },
    "merchant-marine": { name: "Merchant Marine", note: "FORK: cargo hulls and sea-trade wealth — Carthage, Phoenicia." },
    "roads-logistics": { name: "Roads & Logistics", note: "The Via Appia (312 BC): legions marching 25 miles a day. EFFECT: every land unit gains +1 movement." },
    siegecraft: { name: "Siegecraft", note: "Ballistae and towers crack the strongest walls. EFFECT: unlocks the Siege Ballista — devastating against cities." },
    medicine: { name: "Medicine", note: "Army physicians and hygiene keep veterans in the field. EFFECT: your units heal +3 HP more each turn." },
    "law-administration": { name: "Law & Administration", note: "Codified law binds a sprawling empire together. EFFECT: +1 gold in every city." },
    "currency-reform": { name: "Currency Reform", note: "Standardized coinage steadies trade across provinces. EFFECT: +1 gold in every city." },
    cartography: { name: "Cartography", note: "Sea charts and itineraries extend reach and vision. EFFECT: prerequisite for the imperial-method fork." },
    assimilation: { name: "Assimilation", note: "FORK: extend citizenship — captured cities become your own." },
    "tribute-empire": { name: "Tribute Empire", note: "FORK: satrapies pay heavy tribute but stay restless." },
    pottery: { name: "Pottery", note: "Fired clay for grain jars, amphorae and the wine trade. EFFECT: unlocks the Temple and the Vineyard improvement." },
    mathematics: { name: "Mathematics", note: "Geometry and proof from Thales to Euclid. EFFECT: unlocks the Academy and +1 labour in every city; leads to Astronomy." },
    philosophy: { name: "Philosophy", note: "Reasoned inquiry — Plato's Academy, Aristotle's Lyceum. EFFECT: unlocks the Lyceum and +1 science in every city." },
    metallurgy: { name: "Metallurgy", note: "Mastery of the forge — pattern-welding, tempering, mass-produced arms. EFFECT: unlocks the Barracks and the Quarry improvement." },
    aqueducts: { name: "Aqueducts", note: "Arched channels carrying clean water for miles (Aqua Appia, 312 BC). EFFECT: unlocks the Aqueduct and +1 food in every city." },
    astronomy: { name: "Astronomy", note: "The heavens charted for calendar and navigation — Hipparchus, the Antikythera mechanism. EFFECT: +1 science in every city." },
    rhetoric: { name: "Rhetoric", note: "Schools of oratory and argument sharpen a people's learning. EFFECT: all your research costs 15% less." },
    "hoplite-phalanx": { name: "Hoplite Phalanx", note: "GREECE ONLY. The citizen shield-wall. EFFECT: unlocks the Hoplite — an immovable anti-cavalry spear line." },
    chariotry: { name: "Chariotry", note: "EGYPT ONLY. The two-horse war chariot. EFFECT: unlocks the War Chariot — fast mobile archery." },
    "legionary-system": { name: "Legionary System", note: "ROME ONLY. Manipular drill, pilum and gladius. EFFECT: unlocks the Legionary — elite heavy infantry." },
    "war-elephants": { name: "War Elephants", note: "CARTHAGE ONLY. Trained battle-elephants. EFFECT: unlocks the War Elephant — a line-breaking shock beast." },
    "iron-mastery": { name: "Iron Mastery", note: "GAUL ONLY. La Tène ironwork — long swords and fine mail. EFFECT: unlocks the Gaesatae — a ferocious charging warband." },
    "horse-archery": { name: "Horse Archery", note: "PARTHIA ONLY. Mounted bow and the feigned retreat. EFFECT: unlocks the Horse Archer — the deadly Parthian shot." },
    testudo: { name: "Testudo", note: "ROME ONLY. Legionaries lock shields into a moving shell. EFFECT: Roman infantry take +50% defence vs ranged/siege, +20% in melee." },
    "phalanx-wall": { name: "Phalanx Wall", note: "GREECE ONLY. Serried spears, shields overlapped. EFFECT: your spearmen defend +35% (+60% vs cavalry)." },
    "nile-bureaucracy": { name: "Nile Bureaucracy", note: "EGYPT ONLY. Scribes, granaries and the flood census. EFFECT: +1 food and +1 science in every city." },
    thalassocracy: { name: "Thalassocracy", note: "CARTHAGE ONLY. Mastery of the sea-lanes. EFFECT: your warships fight +30% and cost 25% less." },
    furor: { name: "Furor", note: "GAUL ONLY. The terrifying headlong charge. EFFECT: your infantry and warbands attack +35%." },
    "parthian-shot": { name: "Parthian Shot", note: "PARTHIA ONLY. Loose from the saddle, then wheel away. EFFECT: mounted archers take no return fire and keep half their move after shooting; +20% attack." }
  };

  function canResearchSafe(player, techId) {
    try {
      return engine.canResearch(player, techId);
    } catch {
      return false;
    }
  }

  // Does this player belong to the given civ id? (matches lowercase id or name)
  function civMatches(player, civId) {
    if (!civId) return true;
    const want = String(civId).toLowerCase();
    return (
      String((player && player.id) || "").toLowerCase() === want ||
      String((player && player.civ) || "").toLowerCase() === want
    );
  }

  const BUILDING_GLYPH = {
    granary: "🌾", workshop: "⚒️", market: "🪙", library: "📚", walls: "🧱", harbor: "⚓",
    temple: "⛩️", academy: "📐", lyceum: "🏛️", aqueduct: "💧", barracks: "🛡️", amphitheater: "🎭"
  };
  const IMPROVEMENT_GLYPH = { farm: "🌾", pasture: "🐄", mine: "⛏️", "lumber-camp": "🪵", "trade-post": "🐫", quarry: "🪨", vineyard: "🍇", fishery: "🐟", harbour: "⚓" };

  // Short "+2 🌾, +1 🪙" summary of a resource/improvement yield block.
  function resYieldStr(rr) {
    if (!rr || !rr.yields) return "";
    const y = rr.yields;
    const parts = [];
    if (y.food) parts.push("+" + y.food + " 🌾");
    if (y.production) parts.push("+" + y.production + " ⚒️");
    if (y.gold) parts.push("+" + y.gold + " 🪙");
    if (y.science) parts.push("+" + y.science + " 🧪");
    return parts.join(", ");
  }

  // ----- Civ sprite sheets (optional art) -----
  // Populated by scripts/slice-sprites.mjs -> web/sprites.js. When a civ has
  // sprites, units and cities render the artwork; otherwise the emoji/cluster
  // fallback is used, so a civ without art looks exactly as before.
  const SPRITES = (typeof window !== "undefined" && window.HEGEMON_SPRITES) || {};
  const CITY_TIER_NAMES = ["settlement", "town", "small-city", "major-city", "metropolis"];

  function spriteImg(civId, kind, name, cls) {
    const url = "assets/sprites/" + civId + "/" + kind + "-" + name + ".png";
    return '<img class="' + cls + '" src="' + url + '" alt="" draggable="false" onerror="this.style.display=\'none\'">';
  }
  // Army-size tier (1..5) from the unit's remaining strength — a bloodied unit
  // shows a smaller formation, matching the old cluster's thinning figures.
  function unitSpriteName(civId, unit) {
    const avail = SPRITES[civId] && SPRITES[civId].unit;
    if (!avail || !avail.length) return null;
    const frac = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
    const tier = Math.max(1, Math.min(5, Math.round(frac * 5)));
    return avail.includes(String(tier)) ? String(tier) : avail[Math.min(avail.length - 1, tier - 1)];
  }
  // City-size tier (settlement..metropolis) from population.
  function citySpriteName(civId, city) {
    const avail = SPRITES[civId] && SPRITES[civId].city;
    if (!avail || !avail.length) return null;
    const pop = city.population || 1;
    const idx = pop <= 2 ? 0 : pop <= 4 ? 1 : pop <= 6 ? 2 : pop <= 8 ? 3 : 4;
    const name = CITY_TIER_NAMES[idx];
    return avail.includes(name) ? name : avail[Math.min(avail.length - 1, idx)];
  }

  function itemCost(id) {
    // Reflect the resource discount (controlling timber/iron/… cheapens a build).
    if (engine.effectiveItemCost && state) {
      const c = engine.effectiveItemCost(state, HUMAN_ID, id);
      if (Number.isFinite(c)) return c;
    }
    if (engine.UNITS && engine.UNITS[id]) return (engine.UNIT_BUILD_COSTS || {})[id] || 0;
    if (engine.BUILDINGS && engine.BUILDINGS[id]) return engine.BUILDINGS[id].cost;
    return 0;
  }
  // Base (undiscounted) labour cost, for showing a strike-through / discount hint.
  function baseItemCost(id) {
    if (engine.productionItemCost) {
      const c = engine.productionItemCost(id);
      if (Number.isFinite(c)) return c;
    }
    if (engine.UNITS && engine.UNITS[id]) return (engine.UNIT_BUILD_COSTS || {})[id] || 0;
    if (engine.BUILDINGS && engine.BUILDINGS[id]) return engine.BUILDINGS[id].cost;
    return 0;
  }
  function itemName(id) {
    if (engine.UNITS && engine.UNITS[id]) return (UNIT_META[id] && UNIT_META[id].name) || id;
    if (engine.BUILDINGS && engine.BUILDINGS[id]) return engine.BUILDINGS[id].name;
    return id;
  }
  function itemGlyph(id) {
    if (engine.UNITS && engine.UNITS[id]) return UNIT_GLYPHS[id] || "•";
    if (engine.BUILDINGS && engine.BUILDINGS[id]) return BUILDING_GLYPH[id] || "▪";
    return "";
  }

  // Labour a city generates each turn (population + terrain + workshops). The
  // human is never handicapped, so this is exactly what accrues per End Turn.
  function cityLaborPerTurn(city) {
    try {
      return engine.computeCityYield ? engine.computeCityYield(state, city.id).production : 0;
    } catch (e) {
      return 0;
    }
  }

  // Turns until `needed` more labour accrues at `perTurn`. 0 = already covered.
  function turnsToAccrue(needed, perTurn) {
    if (needed <= 0) return 0;
    if (perTurn <= 0) return Infinity;
    return Math.ceil(needed / perTurn);
  }

  function etaLabel(eta) {
    if (eta === 0) return "ready";
    if (!Number.isFinite(eta)) return "no labor";
    return "~" + eta + "t";
  }

  // Ledger for the selected city: its total per-turn output plus the strategic
  // deposits and worked improvements in its territory.
  function renderCityOutput(city) {
    if (!cityOutputEl) return;
    if (!city) { cityOutputEl.innerHTML = ""; return; }
    let y = null;
    try { y = engine.computeCityYield(state, city.id); } catch (e) {}

    const deposits = [];
    const worked = [];
    const R = 3;
    for (let dq = -R; dq <= R; dq += 1) {
      for (let dr = -R; dr <= R; dr += 1) {
        if (engine.distance({ q: 0, r: 0 }, { q: dq, r: dr }) > R) continue;
        const coord = { q: city.position.q + dq, r: city.position.r + dr };
        const key = coord.q + "," + coord.r;
        const tile = state.map.tiles[key];
        if (!tile) continue;
        const claim = engine.claimingCity ? engine.claimingCity(state, coord) : null;
        if (!claim || claim.id !== city.id) continue;
        if (tile.resource && engine.RESOURCES && engine.RESOURCES[tile.resource]) deposits.push(engine.RESOURCES[tile.resource]);
        if (tile.improvement && engine.IMPROVEMENTS && engine.IMPROVEMENTS[tile.improvement]) worked.push(engine.IMPROVEMENTS[tile.improvement]);
      }
    }

    const yieldRow = y
      ? '<div class="co-yields">' +
        '<span title="Food per turn (before your army\'s food upkeep)">🌾 ' + y.food + "</span>" +
        '<span title="Labour per turn">⚒️ ' + y.production + "</span>" +
        '<span title="Gold per turn">🪙 ' + y.gold + "</span>" +
        '<span title="Science per turn">🧪 ' + y.science + "</span></div>"
      : "";
    const depRow = deposits.length
      ? '<div class="co-row"><span class="co-label">Deposits</span>' +
        deposits.map(function (r) { return '<span class="co-chip" title="' + r.name + " — " + resYieldStr(r) + '">' + r.glyph + "</span>"; }).join("") +
        "</div>"
      : "";
    const impRow = worked.length
      ? '<div class="co-row"><span class="co-label">Worked</span>' +
        worked.map(function (im) {
          const id = Object.keys(engine.IMPROVEMENTS).find(function (k) { return engine.IMPROVEMENTS[k] === im; });
          return '<span class="co-chip" title="' + im.name + " — " + resYieldStr(im) + '">' + (IMPROVEMENT_GLYPH[id] || "▪") + "</span>";
        }).join("") +
        "</div>"
      : "";
    cityOutputEl.innerHTML = yieldRow + depRow + impRow || '<div class="cp-hint">No output yet.</div>';
  }

  function renderBuildQueue(selectedCity) {
    if (!buildQueueEl) return;
    buildQueueEl.innerHTML = "";
    if (!selectedCity) {
      buildQueueEl.innerHTML = '<div class="bm-empty">Select a city to manage its queue.</div>';
      return;
    }

    const banked = Math.floor(selectedCity.production || 0);
    const perTurn = cityLaborPerTurn(selectedCity);

    // Explain how labour works — this city banks `perTurn` labour each End Turn
    // and the front item completes once the bank covers its cost.
    const summary = document.createElement("div");
    summary.className = "queue-summary";
    summary.innerHTML =
      "<span>🏭 Labor <b>+" + perTurn + "</b>/turn · <b>" + banked + "</b> banked</span>" +
      '<span class="qs-hint">Each city works on its own queue; labor completes the top item at End Turn.</span>';
    buildQueueEl.appendChild(summary);

    const q = selectedCity.queue || [];
    if (!q.length) {
      const empty = document.createElement("div");
      empty.className = "bm-empty";
      empty.textContent = "Nothing queued — recruit a unit or start a building above.";
      buildQueueEl.appendChild(empty);
      return;
    }

    let cumulativeCost = 0;
    q.forEach(function (id, i) {
      const cost = itemCost(id);
      cumulativeCost += cost;
      const eta = turnsToAccrue(cumulativeCost - banked, perTurn);
      const row = document.createElement("div");
      row.className = "queue-item" + (i === 0 ? " active" : "");
      const progress =
        i === 0
          ? Math.min(banked, cost) + "/" + cost + " ⚒️ " + etaLabel(eta)
          : cost + " ⚒️ " + etaLabel(eta);
      row.innerHTML =
        '<span class="qi-pos">' + (i + 1) + "</span>" +
        '<span class="qi-name">' + itemGlyph(id) + " " + itemName(id) + "</span>" +
        '<span class="qi-prog">' + progress + "</span>";
      const rm = document.createElement("button");
      rm.className = "qi-remove";
      rm.textContent = "×";
      rm.title = "Remove from queue";
      rm.addEventListener("click", function () {
        apply({ type: "UNQUEUE_PRODUCTION", playerId: HUMAN_ID, cityId: selectedCity.id, index: i });
      });
      row.appendChild(rm);
      buildQueueEl.appendChild(row);
    });

    // Denarii rush: hurry the front item to completion this turn.
    const rush = engine.rushProductionCost ? engine.rushProductionCost(state, selectedCity.id) : null;
    if (rush) {
      const me = human();
      const front = q[0];
      if (rush.missingProduction <= 0) {
        const ready = document.createElement("div");
        ready.className = "queue-ready";
        ready.textContent = "✓ " + itemName(front) + " is fully funded — it completes when you End Turn.";
        buildQueueEl.appendChild(ready);
      } else {
        const rushBtn = document.createElement("button");
        rushBtn.className = "rush-btn";
        const afford = me.gold >= rush.goldCost;
        rushBtn.disabled = !afford || !isHumanTurn();
        rushBtn.innerHTML =
          "⚡ Rush " + itemName(front) + " — " + rush.goldCost + " 🪙" +
          (afford ? "" : " (need " + (rush.goldCost - me.gold) + " more)");
        rushBtn.title =
          "Pay denarii for the " + rush.missingProduction + " labor still missing and finish it now (" +
          engine.RUSH_GOLD_PER_PRODUCTION + " 🪙 per labor).";
        rushBtn.addEventListener("click", function () {
          if (rushBtn.disabled) return;
          apply({ type: "RUSH_PRODUCTION", playerId: HUMAN_ID, cityId: selectedCity.id });
        });
        buildQueueEl.appendChild(rushBtn);
      }
    }
  }

  function renderBuildingMenu(isTurn, selectedCity) {
    if (!buildingMenuEl) return;
    buildingMenuEl.innerHTML = "";
    if (!selectedCity) {
      buildingMenuEl.innerHTML = '<div class="bm-empty">Select a city to raise improvements.</div>';
      return;
    }
    const player = human();
    const buildings = engine.BUILDINGS || {};
    const built = new Set(selectedCity.buildings || []);
    const queued = new Set(selectedCity.queue || []);
    const coastal = engine.isCoastalCity ? engine.isCoastalCity(state, selectedCity.id) : true;
    for (const id of Object.keys(buildings)) {
      const b = buildings[id];
      const has = built.has(id);
      const isQueued = queued.has(id);
      const reqTech = b.requiresTech;
      const hasTech = !reqTech || player.techs.includes(reqTech);
      const needsCoast = b.coastalOnly && !coastal;
      const techName = reqTech ? techMeta(reqTech).name : "";
      const bCost = itemCost(id); // discounted if you hold the needed resource
      const bDiscounted = bCost < b.cost;
      const bRes = (engine.BUILD_RESOURCE || {})[id];
      const bGlyph = bRes && engine.RESOURCES && engine.RESOURCES[bRes] ? engine.RESOURCES[bRes].glyph : "";
      const btn = document.createElement("button");
      btn.className = "build-item" + (has ? " done" : hasTech && !needsCoast ? "" : " locked");
      btn.disabled = has || isQueued || needsCoast || !(isTurn && hasTech);
      btn.title = b.note + (b.coastalOnly ? "\n\n⚓ Coastal cities only." : "") +
        (bDiscounted ? "\n\n" + bGlyph + " -30%: you control " + (engine.RESOURCES[bRes] ? engine.RESOURCES[bRes].name : bRes) + " in your territory." : bRes ? "\n\nControl " + (engine.RESOURCES[bRes] ? engine.RESOURCES[bRes].name : bRes) + " for -30% labour." : "");
      const status = has
        ? "✓ built"
        : isQueued
          ? "in queue"
          : !hasTech
            ? "🔒 " + techName
            : needsCoast
              ? "⚓ coastal only"
              : (bDiscounted ? bGlyph + " " : "") + bCost + " ⚒️";
      btn.innerHTML =
        '<span class="bi-name">' + (BUILDING_GLYPH[id] || "▪") + " " + b.name + "</span>" +
        '<span class="bi-cost">' + status + "</span>";
      if (!btn.disabled) {
        btn.addEventListener("click", function () {
          apply({ type: "BUILD_BUILDING", playerId: HUMAN_ID, cityId: selectedCity.id, buildingId: id });
        });
      }
      buildingMenuEl.appendChild(btn);
    }
  }

  function renderBuildMenu(isTurn, selectedCity) {
    if (!buildMenuEl) return;
    const player = human();
    const costs = engine.UNIT_BUILD_COSTS || {};
    buildMenuEl.innerHTML = "";
    const coastal = selectedCity && engine.isCoastalCity ? engine.isCoastalCity(state, selectedCity.id) : false;

    for (const type of BUILDABLE) {
      const def = engine.UNITS[type];
      if (!def) continue;
      // Civ-unique units only appear for the people they belong to.
      if (def.civ && !civMatches(player, def.civ)) continue;
      const meta = UNIT_META[type] || { name: type, role: "" };
      const base = costs[type];
      const cost = itemCost(type); // discounted if you hold the needed resource
      const discounted = typeof base === "number" && cost < base;
      const reqTech = def.requiresTech;
      const hasTech = !reqTech || player.techs.includes(reqTech);
      const needsCoast = def.domain === "naval" && !coastal;
      const techName = reqTech ? techMeta(reqTech).name : "";
      const discRes = (engine.BUILD_RESOURCE || {})[type];
      const discGlyph = discRes && engine.RESOURCES && engine.RESOURCES[discRes] ? engine.RESOURCES[discRes].glyph : "";

      const btn = document.createElement("button");
      btn.className = "build-item" + (hasTech && !needsCoast ? "" : " locked");
      btn.disabled = !(isTurn && !!selectedCity && hasTech && !needsCoast);
      // ETA if built next at this city (a hint — costs are paid in labor over
      // several turns, not instantly; this is why a cheap unit "isn't building").
      let etaHint = "";
      if (typeof cost === "number" && selectedCity) {
        const perTurn = cityLaborPerTurn(selectedCity);
        const banked = Math.floor(selectedCity.production || 0);
        etaHint = " " + etaLabel(turnsToAccrue(cost - banked, perTurn));
      }

      btn.title =
        meta.role + (reqTech ? " — needs " + techName : "") +
        (def.domain === "naval" ? "\n\n⚓ Coastal cities only; launches into the water." : "") +
        (typeof cost === "number" ? "\n\nCosts " + cost + " labor — this city banks labor each turn until it is paid, then the unit appears at End Turn." : "") +
        (discounted ? "\n\n" + discGlyph + " -30%: you control " + (engine.RESOURCES[discRes] ? engine.RESOURCES[discRes].name : discRes) + " in your territory." : discRes ? "\n\nControl " + (engine.RESOURCES[discRes] ? engine.RESOURCES[discRes].name : discRes) + " in your territory for -30% labour." : "") +
        (UNIT_HISTORY[type] ? "\n\n" + UNIT_HISTORY[type] : "");

      const status = !hasTech
        ? "🔒 " + techName
        : needsCoast
          ? "⚓ coastal only"
          : typeof cost === "number"
            ? (discounted ? discGlyph + " " : "") + cost + " ⚒️" + etaHint
            : "";
      btn.innerHTML =
        '<span class="bi-name">' + (UNIT_GLYPHS[type] || "•") + " " + meta.name + "</span>" +
        '<span class="bi-cost">' + status + "</span>";

      btn.addEventListener("click", function () {
        if (btn.disabled || !selectedCityId) return;
        apply({
          type: "BUILD_UNIT",
          playerId: HUMAN_ID,
          cityId: selectedCityId,
          unitType: type,
          unitId: createUnitId(type)
        });
      });
      buildMenuEl.appendChild(btn);
    }
  }

  // Odd-r offset (pointy-top): axial -> offset column/row.
  function axialToOffset(q, r) {
    return { col: q + ((r - (r & 1)) >> 1), row: r };
  }

  function hexSize() {
    if (!state) return 28;
    // Offset rectangle is ~cols wide (+0.5 for the alternate-row shift).
    const extentW = state.map.width + 1;
    // Size to the actual board column so the map fits without horizontal scroll
    // where it can (falls back to a viewport estimate before layout settles).
    const wrap = boardEl && boardEl.parentElement;
    const avail =
      wrap && wrap.clientWidth
        ? Math.max(280, wrap.clientWidth - 28)
        : Math.max(280, Math.min((window.innerWidth || 1000) - 340, 820));
    // At zoom 1 the map fits the panel width; zooming in enlarges hexes and the
    // board scrolls. Clamp so tiles stay clickable but can grow for the phone.
    const fit = avail / (extentW * SQRT3);
    const size = Math.floor(Math.max(20, Math.min(34, fit)) * zoomLevel);
    return Math.max(12, Math.min(72, size));
  }

  function logAction(message) {
    actionLog.unshift(message);
    if (actionLog.length > 24) {
      actionLog = actionLog.slice(0, 24);
    }
  }

  function renderLog() {
    if (!actionLogEl) return;
    actionLogEl.innerHTML = "";
    for (const line of actionLog) {
      const item = document.createElement("div");
      item.className = "log-entry";
      item.textContent = line;
      actionLogEl.appendChild(item);
    }
  }

  function renderChecklist(items) {
    if (!turnChecklistEl) return;
    turnChecklistEl.innerHTML = "";
    for (const item of items) {
      const row = document.createElement("div");
      row.className = "turn-checklist-item";
      row.textContent = item;
      turnChecklistEl.appendChild(row);
    }
  }

  function showResultModal(victory) {
    if (!victory || !victory.winnerId) {
      resultModalEl.classList.add("hidden");
      return;
    }

    // Count the finished game into the profile exactly once.
    if (!resultRecorded) {
      resultRecorded = true;
      try { recordGameResult(HUMAN_ID, victory.winnerId === HUMAN_ID, victory.type); } catch (e) {}
    }

    const humanWon = victory.winnerId === HUMAN_ID;
    const winner = state.playersById[victory.winnerId];
    const winnerName = winner ? winner.civ || winner.id : victory.winnerId;
    const byScore = victory.type === "score";

    resultTitleEl.textContent = humanWon
      ? (byScore ? "Victory — Hegemony" : "Victory")
      : "Defeat";

    if (byScore) {
      // Show the final standings so the score win is legible.
      let standings = "";
      try {
        const scores = engine.computeScores ? engine.computeScores(state) : {};
        standings = state.players
          .map((p) => ({ id: p.id, name: p.civ || p.id, score: scores[p.id] || 0 }))
          .sort((a, b) => b.score - a.score)
          .map((e, i) => `${i + 1}. ${e.name} — ${e.score}`)
          .join("   ");
      } catch (err) {
        standings = "";
      }
      const myName = civName(HUMAN_ID);
      const lead = humanWon
        ? `${myName} held the greatest realm when the age closed (turn ${state.turnLimit}).`
        : `${winnerName} held the greatest realm when the age closed (turn ${state.turnLimit}).`;
      resultBodyEl.textContent = standings ? `${lead}   ${standings}` : lead;
    } else {
      resultBodyEl.textContent = humanWon
        ? `${civName(HUMAN_ID)} controls every capital. Your hegemony is complete.`
        : `${winnerName} controls every capital. ${victory.reason || "Try another campaign."}`;
    }
    resultModalEl.classList.remove("hidden");
  }

  // Show a campaign briefing at the start of a game. `brief` is the engine's
  // scenario.briefing for scenarios, or a synthesised one for random maps.
  function showBriefing(brief, title) {
    if (!briefingModalEl || !brief) return;
    briefEraEl.textContent = brief.era || "";
    briefTitleEl.textContent = title || "A New Age";
    briefSituationEl.textContent = brief.situation || "";
    briefObjectivesEl.innerHTML = "";
    (brief.objectives || []).forEach(function (o) {
      const li = document.createElement("li");
      li.textContent = o;
      briefObjectivesEl.appendChild(li);
    });
    if (brief.didYouKnow) {
      briefDidYouKnowEl.innerHTML = "<b>Did you know?</b> " + brief.didYouKnow;
      briefDidYouKnowEl.classList.remove("hidden");
    } else {
      briefDidYouKnowEl.classList.add("hidden");
    }
    briefingModalEl.classList.remove("hidden");
  }

  // Build a briefing for a random-map campaign from the civ you chose.
  function randomMapBriefing(civId, sizeLabel, victoryLine) {
    return {
      era: "The Classical Age — a world of villages, kings and rising empires",
      situation:
        (CIV_BRIEF[civId] || "") +
        " Before you lies uncharted country (" + sizeLabel + "), rival powers, and the whole span of the age to make your mark.",
      objectives: [
        "Explore, settle, and expand your realm",
        "Advance through the ages and master combined arms",
        victoryLine
      ],
      didYouKnow:
        "Historians bracket the classical age roughly from 800 BC to AD 117 — from the first Olympiad and the founding of Rome to the empire's greatest extent under Trajan."
    };
  }

  function eventEffectsSummary(fx) {
    const sign = (n) => (n > 0 ? "+" + n : String(n));
    const parts = [];
    if (fx.gold) parts.push(sign(fx.gold) + " 🪙");
    if (fx.production) parts.push(sign(fx.production) + " ⚒️");
    if (fx.science) parts.push(sign(fx.science) + " 🧪");
    if (fx.food) parts.push(sign(fx.food) + " 🌾/city");
    if (fx.spawnUnit) parts.push("+1 " + fx.spawnUnit);
    return parts.join("  ·  ");
  }

  function showEventModal(victory) {
    if (!eventModalEl) return;
    const p = human();
    const pending = p && p.pendingEvent;
    const event = pending && engine.getEvent ? engine.getEvent(pending) : null;
    if (!event || !isHumanTurn() || (victory && victory.winnerId)) {
      eventModalEl.classList.add("hidden");
      return;
    }
    eventTitleEl.textContent = event.title;
    eventSituationEl.textContent = event.situation;
    eventOptionsEl.innerHTML = "";
    event.options.forEach(function (opt, i) {
      const btn = document.createElement("button");
      btn.className = "event-option";
      btn.innerHTML =
        '<span class="eo-label">' + opt.label + "</span>" +
        '<span class="eo-outcome">' + opt.outcome + "</span>" +
        '<span class="eo-effects">' + eventEffectsSummary(opt.effects) + "</span>";
      btn.addEventListener("click", function () {
        logAction("⚖️ " + event.title + " — " + opt.label);
        apply({ type: "RESOLVE_EVENT", playerId: HUMAN_ID, eventId: event.id, optionIndex: i });
      });
      eventOptionsEl.appendChild(btn);
    });
    eventModalEl.classList.remove("hidden");
  }

  function getHumanVisibility() {
    if (!state) {
      return { visible: new Set(), discovered: new Set() };
    }
    const visibility = engine.computeVisibility(state, HUMAN_ID);
    const visible = new Set(visibility.visibleTiles);
    const discovered = new Set(visibility.discoveredTiles);
    // Admin testing aid: reveal the entire map (toggle in the menu).
    if (adminRevealMap) {
      for (const key in state.map.tiles) { visible.add(key); discovered.add(key); }
      return { visible: visible, discovered: discovered };
    }
    // Your own realm is always watched — every tile inside your borders stays in
    // full view (and you can see who stands on it), not just what a unit sees.
    const territory = engine.computeTerritory ? engine.computeTerritory(state) : {};
    for (const key in territory) {
      if (territory[key] === HUMAN_ID) {
        visible.add(key);
        discovered.add(key);
      }
    }
    return { visible: visible, discovered: discovered };
  }

  function isHumanTurn() {
    return state.players[state.currentPlayerIndex].id === HUMAN_ID;
  }

  function getUnitsAt(q, r) {
    return Object.values(state.map.units).filter((u) => u.position.q === q && u.position.r === r);
  }

  function getCityAt(q, r) {
    return Object.values(state.map.cities).find((c) => c.position.q === q && c.position.r === r) || null;
  }

  function getTileHintsForSelectedUnit(visibility) {
    const hints = {
      reachable: new Set(),
      attackable: new Set(),
      tradeDest: new Set()
    };

    if (!selectedUnitId) return hints;
    const unit = state.map.units[selectedUnitId];
    if (!unit) return hints;

    const unitDef = engine.UNITS[unit.type];
    if (!unitDef) return hints;

    // A selected merchant highlights the cities it could open a trade route to
    // (any city, so long as you have another city to anchor the route).
    if (unit.type === "merchant") {
      const ownCities = Object.values(state.map.cities).filter((c) => c.ownerId === unit.ownerId);
      for (const c of Object.values(state.map.cities)) {
        const key = c.position.q + "," + c.position.r;
        if (!visibility.discovered.has(key)) continue;
        if (ownCities.some((o) => o.id !== c.id)) hints.tradeDest.add(key);
      }
    }
    const embarked = engine.isEmbarked && engine.isEmbarked(state, unit); // can't attack at sea

    for (const key of visibility.visible) {
      const [q, r] = key.split(",").map(Number);
      const destination = { q, r };

      // Perf: a unit can only move within its movement budget and attack within
      // its range, so skip far tiles entirely (matters on big maps).
      if (engine.distance(unit.position, destination) > Math.max(unitDef.movement, unitDef.range)) continue;

      const path = engine.findPath(
        state,
        { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
        unit.position,
        destination
      );

      if (path && path.length >= 2) {
        let totalCost = 0;
        for (let i = 0; i < path.length - 1; i += 1) {
          totalCost += engine.movementCost(
            state,
            { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
            path[i],
            path[i + 1]
          );
        }

        // Friendly-occupied tiles ARE reachable now — moving there stacks the
        // units into one army (the engine already fights them as a combined
        // force). Only enemy-occupied tiles are blocked (those are attacks).
        // A fresh unit may always take one step (matches the engine rule), so a
        // slow siege engine on rough ground still has somewhere to go.
        const occupiedByEnemyUnit = getUnitsAt(q, r).some((u) => u.ownerId !== unit.ownerId);
        const freshOneStep = path.length === 2 && unit.movementRemaining >= (unitDef.movement || 1);
        if ((totalCost <= unit.movementRemaining || freshOneStep) && !occupiedByEnemyUnit) {
          hints.reachable.add(key);
        }
      }

      // Only combat units get attack markers, and only on enemies in range now.
      const dist = engine.distance(unit.position, destination);
      if (unitDef.attack > 0 && !embarked && dist <= unitDef.range) {
        const hasEnemyUnit = getUnitsAt(q, r).some((u) => u.ownerId !== unit.ownerId);
        const city = getCityAt(q, r);
        const enemyCity = city && city.ownerId !== unit.ownerId;
        if (hasEnemyUnit || enemyCity) {
          hints.attackable.add(key);
        }
      }
    }

    return hints;
  }

  function computePathPreviewKeys(q, r, visibility) {
    const keys = new Set();
    if (!selectedUnitId) return keys;
    const unit = state.map.units[selectedUnitId];
    if (!unit) return keys;

    const key = q + "," + r;
    if (!visibility.visible.has(key)) return keys;

    const unitDef = engine.UNITS[unit.type];
    if (!unitDef) return keys;

    const path = engine.findPath(
      state,
      { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
      unit.position,
      { q, r }
    );

    if (!path || path.length < 2) return keys;

    let totalCost = 0;
    for (let i = 0; i < path.length - 1; i += 1) {
      const stepCost = engine.movementCost(
        state,
        { ownerId: unit.ownerId, domain: unitDef.domain, mounted: unitDef.mounted },
        path[i],
        path[i + 1]
      );
      totalCost += stepCost;
      if (totalCost > unit.movementRemaining) {
        return new Set();
      }
      keys.add(path[i + 1].q + "," + path[i + 1].r);
    }

    return keys;
  }

  function clearSelection() {
    selectedUnitId = null;
    selectedCityId = null;
    selectedTileKey = null;
    unitDetailsOpen = false;
    lastUnitKey = null;
    hoveredPathKeys = new Set();
  }

  function createCityId() {
    return `${HUMAN_ID}_city_${state.turn}_${Date.now().toString().slice(-4)}`;
  }

  function createUnitId(unitType) {
    return `${HUMAN_ID}_${unitType}_${state.turn}_${Date.now().toString().slice(-4)}`;
  }

  function snapshotHumanState() {
    const me = state.playersById[HUMAN_ID];
    return {
      food: me.food,
      production: me.production,
      gold: me.gold,
      cities: me.cityIds.length,
      units: me.unitIds.length
    };
  }

  function formatSignedDelta(value) {
    if (value > 0) return `+${value}`;
    return String(value);
  }

  // Snapshot the human's forces so we can report what the enemy did on their turn.
  function snapshotHumanForces() {
    const units = {};
    for (const u of Object.values(state.map.units)) {
      if (u.ownerId === HUMAN_ID) units[u.id] = { type: u.type, hp: u.hp };
    }
    const cities = {};
    for (const c of Object.values(state.map.cities)) {
      if (c.ownerId === HUMAN_ID) cities[c.id] = { name: c.name || c.id, hp: c.hp };
    }
    return { units: units, cities: cities };
  }

  // After the AI phase, banner what the enemy did to your forces.
  function reportEnemyCombat(before) {
    if (!before) return;
    let wounded = 0, besieged = 0, lostCities = 0;
    const lostNames = [];
    for (const id in before.units) {
      const now = state.map.units[id];
      if (!now || now.ownerId !== HUMAN_ID) lostNames.push(unitName(before.units[id].type));
      else if (now.hp < before.units[id].hp) wounded += 1;
    }
    for (const id in before.cities) {
      const now = state.map.cities[id];
      if (!now || now.ownerId !== HUMAN_ID) lostCities += 1;
      else if (now.hp < before.cities[id].hp) besieged += 1;
    }
    if (lostCities) showCombatToast("🏛️ You lost " + lostCities + " " + (lostCities === 1 ? "city" : "cities") + "!", "loss");
    else if (besieged) showCombatToast("🏛️ " + besieged + " of your " + (besieged === 1 ? "city is" : "cities are") + " under assault", "loss");
    if (lostNames.length) {
      showCombatToast("🩸 Enemy attack: you lost " + (lostNames.length <= 2 ? lostNames.join(" & ") : lostNames.length + " units"), "loss");
    }
    if (wounded) showCombatToast("🛡️ " + wounded + " of your " + (wounded === 1 ? "unit" : "units") + " took damage", "loss");
  }

  // Announce (once) any civ that has just lost its last city.
  function checkEliminations() {
    if (!state || !state.players) return;
    for (const p of state.players) {
      const alive = p.cityIds && p.cityIds.length > 0;
      if (alive || announcedDead[p.id]) continue;
      announcedDead[p.id] = 1;
      const nm = civName(p.id) || p.id;
      if (p.id === HUMAN_ID) showCombatToast("☠️ " + nm + " has fallen!", "loss");
      else showCombatToast("☠️ " + nm + " has been destroyed!", "win");
      logAction("☠️ " + nm + " has been wiped from the map.");
    }
  }

  // ---- Audio: procedural sound (see audio.js). All calls are null-safe. ----
  function audioInit() { if (window.HGAudio) window.HGAudio.init(); }
  function playSfx(name) { if (window.HGAudio) window.HGAudio.sfx(name); }
  function playActionSfx(action) {
    if (!window.HGAudio || action.playerId !== HUMAN_ID) return;
    switch (action.type) {
      case "MOVE_UNIT": window.HGAudio.sfx("march"); break;
      case "ATTACK": case "ATTACK_CITY": window.HGAudio.sfx("clash"); break;
      case "FOUND_CITY": case "BUILD_BUILDING": case "BUILD_UNIT": case "IMPROVE_TILE": case "UPGRADE_UNIT": window.HGAudio.sfx("build"); break;
      case "RESEARCH_TECH": window.HGAudio.sfx("research"); break;
      case "ESTABLISH_TRADE_ROUTE": window.HGAudio.sfx("coin"); break;
      case "END_TURN": window.HGAudio.sfx("click"); break;
      default: break;
    }
  }
  let lastAmbience = null, lastWeatherSound = null;
  function updateSoundscape(skyWx, tiles) {
    if (!window.HGAudio || !window.HGAudio.isReady()) return;
    if (skyWx !== lastWeatherSound) { window.HGAudio.setWeather(skyWx); lastWeatherSound = skyWx; }
    // Forest ambience when forest dominates what you can actually see.
    let forest = 0, land = 0;
    for (const tv of tiles) {
      if (tv.v !== 2 || tv.t === "sea" || tv.t === "coast") continue;
      land += 1; if (tv.t === "forest") forest += 1;
    }
    const env = land > 0 && forest / land >= 0.28 ? "forest" : "open";
    if (env !== lastAmbience) { window.HGAudio.setAmbience(env); lastAmbience = env; }
  }

  function apply(action) {
    try {
      const beforeSummary = action.type === "END_TURN" && action.playerId === HUMAN_ID ? snapshotHumanState() : null;
      // City-panel actions keep the city selected so you can queue several in a row.
      const keepSelection =
        action.type === "BUILD_UNIT" ||
        action.type === "BUILD_BUILDING" ||
        action.type === "UNQUEUE_PRODUCTION" ||
        action.type === "RUSH_PRODUCTION" ||
        action.type === "IMPROVE_TILE" ||
        action.type === "RESEARCH_TECH" ||
        action.type === "RESOLVE_EVENT" ||
        action.type === "RENAME_CITY";
      state = engine.applyAction(state, action);
      playActionSfx(action);
      if (!keepSelection) clearSelection();
      else if (selectedCityId && !state.map.cities[selectedCityId]) clearSelection();
      logAction(`Turn ${state.turn}: ${action.playerId} -> ${action.type}`);
      render();
      // Snapshot (post my action, pre-AI) so we can report enemy combat after.
      const forcesBefore = snapshotHumanForces();
      checkEliminations(); // your own capture may have just wiped a civ out
      runAiUntilHuman();
      reportEnemyCombat(forcesBefore);
      checkEliminations(); // the AI may have eliminated someone on its turn
      saveGame();

      if (beforeSummary) {
        const afterSummary = snapshotHumanState();
        logAction(
          "End turn summary | Food " +
            formatSignedDelta(afterSummary.food - beforeSummary.food) +
            " | Prod " +
            formatSignedDelta(afterSummary.production - beforeSummary.production) +
            " | Gold " +
            formatSignedDelta(afterSummary.gold - beforeSummary.gold) +
            " | Cities " +
            formatSignedDelta(afterSummary.cities - beforeSummary.cities) +
            " | Units " +
            formatSignedDelta(afterSummary.units - beforeSummary.units)
        );
        renderLog();
      }
    } catch (err) {
      console.error(err);
      logAction("Action failed: " + err.message);
      renderLog();
    }
  }

  function runAiUntilHuman() {
    while (state.players[state.currentPlayerIndex].id !== HUMAN_ID) {
      const active = state.players[state.currentPlayerIndex].id;
      const result = engine.runAiTurn(state, active, 12);
      for (const action of result.actions) {
        logAction(`Turn ${state.turn}: ${action.playerId} -> ${action.type}`);
      }
      state = result.state;
      const victory = engine.getVictoryStatus(state);
      if (victory.winnerId) break;
    }
    render();
  }

  function onTileClick(q, r) {
    if (!isHumanTurn()) return;

    const key = q + "," + r;
    const visibility = getHumanVisibility();
    if (!visibility.visible.has(key)) return;

    const clickedUnits = getUnitsAt(q, r);
    const clickedCity = getCityAt(q, r);

    if (!selectedUnitId) {
      const ownHere = clickedUnits.filter((u) => u.ownerId === HUMAN_ID);
      if (ownHere.length) {
        // A stack (army): pick the first; clicking the tile again cycles to the next.
        playSfx("select");
        selectedUnitId = ownHere[0].id;
        selectedCityId = null;
        selectedTileKey = null;
        render();
        return;
      }

      if (clickedCity && clickedCity.ownerId === HUMAN_ID) {
        selectedCityId = clickedCity.id;
        selectedUnitId = null;
        selectedTileKey = null;
        render();
        return;
      }

      // Empty land you own: select the tile so you can improve it (farm, mine…).
      if (!clickedCity && clickedUnits.length === 0) {
        const territory = engine.computeTerritory ? engine.computeTerritory(state) : {};
        if (territory[key] === HUMAN_ID) {
          selectedTileKey = key;
          selectedCityId = null;
          selectedUnitId = null;
          render();
          return;
        }
      }
      return;
    }

    const selected = state.map.units[selectedUnitId];
    if (!selected) {
      clearSelection();
      render();
      return;
    }

    // Clicking the selected unit's tile: if more of your units share it (an army),
    // cycle to the next one; otherwise deselect.
    if (selected.position.q === q && selected.position.r === r) {
      const ownHere = clickedUnits.filter((u) => u.ownerId === HUMAN_ID);
      if (ownHere.length > 1) {
        const idx = ownHere.findIndex((u) => u.id === selectedUnitId);
        selectedUnitId = ownHere[(idx + 1) % ownHere.length].id;
        render();
        return;
      }
      clearSelection();
      render();
      return;
    }

    const selectedDef = engine.UNITS[selected.type];
    const moveCtx = { ownerId: selected.ownerId, domain: selectedDef.domain, mounted: selectedDef.mounted };

    const attackerKey = selected.position.q + "," + selected.position.r;

    const enemyUnit = clickedUnits.find((u) => u.ownerId !== HUMAN_ID);
    if (enemyUnit) {
      if (engine.distance(selected.position, { q, r }) > selectedDef.range) {
        hintLineEl.textContent = "That enemy is out of range.";
        return;
      }
      try {
        const prev = engine.computeCombatPreview(state, selected.id, enemyUnit.id);
        const tactic = (prev.modifiers || []).find(
          (m) => /vs |Combined|Supported|Flanking/.test(m)
        );
        const aName = unitName(selected.type), dName = unitName(enemyUnit.type);
        const killed = prev.defenderRemainingHp <= 0;
        const died = prev.attackerRemainingHp <= 0;
        logAction(
          "⚔️ " + selected.type + " strikes " + enemyUnit.type + ": deals " + prev.damageToDefender +
          (killed ? " — destroyed!" : ", takes " + prev.damageToAttacker) +
          (tactic ? " [" + tactic + "]" : "")
        );
        // A banner over the board so the result is unmissable.
        let msg = "⚔️ " + aName + " hit " + dName + " −" + prev.damageToDefender;
        if (killed) msg += ' <span class="ct-kill">— destroyed!</span>';
        else msg += " (took −" + prev.damageToAttacker + ")";
        if (died) msg += ' <span class="ct-kill">· your ' + aName + " fell</span>";
        showCombatToast(msg, killed && !died ? "win" : died ? "loss" : "");
      } catch (e) {}
      flashCombat([key, attackerKey]);
      if (USE_3D && board3d && board3d.strike) board3d.strike(q, r);
      apply({ type: "ATTACK", playerId: HUMAN_ID, attackerId: selected.id, defenderId: enemyUnit.id });
      return;
    }

    if (clickedCity && clickedCity.ownerId !== HUMAN_ID) {
      if (engine.distance(selected.position, { q, r }) > selectedDef.range) {
        hintLineEl.textContent = "That city is out of range.";
        return;
      }
      const cityLabel = clickedCity.name || "the city";
      const hpBefore = clickedCity.hp;
      logAction("🏛️ " + selected.type + " assaults " + clickedCity.id + " (HP " + clickedCity.hp + ")");
      flashCombat([key, attackerKey]);
      if (USE_3D && board3d && board3d.strike) board3d.strike(q, r);
      apply({ type: "ATTACK_CITY", playerId: HUMAN_ID, attackerId: selected.id, cityId: clickedCity.id });
      const afterCity = state.map.cities[clickedCity.id];
      if (afterCity && afterCity.ownerId === HUMAN_ID) {
        showCombatToast("🏛️ You captured " + cityLabel + "!", "win");
      } else if (afterCity) {
        showCombatToast("🏛️ Assault on " + cityLabel + " −" + Math.max(0, hpBefore - afterCity.hp) + " (HP " + afterCity.hp + ")", "");
      } else {
        showCombatToast("🏛️ You captured " + cityLabel + "!", "win");
      }
      return;
    }

    // Can the selected unit reach this tile this turn?
    const path = engine.findPath(state, moveCtx, selected.position, { q, r });
    let cost = Infinity;
    if (path && path.length >= 2) {
      cost = 0;
      for (let i = 0; i < path.length - 1; i += 1) cost += engine.movementCost(state, moveCtx, path[i], path[i + 1]);
    }
    // A fresh unit (full movement) may always take one step onto an adjacent tile,
    // even if the terrain costs more than it has — mirrors the engine rule so slow
    // units aren't boxed in.
    const fresh = selected.movementRemaining >= (selectedDef.movement || 1);
    const oneStep = Boolean(path) && path.length === 2 && Number.isFinite(cost);
    const reachable = (Boolean(path) && path.length >= 2 && Number.isFinite(cost) && cost <= selected.movementRemaining) || (fresh && oneStep);
    const ownUnitHere = clickedUnits.find((u) => u.ownerId === HUMAN_ID);

    // Your own city: garrison the unit inside if you can reach it; else select the city.
    if (clickedCity && clickedCity.ownerId === HUMAN_ID) {
      if (reachable) {
        apply({ type: "MOVE_UNIT", playerId: HUMAN_ID, unitId: selected.id, destination: { q, r }, path: path });
      } else {
        selectedCityId = clickedCity.id;
        selectedUnitId = null;
        render();
      }
      return;
    }

    // Another of your own units in the field: if you can reach the tile, MOVE onto
    // it to combine into one army (that's what you want when stacking); otherwise
    // just select that unit.
    if (ownUnitHere) {
      if (reachable) {
        apply({ type: "MOVE_UNIT", playerId: HUMAN_ID, unitId: selected.id, destination: { q, r }, path: path });
      } else {
        selectedUnitId = ownUnitHere.id;
        selectedCityId = null;
        render();
      }
      return;
    }

    // Otherwise move to the (empty) tile if reachable.
    if (!reachable) {
      hintLineEl.textContent = !path || path.length < 2 ? "Can't move there." : "Not enough movement to reach there.";
      return;
    }
    apply({ type: "MOVE_UNIT", playerId: HUMAN_ID, unitId: selected.id, destination: { q, r }, path: path });
  }

  // Create a tile button once (position, size, stable listeners). Content is
  // filled by paintTile on every render. Listeners read live state, not the
  // per-render closure, so the element can persist across renders.
  function createTileEl(q, r, geom, pos) {
    const key = q + "," + r;
    const btn = document.createElement("button");
    btn.dataset.key = key;
    btn.style.width = geom.hexW + "px";
    btn.style.height = geom.hexH + "px";
    btn.style.left = pos.x + "px";
    btn.style.top = pos.y + "px";
    btn.addEventListener("click", function () {
      if (panMoved) { panMoved = false; return; } // this "click" was a map drag
      onTileClick(q, r);
    });
    btn.addEventListener("mouseenter", function () {
      hoveredPathKeys = computePathPreviewKeys(q, r, lastVisibility);
      updateHoverHighlight();
      hintLineEl.textContent = tileHover[key] || defaultHintText;
    });
    btn.addEventListener("mouseleave", function () {
      hoveredPathKeys = new Set();
      updateHoverHighlight();
      hintLineEl.textContent = defaultHintText;
    });
    return btn;
  }

  // Update an existing tile element: class list every render (cheap), but only
  // touch innerHTML/title when they actually change (the expensive part).
  function paintTile(btn, q, r, visibility, hints, territory) {
    const key = q + "," + r;
    const tile = state.map.tiles[key];
    const isVisible = visibility.visible.has(key);
    const isDiscovered = visibility.discovered.has(key);
    const units = isVisible ? getUnitsAt(q, r) : [];
    const city = isVisible ? getCityAt(q, r) : null;

    let cls = "tile terrain-" + tile.terrain;
    if (!isVisible) cls += isDiscovered ? " discovered" : " fog";
    if (hints.reachable.has(key)) cls += " reachable";
    if (hints.attackable.has(key)) cls += " attackable";
    if (hints.tradeDest && hints.tradeDest.has(key)) cls += " trade-dest";
    if (hoveredPathKeys.has(key)) cls += " path-preview";
    if (combatFlashKeys.has(key)) cls += " combat-flash";
    if (isVisible && state.weather && state.weather.current) {
      const wx = state.weather.current[tile.region];
      if (wx && wx !== "clear") cls += " wx-" + wx;
    }
    const selectedUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    if (selectedUnit && selectedUnit.position.q === q && selectedUnit.position.r === r) cls += " selected";
    const citySelected = selectedCityId ? state.map.cities[selectedCityId] : null;
    if (citySelected && citySelected.position.q === q && citySelected.position.r === r) cls += " selected";
    if (selectedTileKey === key) cls += " tile-selected";

    const tip = ["(" + q + "," + r + ") " + (TERRAIN_LABELS[tile.terrain] || tile.terrain)];
    let inner = "";

    const terrOwner = territory && territory[key];
    if (terrOwner && isDiscovered) {
      const tc = CIV_COLORS[terrOwner] || "#888";
      inner = '<span class="terr" style="background:' + hexToRgba(tc, 0.13) + '"></span>';
      cls += " claimed";
      tip.push("Territory of " + civName(terrOwner));
    }

    if (!isVisible) {
      tip.push(isDiscovered ? "Explored — you remember the land, but not who holds it now" : "Unexplored");
    } else if (city) {
      cls += " owner-" + city.ownerId;
      const citySprite = citySpriteName(city.ownerId, city);
      inner += citySprite
        ? spriteImg(city.ownerId, "city", citySprite, "city-sprite" + (city.isCapital ? " capital" : ""))
        : '<span class="glyph">' + (city.isCapital ? "🏛️" : "🏘️") + "</span>";
      inner += hpBar(city.hp, city.maxHp);
      tip.push((city.isCapital ? "Capital " : "City ") + city.id + " — " + city.ownerId);
      tip.push("Pop " + city.population + " · HP " + city.hp + "/" + city.maxHp);
      if (units.length > 0) tip.push("Garrison: " + units.map((u) => u.type).join(", "));
    } else if (units.length > 0) {
      const top = units[0];
      cls += " owner-" + top.ownerId;
      const unitSprite = unitSpriteName(top.ownerId, top);
      inner += unitSprite ? spriteImg(top.ownerId, "unit", unitSprite, "unit-sprite") : unitCluster(top);
      const embarkedHere = engine.isEmbarked && engine.isEmbarked(state, top);
      inner += '<span class="utype">' + (embarkedHere ? "⛵" : (UNIT_GLYPHS[top.type] || "•")) + "</span>";
      inner += hpBar(top.hp, top.maxHp);
      if (units.length > 1) inner += '<span class="stack">+' + (units.length - 1) + "</span>";
      for (const u of units) {
        tip.push(
          u.ownerId + " " + u.type + " — HP " + u.hp + "/" + u.maxHp +
          " · move " + u.movementRemaining +
          (u.veterancy && u.veterancy !== "recruit" ? " · " + u.veterancy : "")
        );
      }
    }

    if (isVisible && tile.improvement && !city && units.length === 0) {
      inner += '<span class="improvement">' + (IMPROVEMENT_GLYPH[tile.improvement] || "▪") + "</span>";
      tip.push("Improvement: " + tile.improvement);
    }

    // Strategic resource deposit — a corner badge on the land (shows under a
    // city or unit too, since it's a property of the tile).
    if (isVisible && tile.resource) {
      const rr = engine.RESOURCES && engine.RESOURCES[tile.resource];
      inner += '<span class="tile-resource">' + (rr ? rr.glyph : "◆") + "</span>";
      tip.push("Resource: " + (rr ? rr.name + " — " + resYieldStr(rr) : tile.resource));
    }

    let hoverHint = "";
    if (isVisible && selectedUnit) {
      const enemyUnit = units.find((u) => u.ownerId !== selectedUnit.ownerId);
      if (enemyUnit) {
        try {
          const preview = engine.computeCombatPreview(state, selectedUnit.id, enemyUnit.id);
          hoverHint =
            "⚔️ " + selectedUnit.type + " → " + enemyUnit.type + ": enemy −" + preview.damageToDefender +
            " (→" + preview.defenderRemainingHp + "), you −" + preview.damageToAttacker +
            " (→" + preview.attackerRemainingHp + ")";
          if (preview.modifiers && preview.modifiers.length) hoverHint += "  ·  " + preview.modifiers.join(" · ");
        } catch {
          hoverHint = "Target out of range.";
        }
      } else if (city && city.ownerId !== selectedUnit.ownerId) {
        hoverHint = "🏛️ Siege " + city.id + " (HP " + city.hp + "/" + city.maxHp + ")";
      } else if (hints.reachable.has(key)) {
        hoverHint = "Move here";
      }
    }

    btn.className = cls;
    if (tileInnerCache[key] !== inner) {
      btn.innerHTML = inner;
      tileInnerCache[key] = inner;
    }
    const title = tip.join("\n");
    if (tileTitleCache[key] !== title) {
      btn.title = title;
      tileTitleCache[key] = title;
    }
    tileHover[key] = hoverHint;
  }

  function renderRivers(geom, visibility, pos) {
    const rivers = state.map.rivers || {};
    for (const edge of Object.keys(rivers)) {
      if (!rivers[edge]) continue;
      const parts = edge.split("|");
      if (parts.length !== 2) continue;
      // Only draw once both banks have been seen.
      if (!visibility.discovered.has(parts[0]) || !visibility.discovered.has(parts[1])) continue;
      const pa = pos[parts[0]];
      const pb = pos[parts[1]];
      if (!pa || !pb) continue;

      const cax = pa.x + geom.hexW / 2;
      const cay = pa.y + geom.hexH / 2;
      const cbx = pb.x + geom.hexW / 2;
      const cby = pb.y + geom.hexH / 2;
      const dx = cbx - cax;
      const dy = cby - cay;
      const len = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

      const line = document.createElement("div");
      line.className = "river";
      line.style.left = (cax + cbx) / 2 + "px";
      line.style.top = (cay + cby) / 2 + "px";
      line.style.width = len + "px";
      line.style.transform = "translate(-50%, -50%) rotate(" + angle + "deg)";
      overlayEl.appendChild(line);
    }
  }

  // Draw the OUTER edge of each realm only — a coloured line on every hex edge
  // that faces a different owner (or the sea), not a ring around every cell.
  const AXIAL_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  function renderBorders(geom, visibility, pos, territory) {
    const edgeLen = geom.hexW / SQRT3 + 1; // hex side length (+1 to close corners)
    for (const key of Object.keys(state.map.tiles)) {
      const owner = territory[key];
      if (!owner || !visibility.discovered.has(key)) continue;
      const p = pos[key];
      if (!p) continue;
      const c = key.split(",");
      const q = +c[0];
      const r = +c[1];
      const cx = p.x + geom.hexW / 2;
      const cy = p.y + geom.hexH / 2;
      for (const d of AXIAL_DIRS) {
        const nkey = q + d[0] + "," + (r + d[1]);
        if (territory[nkey] === owner) continue; // interior edge — skip
        const np = pos[nkey];
        if (!np) continue; // neighbour off the map — skip
        const ncx = np.x + geom.hexW / 2;
        const ncy = np.y + geom.hexH / 2;
        const ang = (Math.atan2(ncy - cy, ncx - cx) * 180) / Math.PI + 90;
        const seg = document.createElement("div");
        seg.className = "terr-border";
        seg.style.left = (cx + ncx) / 2 + "px";
        seg.style.top = (cy + ncy) / 2 + "px";
        seg.style.width = edgeLen + "px";
        seg.style.setProperty("--bc", CIV_COLORS[owner] || "#888");
        seg.style.transform = "translate(-50%,-50%) rotate(" + ang + "deg)";
        overlayEl.appendChild(seg);
      }
    }
  }

  // Roads: a tan line from each road tile toward each road neighbour, meeting at
  // the shared midpoint to form a continuous network (a lone road shows a dot).
  function renderRoads(geom, visibility, pos) {
    for (const key of Object.keys(state.map.tiles)) {
      const tile = state.map.tiles[key];
      if (!tile.road || !visibility.discovered.has(key)) continue;
      const p = pos[key];
      if (!p) continue;
      const c = key.split(",");
      const q = +c[0];
      const r = +c[1];
      const cx = p.x + geom.hexW / 2;
      const cy = p.y + geom.hexH / 2;
      let connected = 0;
      for (const d of AXIAL_DIRS) {
        const nkey = q + d[0] + "," + (r + d[1]);
        const nt = state.map.tiles[nkey];
        if (!nt || !nt.road || !visibility.discovered.has(nkey)) continue;
        const np = pos[nkey];
        if (!np) continue;
        connected += 1;
        const mx = (cx + np.x + geom.hexW / 2) / 2;
        const my = (cy + np.y + geom.hexH / 2) / 2;
        const dx = mx - cx;
        const dy = my - cy;
        const len = Math.sqrt(dx * dx + dy * dy) + 1;
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
        const seg = document.createElement("div");
        seg.className = "road-seg";
        seg.style.left = (cx + mx) / 2 + "px";
        seg.style.top = (cy + my) / 2 + "px";
        seg.style.width = len + "px";
        seg.style.transform = "translate(-50%,-50%) rotate(" + ang + "deg)";
        overlayEl.appendChild(seg);
      }
      if (connected === 0) {
        const dot = document.createElement("div");
        dot.className = "road-dot";
        dot.style.left = cx + "px";
        dot.style.top = cy + "px";
        dot.style.transform = "translate(-50%,-50%)";
        overlayEl.appendChild(dot);
      }
    }
  }

  // Build the plain view object the 3D board renders from — a light per-tile
  // classification (visibility, owner, highlight), the visible sprites, and the
  // realm border edges. All game logic (sprite tiers, hints) stays in game.js.
  // Coarse visual "form" for a unit, so the 3D board can build the right shape.
  function unitForm(type) {
    const d = engine.UNITS && engine.UNITS[type];
    if (!d) return "infantry";
    if (d.domain === "naval") return "naval";
    if (d.domain === "civilian") return "civilian";
    if (type === "war-elephant") return "elephant";
    if (d.category === "siege") return "siege";
    if (d.mounted || d.category === "mounted") return "mounted";
    if (d.category === "ranged") return "ranged";
    if (d.category === "spear") return "spear";
    return "infantry";
  }

  function build3DView(visibility, hints, territory) {
    const tiles = [];
    const sprites = [];
    const borders = [];
    const selUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    const selCity = selectedCityId ? state.map.cities[selectedCityId] : null;
    for (const key of Object.keys(state.map.tiles)) {
      const tile = state.map.tiles[key];
      const c = key.split(",");
      const q = +c[0];
      const r = +c[1];
      const isVis = visibility.visible.has(key);
      const isDisc = visibility.discovered.has(key);
      const v = isVis ? 2 : isDisc ? 1 : 0;
      const owner = v > 0 ? territory[key] || null : null;
      let h = 0;
      if (combatFlashKeys.has(key)) h = 6;
      else if ((selUnit && selUnit.position.q === q && selUnit.position.r === r) ||
               (selCity && selCity.position.q === q && selCity.position.r === r)) h = 3;
      else if (selectedTileKey === key) h = 4;
      else if (hints.attackable.has(key)) h = 2;
      else if (hints.tradeDest && hints.tradeDest.has(key)) h = 7;
      else if (hints.reachable.has(key)) h = 1;
      else if (hoveredPathKeys.has(key)) h = 5;
      const wx = v === 2 && state.weather && state.weather.current ? (state.weather.current[tile.region] || "clear") : "clear";
      tiles.push({ q: q, r: r, t: tile.terrain, v: v, o: owner, h: h, res: tile.resource || null, imp: tile.improvement || null, wx: wx });
      if (owner && v > 0) {
        for (const d of AXIAL_DIRS) {
          const nk = q + d[0] + "," + (r + d[1]);
          if (!state.map.tiles[nk] || territory[nk] === owner) continue;
          borders.push({ q: q, r: r, nq: q + d[0], nr: r + d[1], color: CIV_COLORS[owner] || "#888" });
        }
      }
    }
    // Index units by tile so a city can show what it's garrisoning.
    const unitsByTile = {};
    for (const u of Object.values(state.map.units)) {
      const k = u.position.q + "," + u.position.r;
      (unitsByTile[k] || (unitsByTile[k] = [])).push(u);
    }
    for (const city of Object.values(state.map.cities)) {
      const ck = city.position.q + "," + city.position.r;
      if (!visibility.visible.has(ck)) continue;
      // Garrison: the units standing inside the city (drawn beside the walls, so
      // you can see a city is defended without a separate stacked sprite).
      const garr = (unitsByTile[ck] || []).filter((u) => u.ownerId === city.ownerId);
      let gForm = null;
      if (garr.length) {
        const top = garr.slice().sort((a, b) => (engine.UNITS[b.type].attack || 0) - (engine.UNITS[a.type].attack || 0))[0];
        gForm = unitForm(top.type);
      }
      sprites.push({
        civ: city.ownerId, kind: "city", id: city.id, name: citySpriteName(city.ownerId, city) || "",
        color: CIV_COLORS[city.ownerId] || "#888", q: city.position.q, r: city.position.r,
        t: state.map.tiles[ck] ? state.map.tiles[ck].terrain : "plains",
        pop: city.population || 1,
        hpFrac: city.maxHp ? Math.max(0, Math.min(1, (city.hp == null ? city.maxHp : city.hp) / city.maxHp)) : 1,
        garrison: garr.length, gForm: gForm, gColor: CIV_COLORS[city.ownerId] || "#888"
      });
    }
    for (const unit of Object.values(state.map.units)) {
      const uk = unit.position.q + "," + unit.position.r;
      if (!visibility.visible.has(uk)) continue;
      if (getCityAt(unit.position.q, unit.position.r)) continue; // shown as the city's garrison
      const embarked = engine.isEmbarked && engine.isEmbarked(state, unit);
      sprites.push({
        civ: unit.ownerId, kind: "unit", id: unit.id, name: unitSpriteName(unit.ownerId, unit) || "",
        color: CIV_COLORS[unit.ownerId] || "#888", q: unit.position.q, r: unit.position.r,
        t: state.map.tiles[uk] ? state.map.tiles[uk].terrain : "plains",
        form: embarked ? "naval" : unitForm(unit.type),
        utype: unit.type,
        hpFrac: unit.maxHp ? Math.max(0, Math.min(1, unit.hp / unit.maxHp)) : 1,
        badge: embarked ? "⛵" : (UNIT_GLYPHS[unit.type] || "•")
      });
    }
    // Rivers: keyed by shared edge "q,r|q,r"; show where either side is discovered.
    const rivers = [];
    if (state.map.rivers) {
      for (const rk in state.map.rivers) {
        if (!state.map.rivers[rk]) continue;
        const parts = rk.split("|");
        if (parts.length !== 2) continue;
        if (!visibility.discovered.has(parts[0]) && !visibility.discovered.has(parts[1])) continue;
        const a = parts[0].split(","), b = parts[1].split(",");
        rivers.push({ q: +a[0], r: +a[1], nq: +b[0], nr: +b[1] });
      }
    }
    // Roads: segments joining adjacent road tiles (and road tiles to cities).
    const roads = [];
    const seenRoad = {};
    for (const key of Object.keys(state.map.tiles)) {
      const tile = state.map.tiles[key];
      if (!tile.road || !visibility.discovered.has(key)) continue;
      const c = key.split(","); const q = +c[0], r = +c[1];
      for (const d of AXIAL_DIRS) {
        const nq = q + d[0], nr = r + d[1], nk = nq + "," + nr;
        const nt = state.map.tiles[nk];
        if (!nt || !visibility.discovered.has(nk)) continue;
        if (!nt.road && !getCityAt(nq, nr)) continue;
        const ek = key < nk ? key + "|" + nk : nk + "|" + key;
        if (seenRoad[ek]) continue;
        seenRoad[ek] = 1;
        roads.push({ q: q, r: r, nq: nq, nr: nr });
      }
    }
    // Overall sky mood follows the weather over the human's home region, so the
    // blue around the map, the sun and the light shift with the forecast.
    let skyWx = "clear";
    if (state.weather && state.weather.current) {
      const cap = Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID && c.isCapital) ||
        Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID);
      const capTile = cap && state.map.tiles[cap.position.q + "," + cap.position.r];
      const region = capTile ? capTile.region : (state.map.regions && state.map.regions[0]);
      skyWx = (region && state.weather.current[region]) || "clear";
    }
    updateSoundscape(skyWx, tiles);
    const view = { tiles: tiles, sprites: sprites, borders: borders, civColors: CIV_COLORS, rivers: rivers, roads: roads, weather: skyWx };
    if (pendingRecenter) {
      const home =
        Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID && c.isCapital) ||
        Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID);
      if (home) view.focus = { q: home.position.q, r: home.position.r };
      pendingRecenter = false;
    }
    return view;
  }

  // Hover on the 3D board: recompute the movement path preview + hint for the
  // hovered tile (only when it changes) and re-render so the path lights up.
  function handle3DHover(key) {
    if (key === last3DHoverKey) return;
    last3DHoverKey = key;
    if (!key) {
      hoveredPathKeys = new Set();
      hintLineEl.textContent = defaultHintText;
      render();
      return;
    }
    const c = key.split(",");
    const q = +c[0];
    const r = +c[1];
    hoveredPathKeys = computePathPreviewKeys(q, r, lastVisibility);
    hintLineEl.textContent = hover3DHint(q, r) || defaultHintText;
    render();
  }

  function hover3DHint(q, r) {
    const selUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    if (!selUnit) return "";
    const units = getUnitsAt(q, r);
    const city = getCityAt(q, r);
    const enemyUnit = units.find((u) => u.ownerId !== selUnit.ownerId);
    if (enemyUnit) {
      try {
        const p = engine.computeCombatPreview(state, selUnit.id, enemyUnit.id);
        return "⚔️ " + selUnit.type + " → " + enemyUnit.type + ": enemy −" + p.damageToDefender +
          " (→" + p.defenderRemainingHp + "), you −" + p.damageToAttacker + " (→" + p.attackerRemainingHp + ")";
      } catch (e) {
        return "Target out of range.";
      }
    }
    if (city && city.ownerId !== selUnit.ownerId) return "🏛️ Siege " + city.id;
    return "Move here";
  }

  // Render a unit as a small cluster of figures — count thins with damage,
  // and veteran/elite units gain a highlighted standard-bearer.
  function unitCluster(unit) {
    const color = CIV_COLORS[unit.ownerId] || "#d8d8d8";
    const frac = unit.maxHp > 0 ? unit.hp / unit.maxHp : 1;
    const figures = Math.max(1, Math.min(5, Math.round(frac * 5)));
    let html = '<span class="figures">';
    for (let i = 0; i < figures; i += 1) {
      let cls = "fig";
      if (i === 0 && unit.veterancy === "elite") cls += " fig-elite";
      else if (i === 0 && unit.veterancy === "veteran") cls += " fig-vet";
      html += '<span class="' + cls + '" style="background:' + color + '"></span>';
    }
    html += "</span>";
    return html;
  }

  // Briefly flash the tiles involved in a fight, so combat is visible.
  function flashCombat(keys) {
    combatFlashKeys = new Set(keys);
    setTimeout(function () {
      combatFlashKeys = new Set();
      for (const el of boardEl.children) {
        if (el.classList) el.classList.remove("combat-flash");
      }
    }, 550);
  }

  // A readable unit name ("Legionary" not "legionary").
  function unitName(type) {
    return (UNIT_META && UNIT_META[type] && UNIT_META[type].name) || type;
  }

  // Pop a combat-result banner over the board (auto-dismisses).
  function showCombatToast(html, cls) {
    if (!combatToastsEl) return;
    const el = document.createElement("div");
    el.className = "combat-toast" + (cls ? " " + cls : "");
    el.innerHTML = html;
    combatToastsEl.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 4000);
    // Keep at most a few on screen.
    while (combatToastsEl.children.length > 4) combatToastsEl.removeChild(combatToastsEl.firstChild);
  }

  // Update only the path-preview highlight on hover — do NOT rebuild the board
  // (rebuilding the DOM under the cursor makes tiles hard to click).
  function updateHoverHighlight() {
    for (const el of boardEl.children) {
      if (!el.dataset || !el.dataset.key) continue;
      if (hoveredPathKeys.has(el.dataset.key)) el.classList.add("path-preview");
      else el.classList.remove("path-preview");
    }
  }

  function hpBar(hp, maxHp) {
    const pct = Math.max(0, Math.min(100, Math.round((hp / maxHp) * 100)));
    let cls = "hpbar";
    if (pct <= 25) cls += " crit";
    else if (pct <= 55) cls += " low";
    return '<span class="' + cls + '"><span style="width:' + pct + '%"></span></span>';
  }

  function cityDisplayName(city) {
    if (city.name) return city.name; // player-given name wins
    if (city.isCapital && CIV_CAPITAL[city.ownerId]) return CIV_CAPITAL[city.ownerId];
    return (CIV_ADJ[city.ownerId] || civName(city.ownerId)) + " city";
  }

  function unitDisplayName(unit) {
    const meta = UNIT_META[unit.type];
    const name = (meta && meta.name) || unit.type;
    return (CIV_ADJ[unit.ownerId] || "") + " " + name;
  }

  function updatePanelState(victory) {
    const isTurn = isHumanTurn() && !victory.winnerId;
    const selectedUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    const selectedCity = selectedCityId ? state.map.cities[selectedCityId] : null;

    if (selectedUnit) {
      const vet = selectedUnit.veterancy && selectedUnit.veterancy !== "recruit" ? " · " + selectedUnit.veterancy : "";
      const atSea = engine.isEmbarked && engine.isEmbarked(state, selectedUnit) ? ' · <span class="heal-note" style="color:#7dd3fc">⛵ at sea (can\'t attack)</span>' : "";
      // Show the recovery on offer if the unit is hurt (heals by resting in place).
      let healNote = "";
      if (selectedUnit.hp < selectedUnit.maxHp && engine.restHealAmount) {
        const full = { ...selectedUnit, movementRemaining: 99 }; // as if it rests
        const amt = engine.restHealAmount(state, full);
        if (amt > 0) healNote = ' · <span class="heal-note">rest to heal +' + amt + " ❤️</span>";
      }
      selectionLineEl.innerHTML =
        (UNIT_GLYPHS[selectedUnit.type] || "•") + " " + unitDisplayName(selectedUnit) +
        '<span class="sel-sub"> HP ' + selectedUnit.hp + "/" + selectedUnit.maxHp +
        " · Move " + selectedUnit.movementRemaining + vet + healNote + atSea + "</span>";
    } else if (selectedCity) {
      const need = 8 + selectedCity.population * 6;
      const q = selectedCity.queue || [];
      const banked = Math.floor(selectedCity.production || 0);
      const building = q.length ? " · Building " + itemName(q[0]) + " " + Math.min(banked, itemCost(q[0])) + "/" + itemCost(q[0]) : "";
      const renameBtn = selectedCity.ownerId === HUMAN_ID
        ? ' <button class="rename-btn" data-rename="1" title="Rename this city">✎</button>'
        : "";
      selectionLineEl.innerHTML =
        (selectedCity.isCapital ? "🏛️ " : "🏘️ ") + cityDisplayName(selectedCity) + renameBtn +
        '<span class="sel-sub"> Pop ' + selectedCity.population + " · HP " + selectedCity.hp + "/" + selectedCity.maxHp +
        " · Growth " + Math.floor(selectedCity.food || 0) + "/" + need +
        " · ⚒️ " + banked + building + "</span>";
    } else if (selectedTileKey && state.map.tiles[selectedTileKey]) {
      const tile = state.map.tiles[selectedTileKey];
      const terr = (TERRAIN_LABELS && TERRAIN_LABELS[tile.terrain]) || tile.terrain;
      const impName = tile.improvement
        ? " · " + ((engine.IMPROVEMENTS && engine.IMPROVEMENTS[tile.improvement] && engine.IMPROVEMENTS[tile.improvement].name) || tile.improvement)
        : "";
      const rr = tile.resource && engine.RESOURCES ? engine.RESOURCES[tile.resource] : null;
      const resName = rr ? " · " + rr.glyph + " " + rr.name + " (" + resYieldStr(rr) + ")" : "";
      selectionLineEl.innerHTML =
        "⛰️ " + terr + '<span class="sel-sub"> (' + selectedTileKey + ")" + impName + resName + "</span>";
    } else {
      selectionLineEl.textContent = "Nothing selected";
    }

    foundCityBtn.disabled = !(isTurn && selectedUnit && selectedUnit.type === "settler");
    foundCityBtn.style.display = selectedUnit && selectedUnit.type === "settler" ? "" : "none";

    // Trade route: a merchant standing at/next to a city can open a route back
    // to your nearest other city. Show the gold it would earn each turn.
    if (tradeRouteBtn) {
      const plan = selectedUnit && selectedUnit.type === "merchant" ? tradeRoutePlan(selectedUnit) : null;
      tradeRouteBtn.disabled = !(isTurn && plan);
      tradeRouteBtn.textContent = plan
        ? "Trade Route → " + plan.destName + " (+" + plan.gold + " 🪙/turn)"
        : "Establish Trade Route";
      tradeRouteBtn.style.display = selectedUnit && selectedUnit.type === "merchant" ? "" : "none";
    }

    // Upgrade: a unit standing on a base type its people can advance (e.g. a
    // Roman swordsman into a Legionary) for gold.
    if (upgradeBtn) {
      const target = selectedUnit && engine.upgradeTargetFor ? engine.upgradeTargetFor(human(), selectedUnit) : null;
      if (target) {
        const cost = engine.upgradeCost ? engine.upgradeCost(selectedUnit.type, target) : 0;
        const tName = (UNIT_META[target] && UNIT_META[target].name) || target;
        upgradeBtn.style.display = "";
        upgradeBtn.disabled = !(isTurn && human().gold >= cost);
        upgradeBtn.innerHTML = (UNIT_GLYPHS[target] || "⭐") + " Upgrade → " + tName + " <span class=\"bi-cost\">" + cost + " 🪙</span>";
        upgradeBtn.title = "Advance this " + (UNIT_META[selectedUnit.type] ? UNIT_META[selectedUnit.type].name : selectedUnit.type) +
          " into a " + tName + " for " + cost + " gold.";
      } else {
        upgradeBtn.style.display = "none";
      }
    }

    // Disband: retire your own unit to stop paying its upkeep (a little of its
    // build cost comes back as scrap gold).
    if (disbandBtn) {
      if (selectedUnit && selectedUnit.ownerId === HUMAN_ID) {
        const refund = Math.round((engine.productionItemCost ? engine.productionItemCost(selectedUnit.type) : 0) * 0.25);
        disbandBtn.style.display = "";
        disbandBtn.disabled = !isTurn;
        disbandBtn.textContent = "✖ Disband" + (refund > 0 ? " (+" + refund + " 🪙)" : "");
        disbandBtn.title = "Retire this unit and stop its upkeep" + (refund > 0 ? "; recover " + refund + " gold as scrap." : ".");
      } else {
        disbandBtn.style.display = "none";
      }
    }

    if (clearSelectionBtn) clearSelectionBtn.disabled = !(selectedUnit || selectedCity);
    renderBuildMenu(isTurn, selectedCity);
    renderBuildingMenu(isTurn, selectedCity);
    renderCityOutput(selectedCity);
    renderBuildQueue(selectedCity);
    renderImproveMenu(isTurn);

    // ---- Float the panel at the selection and show only the relevant groups ----
    positionContextPanel(selectedUnit, selectedCity);
  }

  // Show/hide the floating command panel, position it near where the player
  // clicked on the board, and reveal only the groups that fit the selection.
  function unitGlyph(type) {
    const f = typeof unitForm === "function" ? unitForm(type) : "infantry";
    return { naval: "⛵", civilian: "⚒", elephant: "🐘", siege: "🎯", mounted: "🐎", ranged: "🏹", spear: "🔱", infantry: "⚔" }[f] || "⚔";
  }
  // Place the small "open details" symbol next to a freshly-selected unit.
  function showUnitToggle(unit) {
    if (!unitDetailToggleEl) return;
    unitDetailToggleEl.textContent = unitGlyph(unit.type);
    unitDetailToggleEl.classList.remove("hidden");
    const playArea = controlPanelEl.parentElement;
    const pa = playArea.getBoundingClientRect();
    let left, top;
    if (lastBoardPointer) { left = lastBoardPointer.x - pa.left + 14; top = lastBoardPointer.y - pa.top - 16; }
    else { left = pa.width - 64; top = 60; }
    left = Math.max(6, Math.min(left, pa.width - 48));
    top = Math.max(6, Math.min(top, pa.height - 48));
    unitDetailToggleEl.style.left = left + "px";
    unitDetailToggleEl.style.top = top + "px";
  }

  function positionContextPanel(selectedUnit, selectedCity) {
    if (!controlPanelEl) return;
    const tileSel = !selectedUnit && !selectedCity && selectedTileKey && state.map.tiles[selectedTileKey];
    const anything = selectedUnit || selectedCity || tileSel;
    if (!anything) {
      controlPanelEl.classList.add("hidden");
      if (unitDetailToggleEl) unitDetailToggleEl.classList.add("hidden");
      ctxPositionedFor = null;
      lastUnitKey = null;
      return;
    }

    // A freshly-selected unit shows only a small symbol so it doesn't hide the
    // board; tapping the symbol opens the full actions panel.
    if (selectedUnit) {
      const uKey = "u:" + selectedUnit.id;
      if (uKey !== lastUnitKey) { unitDetailsOpen = false; lastUnitKey = uKey; }
      if (!unitDetailsOpen) {
        controlPanelEl.classList.add("hidden");
        showUnitToggle(selectedUnit);
        ctxPositionedFor = null; // re-anchor the panel when it opens
        return;
      }
    } else {
      lastUnitKey = null;
    }
    if (unitDetailToggleEl) unitDetailToggleEl.classList.add("hidden");

    controlPanelEl.classList.remove("hidden");

    const show = function (el, on) { if (el) el.style.display = on ? "" : "none"; };
    show(unitActionsGroupEl, !!selectedUnit);
    show(improveGroupEl, !!tileSel);
    show(cityOutputGroupEl, !!selectedCity);
    show(queueGroupEl, !!selectedCity);
    // A selected unit lets the board behind the panel stay clickable (to move/attack).
    controlPanelEl.classList.toggle("cp-clickthrough", !!selectedUnit);
    // City content is split into two tabs: Units (recruit) and Improvements (buildings).
    show(cityTabsEl, !!selectedCity);
    show(recruitGroupEl, !!selectedCity && cityTab === "units");
    show(buildingsGroupEl, !!selectedCity && cityTab === "improvements");
    show(researchGroupEl, false); // research now lives on the top-right flask
    updateCityTabButtons();
    // The panel is a fixed side overlay (see CSS) — no floating position needed.
  }

  function updateCityTabButtons() {
    if (!cityTabsEl) return;
    const btns = cityTabsEl.querySelectorAll(".cp-tab");
    for (const b of btns) b.classList.toggle("active", b.dataset.tab === cityTab);
  }

  // Improvements for the selected land tile: build a farm/mine/… funded by the
  // city that works the tile. Hidden unless one of your own tiles is selected.
  function renderImproveMenu(isTurn) {
    if (!improveGroupEl || !improveMenuEl) return;
    const tile = selectedTileKey ? state.map.tiles[selectedTileKey] : null;
    if (!tile) {
      improveGroupEl.style.display = "none";
      return;
    }
    improveGroupEl.style.display = "";
    improveMenuEl.innerHTML = "";

    const isWater = tile.terrain === "sea" || tile.terrain === "coast";
    const coord = engine.parseKey(selectedTileKey);
    const city = engine.claimingCity ? engine.claimingCity(state, coord) : null;
    if (!city || city.ownerId !== HUMAN_ID) {
      improveMenuEl.innerHTML = '<div class="bm-empty">This tile is not worked by one of your cities.</div>';
      return;
    }
    const perTurn = cityLaborPerTurn(city);
    const banked = Math.floor(city.production || 0);
    const queue = city.queue || [];
    const suffix = ":" + selectedTileKey;

    // Add a build button for one option (an improvement id or "road").
    const addOption = function (id, name, glyph, cost, yieldStr, note, alreadyBuilt, alreadyQueued) {
      const el = document.createElement("button");
      el.className = "build-item";
      if (alreadyBuilt) {
        el.classList.add("done");
        el.disabled = true;
        el.innerHTML = '<span class="bi-name">' + glyph + " " + name + '</span><span class="bi-cost">✓ built</span>';
      } else {
        el.disabled = !isTurn || alreadyQueued;
        el.title = note + "\n\nWorked by " + cityDisplayName(city) + ". Costs " + cost + " labor.";
        const eta = etaLabel(turnsToAccrue(cost - banked, perTurn));
        el.innerHTML =
          '<span class="bi-name">' + glyph + " " + name + (yieldStr ? " <small>" + yieldStr + "</small>" : "") + "</span>" +
          '<span class="bi-cost">' + (alreadyQueued ? "in queue" : cost + " ⚒️ " + eta) + "</span>";
        el.addEventListener("click", function () {
          if (el.disabled) return;
          apply({ type: "IMPROVE_TILE", playerId: HUMAN_ID, cityId: city.id, tileKey: selectedTileKey, improvement: id });
        });
      }
      improveMenuEl.appendChild(el);
    };

    // Terrain improvements (one per tile) — only those this tile suits and whose
    // unlocking tech (if any) has been researched.
    const me = human();
    const options = Object.keys(engine.IMPROVEMENTS || {}).filter((id) => {
      const imp = engine.IMPROVEMENTS[id];
      if (imp.terrains.indexOf(tile.terrain) === -1) return false;
      if (imp.requiresTech && me.techs.indexOf(imp.requiresTech) === -1) return false;
      // Extraction improvements need the matching deposit on the tile.
      if (imp.requiresResource && !(tile.resource && imp.requiresResource.indexOf(tile.resource) !== -1)) return false;
      return true;
    });
    const impQueued = queue.some((q) => q.indexOf("imp:") === 0 && q.slice(-suffix.length) === suffix);
    for (const id of options) {
      const imp = engine.IMPROVEMENTS[id];
      const yld = [];
      if (imp.yields.food) yld.push("+" + imp.yields.food + " 🌾");
      if (imp.yields.production) yld.push("+" + imp.yields.production + " ⚒️");
      if (imp.yields.gold) yld.push("+" + imp.yields.gold + " 🪙");
      addOption(id, imp.name, IMPROVEMENT_GLYPH[id] || "▪", imp.cost, yld.join(" "), imp.note,
        tile.improvement === id, tile.improvement ? tile.improvement === id : impQueued);
    }

    // Explain extraction improvements this tile could take if only it had the
    // deposit (a mine needs ore, a quarry needs stone, a fishery needs fish).
    if (!tile.improvement) {
      const blocked = Object.keys(engine.IMPROVEMENTS || {}).filter((id) => {
        const imp = engine.IMPROVEMENTS[id];
        return imp.terrains.indexOf(tile.terrain) !== -1 &&
          (!imp.requiresTech || me.techs.indexOf(imp.requiresTech) !== -1) &&
          imp.requiresResource && !(tile.resource && imp.requiresResource.indexOf(tile.resource) !== -1);
      });
      if (blocked.length) {
        const needs = new Set();
        blocked.forEach((id) => (engine.IMPROVEMENTS[id].requiresResource || []).forEach((r) => needs.add(r)));
        const label = blocked.map((id) => (IMPROVEMENT_GLYPH[id] || "▪") + " " + engine.IMPROVEMENTS[id].name).join(", ");
        const hint = document.createElement("div");
        hint.className = "bm-empty";
        hint.innerHTML = label + " need a " + Array.from(needs).join(" / ") + " deposit on this tile.";
        improveMenuEl.appendChild(hint);
      }
      // Improvements this tile suits but whose unlocking research you still lack.
      const prettyTech = (t) => t.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const techLocked = Object.keys(engine.IMPROVEMENTS || {})
        .filter((id) => { const imp = engine.IMPROVEMENTS[id]; return imp.terrains.indexOf(tile.terrain) !== -1 && imp.requiresTech && me.techs.indexOf(imp.requiresTech) === -1; });
      if (!isWater && me.techs.indexOf("masonry") === -1) techLocked.push("__road");
      if (techLocked.length) {
        const parts = techLocked.map((id) => id === "__road"
          ? "🛤️ Road (Masonry)"
          : (IMPROVEMENT_GLYPH[id] || "▪") + " " + engine.IMPROVEMENTS[id].name + " (" + prettyTech(engine.IMPROVEMENTS[id].requiresTech) + ")");
        const hint = document.createElement("div");
        hint.className = "bm-empty";
        hint.innerHTML = "🔬 Research unlocks: " + parts.join(", ") + ".";
        improveMenuEl.appendChild(hint);
      }
    }

    // A road (independent of the worked improvement — a farm can have a road too).
    // Land-only, and only once you know Masonry (paved roads).
    if (!isWater && me.techs.indexOf("masonry") !== -1) {
      const roadCost = engine.ROAD_COST || 8;
      const roadQueued = queue.indexOf("road:" + selectedTileKey) !== -1;
      addOption("road", "Road", "🛤️", roadCost, "faster movement",
        "Roads halve the cost to cross the tile and bridge rivers — the backbone of an empire (viae, the King's Road).",
        !!tile.road, roadQueued);
    } else if (isWater && !improveMenuEl.children.length) {
      improveMenuEl.innerHTML = tile.terrain === "coast"
        ? '<div class="bm-empty">Research <b>Sailing</b> to build a fishery or harbour here.</div>'
        : '<div class="bm-empty">Open sea — build a fishery or harbour on a coastal tile instead.</div>';
    }
  }

  // What trade route a merchant could open right now: the city it stands at or
  // beside (the destination) plus the nearest OTHER own city (the anchor).
  function tradeRoutePlan(merchant) {
    let dest = null;
    let dd = 2;
    for (const c of Object.values(state.map.cities)) {
      const d = engine.distance(merchant.position, c.position);
      if (d <= 1 && d < dd) {
        dd = d;
        dest = c;
      }
    }
    if (!dest) return null;
    let home = null;
    let best = Infinity;
    for (const c of Object.values(state.map.cities)) {
      if (c.ownerId !== HUMAN_ID || c.id === dest.id) continue;
      const d = engine.distance(c.position, dest.position);
      if (d < best) {
        best = d;
        home = c;
      }
    }
    if (!home) return null;
    const foreign = dest.ownerId !== HUMAN_ID;
    const gold = engine.tradeRouteValue ? engine.tradeRouteValue(engine.distance(home.position, dest.position), foreign) : 2;
    return { dest: dest, destName: cityDisplayName(dest), gold: gold, foreign: foreign };
  }

  function renderRanking() {
    if (!rankingEl) return;
    const scores = engine.computeScores(state);
    const rows = state.players
      .map((p) => ({ id: p.id, civ: p.civ || p.id, score: scores[p.id] || 0, alive: p.cityIds.length > 0 }))
      .sort((a, b) => b.score - a.score);
    rankingEl.innerHTML =
      '<div class="rank-title">Standings</div>' +
      rows
        .map(
          (r, i) =>
            '<div class="rank-row' + (r.id === HUMAN_ID ? " me" : "") + (r.alive ? "" : " dead") + '">' +
            '<span class="rank-pos">' + (i + 1) + "</span>" +
            '<span class="rank-dot" style="background:' + (CIV_COLORS[r.id] || "#ccc") + '"></span>' +
            '<span class="rank-civ">' + r.civ + "</span>" +
            '<span class="rank-score">' + r.score + "</span></div>"
        )
        .join("");
  }

  function render() {
    const current = state.players[state.currentPlayerIndex];
    const victory = engine.getVictoryStatus(state);

    try {
      const activeColor = CIV_COLORS[current.id] || "#ccc";
      const turnLabel = state.turnLimit
        ? "Turn " + state.turn + " / " + state.turnLimit
        : "Turn " + state.turn;
      if (statusEl) {
        statusEl.innerHTML =
          turnLabel + " — " +
          '<span style="color:' + activeColor + ';font-weight:700">' + (current.civ || current.id) + "</span>" +
          (current.id === HUMAN_ID ? " (your move)" : " is moving…");
      }

      // Top-right corner: "Rome · Turn 1/60" plus who's moving.
      if (turnIndicatorEl) {
        const nOf = state.turnLimit ? state.turn + "/" + state.turnLimit : String(state.turn);
        const move = current.id === HUMAN_ID
          ? '<span class="ti-move ti-you">your move</span>'
          : '<span class="ti-move">' + (current.civ || current.id) + " moving…</span>";
        turnIndicatorEl.innerHTML =
          '<span class="ti-civ" style="color:' + activeColor + '">' + (current.civ || current.id) +
          "</span> · Turn " + nOf + move;
      }

      const visibility = getHumanVisibility();
      const hints = getTileHintsForSelectedUnit(visibility);
      const territory = engine.computeTerritory ? engine.computeTerritory(state) : {};

      if (USE_3D && board3d) {
        // The 3D board is fed a plain view object; all game logic stays here.
        board3d.render(build3DView(visibility, hints, territory));
      } else {
      const size = hexSize();
      const geom = {
        hexW: SQRT3 * size,
        hexH: 2 * size,
        vSpace: size * 1.5
      };

      // Compute offset (rectangular) pixel positions for every tile, then
      // normalize so the top-left tile sits at (0,0).
      const keys = Object.keys(state.map.tiles);
      const pos = {};
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const key of keys) {
        const c = key.split(",");
        const off = axialToOffset(+c[0], +c[1]);
        const x = geom.hexW * (off.col + 0.5 * (off.row & 1));
        const y = geom.vSpace * off.row;
        pos[key] = { x: x, y: y };
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      for (const key of keys) {
        pos[key].x -= minX;
        pos[key].y -= minY;
      }
      boardEl.style.width = maxX - minX + geom.hexW + "px";
      boardEl.style.height = maxY - minY + geom.hexH + "px";

      // Rebuild the tile elements only when the layout changes (new map or zoom);
      // otherwise reuse them and just repaint content. This is the big perf win.
      const layoutKey = state.seed + "|" + keys.length + "|" + Math.round(geom.hexW * 100);
      if (layoutKey !== boardLayoutKey) {
        boardEl.innerHTML = "";
        for (const k in tileEls) delete tileEls[k];
        for (const k in tileInnerCache) delete tileInnerCache[k];
        for (const k in tileTitleCache) delete tileTitleCache[k];
        const frag = document.createDocumentFragment();
        for (const key of keys) {
          const c = key.split(",");
          const btn = createTileEl(+c[0], +c[1], geom, pos[key]);
          tileEls[key] = btn;
          frag.appendChild(btn);
        }
        boardEl.appendChild(frag);
        overlayEl = document.createElement("div");
        overlayEl.className = "board-overlay";
        boardEl.appendChild(overlayEl);
        boardLayoutKey = layoutKey;
      }

      lastVisibility = visibility;
      for (const key of keys) {
        const c = key.split(",");
        paintTile(tileEls[key], +c[0], +c[1], visibility, hints, territory);
      }

      overlayEl.innerHTML = "";
      renderRivers(geom, visibility, pos);
      renderRoads(geom, visibility, pos);
      renderBorders(geom, visibility, pos, territory);

      // On a new game, scroll the view to the human's capital so the player
      // always starts looking at their own city and units.
      if (pendingRecenter) {
        const home =
          Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID && c.isCapital) ||
          Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID);
        const wrap = boardEl.parentElement;
        const p = home ? pos[home.position.q + "," + home.position.r] : null;
        if (p && wrap) {
          wrap.scrollLeft = Math.max(0, p.x + geom.hexW / 2 - wrap.clientWidth / 2);
          wrap.scrollTop = Math.max(0, p.y + geom.hexH / 2 - wrap.clientHeight / 2);
        }
        pendingRecenter = false;
      }
      } // end DOM board branch

      renderHud();
      renderLegend();
      renderRanking();
      renderTechTree(victory);
      updateResearchIndicator();
      updatePanelState(victory);
      renderLog();
    } catch (err) {
      console.error("Render error:", err);
    } finally {
      // Always reconcile the turn button and result overlay with the true
      // victory state — a partial render must never leave a stale modal.
      try {
        endTurnBtn.disabled = !isHumanTurn() || Boolean(victory.winnerId);
        showResultModal(victory);
        showEventModal(victory);
      } catch (overlayErr) {
        console.error("Overlay error:", overlayErr);
      }
    }
  }

  // Highlight (or clear) the whole prerequisite chain of a tech — "what to
  // research to get here".
  function highlightTechChain(id, techs, cardById, on) {
    const seen = {};
    (function walk(t) {
      const rule = techs[t];
      if (!rule) return;
      for (const p of rule.prerequisites || []) {
        if (seen[p]) continue;
        seen[p] = 1;
        if (cardById[p]) cardById[p].classList.toggle("pr-chain", on);
        walk(p);
      }
    })(id);
  }

  // Name/note for a tech: the curated TECH_INFO entry, else the engine's merged
  // data (the v2 civ-unique branch techs carry their own name/note there).
  function techMeta(id) {
    if (TECH_INFO[id]) return TECH_INFO[id];
    const t = (engine.TECHS && engine.TECHS[id]) || null;
    return { name: (t && t.name) || id, note: (t && t.note) || "" };
  }

  function renderTechTree(victory) {
    if (!techTreeEl) return;
    const techs = engine.TECHS || {};
    const player = human();
    const canAct = isHumanTurn() && !victory.winnerId;
    techTreeEl.innerHTML = "";
    techTreeEl.className = "tech-tree-grid";
    const cardById = {};

    for (const age of [1, 2, 3]) {
      // Show shared techs plus only this player's own civ-unique techs.
      const ids = Object.keys(techs).filter(
        (id) => techs[id].age === age && (!techs[id].civ || civMatches(player, techs[id].civ))
      );
      if (!ids.length) continue;
      // Roots first, so a column reads top-to-bottom like a tree.
      ids.sort((a, b) => (techs[a].prerequisites || []).length - (techs[b].prerequisites || []).length);

      const col = document.createElement("div");
      col.className = "tech-col";
      const title = document.createElement("div");
      title.className = "tech-age-title";
      title.textContent = AGE_LABELS[age] || "Age " + age;
      col.appendChild(title);

      for (const id of ids) {
        const rule = techs[id];
        const info = techMeta(id);
        const researched = player.techs.includes(id);
        const available = !researched && canResearchSafe(player, id);
        const forkClosed =
          !researched && !available && rule.forkGroup &&
          player.forkChoices[rule.forkGroup] && player.forkChoices[rule.forkGroup] !== rule.forkBranch;
        const cost = engine.scaledResearchCost ? engine.scaledResearchCost(state, id, HUMAN_ID) : (engine.researchCost ? engine.researchCost(id) : 0);
        const affordable = player.science >= cost;

        const prereqs = (rule.prerequisites || []).map(function (p) {
          return { name: techMeta(p).name, have: player.techs.includes(p) };
        });
        const needsHtml = prereqs.length && !researched && !available
          ? '<span class="tech-needs">needs ' + prereqs.map(function (p) {
              return '<span class="' + (p.have ? "pr-have" : "pr-miss") + '">' + p.name + "</span>";
            }).join(" + ") + "</span>"
          : "";

        const card = document.createElement("button");
        card.className = "tech-card " + (researched ? "done" : available ? "avail" : forkClosed ? "closed" : "locked") +
          (rule.forkGroup ? " is-fork" : "") + (rule.civ ? " is-branch" : "") + (rule.capstone ? " is-capstone" : "");
        // v2: tint a civ-unique branch tech with its people's colour (a light-touch
        // preview of the branch band; the full tech-tree UI is Phase 7).
        if (rule.civ && CIV_COLORS[rule.civ]) card.style.borderLeftColor = CIV_COLORS[rule.civ];
        card.disabled = !(available && affordable && canAct);
        card.dataset.tech = id;
        card.title = info.name + " — " + info.note +
          (researched ? "\n✓ Researched." : available ? "\nCost: " + cost + " science" : prereqs.length ? "\nRequires: " + prereqs.map(function (p) { return p.name; }).join(", ") : "");

        const badge = researched ? "✓" : available ? (cost + " 🧪" + (affordable ? (rule.forkGroup ? " ⑂" : "") : " ⏳")) : forkClosed ? "closed" : "🔒";
        card.innerHTML =
          '<span class="tech-ico">' + (TECH_ICONS[id] || (rule.capstone ? "👑" : "🔬")) + "</span>" +
          '<span class="tech-body"><span class="tech-name">' + info.name + "</span>" + needsHtml + "</span>" +
          '<span class="tech-state">' + badge + "</span>";

        card.addEventListener("click", function () {
          if (card.disabled) return;
          apply({ type: "RESEARCH_TECH", playerId: HUMAN_ID, techId: id });
        });
        card.addEventListener("mouseenter", function () { highlightTechChain(id, techs, cardById, true); });
        card.addEventListener("mouseleave", function () { highlightTechChain(id, techs, cardById, false); });
        col.appendChild(card);
        cardById[id] = card;
      }
      techTreeEl.appendChild(col);
    }
  }

  const RES_TITLES = {
    Populus: "Populus — your people. Cities grow as they bank food.",
    Food: "Food — net per turn after your army's upkeep (1 food per soldier beyond a free garrison of one per city). A surplus grows your cities; a deficit (red) stalls growth until you feed or shrink the army.",
    "Labor/turn": "Labor — production made across all your cities each turn. It is NOT a shared pool: every city banks its OWN labor and builds only from that, so select a city to see what it has and how long its work will take.",
    Denarii: "Denarii — a shared treasury from markets and trade; pays upkeep and can rush-buy.",
    Scientia: "Scientia — learning. A shared pool that accrues each turn and buys techs.",
    Doctrinae: "Doctrinae — technologies you have mastered.",
    Upkeep: "Upkeep — gold your standing army costs every turn (each unit has a maintenance cost). It is already subtracted from your Denarii income; a bigger army means a smaller treasury."
  };

  function renderHud() {
    const rome = human();
    const humanCities = Object.values(state.map.cities).filter((c) => c.ownerId === HUMAN_ID);
    const pop = humanCities.reduce((sum, c) => sum + c.population, 0);
    const inc = engine.computePlayerIncome ? engine.computePlayerIncome(state, HUMAN_ID) : {};
    // Net food per turn (after the army's food upkeep). Negative = a deficit that
    // stalls growth — flag it so the player can feed or shrink the army.
    const netFood = inc.food || 0;
    // Gold spent maintaining the standing army each turn (each unit's upkeep).
    let upkeep = 0;
    for (const u of Object.values(state.map.units)) {
      if (u.ownerId !== HUMAN_ID) continue;
      const d = engine.UNITS && engine.UNITS[u.type];
      if (d) upkeep += d.upkeep || 0;
    }
    const resources = [
      { ico: "👥", val: pop, lbl: "Populus", delta: null },
      { ico: "🌾", val: (netFood >= 0 ? "+" : "") + netFood + "/t", lbl: "Food", delta: null, warn: netFood < 0 },
      // Labor is per-city, not a shared pool — show the empire's output RATE, not
      // a banked total (which read as spendable and confused players).
      { ico: "⚒️", val: (inc.production || 0) + "/t", lbl: "Labor", delta: null },
      { ico: "🪙", val: rome.gold, lbl: "Denarii", delta: inc.gold },
      { ico: "🛡️", val: "−" + upkeep + "/t", lbl: "Upkeep", delta: null, warn: upkeep > 0 && (inc.gold || 0) < 0, title: "Army upkeep — gold each unit costs to maintain per turn (" + upkeep + " total)." },
      { ico: "🧪", val: rome.science, lbl: "Scientia", delta: inc.science }
    ];
    resourceBarEl.innerHTML = resources
      .map(function (r) {
        const delta =
          r.delta != null && r.delta !== 0
            ? '<span class="res-delta">(' + (r.delta > 0 ? "+" : "") + r.delta + ")</span>"
            : "";
        return (
          '<span class="res' + (r.warn ? " res-warn" : "") + '" title="' + (RES_TITLES[r.lbl] || "") + '"><span class="res-ico">' + r.ico +
          '</span><span class="res-val">' + r.val + "</span>" + delta +
          '<span class="res-lbl">' + r.lbl + "</span></span>"
        );
      })
      .join("");

    // Weather is no longer shown as a text bar — it now drives the sky, water and
    // light of the 3D board itself (see the weather push into the board view).
  }

  function renderLegend() {
    const terrains = Object.keys(TERRAIN_SWATCH);
    const parts = terrains.map(
      (t) =>
        '<span class="legend-item"><span class="legend-swatch" style="background:' +
        TERRAIN_SWATCH[t] + '"></span>' + (TERRAIN_LABELS[t] || t) + "</span>"
    );
    parts.push('<span class="legend-item"><span class="legend-swatch" style="background:#f2cc69"></span>Selected</span>');
    parts.push('<span class="legend-item"><span class="legend-swatch" style="background:#7ed957"></span>Reachable</span>');
    parts.push('<span class="legend-item"><span class="legend-swatch" style="background:#e0533d"></span>Attackable</span>');
    legendEl.innerHTML = parts.join("");
  }

  function newGame(withBriefing) {
    // Clear any leftover result modal first, so a new game can never inherit a
    // stale "Victory/Defeat" overlay even if something below misbehaves.
    resultModalEl.classList.add("hidden");
    if (menuOverlayEl) menuOverlayEl.classList.add("hidden");
    announcedDead = {};
    // playedEvents reset on the new state below

    const choice = (mapSizeSelectEl && mapSizeSelectEl.value) || "medium";
    const chosenCiv = (civSelectEl && civSelectEl.value) || "rome";
    let config;
    let label;
    let scenario = null;
    try {
      if (isScenario(choice)) {
        scenario = engine.loadScenario(choice);
        config = scenario.config;
        label = scenario.name;
      } else {
        const seed = "map-" + choice + "-" + Date.now();
        const playerCount = playerCountSelectEl ? parseInt(playerCountSelectEl.value, 10) || 2 : 2;
        config = engine.generateMap({ size: choice, seed: seed, playerCount: playerCount, humanCiv: chosenCiv });
        const sizeLabel = (engine.MAP_SIZES && engine.MAP_SIZES[choice] && engine.MAP_SIZES[choice].label) || choice;
        label = sizeLabel + " random map (" + config.map.width + "×" + config.map.height + "), " +
          config.players.length + " civs";
      }
    } catch (err) {
      console.error("New game generation failed, falling back:", err);
      scenario = engine.loadScenario("italia");
      config = scenario.config;
      label = "Italia scenario (fallback)";
    }

    // You play the civ you picked — if that civ is actually seated in this map
    // (always true for generated maps; scenarios may only offer a couple).
    HUMAN_ID = (config.players || []).some((p) => p.id === chosenCiv)
      ? chosenCiv
      : (config.players && config.players[0] && config.players[0].id) || "rome";

    // Victory mode: "domination" removes the turn limit (win by holding every
    // capital); "quick" ends the age at a player-chosen turn count and awards
    // the score win. This overrides whatever limit the map/scenario carried.
    const mode = (victoryModeSelectEl && victoryModeSelectEl.value) || "quick";
    let victoryLine;
    if (mode === "domination") {
      config.turnLimit = 0;
      label += " — Domination (hold every capital)";
      victoryLine = "Victory: seize every enemy capital — there is no turn limit.";
    } else {
      let turns = turnsInputEl ? parseInt(turnsInputEl.value, 10) : 60;
      if (!Number.isFinite(turns) || turns < 10) turns = 10;
      if (turns > 300) turns = 300;
      config.turnLimit = turns;
      label += " — Quick (" + turns + " turns)";
      victoryLine = "Victory: lead on score when the age ends at turn " + turns + " — or seize every capital sooner.";
    }

    // Difficulty handicaps the AI economy; the human's chosen civ is exempt.
    const difficulty = (difficultySelectEl && difficultySelectEl.value) || "normal";
    config.difficulty = difficulty;
    config.humanPlayerId = HUMAN_ID;
    if (difficulty !== "normal") {
      label += ", " + difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
    const myCivName = (config.players.find((p) => p.id === HUMAN_ID) || {}).civ || HUMAN_ID;
    label = "Playing " + myCivName + " — " + label;

    // Bring your equipped Legend + Edict perks into the campaign (the human only,
    // and only the slots matching your civ). Effects the engine can't do yet are
    // flagged in the deck, not applied.
    const startPerks = loadoutPerks(HUMAN_ID);
    if (Object.keys(startPerks).length && config.players) {
      const hp = config.players.find((pl) => pl.id === HUMAN_ID);
      if (hp) hp.perks = startPerks;
    }

    state = engine.createInitialGameState(config);
    state.playedEvents = {}; // one-use event cards refresh each campaign
    resultRecorded = false; // a fresh game's result hasn't been counted yet
    clearSelection();
    // Start with nothing selected — the in-play menu opens where you click.
    actionLog = ["New game started: " + label];
    hintLineEl.textContent = defaultHintText;
    pendingRecenter = true;
    render();
    saveGame();

    // Open with a briefing — the scenario's own for authored maps, or a civ
    // flavour intro for random ones. Skipped for the silent auto-start so the
    // setup bar isn't covered before the player has configured anything.
    if (withBriefing === false) return;
    try {
      if (scenario) {
        showBriefing(scenario.briefing, scenario.name);
      } else {
        const sizeLabel = (engine.MAP_SIZES && engine.MAP_SIZES[choice] && engine.MAP_SIZES[choice].label) || choice;
        showBriefing(randomMapBriefing(HUMAN_ID, sizeLabel, victoryLine), "Playing " + myCivName);
      }
    } catch (e) {
      console.error("Briefing failed:", e);
    }
    // Show the player their campaign cards (generals/wonders in play + one-use
    // events) at the start, so they can open with a card if they wish.
    if (handHasCards()) setTimeout(openHand, 120);
  }

  // One-time repair for saves made before the water-placement fixes: nudge any
  // city stranded on water onto the nearest land, and any ship beached on land
  // onto the nearest water. Returns true if anything moved.
  function healLoadedState(st) {
    if (!st || !st.map || !st.map.tiles) return false;
    const tiles = st.map.tiles;
    const isWater = function (t) { return t && (t.terrain === "sea" || t.terrain === "coast"); };
    const keyOfCity = function (c) { return c.position.q + "," + c.position.r; };
    const cityKeys = new Set(Object.values(st.map.cities).map(keyOfCity));
    let changed = false;
    function nearestTile(pos, pred) {
      let best = null, bestD = Infinity;
      for (const key in tiles) {
        const parts = key.split(","); const q = +parts[0], r = +parts[1];
        if (!pred(tiles[key], key)) continue;
        const d = engine.distance(pos, { q: q, r: r });
        if (d < bestD) { bestD = d; best = { q: q, r: r }; }
      }
      return best;
    }
    for (const c of Object.values(st.map.cities)) {
      if (!isWater(tiles[keyOfCity(c)])) continue;
      const dest = nearestTile(c.position, function (t, key) {
        return t && !isWater(t) && t.terrain !== "mountains" && !cityKeys.has(key);
      });
      if (dest) { cityKeys.delete(keyOfCity(c)); c.position = dest; cityKeys.add(dest.q + "," + dest.r); changed = true; }
    }
    for (const u of Object.values(st.map.units)) {
      const def = engine.UNITS && engine.UNITS[u.type];
      if (!def || def.domain !== "naval") continue;
      if (isWater(tiles[u.position.q + "," + u.position.r])) continue;
      const dest = nearestTile(u.position, function (t) { return isWater(t); });
      if (dest) { u.position = dest; changed = true; }
    }
    return changed;
  }

  // Resume a saved game if one exists; otherwise start fresh.
  function resumeOrNew() {
    const saved = loadGame();
    if (!saved) {
      newGame(false);
      return;
    }
    state = saved;
    if (!state.playedEvents) state.playedEvents = {};
    let repaired = false;
    try { repaired = healLoadedState(state); } catch (e) { console.error("Save repair skipped:", e); }
    if (repaired) saveGame();
    // Restore which civ the human was playing (older saves default to Rome).
    if (state.humanPlayerId && state.playersById[state.humanPlayerId]) {
      HUMAN_ID = state.humanPlayerId;
    }
    resultRecorded = false; // let a resumed game record its result when it ends
    clearSelection();
    actionLog = ["Resumed your saved game — turn " + state.turn];
    if (repaired) actionLog.push("Repaired a stranded city/ship from an older save.");
    hintLineEl.textContent = defaultHintText;
    pendingRecenter = true;
    render();
  }

  newGameBtn.addEventListener("click", newGame);

  // Suggest the map's recommended length in the turns box (player can override).
  function recommendedTurnsForSize(size) {
    if (isScenario(size)) {
      const sc = SCENARIOS[size];
      return (sc && sc.config && sc.config.turnLimit) || 60;
    }
    return (engine.TURN_LIMITS && engine.TURN_LIMITS[size]) || 60;
  }

  // Show the turns box only in Quick mode; hide it for Domination.
  function syncVictoryControls() {
    if (!turnsPickerEl || !victoryModeSelectEl) return;
    const domination = victoryModeSelectEl.value === "domination";
    turnsPickerEl.classList.toggle("hidden", domination);
  }

  if (mapSizeSelectEl && playerCountSelectEl) {
    mapSizeSelectEl.addEventListener("change", function () {
      const size = mapSizeSelectEl.value;
      if (isScenario(size)) {
        // A scenario fixes its own civs — lock the count to that roster.
        const sc = SCENARIOS[size];
        const n = (sc && sc.config && sc.config.players && sc.config.players.length) || 2;
        playerCountSelectEl.value = String(n);
        playerCountSelectEl.disabled = true;
      } else {
        playerCountSelectEl.disabled = false;
        const def = (engine.DEFAULT_PLAYERS && engine.DEFAULT_PLAYERS[size]) || 3;
        playerCountSelectEl.value = String(def);
      }
      if (turnsInputEl) turnsInputEl.value = String(recommendedTurnsForSize(size));
    });
  }

  if (victoryModeSelectEl) {
    victoryModeSelectEl.addEventListener("change", syncVictoryControls);
    syncVictoryControls();
  }
  if (turnsInputEl && mapSizeSelectEl) {
    turnsInputEl.value = String(recommendedTurnsForSize(mapSizeSelectEl.value));
  }

  endTurnBtn.addEventListener("click", function () {
    if (!isHumanTurn()) return;
    apply({ type: "END_TURN", playerId: HUMAN_ID });
  });

  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener("click", function () {
      clearSelection();
      render();
    });
  }

  foundCityBtn.addEventListener("click", function () {
    const unit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    if (!unit || unit.type !== "settler") return;

    apply({
      type: "FOUND_CITY",
      playerId: HUMAN_ID,
      settlerId: unit.id,
      cityId: createCityId()
    });
  });

  if (tradeRouteBtn) {
    tradeRouteBtn.addEventListener("click", function () {
      const unit = selectedUnitId ? state.map.units[selectedUnitId] : null;
      if (!unit || unit.type !== "merchant") return;
      const plan = tradeRoutePlan(unit);
      if (!plan) return;
      logAction("🪙 Trade route opened to " + plan.destName + " (+" + plan.gold + "/turn)");
      apply({ type: "ESTABLISH_TRADE_ROUTE", playerId: HUMAN_ID, merchantId: unit.id, cityId: plan.dest.id });
    });
  }

  if (upgradeBtn) {
    upgradeBtn.addEventListener("click", function () {
      const unit = selectedUnitId ? state.map.units[selectedUnitId] : null;
      if (!unit) return;
      const target = engine.upgradeTargetFor ? engine.upgradeTargetFor(human(), unit) : null;
      if (!target) return;
      const tName = (UNIT_META[target] && UNIT_META[target].name) || target;
      logAction("⭐ " + (UNIT_META[unit.type] ? UNIT_META[unit.type].name : unit.type) + " upgraded to " + tName);
      apply({ type: "UPGRADE_UNIT", playerId: HUMAN_ID, unitId: unit.id });
    });
  }

  if (disbandBtn) {
    disbandBtn.addEventListener("click", function () {
      const unit = selectedUnitId ? state.map.units[selectedUnitId] : null;
      if (!unit || unit.ownerId !== HUMAN_ID) return;
      const name = (UNIT_META[unit.type] && UNIT_META[unit.type].name) || unit.type;
      if (!window.confirm("Disband this " + name + "? It will be retired for good.")) return;
      logAction("✖ " + name + " disbanded.");
      apply({ type: "DISBAND_UNIT", playerId: HUMAN_ID, unitId: unit.id });
    });
  }

  if (cpCloseBtn) {
    cpCloseBtn.addEventListener("click", function () {
      clearSelection();
      render();
    });
  }

  // Tapping the unit symbol expands the full actions panel.
  if (unitDetailToggleEl) {
    unitDetailToggleEl.addEventListener("click", function () {
      unitDetailsOpen = true;
      render();
    });
  }

  // City menu tabs: switch between Units and Improvements.
  if (cityTabsEl) {
    cityTabsEl.addEventListener("click", function (e) {
      const btn = e.target.closest ? e.target.closest(".cp-tab") : null;
      if (!btn || !btn.dataset.tab) return;
      cityTab = btn.dataset.tab;
      render();
    });
  }

  // Rename a city: the ✎ next to a city's name prompts for a new one.
  if (selectionLineEl) {
    selectionLineEl.addEventListener("click", function (e) {
      const t = e.target;
      if (!t || !t.dataset || !t.dataset.rename || !selectedCityId) return;
      const city = state.map.cities[selectedCityId];
      if (!city || city.ownerId !== HUMAN_ID) return;
      const name = window.prompt("Name this city:", cityDisplayName(city));
      if (name && name.trim()) {
        apply({ type: "RENAME_CITY", playerId: HUMAN_ID, cityId: selectedCityId, name: name.trim().slice(0, 24) });
      }
    });
  }

  // ===== Codex (browsable historical encyclopedia) =====
  function buildCodex() {
    if (!codexBodyEl) return;
    const parts = [];

    parts.push('<section class="cdx-sec"><h3>Civilizations</h3>');
    for (const c of engine.CIV_ROSTER || []) {
      parts.push(
        '<div class="cdx-entry"><b><span class="cdx-dot" style="background:' + c.color + '"></span>' +
        c.civ + "</b> — the " + c.adjective + " people; capital " + c.capital + "." +
        '</div>'
      );
    }
    parts.push("</section>");

    parts.push('<section class="cdx-sec"><h3>Units — a classical order of battle</h3>');
    for (const type of BUILDABLE) {
      const meta = UNIT_META[type] || { name: type, role: "" };
      parts.push(
        '<div class="cdx-entry"><b>' + (UNIT_GLYPHS[type] || "") + " " + meta.name + "</b> — " + meta.role +
        '<div class="cdx-note">' + (UNIT_HISTORY[type] || "") + "</div></div>"
      );
    }
    parts.push("</section>");

    parts.push('<section class="cdx-sec"><h3>The Tree of Decisions</h3>');
    for (const age of [1, 2, 3]) {
      parts.push('<h4>' + (AGE_LABELS[age] || "Age " + age) + "</h4>");
      for (const id of Object.keys(engine.TECHS || {})) {
        if (engine.TECHS[id].age !== age) continue;
        const info = techMeta(id);
        parts.push('<div class="cdx-entry"><b>' + info.name + '</b><div class="cdx-note">' + info.note + "</div></div>");
      }
    }
    parts.push("</section>");

    parts.push('<section class="cdx-sec"><h3>City Buildings</h3>');
    for (const id of Object.keys(engine.BUILDINGS || {})) {
      const b = engine.BUILDINGS[id];
      parts.push(
        '<div class="cdx-entry"><b>' + (BUILDING_GLYPH[id] || "") + " " + b.name + '</b><div class="cdx-note">' + b.note + "</div></div>"
      );
    }
    parts.push("</section>");

    parts.push('<section class="cdx-sec"><h3>Crossroads of History</h3>');
    for (const e of engine.EVENTS || []) {
      parts.push('<div class="cdx-entry"><b>' + e.title + '</b><div class="cdx-note">' + e.situation + "</div></div>");
    }
    parts.push("</section>");

    codexBodyEl.innerHTML = parts.join("");
  }

  if (codexBtn && codexModalEl) {
    codexBtn.addEventListener("click", function () {
      buildCodex();
      codexModalEl.classList.remove("hidden");
    });
    if (codexCloseBtn) codexCloseBtn.addEventListener("click", function () { codexModalEl.classList.add("hidden"); });
    codexModalEl.addEventListener("click", function (e) {
      if (e.target === codexModalEl) codexModalEl.classList.add("hidden");
    });
  }

  // ===== Research (the glowing tech button opens the tree) =====
  if (researchBtn && researchModalEl) {
    researchBtn.addEventListener("click", function () {
      renderTechTree(engine.getVictoryStatus(state));
      researchModalEl.classList.remove("hidden");
    });
    if (researchCloseBtn) researchCloseBtn.addEventListener("click", function () { researchModalEl.classList.add("hidden"); });
    researchModalEl.addEventListener("click", function (e) {
      if (e.target === researchModalEl) researchModalEl.classList.add("hidden");
    });
  }

  // ===== Standings (openable from the bottom-right) =====
  if (standingsBtn && standingsPanelEl) {
    standingsBtn.addEventListener("click", function () {
      standingsPanelEl.classList.toggle("hidden");
    });
  }

  // ===== Map editor toolbar =====
  const meDoneBtn = document.getElementById("me-done");
  const meExportBtn = document.getElementById("me-export");
  const meExportModal = document.getElementById("me-export-modal");
  const meExportText = document.getElementById("me-export-text");
  const meExportClose = document.getElementById("me-export-close");
  if (meDoneBtn) meDoneBtn.addEventListener("click", closeMapEditor);
  if (meExportBtn) meExportBtn.addEventListener("click", function () {
    if (meExportText) meExportText.value = exportMapAscii();
    if (meExportModal) meExportModal.classList.remove("hidden");
    if (meExportText) { meExportText.focus(); meExportText.select(); }
  });
  if (meExportClose) meExportClose.addEventListener("click", function () { if (meExportModal) meExportModal.classList.add("hidden"); });

  // ===== Campaign hand (cards in play + events) =====
  if (handBtn) handBtn.addEventListener("click", openHand);
  if (handCloseBtn) handCloseBtn.addEventListener("click", function () { handModalEl.classList.add("hidden"); });
  if (handModalEl) handModalEl.addEventListener("click", function (e) { if (e.target === handModalEl) handModalEl.classList.add("hidden"); });

  // ===== Menu overlay (setup + profile + deck) =====
  function openMenu() { if (menuOverlayEl) menuOverlayEl.classList.remove("hidden"); }
  function closeMenu() { if (menuOverlayEl) menuOverlayEl.classList.add("hidden"); }
  if (menuBtn) menuBtn.addEventListener("click", openMenu);
  if (menuCloseBtn) menuCloseBtn.addEventListener("click", closeMenu);
  if (menuOverlayEl) menuOverlayEl.addEventListener("click", function (e) { if (e.target === menuOverlayEl) closeMenu(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeMenu(); });

  // ===== Fullscreen (let the board fill the screen) =====
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener("click", function () {
      const el = document.documentElement;
      if (!document.fullscreenElement) {
        if (el.requestFullscreen) el.requestFullscreen().catch(function () {});
        document.body.classList.add("fullscreen");
      } else {
        if (document.exitFullscreen) document.exitFullscreen().catch(function () {});
        document.body.classList.remove("fullscreen");
      }
      // Give the layout a tick, then tell the board to resize to the new box.
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
    });
    document.addEventListener("fullscreenchange", function () {
      document.body.classList.toggle("fullscreen", !!document.fullscreenElement);
      setTimeout(function () { window.dispatchEvent(new Event("resize")); }, 60);
    });
  }

  // Sound on/off. First press also boots the audio engine (browsers need a gesture).
  const soundBtn = document.getElementById("sound-btn");
  if (soundBtn) {
    soundBtn.addEventListener("click", function () {
      audioInit();
      const m = window.HGAudio ? window.HGAudio.toggleMuted() : true;
      soundBtn.textContent = m ? "🔇" : "🔊";
      soundBtn.title = m ? "Sound off — click for sound" : "Sound on / off";
    });
  }
  // Boot audio on the first gesture anywhere so ambience/music are ready in-game.
  const bootAudioOnce = function () {
    audioInit();
    window.removeEventListener("pointerdown", bootAudioOnce);
    window.removeEventListener("keydown", bootAudioOnce);
  };
  window.addEventListener("pointerdown", bootAudioOnce);
  window.addEventListener("keydown", bootAudioOnce);

  // Glow the Research button when a tech is both available and affordable.
  function updateResearchIndicator() {
    if (!researchBtn || !state) return;
    const player = human();
    let ready = 0;
    for (const id of Object.keys(engine.TECHS || {})) {
      const t = engine.TECHS[id];
      if (t.civ && !civMatches(player, t.civ)) continue;
      if (!canResearchSafe(player, id)) continue;
      const cost = engine.scaledResearchCost ? engine.scaledResearchCost(state, id, HUMAN_ID) : (engine.researchCost ? engine.researchCost(id) : 0);
      if (player.science >= cost) ready += 1;
    }
    researchBtn.classList.toggle("glow", ready > 0 && isHumanTurn());
    // Keep the flask glyph; show a small count in the badge span.
    const badge = researchBtn.querySelector(".flask-badge");
    if (badge) badge.textContent = ready > 0 ? String(ready) : "";
    researchBtn.title = ready > 0
      ? "Research — " + ready + " discovery" + (ready === 1 ? "" : "ies") + " ready"
      : "Research — open the tech tree";
  }

  // ===== Player profile, stats & badges (local, localStorage) =====
  // Per-account once signed in (hegemon_profile__<user>); the legacy single-profile
  // key is the default and migrates into the first account that signs in.
  let PROFILE_KEY = "hegemon_profile";
  const BADGES = [
    { id: "first-blood", icon: "⚔️", name: "First Blood", desc: "Play your first campaign.", test: (p) => p.games >= 1 },
    { id: "first-win", icon: "🏅", name: "First Victory", desc: "Win a campaign.", test: (p) => p.wins >= 1 },
    { id: "conqueror", icon: "🏛️", name: "Conqueror", desc: "Win by Domination (hold every capital).", test: (p) => p.dominationWins >= 1 },
    { id: "sage", icon: "📜", name: "Sage", desc: "Win by Score at the age's end.", test: (p) => p.scoreWins >= 1 },
    { id: "veteran", icon: "🎖️", name: "Veteran", desc: "Play 10 campaigns.", test: (p) => p.games >= 10 },
    { id: "hegemon", icon: "👑", name: "Hegemon", desc: "Win 5 campaigns.", test: (p) => p.wins >= 5 },
    { id: "unstoppable", icon: "🔥", name: "Unstoppable", desc: "Win 10 campaigns.", test: (p) => p.wins >= 10 },
    { id: "polymath", icon: "🌍", name: "Polymath", desc: "Play a campaign as all six peoples.", test: (p) => Object.values(p.byCiv || {}).filter((c) => c.played > 0).length >= 6 }
  ];

  // The free starter peoples (the lesser powers); the marquee civs must be
  // unlocked by finding (or earning) their card — so the good ones count.
  // TESTING: all civs open for now. Revert to ["gaul", "parthia"] to re-enable
  // the card gate.
  const STARTER_CIVS = ["gaul", "parthia", "rome", "greece", "egypt", "carthage"];
  const RARITY = {
    starter: { name: "Starter", color: "#6fae5f", weight: 0 }, // free civs; never drop in packs
    common: { name: "Common", color: "#9aa7b4", weight: 62 },
    rare: { name: "Rare", color: "#4a90d9", weight: 26 },
    epic: { name: "Epic", color: "#a25ddc", weight: 9 },
    legendary: { name: "Legendary", color: "#f2a03d", weight: 3 }
  };
  // Pack tiers — Standard is a free daily; Bronze/Silver/Gold are bought with
  // coins (the free grind path) now, real money later. Every pack gives 3 cards;
  // the higher the tier, the better the odds of a good pull.
  const PACK_TIERS = {
    standard: { name: "Standard", icon: "📦", cost: 0, weights: { common: 72, rare: 22, epic: 5, legendary: 1 } },
    bronze: { name: "Bronze", icon: "🥉", cost: 60, weights: { common: 54, rare: 33, epic: 10, legendary: 3 } },
    silver: { name: "Silver", icon: "🥈", cost: 160, weights: { common: 36, rare: 40, epic: 19, legendary: 5 } },
    gold: { name: "Gold", icon: "🥇", cost: 420, weights: { common: 18, rare: 40, epic: 32, legendary: 10 } }
  };
  const COINS_WIN = 40;
  const COINS_LOSS = 18;
  // The card catalogue. Civ cards unlock a people; cosmetics equip on the profile
  // (crown before the name, an emblem, a title after). No card grants power.
  // ===== Cards v2 (Legends / Edicts / Events / Civs) — data of record lives in
  // src/cards-data-v2.js, exposed to the browser as window.HEGEMON_CARDS_V2 by the
  // build (see scripts/build-web.mjs). game.js maps the declarative effect
  // vocabulary onto the engine's hooks; anything the engine can't do yet is
  // catalogued as "flagged" (see cardFlags / CARD_FLAG_KEYS below).
  const V2 = (window.HEGEMON_CARDS_V2) || { CIV_CARDS: [], LEGENDS: [], EDICTS: [], EVENT_CARDS: [] };
  const CIV_ICON = { rome: "🦅", greece: "🏛️", egypt: "🔺", carthage: "🐘", gaul: "⚔️", parthia: "🏹", sparta: "🛡️", macedon: "🐎", persia: "👑", han: "🀄", maurya: "🐘", scythia: "🐎", phoenicia: "⚓", etruria: "🏺", thrace: "🗡️", ptolemies: "👁️", seleucids: "🐘", numidia: "🐎", epirus: "🐘", pontus: "☠️", armenia: "⛰️", judea: "✡️", kush: "🏹", celtiberia: "🗡️", germania: "🌲", britannia: "🗿", dacia: "🐺", illyria: "⚓", pergamon: "📜", bactria: "🐎" };
  const ROLE_ICON = { commander: "⚔️", statesman: "🏛️", sage: "📜", builder: "🏗️", navigator: "⚓" };

  // Effect vocabulary → engine hooks. TODAY the engine only supports a flat
  // per-turn `perks` bonus (gold/science to the pool, food/production to the
  // capital). Only capital/city yields map; everything else is flagged.
  // STABILITY has no city stat yet (arrives in Phase 5): per the substitution
  // rule (CIVS-CARDS-v2 §7.3) it is STUBBED here as +gold, so those cards aren't
  // inert. Phase 5 replaces this stub with the real stability stat.
  const YIELD_KEY = { food: "food", gold: "gold", science: "science", labour: "production", production: "production", stability: "gold" /* STUB */ };
  function effectToPerks(effect) {
    const perks = {};
    const add = (src) => { if (!src) return; for (const k in src) { const t = YIELD_KEY[k]; if (t) perks[t] = (perks[t] || 0) + src[k]; } };
    add(effect && effect.capitalYield);
    add(effect && effect.cityYield); // NOTE: per-city approximated as flat until a per-city card hook exists
    return perks;
  }
  // Does this effect reference stability (currently STUBBED as gold)?
  function effectStubsStability(effect) {
    if (!effect) return false;
    return !!((effect.cityYield && effect.cityYield.stability) || (effect.capitalYield && effect.capitalYield.stability));
  }
  // Effect keys the engine does NOT implement at all yet (surfaced for the handoff).
  // Yields (incl. the stability→gold stub) ARE applied, so they aren't flagged.
  function effectFlags(effect) {
    if (!effect) return [];
    const flags = [];
    for (const k in effect) {
      if (k === "capitalYield" || k === "cityYield") continue; // applied (stability stubbed)
      flags.push(k); // atkPct/defPct/unitCostPct/buildFasterPct/researchCostPct/movePlus/healPlus/plunderPct/tradeRouteGold/special/instant/unitPct/filters…
    }
    return flags;
  }
  const YICON = { food: "🌾", gold: "🪙", science: "🧪", production: "⚒️", labour: "⚒️", stability: "☮" };
  function yieldStr(y) { return Object.keys(y).map((k) => (y[k] > 0 ? "+" : "") + y[k] + " " + (YICON[k] || k)).join(", "); }
  // A short, human-readable line describing a card's effect.
  function effectSummary(effect) {
    if (!effect) return "";
    const p = [];
    if (effect.cityYield) p.push(yieldStr(effect.cityYield) + "/city");
    if (effect.capitalYield) p.push(yieldStr(effect.capitalYield) + " capital");
    if (effect.atkPct) p.push("+" + effect.atkPct + "% attack");
    if (effect.defPct) p.push("+" + effect.defPct + "% defence" + (effect.inOwnTerritory ? " at home" : ""));
    if (effect.vs && effect.vs.atkPct) p.push("+" + effect.vs.atkPct + "% vs " + (effect.vs.civ || effect.vs.cat || "target"));
    if (effect.unitPct) p.push("+" + (effect.unitPct.atkPct || 0) + "% " + effect.unitPct.unit + (effect.unitPct.costPct ? " (" + effect.unitPct.costPct + "% cost)" : ""));
    if (effect.unitCatPct) p.push("+" + (effect.unitCatPct.atkPct || effect.unitCatPct.defPct || 0) + "% " + effect.unitCatPct.cat);
    if (effect.researchCostPct) p.push(effect.researchCostPct + "% research");
    if (effect.unitCostPct) p.push(effect.unitCostPct + "% unit cost");
    if (effect.buildFasterPct) p.push("+" + effect.buildFasterPct + "% build speed");
    if (effect.wonderCostPct) p.push(effect.wonderCostPct + "% wonders");
    if (effect.tradeRouteGold) p.push("+" + effect.tradeRouteGold + " gold/route");
    if (effect.movePlus || effect.navalMovePlus || (effect.unitCatPct && effect.unitCatPct.movePlus)) p.push("+" + (effect.movePlus || effect.navalMovePlus || effect.unitCatPct.movePlus) + " move");
    if (effect.navalAtkPct) p.push("+" + effect.navalAtkPct + "% naval");
    if (effect.plunderPct) p.push("+" + effect.plunderPct + "% plunder");
    if (effect.veterancyRatePct) p.push("+" + effect.veterancyRatePct + "% veterancy");
    if (effect.special) p.push(String(effect.special).replace(/-/g, " "));
    if (effect.instant) p.push(String(effect.instant).replace(/-/g, " "));
    return p.join(" · ");
  }

  const COSMETICS = [
    { id: "crown-laurel", type: "cosmetic", slot: "crown", rarity: "common", name: "Laurel Wreath", icon: "🌿" },
    { id: "crown-gold", type: "cosmetic", slot: "crown", rarity: "rare", name: "Gold Diadem", icon: "👑" },
    { id: "crown-iron", type: "cosmetic", slot: "crown", rarity: "epic", name: "Iron Crown", icon: "⚜️" },
    { id: "emblem-eagle", type: "cosmetic", slot: "emblem", rarity: "common", name: "Eagle", icon: "🦅" },
    { id: "emblem-wolf", type: "cosmetic", slot: "emblem", rarity: "common", name: "Wolf", icon: "🐺" },
    { id: "emblem-owl", type: "cosmetic", slot: "emblem", rarity: "common", name: "Owl of Athena", icon: "🦉" },
    { id: "emblem-trireme", type: "cosmetic", slot: "emblem", rarity: "rare", name: "Trireme", icon: "⛵" },
    { id: "emblem-elephant", type: "cosmetic", slot: "emblem", rarity: "rare", name: "War Elephant", icon: "🐘" },
    { id: "emblem-sun", type: "cosmetic", slot: "emblem", rarity: "epic", name: "Sun of Egypt", icon: "☀️" },
    { id: "title-bold", type: "cosmetic", slot: "title", rarity: "common", name: "the Bold", icon: "🛡️" },
    { id: "title-conqueror", type: "cosmetic", slot: "title", rarity: "rare", name: "the Conqueror", icon: "⚔️" },
    { id: "title-wise", type: "cosmetic", slot: "title", rarity: "rare", name: "the Wise", icon: "📜" },
    { id: "title-great", type: "cosmetic", slot: "title", rarity: "legendary", name: "the Great", icon: "🌟" }
  ];

  // Assemble the full collection: CIV cards + LEGENDS + EDICTS + EVENTS + cosmetics.
  const CARDS = [];
  for (const c of V2.CIV_CARDS) {
    CARDS.push({ id: "civ-" + c.id, type: "civ", civ: c.id, rarity: c.rarity, name: c.name, icon: CIV_ICON[c.id] || "🏳️", playable: c.playable !== false, wave: c.wave || 1 });
  }
  for (const l of V2.LEGENDS) {
    CARDS.push({ id: l.id, type: "legend", civ: l.civ, role: l.role, rarity: l.rarity, name: l.name, icon: ROLE_ICON[l.role] || "⭐", effect: l.effect, blurb: l.blurb, benefit: effectSummary(l.effect), flags: effectFlags(l.effect) });
  }
  for (const e of V2.EDICTS) {
    CARDS.push({ id: e.id, type: "edict", civ: e.civ || null, rarity: e.rarity, name: e.name, icon: "📜", effect: e.effect, benefit: effectSummary(e.effect), flags: effectFlags(e.effect) });
  }
  for (const e of V2.EVENT_CARDS) {
    CARDS.push({ id: e.id, type: "event", civ: e.civ || null, rarity: e.rarity, name: e.name, icon: "✨", effect: e.effect, benefit: effectSummary(e.effect), flags: effectFlags(e.effect) });
  }
  for (const c of COSMETICS) CARDS.push(c);

  const CARDS_BY_ID = {};
  const CARDS_BY_RARITY = {};
  for (const c of CARDS) {
    CARDS_BY_ID[c.id] = c;
    (CARDS_BY_RARITY[c.rarity] = CARDS_BY_RARITY[c.rarity] || []).push(c);
  }
  // Loadout slots (v2): exactly one Legend + one Edict + one Event, all civ-matched.
  const LOADOUT_SLOTS = ["legend", "edict", "event"];
  function civCardOk(card, civId) { return !!card && (card.civ == null || card.civ === civId); }
  function normalizeLoadout(l) {
    const out = { legend: null, edict: null, event: null };
    if (l && typeof l === "object" && !Array.isArray(l)) {
      for (const s of LOADOUT_SLOTS) if (typeof l[s] === "string") out[s] = l[s];
    }
    return out; // old array loadouts (generals) simply reset — those cards are gone
  }

  function rollRarity(weights) {
    const w = weights || { common: RARITY.common.weight, rare: RARITY.rare.weight, epic: RARITY.epic.weight, legendary: RARITY.legendary.weight };
    const total = Object.keys(w).reduce((s, k) => s + w[k], 0);
    let roll = Math.random() * total;
    for (const k of Object.keys(w)) {
      roll -= w[k];
      if (roll <= 0) return k;
    }
    return "common";
  }
  // Open one pack of the given tier (must own it). Rolls 3 cards on that tier's
  // odds — a better tier tilts toward the good pulls.
  function openPack(tier) {
    const t = PACK_TIERS[tier] ? tier : "standard";
    const p = loadProfile();
    if ((p.packs[t] || 0) <= 0) return null;
    p.packs[t] -= 1;
    const gained = [];
    for (let i = 0; i < 3; i += 1) {
      let rarity = rollRarity(PACK_TIERS[t].weights);
      let pool = CARDS_BY_RARITY[rarity];
      if (!pool || !pool.length) { rarity = "common"; pool = CARDS_BY_RARITY.common || CARDS; }
      const card = pool[Math.floor(Math.random() * pool.length)];
      const isNew = !p.cards[card.id];
      p.cards[card.id] = (p.cards[card.id] || 0) + 1;
      if (card.type === "civ" && card.playable && p.unlockedCivs.indexOf(card.civ) === -1) p.unlockedCivs.push(card.civ);
      gained.push({ card: card, isNew: isNew });
    }
    saveProfile(p);
    return gained;
  }
  // The free Standard pack is claimable once per calendar day.
  function canClaimDaily() {
    const p = loadProfile();
    if (!p.lastDaily) return true;
    return new Date(p.lastDaily).toDateString() !== new Date().toDateString();
  }
  function claimDaily() {
    if (!canClaimDaily()) return false;
    const p = loadProfile();
    p.packs.standard = (p.packs.standard || 0) + 1;
    p.lastDaily = Date.now();
    saveProfile(p);
    return true;
  }
  function buyPack(tier) {
    const t = PACK_TIERS[tier];
    if (!t || t.cost <= 0) return false;
    const p = loadProfile();
    if (p.coins < t.cost) return false;
    p.coins -= t.cost;
    p.packs[tier] = (p.packs[tier] || 0) + 1;
    saveProfile(p);
    return true;
  }
  function equipCard(cardId) {
    const card = CARDS_BY_ID[cardId];
    if (!card || card.type !== "cosmetic") return;
    const p = loadProfile();
    if (!p.cards[cardId]) return;
    p.equipped = p.equipped || {};
    if (p.equipped[card.slot] === cardId) delete p.equipped[card.slot];
    else p.equipped[card.slot] = cardId;
    saveProfile(p);
  }
  // ===== Playing-card face, shared by the hand and the collection =====
  const CARD_TYPE_LABEL = { civ: "Civilization", legend: "Legend", edict: "Edict", event: "Event", cosmetic: "Cosmetic" };
  const ROLE_LABEL = { commander: "Commander", statesman: "Statesman", sage: "Sage", builder: "Builder", navigator: "Navigator" };
  function cardBenefit(c) {
    // Legends/Edicts/Events lead with their EFFECT; the blurb is the history line.
    if (c.type === "legend" || c.type === "edict" || c.type === "event") {
      const eff = c.benefit || effectSummary(c.effect);
      return (eff ? eff + (c.blurb ? " — " : "") : "") + (c.blurb || "");
    }
    if (c.blurb) return c.blurb;
    if (c.type === "civ") return c.playable ? "Play as " + c.name + "." : "Collectible — playable in a later wave.";
    if (c.type === "cosmetic") {
      const where = c.slot === "title" ? "a title after your name" : c.slot === "crown" ? "a crown before your name" : "your profile emblem";
      return "Cosmetic — worn as " + where + ".";
    }
    return "";
  }
  // The card "face": a rarity/type banner, an art panel (space for real art — the
  // emoji stands in for now), the name, and the benefit text.
  function cardFaceHtml(c, locked) {
    const rar = (RARITY[c.rarity] && RARITY[c.rarity].name) || c.rarity;
    const banner = (c.type === "legend" && ROLE_LABEL[c.role]) || CARD_TYPE_LABEL[c.type] || c.type;
    return (
      '<div class="pcard-banner"><span>' + banner + "</span><span>" + rar + "</span></div>" +
      '<div class="pcard-art"><span class="pcard-emoji">' + (locked ? "🔒" : c.icon) + "</span></div>" +
      '<div class="pcard-name">' + c.name + "</div>" +
      '<div class="pcard-desc">' + (cardBenefit(c) || "&nbsp;") + "</div>"
    );
  }

  // Toggle a General in/out of your match loadout (max 3, must own it).
  // ===== The campaign hand: cards in play + one-use events =====
  function handCardHtml(c, action) {
    let foot = "";
    if (action === "play") foot = '<button class="hand-play" data-play="' + c.id + '">Play now</button>';
    else if (action === "played") foot = '<span class="hand-done">✓ Played this campaign</span>';
    else if (action === "mismatch") foot = '<span class="hand-done">✗ Not your civ — inactive</span>';
    return '<div class="pcard rar-' + c.rarity + " type-" + c.type + '">' + cardFaceHtml(c, false) +
      '<div class="pcard-foot">' + foot + "</div></div>";
  }
  function renderHand() {
    if (!handBodyEl) return;
    const p = loadProfile();
    const lo = normalizeLoadout(p.loadout);
    const civId = state ? HUMAN_ID : null; // the civ you're playing this campaign
    const parts = [];
    // Persistent slots: Legend + Edict.
    parts.push('<h3 class="hand-h">In play every turn</h3>');
    const persistent = [lo.legend, lo.edict].map((id) => CARDS_BY_ID[id]).filter((c) => c && p.cards[c.id]);
    if (persistent.length) {
      parts.push('<div class="hand-grid">');
      for (const c of persistent) parts.push(handCardHtml(c, civId && !civCardOk(c, civId) ? "mismatch" : null));
      parts.push("</div>");
    } else parts.push('<div class="hand-empty">No Legend or Edict slotted — open 🃏 My Deck to bring one of each.</div>');
    // One-use slot: the equipped Event.
    parts.push('<h3 class="hand-h">Play once this campaign</h3>');
    const ev = CARDS_BY_ID[lo.event];
    if (ev && p.cards[ev.id]) {
      const played = state && state.playedEvents && state.playedEvents[ev.id];
      parts.push('<div class="hand-grid">');
      parts.push(handCardHtml(ev, civId && !civCardOk(ev, civId) ? "mismatch" : played ? "played" : "play"));
      parts.push("</div>");
    } else parts.push('<div class="hand-empty">No Event slotted — bring one in 🃏 My Deck.</div>');
    handBodyEl.innerHTML = parts.join("");
    const btns = handBodyEl.querySelectorAll("[data-play]");
    for (const b of btns) b.addEventListener("click", function () { playEvent(b.getAttribute("data-play")); });
  }
  function openHand() { if (handModalEl) { renderHand(); handModalEl.classList.remove("hidden"); } }
  function handHasCards() {
    const lo = normalizeLoadout(loadProfile().loadout);
    return !!(lo.legend || lo.edict || lo.event);
  }
  // Apply a one-use (v2) event card. Only the instants the engine can do today are
  // applied; the rest are flagged (they need combat/turn/spawn/stability hooks) and
  // NOT consumed, so a card is never wasted on a no-op.
  function playEvent(id) {
    if (!state) return; if ((state.playedEvents || {})[id]) return;
    const p = loadProfile();
    if (!p.cards[id]) return; // must own it
    const card = CARDS_BY_ID[id];
    if (!card || card.type !== "event") return;
    if (!civCardOk(card, HUMAN_ID)) { showCombatToast("✗ " + card.name + " only works for its own civilization.", "loss"); return; }
    const me = human();
    const eff = (card.effect && card.effect.instant) || "";
    let msg = "";
    if (eff === "capital+10food") {
      const cap = Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID && c.isCapital) || Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID);
      if (cap) cap.food = (cap.food || 0) + 10;
      msg = "🌾 " + card.name + " — +10 food in your capital.";
    } else if (eff === "+15science") {
      me.science += 15;
      msg = "📜 " + card.name + " — +15 science.";
    } else {
      // Needs an engine hook that doesn't exist yet — flag and DON'T consume.
      showCombatToast("⚑ " + card.name + " isn't wired to the engine yet — flagged (" + eff + ").", "");
      return;
    }
    state.playedEvents = state.playedEvents || {}; state.playedEvents[id] = 1;
    logAction(msg);
    showCombatToast(msg, "");
    render();
    saveGame();
    renderHand();
  }

  // Equip a Legend / Edict / Event into its one slot (toggle off if already there).
  function equipSlot(id) {
    const card = CARDS_BY_ID[id];
    if (!card || LOADOUT_SLOTS.indexOf(card.type) === -1) return;
    const p = loadProfile();
    if (!p.cards[id]) return;
    p.loadout = normalizeLoadout(p.loadout);
    p.loadout[card.type] = p.loadout[card.type] === id ? null : id;
    saveProfile(p);
  }
  // The persistent perks the equipped Legend + Edict grant THIS campaign — only the
  // slots whose card matches the played civ (or is universal), and only the flat
  // per-turn yields the engine can apply today (everything else is flagged).
  function loadoutPerks(civId) {
    const p = loadProfile();
    const lo = normalizeLoadout(p.loadout);
    const perks = {};
    for (const slot of ["legend", "edict"]) {
      const c = CARDS_BY_ID[lo[slot]];
      if (!c || !p.cards[c.id] || !civCardOk(c, civId)) continue;
      const e = effectToPerks(c.effect);
      for (const k in e) perks[k] = (perks[k] || 0) + e[k];
    }
    return perks;
  }

  function loadProfile() {
    let p = null;
    try { p = JSON.parse(window.localStorage.getItem(PROFILE_KEY) || "null"); } catch (e) { p = null; }
    if (!p || typeof p !== "object") p = {};
    return {
      name: p.name || "Player",
      games: p.games || 0,
      wins: p.wins || 0,
      losses: p.losses || 0,
      dominationWins: p.dominationWins || 0,
      scoreWins: p.scoreWins || 0,
      byCiv: p.byCiv || {},
      badges: Array.isArray(p.badges) ? p.badges : [],
      // Collection: owned cards {id: count}, unopened packs, civs unlocked, and
      // the cosmetics currently equipped on the profile.
      cards: p.cards || {},
      coins: typeof p.coins === "number" ? p.coins : 0,
      // Packs owned per tier. An old numeric `packs` migrates into standard.
      packs:
        typeof p.packs === "number"
          ? { standard: p.packs, bronze: 0, silver: 0, gold: 0 }
          : {
              standard: (p.packs && p.packs.standard) || 0,
              bronze: (p.packs && p.packs.bronze) || 0,
              silver: (p.packs && p.packs.silver) || 0,
              gold: (p.packs && p.packs.gold) || 0
            },
      lastDaily: p.lastDaily || 0,
      // Starters are always free; card-unlocked civs accumulate on top.
      unlockedCivs: Array.from(new Set(STARTER_CIVS.concat(Array.isArray(p.unlockedCivs) ? p.unlockedCivs : []))),
      equipped: p.equipped || {},
      loadout: normalizeLoadout(p.loadout) // { legend, edict, event } — v2 3-slot
    };
  }
  function saveProfile(p) {
    try { window.localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e) {}
  }
  function recordGameResult(civId, won, victoryType) {
    const p = loadProfile();
    p.games += 1;
    if (won) {
      p.wins += 1;
      if (victoryType === "domination") p.dominationWins += 1;
      else if (victoryType === "score") p.scoreWins += 1;
    } else {
      p.losses += 1;
    }
    if (civId) {
      p.byCiv[civId] = p.byCiv[civId] || { played: 0, wins: 0 };
      p.byCiv[civId].played += 1;
      if (won) p.byCiv[civId].wins += 1;
    }
    // Coins are earned by playing (a win is worth more) — the free path: grind
    // coins, buy packs. The daily Standard pack is free on top.
    p.coins = (p.coins || 0) + (won ? COINS_WIN : COINS_LOSS);
    for (const b of BADGES) if (!p.badges.includes(b.id) && b.test(p)) p.badges.push(b.id);
    saveProfile(p);
    return p;
  }

  // ===== Accounts / login (client-side, localStorage) =====
  // NOTE: this is a local-first placeholder — credentials live in the browser and
  // are NOT secure against someone with device access. A real backend (accounts +
  // server-side auth) comes with the online/app build; the storage shape here is
  // designed to migrate to it. Passwords are salted + SHA-256 hashed so plaintext
  // is never stored.
  const ACCOUNTS_KEY = "hegemon_accounts";
  const SESSION_KEY = "hegemon_session";
  let currentAccount = null;

  function loadAccounts() {
    try { return JSON.parse(window.localStorage.getItem(ACCOUNTS_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveAccounts(a) {
    try { window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(a)); } catch (e) {}
  }
  function randSalt() {
    if (window.crypto && window.crypto.getRandomValues) {
      const b = new Uint8Array(16); window.crypto.getRandomValues(b);
      return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    return String(Date.now()) + Math.floor(Math.random() * 1e9).toString(16);
  }
  async function hashPw(pw, salt) {
    const text = salt + "::" + pw;
    if (window.crypto && window.crypto.subtle) {
      const data = new TextEncoder().encode(text);
      const buf = await window.crypto.subtle.digest("SHA-256", data);
      return Array.from(new Uint8Array(buf)).map((x) => x.toString(16).padStart(2, "0")).join("");
    }
    // Fallback (older browsers): a simple non-crypto hash. Still no plaintext.
    let h = 5381; for (let i = 0; i < text.length; i += 1) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
    return "x" + (h >>> 0).toString(16);
  }
  function findAccount(userOrEmail) {
    const accts = loadAccounts();
    const key = String(userOrEmail || "").trim().toLowerCase();
    if (accts[key]) return accts[key];
    for (const k in accts) if ((accts[k].email || "").toLowerCase() === key) return accts[k];
    return null;
  }
  async function seedAdmin() {
    const accts = loadAccounts();
    if (accts.admin) return;
    const salt = randSalt();
    accts.admin = {
      username: "admin", name: "admin", email: "mclear@gmail.com",
      salt: salt, hash: await hashPw("1234567", salt), isAdmin: true, createdAt: Date.now()
    };
    saveAccounts(accts);
  }
  // Point the profile at this account, migrating the legacy single profile the
  // first time an account claims it.
  function activateAccount(acct) {
    currentAccount = acct;
    try { window.localStorage.setItem(SESSION_KEY, acct.username); } catch (e) {}
    PROFILE_KEY = "hegemon_profile__" + acct.username;
    const legacy = window.localStorage.getItem("hegemon_profile");
    if (legacy && !window.localStorage.getItem(PROFILE_KEY)) {
      try { window.localStorage.setItem(PROFILE_KEY, legacy); } catch (e) {}
    }
    // Make sure the profile carries the account's display name.
    const p = loadProfile(); p.name = acct.name || acct.username; saveProfile(p);
    adminRevealMap = !!acct.isAdmin; // admins start with the whole map revealed
    updateAccountLine();
  }
  async function doLogin(userOrEmail, pw) {
    const acct = findAccount(userOrEmail);
    if (!acct) return { ok: false, error: "No such account." };
    const h = await hashPw(pw, acct.salt);
    if (h !== acct.hash) return { ok: false, error: "Wrong password." };
    activateAccount(acct);
    return { ok: true };
  }
  async function doRegister(name, email, pw) {
    name = String(name || "").trim();
    email = String(email || "").trim();
    if (name.length < 2) return { ok: false, error: "Name must be at least 2 characters." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return { ok: false, error: "Enter a valid email." };
    if (String(pw || "").length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const accts = loadAccounts();
    const key = name.toLowerCase();
    if (accts[key]) return { ok: false, error: "That name is taken." };
    for (const k in accts) if ((accts[k].email || "").toLowerCase() === email.toLowerCase()) return { ok: false, error: "That email is already registered." };
    const salt = randSalt();
    accts[key] = { username: key, name: name, email: email, salt: salt, hash: await hashPw(pw, salt), isAdmin: false, createdAt: Date.now() };
    saveAccounts(accts);
    activateAccount(accts[key]);
    return { ok: true };
  }
  async function changePassword(oldPw, newPw) {
    if (!currentAccount) return { ok: false, error: "Not signed in." };
    const accts = loadAccounts();
    const acct = accts[currentAccount.username];
    if (!acct) return { ok: false, error: "Account missing." };
    if ((await hashPw(oldPw, acct.salt)) !== acct.hash) return { ok: false, error: "Current password is wrong." };
    if (String(newPw || "").length < 6) return { ok: false, error: "New password must be at least 6 characters." };
    acct.salt = randSalt();
    acct.hash = await hashPw(newPw, acct.salt);
    saveAccounts(accts);
    currentAccount = acct;
    return { ok: true };
  }
  function updateAccountLine() {
    if (!accountLineEl) return;
    if (!currentAccount) { accountLineEl.innerHTML = "Not signed in"; return; }
    let html = "Signed in as <b>" + (currentAccount.name || currentAccount.username) + "</b>" +
      (currentAccount.email ? ' <span class="sel-sub">(' + currentAccount.email + ")</span>" : "");
    if (currentAccount.isAdmin) {
      html += '<div class="admin-tools"><button id="reveal-map-btn" class="ghost-btn">🗺️ Reveal map: ' + (adminRevealMap ? "ON" : "OFF") +
        '</button><button id="edit-map-btn" class="ghost-btn">🖉 Map editor</button></div>';
    }
    accountLineEl.innerHTML = html;
    const rb = document.getElementById("reveal-map-btn");
    if (rb) rb.addEventListener("click", function () { adminRevealMap = !adminRevealMap; updateAccountLine(); if (state) render(); });
    const eb = document.getElementById("edit-map-btn");
    if (eb) eb.addEventListener("click", function () { openMapEditor(); });
  }

  // ===== Admin map editor: paint terrain on the live map + export an atlas =====
  const EDIT_TERRAINS = [
    { t: "sea", label: "Sea", ch: "~" }, { t: "coast", label: "Coast", ch: ":" },
    { t: "plains", label: "Plains", ch: "." }, { t: "valley", label: "Valley", ch: "," },
    { t: "forest", label: "Forest", ch: "f" }, { t: "hills", label: "Hills", ch: "h" },
    { t: "mountains", label: "Mountains", ch: "^" }, { t: "desert", label: "Desert", ch: "d" }
  ];
  const TERRAIN_TO_CHAR = {};
  for (const e of EDIT_TERRAINS) TERRAIN_TO_CHAR[e.t] = e.ch;

  function paintTile(q, r) {
    if (!state) return;
    const key = q + "," + r;
    const tile = state.map.tiles[key];
    if (!tile) return;
    tile.terrain = editBrush;
    render();
  }
  function openMapEditor() {
    mapEditMode = true;
    adminRevealMap = true; // see the whole canvas while editing
    if (menuOverlayEl) menuOverlayEl.classList.add("hidden");
    const ed = document.getElementById("map-editor");
    if (ed) ed.classList.remove("hidden");
    buildEditorPalette();
    updateAccountLine();
    if (state) render();
  }
  function closeMapEditor() {
    mapEditMode = false;
    const ed = document.getElementById("map-editor");
    if (ed) ed.classList.add("hidden");
  }
  function buildEditorPalette() {
    const pal = document.getElementById("me-palette");
    if (!pal) return;
    pal.innerHTML = "";
    for (const e of EDIT_TERRAINS) {
      const b = document.createElement("button");
      b.className = "me-swatch me-" + e.t + (e.t === editBrush ? " active" : "");
      b.textContent = e.label;
      b.addEventListener("click", function () { editBrush = e.t; buildEditorPalette(); });
      pal.appendChild(b);
    }
  }
  // The current map as an atlas (offset rows), ready to paste into a scenario.
  function exportMapAscii() {
    if (!state) return "";
    const W = state.map.width, Hh = state.map.height;
    const capChar = {};
    for (const c of Object.values(state.map.cities)) {
      if (!c.isCapital) continue;
      capChar[c.position.q + "," + c.position.r] = "@"; // marks a city; capitals are 1-9 in atlas
    }
    const lines = [];
    for (let row = 0; row < Hh; row += 1) {
      let line = "";
      for (let col = 0; col < W; col += 1) {
        const q = col - ((row - (row & 1)) >> 1);
        const tile = state.map.tiles[q + "," + row];
        line += capChar[q + "," + row] || (tile ? (TERRAIN_TO_CHAR[tile.terrain] || "~") : "~");
      }
      lines.push(line);
    }
    return lines.join("\n");
  }

  function renderProfile() {
    if (!profileBodyEl) return;
    const p = loadProfile();
    const pct = (w, g) => (g > 0 ? Math.round((w / g) * 100) + "%" : "—");
    const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const eq = p.equipped || {};
    const cardIco = (id) => (id && CARDS_BY_ID[id] ? CARDS_BY_ID[id].icon : "");
    const crown = eq.crown ? cardIco(eq.crown) + " " : "";
    const emblem = eq.emblem ? cardIco(eq.emblem) + " " : "";
    const title = eq.title && CARDS_BY_ID[eq.title] ? " " + CARDS_BY_ID[eq.title].name : "";
    const parts = [];
    parts.push(
      '<div class="pf-head">' +
      '<div class="pf-idcol">' +
      '<div class="pf-flair">' + crown + emblem + '<span class="pf-flairname">' + esc(p.name) + "</span>" + esc(title) + "</div>" +
      '<input id="pf-name" class="pf-name" value="' + String(p.name).replace(/"/g, "&quot;") + '" maxlength="20" title="Your name" />' +
      "</div>" +
      '<div class="pf-summary">' +
      '<span><b>' + p.games + "</b> games</span>" +
      '<span><b>' + p.wins + "</b> wins <small>(" + pct(p.wins, p.games) + ")</small></span>" +
      '<span><b>' + p.losses + "</b> losses</span>" +
      '<span>💰 <b>' + p.coins + "</b> coins</span>" +
      "</div></div>"
    );

    parts.push('<h3 class="pf-h">Peoples</h3><div class="pf-civs">');
    for (const c of engine.CIV_ROSTER || []) {
      const s = p.byCiv[c.id] || { played: 0, wins: 0 };
      const locked = p.unlockedCivs.indexOf(c.id) === -1;
      parts.push(
        '<div class="pf-civ' + (s.played ? "" : " dim") + '">' +
        '<span class="pf-dot" style="background:' + (CIV_COLORS[c.id] || c.color) + '"></span>' +
        '<span class="pf-civname">' + c.civ + (locked ? " 🔒" : "") + "</span>" +
        '<span class="pf-civstat">' + (locked ? "locked — find its card" : s.played + " played · " + s.wins + " won <small>(" + pct(s.wins, s.played) + ")</small>") + "</span>" +
        "</div>"
      );
    }
    parts.push("</div>");

    const earned = p.badges.length;
    parts.push('<h3 class="pf-h">Badges <small>' + earned + " / " + BADGES.length + '</small></h3><div class="pf-badges">');
    for (const b of BADGES) {
      const has = p.badges.includes(b.id);
      parts.push(
        '<div class="pf-badge' + (has ? " got" : " locked") + '" title="' + b.desc + '">' +
        '<span class="pf-badge-ico">' + (has ? b.icon : "🔒") + "</span>" +
        '<span class="pf-badge-name">' + b.name + "</span></div>"
      );
    }
    parts.push("</div>");
    parts.push('<div class="pf-note">Stats are saved on this device. Open 🃏 Cards to collect and equip generals & cosmetics. Accounts, sync & purchases come later.</div>');

    profileBodyEl.innerHTML = parts.join("");
    const nameInput = document.getElementById("pf-name");
    if (nameInput) {
      nameInput.addEventListener("change", function () {
        const pp = loadProfile();
        pp.name = (nameInput.value || "Player").slice(0, 20);
        saveProfile(pp);
      });
    }
  }

  if (profileBtn && profileModalEl) {
    profileBtn.addEventListener("click", function () {
      renderProfile();
      profileModalEl.classList.remove("hidden");
    });
    if (profileCloseBtn) profileCloseBtn.addEventListener("click", function () { profileModalEl.classList.add("hidden"); });
    profileModalEl.addEventListener("click", function (e) {
      if (e.target === profileModalEl) profileModalEl.classList.add("hidden");
    });
  }

  // ===== Card collection & packs =====
  function renderCards() {
    if (!cardsBodyEl) return;
    const p = loadProfile();
    const owned = Object.keys(p.cards).length;
    const parts = [];
    const daily = canClaimDaily();
    parts.push(
      '<div class="cd-top">' +
      '<div class="cd-coins">💰 <b>' + p.coins + "</b> coins</div>" +
      '<button id="cd-daily" class="cd-daily"' + (daily ? "" : " disabled") + ">" + (daily ? "📦 Claim daily pack" : "📦 Daily claimed") + "</button>" +
      '<div class="cd-count">' + owned + " / " + CARDS.length + " cards</div></div>"
    );
    parts.push(
      '<div class="cd-buy"><span class="cd-lo-label">Buy packs</span>' +
      ["bronze", "silver", "gold"].map(function (tier) {
        const t = PACK_TIERS[tier];
        return '<button class="cd-buybtn" data-buy="' + tier + '"' + (p.coins >= t.cost ? "" : " disabled") + ">" + t.icon + " " + t.name + " — " + t.cost + " 💰</button>";
      }).join("") + "</div>"
    );
    const ownedPacks = ["standard", "bronze", "silver", "gold"].filter(function (tier) { return p.packs[tier] > 0; });
    parts.push(
      '<div class="cd-open-row">' +
      (ownedPacks.length
        ? ownedPacks.map(function (tier) {
            const t = PACK_TIERS[tier];
            return '<button class="cd-openbtn" data-open="' + tier + '">Open ' + t.icon + " " + t.name + " (" + p.packs[tier] + ")</button>";
          }).join("")
        : '<span class="cd-lo-empty">No packs yet — claim your daily or buy one above.</span>') +
      "</div>"
    );
    parts.push('<div id="cd-reveal" class="cd-reveal"></div>');
    parts.push('<div class="cd-note">Coins are earned by playing (win = ' + COINS_WIN + ', loss = ' + COINS_LOSS + '); spend them on Bronze/Silver/Gold packs, or claim the free daily Standard. A better tier tilts the odds toward good cards. Everything is cosmetic or a small, always-earnable edge — never pay-to-win. Click an owned cosmetic to wear it, or a Legend / Edict / Event to slot it for your next campaign.</div>');

    // Loadout: one Legend + one Edict + one Event, brought into your next campaign.
    // (They only take effect when you play their civilization — universal cards
    // always apply.)
    const lo = normalizeLoadout(p.loadout);
    const perks = {};
    for (const slot of ["legend", "edict"]) { const c = CARDS_BY_ID[lo[slot]]; if (c && p.cards[c.id]) { const e = effectToPerks(c.effect); for (const k in e) perks[k] = (perks[k] || 0) + e[k]; } }
    const perkStr = [];
    if (perks.food) perkStr.push("+" + perks.food + " 🌾");
    if (perks.production) perkStr.push("+" + perks.production + " ⚒️");
    if (perks.gold) perkStr.push("+" + perks.gold + " 🪙");
    if (perks.science) perkStr.push("+" + perks.science + " 🧪");
    const loSlots = LOADOUT_SLOTS.map(function (slot) {
      const c = CARDS_BY_ID[lo[slot]];
      const label = c ? (c.icon + " " + c.name) : "<i>empty</i>";
      return '<span class="cd-lo-slot"><b>' + slot.charAt(0).toUpperCase() + slot.slice(1) + ":</b> " + label + "</span>";
    }).join("");
    parts.push(
      '<div class="cd-loadout"><span class="cd-lo-label">⚔ Campaign loadout — one Legend · Edict · Event (civ-matched)</span>' +
      '<span class="cd-lo-slots">' + loSlots + "</span>" +
      (perkStr.length ? '<span class="cd-lo-perk">' + perkStr.join(" · ") + " each turn (matching-civ yields)</span>" : "") +
      "</div>"
    );

    parts.push('<div class="cd-grid">');
    for (const card of CARDS) {
      const count = p.cards[card.id] || 0;
      const has = count > 0;
      const r = RARITY[card.rarity];
      const inLoadout = LOADOUT_SLOTS.indexOf(card.type) !== -1 && lo[card.type] === card.id;
      const equipped = (card.type === "cosmetic" && p.equipped && p.equipped[card.slot] === card.id) || inLoadout;
      const foot = inLoadout
        ? '<span class="pcard-eq">✓ in loadout</span>'
        : equipped
          ? '<span class="pcard-eq">✓ equipped</span>'
          : has
            ? '<span class="pcard-owned">Owned' + (count > 1 ? " ×" + count : "") + "</span>"
            : '<span class="pcard-locked-tag">Locked</span>';
      parts.push(
        '<div class="pcard cd-card rar-' + card.rarity + " type-" + card.type + (has ? "" : " locked") + (equipped ? " equipped" : "") + '" data-id="' + card.id + '">' +
        cardFaceHtml(card, !has) +
        '<div class="pcard-foot">' + foot + "</div>" +
        "</div>"
      );
    }
    parts.push("</div>");
    cardsBodyEl.innerHTML = parts.join("");

    function showReveal(gained) {
      renderCards();
      refreshCivPicker(); // a newly-unlocked people appears in the picker at once
      const reveal = document.getElementById("cd-reveal");
      if (reveal) {
        reveal.innerHTML =
          '<div class="cd-reveal-in">' +
          gained.map(function (g) {
            const r = RARITY[g.card.rarity];
            return (
              '<div class="cd-rc ' + g.card.rarity + '"><span class="cd-ico">' + g.card.icon + "</span>" +
              '<span class="cd-name">' + g.card.name + "</span>" +
              '<span class="cd-r" style="color:' + r.color + '">' + r.name + (g.isNew ? " · NEW" : "") + "</span></div>"
            );
          }).join("") +
          "</div>";
      }
    }
    const dailyBtn = document.getElementById("cd-daily");
    if (dailyBtn) dailyBtn.addEventListener("click", function () { if (claimDaily()) renderCards(); });
    cardsBodyEl.querySelectorAll("[data-buy]").forEach(function (el) {
      el.addEventListener("click", function () { if (buyPack(el.getAttribute("data-buy"))) renderCards(); });
    });
    cardsBodyEl.querySelectorAll("[data-open]").forEach(function (el) {
      el.addEventListener("click", function () {
        const gained = openPack(el.getAttribute("data-open"));
        if (gained) showReveal(gained);
      });
    });
    cardsBodyEl.querySelectorAll(".cd-card").forEach(function (el) {
      const id = el.getAttribute("data-id");
      const card = CARDS_BY_ID[id];
      if (!card || (loadProfile().cards[id] || 0) <= 0) return;
      if (card.type === "cosmetic") {
        el.classList.add("clickable");
        el.addEventListener("click", function () { equipCard(id); renderCards(); });
      } else if (LOADOUT_SLOTS.indexOf(card.type) !== -1) {
        el.classList.add("clickable");
        el.addEventListener("click", function () { equipSlot(id); renderCards(); });
      }
    });
  }

  if (cardsBtn && cardsModalEl) {
    cardsBtn.addEventListener("click", function () {
      renderCards();
      cardsModalEl.classList.remove("hidden");
    });
    if (cardsCloseBtn) cardsCloseBtn.addEventListener("click", function () { cardsModalEl.classList.add("hidden"); });
    cardsModalEl.addEventListener("click", function (e) {
      if (e.target === cardsModalEl) cardsModalEl.classList.add("hidden");
    });
  }

  // ===== Civilization colour picker =====
  function buildColorControls() {
    if (!colorsListEl) return;
    colorsListEl.innerHTML = "";
    for (const c of engine.CIV_ROSTER || []) {
      const row = document.createElement("label");
      row.className = "color-row";
      const input = document.createElement("input");
      input.type = "color";
      input.value = CIV_COLORS[c.id] || c.color;
      input.addEventListener("input", function () {
        applyCivColor(c.id, input.value);
        saveCivColors();
        if (state) render();
      });
      const name = document.createElement("span");
      name.textContent = c.civ + (c.id === HUMAN_ID ? " (you)" : "");
      row.appendChild(input);
      row.appendChild(name);
      colorsListEl.appendChild(row);
    }
  }

  if (colorsBtn && colorsModalEl) {
    colorsBtn.addEventListener("click", function () {
      buildColorControls();
      colorsModalEl.classList.remove("hidden");
    });
    if (colorsCloseBtn) colorsCloseBtn.addEventListener("click", function () { colorsModalEl.classList.add("hidden"); });
    colorsModalEl.addEventListener("click", function (e) {
      if (e.target === colorsModalEl) colorsModalEl.classList.add("hidden");
    });
    if (colorsResetBtn) {
      colorsResetBtn.addEventListener("click", function () {
        for (const id of Object.keys(HISTORIC_COLORS)) applyCivColor(id, HISTORIC_COLORS[id]);
        saveCivColors();
        buildColorControls();
        if (state) render();
      });
    }
  }

  resultNewGameBtn.addEventListener("click", newGame);

  if (briefBeginBtn) {
    briefBeginBtn.addEventListener("click", function () {
      briefingModalEl.classList.add("hidden");
    });
  }
  if (briefingModalEl) {
    briefingModalEl.addEventListener("click", function (e) {
      if (e.target === briefingModalEl) briefingModalEl.classList.add("hidden");
    });
  }

  // ===== Zoom & pan (mouse wheel + touch pinch; one-finger drag pans) =====
  function setZoom(factor) {
    const prev = zoomLevel;
    zoomLevel = Math.max(0.6, Math.min(2.6, zoomLevel * factor));
    if (Math.abs(zoomLevel - prev) > 0.001 && state) render();
  }
  if (zoomInBtn) zoomInBtn.addEventListener("click", function () { setZoom(1.2); });
  if (zoomOutBtn) zoomOutBtn.addEventListener("click", function () { setZoom(1 / 1.2); });

  const boardWrap = boardEl && boardEl.parentElement;
  if (boardWrap) {
    // Remember where the player presses on the board so the in-play menu opens
    // right there. Capture phase, so it lands before the pick/select fires.
    boardWrap.addEventListener("pointerdown", function (e) {
      lastBoardPointer = { x: e.clientX, y: e.clientY };
    }, true);

    boardWrap.addEventListener(
      "wheel",
      function (e) {
        if (!state) return;
        e.preventDefault();
        setZoom(e.deltaY < 0 ? 1.1 : 1 / 1.1);
      },
      { passive: false }
    );

    let pinchDist = 0;
    let pinchZoom = 1;
    const touchDist = function (t) {
      const dx = t[0].clientX - t[1].clientX;
      const dy = t[0].clientY - t[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };
    boardWrap.addEventListener("touchstart", function (e) {
      if (e.touches.length === 2) {
        pinchDist = touchDist(e.touches);
        pinchZoom = zoomLevel;
      }
    }, { passive: true });
    boardWrap.addEventListener("touchmove", function (e) {
      if (e.touches.length === 2 && pinchDist > 0) {
        e.preventDefault();
        const target = Math.max(0.6, Math.min(2.6, pinchZoom * (touchDist(e.touches) / pinchDist)));
        if (Math.abs(target - zoomLevel) > 0.02 && state) {
          zoomLevel = target;
          render();
        }
      }
    }, { passive: false });
    boardWrap.addEventListener("touchend", function (e) {
      if (e.touches.length < 2) pinchDist = 0;
    });

    // Press-and-drag to pan the map (and, on touch, native scroll already pans).
    // A drag past a few pixels suppresses the click so it won't select a tile.
    let panning = false;
    let startX = 0;
    let startY = 0;
    let startScrollX = 0;
    let startScrollY = 0;
    boardWrap.addEventListener("mousedown", function (e) {
      if (USE_3D) return; // the 3D camera handles pan/zoom itself
      if (e.button !== 0) return;
      panning = true;
      panMoved = false;
      startX = e.clientX;
      startY = e.clientY;
      startScrollX = boardWrap.scrollLeft;
      startScrollY = boardWrap.scrollTop;
    });
    window.addEventListener("mousemove", function (e) {
      if (!panning) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!panMoved && Math.abs(dx) + Math.abs(dy) > 5) {
        panMoved = true;
        boardWrap.classList.add("grabbing");
      }
      if (panMoved) {
        boardWrap.scrollLeft = startScrollX - dx;
        boardWrap.scrollTop = startScrollY - dy;
      }
    });
    window.addEventListener("mouseup", function () {
      panning = false;
      boardWrap.classList.remove("grabbing");
    });
  }

  loadSavedColors();
  // Note: the actual first render happens via resumeOrNew() at the very end.

  // The 3D board is the default, shown frontally with a fixed (non-rotating)
  // camera. The classic flat DOM board is opt-in (URL ?board=2d or the toggle).
  (function init3D() {
    try {
      const force2d = /[?&]board=2d/.test(location.search) || window.localStorage.getItem("hegemon_board") === "2d";
      if (force2d) return;
      const canvas = document.getElementById("board3d-canvas");
      if (!canvas || !window.Board3D || !window.Board3D.createBoard) return;
      board3d = window.Board3D.createBoard(canvas);
      USE_3D = true;
      const wrap = boardEl.parentElement;
      if (wrap) wrap.classList.add("three");
      board3d.resize(); // the canvas is now visible with a real size
      board3d.onPick(function (key) {
        if (!key) return;
        const c = key.split(",");
        if (mapEditMode) { paintTile(+c[0], +c[1]); return; }
        onTileClick(+c[0], +c[1]);
      });
      board3d.onHover(handle3DHover);
    } catch (e) {
      console.warn("3D board unavailable — using the 2D board.", e);
      USE_3D = false;
      board3d = null;
    }
  })();

  // 2D / 3D board toggle (persists; reloads to swap the renderer cleanly).
  (function wireBoardToggle() {
    const btn = document.getElementById("board-toggle-btn");
    if (!btn) return;
    btn.textContent = USE_3D ? "🗺️ 2D" : "🧊 3D";
    btn.title = USE_3D ? "Switch to the classic 2D board" : "Switch to the 3D board";
    btn.addEventListener("click", function () {
      try {
        window.localStorage.setItem("hegemon_board", USE_3D ? "2d" : "3d");
      } catch (e) {}
      location.reload();
    });
  })();

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    if (board3d) board3d.resize();
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state) render();
    }, 120);
  });

  // ===== Auth UI wiring =====
  function showAuth() { if (authOverlayEl) authOverlayEl.classList.remove("hidden"); showLoginPane(); }
  function hideAuth() { if (authOverlayEl) authOverlayEl.classList.add("hidden"); }
  function showLoginPane() {
    if (authLoginPane) authLoginPane.classList.remove("hidden");
    if (authRegisterPane) authRegisterPane.classList.add("hidden");
    if (authLoginErr) authLoginErr.textContent = "";
  }
  function showRegisterPane() {
    if (authRegisterPane) authRegisterPane.classList.remove("hidden");
    if (authLoginPane) authLoginPane.classList.add("hidden");
    if (authRegErr) authRegErr.textContent = "";
  }
  function afterSignIn() {
    updateAccountLine();
    if (typeof refreshCivPicker === "function") refreshCivPicker();
    if (state) render();
  }
  if (authShowRegister) authShowRegister.addEventListener("click", showRegisterPane);
  if (authShowLogin) authShowLogin.addEventListener("click", showLoginPane);
  if (authLoginBtn) authLoginBtn.addEventListener("click", async function () {
    authLoginErr.textContent = "…";
    const res = await doLogin(authLoginUser.value, authLoginPass.value);
    if (res.ok) { authLoginPass.value = ""; hideAuth(); afterSignIn(); }
    else authLoginErr.textContent = res.error;
  });
  if (authRegisterBtn) authRegisterBtn.addEventListener("click", async function () {
    authRegErr.textContent = "…";
    const res = await doRegister(authRegName.value, authRegEmail.value, authRegPass.value);
    if (res.ok) { authRegPass.value = ""; hideAuth(); afterSignIn(); }
    else authRegErr.textContent = res.error;
  });
  if (authLoginPass) authLoginPass.addEventListener("keydown", function (e) { if (e.key === "Enter") authLoginBtn.click(); });
  if (authRegPass) authRegPass.addEventListener("keydown", function (e) { if (e.key === "Enter") authRegisterBtn.click(); });
  if (changePwBtn) changePwBtn.addEventListener("click", async function () {
    if (!currentAccount) { window.alert("Sign in first."); return; }
    const oldPw = window.prompt("Current password:"); if (oldPw == null) return;
    const newPw = window.prompt("New password (at least 6 characters):"); if (newPw == null) return;
    const res = await changePassword(oldPw, newPw);
    window.alert(res.ok ? "Password changed." : res.error);
  });
  if (logoutBtn) logoutBtn.addEventListener("click", function () {
    try { window.localStorage.removeItem(SESSION_KEY); } catch (e) {}
    currentAccount = null;
    PROFILE_KEY = "hegemon_profile";
    updateAccountLine();
    if (menuOverlayEl) menuOverlayEl.classList.add("hidden");
    showAuth();
  });

  // Seed the admin account, then gate on the saved session.
  (async function initAuth() {
    try {
      await seedAdmin();
      const sess = window.localStorage.getItem(SESSION_KEY);
      const acct = sess ? loadAccounts()[sess] : null;
      if (acct) { activateAccount(acct); hideAuth(); }
      else { showAuth(); }
    } catch (e) { console.error("Auth init failed:", e); showAuth(); }
  })();

  resumeOrNew();
})();
