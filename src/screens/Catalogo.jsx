import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// Importación de datos crudos
import modelosRaw from '../data/modelos.json';
import desarrollosRaw from '../data/desarrollos.json';

const LOGO_ICON = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

/**
 * 📅 HELPER: Fechas
 */
const esFechaFutura = (fechaStr) => {
  if (!fechaStr) return false;
  try {
    const partes = fechaStr.split('/'); // DD/MM/YYYY
    if (partes.length !== 3) return false;
    const fechaEntrega = new Date(partes[2], partes[1] - 1, partes[0]);
    const hoy = new Date();
    return fechaEntrega > hoy;
  } catch (e) { return false; }
};

/**
 * 🛠️ PROCESADOR DE DATOS MAESTROS
 */
const procesarDatosMaestros = (modelos, desarrollos) => {
  const desarrolloMap = new Map();
  
  desarrollos.forEach(d => {
    const idDev = String(d.id_desarrollo || d.id).trim(); 
    if (idDev) desarrolloMap.set(idDev, d);
  });

  return modelos.map((modelo, index) => {
    const idDev = String(modelo.id_desarrollo || modelo.desarrollo_id).trim();
    const desarrolloInfo = desarrolloMap.get(idDev);

    const nombreSlug = (modelo.nombre_modelo || modelo.nombre || 'modelo').toLowerCase().replace(/\s+/g, '-');
    const uniqueId = `${idDev}-${nombreSlug}-${index}`;

    let precioFinal = 0;
    const precioRaw = modelo.precio?.actual || modelo.precio;
    if (precioRaw) {
      precioFinal = Number(String(precioRaw).replace(/[^0-9.]/g, ""));
    }

    let imagenFinal = LOGO_ICON;
    if (modelo.multimedia?.galeria && modelo.multimedia.galeria.length > 0) {
      imagenFinal = modelo.multimedia.galeria[0];
    } else if (modelo.multimedia?.planta_baja) {
      imagenFinal = modelo.multimedia.planta_baja;
    } else if (desarrolloInfo?.multimedia?.portada) {
      imagenFinal = desarrolloInfo.multimedia.portada;
    }

    // --- CORRECCIÓN LÓGICA DE STATUS ---
    const statusRaw = desarrolloInfo?.status || '';
    const statusLower = String(statusRaw).toLowerCase();
    const fechaEntrega = desarrolloInfo?.info_comercial?.fecha_entrega || '';
    
    // 1. Detección de texto explícito (Incluyendo "Pre-Venta" con guion)
    const esPrevTexto = statusLower.includes('preventa') || 
                        statusLower.includes('pre-venta') ||  // <--- AQUÍ ESTABA EL ERROR
                        statusLower.includes('construcci') || 
                        statusLower.includes('obra') ||
                        statusLower.includes('avance');

    // 2. Detección por Fecha Futura (Respaldo)
    const esPrevFecha = esFechaFutura(fechaEntrega);

    // Si cumple cualquiera de las dos, es preventa
    const esPreventa = esPrevTexto || esPrevFecha;

    return {
      ...modelo,
      id: uniqueId,
      _key: uniqueId,
      nombre: modelo.nombre_modelo || modelo.nombre || 'Modelo sin nombre',
      precioNumerico: precioFinal,
      imagen: imagenFinal,
      nombreDesarrollo: desarrolloInfo ? desarrolloInfo.nombre : 'Desarrollo Desconocido',
      amenidadesDesarrollo: desarrolloInfo ? (desarrolloInfo.amenidades || []) : [],
      zona: desarrolloInfo ? (desarrolloInfo.zona || desarrolloInfo.ubicacion?.ciudad) : '', 
      recamaras: Number(modelo.caracteristicas?.recamaras || modelo.recamaras || 0),
      banos: Number(modelo.caracteristicas?.banos || modelo.banos || 0),
      m2: Number(modelo.dimensiones?.construccion || modelo.m2 || 0),
      statusTexto: statusRaw || (esPreventa ? 'Pre-Venta' : 'Entrega Inmediata'),
      esPreventa: esPreventa
    };
  });
};

export default function Catalogo() {
  const { user, trackBehavior } = useUser();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 1. DATA PROCESSING
  const dataMaestra = useMemo(() => {
    try {
      if (!modelosRaw || !desarrollosRaw) return [];
      const procesados = procesarDatosMaestros(modelosRaw, desarrollosRaw);
      
      // DEBUG: Para verificar en consola si ya detecta las Pre-Ventas
      const preventasDetectadas = procesados.filter(p => p.esPreventa).length;
      console.log(`🔍 Diagnóstico: ${preventasDetectadas} modelos detectados como Pre-Venta.`);
      
      return procesados;
    } catch (error) { return []; }
  }, []);

  // 2. TOP AMENIDADES
  const topAmenidades = useMemo(() => {
    const conteo = {};
    desarrollosRaw.forEach(d => {
      if (Array.isArray(d.amenidades)) {
        d.amenidades.forEach(am => { 
          const key = am.trim(); 
          conteo[key] = (conteo[key] || 0) + 1; 
        });
      }
    });
    return Object.keys(conteo).sort((a, b) => conteo[b] - conteo[a]).slice(0, 5);
  }, []);

  // 3. ESTADO FILTROS
  const [filtros, setFiltros] = useState({
    precioMax: user?.presupuestoCalculado ? Number(user.presupuestoCalculado) : 5000000,
    habitaciones: user?.recamaras || 0,
    status: 'all', 
    amenidad: ''
  });

  // 4. LÓGICA FILTRADO
  const modelosFiltrados = useMemo(() => {
    return dataMaestra.filter(item => {
      if (item.precioNumerico > filtros.precioMax) return false;
      if (filtros.habitaciones > 0 && item.recamaras < filtros.habitaciones) return false;
      
      // Lógica Estricta de Status
      if (filtros.status === 'inmediata' && item.esPreventa === true) return false;
      if (filtros.status === 'preventa' && item.esPreventa === false) return false;
      
      if (filtros.amenidad && !item.amenidadesDesarrollo.some(a => a.trim() === filtros.amenidad)) return false;

      return true;
    });
  }, [dataMaestra, filtros]);

  // HANDLERS
  const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  
  const formatoMoneda = (val) => {
    if (!val) return "$0";
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  };
  
  const calcularEscrituracion = (precio) => formatoMoneda(precio * 0.06);

  useEffect(() => {
    if (isFilterOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isFilterOpen]);

  return (
    <div className="main-content" style={styles.pageContainer}>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>
            {user?.nombre ? `Hola, ${user.nombre}` : 'Catálogo'}
          </h1>
          <p style={styles.subtitle}>Encuentra tu hogar ideal</p>
        </div>
      </header>

      {/* STICKY FILTER BAR */}
      <div style={styles.stickyFilterBar}>
        <button onClick={() => setIsFilterOpen(true)} style={styles.filterTriggerBtn}>
          <Icons.Filter /> Filtros
        </button>
        
        <div style={styles.activeChipsContainer}>
          <span style={styles.chip}>Max {formatoMoneda(filtros.precioMax)}</span>
          {filtros.habitaciones > 0 && <span style={styles.chip}>{filtros.habitaciones}+ Rec.</span>}
          {filtros.status !== 'all' && (
            <span style={{
              ...styles.chip, 
              backgroundColor: filtros.status === 'preventa' ? '#fff7ed' : '#f0fdf4',
              color: filtros.status === 'preventa' ? '#c2410c' : '#15803d',
              borderColor: filtros.status === 'preventa' ? '#fed7aa' : '#bbf7d0'
            }}>
              {filtros.status === 'preventa' ? 'Pre-Venta' : 'Inmediata'}
            </span>
          )}
          {filtros.amenidad && <span style={styles.chip}>Amenidad: {filtros.amenidad}</span>}
        </div>
      </div>

      {/* MODAL */}
      {isFilterOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsFilterOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Filtros</h2>
              <button onClick={() => setIsFilterOpen(false)} style={styles.closeBtn}>
                <Icons.Close />
              </button>
            </div>
            <div style={styles.modalBody}>
              
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Presupuesto Máximo</label>
                <div style={styles.priceDisplay}>{formatoMoneda(filtros.precioMax)}</div>
                <input 
                  type="range" min="500000" max="5000000" step="50000"
                  value={filtros.precioMax}
                  onChange={(e) => handleFilterChange('precioMax', Number(e.target.value))}
                  style={styles.slider}
                />
              </div>

              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Recámaras</label>
                <div style={styles.pillGroup}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <button
                      key={num}
                      onClick={() => handleFilterChange('habitaciones', num)}
                      style={{
                        ...styles.pill,
                        backgroundColor: filtros.habitaciones === num ? 'var(--primary-color)' : 'white',
                        color: filtros.habitaciones === num ? 'white' : '#333',
                        borderColor: filtros.habitaciones === num ? 'var(--primary-color)' : '#e5e7eb'
                      }}
                    >
                      {num === 0 ? 'Todas' : `${num}+`}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Etapa del Desarrollo</label>
                <div style={styles.pillGroup}>
                  {[
                    { val: 'all', label: 'Cualquiera' },
                    { val: 'inmediata', label: 'Entrega Inmediata' },
                    { val: 'preventa', label: 'Pre-Venta' }
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      onClick={() => handleFilterChange('status', opt.val)}
                      style={{
                        ...styles.pill,
                        fontSize: '0.9rem',
                        backgroundColor: filtros.status === opt.val ? 'var(--primary-color)' : 'white',
                        color: filtros.status === opt.val ? 'white' : '#333',
                        borderColor: filtros.status === opt.val ? 'var(--primary-color)' : '#e5e7eb'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Amenidades Populares</label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  <button onClick={() => handleFilterChange('amenidad', '')}
                     style={{...styles.amenityChip, 
                        backgroundColor: filtros.amenidad === '' ? '#e0f2fe' : '#f3f4f6', 
                        color: filtros.amenidad === '' ? '#0284c7' : '#4b5563',
                        border: filtros.amenidad === '' ? '1px solid #7dd3fc' : '1px solid transparent'}}>
                    Todas
                  </button>
                  {topAmenidades.map((am, idx) => (
                    <button key={idx} onClick={() => handleFilterChange('amenidad', filtros.amenidad === am ? '' : am)}
                      style={{...styles.amenityChip, 
                        backgroundColor: filtros.amenidad === am ? '#e0f2fe' : '#f3f4f6', 
                        color: filtros.amenidad === am ? '#0284c7' : '#4b5563',
                        border: filtros.amenidad === am ? '1px solid #7dd3fc' : '1px solid transparent'}}>
                      {am}
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <div style={styles.modalFooter}>
              <button style={styles.clearBtn} onClick={() => setFiltros({precioMax: 5000000, habitaciones: 0, status: 'all', amenidad: ''})}>Limpiar</button>
              <button style={styles.applyBtn} onClick={() => setIsFilterOpen(false)}>Ver {modelosFiltrados.length} propiedades</button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS */}
      <section style={styles.gridContainer}>
        {modelosFiltrados.map((item) => (
          <article key={item._key} style={styles.card}>
            <div style={styles.imageContainer}>
              <img src={item.imagen} alt={item.nombre} style={styles.image} loading="lazy" onError={(e) => e.target.src = LOGO_ICON} />
              
              <span style={{
                ...styles.statusTag,
                backgroundColor: item.esPreventa ? '#f59e0b' : '#10b981'
              }}>
                {item.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
              </span>

              <div style={styles.imageOverlay}>
                <h3 style={styles.overlayDevName}>{item.nombreDesarrollo}</h3>
                <p style={styles.overlayModelName}>Modelo {item.nombre}</p>
              </div>
            </div>

            <div style={styles.cardBody}>
              <div style={styles.locationRow}><span style={{marginRight: '5px'}}>📍</span> {item.zona || 'Ubicación por confirmar'}</div>
              <div style={styles.featuresRow}>
                <span style={styles.featureItem}>🏠 {item.recamaras} Rec.</span><span style={styles.separator}>|</span>
                <span style={styles.featureItem}>🚿 {item.banos} Baños</span><span style={styles.separator}>|</span>
                <span style={styles.featureItem}>📐 {item.m2} m²</span>
              </div>
              <div style={styles.priceBox}>
                <div style={{display:'flex', justifyContent:'space-between'}}><span style={styles.priceLabel}>PRECIO DE LISTA</span><span style={{color: '#3b82f6'}}>💵</span></div>
                <div style={styles.priceValue}>{formatoMoneda(item.precioNumerico)}</div>
                <div style={styles.priceNote}>*Escrituración aprox: {calcularEscrituracion(item.precioNumerico)}</div>
              </div>
              <button style={styles.aiButton} onClick={() => alert("Próximamente")}>✨ Generar Opinión IA</button>
              <Link to={`/modelo/${item.id}`} style={styles.detailsButton} onClick={() => trackBehavior('select_property', { id: item.id })}>Ver Detalles Completos</Link>
            </div>
          </article>
        ))}

        {modelosFiltrados.length === 0 && (
          <div style={styles.emptyState}>
            <h3>No encontramos resultados</h3>
            <p>Intenta ajustar tus filtros.</p>
            <button onClick={() => setFiltros({precioMax: 5000000, habitaciones: 0, status: 'all', amenidad: ''})} style={styles.retryBtn}>Ver Todo</button>
          </div>
        )}
      </section>
    </div>
  );
}

const styles = {
  pageContainer: { paddingBottom: '100px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  header: { backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #f3f4f6' },
  title: { color: '#111827', margin: 0, fontSize: '1.4rem', fontWeight: '800' },
  subtitle: { color: '#6b7280', margin: '2px 0 0 0', fontSize: '0.9rem' },
  
  // FIX: Ajuste flex para evitar desbordamiento
  stickyFilterBar: { position: 'sticky', top: 0, zIndex: 90, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  filterTriggerBtn: { flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '600', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  activeChipsContainer: { display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: 0, whiteSpace: 'nowrap', scrollbarWidth: 'none', paddingRight: '10px', alignItems: 'center' },
  chip: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', whiteSpace: 'nowrap', border: '1px solid #bfdbfe', flexShrink: 0 },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', height: '85vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' },
  '@media (min-width: 768px)': { modalContent: { height: 'auto', borderRadius: '20px', marginBottom: 'auto', marginTop: 'auto' } },
  modalHeader: { padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  filterSection: { marginBottom: '30px' },
  filterLabel: { display: 'block', fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '10px' },
  priceDisplay: { fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '10px' },
  slider: { width: '100%', accentColor: 'var(--primary-color)', height: '6px', cursor: 'pointer' },
  pillGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  pill: { flex: 1, minWidth: '80px', padding: '12px', borderRadius: '12px', border: '1px solid', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' },
  amenityChip: { padding: '8px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  modalFooter: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px', alignItems: 'center' },
  clearBtn: { background: 'none', border: 'none', textDecoration: 'underline', color: '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  applyBtn: { flex: 1, backgroundColor: 'var(--primary-color)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', padding: '25px 20px' },
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' },
  imageContainer: { height: '220px', position: 'relative', backgroundColor: '#e5e7eb' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  statusTag: { position: 'absolute', top: '12px', right: '12px', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 16px 12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column' },
  overlayDevName: { color: 'white', fontSize: '1.4rem', fontWeight: '700', margin: 0, lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  overlayModelName: { color: '#e5e7eb', fontSize: '0.95rem', margin: '4px 0 0 0', fontWeight: '500' },
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  locationRow: { color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  featuresRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '0.95rem', fontWeight: '500' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  separator: { color: '#d1d5db', fontSize: '1.2rem', fontWeight: '300' },
  priceBox: { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', marginTop: '5px', border: '1px solid #dbeafe' },
  priceLabel: { fontSize: '0.7rem', fontWeight: '800', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' },
  priceValue: { fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', margin: '4px 0' },
  priceNote: { fontSize: '0.8rem', color: '#64748b', marginTop: '4px' },
  aiButton: { backgroundColor: '#f3e8ff', color: '#9333ea', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'background 0.2s' },
  detailsButton: { backgroundColor: '#0f172a', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.1s' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
  retryBtn: { marginTop: '15px', padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }
};