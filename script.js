const GROUPS = [
    { name: 'Grupo A', slots: [null, null, null] },
    { name: 'Grupo B', slots: [null, null, null] },
    { name: 'Grupo C', slots: [null, null, null] },
    { name: 'Grupo D', slots: [null, null, null] }
];

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

let totalParticipants = 0;
let matchQueue = [];
let currentMatchIndex = 0;

function createPlayer(name) {
    return { name, points: 0, diff: 0 };
}

function getSlotLabel(slot) {
    return slot?.name || '—';
}

function getTotalCapacity() {
    return GROUPS.reduce((sum, group) => sum + group.slots.length, 0);
}

function renderGroups() {
    const fragment = document.createDocumentFragment();
    groupsContainer.innerHTML = '';

    GROUPS.forEach((group, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group-card');
        card.dataset.groupIndex = index;

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
            slotElement.innerHTML = `<span>${getSlotLabel(slot)}</span><span class="position-label">Posición ${slotIndex + 1}</span>`;
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

function refreshUI() {
    renderGroups();
    updateCapacityUI();
    updateStandings();
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

    const isFirstParticipant = totalParticipants === 0;

    if (isFirstParticipant) {
        GROUPS[0].slots[0] = createPlayer(name);
    } else {
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
            return;
        }

        const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        GROUPS[randomSlot.groupIndex].slots[randomSlot.slotIndex] = createPlayer(name);
    }

    totalParticipants += 1;
    refreshUI();
    rebuildMatchQueue();
    nameInput.value = '';
    nameInput.focus();
}

function resetDraw() {
    GROUPS.forEach((group) => {
        group.slots = group.slots.map(() => null);
    });

    totalParticipants = 0;
    matchQueue = [];
    currentMatchIndex = 0;
    addButton.disabled = false;
    nameInput.disabled = false;
    nameInput.value = '';
    nameInput.focus();
    refreshUI();
    resetMatchControls();
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

        const players = group.slots.filter(Boolean).sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            if (b.diff !== a.diff) return b.diff - a.diff;
            return a.name.localeCompare(b.name);
        });

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

function rebuildMatchQueue() {
    const newQueue = [];

    GROUPS.forEach((group, groupIndex) => {
        for (let homeIndex = 0; homeIndex < group.slots.length - 1; homeIndex += 1) {
            for (let awayIndex = homeIndex + 1; awayIndex < group.slots.length; awayIndex += 1) {
                const playerOne = group.slots[homeIndex];
                const playerTwo = group.slots[awayIndex];

                if (playerOne && playerTwo) {
                    newQueue.push({
                        groupIndex,
                        homeIndex,
                        awayIndex,
                    });
                }
            }
        }
    });

    matchQueue = newQueue;
    currentMatchIndex = 0;
    updateMatchUI();
}

function resetMatchControls() {
    diffInput.value = 0;
    diffValue.textContent = '0';
    updateMatchUI();
}

function updateMatchUI() {
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

    currentMatchIndex += 1;
    diffInput.value = 0;
    diffValue.textContent = '0';
    updateStandings();
    updateMatchUI();
}

addButton.addEventListener('click', addParticipant);
nameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        addParticipant();
    }
});
resetButton.addEventListener('click', resetDraw);
editButton.addEventListener('click', openEditPanel);
closeEditPanel.addEventListener('click', closeEditPanelView);
addSlotButton.addEventListener('click', addSlotToGroup);
removeSlotButton.addEventListener('click', removeSlotFromGroup);
matchPlayerAButton.addEventListener('click', () => registerMatchResult('home'));
matchPlayerBButton.addEventListener('click', () => registerMatchResult('away'));
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
