
/**
 * Calculates the annualized growth rate (CAGR-like) between a current and initial price over a period.
 * @param {number} currentPrice - The current price.
 * @param {number} initialPrice - The initial price (must be > 0).
 * @param {Date} startDate - The start date of the period.
 * @returns {number|undefined} - The annualized growth percentage (e.g. 15.5 for 15.5%), or undefined if invalid inputs.
 */
export const calculateAnnualizedGrowth = (currentPrice, initialPrice, startDate) => {
    if (!currentPrice || !initialPrice || initialPrice <= 0 || !startDate) {
        return undefined;
    }

    const now = new Date();
    // Use precise time difference to calculate months (approx 30.44 days per month)
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysDiff = (now - startDate) / msPerDay;
    const monthsDiff = daysDiff / 30.44;

    // Avoid division by zero or negative time periods.
    // Minimum 1 month to avoid exploding numbers on brand new listings (e.g. 1 day of growth annualized).
    const safeMonths = monthsDiff < 1 ? 1 : monthsDiff;

    const totalGrowthPct = ((currentPrice - initialPrice) / initialPrice);
    const annualizedGrowth = (totalGrowthPct / safeMonths) * 12;

    return Number((annualizedGrowth * 100).toFixed(2));
};
