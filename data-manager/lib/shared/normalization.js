
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// We might need to handle the geo-dictionary loading differently or pass it in.
// For now, let's keep it here or allow passing it. 
// However, the original adapter imported it. Let's assume we can import it here too if needed, 
// or keep standardizeLocation in adapters if it's high-level logic. 
// Given standardizeLocation is about "Business logic" of mapping city names, maybe it fits here if generic.
// But it depends on 'geo-dictionary.json'. Let's keep it simple for now and move basic string utils first.

const geoDictionary = require('../geo-dictionary.json');

export const cleanStr = (val) => String(val || '').trim();

export const cleanEmail = (val) => cleanStr(val).toLowerCase();

export const cleanPhone = (val) => cleanStr(val).replace(/\D/g, ''); // Digits only

export const generateId = (part1, part2) => {
    if (!part1 || !part2) return null;
    const raw = `${part1}-${part2}`;
    return raw.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with -
        .replace(/^-+|-+$/g, ''); // Trim leading/trailing dashes
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
    const slug = normCiudad.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return {
        geografiaId: `mx-custom-${slug}`, // Fallback ID
        ciudad: String(ciudad).trim(), // Keep original styling if not matched
        estado: estado
    };
};
