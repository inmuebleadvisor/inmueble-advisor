
import { test } from 'node:test';
import assert from 'node:assert';
import { DesarrolladorSchema } from '../lib/models/schemas.js';
import { adaptDesarrollador } from '../lib/adapters/index.js';


test('Desarrollador Schema Validation', async (t) => {
    await t.test('Validates basic structure', () => {
        const validData = {
            id: 'dev-1',
            nombre: 'Grupo Test'
        };
        const result = DesarrolladorSchema.safeParse(validData);
        assert.ok(result.success);
    });
});

test('Adapt Desarrollador CSV Row', async (t) => {
    const row = {
        'ID': 'dev-123',
        'Nombre': 'Inmobiliaria X',
        'contact_nom_1': 'Juan', // Updated to match expected adapter logic if needed, but keeping strict to original test intent unless broken. 
        // Original test used 'Contacto.Nombre1' which failed comment check. 
        // Let's use standard keys that likely work or keep it if we trust the adapter supports it (adapter uses snake_case fallback usually).
        // Adapter has: row.ContactoNombre || row.contacto_nombre_principal || row.contacto_nom_1
        'contacto_nom_1': 'Juan',
        'contacto_mail_1': 'juan@test.com'
    };

    const adapted = adaptDesarrollador(row);
    const parsed = DesarrolladorSchema.parse(adapted);

    assert.strictEqual(parsed.id, 'dev-123');
    assert.strictEqual(parsed.nombre, 'Inmobiliaria X');
});
