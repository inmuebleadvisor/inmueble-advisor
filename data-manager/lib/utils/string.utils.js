
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Note: Navigating up from /lib/utils/ to /lib/ to get geo-dictionary
// Use absolute path logic if we weren't sure, but here relative is fine.
// File Structure: /lib/utils/string.utils.js -> /lib/geo-dictionary.json = ../../geo-dictionary.json
const geoDictionary = require('../geo-dictionary.json');

export const cleanStr = (val) => String(val || '').trim();

export const cleanEmail = (val) => cleanStr(val).toLowerCase();

export const cleanPhone = (val) => cleanStr(val).replace(/\D/g, ''); // Digits only

export const cleanNum = (val) => {
    if (!val) return undefined;
    // Remove currency symbols, commas, and whitespace
    const s = String(val).replace(/[$,\s]/g, '');
    const n = parseFloat(s);
    return isNaN(n) ? undefined : n;
};

/**
 * Normalizes a string to a URL-friendly slug.
 * Removes accents, special chars, and lowercases.
 * @param {string} str 
 * @returns {string|null}
 */
export const slugify = (str) => {
    if (!str) return null;
    return String(str)
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
};

export const generateId = (part1, part2) => {
    if (!part1 || !part2) return null;
    return slugify(`${part1}-${part2}`);
};

export const standardizeLocation = (ciudad, estado) => {
    if (!ciudad) return null;
    const normCiudad = String(ciudad).trim().toLowerCase();

    // Find match in dictionary
    const match = geoDictionary.find(entry =>
        entry.nombre.toLowerCase() === normCiudad ||
        entry.variaciones.some(v => v === normCiudad)
    );

    if (match) {
        return {
            geografiaId: match.id,
            ciudad: match.nombre,
            estado: match.estado || estado
        };
    }

    // Fallback: Generate slug
    const slug = slugify(normCiudad);
    return {
        geografiaId: `mx-custom-${slug}`, // Fallback ID
        ciudad: String(ciudad).trim(), // Keep original styling if not matched
        estado: estado
    };
};

// Transformers

export const parsePipes = (val) => val ? String(val).split('|').map(s => s.trim()).filter(s => s) : [];

export const parseHitos = (val) => {
    if (!val) return [];
    return String(val).split('|')
        .map(v => parseFloat(v.trim()))
        .filter(n => !isNaN(n));
};
