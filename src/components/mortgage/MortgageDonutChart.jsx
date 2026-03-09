import React from 'react';
import { formatoMoneda } from '../../utils/formatters';

export const MortgageDonutChart = ({
    result,
    totalCapital,
    totalInteres,
    totalSeguros,
    acceleratedResult,
    extraPayment
}) => {
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
