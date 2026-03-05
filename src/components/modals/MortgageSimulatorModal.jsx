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

    const [price, setPrice] = useState(initialPrice);
    const [downPayment, setDownPayment] = useState(initialPrice * 0.10); // 10% base
    const [term, setTerm] = useState(20); // 20 years base

    const [activeTab, setActiveTab] = useState('simular'); // 'simular' | 'resultado' | 'tabla'

    // Evita el scroll del body al abrir
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    const handleSimulate = async (e) => {
        e.preventDefault();
        await simulate(Number(price), Number(downPayment), Number(term));
        if (errorMessages.length === 0) {
            setActiveTab('resultado');
        }
    };

    return (
        <div className="mortgage-modal-overlay" onClick={onClose}>
            <div className="mortgage-modal-content" onClick={(e) => e.stopPropagation()}>

                <header className="mortgage-modal__header">
                    <div className="mortgage-modal__title-box">
                        <div className="mortgage-modal__icon">
                            <Icons.Calculator />
                        </div>
                        <h2 className="mortgage-modal__title">Simulador de Crédito</h2>
                    </div>
                    <button onClick={onClose} className="mortgage-modal__close-btn" aria-label="Cerrar">
                        <Icons.Close />
                    </button>
                </header>

                <div className="mortgage-modal__body">
                    <div className="mortgage-tabs">
                        <button
                            className={`mortgage-tab ${activeTab === 'simular' ? 'mortgage-tab--active' : ''}`}
                            onClick={() => setActiveTab('simular')}
                        >
                            Configurar
                        </button>
                        <button
                            className={`mortgage-tab ${activeTab === 'resultado' ? 'mortgage-tab--active' : ''}`}
                            onClick={() => result ? setActiveTab('resultado') : null}
                            disabled={!result}
                            style={{ opacity: !result ? 0.5 : 1, cursor: !result ? 'not-allowed' : 'pointer' }}
                        >
                            Resultado
                        </button>
                        <button
                            className={`mortgage-tab ${activeTab === 'tabla' ? 'mortgage-tab--active' : ''}`}
                            onClick={() => result ? setActiveTab('tabla') : null}
                            disabled={!result}
                            style={{ opacity: !result ? 0.5 : 1, cursor: !result ? 'not-allowed' : 'pointer' }}
                        >
                            Tabla de Pagos
                        </button>
                    </div>

                    {activeTab === 'simular' ? (
                        <form onSubmit={handleSimulate}>
                            <div className="mortgage-form__group">
                                <label className="mortgage-form__label">Valor del Inmueble</label>
                                <div className="mortgage-form__input-wrapper">
                                    <span className="mortgage-form__prefix">$</span>
                                    <input
                                        type="number"
                                        className="mortgage-form__input"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        min="100000"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mortgage-form__group">
                                <label className="mortgage-form__label">Tu Enganche (Ahorro)</label>
                                <div className="mortgage-form__input-wrapper">
                                    <span className="mortgage-form__prefix">$</span>
                                    <input
                                        type="number"
                                        className="mortgage-form__input"
                                        value={downPayment}
                                        onChange={(e) => setDownPayment(e.target.value)}
                                        min="0"
                                        max={price * 0.50}
                                        required
                                    />
                                </div>
                                <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>
                                    Aforo calculado: {((1 - (downPayment / price)) * 100).toFixed(1)}% (El banco presta este porcentaje)
                                </div>
                            </div>

                            <div className="mortgage-form__group">
                                <label className="mortgage-form__label">Plazo del Crédito</label>
                                <select
                                    className="mortgage-form__select"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                >
                                    <option value={5}>5 Años</option>
                                    <option value={10}>10 Años</option>
                                    <option value={15}>15 Años</option>
                                    <option value={20}>20 Años</option>
                                </select>
                            </div>

                            {errorMessages.length > 0 && (
                                <div className="mortgage-error-box">
                                    <strong>No es posible realizar la simulación:</strong>
                                    <ul>
                                        {errorMessages.map((err, i) => <li key={i}>{err}</li>)}
                                    </ul>
                                </div>
                            )}

                            <div className="mortgage-form__action">
                                <button type="submit" className="mortgage-btn-simulate" disabled={isLoading}>
                                    {isLoading ? 'Calculando...' : 'Calcular Mensualidad'}
                                </button>
                            </div>
                        </form>
                    ) : activeTab === 'resultado' ? (
                        <div className="mortgage-result">
                            <div className="mortgage-result__hero">
                                <div className="mortgage-result__hero-label">Mensualidad Estimada</div>
                                <div className="mortgage-result__payment">{formatoMoneda(result?.mensualidad)}</div>
                            </div>

                            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px', border: '1px solid #bbf7d0', marginBottom: '24px', textAlign: 'center' }}>
                                <div style={{ fontSize: '0.875rem', color: '#166534', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Desembolso Inicial Requerido
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#14532d' }}>
                                    {formatoMoneda(result?.desembolsoInicial)}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '6px' }}>
                                    Incluye tu enganche ({formatoMoneda(result?.desgloseDesembolso?.enganche)}), gastos notariales ({formatoMoneda(result?.desgloseDesembolso?.gastosNotariales)}), avalúo y comisión de apertura.
                                </div>
                            </div>

                            <div className="mortgage-result__grid">
                                <div className="mortgage-result__card">
                                    <div className="mortgage-result__card-label">Monto a Financiar</div>
                                    <div className="mortgage-result__card-value">{formatoMoneda(result?.montoCredito)}</div>
                                </div>
                                <div className="mortgage-result__card">
                                    <div className="mortgage-result__card-label">Aforo Final</div>
                                    <div className="mortgage-result__card-value">{(result?.aforo * 100).toFixed(1)}%</div>
                                </div>
                                <div className="mortgage-result__card">
                                    <div className="mortgage-result__card-label">Tasa Anual Asignada</div>
                                    <div className="mortgage-result__card-value">{(result?.tasaAsignada * 100).toFixed(2)}%</div>
                                </div>
                                <div className="mortgage-result__card">
                                    <div className="mortgage-result__card-label">Producto</div>
                                    <div className="mortgage-result__card-value">{result?.nombreProducto}</div>
                                </div>
                            </div>

                            <p className="mortgage-result__disclaimer">
                                * Este cálculo es únicamente una simulación informativa con fines ilustrativos y no representa una oferta o un compromiso formal de crédito por parte del banco o Inmueble Advisor. La tasa y mensualidad final están sujetas a evaluación y políticas de la institución financiera.
                            </p>
                        </div>
                    ) : activeTab === 'tabla' && result?.tablaAmortizacion ? (
                        <div className="mortgage-table-container" style={{ marginTop: '0px', overflowX: 'auto' }}>
                            <table className="mortgage-table" style={{ width: '100%', minWidth: '700px', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'right' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', color: '#475569', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700 }}>
                                        <th style={{ padding: '12px 8px', textAlign: 'center' }}>Mes</th>
                                        <th style={{ padding: '12px 8px' }}>Saldo Inicial</th>
                                        <th style={{ padding: '12px 8px', color: '#16a34a' }}>A Capital</th>
                                        <th style={{ padding: '12px 8px', color: '#ea580c' }}>A Interés</th>
                                        <th style={{ padding: '12px 8px' }}>Seguros/Com.</th>
                                        <th style={{ padding: '12px 8px', color: '#1e3a8a' }}>Pago Mensual</th>
                                        <th style={{ padding: '12px 8px' }}>Saldo Final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.tablaAmortizacion.map((row) => (
                                        <tr key={row.mes} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                            <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{row.mes}</td>
                                            <td style={{ padding: '12px 8px' }}>{formatoMoneda(row.saldoInicial)}</td>
                                            <td style={{ padding: '12px 8px', color: '#16a34a', fontWeight: '500' }}>+{formatoMoneda(row.capital)}</td>
                                            <td style={{ padding: '12px 8px', color: '#ea580c' }}>{formatoMoneda(row.interes)}</td>
                                            <td style={{ padding: '12px 8px' }}>{formatoMoneda(row.segurosComisiones)}</td>
                                            <td style={{ padding: '12px 8px', color: '#1e3a8a', fontWeight: '700' }}>{formatoMoneda(row.pagoMensual)}</td>
                                            <td style={{ padding: '12px 8px', color: '#475569' }}>{formatoMoneda(row.saldoFinal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
