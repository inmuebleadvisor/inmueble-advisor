// src/components/CaracteristicasBox.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';

const Icons = {
  Bed: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v9" /></svg>,
  Bath: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h10v4a5 5 0 0 1-10 0V7Z" /><rect x="9" y="3" width="6" height="4" rx="1" /><line x1="7" y1="7" x2="17" y2="7" /><line x1="12" y1="11" x2="12" y2="15" /><line x1="9" y1="21" x2="15" y2="21" /><line x1="12" y1="15" x2="12" y2="21" /></svg>,
  Construction: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-8a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v8" /></svg>,
  Land: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h18v18H3zM9 3v18M15 3v18M3 9h18M3 15h18" /></svg>,
  Layers: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
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
        <div style={styles.icon}><Icons.Construction /></div>
        <span style={styles.val}>{m2} m²</span>
        <span style={styles.label}>Construcción</span>
      </div>
      {terreno > 0 && (
        <div style={styles.item}>
          <div style={styles.icon}><Icons.Land /></div>
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