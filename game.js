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
  const selectionLineEl = document.getElementById("selection-line");
  const actionLogEl = document.getElementById("action-log");
  const clearSelectionBtn = document.getElementById("clear-selection-btn");
  const turnChecklistEl = document.getElementById("turn-checklist");
  const foundCityBtn = document.getElementById("found-city-btn");
  const buildMenuEl = document.getElementById("build-menu");
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
  const codexBtn = document.getElementById("codex-btn");
  const codexModalEl = document.getElementById("codex-modal");
  const codexBodyEl = document.getElementById("codex-body");
  const codexCloseBtn = document.getElementById("codex-close-btn");
  const colorsBtn = document.getElementById("colors-btn");
  const colorsModalEl = document.getElementById("colors-modal");
  const colorsListEl = document.getElementById("colors-list");
  const colorsCloseBtn = document.getElementById("colors-close-btn");
  const colorsResetBtn = document.getElementById("colors-reset-btn");

  let state = null;
  let selectedUnitId = null;
  let selectedCityId = null;
  let actionLog = [];
  let hoveredPathKeys = new Set();
  let pendingRecenter = true;
  let combatFlashKeys = new Set();
  const defaultHintText = "Your turn — click your city (🏛️) to build, or a unit to move it. Then End Turn.";

  // Units offered in the city build menu (order = progression).
  const BUILDABLE = ["warrior", "archer", "spearman", "swordsman", "horseman", "siege", "settler"];
  const UNIT_META = {
    warrior: { name: "Warrior", role: "Basic melee infantry — cheap, no strong matchups" },
    archer: { name: "Archer", role: "Ranged (range 2): strikes with no reply at distance, but fragile in melee and easy prey for cavalry" },
    spearman: { name: "Spearman", role: "Anti-cavalry: +60% vs mounted (attack & defence). Weak to heavy infantry" },
    swordsman: { name: "Swordsman", role: "Heavy infantry: grinds spearmen and skirmishers" },
    horseman: { name: "Horseman", role: "Cavalry (3 move): runs down archers & light foot — but spears counter it" },
    siege: { name: "Siege Ballista", role: "Range 2, devastating vs cities, fragile in the open field" },
    settler: { name: "Settler", role: "Founds a new city" }
  };
  // One-line historical grounding for each unit (the educational layer).
  const UNIT_HISTORY = {
    warrior: "Levied tribal spearmen and clubmen — the citizen-militia of the earliest city-states.",
    archer: "From Cretan bowmen to the archers of Kushite Ta-Seti, missile troops screened and harassed the line.",
    spearman: "The hoplite and phalangite — locked shields and a hedge of spears that broke any cavalry charge (Chaeronea, Gaugamela).",
    swordsman: "Sword-and-shield heavy infantry — the Roman legionary with gladius and scutum, drilled and armoured.",
    horseman: "Companion and Numidian cavalry — the shock and pursuit arm that rode down fleeing skirmishers.",
    siege: "The ballista and onager — torsion artillery that hurled bolts and stones over the highest walls.",
    settler: "Colonists sent to found a new colonia or polis, carrying the sacred fire from the mother city."
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
    settler: "🛠️"
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
  const HUMAN_ID = "rome";
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
  // Display name + one-line sourced history note (the educational layer).
  const TECH_INFO = {
    "bronze-working": { name: "Bronze Working", note: "Alloying copper and tin armed the first city militias (~3000 BC). EFFECT: unlocks the Spearman — your anti-cavalry line." },
    sailing: { name: "Sailing", note: "Coast-hugging galleys opened Mediterranean trade and colonization. EFFECT: prerequisite for Open-Sea Sailing and the naval line." },
    writing: { name: "Writing", note: "Administration and law from cuneiform to the alphabet. EFFECT: +1 science per city, unlocks the Library, and opens the Economy fork (Temple vs Coinage)." },
    masonry: { name: "Masonry", note: "Dressed stone means lasting walls and monuments. EFFECT: unlocks City Walls (+20 city HP) and leads to Engineering." },
    archery: { name: "Archery", note: "Massed bowmen — the skirmish and ambush school of war. EFFECT: opens the Skirmish Doctrine fork." },
    irrigation: { name: "Irrigation", note: "Canals and basins multiplied river-valley harvests. EFFECT: strengthens the farming economy of your valleys." },
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
    "roads-logistics": { name: "Roads & Logistics", note: "The Via Appia (312 BC): legions marching 25 miles a day." },
    siegecraft: { name: "Siegecraft", note: "Ballistae and towers crack the strongest walls. EFFECT: unlocks the Siege Ballista — devastating against cities." },
    medicine: { name: "Medicine", note: "Army physicians and hygiene keep veterans in the field." },
    "law-administration": { name: "Law & Administration", note: "Codified law binds a sprawling empire together." },
    "currency-reform": { name: "Currency Reform", note: "Standardized coinage steadies trade across provinces." },
    cartography: { name: "Cartography", note: "Sea charts and itineraries extend reach and vision." },
    assimilation: { name: "Assimilation", note: "FORK: extend citizenship — captured cities become your own." },
    "tribute-empire": { name: "Tribute Empire", note: "FORK: satrapies pay heavy tribute but stay restless." }
  };

  function canResearchSafe(player, techId) {
    try {
      return engine.canResearch(player, techId);
    } catch {
      return false;
    }
  }

  const BUILDING_GLYPH = { granary: "🌾", workshop: "⚒️", market: "🪙", library: "📚", walls: "🧱" };

  function itemCost(id) {
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

  function renderBuildQueue(selectedCity) {
    if (!buildQueueEl) return;
    buildQueueEl.innerHTML = "";
    if (!selectedCity) {
      buildQueueEl.innerHTML = '<div class="bm-empty">Select a city to manage its queue.</div>';
      return;
    }
    const q = selectedCity.queue || [];
    if (!q.length) {
      buildQueueEl.innerHTML = '<div class="bm-empty">Nothing queued — recruit a unit or start a building above.</div>';
      return;
    }
    const banked = Math.floor(selectedCity.production || 0);
    q.forEach(function (id, i) {
      const cost = itemCost(id);
      const row = document.createElement("div");
      row.className = "queue-item" + (i === 0 ? " active" : "");
      const progress = i === 0 ? Math.min(banked, cost) + "/" + cost + " ⚒️" : cost + " ⚒️";
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
    for (const id of Object.keys(buildings)) {
      const b = buildings[id];
      const has = built.has(id);
      const isQueued = queued.has(id);
      const reqTech = b.requiresTech;
      const hasTech = !reqTech || player.techs.includes(reqTech);
      const techName = reqTech ? (TECH_INFO[reqTech] && TECH_INFO[reqTech].name) || reqTech : "";
      const btn = document.createElement("button");
      btn.className = "build-item" + (has ? " done" : hasTech ? "" : " locked");
      btn.disabled = has || isQueued || !(isTurn && hasTech);
      btn.title = b.note;
      const status = has ? "✓ built" : isQueued ? "in queue" : !hasTech ? "🔒 " + techName : b.cost + " ⚒️";
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

    for (const type of BUILDABLE) {
      const def = engine.UNITS[type];
      if (!def) continue;
      const meta = UNIT_META[type] || { name: type, role: "" };
      const cost = costs[type];
      const reqTech = def.requiresTech;
      const hasTech = !reqTech || player.techs.includes(reqTech);
      const techName = reqTech ? (TECH_INFO[reqTech] && TECH_INFO[reqTech].name) || reqTech : "";

      const btn = document.createElement("button");
      btn.className = "build-item" + (hasTech ? "" : " locked");
      btn.disabled = !(isTurn && !!selectedCity && hasTech);
      btn.title =
        meta.role + (reqTech ? " — needs " + techName : "") +
        (UNIT_HISTORY[type] ? "\n\n" + UNIT_HISTORY[type] : "");

      const status = !hasTech ? "🔒 " + techName : typeof cost === "number" ? cost + " ⚒️" : "";
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
    const size = Math.floor(avail / (extentW * SQRT3));
    // Keep hexes comfortably clickable; big maps scroll (view auto-centres on start).
    return Math.max(20, Math.min(34, size));
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

    const humanWon = victory.winnerId === HUMAN_ID;
    const winner = state.playersById[victory.winnerId];
    const winnerName = winner ? winner.civ || winner.id : victory.winnerId;
    resultTitleEl.textContent = humanWon ? "Victory" : "Defeat";
    resultBodyEl.textContent = humanWon
      ? "Rome controls every capital. The republic has prevailed."
      : `${winnerName} controls every capital. ${victory.reason || "Try another campaign."}`;
    resultModalEl.classList.remove("hidden");
  }

  function eventEffectsSummary(fx) {
    const sign = (n) => (n > 0 ? "+" + n : String(n));
    const parts = [];
    if (fx.gold) parts.push(sign(fx.gold) + " 🪙");
    if (fx.production) parts.push(sign(fx.production) + " ⚒️");
    if (fx.science) parts.push(sign(fx.science) + " 🔬");
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
    return {
      visible: new Set(visibility.visibleTiles),
      discovered: new Set(visibility.discoveredTiles)
    };
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
      attackable: new Set()
    };

    if (!selectedUnitId) return hints;
    const unit = state.map.units[selectedUnitId];
    if (!unit) return hints;

    const unitDef = engine.UNITS[unit.type];
    if (!unitDef) return hints;

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

        const occupiedByEnemyUnit = getUnitsAt(q, r).some((u) => u.ownerId !== unit.ownerId);
        const occupiedByFriendlyUnit = getUnitsAt(q, r).some((u) => u.ownerId === unit.ownerId);
        if (totalCost <= unit.movementRemaining && !occupiedByEnemyUnit && !occupiedByFriendlyUnit) {
          hints.reachable.add(key);
        }
      }

      const dist = engine.distance(unit.position, destination);
      if (dist <= unitDef.range) {
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
    hoveredPathKeys = new Set();
  }

  function createCityId() {
    return `rome_city_${state.turn}_${Date.now().toString().slice(-4)}`;
  }

  function createUnitId(unitType) {
    return `rome_${unitType}_${state.turn}_${Date.now().toString().slice(-4)}`;
  }

  function snapshotRomeState() {
    const rome = state.playersById.rome;
    return {
      food: rome.food,
      production: rome.production,
      gold: rome.gold,
      cities: rome.cityIds.length,
      units: rome.unitIds.length
    };
  }

  function formatSignedDelta(value) {
    if (value > 0) return `+${value}`;
    return String(value);
  }

  function apply(action) {
    try {
      const beforeSummary = action.type === "END_TURN" && action.playerId === "rome" ? snapshotRomeState() : null;
      // City-panel actions keep the city selected so you can queue several in a row.
      const keepSelection =
        action.type === "BUILD_UNIT" ||
        action.type === "BUILD_BUILDING" ||
        action.type === "UNQUEUE_PRODUCTION" ||
        action.type === "RESEARCH_TECH" ||
        action.type === "RESOLVE_EVENT";
      state = engine.applyAction(state, action);
      if (!keepSelection) clearSelection();
      else if (selectedCityId && !state.map.cities[selectedCityId]) clearSelection();
      logAction(`Turn ${state.turn}: ${action.playerId} -> ${action.type}`);
      render();
      runAiUntilHuman();

      if (beforeSummary) {
        const afterSummary = snapshotRomeState();
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
      const ownUnit = clickedUnits.find((u) => u.ownerId === HUMAN_ID);
      if (ownUnit) {
        selectedUnitId = ownUnit.id;
        selectedCityId = null;
        render();
        return;
      }

      if (clickedCity && clickedCity.ownerId === HUMAN_ID) {
        selectedCityId = clickedCity.id;
        selectedUnitId = null;
        render();
      }
      return;
    }

    const selected = state.map.units[selectedUnitId];
    if (!selected) {
      clearSelection();
      render();
      return;
    }

    // Clicking the selected unit itself deselects it.
    if (selected.position.q === q && selected.position.r === r) {
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
        logAction(
          "⚔️ " + selected.type + " strikes " + enemyUnit.type + ": deals " + prev.damageToDefender +
          (prev.defenderRemainingHp <= 0 ? " — destroyed!" : ", takes " + prev.damageToAttacker) +
          (tactic ? " [" + tactic + "]" : "")
        );
      } catch (e) {}
      flashCombat([key, attackerKey]);
      apply({ type: "ATTACK", playerId: HUMAN_ID, attackerId: selected.id, defenderId: enemyUnit.id });
      return;
    }

    if (clickedCity && clickedCity.ownerId !== HUMAN_ID) {
      if (engine.distance(selected.position, { q, r }) > selectedDef.range) {
        hintLineEl.textContent = "That city is out of range.";
        return;
      }
      logAction("🏛️ " + selected.type + " assaults " + clickedCity.id + " (HP " + clickedCity.hp + ")");
      flashCombat([key, attackerKey]);
      apply({ type: "ATTACK_CITY", playerId: HUMAN_ID, attackerId: selected.id, cityId: clickedCity.id });
      return;
    }

    // Can the selected unit reach this tile this turn?
    const path = engine.findPath(state, moveCtx, selected.position, { q, r });
    let cost = Infinity;
    if (path && path.length >= 2) {
      cost = 0;
      for (let i = 0; i < path.length - 1; i += 1) cost += engine.movementCost(state, moveCtx, path[i], path[i + 1]);
    }
    const reachable = Boolean(path) && path.length >= 2 && Number.isFinite(cost) && cost <= selected.movementRemaining;
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

    // Another of your own units in the field: re-select it (no accidental stacking).
    if (ownUnitHere) {
      selectedUnitId = ownUnitHere.id;
      selectedCityId = null;
      render();
      return;
    }

    // Otherwise move to the (empty) tile if reachable.
    if (!reachable) {
      hintLineEl.textContent = !path || path.length < 2 ? "Can't move there." : "Not enough movement to reach there.";
      return;
    }
    apply({ type: "MOVE_UNIT", playerId: HUMAN_ID, unitId: selected.id, destination: { q, r }, path: path });
  }

  function renderTile(q, r, visibility, hints, geom, pos, territory) {
    const key = q + "," + r;
    const tile = state.map.tiles[key];
    const isVisible = visibility.visible.has(key);
    const isDiscovered = visibility.discovered.has(key);

    const units = isVisible ? getUnitsAt(q, r) : [];
    const city = isVisible ? getCityAt(q, r) : null;

    const btn = document.createElement("button");
    btn.className = "tile terrain-" + tile.terrain;
    btn.dataset.key = key;

    // Offset (odd-r) pixel position: rectangular board, engine adjacency preserved.
    btn.style.width = geom.hexW + "px";
    btn.style.height = geom.hexH + "px";
    btn.style.left = pos.x + "px";
    btn.style.top = pos.y + "px";

    if (!isVisible) {
      btn.classList.add("fog");
      if (isDiscovered) btn.classList.add("discovered");
    }
    if (hints.reachable.has(key)) btn.classList.add("reachable");
    if (hints.attackable.has(key)) btn.classList.add("attackable");
    if (hoveredPathKeys.has(key)) btn.classList.add("path-preview");
    if (combatFlashKeys.has(key)) btn.classList.add("combat-flash");

    // Weather overlay (the game's only luck) on tiles you can currently see.
    if (isVisible && state.weather && state.weather.current) {
      const wx = state.weather.current[tile.region];
      if (wx && wx !== "clear") btn.classList.add("wx-" + wx);
    }

    const selectedUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    if (selectedUnit && selectedUnit.position.q === q && selectedUnit.position.r === r) {
      btn.classList.add("selected");
    }
    const citySelected = selectedCityId ? state.map.cities[selectedCityId] : null;
    if (citySelected && citySelected.position.q === q && citySelected.position.r === r) {
      btn.classList.add("selected");
    }

    // Build compact visual content + a rich tooltip.
    const tip = ["(" + q + "," + r + ") " + (TERRAIN_LABELS[tile.terrain] || tile.terrain)];
    let inner = '<span class="coord">' + q + "," + r + "</span>";

    // Territory tint (civ-coloured zone of control), on tiles you've seen.
    const terrOwner = territory && territory[key];
    if (terrOwner && isDiscovered) {
      inner = '<span class="terr" style="background:' + hexToRgba(CIV_COLORS[terrOwner] || "#888", 0.24) + '"></span>' + inner;
      btn.classList.add("claimed");
      tip.push("Territory of " + civName(terrOwner));
    }

    if (!isVisible) {
      inner += '<span class="glyph">' + (isDiscovered ? "🌥️" : "☁️") + "</span>";
      tip.push(isDiscovered ? "Shrouded (last seen)" : "Unexplored");
    } else if (city) {
      btn.classList.add("owner-" + city.ownerId);
      inner += '<span class="glyph">' + (city.isCapital ? "🏛️" : "🏘️") + "</span>";
      inner += hpBar(city.hp, city.maxHp);
      tip.push((city.isCapital ? "Capital " : "City ") + city.id + " — " + city.ownerId);
      tip.push("Pop " + city.population + " · HP " + city.hp + "/" + city.maxHp);
      if (units.length > 0) tip.push("Garrison: " + units.map((u) => u.type).join(", "));
    } else if (units.length > 0) {
      const top = units[0];
      btn.classList.add("owner-" + top.ownerId);
      inner += unitCluster(top);
      inner += '<span class="utype">' + (UNIT_GLYPHS[top.type] || "•") + "</span>";
      inner += hpBar(top.hp, top.maxHp);
      if (units.length > 1) inner += '<span class="stack">+' + (units.length - 1) + "</span>";
      for (const u of units) {
        tip.push(
          u.ownerId + " " + u.type + " — HP " + u.hp + "/" + u.maxHp +
          " · move " + u.movementRemaining +
          (u.veterancy && u.veterancy !== "recruit" ? " · " + u.veterancy : "")
        );
      }
    } else if (TERRAIN_GLYPHS[tile.terrain]) {
      inner += '<span class="glyph tglyph">' + TERRAIN_GLYPHS[tile.terrain] + "</span>";
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
          if (preview.modifiers && preview.modifiers.length) {
            hoverHint += "  ·  " + preview.modifiers.join(" · ");
          }
        } catch {
          hoverHint = "Target out of range.";
        }
      } else if (city && city.ownerId !== selectedUnit.ownerId) {
        hoverHint = "🏛️ Siege " + city.id + " (HP " + city.hp + "/" + city.maxHp + ")";
      } else if (hints.reachable.has(key)) {
        hoverHint = "Move here";
      }
    }

    btn.innerHTML = inner;
    btn.title = tip.join("\n");
    btn.addEventListener("click", function () {
      onTileClick(q, r);
    });
    btn.addEventListener("mouseenter", function () {
      hoveredPathKeys = computePathPreviewKeys(q, r, visibility);
      updateHoverHighlight();
      hintLineEl.textContent = hoverHint || defaultHintText;
    });
    btn.addEventListener("mouseleave", function () {
      hoveredPathKeys = new Set();
      updateHoverHighlight();
      hintLineEl.textContent = defaultHintText;
    });

    return btn;
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
      boardEl.appendChild(line);
    }
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
      selectionLineEl.innerHTML =
        (UNIT_GLYPHS[selectedUnit.type] || "•") + " " + unitDisplayName(selectedUnit) +
        '<span class="sel-sub"> HP ' + selectedUnit.hp + "/" + selectedUnit.maxHp +
        " · Move " + selectedUnit.movementRemaining + vet + "</span>";
    } else if (selectedCity) {
      const need = 8 + selectedCity.population * 6;
      const q = selectedCity.queue || [];
      const banked = Math.floor(selectedCity.production || 0);
      const building = q.length ? " · Building " + itemName(q[0]) + " " + Math.min(banked, itemCost(q[0])) + "/" + itemCost(q[0]) : "";
      selectionLineEl.innerHTML =
        (selectedCity.isCapital ? "🏛️ " : "🏘️ ") + cityDisplayName(selectedCity) +
        '<span class="sel-sub"> Pop ' + selectedCity.population + " · HP " + selectedCity.hp + "/" + selectedCity.maxHp +
        " · Growth " + Math.floor(selectedCity.food || 0) + "/" + need +
        " · ⚒️ " + banked + building + "</span>";
    } else {
      selectionLineEl.textContent = "Nothing selected";
    }

    foundCityBtn.disabled = !(isTurn && selectedUnit && selectedUnit.type === "settler");
    if (clearSelectionBtn) clearSelectionBtn.disabled = !(selectedUnit || selectedCity);
    renderBuildMenu(isTurn, selectedCity);
    renderBuildingMenu(isTurn, selectedCity);
    renderBuildQueue(selectedCity);
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
      statusEl.innerHTML =
        "Turn " + state.turn + " — " +
        '<span style="color:' + activeColor + ';font-weight:700">' + (current.civ || current.id) + "</span>" +
        (current.id === HUMAN_ID ? " (your move)" : " is moving…");

      const visibility = getHumanVisibility();
      const hints = getTileHintsForSelectedUnit(visibility);
      const territory = engine.computeTerritory ? engine.computeTerritory(state) : {};

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

      boardEl.innerHTML = "";
      for (const key of keys) {
        const c = key.split(",");
        boardEl.appendChild(renderTile(+c[0], +c[1], visibility, hints, geom, pos[key], territory));
      }
      renderRivers(geom, visibility, pos);

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

      renderHud();
      renderLegend();
      renderRanking();
      renderTechTree(victory);
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

  function renderTechTree(victory) {
    if (!techTreeEl) return;
    const techs = engine.TECHS || {};
    const player = human();
    const canAct = isHumanTurn() && !victory.winnerId;
    techTreeEl.innerHTML = "";

    for (const age of [1, 2, 3]) {
      const ids = Object.keys(techs).filter((id) => techs[id].age === age);
      if (!ids.length) continue;

      const title = document.createElement("div");
      title.className = "tech-age-title";
      title.textContent = AGE_LABELS[age] || "Age " + age;
      techTreeEl.appendChild(title);

      for (const id of ids) {
        const rule = techs[id];
        const info = TECH_INFO[id] || { name: id, note: "" };
        const researched = player.techs.includes(id);
        const available = !researched && canResearchSafe(player, id);
        const forkClosed =
          !researched &&
          !available &&
          rule.forkGroup &&
          player.forkChoices[rule.forkGroup] &&
          player.forkChoices[rule.forkGroup] !== rule.forkBranch;

        const cost = engine.researchCost ? engine.researchCost(id) : 0;
        const affordable = player.science >= cost;

        const item = document.createElement("button");
        item.className =
          "tech-item " +
          (researched ? "done" : available ? "avail" : forkClosed ? "closed" : "locked") +
          (rule.forkGroup ? " is-fork" : "");
        item.disabled = !(available && affordable && canAct);
        item.title = info.note + (available ? "\nCost: " + cost + " science" : "");

        const stateLabel = researched
          ? "✓ known"
          : available
            ? cost + " 🔬" + (affordable ? (rule.forkGroup ? " ⑂" : "") : " ⏳")
            : forkClosed
              ? "path closed"
              : "locked";
        item.innerHTML =
          '<span class="tech-name">' + info.name + "</span>" +
          '<span class="tech-state">' + stateLabel + "</span>";

        item.addEventListener("click", function () {
          if (item.disabled) return;
          apply({ type: "RESEARCH_TECH", playerId: HUMAN_ID, techId: id });
        });
        techTreeEl.appendChild(item);
      }
    }
  }

  const RES_TITLES = {
    Populus: "Populus — your people. Cities grow as they bank food.",
    Labor: "Labor — production. Builds units and city works.",
    Denarii: "Denarii — coin from markets and trade; pays upkeep.",
    Scientia: "Scientia — learning. Accrues each turn and buys techs.",
    Doctrinae: "Doctrinae — technologies you have mastered."
  };

  function renderHud() {
    const rome = human();
    const humanCities = Object.values(state.map.cities).filter((c) => c.ownerId === HUMAN_ID);
    const pop = humanCities.reduce((sum, c) => sum + c.population, 0);
    const stockpile = humanCities.reduce((sum, c) => sum + Math.floor(c.production || 0), 0);
    const inc = engine.computePlayerIncome ? engine.computePlayerIncome(state, HUMAN_ID) : {};
    const resources = [
      { ico: "👥", val: pop, lbl: "Populus", delta: null },
      { ico: "⚒️", val: stockpile, lbl: "Labor", delta: inc.production },
      { ico: "🪙", val: rome.gold, lbl: "Denarii", delta: inc.gold },
      { ico: "🔬", val: rome.science, lbl: "Scientia", delta: inc.science },
      { ico: "📜", val: rome.techs.length, lbl: "Doctrinae", delta: null }
    ];
    resourceBarEl.innerHTML = resources
      .map(function (r) {
        const delta =
          r.delta != null && r.delta !== 0
            ? '<span class="res-delta">(' + (r.delta > 0 ? "+" : "") + r.delta + ")</span>"
            : "";
        return (
          '<span class="res" title="' + (RES_TITLES[r.lbl] || "") + '"><span class="res-ico">' + r.ico +
          '</span><span class="res-val">' + r.val + "</span>" + delta +
          '<span class="res-lbl">' + r.lbl + "</span></span>"
        );
      })
      .join("");

    // Weather is the game's only luck — surface current + forecast per region.
    const regions = state.map.regions || [];
    weatherBarEl.innerHTML = regions
      .map((region) => {
        const now = WEATHER_INFO[state.weather.current[region]] || WEATHER_INFO.clear;
        const next = WEATHER_INFO[state.weather.forecast[region]] || WEATHER_INFO.clear;
        return (
          '<span class="weather-chip"><span class="wx-region">' + region +
          "</span> " + now.icon + " " + now.label +
          ' <span class="wx-next">→ ' + next.icon + "</span></span>"
        );
      })
      .join("");
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

  function newGame() {
    // Clear any leftover result modal first, so a new game can never inherit a
    // stale "Victory/Defeat" overlay even if something below misbehaves.
    resultModalEl.classList.add("hidden");

    const choice = (mapSizeSelectEl && mapSizeSelectEl.value) || "medium";
    let config;
    let label;
    try {
      if (choice === "italia") {
        config = engine.loadScenario("italia").config;
        label = "Italia scenario";
      } else {
        const seed = "map-" + choice + "-" + Date.now();
        const playerCount = playerCountSelectEl ? parseInt(playerCountSelectEl.value, 10) || 2 : 2;
        config = engine.generateMap({ size: choice, seed: seed, playerCount: playerCount });
        const sizeLabel = (engine.MAP_SIZES && engine.MAP_SIZES[choice] && engine.MAP_SIZES[choice].label) || choice;
        label = sizeLabel + " random map (" + config.map.width + "×" + config.map.height + "), " +
          config.players.length + " civs";
      }
    } catch (err) {
      console.error("New game generation failed, falling back:", err);
      config = engine.loadScenario("italia").config;
      label = "Italia scenario (fallback)";
    }

    state = engine.createInitialGameState(config);
    clearSelection();
    // Pre-select the capital so the command panel is immediately actionable
    // (build menu live, city highlighted) — makes it obvious you can play.
    const capital =
      Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID && c.isCapital) ||
      Object.values(state.map.cities).find((c) => c.ownerId === HUMAN_ID);
    if (capital) selectedCityId = capital.id;
    actionLog = ["New game started: " + label];
    hintLineEl.textContent = defaultHintText;
    pendingRecenter = true;
    render();
  }

  newGameBtn.addEventListener("click", newGame);

  if (mapSizeSelectEl && playerCountSelectEl) {
    mapSizeSelectEl.addEventListener("change", function () {
      const size = mapSizeSelectEl.value;
      if (size === "italia") {
        playerCountSelectEl.value = "2";
        playerCountSelectEl.disabled = true;
      } else {
        playerCountSelectEl.disabled = false;
        const def = (engine.DEFAULT_PLAYERS && engine.DEFAULT_PLAYERS[size]) || 3;
        playerCountSelectEl.value = String(def);
      }
    });
  }

  endTurnBtn.addEventListener("click", function () {
    if (!isHumanTurn()) return;
    apply({ type: "END_TURN", playerId: "rome" });
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
      playerId: "rome",
      settlerId: unit.id,
      cityId: createCityId()
    });
  });

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
        const info = TECH_INFO[id] || { name: id, note: "" };
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

  loadSavedColors();

  let resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state) render();
    }, 120);
  });

  newGame();
})();
