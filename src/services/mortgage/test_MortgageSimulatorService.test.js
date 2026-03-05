import { describe, it, expect } from 'vitest';
import { MortgageSimulatorService } from './MortgageSimulatorService';
import { HipotecaFuerteStrategy } from './HipotecaFuerteStrategy';
import { MORTGAGE_PRODUCTS } from '../../config/mortgageProducts';

describe('MortgageSimulatorService', () => {
    const defaultStrategy = new HipotecaFuerteStrategy(MORTGAGE_PRODUCTS.HIPOTECA_FUERTE_BANORTE);

    it('debería inicializarse con una estrategia obligatoria', () => {
        expect(() => new MortgageSimulatorService()).toThrowError(/Debe proveerse una Strategy/);

        const service = new MortgageSimulatorService(defaultStrategy);
        expect(service.strategy).toBeInstanceOf(HipotecaFuerteStrategy);
    });

    it('debería delegar el cálculo a la estrategia inyectada', () => {
        const service = new MortgageSimulatorService(defaultStrategy);
        const sim = service.getSimulation(2000000, 400000, 15);
        expect(sim.error).toBe(false);
        expect(sim.montoCredito).toBe(1600000);
    });
});
