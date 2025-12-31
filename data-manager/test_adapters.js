
import { test } from 'node:test';
import assert from 'node:assert';
import { adaptDesarrollador } from './lib/adapters.js';

test('adaptDesarrollador - User CSV Format', async (t) => {
    // Simulate the user's CSV row structure
    // nombre	razon_social	comision_base	pago_hitos_credito	pago_hitos_contado	pago_hitos_directo	contacto_nom_1	contacto_tel_1	contacto_mail_1	contacto_puesto_1	contacto_nom_2	contacto_tel_2	contacto_mail_2
    const row = {
        'nombre': 'Impulsa Inmuebles',
        'razon_social': 'Impulsa SA de CV',
        'comision_base': '3',
        'pago_hitos_credito': '15|15|15|55',
        'pago_hitos_contado': '50|0|0|50',
        'pago_hitos_directo': '15|0|30|55',
        'contacto_nom_1': 'Manuel Navarro Alttuz',
        'contacto_tel_1': '52 1 667 430 6871',
        'contacto_mail_1': 'manuel@example.com',
        'contacto_puesto_1': 'Gerente Comercial',
        'contacto_nom_2': 'Secundario Test',
        'contacto_tel_2': '9998887777',
        'contacto_mail_2': 'sec@example.com'
    };

    const result = adaptDesarrollador(row);

    // Verify basic fields
    assert.strictEqual(result.nombre, 'Impulsa Inmuebles');
    assert.strictEqual(result.id, 'impulsa-inmuebles'); // Slug generation
    assert.deepStrictEqual(result.fiscal, { razonSocial: 'Impulsa SA de CV' });

    // Verify Commissions
    assert.strictEqual(result.comisiones.porcentajeBase, 3);
    assert.deepStrictEqual(result.comisiones.hitos.credito, [15, 15, 15, 55]);
    assert.deepStrictEqual(result.comisiones.hitos.contado, [50, 0, 0, 50]);
    assert.deepStrictEqual(result.comisiones.hitos.directo, [15, 0, 30, 55]);

    // Verify Contacts
    assert.deepStrictEqual(result.contacto.principal, {
        nombre: 'Manuel Navarro Alttuz',
        telefono: '5216674306871',
        email: 'manuel@example.com',
        puesto: 'Gerente Comercial'
    });

    assert.deepStrictEqual(result.contacto.secundario, {
        nombre: 'Secundario Test',
        telefono: '9998887777',
        email: 'sec@example.com'
    });
});
