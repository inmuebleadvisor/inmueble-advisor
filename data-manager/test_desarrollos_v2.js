
import { test } from 'node:test';
import assert from 'node:assert';
import { adaptDesarrollo } from './lib/adapters.js';
import { DesarrolloSchema } from './lib/schemas.js';

test('Desarrollo V2 Adapter & Schema', async (t) => {

    await t.test('Deterministic ID & Slug Generation', () => {
        const row = {
            constructora: 'Impulsa Inmuebles',
            nombre: 'Guadalupe Loft',
            descripcion: 'Un loft'
        };
        const result = adaptDesarrollo(row);
        // "impulsa-inmuebles-guadalupe-loft"
        assert.strictEqual(result.id, 'impulsa-inmuebles-guadalupe-loft');
        assert.strictEqual(result.constructora, 'Impulsa Inmuebles');
    });

    await t.test('Geo-Tagging from Dictionary', () => {
        // Mock dictionary usage
        const row = {
            ciudad: 'Culiacán',
            estado: 'Sinaloa'
        };
        const result = adaptDesarrollo(row);
        assert.strictEqual(result.ubicacion.ciudad, 'Culiacán');
        assert.strictEqual(result.geografiaId, 'mx-sin-cul');
    });

    await t.test('Nested Objects & Pipe Parsing', () => {
        const row = {
            amenidades: 'Alberca | Gym |   Park  ',
            acepta_creditos: 'Infonavit|Bancario',
            latitud: '24.8',
            apartado_monto: '5000',
            override_comision: '2.5'
        };
        const result = adaptDesarrollo(row);

        assert.deepStrictEqual(result.caracteristicas.amenidades, ['Alberca', 'Gym', 'Park']);
        assert.deepStrictEqual(result.financiamiento.aceptaCreditos, ['Infonavit', 'Bancario']);
        assert.strictEqual(result.ubicacion.latitud, 24.8);
        assert.strictEqual(result.financiamiento.apartadoMinimo, 5000);
        assert.strictEqual(result.comisiones.overridePct, 2.5);
    });

    await t.test('Schema Validation & New Fields', () => {
        const row = {
            constructora: 'Valid Const',
            nombre: 'Valid Dev',
            ciudad: 'Mazatlán',
            amenidades: 'Pool',
            codigopostal: '80000', // mapped to ubicacion.cp
            localidad: 'Tres Rios', // mapped to ubicacion.localidad

            // New Units logic (snake case or dot notation in row)
            'unidades.totales': '100',
            'unidades.vendidas': '10',
            'unidades.disponibles': '90', // Direct mapping required now

            // New Promo logic
            'promocion.nombre': 'Promo Verano',
            'promocion.fechainicio': '2025-06-01',

            // Removed field test
            fecha_entrega: '2025-12-01' // Should be ignored
        };

        const adapted = adaptDesarrollo(row);

        const parse = DesarrolloSchema.safeParse(adapted);

        if (!parse.success) console.error(JSON.stringify(parse.error.format(), null, 2));
        assert.ok(parse.success);

        // Verification
        assert.strictEqual(parse.data.ubicacion.cp, 80000);
        assert.strictEqual(parse.data.ubicacion.localidad, 'Tres Rios');

        // Units
        assert.strictEqual(parse.data.infoComercial.unidadesTotales, 100);
        assert.strictEqual(parse.data.infoComercial.unidadesVendidas, 10);
        assert.strictEqual(parse.data.infoComercial.unidadesDisponibles, 90);

        // Verify No Calculation (explicitly)
        const rowNoCalc = {
            constructora: 'C',
            nombre: 'N',
            'unidades.totales': '100',
            'unidades.vendidas': '10'
            // disponibles missing
        };
        const adaptedNoCalc = adaptDesarrollo(rowNoCalc);
        assert.strictEqual(adaptedNoCalc.infoComercial.unidadesTotales, 100);
        assert.strictEqual(adaptedNoCalc.infoComercial.unidadesVendidas, 10);
        assert.strictEqual(adaptedNoCalc.infoComercial.unidadesDisponibles, undefined); // Should NOT be 90

        // Promo
        assert.strictEqual(parse.data.promocion.nombre, 'Promo Verano');
        assert.ok(parse.data.promocion.fecha_inicio);

        // Ignored Fields
        // fechaEntrega should NOT be present in infoComercial
        assert.strictEqual(parse.data.infoComercial?.fechaEntrega, undefined);
        // precios.moneda should NOT be present
        assert.strictEqual(parse.data.precios?.moneda, undefined);
    });
});
