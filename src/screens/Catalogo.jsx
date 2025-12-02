// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 02/12/2025
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom'; 
import { useUser } from '../context/UserContext';

// ⭐ IMPORTS CLAVE V3
import { queryCatalog } from '../services/catalog.service'; 
import { useCatalog } from '../context/CatalogContext'; 
import PropertyCard from '../components/PropertyCard'; 
import { UI_OPCIONES } from '../config/constants';

// --- ICONOS y HELPERS (Se mantienen iguales) ---
const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const formatoMoneda = (val) => {
  if (!val) return "$0";
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

export default function Catalogo() {
  const { userProfile } = useUser();
  // Solo topAmenidades sigue viniendo del contexto (para el modal de filtros)
  const { amenidades: topAmenidades } = useCatalog();
  const location = useLocation(); 
  
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- 1. ESTADOS DE PAGINACIÓN Y CARGA ---
  const [modelos, setModelos] = useState([]);
  const [lastVisible, setLastVisible] = useState(null); // Cursor para la siguiente consulta
  const [hasMore, setHasMore] = useState(true);         // ¿Hay más resultados en la DB?
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const loaderRef = useRef(null); // Referencia para IntersectionObserver

  // --- 2. Lógica de Filtros UI (Se mantiene igual) ---
  const getInitialFilters = useMemo(() => {
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
    
    const urlMaxPrice = params.get('maxPrice');
    const profileMaxPrice = profile?.presupuestoCalculado;
    const initialMaxPrice = urlMaxPrice
        ? safeNum(urlMaxPrice, defaultMaxPrice)
        : (profileMaxPrice ? safeNum(profileMaxPrice, defaultMaxPrice) : defaultMaxPrice);

    const urlRooms = params.get('rooms');
    const profileRooms = profile?.recamarasDeseadas;
    const initialRooms = urlRooms
        ? safeNum(urlRooms)
        : (profileRooms !== undefined && profileRooms !== null ? safeNum(profileRooms) : defaultRooms);
        
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

  const [filtros, setFiltros] = useState(getInitialFilters);

  // Genera los términos de búsqueda normalizados (para Firestore keywords)
  const searchTerms = useMemo(() => {
    if (!searchTerm) return [];
    return normalizar(searchTerm).split(/\s+/).filter(t => t.length > 2);
  }, [searchTerm]);

  // 3. FUNCIÓN DE CARGA DE DATOS PAGINADA (Llama a Firestore)
  const cargarModelos = useCallback(async (loadMore = false) => {
    if (isLoading || (!hasMore && loadMore)) return;

    setIsLoading(true);
    // Si no estamos cargando más, reseteamos la lista y el cursor
    if (!loadMore) {
        setModelos([]);
        setLastVisible(null); 
        setHasMore(true); 
    }
    setIsInitialLoad(!loadMore); 

    const cursor = loadMore ? lastVisible : null;
    
    // Objeto de filtros que se envía al servicio
    const queryFilters = {
        searchTerms: searchTerms,
        precioMax: filtros.precioMax,
        habitaciones: filtros.habitaciones,
        status: filtros.status
    };

    try {
        const { modelos: nuevosModelos, lastVisible: newLastVisible, hasMore: newHasMore } = await queryCatalog(queryFilters, cursor);

        setModelos(prevModelos => 
            // Concatenamos si es Scroll Infinito, si no, es una nueva lista
            loadMore ? [...prevModelos, ...nuevosModelos] : nuevosModelos
        );
        setLastVisible(newLastVisible);
        setHasMore(newHasMore);

    } catch (error) {
        console.error("Error en la consulta del catálogo (verifique índices en Firebase):", error);
        setHasMore(false);
    } finally {
        setIsLoading(false);
        setIsInitialLoad(false);
    }
  }, [isLoading, hasMore, lastVisible, searchTerms, filtros]); 


  // 4. Disparadores de Carga: Reiniciar al cambiar filtros/búsqueda
  useEffect(() => {
    // Cuando los filtros o términos de búsqueda cambian, reseteamos y recargamos.
    // Usamos setTimeout para evitar llamadas excesivas
    const handler = setTimeout(() => {
      cargarModelos(false);
    }, 300);
    
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros, searchTerms]); 
  
  // --- 5. IMPLEMENTACIÓN DE SCROLL INFINITO (Intersection Observer) ---
  
  useEffect(() => {
    // Si no tenemos un elemento para observar o no podemos cargar más, salimos.
    if (!loaderRef.current || !hasMore || isLoading || modelos.length === 0) return; 

    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading && hasMore && modelos.length > 0) {
        cargarModelos(true); // Carga la siguiente página
      }
    }, {
      root: null, // Observa el viewport
      rootMargin: '200px', 
      threshold: 1.0
    });

    observer.observe(loaderRef.current);
    
    return () => observer.disconnect();
    
    // No incluimos modelos en las dependencias.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, isLoading]); 


  // 6. Helper para UI y Limpieza de Filtros
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
    document.body.style.overflow = isFilterOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; }
  }, [isFilterOpen]);


  // --- RENDERIZADO DE CARGA ---

  if (isInitialLoad && isLoading) {
    return (
      <div className="main-content" style={{ ...styles.pageContainer, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <div className="spinner" style={{ marginBottom: '15px' }}></div>
          <p>Cargando catálogo inicial...</p>
        </div>
      </div>
    );
  }

  // --- RENDERIZADO PRINCIPAL ---

  return (
    <div className="main-content animate-fade-in" style={styles.pageContainer}>
      
      {/* ... (Estilos del Spinner se incluyen para que sea autónomo) ... */}
      <style>{`
            .spinner {
              width: 40px; height: 40px; margin: 0 auto;
              border: 4px solid #e5e7eb; border-top: 4px solid var(--primary-color);
              border-radius: 50%; animation: spin 1s linear infinite;
            }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes fadeInPage { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            .animate-fade-in { animation: fadeInPage 0.5s ease-out forwards; }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>

      <header style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>{userProfile?.nombre ? `Hola, ${userProfile.nombre}` : 'Catálogo'}</h1>
          <p style={styles.subtitle}>Encuentra tu hogar ideal</p>
        </div>
      </header>

      {/* SEARCH BAR */}
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
        {/* ... (Chips de filtros se mantienen) ... */}
        <div style={styles.activeChipsContainer}>
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
              
              {/* ... (Controles de filtros se mantienen) ... */}
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

              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Recámaras</label>
                <div style={styles.pillGroup}>
                  {[0, 1, 2, 3, 4].map(num => (
                    <button key={num} onClick={() => handleFilterChange('habitaciones', num)} style={{...styles.pill, backgroundColor: filtros.habitaciones === num ? 'var(--primary-color)' : 'white', color: filtros.habitaciones === num ? 'white' : '#333', borderColor: filtros.habitaciones === num ? 'var(--primary-color)' : '#e5e7eb'}}>{num === 0 ? 'Todas' : `${num}+`}</button>
                  ))}
                </div>
              </div>

              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Etapa</label>
                 <div style={styles.pillGroup}>
                   {[{val: 'all', label: 'Cualq.'}, {val: 'inmediata', label: 'Inmediata'}, {val: 'preventa', label: 'Preventa'}].map(opt => (
                     <button key={opt.val} onClick={() => handleFilterChange('status', opt.val)} style={{...styles.pill, fontSize:'0.9rem', backgroundColor: filtros.status === opt.val ? 'var(--primary-color)' : 'white', color: filtros.status === opt.val ? 'white' : '#333', borderColor: filtros.status === opt.val ? 'var(--primary-color)' : '#e5e7eb'}}>{opt.label}</button>
                   ))}
                 </div>
              </div>
              
              <div style={styles.filterSection}>
                <label style={styles.filterLabel}>Amenidades Populares</label>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
                  <button onClick={() => handleFilterChange('amenidad', '')} style={{...styles.amenityChip, backgroundColor: filtros.amenidad === '' ? '#e0f2fe' : '#f3f4f6', color: filtros.amenidad === '' ? '#0284c7' : '#4b5563', border: filtros.amenidad === '' ? '1px solid #7dd3fc' : '1px solid transparent'}}>Todas</button>
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
                Ver {modelos.length} prop.
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADOS (La cuadrícula de propiedades) */}
      <section style={styles.gridContainer} className="animate-fade-in">
        
        {modelos.map((item) => (
          <PropertyCard 
             key={item.id} 
             item={item} 
             showDevName={true} 
          />
        ))}

        {/* Estado Vacío */}
        {modelos.length === 0 && !isLoading && (
          <div style={styles.emptyState}>
            <h3>No encontramos resultados</h3>
            <p>Intenta con otros términos o limpia los filtros.</p>
            <button onClick={limpiarTodo} style={styles.retryBtn}>Ver Todo</button>
          </div>
        )}
        
        {/* ⭐ INDICADOR Y ACTIVADOR DEL SCROLL INFINITO */}
        <div ref={loaderRef} style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
            {isLoading && hasMore && modelos.length > 0 && (
                <div style={{color: 'var(--primary-color)'}}>Cargando más propiedades...</div>
            )}
            {!hasMore && modelos.length > 0 && !isLoading && (
                <div style={{color: '#9ca3af', fontSize: '0.9rem'}}>Fin del catálogo. No hay más propiedades que coincidan.</div>
            )}
        </div>
        
      </section>
    </div>
  );
}

// --- ESTILOS CSS-IN-JS (Se mantienen iguales) ---
const styles = {
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