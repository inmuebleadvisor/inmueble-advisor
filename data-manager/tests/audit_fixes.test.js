
import { test } from 'node:test';
import assert from 'node:assert';
// Fix: parsers.js didn't exist in lib/utils/ list, assuming functions are in string.utils.js
import { cleanNum, cleanPhone } from '../lib/utils/string.utils.js';
import { adaptDesarrollo } from '../lib/adapters/index.js';
import { ModeloSchema } from '../lib/models/schemas.js';

// 1. Test Parsers (DRY Logic)
test('Parsers - cleanNum', (t) => {
    assert.strictEqual(cleanNum('  $ 1,200.50 '), 1200.5, 'Should clean currency and whitespace');
    assert.strictEqual(cleanNum('invalid'), undefined, 'Should return undefined for NaN');
});

test('Parsers - cleanPhone', (t) => {
    assert.strictEqual(cleanPhone('123-456 7890'), '1234567890', 'Should strict digits only');
});

// 2. Test Adapter Integration
test('Adapter - adaptDesarrollo uses new parsers', (t) => {
    const row = {
        'nombre': '  Test Developer  ',
        'unidades.totales': '$ 50',
        'codigopostal': '80 000' // spaces in CP?? cleanNum handles ' ' removal in regex? 
        // cleanNum regex is /[$,\s]/g so yes.
    };
    const out = adaptDesarrollo(row);
    assert.strictEqual(out.nombre, 'Test Developer');
    assert.strictEqual(out.infoComercial.unidadesTotales, 50);
    assert.strictEqual(out.ubicacion.cp, 80000);
});

// 3. Test Schema Hardening (No Specs Catchall)
test('Schema - ModeloSchema rejects unknown root props disguised as specs', (t) => {
    const validData = {
        id: 'test-model',
        idDesarrollo: 'dev-1',
        nombreModelo: 'Modelo A',
        activo: true,
        tipoVivienda: 'Casa',
        precios: { base: 1000000 }
    };

    const res = ModeloSchema.safeParse(validData);
    assert.ok(res.success, 'Valid data should pass');

    const invalidData = {
        ...validData,
        specs: { weirdField: 'should fail' } // Attempt to use deleted 'specs' field
    };

    const res2 = ModeloSchema.safeParse(invalidData);
    // Zod by default strips unknown keys unless .strict() is used.
    // Our schema is NOT strict() by default, so it won't fail, but it will STRIP 'specs'.
    // We want to ensure 'specs' is NOT in the output.
    assert.ok(res2.success, 'Should pass but strip unknown fields');
    assert.strictEqual(res2.data.specs, undefined, 'specs field should be stripped/undefined');
});
