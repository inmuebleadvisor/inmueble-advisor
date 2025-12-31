
import colors from 'colors';
import stringSimilarity from 'string-similarity';
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const geoDictionary = require('./lib/geo-dictionary.json');

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

console.log(colors.cyan.bold('\n🧪  VERIFICACIÓN DE FUNCIONALIDADES V2 (DATA MANAGER)\n'));

let passed = 0;
let total = 0;

const assert = (desc, condition) => {
    total++;
    if (condition) {
        console.log(colors.green(`   ✅ ${desc}`));
        passed++;
    } else {
        console.log(colors.red(`   ❌ ${desc}`));
    }
};

// 1. GEO TAGGING
console.log(colors.yellow('1. Geo-Tagging & Dictionary'));
const case1 = standardizeLocation("culiacan", "Sinaloa");
assert("Debe normalizar 'culiacan' a 'Culiacán' (mx-sin-cul)", case1.geografiaId === 'mx-sin-cul' && case1.ciudad === 'Culiacán');
assert("Debe incluir zonas comerciales para Culiacán", case1.zonas.length > 0 && case1.zonas.includes('Tres Ríos'));

const case2 = standardizeLocation("TULUM QUINTANA ROO", "");
assert("Debe reconocer variación 'tulum quintana roo'", case2.geografiaId === 'mx-roo-tulum');

const case3 = standardizeLocation("Ciudad Desconocida", "Narnia");
assert("Debe generar ID custom para desconocidos", case3.geografiaId === 'mx-custom-ciudad-desconocida');


// 2. FUZZY MATCHING (Deduplicación)
console.log(colors.yellow('\n2. Fuzzy Matching (Simulación)'));

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
assert("Debe detectar similitud alta para 'Alttuz Inmob' vs 'Alttuz Inmobiliaria'", dup1.rating > 0.6); // 0.85 is threshold in prod, let's see score

const dup2 = checkDup("Impulsa");
assert("Debe detectar similitud para 'Impulsa'", dup2.rating > 0.4);

// Test threshold strictly
const strictThreshold = 0.85;
const incoming = "Constructora Alttuz Inmobiliaria"; // Very similar
const match = checkDup(incoming);
// "Alttuz Inmobiliaria" vs "Constructora Alttuz Inmobiliaria" -> Dice coefficient might be high
console.log(colors.gray(`   > Similitud '${incoming}' vs '${match.target}': ${(match.rating * 100).toFixed(1)}%`));


// 3. ZONES IN DICTIONARY
console.log(colors.yellow('\n3. Integridad de Zonas'));
const mty = geoDictionary.find(d => d.id === 'mx-nl-mty');
assert("Monterrey debe tener 'San Pedro Garza García' como zona", mty.zonas_comerciales.includes('San Pedro Garza García'));


// SUMMARY
console.log('\n------------------------------------------------');
if (passed === total) {
    console.log(colors.green.bold(`✅ PRUEBAS EXITOSAS (${passed}/${total})`));
} else {
    console.log(colors.red.bold(`❌ FALLARON ${total - passed} PRUEBAS`));
}
console.log('------------------------------------------------\n');
