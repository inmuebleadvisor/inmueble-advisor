import { describe, it, expect } from 'vitest';
import { FinancialService } from '../../services/financial.service';

describe('AffordabilityWidget Logic (FinancialService)', () => {
    const service = new FinancialService();

    it('should calculate budget correctly for typical inputs', () => {
        // Case: Sufficient Income, Low Capital
        const capital = 100000;
        const monthly = 30000; // ~2.72M capacity (30/11 * 1M)

        // Logic: 
        // Limit Cash = 100k / (0.06 + 0.10) = 625,000 (Constraint)

        const result = service.calculateAffordability(capital, monthly);

        // Should be limited by cash (625k)
        expect(result.maxBudget).toBeCloseTo(625000, -2);
        expect(result.isAlert).toBe(true); // Cash limited
    });

    it('should calculate budget correctly when capital is high', () => {
        // Case: High Capital, Limited Income
        const capital = 1000000;
        const monthly = 10000; // ~909k credit capacity (10/11 * 1M)

        // Limit Cash = 1M / 0.16 = 6.25M
        // Limit Total = (1M + 0.909M) / 1.06 = ~1.8M

        const result = service.calculateAffordability(capital, monthly);

        expect(result.maxBudget).toBeCloseTo(1801028, -2);
        expect(result.isAlert).toBe(false);
    });
});
