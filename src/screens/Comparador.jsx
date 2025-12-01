// src/screens/Comparador.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import { useCatalog } from '../context/CatalogContext';
import ImageLoader from '../components/ImageLoader';
import FavoriteBtn from '../components/FavoriteBtn';

// --- ICONOS ---
const Icons = {
  Check: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>,
  X: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Compare: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 3h5v5"/><path d="M4 20L21 3"/><path d="M21 16v5h-5"/><path d="M15 15l5 5"/><path d="M4 4l5 5"/></svg>,
  Trash: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

export default function Comparador() {
  const { favoritosIds, toggleFavorite } = useFavorites();
  const { modelos, loadingCatalog } = useCatalog();

  // Estado para la selección de comparación
  const [selectedIds, setSelectedIds] = useState([]);
  const [isComparing, setIsComparing] = useState(false);

  // 1. Hidratación de datos
  const favoritosHydrated = useMemo(() => {
    if (loadingCatalog) return [];
    return modelos.filter(m => favoritosIds.includes(m.id));
  }, [favoritosIds, modelos, loadingCatalog]);

  // Helpers
  const handleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 3) return alert("Puedes comparar máximo 3 propiedades a la vez.");
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);

  // Datos para la tabla de comparación
  const propiedadesAComparar = useMemo(() => {
    return favoritosHydrated.filter(p => selectedIds.includes(p.id));
  }, [favoritosHydrated, selectedIds]);

  // --- RENDERIZADO: ESTADO VACÍO ---
  if (!loadingCatalog && favoritosHydrated.length === 0) {
    return (
      <div className="main-content" style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>💔</div>
        <h2 style={{color: '#1e293b'}}>Tu lista está vacía</h2>
        <p style={{color: '#64748b', maxWidth: '400px', margin: '10px auto'}}>
          Explora nuestro catálogo y guarda las propiedades que te interesen para compararlas aquí.
        </p>
        <Link to="/catalogo" style={styles.btnPrimary}>Ir al Catálogo</Link>
      </div>
    );
  }

  // --- RENDERIZADO: MODO COMPARACIÓN (TABLA) ---
  if (isComparing) {
    return (
      <div className="main-content animate-fade-in" style={{paddingBottom: '50px'}}>
        <div style={styles.compareHeader}>
          <button onClick={() => setIsComparing(false)} style={styles.backLink}>&larr; Volver a mis favoritos</button>
          <h2 style={styles.pageTitle}>Comparativa</h2>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.stickyColHeader}>Característica</th>
                {propiedadesAComparar.map(item => (
                  <th key={item.id} style={styles.thModel}>
                    <div style={styles.thContent}>
                        <div style={styles.thImgWrapper}>
                            <ImageLoader src={item.imagen} style={styles.thImg} />
                            <button 
                                onClick={() => {
                                    handleSelect(item.id);
                                    if(selectedIds.length <= 1) setIsComparing(false); // Si queda 0, salir
                                }} 
                                style={styles.removeBtnTable}
                            >
                                <Icons.X />
                            </button>
                        </div>
                        <span style={styles.thTitle}>{item.nombre_modelo}</span>
                        <span style={styles.thPrice}>{formatoMoneda(item.precioNumerico)}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Ubicación', val: (m) => m.zona || m.ciudad },
                { label: 'Desarrollo', val: (m) => m.nombreDesarrollo },
                { label: 'Construcción', val: (m) => `${m.m2} m²` },
                { label: 'Recámaras', val: (m) => m.recamaras },
                { label: 'Baños', val: (m) => m.banos },
                { label: 'Niveles', val: (m) => m.niveles || 1 },
                { label: 'Entrega', val: (m) => m.esPreventa ? 'Pre-Venta' : 'Inmediata', highlight: true },
              ].map((row, idx) => (
                <tr key={idx} style={{backgroundColor: idx % 2 === 0 ? 'white' : '#f8fafc'}}>
                  <td style={styles.stickyCol}>{row.label}</td>
                  {propiedadesAComparar.map(item => (
                    <td key={item.id} style={{
                        ...styles.td, 
                        fontWeight: row.highlight ? 'bold' : 'normal',
                        color: row.highlight ? 'var(--primary-color)' : '#334155'
                    }}>
                        {row.val(item)}
                    </td>
                  ))}
                </tr>
              ))}
              {/* Fila de Acción */}
              <tr>
                <td style={{...styles.stickyCol, borderBottom: 'none'}}></td>
                {propiedadesAComparar.map(item => (
                    <td key={item.id} style={{padding: '20px', borderBottom: 'none'}}>
                        <Link to={`/modelo/${item.id}`} style={styles.btnAction}>Ver Detalle</Link>
                    </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO: MODO GALERÍA (DEFAULT) ---
  return (
    <div className="main-content" style={styles.pageContainer}>
      <header style={styles.header}>
        <h1 style={styles.pageTitle}>Mis Favoritos ({favoritosHydrated.length})</h1>
        <p style={styles.subtitle}>Selecciona hasta 3 propiedades para enfrentarlas.</p>
      </header>

      <div style={styles.grid}>
        {favoritosHydrated.map(item => {
          const isSelected = selectedIds.includes(item.id);
          return (
            <div 
                key={item.id} 
                style={{
                    ...styles.card,
                    borderColor: isSelected ? 'var(--primary-color)' : 'transparent',
                    boxShadow: isSelected ? '0 0 0 3px rgba(0, 57, 106, 0.2)' : '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
                onClick={() => handleSelect(item.id)}
            >
              {/* Checkbox visual */}
              <div style={{
                  ...styles.checkbox,
                  backgroundColor: isSelected ? 'var(--primary-color)' : 'white',
                  borderColor: isSelected ? 'var(--primary-color)' : '#cbd5e1'
              }}>
                  {isSelected && <Icons.Check />}
              </div>

              <div style={styles.cardImgWrapper}>
                <ImageLoader src={item.imagen} style={styles.cardImg} />
                <button 
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }} 
                    style={styles.cardTrashBtn}
                >
                    <Icons.Trash />
                </button>
              </div>
              
              <div style={styles.cardBody}>
                <h3 style={styles.cardTitle}>{item.nombre_modelo}</h3>
                <p style={styles.cardDev}>{item.nombreDesarrollo}</p>
                <div style={styles.cardPrice}>{formatoMoneda(item.precioNumerico)}</div>
                <div style={styles.cardSpecs}>
                    <span>{item.recamaras} Rec</span> • <span>{item.m2} m²</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FLOATING ACTION BAR */}
      <div style={{
          ...styles.floatingBar,
          transform: selectedIds.length > 0 ? 'translateY(0)' : 'translateY(150%)'
      }}>
          <div style={styles.floatingContent}>
              <span style={{fontWeight: '600'}}>{selectedIds.length} seleccionadas</span>
              <div style={{display:'flex', gap:'10px'}}>
                  <button onClick={() => setSelectedIds([])} style={styles.btnGhost}>Limpiar</button>
                  <button 
                    onClick={() => setIsComparing(true)} 
                    disabled={selectedIds.length < 2}
                    style={{
                        ...styles.btnCompare,
                        opacity: selectedIds.length < 2 ? 0.5 : 1,
                        cursor: selectedIds.length < 2 ? 'not-allowed' : 'pointer'
                    }}
                  >
                    Comparar ahora <Icons.Compare />
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS MEJORADOS ---
const styles = {
  pageContainer: { paddingBottom: '120px', fontFamily: "'Segoe UI', sans-serif" },
  header: { marginBottom: '30px' },
  pageTitle: { fontSize: '1.8rem', fontWeight: '800', color: '#0f172a', margin: '0 0 5px 0' },
  subtitle: { color: '#64748b', fontSize: '1rem' },
  
  // Estado Vacío
  emptyContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' },
  emptyIcon: { fontSize: '4rem', marginBottom: '20px' },
  
  // Grid de Tarjetas
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '15px' },
  // Responsivo: en desktop tarjetas más grandes
  '@media (min-width: 768px)': {
     grid: { gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '25px' }
  },
  
  card: { backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease', border: '2px solid transparent' },
  checkbox: { position: 'absolute', top: '10px', left: '10px', width: '24px', height: '24px', borderRadius: '6px', border: '2px solid', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  cardImgWrapper: { height: '140px', position: 'relative', backgroundColor: '#e2e8f0' },
  cardImg: { width: '100%', height: '100%', objectFit: 'cover' },
  cardTrashBtn: { position: 'absolute', top: '10px', right: '10px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.9)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
  
  cardBody: { padding: '12px' },
  cardTitle: { fontSize: '1rem', fontWeight: '700', margin: '0 0 2px 0', color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardDev: { fontSize: '0.75rem', color: '#64748b', margin: '0 0 8px 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  cardPrice: { fontSize: '1.1rem', fontWeight: '800', color: 'var(--primary-color)' },
  cardSpecs: { fontSize: '0.8rem', color: '#64748b', marginTop: '4px' },

  // Barra Flotante
  floatingBar: { position: 'fixed', bottom: '20px', left: '20px', right: '20px', maxWidth: '600px', margin: '0 auto', backgroundColor: '#1e293b', borderRadius: '50px', padding: '12px 24px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', color: 'white', transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)', zIndex: 100 },
  floatingContent: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  btnGhost: { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontWeight: '600' },
  btnCompare: { backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '30px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' },
  btnPrimary: { backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px 24px', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', display: 'inline-block', marginTop: '20px' },

  // Vista de Tabla (Comparativa)
  compareHeader: { marginBottom: '20px' },
  backLink: { background: 'none', border: 'none', color: 'var(--primary-color)', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '10px', padding: 0 },
  
  tableWrapper: { overflowX: 'auto', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', backgroundColor: 'white' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, minWidth: '600px' },
  
  // Columnas Sticky (La primera columna se queda fija)
  stickyColHeader: { position: 'sticky', left: 0, backgroundColor: '#f8fafc', zIndex: 20, padding: '15px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', width: '120px', color: '#64748b', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' },
  stickyCol: { position: 'sticky', left: 0, backgroundColor: 'white', zIndex: 10, padding: '15px', textAlign: 'left', borderBottom: '1px solid #f1f5f9', fontWeight: '600', color: '#475569', fontSize: '0.9rem', borderRight: '1px solid #f1f5f9' },
  
  thModel: { padding: '15px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', minWidth: '180px', verticalAlign: 'top' },
  thContent: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  thImgWrapper: { width: '100%', height: '100px', borderRadius: '8px', overflow: 'hidden', marginBottom: '10px', position: 'relative' },
  thImg: { width: '100%', height: '100%', objectFit: 'cover' },
  removeBtnTable: { position: 'absolute', top: '5px', right: '5px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  thTitle: { fontWeight: '700', fontSize: '1rem', color: '#1e293b', lineHeight: '1.2' },
  thPrice: { color: 'var(--primary-color)', fontWeight: '800', fontSize: '1.1rem', marginTop: '4px' },
  
  td: { padding: '15px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', color: '#334155', fontSize: '0.95rem' },
  btnAction: { display: 'block', backgroundColor: '#0f172a', color: 'white', textAlign: 'center', padding: '10px', borderRadius: '8px', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '600' }
};