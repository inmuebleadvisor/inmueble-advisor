import React, { useState } from 'react';
import { formatoMoneda } from '../../utils/formatters';

export const AmortizationTable = ({ result, extraPayment }) => {
    const [showFullTable, setShowFullTable] = useState(false);

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
