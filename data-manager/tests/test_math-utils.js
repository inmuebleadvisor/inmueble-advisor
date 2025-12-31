
import { test } from 'node:test';
import assert from 'node:assert';
import { calculateAnnualizedGrowth } from '../lib/shared/math-utils.js';

test('Math Utils - Annualized Growth', async (t) => {

    await t.test('Basic Annualized Growth (Exact Year)', () => {
        // Init: 100, Current: 110. Gain 10%. 1 Year. -> ~10% annualized.
        const start = new Date();
        start.setFullYear(start.getFullYear() - 1);

        const result = calculateAnnualizedGrowth(110, 100, start);
        // 365 / 30.44 = 11.99 months. 10% / 11.99 * 12 ~= 10.01%
        assert.ok(Math.abs(result - 10) < 0.5, `Expected ~10, got ${result}`);
    });

    await t.test('Basic Annualized Growth (6 Months)', () => {
        // Init: 100, Current: 110. Gain 10%. 6 Months (approx 182 days).
        const start = new Date();
        start.setMonth(start.getMonth() - 6);

        const result = calculateAnnualizedGrowth(110, 100, start);
        // ~6 months. 0.1 / 6 * 12 = 20.
        assert.ok(Math.abs(result - 20) < 1.0, `Expected ~20, got ${result}`);
    });

    await t.test('No Time Passed (Use Minimum 1 Month)', () => {
        // Init: 100, Current: 110. Gain 10%.
        const start = new Date();

        const result = calculateAnnualizedGrowth(110, 100, start);
        // safeMonths = 1.
        // 0.1 / 1 * 12 = 1.2 -> 120.
        assert.strictEqual(result, 120, 'Should use 1 month minimum default');
    });

    await t.test('Fractional Month (e.g. 45 days)', () => {
        // Init: 100, Current: 110. Gain 10%.
        // 45 days / 30.44 = 1.478 months.
        // 0.1 / 1.478 * 12 = 0.811 -> 81.1%.
        const start = new Date();
        start.setDate(start.getDate() - 45);

        const result = calculateAnnualizedGrowth(110, 100, start);
        assert.ok(result < 100 && result > 70, `Expected ~81, got ${result}`);
    });
});
