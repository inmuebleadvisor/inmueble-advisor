import React, { useState, useEffect } from 'react';
import { useMortgageSimulator } from '../../hooks/useMortgageSimulator';
import { formatoMoneda } from '../../utils/formatters';
import './MortgageSimulatorModal.css';

const Icons = {
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Calculator: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>
};

export default function MortgageSimulatorModal({ initialPrice = 1000000, onClose }) {
    const { simulate, isLoading, result, errorMessages } = useMortgageSimulator();
    const lastValidMensualidad = React.useRef(0);

    const [price, setPrice] = useState(initialPrice);
    const [downPayment, setDownPayment] = useState(initialPrice * 0.10); // 10% base
    const [term, setTerm] = useState(20); // 20 years base

    // Inicializar income con el valor guardado si existe, de lo contrario un valor temporal (se ajustará con minIncome)
    const [savedIncome, setSavedIncome] = useState(() => {
        const saved = localStorage.getItem('userMortgageIncome');
        return saved ? Number(saved) : null;
    });
    const [income, setIncome] = useState(savedIncome || (initialPrice * 0.05));

    // Evita el scroll del body al abrir
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    // Simulación Reactiva en Tiempo Real
    useEffect(() => {
        simulate(Number(price), Number(downPayment), Number(term));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [price, downPayment, term]);

    // Helpers de Formato
    const parseNumber = (val) => Number(String(val).replace(/\D/g, ''));
    const displayFormat = (num) => num ? new Intl.NumberFormat('en-US').format(num) : '';

    // Cálculos de Totales y Promedios
    let promedioMensualidad = 0;
    let totalCapital = 0;
    let totalInteres = 0;
    let totalSeguros = 0;
    let pagoTotalHistograma = 0;

    if (result && result.tablaAmortizacion && result.tablaAmortizacion.length > 0) {
        let sumMensualidad = 0;
        result.tablaAmortizacion.forEach(row => {
            sumMensualidad += row.pagoMensual;
            totalCapital += row.capital;
            totalInteres += row.interes;
            totalSeguros += row.segurosComisiones;
        });
        promedioMensualidad = sumMensualidad / result.tablaAmortizacion.length;
        pagoTotalHistograma = totalCapital + totalInteres + totalSeguros;
        lastValidMensualidad.current = promedioMensualidad;
    } else if (isLoading) {
        promedioMensualidad = lastValidMensualidad.current;
    }

    const minIncome = promedioMensualidad > 0 ? promedioMensualidad / 0.4 : 25000;

    useEffect(() => {
        if (minIncome > 0) {
            if (savedIncome && savedIncome >= minIncome) {
                setIncome(savedIncome);
            } else {
                setIncome(minIncome);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [minIncome, savedIncome]);

    const dti = income > 0 ? (promedioMensualidad / income) * 100 : 0;
    const dtiMessage = dti <= 30 ? '¡Excelente nivel!' : dti <= 40 ? '¡Buena opción!' : 'Nivel de riesgo';

    // Escala de 20% a 60%
    // 20% DTI -> 0% de la barra
    // 60% DTI -> 100% de la barra
    let leftPos = ((dti - 20) / (60 - 20)) * 100;
    if (leftPos > 100) leftPos = 100;
    if (leftPos < 0) leftPos = 0;

    const renderAmortizationTable = () => {
        if (!result || !result.tablaAmortizacion) return null;

        return (
            <div className="mortgage-dashboard-card mb-4 mt-4">
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Tabla de Pagos</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>El detalle de cada mes de tu crédito.</p>
                </div>

                <div style={{ overflowX: 'auto', margin: '0 -20px', padding: '0 20px' }}>
                    <table className="mortgage-table">
                        <thead>
                            <tr>
                                <th>MES</th>
                                <th>SALDO INICIAL</th>
                                <th>A CAPITAL</th>
                                <th>A INTERÉS</th>
                                <th>COMPLEMENTOS</th>
                                <th className="col-highlight">PAGO TOTAL</th>
                                <th>SALDO FINAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.tablaAmortizacion.slice(0, 12).map((row) => (
                                <tr key={row.mes}>
                                    <td style={{ fontWeight: 700, color: '#64748b' }}>{row.mes}</td>
                                    <td>{formatoMoneda(row.saldoInicial)}</td>
                                    <td className="col-capital">+ {formatoMoneda(row.capital)}</td>
                                    <td className="col-interest">{formatoMoneda(row.interes)}</td>
                                    <td className="col-insurance">{formatoMoneda(row.segurosComisiones)}</td>
                                    <td className="col-highlight-cell">{formatoMoneda(row.pagoMensual)}</td>
                                    <td style={{ fontWeight: 700 }}>{formatoMoneda(row.saldoFinal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {result.tablaAmortizacion.length > 12 && (
                        <div style={{ textAlign: 'center', marginTop: '20px', paddingBottom: '10px' }}>
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                Mostrando primeros 12 meses de {result.tablaAmortizacion.length}.
                            </span>
                            <button className="mortgage-text-link" style={{ marginLeft: '8px' }}>Ver todo el detalle</button>
                        </div>
                    )}
                </div>
            </div>
        );
    };


    return (
        <div className="mortgage-modal-overlay" onClick={onClose}>
            <div className="mortgage-modal-content" onClick={(e) => e.stopPropagation()}>

                <header className="mortgage-modal__header">
                    <div className="mortgage-modal__title-box">
                        <div className="mortgage-modal__icon">
                            <Icons.Calculator />
                        </div>
                        <div>
                            <h2 className="mortgage-modal__title">Simulador de Crédito</h2>
                            <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                                Calculado con "Hipoteca Fuerte" <strong style={{ color: '#EB0029', fontWeight: 800, fontSize: '0.9rem', marginLeft: '4px' }}>BANORTE</strong>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="mortgage-modal__close-btn" aria-label="Cerrar">
                        <Icons.Close />
                    </button>
                </header>

                <div className="mortgage-modal__body">
                    {/* Tus Controles y Gráfico */}
                    <div className="mortgage-dashboard-card mb-5 mt-4">

                        <div className="mortgage-result-dashboard" style={{ alignItems: 'center' }}>
                            <div className="mortgage-controls-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                                            }}
                                            min={500000}
                                            max={15000000}
                                            step={50000}
                                        />
                                    </div>
                                </div>

                                {/* Downpayment Control */}
                                <div className="mortgage-form__group" style={{ marginBottom: 0 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                        <label className="mortgage-form__label" style={{ marginBottom: 0, fontSize: '0.8rem', display: 'flex', alignItems: 'center' }}>
                                            ENGANCHE ({((downPayment / price) * 100).toFixed(0)}%)
                                            <span className="mortgage-tooltip">?
                                                <span className="mortgage-tooltip__text">Entre más enganche, menos crédito y menos mensualidad</span>
                                            </span>
                                        </label>
                                        <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '1rem' }}>{formatoMoneda(downPayment)}</span>
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
                                            step={1000}
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

                        </div>
                    </div>

                    {/* Hero Card */}
                    <div className="mortgage-result-hero-new" style={{ marginTop: '24px' }}>
                        <span className="hero-subtitle">TU PAGO MENSUAL ESTIMADO</span>
                        <div className="hero-payment">{formatoMoneda(promedioMensualidad)}</div>
                        <span className="hero-context">*Incluye capital, intereses y seguros.</span>
                    </div>

                    {/* Salud Financiera */}
                    <div className="mortgage-dashboard-card mb-4 mt-4" style={{ textAlign: 'center' }}>
                        <h3 className="dashboard-card-title" style={{ fontSize: '0.8rem', color: '#64748b', letterSpacing: '0.05em', textAlign: 'center' }}>SALUD FINANCIERA</h3>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '16px', color: '#0f172a' }}>SEMÁFORO DE SALUD FINANCIERA</div>

                        <div style={{ padding: '0 16px' }}>
                            <div style={{ height: '10px', width: '100%', background: 'linear-gradient(90deg, #16a34a 0%, #16a34a 25%, #ca8a04 50%, #dc2626 75%, #dc2626 100%)', borderRadius: '5px', position: 'relative', marginBottom: '8px' }}>
                                <div style={{ position: 'absolute', top: '-5px', left: `${leftPos}%`, width: '20px', height: '20px', backgroundColor: '#fff', border: '4px solid #94a3b8', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease-out' }}></div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
                                <span style={{ color: '#16a34a' }}>Cómodo</span>
                                <span style={{ color: '#ca8a04' }}>Moderado</span>
                                <span style={{ color: '#dc2626' }}>Riesgo</span>
                            </div>
                        </div>

                        <div style={{ marginTop: '16px', fontSize: '0.85rem', color: '#475569', backgroundColor: '#f1f5f9', padding: '8px 16px', borderRadius: '16px', display: 'inline-block', fontWeight: 500 }}>
                            Tus pagos representan el <strong>{dti.toFixed(1)}%</strong> de tu ingreso. {dtiMessage}
                        </div>
                    </div>


                    {/* Pago Adelantado */}
                    <div className="mortgage-dashboard-card mb-4 mt-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', textAlign: 'center' }}>
                        <h3 className="dashboard-card-title" style={{ fontSize: '0.8rem', color: '#166534', letterSpacing: '0.05em', borderBottomColor: '#bbf7d0', textAlign: 'center' }}>PAGO ADELANTADO</h3>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', marginBottom: '16px' }}>¡ADIÓS DEUDA ANTES!</div>

                        <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', color: '#166534', fontWeight: 700, marginBottom: '8px' }}>Pago extra anual opcional:</label>
                            <input type="text" value="$10,000" disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #bbf7d0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 700, fontSize: '1rem', outline: 'none' }} />
                        </div>

                        <div style={{ backgroundColor: '#16a34a', color: '#fff', padding: '16px', borderRadius: '8px', fontWeight: 800, fontSize: '1rem', boxShadow: '0 4px 6px rgba(22, 163, 74, 0.2)' }}>
                            ¡AHORRARÍAS 3 AÑOS Y $150,000 EN INTERESES!
                        </div>
                    </div>

                    {renderAmortizationTable()}

                    <p className="mortgage-result__disclaimer" style={{ marginTop: '32px', fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center', fontStyle: 'italic', lineHeight: '1.5' }}>
                        * Este cálculo es únicamente una simulación informativa con fines ilustrativos y no representa una oferta o un compromiso formal de crédito por parte del banco o Inmueble Advisor. La tasa y mensualidad final están sujetas a evaluación y políticas de la institución financiera.
                    </p>
                </div>
            </div>
        </div>
    );
}
