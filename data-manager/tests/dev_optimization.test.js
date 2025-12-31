
import colors from 'colors';
import { z } from 'zod';
import { createRequire } from "module";
const require = createRequire(import.meta.url);

// Mock Dependencies
import { DesarrolladorSchema } from '../lib/models/schemas.js';
import { adaptDesarrollador } from '../lib/adapters/index.js';
import { cleanPhone } from '../lib/shared/normalization.js';

console.log(colors.cyan.bold('\n🧪  VERIFICACIÓN OPTIMIZACIÓN DESARROLLADORES\n'));

// Note: This file uses custom assert/console log instead of node:test. 
// Ideally we refactor to node:test, but for now we just move it and fix paths.
// To run in 'node --test' environment, this file might need to export a test function or be ignored if it's just a script.
// However, since it asserts conditions, we can wrap it in a test block if we want, or leave it as is if it runs standalone.
// BUT 'node --test tests/' attempts to run all .js files? Or only test-*.js / *.test.js?
// Node test runner usually picks up matches. If we rename to .test.js it tries to run it.
// If it's just a script printing to stdout, 'node --test' might treat it as passing if no error thrown.
// 'assert' here is custom. If it fails, it prints red but doesn't throw. 
// I SHOULD UPGRADE IT TO THROW or use node:assert to ensure failure breaks the build.

import nodeAssert from 'node:assert';
import { test } from 'node:test';

test('Dev Optimization Script', () => {

    let passed = 0;
    let total = 0;

    const assert = (desc, condition) => {
        total++;
        if (condition) {
            console.log(colors.green(`   ✅ ${desc}`));
            passed++;
        } else {
            console.log(colors.red(`   ❌ ${desc}`));
            // Fail the test runner
            nodeAssert.fail(desc);
        }
    };

    // 1. TEST ADAPTER SLUG & CLEANING
    console.log(colors.yellow('1. Adapter Logic (Slug & Cleaning)'));

    const row1 = {
        'nombre': '  Grupo  Inmobiliario Éxito  ',
        'id': '',
        'comision_base': '3.5',
        'hitos_credito': '10 | 10 | 80',
        'contacto_email_principal': ' Ventas@Exito.com ',
        'contacto_telefono_principal': '(667) 123-4567'
    };

    const adapt1 = adaptDesarrollador(row1);
    console.log('DEBUG adapt1:', JSON.stringify(adapt1, null, 2));

    // Validar cleanPhone
    console.log('DEBUG cleanPhone direct:', cleanPhone('(667) 123-4567'));

    assert("Slug ID generado correctamente", adapt1.id === 'grupo-inmobiliario-exito');
    assert("Email limpio (lowercase)", adapt1.contacto.principal.email === 'ventas@exito.com');

    console.log('DEBUG PHONE:', adapt1.contacto.principal.telefono);
    assert("Teléfono limpio (solo dígitos)", adapt1.contacto.principal.telefono === '6671234567');
    assert("Comisión base numérica", adapt1.comisiones.porcentajeBase === 3.5);
    assert("Hitos parseados a array", Array.isArray(adapt1.comisiones.hitos.credito) && adapt1.comisiones.hitos.credito.length === 3);

    // 2. TEST SCHEMA VALIDATION (Hitos Sum = 100)
    console.log(colors.yellow('\n2. Schema Validation (Comisiones)'));

    const validDev = {
        id: "dev-valid", // ADDED
        nombre: "Dev Valid",
        comisiones: {
            porcentajeBase: 3,
            hitos: {
                credito: [10, 10, 80], // Sum 100
                contado: [90, 10], // Sum 100
                directo: [50, 50] // Sum 100
            }
        }
    };

    const valRes1 = DesarrolladorSchema.safeParse(validDev);
    assert("Debe pasar validación con hitos = 100", valRes1.success);

    const invalidDev = {
        id: "dev-invalid", // ADDED
        nombre: "Dev Invalid",
        comisiones: {
            hitos: {
                credito: [10, 10, 70] // Sum 90 -> ERROR
            }
        }
    };

    const valRes2 = DesarrolladorSchema.safeParse(invalidDev);
    assert("Debe fallar validación con hitos != 100", !valRes2.success);
    if (!valRes2.success) {
        console.log(colors.gray(`      Error esperado: ${valRes2.error.issues[0].message}`));
    }

    // 3. TEST NESTED STRUCTURE
    console.log(colors.yellow('\n3. Estructura Jerárquica'));

    const row2 = {
        'nombre': 'Constructora Real',
        'fiscal.razonSocial': 'Real Estate SA de CV',
        'contacto.principal.nombre': 'Juan Perez',
        'contacto.secundario.nombre': 'Ana Lopez'
    };

    const adapt2 = adaptDesarrollador(row2);
    assert("Fiscal anidado", adapt2.fiscal && adapt2.fiscal.razonSocial === 'Real Estate SA de CV');
    assert("Contacto Principal anidado", adapt2.contacto.principal.nombre === 'Juan Perez');
    assert("Contacto Secundario anidado", adapt2.contacto.secundario.nombre === 'Ana Lopez');
});
