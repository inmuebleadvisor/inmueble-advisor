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

    it('debería rechazar un enganche mayor a lo permitido (aforo menor a 75%)', () => {
        const precio = 1000000;
        const enganche = 300000; // 30% de enganche, máximo es 25%
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain("enganche no puede superar el 25%");
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

        // Cifras del Mes 1 basadas en el simulador oficial y días (30.00 en vez de 31.00)
        expect(tabla[0].saldoInicial).toBe(1260000.00);
        expect(Math.abs(tabla[0].interes - 10657.50)).toBeLessThanOrEqual(1.00);

        // Tolerancia de 1 peso por redondeos anidados en cálculos complejos
        expect(Math.abs(tabla[0].capital - 1599.18)).toBeLessThanOrEqual(1.00);
        expect(Math.abs(tabla[0].segurosComisiones - 1329.40)).toBeLessThanOrEqual(1.00);
        expect(Math.abs(tabla[0].pagoMensual - 13586.08)).toBeLessThanOrEqual(1.00);
        expect(Math.abs(tabla[0].saldoFinal - 1258400.82)).toBeLessThanOrEqual(1.00);
    });
});
