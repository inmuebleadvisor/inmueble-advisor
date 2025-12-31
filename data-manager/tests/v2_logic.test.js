
import colors from 'colors';
import stringSimilarity from 'string-similarity';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
// Fix path to go up one level
const geoDictionary = require('../lib/geo-dictionary.json');

import { test } from 'node:test';
import assert from 'node:assert';

// --- MOCK ADAPTER LOGIC (Copy of standardized logic for testing) ---
const standardizeLocation = (ciudad, estado) => {
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
            estado: match.estado || estado,
            zonas: match.zonas_comerciales || []
        };
    }

    const slug = normCiudad.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return {
        geografiaId: `mx-custom-${slug}`,
        ciudad: String(ciudad).trim(),
        estado: estado,
        zonas: []
    };
};

// --- TESTS ---

test('V2 Logic - Core Features', async (t) => {

    await t.test('Geo-Tagging & Dictionary', () => {
        const case1 = standardizeLocation("culiacan", "Sinaloa");
        assert.ok(case1.geografiaId === 'mx-sin-cul' && case1.ciudad === 'Culiacán', "Debe normalizar 'culiacan' a 'Culiacán'");
        assert.ok(case1.zonas.length > 0 && case1.zonas.includes('Tres Ríos'), "Debe incluir zonas comerciales");

        const case2 = standardizeLocation("TULUM QUINTANA ROO", "");
        assert.strictEqual(case2.geografiaId, 'mx-roo-tulum', "Debe reconocer variación 'tulum quintana roo'");

        const case3 = standardizeLocation("Ciudad Desconocida", "Narnia");
        assert.strictEqual(case3.geografiaId, 'mx-custom-ciudad-desconocida', "Debe generar ID custom para desconocidos");
    });

    await t.test('Fuzzy Matching Implementation', () => {
        const existingDevs = [
            { id: 'dev-1', nombre: 'Alttuz Inmobiliaria' },
            { id: 'dev-2', nombre: 'Grupo Ruba' },
            { id: 'dev-3', nombre: 'Desarrollos Impulsa' }
        ];

        const checkDup = (inputName) => {
            const matches = stringSimilarity.findBestMatch(inputName, existingDevs.map(d => d.nombre));
            return matches.bestMatch;
        };

        const dup1 = checkDup("Alttuz Inmob");
        assert.ok(dup1.rating > 0.6, "Debe detectar alta similitud para 'Alttuz Inmob'");

        const dup2 = checkDup("Impulsa");
        assert.ok(dup2.rating > 0.4, "Debe detectar similitud para 'Impulsa'");
    });

    await t.test('Integridad de Zonas', () => {
        const mty = geoDictionary.find(d => d.id === 'mx-nl-mty');
        assert.ok(mty.zonas_comerciales.includes('San Pedro Garza García'), "Monterrey debe tener San Pedro");
    });
});
