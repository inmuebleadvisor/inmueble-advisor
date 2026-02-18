import { describe, it, expect } from 'vitest';
import { FinancialService } from '../services/financial.service';

describe('AffordabilityWidget Logic (FinancialService)', () => {
    const service = new FinancialService();

    it('should calculate budget correctly for typical inputs', () => {
        // Case: Sufficient Income, Low Capital
        const capital = 100000;
        const monthly = 30000; // ~3M capacity

        // Logic: 
        // Credit ~ 3.0M (30k / 10k * 1M)
        // Limit Cash = 100k / (0.05 + 0.05) = 1M (Constraint)

        const result = service.calculateAffordability(capital, monthly);

        // Should be limited by cash (~1M)
        expect(result.maxBudget).toBeCloseTo(1000000, -4);
        expect(result.isAlert).toBe(true); // Cash limited
    });

    it('should calculate budget correctly when capital is high', () => {
        // Case: High Capital, Limited Income
        const capital = 1000000;
        const monthly = 10000; // ~1M credit capacity

        // Limit Cash = 1M / 0.1 = 10M
        // Limit Total = (1M + 1M) / 1.05 = ~1.9M

        const result = service.calculateAffordability(capital, monthly);

        expect(result.maxBudget).toBeCloseTo(1904761, -4);
        expect(result.isAlert).toBe(false);
    });
});
