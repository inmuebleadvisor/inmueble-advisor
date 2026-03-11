// src/components/FinanciamientoWidget.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';
import { FINANZAS } from '../../config/constants';

const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

export default function FinanciamientoWidget({ precio, onSimulate }) {
  if (!precio) return null;

  const enganche = precio * FINANZAS.PORCENTAJE_ENGANCHE_MINIMO;
  const mensualidadAprox = (precio * 0.9) / 1000000 * FINANZAS.FACTOR_MENSUALIDAD_POR_MILLON;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>💰 Plan Hipotecarío</h3>
      <div style={styles.row}>
        <span>Enganche (10%):</span>
        <strong>{formatoMoneda(enganche)}</strong>
      </div>
      <div style={styles.row}>
        <span>Mensualidad Aprox:</span>
        <strong style={{ color: 'var(--primary-color)' }}>{formatoMoneda(mensualidadAprox)}</strong>
      </div>
      <p style={styles.disclaimer}>*Estimación bancaria a 20 años. Sujeto a historial crediticio.</p>
      <button
        className="btn btn-primary btn-full"
        style={{ marginTop: '15px' }}
        onClick={onSimulate}
      >
        Pre-Calificar Crédito.
      </button>
    </div>
  );
}

const styles = {
  card: { backgroundColor: 'var(--bg-secondary)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(0, 57, 106, 0.08)', marginBottom: '24px' },
  title: { margin: '0 0 16px 0', fontSize: '1.1rem', color: 'var(--text-main)', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.95rem', color: 'var(--text-secondary)' },
  disclaimer: { fontSize: '0.7rem', color: 'var(--text-secondary)', opacity: 0.7, marginTop: '12px', fontStyle: 'italic' },
};