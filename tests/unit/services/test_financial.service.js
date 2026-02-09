import { describe, it, expect } from 'vitest';
import { FinancialService } from '../../../src/services/financial.service';

describe('FinancialService', () => {
    const service = new FinancialService();

    describe('calculateAffordability', () => {
        it('should calculate budget based on monthly payment when capital is sufficient', () => {
            // Factor 10,000 per million (1% monthly)
            // 20,000 payment -> 2,000,000 loan
            // 500k capital covers 10% downpayment (200k) + 5% closing (100k) = 300k
            const result = service.calculateAffordability(500000, 20000);

            expect(result.maxBudget).toBeGreaterThan(1500000);
            expect(result.isAlert).toBe(false);
        });

        it('should set isAlert to true when capital is the limiting factor', () => {
            // 50,000 payment -> 5,000,000 loan capacity
            // 100,000 capital -> only allows ~666k budget (10% down + 5% closing = 15%)
            const result = service.calculateAffordability(100000, 50000);

            expect(result.isAlert).toBe(true);
            expect(result.dynamicNote).toContain('efectivo inicial limita');
        });

        it('should return zero when capital and payment are zero', () => {
            const result = service.calculateAffordability(0, 0);
            expect(result.maxBudget).toBe(0);
        });
    });
});
