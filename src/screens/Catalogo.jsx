// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useMemo, useEffect } from 'react';
// Importamos useLocation y Link de react-router-dom para leer parámetros de URL y navegar.
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';

// ⭐ NUEVO IMPORTE: Importamos el componente de tarjeta reutilizable
import PropertyCard from '../components/PropertyCard';

// Eliminamos: import ImageLoader from '../components/ImageLoader';
// Eliminamos: import FavoriteBtn from '../components/FavoriteBtn';

// Importamos el hook de contexto para acceder a los datos centralizados.
import { useCatalog } from '../context/CatalogContext'; 
// Importación de constantes centralizadas.
import { FINANZAS, UI_OPCIONES } from '../config/constants';

// --- ICONOS ---
const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

// --- HELPERS ---
// Función didáctica: Normaliza texto quitando acentos y minúsculas para una búsqueda flexible.
const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

// Función didáctica: Formatea un número a moneda.
const formatoMoneda = (val) => {
  if (!val) return "$0";
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

// Eliminamos: const calcularEscrituracion = (precio) => formatoMoneda(precio * FINANZAS.PORCENTAJE_GASTOS_NOTARIALES);

export default function Catalogo() {
  const { userProfile, trackBehavior } = useUser();
  // Obtiene los datos del catálogo desde el contexto centralizado.
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading } = useCatalog();
  const location = useLocation(); 
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1. Lógica de Inicialización de Filtros (Prioriza URL > Perfil > Default)
  const getInitialFilters = useMemo(() => {
    // Lectura de parámetros de la URL
    const params = new URLSearchParams(location.search);
    const profile = userProfile?.perfilFinanciero;
    
    const defaultMaxPrice = UI_OPCIONES.FILTRO_PRECIO_MAX;
    const defaultRooms = 0;
    const defaultStatus = 'all';

    const safeNum = (val, max = Infinity) => {
        const num = Number(val);
        if (isNaN(num) || num < 0) return defaultRooms;
        return Math.min(num, max);
    }
    
    // Presupuesto Máximo
    const urlMaxPrice = params.get('maxPrice');
    const profileMaxPrice = profile?.presupuestoCalculado;
    const initialMaxPrice = urlMaxPrice
        ? safeNum(urlMaxPrice, defaultMaxPrice)
        : (profileMaxPrice ? safeNum(profileMaxPrice, defaultMaxPrice) : defaultMaxPrice);

    // Recámaras
    const urlRooms = params.get('rooms');
    const profileRooms = profile?.recamarasDeseadas;
    const initialRooms = urlRooms
        ? safeNum(urlRooms)
        : (profileRooms !== undefined && profileRooms !== null ? safeNum(profileRooms) : defaultRooms);
        
    // Status de Entrega
    const urlStatus = params.get('status');
    const profileStatus = profile?.interesInmediato === true ? 'inmediata' : (profile?.interesInmediato === false ? 'preventa' : defaultStatus);

    const initialStatus = urlStatus && ['inmediata', 'preventa'].includes(urlStatus)
        ? urlStatus
        : profileStatus;

    return {
      precioMax: initialMaxPrice, 
      habitaciones: initialRooms,
      status: initialStatus,
      amenidad: '',
      tipo: 'all'
    };
  }, [userProfile, location.search]);

  // 2. Inicializamos el estado de los filtros usando el cálculo inicial.
  const [filtros, setFiltros] = useState(getInitialFilters);

  // Hook para sincronizar el estado de filtros con la URL/Perfil
  useEffect(() => {
    if (JSON.stringify(filtros) !== JSON.stringify(getInitialFilters)) {
        setFiltros(getInitialFilters);
    }
  }, [getInitialFilters]);
  
  // Detector de Filtros Activos 
  const hayFiltrosActivos = useMemo(() => {
    const isPriceFiltered = filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX;
    const userBudget = userProfile?.perfilFinanciero?.presupuestoCalculado;

    const isCustomPriceFilter = isPriceFiltered && (
        !userBudget || 
        filtros.precioMax !== Math.min(Number(userBudget), UI_OPCIONES.FILTRO_PRECIO_MAX)
    );

    return (
      searchTerm !== '' ||
      isCustomPriceFilter ||
      filtros.habitaciones > 0 ||
      filtros.status !== 'all' ||
      filtros.amenidad !== '' ||
      filtros.tipo !== 'all'
    );
  }, [filtros, searchTerm, userProfile]);

  // 3. Motor de Filtrado
  const modelosFiltrados = useMemo(() => {
    // No filtramos si aún no se carga la data
    if (loading) return [];

    const term = normalizar(searchTerm);
    return dataMaestra.filter(item => {
      
      // Filtros numéricos y de estado
      if (item.precioNumerico > filtros.precioMax) return false;
      if (filtros.habitaciones > 0 && (item.recamaras || 0) < filtros.habitaciones) return false;
      if (filtros.status === 'inmediata' && item.esPreventa === true) return false;
      if (filtros.status === 'preventa' && item.esPreventa === false) return false;

      // Filtro por Tipo de Vivienda
      if (filtros.tipo !== 'all') {
        const tipoItem = normalizar(item.tipoVivienda);
        if (filtros.tipo === 'casa' && !tipoItem.includes('casa')) return false;
        if (filtros.tipo === 'departamento' && !tipoItem.includes('departamento') && !tipoItem.includes('loft')) return false;
      }

      // Filtro por Amenidad
      if (filtros.amenidad && Array.isArray(item.amenidadesDesarrollo)) {
        if (!item.amenidadesDesarrollo.some(a => normalizar(a).includes(normalizar(filtros.amenidad)))) return false;
      }

      // Filtro de Búsqueda de Texto Global
      if (term) {
        const amenidadesTexto = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo.join(' ') : '';
        const searchTarget = `
          ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
          ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
          ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
          ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
        `;
        if (!searchTarget.includes(term)) return false;
      }
      return true;
    });
  }, [dataMaestra, filtros, searchTerm, loading, userProfile]);

  const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  
  const limpiarTodo = () => {
    setSearchTerm('');
    setFiltros({ 
      precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX, 
      habitaciones: 0, 
      status: 'all', 
      amenidad: '', 
      tipo: 'all' 
    });
  };

  useEffect(() => {
    // Función didáctica: Evita el scroll del fondo cuando el modal de filtros está abierto
    document.body.style.overflow = isFilterOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isFilterOpen]);

  // --- RENDERIZADO DE CARGA ---
  if (loading) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div className="spinner" style={{ marginBottom: '15px' }}></div>
          <p>Cargando propiedades...</p>
          <style>{`
            .spinner {
              width: 40px; height: 40px; margin: 0 auto;
              border: 4px solid #e5e7eb; border-top: 4px solid var(--primary-color);
              border-radius: 50%; animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      <style>{`
        /* Estilos de animación para una mejor UX */
        @keyframes fadeInPage { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeInPage 0.5s ease-out forwards; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          {/* Muestra el nombre del usuario si está logueado */}
          <h1 style={styles.title}>{userProfile?.nombre ? `Hola, ${userProfile.nombre}` : 'Catálogo'}</h1>
          <p style={styles.subtitle}>Encuentra tu hogar ideal</p>
        </div>
      </header>

      {/* SEARCH BAR (Buscador Global) */}
      <div style={styles.searchContainer}>
        <div style={styles.searchBox}>
          <div style={styles.searchIconWrapper}><Icons.Search /></div>
          <input 
            type="text" placeholder="Buscar desarrollo, zona, constructora..."
            style={styles.searchInput} value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && <button onClick={() => setSearchTerm('')} style={styles.clearSearchBtn}><Icons.Close /></button>}
        </div>
      </div>

      {/* FILTER BAR (Filtros Activos) */}
      <div style={styles.stickyFilterBar}>
        <button onClick={() => setIsFilterOpen(true)} style={styles.filterTriggerBtn}>
          <Icons.Filter /> Filtros
        </button>
        {hayFiltrosActivos && (
          <button onClick={limpiarTodo} style={styles.clearAllBtn} title="Limpiar todos los filtros">
            <Icons.Trash />
          </button>
        )}
        <div style={styles.activeChipsContainer}>
          {/* Muestra el chip de precio solo si el filtro no es el valor máximo predeterminado */}
          {hayFiltrosActivos && filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX && 
            <span style={styles.chip}>Max {formatoMoneda(filtros.precioMax)}</span>
          }
          
          {filtros.habitaciones > 0 && <span style={styles.chip}>{filtros.habitaciones}+ Rec.</span>}
          {filtros.tipo !== 'all' && (
            <span style={{...styles.chip, backgroundColor: '#e0e7ff', color: '#3730a3', borderColor: '#c7d2fe'}}>
               {filtros.tipo === 'casa' ? 'Casas' : 'Departamentos'}
            </span>
          )}
          {filtros.status !== 'all' && (
             <span style={{...styles.chip, backgroundColor: filtros.status === 'preventa' ? '#fff7ed' : '#f0fdf4', color: filtros.status === 'preventa' ? '#c2410c' : '#166534', borderColor: filtros.status === 'preventa' ? '#fed7aa' : '#bbf7d0'}}>
               {filtros.status === 'preventa' ? 'Pre-Venta' : 'Inmediata'}
             </span>
          )}
          {filtros.amenidad && <span style={styles.chip}>{filtros.amenidad}</span>}
        </div>
      </div>

      {/* MODAL FILTROS */}
      {isFilterOpen && (
        <div style={styles.modalOverlay} onClick={() => setIsFilterOpen(false)}>
          <div style={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Filtros</h2>
              <button onClick={() => setIsFilterOpen(false)} style={styles.closeBtn}><Icons.Close /></button>
            </div>
            <div style={styles.modalBody}>
              
              {/* SECCIÓN FILTRO DE PRECIO */}
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Presupuesto Máximo</label>
                <div style={styles.priceDisplay}>{formatoMoneda(filtros.precioMax)}</div>
                <input 
                  type="range" 
                  min="500000" 
                  max={UI_OPCIONES.FILTRO_PRECIO_MAX} 
                  step={UI_OPCIONES.FILTRO_PRECIO_STEP} 
                  value={filtros.precioMax} 
                  onChange={(e) => handleFilterChange('precioMax', Number(e.target.value))} 
                  style={styles.slider} 
                />
              </div>

              {/* SECCIÓN FILTRO DE RECÁMARAS */}
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Recámaras</label>
                <div style={styles.pillGroup}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => handleFilterChange('habitaciones', num)} style={{...styles.pill, backgroundColor: filtros.habitaciones === num ? 'var(--primary-color)' : 'white', color: filtros.habitaciones === num ? 'white' : '#333', borderColor: filtros.habitaciones === num ? 'var(--primary-color)' : '#e5e7eb'}}>{num === 0 ? 'Todas' : `${num}+`}</button>
                  ))}
                </div>
              </div>

              {/* SECCIÓN FILTRO DE ETAPA */}
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Etapa</label>
                 <div style={styles.pillGroup}>
                   {[{val: 'all', label: 'Cualq.'}, {val: 'inmediata', label: 'Inmediata'}, {val: 'preventa', label: 'Preventa'}].map(opt => (
                     <button key={opt.val} onClick={() => handleFilterChange('status', opt.val)} style={{...styles.pill, fontSize:'0.9rem', backgroundColor: filtros.status === opt.val ? 'var(--primary-color)' : 'white', color: filtros.status === opt.val ? 'white' : '#333', borderColor: filtros.status === opt.val ? 'var(--primary-color)' : '#e5e7eb'}}>{opt.label}</button>
                   ))}
                 </div>
              </div>
              
              {/* SECCIÓN FILTRO DE AMENIDADES */}
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Amenidades Populares</label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  <button onClick={() => handleFilterChange('amenidad', '')} style={{...styles.amenityChip, backgroundColor: filtros.amenidad === '' ? '#e0f2fe' : '#f3f4f6', color: filtros.amenidad === '' ? '#0284c7' : '#4b5563', border: filtros.amenidad === '' ? '1px solid #7dd3fc' : '1px solid transparent'}}>Todas</button>
                  {/* Amenidades populares cargadas desde el contexto */}
                  {topAmenidades.map((am, idx) => (
                    <button key={idx} onClick={() => handleFilterChange('amenidad', filtros.amenidad === am ? '' : am)} style={{...styles.amenityChip, backgroundColor: filtros.amenidad === am ? '#e0f2fe' : '#f3f4f6', color: filtros.amenidad === am ? '#0284c7' : '#4b5563', border: filtros.amenidad === am ? '1px solid #7dd3fc' : '1px solid transparent'}}>{am}</button>
                  ))}
                </div>
              </div>
            </div>

            {/* FOOTER DEL MODAL */}
            <div style={styles.modalFooter}>
              <button style={styles.clearBtn} onClick={limpiarTodo}>Limpiar</button>
              <button style={styles.applyBtn} onClick={() => setIsFilterOpen(false)}>
                Ver {modelosFiltrados.length} prop.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS (La cuadrícula de propiedades) */}
      <section style={styles.gridContainer} className="animate-fade-in">
        
        {/* ⭐ REFACTORIZACIÓN CRÍTICA: Usamos el componente PropertyCard */}
        {modelosFiltrados.map((item) => (
          <PropertyCard 
             key={item.id} 
             item={item} 
             showDevName={true} // Mostramos el nombre del desarrollo en el catálogo principal
          />
        ))}

        {/* Estado Vacío */}
        {modelosFiltrados.length === 0 && (
          <div style={styles.emptyState}>
            <h3>No encontramos resultados</h3>
            <p>Intenta con otros términos o limpia los filtros.</p>
            <button onClick={limpiarTodo} style={styles.retryBtn}>Ver Todo</button>
          </div>
        )}
      </section>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS (Solo Layout, Headers y Filtros) ---
const styles = {
  // Nota Didáctica: Los estilos de la tarjeta fueron MOVIDOS a PropertyCard.jsx
  pageContainer: { paddingBottom: '100px', backgroundColor: '#f9fafb', minHeight: '100vh', fontFamily: "'Segoe UI', sans-serif" },
  header: { backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #f3f4f6' },
  title: { color: '#111827', margin: 0, fontSize: '1.4rem', fontWeight: '800' },
  subtitle: { color: '#6b7280', margin: '2px 0 0 0', fontSize: '0.9rem' },
  
  searchContainer: { backgroundColor: 'white', padding: '10px 20px' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '10px 12px', border: '1px solid #e5e7eb', transition: 'all 0.2s' },
  searchIconWrapper: { color: '#9ca3af', marginRight: '10px', display: 'flex' },
  searchInput: { flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '1rem', color: '#374151' },
  clearSearchBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0 0 0 8px', display: 'flex' },

  stickyFilterBar: { position: 'sticky', top: 0, zIndex: 90, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderBottom: '1px solid #e5e7eb', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  filterTriggerBtn: { flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', border: '1px solid #d1d5db', padding: '8px 16px', borderRadius: '30px', fontSize: '0.9rem', fontWeight: '600', color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  clearAllBtn: { flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#ef4444', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', marginRight: '5px' },
  activeChipsContainer: { display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: 0, whiteSpace: 'nowrap', scrollbarWidth: 'none', paddingRight: '10px', alignItems: 'center' },
  chip: { padding: '6px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600', whiteSpace: 'nowrap', border: '1px solid', flexShrink: 0 },

  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', justifyContent: 'center', alignItems: 'flex-end', backdropFilter: 'blur(3px)' },
  modalContent: { backgroundColor: 'white', width: '100%', maxWidth: '500px', height: '85vh', borderRadius: '20px 20px 0 0', display: 'flex', flexDirection: 'column', animation: 'slideUp 0.3s ease-out' },
  modalHeader: { padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111' },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#666' },
  modalBody: { padding: '20px', overflowY: 'auto', flex: 1 },
  filterSection: { marginBottom: '30px' },
  filterLabel: { display: 'block', fontSize: '1rem', fontWeight: '700', color: '#374151', marginBottom: '10px' },
  priceDisplay: { fontSize: '2rem', fontWeight: '800', color: 'var(--primary-color)', marginBottom: '10px' },
  slider: { width: '100%', accentColor: 'var(--primary-color)', height: '6px', cursor: 'pointer' },
  pillGroup: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
  pill: { flex: 1, minWidth: '80px', padding: '12px', borderRadius: '12px', border: '1px solid', fontSize: '0.9rem', fontWeight: '600', cursor: 'pointer', textAlign: 'center' },
  amenityChip: { padding: '8px 14px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' },
  modalFooter: { padding: '20px', borderTop: '1px solid #f3f4f6', display: 'flex', gap: '15px', alignItems: 'center' },
  clearBtn: { background: 'none', border: 'none', textDecoration: 'underline', color: '#6b7280', fontWeight: '600', cursor: 'pointer', fontSize: '0.9rem' },
  applyBtn: { flex: 1, backgroundColor: 'var(--primary-color)', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer' },

  // Estilos del Contenedor de la Grilla
  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', padding: '25px 20px' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
  retryBtn: { marginTop: '15px', padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }
};