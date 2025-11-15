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

let totalParticipants = 0;

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

        group.slots.forEach((name, slotIndex) => {
            const slotElement = document.createElement('li');
            slotElement.dataset.slotIndex = slotIndex;
            if (name) {
                slotElement.classList.add('filled');
            }
            slotElement.innerHTML = `<span>${name || '—'}</span><span class="position-label">Posición ${slotIndex + 1}</span>`;
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
        GROUPS[0].slots[0] = name;
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
        GROUPS[randomSlot.groupIndex].slots[randomSlot.slotIndex] = name;
    }

    totalParticipants += 1;
    refreshUI();
    nameInput.value = '';
    nameInput.focus();
}

function resetDraw() {
    GROUPS.forEach((group) => {
        group.slots = group.slots.map(() => null);
    });

    totalParticipants = 0;
    addButton.disabled = false;
    nameInput.disabled = false;
    nameInput.value = '';
    nameInput.focus();
    refreshUI();
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
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && editPanel.classList.contains('is-visible')) {
        closeEditPanelView();
    }
});

populateGroupOptions();
refreshUI();
