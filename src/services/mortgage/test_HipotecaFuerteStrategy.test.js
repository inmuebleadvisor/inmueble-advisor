import { describe, it, expect } from 'vitest';
import { HipotecaFuerteStrategy } from './HipotecaFuerteStrategy';
import { MORTGAGE_PRODUCTS } from '../../config/mortgageProducts';

describe('HipotecaFuerteStrategy', () => {
    const config = MORTGAGE_PRODUCTS.HIPOTECA_FUERTE_BANORTE;
    const strategy = new HipotecaFuerteStrategy(config);

    it('debería retornar éxito al calcular mensualidad con parámetros válidos (enganche > 10%)', () => {
        const precio = 1000000;
        const enganche = 200000; // 20%
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(false);
        expect(resultado.montoCredito).toBe(800000);
        expect(resultado.aforo).toBe(0.8); // 80% LTV

        // Mensualidad = (800000 / 1000) * 10.30 = 8240
        expect(resultado.mensualidad).toBe(800 * config.factorMensualidadXMillar);
    });

    it('debería rechazar un enganche menor a lo requerido (aforo mayor a 90%)', () => {
        const precio = 1000000;
        const enganche = 50000; // 5% de enganche
        const plazo = 20;

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain(config.aforoMaximo * 100);
    });

    it('debería rechazar un plazo de crédito no soportado', () => {
        const precio = 1000000;
        const enganche = 200000;
        const plazo = 30; // Banorte no ofrece 30 años en este producto

        const resultado = strategy.calculateMensualidad(precio, enganche, plazo);
        expect(resultado.error).toBe(true);
        expect(resultado.messages[0]).toContain("Plazos válidos");
    });
});
