// Prioritization Matrix App

(function() {
    'use strict';

    // Constants
    const MAX_ITEMS = 10;
    const MIN_ITEMS = 2;
    const STORAGE_KEY = 'prioritization-matrix-state';
    const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    // State
    let state = {
        items: [],           // [{id: 'A', name: 'Item 1'}, ...]
        comparisons: {},     // {'A-B': 'A', 'A-C': 'B', ...}
        comparisonPairs: [], // [['A', 'B'], ['A', 'C'], ...]
        currentComparison: 0,
        phase: 'input'       // 'input' | 'comparing' | 'results'
    };

    // DOM Elements
    const elements = {
        itemInput: document.getElementById('item-input'),
        addBtn: document.getElementById('add-btn'),
        itemsList: document.getElementById('items-list'),
        startBtn: document.getElementById('start-btn'),
        itemHint: document.getElementById('item-hint'),
        inputSection: document.getElementById('input-section'),
        itemsSection: document.getElementById('items-section'),
        comparisonSection: document.getElementById('comparison-section'),
        resultsSection: document.getElementById('results-section'),
        progressText: document.getElementById('progress-text'),
        progressFill: document.getElementById('progress-fill'),
        optionA: document.getElementById('option-a'),
        optionB: document.getElementById('option-b'),
        resultsList: document.getElementById('results-list'),
        clearBtn: document.getElementById('clear-btn')
    };

    // Initialize
    function init() {
        loadFromStorage();
        bindEvents();
        render();
    }

    // Event Bindings
    function bindEvents() {
        elements.addBtn.addEventListener('click', handleAddItem);
        elements.itemInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleAddItem();
        });
        elements.startBtn.addEventListener('click', startComparisons);
        elements.optionA.addEventListener('click', () => handleChoice('A'));
        elements.optionB.addEventListener('click', () => handleChoice('B'));
        elements.clearBtn.addEventListener('click', handleClearAll);
    }

    // Add Item
    function handleAddItem() {
        const name = elements.itemInput.value.trim();

        if (!name) return;

        if (state.items.length >= MAX_ITEMS) {
            alert(`Maximum of ${MAX_ITEMS} items allowed.`);
            return;
        }

        const id = LABELS[state.items.length];
        state.items.push({ id, name });

        elements.itemInput.value = '';
        elements.itemInput.focus();

        saveToStorage();
        render();
    }

    // Remove Item
    function removeItem(id) {
        state.items = state.items.filter(item => item.id !== id);

        // Re-assign IDs to maintain A, B, C order
        state.items = state.items.map((item, index) => ({
            ...item,
            id: LABELS[index]
        }));

        // Clear comparisons since item IDs changed
        state.comparisons = {};
        state.comparisonPairs = [];
        state.currentComparison = 0;
        state.phase = 'input';

        saveToStorage();
        render();
    }

    // Generate Comparisons
    function generateComparisons() {
        const pairs = [];
        for (let i = 0; i < state.items.length; i++) {
            for (let j = i + 1; j < state.items.length; j++) {
                pairs.push([state.items[i].id, state.items[j].id]);
            }
        }
        return pairs;
    }

    // Start Comparisons
    function startComparisons() {
        if (state.items.length < MIN_ITEMS) {
            alert(`At least ${MIN_ITEMS} items required.`);
            return;
        }

        state.comparisonPairs = generateComparisons();
        state.comparisons = {};
        state.currentComparison = 0;
        state.phase = 'comparing';

        saveToStorage();
        render();
    }

    // Handle Choice
    function handleChoice(choice) {
        const pair = state.comparisonPairs[state.currentComparison];
        const pairKey = `${pair[0]}-${pair[1]}`;
        const winnerId = choice === 'A' ? pair[0] : pair[1];

        state.comparisons[pairKey] = winnerId;
        state.currentComparison++;

        if (state.currentComparison >= state.comparisonPairs.length) {
            state.phase = 'results';
        }

        saveToStorage();
        render();
    }

    // Calculate Results
    function calculateResults() {
        const wins = {};

        // Initialize wins count
        state.items.forEach(item => {
            wins[item.id] = 0;
        });

        // Count wins
        Object.values(state.comparisons).forEach(winnerId => {
            wins[winnerId]++;
        });

        // Create results array with ranks
        const results = state.items.map(item => ({
            id: item.id,
            name: item.name,
            wins: wins[item.id]
        }));

        // Sort by wins (descending)
        results.sort((a, b) => b.wins - a.wins);

        // Assign ranks (handle ties)
        let currentRank = 1;
        results.forEach((result, index) => {
            if (index > 0 && result.wins < results[index - 1].wins) {
                currentRank = index + 1;
            }
            result.rank = currentRank;
        });

        return results;
    }

    // Clear All
    function handleClearAll() {
        if (!confirm('Are you sure you want to clear all data?')) return;

        state = {
            items: [],
            comparisons: {},
            comparisonPairs: [],
            currentComparison: 0,
            phase: 'input'
        };

        saveToStorage();
        render();
        elements.itemInput.focus();
    }

    // LocalStorage
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save state:', e);
        }
    }

    function loadFromStorage() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Validate structure
                if (parsed && Array.isArray(parsed.items)) {
                    state = {
                        items: parsed.items || [],
                        comparisons: parsed.comparisons || {},
                        comparisonPairs: parsed.comparisonPairs || [],
                        currentComparison: parsed.currentComparison || 0,
                        phase: parsed.phase || 'input'
                    };
                }
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
            // Reset to default state on error
            state = {
                items: [],
                comparisons: {},
                comparisonPairs: [],
                currentComparison: 0,
                phase: 'input'
            };
        }
    }

    // Render
    function render() {
        renderItemsList();
        renderComparison();
        renderResults();
        updateUI();
    }

    function renderItemsList() {
        elements.itemsList.innerHTML = state.items.map(item => `
            <li>
                <span class="item-label">${item.id}:</span>
                <span class="item-name">${escapeHtml(item.name)}</span>
                <button class="btn-delete" data-id="${item.id}" title="Remove item">&times;</button>
            </li>
        `).join('');

        // Bind delete buttons
        elements.itemsList.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => removeItem(btn.dataset.id));
        });
    }

    function renderComparison() {
        if (state.phase !== 'comparing') return;

        const pair = state.comparisonPairs[state.currentComparison];
        const itemA = state.items.find(i => i.id === pair[0]);
        const itemB = state.items.find(i => i.id === pair[1]);

        const total = state.comparisonPairs.length;
        const current = state.currentComparison + 1;
        const percentage = (state.currentComparison / total) * 100;

        elements.progressText.textContent = `Comparison ${current} of ${total}`;
        elements.progressFill.style.width = `${percentage}%`;
        elements.optionA.textContent = itemA.name;
        elements.optionB.textContent = itemB.name;
    }

    function renderResults() {
        if (state.phase !== 'results') return;

        const results = calculateResults();

        elements.resultsList.innerHTML = results.map(result => `
            <li>
                <span class="rank">${result.rank}.</span>
                <span class="result-name">${escapeHtml(result.name)}</span>
                <span class="win-count">${result.wins} win${result.wins !== 1 ? 's' : ''}</span>
            </li>
        `).join('');
    }

    function updateUI() {
        const itemCount = state.items.length;
        const canStart = itemCount >= MIN_ITEMS;
        const canAdd = itemCount < MAX_ITEMS;

        // Update hint
        if (itemCount === 0) {
            elements.itemHint.textContent = `Add ${MIN_ITEMS}-${MAX_ITEMS} items to start comparisons`;
        } else if (itemCount < MIN_ITEMS) {
            elements.itemHint.textContent = `Add ${MIN_ITEMS - itemCount} more item${MIN_ITEMS - itemCount > 1 ? 's' : ''} to start`;
        } else {
            const comparisons = (itemCount * (itemCount - 1)) / 2;
            elements.itemHint.textContent = `${itemCount} items = ${comparisons} comparisons`;
        }

        // Update buttons
        elements.startBtn.disabled = !canStart || state.phase !== 'input';
        elements.addBtn.disabled = !canAdd;
        elements.itemInput.disabled = !canAdd;

        // Show/hide sections based on phase
        if (state.phase === 'input') {
            elements.inputSection.classList.remove('hidden');
            elements.itemsSection.classList.remove('hidden');
            elements.comparisonSection.classList.add('hidden');
            elements.resultsSection.classList.add('hidden');
        } else if (state.phase === 'comparing') {
            elements.inputSection.classList.add('hidden');
            elements.itemsSection.classList.add('hidden');
            elements.comparisonSection.classList.remove('hidden');
            elements.resultsSection.classList.add('hidden');
        } else if (state.phase === 'results') {
            elements.inputSection.classList.add('hidden');
            elements.itemsSection.classList.add('hidden');
            elements.comparisonSection.classList.add('hidden');
            elements.resultsSection.classList.remove('hidden');
        }

        // Update start button text based on state
        if (Object.keys(state.comparisons).length > 0 && state.phase === 'input') {
            elements.startBtn.textContent = 'Restart Comparisons';
        } else {
            elements.startBtn.textContent = 'Start Comparisons';
        }
    }

    // Utility: Escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
