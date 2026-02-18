import React, { useState } from 'react';
import { FinancialService } from '../../services/financial.service';
import '../../styles/components/home/AffordabilityWidget.css';

/**
 * @file AffordabilityWidget.jsx
 * @description Widget financiero para la Home.
 * @responsibility Calcular presupuesto máximo basado en ingresos y enganche.
 */
export default function AffordabilityWidget() {
    const [ingreso, setIngreso] = useState(''); // Mensualidad o Ingreso (asumimos monthly payment capacity logic directly or 30%)
    // Didáctico: Para simplificar y alinear con FinancialService.calculateAffordability(capital, monthlyPayment),
    // pediremos "Pago Mensual que puedes cubrir" O "Ingreso Mensual" y calcularemos el 30% internamente si es ingreso.
    // UX Decision: Pedir "Cuánto puedes pagar al mes" es más directo para la fórmula existente.

    const [enganche, setEnganche] = useState('');
    const [resultado, setResultado] = useState(null);

    const financialService = new FinancialService();

    const calcular = (e) => {
        e.preventDefault();
        const capMensual = parseFloat(ingreso) || 0;
        const capitalInicial = parseFloat(enganche) || 0;

        // Lógica de negocio (Servicio)
        const { maxBudget, dynamicNote, isAlert } = financialService.calculateAffordability(capitalInicial, capMensual);

        setResultado({ maxBudget, dynamicNote, isAlert });
    };

    const formatoMoneda = (val) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="affordability-widget">
            <h3 className="affordability-widget__title">Calculadora</h3>
            <p className="affordability-widget__desc">Descubre tu poder de compra</p>

            <form onSubmit={calcular} className="affordability-widget__form">
                <div className="affordability-widget__field">
                    <label>¿Cuánto puedes pagar al mes?</label>
                    <input
                        type="number"
                        placeholder="$20,000"
                        value={ingreso}
                        onChange={(e) => setIngreso(e.target.value)}
                        required
                    />
                </div>

                <div className="affordability-widget__field">
                    <label>¿Cuánto enganche tienes?</label>
                    <input
                        type="number"
                        placeholder="$100,000"
                        value={enganche}
                        onChange={(e) => setEnganche(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="affordability-widget__btn">
                    Calcular Presupuesto
                </button>
            </form>

            {resultado && (
                <div className={`affordability-widget__result ${resultado.isAlert ? 'affordability-widget__result--alert' : ''}`}>
                    <span className="affordability-widget__result-label">Monto Máximo de Propiedad:</span>
                    <span className="affordability-widget__result-value">{formatoMoneda(resultado.maxBudget)}</span>
                    <p className="affordability-widget__result-note">{resultado.dynamicNote}</p>
                </div>
            )}
        </div>
    );
}
