import assert from 'assert';
import { parseDateWithTimezone, getTimezoneBase } from './lib/timezones.js';
import { DesarrolloSchema, ModeloSchema } from './lib/schemas.js';
import { adaptDesarrollo, adaptModelo } from './lib/adapters.js';

console.log('🧪 Starting Verification Tests...\n');

// 1. TIMEZONE TESTS
console.log('--- Testing Timezones ---');

const checkTimezone = (city, expected) => {
    const res = getTimezoneBase(city);
    console.log(`City: "${city}" -> ${res} [Expected: ${expected}]`);
    assert.strictEqual(res, expected);
};

checkTimezone('Tijuana', 'America/Tijuana');
checkTimezone('Culiacan', 'America/Mazatlan');
checkTimezone('Cancun', 'America/Cancun');
checkTimezone('CDMX', 'America/Mexico_City');
checkTimezone('Unknown City', 'America/Mexico_City');

// 2. DATE PARSING TESTS
console.log('\n--- Testing Date Parsing ---');

// Test Date: 2025-12-25 (Christmas)
const dateStr = '2025-12-25';

// Tijuana is UTC-8 (PST) in winter. 
// 2025-12-25 00:00:00 Tijuana -> 2025-12-25 08:00:00 UTC
const tijuanaDate = parseDateWithTimezone(dateStr, 'Tijuana');
console.log(`Tijuana (UTC-8): ${tijuanaDate.toISOString()} (Expected ~08:00Z)`);
assert.strictEqual(tijuanaDate.getUTCHours(), 8);

// Cancun is UTC-5 (EST) constant usually (check logic).
// 2025-12-25 00:00:00 Cancun -> 2025-12-25 05:00:00 UTC
const cancunDate = parseDateWithTimezone(dateStr, 'Cancun');
console.log(`Cancun (UTC-5): ${cancunDate.toISOString()} (Expected ~05:00Z)`);
assert.strictEqual(cancunDate.getUTCHours(), 5);

// 3. ADAPTER & SCHEMA TESTS
console.log('\n--- Testing Adapter & Schemas ---');

// Mock Data
const mockDesarrolloRow = {
    nombre: 'Desarrollo Test',
    'ubicacion.ciudad': 'Tijuana',
    'promocion.nombre': 'Promo Invierno',
    'promocion.fecha_inicio': '2025-12-01',
    'promocion.fecha_fin': '2025-12-31'
};

const adaptedDev = adaptDesarrollo(mockDesarrolloRow);
console.log('Adapted Desarrollo:', JSON.stringify(adaptedDev.promocion, null, 2));

// Verify Timezone effect on Timestamp
// Firestore Timestamp logic depends on environment but here we check the Date object inside (if mock)
// adaptDesarrollo returns Firestore Timestamps. We can't easily check internal date of Timestamp without firestore lib active fully.
// But we can check if it exists.
assert.ok(adaptedDev.promocion.fecha_inicio);
assert.ok(adaptedDev.promocion.fecha_fin);

// Schema Validation
try {
    const parsed = DesarrolloSchema.parse(adaptedDev);
    console.log('✅ Desarrollo Validated Successfully');
} catch (e) {
    console.error('❌ Desarrollo Schema Error:', e.errors);
    process.exit(1);
}

const mockModeloRow = {
    id_desarrollo: 'dev-1',
    nombre_modelo: 'Modelo A',
    status: 'Pre-Venta|Entrega Inmediata', // Flexible status
    ciudad: 'Cancun',
    'promocion.nombre': 'Bono',
    'promocion.fecha_inicio': '2025-01-01'
};

const adaptedMod = adaptModelo(mockModeloRow);
console.log('Adapted Modelo Status:', adaptedMod.status);
console.log('Adapted Modelo Promo:', JSON.stringify(adaptedMod.promocion, null, 2));

// Validate Flexible Status (Array)
assert.deepStrictEqual(adaptedMod.status, ['Pre-Venta', 'Entrega Inmediata']);

try {
    const parsedMod = ModeloSchema.parse(adaptedMod);
    console.log('✅ Modelo Validated Successfully');
} catch (e) {
    console.error('❌ Modelo Schema Error:', e.errors);
    process.exit(1);
}

console.log('\n✅ ALL VERIFICATIONS PASSED');
