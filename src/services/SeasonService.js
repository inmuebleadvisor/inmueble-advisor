import { SEASONAL_CONFIG } from '../config/theme.config.js';

/**
 * Service to handle Seasonal Logic.
 * Follows SRP: Only responsible for determining the current season and its assets.
 */
class SeasonService {
    /**
     * Determines the active season based on the current date.
     * @param {Date} date - The date to check (defaults to now).
     * @returns {Object|null} The active season object or null if none active.
     */
    getCurrentSeason(date = new Date()) {
        const month = date.getMonth() + 1; // 0-indexed
        const day = date.getDate();

        // Helper to compare MM-DD strings
        const checkDate = (start, end) => {
            const [sM, sD] = start.split('-').map(Number);
            const [eM, eD] = end.split('-').map(Number);

            // Handle wrap-around year (e.g. Dec to Jan)
            if (sM > eM) {
                return (month === sM && day >= sD) || (month > sM) ||
                    (month === eM && day <= eD) || (month < eM);
            }

            // Standard range
            if (month > sM && month < eM) return true;
            if (month === sM && day >= sD && month < eM) return true;
            if (month === sM && month === eM && day >= sD && day <= eD) return true;
            if (month > sM && month === eM && day <= eD) return true;

            return false;
        };

        return SEASONAL_CONFIG.seasons.find(season =>
            checkDate(season.dateRange.start, season.dateRange.end)
        ) || null;
    }

    /**
     * Retrieves the assets for the current context (Season + Theme).
     * @param {string} theme - 'light' or 'dark'.
     * @param {Object} activeSeason - The currently active season object (optional).
     * @returns {Object} Asset URLs.
     */
    getThemeAssets(theme, activeSeason = null) {
        const defaults = SEASONAL_CONFIG.defaultAssets;

        if (!activeSeason) {
            return {
                logo: theme === 'light' ? defaults.logoLight : defaults.logoDark,
                footer: defaults.footerDecoration,
                effect: defaults.backgroundEffect
            };
        }

        return {
            logo: theme === 'light' ? activeSeason.assets.logoLight : activeSeason.assets.logoDark,
            footer: activeSeason.assets.footerDecoration,
            effect: activeSeason.assets.backgroundEffect
        };
    }
}

export default new SeasonService();
