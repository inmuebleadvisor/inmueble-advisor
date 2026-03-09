import React from 'react';
import { formatoMoneda } from '../../utils/formatters';

export const SimulatorControls = ({
    price,
    setPrice,
    setHasModifiedPrice,
    downPayment,
    setDownPayment,
    result,
    income,
    setIncome,
    setSavedIncome,
    minIncome,
    term,
    setTerm
}) => {
    return (
        <div className="mortgage-controls-grid">
            {/* Price Control */}
            <div className="mortgage-form__group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <label className="mortgage-form__label" style={{ marginBottom: 0, fontSize: '0.8rem' }}>VALOR DE LA CASA</label>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{formatoMoneda(price)}</span>
                </div>
                <div className="mortgage-slider-wrapper" style={{ marginTop: '4px' }}>
                    <input
                        type="range"
                        className="mortgage-slider"
                        value={price}
                        onChange={(e) => {
                            const newPrice = Number(e.target.value);
                            const currentDownPaymentRatio = price > 0 ? (downPayment / price) : 0.10;

                            setPrice(newPrice);
                            setDownPayment(newPrice * currentDownPaymentRatio);
                            setHasModifiedPrice(true);
                        }}
                        min={500000}
                        max={6000000}
                        step={50000}
                    />
                </div>
            </div>

            {/* Downpayment Control */}
            <div className="mortgage-form__group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <label className="mortgage-form__label" style={{ marginBottom: 0, fontSize: '0.75rem', display: 'flex', alignItems: 'center' }}>
                        ENGANCHE + ESCRITURA + APERTURA
                        <span className="mortgage-tooltip">?
                            <span className="mortgage-tooltip__text">Es el total de efectivo que utilizarás para comprar la casa. El mínimo es el 15% del valor de la vivienda</span>
                        </span>
                    </label>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>
                        {formatoMoneda(result?.desembolsoInicial || (downPayment + (price * 0.051) + 5800 + 750))}
                    </span>
                </div>
                <div className="mortgage-slider-wrapper" style={{ marginTop: '4px' }}>
                    <input
                        type="range"
                        className="mortgage-slider"
                        value={downPayment}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        min={price * 0.10}
                        max={price * 0.50}
                        step={1000}
                    />
                </div>
            </div>

            {/* Income Control */}
            <div className="mortgage-form__group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                    <label className="mortgage-form__label" style={{ marginBottom: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                        {income <= minIncome ? 'INGRESO FAMILIAR MÍNIMO' : 'INGRESO FAMILIAR'}
                        <span className="mortgage-tooltip">?
                            <span className="mortgage-tooltip__text">Es clave, el banco no te permite pagar más del 40% de tu ingreso</span>
                        </span>
                    </label>
                    <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{formatoMoneda(income)}</span>
                </div>
                <div className="mortgage-slider-wrapper" style={{ marginTop: '4px' }}>
                    <input
                        type="range"
                        className="mortgage-slider"
                        value={income}
                        onChange={(e) => {
                            const newIncome = Number(e.target.value);
                            setIncome(newIncome);
                            setSavedIncome(newIncome);
                            localStorage.setItem('userMortgageIncome', newIncome);
                        }}
                        min={minIncome}
                        max={minIncome * 3}
                        step={500}
                    />
                </div>
            </div>

            {/* Plazo (Pills) */}
            <div className="mortgage-form__group" style={{ marginBottom: 0 }}>
                <label className="mortgage-form__label" style={{ fontSize: '0.8rem' }}>PLAZO (AÑOS)</label>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    {[5, 10, 15, 20].map(y => (
                        <button
                            key={y}
                            onClick={() => setTerm(y)}
                            className={`mortgage-pill ${Number(term) === y ? 'active' : ''}`}
                        >
                            {y}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
