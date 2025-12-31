
import assert from 'node:assert';
import { test } from 'node:test';
import { parseDateWithTimezone, getTimezoneBase } from '../lib/utils/date.utils.js'; // Use proper utils path, not root lib export if it was moved. 
// Wait, 'test_verification.js' used './lib/timezones.js'.
// In step 42 I read `lib/timezones.js`. It exists.
// Code in `lib/timezones.js` does exist as seen in Step 41.
// However, `lib/utils/date.utils.js` (Step 51) duplicates some of this or exports wrapper?
// `lib/utils/date.utils.js` exports `parseDateWithTimezone`.
// `lib/timezones.js` exports `parseDateWithTimezone` too (Step 41).
// This is DUPLICATION (DRY violation I missed slightly or they are aliases).
// I should prefer `lib/utils/date.utils.js` as it seems more "utils" focused.
// Or if `lib/timezones.js` is the dedicated adapter, I can use that.
// `lib/timezones.js` line 6 requires `./config/timezones.json`.
// `lib/utils/date.utils.js` line 7 requires `../config/timezones.json`.
// They effectively do the same thing. `timezones.js` seems legacy if `date.utils.js` exists.
// But `test_verification.js` used `timezones.js`.
// I will point to `../lib/utils/date.utils.js` to encourage cleaner structure.

import { DesarrolloSchema, ModeloSchema } from '../lib/models/schemas.js';
import { adaptDesarrollo, adaptModelo } from '../lib/adapters/index.js';

test('Verification Tests', async (t) => {

    await t.test('Timezone Tests', () => {
        // Redefine checkTimezone inside test or import? 
        // getTimezoneBase from date.utils
        const checkTimezone = (city, expected) => {
            const res = getTimezoneBase(city);
            assert.strictEqual(res, expected);
        };

        checkTimezone('Tijuana', 'America/Tijuana');
        checkTimezone('Culiacan', 'America/Mazatlan');
        checkTimezone('Cancun', 'America/Cancun');
        checkTimezone('CDMX', 'America/Mexico_City');
        checkTimezone('Unknown City', 'America/Mexico_City');
    });

    await t.test('Date Parsing Tests', () => {
        const dateStr = '2025-12-25';

        const tijuanaDate = parseDateWithTimezone(dateStr, 'Tijuana');
        // console.log(`Tijuana (UTC-8): ${tijuanaDate.toISOString()} (Expected ~08:00Z)`);
        assert.strictEqual(tijuanaDate.getUTCHours(), 8);

        const cancunDate = parseDateWithTimezone(dateStr, 'Cancun');
        // console.log(`Cancun (UTC-5): ${cancunDate.toISOString()} (Expected ~05:00Z)`);
        assert.strictEqual(cancunDate.getUTCHours(), 5);
    });

    await t.test('Adapter & Schema Tests', () => {
        const mockDesarrolloRow = {
            nombre: 'Desarrollo Test',
            'ubicacion.ciudad': 'Tijuana',
            'promocion.nombre': 'Promo Invierno',
            'promocion.fecha_inicio': '2025-12-01',
            'promocion.fecha_fin': '2025-12-31'
        };

        const adaptedDev = adaptDesarrollo(mockDesarrolloRow);
        console.log('DEBUG PROMO:', JSON.stringify(adaptedDev.promocion, null, 2));
        assert.ok(adaptedDev.promocion.fecha_inicio, 'Fecha inicio missing');
        assert.ok(adaptedDev.promocion.fecha_fin, 'Fecha fin missing');

        try {
            const parsed = DesarrolloSchema.parse(adaptedDev);
            assert.ok(parsed);
        } catch (e) {
            console.error('ZOD ERROR:', JSON.stringify(e.format(), null, 2));
            throw e;
        }

        const mockModeloRow = {
            id_desarrollo: 'dev-1',
            nombre_modelo: 'Modelo A',
            status: 'Pre-Venta|Entrega Inmediata',
            ciudad: 'Cancun',
            'promocion.nombre': 'Bono',
            'promocion.fecha_inicio': '2025-01-01'
        };

        const adaptedMod = adaptModelo(mockModeloRow);
        assert.deepStrictEqual(adaptedMod.status, ['Pre-Venta', 'Entrega Inmediata']);

        const parsedMod = ModeloSchema.parse(adaptedMod);
        assert.ok(parsedMod);
    });
});
