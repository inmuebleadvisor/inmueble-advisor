
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const geoDictionary = require('../geo-dictionary.json');

export const cleanStr = (val) => String(val || '').trim();

export const cleanEmail = (val) => cleanStr(val).toLowerCase();

export const cleanPhone = (val) => cleanStr(val).replace(/\D/g, ''); // Digits only

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
