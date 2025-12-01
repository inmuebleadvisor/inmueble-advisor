// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 01/12/2025
import React, { useState, useMemo, useEffect } from 'react';
// Importamos useLocation y Link de react-router-dom para leer parámetros de URL y navegar.
import { Link, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import ImageLoader from '../components/ImageLoader';

// ⭐ NUEVA IMPORTACIÓN: Componente para marcar y desmarcar modelos
import FavoriteBtn from '../components/FavoriteBtn'; 

// Importamos el hook de contexto para acceder a los datos centralizados.
import { useCatalog } from '../context/CatalogContext'; 

// Importación de constantes centralizadas.
import { FINANZAS, UI_OPCIONES } from '../config/constants';

// --- ICONOS (No es necesario comentar los iconos, ya están definidos) ---
const Icons = {
  Filter: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line><line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line><line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line><line x1="1" y1="14" x2="7" y2="14"></line><line x1="9" y1="8" x2="15" y2="8"></line><line x1="17" y1="16" x2="23" y2="16"></line></svg>,
  Close: () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
  Search: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>,
  Trash: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

// --- HELPERS ---
const normalizar = (texto) => {
  if (!texto) return '';
  return String(texto).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
};

const formatoMoneda = (val) => {
  if (!val) return "$0";
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(val);
};

// Función para calcular los gastos notariales (utiliza la constante global)
const calcularEscrituracion = (precio) => formatoMoneda(precio * FINANZAS.PORCENTAJE_GASTOS_NOTARIALES);

export default function Catalogo() {
  const { userProfile, trackBehavior } = useUser();
  // Accedemos a los datos centralizados del catálogo y al estado de carga.
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading } = useCatalog();
  // Hook de React Router para leer los parámetros de la URL.
  const location = useLocation(); 
  
  // --- ESTADOS DE UI ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // 1. Lógica de Inicialización de Filtros (Usa useMemo para calcular valores iniciales)
  const getInitialFilters = useMemo(() => {
    // Obtenemos los parámetros de la URL y los datos del perfil si existen.
    const params = new URLSearchParams(location.search);
    const profile = userProfile?.perfilFinanciero;
    
    // Definición de valores base
    const defaultMaxPrice = UI_OPCIONES.FILTRO_PRECIO_MAX;
    const defaultRooms = 0;
    const defaultStatus = 'all';

    // Función auxiliar para convertir a número de forma segura
    const safeNum = (val, max = Infinity) => {
        const num = Number(val);
        if (isNaN(num) || num < 0) return defaultRooms;
        // Limitamos el valor al máximo permitido por el slider de la UI
        return Math.min(num, max);
    }
    
    // A. Presupuesto Máximo: Prioriza URL > Perfil Guardado > Default
    const urlMaxPrice = params.get('maxPrice');
    const profileMaxPrice = profile?.presupuestoCalculado;
    const initialMaxPrice = urlMaxPrice
        ? safeNum(urlMaxPrice, defaultMaxPrice)
        : (profileMaxPrice ? safeNum(profileMaxPrice, defaultMaxPrice) : defaultMaxPrice);

    // B. Recámaras: Prioriza URL > Perfil Guardado > Default
    const urlRooms = params.get('rooms');
    const profileRooms = profile?.recamarasDeseadas;
    const initialRooms = urlRooms
        ? safeNum(urlRooms)
        : (profileRooms !== undefined && profileRooms !== null ? safeNum(profileRooms) : defaultRooms);
        
    // C. Status de Entrega: Prioriza URL > Perfil Guardado (convertido a string) > Default
    const urlStatus = params.get('status');
    const profileStatus = profile?.interesInmediato === true ? 'inmediata' : (profile?.interesInmediato === false ? 'preventa' : defaultStatus);

    const initialStatus = urlStatus && ['inmediata', 'preventa'].includes(urlStatus)
        ? urlStatus
        : profileStatus;

    // Retornamos el objeto de filtros inicial
    return {
      precioMax: initialMaxPrice, 
      habitaciones: initialRooms,
      status: initialStatus,
      amenidad: '',
      tipo: 'all'
    };
  }, [userProfile, location.search]); // Depende del perfil y la URL para re-evaluar

  // 2. Inicializamos el estado de los filtros usando el cálculo inicial.
  const [filtros, setFiltros] = useState(getInitialFilters);

  // Detector de Filtros Activos (para mostrar el botón de "Limpiar Todo")
  const hayFiltrosActivos = useMemo(() => {
    // Verificamos si el precio es diferente al MÁXIMO de la UI
    const isPriceFiltered = filtros.precioMax < UI_OPCIONES.FILTRO_PRECIO_MAX;
    
    // Obtenemos el presupuesto base del usuario para saber si el filtro de precio es "personalizado"
    const userBudget = userProfile?.perfilFinanciero?.presupuestoCalculado;

    // Consideramos que el filtro de precio está activo si es menor al máximo de la UI O
    // si el valor actual no coincide con el presupuesto que se cargó por defecto desde el perfil.
    const isCustomPriceFilter = isPriceFiltered && (
        !userBudget || 
        // Comparamos el valor actual con el valor que debería haber cargado el perfil
        filtros.precioMax !== Math.min(Number(userBudget), UI_OPCIONES.FILTRO_PRECIO_MAX)
    );

    // Si cualquier filtro es diferente a su valor por defecto, está activo.
    return (
      searchTerm !== '' ||
      isCustomPriceFilter ||
      filtros.habitaciones > 0 ||
      filtros.status !== 'all' ||
      filtros.amenidad !== '' ||
      filtros.tipo !== 'all'
    );
  }, [filtros, searchTerm, userProfile]);

  // 3. Motor de Filtrado (Aplica los filtros al catálogo maestro)
  const modelosFiltrados = useMemo(() => {
    if (loading) return []; // Si el catálogo no carga, no hay modelos.

    const term = normalizar(searchTerm);
    return dataMaestra.filter(item => {
      
      // FILTRO 1: Precio máximo (el filtro más importante)
      if (item.precioNumerico > filtros.precioMax) return false;
      
      // FILTRO 2: Recámaras mínimas
      if (filtros.habitaciones > 0 && (item.recamaras || 0) < filtros.habitaciones) return false;
      
      // FILTRO 3: Status (Entrega Inmediata / Preventa)
      if (filtros.status === 'inmediata' && item.esPreventa === true) return false;
      if (filtros.status === 'preventa' && item.esPreventa === false) return false;

      // FILTRO 4: Tipo de Vivienda (Casa/Departamento)
      if (filtros.tipo !== 'all') {
        const tipoItem = normalizar(item.tipoVivienda);
        if (filtros.tipo === 'casa' && !tipoItem.includes('casa')) return false;
        if (filtros.tipo === 'departamento' && !tipoItem.includes('departamento') && !tipoItem.includes('loft')) return false;
      }

      // FILTRO 5: Amenidad (Filtro por palabra clave en amenidades del desarrollo)
      if (filtros.amenidad && Array.isArray(item.amenidadesDesarrollo)) {
        // Busca si alguna amenidad del modelo incluye el término del filtro.
        if (!item.amenidadesDesarrollo.some(a => normalizar(a).includes(normalizar(filtros.amenidad)))) return false;
      }

      // FILTRO 6: Buscador Universal (Coincidencia de texto)
      if (term) {
        // Construye una cadena gigante con todos los campos relevantes para buscar.
        const amenidadesTexto = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo.join(' ') : '';
        const searchTarget = `
          ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
          ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
          ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
          ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
        `;
        if (!searchTarget.includes(term)) return false;
      }
      return true; // Pasa todos los filtros
    });
  }, [dataMaestra, filtros, searchTerm, loading, userProfile]);

  const handleFilterChange = (key, val) => setFiltros(prev => ({ ...prev, [key]: val }));
  
  // Resetea todos los filtros a sus valores por defecto (máximo precio, 0 recámaras, 'all' status)
  const limpiarTodo = () => {
    setSearchTerm('');
    // Al limpiar, usamos los valores máximos de la UI
    setFiltros({ 
      precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX, 
      habitaciones: 0, 
      status: 'all', 
      amenidad: '', 
      tipo: 'all' 
    });
  };

  // Efecto para controlar el scroll del body cuando el modal está abierto (UX)
  useEffect(() => {
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
        {modelosFiltrados.map((item) => (
          <article key={item.id} style={styles.card}>
            
            {/* CARRUSEL DE IMÁGENES */}
            <div style={styles.carouselContainer} className="hide-scrollbar">
               {/* Itera sobre las imágenes del modelo o usa la imagen principal como fallback */}
               {(item.imagenes || [item.imagen]).map((imgSrc, idx) => (
                 <div key={idx} style={styles.carouselSlide}>
                    <ImageLoader 
                      src={imgSrc} 
                      alt={`${item.nombre_modelo || item.nombre} - vista ${idx}`} 
                      style={styles.image} 
                    />
                    {/* Muestra un hint de cuántas fotos hay si son más de una */}
                    {idx === 0 && item.imagenes?.length > 1 && (
                       <div style={styles.swipeHint}>+{item.imagenes.length - 1}</div>
                    )}
                 </div>
               ))}

               {/* Etiqueta de Status (Preventa/Inmediata) */}
               <span style={{
                 ...styles.statusTag,
                 backgroundColor: item.esPreventa ? '#f59e0b' : '#10b981'
               }}>
                 {item.esPreventa ? 'PRE-VENTA' : 'ENTREGA INMEDIATA'}
               </span>
               
               {/* 🚀 NUEVA FUNCIONALIDAD: Botón de Favoritos */}
               {/* Se utiliza el nuevo componente FavoriteBtn con el ID del modelo */}
               <div style={styles.favoriteBtnWrapper}>
                  <FavoriteBtn modeloId={item.id} />
               </div>

               {/* Overlay con información del desarrollo y modelo */}
               <div style={styles.imageOverlay}>
                 <h3 style={styles.overlayDevName}>{item.nombreDesarrollo}</h3>
                 <p style={styles.overlayModelName}>
                    {item.constructora ? `${item.constructora} • ` : ''} {item.nombre_modelo || item.nombre}
                 </p>
               </div>
            </div>

            <div style={styles.cardBody}>
               {/* Ubicación */}
               <div style={styles.locationRow}>
                 <span style={{marginRight: '5px'}}>📍</span> 
                 {item.colonia ? `${item.colonia}, ` : ''}{item.zona || item.ciudad}
               </div>

               {/* Especificaciones Técnicas */}
               <div style={styles.featuresRow}>
                 <span style={styles.featureItem}>🛏 {item.recamaras || 0} Rec.</span>
                 <span style={styles.separator}>|</span>
                 <span style={styles.featureItem}>🚿 {item.banos || 0} Baños</span>
                 <span style={styles.separator}>|</span>
                 <span style={styles.featureItem}>📐 {item.m2 || 0} m²</span>
               </div>

               {/* Precio y Gastos Notariales */}
               <div style={styles.priceBox}>
                 <div style={{display:'flex', justifyContent:'space-between'}}>
                    <span style={styles.priceLabel}>PRECIO DE LISTA</span>
                 </div>
                 <div style={{
                    ...styles.priceValue,
                    color: item.precioNumerico > 0 ? '#1e293b' : '#64748b',
                    fontSize: item.precioNumerico > 0 ? '1.8rem' : '1.4rem'
                 }}>
                   {item.precioNumerico > 0 ? formatoMoneda(item.precioNumerico) : "Pendiente"}
                 </div>
                 {item.precioNumerico > 0 && (
                   <div style={styles.priceNote}>
                     *Escrituración aprox: {calcularEscrituracion(item.precioNumerico)}
                   </div>
                 )}
               </div>

               {/* Botón de Detalle */}
               <Link 
                 to={`/modelo/${item.id}`} 
                 style={styles.detailsButton}
                 onClick={() => trackBehavior('select_property', { id: item.id })}
               >
                 Ver Detalles Completos
               </Link>
            </div>
          </article>
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

// --- ESTILOS ---
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

  gridContainer: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '25px', padding: '25px 20px' },
  // Importante: Se agrega position: 'relative' para que FavoriteBtn (position: 'absolute') funcione.
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', position: 'relative' }, 
  
  carouselContainer: { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', width: '100%', height: '220px', position: 'relative', backgroundColor: '#e5e7eb' },
  carouselSlide: { minWidth: '100%', height: '100%', scrollSnapAlign: 'center', position: 'relative' },
  image: { width: '100%', height: '100%', objectFit: 'cover' },
  swipeHint: { position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', zIndex: 10 },

  statusTag: { position: 'absolute', top: '12px', right: '12px', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '0.5px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', pointerEvents: 'none', zIndex: 10 },
  // ⭐ NUEVO ESTILO: Contenedor para posicionar el botón de favorito
  favoriteBtnWrapper: { 
    position: 'absolute', 
    top: '12px', 
    left: '12px', 
    zIndex: 11 // Asegura que esté por encima del swipeHint
  },
  imageOverlay: { position: 'absolute', bottom: 0, left: 0, width: '100%', padding: '40px 16px 12px 16px', background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)', display: 'flex', flexDirection: 'column', pointerEvents: 'none', zIndex: 10 }, 
  overlayDevName: { color: 'white', fontSize: '1.4rem', fontWeight: '700', margin: 0, lineHeight: '1.2', textShadow: '0 2px 4px rgba(0,0,0,0.5)' },
  overlayModelName: { color: '#e5e7eb', fontSize: '0.95rem', margin: '4px 0 0 0', fontWeight: '500' },
  
  cardBody: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' },
  locationRow: { color: '#6b7280', fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  featuresRow: { display: 'flex', alignItems: 'center', gap: '8px', color: '#374151', fontSize: '0.95rem', fontWeight: '500' },
  featureItem: { display: 'flex', alignItems: 'center', gap: '4px' },
  separator: { color: '#d1d5db', fontSize: '1.2rem', fontWeight: '300' },
  priceBox: { backgroundColor: '#eff6ff', borderRadius: '12px', padding: '16px', marginTop: '5px', border: '1px solid #dbeafe' },
  priceLabel: { fontSize: '0.7rem', fontWeight: '800', color: '#1e293b', letterSpacing: '1px', textTransform: 'uppercase' },
  priceValue: { fontWeight: '800', margin: '4px 0' },
  priceNote: { fontSize: '0.8rem', color: '#64748b', marginTop: '4px' },
  detailsButton: { backgroundColor: '#0f172a', color: 'white', textAlign: 'center', padding: '12px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '0.95rem', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
  emptyState: { gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#6b7280' },
  retryBtn: { marginTop: '15px', padding: '10px 20px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' }
};