// src/screens/Catalogo.jsx
// ÚLTIMA MODIFICACION: 03/12/2025
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useCatalog } from '../context/CatalogContext';
import { UI_OPCIONES, STATUS } from '../config/constants';
import { normalizar } from '../utils/formatters';

// Components
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/catalogo/SearchBar';
import FilterBar from '../components/catalogo/FilterBar';
import FilterModal from '../components/catalogo/FilterModal';

// Styles
import '../styles/Catalogo.css';

export default function Catalogo() {
  const { userProfile } = useUser();
  const { modelos: dataMaestra, amenidades: topAmenidades, loadingCatalog: loading, desarrollos } = useCatalog();
  const location = useLocation();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Inicialización de Filtros
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

    // Presupuesto
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

    // Status
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
      searchTerm !== '' || isCustomPriceFilter || filtros.habitaciones > 0 ||
      filtros.status !== 'all' || filtros.amenidad !== '' || filtros.tipo !== 'all'
    );
  }, [filtros, searchTerm, userProfile]);

  // 3. Motor de Filtrado (Robustecido con Datos de Desarrollo)
  const modelosFiltrados = useMemo(() => {
    if (loading) return [];

    const term = normalizar(searchTerm);
    return dataMaestra.filter(item => {
      // JOIN: Buscamos el desarrollo padre para datos faltantes
      // FIX: Usamos String() para evitar errores de tipo (number vs string)
      const desarrollo = desarrollos.find(d => String(d.id) === String(item.idDesarrollo));

      // --- 1. PRECIO ---
      const precio = Number(item.precioNumerico) || 0;
      if (precio > filtros.precioMax) return false;

      // --- 2. HABITACIONES ---
      const recamaras = Number(item.recamaras) || 0;
      if (filtros.habitaciones > 0 && recamaras < filtros.habitaciones) return false;

      // --- 3. STATUS (ETAPA) ---
      let esPreventa = false;

      // Lógica de Prioridad:
      if (desarrollo) {
        // Normalizamos el status para comparación segura
        const statusDesarrollo = String(desarrollo.status || '').toUpperCase().trim();

        // Check explícito contra valores de BD y variaciones comunes
        if (
          statusDesarrollo === 'PRE-VENTA' ||
          statusDesarrollo === 'PREVENTA' ||
          statusDesarrollo === STATUS.DEV_PREALE ||
          statusDesarrollo.includes('PRE-VENTA') ||
          statusDesarrollo.includes('PREVENTA')
        ) {
          esPreventa = true;
        }
      }

      // Si no se detectó por desarrollo, miramos el flag del modelo
      if (!esPreventa && item.esPreventa) {
        esPreventa = true;
      }

      if (filtros.status === 'inmediata' && esPreventa) return false;
      if (filtros.status === 'preventa' && !esPreventa) return false;

      // --- 4. TIPO ---
      if (filtros.tipo !== 'all') {
        const tipoItem = normalizar(item.tipoVivienda);
        if (filtros.tipo === 'casa' && !tipoItem.includes('casa')) return false;
        if (filtros.tipo === 'departamento' && !tipoItem.includes('departamento') && !tipoItem.includes('loft')) return false;
      }

      // --- 5. AMENIDAD ---
      if (filtros.amenidad) {
        const amenidadBuscada = normalizar(filtros.amenidad);

        const amDesarrollo = Array.isArray(desarrollo?.amenidades) ? desarrollo.amenidades : [];
        const amModelo = Array.isArray(item.amenidades) ? item.amenidades : [];
        const amModeloDesarrollo = Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : [];

        const todasAmenidades = [...new Set([...amDesarrollo, ...amModelo, ...amModeloDesarrollo])];

        const tieneAmenidad = todasAmenidades.some(a => normalizar(a).includes(amenidadBuscada));
        if (!tieneAmenidad) return false;
      }

      // --- 6. BÚSQUEDA TEXTO ---
      if (term) {
        const keywordsModelo = Array.isArray(item.keywords) ? item.keywords : [];
        const keywordsDesarrollo = desarrollo && Array.isArray(desarrollo.keywords) ? desarrollo.keywords : [];
        const allKeywords = [...keywordsModelo, ...keywordsDesarrollo];

        if (allKeywords.length > 0) {
          const match = allKeywords.some(k => normalizar(k).includes(term));
          if (!match) {
            const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
            const searchTarget = `
                   ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
                   ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
                   ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
                   ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
                   ${normalizar(desarrollo?.nombre || '')}
                 `;
            if (!searchTarget.includes(term)) return false;
          }
        } else {
          const amenidadesTexto = [...(Array.isArray(item.amenidadesDesarrollo) ? item.amenidadesDesarrollo : []), ...(desarrollo?.amenidades || [])].join(' ');
          const searchTarget = `
              ${normalizar(item.nombre)} ${normalizar(item.nombre_modelo)} ${normalizar(item.nombreDesarrollo)}
              ${normalizar(item.constructora)} ${normalizar(item.tipoVivienda)}
              ${normalizar(item.colonia)} ${normalizar(item.ciudad)}
              ${normalizar(item.zona)} ${normalizar(amenidadesTexto)}
              ${normalizar(desarrollo?.nombre || '')}
            `;
          if (!searchTarget.includes(term)) return false;
        }
      }
      return true;
    });
  }, [dataMaestra, desarrollos, filtros, searchTerm, loading]);

  const limpiarTodo = () => {
    setSearchTerm('');
    setFiltros({
      precioMax: UI_OPCIONES.FILTRO_PRECIO_MAX,
      habitaciones: 0, status: 'all', amenidad: '', tipo: 'all'
    });
  };

  // --- RENDER ---
  if (loading) {
    return (
      <div className="catalogo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6b7280' }}>Cargando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="catalogo animate-fade-in">

      <header className="catalogo__header">
        <h1 className="catalogo__title">
          {userProfile?.nombre ? `Hola, ${userProfile.nombre}` : 'Catálogo'}
        </h1>
        <p className="catalogo__subtitle">Encuentra tu hogar ideal</p>
      </header>

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <FilterBar
        setIsFilterOpen={setIsFilterOpen}
        hayFiltrosActivos={hayFiltrosActivos}
        limpiarTodo={limpiarTodo}
        filtros={filtros}
      />

      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        filtros={filtros}
        setFiltros={setFiltros}
        limpiarTodo={limpiarTodo}
        topAmenidades={topAmenidades}
        resultadosCount={modelosFiltrados.length}
      />

      <section className="catalogo__grid">
        {modelosFiltrados.map((item) => (
          <PropertyCard
            key={item.id}
            item={item}
            showDevName={true}
          />
        ))}

        {modelosFiltrados.length === 0 && (
          <div className="catalogo__empty">
            <h3>No encontramos resultados</h3>
            <p>Intenta con otros términos o limpia los filtros.</p>
            <button onClick={limpiarTodo} className="catalogo__retry-btn">Ver Todo</button>
          </div>
        )}
      </section>
    </div>
  );
}