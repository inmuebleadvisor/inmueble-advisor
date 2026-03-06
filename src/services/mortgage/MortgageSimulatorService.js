/**
 * Servicio Orquestador del Simulador Hipotecario.
 * Delega los cálculos matemáticos a la `strategy` inyectada y sirve como 
 * fachada única para la UI (Componentes / Hooks).
 */
export class MortgageSimulatorService {
    /**
     * @param {BaseMortgageStrategy} defaultStrategy Estrategia a usar por defecto
     */
    constructor(defaultStrategy) {
        if (!defaultStrategy) throw new Error("Debe proveerse una Strategy inicial (Ej. HipotecaFuerteStrategy)");
        this.strategy = defaultStrategy;
    }

    /**
     * Permite cambiar dinámicamente el banco en tiempo de ejecución.
     * @param {BaseMortgageStrategy} newStrategy 
     */
    setStrategy(newStrategy) {
        this.strategy = newStrategy;
    }

    getSimulation(propertyPrice, downPayment, termYears) {
        return this.strategy.calculateMensualidad(propertyPrice, downPayment, termYears);
    }

    getAmortizationTable(propertyPrice, downPayment, termYears) {
        return this.strategy.generateAmortizationTable(propertyPrice, downPayment, termYears);
    }

    getAcceleratedSimulation(propertyPrice, downPayment, termYears, abonoMensualExtra) {
        return this.strategy.calculateAhorroAbonosCapital(propertyPrice, downPayment, termYears, abonoMensualExtra);
    }
}
