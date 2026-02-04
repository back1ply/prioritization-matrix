// In-browser tests for Prioritisation Matrix
// Run by opening the app and pasting this in the browser console,
// or load via: <script src="js/tests.js"></script>

(function() {
    'use strict';

    const results = { passed: 0, failed: 0, tests: [] };

    function assert(condition, message) {
        if (condition) {
            results.passed++;
            results.tests.push({ status: 'PASS', message });
            console.log(`✓ PASS: ${message}`);
        } else {
            results.failed++;
            results.tests.push({ status: 'FAIL', message });
            console.error(`✗ FAIL: ${message}`);
        }
    }

    function getElement(id) {
        return document.getElementById(id);
    }

    function clearAll() {
        const clearBtn = getElement('clear-btn');
        // Temporarily override confirm to auto-accept
        const originalConfirm = window.confirm;
        window.confirm = () => true;
        clearBtn.click();
        window.confirm = originalConfirm;
    }

    function addItem(name) {
        const input = getElement('item-input');
        const addBtn = getElement('add-btn');
        input.value = name;
        addBtn.click();
    }

    function getItemCount() {
        return document.querySelectorAll('.item-cell').length;
    }

    function getComparisonCells() {
        return document.querySelectorAll('.cell-comparison');
    }

    function clickComparison(rowId, colId) {
        const cell = document.querySelector(`[data-row="${rowId}"][data-col="${colId}"]`);
        if (cell) cell.click();
    }

    function chooseOption(option) {
        const btn = getElement(option === 'A' ? 'modal-option-a' : 'modal-option-b');
        if (btn) btn.click();
    }

    function getResultNames() {
        const names = [];
        document.querySelectorAll('.result-name').forEach(el => {
            if (!el.classList.contains('result-empty')) {
                names.push(el.textContent);
            }
        });
        return names;
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============ TESTS ============

    async function runTests() {
        console.log('\n========================================');
        console.log('  PRIORITISATION MATRIX - TEST SUITE');
        console.log('========================================\n');

        // Setup: Clear everything first
        clearAll();
        await sleep(100);

        // Test 1: Initial state
        assert(getItemCount() === 0, 'Initial state has no items');
        assert(getComparisonCells().length === 0, 'Initial state has no comparison cells');

        // Test 2: Add single item
        addItem('Task Alpha');
        await sleep(50);
        assert(getItemCount() === 1, 'Can add first item');
        assert(getComparisonCells().length === 0, 'Single item has no comparisons');

        // Test 3: Add second item
        addItem('Task Beta');
        await sleep(50);
        assert(getItemCount() === 2, 'Can add second item');
        assert(getComparisonCells().length === 1, 'Two items have 1 comparison cell');

        // Test 4: Add third item
        addItem('Task Gamma');
        await sleep(50);
        assert(getItemCount() === 3, 'Can add third item');
        assert(getComparisonCells().length === 3, 'Three items have 3 comparison cells (n*(n-1)/2)');

        // Test 5: Empty input doesn't add item
        const countBefore = getItemCount();
        addItem('');
        await sleep(50);
        assert(getItemCount() === countBefore, 'Empty input does not add item');

        // Test 6: Comparison modal opens
        clickComparison('A', 'B');
        await sleep(50);
        const modal = getElement('modal-overlay');
        assert(!modal.classList.contains('hidden'), 'Clicking comparison cell opens modal');

        // Test 7: Make a choice
        chooseOption('A');
        await sleep(50);
        assert(modal.classList.contains('hidden'), 'Choosing option closes modal');
        const cellAB = document.querySelector('[data-row="A"][data-col="B"]');
        assert(cellAB.textContent === 'A', 'Comparison cell shows winner (A)');

        // Test 8: Live results update
        const resultsAfterOneChoice = getResultNames();
        assert(resultsAfterOneChoice.length === 3, 'Results list shows all 3 items');
        assert(resultsAfterOneChoice[0] === 'Task Alpha', 'Item with 1 win is ranked first');

        // Test 9: Complete all comparisons
        clickComparison('A', 'C');
        await sleep(50);
        chooseOption('B'); // C wins over A
        await sleep(50);

        clickComparison('B', 'C');
        await sleep(50);
        chooseOption('B'); // C wins over B
        await sleep(50);

        // Task Alpha: 1 win (beat B)
        // Task Beta: 0 wins
        // Task Gamma: 2 wins (beat A and B)
        const finalResults = getResultNames();
        assert(finalResults[0] === 'Task Gamma', 'Item with most wins (2) ranked first');
        assert(finalResults[1] === 'Task Alpha', 'Item with 1 win ranked second');
        assert(finalResults[2] === 'Task Beta', 'Item with 0 wins ranked last');

        // Test 10: Count row shows correct values
        const countCells = document.querySelectorAll('.count-row td:not(.label)');
        const counts = Array.from(countCells).map(c => c.textContent);
        assert(counts[0] === '1', 'Count for A is 1');
        assert(counts[1] === '0', 'Count for B is 0');
        assert(counts[2] === '2', 'Count for C is 2');

        // Test 11: Can change a comparison
        clickComparison('A', 'B');
        await sleep(50);
        chooseOption('B'); // Now B wins over A
        await sleep(50);
        const cellABUpdated = document.querySelector('[data-row="A"][data-col="B"]');
        assert(cellABUpdated.textContent === 'B', 'Can change comparison choice');

        // Test 12: Delete an item
        const deleteBtn = document.querySelector('.item-delete[data-id="B"]');
        deleteBtn.click();
        await sleep(50);
        assert(getItemCount() === 2, 'Deleting item reduces count');
        assert(getComparisonCells().length === 1, 'Deleting item recalculates comparisons');

        // Test 13: Clear all
        clearAll();
        await sleep(50);
        assert(getItemCount() === 0, 'Clear all removes all items');
        assert(getComparisonCells().length === 0, 'Clear all removes all comparisons');

        // Test 14: Add maximum items (10)
        for (let i = 1; i <= 10; i++) {
            addItem(`Item ${i}`);
        }
        await sleep(50);
        assert(getItemCount() === 10, 'Can add maximum 10 items');
        assert(getComparisonCells().length === 45, '10 items have 45 comparison cells');

        // Test 15: Cannot add 11th item
        const input = getElement('item-input');
        assert(input.disabled, 'Input is disabled at max items');

        // Test 16: LocalStorage persistence
        const storageKey = 'prioritisation-matrix-state-v2';
        const saved = localStorage.getItem(storageKey);
        assert(saved !== null, 'State is saved to localStorage');
        const parsed = JSON.parse(saved);
        assert(parsed.items.length === 10, 'Saved state has correct item count');

        // Cleanup
        clearAll();

        // ============ SUMMARY ============
        console.log('\n========================================');
        console.log(`  RESULTS: ${results.passed} passed, ${results.failed} failed`);
        console.log('========================================\n');

        if (results.failed === 0) {
            console.log('🎉 All tests passed!');
        } else {
            console.log('❌ Some tests failed. Check the logs above.');
        }

        return results;
    }

    // Auto-run if loaded as script, or expose for manual run
    if (document.readyState === 'complete') {
        runTests();
    } else {
        window.addEventListener('load', () => {
            setTimeout(runTests, 500);
        });
    }

    // Expose for manual running
    window.runPrioritisationTests = runTests;

})();
