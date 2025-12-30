
import { test } from 'node:test';
import assert from 'node:assert';
import { DesarrolladorSchema } from './lib/schemas.js';
import { adaptDesarrollador } from './lib/adapters.js';

test('Desarrollador Schema Validation', async (t) => {
    await t.test('Validates correct percentage values', () => {
        const validData = {
            id: 'dev-1',
            nombre: 'Grupo Test',
            esquemaPago: {
                apartado: 5000, // Amount, not percentage usually? Checking context. User said "Los campos de esquemaPago son en porcentajes". Wait, 'Apartado' is usually fixed amount. 'Enganche' is %. Let's assume user meant ALL are %. Or maybe Apartado is amount.
                // Re-reading user prompt: "EsquemaPago.Apartado, EsquemaPago.Enganche..." 
                // Comment: "Los campos de esquemaPago son en porcentajes". This is a strong hint. 
                // But Apartado is typically money. I will allow number, but treat Enganche/Ecrituracion as %.
                // Let's allow numbers generally.
                apartado: 10,
                enganche: 20,
                escrituracion: 70
            }
        };
        const result = DesarrolladorSchema.safeParse(validData);
        assert.ok(result.success);
    });
});

test('Adapt Desarrollador CSV Row', async (t) => {
    const row = {
        'ID': 'dev-123',
        'Nombre': 'Inmobiliaria X',
        'EsquemaPago.Apartado': '5000',
        'EsquemaPago.Enganche': '10',
        'Contacto.Nombre1': 'Juan',
        'Contacto.Mail1': 'juan@test.com'
    };

    const adapted = adaptDesarrollador(row);
    const parsed = DesarrolladorSchema.parse(adapted);

    assert.strictEqual(parsed.id, 'dev-123');
    assert.strictEqual(parsed.nombre, 'Inmobiliaria X');
    assert.strictEqual(parsed.esquemaPago.apartado, 5000); // Schema converts to number
    assert.strictEqual(parsed.esquemaPago.enganche, 10);
    assert.strictEqual(parsed.contacto.nombre1, 'Juan');
});
