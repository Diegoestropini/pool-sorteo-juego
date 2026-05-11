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
const MAX_MATCH_DIFF = 7;

const STORAGE_KEY = 'pool-draw-state-v1';

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
const versusChip = document.querySelector('.vs');
const diffInput = document.getElementById('diff-input');
const diffValue = document.getElementById('diff-value');
const matchesRemainingLabel = document.getElementById('matches-remaining');
const postponeMatchButton = document.getElementById('postpone-match');
const toggleMatchHistoryButton = document.getElementById('toggle-match-history');
const matchHistoryPanel = document.getElementById('match-history-panel');
const matchHistoryList = document.getElementById('match-history-list');
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

const MATCH_PALETTES = Object.freeze([
    { homeBase: 'linear-gradient(135deg, rgba(11, 40, 35, 0.96), rgba(14, 61, 54, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(125, 211, 252, 0.08))', homeBorder: 'rgba(94, 234, 212, 0.28)', homeShadow: '0 14px 32px rgba(8, 30, 28, 0.35)', awayBase: 'linear-gradient(135deg, rgba(18, 27, 63, 0.96), rgba(34, 24, 77, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(96, 165, 250, 0.28), rgba(167, 139, 250, 0.12))', awayBorder: 'rgba(129, 140, 248, 0.3)', awayShadow: '0 14px 32px rgba(10, 18, 44, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(125, 211, 252, 0.95), rgba(129, 140, 248, 0.92))', vsShadow: '0 14px 28px rgba(71, 103, 219, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(54, 17, 17, 0.96), rgba(93, 31, 31, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(251, 113, 133, 0.32), rgba(252, 165, 165, 0.1))', homeBorder: 'rgba(251, 113, 133, 0.28)', homeShadow: '0 14px 32px rgba(43, 10, 20, 0.34)', awayBase: 'linear-gradient(135deg, rgba(49, 27, 13, 0.96), rgba(92, 49, 16, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(249, 115, 22, 0.12))', awayBorder: 'rgba(251, 191, 36, 0.28)', awayShadow: '0 14px 32px rgba(52, 25, 7, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(253, 186, 116, 0.96), rgba(251, 113, 133, 0.92))', vsShadow: '0 14px 28px rgba(153, 66, 66, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(18, 33, 61, 0.96), rgba(21, 63, 96, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(45, 212, 191, 0.1))', homeBorder: 'rgba(56, 189, 248, 0.28)', homeShadow: '0 14px 32px rgba(9, 24, 44, 0.35)', awayBase: 'linear-gradient(135deg, rgba(31, 22, 64, 0.96), rgba(68, 31, 108, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(192, 132, 252, 0.28), rgba(96, 165, 250, 0.12))', awayBorder: 'rgba(192, 132, 252, 0.28)', awayShadow: '0 14px 32px rgba(20, 12, 49, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(45, 212, 191, 0.96), rgba(192, 132, 252, 0.92))', vsShadow: '0 14px 28px rgba(76, 71, 183, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(22, 45, 27, 0.96), rgba(35, 88, 52, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(74, 222, 128, 0.3), rgba(163, 230, 53, 0.1))', homeBorder: 'rgba(74, 222, 128, 0.28)', homeShadow: '0 14px 32px rgba(13, 39, 20, 0.35)', awayBase: 'linear-gradient(135deg, rgba(27, 36, 12, 0.96), rgba(74, 78, 18, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(250, 204, 21, 0.28), rgba(163, 230, 53, 0.12))', awayBorder: 'rgba(250, 204, 21, 0.28)', awayShadow: '0 14px 32px rgba(42, 43, 12, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(163, 230, 53, 0.96), rgba(74, 222, 128, 0.92))', vsShadow: '0 14px 28px rgba(74, 125, 43, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(46, 17, 43, 0.96), rgba(82, 27, 71, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(244, 114, 182, 0.3), rgba(196, 181, 253, 0.1))', homeBorder: 'rgba(244, 114, 182, 0.28)', homeShadow: '0 14px 32px rgba(43, 13, 39, 0.35)', awayBase: 'linear-gradient(135deg, rgba(23, 22, 58, 0.96), rgba(31, 53, 102, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(129, 140, 248, 0.28), rgba(96, 165, 250, 0.12))', awayBorder: 'rgba(129, 140, 248, 0.28)', awayShadow: '0 14px 32px rgba(14, 18, 52, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(244, 114, 182, 0.96), rgba(129, 140, 248, 0.92))', vsShadow: '0 14px 28px rgba(102, 61, 145, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(17, 41, 48, 0.96), rgba(22, 77, 90, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(103, 232, 249, 0.3), rgba(45, 212, 191, 0.1))', homeBorder: 'rgba(103, 232, 249, 0.28)', homeShadow: '0 14px 32px rgba(10, 32, 38, 0.35)', awayBase: 'linear-gradient(135deg, rgba(44, 28, 12, 0.96), rgba(97, 63, 18, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(251, 191, 36, 0.28), rgba(253, 186, 116, 0.12))', awayBorder: 'rgba(251, 191, 36, 0.28)', awayShadow: '0 14px 32px rgba(51, 31, 8, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(103, 232, 249, 0.96), rgba(251, 191, 36, 0.92))', vsShadow: '0 14px 28px rgba(93, 110, 58, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(35, 20, 50, 0.96), rgba(56, 27, 88, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(167, 139, 250, 0.3), rgba(244, 114, 182, 0.1))', homeBorder: 'rgba(167, 139, 250, 0.28)', homeShadow: '0 14px 32px rgba(24, 12, 45, 0.35)', awayBase: 'linear-gradient(135deg, rgba(18, 42, 31, 0.96), rgba(28, 76, 49, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(74, 222, 128, 0.28), rgba(45, 212, 191, 0.12))', awayBorder: 'rgba(74, 222, 128, 0.28)', awayShadow: '0 14px 32px rgba(12, 35, 23, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(167, 139, 250, 0.96), rgba(74, 222, 128, 0.92))', vsShadow: '0 14px 28px rgba(73, 100, 102, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(60, 20, 24, 0.96), rgba(103, 33, 44, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(248, 113, 113, 0.32), rgba(253, 186, 116, 0.1))', homeBorder: 'rgba(248, 113, 113, 0.28)', homeShadow: '0 14px 32px rgba(52, 14, 20, 0.35)', awayBase: 'linear-gradient(135deg, rgba(20, 32, 63, 0.96), rgba(16, 66, 100, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(56, 189, 248, 0.28), rgba(129, 140, 248, 0.12))', awayBorder: 'rgba(56, 189, 248, 0.28)', awayShadow: '0 14px 32px rgba(10, 24, 49, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(248, 113, 113, 0.96), rgba(56, 189, 248, 0.92))', vsShadow: '0 14px 28px rgba(93, 68, 95, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(28, 46, 18, 0.96), rgba(51, 92, 23, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(163, 230, 53, 0.3), rgba(34, 197, 94, 0.1))', homeBorder: 'rgba(163, 230, 53, 0.28)', homeShadow: '0 14px 32px rgba(20, 40, 12, 0.35)', awayBase: 'linear-gradient(135deg, rgba(18, 35, 48, 0.96), rgba(21, 63, 88, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(103, 232, 249, 0.28), rgba(59, 130, 246, 0.12))', awayBorder: 'rgba(103, 232, 249, 0.28)', awayShadow: '0 14px 32px rgba(11, 27, 38, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(163, 230, 53, 0.96), rgba(103, 232, 249, 0.92))', vsShadow: '0 14px 28px rgba(74, 117, 74, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(42, 21, 21, 0.96), rgba(88, 35, 25, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(251, 146, 60, 0.3), rgba(248, 113, 113, 0.1))', homeBorder: 'rgba(251, 146, 60, 0.28)', homeShadow: '0 14px 32px rgba(45, 18, 14, 0.35)', awayBase: 'linear-gradient(135deg, rgba(19, 26, 67, 0.96), rgba(37, 28, 93, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(129, 140, 248, 0.28), rgba(192, 132, 252, 0.12))', awayBorder: 'rgba(129, 140, 248, 0.28)', awayShadow: '0 14px 32px rgba(13, 16, 56, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(251, 146, 60, 0.96), rgba(129, 140, 248, 0.92))', vsShadow: '0 14px 28px rgba(105, 70, 96, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(14, 38, 49, 0.96), rgba(20, 78, 78, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(45, 212, 191, 0.3), rgba(103, 232, 249, 0.1))', homeBorder: 'rgba(45, 212, 191, 0.28)', homeShadow: '0 14px 32px rgba(9, 28, 35, 0.35)', awayBase: 'linear-gradient(135deg, rgba(46, 18, 54, 0.96), rgba(87, 24, 64, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(244, 114, 182, 0.28), rgba(251, 113, 133, 0.12))', awayBorder: 'rgba(244, 114, 182, 0.28)', awayShadow: '0 14px 32px rgba(37, 12, 38, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(45, 212, 191, 0.96), rgba(244, 114, 182, 0.92))', vsShadow: '0 14px 28px rgba(74, 95, 109, 0.28)' },
    { homeBase: 'linear-gradient(135deg, rgba(23, 31, 67, 0.96), rgba(13, 71, 120, 0.9))', homeOverlay: 'linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(34, 211, 238, 0.1))', homeBorder: 'rgba(96, 165, 250, 0.28)', homeShadow: '0 14px 32px rgba(10, 25, 56, 0.35)', awayBase: 'linear-gradient(135deg, rgba(44, 31, 10, 0.96), rgba(98, 74, 16, 0.9))', awayOverlay: 'linear-gradient(135deg, rgba(250, 204, 21, 0.28), rgba(253, 186, 116, 0.12))', awayBorder: 'rgba(250, 204, 21, 0.28)', awayShadow: '0 14px 32px rgba(52, 38, 8, 0.35)', vsBase: 'radial-gradient(circle at 30% 30%, rgba(96, 165, 250, 0.96), rgba(250, 204, 21, 0.92))', vsShadow: '0 14px 28px rgba(88, 92, 86, 0.28)' }
]);

const matchPaletteAssignments = new Map();
let knockoutState = resetKnockoutState();

function createPlayerFromSavedData(slot) {
    if (!slot || typeof slot.name !== 'string') return null;
    return {
        name: slot.name,
        points: Number(slot.points) || 0,
        diff: Number(slot.diff) || 0,
    };
}

function getPlayerReference(player) {
    if (!player) return null;
    for (let groupIndex = 0; groupIndex < GROUPS.length; groupIndex += 1) {
        const group = GROUPS[groupIndex];
        for (let slotIndex = 0; slotIndex < group.slots.length; slotIndex += 1) {
            if (group.slots[slotIndex] === player) {
                return { groupIndex, slotIndex };
            }
        }
    }
    return null;
}

function serializeKnockoutMatch(match) {
    if (!match) return null;
    return {
        id: match.id,
        label: match.label,
        winnerIndex: typeof match.winnerIndex === 'number' ? match.winnerIndex : null,
        players: Array.isArray(match.players)
            ? match.players.map((player) => getPlayerReference(player))
            : [],
    };
}

function getPersistedState() {
    return {
        groups: GROUPS.map((group) => ({
            name: group.name,
            slots: group.slots.map((slot) => (slot ? { ...slot } : null)),
        })),
        matchQueue,
        currentMatchIndex,
        matchHistory,
        manualMode,
        knockoutState: {
            started: Boolean(knockoutState.started),
            quarters: (knockoutState.quarters || []).map((match) => serializeKnockoutMatch(match)),
            semis: (knockoutState.semis || []).map((match) => serializeKnockoutMatch(match)),
            thirdPlace: serializeKnockoutMatch(knockoutState.thirdPlace),
            final: serializeKnockoutMatch(knockoutState.final),
            podium: knockoutState.podium || null,
        },
    };
}

function saveState() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getPersistedState()));
    } catch (error) {
        console.warn('No se pudo guardar el estado local.', error);
    }
}

function clearSavedState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn('No se pudo borrar el estado local.', error);
    }
}

function getPlayerFromReference(reference) {
    if (!reference || !Number.isInteger(reference.groupIndex) || !Number.isInteger(reference.slotIndex)) {
        return null;
    }
    const group = GROUPS[reference.groupIndex];
    if (!group) return null;
    return group.slots[reference.slotIndex] || null;
}

function hydrateKnockoutMatch(savedMatch) {
    if (!savedMatch || typeof savedMatch.id !== 'string') return null;
    const rawPlayers = Array.isArray(savedMatch.players) ? savedMatch.players : [];
    return {
        id: savedMatch.id,
        label: savedMatch.label || '',
        players: rawPlayers.map((playerRef) => getPlayerFromReference(playerRef)),
        winnerIndex: Number.isInteger(savedMatch.winnerIndex) ? savedMatch.winnerIndex : null,
    };
}

function loadSavedState() {
    try {
        const rawState = localStorage.getItem(STORAGE_KEY);
        if (!rawState) return false;

        const parsedState = JSON.parse(rawState);
        if (!parsedState || !Array.isArray(parsedState.groups)) return false;

        GROUPS.forEach((group, groupIndex) => {
            const savedGroup = parsedState.groups[groupIndex];
            if (!savedGroup || !Array.isArray(savedGroup.slots)) return;

            if (typeof savedGroup.name === 'string' && savedGroup.name.trim()) {
                group.name = savedGroup.name;
            }
            group.slots = savedGroup.slots.map((slot) => createPlayerFromSavedData(slot));
        });

        totalParticipants = GROUPS.reduce((count, group) => count + group.slots.filter(Boolean).length, 0);
        matchQueue = Array.isArray(parsedState.matchQueue) ? parsedState.matchQueue : [];
        matchHistory = Array.isArray(parsedState.matchHistory) ? parsedState.matchHistory : [];
        currentMatchIndex = Number(parsedState.currentMatchIndex);
        if (!Number.isFinite(currentMatchIndex)) {
            currentMatchIndex = 0;
        }
        currentMatchIndex = Math.max(0, Math.min(currentMatchIndex, matchQueue.length));
        manualMode = Boolean(parsedState.manualMode);

        const savedKnockout = parsedState.knockoutState;
        if (savedKnockout && savedKnockout.started) {
            knockoutState = {
                started: true,
                quarters: (savedKnockout.quarters || []).map((match) => hydrateKnockoutMatch(match)).filter(Boolean),
                semis: (savedKnockout.semis || []).map((match) => hydrateKnockoutMatch(match)).filter(Boolean),
                thirdPlace: hydrateKnockoutMatch(savedKnockout.thirdPlace),
                final: hydrateKnockoutMatch(savedKnockout.final),
                podium: savedKnockout.podium || null,
            };
        } else {
            knockoutState = resetKnockoutState();
        }

        return true;
    } catch (error) {
        console.warn('No se pudo cargar el estado local.', error);
        clearSavedState();
        return false;
    }
}

function getMatchKey(match) {
    if (!match) return '';
    return `${match.groupIndex}-${match.homeIndex}-${match.awayIndex}`;
}

function getVisualMatchKey(match) {
    if (!match) return '';
    return 'gr-' + getMatchKey(match);
}

function getMatchPalette(match) {
    const matchKey = getVisualMatchKey(match);
    if (!matchKey) return MATCH_PALETTES[0];
    if (!matchPaletteAssignments.has(matchKey)) {
        const usedIndexes = new Set(matchPaletteAssignments.values());
        let paletteIndex = MATCH_PALETTES.findIndex((_, index) => !usedIndexes.has(index));
        if (paletteIndex === -1) {
            paletteIndex = matchPaletteAssignments.size % MATCH_PALETTES.length;
        }
        matchPaletteAssignments.set(matchKey, paletteIndex);
    }
    return MATCH_PALETTES[matchPaletteAssignments.get(matchKey)] || MATCH_PALETTES[0];
}

function clearMatchPalette() {
    [matchPlayerAButton, matchPlayerBButton].forEach((element) => {
        if (!element) return;
        element.style.removeProperty('--match-card-base');
        element.style.removeProperty('--match-card-overlay');
        element.style.removeProperty('--match-card-border');
        element.style.removeProperty('--match-card-shadow');
    });
    if (versusChip) {
        versusChip.style.removeProperty('--vs-bg');
        versusChip.style.removeProperty('--vs-shadow');
    }
}

function applyMatchPalette(match) {
    if (!matchPlayerAButton || !matchPlayerBButton || !versusChip) return;
    if (!match) {
        clearMatchPalette();
        return;
    }

    const palette = getMatchPalette(match);
    matchPlayerAButton.style.setProperty('--match-card-base', palette.homeBase);
    matchPlayerAButton.style.setProperty('--match-card-overlay', palette.homeOverlay);
    matchPlayerAButton.style.setProperty('--match-card-border', palette.homeBorder);
    matchPlayerAButton.style.setProperty('--match-card-shadow', palette.homeShadow);
    matchPlayerBButton.style.setProperty('--match-card-base', palette.awayBase);
    matchPlayerBButton.style.setProperty('--match-card-overlay', palette.awayOverlay);
    matchPlayerBButton.style.setProperty('--match-card-border', palette.awayBorder);
    matchPlayerBButton.style.setProperty('--match-card-shadow', palette.awayShadow);
    versusChip.style.setProperty('--vs-bg', palette.vsBase);
    versusChip.style.setProperty('--vs-shadow', palette.vsShadow);
}

function getGroupBadge(groupIndex) {
    if (!Number.isInteger(groupIndex) || groupIndex < 0) return '?';
    return String.fromCharCode(65 + groupIndex);
}

function createPlayer(name) {
    return { name, points: 0, diff: 0 };
}

function getSlotLabel(slot) {
    return slot?.name || '—';
}

function getTotalCapacity() {
    return GROUPS.reduce((sum, group) => sum + group.slots.length, 0);
}

function renderMatchHistorySnapshot() {
    if (!matchHistoryList) return;

    matchHistoryList.innerHTML = '';
    if (!matchHistory.length) {
        const empty = document.createElement('p');
        empty.className = 'match-history-empty';
        empty.textContent = 'Todavía no hay enfrentamientos registrados.';
        matchHistoryList.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();

    matchHistory.forEach((entry, index) => {
        const match = entry?.match;
        if (!match) return;

        const group = GROUPS[match.groupIndex];
        const playerA = group?.slots?.[match.homeIndex];
        const playerB = group?.slots?.[match.awayIndex];
        const playerAName = playerA?.name || 'Jugador A';
        const playerBName = playerB?.name || 'Jugador B';
        const winnerIsHome = entry.winnerKey === 'home';
        const diff = Number(entry.diff) || 0;

        const card = document.createElement('article');
        card.className = 'match-history-item';

        const title = document.createElement('p');
        title.className = 'match-history-item__title';
        title.textContent = `Partido ${index + 1} · Grupo ${getGroupBadge(match.groupIndex)}`;

        const playersRow = document.createElement('div');
        playersRow.className = 'match-history-players';

        const homePlayer = document.createElement('span');
        homePlayer.className = `match-history-player ${winnerIsHome ? 'is-winner' : 'is-loser'}`;
        homePlayer.textContent = playerAName;

        const versus = document.createElement('span');
        versus.className = 'match-history-vs';
        versus.textContent = 'vs';

        const awayPlayer = document.createElement('span');
        awayPlayer.className = `match-history-player ${winnerIsHome ? 'is-loser' : 'is-winner'}`;
        awayPlayer.textContent = playerBName;

        const diffTag = document.createElement('span');
        diffTag.className = 'match-history-diff';
        diffTag.textContent = `Dif. ${diff}`;

        if (winnerIsHome) {
            homePlayer.appendChild(diffTag);
        } else {
            awayPlayer.appendChild(diffTag);
        }

        playersRow.append(homePlayer, versus, awayPlayer);
        card.append(title, playersRow);
        fragment.appendChild(card);
    });

    matchHistoryList.appendChild(fragment);
}

function updateMatchHistoryAvailability() {
    if (!toggleMatchHistoryButton || !matchHistoryPanel) return;

    const hasHistory = matchHistory.length > 0;
    toggleMatchHistoryButton.disabled = !hasHistory;

    if (!hasHistory) {
        matchHistoryPanel.hidden = true;
        toggleMatchHistoryButton.setAttribute('aria-expanded', 'false');
        toggleMatchHistoryButton.textContent = 'Ver enfrentamientos';
        return;
    }

    if (!matchHistoryPanel.hidden) {
        renderMatchHistorySnapshot();
    }
}

function toggleMatchHistoryPanel() {
    if (!toggleMatchHistoryButton || !matchHistoryPanel) return;
    if (toggleMatchHistoryButton.disabled) return;

    const willShow = matchHistoryPanel.hidden;
    if (willShow) {
        renderMatchHistorySnapshot();
    }

    matchHistoryPanel.hidden = !willShow;
    toggleMatchHistoryButton.setAttribute('aria-expanded', willShow ? 'true' : 'false');
    toggleMatchHistoryButton.textContent = willShow
        ? 'Ocultar enfrentamientos'
        : 'Ver enfrentamientos';
}

function getHeadToHeadWinnerSlot(groupIndex, slotIndexA, slotIndexB, historyEntries = matchHistory) {
    for (let historyIndex = historyEntries.length - 1; historyIndex >= 0; historyIndex -= 1) {
        const entry = historyEntries[historyIndex];
        const match = entry?.match;
        if (!match || match.groupIndex !== groupIndex) continue;

        const samePair = (
            (match.homeIndex === slotIndexA && match.awayIndex === slotIndexB)
            || (match.homeIndex === slotIndexB && match.awayIndex === slotIndexA)
        );
        if (!samePair) continue;

        return entry.winnerKey === 'home' ? match.homeIndex : match.awayIndex;
    }

    return null;
}

function getMiniTableStats(groupIndex, tiedEntries, historyEntries = matchHistory) {
    const tiedSlots = new Set(tiedEntries.map((entry) => entry.slotIndex));
    const stats = new Map();

    tiedEntries.forEach((entry) => {
        stats.set(entry.slotIndex, {
            points: 0,
            diff: 0,
            wins: 0,
            played: 0,
        });
    });

    historyEntries.forEach((entry) => {
        const match = entry?.match;
        if (!match || match.groupIndex !== groupIndex) return;
        if (!tiedSlots.has(match.homeIndex) || !tiedSlots.has(match.awayIndex)) return;

        const homeStats = stats.get(match.homeIndex);
        const awayStats = stats.get(match.awayIndex);
        if (!homeStats || !awayStats) return;

        const winnerSlot = entry.winnerKey === 'home' ? match.homeIndex : match.awayIndex;
        const loserSlot = winnerSlot === match.homeIndex ? match.awayIndex : match.homeIndex;
        const winnerStats = stats.get(winnerSlot);
        const loserStats = stats.get(loserSlot);
        if (!winnerStats || !loserStats) return;

        winnerStats.points += 1;
        winnerStats.wins += 1;
        winnerStats.played += 1;
        loserStats.played += 1;

        const margin = Number(entry.diff) || 0;
        if (margin > 0) {
            winnerStats.diff += margin;
            loserStats.diff -= margin;
        }
    });

    return stats;
}

function getOrderedPlayerEntries(group, groupIndex = -1, historyEntries = matchHistory, playerEntries = null) {
    const playersWithSlot = playerEntries
        ? playerEntries.map((entry) => ({
            slotIndex: entry.slotIndex,
            player: entry.player,
        }))
        : group.slots
            .map((player, slotIndex) => (player ? { player, slotIndex } : null))
            .filter(Boolean);

    playersWithSlot.sort((a, b) => {
        if (b.player.points !== a.player.points) return b.player.points - a.player.points;
        if (b.player.diff !== a.player.diff) return b.player.diff - a.player.diff;
        return a.player.name.localeCompare(b.player.name);
    });

    if (groupIndex >= 0) {
        let start = 0;
        while (start < playersWithSlot.length) {
            let end = start + 1;
            while (
                end < playersWithSlot.length
                && playersWithSlot[end].player.points === playersWithSlot[start].player.points
                && playersWithSlot[end].player.diff === playersWithSlot[start].player.diff
            ) {
                end += 1;
            }

            if (end - start > 1) {
                const tiedEntries = playersWithSlot.slice(start, end);
                const miniStats = getMiniTableStats(groupIndex, tiedEntries, historyEntries);

                tiedEntries.sort((a, b) => {
                    const statsA = miniStats.get(a.slotIndex) || { points: 0, diff: 0, wins: 0, played: 0 };
                    const statsB = miniStats.get(b.slotIndex) || { points: 0, diff: 0, wins: 0, played: 0 };

                    if (statsB.points !== statsA.points) return statsB.points - statsA.points;
                    if (statsB.diff !== statsA.diff) return statsB.diff - statsA.diff;
                    if (statsB.wins !== statsA.wins) return statsB.wins - statsA.wins;

                    const winnerSlot = getHeadToHeadWinnerSlot(groupIndex, a.slotIndex, b.slotIndex, historyEntries);
                    if (winnerSlot === a.slotIndex) return -1;
                    if (winnerSlot === b.slotIndex) return 1;

                    return a.player.name.localeCompare(b.player.name);
                });

                playersWithSlot.splice(start, end - start, ...tiedEntries);
            }

            start = end;
        }
    }

    return playersWithSlot;
}

function getOrderedPlayers(group, groupIndex = -1, historyEntries = matchHistory, playerEntries = null) {
    return getOrderedPlayerEntries(group, groupIndex, historyEntries, playerEntries).map((entry) => entry.player);
}

function getAllPlayers() {
    return GROUPS.flatMap((group) => group.slots.filter(Boolean));
}

function getPendingGroupMatches(groupIndex) {
    return matchQueue.slice(currentMatchIndex).filter((match) => match.groupIndex === groupIndex);
}

function createSimulatedGroupEntries(group) {
    return group.slots
        .map((player, slotIndex) => (player
            ? {
                slotIndex,
                player: { ...player },
            }
            : null))
        .filter(Boolean);
}

function cloneSimulatedGroupEntries(entries) {
    return entries.map((entry) => ({
        slotIndex: entry.slotIndex,
        player: { ...entry.player },
    }));
}

function applySimulatedMatchResult(entries, match, winnerKey, diff) {
    const homeEntry = entries.find((entry) => entry.slotIndex === match.homeIndex);
    const awayEntry = entries.find((entry) => entry.slotIndex === match.awayIndex);
    if (!homeEntry || !awayEntry) return false;

    const winnerEntry = winnerKey === 'home' ? homeEntry : awayEntry;
    const loserEntry = winnerKey === 'home' ? awayEntry : homeEntry;

    winnerEntry.player.points += 1;
    if (diff > 0) {
        winnerEntry.player.diff += diff;
        loserEntry.player.diff -= diff;
    }

    return true;
}

function createSimulatedHistoryEntry(match, winnerKey, diff) {
    return {
        match: { ...match },
        winnerKey,
        diff,
    };
}

function canPlayerStillQualify(entries, pendingMatches, historyEntries, group, groupIndex, targetSlotIndex, matchIndex = 0) {
    if (matchIndex >= pendingMatches.length) {
        const orderedEntries = getOrderedPlayerEntries(group, groupIndex, historyEntries, entries);
        return orderedEntries.slice(0, 2).some((entry) => entry.slotIndex === targetSlotIndex);
    }

    const match = pendingMatches[matchIndex];
    const winnerOrder = match.homeIndex === targetSlotIndex
        ? ['home', 'away']
        : (match.awayIndex === targetSlotIndex ? ['away', 'home'] : ['home', 'away']);

    for (const winnerKey of winnerOrder) {
        const diffRange = winnerKey === 'home'
            ? (match.homeIndex === targetSlotIndex ? { start: MAX_MATCH_DIFF, end: 0, step: -1 } : { start: 0, end: MAX_MATCH_DIFF, step: 1 })
            : (match.awayIndex === targetSlotIndex ? { start: MAX_MATCH_DIFF, end: 0, step: -1 } : { start: 0, end: MAX_MATCH_DIFF, step: 1 });

        for (let diff = diffRange.start; diffRange.step > 0 ? diff <= diffRange.end : diff >= diffRange.end; diff += diffRange.step) {
            const nextEntries = cloneSimulatedGroupEntries(entries);
            if (!applySimulatedMatchResult(nextEntries, match, winnerKey, diff)) continue;

            const nextHistoryEntries = historyEntries.concat(createSimulatedHistoryEntry(match, winnerKey, diff));
            if (canPlayerStillQualify(nextEntries, pendingMatches, nextHistoryEntries, group, groupIndex, targetSlotIndex, matchIndex + 1)) {
                return true;
            }
        }
    }

    return false;
}

function canPlayerMissQualification(entries, pendingMatches, historyEntries, group, groupIndex, targetSlotIndex, matchIndex = 0) {
    if (matchIndex >= pendingMatches.length) {
        const orderedEntries = getOrderedPlayerEntries(group, groupIndex, historyEntries, entries);
        return !orderedEntries.slice(0, 2).some((entry) => entry.slotIndex === targetSlotIndex);
    }

    const match = pendingMatches[matchIndex];
    const winnerOrder = match.homeIndex === targetSlotIndex
        ? ['away', 'home']
        : (match.awayIndex === targetSlotIndex ? ['home', 'away'] : ['home', 'away']);

    for (const winnerKey of winnerOrder) {
        const diffRange = winnerKey === 'home'
            ? (match.homeIndex === targetSlotIndex ? { start: 0, end: MAX_MATCH_DIFF, step: 1 } : { start: MAX_MATCH_DIFF, end: 0, step: -1 })
            : (match.awayIndex === targetSlotIndex ? { start: 0, end: MAX_MATCH_DIFF, step: 1 } : { start: MAX_MATCH_DIFF, end: 0, step: -1 });

        for (let diff = diffRange.start; diffRange.step > 0 ? diff <= diffRange.end : diff >= diffRange.end; diff += diffRange.step) {
            const nextEntries = cloneSimulatedGroupEntries(entries);
            if (!applySimulatedMatchResult(nextEntries, match, winnerKey, diff)) continue;

            const nextHistoryEntries = historyEntries.concat(createSimulatedHistoryEntry(match, winnerKey, diff));
            if (canPlayerMissQualification(nextEntries, pendingMatches, nextHistoryEntries, group, groupIndex, targetSlotIndex, matchIndex + 1)) {
                return true;
            }
        }
    }

    return false;
}

function getStandingsVisualState(group, groupIndex, player, rankingIndex) {
    const slotIndex = group.slots.findIndex((slot) => slot === player);
    if (slotIndex < 0) {
        return 'rank-contender';
    }

    const currentEntries = getOrderedPlayerEntries(group, groupIndex);
    const pendingMatches = getPendingGroupMatches(groupIndex);
    const groupHistoryEntries = matchHistory.filter((entry) => entry?.match?.groupIndex === groupIndex);
    const simulatedEntries = createSimulatedGroupEntries(group);
    const isCurrentlyQualified = currentEntries.slice(0, 2).some((entry) => entry.slotIndex === slotIndex);

    if (isCurrentlyQualified) {
        const canLoseQualification = canPlayerMissQualification(
            simulatedEntries,
            pendingMatches,
            groupHistoryEntries,
            group,
            groupIndex,
            slotIndex
        );

        if (canLoseQualification) {
            return 'rank-top-live';
        }

        return rankingIndex === 0 ? 'rank-first' : 'rank-second';
    }

    const hasQualificationPath = canPlayerStillQualify(
        simulatedEntries,
        pendingMatches,
        groupHistoryEntries,
        group,
        groupIndex,
        slotIndex
    );

    return hasQualificationPath ? 'rank-contender' : 'rank-eliminated';
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
    saveState();
}

function refreshUI() {
    renderGroups();
    updateCapacityUI();
    updateStandings();
    refreshManualControls();
}

function normalizeParticipantName(name) {
    if (!name) {
        return name;
    }

    return name.charAt(0).toLocaleUpperCase() + name.slice(1);
}

function addParticipant() {
    const name = normalizeParticipantName(nameInput.value.trim());
    if (!name) {
        helperText.textContent = 'Ingresá un nombre válido para continuar.';
        return;
    }

    if (totalParticipants >= getTotalCapacity()) {
        helperText.textContent = 'El sorteo ya está completo.';
        return;
    }

    const wasAssigned = totalParticipants === 0
        ? assignParticipantAutomatically(name)
        : (manualMode ? assignParticipantManually(name) : assignParticipantAutomatically(name));

    if (!wasAssigned) {
        return;
    }

    totalParticipants += 1;
    knockoutState = resetKnockoutState();
    hideKnockoutStage();
    refreshUI();
    rebuildMatchQueue();
    nameInput.value = '';
    nameInput.focus();
    saveState();
}

function assignParticipantAutomatically(name) {
    const isFirstParticipant = totalParticipants === 0;

    if (isFirstParticipant) {
        GROUPS[0].slots[0] = createPlayer(name);
        return true;
    }

    const availableGroups = GROUPS.map((group, groupIndex) => {
        const firstEmptySlotIndex = group.slots.findIndex((slot) => !slot);
        return { groupIndex, firstEmptySlotIndex };
    }).filter((group) => group.firstEmptySlotIndex >= 0);

    if (!availableGroups.length) {
        helperText.textContent = 'Ya no quedan espacios disponibles.';
        refreshUI();
        return false;
    }

    const randomGroup = availableGroups[Math.floor(Math.random() * availableGroups.length)];
    GROUPS[randomGroup.groupIndex].slots[randomGroup.firstEmptySlotIndex] = createPlayer(name);
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
    clearSavedState();
}

function resetGroupStageStats() {
    GROUPS.forEach((group) => {
        group.slots.forEach((player) => {
            if (!player) return;
            player.points = 0;
            player.diff = 0;
        });
    });
}

function applyGroupStageResult(entry) {
    const match = entry?.match;
    if (!match) return false;

    const group = GROUPS[match.groupIndex];
    if (!group) return false;

    const playerA = group.slots[match.homeIndex];
    const playerB = group.slots[match.awayIndex];
    if (!playerA || !playerB) return false;

    const winner = entry.winnerKey === 'home' ? playerA : playerB;
    const loser = entry.winnerKey === 'home' ? playerB : playerA;
    const diff = Number(entry.diff) || 0;

    winner.points += 1;
    if (diff > 0) {
        winner.diff += diff;
        loser.diff -= diff;
    }

    return true;
}

function isMatchPlayable(match) {
    if (!match) return false;
    const group = GROUPS[match.groupIndex];
    if (!group) return false;
    return Boolean(group.slots[match.homeIndex] && group.slots[match.awayIndex]);
}

function removeParticipantFromSlot(groupIndex, slotIndex) {
    const group = GROUPS[groupIndex];
    if (!group) return;

    const slot = group.slots[slotIndex];
    if (!slot) return;

    group.slots[slotIndex] = null;
    totalParticipants = Math.max(0, totalParticipants - 1);
    knockoutState = resetKnockoutState();
    hideKnockoutStage();

    refreshUI();
    helperText.textContent = `${slot.name} fue retirado del ${group.name}. El campeonato continúa.`;
    rebuildMatchQueue(true);
    saveState();
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
    saveState();
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
    saveState();
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
        const headerInfo = document.createElement('div');
        headerInfo.className = 'standings-card__heading';
        const title = document.createElement('h3');
        title.textContent = group.name;
        const subtitle = document.createElement('p');
        subtitle.className = 'standings-card__subtitle';
        subtitle.textContent = 'Clasificaci\u00f3n parcial';
        headerInfo.append(title, subtitle);
        const badge = document.createElement('span');
        badge.className = 'badge badge--standings';
        badge.textContent = String.fromCharCode(65 + groupIndex);
        header.append(headerInfo, badge);
        card.appendChild(header);

        const players = getOrderedPlayers(group, groupIndex);

        if (!players.length) {
            const empty = document.createElement('p');
            empty.className = 'standings-empty';
            empty.textContent = 'Sin jugadores todav\u00eda.';
            card.appendChild(empty);
        } else {
            const list = document.createElement('ol');
            list.className = 'standings-list';
            list.start = 1;

            players.forEach((player, index) => {
                const row = document.createElement('li');
                row.className = 'standings-row';
                const visualState = getStandingsVisualState(group, groupIndex, player, index);
                if (visualState === 'rank-first' || visualState === 'rank-second') {
                    row.classList.add('rank-top', visualState);
                } else {
                    row.classList.add(visualState);
                }

                const rankChip = document.createElement('span');
                rankChip.className = 'standings-rank-chip';
                rankChip.textContent = index + 1;

                const playerInfo = document.createElement('div');
                playerInfo.className = 'standings-player';
                const nameSpan = document.createElement('span');
                nameSpan.className = 'standings-player-name';
                nameSpan.textContent = player.name;
                playerInfo.appendChild(nameSpan);

                const stats = document.createElement('div');
                stats.className = 'standings-stats';
                const pointsText = document.createElement('span');
                pointsText.className = 'standings-stat standings-stat--points';
                pointsText.textContent = `${player.points} pts`;
                const diffText = document.createElement('span');
                diffText.classList.add('standings-stat', 'standings-diff');
                if (player.diff > 0) {
                    diffText.classList.add('standings-diff--positive');
                    diffText.textContent = `+${player.diff} dif`;
                } else if (player.diff < 0) {
                    diffText.classList.add('standings-diff--negative');
                    diffText.textContent = `${player.diff} dif`;
                } else {
                    diffText.classList.add('standings-diff--neutral');
                    diffText.textContent = '0 dif';
                }
                stats.append(pointsText, diffText);

                row.append(rankChip, playerInfo, stats);
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
    const enoughPlayersPerGroup = GROUPS.every((group, groupIndex) => getOrderedPlayers(group, groupIndex).length >= 2);
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
    const rankings = GROUPS.map((group, groupIndex) => getOrderedPlayers(group, groupIndex));
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
    saveState();
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
        if (index === 0) {
            row.classList.add('performance-row--top-1');
        } else if (index <= 3) {
            row.classList.add('performance-row--top-4');
        } else if (index <= 7) {
            row.classList.add('performance-row--top-8');
        } else {
            row.classList.add('performance-row--rest');
        }

        if (player === champion) {
            row.classList.add('highlight');
        }

        const positionCell = document.createElement('td');
        positionCell.classList.add('performance-rank');
        if (index === 0) {
            positionCell.classList.add('performance-rank--top-1');
        } else if (index <= 3) {
            positionCell.classList.add('performance-rank--top-4');
        } else if (index <= 7) {
            positionCell.classList.add('performance-rank--top-8');
        } else {
            positionCell.classList.add('performance-rank--rest');
        }
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
    saveState();
}

function rebuildMatchQueue(preserveProgress = true) {
    const maxSlots = Math.max(...GROUPS.map((group) => group.slots.length));
    if (!Number.isFinite(maxSlots)) {
        matchQueue = [];
        currentMatchIndex = 0;
        matchHistory = [];
        updateMatchUI();
        updateUndoState();
        return;
    }

    const groupActiveSlots = GROUPS.map((group) => group.slots
        .map((slot, slotIndex) => (slot ? slotIndex : -1))
        .filter((slotIndex) => slotIndex >= 0));
    const maxPlayersInGroup = Math.max(...groupActiveSlots.map((slots) => slots.length), 0);

    const newQueue = [];
    for (let rankGap = 1; rankGap < maxPlayersInGroup; rankGap += 1) {
        for (let homeRankIndex = 0; homeRankIndex + rankGap < maxPlayersInGroup; homeRankIndex += 1) {
            GROUPS.forEach((_, groupIndex) => {
                const activeSlots = groupActiveSlots[groupIndex];
                if (!activeSlots || homeRankIndex + rankGap >= activeSlots.length) return;

                const homeIndex = activeSlots[homeRankIndex];
                const awayIndex = activeSlots[homeRankIndex + rankGap];

                newQueue.push({
                    groupIndex,
                    homeIndex,
                    awayIndex,
                    homeRank: homeRankIndex + 1,
                    awayRank: homeRankIndex + rankGap + 1,
                });
            });
        }
    }

    const availableMatchKeys = new Set(newQueue.map((match) => getMatchKey(match)));

    if (!preserveProgress) {
        matchQueue = newQueue;
        currentMatchIndex = 0;
        matchHistory = [];
        resetGroupStageStats();
        updateMatchUI();
        updateUndoState();
        return;
    }

    const hasStartedGroupStage = matchHistory.length > 0;
    const currentMatch = hasStartedGroupStage ? (matchQueue[currentMatchIndex] || null) : null;
    const currentMatchKey = getMatchKey(currentMatch);
    const filteredHistory = matchHistory.filter((entry) => {
        const match = entry?.match;
        if (!match) return false;
        if (!availableMatchKeys.has(getMatchKey(match))) return false;
        return isMatchPlayable(match);
    });
    const completedKeys = new Set(filteredHistory.map((entry) => getMatchKey(entry.match)));

    const matchesByKey = new Map(newQueue.map((match) => [getMatchKey(match), match]));
    const completedMatches = filteredHistory
        .map((entry) => matchesByKey.get(getMatchKey(entry.match)))
        .filter(Boolean);
    const pendingMatches = newQueue.filter((match) => !completedKeys.has(getMatchKey(match)));

    // Keep the currently displayed match as the next one only after the group stage has started.
    if (currentMatchKey && pendingMatches.length) {
        const currentPendingIndex = pendingMatches.findIndex((match) => getMatchKey(match) === currentMatchKey);
        if (currentPendingIndex > 0) {
            const [anchoredMatch] = pendingMatches.splice(currentPendingIndex, 1);
            pendingMatches.unshift(anchoredMatch);
        }
    }

    matchQueue = [...completedMatches, ...pendingMatches];
    currentMatchIndex = completedMatches.length;
    matchHistory = filteredHistory;
    resetGroupStageStats();
    matchHistory = matchHistory.filter((entry) => applyGroupStageResult(entry));
    currentMatchIndex = Math.min(currentMatchIndex, matchHistory.length);
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
    updateMatchHistoryAvailability();
}

function updateMatchUI() {
    updateKnockoutButtonState();
    const match = matchQueue[currentMatchIndex];
    const availableMatch = Boolean(match);

    diffInput.disabled = !availableMatch;
    matchPlayerAButton.disabled = !availableMatch;
    matchPlayerBButton.disabled = !availableMatch;
    if (postponeMatchButton) {
        const canPostpone = availableMatch && currentMatchIndex < matchQueue.length - 1;
        postponeMatchButton.disabled = !canPostpone;
    }

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
        clearMatchPalette();
        return;
    }

    const group = GROUPS[match.groupIndex];
    const playerA = group.slots[match.homeIndex];
    const playerB = group.slots[match.awayIndex];

    const homeRankLabel = Number.isFinite(match.homeRank) ? match.homeRank : match.homeIndex + 1;
    const awayRankLabel = Number.isFinite(match.awayRank) ? match.awayRank : match.awayIndex + 1;
    currentMatchLabel.textContent = `${group.name}: Posición ${homeRankLabel} vs Posición ${awayRankLabel}`;
    matchPlayerAButton.textContent = getSlotLabel(playerA);
    matchPlayerBButton.textContent = getSlotLabel(playerB);
    applyMatchPalette(match);
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
    saveState();
}

function postponeCurrentMatch() {
    if (!postponeMatchButton) return;
    if (currentMatchIndex >= matchQueue.length - 1) return;

    const [postponedMatch] = matchQueue.splice(currentMatchIndex, 1);
    if (!postponedMatch) return;

    matchQueue.push(postponedMatch);
    updateMatchUI();
    saveState();
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
    saveState();
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
if (postponeMatchButton) {
    postponeMatchButton.addEventListener('click', postponeCurrentMatch);
}
if (toggleMatchHistoryButton) {
    toggleMatchHistoryButton.addEventListener('click', toggleMatchHistoryPanel);
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

loadSavedState();
populateGroupOptions();
refreshUI();
resetMatchControls();
updateUndoState();
if (knockoutState.started) {
    renderKnockoutStage();
}



