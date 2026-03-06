import React, { useState, useEffect } from 'react';
import { useMortgageSimulator } from '../../hooks/useMortgageSimulator';
import { useShareSimulatorPDF } from '../../hooks/useShareSimulatorPDF';
import { formatoMoneda } from '../../utils/formatters';
import './MortgageSimulatorModal.css';

const Icons = {
    Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Calculator: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>,
    Bed: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></svg>,
    Bath: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /><line x1="10" y1="5" x2="8" y2="7" /><line x1="2" y1="12" x2="22" y2="12" /><line x1="7" y1="19" x2="7" y2="21" /><line x1="17" y1="19" x2="17" y2="21" /></svg>,
    Area: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>,
    Share: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
};

export default function MortgageSimulatorModal({ initialPrice = 1000000, propertyData = null, onClose }) {
    const { simulate, simulateAccelerated, isLoading, result, errorMessages } = useMortgageSimulator();
    const lastValidMensualidad = React.useRef(0);

    const [price, setPrice] = useState(initialPrice);
    const [downPayment, setDownPayment] = useState(initialPrice * 0.10); // 10% base
    const [term, setTerm] = useState(20); // 20 years base
    const [hasModifiedPrice, setHasModifiedPrice] = useState(false);

    // Hook to handle PDF Sharing 
    const { generateAndSharePDF, isGeneratingPDF } = useShareSimulatorPDF();

    // Inicializar income con el valor guardado si existe, de lo contrario un valor temporal (se ajustará con minIncome)
    const [savedIncome, setSavedIncome] = useState(() => {
        const saved = localStorage.getItem('userMortgageIncome');
        return saved ? Number(saved) : null;
    });
    const [income, setIncome] = useState(savedIncome || (initialPrice * 0.05));

    // Estados para Pago Adelantado
    const [extraPayment, setExtraPayment] = useState(0); // Iniciamos en 0 a petición del usuario
    const [acceleratedResult, setAcceleratedResult] = useState(null);
    const [showFullTable, setShowFullTable] = useState(false);

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

    // Simulación Secundaria Acelerada
    useEffect(() => {
        if (extraPayment > 0) {
            setAcceleratedResult(simulateAccelerated(Number(price), Number(downPayment), Number(term), Number(extraPayment)));
        } else {
            setAcceleratedResult(null);
        }
    }, [price, downPayment, term, extraPayment, simulateAccelerated]);

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

    const minIncomeRaw = promedioMensualidad > 0 ? promedioMensualidad / 0.4 : 25000;
    const minIncome = Math.ceil(minIncomeRaw / 500) * 500; // Redondeo al alza a 500 para paso limpio

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

    const renderDonutChart = () => {
        if (!result) return null;

        const activeCapital = (acceleratedResult && acceleratedResult.capitalTotal > 0) ? acceleratedResult.capitalTotal : totalCapital;
        const activeInteres = (acceleratedResult && extraPayment > 0) ? acceleratedResult.interesNuevo : totalInteres;
        const activeSeguros = (acceleratedResult && extraPayment > 0) ? acceleratedResult.segurosNuevo : totalSeguros;

        const total = activeCapital + activeInteres + activeSeguros;
        if (total === 0) return null;

        const pCapital = total > 0 ? (activeCapital / total) * 100 : 0;
        const pInteres = total > 0 ? (activeInteres / total) * 100 : 0;
        const pSeguros = total > 0 ? (activeSeguros / total) * 100 : 0;

        const r = 45;
        const circ = 2 * Math.PI * r;

        // Offsets
        const dashCapital = (pCapital / 100) * circ;
        const dashInteres = (pInteres / 100) * circ;
        const dashSeguros = (pSeguros / 100) * circ;

        // La suma de los anteriores para ir recorriendo el offset en negativo
        const offsetInteres = -dashCapital;
        const offsetSeguros = -(dashCapital + dashInteres);

        return (
            <div className="mortgage-chart-wrapper" style={{ justifyContent: 'flex-start', margin: '0', backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #bbf7d0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="mortgage-donut-container">
                    <svg viewBox="0 0 100 100" className="mortgage-donut">
                        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f1f5f9" strokeWidth="10" />

                        {/* Capital - Verde */}
                        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#10b981" strokeWidth="10"
                            strokeDasharray={`${dashCapital} ${circ}`} strokeDashoffset={0} />

                        {/* Interés - Naranja */}
                        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#f59e0b" strokeWidth="10"
                            strokeDasharray={`${dashInteres} ${circ}`} strokeDashoffset={offsetInteres} />

                        {/* Seguros - Azul/Gris */}
                        <circle cx="50" cy="50" r={r} fill="transparent" stroke="#94a3b8" strokeWidth="10"
                            strokeDasharray={`${dashSeguros} ${circ}`} strokeDashoffset={offsetSeguros} />
                    </svg>
                </div>
                <div className="mortgage-chart-legend" style={{ textAlign: 'left' }}>
                    <div className="chart-legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#10b981' }}></span>
                        <div>
                            <div className="legend-label">Capital ({isNaN(pCapital) ? 0 : pCapital.toFixed(0)}%)</div>
                            <div className="legend-value">{formatoMoneda(activeCapital || 0)}</div>
                        </div>
                    </div>
                    <div className="chart-legend-item">
                        <span className="legend-dot" style={{ backgroundColor: '#f59e0b' }}></span>
                        <div>
                            <div className="legend-label">Intereses ({isNaN(pInteres) ? 0 : pInteres.toFixed(0)}%)</div>
                            <div className="legend-value">{formatoMoneda(activeInteres || 0)}</div>
                        </div>
                    </div>
                    <div className="chart-legend-item" style={{ marginBottom: 0 }}>
                        <span className="legend-dot" style={{ backgroundColor: '#94a3b8' }}></span>
                        <div>
                            <div className="legend-label">Seguros ({isNaN(pSeguros) ? 0 : pSeguros.toFixed(0)}%)</div>
                            <div className="legend-value">{formatoMoneda(activeSeguros || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderAmortizationTable = () => {
        if (!result || !result.tablaAmortizacion) return null;

        return (
            <div className="mortgage-dashboard-card mb-4 mt-4">
                <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>Tabla de Pagos</h3>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0 }}>El detalle de cada mes de tu crédito.</p>
                    {extraPayment > 0 && (
                        <p style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600, marginTop: '8px', fontStyle: 'italic' }}>
                            *Pagos en base a crédito base sin considerar abonos extras
                        </p>
                    )}
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
                            {(showFullTable ? result.tablaAmortizacion : result.tablaAmortizacion.slice(0, 12)).map((row) => (
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
                                {showFullTable
                                    ? `Mostrando todos los ${result.tablaAmortizacion.length} meses.`
                                    : `Mostrando primeros 12 meses de ${result.tablaAmortizacion.length}.`}
                            </span>
                            <button
                                onClick={() => setShowFullTable(!showFullTable)}
                                className="mortgage-text-link"
                                style={{ marginLeft: '8px' }}
                            >
                                {showFullTable ? 'Ver menos' : 'Ver todo el detalle'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleSharePDF = async () => {
        const payload = {
            propertyData,
            hasModifiedPrice,
            price,
            term,
            downPayment,
            result,
            promedioMensualidad,
            extraPayment,
            acceleratedResult
        };

        await generateAndSharePDF(payload);
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleSharePDF}
                            className={`mortgage-modal__share-btn ${isGeneratingPDF ? 'is-loading' : ''}`}
                            aria-label="Compartir en PDF"
                            title="Descargar PDF"
                            disabled={isGeneratingPDF}
                        >
                            {isGeneratingPDF ? (
                                <>
                                    <div className="mortgage-modal__spinner"></div>
                                    <span className="mortgage-modal__btn-text">Generando PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Icons.Share />
                                    <span className="mortgage-modal__btn-text">Compartir PDF</span>
                                </>
                            )}
                        </button>
                        <button onClick={onClose} className="mortgage-modal__close-btn" aria-label="Cerrar">
                            <Icons.Close />
                        </button>
                    </div>
                </header>

                <div className="mortgage-modal__body">
                    {/* Property Header (Inyectado si existe propertyData y no se ha modificado el precio original) */}
                    {propertyData && !hasModifiedPrice && (
                        <div className="mortgage-modal__property-card">
                            {propertyData.image && (
                                <img src={propertyData.image} alt={propertyData.title} className="mortgage-modal__property-thumb" />
                            )}
                            <div className="mortgage-modal__property-info">
                                <div className="mortgage-modal__property-header">
                                    {propertyData.subtitle && (
                                        <div className="mortgage-modal__property-type-text">
                                            {propertyData.subtitle}
                                            {propertyData.deliveryStatus && ` - ${propertyData.deliveryStatus}`}
                                        </div>
                                    )}
                                    <h3 className="mortgage-modal__property-title">
                                        {propertyData.title}
                                        {propertyData.developmentName && (
                                            <span style={{ fontWeight: 600, color: '#64748b', fontSize: '0.95em' }}>
                                                en {propertyData.developmentName}
                                            </span>
                                        )}
                                    </h3>
                                </div>

                                {propertyData.bedrooms && (
                                    <div className="mortgage-modal__property-features">
                                        <span className="mortgage-modal__property-feat">
                                            <Icons.Bed /> <span><strong>{propertyData.bedrooms}</strong> Hab.</span>
                                        </span>
                                        <span className="mortgage-modal__property-feat">
                                            <Icons.Bath /> <span><strong>{propertyData.bathrooms}</strong> Baños</span>
                                        </span>
                                        {propertyData.area && (
                                            <span className="mortgage-modal__property-feat">
                                                <Icons.Area /> <span><strong>{propertyData.area}</strong> m²</span>
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Tus Controles y Gráfico */}
                    <div className="mortgage-dashboard-card mb-5 mt-4">
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
                    </div>

                    {/* Hero Card */}
                    <div className="mortgage-result-hero-new" style={{ marginTop: '24px' }}>
                        <span className="hero-subtitle">TU PAGO MENSUAL ESTIMADO</span>
                        <div className="hero-payment">{formatoMoneda(promedioMensualidad)}</div>
                        <span className="hero-context">*Incluye capital, intereses y seguros.</span>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '32px',
                            marginTop: '24px',
                            paddingTop: '20px',
                            borderTop: '1px solid #f1f5f9',
                            maxWidth: '450px',
                            margin: '24px auto 0 auto'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>Monto del Préstamo</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{formatoMoneda(result?.montoCredito || 0)}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.7rem', color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '4px' }}>Efectivo Necesario</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a' }}>{formatoMoneda(result?.desembolsoInicial || 0)}</div>
                            </div>
                        </div>
                    </div>


                    {/* Pago Adelantado */}
                    <div className="mortgage-dashboard-card mb-4 mt-4" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', textAlign: 'center' }}>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#14532d', marginBottom: '16px' }}>¿Quieres pagar menos intereses?</div>

                        <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 700 }}>Abono mensual extra:</label>
                                <span style={{ fontWeight: 800, color: '#14532d', fontSize: '1.1rem' }}>{formatoMoneda(extraPayment)}</span>
                            </div>
                            <div className="mortgage-slider-wrapper">
                                <input
                                    type="range"
                                    className="mortgage-slider"
                                    style={{ accentColor: '#16a34a' }}
                                    value={extraPayment}
                                    onChange={(e) => setExtraPayment(Number(e.target.value))}
                                    min={0}
                                    max={5000}
                                    step={500}
                                />
                            </div>
                        </div>

                        <div className="mortgage-savings-grid" style={{ marginTop: '24px' }}>
                            {renderDonutChart()}

                            {acceleratedResult && acceleratedResult.mesesAhorrados > 0 ? (
                                <div className="mortgage-savings-box mortgage-savings-box--success">
                                    <div style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: '4px' }}>
                                        ¡AHORRARÍAS {(acceleratedResult.mesesAhorrados / 12).toFixed(1)} AÑOS!
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600 }}>
                                        Y {formatoMoneda(acceleratedResult.interesAhorrado)} en intereses
                                    </div>
                                </div>
                            ) : (
                                <div className="mortgage-savings-box mortgage-savings-box--empty">
                                    Mueve el control para ver cuánto ahorrarías depositando un poco extra cada mes.
                                </div>
                            )}
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
