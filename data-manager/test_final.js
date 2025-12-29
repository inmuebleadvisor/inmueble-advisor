import assert from 'assert';
import { ModeloSchema } from './lib/schemas.js';
import { adaptModelo } from './lib/adapters.js';

console.log('🧪 Testing Delivery Time Field...\n');

const cases = [
    { input: '6 meses', expected: '6 meses' },
    { input: 'Mayo 2026', expected: 'Mayo 2026' }
];

cases.forEach(({ input, expected }, idx) => {
    console.log(`Test Case ${idx + 1}: Input "${input}"`);
    const row = {
        id_desarrollo: 'dev-1',
        nombre_modelo: `Modelo ${idx}`,
        tiempo_entrega: input
    };

    const adapted = adaptModelo(row);
    console.log(`   > Adapted: "${adapted.infoComercial?.tiempoEntrega}"`);
    assert.strictEqual(adapted.infoComercial?.tiempoEntrega, expected);

    try {
        ModeloSchema.parse(adapted);
        console.log('   > Schema Validation Passed ✅');
    } catch (e) {
        console.error('   > Schema Validation Failed ❌', e.errors);
        process.exit(1);
    }
});

console.log('\n✅ ALL TESTS PASSED');
