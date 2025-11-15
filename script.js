const GROUPS = [
    { name: 'Grupo A', slots: [null, null, null] },
    { name: 'Grupo B', slots: [null, null, null] },
    { name: 'Grupo C', slots: [null, null, null] },
    { name: 'Grupo D', slots: [null, null, null] }
];

const PERFORMANCE_BONUS_CONFIG = Object.freeze({
    minimumQualificationBonus: 3,
    quarterWin: 1,
    semifinalWin: 2,
    finalWin: 3,
    thirdPlaceWin: 1,
});

const nameInput = document.getElementById('participant-name');
const addButton = document.getElementById('add-participant');
const helperText = document.getElementById('helper-text');
const slotsRemaining = document.getElementById('slots-remaining');
const groupsContainer = document.getElementById('groups-container');
const template = document.getElementById('group-template');
const resetButton = document.getElementById('reset-draw');
const editButton = document.getElementById('edit-groups');
const editPanel = document.getElementById('edit-panel');
const closeEditPanel = document.getElementById('close-edit-panel');
const groupSelect = document.getElementById('group-select');
const addSlotButton = document.getElementById('add-slot');
const removeSlotButton = document.getElementById('remove-slot');
const editFeedback = document.getElementById('edit-feedback');
const currentMatchLabel = document.getElementById('current-match-label');
const matchPlayerAButton = document.getElementById('match-player-a');
const matchPlayerBButton = document.getElementById('match-player-b');
const diffInput = document.getElementById('diff-input');
const diffValue = document.getElementById('diff-value');
const matchesRemainingLabel = document.getElementById('matches-remaining');
const standingsContainer = document.getElementById('standings-container');
const undoButton = document.getElementById('undo-match');
const undoArrowButton = document.getElementById('undo-arrow');
const manualToggleButton = document.getElementById('toggle-manual-entry');
const manualFields = document.getElementById('manual-fields');
const manualGroupSelect = document.getElementById('manual-group-select');
const manualPositionSelect = document.getElementById('manual-position-select');
const manualHelperText = document.getElementById('manual-helper-text');
const playFinalsButton = document.getElementById('play-finals');
const finalStageHelper = document.getElementById('final-stage-helper');
const knockoutStage = document.getElementById('knockout-stage');
const quarterMatchesContainer = document.getElementById('quarter-matches');
const semiMatchesContainer = document.getElementById('semi-matches');
const thirdPlaceContainer = document.getElementById('third-place-match');
const finalMatchContainer = document.getElementById('final-match');
const podiumElement = document.getElementById('podium');
const podiumText = document.getElementById('podium-text');
const performanceTools = document.getElementById('performance-tools');
const performanceButton = document.getElementById('show-performance');
const performancePanel = document.getElementById('performance-board');
const performanceTableBody = document.getElementById('performance-table-body');
const closePerformanceButton = document.getElementById('close-performance');

let totalParticipants = 0;
let matchQueue = [];
let currentMatchIndex = 0;
let matchHistory = [];
let manualMode = false;
let knockoutState = resetKnockoutState();

function createPlayer(name) {
    return { name, points: 0, diff: 0 };
}

function getSlotLabel(slot) {
    return slot?.name || '—';
}

function getTotalCapacity() {
    return GROUPS.reduce((sum, group) => sum + group.slots.length, 0);
}

function getOrderedPlayers(group) {
    return group.slots
        .filter(Boolean)
        .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.diff !== a.diff) return b.diff - a.diff;
            return a.name.localeCompare(b.name);
        });
}

function getAllPlayers() {
    return GROUPS.flatMap((group) => group.slots.filter(Boolean));
}

function createKnockoutMatch(id, label, playerOne = null, playerTwo = null) {
    return {
        id,
        label,
        players: [playerOne || null, playerTwo || null],
        winnerIndex: null,
    };
}

function resetKnockoutState() {
    return {
        started: false,
        quarters: [],
        semis: [],
        thirdPlace: null,
        final: null,
        podium: null,
    };
}

function renderGroups() {
    const fragment = document.createDocumentFragment();
    groupsContainer.innerHTML = '';

    GROUPS.forEach((group, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group-card');
        card.dataset.groupIndex = index;
        const groupSuffix = String.fromCharCode(97 + index);
        card.classList.add(`group-card--${groupSuffix}`);

        card.querySelector('h2').textContent = group.name;
        card.querySelector('.badge').textContent = String.fromCharCode(65 + index);

        const list = card.querySelector('ol');
        list.innerHTML = '';

        group.slots.forEach((slot, slotIndex) => {
            const slotElement = document.createElement('li');
            slotElement.dataset.slotIndex = slotIndex;
            if (slot) {
                slotElement.classList.add('filled');
            }

            const slotInfo = document.createElement('div');
            slotInfo.className = 'slot-info';
            const slotName = document.createElement('span');
            slotName.className = 'slot-name';
            slotName.textContent = getSlotLabel(slot);
            const positionLabel = document.createElement('span');
            positionLabel.className = 'position-label';
            positionLabel.textContent = `Posición ${slotIndex + 1}`;
            slotInfo.append(slotName, positionLabel);
            slotElement.appendChild(slotInfo);

            if (slot) {
                const removeButton = document.createElement('button');
                removeButton.type = 'button';
                removeButton.className = 'slot-remove';
                removeButton.innerHTML = '&times;';
                removeButton.setAttribute('aria-label', `Quitar a ${slot.name} del ${group.name}`);
                removeButton.dataset.action = 'remove-participant';
                removeButton.dataset.groupIndex = index;
                removeButton.dataset.slotIndex = slotIndex;
                slotElement.appendChild(removeButton);
            }

            list.appendChild(slotElement);
        });

        fragment.appendChild(clone);
    });

    groupsContainer.appendChild(fragment);
}

function updateCapacityUI() {
    const capacity = getTotalCapacity();
    const remaining = capacity - totalParticipants;
    slotsRemaining.textContent = remaining;

    if (remaining === 0) {
        helperText.textContent = '¡Todos los grupos están completos!';
    } else if (remaining === 1) {
        helperText.textContent = 'Queda 1 lugar disponible.';
    } else {
        helperText.textContent = `Quedan ${remaining} lugares disponibles.`;
    }

    const shouldDisableInputs = remaining === 0;
    addButton.disabled = shouldDisableInputs;
    nameInput.disabled = shouldDisableInputs;
}

function refreshManualControls() {
    if (!manualToggleButton || !manualFields) return;

    manualToggleButton.classList.toggle('is-active', manualMode);
    manualToggleButton.setAttribute('aria-pressed', manualMode ? 'true' : 'false');
    manualToggleButton.textContent = manualMode
        ? 'Asignación manual activada'
        : 'Asignación manual desactivada';
    manualFields.hidden = !manualMode;

    if (manualGroupSelect) {
        manualGroupSelect.disabled = !manualMode;
    }
    if (manualPositionSelect) {
        manualPositionSelect.disabled = !manualMode;
    }

    if (manualMode) {
        populateManualGroupOptions();
    }
}

function populateManualGroupOptions() {
    if (!manualMode || !manualGroupSelect || !manualPositionSelect) return;

    const availableGroups = GROUPS.map((group, groupIndex) => {
        const freePositions = [];
        group.slots.forEach((slot, positionIndex) => {
            if (!slot) {
                freePositions.push(positionIndex);
            }
        });
        return { groupIndex, name: group.name, freePositions };
    }).filter((group) => group.freePositions.length);

    if (!availableGroups.length) {
        manualGroupSelect.innerHTML = '';
        manualPositionSelect.innerHTML = '';
        manualGroupSelect.disabled = true;
        manualPositionSelect.disabled = true;
        if (manualHelperText) {
            manualHelperText.textContent = 'No quedan posiciones vacías para asignar manualmente.';
        }
        return;
    }

    const previousValue = manualGroupSelect.value;
    manualGroupSelect.innerHTML = availableGroups
        .map((group) => `<option value="${group.groupIndex}">${group.name}</option>`)
        .join('');

    const existingSelection = availableGroups.find((group) => String(group.groupIndex) === previousValue);
    manualGroupSelect.value = existingSelection
        ? String(existingSelection.groupIndex)
        : String(availableGroups[0].groupIndex);

    populateManualPositionOptions();
}

function populateManualPositionOptions() {
    if (!manualMode || !manualGroupSelect || !manualPositionSelect) return;

    const groupIndex = Number(manualGroupSelect.value);
    const group = GROUPS[groupIndex];
    if (!group) {
        manualPositionSelect.innerHTML = '';
        manualPositionSelect.disabled = true;
        return;
    }

    const options = group.slots
        .map((slot, positionIndex) => (!slot
            ? `<option value="${positionIndex}">Posición ${positionIndex + 1}</option>`
            : null))
        .filter(Boolean)
        .join('');

    manualPositionSelect.innerHTML = options;
    const hasOptions = Boolean(options);
    manualPositionSelect.disabled = !hasOptions;
    if (!hasOptions && manualHelperText) {
        manualHelperText.textContent = 'Ese grupo está completo, elegí otro.';
    }
}

function toggleManualMode() {
    manualMode = !manualMode;
    if (manualMode) {
        if (manualHelperText) {
            manualHelperText.textContent = 'Elegí el grupo y la posición antes de anotar.';
        }
    } else if (manualHelperText) {
        manualHelperText.textContent = 'Elegí el grupo y la posición para ubicar manualmente a la persona.';
    }
    refreshManualControls();
}

function refreshUI() {
    renderGroups();
    updateCapacityUI();
    updateStandings();
    refreshManualControls();
}

function addParticipant() {
    const name = nameInput.value.trim();
    if (!name) {
        helperText.textContent = 'Ingresá un nombre válido para continuar.';
        return;
    }

    if (totalParticipants >= getTotalCapacity()) {
        helperText.textContent = 'El sorteo ya está completo.';
        return;
    }

    const wasAssigned = manualMode
        ? assignParticipantManually(name)
        : assignParticipantAutomatically(name);

    if (!wasAssigned) {
        return;
    }

    totalParticipants += 1;
    refreshUI();
    rebuildMatchQueue();
    nameInput.value = '';
    nameInput.focus();
}

function assignParticipantAutomatically(name) {
    const isFirstParticipant = totalParticipants === 0;

    if (isFirstParticipant) {
        GROUPS[0].slots[0] = createPlayer(name);
        return true;
    }

    const availableSlots = [];

    GROUPS.forEach((group, groupIndex) => {
        group.slots.forEach((slot, slotIndex) => {
            const isFirstPosition = groupIndex === 0 && slotIndex === 0;
            if (!slot && !isFirstPosition) {
                availableSlots.push({ groupIndex, slotIndex });
            }
        });
    });

    if (!availableSlots.length) {
        helperText.textContent = 'Ya no quedan espacios disponibles.';
        refreshUI();
        return false;
    }

    const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
    GROUPS[randomSlot.groupIndex].slots[randomSlot.slotIndex] = createPlayer(name);
    return true;
}

function assignParticipantManually(name) {
    if (!manualGroupSelect || !manualPositionSelect) return false;

    if (!manualGroupSelect.options.length || !manualPositionSelect.options.length) {
        if (manualHelperText) {
            manualHelperText.textContent = 'No quedan posiciones vacías para asignar manualmente.';
        }
        return false;
    }

    const groupIndex = Number(manualGroupSelect.value);
    const positionIndex = Number(manualPositionSelect.value);
    const group = GROUPS[groupIndex];

    if (!group || Number.isNaN(positionIndex)) {
        if (manualHelperText) {
            manualHelperText.textContent = 'Elegí un grupo y una posición disponible.';
        }
        return false;
    }

    if (group.slots[positionIndex]) {
        if (manualHelperText) {
            manualHelperText.textContent = 'Esa posición ya está ocupada. Probá con otra disponible.';
        }
        populateManualGroupOptions();
        return false;
    }

    group.slots[positionIndex] = createPlayer(name);
    if (manualHelperText) {
        manualHelperText.textContent = `${name} fue asignado al ${group.name} - Posición ${positionIndex + 1}.`;
    }
    return true;
}

function resetDraw() {
    GROUPS.forEach((group) => {
        group.slots = group.slots.map(() => null);
    });

    totalParticipants = 0;
    matchQueue = [];
    currentMatchIndex = 0;
    matchHistory = [];
    knockoutState = resetKnockoutState();
    addButton.disabled = false;
    nameInput.disabled = false;
    nameInput.value = '';
    nameInput.focus();
    refreshUI();
    resetMatchControls();
    updateUndoState();
    hideKnockoutStage();
    updateKnockoutButtonState();
}

function removeParticipantFromSlot(groupIndex, slotIndex) {
    const group = GROUPS[groupIndex];
    if (!group) return;

    const slot = group.slots[slotIndex];
    if (!slot) return;

    group.slots[slotIndex] = null;
    totalParticipants = Math.max(0, totalParticipants - 1);
    helperText.textContent = `${slot.name} fue eliminado del ${group.name}.`;

    matchHistory = [];
    matchQueue = [];
    currentMatchIndex = 0;
    knockoutState = resetKnockoutState();
    hideKnockoutStage();

    refreshUI();
    rebuildMatchQueue();
    resetMatchControls();
    updateUndoState();
}

function populateGroupOptions() {
    groupSelect.innerHTML = GROUPS.map((group, index) => `<option value="${index}">${group.name}</option>`).join('');
}

function setEditFeedback(message, isError = false) {
    editFeedback.textContent = message;
    editFeedback.classList.toggle('is-error', Boolean(isError));
}

function openEditPanel() {
    populateGroupOptions();
    editPanel.classList.add('is-visible');
    editPanel.setAttribute('aria-hidden', 'false');
    setEditFeedback('');
}

function closeEditPanelView() {
    editPanel.classList.remove('is-visible');
    editPanel.setAttribute('aria-hidden', 'true');
    setEditFeedback('');
}

function getSelectedGroup() {
    const groupIndex = Number(groupSelect.value);
    return GROUPS[groupIndex];
}

function addSlotToGroup() {
    const group = getSelectedGroup();
    if (!group) return;

    group.slots.push(null);
    refreshUI();
    setEditFeedback(`Se agregó una posición al ${group.name}.`);
}

function removeSlotFromGroup() {
    const group = getSelectedGroup();
    if (!group) return;

    if (group.slots.length <= 1) {
        setEditFeedback('Cada grupo debe tener al menos una posición.', true);
        return;
    }

    const lastSlot = group.slots[group.slots.length - 1];
    if (lastSlot) {
        setEditFeedback('La última posición está ocupada. Reorganizá antes de quitarla.', true);
        return;
    }

    group.slots.pop();
    refreshUI();
    setEditFeedback(`Se quitó una posición al ${group.name}.`);
}

function updateStandings() {
    if (!standingsContainer) return;

    standingsContainer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'standings-grid';

    GROUPS.forEach((group, groupIndex) => {
        const card = document.createElement('article');
        card.className = 'standings-card';

        const header = document.createElement('header');
        const title = document.createElement('h3');
        title.textContent = group.name;
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = String.fromCharCode(65 + groupIndex);
        header.appendChild(title);
        header.appendChild(badge);
        card.appendChild(header);

        const players = getOrderedPlayers(group);

        if (!players.length) {
            const empty = document.createElement('p');
            empty.className = 'standings-empty';
            empty.textContent = 'Sin jugadores todavía.';
            card.appendChild(empty);
        } else {
            const list = document.createElement('ol');
            list.className = 'standings-list';
            list.start = 1;

            players.forEach((player, index) => {
                const row = document.createElement('li');
                row.className = 'standings-row';
                if (index < 2) {
                    row.classList.add('rank-top');
                }
                if (index === players.length - 1 && players.length > 0) {
                    row.classList.add('rank-last');
                }

                const nameSpan = document.createElement('span');
                nameSpan.textContent = player.name;
                const stats = document.createElement('small');
                stats.textContent = `${player.points} pts · ${player.diff} dif`;
                row.appendChild(nameSpan);
                row.appendChild(stats);
                list.appendChild(row);
            });

            card.appendChild(list);
        }

        grid.appendChild(card);
    });

    standingsContainer.appendChild(grid);
}

function canStartKnockoutStage() {
    const hasMatches = matchQueue.length > 0;
    const allMatchesRecorded = hasMatches && currentMatchIndex >= matchQueue.length;
    const enoughPlayersPerGroup = GROUPS.every((group) => getOrderedPlayers(group).length >= 2);
    return hasMatches && allMatchesRecorded && enoughPlayersPerGroup;
}

function updateKnockoutButtonState() {
    if (!playFinalsButton || !finalStageHelper) return;

    if (knockoutState.started) {
        playFinalsButton.disabled = true;
        finalStageHelper.textContent = 'Elegí los ganadores para avanzar hasta la final.';
        return;
    }

    const canStart = canStartKnockoutStage();
    playFinalsButton.disabled = !canStart;
    finalStageHelper.textContent = canStart
        ? '¡Listo! Jugá la última fase para definir al campeón.'
        : 'Tenés que completar todos los partidos de grupos para habilitarla.';
}

function buildInitialKnockoutState() {
    const rankings = GROUPS.map((group) => getOrderedPlayers(group));
    return {
        started: true,
        quarters: [
            createKnockoutMatch('E', 'Grupo E', rankings[0][0], rankings[1][1]),
            createKnockoutMatch('F', 'Grupo F', rankings[1][0], rankings[0][1]),
            createKnockoutMatch('G', 'Grupo G', rankings[2][0], rankings[3][1]),
            createKnockoutMatch('H', 'Grupo H', rankings[3][0], rankings[2][1]),
        ],
        semis: [
            createKnockoutMatch('S1', 'Semifinal 1'),
            createKnockoutMatch('S2', 'Semifinal 2'),
        ],
        thirdPlace: createKnockoutMatch('THIRD', 'Partido por el tercer puesto'),
        final: createKnockoutMatch('FINAL', 'Final'),
        podium: null,
    };
}

function startKnockoutStage() {
    if (!canStartKnockoutStage()) return;

    knockoutState = buildInitialKnockoutState();
    updateSemifinalsFromQuarters();
    updateFinalsFromSemis();
    renderKnockoutStage();
    updateKnockoutButtonState();
}

function hideKnockoutStage() {
    if (knockoutStage) {
        knockoutStage.hidden = true;
    }
    if (quarterMatchesContainer) quarterMatchesContainer.innerHTML = '';
    if (semiMatchesContainer) semiMatchesContainer.innerHTML = '';
    if (thirdPlaceContainer) thirdPlaceContainer.innerHTML = '';
    if (finalMatchContainer) finalMatchContainer.innerHTML = '';
    if (podiumElement) {
        podiumElement.hidden = true;
    }
    if (podiumText) {
        podiumText.textContent = '';
    }
    if (performanceTools) {
        performanceTools.hidden = true;
    }
    hidePerformanceBoard();
}

function renderKnockoutStage() {
    if (!knockoutStage) return;
    if (!knockoutState.started) {
        hideKnockoutStage();
        return;
    }

    knockoutStage.hidden = false;
    renderKnockoutMatches(quarterMatchesContainer, knockoutState.quarters, 'quarters');
    renderKnockoutMatches(semiMatchesContainer, knockoutState.semis, 'semis');
    renderKnockoutMatches(thirdPlaceContainer, [knockoutState.thirdPlace], 'thirdPlace');
    renderKnockoutMatches(finalMatchContainer, [knockoutState.final], 'final');
    updatePodiumView();
    updatePerformanceAvailability();
}

function renderKnockoutMatches(container, matches, stageKey) {
    if (!container) return;
    container.innerHTML = '';

    if (!matches || !matches.length) {
        const empty = document.createElement('p');
        empty.className = 'knockout-empty';
        empty.textContent = 'Esperando clasificados.';
        container.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    matches.forEach((match) => {
        if (!match) return;
        fragment.appendChild(createKnockoutMatchElement(match, stageKey));
    });

    if (!fragment.childNodes.length) {
        const empty = document.createElement('p');
        empty.className = 'knockout-empty';
        empty.textContent = 'Esperando clasificados.';
        container.appendChild(empty);
        return;
    }

    container.appendChild(fragment);
}

function createKnockoutMatchElement(match, stageKey) {
    const article = document.createElement('article');
    article.className = 'knockout-match';

    const header = document.createElement('header');
    const title = document.createElement('span');
    title.textContent = match.label;
    header.appendChild(title);
    if (match.id) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = match.id;
        header.appendChild(badge);
    }
    article.appendChild(header);

    const playersWrapper = document.createElement('div');
    playersWrapper.className = 'knockout-players';
    const players = Array.isArray(match.players) ? [...match.players] : [];
    while (players.length < 2) {
        players.push(null);
    }

    players.forEach((player, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'knockout-player';
        button.textContent = player ? player.name : 'Pendiente';
        button.disabled = !player;
        button.dataset.stage = stageKey;
        button.dataset.matchId = match.id;
        button.dataset.playerIndex = String(index);

        if (typeof match.winnerIndex === 'number') {
            if (match.winnerIndex === index) {
                button.classList.add('is-winner');
            } else if (match.players[match.winnerIndex]) {
                button.classList.add('is-loser');
            }
        }

        playersWrapper.appendChild(button);
    });

    article.appendChild(playersWrapper);
    return article;
}

function handleKnockoutSelection(event) {
    const target = event.target.closest('.knockout-player');
    if (!target || target.disabled) return;

    const { stage, matchId, playerIndex } = target.dataset;
    if (!stage || !matchId) return;
    registerKnockoutWinner(stage, matchId, Number(playerIndex));
}

function findMatchById(matches, id) {
    return matches.find((match) => match && match.id === id);
}

function getMatchWinner(match) {
    if (!match || typeof match.winnerIndex !== 'number') return null;
    return match.players?.[match.winnerIndex] || null;
}

function getMatchLoser(match) {
    if (!match || typeof match.winnerIndex !== 'number') return null;
    const loserIndex = match.winnerIndex === 0 ? 1 : 0;
    return match.players?.[loserIndex] || null;
}

function updateMatchPlayers(match, playerOne, playerTwo) {
    if (!match) return;
    const nextPlayers = [playerOne || null, playerTwo || null];
    const currentPlayers = match.players || [];
    const hasChanged = currentPlayers[0] !== nextPlayers[0] || currentPlayers[1] !== nextPlayers[1];
    match.players = nextPlayers;
    if (hasChanged) {
        match.winnerIndex = null;
    }
}

function updateSemifinalsFromQuarters() {
    if (!knockoutState.started) return;
    const matchE = findMatchById(knockoutState.quarters, 'E');
    const matchF = findMatchById(knockoutState.quarters, 'F');
    const matchG = findMatchById(knockoutState.quarters, 'G');
    const matchH = findMatchById(knockoutState.quarters, 'H');

    updateMatchPlayers(knockoutState.semis[0], getMatchWinner(matchE), getMatchWinner(matchG));
    updateMatchPlayers(knockoutState.semis[1], getMatchWinner(matchF), getMatchWinner(matchH));
}

function updateFinalsFromSemis() {
    if (!knockoutState.started) return;
    const semiOne = knockoutState.semis[0];
    const semiTwo = knockoutState.semis[1];

    updateMatchPlayers(knockoutState.final, getMatchWinner(semiOne), getMatchWinner(semiTwo));
    updateMatchPlayers(knockoutState.thirdPlace, getMatchLoser(semiOne), getMatchLoser(semiTwo));
}

function updatePodiumView() {
    if (!podiumElement || !podiumText) return;
    if (!knockoutState.started) {
        podiumElement.hidden = true;
        podiumText.textContent = '';
        return;
    }

    const champion = getMatchWinner(knockoutState.final);
    const runnerUp = getMatchLoser(knockoutState.final);
    const thirdPlaceWinner = getMatchWinner(knockoutState.thirdPlace);

    if (champion && runnerUp && thirdPlaceWinner) {
        podiumElement.hidden = false;
        podiumText.innerHTML = '';
        const fragment = document.createDocumentFragment();
        fragment.append('🏆 Felicitaciones a ');
        const championStrong = document.createElement('strong');
        championStrong.textContent = champion.name;
        fragment.append(championStrong, ' por salir campeón. ');
        const runnerUpStrong = document.createElement('strong');
        runnerUpStrong.textContent = runnerUp.name;
        fragment.append(runnerUpStrong, ' se queda con el segundo puesto y ');
        const thirdStrong = document.createElement('strong');
        thirdStrong.textContent = thirdPlaceWinner.name;
        fragment.append(thirdStrong, ' suma el tercer lugar.');
        podiumText.appendChild(fragment);
    } else {
        podiumElement.hidden = true;
        podiumText.textContent = '';
    }
}

function getQualificationBonusValue(players) {
    if (!players.length) {
        return PERFORMANCE_BONUS_CONFIG.minimumQualificationBonus;
    }
    const maxPoints = Math.max(...players.map((player) => player.points));
    return Math.max(PERFORMANCE_BONUS_CONFIG.minimumQualificationBonus, maxPoints + 1);
}

function addPerformanceBonus(bonusesMap, player, value) {
    if (!player || !Number.isFinite(value)) return;
    const current = bonusesMap.get(player) || 0;
    bonusesMap.set(player, current + value);
}

function getKnockoutPerformanceBonuses(players) {
    const bonuses = new Map();
    if (!knockoutState.started) {
        return bonuses;
    }

    const qualificationBonus = getQualificationBonusValue(players);

    knockoutState.quarters.forEach((match) => {
        if (!match) return;
        if (Array.isArray(match.players)) {
            match.players.forEach((player) => addPerformanceBonus(bonuses, player, qualificationBonus));
        }
        const winner = getMatchWinner(match);
        if (winner) {
            addPerformanceBonus(bonuses, winner, PERFORMANCE_BONUS_CONFIG.quarterWin);
        }
    });

    knockoutState.semis.forEach((match) => {
        if (!match) return;
        const winner = getMatchWinner(match);
        if (winner) {
            addPerformanceBonus(bonuses, winner, PERFORMANCE_BONUS_CONFIG.semifinalWin);
        }
    });

    const champion = getMatchWinner(knockoutState.final);
    if (champion) {
        addPerformanceBonus(bonuses, champion, PERFORMANCE_BONUS_CONFIG.finalWin);
    }

    const thirdPlaceWinner = getMatchWinner(knockoutState.thirdPlace);
    if (thirdPlaceWinner) {
        addPerformanceBonus(bonuses, thirdPlaceWinner, PERFORMANCE_BONUS_CONFIG.thirdPlaceWin);
    }

    return bonuses;
}

function getPerformanceRanking() {
    const allPlayers = getAllPlayers();
    if (!allPlayers.length) return [];

    const champion = getMatchWinner(knockoutState.final);
    const bonusMap = getKnockoutPerformanceBonuses(allPlayers);

    const ranking = allPlayers.map((player) => {
        const bonusPoints = bonusMap.get(player) || 0;
        return {
            player,
            bonusPoints,
            totalPoints: player.points + bonusPoints,
        };
    });

    ranking.sort((a, b) => {
        if (champion) {
            if (a.player === champion) return -1;
            if (b.player === champion) return 1;
        }
        if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
        if (b.player.diff !== a.player.diff) return b.player.diff - a.player.diff;
        return a.player.name.localeCompare(b.player.name);
    });

    return ranking;
}

function renderPerformanceTable() {
    if (!performanceTableBody) return;

    const ranking = getPerformanceRanking();
    performanceTableBody.innerHTML = '';

    if (!ranking.length) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 4;
        cell.textContent = 'Todavía no hay datos para mostrar.';
        row.appendChild(cell);
        performanceTableBody.appendChild(row);
        return;
    }

    const champion = getMatchWinner(knockoutState.final);

    ranking.forEach((entry, index) => {
        const { player, totalPoints, bonusPoints } = entry;
        const row = document.createElement('tr');
        if (player === champion) {
            row.classList.add('highlight');
        }

        const positionCell = document.createElement('td');
        positionCell.textContent = index + 1;
        const nameCell = document.createElement('td');
        nameCell.textContent = player.name;
        const pointsCell = document.createElement('td');
        pointsCell.classList.add('performance-points-cell');
        const pointsValue = document.createElement('span');
        pointsValue.textContent = totalPoints;
        pointsCell.appendChild(pointsValue);

        if (bonusPoints > 0) {
            const bonusTag = document.createElement('span');
            bonusTag.className = 'performance-bonus';
            bonusTag.textContent = `+${bonusPoints}`;
            bonusTag.title = 'Bonificación por la etapa final';
            pointsCell.appendChild(bonusTag);
        }

        const diffCell = document.createElement('td');
        diffCell.textContent = player.diff;

        row.append(positionCell, nameCell, pointsCell, diffCell);
        performanceTableBody.appendChild(row);
    });
}

function showPerformanceBoard() {
    if (!performancePanel) return;
    renderPerformanceTable();
    performancePanel.hidden = false;
    if (performanceButton) {
        performanceButton.setAttribute('aria-expanded', 'true');
    }
}

function hidePerformanceBoard() {
    if (!performancePanel) return;
    performancePanel.hidden = true;
    if (performanceButton) {
        performanceButton.setAttribute('aria-expanded', 'false');
    }
}

function updatePerformanceAvailability() {
    const championReady = Boolean(knockoutState.started && getMatchWinner(knockoutState.final));
    if (performanceTools) {
        performanceTools.hidden = !championReady;
    }
    if (performanceButton) {
        performanceButton.disabled = !championReady;
    }
    if (!championReady) {
        hidePerformanceBoard();
    } else if (performancePanel && !performancePanel.hidden) {
        renderPerformanceTable();
    }
}

function registerKnockoutWinner(stageKey, matchId, playerIndex) {
    if (!knockoutState.started) return;

    let collection = [];
    if (stageKey === 'quarters') {
        collection = knockoutState.quarters;
    } else if (stageKey === 'semis') {
        collection = knockoutState.semis;
    } else if (stageKey === 'thirdPlace') {
        collection = [knockoutState.thirdPlace];
    } else if (stageKey === 'final') {
        collection = [knockoutState.final];
    }

    const match = findMatchById(collection, matchId);
    if (!match) return;
    if (!match.players?.[playerIndex]) return;

    match.winnerIndex = playerIndex;

    if (stageKey === 'quarters') {
        updateSemifinalsFromQuarters();
        updateFinalsFromSemis();
    } else if (stageKey === 'semis') {
        updateFinalsFromSemis();
    }

    renderKnockoutStage();
}

function rebuildMatchQueue() {
    const maxSlots = Math.max(...GROUPS.map((group) => group.slots.length));
    if (!Number.isFinite(maxSlots)) {
        matchQueue = [];
        currentMatchIndex = 0;
        matchHistory = [];
        updateMatchUI();
        updateUndoState();
        return;
    }

    const newQueue = [];
    for (let homeIndex = 0; homeIndex < maxSlots - 1; homeIndex += 1) {
        for (let awayIndex = homeIndex + 1; awayIndex < maxSlots; awayIndex += 1) {
            GROUPS.forEach((group, groupIndex) => {
                if (homeIndex >= group.slots.length || awayIndex >= group.slots.length) return;
                const playerOne = group.slots[homeIndex];
                const opponent = group.slots[awayIndex];
                if (playerOne && opponent) {
                    newQueue.push({
                        groupIndex,
                        homeIndex,
                        awayIndex,
                    });
                }
            });
        }
    }

    matchQueue = newQueue;
    currentMatchIndex = 0;
    matchHistory = [];
    updateMatchUI();
    updateUndoState();
}

function resetMatchControls() {
    diffInput.value = 0;
    diffValue.textContent = '0';
    updateMatchUI();
}

function updateUndoState() {
    const isDisabled = matchHistory.length === 0;
    if (undoButton) {
        undoButton.disabled = isDisabled;
    }
    if (undoArrowButton) {
        undoArrowButton.disabled = isDisabled;
    }
}

function updateMatchUI() {
    updateKnockoutButtonState();
    const match = matchQueue[currentMatchIndex];
    const availableMatch = Boolean(match);

    diffInput.disabled = !availableMatch;
    matchPlayerAButton.disabled = !availableMatch;
    matchPlayerBButton.disabled = !availableMatch;

    if (!availableMatch) {
        if (!matchQueue.length) {
            currentMatchLabel.textContent = 'Cargá al menos dos posiciones por grupo para generar partidos.';
            matchesRemainingLabel.textContent = 'No hay partidos generados.';
        } else {
            currentMatchLabel.textContent = '¡Todos los partidos fueron registrados!';
            matchesRemainingLabel.textContent = 'No quedan partidos pendientes.';
        }
        matchPlayerAButton.textContent = 'Jugador A';
        matchPlayerBButton.textContent = 'Jugador B';
        return;
    }

    const group = GROUPS[match.groupIndex];
    const playerA = group.slots[match.homeIndex];
    const playerB = group.slots[match.awayIndex];

    currentMatchLabel.textContent = `${group.name}: Posición ${match.homeIndex + 1} vs Posición ${match.awayIndex + 1}`;
    matchPlayerAButton.textContent = getSlotLabel(playerA);
    matchPlayerBButton.textContent = getSlotLabel(playerB);
    matchPlayerAButton.dataset.player = 'home';
    matchPlayerBButton.dataset.player = 'away';
    diffInput.value = diffInput.disabled ? 0 : diffInput.value;
    diffValue.textContent = diffInput.value;

    const remaining = matchQueue.length - currentMatchIndex;
    matchesRemainingLabel.textContent = `${remaining} partido${remaining === 1 ? '' : 's'} pendiente${remaining === 1 ? '' : 's'}.`;
}

function registerMatchResult(winnerKey) {
    const match = matchQueue[currentMatchIndex];
    if (!match) return;

    const group = GROUPS[match.groupIndex];
    const playerA = group.slots[match.homeIndex];
    const playerB = group.slots[match.awayIndex];
    if (!playerA || !playerB) {
        currentMatchIndex += 1;
        updateMatchUI();
        return;
    }

    const diff = Number(diffInput.value) || 0;
    const winner = winnerKey === 'home' ? playerA : playerB;
    const loser = winnerKey === 'home' ? playerB : playerA;

    winner.points += 1;
    if (diff > 0) {
        winner.diff += diff;
        loser.diff -= diff;
    }

    matchHistory.push({
        match: { ...match },
        winnerKey,
        diff,
    });
    currentMatchIndex += 1;
    diffInput.value = 0;
    diffValue.textContent = '0';
    updateStandings();
    updateMatchUI();
    updateUndoState();
}

function undoLastMatch() {
    if (!matchHistory.length) return;

    const lastResult = matchHistory.pop();
    const { match, winnerKey, diff } = lastResult;
    const group = GROUPS[match.groupIndex];
    if (!group) {
        updateUndoState();
        return;
    }

    const playerA = group.slots[match.homeIndex];
    const playerB = group.slots[match.awayIndex];
    if (!playerA || !playerB) {
        currentMatchIndex = Math.max(0, currentMatchIndex - 1);
        updateMatchUI();
        updateUndoState();
        return;
    }

    const winner = winnerKey === 'home' ? playerA : playerB;
    const loser = winnerKey === 'home' ? playerB : playerA;

    winner.points = Math.max(0, winner.points - 1);
    if (diff > 0) {
        winner.diff -= diff;
        loser.diff += diff;
    }

    currentMatchIndex = Math.max(0, currentMatchIndex - 1);
    diffInput.value = diff;
    diffValue.textContent = String(diff);
    updateStandings();
    updateMatchUI();
    updateUndoState();
}

addButton.addEventListener('click', addParticipant);
nameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        addParticipant();
    }
});
resetButton.addEventListener('click', () => {
    const shouldReset = window.confirm('¿Estás seguro de que querés reiniciar? Elegí Sí o No.');
    if (!shouldReset) {
        return;
    }
    resetDraw();
});
editButton.addEventListener('click', openEditPanel);
closeEditPanel.addEventListener('click', closeEditPanelView);
addSlotButton.addEventListener('click', addSlotToGroup);
removeSlotButton.addEventListener('click', removeSlotFromGroup);
matchPlayerAButton.addEventListener('click', () => registerMatchResult('home'));
matchPlayerBButton.addEventListener('click', () => registerMatchResult('away'));
if (undoButton) {
    undoButton.addEventListener('click', undoLastMatch);
}
if (undoArrowButton) {
    undoArrowButton.addEventListener('click', undoLastMatch);
}
if (manualToggleButton) {
    manualToggleButton.addEventListener('click', toggleManualMode);
}
if (manualGroupSelect) {
    manualGroupSelect.addEventListener('change', populateManualPositionOptions);
}
if (playFinalsButton) {
    playFinalsButton.addEventListener('click', startKnockoutStage);
}
if (knockoutStage) {
    knockoutStage.addEventListener('click', handleKnockoutSelection);
}
if (performanceButton) {
    performanceButton.addEventListener('click', () => {
        if (!performancePanel) return;
        if (performancePanel.hidden) {
            showPerformanceBoard();
        } else {
            hidePerformanceBoard();
        }
    });
}
if (closePerformanceButton) {
    closePerformanceButton.addEventListener('click', hidePerformanceBoard);
}
if (groupsContainer) {
    groupsContainer.addEventListener('click', (event) => {
        const button = event.target.closest('[data-action="remove-participant"]');
        if (!button) return;
        const groupIndex = Number(button.dataset.groupIndex);
        const slotIndex = Number(button.dataset.slotIndex);
        removeParticipantFromSlot(groupIndex, slotIndex);
    });
}
diffInput.addEventListener('input', () => {
    diffValue.textContent = diffInput.value;
});
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && editPanel.classList.contains('is-visible')) {
        closeEditPanelView();
    }
});

populateGroupOptions();
refreshUI();
resetMatchControls();
updateUndoState();
