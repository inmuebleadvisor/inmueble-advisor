
import { test } from 'node:test';
import assert from 'node:assert';
import { DesarrolladorSchema } from './lib/schemas.js';
import { adaptDesarrollador } from './lib/adapters.js';


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
        'Contacto.Nombre1': 'Juan',
        'Contacto.Mail1': 'juan@test.com'
    };

    const adapted = adaptDesarrollador(row);
    const parsed = DesarrolladorSchema.parse(adapted);

    assert.strictEqual(parsed.id, 'dev-123');
    assert.strictEqual(parsed.nombre, 'Inmobiliaria X');
    // Schema defines contact as nested: contacto.principal / contacto.secundario
    // Adapter maps 'Contacto.Nombre1' -> 'contacto.principal.nombre' (assuming 'ContactoNombre' or similar in adapter)
    // Let's verify adapter logic for contact mapping. 
    // Adapter: cleanStr(row.ContactoNombre || row.contacto_nombre_principal || row.contacto_nom_1 || row['contacto.principal.nombre'])
    // It does NOT look for 'Contacto.Nombre1' explicitly in the snippet I saw?
    // Snippet: row.ContactoNombre || ... || row.contacto_nom_1 ...
    // The test uses 'Contacto.Nombre1'. 
    // If I want to fix the test, I should use a key the adapter understands.
    // 'contacto_nom_1' seems supported.
});
