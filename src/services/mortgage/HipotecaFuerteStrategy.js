import { BaseMortgageStrategy } from './BaseMortgageStrategy';
import { round2 } from '../../utils/math';

export class HipotecaFuerteStrategy extends BaseMortgageStrategy {
    constructor(config) {
        super(config);
    }

    validateRequirements(propertyPrice, downPayment, termYears) {
        const errors = [];
        const aforoOfrecido = (propertyPrice - downPayment) / propertyPrice;

        if (aforoOfrecido > this.config.aforoMaximo) {
            errors.push(`El enganche debe ser al menos del ${Math.round((1 - this.config.aforoMaximo) * 100)}%. (Aforo máximo permitido: ${Math.round(this.config.aforoMaximo * 100)}%)`);
        }

        if (aforoOfrecido < this.config.aforoMinimo) {
            errors.push(`El enganche no puede superar el ${Math.round((1 - this.config.aforoMinimo) * 100)}%. (Aforo mínimo permitido: ${Math.round(this.config.aforoMinimo * 100)}%)`);
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

    calculateDesembolsoInicial(propertyPrice, downPayment) {
        const gastosNotariales = propertyPrice * this.config.porcentajeGastosNotariales;
        const total = downPayment + gastosNotariales + this.config.costoAvaluoBasico + this.config.costoAprobacion;

        return {
            enganche: downPayment,
            gastosNotariales,
            avaluo: this.config.costoAvaluoBasico,
            aprobacion: this.config.costoAprobacion,
            desembolsoTotal: total
        };
    }

    calculateMensualidad(propertyPrice, downPayment, termYears) {
        // En lugar de una estimación burda, devolvemos el Pago Mensual real exacto del Mes 1 (que incluye seguros).
        const validation = this.validateRequirements(propertyPrice, downPayment, termYears);
        if (!validation.isValid) {
            return { error: true, messages: validation.errors };
        }

        const montoCredito = propertyPrice - downPayment;
        const aforo = montoCredito / propertyPrice;

        const desembolso = this.calculateDesembolsoInicial(propertyPrice, downPayment);
        const { table } = this.generateAmortizationTable(propertyPrice, downPayment, termYears);
        const mensualidadEstimada = table[0].pagoMensual; // Cuota total del primer mes con seguros

        return {
            error: false,
            mensualidad: mensualidadEstimada,
            montoCredito,
            aforo,
            desembolsoInicial: desembolso.desembolsoTotal,
            desgloseDesembolso: desembolso,
            tasaAsignada: this.config.tasaInteresAnual,
            nombreProducto: this.config.nombre,
            banco: this.config.banco,
            tablaAmortizacion: table
        };
    }

    generateAmortizationTable(propertyPrice, downPayment, termYears) {
        const validation = this.validateRequirements(propertyPrice, downPayment, termYears);
        if (!validation.isValid) return { error: true, messages: validation.errors };

        const montoCredito = propertyPrice - downPayment;
        const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

        const i_anual = this.config.tasaInteresAnual;
        const n_meses = termYears * 12;
        const DIAS_POR_MES_ESTANDAR = 30.40;
        const DIAS_BASE_ANUAL = 360;
        const diasMes1 = 30.00; // Banorte calcula el primer mes sobre 30 días exactos

        const i_mensual_teorica = (i_anual / DIAS_BASE_ANUAL) * DIAS_POR_MES_ESTANDAR;
        const cuotaBaseExacta = montoCredito * (i_mensual_teorica * Math.pow(1 + i_mensual_teorica, n_meses)) / (Math.pow(1 + i_mensual_teorica, n_meses) - 1);

        const tabla = [];
        let saldo = round2(montoCredito);

        for (let mes = 1; mes <= n_meses; mes++) {
            const diasMes = mes === 1 ? diasMes1 : DIAS_POR_MES_ESTANDAR;

            const interesReal = round2(saldo * (i_anual / DIAS_BASE_ANUAL) * diasMes);
            const interesTeoricoExacto = saldo * (i_anual / DIAS_BASE_ANUAL) * DIAS_POR_MES_ESTANDAR;

            let capital = round2(cuotaBaseExacta - interesTeoricoExacto);

            if (capital > saldo || mes === n_meses) {
                capital = saldo;
            }

            saldo = round2(saldo - capital);
            if (saldo < 0) saldo = 0;

            const factorDiasSeguro = mes === 1 ? (diasMes / 30) : 1;
            const seguroVida = round2((saldo + capital) * this.config.factorSeguroVida * factorDiasSeguro);
            const seguroDanos = round2(propertyPrice * this.config.factorSeguroDanos * factorDiasSeguro);
            const administracion = this.config.comisionAutorizacionDiferida;

            const segurosComisiones = round2(seguroVida + seguroDanos + administracion);
            const pagoMensualTotal = round2(capital + interesReal + segurosComisiones);

            tabla.push({
                mes,
                dias: diasMes,
                saldoInicial: round2(saldo + capital),
                capital,
                interes: interesReal,
                seguroVida,
                seguroDanos,
                administracion,
                segurosComisiones,
                pagoMensual: pagoMensualTotal,
                saldoFinal: saldo
            });
        }

        return { error: false, table: tabla };
    }

    calculateAhorroAbonosCapital(propertyPrice, downPayment, termYears, abonoMensualExtra) {
        // Obtenemos el escenario base sin tocar el código original
        const base = this.generateAmortizationTable(propertyPrice, downPayment, termYears);
        if (base.error) return base;

        const montoCredito = propertyPrice - downPayment;
        const round2 = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

        const i_anual = this.config.tasaInteresAnual;
        const n_meses = termYears * 12;
        const DIAS_POR_MES_ESTANDAR = 30.40;
        const DIAS_BASE_ANUAL = 360;
        const diasMes1 = 30.00; // Banorte calcula el primer mes sobre 30 días exactos

        const i_mensual_teorica = (i_anual / DIAS_BASE_ANUAL) * DIAS_POR_MES_ESTANDAR;
        const cuotaBaseExacta = montoCredito * (i_mensual_teorica * Math.pow(1 + i_mensual_teorica, n_meses)) / (Math.pow(1 + i_mensual_teorica, n_meses) - 1);

        let saldo = round2(montoCredito);
        let mesesAcelerados = 0;
        let totalInteresAcelerado = 0;
        let totalSegurosAcelerado = 0;
        let totalCapitalAcelerado = 0;

        // Simulamos la tabla con el capital extra forzado
        for (let mes = 1; mes <= n_meses; mes++) {
            if (saldo <= 0) break; // Terminado antes de tiempo

            mesesAcelerados++;
            const diasMes = mes === 1 ? diasMes1 : DIAS_POR_MES_ESTANDAR;

            const interesReal = round2(saldo * (i_anual / DIAS_BASE_ANUAL) * diasMes);
            const interesTeoricoExacto = saldo * (i_anual / DIAS_BASE_ANUAL) * DIAS_POR_MES_ESTANDAR;
            totalInteresAcelerado += interesReal;

            // Inyección del abono extra directamente a capital
            let capital = round2(cuotaBaseExacta - interesTeoricoExacto) + abonoMensualExtra;

            if (capital > saldo) {
                capital = saldo; // Liquidación total en este mes
            }

            totalCapitalAcelerado += capital;

            const factorDiasSeguro = mes === 1 ? (diasMes / 30) : 1;
            const seguroVida = round2(saldo * this.config.factorSeguroVida * factorDiasSeguro);
            const seguroDanos = round2(propertyPrice * this.config.factorSeguroDanos * factorDiasSeguro);
            const administracion = this.config.comisionAutorizacionDiferida;
            const segurosComisiones = round2(seguroVida + seguroDanos + administracion);

            totalSegurosAcelerado += segurosComisiones;

            saldo = round2(saldo - capital);
            if (saldo < 0) saldo = 0;
        }

        // Cálculos Base
        let totalInteresBase = 0;
        let totalSegurosBase = 0;
        let totalCapitalBase = 0;
        base.table.forEach(row => {
            totalInteresBase += row.interes;
            totalSegurosBase += row.segurosComisiones;
            totalCapitalBase += row.capital;
        });

        const mesesAhorrados = n_meses - mesesAcelerados;
        const interesAhorrado = totalInteresBase - totalInteresAcelerado;
        const segurosAhorrados = totalSegurosBase - totalSegurosAcelerado;

        return {
            error: false,
            abonoMensualExtra,
            mesesOriginales: n_meses,
            mesesNuevos: mesesAcelerados,
            mesesAhorrados,
            interesOriginal: round2(totalInteresBase),
            interesNuevo: round2(totalInteresAcelerado),
            interesAhorrado: round2(interesAhorrado),
            segurosOriginal: round2(totalSegurosBase),
            segurosNuevo: round2(totalSegurosAcelerado),
            segurosAhorrado: round2(segurosAhorrados),
            capitalTotal: round2(totalCapitalBase)
        };
    }
}
