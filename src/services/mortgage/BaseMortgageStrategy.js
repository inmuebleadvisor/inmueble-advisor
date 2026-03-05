/**
 * Interfaz/Clase Base Abstracta para estrategias de crédito hipotecario.
 * Define la estructura que cualquier banco nuevo debe implementar.
 */
export class BaseMortgageStrategy {
    constructor(config) {
        if (new.target === BaseMortgageStrategy) {
            throw new TypeError("No se puede instanciar la clase Base abstracta directamente");
        }
        this.config = config;
    }

    /**
     * Calcula la mensualidad basándose en el monto a financiar y el factor al millar.
     * @param {number} propertyPrice - Precio total de la propiedad
     * @param {number} downPayment - Enganche aportado
     * @param {number} termYears - Plazo en años
     * @returns {Object} { mensualidad, montoCredito, aforo }
     */
    calculateMensualidad(propertyPrice, downPayment, termYears) {
        throw new Error("El método calculateMensualidad debe ser implementado");
    }

    /**
     * Genera la tabla de amortización para toda la vida del crédito.
     * @param {number} propertyPrice - Precio total de la propiedad
     * @param {number} downPayment - Enganche aportado
     * @param {number} termYears - Plazo en años
     * @returns {Array} Listado de pagos mensuales desglosando capital, intereses, seguro y saldo
     */
    generateAmortizationTable(propertyPrice, downPayment, termYears) {
        throw new Error("El método generateAmortizationTable debe ser implementado");
    }

    /**
     * Valida que los datos ingresados cumplan con las políticas del banco (aforo máximo, plazos, etc.)
     * @param {number} propertyPrice 
     * @param {number} downPayment 
     * @param {number} termYears 
     * @returns {Object} { isValid: boolean, errors: Array[string] }
     */
    validateRequirements(propertyPrice, downPayment, termYears) {
        throw new Error("El método validateRequirements debe ser implementado");
    }
}
