/**
 * @file financial.service.js
 * @description SERVICE FOR FINANCIAL CALCULATIONS
 * 
 * This service encapsulates the business logic for calculating property affordability,
 * mortgage maximums, and down payment requirements.
 */

import { FINANZAS } from '../config/constants';

export class FinancialService {
    /**
     * Calculates the maximum property budget based on available capital and monthly payment capacity.
     * 
     * @param {number} capital - Available liquid capital (savings).
     * @param {number} monthlyPayment - Maximum comfortable monthly payment.
     * @returns {Object} result - Financial breakdown
     * @returns {number} result.maxBudget - Maximum property price.
     * @returns {string} result.dynamicNote - Explanation of the limiting factor.
     * @returns {boolean} result.isAlert - Whether the note is an alert (limiting factor is capital).
     */
    calculateAffordability(capital, monthlyPayment) {
        const {
            PORCENTAJE_GASTOS_NOTARIALES,
            PORCENTAJE_ENGANCHE_MINIMO,
            FACTOR_MENSUALIDAD_POR_MILLON
        } = FINANZAS;

        // 1. Credit capacity based on monthly payment
        const maxCreditBanco = (monthlyPayment / FACTOR_MENSUALIDAD_POR_MILLON) * 1000000;

        // 2. Limit based on available cash (Down payment + Closing costs)
        const limitByCash = capital / (PORCENTAJE_GASTOS_NOTARIALES + PORCENTAJE_ENGANCHE_MINIMO);

        // 3. Limit based on total capacity (Cash + Loan) after closing costs
        const limitByTotalCapacity = (capital + maxCreditBanco) / (1 + PORCENTAJE_GASTOS_NOTARIALES);

        // 4. Maximum budget is the lower of the two limits
        const maxBudget = Math.min(limitByCash, limitByTotalCapacity);

        // Logic for dynamic notes
        let dynamicNote = "Incluye gastos notariales y enganche.";
        let isAlert = false;

        if (maxBudget > 0 && limitByCash < (limitByTotalCapacity - 50000)) {
            dynamicNote = "Tu efectivo inicial limita tu monto máximo.";
            isAlert = true;
        }

        return {
            maxBudget,
            dynamicNote,
            isAlert
        };
    }
}
