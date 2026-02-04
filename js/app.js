// Prioritisation Matrix App - Excel-style view

(function() {
    'use strict';

    // Constants
    const MAX_ITEMS = 10;
    const STORAGE_KEY = 'prioritisation-matrix-state-v2'; // v2 to clear old data
    const LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

    // State
    let state = {
        items: [],       // [{id: 'A', name: 'Item 1'}, ...]
        comparisons: {}  // {'A-B': 'A', 'A-C': 'B', ...}
    };

    // Current modal state
    let currentComparison = null;

    // DOM Elements
    const elements = {
        itemInput: document.getElementById('item-input'),
        addBtn: document.getElementById('add-btn'),
        matrixContainer: document.getElementById('matrix-container'),
        resultsList: document.getElementById('results-list'),
        clearBtn: document.getElementById('clear-btn'),
        modalOverlay: document.getElementById('modal-overlay'),
        modalOptionA: document.getElementById('modal-option-a'),
        modalOptionB: document.getElementById('modal-option-b'),
        modalCancel: document.getElementById('modal-cancel')
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
        elements.clearBtn.addEventListener('click', handleClearAll);
        elements.modalOptionA.addEventListener('click', () => handleModalChoice('A'));
        elements.modalOptionB.addEventListener('click', () => handleModalChoice('B'));
        elements.modalCancel.addEventListener('click', closeModal);
        elements.modalOverlay.addEventListener('click', (e) => {
            if (e.target === elements.modalOverlay) closeModal();
        });
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

        saveToStorage();
        render();
    }

    // Open comparison modal
    function openComparisonModal(rowId, colId) {
        const rowItem = state.items.find(i => i.id === rowId);
        const colItem = state.items.find(i => i.id === colId);

        if (!rowItem || !colItem) return;

        currentComparison = { rowId, colId };

        elements.modalOptionA.textContent = `${rowId}: ${rowItem.name}`;
        elements.modalOptionB.textContent = `${colId}: ${colItem.name}`;
        elements.modalOverlay.classList.remove('hidden');
    }

    // Handle modal choice
    function handleModalChoice(choice) {
        if (!currentComparison) return;

        const { rowId, colId } = currentComparison;
        const pairKey = `${rowId}-${colId}`;
        const winnerId = choice === 'A' ? rowId : colId;

        state.comparisons[pairKey] = winnerId;

        closeModal();
        saveToStorage();
        render();
    }

    // Close modal
    function closeModal() {
        elements.modalOverlay.classList.add('hidden');
        currentComparison = null;
    }

    // Calculate results
    function calculateResults() {
        if (state.items.length === 0) return [];

        const wins = {};
        state.items.forEach(item => {
            wins[item.id] = 0;
        });

        // Count wins
        Object.values(state.comparisons).forEach(winnerId => {
            if (wins[winnerId] !== undefined) {
                wins[winnerId]++;
            }
        });

        // Create results array
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

    // Get wins count for each item
    function getWinCounts() {
        const wins = {};
        state.items.forEach(item => {
            wins[item.id] = 0;
        });

        Object.values(state.comparisons).forEach(winnerId => {
            if (wins[winnerId] !== undefined) {
                wins[winnerId]++;
            }
        });

        return wins;
    }

    // Get ranks for each item
    function getRanks() {
        const results = calculateResults();
        const ranks = {};
        results.forEach(r => {
            ranks[r.id] = r.rank;
        });
        return ranks;
    }

    // Clear All
    function handleClearAll() {
        if (!confirm('Are you sure you want to clear all data?')) return;

        state = {
            items: [],
            comparisons: {}
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
                if (parsed && Array.isArray(parsed.items)) {
                    state = {
                        items: parsed.items || [],
                        comparisons: parsed.comparisons || {}
                    };
                }
            }
        } catch (e) {
            console.warn('Failed to load state:', e);
            state = { items: [], comparisons: {} };
        }
    }

    // Render
    function render() {
        renderMatrix();
        renderResults();
        updateUI();
    }

    function renderMatrix() {
        const n = state.items.length;

        if (n === 0) {
            elements.matrixContainer.innerHTML = '<p style="color: #666; padding: 20px 0;">Add items to build the comparison matrix</p>';
            return;
        }

        const wins = getWinCounts();
        const ranks = getRanks();

        // Grid structure: each column = one item
        // Diagonal cells = item label + name
        // Above diagonal = comparison cells
        // Below diagonal = empty

        let html = '<table class="matrix-table">';

        // Item rows
        for (let row = 0; row < n; row++) {
            html += '<tr class="item-row">';

            for (let col = 0; col < n; col++) {
                if (col < row) {
                    // Below diagonal: empty spacer
                    html += '<td class="spacer"></td>';
                } else if (col === row) {
                    // Diagonal: item label + name
                    const item = state.items[row];
                    html += `<td class="item-cell"><span class="item-label">${item.id}</span> <span class="item-name">${escapeHtml(item.name)}</span></td>`;
                } else {
                    // Above diagonal: comparison cell
                    const rowId = state.items[row].id;
                    const colId = state.items[col].id;
                    const pairKey = `${rowId}-${colId}`;
                    const winner = state.comparisons[pairKey] || '';
                    const filledClass = winner ? 'filled' : '';

                    html += `<td class="cell-comparison ${filledClass}" data-row="${rowId}" data-col="${colId}">${winner}</td>`;
                }
            }

            // Delete button
            html += `<td class="item-delete" data-id="${state.items[row].id}">&times;</td>`;

            html += '</tr>';
        }

        // Header row (A B C D...)
        html += '<tr class="header-row">';
        for (let i = 0; i < n; i++) {
            html += `<td>${state.items[i].id}</td>`;
        }
        html += '<td></td>';
        html += '</tr>';

        // Count row
        html += '<tr class="count-row">';
        for (let i = 0; i < n; i++) {
            const itemId = state.items[i].id;
            html += `<td>${wins[itemId]}</td>`;
        }
        html += '<td class="label">Count</td>';
        html += '</tr>';

        // Rank row (live update)
        html += '<tr class="rank-row">';
        for (let i = 0; i < n; i++) {
            const itemId = state.items[i].id;
            html += `<td>${ranks[itemId]}</td>`;
        }
        html += '<td class="label">Rank</td>';
        html += '</tr>';

        html += '</table>';

        elements.matrixContainer.innerHTML = html;

        // Bind click events
        document.querySelectorAll('.cell-comparison').forEach(cell => {
            cell.addEventListener('click', () => {
                const rowId = cell.dataset.row;
                const colId = cell.dataset.col;
                openComparisonModal(rowId, colId);
            });
        });

        document.querySelectorAll('.item-delete').forEach(btn => {
            btn.addEventListener('click', () => removeItem(btn.dataset.id));
        });
    }

    function renderResults() {
        const n = state.items.length;

        if (n === 0) {
            // Show empty placeholder rows
            let html = '';
            for (let i = 0; i < MAX_ITEMS; i++) {
                html += `
                    <div class="result-row">
                        <div class="result-rank">${i + 1}</div>
                        <div class="result-name result-empty">TBC</div>
                    </div>
                `;
            }
            elements.resultsList.innerHTML = html;
            return;
        }

        const results = calculateResults();

        let html = '';

        // Show current rankings (live update)
        for (let i = 0; i < MAX_ITEMS; i++) {
            const result = results[i];

            if (result) {
                html += `
                    <div class="result-row">
                        <div class="result-rank">${result.rank}</div>
                        <div class="result-name">${escapeHtml(result.name)}</div>
                    </div>
                `;
            } else {
                html += `
                    <div class="result-row">
                        <div class="result-rank">${i + 1}</div>
                        <div class="result-name result-empty">TBC</div>
                    </div>
                `;
            }
        }

        elements.resultsList.innerHTML = html;
    }

    function isAllCompared() {
        const n = state.items.length;
        if (n < 2) return false;

        const totalComparisons = (n * (n - 1)) / 2;
        return Object.keys(state.comparisons).length >= totalComparisons;
    }

    function updateUI() {
        const canAdd = state.items.length < MAX_ITEMS;
        elements.addBtn.disabled = !canAdd;
        elements.itemInput.disabled = !canAdd;
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
