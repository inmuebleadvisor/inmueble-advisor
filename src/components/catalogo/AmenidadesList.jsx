// src/components/AmenidadesList.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React from 'react';

const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>;

export default function AmenidadesList({ amenidades }) {
  if (!amenidades || amenidades.length === 0) return <p style={{color:'#666', fontStyle:'italic'}}>Sin amenidades especificadas.</p>;

  return (
    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px'}}>
      {amenidades.map((am, idx) => (
        <span key={idx} style={styles.chip}>
          <span style={{color: '#16a34a', display:'flex'}}><CheckIcon /></span> {am}
        </span>
      ))}
    </div>
  );
}

const styles = {
  chip: { display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#f0fdf4', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '500', border: '1px solid #dcfce7' }
};