// src/components/CaracteristicasBox.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';

const Icons = {
  Bed: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9"/></svg>,
  Bath: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-3 0C4 4 4 4.5 9 6Zm0 0c5 0 8 4 12 6v4a8 8 0 0 1-16 0v-4c0-2 3-6 8-6Z"/><line x1="9" y1="6" x2="9" y2="2"/></svg>,
  Ruler: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0z"/></svg>,
  Layers: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
};

export default function CaracteristicasBox({ recamaras, banos, m2, niveles, terreno }) {
  return (
    <div style={styles.grid}>
      <div style={styles.item}>
        <div style={styles.icon}><Icons.Bed /></div>
        <span style={styles.val}>{recamaras}</span>
        <span style={styles.label}>Recámaras</span>
      </div>
      <div style={styles.item}>
        <div style={styles.icon}><Icons.Bath /></div>
        <span style={styles.val}>{banos}</span>
        <span style={styles.label}>Baños</span>
      </div>
      <div style={styles.item}>
        <div style={styles.icon}><Icons.Ruler /></div>
        <span style={styles.val}>{m2} m²</span>
        <span style={styles.label}>Construcción</span>
      </div>
      {terreno > 0 && (
        <div style={styles.item}>
            <div style={styles.icon}><Icons.Ruler /></div>
            <span style={styles.val}>{terreno} m²</span>
            <span style={styles.label}>Terreno</span>
        </div>
      )}
      {niveles > 0 && (
        <div style={styles.item}>
            <div style={styles.icon}><Icons.Layers /></div>
            <span style={styles.val}>{niveles}</span>
            <span style={styles.label}>Niveles</span>
        </div>
      )}
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '15px', padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '30px' },
  item: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  icon: { color: '#64748b', marginBottom: '5px' },
  val: { fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' },
  label: { fontSize: '0.75rem', color: '#94a3b8' }
};