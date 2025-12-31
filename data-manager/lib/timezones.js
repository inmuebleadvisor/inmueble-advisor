
import { DateTime } from 'luxon';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const CITY_TIMEZONES = require('./config/timezones.json');
const DEFAULT_TIMEZONE = 'America/Mexico_City';

export const getTimezoneBase = (city) => {
    if (!city) return DEFAULT_TIMEZONE;
    const norm = city.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

    // Direct lookup
    if (CITY_TIMEZONES[norm]) return CITY_TIMEZONES[norm];

    // Unknown city, fallback to default.
    return DEFAULT_TIMEZONE;
};

/**
 * Parses a YYYY-MM-DD string as the start of the day in the given city's timezone.
 * Returns a JS Date object representing that exact instant.
 */
export const parseDateWithTimezone = (dateStr, city, isEnd = false) => {
    if (!dateStr) return null;

    const timezone = getTimezoneBase(city);

    // Format check YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

    try {
        // Luxon makes this trivial
        // Create DateTime from ISO date in specific zone
        let dt = DateTime.fromISO(dateStr, { zone: timezone });

        if (!dt.isValid) return null;

        if (isEnd) {
            dt = dt.endOf('day'); // Sets to 23:59:59.999 in that zone
        } else {
            dt = dt.startOf('day'); // Sets to 00:00:00.000 in that zone
        }

        // Return native JS Date (which will be the correct UTC instant)
        return dt.toJSDate();

    } catch (e) {
        console.error('Date parsing error', e);
        return null; // Fallback handled by caller
    }
};
