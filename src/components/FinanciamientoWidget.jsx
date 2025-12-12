// src/components/FinanciamientoWidget.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';
import { FINANZAS } from '../config/constants';

const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

export default function FinanciamientoWidget({ precio }) {
  if (!precio) return null;

  const enganche = precio * FINANZAS.PORCENTAJE_ENGANCHE_MINIMO;
  const mensualidadAprox = (precio * 0.9) / 1000000 * FINANZAS.FACTOR_MENSUALIDAD_POR_MILLON;

  return (
    <div style={styles.card}>
      <h3 style={styles.title}>💰 Cálculo Rápido</h3>
      <div style={styles.row}>
        <span>Enganche (10%):</span>
        <strong>{formatoMoneda(enganche)}</strong>
      </div>
      <div style={styles.row}>
        <span>Mensualidad Aprox:</span>
        <strong style={{ color: 'var(--primary-color)' }}>{formatoMoneda(mensualidadAprox)}</strong>
      </div>
      <p style={styles.disclaimer}>*Estimación bancaria a 20 años. Sujeto a historial crediticio.</p>
      <button className="btn btn-primary btn-full" style={{ marginTop: '15px' }}>Solicitar Cotización</button>
    </div>
  );
}

const styles = {
  card: { backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '25px' },
  title: { margin: '0 0 15px 0', fontSize: '1.1rem', color: '#334155' },
  row: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '0.95rem', color: '#475569' },
  disclaimer: { fontSize: '0.7rem', color: '#94a3b8', marginTop: '10px', fontStyle: 'italic' },
};