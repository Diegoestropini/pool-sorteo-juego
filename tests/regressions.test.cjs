const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
function setup() {
    function element() {
        return {
            value: 0, textContent: '', dataset: {}, children: [],
            classList: { add() {}, remove() {}, toggle() {} },
            style: { setProperty() {}, removeProperty() {} },
            append(...children) { this.children.push(...children); },
            appendChild(child) { this.children.push(child); },
            setAttribute() {}, focus() {},
        };
    }
    const saved = new Map();
    const context = vm.createContext({
        assert, console,
        document: { getElementById: element, querySelector: element, createElement: element },
        localStorage: {
            setItem(key, value) { saved.set(key, value); },
            getItem(key) { return saved.get(key) || null; },
            removeItem(key) { saved.delete(key); },
        },
    });
    vm.runInContext(source.split("addButton.addEventListener('click', addParticipant);")[0], context);
    vm.runInContext(`
        renderGroups = () => {};
        updateCapacityUI = () => {};
        refreshManualControls = () => {};
        renderKnockoutStage = () => {};
        updateUndoState = () => {};
        applyMatchPalette = () => {};
        clearMatchPalette = () => {};
        updateTournamentPresentation = () => {};
    `, context);
    return (code) => vm.runInContext(code, context, { timeout: 2000 });
}

test('five-player guaranteed qualifier is resolved without enumerating matches', () => {
    setup()(`
        GROUPS[0].slots = Array.from({ length: 5 }, (_, i) => createPlayer('P' + i));
        rebuildMatchQueue();
        matchHistory = matchQueue.filter(m => m.homeIndex === 0)
            .map(match => ({ match, winnerKey: 'home', diff: 1 }));
        rebuildMatchQueue();
        const budget = { remaining: 1, deadline: Infinity };
        assert.equal(getPendingGroupMatches(0).length, 6);
        assert.equal(getStandingsVisualState(GROUPS[0], 0, GROUPS[0].slots[0], 0, budget), 'rank-first');
        assert.equal(budget.remaining, 1);
        updateStandings();
    `);
});

test('exhausted search keeps unresolved players provisional', () => {
    setup()(`
        GROUPS[0].slots = ['Ana', 'Beto', 'Caro'].map(createPlayer);
        rebuildMatchQueue();
        const budget = { remaining: 0, deadline: Infinity };
        assert.equal(getStandingsVisualState(GROUPS[0], 0, GROUPS[0].slots[0], 0, budget), 'rank-top-live');
        assert.equal(getStandingsVisualState(GROUPS[0], 0, GROUPS[0].slots[2], 2, budget), 'rank-contender');
        const expired = { remaining: 6000, deadline: 0 };
        assert.equal(canPlayerStillQualify(createSimulatedGroupEntries(GROUPS[0]), matchQueue, [], GROUPS[0], 0, 2, 0, expired), null);
    `);
});

test('bounded search agrees with exhaustive outcomes when it proves a result', () => {
    setup()(`
        GROUPS[0].slots = ['Ana', 'Beto', 'Caro'].map(createPlayer);
        rebuildMatchQueue();
        const allMatches = matchQueue.slice();
        function exhaustive(entries, pending, history, target) {
            if (!pending.length) {
                return new Set([getOrderedPlayerEntries(GROUPS[0], 0, history, entries)
                    .slice(0, 2).some(e => e.slotIndex === target)]);
            }
            const outcomes = new Set();
            for (const winnerKey of ['home', 'away']) {
                for (let diff = 0; diff <= 7; diff++) {
                    const next = cloneSimulatedGroupEntries(entries);
                    applySimulatedMatchResult(next, pending[0], winnerKey, diff);
                    for (const result of exhaustive(next, pending.slice(1), history.concat({match: pending[0], winnerKey, diff}), target)) outcomes.add(result);
                }
            }
            return outcomes;
        }
        for (const winnerKey of ['home', 'away']) {
            for (const diff of [0, 1, 7]) {
                const entries = createSimulatedGroupEntries(GROUPS[0]);
                applySimulatedMatchResult(entries, allMatches[0], winnerKey, diff);
                const history = [{ match: allMatches[0], winnerKey, diff }];
                for (let target = 0; target < 3; target++) {
                    const expected = exhaustive(entries, allMatches.slice(1), history, target);
                    for (const wants of [true, false]) {
                        const actual = searchQualification(entries, allMatches.slice(1), history, GROUPS[0], 0, target, wants, 0, { remaining: 100000, deadline: Infinity });
                        assert.equal(actual, expected.has(wants));
                    }
                }
            }
        }
    `);
});

test('undo invalidates finals and new bracket uses corrected qualifiers, including after reload', () => {
    setup()(`
        GROUPS.forEach((g, i) => g.slots = ['A', 'B', 'C'].map(n => createPlayer(n + i)));
        rebuildMatchQueue();
        while (currentMatchIndex < matchQueue.length) { diffInput.value = 1; registerMatchResult('home'); }
        startKnockoutStage();
        knockoutState.quarters[0].winnerIndex = 0;
        updateSemifinalsFromQuarters();
        undoLastMatch();
        assert.equal(knockoutState.started, false);
        assert.equal(knockoutStage.hidden, true);
        assert.equal(playFinalsButton.disabled, true);
        assert.equal(loadSavedState(), true);
        assert.equal(knockoutState.started, false);
        diffInput.value = 7;
        registerMatchResult('away');
        assert.equal(playFinalsButton.disabled, false);
        startKnockoutStage();
        assert.equal(knockoutState.quarters[3].players[0].name, 'C3');
        assert.ok(knockoutState.quarters.every(m => m.winnerIndex === null));
        assert.equal(loadSavedState(), true);
        assert.equal(knockoutState.quarters[3].players[0].name, 'C3');
    `);
});

test('removing a player renders recalculated statistics and preserves unrelated results', () => {
    setup()(`
        GROUPS[0].slots = ['Ana', 'Beto', 'Caro'].map(createPlayer);
        rebuildMatchQueue();
        diffInput.value = 3; registerMatchResult('home');
        postponeCurrentMatch();
        diffInput.value = 2; registerMatchResult('home');
        let rendered;
        const render = updateStandings;
        updateStandings = () => { render(); rendered = GROUPS[0].slots.filter(Boolean).map(p => ({...p})); };
        removeParticipantFromSlot(0, 1);
        assert.equal(rendered[0].points, 1);
        assert.equal(rendered[0].diff, 2);
        assert.equal(rendered[1].diff, -2);
        assert.equal(matchHistory.length, 1);
        assert.equal(loadSavedState(), true);
        assert.equal(GROUPS[0].slots[0].diff, 2);
    `);
});

test('postponing resets the margin and undo restores the recorded margin', () => {
    setup()(`
        GROUPS[0].slots = ['Ana', 'Beto', 'Caro'].map(createPlayer);
        rebuildMatchQueue();
        diffInput.value = 7;
        postponeCurrentMatch();
        assert.equal(Number(diffInput.value), 0);
        assert.equal(String(diffValue.textContent), '0');
        registerMatchResult('home');
        assert.equal(matchHistory[0].diff, 0);
        diffInput.value = 4;
        registerMatchResult('away');
        undoLastMatch();
        assert.equal(Number(diffInput.value), 4);
    `);
});

test('result is saved before rendering standings', () => {
    setup()(`
        GROUPS[0].slots = ['Ana', 'Beto'].map(createPlayer);
        rebuildMatchQueue();
        updateStandings = () => {
            assert.equal(JSON.parse(localStorage.getItem(STORAGE_KEY)).matchHistory.length, 1);
        };
        registerMatchResult('home');
    `);
});

test('journey follows results, corrections and restored finals', () => {
    setup()(`
        assert.equal(getTournamentStage(), 0);
        GROUPS.forEach((g, i) => g.slots = ['A', 'B', 'C'].map(n => createPlayer(n + i)));
        totalParticipants = 12;
        rebuildMatchQueue();
        assert.equal(getTournamentStage(), 1);
        while (currentMatchIndex < matchQueue.length) registerMatchResult('home');
        startKnockoutStage();
        assert.equal(getTournamentStage(), 2);
        knockoutState.quarters.forEach(m => registerKnockoutWinner('quarters', m.id, 0));
        assert.equal(getTournamentStage(), 3);
        knockoutState.semis.forEach(m => registerKnockoutWinner('semis', m.id, 0));
        assert.equal(getTournamentStage(), 4);
        registerKnockoutWinner('quarters', 'E', 1);
        assert.equal(getTournamentStage(), 3);
        assert.equal(getMatchWinner(knockoutState.final), null);
        assert.equal(loadSavedState(), true);
        assert.equal(getTournamentStage(), 3);
        undoLastMatch();
        assert.equal(getTournamentStage(), 1);
    `);
});

test('audience queue follows postponement and only presents ready knockout matches as playable', () => {
    setup()(`
        GROUPS.forEach((g, i) => g.slots = ['A', 'B', 'C'].map(n => createPlayer(n + i)));
        rebuildMatchQueue();
        assert.equal(getPresentationMatches()[0].players[0], 'A0');
        postponeCurrentMatch();
        assert.equal(getPresentationMatches()[0].players[0], 'A1');
        while (currentMatchIndex < matchQueue.length) registerMatchResult('home');
        startKnockoutStage();
        assert.equal(getPresentationMatches().length, 8);
        assert.equal(getPresentationMatches().filter(m => m.ready).length, 4);
        knockoutState.quarters.forEach(m => registerKnockoutWinner('quarters', m.id, 0));
        assert.equal(getPresentationMatches()[0].label, 'Semifinal 1');
        assert.equal(getPresentationMatches().filter(m => m.ready).length, 2);
        knockoutState.semis.forEach(m => registerKnockoutWinner('semis', m.id, 0));
        registerKnockoutWinner('thirdPlace', 'THIRD', 0);
        assert.equal(getPresentationMatches()[0].label, 'Final');
        registerKnockoutWinner('final', 'FINAL', 0);
        assert.equal(getPresentationMatches().length, 0);
    `);
});
