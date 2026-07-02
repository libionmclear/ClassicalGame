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
  const selectionLineEl = document.getElementById("selection-line");
  const actionLogEl = document.getElementById("action-log");
  const clearSelectionBtn = document.getElementById("clear-selection-btn");
  const turnChecklistEl = document.getElementById("turn-checklist");
  const foundCityBtn = document.getElementById("found-city-btn");
  const buildWarriorBtn = document.getElementById("build-warrior-btn");
  const buildArcherBtn = document.getElementById("build-archer-btn");
  const buildSettlerBtn = document.getElementById("build-settler-btn");
  const researchBronzeBtn = document.getElementById("research-bronze-btn");
  const researchArcheryBtn = document.getElementById("research-archery-btn");
  const hintLineEl = document.getElementById("hint-line");
  const resultModalEl = document.getElementById("result-modal");
  const resultTitleEl = document.getElementById("result-title");
  const resultBodyEl = document.getElementById("result-body");
  const resultNewGameBtn = document.getElementById("result-new-game-btn");

  let state = null;
  let selectedUnitId = null;
  let selectedCityId = null;
  let actionLog = [];
  let hoveredPathKeys = new Set();
  const defaultHintText = "Hint: Select your unit, then click a tile to move or attack.";
  const unitCosts = { warrior: 12, archer: 14, settler: 18 };

  function logAction(message) {
    actionLog.unshift(message);
    if (actionLog.length > 24) {
      actionLog = actionLog.slice(0, 24);
    }
  }

  function renderLog() {
    actionLogEl.innerHTML = "";
    for (const line of actionLog) {
      const item = document.createElement("div");
      item.className = "log-entry";
      item.textContent = line;
      actionLogEl.appendChild(item);
    }
  }

  function renderChecklist(items) {
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

    const humanWon = victory.winnerId === "rome";
    resultTitleEl.textContent = humanWon ? "Victory" : "Defeat";
    resultBodyEl.textContent = humanWon
      ? "Rome controls all capitals. The republic has prevailed."
      : `Carthage has taken the upper hand. ${victory.reason || "Try another campaign."}`;
    resultModalEl.classList.remove("hidden");
  }

  function getHumanVisibility() {
    if (!state) {
      return { visible: new Set(), discovered: new Set() };
    }
    const visibility = engine.computeVisibility(state, "rome");
    return {
      visible: new Set(visibility.visibleTiles),
      discovered: new Set(visibility.discoveredTiles)
    };
  }

  function isHumanTurn() {
    return state.players[state.currentPlayerIndex].id === "rome";
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
      state = engine.applyAction(state, action);
      clearSelection();
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
    while (state.players[state.currentPlayerIndex].id !== "rome") {
      const active = state.players[state.currentPlayerIndex].id;
      const result = engine.runAiTurn(state, active, 8);
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
      const ownUnit = clickedUnits.find((u) => u.ownerId === "rome");
      if (ownUnit) {
        selectedUnitId = ownUnit.id;
        selectedCityId = null;
        render();
        return;
      }

      if (clickedCity && clickedCity.ownerId === "rome") {
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

    const enemyUnit = clickedUnits.find((u) => u.ownerId !== "rome");
    if (enemyUnit) {
      apply({ type: "ATTACK", playerId: "rome", attackerId: selected.id, defenderId: enemyUnit.id });
      return;
    }

    if (clickedCity && clickedCity.ownerId !== "rome") {
      apply({ type: "ATTACK_CITY", playerId: "rome", attackerId: selected.id, cityId: clickedCity.id });
      return;
    }

    apply({
      type: "MOVE_UNIT",
      playerId: "rome",
      unitId: selected.id,
      destination: { q, r }
    });
  }

  function renderTile(q, r, visibility, hints) {
    const key = q + "," + r;
    const tile = state.map.tiles[key];
    const isVisible = visibility.visible.has(key);
    const isDiscovered = visibility.discovered.has(key);

    const units = isVisible ? getUnitsAt(q, r) : [];
    const city = isVisible ? getCityAt(q, r) : null;

    const btn = document.createElement("button");
    btn.className = "tile terrain-" + tile.terrain;
    btn.dataset.key = key;

    if (!isVisible) {
      btn.classList.add("fog");
      if (isDiscovered) {
        btn.classList.add("discovered");
      }
    }

    if (hints.reachable.has(key)) {
      btn.classList.add("reachable");
    }
    if (hints.attackable.has(key)) {
      btn.classList.add("attackable");
    }
    if (hoveredPathKeys.has(key)) {
      btn.classList.add("path-preview");
    }

    if (selectedUnitId) {
      const selected = state.map.units[selectedUnitId];
      if (selected && selected.position.q === q && selected.position.r === r) {
        btn.classList.add("selected");
      }
    }

    if (selectedCityId) {
      const citySelected = state.map.cities[selectedCityId];
      if (citySelected && citySelected.position.q === q && citySelected.position.r === r) {
        btn.classList.add("selected");
      }
    }

    const lines = [];
    lines.push("(" + q + "," + r + ")");
    if (!isVisible) {
      lines.push(isDiscovered ? "Shrouded" : "Unknown");
    }
    if (city) {
      lines.push("City: " + city.id + " HP " + city.hp);
      btn.classList.add("owner-" + city.ownerId);
    }
    if (units.length > 0) {
      for (const u of units) {
        lines.push(u.ownerId + " " + u.type + " HP " + u.hp);
      }
      btn.classList.add("owner-" + units[0].ownerId);
    }

    let hoverHint = "";
    if (isVisible && selectedUnitId) {
      const selected = state.map.units[selectedUnitId];
      if (selected) {
        const enemyUnit = units.find((u) => u.ownerId !== selected.ownerId);
        if (enemyUnit) {
          try {
            const preview = engine.computeCombatPreview(state, selected.id, enemyUnit.id);
            hoverHint =
              "Preview: enemy -" +
              preview.damageToDefender +
              " HP, your unit -" +
              preview.damageToAttacker +
              " HP";
          } catch {
            hoverHint = "Target currently out of range.";
          }
        } else if (city && city.ownerId !== selected.ownerId) {
          hoverHint = "Siege target: " + city.id + " HP " + city.hp;
        }
      }
    }

    btn.textContent = lines.join(" | ");
    btn.addEventListener("click", function () {
      onTileClick(q, r);
    });
    btn.addEventListener("mouseenter", function () {
      hoveredPathKeys = computePathPreviewKeys(q, r, visibility);
      render();
      hintLineEl.textContent = hoverHint || defaultHintText;
    });
    btn.addEventListener("mouseleave", function () {
      hoveredPathKeys = new Set();
      render();
      hintLineEl.textContent = defaultHintText;
    });

    return btn;
  }

  function updatePanelState(victory) {
    const isTurn = isHumanTurn() && !victory.winnerId;
    const selectedUnit = selectedUnitId ? state.map.units[selectedUnitId] : null;
    const selectedCity = selectedCityId ? state.map.cities[selectedCityId] : null;
    const rome = state.playersById.rome;

    if (selectedUnit) {
      selectionLineEl.textContent =
        `Unit selected: ${selectedUnit.type} (${selectedUnit.id}) HP ${selectedUnit.hp}, Move ${selectedUnit.movementRemaining}`;
    } else if (selectedCity) {
      selectionLineEl.textContent =
        `City selected: ${selectedCity.id}, Pop ${selectedCity.population}, HP ${selectedCity.hp}`;
    } else {
      selectionLineEl.textContent = "Nothing selected.";
    }

    foundCityBtn.disabled = !(isTurn && selectedUnit && selectedUnit.type === "settler");
    buildWarriorBtn.disabled = !(isTurn && selectedCity) || rome.production < unitCosts.warrior;
    buildArcherBtn.disabled = !(isTurn && selectedCity) || rome.production < unitCosts.archer;
    buildSettlerBtn.disabled = !(isTurn && selectedCity) || rome.production < unitCosts.settler;
    researchBronzeBtn.disabled = !isTurn;
    researchArcheryBtn.disabled = !isTurn;
    clearSelectionBtn.disabled = !(selectedUnit || selectedCity);

    buildWarriorBtn.textContent = `Build Warrior (${unitCosts.warrior})`;
    buildArcherBtn.textContent = `Build Archer (${unitCosts.archer})`;
    buildSettlerBtn.textContent = `Build Settler (${unitCosts.settler})`;
    researchBronzeBtn.textContent = `Research Bronze Working${rome.techs.includes("bronze-working") ? " (Done)" : ""}`;
    researchArcheryBtn.textContent = `Research Archery${rome.techs.includes("archery") ? " (Done)" : ""}`;

    const checklist = [];
    checklist.push(selectedUnit || selectedCity ? "Selection: ready" : "Selection: choose a unit or city");
    checklist.push(isTurn ? "Turn: issue commands or end turn" : "Turn: waiting for AI" );
    checklist.push(state.playersById.rome.unitIds.length < 4 ? "Army: consider building more units" : "Army: field force established");
    checklist.push(state.playersById.rome.cityIds.length < 2 ? "Expansion: found a second city" : "Expansion: multiple cities online");
    renderChecklist(checklist);
  }

  function render() {
    const current = state.players[state.currentPlayerIndex];
    const victory = engine.getVictoryStatus(state);

    statusEl.textContent =
      "Turn " +
      state.turn +
      " | Active: " +
      current.id +
      " | Rome cities " +
      state.playersById.rome.cityIds.length +
      " | Carthage cities " +
      state.playersById.carthage.cityIds.length;

    victoryEl.textContent = victory.winnerId
      ? "Victory: " + victory.type + " by " + victory.winnerId
      : "No winner yet.";

    const visibility = getHumanVisibility();
    const hints = getTileHintsForSelectedUnit(visibility);

    boardEl.innerHTML = "";
    for (let r = 0; r < state.map.height; r += 1) {
      for (let q = 0; q < state.map.width; q += 1) {
        boardEl.appendChild(renderTile(q, r, visibility, hints));
      }
    }

    endTurnBtn.disabled = !isHumanTurn() || Boolean(victory.winnerId);
    updatePanelState(victory);
    renderLog();
    showResultModal(victory);
  }

  function newGame() {
    const scenario = engine.loadScenario("italia");
    state = engine.createInitialGameState(scenario.config);
    clearSelection();
    actionLog = ["New game started: Italia scenario"];
    hintLineEl.textContent = defaultHintText;
    resultModalEl.classList.add("hidden");
    render();
  }

  newGameBtn.addEventListener("click", newGame);
  endTurnBtn.addEventListener("click", function () {
    if (!isHumanTurn()) return;
    apply({ type: "END_TURN", playerId: "rome" });
  });

  clearSelectionBtn.addEventListener("click", function () {
    clearSelection();
    render();
  });

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

  buildWarriorBtn.addEventListener("click", function () {
    if (!selectedCityId) return;
    apply({
      type: "BUILD_UNIT",
      playerId: "rome",
      cityId: selectedCityId,
      unitType: "warrior",
      unitId: createUnitId("warrior")
    });
  });

  buildArcherBtn.addEventListener("click", function () {
    if (!selectedCityId) return;
    apply({
      type: "BUILD_UNIT",
      playerId: "rome",
      cityId: selectedCityId,
      unitType: "archer",
      unitId: createUnitId("archer")
    });
  });

  buildSettlerBtn.addEventListener("click", function () {
    if (!selectedCityId) return;
    apply({
      type: "BUILD_UNIT",
      playerId: "rome",
      cityId: selectedCityId,
      unitType: "settler",
      unitId: createUnitId("settler")
    });
  });

  researchBronzeBtn.addEventListener("click", function () {
    apply({ type: "RESEARCH_TECH", playerId: "rome", techId: "bronze-working" });
  });

  researchArcheryBtn.addEventListener("click", function () {
    apply({ type: "RESEARCH_TECH", playerId: "rome", techId: "archery" });
  });

  resultNewGameBtn.addEventListener("click", newGame);

  newGame();
})();
