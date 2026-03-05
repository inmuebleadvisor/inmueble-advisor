import { describe, it, expect } from 'vitest';
import { HipotecaFuerteStrategy } from './HipotecaFuerteStrategy';
import { MORTGAGE_PRODUCTS } from '../../config/mortgageProducts';

describe('HipotecaFuerteStrategy', () => {
    const config = MORTGAGE_PRODUCTS.HIPOTECA_FUERTE_BANORTE;
    const strategy = new HipotecaFuerteStrategy(config);

    it('debería retornar éxito al calcular mensualidad con parámetros válidos (enganche 20%)', () => {
        const precio = 1000000;
        const enganche = 200000; // 20%
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(false);
        expect(resultado.montoCredito).toBe(800000);
        expect(resultado.aforo).toBe(0.8); // 80% LTV

        // Revisa que exista el desglose de desembolso y mensualidad
        expect(resultado.mensualidad).toBeGreaterThan(0);
        expect(resultado.desembolsoInicial).toBeGreaterThan(enganche);
    });

    it('debería rechazar un enganche menor a lo requerido (aforo mayor a 90%)', () => {
        const precio = 1000000;
        const enganche = 50000; // 5% de enganche
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain("enganche debe ser al menos del 10%");
    });

    it('debería rechazar un enganche mayor a lo permitido (aforo menor a 50%)', () => {
        const precio = 1000000;
        const enganche = 600000; // 60% de enganche
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain("enganche no puede superar el 50%");
    });

    it('debería rechazar un plazo de crédito no soportado', () => {
        const precio = 1000000;
        const enganche = 200000;
        const plazo = 30; // Banorte no ofrece 30 años en este producto

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain("Plazos válidos");
    });

    it('debería calcular la amortización matemáticamente idéntica al banco (1.4M precio, 10% enganche)', () => {
        const precio = 1400000;
        const enganche = 140000;
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(false);

        const tabla = resultado.tablaAmortizacion;

        // Cifras del Mes 1 basadas en el simulador oficial
        expect(tabla[0].saldoInicial).toBe(1260000.00);
        expect(tabla[0].capital).toBe(1598.82);
        expect(tabla[0].interes).toBe(11012.75);

        // Tolerancia de 2 centavos por redondeos anidados en cálculos complejos
        expect(Math.abs(tabla[0].segurosComisiones - 1363.75)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(tabla[0].pagoMensual - 13975.32)).toBeLessThanOrEqual(0.02);
        expect(Math.abs(tabla[0].saldoFinal - 1258401.18)).toBeLessThanOrEqual(0.02);
    });
});
