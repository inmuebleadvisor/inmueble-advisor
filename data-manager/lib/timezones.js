
import { DateTime } from 'luxon';

// Map of Mexican cities/states to IANA Timezones
const CITY_TIMEZONES = {
    // Baja California
    'tijuana': 'America/Tijuana',
    'mexicali': 'America/Tijuana',
    'ensenada': 'America/Tijuana',
    'rosarito': 'America/Tijuana',

    // Baja California Sur
    'la paz': 'America/Mazatlan',
    'cabo san lucas': 'America/Mazatlan',
    'san jose del cabo': 'America/Mazatlan',

    // Sonora
    'hermosillo': 'America/Hermosillo',
    'puerto penasco': 'America/Hermosillo',
    'nogales': 'America/Hermosillo',

    // Sinaloa
    'culiacan': 'America/Mazatlan',
    'mazatlan': 'America/Mazatlan',
    'los mochis': 'America/Mazatlan',

    // Quintana Roo
    'cancun': 'America/Cancun',
    'playa del carmen': 'America/Cancun',
    'tulum': 'America/Cancun',
    'chetumal': 'America/Cancun',

    // Default (Central Time) - Most of Mexico
    'cdmx': 'America/Mexico_City',
    'ciudad de mexico': 'America/Mexico_City',
    'guadalajara': 'America/Mexico_City',
    'monterrey': 'America/Mexico_City',
    'merida': 'America/Merida',
};

export const getTimezoneBase = (city) => {
    if (!city) return 'America/Mexico_City';
    const norm = city.toLowerCase().trim()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Remove accents

    // Direct lookup
    if (CITY_TIMEZONES[norm]) return CITY_TIMEZONES[norm];

    // Heuristics
    if (norm.includes('baja california sur') || norm.includes('bcs')) return 'America/Mazatlan';
    if (norm.includes('baja california') || norm.includes('tijuana')) return 'America/Tijuana';
    if (norm.includes('sonora')) return 'America/Hermosillo';
    if (norm.includes('sinaloa')) return 'America/Mazatlan';
    if (norm.includes('quintana') || norm.includes('cancun')) return 'America/Cancun';

    return 'America/Mexico_City';
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
