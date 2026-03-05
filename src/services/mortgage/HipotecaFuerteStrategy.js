import { BaseMortgageStrategy } from './BaseMortgageStrategy';

export class HipotecaFuerteStrategy extends BaseMortgageStrategy {
    constructor(config) {
        super(config);
    }

    validateRequirements(propertyPrice, downPayment, termYears) {
        const errors = [];
        const aforoOfrecido = (propertyPrice - downPayment) / propertyPrice;

        if (aforoOfrecido > this.config.aforoMaximo) {
            errors.push(`El enganche debe ser al menos del ${(1 - this.config.aforoMaximo) * 100}%. (Aforo soportado: ${this.config.aforoMaximo * 100}%)`);
        }

        if (!this.config.plazosAceptados.includes(termYears)) {
            errors.push(`El banco no ofrece un plazo de ${termYears} años para este producto. Plazos válidos: ${this.config.plazosAceptados.join(', ')}`);
        }

        if (propertyPrice <= 0) errors.push("El precio de la propiedad no es válido.");

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    calculateMensualidad(propertyPrice, downPayment, termYears) {
        const validation = this.validateRequirements(propertyPrice, downPayment, termYears);
        if (!validation.isValid) {
            return {
                error: true,
                messages: validation.errors
            };
        }

        const montoCredito = propertyPrice - downPayment;
        const aforo = montoCredito / propertyPrice;

        // Simulación básica usando factor de pago al millar
        // Mensualidad = (Crédito / 1000) * Factor
        // Este factor encapsula tasa de interés y seguros de forma simplificada por el banco.
        const mensualidadEstimada = (montoCredito / 1000) * this.config.factorMensualidadXMillar;

        // Costos iniciales (Apertura)
        const pagoApertura = montoCredito * this.config.comisionApertura;

        return {
            error: false,
            mensualidad: mensualidadEstimada,
            montoCredito,
            aforo,
            pagoApertura,
            tasaAsignada: this.config.tasaInteresAnual,
            nombreProducto: this.config.nombre,
            banco: this.config.banco
        };
    }

    generateAmortizationTable(propertyPrice, downPayment, termYears) {
        // En un esquema real aquí iría un loop calculando saldo insoluto mes a mes.
        // Dado el alcance, devolvemos un mock estructurado usando la fórmula francesa.

        const validation = this.validateRequirements(propertyPrice, downPayment, termYears);
        if (!validation.isValid) return { error: true, messages: validation.errors };

        const p = propertyPrice - downPayment;
        const i_anual = this.config.tasaInteresAnual;
        const i_mensual = i_anual / 12;
        const n_meses = termYears * 12;

        // Fórmula de Anualidad Vencida (Francesa)
        const cuota = p * (i_mensual * Math.pow(1 + i_mensual, n_meses)) / (Math.pow(1 + i_mensual, n_meses) - 1);

        const tabla = [];
        let saldo = p;

        for (let mes = 1; mes <= n_meses; mes++) {
            const intereses = saldo * i_mensual;
            const capital = cuota - intereses;
            saldo = saldo - capital;

            // Si el saldo por decimales es negativo muy pequeño, lo normalizamos
            if (saldo < 0 && saldo > -1) saldo = 0;

            // Para que la tabla no sature la memoria en 240+ meses durante pruebas, 
            // la vamos a acotar o simplemente devolver completa si es requerido por UI.
            tabla.push({
                mes,
                pagoMensual: cuota, // En bancos reales se le suman seguros mes a mes
                capital,
                interes: intereses,
                saldoInsoluto: saldo
            });
        }

        return { error: false, table: tabla, cuotaFija: cuota };
    }
}
