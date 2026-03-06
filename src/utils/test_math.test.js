import { describe, it, expect } from 'vitest';
import { round2 } from './math';

describe('round2 (matematica financiera)', () => {
    it('redondea hacia arriba correctamente (caso .5)', () => {
        expect(round2(1.005)).toBe(1.01);
    });

    it('redondea hacia abajo correctamente', () => {
        expect(round2(1.004)).toBe(1.00);
    });

    it('no modifica un número ya redondeado', () => {
        expect(round2(15735.83)).toBe(15735.83);
    });

    it('evita errores de punto flotante en multiplicaciones bancarias', () => {
        // 1845000 * (0.1015 / 360) * 30.40 produce un número largo
        const resultado = round2(1845000 * (0.1015 / 360) * 30.40);
        expect(typeof resultado).toBe('number');
        expect(resultado.toString().split('.')[1]?.length ?? 0).toBeLessThanOrEqual(2);
    });

    it('maneja cero sin errores', () => {
        expect(round2(0)).toBe(0);
    });

    it('maneja números negativos correctamente (ajuste EPSILON aplica hacia cero en negativos)', () => {
        // Note: Number.EPSILON shifts the value slightly positive,
        // so -1.235 + EPSILON rounds to -1.23 (not -1.24).
        expect(round2(-1.235)).toBe(-1.23);
    });
});
