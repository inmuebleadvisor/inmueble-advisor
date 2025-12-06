// src/screens/Mapa.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useUser } from '../context/UserContext';
// ✅ MODIFICACIÓN: Importamos el nuevo hook de contexto
import { useCatalog } from '../context/CatalogContext';
import { normalizar } from '../utils/formatters';
import { STATUS } from '../config/constants';
// Eliminamos: import { obtenerDatosUnificados, obtenerTopAmenidades } from '../services/catalog.service';

const FALLBACK_IMG = "https://inmuebleadvisor.com/wp-content/uploads/2025/09/cropped-Icono-Inmueble-Advisor-1.png";

// --- HELPERS ---
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

const ControlZoom = ({ marcadores }) => {
  const map = useMap();
  useEffect(() => {
    // PORQUÉ: Esta lógica es crucial para que el mapa se centre
    // automáticamente en los desarrollos filtrados y visibles.
    if (marcadores.length > 0) {
      const bounds = L.latLngBounds();
      let validos = 0;
      marcadores.forEach(m => {
        if (m.ubicacion?.latitud && m.ubicacion?.longitud) {
          // Leaflet requiere un array de [latitud, longitud]
          bounds.extend([m.ubicacion.latitud, m.ubicacion.longitud]);
          validos++;
        }
      });
      if (validos > 0) map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [marcadores, map]);
  return null;
};

const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
};

export default function Mapa() {
  const { user, trackBehavior } = useUser();
  // ✅ OBTENEMOS DATOS Y ESTADO DE CARGA DEL CONTEXTO
  const { modelos: dataMaestra, desarrollos: dataDesarrollos, amenidades: topAmenidades, loadingCatalog: loading } = useCatalog();

  // --- ESTADOS DE UI ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // 1. CARGA DE DATOS (ELIMINADA de useEffect)

  // 2. FILTROS
  const [filtros, setFiltros] = useState({
    precioMax: user?.presupuestoCalculado ? Number(user.presupuestoCalculado) : 5000000,
    habitaciones: user?.recamaras || 0,
    status: 'all',
    amenidad: ''
  });

  // 3. LÓGICA DE AGRUPACIÓN (De Modelos -> Desarrollos)
  const marcadoresVisibles = useMemo(() => {
    // PORQUÉ: Si el catálogo no está cargado, retornamos un array vacío.
    if (loading) return [];

    const grupos = {};

    // A. Filtrar y Agrupar
    dataMaestra.forEach(modelo => {
      // Búsqueda robusta del desarrollo padre
      const desarrollo = dataDesarrollos.find(d => String(d.id) === String(modelo.idDesarrollo || modelo.id_desarrollo));

      // --- 1. PRECIO ---
      if (modelo.precioNumerico > filtros.precioMax) return;

      // --- 2. HABITACIONES ---
      if (filtros.habitaciones > 0 && modelo.recamaras < filtros.habitaciones) return;

      // --- 3. STATUS (ETAPA) - Lógica Robusta de Catalogo.jsx ---
      let esPreventa = false;

      // Chequeo en Desarrollo
      if (desarrollo) {
        const statusDesarrollo = String(desarrollo.status || '').toUpperCase().trim();
        if (
          statusDesarrollo === 'PRE-VENTA' ||
          statusDesarrollo === 'PREVENTA' ||
          statusDesarrollo === STATUS?.DEV_PREALE || // Optional chaining por seguridad
          statusDesarrollo.includes('PRE-VENTA') ||
          statusDesarrollo.includes('PREVENTA')
        ) {
          esPreventa = true;
        }
      }

      // Chequeo en Modelo (Fallback/Override)
      if (!esPreventa && (modelo.esPreventa === true || modelo.esPreventa === 'true' || modelo.esPreventa === 1)) {
        esPreventa = true;
      }

      if (filtros.status === 'inmediata' && esPreventa) return;
      if (filtros.status === 'preventa' && !esPreventa) return;

      // --- 4. AMENIDAD - Lógica Unificada ---
      if (filtros.amenidad) {
        const amenidadBuscada = normalizar(filtros.amenidad);

        const amDesarrollo = Array.isArray(desarrollo?.amenidades) ? desarrollo.amenidades : [];
        const amModelo = Array.isArray(modelo.amenidades) ? modelo.amenidades : [];
        const amModeloDesarrollo = Array.isArray(modelo.amenidadesDesarrollo) ? modelo.amenidadesDesarrollo : [];

        // Fusión de todas las fuentes posibles de amenidades
        const todasAmenidades = [...new Set([...amDesarrollo, ...amModelo, ...amModeloDesarrollo])];

        // Verificación estricta: Si no tiene ninguna amenidad listada en ningún lado, no pasa el filtro
        if (todasAmenidades.length === 0) return;

        const tieneAmenidad = todasAmenidades.some(a => normalizar(a).includes(amenidadBuscada));
        if (!tieneAmenidad) return;
      }

      // Agrupación por ID de Desarrollo
      // Usamos idDesarrollo que es el campo normalizado por el servicio
      const idDev = String(modelo.idDesarrollo || modelo.id_desarrollo || 'sin-id').trim();

      if (!grupos[idDev]) {
        // Inicializamos el grupo con la info "denormalizada" que guardamos en el modelo
        grupos[idDev] = {
          id: idDev,
          nombre: modelo.nombreDesarrollo,
          zona: modelo.zona,
          // Usamos las coordenadas seguras parseadas por el servicio
          ubicacion: { latitud: modelo.latitud, longitud: modelo.longitud },
          portada: modelo.imagen, // Usamos la imagen del primer modelo como portada del pin
          precios: []
        };
      }

      grupos[idDev].precios.push(modelo.precioNumerico);
    });

    // 3. LÓGICA DE MAPEO (Iteramos Desarrollos DIRECTAMENTE para cumplir Schema V3)
    if (!dataDesarrollos || dataDesarrollos.length === 0) return [];

    return dataDesarrollos.map(dev => {
      // Validamos ubicación estrictamente según Schema
      if (!dev.latitud || !dev.longitud) return null;

      // --- FILTROS GLOBALES (Aplicados a Nivel Desarrollo) ---

      // 1. Status/Etapa vs Schema V3 "status" (string)
      const statusDev = String(dev.status || '').toUpperCase();
      let esPreventa = statusDev.includes('PRE') || statusDev === STATUS?.DEV_PREALE;

      if (filtros.status === 'inmediata' && esPreventa) return null;
      if (filtros.status === 'preventa' && !esPreventa) return null;

      // 2. Amenidades
      if (filtros.amenidad) {
        const amHeaders = Array.isArray(dev.amenidades) ? dev.amenidades : [];
        if (amHeaders.length === 0) return null;
        if (!amHeaders.some(a => normalizar(a).includes(normalizar(filtros.amenidad)))) return null;
      }

      // --- FILTROS DE HIJOS (Precio, Recámaras) ---
      // Buscamos los modelos para validar PRECIO y RECAMARAS, y calcular rango
      const modelosHijos = dataMaestra.filter(m => String(m.idDesarrollo) === String(dev.id));

      const modelosQueCumplen = modelosHijos.filter(m => {
        if (Number(m.precioNumerico) > filtros.precioMax) return false;
        if (filtros.habitaciones > 0 && Number(m.recamaras) < filtros.habitaciones) return false;
        return true;
      });

      // Si se aplicaron filtros de rango y ningun hijo cumple, ocultamos el pin
      const hayFiltrosRango = filtros.precioMax < 5000000 || filtros.habitaciones > 0;
      if (hayFiltrosRango && modelosQueCumplen.length === 0) return null;

      // Generación de Etiqueta de Precio
      let etiqueta = "$ Consultar";
      if (modelosHijos.length > 0) {
        const precios = modelosHijos.map(m => Number(m.precioNumerico));
        const min = Math.min(...precios);
        const max = Math.max(...precios);

        const formatCompact = (val) => {
          if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
          if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
          return `$${val}`;
        };

        etiqueta = formatCompact(min);
        if (min !== max) etiqueta = `${formatCompact(min)} - ${formatCompact(max)}`;
      } else if (dev.precioDesde) {
        etiqueta = `$${(dev.precioDesde / 1000000).toFixed(1)}M`;
      }

      return {
        id: dev.id,
        nombre: dev.nombre,
        zona: dev.zona,
        ubicacion: { latitud: dev.latitud, longitud: dev.longitud },
        portada: dev.imagen,
        etiquetaPrecio: etiqueta
      };
    }).filter(Boolean);

  }, [dataMaestra, filtros, loading]); // dataMaestra y loading ahora vienen del contexto

  const formatoMoneda = (val) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
  const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  const centroMapa = [21.88, -102.29];

  if (loading) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando mapa...</p>
      </div>
    );
  }

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
            <span style={{ ...styles.chip, color: '#166534', backgroundColor: '#dcfce7', borderColor: '#bbf7d0' }}>
              {filtros.status === 'preventa' ? 'Pre-Venta' : 'Entrega Inmediata'}
            </span>
          )}
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

          <ControlZoom marcadores={marcadoresVisibles} />

          {marcadoresVisibles.map((dev) => (
            // Validamos que tenga coordenadas antes de pintar
            (dev.ubicacion?.latitud && dev.ubicacion?.longitud) && (
              <Marker
                key={dev.id}
                position={[dev.ubicacion.latitud, dev.ubicacion.longitud]}
                icon={createCustomIcon(dev.etiquetaPrecio)}
                eventHandlers={{
                  click: () => trackBehavior('map_marker_click', { dev_name: dev.nombre }),
                }}
              >
                <Popup className="custom-popup">
                  <div style={styles.popupContent}>
                    <img
                      src={dev.portada || FALLBACK_IMG}
                      alt={dev.nombre}
                      style={styles.popupImage}
                      onError={(e) => e.target.src = FALLBACK_IMG}
                    />
                    <h4 style={styles.popupTitle}>{dev.nombre}</h4>
                    <p style={styles.popupPrice}>{dev.etiquetaPrecio}</p>
                    <p style={styles.popupLocation}>{dev.zona || 'Aguascalientes'}</p>
                    <Link
                      to={`/desarrollo/${dev.id}`}
                      style={styles.popupButton}
                    >
                      Ver Desarrollo
                    </Link>
                  </div>
                </Popup>
              </Marker>
            )
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
                <label style={styles.filterLabel}>Etapa</label>
                <div style={styles.pillGroup}>
                  {[
                    { val: 'all', label: 'Cualq.' },
                    { val: 'inmediata', label: 'Inmediata' },
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
                <label style={styles.filterLabel}>Amenidades</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button onClick={() => handleFilterChange('amenidad', '')}
                    style={{
                      ...styles.amenityChip,
                      backgroundColor: filtros.amenidad === '' ? '#e0f2fe' : '#f3f4f6',
                      color: filtros.amenidad === '' ? '#0284c7' : '#4b5563',
                      border: filtros.amenidad === '' ? '1px solid #7dd3fc' : '1px solid transparent'
                    }}>
                    Todas
                  </button>
                  {/* Amenidades ahora vienen del contexto */}
                  {topAmenidades.map((am, idx) => (
                    <button key={idx} onClick={() => handleFilterChange('amenidad', filtros.amenidad === am ? '' : am)}
                      style={{
                        ...styles.amenityChip,
                        backgroundColor: filtros.amenidad === am ? '#e0f2fe' : '#f3f4f6',
                        color: filtros.amenidad === am ? '#0284c7' : '#4b5563',
                        border: filtros.amenidad === am ? '1px solid #7dd3fc' : '1px solid transparent'
                      }}>
                      {am}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            <div style={styles.modalFooter}>
              <button style={styles.clearBtn} onClick={() => setFiltros({ precioMax: 5000000, habitaciones: 0, status: 'all', amenidad: '' })}>Limpiar</button>
              <button style={styles.applyBtn} onClick={() => setIsFilterOpen(false)}>
                Ver {marcadoresVisibles.length} desarrollos
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
  modalFooter: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px', alignItems: 'center' },
  clearBtn: { background: 'none', border: 'none', textDecoration: 'underline', color: '#6b7280', fontWeight: '600', cursor: 'pointer' },
  applyBtn: { flex: 1, backgroundColor: 'var(--primary-color)', color: 'white', padding: '12px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },
};