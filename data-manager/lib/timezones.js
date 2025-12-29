
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
    'merida': 'America/Merida', // Actually usually Central or close to it, but has its own ID sometimes. Merida is effectively Central time usually, but let's be specific if needed. Actually Merida is CST/CDT (mostly Central). 
    // Simplify: Default will be Mexico_City.
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

    // Format: YYYY-MM-DD
    // simple check
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

    try {
        const [year, month, day] = dateStr.split('-').map(Number);

        // We create a date object.
        // Since we can't easily "set" timezone in vanilla JS Date constructor (it uses local or UTC),
        // we use Intl.DateTimeFormat to find the offset or we can rely on a cheat:
        // Create an ISO string that approximates it? No.

        // Better approach without Moment/Luxon:
        // 1. Assume the string is effectively 'YYYY-MM-DDTHH:mm:ss' in that timezone.
        // 2. We want the UTC equivalent.

        const timePart = isEnd ? '23:59:59.999' : '00:00:00.000';

        // We construct a string "conceptually" in that zone.
        // We need to find the UTC timestamp that, when formatted to that zone, matches our target.
        // Iterative approach or simple offset calculation.

        // Actually, let's use the trick: 
        // "toLocaleString" allows converting FROM UTC TO Zone.
        // We want FROM Zone TO UTC.

        // Let's create a UTC date with the same components.
        const utcMirror = new Date(Date.UTC(year, month - 1, day, isEnd ? 23 : 0, isEnd ? 59 : 0, isEnd ? 59 : 0));

        // Now see what that UTC date looks like in the target timezone.
        const fmt = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });

        // This is complex to invert without a library.
        // SIMPLIFICATION FOR THIS TASK:
        // Use a fixed offset map? No, DST changes.
        // 
        // Let's try to "guess" the offset.
        // 1. Take the utcMirror.
        // 2. Format it to the target timezone.
        // 3. Parse components and compare diff.
        // 4. Adjust.

        let guess = new Date(utcMirror);

        // Max 3 iterations to converge key
        for (let i = 0; i < 3; i++) {
            const parts = fmt.formatToParts(guess);
            // parts is array of {type, value}
            // e.g. year: 2023, month: 12, day: 25, hour: 0...

            const getPart = (t) => parseInt(parts.find(p => p.type === t).value);
            const y = getPart('year');
            const m = getPart('month');
            const d = getPart('day');
            const h = getPart('hour');
            const min = getPart('minute');

            // Reconstruct what "Time in Zone" `guess` represents
            // We want this to match `utcMirror` components (which are the target components)

            // Calculate diff in ms
            const measuredTime = Date.UTC(y, m - 1, d, h, min, 0);
            const targetTime = utcMirror.getTime(); // This holds the abstract target time as UTC

            const diff = targetTime - measuredTime;

            if (Math.abs(diff) < 1000) break; // Close enough

            guess = new Date(guess.getTime() + diff);
        }

        return guess;

    } catch (e) {
        console.error('Date parsing error', e);
        return null;
    }
};
