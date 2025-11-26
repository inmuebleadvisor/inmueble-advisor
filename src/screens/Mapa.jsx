import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; // Importamos useMap
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useUser } from '../context/UserContext';

// Datos (Base de datos local)
import modelosRaw from '../data/modelos.json';
import desarrollosRaw from '../data/desarrollos.json';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

/**
 * 🎨 ICONO PERSONALIZADO DEL MAPA
 */
const createCustomIcon = (textoPrecio) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background-color: var(--primary-color);
      color: white;
      padding: 6px 10px;
      border-radius: 12px;
      font-weight: 800;
      font-size: 0.75rem;
      white-space: nowrap;
      box-shadow: 0 3px 8px rgba(0,0,0,0.4);
      border: 2px solid white;
      text-align: center;
      min-width: 60px;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    ">
      ${textoPrecio}
      <div style="
        position: absolute;
        bottom: -6px;
        left: 50%;
        transform: translateX(-50%);
        width: 0; 
        height: 0; 
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 6px solid white;
      "></div>
    </div>`,
    iconSize: [null, 30],
    iconAnchor: [30, 35],
    popupAnchor: [0, -35]
  });
};

const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

/**
 * 🗺️ COMPONENTE CONTROLADOR DE ZOOM (NUEVO)
 * Este componente invisible "vigila" los marcadores. Cuando cambian (por filtros),
 * calcula el recuadro que los abarca a todos y le dice al mapa: "Ajusta tu vista aquí".
 */
const ControlZoom = ({ marcadores }) => {
  const map = useMap(); // Hook para acceder a la instancia del mapa

  useEffect(() => {
    if (marcadores.length > 0) {
      // 1. Creamos un grupo de coordenadas vacías
      const bounds = L.latLngBounds();
      
      // 2. Agregamos la posición de cada marcador visible
      marcadores.forEach(m => {
        bounds.extend([m.info.ubicacion.latitud, m.info.ubicacion.longitud]);
      });

      // 3. Ordenamos al mapa ajustarse a esos límites
      // padding: [50, 50] deja un margen de 50px alrededor para que los pines no toquen el borde
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [marcadores, map]); // Se ejecuta cada vez que cambia la lista de marcadores

  return null; // No renderiza nada visual
};

export default function Mapa() {
  const { user, trackBehavior } = useUser();
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- 1. AMENIDADES POPULARES ---
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

  // --- 2. PROCESAMIENTO DE DATOS ---
  const datosProcesados = useMemo(() => {
    const mapaDesarrollos = {};

    desarrollosRaw.forEach(d => {
      const id = String(d.id_desarrollo || d.id).trim();
      if (d.ubicacion?.latitud && d.ubicacion?.longitud) {
        mapaDesarrollos[id] = {
          info: d,
          modelos: [],
        };
      }
    });

    modelosRaw.forEach(m => {
      const idDev = String(m.id_desarrollo || m.desarrollo_id).trim();
      
      if (mapaDesarrollos[idDev]) {
        const precioLimpio = String(m.precio?.actual || m.precio).replace(/[^0-9.]/g, "");
        const precio = Number(precioLimpio);
        
        if (!precio || precio === 0 || isNaN(precio)) return;

        const statusLower = String(mapaDesarrollos[idDev].info.status || '').toLowerCase();
        const esPreventa = statusLower.includes('preventa') || statusLower.includes('obra');

        mapaDesarrollos[idDev].modelos.push({
          ...m,
          precioNumerico: precio,
          recamaras: Number(m.caracteristicas?.recamaras || m.recamaras || 0),
          esPreventa
        });
      }
    });

    return Object.values(mapaDesarrollos);
  }, []);

  // --- 3. FILTROS ---
  const [filtros, setFiltros] = useState({
    precioMax: user?.presupuestoCalculado ? Number(user.presupuestoCalculado) : 5000000,
    habitaciones: user?.recamaras || 0,
    status: 'all', 
    amenidad: ''
  });

  // --- 4. LÓGICA DE FILTRADO ---
  const { marcadoresVisibles, totalPropiedades } = useMemo(() => {
    let totalCasasEncontradas = 0;

    const visibles = datosProcesados.filter(item => {
      const modelosValidos = item.modelos.filter(mod => {
        if (mod.precioNumerico > filtros.precioMax) return false;
        if (filtros.habitaciones > 0 && mod.recamaras < filtros.habitaciones) return false;
        if (filtros.status === 'inmediata' && mod.esPreventa === true) return false;
        if (filtros.status === 'preventa' && mod.esPreventa === false) return false;
        return true;
      });

      if (filtros.amenidad) {
        const tieneAmenidad = item.info.amenidades?.some(a => a.trim() === filtros.amenidad);
        if (!tieneAmenidad) return false;
      }

      if (modelosValidos.length > 0) {
        totalCasasEncontradas += modelosValidos.length;

        const precios = modelosValidos.map(m => m.precioNumerico);
        const min = Math.min(...precios);
        const max = Math.max(...precios);

        const formatCompact = (val) => {
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
          return `$${val}`;
        };

        if (min === max) {
          item.etiquetaPrecio = formatCompact(min);
        } else {
          item.etiquetaPrecio = `${formatCompact(min)} - ${formatCompact(max)}`;
        }
        
        return true;
      }
      return false;
    });

    return { marcadoresVisibles: visibles, totalPropiedades: totalCasasEncontradas };
  }, [datosProcesados, filtros]);

  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  const centroMapa = [21.88, -102.29]; 

  return (
    <div className="main-content" style={styles.pageContainer}>
      
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>Mapa Interactivo</h1>
          <p style={styles.subtitle}>{marcadoresVisibles.length} desarrollos en tu zona</p>
        </div>
      </header>

      <div style={styles.stickyFilterBar}>
        <button onClick={() => setIsFilterOpen(true)} style={styles.filterTriggerBtn}>
          <Icons.Filter /> Filtros
        </button>
        <div style={styles.activeChipsContainer}>
          <span style={styles.chip}>Max {formatoMoneda(filtros.precioMax)}</span>
          {filtros.habitaciones > 0 && <span style={styles.chip}>{filtros.habitaciones}+ Rec.</span>}
          {filtros.status !== 'all' && (
             <span style={{...styles.chip, color: '#166534', backgroundColor: '#dcfce7', borderColor: '#bbf7d0'}}>
               {filtros.status === 'preventa' ? 'Pre-Venta' : 'Entrega Inmediata'}
             </span>
          )}
          {filtros.amenidad && <span style={styles.chip}>{filtros.amenidad}</span>}
        </div>
      </div>

      <div style={styles.mapContainer}>
        <MapContainer 
          center={centroMapa} 
          zoom={12} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* --- AQUÍ INSERTAMOS EL CONTROLADOR DE ZOOM --- */}
          <ControlZoom marcadores={marcadoresVisibles} />

          {marcadoresVisibles.map((dev) => (
            <Marker 
              key={dev.info.id_desarrollo || dev.info.id}
              position={[dev.info.ubicacion.latitud, dev.info.ubicacion.longitud]}
              icon={createCustomIcon(dev.etiquetaPrecio)}
              eventHandlers={{
                click: () => trackBehavior('map_marker_click', { dev_name: dev.info.nombre }),
              }}
            >
              <Popup className="custom-popup">
                <div style={styles.popupContent}>
                  <img 
                    src={dev.info.multimedia?.portada || FALLBACK_IMG} 
                    alt={dev.info.nombre}
                    style={styles.popupImage}
                    onError={(e) => e.target.src = FALLBACK_IMG}
                  />
                  <h4 style={styles.popupTitle}>{dev.info.nombre}</h4>
                  <p style={styles.popupPrice}>
                     {dev.etiquetaPrecio.includes('-') ? 'Rango: ' : 'Desde '} 
                     {dev.etiquetaPrecio}
                  </p>
                  <p style={styles.popupLocation}>{dev.info.zona || 'Ubicación por confirmar'}</p>
                  <Link 
                    to={`/desarrollo/${String(dev.info.id_desarrollo || dev.info.id).trim()}`}
                    style={styles.popupButton}
                  >
                    Ver Desarrollo
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {isFilterOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsFilterOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Filtros</h2>
              <button onClick={() => setIsFilterOpen(false)} style={styles.closeBtn}><Icons.Close /></button>
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
                <label style={styles.filterLabel}>Recámaras (Min)</label>
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
                        fontSize: '0.85rem',
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
              <button style={styles.applyBtn} onClick={() => setIsFilterOpen(false)}>
                Ver {totalPropiedades} propiedades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  pageContainer: { display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', fontFamily: "'Segoe UI', sans-serif", overflow: 'hidden' },
  header: { backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #f3f4f6' },
  title: { color: '#111827', margin: 0, fontSize: '1.4rem', fontWeight: '800' },
  subtitle: { color: '#6b7280', margin: '2px 0 0 0', fontSize: '0.9rem' },
  stickyFilterBar: { zIndex: 900, backgroundColor: 'white', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  filterTriggerBtn: { flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '600', color: '#374151', cursor: 'pointer' },
  activeChipsContainer: { display: 'flex', gap: '8px', overflowX: 'auto' },
  chip: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700', border: '1px solid #bfdbfe', whiteSpace: 'nowrap' },
  mapContainer: { flex: 1, width: '100%', position: 'relative', zIndex: 1 },
  popupContent: { textAlign: 'center', width: '160px' },
  popupImage: { width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px', marginBottom: '8px', backgroundColor: '#eee' },
  popupTitle: { margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 'bold', color: '#333' },
  popupPrice: { margin: '0 0 4px 0', fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary-color)' },
  popupLocation: { margin: '0 0 8px 0', fontSize: '0.8rem', color: '#666' },
  popupButton: { display: 'block', backgroundColor: '#111', color: 'white', padding: '8px', borderRadius: '6px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 'bold' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', maxHeight: '80vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
  modalBody: { padding: '20px', overflowY: 'auto' },
  filterSection: { marginBottom: '25px' },
  filterLabel: { display: 'block', fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '10px' },
  priceDisplay: { fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '10px' },
  slider: { width: '100%', accentColor: 'var(--primary-color)', height: '6px', cursor: 'pointer' },
  pillGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  pill: { flex: 1, minWidth: '80px', padding: '12px', borderRadius: '12px', border: '1px solid', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  amenityChip: { padding: '8px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  modalFooter: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px' },
  clearBtn: { background: 'none', border: 'none', textDecoration: 'underline', color: '#6b7280', fontWeight: '600', cursor: 'pointer' },
  applyBtn: { flex: 1, backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};