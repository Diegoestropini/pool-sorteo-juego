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

let totalParticipants = 0;

function initGroups() {
    const fragment = document.createDocumentFragment();

    GROUPS.forEach((group, index) => {
        const clone = template.content.cloneNode(true);
        const card = clone.querySelector('.group-card');
        card.dataset.groupIndex = index;

        card.querySelector('h2').textContent = group.name;
        card.querySelector('.badge').textContent = String.fromCharCode(65 + index);

        const slots = card.querySelectorAll('li');
        slots.forEach((slot, slotIndex) => {
            slot.dataset.slotIndex = slotIndex;
            slot.innerHTML = `<span>${slot.textContent}</span><span class="position-label">Posición ${slotIndex + 1}</span>`;
        });

        fragment.appendChild(clone);
    });

    groupsContainer.appendChild(fragment);
}

function updateSlotsUI() {
    GROUPS.forEach((group, groupIndex) => {
        group.slots.forEach((name, slotIndex) => {
            const selector = `.group-card[data-group-index="${groupIndex}"] li[data-slot-index="${slotIndex}"]`;
            const slotElement = document.querySelector(selector);

            if (!slotElement) return;

            if (name) {
                slotElement.classList.add('filled');
                slotElement.innerHTML = `<span>${name}</span><span class="position-label">Posición ${slotIndex + 1}</span>`;
            } else {
                slotElement.classList.remove('filled');
                slotElement.innerHTML = `<span>—</span><span class="position-label">Posición ${slotIndex + 1}</span>`;
            }
        });
    });

    const remaining = 12 - totalParticipants;
    slotsRemaining.textContent = remaining;

    if (remaining === 0) {
        helperText.textContent = '¡Todos los grupos están completos!';
        addButton.disabled = true;
        nameInput.disabled = true;
    } else {
        helperText.textContent = `Quedan ${remaining} lugares disponibles.`;
    }
}

function addParticipant() {
    const name = nameInput.value.trim();
    if (!name) {
        helperText.textContent = 'Ingresá un nombre válido para continuar.';
        return;
    }

    if (totalParticipants >= 12) {
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
            updateSlotsUI();
            return;
        }

        const randomSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        GROUPS[randomSlot.groupIndex].slots[randomSlot.slotIndex] = name;
    }

    totalParticipants += 1;
    updateSlotsUI();
    nameInput.value = '';
    nameInput.focus();
}

addButton.addEventListener('click', addParticipant);
nameInput.addEventListener('keyup', (event) => {
    if (event.key === 'Enter') {
        addParticipant();
    }
});

initGroups();
updateSlotsUI();
